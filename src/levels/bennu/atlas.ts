// Rock atlas for Bennu. Every card restates the NASA Bennu fact sheet; where a rock sits is level design.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { Specimen } from '../../core/contract/level-v2.ts';

const t = (es: string, en: string): Localized => ({ es, en });
const facts = { name: 'NASA · Bennu Facts', url: 'https://science.nasa.gov/solar-system/asteroids/101955-bennu/facts/' };

export const bennuSpecimens: Specimen[] = [
  {
    id: 'rock-carbon', position: { x: -14, z: 48 }, basis: 'observation', source: facts,
    title: t('Polvo de carbono', 'Carbon dust'),
    fact: t('El polvo de Bennu es rico en carbono y nitrógeno, y contiene compuestos orgánicos.', 'Bennu’s dust is rich in carbon and nitrogen, and contains organic compounds.'),
  },
  {
    id: 'rock-boulder', position: { x: 22, z: 30 }, basis: 'observation', source: facts,
    title: t('Bloque gigante', 'Giant boulder'),
    fact: t('OSIRIS-REx encontró la superficie llena de rocas y bloques, algunos de hasta 22 metros.', 'OSIRIS-REx found the surface littered with rocks and boulders, some up to 22 metres across.'),
  },
  {
    id: 'rock-loose', position: { x: 36, z: -14 }, basis: 'observation', source: facts,
    title: t('Grava sin cohesión', 'Loose gravel'),
    fact: t('Las partículas de la superficie están tan sueltas y poco unidas que pisarla ofrece muy poca resistencia.', 'The surface particles are so loosely packed and lightly bound that stepping on it offers very little resistance.'),
  },
  {
    id: 'rock-ejecta', position: { x: -34, z: 2 }, basis: 'observation', source: facts,
    title: t('Partículas expulsadas', 'Ejected particles'),
    fact: t('El equipo de la misión observó más de 300 ocasiones en que el asteroide expulsó partículas de roca.', 'The mission team observed more than 300 occasions when the asteroid ejected rocky particles.'),
  },
  {
    id: 'rock-sample', position: { x: 20, z: -56 }, basis: 'simplification', source: facts,
    title: t('Huella de muestreo', 'Sampling scar'),
    fact: t('OSIRIS-REx trajo a la Tierra 121,6 g de Bennu el 24 de septiembre de 2023. Esta marca en la roca es del juego, no del sitio real.',
      'OSIRIS-REx delivered 121.6 g of Bennu to Earth on 24 September 2023. This mark on the rock belongs to the game, not the real site.'),
  },
];
