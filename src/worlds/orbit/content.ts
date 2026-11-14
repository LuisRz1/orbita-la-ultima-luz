import { defineWorld, type Localized, type Point, type POI } from '../../kit/contract.ts';
import { validateLoads } from '../../kit/mission.ts';
import { t } from './engineering.ts';

export const chapterTitle=t('Primera luz','First light');
export const solarSource='https://science.nasa.gov/missions/hubble/dark-sky-bright-sun/';
export const navigationSource='https://www.nasa.gov/isam/relative-navigation-system/';
export const mechanicsSource='https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/';
export const p=(x:number,y:number):Point=>({x,y});
const point=(id:string, position:Point, prop:POI['prop'], action:POI['action'],
  title:Localized, hint:Localized, result:Localized, power:number, prerequisites:string[]=[], required=true):POI =>
  ({id,position,prop,action,title,hint,result,power,prerequisites,required});

export const missions = [
  {id:'C1-M01',title:t('Antes de despegar','Before liftoff'),task:t('Lee el aviso de recuperación y prepara una nave viable.','Read the recovery notice and prepare a viable spacecraft.')},
  {id:'C1-M02',title:t('De la Tierra a la órbita','From Earth to orbit'),task:t('Pilota el ascenso guiado y corrige rumbo hacia el corredor de encuentro.','Fly the guided ascent and correct your course toward the rendezvous corridor.')},
  {id:'C1-M03',title:t('Encuentro en la estación','Rendezvous with the station'),task:t('Iguala la velocidad relativa, acopla la nave y coteja el registro de la cápsula.','Match relative velocity, dock, and cross-check the capsule record.')},
  {id:'C1-M04',title:t('La carga inesperada','The unexpected cargo'),task:t('Conoce a LUMA y prepara su descanso, protección y traductor.','Meet LUMA and prepare a resting place, protection and translator.')},
  {id:'C1-M05',title:t('Fuera del casco','Outside the hull'),task:t('Sal con anclaje, contrasta la iluminación y regresa con el registrador.','Go out on a tether, check the lighting, and return with the recorder.')},
  {id:'C1-M06',title:t('Una ruta hacia la Luna','A route to the Moon'),task:t('Planifica el traslado, pilota la salida, acelera el crucero y cierra el informe en el nodo lunar.','Plan the transfer, pilot departure, accelerate cruise, and close the report at the lunar node.')},
] as const;

const mainWorld = {
  kitVersion:1,id:'orbit',title:chapterTitle,landscape:'#172444',
  outcome:t('La pista se registró en el diario.','The lead was entered in the journal.'),
} as const;

export const earth = defineWorld({...mainWorld,mission:'c1-ground',
  subtitle:t('Complejo de lanzamiento','Launch complex'),width:11,height:9,spawn:p(3,6),
  briefing:missions[0].task,arrival:t('Puesto de preparación listo.','Preparation stand ready.'),
  blocked:[p(2,3),p(3,3),p(4,3),p(5,3),p(7,5),p(8,5),p(7,6)],hazards:[],exit:'ground-terminal',
  points:[
    point('launch-gantry',p(8,2),'shuttle','service',t('Lanzadera','Shuttle'),t('Comprueba la carga antes de salir.','Check the payload before leaving.'),
      t('Apoyo en espera.','Support standing by.'),0),
    point('ground-terminal',p(2,6),'console','upload',t('Control de misión','Mission control'),t('Prepara la salida autorizada.','Prepare the authorized departure.'),
      t('Salida autorizada.','Departure authorized.'),0,['launch-gantry']),
  ],
});

