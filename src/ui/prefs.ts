// Player preferences, kept per browser. Read by both the interface and the engine.
import { createStore } from 'zustand/vanilla';
import type { Language } from '../core/contract/grid-v1.ts';
import { tierIds, type Tier } from '../engine/quality.ts';

export type Prefs = { lang: Language; sensitivity: number; reduceMotion: boolean; quality: 'auto' | Tier; master: number; music: number; sfx: number };
const key = 'orbita-3d-prefs';

const volume = (v: unknown, fallback: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : fallback);

function load(): Prefs {
  const base: Prefs = {
    lang: 'es', sensitivity: 1,
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, quality: 'auto', master: 0.8, music: 0.7, sfx: 0.9,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<Prefs> | null;
    if (!saved) return base;
    return {
      lang: saved.lang === 'en' || saved.lang === 'es' ? saved.lang : base.lang,
      sensitivity: typeof saved.sensitivity === 'number' && saved.sensitivity >= 0.3 && saved.sensitivity <= 3 ? saved.sensitivity : 1,
      reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : base.reduceMotion,
      quality: saved.quality === 'auto' || tierIds.includes(saved.quality as Tier) ? saved.quality as Prefs['quality'] : 'auto',
      master: volume(saved.master, base.master), music: volume(saved.music, base.music), sfx: volume(saved.sfx, base.sfx),
    };
  } catch { return base; }
}

export const prefs = createStore<Prefs>(() => load());
prefs.subscribe(state => {
  document.documentElement.lang = state.lang;
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage unavailable */ }
});
document.documentElement.lang = prefs.getState().lang;
