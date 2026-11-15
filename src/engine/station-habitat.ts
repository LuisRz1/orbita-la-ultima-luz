import { BoxGeometry, Group, InstancedMesh, Matrix4, MeshBasicMaterial, type Material } from 'three';
import type { PressurizedBay } from '../core/contract/level-v2.ts';
import { toon } from './style.ts';

type Panel = { x: number; y: number; z: number; width: number; height: number; depth: number };

/** A pressurized hall scaled to the original docking deck. The window band keeps the planet in sight. */
export function buildStationHabitat({ min, max, ceiling }: PressurizedBay) {
  const hall = new Group();
  hall.name = 'pressurized station habitat';
  const skin = toon('#6c8494'), ribs = toon('#364d61'), panels = toon('#8c9eac');
  const lights = new MeshBasicMaterial({ color: '#a6ece1', toneMapped: false });
  const panes = new MeshBasicMaterial({ color: '#579acc', transparent: true, opacity: .13, depthWrite: false });
  const sections = new Map<Material, Panel[]>();
  const place = (material: Material, x: number, y: number, z: number, width: number, height: number, depth: number) => {
    const section = sections.get(material);
    const panel = { x, y, z, width, height, depth };
    if (section) section.push(panel);
    else sections.set(material, [panel]);
  };

  const width = max.x - min.x, length = max.z - min.z;
  const midX = (min.x + max.x) / 2, midZ = (min.z + max.z) / 2;
  place(skin, midX, ceiling + .4, midZ, width + 1.1, .8, length + 1.1);
  place(skin, midX, ceiling / 2, max.z + .55, width + 1.1, ceiling, 1.1);
  for (const wall of [min.x - .55, max.x + .55]) {
    place(skin, wall, ceiling / 2, midZ, 1.1, ceiling, length + 1.1);
  }

  const sill = 2.9, lintel = 10.35, back = min.z - .55;
  place(skin, midX, sill / 2, back, width + 1.1, sill, 1.1);
  place(skin, midX, (lintel + ceiling) / 2, back, width + 1.1, ceiling - lintel, 1.1);
  place(panes, midX, (sill + lintel) / 2, back - .3, width, lintel - sill, .12);
  const windows = 9;
  for (let index = 0; index <= windows; index++) {
    const x = min.x + (width / windows) * index;
    place(ribs, x, ceiling / 2, min.z + .21, .6, ceiling, .48);
  }
  place(ribs, midX, sill, min.z + .2, width, .28, .45);
  place(ribs, midX, lintel, min.z + .2, width, .28, .45);

  for (let z = min.z + 8; z <= max.z - 4; z += 14) {
    place(ribs, midX, ceiling - .53, z, width, 1.06, .88);
    for (const wall of [min.x, max.x]) {
      const inside = wall === min.x ? 1 : -1;
      place(ribs, wall + inside * .18, ceiling / 2, z, .36, ceiling, .92);
      place(panels, wall + inside * .08, 2.4, z - 5.7, .16, 3.2, 8.3);
      place(lights, wall + inside * .19, 5.1, z - 5.7, .09, .15, 5);
    }
    for (const x of [midX - width / 3, midX, midX + width / 3]) {
      place(panels, x, ceiling - 1.05, z, 10, .26, 1.15);
      place(lights, x, ceiling - 1.22, z, 8.8, .14, .58);
    }
  }

  const unitBox = new BoxGeometry(1, 1, 1);
  const matrix = new Matrix4();
  for (const [material, section] of sections) {
    const mesh = new InstancedMesh(unitBox, material, section.length);
    section.forEach(({ x, y, z, width, height, depth }, index) => {
      matrix.makeScale(width, height, depth).setPosition(x, y, z);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    hall.add(mesh);
  }
  return hall;
}
