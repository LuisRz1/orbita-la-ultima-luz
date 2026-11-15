// What the player has really recorded across destinations. Only the farewell reads it: memories change the nuance
// of the goodbye, never the outcome (brain/02-Diseno/ARCO-LUMA-SPOILERS.md).
import type { Progress } from '../core/save/progress3d.ts';

export type Memories = {
  /** Moon journal pages read, by ruin id. */
  pages: string[];
  /** Every Aurora beacon on the Moon lit. */
  beacons: boolean;
  /** Atlas rocks catalogued on any destination. */
  atlas: number;
  /** Aurora echoes found on any destination. */
  echoes: number;
};

export function gatherMemories(saves: Iterable<Progress | null>): Memories {
  const m: Memories = { pages: [], beacons: false, atlas: 0, echoes: 0 };
  for (const p of saves) {
    if (!p) continue;
    m.pages.push(...p.ruins);
    if (p.level === 'moon' && p.beacons.length >= 4) m.beacons = true;
    m.atlas += p.atlas.length;
    m.echoes += p.echoes.length;
  }
  return m;
}
