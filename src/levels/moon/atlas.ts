// Rock atlas for the lunar crater (LUNA-NACAR.md). Each card states what the cited NASA source reports; the place
// where the rock sits in this crater is level design, so a card marked `simplification` also bends the setting.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { Specimen } from '../../core/contract/level-v2.ts';

const t = (es: string, en: string): Localized => ({ es, en });
const composition = { name: 'NASA · Moon Composition', url: 'https://science.nasa.gov/moon/composition/' };

export const moonSpecimens: Specimen[] = [
  {
    id: 'rock-anorthosite', position: { x: -10, z: 18 }, basis: 'observation',
    title: t('Anortosita', 'Anorthosite'),
    fact: t('Roca clara de grano grueso, hecha casi solo de plagioclasa. La muestra 15415 del Apollo 15, la «Genesis Rock», es anortosita ferrosa de las tierras altas.',
      'A pale, coarse-grained rock made almost entirely of plagioclase. Apollo 15 sample 15415, the "Genesis Rock", is a ferroan anorthosite from the highlands.'),
    source: { name: 'NASA · Lunar Sample Compendium 15415', url: 'https://curator.jsc.nasa.gov/lunar/lsc/15415.pdf' },
  },
  {
    id: 'rock-breccia', position: { x: -38.5, z: -24 }, basis: 'observation',
    title: t('Brecha', 'Breccia'),
    fact: t('Fragmentos de roca rotos y soldados de nuevo por el impacto de meteoritos. El Apollo 16 trajo brechas así de las tierras altas.',
      'Rock fragments shattered and welded back together by meteorite impacts. Apollo 16 brought back breccias like this from the highlands.'),
    source: { name: 'NASA · Lunar Sample Curation', url: 'https://curator.jsc.nasa.gov/lunar/' },
  },
  {
    id: 'rock-orange-glass', position: { x: 34, z: 46 }, basis: 'observation',
    title: t('Perlas de vidrio naranja', 'Orange glass beads'),
    fact: t('El «suelo naranja» que el Apollo 17 encontró en el borde del cráter Shorty (muestra 74220). Son perlas de vidrio volcánico de un depósito piroclástico: lava pulverizada por una erupción.',
      'The "orange soil" Apollo 17 found on the rim of Shorty Crater (sample 74220). It is volcanic glass beads from a pyroclastic deposit: lava sprayed out by an eruption.'),
    source: { name: 'NASA · Lunar Sample Compendium 74220', url: 'https://curator.jsc.nasa.gov/lunar/lsc/74220.pdf' },
  },
  {
    id: 'rock-basalt', position: { x: 50, z: -66 }, basis: 'observation',
    title: t('Basalto de mar', 'Mare basalt'),
    fact: t('Los «mares» oscuros son lava enfriada que inundó grandes cuencas de impacto hace entre 4200 y 1200 millones de años. El basalto es rico en olivino y piroxeno.',
      'The dark "seas" are cooled lava that flooded vast impact basins between 4.2 and 1.2 billion years ago. The basalt is rich in olivine and pyroxene.'),
    source: composition,
  },
  {
    id: 'rock-frost', position: { x: 52, z: -14 }, basis: 'simplification',
    title: t('Escarcha en sombra', 'Frost in shadow'),
    fact: t('En 2009 el impacto de LCROSS en el cráter Cabeus, en sombra permanente, levantó agua: cerca del 6 % del material. Aquí la escarcha sobre la roca es una simplificación del juego.',
      'In 2009 the LCROSS impact into Cabeus crater, in permanent shadow, threw up water: about 6% of the material. The frost on this rock is a game simplification.'),
    source: { name: 'NASA NSSDCA · Ice on the Moon', url: 'https://nssdc.gsfc.nasa.gov/planetary/ice/ice_moon.html' },
  },
  {
    id: 'rock-micrometeorite', position: { x: -77, z: -2 }, basis: 'observation',
    title: t('Marcas de microimpactos', 'Micrometeorite pits'),
    fact: t('Sin atmósfera, los micrometeoritos golpean el suelo directamente. Su calor funde el regolito y deja aglutinados: granos pegados con vidrio.',
      'With no atmosphere, micrometeorites strike the ground directly. Their heat melts the regolith into agglutinates: grains glued together with glass.'),
    source: composition,
  },
];
