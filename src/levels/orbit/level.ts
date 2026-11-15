// Chapter 1 surface sortie in 3D: the reception station (C1-M03–M05, closed by the AUR-E01/AUR-E02 authentication).
// Texts follow the 2D chapter (src/core/orbit/content.ts) and the story rules: the capsule proves Aurora sent it,
// not that anyone is still alive; LUMA appears only when the protected bay is opened; nothing names Mars or Bennu.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { LevelPoint, LevelV2, Prop } from '../../core/contract/level-v2.ts';
import { landmarks, orbitHeight } from './terrain.ts';

const t = (es: string, en: string): Localized => ({ es, en });

function point(id: string, x: number, z: number, zone: string, prop: LevelPoint['prop'], action: LevelPoint['action'],
  title: Localized, hint: Localized, result: Localized, power: number, required: boolean, prerequisites: string[] = [], radius = 2.8): LevelPoint {
  return { id, position: { x, z }, radius, zone, prop, action, title, hint, result, power, required, prerequisites };
}

const points: LevelPoint[] = [
  point('supplies', -9, 60, 'dock', 'cache', 'service', t('Transferir suministros', 'Transfer supplies'),
    t('Confirma el sello del acople y mueve el cargamento a la estación.', 'Confirm the docking seal and move the freight into the station.'),
    t('Sello íntegro. Suministros transferidos. Control autoriza el acceso a la cuna de recepción.',
      'Seal intact. Supplies transferred. Control clears you to the reception cradle.'), 2, true),
  point('capsule', -31, 46, 'cradle', 'cache', 'scan', t('Cotejar cápsula y recepción', 'Cross-check capsule and receipt'),
    t('Compara el identificador de la cápsula con el registro de recepción.', 'Compare the capsule identifier with the reception log.'),
    t('Los códigos coinciden con Aurora. Alguien pudo enviarla tras el incidente; no sabemos quién sigue vivo.',
      'The codes match Aurora. Someone was able to send it after the incident; we do not know who is still alive.'), 2, true, ['supplies']),
  point('protected-bay', -30.5, 30, 'cradle', 'habitat', 'service', t('Abrir compartimento protegido', 'Open the protected bay'),
    t('Comprueba la presión antes de abrir. Algo se mueve al otro lado.', 'Check the pressure before opening. Something is moving on the other side.'),
    t('Una criatura pequeña y dorada asoma dos patas. Retrocede al oír el cierre y vuelve a acercarse.',
      'A small golden creature pokes out two paws. It steps back at the hatch sound, then comes closer.'), 1, true, ['capsule']),
  point('translator', -29, 22.5, 'cradle', 'relay', 'scan', t('Calibrar el traductor', 'Calibrate the translator'),
    t('Repite un saludo y registra la respuesta gestual, sin forzar a la criatura.', 'Repeat a greeting and record the creature’s response without forcing it.'),
    t('El traductor reconoce un saludo en dos pulsos. LUMA: «Ella me enseñó ese saludo».',
      'The translator reads a greeting in two pulses. LUMA: “She taught me that greeting.”'), 1, true, ['protected-bay']),
  point('keepsake', -44, 40, 'cradle', 'beacon', 'scan', t('Objeto de tu hermana', 'Your sister’s keepsake'),
    t('Muestra el parche recuperado de la cápsula y observa a LUMA.', 'Show the patch recovered from the capsule and watch LUMA.'),
    t('LUMA acerca la frente al parche. «Lo llevaba ella. Se quedaba conmigo hasta que dejaba de temblar».',
      'LUMA leans its brow against the patch. “She wore it. She stayed with me until I stopped shaking.”'), 0, false, ['translator']),
  point('sun-record', 0, 47, 'dock', 'beacon', 'scan', t('Archivar iluminación', 'Log illumination'),
    t('Mide la luz en la entrada de la armadura antes de elegir baranda.', 'Measure the light at the truss entrance before choosing a handrail.'),
    t('La armadura central va al sol directo; la baranda oeste queda a la sombra de los módulos. Las dos llegan al registrador.',
      'The central truss runs in direct sunlight; the west handrail stays in the modules’ shadow. Both reach the recorder.'), 2, true),
  point('recorder', 0, -85, 'boom', 'cache', 'salvage', t('Recuperar registrador exterior', 'Recover the external recorder'),
    t('Sujétate a la baranda y desmonta el registrador que recibió la cápsula.', 'Stay attached to the handrail and remove the recorder that received the capsule.'),
    t('Registrador en mano. Aún hay que cotejar el código de enlace en la esclusa.', 'Recorder recovered. The link code still needs to be cross-checked at the airlock.'),
    3, true, ['sun-record']),
  point('airlock', 9, 64, 'dock', 'console', 'upload', t('Esclusa: autenticar AUR-E01 y AUR-E02', 'Airlock: authenticate AUR-E01 and AUR-E02'),
    t('Vuelve y autentica la cápsula, el compartimento y el registrador juntos.', 'Come back and authenticate the capsule, the bay and the recorder together.'),
    t('Registros enviados. Control coteja cápsula, compartimento y enlace.', 'Records sent. Control cross-checks capsule, bay and link.'), 0, true,
    ['supplies', 'capsule', 'protected-bay', 'translator', 'sun-record', 'recorder']),
];

