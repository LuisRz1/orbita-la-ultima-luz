// Ruins R1–R3 (LUNA-NACAR.md). The pages are fiction, in her own hand during Aurora's lunar stay: routines, care and
// the relay. They never mention LUMA (not found yet), later destinations or the field log (evidence AUR-E03).
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { Ruin } from '../../core/contract/level-v2.ts';

const t = (es: string, en: string): Localized => ({ es, en });

export const moonRuins: Ruin[] = [
  {
    id: 'ruin-shelter', title: t('Refugio sepultado', 'Buried shelter'), entrance: { x: -41.5, z: -24 }, cost: 2,
    page: {
      title: t('Diario · página 1', 'Journal · page 1'),
      text: t('Día 12. Dormimos en la cúpula del cuenco: la del módulo pierde calor por la noche. Aprendí a calentarme las manos en el regulador sin que nadie me vea. El polvo se mete en todo, hasta en las bromas.',
        'Day 12. We sleep in the dome in the bowl: the lander one loses heat at night. I learned to warm my hands on the regulator without anyone seeing. The dust gets into everything, even the jokes.'),
    },
  },
  {
    id: 'ruin-tube', title: t('Tubo de la grieta', 'Rift tube'), entrance: { x: -24, z: -59.8 }, cost: 2,
    page: {
      title: t('Diario · página 2', 'Journal · page 2'),
      text: t('Día 19. Bajamos a medir la boca del tubo. Dentro la temperatura casi no cambia; fuera pasa del horno al hielo. Me acordé de la mesa de la cocina y de lo poco que hablábamos. Prometo escribir más seguido.',
        'Day 19. We went down to measure the mouth of the tube. Inside the temperature barely changes; outside it swings from oven to ice. I thought of the kitchen table and how little we talked. I promise to write more often.'),
    },
    card: {
      basis: 'simplification',
      fact: t('La cámara del LRO fotografió en Marius Hills una fosa de unos 58 × 49 m y 40 m de hondo, quizá el techo hundido de un tubo de lava. Por eso los tubos se estudian como posibles refugios; este tubo es del juego.',
        'LRO\'s camera imaged a pit at Marius Hills about 58 × 49 m across and 40 m deep, perhaps the collapsed roof of a lava tube. That is why tubes are studied as possible shelters; this one belongs to the game.'),
      source: { name: 'LROC (NASA LRO) · Marius Hills Pit', url: 'https://lroc.im-ldi.com/images/202' },
    },
  },
  {
    id: 'ruin-dish', title: t('Antena caída', 'Fallen dish'), entrance: { x: 75, z: 22 }, cost: 2,
    page: {
      title: t('Diario · página 3', 'Journal · page 3'),
      text: t('Día 26. Tercera vez esta semana que reoriento la antena del relé. Me gusta el silencio de ahí arriba. Si el enlace aguanta, mañana llamamos a casa. Quiero que sepan que estoy bien, y que la Tierra desde aquí cabe en un pulgar.',
        'Day 26. Third time this week I realign the relay dish. I like the silence up there. If the link holds, tomorrow we call home. I want them to know I am fine, and that from here the Earth fits behind a thumb.'),
    },
  },
];
