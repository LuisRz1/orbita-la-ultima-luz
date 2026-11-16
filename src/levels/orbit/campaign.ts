import type { LevelPoint, LevelV2, Prop } from '../../core/contract/level-v2.ts';
import type { POI, World } from '../../core/contract/grid-v1.ts';
import { chapterTitle, earth as groundPlan, exteriors, station as stationPlan, type EvaRoute } from '../../core/orbit/content.ts';
import { people } from '../../core/campaign.ts';
import { archiveId, capsuleId, receptionId, sunlitCoolingDrain } from '../../core/orbit/first-light.ts';
import { recordedLuma, type Line } from '../moon/dialogue.ts';
import { orbitDialogue } from './dialogue.ts';
import { at, mound, point, scenery, smooth, t, zone } from '../expedition-shapes.ts';

const portHeight=(x:number,z:number)=>{
  const apron=1-smooth(9,22,Math.abs(x-9));
  return (1-apron)*(mound(x,z,-73,-50,63,12)+mound(x,z,68,44,44,7))+.18*Math.cos(x/9)*Math.sin(z/13)
    +14*smooth(111,140,Math.hypot(x,z));
};
const dockHeight=()=>0;
const groundProp=scenery(portHeight);
const deckProp=scenery(dockHeight);
const padProps=[
  groundProp('lander',36,-36,4,4,5.5), groundProp('mast',6,-50,.48,0,17), groundProp('shelter',-21,19,6,5,3.8),
  groundProp('shelter',34,29,6,4,3.4), groundProp('shelter',-52,-25,8,6,5.5), groundProp('console',3,33,.7,.5,1.2),
  groundProp('shelter',63,-39,10,5,6), groundProp('boulder',-47,62,4,0,3), groundProp('shelter',-39,48,7,5,4),
  groundProp('pillar',-31,-34,1.1,0,4), groundProp('pillar',57,13,.8,0,3),
];
const course=(prefix:string,cells:readonly [number,number][])=>cells.map(([x,z],i)=>({id:prefix+'-'+i,position:at(x,z)}));
const template={kitVersion:2,id:'orbit',title:chapterTitle,sun:{azimuth:120,elevation:29}} as const;
export const groundLevel:LevelV2={
  ...template,mission:'campaign-ground',subtitle:groundPlan.subtitle,realGravity:9.81,attire:'civilian',
  movement:{gravityUp:9.81,gravityDown:12,jumpSpeed:3.7},
  briefing:t('Control ha reabierto la búsqueda de Aurora. Consulta el expediente de recuperación en la terminal.','Mission Control has reopened the search for Aurora. Read the recovery file at the terminal.'),
  arrival:t('Control a Apoyo Uno. La estación recuperó una cápsula con el código de Aurora. Cruza el patio hasta la terminal iluminada. Tu hermana figura en el expediente.',
    'Mission Control to Support One. The station recovered a capsule with Aurora’s code. Cross the plaza to the lit terminal. Your sister is in the file.'),
  terrain:{size:288,res:161,height:portHeight},spawn:at(5,58),comms:{center:at(0,0),radius:110,falloff:19},
  zones:[zone('plaza',groundPlan.subtitle,0,45,20),zone('pad',t('Pista de lanzamiento','Launch runway'),34,-37,44),
    zone('hangars',t('Patio de hangares','Hangar yard'),-43,4,27),zone('lookout',t('Mirador de seguimiento','Tracking overlook'),-58,-53,22)],
  exit:'control',outcome:t('Control recibió tu identificación. Puedes abrir el expediente de Aurora.','Control received your ID. You can open the Aurora file.'),
  points:[
    point('gantry','pad',38,-31,'service',t('Inspeccionar lanzadera','Inspect shuttle'),
      t('El carenado protege los instrumentos hasta superar la atmósfera.','The fairing protects the instruments until the spacecraft leaves the atmosphere.'),[],0,false),
    point('lookout','lookout',-52,-46,'service',t('Abrir mapa de seguimiento','Open tracking map'),
      t('Los puestos siguen la misma nave hasta que otra estación toma el enlace.','The sites track the same spacecraft until another station takes over.'),[],0,false),
    point('control','plaza',5,34,'upload',t('Acceder a Control de misión','Access Mission Control'),
      t('Control te da acceso al aviso de recuperación y al expediente de tu hermana.','Mission Control grants access to the recovery notice and your sister’s file.')),
  ],
  props:padProps,collectibles:course('ground-echo',[[-41,41],[-59,-51],[43,-25],[53,30]]),
};