const deckBox = (x: number, z: number, hx: number, hz: number, height: number) =>
  ({ kind: 'box' as const, x, z, hx, hz, top: orbitHeight(x, z) + height });
const deckCylinder = (x: number, z: number, r: number, height: number) =>
  ({ kind: 'cylinder' as const, x, z, r, top: orbitHeight(x, z) + height });
/** Solar wings hang over the void at deck level: their top is absolute, not relative to the ground below. */
const wing = (x: number, z: number) => ({ kind: 'panel' as const, solid: { kind: 'box' as const, x, z, hx: 16, hz: 5, top: 0.3 } });

const props: Prop[] = [
  { kind: 'lander', solid: deckBox(landmarks.lander.x, landmarks.lander.z, 3, 3, 3.4) },
  { kind: 'capsule', solid: deckBox(landmarks.capsule.x, landmarks.capsule.z, 2.2, 2.2, 3) },
  { kind: 'module', solid: deckBox(landmarks.bay.x, landmarks.bay.z, 4, 3, 3.6) },
  { kind: 'cache', solid: deckBox(-11.5, 58, 1.2, 0.8, 1) },
  { kind: 'console', solid: deckBox(11.6, 64, 0.5, 0.8, 1.2) },
  { kind: 'mast', solid: deckCylinder(0, -90.5, 0.35, 7) },
  wing(26, -8), wing(26, 18), wing(26, -44), wing(-66, 36),
  // Handrail lights along the shaded route, so the long way reads at a glance.
  // Posts sit 1.8 m inside the walkway edge, where the deck is fully flat.
  ...[10, -5, -20, -35, -50, -65].map(z => ({ kind: 'marker' as const, solid: deckCylinder(-35.8, z, 0.12, 1.3) })),
  ...[-30, -20, -10].map(x => ({ kind: 'marker' as const, solid: deckCylinder(x, -69.8, 0.12, 1.3) })),
];

const above = (index: number, lift = 0.9) => {
  const s = props[index].solid;
  return { id: '', position: { x: s.x, z: s.z }, y: s.top + lift };
};

export const orbitLevel: LevelV2 = {
  kitVersion: 2, id: 'orbit', mission: 'c1-station',
  title: t('Primera luz', 'First light'), subtitle: t('Estación de recepción', 'Reception station'),
  briefing: t('Coteja la cápsula de Aurora, abre el compartimento protegido y recupera el registrador exterior. Autentica todo en la esclusa.',
    'Cross-check Aurora’s capsule, open the protected bay and recover the external recorder. Authenticate everything at the airlock.'),
  arrival: t('Acople seguro. Botas magnéticas activas; el cable de seguridad te sujeta a la estación.',
    'Docking secure. Magnetic boots on; the safety tether keeps you on the station.'),
  outcome: t('AUR-E01 y AUR-E02 validadas: la cápsula es de Aurora y LUMA viajó con su tripulación. El archivo del relé lunar conserva el tramo de navegación que falta. Rumbo a la Luna.',
    'AUR-E01 and AUR-E02 validated: the capsule is Aurora’s and LUMA travelled with its crew. The lunar relay archive holds the missing navigation segment. Course set for the Moon.'),
  terrain: { size: 256, res: 257, height: orbitHeight },
  // Free fall: the station and everything on it fall around Earth together (about 8.7 m/s² at 400 km).
  realGravity: 0,
  sun: { azimuth: 70, elevation: 35 },
  spawn: { x: 0, z: 67 },
  comms: { center: { x: 0, z: -8 }, radius: 100, falloff: 20 },
  exit: 'airlock',
  companionAfter: 'protected-bay',
  fallLimit: -12,
  points,
  props,
  zones: [
    { id: 'dock', title: t('Puerto de acople', 'Docking port'), center: { x: 0, z: 62 }, radius: 18 },
    { id: 'cradle', title: t('Cuna de recepción', 'Reception cradle'), center: { x: -36, z: 37 }, radius: 16 },
    { id: 'sunlit', title: t('Armadura al sol', 'Sunlit truss'), center: landmarks.sunlit, radius: 30, drain: 0.6, hazard: 'sun' },
    { id: 'shade', title: t('Baranda en sombra', 'Shaded handrail'), center: landmarks.shade, radius: 26 },
    { id: 'boom', title: t('Brazo de antena', 'Antenna boom'), center: { x: 0, z: -85 }, radius: 12 },
  ],
  collectibles: [
    { ...above(0), id: 'echo-ship' },
    { ...above(1), id: 'echo-capsule' },
    { ...above(2), id: 'echo-bay-roof' },
    { id: 'echo-dock-corner', position: { x: 12, z: 78 } },
    { id: 'echo-cradle-corner', position: { x: -46, z: 20 } },
    { id: 'echo-truss-sun', position: { x: 0, z: -30 } },
    { id: 'echo-shade-end', position: { x: -37, z: -60 } },
    { id: 'echo-boom-tip', position: { x: 9, z: -92 } },
  ],
};
