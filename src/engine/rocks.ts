// Small decorative rocks scattered over the ground (package B owns this file).
// «Ilustrado» is the original instanced dodecahedron with toon shading and an ink hull, moved verbatim from
// world-view.ts. «Realista» is a PHASE 0 STUB: the same instances with a plain physically based material.
import { DodecahedronGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import type { LevelV2 } from '../core/contract/level-v2.ts';
import { heightAt, type Heightfield } from '../core/heightfield.ts';
import { look } from './look.ts';
import { biome, outlineMaterial, toon } from './style.ts';

/** One instanced draw call (two with ink), no collision, kept away from points of interest. */
export function scatterRocks(level: LevelV2, hf: Heightfield, density: number, opts: { shadows?: boolean } = {}) {
  const count = Math.round(320 * density * biome.rockScatter);
  if (!count) return new Group();
  const geo = new DodecahedronGeometry(1, 0);
  const rocks = new InstancedMesh(geo, look.real ? new MeshStandardMaterial({ color: biome.real.rock, roughness: 0.92, flatShading: true }) : toon(biome.rockLit), count);
  const outline = look.real ? null : new InstancedMesh(geo, outlineMaterial(0.08), count);
  let seed = 99;
  const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3(), axis = new Vector3();
  let placed = 0;
  for (let tries = 0; placed < count && tries < count * 10; tries++) {
    const r = Math.sqrt(rand()) * 108, a = rand() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (level.points.some(pt => Math.hypot(pt.position.x - x, pt.position.z - z) < pt.radius + 2.5)) continue;
    if (level.props.some(pr => Math.hypot(pr.solid.x - x, pr.solid.z - z) < 4)) continue;
    if (Math.hypot(level.spawn.x - x, level.spawn.z - z) < 4) continue;
    const size = 0.12 + Math.pow(rand(), 3) * 0.75;
    p.set(x, heightAt(hf, x, z) + size * 0.25, z);
    q.setFromAxisAngle(axis.set(rand(), rand(), rand()).normalize(), rand() * 6);
    s.set(size, size * (0.5 + rand() * 0.4), size * (0.8 + rand() * 0.4));
    m.compose(p, q, s);
    rocks.setMatrixAt(placed, m); outline?.setMatrixAt(placed, m);
    placed++;
  }
  rocks.count = placed;
  if (outline) outline.count = placed;
  // Stub: every rock casts. B splits small ones (under 0.9 m) into a batch that does not.
  rocks.castShadow = !!opts.shadows; rocks.receiveShadow = look.real;
  const g = new Group();
  g.add(rocks);
  if (outline) g.add(outline);
  return g;
}