export const departureLevel:LevelV2={
  ...groundLevel,mission:'campaign-departure',title:t('La partida de Aurora','Aurora’s departure'),
  subtitle:t('Tierra · día del lanzamiento','Earth · launch day'),spawn:at(5,52),
  briefing:t('Tu hermana parte con Aurora. Despídete de ella en el patio.','Your sister is leaving with Aurora. Say goodbye to her in the plaza.'),
  arrival:t('Tu hermana te espera al final del camino.','Your sister is waiting at the end of the path.'),
  outcome:t('Tu hermana cruza el patio rumbo a la lanzadera. Aurora parte.','Your sister crosses the plaza toward the shuttle. Aurora departs.'),
  exit:'sister-goodbye',points:[{
    ...point('sister-goodbye','plaza',5,39,'upload',t('Despedirte de tu hermana','Say goodbye to your sister'),
      t('Aurora está lista para despegar.','Aurora is ready for launch.')),
    verb:t('Hablar','Talk'),
  }],
  crew:{members:[{id:'sister',sister:true,uniform:'flight',at:at(5,38)}],boardAfter:'sister-goodbye',
    route:[at(7,28),at(34,-29)]},
  props:[...padProps,...[48,42,36].map(z=>groundProp('marker',2.8,z,.14,0,1.15))],
  collectibles:[],
};

export const departureDialogue:Record<string,Line[]>={
  'point:sister-goodbye':[
    {speaker:'SISTER',text:t('Mira mi parche. Lo cosí torcido. Si ves la transmisión, así sabrás cuál soy.',
      'Look at my patch. I sewed it on crooked. If you watch the broadcast, you’ll know which one is me.')},
    {speaker:'SISTER',text:t('Guárdame un sitio junto a ti, donde se vea la pista. Cuando volvamos, nos sentamos ahí.',
      'Save me a spot beside you where we can see the runway. We’ll sit there when we get back.')},
  ],
};

type Placement=Record<string,[number,number,string]>;
function place(world:World,positions:Placement,adjust:(p:POI)=>Partial<POI> = ()=>({})):LevelPoint[]{
  return world.points.map(p=>{
    const [x,z,sector]=positions[p.id];
    const {position:_,...rules}={...p,...adjust(p)};
    return {...rules,position:at(x,z),zone:sector,radius:3};
  });
}
const stationSpots:Placement={supplies:[-44,30,'dock'],capsule:[-34,4,'cargo'],'protected-bay':[5,1,'clinic'],
  rest:[13,12,'clinic'],protection:[16,-27,'control'],translator:[33,2,'lab'],keepsake:[28,19,'lab'],
  'station-log':[-18,-23,'cargo'],'capsule-auth':[7,-41,'control']};
