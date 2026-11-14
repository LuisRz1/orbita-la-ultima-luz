// Level registry: every playable destination and how to load it. Each level is its own lazy chunk, so adding one
// does not grow the download of the others. Open a level with ?level=<id> (defaults to the Moon).
import type { LevelV2 } from '../core/contract/level-v2.ts';
import type { Line } from './moon/dialogue.ts';

export type LevelModule = { level: LevelV2; dialogue: Record<string, Line[]> };

export const levels: Record<string, () => Promise<LevelModule>> = {
  moon: async () => {
    const [{ moonLevel }, { moonDialogue }] = await Promise.all([import('./moon/level.ts'), import('./moon/dialogue.ts')]);
    return { level: moonLevel, dialogue: moonDialogue };
  },
};

export const defaultLevel = 'moon';

export function requestedLevel(search: string) {
  const id = new URLSearchParams(search).get('level');
  return id && id in levels ? id : defaultLevel;
}
