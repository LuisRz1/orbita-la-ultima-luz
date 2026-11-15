// Cosmetic suit patches, earned by side content (LUNA-NACAR.md). They change nothing in play.
import type { Localized } from './contract/grid-v1.ts';

const t = (es: string, en: string): Localized => ({ es, en });

export const patches = {
  sismo: { name: t('Parche «Sismo»', '“Quake” patch'), color: '#7fe3e0', how: t('Completa la red sísmica.', 'Complete the seismic network.'), achievement: 'seismic', ruin: null },
  faro: { name: t('Parche «Faro»', '“Lighthouse” patch'), color: '#ffaf68', how: t('Enciende las cuatro balizas.', 'Light all four beacons.'), achievement: 'beacons', ruin: null },
  grieta: { name: t('Parche «Grieta»', '“Rift” patch'), color: '#9dffc8', how: t('Abre el tubo de la grieta.', 'Open the rift tube.'), achievement: null, ruin: 'ruin-tube' },
} as const;
export type PatchId = keyof typeof patches;
export const patchIds = Object.keys(patches) as PatchId[];

/** Patches earned from achievements and ruins held in any save. */
export function earnedPatches(achievements: readonly string[], ruins: readonly string[]): PatchId[] {
  return patchIds.filter(id => {
    const p = patches[id];
    return (p.achievement !== null && achievements.includes(p.achievement)) || (p.ruin !== null && ruins.includes(p.ruin));
  });
}
