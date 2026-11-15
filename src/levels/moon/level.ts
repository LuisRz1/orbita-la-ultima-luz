// Moon level, grey-box. Point texts and mission rules come from the v1 lunar world, so the 2D and 3D
// versions describe the same mission; only positions and the terrain are new.
import type { LevelPoint, LevelV2, Prop } from '../../core/contract/level-v2.ts';
import { moonSpecimens } from './atlas.ts';
import { moonRuins } from './ruins.ts';
import { moon } from '../../core/worlds/moon.ts';
import { landmarks, moonHeight } from './terrain.ts';

const t = (es: string, en: string) => ({ es, en });

const placement: Record<string, Pick<LevelPoint, 'position' | 'radius' | 'zone'>> = {
  shelter: { position: { x: -7, z: 73 }, radius: 2.6, zone: 'landing' },
  terminal: { position: { x: 6, z: 72 }, radius: 2.6, zone: 'landing' },
  ridge: { position: { x: -62, z: 6 }, radius: 3, zone: 'ridge' },
  sample: { position: { x: 58, z: -8 }, radius: 3, zone: 'shadow' },
  relay: { position: { x: 0, z: 0 }, radius: 3, zone: 'peak' },
  archive: { position: { x: 0, z: -80 }, radius: 3, zone: 'archive' },
};

const points: LevelPoint[] = moon.points.map(p => {
  const place = placement[p.id];
  if (!place) throw new Error('Moon point without 3D placement: ' + p.id);
  const { position: _grid, ...rules } = p;
  return { ...rules, ...place };
});

const ground = (x: number, z: number) => moonHeight(x, z);
const box = (x: number, z: number, hx: number, hz: number, height: number) =>
  ({ kind: 'box' as const, x, z, hx, hz, top: ground(x, z) + height });
const cylinder = (x: number, z: number, r: number, height: number) =>
  ({ kind: 'cylinder' as const, x, z, r, top: ground(x, z) + height });

const props: Prop[] = [
  { kind: 'lander', solid: box(landmarks.lander.x, landmarks.lander.z, 3, 3, 3.4) },
  { kind: 'mast', solid: cylinder(2.2, 1.6, 0.35, 9) },
  { kind: 'shelter', solid: box(-10.5, 73, 1.6, 2.2, 2.4) },
  { kind: 'console', solid: box(8.4, 72, 0.5, 0.8, 1.2) },
  { kind: 'cache', solid: box(0, -83, 1.2, 0.8, 1) },
  { kind: 'pillar', solid: cylinder(-20, -40, 1.3, 4.6) },
  { kind: 'pillar', solid: cylinder(30, 30, 1.2, 3.4) },
  { kind: 'boulder', solid: cylinder(-40, 50, 2.2, 2.6) },
  { kind: 'boulder', solid: cylinder(72, -22, 1.8, 2.2) },
  { kind: 'rock', solid: cylinder(18, 58, 1, 1.1) },
  { kind: 'rock', solid: cylinder(-24, 12, 1.2, 1.3) },
  { kind: 'rock', solid: cylinder(40, -48, 0.9, 1) },
  // Lit posts along the south-west ramp: the walkable way up the peak.
  ...[9, 14, 20, 26].map(r => ({ kind: 'marker' as const, solid: cylinder(-r * Math.SQRT1_2 - 1.2, r * Math.SQRT1_2 + 1.2, 0.12, 1.3) })),
  // Rock steps up both walls of the rift, about 2.2 m apart: a way out for anyone who falls in.
  ...riftSteps(8, -50.6), ...riftSteps(-8, -61.4),
  // Ruins (LUNA-NACAR.md): a half-buried dome in the west bowl, an arch at the mouth of a tube in the rift's north wall
  // and a fallen dish over a shed in the east.
  { kind: 'ruin-dome', solid: cylinder(-46, -24, 3.6, 2.6) },
  { kind: 'ruin-arch', solid: { kind: 'box', x: -24, z: -61.8, hx: 2.2, hz: 0.6, top: ground(-24, -61.8) + 3.4 } },
  { kind: 'ruin-dish', solid: cylinder(78.5, 19.5, 2.2, 1.8) },
];

function riftSteps(x0: number, z: number) {
  const floor = ground(x0, z);
  return [1, 2, 3, 4, 5].map(k => {
    const x = x0 + Math.sign(x0) * (k - 1) * 2.1;
    return { kind: 'step' as const, solid: { kind: 'box' as const, x, z, hx: 0.9, hz: 0.9, top: floor + 2.1 * k } };
  });
}

const above = (index: number, lift = 0.9) => {
  const s = props[index].solid;
  return { id: '', position: { x: s.x, z: s.z }, y: s.top + lift };
};

export const moonLevel: LevelV2 = {
  kitVersion: 2, id: 'moon', mission: 'c2-surface',
  title: moon.title, subtitle: moon.subtitle, briefing: moon.briefing, arrival: moon.arrival, outcome: moon.outcome,
  terrain: { size: 256, res: 257, height: moonHeight },
  realGravity: 1.62,
  sun: { azimuth: 115, elevation: 16 },
  spawn: { x: 0, z: 67 },
  comms: { center: { x: 0, z: 0 }, radius: 100, falloff: 20 },
  exit: moon.exit,
  points,
  props,
  zones: [
    { id: 'landing', title: t('Zona de alunizaje', 'Landing site'), center: { x: 0, z: 72 }, radius: 22 },
    { id: 'peak', title: t('Pico del relé', 'Relay peak'), center: landmarks.peak, radius: 28 },
    { id: 'ridge', title: t('Cresta oeste', 'West ridge'), center: landmarks.ridge, radius: 22 },
    { id: 'shadow', title: t('Cráter en sombra', 'Shadowed crater'), center: landmarks.shadow, radius: 22, drain: 0.6 },
    { id: 'rift', title: t('La grieta', 'The rift'), center: { x: 0, z: landmarks.riftZ }, radius: 16 },
    { id: 'archive', title: t('Archivo norte', 'North archive'), center: landmarks.archive, radius: 15 },
  ],
  specimens: moonSpecimens,
  ruins: moonRuins,
  // S2 (LUNA-NACAR.md): the posts run from the lander towards the buried shelter R1 in the west bowl.
  beacons: {
    title: t('Baliza de Aurora', 'Aurora beacon'),
    posts: [
      { id: 'beacon-1', position: { x: -12, z: 60 } }, { id: 'beacon-2', position: { x: -24, z: 40 } },
      { id: 'beacon-3', position: { x: -34, z: 18 } }, { id: 'beacon-4', position: { x: -40, z: -8 } },
    ],
    reward: t('Las cuatro balizas encendidas. Siguen la ruta que Aurora marcó hacia el cuenco del oeste: allí hay una cúpula medio enterrada.',
      'All four beacons lit. They follow the route Aurora marked towards the west bowl: a half-buried dome lies there.'),
  },
  collectibles: [
    { ...above(0), id: 'echo-lander' },
    { ...above(5), id: 'echo-pillar-north' },
    { ...above(6), id: 'echo-pillar-south' },
    { ...above(7), id: 'echo-boulder-west' },
    { ...above(8), id: 'echo-boulder-east' },
    { id: 'echo-summit', position: { x: 7, z: -6 } },
    { id: 'echo-ridge-top', position: { x: -62, z: 12 } },
    { id: 'echo-rift-floor', position: { x: 4, z: landmarks.riftZ } },
  ],
};
