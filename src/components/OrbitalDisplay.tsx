import { useEffect, useRef } from 'react';
import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, DirectionalLight,
  DynamicDrawUsage, Group, HemisphereLight, InstancedMesh, LineBasicMaterial, Material,
  LineLoop, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera,
  Points, RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace,
  TextureLoader, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { createModelLibrary, type ModelLibrary, type Spacecraft } from './orbitalModels';
import { createLunarScene } from './lunarScene';
import nightMapUrl from '../assets/earth-night.webp';
import rockMapUrl from '../assets/rock-regolith.webp';
import cloudMapUrl from '../assets/earth-clouds.webp';
import earthMapUrl from '../assets/earth-blue-marble.webp';

const planetVertex = `
  varying vec3 viewNormal;
  varying vec2 mapCoordinates;

  void main() {
    mapCoordinates = uv;
    viewNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFragment = `
  uniform sampler2D earthMap;
  uniform sampler2D nightMap;
  uniform float time;
  uniform vec3 solarDirection;
  uniform sampler2D cloudMap;
  uniform float cloudOffset;
  uniform float cloudOpacity;
  varying vec3 viewNormal;
  varying vec2 mapCoordinates;

  void main() {
    vec3 n = normalize(viewNormal);
    vec3 terrain = texture2D(earthMap, mapCoordinates).rgb;
    // Blue Marble encodes deep bathymetry in near-black navy. Lift only blue-dominant water.
    float ocean = smoothstep(0.12, 0.52, (terrain.b - max(terrain.r, terrain.g)) / (terrain.b + 0.0005));
    vec3 water = terrain * vec3(0.90, 1.30, 1.38) + vec3(0.006, 0.075, 0.24);
    terrain = mix(terrain, water, ocean);
    vec2 weatherUV = mapCoordinates + vec2(cloudOffset, 0.0);
    float clouds = smoothstep(0.13, 0.96, texture2D(cloudMap, weatherUV).r) * cloudOpacity;
    float shadow = texture2D(cloudMap, weatherUV + vec2(-0.0019, 0.0012)).r * cloudOpacity;
    vec3 surfaceColor = mix(terrain * (1.0 - shadow * 0.32), vec3(0.94, 0.96, 1.0), clouds);

    vec3 light = normalize(solarDirection);
    float incidence = dot(n, light);
    float sunlight = smoothstep(-0.16, 0.85, incidence);
    float limb = pow(1.0 - max(n.z, 0.0), 3.4);
    vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
    float glint = pow(max(dot(n, halfVector), 0.0), 36.0) * ocean * (1.0 - clouds);
    vec3 color = surfaceColor * (vec3(0.035, 0.065, 0.12) + sunlight * vec3(1.27, 1.16, 1.08))
               + vec3(0.11, 0.16, 0.19) * glint
               + vec3(0.013, 0.22, 0.51) * limb * (0.09 + 0.84 * sunlight);
    float dusk = 1.0 - smoothstep(-0.28, 0.19, incidence);
    vec3 settlements = texture2D(nightMap, mapCoordinates).rgb;
    color += settlements * vec3(1.55, 1.12, 0.78) * dusk * (1.0 - 0.8 * clouds);
    // The magnetic oval winds around a tilted pole and drifts over the night side.
    float longitude = mapCoordinates.x * 6.283185;
    float oval = mapCoordinates.y - (0.825 + 0.044 * sin(longitude + 0.8)
      + 0.012 * sin(5.0 * longitude + time * 0.09));
    float curtain = exp(-abs(oval) * 180.0) * (0.65 + 0.35 * sin(46.0 * longitude + time * 0.26));
    color += vec3(0.012, 0.64, 0.37) * curtain * (0.12 + 0.88 * dusk);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

function circle(radius: number) {
  const positions = [];
  for (let step = 0; step < 160; step++) {
    const angle = step / 160 * Math.PI * 2;
    positions.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
  }
  return new BufferGeometry().setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
}

type OrbitSettings = {
  craftType: Spacecraft;
  radius: number;
  tilt: [number, number, number];
  start: number;
  speed: number;
  track: number;
};

function createSatelliteOrbit({ craftType, radius, tilt, start, speed, track }: OrbitSettings, models: ModelLibrary) {
  const orbit = new Group();
  orbit.rotation.set(...tilt);
  orbit.add(new LineLoop(circle(radius), new LineBasicMaterial({
    color: track, transparent: true, opacity: 0.40, depthWrite: false,
  })));

  const craft = models.spacecraft(craftType, craftType === 'telescope' ? .32 : .37);
  orbit.add(craft);

  let phase = start;
  function advance(delta: number) {
    phase += delta * speed;
    craft.position.set(Math.cos(phase) * radius, Math.sin(phase) * radius, 0);
    craft.rotation.set(-tilt[0] * .83, -tilt[1] * .70, phase + .62);
  }
  advance(0);
  return { orbit, advance };
}

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function createStarField() {
  const random = seededRandom(83);
  const coordinates: number[] = [];
  const appearance: number[] = [];
  // Low-luminance dust at two depths gives the wide field parallax.
  for (const layer of [
    { count: 1050, left: -31, width: 48, height: 24, z: -11, depth: 9 },
    { count: 285, left: -13, width: 23, height: 13, z: -3, depth: 5 },
  ]) {
    for (let i = 0; i < layer.count; i++) {
      coordinates.push(layer.left + random() * layer.width, (random() - .5) * layer.height,
        layer.z - random() * layer.depth);
      appearance.push(random() ** 1.9, random(), random() * Math.PI * 2);
    }
  }
  const geometry = new BufferGeometry()
    .setAttribute('position', new BufferAttribute(new Float32Array(coordinates), 3))
    .setAttribute('appearance', new BufferAttribute(new Float32Array(appearance), 3));
  return new Points(geometry, new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { time: { value: 0 }, pixelRatio: { value: 1 } },
    vertexShader: `
      attribute vec3 appearance;
      uniform float time;
      uniform float pixelRatio;
      varying vec3 starColor;
      varying float strength;

      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = pixelRatio * (1.2 + 2.1 * appearance.x) * clamp(14.0 / -view.z, 0.55, 1.2);
        starColor = mix(vec3(0.36, 0.66, 1.0), vec3(1.0, 0.81, 0.57), appearance.y);
        strength = (0.16 + 0.57 * appearance.x) * (0.89 + sin(time * 0.77 + appearance.z) * 0.11);
      }
    `,
    fragmentShader: `
      varying vec3 starColor;
      varying float strength;

      void main() {
        float radius = length(gl_PointCoord * 2.0 - 1.0);
        float core = 1.0 - smoothstep(0.1, 1.0, radius);
        gl_FragColor = vec4(starColor, strength * core * core);
      }
    `,
  }));
}

