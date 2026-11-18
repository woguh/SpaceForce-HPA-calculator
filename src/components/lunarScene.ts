import {
  AdditiveBlending, BackSide, Color, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PlaneGeometry, RepeatWrapping, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader, Vector3,
} from 'three';
import moonUrl from '../assets/lunar-surface.webp';
import galaxyUrl from '../assets/galactic-sky.webp';
import type { ModelLibrary } from './orbitalModels';

// Terrain variations break up the silhouette under the raking light. The albedo
// supplies the visible maria, ejecta streaks and small crater detail.
function lunarTerrain() {
  const geometry = new SphereGeometry(.74, 128, 80);
  const positions = geometry.getAttribute('position');
  const direction = new Vector3();
  for (let i = 0; i < positions.count; i++) {
    direction.fromBufferAttribute(positions, i).normalize();
    const { x, y, z } = direction;
    const upland = Math.sin(x * 24 + z * 13) * Math.cos(y * 19 - z * 17);
    const ridges = Math.sin(x * 73 - y * 52) * Math.cos(z * 66 + x * 44);
    direction.multiplyScalar(.74 + .0017 * upland + .0008 * ridges);
    positions.setXYZ(i, direction.x, direction.y, direction.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Render the solar disc in world space. The lunar mesh writes depth, so the
// horizon genuinely occults the disc and its corona as the observer moves.
function createSunrise() {
  const sun = new Mesh(new PlaneGeometry(4.6, 4.6), new ShaderMaterial({
    vertexShader: `
      varying vec2 coord;
      void main() {
        coord = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 coord;
      void main() {
        float r = length(coord);
        float disc = 1.0 - smoothstep(0.049, 0.055, r);
        float corona = exp(-11.0 * r) * 0.65 + exp(-4.5 * r) * 0.13;
        float angle = atan(coord.y, coord.x);
        float rays = pow(abs(cos(3.0 * angle + 0.24)), 44.0) * exp(-10.0 * r);
        vec3 energy = vec3(1.0, 0.96, 0.82) * disc
                    + vec3(1.0, 0.58, 0.24) * (corona + 0.27 * rays);
        float fade = 1.0 - smoothstep(0.77, 1.0, r);
        gl_FragColor = vec4(energy * fade, 1.0);
        #include <colorspace_fragment>
      }
    `,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  }));
  sun.position.set(.45, -3.61, -15);
  return sun;
}

export function createLunarScene(refresh: () => void, models: ModelLibrary) {
  const loader = new TextureLoader();
  const terrain = loader.load(moonUrl, refresh);
  terrain.colorSpace = SRGBColorSpace;
  terrain.anisotropy = 4;
  const skyMap = loader.load(galaxyUrl, refresh);
  skyMap.colorSpace = SRGBColorSpace;
  skyMap.wrapS = RepeatWrapping;
  skyMap.repeat.set(2, 2);
  skyMap.offset.set(-.5, -.5);
  const sky = new Mesh(new SphereGeometry(28, 48, 24),
    new MeshBasicMaterial({ map: skyMap, color: 0x9dadca, side: BackSide, depthWrite: false }));
  sky.rotation.set(-.08, Math.PI / 2, -.51, 'ZXY');
  sky.renderOrder = -2;
  const moon = new Mesh(lunarTerrain(), new MeshStandardMaterial({
    map: terrain, bumpMap: terrain, bumpScale: .004, roughness: 1, color: 0xdedce1,
  }));
  // Even the front edge of the Moon lies behind the entire asteroid belt.
  moon.position.set(1.0, -2.22, -5.25);
  moon.rotation.set(.57, 1.49, -.34);
  const rimLight = new DirectionalLight(new Color(0xffc790), 3.5);
  rimLight.position.set(-3, 1.4, -3.8);
  const probe = models.spacecraft('probe', .46);
  const objects = new Group();
  objects.add(sky, moon, rimLight, probe, createSunrise());

  function update(time: number) {
    moon.rotation.y = 1.49 + time * .007;
    const phase = time * .078 - .52;
    probe.position.set(1.62 * Math.sin(phase), -.93 + .31 * Math.sin(phase + .8), 1.70 + 1.05 * Math.cos(phase));
    probe.rotation.set(.42 + .13 * Math.sin(phase), .22 * Math.cos(phase), -.35 + .22 * Math.sin(phase));
  }
  update(0);
  return { objects, update, dispose() { terrain.dispose(); skyMap.dispose(); } };
}
