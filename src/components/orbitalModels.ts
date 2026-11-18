import {
  BoxGeometry, BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group,
  IcosahedronGeometry, LatheGeometry, Mesh, MeshStandardMaterial, Vector2, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Spacecraft = 'surveyor' | 'telescope';

export function createSpacecraft(kind: Spacecraft) {
  const craft = new Group();
  const alloy = new MeshStandardMaterial({ side: DoubleSide, color: 0xc5d0d5, metalness: 0.43, roughness: 0.38 });
  const foil = new MeshStandardMaterial({ color: 0xdfac57, metalness: 0.36, roughness: 0.53 });
  const cells = new MeshStandardMaterial({ color: 0x1e4196, emissive: 0x0b173c, roughness: 0.33 });
  const optic = new MeshStandardMaterial({ color: 0x10273b, metalness: 0.45, roughness: 0.18 });
  const parts = new Map<MeshStandardMaterial, BufferGeometry[]>();

  function attach(material: MeshStandardMaterial, geometry: BufferGeometry, x = 0, y = 0, z = 0) {
    geometry.translate(x, y, z);
    const group = parts.get(material);
    if (group) group.push(geometry);
    else parts.set(material, [geometry]);
  }

  // An axial telescope sunshade and a foil-wrapped survey bus read differently in silhouette.
  if (kind === 'telescope') {
    attach(alloy, new CylinderGeometry(.023, .029, .082, 20));
    attach(foil, new CylinderGeometry(.030, .030, .031, 12), 0, -.035);
    attach(alloy, new CylinderGeometry(.035, .024, .031, 20), 0, .050);
    for (const y of [-.018, .012, .040]) {
      attach(alloy, new CylinderGeometry(.028, .028, .004, 20), 0, y);
    }
    attach(foil, new BoxGeometry(.014, .036, .014), .027, -.006);
    attach(optic, new CylinderGeometry(.031, .031, .002, 20), 0, .066);
  } else {
    attach(foil, new CylinderGeometry(.036, .031, .049, 8));
    attach(alloy, new BoxGeometry(.055, .009, .050), 0, .026);
    attach(alloy, new CylinderGeometry(.004, .005, .037, 8), 0, .042);
    const dish = new LatheGeometry([new Vector2(.001, 0), new Vector2(.019, .003),
      new Vector2(.032, .011), new Vector2(.038, .017)], 28);
    dish.rotateX(.72);
    attach(alloy, dish, 0, .057, 0);
    attach(alloy, new CylinderGeometry(.0016, .002, .022, 8).rotateX(.72), 0, .068, .009);
    attach(foil, new BoxGeometry(.009, .008, .009), 0, .079, .018);
    for (const side of [-1, 1]) {
      attach(alloy, new BoxGeometry(.003, .051, .005), side * .025, -.001, .021);
    }
    attach(optic, new CylinderGeometry(.012, .014, .022, 12), .011, -.034);
  }

  for (const side of [-1, 1]) {
    const center = side * .087;
    attach(alloy, new BoxGeometry(.058, .004, .004), side * .045);
    attach(alloy, new BoxGeometry(.085, .051, .004), center);
    for (let column = -1; column <= 1; column++) {
      for (let row = -1; row <= 1; row++) {
        attach(cells, new BoxGeometry(.0255, .014, .005), center + column * .027, row * .016);
      }
    }
  }

  // Fixed fittings share a draw call per finish regardless of panel cell count.
  for (const [material, shapes] of parts) {
    craft.add(new Mesh(mergeGeometries(shapes), material));
    shapes.forEach(shape => shape.dispose());
  }
  return craft;
}

export function createRockGeometry(variant: number, detail: number) {
  const geometry = new IcosahedronGeometry(1, detail);
  const position = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const colors = new Float32Array(position.count * 3);
  const point = new Vector3();
  const normal = new Vector3();
  const baseNormals = normals.clone();
  const color = new Color();
  const basalt = new Color(0x555352);
  const dust = new Color(0xb8b4ab);
  const impacts = [
    { center: new Vector3(.38, .21, .9).normalize(), radius: .35 },
    { center: new Vector3(-.61, .62, .46).normalize(), radius: .24 },
    { center: new Vector3(.58, -.76, -.19).normalize(), radius: .43 },
    { center: new Vector3(-.83, -.34, -.46).normalize(), radius: .30 },
  ];
  for (const impact of impacts) impact.center.applyAxisAngle(new Vector3(0, 1, 0), variant * 1.7);

  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i);
    const { x, y, z } = point;
    const ridge = Math.sin(5 * x + 3 * z + variant) * Math.cos(4 * y - 2 * x);
    const grain = Math.sin(22 * y - 11 * z) * Math.cos(18 * x + 12 * z + variant);
    let depth = 0;
    for (const { center, radius } of impacts) {
      const d = point.distanceTo(center) / radius;
      if (d < 1.35) depth += radius * (.17 * Math.exp(-65 * (d - .91) ** 2) - .53 * Math.max(0, 1 - d * d));
    }
    const relief = .98 + ridge * .12 + grain * .025 + depth;
    position.setXYZ(i, x * relief * (1.13 + variant * .06), y * relief, z * relief * .88);
    color.lerpColors(basalt, dust, Math.max(0, Math.min(1, .53 + ridge * .20 + grain * .17 + depth * 2)));
    color.toArray(colors, i * 3);
  }
  geometry.computeVertexNormals();
  for (let i = 0; i < normals.count; i++) {
    normal.fromBufferAttribute(normals, i).lerp(point.fromBufferAttribute(baseNormals, i), .36).normalize();
    normals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}
