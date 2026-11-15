// Bennu level, chapter 4 surface sortie (C4-M02 «Un mundo sin suelo» and C4-M03 «Memoria del Sistema Solar»).
// Story rules (brain/02-Diseno/CAPITULOS/C4-LO-QUE-QUEDA.md): anchor first, confirm the refuge by local voice, then
// characterise both accesses, secure the archive and the context sample, and validate AUR-E06 in person at the refuge.
// Extraction, the incident and the return (M04–M06) are sequences of their own and are not part of this sortie.
// Bennu is real; the human visit, the refuge and the service module are hypothetical.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { LevelPoint, LevelV2, Prop } from '../../core/contract/level-v2.ts';
import { bennuHeight, boulders, landmarks } from './terrain.ts';

const t = (es: string, en: string): Localized => ({ es, en });

function point(id: string, x: number, z: number, zone: string, prop: LevelPoint['prop'], action: LevelPoint['action'],
  title: Localized, hint: Localized, result: Localized, power: number, required: boolean, prerequisites: string[] = [], radius = 3): LevelPoint {
  return { id, position: { x, z }, radius, zone, prop, action, title, hint, result, power, required, prerequisites };
}

const points: LevelPoint[] = [
  point('anchor', -7, 66, 'contact', 'beacon', 'service', t('Anclaje de contacto', 'Contact anchor'),
    t('Fija el anclaje: aquí un paso brusco te separa del suelo.', 'Set the anchor: here a sudden step lifts you off the ground.'),
    t('Vehículo anclado y ruta de retorno registrada.', 'Vehicle anchored and return route logged.'), 2, true),
  point('voice', 9, 58, 'contact', 'relay', 'scan', t('Enlace de voz local', 'Local voice link'),
    t('Con el vehículo seguro, abre el canal local del refugio.', 'With the vehicle secure, open the refuge’s local channel.'),
    t('Una voz responde desde el refugio. Está ocupado. Hay gente viva ahí dentro.', 'A voice answers from the refuge. It is occupied. There are people alive in there.'), 1, true, ['anchor']),
  point('access-east', 44, -24, 'blocks', 'rock', 'scan', t('Acceso este: campo de bloques', 'East access: block field'),
    t('Caracteriza el paso entre los bloques sin empujarlos.', 'Characterise the way between the blocks without pushing them.'),
    t('Bloques sueltos: se mueven al apoyarse. Ruta registrada como inestable.', 'Loose blocks: they shift under weight. Route logged as unstable.'), 2, true, ['voice']),
  point('access-west', -46, -20, 'ridge', 'rock', 'scan', t('Acceso oeste: cresta de grava', 'West access: gravel ridge'),
    t('Caracteriza la cresta de grava fina.', 'Characterise the ridge of fine gravel.'),
    t('Grava compacta: paso estable. Ruta marcada hasta el refugio.', 'Packed gravel: stable footing. Route marked to the refuge.'), 2, true, ['voice']),
  point('sample', 32, -58, 'hollow', 'cache', 'salvage', t('Muestra de contexto', 'Context sample'),
    t('Toma la muestra que pidió Control, lejos de los bloques sueltos.', 'Take the sample Control asked for, away from the loose blocks.'),
    t('Muestra rica en carbono asegurada para el informe.', 'Carbon-rich sample secured for the report.'), 3, true, ['voice']),
  point('archive', -16, -64, 'hollow', 'console', 'salvage', t('Archivo de Aurora', 'Aurora archive'),
    t('Copia el archivo de la expedición desde la consola exterior del refugio.', 'Copy the expedition archive from the refuge’s outer console.'),
    t('Archivo copiado: bitácoras, datos de muestreo y el registro de la baliza.', 'Archive copied: logs, sampling data and the beacon record.'), 2, true, ['voice'], 2.6),
  point('overlook', 2, 6, 'monolith', 'beacon', 'scan', t('Cima del gran bloque', 'Top of the great block'),
    t('Sube por la ladera de cascotes del suroeste y mira el sitio entero.', 'Climb the rubble slope on the south-west side and survey the whole site.'),
    t('Desde arriba se ve cómo el suelo se curva: este mundo cabe en un paseo.', 'From up here you can see the ground curving away: this world fits in a walk.'), 1, false),
  point('refuge', 0, -63, 'hollow', 'habitat', 'upload', t('Refugio de Aurora', 'Aurora refuge'),
    t('Entra cuando el sitio esté caracterizado y el archivo y la muestra estén asegurados.', 'Go in once the site is characterised and the archive and the sample are secured.'),
    t('AUR-E06 validada en persona: tu hermana y los supervivientes están vivos. Manifiesto confirmado.',
      'AUR-E06 validated in person: your sister and the survivors are alive. Manifest confirmed.'), 0, true, [], 2.8),
];

const ground = (x: number, z: number) => bennuHeight(x, z);
const box = (x: number, z: number, hx: number, hz: number, height: number) =>
  ({ kind: 'box' as const, x, z, hx, hz, top: ground(x, z) + height });