const row=(zs:number[],x:number)=>zs.map(z=>deckProp('pillar',x,z,.46,0,2.8));
function cabinets(positions:Placement):Prop[]{
  return Object.entries(positions).map(([id,[x,z]])=>id==='protected-bay'?
    deckProp('shelter',x+4,z,1.5,1.5,2.4):deckProp(id==='supplies'||id==='recorder'?'cache':'console',x+2.2,z,.6,.6,1.15));
}
const stationActions:Record<string,Partial<POI>>={
  capsule:{
    result:t(`El número ${capsuleId} coincide con el acta ${receptionId}. En el estuche de comunicaciones está el parche de tu hermana y el registro de traslado de un ocupante al compartimento protegido.`,
      `Serial ${capsuleId} matches log ${receptionId}. The communications case holds your sister’s patch and a record of one occupant transferred to the protected bay.`),
  },
  'protected-bay':{
    result:t('Presión igualada. Algo dorado apoya dos patas en el borde de la escotilla. Da un paso atrás al oír el cierre y vuelve a asomarse.',
      'Pressure equalized. Something golden rests two paws on the hatch rim. It steps back at the sound of the latch, then peeks out again.'),
  },
  rest:{
    result:t('Al extender la manta, la criatura sale por su cuenta. Olfatea la tela, da una vuelta y se acomoda.',
      'When you spread out the blanket, the creature ventures out on its own. It sniffs the fabric, turns once and settles down.'),
  },
  protection:{
    result:t('Sello y presión correctos. Tras el cotejo, la estación puede llevarlo protegido a la nave. Durante la EVA esperará dentro.',
      'Seal and pressure checks passed. After verification, the station can move him safely aboard. He will wait inside during the spacewalk.'),
  },
  translator:{
    hint:t('Da dos toques suaves y registra cómo responde a tu saludo.','Tap twice gently and record his response to your greeting.'),
    result:t('El animal devuelve los dos pulsos. Se acerca al parche que recogiste y el traductor reconoce su primer saludo.',
      'The animal returns the two pulses. It approaches the patch you recovered, and the translator recognizes its first greeting.'),
  },
  'capsule-auth':{
    result:t(`AUR-E01 validada. ${capsuleId}, ${receptionId} y el traslado de LUMA coinciden. El canal exterior registró una señal aparte; necesitas su memoria para seguir a Aurora.`,
      `AUR-E01 validated. ${capsuleId}, ${receptionId} and LUMA’s transfer record match. The exterior channel captured a separate signal. Its memory is needed to follow Aurora.`),
  },
};
export const stationLevel:LevelV2={
  ...template,mission:'campaign-station',subtitle:stationPlan.subtitle,realGravity:0,
  briefing:stationPlan.briefing,
  arrival:t('Acople confirmado. Transfiere el equipo por el andén y coteja la cápsula en recepción. El acta original está en el lector.',
    'Docking confirmed. Transfer the gear across the deck and verify the capsule at reception. The original log is in the reader.'),
  outcome:t('La cápsula y la presencia de LUMA están verificadas. Prepara el acceso al registrador exterior.',
    'The capsule and LUMA’s presence are verified. Prepare to reach the exterior recorder.'),
  terrain:{size:196,res:129,height:dockHeight},spawn:at(-44,35),comms:{center:at(0,0),radius:74,falloff:16},
  pressurizedBay:{min:at(-57,-56),max:at(57,48),ceiling:12.8},
  companionBerth:{hatch:at(5.65,2.35),rest:at(14.3,12),secured:at(11,-41)},
  zones:[zone('dock',t('Andén de acople','Docking deck'),-45,33,19),zone('cargo',t('Almacén presurizado','Pressurized stores'),-30,-3,27),
    zone('clinic',t('Compartimento protegido','Protected bay'),11,0,24),zone('lab',t('Laboratorio de enlace','Link laboratory'),35,12,21),
    zone('control',t('Control y esclusas','Control and airlocks'),7,-41,25)],
  exit:stationPlan.exit,
  points:place(stationPlan,stationSpots,p=>({...stationActions[p.id],power:p.action==='scan'?Math.min(p.power,1):p.power})),
  props:[...cabinets(Object.fromEntries(Object.entries(stationSpots).filter(([id])=>!['capsule','protected-bay','rest','protection'].includes(id)))),
    deckProp('recovery-capsule',-36.25,4,1.5,1.2,1.55), deckProp('recovery-capsule',7.1,2.35,1.1,1.1,1.28),
    deckProp('animal-berth',14.3,12,.76,.58,.29), deckProp('animal-berth',16,-29,1.18,.9,1.12),
    deckProp('animal-berth',11,-41,.95,.8,1.05), ...row([-51,-25,13,43],-27),...row([-54,-27,18,43],26),
    deckProp('lander',-43,43,4,4,4.3),deckProp('shelter',-32,-20,7,4,4.1),deckProp('shelter',21,-41,8,5,4),
    deckProp('shelter',-3,31,5,5,3.3),deckProp('shelter',48,-4,6,4,4),deckProp('mast',-3,-45,.35,0,7)],
  collectibles:course('station-echo',[[-35,23],[-44,-27],[10,32],[31,-47],[47,13]]),
};

