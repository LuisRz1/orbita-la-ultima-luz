// Level contract v2: continuous 3D positions on a heightfield. Mission rules keep the v1 meaning
// (prerequisites, power, required/optional, single upload exit) so the same mission logic applies.
import type { Localized, POI } from './grid-v1.ts';
import { heightAt, slopeAt, type Heightfield } from '../heightfield.ts';
import type { Solid } from '../movement.ts';

export type Vec2 = { x: number; z: number };

export type LevelPoint = Omit<POI, 'position'> & { position: Vec2; radius: number; zone: string };
/**
 * `drain`: extra energy per second while inside. `hazard` says what causes it (cold by default).
 * `surge`: a contingency. Once the point `after` is completed the zone drains `drain` instead (for example a dust
 * storm that a relay repair sets off), so the planned way home may no longer be the cheapest one.
 */
export type Hazard = 'cold' | 'dust';
export type Surge = { after: string; drain: number; warning: Localized };
export type Zone = { id: string; title: Localized; center: Vec2; radius: number; drain?: number; hazard?: Hazard; surge?: Surge };
export type Collectible = { id: string; position: Vec2; y?: number };
export type PropKind = 'lander' | 'mast' | 'pillar' | 'boulder' | 'shelter' | 'console' | 'cache' | 'rock' | 'marker' | 'step' | 'habitat' | 'rover';
export type Prop = { kind: PropKind; solid: Solid };

export type LevelV2 = {
  kitVersion: 2; id: 'orbit' | 'moon' | 'mars' | 'bennu'; mission: string;
  title: Localized; subtitle: Localized; briefing: Localized; arrival: Localized; outcome: Localized;
  terrain: { size: number; res: number; height(x: number, z: number): number };
  /** Real surface gravity, shown to the player next to the stylised value. */
  realGravity: number;
  sun: { azimuth: number; elevation: number };
  spawn: Vec2;
  /** Radio link: full signal inside `radius`, lost at `radius + falloff`; beyond that the player is recalled. */
  comms: { center: Vec2; radius: number; falloff: number };
  zones: Zone[]; points: LevelPoint[]; props: Prop[]; collectibles: Collectible[]; exit: string;
};

/**
 * Checks a level against its heightfield. Every required point must be reachable on foot from the spawn
 * without jumping, so a mission designed without thrusters can still be completed.
 */
export function checkLevel(level: LevelV2, hf: Heightfield, maxSlope: number) {
  const problems: string[] = [];
  const ids = new Set<string>();
  const zones = new Set(level.zones.map(z => z.id));
  for (const p of level.points) {
    if (ids.has(p.id)) problems.push('duplicate point ' + p.id);
    ids.add(p.id);
    if (!zones.has(p.zone)) problems.push('unknown zone for ' + p.id);
    if (slopeAt(hf, p.position.x, p.position.z) > maxSlope) problems.push('point on a steep slope: ' + p.id);
    if (Math.hypot(p.position.x - level.comms.center.x, p.position.z - level.comms.center.z) > level.comms.radius)
      problems.push('point outside the radio link: ' + p.id);
    for (const pre of p.prerequisites) if (!level.points.some(q => q.id === pre)) problems.push('unknown prerequisite ' + pre);
  }
  for (const z of level.zones) if (z.surge && !level.points.some(p => p.id === z.surge!.after)) problems.push('surge after unknown point in ' + z.id);
  const exit = level.points.find(p => p.id === level.exit);
  if (!exit || exit.action !== 'upload' || !exit.required) problems.push('exit must be a required upload point');

  const reach = walkable(hf, level.spawn, maxSlope);
  const step = hf.size / (hf.res - 1);
  const cell = (v: Vec2) => Math.round((v.z + hf.size / 2) / step) * hf.res + Math.round((v.x + hf.size / 2) / step);
  for (const p of level.points) if (p.required && !reach[cell(p.position)]) problems.push('required point not reachable on foot: ' + p.id);
  return problems;
}

/** Flood fill over cells a walker can cross without exceeding `maxSlope`. */
export function walkable(hf: Heightfield, from: Vec2, maxSlope: number) {
  const { res, size } = hf, step = size / (res - 1);
  const seen = new Uint8Array(res * res);
  const ok = new Uint8Array(res * res);
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++)
    ok[j * res + i] = slopeAt(hf, -size / 2 + i * step, -size / 2 + j * step) <= maxSlope ? 1 : 0;
  const rise = Math.tan(maxSlope * Math.PI / 180) * step + 0.05;
  const start = Math.round((from.z + size / 2) / step) * res + Math.round((from.x + size / 2) / step);
  const queue = [start]; seen[start] = 1;
  for (let k = 0; k < queue.length; k++) {
    const c = queue[k], i = c % res, j = (c - i) / res;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= res || nj >= res) continue;
      const n = nj * res + ni;
      if (seen[n] || !ok[n] || Math.abs(hf.data[n] - hf.data[c]) > rise) continue;
      seen[n] = 1; queue.push(n);
    }
  }
  return seen;
}

/** Energy per second a zone drains right now: its surge value once the triggering point is done. */
export function zoneDrain(zone: Zone | undefined, completed: readonly string[]) {
  if (!zone) return 0;
  if (zone.surge && completed.includes(zone.surge.after)) return zone.surge.drain;
  return zone.drain ?? 0;
}

export const pointHeight =(hf: Heightfield, v: Vec2) => heightAt(hf, v.x, v.z);