function createAsteroids(refresh: () => void, models: ModelLibrary) {
  const count = 36;
  const random = seededRandom(2037);
  const regolith = new TextureLoader().load(rockMapUrl, refresh);
  regolith.wrapS = regolith.wrapT = RepeatWrapping;
  regolith.repeat.set(3, 2);
  const material = new MeshStandardMaterial({ map: regolith, bumpMap: regolith, bumpScale: .0025, roughness: 0.96, color: 0xb5b2a9 });
  const belt = new Group();
  const batches: InstancedMesh[] = [];
  const rock = new Object3D();
  const rockColor = new Color();
  const slate = new Color(0x89929f);
  const sandstone = new Color(0xe7d9c6);
  const rocks = Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const radius = 1.9 + random() * 1.32;
    const size = i % 13 === 0 ? .066 + random() * .06 : .014 + random() * .035;
    const height = (random() - 0.5) * .44;
    const scale = new Vector3(size, size * (.52 + random() * .42), size * (.57 + random() * .51));
    const rotation = new Vector3(random() * 6, random() * 6, random() * 6);
    const tint = random();
    return { angle, radius, height, scale, rotation, tint,
      speed: 0.20 / Math.pow(radius, 1.5), spin: (random() - .5) * .54 };
  });

  let elapsed = 0;
  function update(time: number) {
    elapsed = time;
    rocks.forEach(({ angle, radius, height, scale, rotation, speed, spin }, i) => {
      const batch = batches[i % 3];
      if (!batch) return;
      const phase = angle + time * speed;
      rock.position.set(Math.cos(phase) * radius, Math.sin(phase) * radius, height);
      rock.scale.copy(scale);
      rock.rotation.set(rotation.x + time * spin, rotation.y + time * spin * .57, rotation.z);
      rock.updateMatrix();
      batch.setMatrixAt(Math.floor(i / 3), rock.matrix);
    });
    batches.forEach(batch => { batch.instanceMatrix.needsUpdate = true; });
  }
  models.asteroids((geometry, index) => {
    const mesh = new InstancedMesh(geometry, material, count / 3);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    batches[index] = mesh;
    for (let i = index; i < count; i += 3) {
      mesh.setColorAt(Math.floor(i / 3), rockColor.lerpColors(slate, sandstone, rocks[i].tint));
    }
    belt.add(mesh);
    update(elapsed);
  });
  return { belt, update, regolith };
}