export const station = validateLoads(defineWorld({...mainWorld,mission:'c1-station',
  subtitle:t('Hábitat de la estación','Station habitat'),width:13,height:11,spawn:p(2,8),
  briefing:missions[2].task,arrival:t('Acople seguro. Control autoriza entrar al hábitat.','Docking secure. Control authorizes entry into the habitat.'),
  blocked:[p(4,2),p(5,2),p(5,3),p(6,3),p(8,6),p(9,6),p(10,6),p(4,7),p(6,8),p(7,8)],
  hazards:[],exit:'capsule-auth',
  points:[
    point('supplies',p(2,9),'cache','service',t('Transferir suministros','Transfer supplies'),
      t('Confirma el sello del acople y mueve el cargamento al hábitat.','Confirm the docking seal and move the freight into the habitat.'),
      t('Sello íntegro. Suministros bajo presión y a bordo del hábitat.','Seal intact. Supplies are pressurized and inside the habitat.'),2),
    point('capsule',p(5,6),'cache','scan',t('Cotejar cápsula y recepción','Cross-check capsule and receipt'),
      t('Compara el identificador de la cápsula con el registro de recepción.','Compare the capsule identifier with the reception log.'),
      t('Los códigos coinciden con Aurora. Alguien pudo enviarla tras el incidente; no sabemos quién sigue vivo.',
        'The codes match Aurora. Someone was able to send it after the incident; we do not know who is still alive.'),2,['supplies']),
    point('protected-bay',p(7,5),'habitat','service',t('Abrir compartimento protegido','Open the protected bay'),
      t('Comprueba la presión antes de abrir. Algo se mueve al otro lado.','Check pressure before opening. Something is moving on the other side.'),
      t('Una criatura pequeña y dorada asoma dos patas. Retrocede al oír el cierre y vuelve a acercarse.',
        'A small golden creature pokes out two paws. It steps back at the hatch sound, then comes closer.'),1,['capsule']),
    point('rest',p(8,4),'cache','service',t('Preparar un lugar de descanso','Prepare a resting spot'),
      t('Deja una manta cerca del compartimento, lejos de la ventilación.','Leave a blanket by the bay, away from the air vent.'),
      t('La criatura olfatea la manta, gira dos veces y se acomoda. Al rato vuelve a investigar la sala.',
        'The creature sniffs the blanket, turns twice and settles down. Soon it is exploring the room again.'),1,['protected-bay']),
    point('protection',p(10,4),'console','service',t('Ajustar protección ambiental','Fit environmental protection'),
      t('Prepara su cápsula de transporte y comprueba presión y sello.','Prepare the transport pod and check its pressure and seal.'),
      t('Prueba de sello superada. En la EVA se queda dentro; viajará protegido hasta el nodo lunar.',
        'Seal test passed. It stays inside during the EVA and travels to the lunar node under protection.'),2,['protected-bay']),
    point('translator',p(10,2),'relay','scan',t('Calibrar el traductor','Calibrate the translator'),
      t('Repite un saludo y registra la respuesta gestual, sin forzar a la criatura.','Repeat a greeting and record the creature’s response without forcing it.'),
      t('El traductor reconoce un saludo en dos pulsos. LUMA toca el parche de tu hermana: «Ella me enseñó ese saludo».',
        'The translator reads a greeting in two pulses. LUMA touches your sister’s patch: “She taught me that greeting.”'),2,['rest','protection']),
    point('keepsake',p(5,4),'beacon','scan',t('Objeto de tu hermana','Your sister’s keepsake'),
      t('Muestra el parche recuperado de la cápsula y observa a LUMA.','Show the patch recovered from the capsule and watch LUMA.'),
      t('LUMA acerca la frente al parche. «Lo llevaba ella. Se quedaba conmigo hasta que dejaba de temblar».',
        'LUMA leans its brow against the patch. “She wore it. She stayed with me until I stopped shaking.”'),0,['translator'],false),
    point('station-log',p(3,5),'console','scan',t('Historial de recepción','Reception history'),
      t('Revisa cómo la estación atendió y registró la cápsula antes de tu llegada.','Review how the station handled and logged the capsule before you arrived.'),
      t('Control aisló la cápsula para proteger a su ocupante y conservó el registro de recepción independiente.',
        'Control isolated the capsule to protect its occupant and retained an independent receipt log.'),0,['capsule'],false),
    point('capsule-auth',p(9,2),'console','upload',t('Autenticar AUR-E01','Authenticate AUR-E01'),
      t('Relaciona los registros de cápsula y estación con el compartimento y la presencia de LUMA.',
        'Link the capsule and station records to the bay and LUMA’s presence.'),
      t('AUR-E01 validada: cápsula de Aurora y LUMA a bordo en el pasado. Su tripulación sigue sin localizarse.',
        'AUR-E01 validated: Aurora’s capsule and LUMA were together in the past. The crew remains missing.'),0,
      ['supplies','capsule','rest','protection','translator']),
  ],
}));

export const evaRoutes = {
  sheltered:{ title:t('Baranda sombreada','Shaded handrail'),
    description:t('Ruta larga con la baranda señalizada y poco deslumbramiento. Recuperación: 3 u.',
      'A longer route with marked handrails and less glare. Recovery: 3 units.'),
    observation:t('La sombra del módulo es abrupta. La iluminación auxiliar distingue cada apoyo de la baranda.',
      'The module casts a sharp shadow. Work lights identify every handhold.')},
  sunlit:{ title:t('Baranda al Sol','Sunlit handrail'),
    description:t('Ruta más corta; exige visera y una lectura de contraste antes de avanzar. Recuperación: 5 u.',
      'A shorter route; needs a visor and a contrast reading first. Recovery: 5 units.'),
    observation:t('La baranda directa produce reflejos fuertes. La visera y los apoyos marcados permiten trabajar sin apuntar al Sol.',
      'The direct handrail produces strong glare. A visor and marked handholds let you work without looking at the Sun.')},
} as const;
export type EvaRoute = keyof typeof evaRoutes;

