// Rock atlas: optional rocks the spectral camera catalogues. Pure rules, no rendering.
import type { LevelV2, Specimen } from './contract/level-v2.ts';
import type { SuitDesign } from './suit.ts';

export const scanCost = 1;
export const scanRadius = 2.4;

/** Closest rock not yet in the atlas within scanning distance of (x, z). */
export function specimenInReach(level: LevelV2, atlas: readonly string[], x: number, z: number): Specimen | null {
  let best: Specimen | null = null, bestD = scanRadius;
  for (const sp of level.specimens ?? []) {
    if (atlas.includes(sp.id)) continue;
    const d = Math.hypot(x - sp.position.x, z - sp.position.z);
    if (d <= bestD) { best = sp; bestD = d; }
  }
  return best;
}

export type ScanCheck = { ok: true } | { ok: false; error: 'instrument' | 'power' };

/** A scan needs the spectral camera and one unit above the return reserve. */
export function canScan(design: SuitDesign, spendable: number): ScanCheck {
  if (!design.instruments.includes('camera')) return { ok: false, error: 'instrument' };
  if (spendable < scanCost) return { ok: false, error: 'power' };
  return { ok: true };
}
