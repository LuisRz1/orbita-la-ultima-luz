import { people } from '../../core/campaign.ts';
import type { LevelV2 } from '../../core/contract/level-v2.ts';
import type { Line } from '../moon/dialogue.ts';
import { at, mound, point, scenery, smooth, t, zone } from '../expedition-shapes.ts';

export function bennuHeight(x:number,z:number){
  return mound(x,z,-34,11,31,6)+mound(x,z,49,-25,32,7)+mound(x,z,25,51,33,-5)
    +mound(x,z,13,-42,27,5)+.55*Math.sin(x/9)*Math.cos(z/7)+13*smooth(84,111,Math.hypot(x,z));
}
const set=scenery(bennuHeight);
const base=['contact'], visit=['access-west','access-east'], manifest=['sister'];
const board=people.map(p=>'board-'+p.id);
const crewSpots=[at(-8,-38),at(1,-42),at(9,-39)];
const anchors=[at(0,57),at(-23,52),at(-42,37),at(-38,14),at(-31,-13),at(-22,-35),at(0,-43),
  at(23,-40),at(43,-21),at(52,4),at(35,25),at(16,42),at(-3,27),at(18,6),at(2,-16),at(-22,5)];
const common={kitVersion:2,id:'bennu',biome:'bennu',realGravity:0.00006,sun:{azimuth:222,elevation:18},
  title:t('Lo que queda de la luz','What remains of the light')} as const;
export const bennuLevel:LevelV2={
  ...common,mission:'campaign-bennu',subtitle:t('Refugio y cadena de anclajes','Refuge and anchor chain'),
  briefing:t('Sigue los anclajes hasta el refugio. Comprueba el manifiesto y prepara a Aurora para salir.','Follow anchors to the refuge. Verify the manifest and prepare Aurora for evacuation.'),
  arrival:t('Contacto asegurado. Cambia de línea en la zona de solape entre anclajes.','Contact secured. Transfer your line where tether zones meet.'),
  outcome:t('Tripulación a bordo. Queda liberar el módulo de servicio antes de la partida.','Crew aboard. Disconnect the service module before departure.'),
  terrain:{size:240,res:145,height:bennuHeight},spawn:at(0,60),comms:{center:at(0,0),radius:82,falloff:17},
  tether:{anchors,length:17},exit:'evacuate',
  zones:[zone('landing',t('Contacto anclado','Tethered contact'),0,57,18),zone('west',t('Bloques occidentales','Western boulders'),-40,18,33),
    zone('east',t('Pasarela oriental','Eastern anchor track'),39,5,34),zone('refuge',t('Refugio de Aurora','Aurora refuge'),1,-38,28)],
  points:[
    point('contact','landing',1,52,'service',t('Verificar anclaje y radio','Verify anchor and radio'),
      t('Se oye una voz desde el refugio. Hay personas dentro; debemos verificar quiénes en persona.','There is a voice from the refuge. People are inside; we need to verify who in person.'),[],1),
    point('access-west','west',-38,17,'scan',t('Reconocer acceso por los bloques','Survey the boulder approach'),
      t('Los bloques dejan un paso estrecho. Conserva la línea al transferirte.','The boulders leave a narrow passage. Stay on the line while you transfer.'),base,1),
    point('access-east','east',46,2,'scan',t('Inspeccionar acceso de la pasarela','Inspect the anchor track'),
      t('La pasarela tiene apoyos firmes y dos puntos de regreso.','The track has stable holds and two return points.'),base,1),
    point('sister','refuge',-7,-35,'service',t('Reunirte con tu hermana','Reunite with your sister'),
      t('Tu hermana te reconoce por el parche. LUMA inclina la cabeza y apoya las patas en sus guantes.',
        'Your sister recognizes you by the patch. LUMA lowers its head and puts its paws on her gloves.'),visit),
    point('manifest','refuge',-12,-46,'service',t('Autenticar el manifiesto de Aurora','Authenticate the Aurora manifest'),
      t('Tu hermana, la geóloga y el piloto están presentes. Los tres entran en la lista de evacuación.',
        'Your sister, the geologist and the pilot are present. All three are entered on the evacuation list.'),manifest),
    point('sample','east',26,-25,'salvage',t('Asegurar muestra de contexto','Secure a context sample'),
      t('Muestra sellada del área de anclaje. El paquete viaja en el compartimento de carga.','Anchor-area sample sealed. The packet travels in the cargo bay.'),visit,2),
    ...people.map((p,i)=>{
      const {x,z}=crewSpots[i];
      return point(board[i],'refuge',x+2,z,'service',t('Escoltar · '+p.name.es,'Escort · '+p.name.en),
        t(p.name.es+': asiento y telemetría confirmados.','Seat and telemetry confirmed: '+p.name.en+'.'),['manifest']);
    }),
    point('life-support','landing',-7,50,'service',t('Comprobar oxígeno, plazas y reservas','Check oxygen, seats and reserves'),
      t('Soporte vital nominal. Tres personas verificadas y a bordo. La desconexión ya se puede iniciar.',
        'Life support nominal. Three people verified and aboard. Disconnect operations can begin.'),board,2),
    point('evacuate','landing',5,65,'upload',t('Cerrar manifiesto y preparar desconexión','Close manifest and prepare disconnect'),
      t('La salida queda preparada. Vuelve al módulo de servicio para completar la desconexión.',
        'Departure is ready. Return to the service module to complete the disconnect.'),['sample','life-support']),
  ],
  props:[...anchors.map(a=>set('marker',a.x,a.z,.15,0,1.55)),...crewSpots.map((p,i)=>({
    ...set('crew',p.x,p.z,.43,0,1.8),hideAfter:board[i]})),
    set('lander',0,69,4,4,4.5),set('shelter',4,-48,8,3.8,3.7),set('mast',-18,-43,.4,0,9),
    set('boulder',-33,6,4,0,5),set('boulder',-45,23,3,0,4.8),set('boulder',35,14,4,0,4),
    set('rock',24,-11,2,0,2.8),set('boulder',24,-48,3,0,3.4),set('console',6,65,.55,.6,1.1)],
  collectibles:[[-21,48],[-42,34],[-28,7],[-36,-24],[-20,-41],[11,-36],[39,-21],[42,13],[21,40],[3,22]]
    .map(([x,z],i)=>({id:'bennu-echo-'+i,position:at(x,z)})),
};

