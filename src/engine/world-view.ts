// Builds the three.js objects for a level. Grey-box look: terrain lit once at load time (sun, cast
// shadows and slope baked into vertex colours), so no real-time lights or shadow maps touch the ground.
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CapsuleGeometry, CircleGeometry, Color,
  CylinderGeometry, DirectionalLight, DodecahedronGeometry, Float32BufferAttribute, Group, HemisphereLight, Mesh,
  MeshBasicMaterial, MeshLambertMaterial, OctahedronGeometry, PlaneGeometry, Points, PointsMaterial, RingGeometry,
  Scene, SphereGeometry, Fog, type Material, type Object3D,
} from 'three';
import type { LevelV2, PropKind } from '../core/contract/level-v2.ts';
import { heightAt, normalAt, type Heightfield } from '../core/heightfield.ts';

export const palette = {
  sky: '#06080c', ground: '#9a9c9f', shadow: '#2a3240', prop: '#b9bcc0', dark: '#5b6168',
  accent: '#7fe3e0', warn: '#ffaf68', suit: '#e9e6df',
};

export type PointView = { id: string; beam: Mesh; ring: Mesh };
export type WorldView = {
  scene: Scene; player: Group; luma: Group; shadow: Mesh; beacon: Mesh;
  points: Map<string, PointView>; echoes: Map<string, Mesh>;
  sun: [number, number, number];
  dispose(): void;
};

export function sunDirection(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const a = azimuthDeg * Math.PI / 180, e = elevationDeg * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

/** Fraction of sunlight reaching (x, z): 0 when the terrain between it and the sun is higher than the ray. */
function sunVisibility(hf: Heightfield, x: number, z: number, sun: [number, number, number]) {
  const flat = Math.hypot(sun[0], sun[2]), rise = sun[1] / flat;
  const dx = sun[0] / flat, dz = sun[2] / flat, h0 = heightAt(hf, x, z) + 0.15;
  let lit = 1;
  for (let d = 1.5; d < 110; d += d < 20 ? 1 : 2.5) {
    // Clearance between the sun ray and the terrain under it; a small clearance gives a soft edge.
    const clearance = h0 + d * rise - heightAt(hf, x + dx * d, z + dz * d);
    if (clearance <= 0) return 0;
    lit = Math.min(lit, clearance / (0.3 + d * 0.08));
  }
  return Math.min(1, lit);
}

function terrainMesh(hf: Heightfield, sun: [number, number, number]) {
  const geometry = new PlaneGeometry(hf.size, hf.size, hf.res - 1, hf.res - 1);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const lit = new Color(palette.ground), dark = new Color(palette.shadow), c = new Color();
  const h = (x: number, z: number) => heightAt(hf, x, z);
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    pos.setY(k, hf.data[k]);
    const n = normalAt(hf, x, z);
    // Light relative to flat ground, so low suns still read: flat ≈ 0.75, sun-facing slopes brighter.
    const facing = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]) / Math.max(sun[1], 0.2);
    const direct = Math.min(1, facing / 1.35) * sunVisibility(hf, x, z, sun);
    // Three bands: the painted-light look, with a little of the smooth value kept for the grey-box.
    const band = direct < 0.18 ? 0 : direct < 0.62 ? 0.5 : 1;
    const light = band * 0.75 + direct * 0.25;
    // Cavity term from curvature: hollows and trench floors darken, crests stay bright.
    const lap = (h(x + 2, z) + h(x - 2, z) + h(x, z + 2) + h(x, z - 2) - 4 * hf.data[k]) / 4;
    const cavity = Math.min(1.08, Math.max(0.55, 1 - lap * 0.8));
    c.copy(dark).lerp(lit, 0.12 + light * 0.88).multiplyScalar(cavity);
    colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
}

function starfield(count: number) {
  const positions = new Float32Array(count * 3);
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1, phi = rand() * Math.PI * 2, r = 420, s = Math.sqrt(1 - u * u);
    positions.set([Math.cos(phi) * s * r, Math.abs(u) * r * 0.9 + 10, Math.sin(phi) * s * r], i * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(geometry, new PointsMaterial({ color: '#c9d3df', size: 1.4, sizeAttenuation: false, fog: false }));
}

function propMesh(kind: PropKind, solid: LevelV2['props'][number]['solid'], base: number, mats: Record<string, Material>): Object3D {
  const height = solid.top - base;
  const group = new Group();
  group.position.set(solid.x, base, solid.z);
  if (solid.kind === 'box') {
    const body = new Mesh(new BoxGeometry(solid.hx * 2, height, solid.hz * 2), mats.prop);
    body.position.y = height / 2;
    group.add(body);
    if (kind === 'lander') for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const leg = new Mesh(new CylinderGeometry(0.1, 0.14, 1.6), mats.dark);
      leg.position.set(sx * (solid.hx + 0.25), 0.7, sz * (solid.hz + 0.25));
      leg.rotation.set(sz * 0.3, 0, -sx * 0.3);
      const foot = new Mesh(new CylinderGeometry(0.35, 0.35, 0.08, 10), mats.dark);
      foot.position.set(sx * (solid.hx + 0.48), 0.04, sz * (solid.hz + 0.48));
      group.add(leg, foot);
    }
    if (kind === 'console') { const screen = new Mesh(new BoxGeometry(0.06, 0.5, 1.1), mats.accent); screen.position.set(-solid.hx - 0.03, height * 0.75, 0); group.add(screen); }
  } else if (kind === 'boulder' || kind === 'rock') {
    const rock = new Mesh(new DodecahedronGeometry(1, 0), mats.prop);
    rock.scale.set(solid.r * 1.05, height * 0.62, solid.r * 1.05);
    rock.position.y = height * 0.4;
    rock.rotation.y = solid.x * 0.37;
    group.add(rock);
  } else {
    const column = new Mesh(new CylinderGeometry(solid.r * 0.9, solid.r, height, kind === 'mast' ? 8 : 7), kind === 'mast' ? mats.dark : mats.prop);
    column.position.y = height / 2;
    group.add(column);
  }
  return group;
}

