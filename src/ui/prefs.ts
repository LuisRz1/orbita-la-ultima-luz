// Player preferences, kept per browser. Read by both the interface and the engine.
import { createStore } from 'zustand/vanilla';
import type { Language } from '../core/contract/grid-v1.ts';
import { tierIds, type Tier } from '../engine/quality.ts';

export type Prefs = { lang: Language; sensitivity: number; reduceMotion: boolean; quality: 'auto' | Tier; master: number; music: number; sfx: number; paintedSky: boolean; patch: string | null;
  /** Post-processing (bloom, shafts, depth of field) on medium and high quality. */
  effects: boolean;
  /** Arrival shot when a sortie begins. */
  cinematics: boolean;
  /** Sortie camera: behind the shoulder or from inside the helmet. */
  view: 'third' | 'first';
};
const key = 'orbita-3d-prefs';

const volume = (v: unknown, fallback: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : fallback);

/** First visit: ?lang=es|en if given, else the browser language (Spanish for any es-*, English otherwise). */
function firstLanguage(): Language {
  const asked = new URLSearchParams(window.location.search).get('lang');
  if (asked === 'es' || asked === 'en') return asked;
  return (navigator.language ?? '').toLowerCase().startsWith('es') ? 'es' : 'en';
}

function load(): Prefs {
  const base: Prefs = {
    lang: firstLanguage(), sensitivity: 1,
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, quality: 'auto', master: 0.8, music: 0.7, sfx: 0.9, paintedSky: false, patch: null, effects: true, cinematics: true, view: 'third',
  };
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<Prefs> | null;
    if (!saved) return base;
    return {
      // An explicit ?lang= in the link wins over the saved choice, so a shared link opens in its language.
      lang: new URLSearchParams(window.location.search).has('lang') ? base.lang : saved.lang === 'en' || saved.lang === 'es' ? saved.lang : base.lang,
      sensitivity: typeof saved.sensitivity === 'number' && saved.sensitivity >= 0.3 && saved.sensitivity <= 3 ? saved.sensitivity : 1,
      reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : base.reduceMotion,
      quality: saved.quality === 'auto' || tierIds.includes(saved.quality as Tier) ? saved.quality as Prefs['quality'] : 'auto',
      master: volume(saved.master, base.master), music: volume(saved.music, base.music), sfx: volume(saved.sfx, base.sfx),
      paintedSky: saved.paintedSky === true,
      patch: typeof saved.patch === 'string' ? saved.patch : null,
      effects: saved.effects !== false, cinematics: saved.cinematics !== false, view: saved.view === 'first' ? 'first' : 'third',
    };
  } catch { return base; }
}

export const prefs = createStore<Prefs>(() => load());
prefs.subscribe(state => {
  document.documentElement.lang = state.lang;
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage unavailable */ }
});
document.documentElement.lang = prefs.getState().lang;