const serviceHeight=(x:number,z:number)=>11*smooth(9,17,Math.abs(x))+11*smooth(25,36,Math.abs(z));
const hardware=scenery(serviceHeight);
export const serviceLevel:LevelV2={
  ...common,mission:'campaign-service',biome:'station',subtitle:t('Módulo de servicio','Service module'),
  briefing:t('Libera la unión que retiene la nave. Todo Aurora está a bordo.','Release the coupling holding the ship. All of Aurora is aboard.'),
  arrival:t('Cruza la compuerta y llega al mando de desconexión. LUMA lleva protección ambiental.','Cross the gate to the disconnect control. LUMA has environmental protection.'),
  outcome:t('El conducto se abrió. Llevaste a LUMA al compartimento seguro y la nave está libre.','The duct opened. You carried LUMA to the safe bay and the ship is free.'),
  terrain:{size:84,res:85,height:serviceHeight},spawn:at(0,19),comms:{center:at(0,0),radius:31,falloff:7},
  tether:{anchors:[at(0,15),at(0,-10)],length:16},exit:'safe-bay',
  zones:[zone('safe',t('Compartimento seguro','Safe bay'),0,17,14),zone('external',t('Unión exterior','External coupling'),0,-12,16)],
  points:[
    point('disconnect','external',0,-15,'service',t('Desconectar el módulo','Disconnect the module'),
      t('Fallo del actuador. El portón se cerró. Una liberación mecánica queda al otro lado del conducto.',
        'Actuator failure. The gate closed. A mechanical release is on the other side of the duct.')),
    point('life-line','external',5,-6,'service',t('Coordinar la liberación con LUMA','Coordinate the release with LUMA'),
      t('LUMA se arrastra por el conducto y alcanza la palanca. Escuchas la señal de desbloqueo.',
        'LUMA crawls through the duct and reaches the lever. You hear the unlock signal.'),['disconnect']),
    point('safe-bay','safe',0,16,'upload',t('Llevar a LUMA al compartimento seguro','Carry LUMA to the safe compartment'),
      t('Tu hermana cierra el sello. LUMA vuelve a mirarte.','Your sister seals the hatch. LUMA looks back at you.'),['life-line']),
  ],
  props:[hardware('shelter',0,24,6,2,4),hardware('console',2,-15,.8,.6,1.3),hardware('gate',0,0,9,.55,3.3),
    hardware('shelter',8,0,1.5,3,1.4),hardware('pillar',-7,0,.4,0,3.7),hardware('pillar',6,0,.4,0,3.7)],
  collectibles:[],
};

export const bennuDialogue:Record<string,Line[]>={
  chat:[{speaker:'LUMA',text:t('Ajusta tu línea. Si no puedes oír al traductor, mira mis dos patas. Aquí estoy.',
    'Check your line. If you cannot hear the translator, look at my two paws. I am here.')}],
  intro:[{speaker:'LUMA',text:t('Si oyes su voz antes que yo, dime qué dice. Hoy el traductor tarda.',
    'If you hear her voice first, tell me what she says. The translator is slow today.')}],
  'point:sister':[
    {speaker:'AURORA',text:t('Creí que no llegaría nadie. La cápsula sí salió… Estás aquí, LUMA.',
      'I thought nobody would come. The capsule made it out… You are here, LUMA.')},
    {speaker:'LUMA',text:t('Sí. Le enseñé nuestro saludo.', 'Yes. I taught them our greeting.')},
  ],
};
export const serviceDialogue:Record<string,Line[]>={
  'point:disconnect':[{speaker:'CONTROL',text:t('El traje no cabe por ese conducto. No fuerces el portón.',
    'The suit cannot fit in the duct. Do not force the gate.')},{speaker:'LUMA',text:t('Yo conozco el paso. Como en el refugio. Tú espera mi señal.',
      'I know the way. Like in the shelter. Wait for my signal.')}],
  'point:safe-bay':[{speaker:'LUMA',text:t('¿Te quedas aquí? Solo un momento. Ya veo a tu hermana.',
    'Will you stay here? Just for a moment. I can see your sister.')},{speaker:'AURORA',text:t('Aquí estamos, los dos.',
      'We are here. Both of us.')}],
};