export type OrbitalDisplayProps = { paused: boolean; onUnavailable: () => void };

export default function OrbitalDisplay({ paused, onUnavailable }: OrbitalDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const updatePause = useRef<((paused: boolean) => void) | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
    updatePause.current?.(paused);
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: WebGLRenderer;
    try {
      const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
      if (!context) {
        onUnavailable();
        return;
      }
      renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    } catch {
      onUnavailable();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.z = 8.1;
    let disposed = false;
    function refresh() { if (!disposed) sync(); }
    const models = createModelLibrary(refresh);
    const lunar = createLunarScene(refresh, models);
    scene.add(lunar.objects);
    const nightMap = new TextureLoader().load(nightMapUrl, refresh);
    nightMap.colorSpace = SRGBColorSpace;
    const solarDirection = new Vector3(-0.89, 0.37, 0.32).normalize();
    const viewSun = solarDirection.clone();
    const system = new Group();
    system.position.set(.18, .64, -.42);
    scene.add(system);
    const earthMap = new TextureLoader().load(earthMapUrl, () => {
      if (disposed) return;
      planet.visible = true;
      sync();
    });
    earthMap.colorSpace = SRGBColorSpace;
    const cloudMap = new TextureLoader().load(cloudMapUrl, () => {
      if (disposed) return;
      planet.material.uniforms.cloudOpacity.value = 0.94;
      sync();
    });
    cloudMap.wrapS = RepeatWrapping;
    const planet = new Mesh(new SphereGeometry(1.08, 64, 48), new ShaderMaterial({
      vertexShader: planetVertex, fragmentShader: planetFragment,
      uniforms: { time: { value: 0 }, solarDirection: { value: viewSun }, nightMap: { value: nightMap }, earthMap: { value: earthMap }, cloudMap: { value: cloudMap }, cloudOffset: { value: 0 }, cloudOpacity: { value: 0 } },
    }));
    planet.visible = false;
    planet.rotation.set(0.19, -1.18, 0.15);
    system.add(planet);

    const atmosphere = new Mesh(new SphereGeometry(1.126, 72, 48), new ShaderMaterial({
      vertexShader: `
        varying vec3 viewNormal;
        void main() {
          viewNormal = normalMatrix * normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 viewNormal;
        void main() {
          vec3 n = normalize(viewNormal);
          // The outer shell fades to space at its silhouette. The solid globe
          // occludes the back faces and leaves only the atmospheric limb.
          float rim = smoothstep(0.02, 0.36, abs(n.z));
          float day = smoothstep(-0.3, 0.7, dot(n, normalize(vec3(-0.89, 0.37, 0.32))));
          vec3 scatter = mix(vec3(0.12, 0.23, 0.76), vec3(0.21, 0.69, 1.0), day);
          gl_FragColor = vec4(scatter, rim * rim * (0.12 + 0.78 * day));
        }
      `,
      side: BackSide, transparent: true, blending: AdditiveBlending, depthWrite: false,
    }));
    system.add(atmosphere);
    const satellites = [
      createSatelliteOrbit({ craftType: 'surveyor', radius: 1.56, tilt: [.93, -.15, -.46], start: .71, speed: .24, track: 0x81dcf5 }, models),
      createSatelliteOrbit({ craftType: 'telescope', radius: 1.93, tilt: [.44, -.44, .68], start: -1.69, speed: -.17, track: 0xb8bbf0 }, models),
    ];
    const asteroids = createAsteroids(refresh, models);
    const beltPlane = new Group();
    beltPlane.rotation.set(1.33, -.16, .57);
    beltPlane.position.set(-.28, .08, .56);
    beltPlane.add(asteroids.belt);
    system.add(...satellites.map(({ orbit }) => orbit));
    const stars = createStarField();
    scene.add(beltPlane, stars);
    const sun = new DirectionalLight(0xb8d7ff, 1.48);
    sun.position.copy(solarDirection);
    scene.add(sun, new HemisphereLight(0xa4c9fc, 0x242634, .53));

    const pointer = new Vector2();
    let still = pausedRef.current;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;

    function render(time: number) {
      frame = 0;
      const delta = previous ? Math.min((time - previous) / 1000, 0.10) : 0;
      previous = time;
      if (!still) {
        elapsed += delta;
        lunar.update(elapsed);
        stars.material.uniforms.time.value = elapsed;
        planet.material.uniforms.time.value = elapsed;
        planet.rotation.y += delta * 0.045;
        planet.material.uniforms.cloudOffset.value = (elapsed * 0.0015) % 1;
        asteroids.update(elapsed);
        satellites.forEach(satellite => satellite.advance(delta));
        const ease = 1 - Math.exp(-delta * 4.8);
        const targetX = pointer.x * 0.98 + 0.29 * Math.sin(elapsed * 0.19);
        const targetY = pointer.y * 0.38 + 0.11 * Math.sin(elapsed * 0.13);
        camera.position.x += (targetX - camera.position.x) * ease;
        camera.position.y += (targetY - camera.position.y) * ease;
      }
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      viewSun.copy(solarDirection).transformDirection(camera.matrixWorldInverse);
      renderer.render(scene, camera);
      if (!still && visible && !document.hidden) frame = requestAnimationFrame(render);
    }

    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (visible && !document.hidden) render(performance.now());
    }

    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      // Bound the canvas resolution on large or high-density monitors.
      const pixelRatio = Math.min(1.5, window.devicePixelRatio, Math.sqrt(1_500_000 / (width * height)));
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      stars.material.uniforms.pixelRatio.value = pixelRatio;
      // Set the optical center to the right so planets stay beside the calculator.
      // The expanded frustum reveals the galaxy across the rest of the screen.
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const sceneOffset = Math.min(width * .51, rootFontSize * 49) / 2;
      camera.setViewOffset(width, height, -sceneOffset, 0, width, height);
      sync();
    });
    resize.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(canvas);

    function trackPointer(event: PointerEvent) {
      pointer.set(event.clientX / window.innerWidth * 2 - 1, 1 - event.clientY / window.innerHeight * 2);
    }
    function resetPointer() { pointer.set(0, 0); }

    window.addEventListener('pointermove', trackPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', resetPointer);
    document.addEventListener('visibilitychange', sync);
    updatePause.current = value => { still = value; sync(); };

    return () => {
      disposed = true;
      updatePause.current = null;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', trackPointer);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', sync);
      models.dispose();
      const materials = new Set<Material>();
      scene.traverse(object => {
        if (object instanceof Mesh || object instanceof Points || object instanceof LineLoop) {
          object.geometry.dispose();
          materials.add(object.material);
        }
        if (object instanceof InstancedMesh) object.dispose();
      });
      materials.forEach(material => material.dispose());
      nightMap.dispose();
      lunar.dispose();
      earthMap.dispose();
      cloudMap.dispose();
      asteroids.regolith.dispose();
      renderer.dispose();
    };
  }, [onUnavailable]);

  return <canvas ref={canvasRef} className="flight-orbit__canvas" />;
}
