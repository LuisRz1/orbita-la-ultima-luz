// Mars level, chapter 3 surface sortie (C3-M03–M05, closed by the joint authentication of M06).
// Story rules (brain/02-Diseno/HISTORIA-PRINCIPAL.md): each point only reports what it recovers. The field records
// predate Aurora's encounter with LUMA, and no point names the destination: Bennu is revealed only when the terminal
// authenticates AUR-E04 and AUR-E05 together. M04 (outcrop + field kit) and M05 (relay) can be done in either order.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { LevelPoint, LevelV2, Prop } from '../../core/contract/level-v2.ts';
import { marsSpecimens } from './atlas.ts';
import { channelZ, landmarks, marsHeight } from './terrain.ts';

const t = (es: string, en: string): Localized => ({ es, en });

function point(id: string, x: number, z: number, zone: string, prop: LevelPoint['prop'], action: LevelPoint['action'],
  title: Localized, hint: Localized, result: Localized, power: number, required: boolean, prerequisites: string[] = [], radius = 3): LevelPoint {
  return { id, position: { x, z }, radius, zone, prop, action, title, hint, result, power, required, prerequisites };
}

const points: LevelPoint[] = [
  point('habitat', -18, 50.5, 'camp', 'habitat', 'service', t('Hábitat de Aurora', 'Aurora habitat'),
    t('Reactiva la energía y el soporte vital del hábitat.', 'Restore the habitat’s power and life support.'),
    t('Hábitat operativo. LUMA: «Huele a tu hermana. A sus cosas, no a ella».', 'Habitat running. LUMA: “It smells of your sister. Of her things, not of her.”'), 3, true),
  point('logbook', -23.5, 56, 'camp', 'console', 'scan', t('Bitácora de tu hermana', 'Your sister’s log'),
    t('Con el hábitat encendido, lee su registro de campo.', 'With the habitat powered, read her field log.'),
    t('Registro base recuperado: el equipo detectó una baliza de origen desconocido. El mapa de campo está incompleto.',
      'Base record recovered: the team detected a beacon of unknown origin. The field map is incomplete.'), 1, true, ['habitat'], 2.6),
  point('outcrop', 36, -6, 'mesa', 'rock', 'scan', t('Afloramiento estratificado', 'Layered outcrop'),
    t('Escanea las capas al pie de la meseta: el equipo de Aurora las midió.', 'Scan the layers at the foot of the mesa: Aurora’s team measured them.'),
    t('Capas sedimentarias registradas: agua antigua las depositó. Las marcas de muestreo de Aurora siguen hacia el norte.',
      'Sedimentary layers recorded: ancient water laid them down. Aurora’s sampling marks lead north.'), 2, true),
  point('field-kit', 6, -80, 'head', 'cache', 'salvage', t('Equipo de campo de Aurora', 'Aurora field kit'),
    t('Recupera la copia de navegación y el registro de detección de la baliza.', 'Recover the navigation copy and the beacon detection log.'),
    t('Copia de navegación recuperada, fechada antes del desvío. Todavía no dice adónde fueron.',
      'Navigation copy recovered, dated before the diversion. It does not say yet where they went.'), 3, true),
  point('relay', -52, -34, 'relay', 'relay', 'service', t('Relé del valle', 'Valley relay'),
    t('Restablece el relé: guarda mensajes que nunca llegaron a la Tierra.', 'Restore the relay: it holds messages that never reached Earth.'),
    t('Relé en línea. Hay un mensaje de emergencia almacenado; su integridad se comprobará al transmitir.',
      'Relay online. An emergency message is stored; its integrity will be checked on transmission.'), 5, true),
  point('mesa', 52, -8, 'mesa', 'beacon', 'scan', t('Mirador de la meseta', 'Mesa overlook'),
    t('Sube por la rampa del suroeste y observa el valle.', 'Climb the south-west ramp and survey the valley.'),
    t('Desde arriba se ven los dos caminos de vuelta: por las dunas o por los vados de los extremos.',
      'From up here you can see both ways home: across the dunes or through the fords at either end.'), 1, false),
  point('terminal', -10, 62, 'camp', 'console', 'upload', t('Terminal del hábitat', 'Habitat terminal'),
    t('Transmite el registro, la ciencia y el mensaje cuando los tengas todos.', 'Transmit the log, the science and the message once you have them all.'),
    t('Paquete enviado. Control autentica los registros juntos.', 'Package sent. Control authenticates the records together.'), 0, true,
    ['habitat', 'logbook', 'outcrop', 'field-kit', 'relay'], 2.6),
];

const ground = (x: number, z: number) => marsHeight(x, z);
const box = (x: number, z: number, hx: number, hz: number, height: number) =>
  ({ kind: 'box' as const, x, z, hx, hz, top: ground(x, z) + height });
const cylinder = (x: number, z: number, r: number, height: number) =>
  ({ kind: 'cylinder' as const, x, z, r, top: ground(x, z) + height });

/** Rock steps up both walls of the channel: a way out for anyone who falls in. */
function channelSteps(x0: number, side: 1 | -1) {
  const floor = ground(x0, channelZ(x0));
  return [1, 2, 3].map(k => {
    const x = x0 + Math.sign(x0) * (k - 1) * 2.1;
    const z = channelZ(x) + side * 5.2;
    return { kind: 'step' as const, solid: { kind: 'box' as const, x, z, hx: 0.9, hz: 0.9, top: floor + 2.1 * k } };
  });
}

