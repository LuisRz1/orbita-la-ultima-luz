// Exploration state for one sortie: points registered, echoes collected, zone and radio link.
// Power and suit costs join in the mission-loop stage; the rules about prerequisites already apply.
import type { LevelPoint, LevelV2 } from './contract/level-v2.ts';

export type Session = { completed: string[]; collected: string[]; recalls: number };
export type InteractResult = { ok: true; point: LevelPoint } | { ok: false; error: 'none' | 'requirements'; point?: LevelPoint };

export const createSession = (): Session => ({ completed: [], collected: [], recalls: 0 });

const dist = (x: number, z: number, p: { x: number; z: number }) => Math.hypot(x - p.x, z - p.z);

/** Closest point not yet registered whose interaction radius contains (x, z). */
export function pointInReach(level: LevelV2, s: Session, x: number, z: number): LevelPoint | null {
  let best: LevelPoint | null = null, bestD = Infinity;
  for (const p of level.points) {
    if (s.completed.includes(p.id)) continue;
    const d = dist(x, z, p.position);
    if (d <= p.radius && d < bestD) { best = p; bestD = d; }
  }
  return best;
}

export function missingFor(level: LevelV2, s: Session, p: LevelPoint) {
  const needs = p.id === level.exit
    ? level.points.filter(q => q.required && q.id !== p.id).map(q => q.id)
    : p.prerequisites;
  return needs.filter(id => !s.completed.includes(id));
}

export function interact(level: LevelV2, s: Session, x: number, z: number): InteractResult {
  const point = pointInReach(level, s, x, z);
  if (!point) return { ok: false, error: 'none' };
  if (missingFor(level, s, point).length) return { ok: false, error: 'requirements', point };
  s.completed.push(point.id);
  return { ok: true, point };
}

export function zoneAt(level: LevelV2, x: number, z: number): string | null {
  let best: string | null = null, bestD = Infinity;
  for (const zone of level.zones) {
    const d = dist(x, z, zone.center);
    if (d <= zone.radius && d < bestD) { best = zone.id; bestD = d; }
  }
  return best;
}

/** 1 inside the link radius, falling to 0 at the edge of the falloff band. The suit's antenna may set the radius. */
export function signalAt(level: LevelV2, x: number, z: number, radius = level.comms.radius) {
  const over = dist(x, z, level.comms.center) - radius;
  return Math.max(0, Math.min(1, 1 - over / level.comms.falloff));
}

/** Collects echoes within reach. Returns the ids picked up this call. */
export function collect(level: LevelV2, s: Session, x: number, y: number, z: number, groundY: (x: number, z: number) => number) {
  const picked: string[] = [];
  for (const c of level.collectibles) {
    if (s.collected.includes(c.id)) continue;
    const cy = c.y ?? groundY(c.position.x, c.position.z) + 0.9;
    if (dist(x, z, c.position) < 1.2 && Math.abs(y + 0.9 - cy) < 1.4) { s.collected.push(c.id); picked.push(c.id); }
  }
  return picked;
}