export function evaLevel(route:EvaRoute):LevelV2 {
  const world=exteriors[route],shaded=route==='sheltered';
  const anchors=shaded?[at(-35,29),at(-40,7),at(-20,-11),at(3,-15),at(24,-17),at(39,-15)]:
    [at(-35,29),at(-18,20),at(0,11),at(20,1),at(39,-15)];
  const slots:Placement={'sun-record':[-35,25,'lock'],'compare-light':shaded?[-19,-12,'work']:[3,10,'work'],
    recorder:[34,-13,'relay'],airlock:[-38,34,'lock']};
  const observations:Record<string,Partial<POI>>={
    'sun-record':{
      title:t('Medir luz y sombra con el fotómetro','Measure light and shadow with the light meter'),
      result:shaded?t('El panel iluminado satura el visor. En sombra los apoyos se distinguen con las luces de trabajo. Sigue la línea cian.',
        'The lit panel overwhelms the visor. Work lights make the grips visible in shadow. Follow the cyan line.'):
        t('La lectura al Sol tiene reflejos intensos. Confirma la visera y sigue la línea ámbar por el borde de los paneles.',
          'The sunlit reading shows strong glare. Check your visor and follow the amber line along the panel edges.'),
    },
    recorder:{result:t('Registrador recuperado. La memoria sigue sellada. Llévala a la esclusa para cotejar el código con el registro de la cápsula.',
      'Recorder recovered. The memory is still sealed. Carry it to the airlock to match the code against the capsule record.')},
    airlock:{result:t(`AUR-E02 validada. El código recuperado coincide con ${archiveId}, el archivo de un relé lunar. La siguiente parte de la ruta sigue sin leerse.`,
      `AUR-E02 validated. The recovered code matches ${archiveId}, a lunar relay archive. The next part of the route remains unread.`)},
  };
  return {
    ...template,mission:'campaign-eva-'+route,subtitle:world.subtitle,realGravity:0,
    briefing:world.briefing,arrival:world.arrival,outcome:world.outcome,
    terrain:{size:155,res:97,height:dockHeight},spawn:at(-35,30),comms:{center:at(0,0),radius:65,falloff:9},
    anchorCourse:{anchors,length:17,accent:shaded?'#86e2dc':'#ffca86'},exit:world.exit,points:place(world,slots,p=>observations[p.id]??{}),
    zones:[zone('lock',t('Esclusa','Airlock'),-35,29,16),
      {...zone('work',world.subtitle,0,-3,40,shaded?undefined:sunlitCoolingDrain),hazard:'sun'},
      zone('relay',t('Brazo del relé','Relay arm'),34,-13,18)],
    props:[...cabinets(slots),...anchors.map(a=>deckProp('marker',a.x,a.z,.18,0,1.6)),
      deckProp('shelter',-47,30,4,4,4.3),deckProp('mast',40,-15,.35,0,9),
      deckProp('solar-rack',-29,24,4.8,2.4,2.6),deckProp('solar-rack',10,shaded?-9:8,7.5,2.4,3.1),
      deckProp('solar-rack',28,shaded?-21:-5,4.8,2.4,2.7),
      deckProp('shelter',-33,shaded?4:10,2.8,4,2.35)],
    collectibles:course('eva-echo',shaded?[[-37,4],[0,-20],[38,-19]]:[[-19,19],[7,12.2],[39,-17]]),
  };
}

