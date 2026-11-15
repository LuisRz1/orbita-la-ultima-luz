// Optional achievements. They reward exploring and learning from the design loop; none of them blocks the story.
import type { Localized } from './contract/grid-v1.ts';
import type { Report } from './sortie.ts';
import { reserve, type SuitDesign } from './suit.ts';

const t = (es: string, en: string): Localized => ({ es, en });

export const achievements = {
  'first-dash': { title: t('Impulso', 'Burst'), desc: t('Usa el dash por primera vez.', 'Dash for the first time.') },
  'first-thrust': { title: t('Dos veces arriba', 'Twice up'), desc: t('Haz un doble salto con el propulsor.', 'Double jump with the thruster.') },
  'cold': { title: t('Donde no llega el sol', 'Where the sun never reaches'), desc: t('Entra en el cráter en sombra.', 'Enter the shadowed crater.') },
  'first-echo': { title: t('Primer eco', 'First echo'), desc: t('Encuentra un eco de Aurora.', 'Find an echo of Aurora.') },
  'dust': { title: t('Entre remolinos', 'Among dust devils'), desc: t('Cruza las dunas de Marte.', 'Cross the Martian dunes.') },
  'all-echoes': { title: t('Todas sus huellas', 'Every trace'), desc: t('Encuentra todos los ecos de un destino.', 'Find every echo at one destination.') },
  'first-rock': { title: t('Ojo de geóloga', 'Geologist\'s eye'), desc: t('Escanea una roca del atlas.', 'Scan a rock for the atlas.') },
  'full-atlas': { title: t('Atlas completo', 'Full atlas'), desc: t('Escanea todas las rocas del atlas de un destino.', 'Scan every atlas rock at one destination.') },
  'beacons': { title: t('Faro', 'Lighthouse'), desc: t('Repara todas las balizas de Aurora.', 'Repair every Aurora beacon.') },
  'first-page': { title: t('Su letra', 'Her handwriting'), desc: t('Encuentra una página del diario de Aurora.', 'Find a page of the Aurora journal.') },
  'all-pages': { title: t('Diario completo', 'Full journal'), desc: t('Encuentra todas las páginas del diario de un destino.', 'Find every journal page at one destination.') },
  'seismic': { title: t('Sismo', 'Quake'), desc: t('Completa la red sísmica de la Luna.', 'Complete the seismic network on the Moon.') },
  'complete': { title: t('Transmisión recibida', 'Transmission received'), desc: t('Completa una misión de superficie.', 'Complete a surface mission.') },
  'tight-reserve': { title: t('Al límite', 'On the edge'), desc: t('Completa la misión con 5 u. o menos sobre la reserva.', 'Complete the mission with 5 u or less above the reserve.') },
  'no-recall': { title: t('Enlace firme', 'Steady link'), desc: t('Completa la misión sin perder el enlace.', 'Complete the mission without losing the link.') },
  'learn': { title: t('Aprender del repliegue', 'Learning from a recall'), desc: t('Completa la misión después de un repliegue.', 'Complete the mission after a recall.') },
  'two-designs': { title: t('Ingeniería de iteración', 'Iterative engineering'), desc: t('Sal con dos diseños de traje distintos.', 'Head out with two different suit designs.') },
} as const;

export type AchievementId = keyof typeof achievements;
export const achievementIds = Object.keys(achievements) as AchievementId[];

export type GameEvent =
  | { kind: 'dash' } | { kind: 'air-jump' }
  | { kind: 'zone'; cold: boolean; dust?: boolean }
  | { kind: 'echo'; found: number; total: number }
  | { kind: 'atlas'; found: number; total: number }
  | { kind: 'beacon'; lit: number; total: number }
  | { kind: 'page'; found: number; total: number }
  | { kind: 'seismic'; planted: number; total: number }
  | { kind: 'sortie'; designs: SuitDesign[] }
  | { kind: 'report'; report: Report; previous: ('complete' | 'recalled')[] };

/** Achievements newly earned by an event, given the ones already held. */
export function unlocks(event: GameEvent, held: readonly string[]): AchievementId[] {
  const out: AchievementId[] = [];
  const add = (id: AchievementId, when: boolean) => { if (when && !held.includes(id) && !out.includes(id)) out.push(id); };
  switch (event.kind) {
    case 'dash': add('first-dash', true); break;
    case 'air-jump': add('first-thrust', true); break;
    case 'zone': add('cold', event.cold); add('dust', !!event.dust); break;
    case 'echo': add('first-echo', event.found >= 1); add('all-echoes', event.found >= event.total); break;
    case 'atlas': add('first-rock', event.found >= 1); add('full-atlas', event.found >= event.total); break;
    case 'beacon': add('beacons', event.lit >= event.total); break;
    case 'page': add('first-page', event.found >= 1); add('all-pages', event.found >= event.total); break;
    case 'seismic': add('seismic', event.planted >= event.total); break;
    case 'sortie': add('two-designs', new Set(event.designs.map(d => JSON.stringify(d))).size >= 2); break;
    case 'report': {
      const done = event.report.outcome === 'complete';
      add('complete', done);
      add('tight-reserve', done && event.report.left - reserve <= 5);
      add('no-recall', done && event.report.recalls === 0);
      add('learn', done && event.previous.includes('recalled'));
    }
  }
  return out;
}
