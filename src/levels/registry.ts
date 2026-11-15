// Level registry: every playable destination and how to load it. Each level is its own lazy chunk, so adding one
// does not grow the download of the others. Open a level with ?level=<id> (defaults to chapter 1, the station).
import type { LevelV2 } from '../core/contract/level-v2.ts';
import type { BiomeId } from '../engine/style.ts';
import type { LevelFacts } from './facts.ts';
import type { Line } from './moon/dialogue.ts';

export type LevelModule = { level: LevelV2; dialogue: Record<string, Line[]>; facts: LevelFacts; biome: BiomeId };

export const levels: Record<string, () => Promise<LevelModule>> = {
  orbit: async () => {
    const [{ orbitLevel }, { orbitDialogue }, { orbitFacts }] = await Promise.all([import('./orbit/level.ts'), import('./orbit/dialogue.ts'), import('./facts.ts')]);
    return { level: orbitLevel, dialogue: orbitDialogue, facts: orbitFacts, biome: 'quirofano' };
  },
  moon: async () => {
    const [{ moonLevel }, { moonDialogue }, { moonFacts }] = await Promise.all([import('./moon/level.ts'), import('./moon/dialogue.ts'), import('./facts.ts')]);
    return { level: moonLevel, dialogue: moonDialogue, facts: moonFacts, biome: 'nacar' };
  },
  mars: async () => {
    const [{ marsLevel }, { marsDialogue }, { marsFacts }] = await Promise.all([import('./mars/level.ts'), import('./mars/dialogue.ts'), import('./facts.ts')]);
    return { level: marsLevel, dialogue: marsDialogue, facts: marsFacts, biome: 'terracota' };
  },
  bennu: async () => {
    const [{ bennuLevel }, { bennuDialogue }, { bennuFacts }] = await Promise.all([import('./bennu/level.ts'), import('./bennu/dialogue.ts'), import('./facts.ts')]);
    return { level: bennuLevel, dialogue: bennuDialogue, facts: bennuFacts, biome: 'carbono' };
  },
};

/**
 * Story order of the playable destinations. A destination opens from the menu once the previous one has a
 * completed sortie; `?level=<id>` still opens any of them directly for testing.
 */
export const route = [
  { id: 'orbit', name: { es: 'Órbita', en: 'Orbit' } },
  { id: 'moon', name: { es: 'Luna', en: 'Moon' } },
  { id: 'mars', name: { es: 'Marte', en: 'Mars' } },
  { id: 'bennu', name: { es: 'Bennu', en: 'Bennu' } },
] as const;

export const defaultLevel = 'orbit';

export function requestedLevel(search: string) {
  const id = new URLSearchParams(search).get('level');
  return id && id in levels ? id : defaultLevel;
}

/** URL for a destination, keeping developer flags such as ?debug and ?quality. */
export function levelUrl(id: string, search: string) {
  const params = new URLSearchParams(search);
  if (id === defaultLevel) params.delete('level'); else params.set('level', id);
  const query = params.toString().replace(/=(?=&|$)/g, '');
  return query ? '?' + query : window.location.pathname;
}
