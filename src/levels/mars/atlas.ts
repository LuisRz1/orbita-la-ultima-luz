// Rock atlas for Mars. Each card restates the NASA Mars fact sheet; where the rock sits is level design.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { Specimen } from '../../core/contract/level-v2.ts';

const t = (es: string, en: string): Localized => ({ es, en });
const facts = { name: 'NASA · Mars Facts', url: 'https://science.nasa.gov/mars/facts/' };

export const marsSpecimens: Specimen[] = [
  {
    id: 'rock-rust', position: { x: 20, z: 40 }, basis: 'observation', source: facts,
    title: t('Regolito oxidado', 'Rusted regolith'),
    fact: t('Marte se ve rojo porque el hierro de sus rocas y de su suelo se oxida: es herrumbre.', 'Mars looks red because the iron in its rocks and soil oxidises: it is rust.'),
  },
  {
    id: 'rock-delta', position: { x: 26, z: -2 }, basis: 'observation', source: facts,
    title: t('Huella de agua', 'Trace of water'),
    fact: t('Marte parece haber tenido un pasado con agua: hay valles de ríos antiguos, deltas y lechos de lagos.', 'Mars appears to have had a watery past: there are ancient river valleys, deltas and lakebeds.'),
  },
  {
    id: 'rock-dust', position: { x: -26, z: -8 }, basis: 'observation', source: facts,
    title: t('Polvo de tormenta', 'Storm dust'),
    fact: t('Los vientos de Marte pueden levantar tormentas de polvo que cubren buena parte del planeta.', 'Martian winds can raise dust storms that cover much of the planet.'),
  },
  {
    id: 'rock-basalt', position: { x: 60, z: -40 }, basis: 'observation', source: facts,
    title: t('Roca volcánica', 'Volcanic rock'),
    fact: t('Marte tiene el volcán más grande del Sistema Solar, el Olympus Mons.', 'Mars is home to the largest volcano in the Solar System, Olympus Mons.'),
  },
  {
    id: 'rock-ice', position: { x: -40, z: -70 }, basis: 'simplification', source: facts,
    title: t('Escarcha bajo el polvo', 'Frost under the dust'),
    fact: t('Hay hielo de agua justo bajo la superficie en las regiones polares. En este valle, lejos de los polos, la escarcha es una simplificación del juego.',
      'There is water ice just under the surface in the polar regions. In this valley, far from the poles, the frost is a game simplification.'),
  },
];