const anchor=p(2,7);
function exterior(id:EvaRoute) {
  const walk = id==='sheltered'?
    [p(2,7),p(2,6),p(2,5),p(2,4),p(3,4),p(4,4),p(5,4),p(6,4),p(7,4),p(8,4),p(8,5),p(8,6)]:
    [p(2,7),p(2,6),p(3,6),p(4,6),p(5,6),p(6,6),p(7,6),p(8,6)];
  const points=[
    point('sun-record',p(3,7),'beacon','scan',t('Archivar iluminación','Log illumination'),
      t('Mide en el apoyo de la esclusa y confirma la ruta de baranda que preparaste.',
        'Measure at the airlock handhold and confirm your chosen handrail route.'),evaRoutes[id].observation,2),
    point('compare-light',id==='sheltered'?p(5,3):p(5,5),'relay','scan',t('Lectura comparada','Comparison reading'),
      t('Contrasta el sombreado de la estación con un panel expuesto.','Compare the station shade with an exposed panel.'),
      t('El panel y la baranda tienen contrastes distintos. El diario archiva ambas observaciones.',
        'The panel and handrail show different contrast. The journal records both observations.'),1,['sun-record'],false),
    point('recorder',p(9,6),'cache','salvage',t('Recuperar registrador exterior','Recover the external recorder'),
      t('Sujétate a la baranda y desmonta el registrador que recibió la cápsula.',
        'Stay attached to the handrail and remove the recorder that received the capsule.'),
      t('Registrador en mano. Aún hay que cotejar el código de enlace en la esclusa.',
        'Recorder recovered. The link code still needs to be cross-checked at the airlock.'),id==='sheltered'?3:5,['sun-record']),
    point('airlock',p(2,8),'console','upload',t('Volver y autenticar AUR-E02','Return and authenticate AUR-E02'),
      t('Regresa por la baranda y autentica el enlace con el registrador y la observación archivada.',
        'Return along the handrail and authenticate the link with the recorder and archived observation.'),
      t('AUR-E02 validada: el archivo del relé lunar conserva otro tramo. La navegación dañada sigue sin reconstruirse.',
        'AUR-E02 validated: the lunar relay archive holds another segment. The damaged navigation log is still incomplete.'),0,['sun-record','recorder']),
  ];
  const onHull=new Set([...walk,...points.map(p=>p.position)].map(p=>p.x+','+p.y));
  const blocked=Array.from({length:12*10},(_,i)=>p(i%12,Math.floor(i/12))).filter(p=>!onHull.has(p.x+','+p.y));
  return validateLoads(defineWorld({...mainWorld,mission:'c1-eva-'+id,width:12,height:10,spawn:anchor,
    subtitle:t('Corredor exterior de estación','Station exterior corridor'),briefing:missions[4].task,
    arrival:t('Esclusa proyectada en modo EVA. Anclaje y radio confirmados. LUMA espera en el módulo presurizado.',
      'Airlock in EVA mode. Tether and radio confirmed. LUMA waits inside the pressurized module.'),
    exit:'airlock',points,blocked,hazards:[]}));
}
export const exteriors = {sheltered:exterior('sheltered'),sunlit:exterior('sunlit')};

export const extras = [
  {id:'build-review',text:t('Control · Archivo de alternativas','Control · Alternatives log')},
  {id:'station-log',text:t('Historial de recepción','Reception history')},
  {id:'keepsake',text:t('El parche de tu hermana','Your sister’s patch')},
  {id:'compare-light',text:t('Observación comparada','Comparison observation')},
] as const;
export const discoveries:readonly {stage:string; label:Localized}[] = [
  {stage:'briefing',label:t('Aviso de recuperación','Recovery notice')},
  {stage:'briefing',label:t('Expediente de comunicaciones de Aurora','Aurora communications file')},
  {stage:'build-review',label:t('Ficha de cargas comparadas','Loadout comparison sheet')},
  {stage:'launch',label:t('Telemetría de ascenso','Ascent telemetry')},
  {stage:'dock',label:t('Registro de acople','Docking log')},
  {stage:'supplies',label:t('Manifiesto de suministros','Supply manifest')},
  {stage:'capsule',label:t('Identificador de la cápsula','Capsule identifier')},
  {stage:'station-log',label:t('Libro de recepción','Receipt ledger')},
  {stage:'protected-bay',label:t('Registro de protección del compartimento','Bay protection log')},
  {stage:'keepsake',label:t('Parche de tu hermana','Your sister’s patch')},
  {stage:'translator',label:t('Patrón gestual de LUMA','LUMA gesture pattern')},
  {stage:'sun-record',label:t('Observación de iluminación','Illumination observation')},
  {stage:'compare-light',label:t('Lectura de contraste comparada','Comparison contrast reading')},
  {stage:'recorder',label:t('Registrador exterior de Aurora','Aurora external recorder')},
  {stage:'lunar-approach',label:t('Confirmación de llegada al nodo lunar','Lunar node arrival confirmation')},
];
