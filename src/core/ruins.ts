// Ruins with loot: optional entrances that cost energy to open and hold a journal page. Pure rules.
import type { LevelV2, Ruin } from './contract/level-v2.ts';

export const ruinRadius = 2.2;

export function ruinInReach(level: LevelV2, opened: readonly string[], x: number, z: number): Ruin | null {
  let best: Ruin | null = null, bestD = ruinRadius;
  for (const r of level.ruins ?? []) {
    if (opened.includes(r.id)) continue;
    const d = Math.hypot(x - r.entrance.x, z - r.entrance.z);
    if (d <= bestD) { best = r; bestD = d; }
  }
  return best;
}