const receiptSpots=[at(-5,36),at(0,32),at(9,32)];
export const earthLevel:LevelV2={
  ...groundLevel,mission:'campaign-earth',title:t('Las cosas que quedan','The things that remain'),
  attire:undefined,movement:undefined,
  subtitle:t('Centro de recepción terrestre','Earth reception centre'),spawn:at(5,47),
  briefing:t('Acompaña a Aurora al puesto de recepción y entrega los resultados.','Escort Aurora to reception and hand over the results.'),
  arrival:t('Aurora está en casa. Comprueba la recepción de las tres personas del manifiesto.','Aurora is home. Verify reception of all three people on the manifest.'),
  outcome:t('Aurora ha vuelto. Las muestras, lecturas y recuerdos de la expedición están a salvo.','Aurora has returned. Samples, readings and memories from the expedition are safe.'),
  exit:'receipts',
  points:[
    ...people.map((p,i)=>{const {x,z}=receiptSpots[i];return point('receive-'+p.id,'plaza',x,z,'service',
      t('Recibir · '+p.name.es,'Receive · '+p.name.en),t('Recepción segura registrada.','Safe reception recorded.'));}),
    point('receipts','plaza',-1,21,'upload',t('Entregar informe y muestras','Deliver the report and samples'),
      t('Quedan en el archivo el manifiesto, los datos de la misión y el recuerdo de LUMA.','The archive holds the manifest, the mission data and LUMA’s memory.'),
      people.map(p=>'receive-'+p.id)),
  ],
  props:[...padProps,...receiptSpots.map(({x,z})=>groundProp('crew',x+.85,z-.45,.4,0,1.8)),
    groundProp('console',1,21,.65,.55,1.3)],
  collectibles:[],
};

export const stationDialogue:Record<string,Line[]>={
  chat:[{speaker:'LUMA',text:t('¿Puedes hacer el saludo otra vez? Cuando oigo los dos pulsos, sé que estás cerca.',
    'Can you greet me again? When I hear the two pulses, I know you are close.')},
    recordedLuma('orbit',orbitDialogue,'point:translator',1)],
  'point:capsule':[{speaker:'CONTROL',text:t('Guarda el parche. Tu hermana trabajaba con ese equipo. La hora del envío dice que alguien pudo lanzar la cápsula; todavía no sabemos qué pasó después.',
    'Keep the patch. Your sister worked with that equipment. The launch time tells us someone could send the capsule. We still do not know what happened after that.')}],
  'point:protected-bay':[{speaker:'CONTROL',text:t('Deja la escotilla abierta. Haremos el saludo cuando él se acerque.',
    'Leave the hatch open. We can try a greeting when he comes closer.')}],
  'point:translator':orbitDialogue['point:translator'].map((_,i)=>recordedLuma('orbit',orbitDialogue,'point:translator',i)),
  'point:keepsake':[{speaker:'LUMA',text:t('Dormía junto a su mesa. Si me asustaba el ruido, ella dejaba la mano a mi lado hasta que se me pasaba.',
    'I slept by her desk. If the noise frightened me, she left her hand beside me until it passed.')}],
};
export const earthDialogue:Record<string,Line[]>={
  'point:receive-sister':[{speaker:'AURORA',text:t('Guardé un sitio al lado del mío. Fue lo primero que hice cuando dijeron que volvías.',
    'I saved a spot next to me. It was the first thing I did when they told me you were coming.')},
  {speaker:'AURORA',text:t('Cuando queramos recordarlo, podemos volver a mirar lo que vimos juntos.',
    'When we want to remember him, we can look back at what we saw together.')}],
};
