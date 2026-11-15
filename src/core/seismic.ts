// Side mission S1 «Red sísmica»: carry geophones from the cargo crate and plant them. Pure rules.
import type { LevelV2 } from './contract/level-v2.ts';

export const seismicRadius = 2.4;

export type SeismicAction = { kind: 'pickup'; count: number } | { kind: 'plant'; site: string } | null;

/**
 * What the player can do here. `planted` is saved; `carrying` lasts one sortie. The crate hands out as many
 * geophones as sites remain unplanted; a site accepts one if the player carries any.
 */
export function seismicAction(level: LevelV2, planted: readonly string[], carrying: number, x: number, z: number): SeismicAction {
  const net = level.seismic;
  if (!net) return null;
  const left = net.sites.filter(s => !planted.includes(s.id)).length;
  if (!left) return null;
  if (Math.hypot(x - net.pickup.x, z - net.pickup.z) <= seismicRadius && carrying < left) return { kind: 'pickup', count: left - carrying };
  if (carrying > 0) for (const s of net.sites) {
    if (planted.includes(s.id)) continue;
    if (Math.hypot(x - s.position.x, z - s.position.z) <= seismicRadius) return { kind: 'plant', site: s.id };
  }
  return null;
}