/** Lit posts marking the walkable way home through each ford. */
const ford = (x: number) => [-12, 0, 12].map(dz => ({ kind: 'marker' as const, solid: cylinder(x, channelZ(x) + dz, 0.12, 1.3) }));

const props: Prop[] = [
  { kind: 'lander', solid: box(landmarks.lander.x, landmarks.lander.z, 3, 3, 3.4) },
  { kind: 'habitat', solid: box(landmarks.habitat.x, landmarks.habitat.z, 4, 2.6, 3.2) },
  { kind: 'rover', solid: box(14, 54, 1.5, 2.3, 1.9) },
  { kind: 'console', solid: box(-10, 65, 0.5, 0.8, 1.2) },
  { kind: 'mast', solid: cylinder(-49.8, -32.4, 0.35, 9) },
  { kind: 'cache', solid: box(6, -83, 1.2, 0.8, 1) },
  { kind: 'pillar', solid: cylinder(-34, 36, 1.3, 5) },
  { kind: 'pillar', solid: cylinder(26, -40, 1.2, 4) },
  { kind: 'boulder', solid: cylinder(-44, 58, 2.2, 2.6) },
  { kind: 'boulder', solid: cylinder(70, 36, 1.8, 2.2) },
  { kind: 'rock', solid: cylinder(30, 48, 1, 1.1) },
  { kind: 'rock', solid: cylinder(-20, -30, 1.2, 1.3) },
  { kind: 'rock', solid: cylinder(-30, -64, 0.9, 1) },
  ...ford(-60), ...ford(62),
  ...channelSteps(-8, 1), ...channelSteps(8, -1),
];

const above = (index: number, lift = 0.9) => {
  const s = props[index].solid;
  return { id: '', position: { x: s.x, z: s.z }, y: s.top + lift };
};

const dustStorm = t('Control: un frente de polvo cruza las dunas. El camino directo gastará mucha batería: rodéalo por los vados o espera a que pase.',
  'Control: a dust front is crossing the dunes. The direct way will drain a lot of battery: go around through the fords or wait it out.');

export const marsLevel: LevelV2 = {
  kitVersion: 2, id: 'mars', mission: 'c3-surface',
  title: t('El mundo rojo', 'The red world'), subtitle: t('Valle de Aurora', 'Aurora valley'),
  briefing: t('Reactiva el hábitat de Aurora, estudia el valle y restablece el relé. Transmite todo desde el terminal del hábitat.',
    'Restore Aurora’s habitat, study the valley and bring the relay back. Transmit everything from the habitat terminal.'),
  arrival: t('Aterrizaje confirmado junto al campamento de Aurora. El viento empuja el polvo contra el visor.',
    'Landing confirmed beside Aurora’s camp. The wind pushes dust against your visor.'),
  outcome: t('Registros autenticados juntos: Aurora se desvió hacia Bennu siguiendo la baliza. El mensaje fechado confirma supervivientes, entre ellos tu hermana. La nave se prepara para el rescate.',
    'Records authenticated together: Aurora diverted to Bennu following the beacon. The dated message confirms survivors, your sister among them. The ship is being prepared for the rescue.'),
  terrain: { size: 256, res: 257, height: marsHeight },
  realGravity: 3.71,
  sun: { azimuth: 250, elevation: 22 },
  spawn: { x: 0, z: 67 },
  comms: { center: { x: 0, z: 0 }, radius: 100, falloff: 20 },
  exit: 'terminal',
  specimens: marsSpecimens,
  points,
  props,
  zones: [
    { id: 'camp', title: t('Campamento de Aurora', 'Aurora camp'), center: { x: -8, z: 62 }, radius: 22 },
    { id: 'channel', title: t('Cauce seco', 'Dry channel'), center: { x: 0, z: channelZ(0) }, radius: 14 },
    { id: 'dunes', title: t('Campo de dunas', 'Dune field'), center: landmarks.dunes, radius: 22, drain: 0.3, hazard: 'dust',
      surge: { after: 'relay', drain: 1.6, warning: dustStorm } },
    { id: 'mesa', title: t('Meseta estratificada', 'Layered mesa'), center: landmarks.mesa, radius: 20 },
    { id: 'relay', title: t('Colina del relé', 'Relay hill'), center: landmarks.relayHill, radius: 18 },
    { id: 'head', title: t('Cabecera del valle', 'Valley head'), center: { x: 6, z: -78 }, radius: 16 },
  ],
  collectibles: [
    { ...above(1), id: 'echo-habitat' },
    { ...above(2), id: 'echo-rover' },
    { ...above(6), id: 'echo-hoodoo-south' },
    { ...above(7), id: 'echo-hoodoo-north' },
    { ...above(8), id: 'echo-boulder' },
    { id: 'echo-mesa-top', position: { x: 54, z: -12 } },
    { id: 'echo-channel-floor', position: { x: 2, z: channelZ(2) } },
    { id: 'echo-relay-hill', position: { x: -56, z: -38 } },
  ],
};