export function buildWorldView(level: LevelV2, hf: Heightfield): WorldView {
  const scene = new Scene();
  scene.background = new Color(palette.sky);
  scene.fog = new Fog(palette.sky, 110, 300);
  const sun = sunDirection(level.sun.azimuth, level.sun.elevation);

  const light = new DirectionalLight('#fff4e0', 2.2);
  light.position.set(sun[0] * 50, sun[1] * 50, sun[2] * 50);
  scene.add(light, new HemisphereLight('#8fa3c0', '#1a1d24', 0.9));
  scene.add(terrainMesh(hf, sun), starfield(1800));

  const earth = new Mesh(new SphereGeometry(16, 24, 16), new MeshBasicMaterial({ color: '#4d7fb3', fog: false }));
  earth.position.set(-140, 150, -330);
  scene.add(earth);

  const mats: Record<string, Material> = {
    prop: new MeshLambertMaterial({ color: palette.prop }),
    dark: new MeshLambertMaterial({ color: palette.dark }),
    accent: new MeshBasicMaterial({ color: palette.accent }),
  };
  for (const p of level.props) scene.add(propMesh(p.kind, p.solid, heightAt(hf, p.solid.x, p.solid.z), mats));

  const mast = level.props.find(p => p.kind === 'mast')?.solid;
  const beacon = new Mesh(new SphereGeometry(0.45, 12, 8), new MeshBasicMaterial({ color: palette.warn, fog: false }));
  if (mast) beacon.position.set(mast.x, mast.top + 0.4, mast.z);
  scene.add(beacon);

  const points = new Map<string, PointView>();
  const beamGeo = new CylinderGeometry(0.18, 0.18, 60, 6, 1, true);
  beamGeo.translate(0, 30, 0);
  for (const p of level.points) {
    const y = heightAt(hf, p.position.x, p.position.z);
    const beam = new Mesh(beamGeo, new MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false, fog: false }));
    beam.position.set(p.position.x, y, p.position.z);
    const ring = new Mesh(new RingGeometry(p.radius - 0.12, p.radius, 40), new MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.55, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.position.x, y + 0.06, p.position.z);
    scene.add(beam, ring);
    points.set(p.id, { id: p.id, beam, ring });
  }

  const echoes = new Map<string, Mesh>();
  const echoGeo = new OctahedronGeometry(0.32);
  const echoMat = new MeshBasicMaterial({ color: palette.warn });
  for (const c of level.collectibles) {
    const m = new Mesh(echoGeo, echoMat);
    m.position.set(c.position.x, c.y ?? heightAt(hf, c.position.x, c.position.z) + 0.9, c.position.z);
    scene.add(m);
    echoes.set(c.id, m);
  }

  const player = new Group();
  const suit = new MeshLambertMaterial({ color: palette.suit });
  const body = new Mesh(new CapsuleGeometry(0.34, 0.85, 4, 10), suit);
  body.position.y = 0.78;
  const pack = new Mesh(new BoxGeometry(0.5, 0.6, 0.26), new MeshLambertMaterial({ color: palette.dark }));
  pack.position.set(0, 0.95, 0.3);
  const visor = new Mesh(new BoxGeometry(0.42, 0.18, 0.1), new MeshBasicMaterial({ color: palette.accent }));
  visor.position.set(0, 1.3, -0.3);
  player.add(body, pack, visor);

  const luma = new Group();
  const cube = new Mesh(new BoxGeometry(0.34, 0.34, 0.34), new MeshLambertMaterial({ color: palette.warn, emissive: '#5a3410' }));
  const eye = new Mesh(new BoxGeometry(0.2, 0.06, 0.02), new MeshBasicMaterial({ color: '#10151e' }));
  eye.position.set(0, 0.04, -0.18);
  luma.add(cube, eye);

  const shadow = new Mesh(new CircleGeometry(0.5, 20), new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.45, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(player, luma, shadow);

  return {
    scene, player, luma, shadow, beacon, points, echoes, sun,
    dispose() {
      scene.traverse(o => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as Material | Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
      });
    },
  };
}
