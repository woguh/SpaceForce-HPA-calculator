import { Box3, BufferGeometry, Group, Material, Mesh, Object3D, Texture, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import surveyorUrl from '../assets/orbital/surveyor.glb?url';
import telescopeUrl from '../assets/orbital/telescope.glb?url';
import probeUrl from '../assets/orbital/probe.glb?url';
import asteroidsUrl from '../assets/orbital/asteroids.glb?url';

const spacecraftUrls = { surveyor: surveyorUrl, telescope: telescopeUrl, probe: probeUrl };
export type Spacecraft = keyof typeof spacecraftUrls;

function release(root: Object3D) {
  root.removeFromParent();
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    geometries.add(node.geometry);
    for (const material of [node.material].flat()) materials.add(material);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    material.dispose();
  }
  for (const texture of textures) {
    texture.dispose();
    if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close();
  }
  geometries.forEach(geometry => geometry.dispose());
}

export function createModelLibrary(refresh: () => void) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const roots: Group[] = [];
  let disposed = false;

  function load(url: string, mount: (root: Group) => void) {
    loader.load(url, ({ scene }) => {
      if (disposed) { release(scene); return; }
      roots.push(scene);
      mount(scene);
      refresh();
    });
  }

  function spacecraft(kind: Spacecraft, span: number) {
    const pivot = new Group();
    load(spacecraftUrls[kind], root => {
      const bounds = new Box3().setFromObject(root, true);
      const size = bounds.getSize(new Vector3());
      const scale = span / Math.max(size.x, size.y, size.z);
      const mount = new Group();
      mount.position.copy(bounds.getCenter(new Vector3())).multiplyScalar(-scale);
      mount.scale.setScalar(scale);
      mount.add(root);
      pivot.add(mount);
    });
    return pivot;
  }

  function asteroids(mount: (geometry: BufferGeometry, index: number) => void) {
    load(asteroidsUrl, root => {
      root.updateMatrixWorld(true);
      for (let i = 0; i < 3; i++) {
        const mesh = root.getObjectByName(`rock${i}`);
        if (mesh instanceof Mesh) mount(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), i);
      }
    });
  }

  return { spacecraft, asteroids, dispose() {
    disposed = true;
    roots.forEach(release);
  } };
}

export type ModelLibrary = ReturnType<typeof createModelLibrary>;
