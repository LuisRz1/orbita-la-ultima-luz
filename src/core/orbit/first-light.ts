import type { Localized } from '../contract/grid-v1.ts';
import type { SuitDesign } from '../suit.ts';
import { exteriors, station, type EvaRoute } from './content.ts';
import { t, type Design } from './engineering.ts';

// Fictional identifiers. Receipt control, the capsule and the recorder supply separate links in the chain.
export const capsuleId='AUR-RC-04';
export const receptionId='EST-27';
export const archiveId='LUN-ARC-07';

export const recoveryDossier=[
  {
    id:receptionId,
    title:t('Aviso de recuperación','Recovery notice'),
    text:t(`Meses después de suspender la búsqueda de Aurora, la estación recuperó una cápsula de emergencia. La lectura preliminar dio ${capsuleId}; Control te pide confirmarla con el registro de recepción.`,
      `Months after the search for Aurora was suspended, the station recovered an emergency capsule. The preliminary reading returned ${capsuleId}; Control has asked you to verify it against the reception log.`),
  },
  {
    id:'AURORA / COMMS',
    title:t('Expediente de tu hermana','Your sister’s file'),
    text:t('Responsable de comunicaciones y operaciones de campo. Su expediente sigue abierto, junto con el del resto de la tripulación. La cápsula permite reabrir la búsqueda.',
      'Communications and field operations specialist. Her case remains open alongside the rest of the crew. The capsule lets Control reopen the search.'),
  },
] as const;

export const launchRequest=t('Pilotas la nave de apoyo. Reconstruye el trayecto de Aurora, busca a tu hermana y trae de vuelta a quienes sigan con vida.',
  'You will pilot the support craft. Reconstruct Aurora’s route, find your sister and bring home everyone still alive.');
export const firstLightClosure=t(`El nodo lunar confirmó el archivo ${archiveId}. Allí puede estar el tramo de navegación que falta. La supervivencia de la tripulación sigue por comprobar.`,
  `The lunar node confirmed archive ${archiveId}. It may hold the missing navigation segment. The crew’s survival is still unconfirmed.`);
export const firstLightCabinLine=t('¿Puedes dejar la luz encendida? Me dormí un momento. Quiero estar despierto cuando lleguemos.',
  'Can you leave the light on? I fell asleep for a moment. I want to be awake when we arrive.');

export const pendingFirstLightEvidence={
  'AUR-E01':t(`Identificador ${capsuleId} cotejado con ${receptionId}. Falta verificar el registro del compartimento protegido.`,
    `Identifier ${capsuleId} matches ${receptionId}. The protected bay record still needs to be verified.`),
  'AUR-E02':t('Registrador exterior recuperado. Vuelve a la esclusa para comprobar la firma del enlace.',
    'External recorder recovered. Return to the airlock to verify the link signature.'),
} as const;

export const firstLightFlightRadio:Record<string,Localized>={
  launch:t('Apoyo Uno, Control te sigue desde tierra. Al alcanzar el corredor, la estación tomará el enlace.',
    'Support One, ground control is tracking you. The station will take over the link when you reach the corridor.'),
  dock:t('La cápsula está en la bodega de recepción. Iguala velocidad con el puerto antes de abrir el sello.',
    'The capsule is in the reception hold. Match the port’s velocity before opening the seal.'),
  'moon-depart':t(`El registrador confirmó ${archiveId}. LUMA viaja en su compartimento presurizado. Libera el corredor antes de acelerar el crucero.`,
    `The recorder confirmed ${archiveId}. LUMA is in his pressurized compartment. Clear the corridor before starting cruise.`),
  'moon-arrive':t('El nodo respondió al código del registrador. Frena y alinea el acople para entregar ambas pruebas a Control.',
    'The node responded to the recorder’s code. Brake and align for docking to hand both records to Control.'),
};

export function firstLightSuit(design:Design):SuitDesign{
  // Both vehicle proposals carry the mandatory recovery and illumination tools.
  // Battery reserve and the mass of the corresponding field kit still affect the sortie.
  return {
    battery:design.battery==='expanded'?'extended':'standard',
    thruster:design.battery==='expanded'?'none':'compact',
    antenna:'medium',
    instruments:['camera','drill','kit'],
  };
}

export const evaRouteLength:Record<EvaRoute,number>={sheltered:109,sunlit:89};
export const sunlitCoolingDrain = .12;
export const visorSource='https://www.nasa.gov/centers-and-facilities/johnson/spacewalk-spacesuit-basics/';

export function validFirstLightField(id:'station'|'eva',points:readonly string[],route:EvaRoute){
  const world=id==='station'?station:exteriors[route];
  const done=new Set<string>();
  for(const item of points){
    const point=world.points.find(p=>p.id===item);
    if(!point||done.has(item)||done.has(world.exit)||point.prerequisites.some(pre=>!done.has(pre))||
      item===world.exit&&world.points.some(p=>p.required&&p.id!==item&&!done.has(p.id)))return false;
    done.add(item);
  }
  return done.has(world.exit);
}
