// Side mission "Aurora beacons": unlit posts the player can repair. Pure rules, no rendering.
import type { LevelV2 } from './contract/level-v2.ts';
import type { SuitDesign } from './suit.ts';

export const beaconRadius = 2.4;

/** Two units, one with the repair kit (the same halving the kit gives mission repairs). */
export const beaconCost = (d: SuitDesign) => (d.instruments.includes('kit') ? 1 : 2);

export function beaconInReach(level: LevelV2, lit: readonly string[], x: number, z: number) {
  let best: { id: string; position: { x: number; z: number } } | null = null, bestD = beaconRadius;
  for (const b of level.beacons?.posts ?? []) {
    if (lit.includes(b.id)) continue;
    const d = Math.hypot(x - b.position.x, z - b.position.z);
    if (d <= bestD) { best = b; bestD = d; }
  }
  return best;
}
