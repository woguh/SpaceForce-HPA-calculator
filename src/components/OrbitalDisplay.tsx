import { useEffect, useRef } from 'react';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DirectionalLight,
  DynamicDrawUsage, Group, HemisphereLight, InstancedMesh, LineBasicMaterial, Material,
  LineLoop, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera,
  Points, PointsMaterial, RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace,
  TextureLoader, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { createRockGeometry, createSpacecraft, type Spacecraft } from './orbitalModels';
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

    vec3 light = normalize(vec3(-0.44, 0.38, 0.82));
    float sunlight = smoothstep(-0.25, 0.91, dot(n, light));
    float limb = pow(1.0 - max(n.z, 0.0), 3.4);
    vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
    float glint = pow(max(dot(n, halfVector), 0.0), 36.0) * ocean * (1.0 - clouds);
    vec3 color = surfaceColor * (0.28 + sunlight * 1.02)
               + vec3(0.11, 0.16, 0.19) * glint
               + vec3(0.013, 0.22, 0.51) * limb * (0.09 + 0.84 * sunlight);
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

function createSatelliteOrbit({ craftType, radius, tilt, start, speed, track }: OrbitSettings) {
  const orbit = new Group();
  orbit.rotation.set(...tilt);
  orbit.add(new LineLoop(circle(radius), new LineBasicMaterial({
    color: track, transparent: true, opacity: 0.64, depthWrite: false,
  })));

  const craft = createSpacecraft(craftType);
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

function createStars(count: number, size: number, seed: number) {
  const coordinates = new Float32Array(count * 3);
  const random = seededRandom(seed);
  for (let i = 0; i < coordinates.length; i += 3) {
    coordinates[i] = (random() - 0.5) * 18;
    coordinates[i + 1] = (random() - 0.5) * 10;
    coordinates[i + 2] = -1.4 - random() * 9;
  }
  return new Points(
    new BufferGeometry().setAttribute('position', new BufferAttribute(coordinates, 3)),
    new PointsMaterial({ color: 0xb7e8ff, size, opacity: 0.68, transparent: true, depthWrite: false }),
  );
}

function createAsteroids(refresh: () => void) {
  const count = 72;
  const random = seededRandom(2037);
  const regolith = new TextureLoader().load(rockMapUrl, refresh);
  regolith.wrapS = regolith.wrapT = RepeatWrapping;
  regolith.repeat.set(3, 2);
  const material = new MeshStandardMaterial({ map: regolith, bumpMap: regolith, bumpScale: .009, roughness: 0.96, vertexColors: true });
  const belt = new Group();
  const batches = Array.from({ length: 3 }, (_, variant) => {
    const mesh = new InstancedMesh(createRockGeometry(variant, 4), material, count / 3);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    belt.add(mesh);
    return mesh;
  });
  const rock = new Object3D();
  const rockColor = new Color();
  const slate = new Color(0x89929f);
  const sandstone = new Color(0xe7d9c6);
  const rocks = Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const radius = 1.9 + random() * 1.32;
    const size = i % 13 === 0 ? .12 + random() * .09 : .024 + random() * .064;
    const height = (random() - 0.5) * .44;
    const scale = new Vector3(size, size * (.52 + random() * .42), size * (.57 + random() * .51));
    const rotation = new Vector3(random() * 6, random() * 6, random() * 6);
    batches[i % 3].setColorAt(Math.floor(i / 3), rockColor.lerpColors(slate, sandstone, random()));
    return { angle, radius, height, scale, rotation,
      speed: 0.20 / Math.pow(radius, 1.5), spin: (random() - .5) * .54 };
  });

  function update(time: number) {
    rocks.forEach(({ angle, radius, height, scale, rotation, speed, spin }, i) => {
      const phase = angle + time * speed;
      rock.position.set(Math.cos(phase) * radius, Math.sin(phase) * radius, height);
      rock.scale.copy(scale);
      rock.rotation.set(rotation.x + time * spin, rotation.y + time * spin * .57, rotation.z);
      rock.updateMatrix();
      batches[i % 3].setMatrixAt(Math.floor(i / 3), rock.matrix);
    });
    for (const batch of batches) batch.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { belt, update, regolith };
}

export default function OrbitalDisplay({ paused }: { paused: boolean }) {
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
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!context) return;

    const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.z = 8.1;
    let disposed = false;
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
      uniforms: { earthMap: { value: earthMap }, cloudMap: { value: cloudMap }, cloudOffset: { value: 0 }, cloudOpacity: { value: 0 } },
    }));
    planet.visible = false;
    planet.rotation.set(0.13, -0.92, 0.13);
    scene.add(planet);

    const atmosphere = new Mesh(new SphereGeometry(1.115, 48, 32), new ShaderMaterial({
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
          float rim = pow(1.0 - max(n.z, 0.0), 5.0);
          gl_FragColor = vec4(0.19, 0.66, 0.89, rim * 0.35);
        }
      `,
      transparent: true, blending: AdditiveBlending, depthWrite: false,
    }));
    scene.add(atmosphere);
    const satellites = [
      createSatelliteOrbit({ craftType: 'surveyor', radius: 1.56, tilt: [.93, -.15, -.46], start: .71, speed: .24, track: 0x81dcf5 }),
      createSatelliteOrbit({ craftType: 'telescope', radius: 1.93, tilt: [.44, -.44, .68], start: -1.69, speed: -.17, track: 0xb8bbf0 }),
    ];
    const asteroids = createAsteroids(() => { if (!disposed) sync(); });
    const beltPlane = new Group();
    beltPlane.rotation.set(1.05, -0.15, -0.43);
    beltPlane.add(asteroids.belt);
    scene.add(beltPlane, createStars(390, 0.017, 19), createStars(85, 0.036, 83),
      ...satellites.map(({ orbit }) => orbit));
    const sun = new DirectionalLight(0xd6f4ff, 2.6);
    sun.position.set(-3, 2, 4);
    scene.add(sun, new HemisphereLight(0xb8d8ed, 0x24273c, 1.15));

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
        planet.rotation.y += delta * 0.064;
        planet.material.uniforms.cloudOffset.value = (elapsed * 0.0015) % 1;
        asteroids.update(elapsed);
        satellites.forEach(satellite => satellite.advance(delta));
        const ease = 1 - Math.exp(-delta * 4.8);
        const targetX = pointer.x * 0.94 + 0.22 * Math.sin(elapsed * 0.19);
        const targetY = pointer.y * 0.53 + 0.11 * Math.sin(elapsed * 0.13);
        camera.position.x += (targetX - camera.position.x) * ease;
        camera.position.y += (targetY - camera.position.y) * ease;
      }
      camera.lookAt(0, 0, 0);
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
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio, Math.sqrt(1_500_000 / (width * height))));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
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
      const materials = new Set<Material>();
      scene.traverse(object => {
        if (object instanceof Mesh || object instanceof Points || object instanceof LineLoop) {
          object.geometry.dispose();
          materials.add(object.material);
        }
        if (object instanceof InstancedMesh) object.dispose();
      });
      materials.forEach(material => material.dispose());
      earthMap.dispose();
      cloudMap.dispose();
      asteroids.regolith.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="flight-orbit__canvas" />;
}