const cylinder = (x: number, z: number, r: number, height: number) =>
  ({ kind: 'cylinder' as const, x, z, r, top: ground(x, z) + height });

/** Lit posts along the stable west route: the marked way to the refuge. */
const westRoute = [[-30, 40], [-44, 14], [-42, -42], [-24, -60]].map(([x, z]) => ({ kind: 'marker' as const, solid: cylinder(x, z, 0.12, 1.3) }));

const props: Prop[] = [
  { kind: 'lander', solid: box(landmarks.lander.x, landmarks.lander.z, 3, 3, 3.4) },
  { kind: 'mast', solid: cylinder(-9.5, 66, 0.3, 4) },
  { kind: 'module', solid: box(landmarks.refuge.x, landmarks.refuge.z - 4, 3, 5, 4.4) },
  { kind: 'habitat', solid: box(-12, -74, 4, 2.6, 3.2) },
  { kind: 'console', solid: box(-16, -67, 0.5, 0.8, 1.2) },
  { kind: 'cache', solid: box(32, -61, 1.2, 0.8, 1) },
  { kind: 'rock', solid: cylinder(40, -20, 1.2, 1.3) },
  { kind: 'rock', solid: cylinder(48, -30, 1, 1.1) },
  { kind: 'rock', solid: cylinder(52, -20, 0.9, 1) },
  ...westRoute,
];

const onBoulder = (i: number, lift = 0.9) => {
  const [x, z, , h] = boulders[i];
  return { position: { x, z }, y: ground(x, z) + lift + 0 * h };
};

export const bennuLevel: LevelV2 = {
  kitVersion: 2, id: 'bennu', mission: 'c4-surface',
  title: t('Lo que queda de la luz', 'What is left of the light'), subtitle: t('Refugio de Aurora', 'Aurora refuge'),
  briefing: t('Ancla el vehículo, confirma el refugio por voz, caracteriza los dos accesos y asegura el archivo y la muestra. Valida AUR-E06 en persona.',
    'Anchor the vehicle, confirm the refuge by voice, characterise both accesses and secure the archive and the sample. Validate AUR-E06 in person.'),
  arrival: t('Contacto. Bennu apenas tira de ti: cada paso es un pequeño vuelo. La línea de anclaje te mantiene cerca del suelo.',
    'Contact. Bennu barely pulls at you: every step is a small flight. The anchor line keeps you close to the ground.'),
  outcome: t('AUR-E06 validada: tu hermana y los supervivientes están vivos y el manifiesto está confirmado. Empieza la preparación de la evacuación.',
    'AUR-E06 validated: your sister and the survivors are alive and the manifest is confirmed. Evacuation preparations begin.'),
  terrain: { size: 256, res: 257, height: bennuHeight },
  // Too small to hold an atmosphere; the HUD shows ~0 next to the stylised movement (simplification).
  realGravity: 0,
  sun: { azimuth: 70, elevation: 28 },
  spawn: { x: 0, z: 67 },
  comms: { center: { x: 0, z: 0 }, radius: 100, falloff: 20 },
  exit: 'refuge',
  points,
  props,
  // Microgravity, stylised: long slow hops and a gentle run, so the anchor line and speed control matter.
  movement: { gravityUp: 1.6, gravityDown: 2.2, cutGravity: 4, jumpSpeed: 3.8, airJumpSpeed: 3, runSpeed: 4.2, groundAccel: 12, airAccel: 3, dashSpeed: 9, dashKeep: 5 },
  tether: 6,
  zones: [
    { id: 'contact', title: t('Punto de contacto', 'Contact site'), center: { x: 0, z: 64 }, radius: 20 },
    { id: 'monolith', title: t('El gran bloque', 'The great block'), center: landmarks.monolith, radius: 18 },
    // The sunlit side reaches about 116 °C (NASA): cooling the suit costs battery.
    { id: 'dayside', title: t('Cara diurna', 'Dayside'), center: { x: 62, z: 22 }, radius: 24, drain: 0.4, hazard: 'sun' },
    { id: 'blocks', title: t('Campo de bloques', 'Block field'), center: landmarks.eastAccess, radius: 16 },
    { id: 'ridge', title: t('Cresta de grava', 'Gravel ridge'), center: landmarks.westAccess, radius: 18 },
    { id: 'hollow', title: t('Hondonada del refugio', 'Refuge hollow'), center: landmarks.refuge, radius: 22 },
  ],
  collectibles: [
    { ...onBoulder(0, 4.9), id: 'echo-boulder-1' },
    { ...onBoulder(2, 5.9), id: 'echo-boulder-2' },
    { ...onBoulder(3, 4.9), id: 'echo-boulder-3' },
    { ...onBoulder(5, 4.9), id: 'echo-boulder-4' },
    { id: 'echo-monolith', position: { x: -2, z: 9 } },
    { id: 'echo-ridge', position: { x: -50, z: -10 } },
    { id: 'echo-dayside', position: { x: 66, z: 26 } },
    { id: 'echo-hollow', position: { x: 12, z: -76 } },
  ],
};
