import { moon } from './moon.ts';
import { orbit } from './orbit.ts';
import { mars } from './mars.ts';
import { bennu } from './bennu.ts';
import { validateLoads } from '../mission.ts';
export const worlds = [orbit,moon,mars,bennu].map(validateLoads);
if (new Set(worlds.map(w=>w.mission)).size!==worlds.length) throw new Error('Duplicate mission slot');
export { moon };
