// Bennu extraction, chapter 4 M04 «Preparar el regreso» and M05 «Todavía hay camino». Same site as the Bennu sortie.
// Story rules (brain/02-Diseno/ARCO-LUMA-SPOILERS.md): everyone is aboard and checked before the last undocking; the
// incident is a narrative fault of a hypothetical facility, not a hazard observed at Bennu; LUMA chooses to free the
// mechanism through a duct the suit cannot fit; the player carries it to the safe compartment. No hidden requirement,
// no misleading choice, no random death. The return to Earth (M06) is told in the outcome until 3D flight exists.
import type { Localized } from '../../core/contract/grid-v1.ts';
import type { LevelPoint, LevelV2, Prop } from '../../core/contract/level-v2.ts';
import { bennuLevel } from '../bennu/level.ts';
import { bennuHeight, landmarks } from '../bennu/terrain.ts';

const t = (es: string, en: string): Localized => ({ es, en });

function point(id: string, x: number, z: number, zone: string, prop: LevelPoint['prop'], action: LevelPoint['action'],
  title: Localized, hint: Localized, result: Localized, power: number, required: boolean, prerequisites: string[] = [], radius = 3): LevelPoint {
  return { id, position: { x, z }, radius, zone, prop, action, title, hint, result, power, required, prerequisites };
}

/** The fictional service facility beside the extraction site, where the last undocking happens. */
export const facility = { x: 34, z: -70 };

const points: LevelPoint[] = [
  point('boarding', 0, -63, 'hollow', 'habitat', 'service', t('Trasladar a los supervivientes', 'Move the survivors'),
    t('Guía a los cuatro por la ruta estable del oeste hasta el vehículo.', 'Guide the four of them along the stable west route to the vehicle.'),
    t('Los cuatro van de camino al vehículo por la cresta de grava.', 'The four are on their way to the vehicle along the gravel ridge.'), 2, true),
  point('cargo', -16, -64, 'hollow', 'console', 'salvage', t('Asegurar archivo y muestra', 'Secure archive and sample'),
    t('Guarda el archivo de Aurora y la muestra para el informe.', 'Stow Aurora’s archive and the sample for the report.'),
    t('Carga asegurada: archivo y muestra.', 'Cargo secured: archive and sample.'), 1, true),
  point('life-support', 7, 70, 'contact', 'console', 'service', t('Soporte vital del vehículo', 'Vehicle life support'),
    t('Comprueba el soporte vital con todos a bordo.', 'Check life support with everyone aboard.'),
    t('Todos a bordo y estables. Soporte vital comprobado para el viaje de vuelta.', 'Everyone aboard and stable. Life support checked for the journey home.'), 2, true, ['boarding']),
  point('reserves', -7, 70, 'contact', 'relay', 'scan', t('Reservas de retorno', 'Return reserves'),
    t('Revisa propelente y reservas para volver todos.', 'Review propellant and reserves for everyone to return.'),
    t('Reservas suficientes para el regreso a la Tierra con todos.', 'Reserves enough for the return to Earth with everyone.'), 1, true, ['boarding']),
  point('undock', facility.x, facility.z, 'facility', 'beacon', 'service', t('Última desconexión', 'Last undocking'),
    t('Suelta el vehículo del módulo de servicio. Es lo último antes de irse.', 'Release the vehicle from the service module. It is the last thing before leaving.'),
    t('Seguro liberado desde dentro del conducto.', 'Latch released from inside the duct.'), 2, true, ['life-support', 'reserves', 'cargo']),
  point('safe-bay', 0, 70, 'contact', 'habitat', 'upload', t('Compartimento seguro', 'Safe compartment'),
    t('Lleva a LUMA al compartimento seguro del vehículo.', 'Carry LUMA to the vehicle’s safe compartment.'),
    t('LUMA está en el compartimento seguro. Nave liberada.', 'LUMA is in the safe compartment. Ship released.'), 0, true, [], 2.8),
];

const ground = (x: number, z: number) => bennuHeight(x, z);
const box = (x: number, z: number, hx: number, hz: number, height: number) =>
  ({ kind: 'box' as const, x, z, hx, hz, top: ground(x, z) + height });

const props: Prop[] = [
  // Everything of the Bennu site except its sortie-only pieces, plus the service facility and its duct.
  ...bennuLevel.props.filter(p => p.kind !== 'cache' && p.kind !== 'mast'),
  { kind: 'module', solid: box(facility.x + 5, facility.z - 2, 3, 6, 4.6) },
  { kind: 'step', solid: box(facility.x + 1.6, facility.z + 4.5, 0.5, 0.5, 0.9) },
];

export const extractionLevel: LevelV2 = {
  ...bennuLevel,
  id: 'extraction', mission: 'c4-extraction',
  title: t('Todavía hay camino', 'There is still a way'), subtitle: t('Evacuación de Aurora', 'Aurora evacuation'),
  briefing: t('Traslada a los supervivientes, comprueba soporte vital, reservas y carga, y haz la última desconexión.',
    'Move the survivors, check life support, reserves and cargo, and do the last undocking.'),
  arrival: t('El refugio se vacía. Tu hermana va delante, por la cresta de grava.', 'The refuge empties. Your sister goes ahead along the gravel ridge.'),
  outcome: t('AUR-E07: tu hermana y los otros tres supervivientes llegan a la Tierra y son recibidos a salvo. Se entregan el archivo, la muestra y el informe. LUMA tiene un lugar de recuerdo en la nave.',
    'AUR-E07: your sister and the other three survivors reach Earth and are received safely. The archive, the sample and the report are delivered. LUMA has a place of remembrance on the ship.'),
  spawn: { x: 0, z: -54 },
  exit: 'safe-bay',
  points,
  props,
  specimens: undefined,
  carryAfter: 'undock',
  // Four survivors, the sister first; they take the stable west route to the vehicle.
  crew: {
    boardAfter: 'boarding',
    members: [
      { id: 'sister', sister: true, at: { x: -3, z: -59 } }, { id: 'crew-2', at: { x: 3, z: -60 } },
      { id: 'crew-3', at: { x: -5, z: -62 } }, { id: 'crew-4', at: { x: 5, z: -63 } },
    ],
    route: [{ x: -24, z: -60 }, { x: -42, z: -42 }, { x: -46, z: -20 }, { x: -44, z: 14 }, { x: -30, z: 40 }, { x: -6, z: 72 }],
  },
  farewell: true,
  zones: [
    ...bennuLevel.zones,
    { id: 'facility', title: t('Instalación de servicio', 'Service facility'), center: facility, radius: 12 },
  ],
  collectibles: [],
};
void landmarks;
