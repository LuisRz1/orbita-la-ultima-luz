// Lander interior: a small walkable room where the suit is assembled at four physical stations, Zelda-house style.
// Local coordinates in metres: x across, z along (airlock at -z), floor at y = 0. Built from primitives with the
// shared toon look; one warm practical light plus the hemisphere so it stays cheap.
import {
  BackSide, BoxGeometry, CircleGeometry, Color, CylinderGeometry, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, PlaneGeometry, PointLight, RingGeometry, Scene, SphereGeometry, TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Ground, Solid } from '../core/movement.ts';
import { part } from './models.ts';
import { biome, toon } from './style.ts';

export type StationId = 'battery' | 'thruster' | 'antenna' | 'instruments' | 'locker' | 'airlock';
export type Station = { id: StationId; x: number; z: number; radius: number; ring: Mesh };
export type Interior = {
  scene: Scene; ground: Ground; spawn: { x: number; z: number }; stations: Station[];
  /** Station props that show the chosen option (index per station). */
  highlight(next: StationId | null, done: ReadonlySet<StationId>): void;
  dispose(): void;
};

const W = 6, D = 5, H = 2.6;

export function buildInterior(): Interior {
  const scene = new Scene();
  scene.background = new Color('#120e2a');
  const hull = toon('#e9e2f2'), panel = toon('#d6cde6'), frame = toon('#3b3358'), floorMat = toon('#8f84b2');
  const warm = new MeshBasicMaterial({ color: '#ffe3a3' });

  // Room shell: floor, walls and ceiling seen from inside.
  const floor = new Mesh(new PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  // Floor plates: a few seams instead of a wireframe grid (which shimmered).
  const seams = new Group();
  for (const x of [-1.5, 0, 1.5]) { const l = new Mesh(new BoxGeometry(0.03, 0.006, D), frame); l.position.set(x, 0.004, 0); seams.add(l); }
  for (const z of [-1.25, 1.25]) { const l = new Mesh(new BoxGeometry(W, 0.006, 0.03), frame); l.position.set(0, 0.004, z); seams.add(l); }
  // Walls face inward (BackSide); a dedicated material so the shared toon cache is not mutated.
  const shell = new Mesh(new BoxGeometry(W, H, D), new MeshLambertMaterial({ color: '#d9d0e8', side: BackSide }));
  shell.position.y = H / 2;
  scene.add(floor, seams, shell);
  // Wall ribs and ceiling light strips.
  for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) for (const z of [-1.6, 0, 1.6]) {
    const rib = new Mesh(new BoxGeometry(0.1, H, 0.14), frame); rib.position.set(x, H / 2, z); scene.add(rib);
  }
  for (const x of [-1.2, 1.2]) for (const z of [-1, 1]) {
    const strip = new Mesh(new BoxGeometry(0.9, 0.04, 0.12), warm); strip.position.set(x, H - 0.03, z); scene.add(strip);
  }
  // Portholes on both side walls, glowing with the lunar day outside.
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) {
    const glass = new Mesh(new CircleGeometry(0.32, 20), new MeshBasicMaterial({ color: '#cbbfe6' }));
    glass.position.set(x, 1.55, -1.6); glass.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    const rim = new Mesh(new TorusGeometry(0.34, 0.05, 6, 20), frame);
    rim.position.copy(glass.position); rim.rotation.copy(glass.rotation);
    scene.add(glass, rim);
  }

  const solids: Solid[] = [];
  const block = (x: number, z: number, hx: number, hz: number, top: number) => solids.push({ kind: 'box', x, z, hx, hz, top });
  const add = (o: Mesh | Group, x: number, y: number, z: number) => { o.position.set(x, y, z); scene.add(o); return o; };

  // 1. Battery rack: three cells of increasing size on a shelf.
  add(part(new RoundedBoxGeometry(0.5, 1.1, 0.9, 2, 0.04), frame, 0.02), -2.65, 0.55, 1.1);
  [0.25, 0.35, 0.5].forEach((h, i) => add(part(new CylinderGeometry(0.09, 0.09, h, 12), toon(i === 2 ? biome.amber : biome.cyan), 0.015), -2.55, 1.1 + h / 2, 0.8 + i * 0.3));
  block(-2.65, 1.1, 0.3, 0.5, 1.6);
  // 2. Thruster hangers: three packs with 0, 2 and 4 nozzles.
  add(part(new BoxGeometry(0.12, 1.8, 1.4), frame, 0.02), -2.9, 0.9, -1.1);
  [0, 2, 4].forEach((n, i) => {
    const pack = part(new RoundedBoxGeometry(0.3, 0.4, 0.22, 2, 0.05), hull, 0.015);
    for (let k = 0; k < n; k++) { const nz = new Mesh(new CylinderGeometry(0.03, 0.045, 0.08, 8), frame); nz.position.set(-0.09 + (k % 2) * 0.18, -0.24, -0.05 + Math.floor(k / 2) * 0.1); pack.add(nz); }
    add(pack, -2.7, 1.25, -1.55 + i * 0.45);
  });
  block(-2.75, -1.1, 0.25, 0.7, 1.9);
  // 3. Antenna hooks: three rods of different length.
  add(part(new BoxGeometry(0.12, 0.1, 1.2), frame, 0.015), 2.9, 1.9, 1.1);
  [0.5, 0.8, 1.1].forEach((len, i) => add(part(new CylinderGeometry(0.015, 0.02, len, 6), panel, 0.01), 2.85, 1.85 - len / 2, 0.7 + i * 0.4));
  block(2.85, 1.1, 0.15, 0.6, 1.9);
  // 4. Instrument bench: camera, drill and repair kit on a table.
  add(part(new BoxGeometry(0.6, 0.06, 1.4), panel, 0.02), 2.65, 0.9, -1.1);
  add(part(new BoxGeometry(0.5, 0.86, 0.08), frame, 0.015), 2.65, 0.43, -1.75);
  add(part(new BoxGeometry(0.5, 0.86, 0.08), frame, 0.015), 2.65, 0.43, -0.45);
  add(part(new RoundedBoxGeometry(0.16, 0.12, 0.12, 2, 0.02), frame, 0.012), 2.6, 0.99, -1.55);
  add(part(new CylinderGeometry(0.03, 0.05, 0.35, 8), toon('#a99cc8'), 0.012), 2.6, 1.1, -1.1);
  add(part(new RoundedBoxGeometry(0.18, 0.12, 0.14, 2, 0.03), toon(biome.amber), 0.012), 2.6, 0.99, -0.65);
  block(2.65, -1.1, 0.35, 0.75, 0.95);
  // Holographic table in the middle: the crater with pins for the objectives.
  add(part(new CylinderGeometry(0.55, 0.62, 0.8, 20), frame, 0.02), 0, 0.4, 0.15);
  const holo = add(new Mesh(new CircleGeometry(0.5, 32), new MeshBasicMaterial({ color: biome.cyan, transparent: true, opacity: 0.35 })), 0, 0.82, 0.15);
  holo.rotation.x = -Math.PI / 2;
  for (const [x, z] of [[0.1, -0.3], [0.32, 0], [-0.25, 0.05], [0, 0.32], [0.05, 0.38]]) add(new Mesh(new SphereGeometry(0.025, 8, 6), warm), x, 0.86, 0.15 + z);
  block(0, 0.15, 0.62, 0.62, 0.8);
  // Locker with the helmet; LUMA's bed by the wall.
  add(part(new RoundedBoxGeometry(0.9, 2.1, 0.5, 2, 0.05), panel, 0.02), 0, 1.05, 2.25);
  add(part(new SphereGeometry(0.2, 16, 12), hull, 0.015), 0, 1.5, 1.98);
  block(0, 2.25, 0.45, 0.25, 2.1);
  add(part(new RoundedBoxGeometry(0.7, 0.18, 0.5, 2, 0.06), toon(biome.pink), 0.015), -1.7, 0.09, 2.1);
  block(-1.7, 2.1, 0.35, 0.25, 0.18);
  // Airlock door at -z, with a status light that turns green when the suit is ready.
  add(part(new RoundedBoxGeometry(1.1, 2.0, 0.12, 2, 0.08), frame, 0.02), 0, 1.0, -2.45);
  const lamp = add(new Mesh(new SphereGeometry(0.06, 10, 8), new MeshBasicMaterial({ color: '#ff6b5b' })), 0, 2.15, -2.4) as Mesh;

  // Walls as solids so the player cannot leave the room.
  block(0, D / 2 + 0.2, W / 2, 0.2, 9); block(0, -D / 2 - 0.2, W / 2, 0.2, 9);
  block(W / 2 + 0.2, 0, 0.2, D / 2, 9); block(-W / 2 - 0.2, 0, 0.2, D / 2, 9);

  const ringAt = (x: number, z: number, radius: number) => {
    const ring = new Mesh(new RingGeometry(radius - 0.06, radius, 32), new MeshBasicMaterial({ color: biome.cyan, transparent: true, opacity: 0.25 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z); scene.add(ring);
    return ring;
  };
  const stations: Station[] = ([
    ['battery', -2.0, 1.1], ['thruster', -2.0, -1.1], ['antenna', 2.2, 1.1], ['instruments', 1.95, -1.1],
    ['locker', 0, 1.55], ['airlock', 0, -1.85],
  ] as const).map(([id, x, z]) => ({ id, x, z, radius: 0.6, ring: ringAt(x, z, 0.6) }));

  const light = new PointLight('#ffe3a3', 6, 9, 1.6);
  light.position.set(0, 2.3, 0);
  const key = new DirectionalLight('#fff4e0', 1.2);
  key.position.set(2, 4, 3);
  scene.add(light, key, new HemisphereLight('#d9d0f0', '#3b3358', 1.4));

  const ground: Ground = { height: () => 0, slope: () => 0, solids };
  return {
    scene, ground, spawn: { x: -0.9, z: -0.6 }, stations,
    highlight(next, done) {
      for (const s of stations) {
        const m = s.ring.material as MeshBasicMaterial;
        m.color.set(done.has(s.id) ? biome.amber : biome.cyan);
        m.opacity = s.id === next ? 0.9 : done.has(s.id) ? 0.45 : 0.18;
      }
      (lamp.material as MeshBasicMaterial).color.set(done.has('locker') ? '#7dffa8' : '#ff6b5b');
    },
    dispose() {
      scene.traverse(o => { const m = o as Mesh; m.geometry?.dispose(); });
    },
  };
}
