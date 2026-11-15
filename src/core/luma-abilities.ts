// LUMA's abilities on the surface (LUMA.md, «Habilidades»). Deterministic engine rules, never the online AI.
// They help along the way but never replace the suit: no ability touches the return reserve, completes an
// objective or reveals evidence (AUR-E0x). The wear of each chapter makes them slower, never stronger.
import type { Collectible, Hazard, LevelV2, Vec2, Zone } from './contract/level-v2.ts';
import { zoneDrain } from './contract/level-v2.ts';
import { missingFor, type Session } from './session.ts';

/** Strength of LUMA in a destination: the story's wear lengthens the cooldown and dims its glow. */
export type LumaStage = {
  /** Seconds between two trails (sniff). */
  cooldown: number;
  /** Fraction of the cold surcharge its glow saves while it is close. */
  glow: number;
  /** High echoes it can fetch per sortie. */
  fetches: number;
};
export const lumaStages: Record<LevelV2['id'], LumaStage> = {
  orbit: { cooldown: 16, glow: 0.35, fetches: 1 },
  moon: { cooldown: 20, glow: 0.3, fetches: 1 },
  mars: { cooldown: 26, glow: 0.25, fetches: 1 },
  bennu: { cooldown: 32, glow: 0.2, fetches: 1 },
  // At the extraction it can barely keep up: no flying to ledges.
  extraction: { cooldown: 40, glow: 0.15, fetches: 0 },
};

/** How close (m) LUMA must stay for its glow to warm the suit. */
export const glowRadius = 4;
/** Horizontal reach (m) of a fetch: LUMA flies up to an echo the player cannot reach standing. */
export const fetchReach = 8;
/** Distance (m) ahead of a hazard zone edge at which LUMA bristles. */
export const warnDistance = 9;
/** Longest trail LUMA runs (m). */
export const trailLength = 48;

export type Abilities = {
  stage: LumaStage; readyAt: number; fetchesLeft: number;
  /** Hazard zones LUMA has already warned about this sortie. */
  warned: string[];
  sniffs: number; fetched: number;
};

export function createAbilities(levelId: LevelV2['id']): Abilities {
  const stage = lumaStages[levelId];
  return { stage, readyAt: 0, fetchesLeft: stage.fetches, warned: [], sniffs: 0, fetched: 0 };
}

/** 0 when the sniff is ready, else the seconds left. */
export const cooldownLeft = (a: Abilities, now: number) => Math.max(0, a.readyAt - now);

export type ScentKind = 'echo' | 'ruin' | 'rock' | 'beacon' | 'goal';
export type Scent = { kind: ScentKind; id: string; position: Vec2; distance: number };
export type Found = { echoes: string[]; ruins: string[]; atlas: string[]; beacons: string[] };

/**
 * What LUMA's nose picks up: the closest thing still left of Aurora's crew (an echo, a ruin, an uncatalogued rock or
 * a dark beacon). With nothing left it leads to the next objective that can be done now. Only what the level already
 * shows on the map is a candidate; evidence that is not yet in reach never is.
 */
export function sniffTarget(level: LevelV2, found: Found, session: Session, x: number, z: number): Scent | null {
  const candidates: { kind: ScentKind; id: string; position: Vec2 }[] = [
    ...level.collectibles.filter(c => !found.echoes.includes(c.id)).map(c => ({ kind: 'echo' as const, id: c.id, position: c.position })),
    ...(level.ruins ?? []).filter(r => !found.ruins.includes(r.id)).map(r => ({ kind: 'ruin' as const, id: r.id, position: r.entrance })),
    ...(level.specimens ?? []).filter(s => !found.atlas.includes(s.id)).map(s => ({ kind: 'rock' as const, id: s.id, position: s.position })),
    ...(level.beacons?.posts ?? []).filter(p => !found.beacons.includes(p.id)).map(p => ({ kind: 'beacon' as const, id: p.id, position: p.position })),
  ];
  let best: Scent | null = null;
  for (const c of candidates) {
    const d = Math.hypot(c.position.x - x, c.position.z - z);
    if (d > 0.5 && (!best || d < best.distance)) best = { ...c, distance: d };
  }
  if (best) return best;
  const goal = level.points.find(p => p.required && !session.completed.includes(p.id) && !missingFor(level, session, p).length);
  return goal ? { kind: 'goal', id: goal.id, position: goal.position, distance: Math.hypot(goal.position.x - x, goal.position.z - z) } : null;
}

/** Glowing marks LUMA leaves from `from` toward `to`, every `spacing` metres, at most `trailLength` metres long. */
export function trail(from: Vec2, to: Vec2, spacing = 1.6): Vec2[] {
  const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz);
  if (d < spacing) return [];
  const len = Math.min(d, trailLength), out: Vec2[] = [];
  for (let s = spacing; s <= len + 1e-6; s += spacing) out.push({ x: from.x + dx / d * s, z: from.z + dz / d * s });
  return out;
}

/**
 * An echo up on a ledge, close by, that the player cannot pick up standing where they are (the same reach rule as
 * `collect`). LUMA can fly up for it once per sortie; jumping and the thruster remain the way to reach the rest.
 */
export function highEcho(level: LevelV2, collected: string[], x: number, y: number, z: number, groundY: (x: number, z: number) => number): Collectible | null {
  let best: Collectible | null = null, bestD = Infinity;
  for (const c of level.collectibles) {
    if (collected.includes(c.id)) continue;
    const d = Math.hypot(c.position.x - x, c.position.z - z);
    const cy = c.y ?? groundY(c.position.x, c.position.z) + 0.9;
    if (d <= fetchReach && cy - (y + 0.9) >= 1.4 && d < bestD) { best = c; bestD = d; }
  }
  return best;
}

/** Fraction of the cold surcharge LUMA's glow saves: only in cold, only while it stays close. */
export function glowRelief(stage: LumaStage, hazard: Hazard | undefined, lumaDistance: number, present: boolean): number {
  if (!present || (hazard ?? 'cold') !== 'cold' || lumaDistance > glowRadius) return 0;
  return stage.glow;
}

/**
 * The draining zone the player is walking into, if LUMA has not warned about it yet: outside it, within
 * `warnDistance` of its edge and moving toward its centre.
 */
export function hazardAhead(level: LevelV2, completed: string[], warned: string[], x: number, z: number, vx: number, vz: number): Zone | null {
  const speed = Math.hypot(vx, vz);
  if (speed < 0.5) return null;
  for (const zone of level.zones) {
    if (warned.includes(zone.id) || !zoneDrain(zone, completed)) continue;
    const dx = zone.center.x - x, dz = zone.center.z - z, d = Math.hypot(dx, dz);
    const edge = d - zone.radius;
    if (edge <= 0 || edge > warnDistance) continue;
    if ((dx * vx + dz * vz) / (d * speed) > 0.6) return zone;
  }
  return null;
}
