import type { LevelV2 } from '../../core/contract/level-v2.ts';
import type { Line } from '../moon/dialogue.ts';
import { at, mound, point, scenery, smooth, t, zone } from '../expedition-shapes.ts';

export function marsHeight(x:number,z:number){
  const mesa=mound(x,z,-60,-31,54,16)+mound(x,z,66,-52,40,18);
  const channel=mound(x,z,29,3,42,-6)+mound(x,z,58,32,35,-4);
  const canyon=-8*(1-smooth(4,13,Math.abs(z-(-22+.34*x))))*(1-smooth(28,50,Math.abs(x)));
  return mesa+channel+canyon+.8*Math.cos(x/14)*Math.sin(z/11)+21*smooth(119,149,Math.hypot(x,z));
}
const set=scenery(marsHeight);
const camp=['habitat'], survey=['outcrop','basin','ridge'], backup=['relay'];
export function marsLevel(site:'beacon'|'basin'):LevelV2 {
  return {
    kitVersion:2,id:'mars',mission:'campaign-mars-'+site,biome:'mars',title:t('El mundo rojo','The red world'),
    subtitle:t('Hábitat y valle de Aurora','Aurora habitat and valley'),
    briefing:t('Restablece el hábitat. Compara las rocas del valle y recupera la bitácora y el mensaje dañado.',
      'Restore the habitat. Compare the valley rocks and recover the log and damaged message.'),
    arrival:t('La baliza vuelve a emitir. Sigue la luz del módulo para recuperar el soporte vital.',
      'The beacon is transmitting again. Follow the light to restore the habitat.'),
    outcome:t('Bitácora, navegación y mensaje fechados. El nodo marciano tiene capacidad de reabastecimiento.',
      'Log, navigation and message have dates. The Mars node can refuel the rescue stage.'),
    terrain:{size:320,res:181,height:marsHeight},realGravity:3.7,sun:{azimuth:238,elevation:18},
    spawn:site==='beacon'?at(2,64):at(33,60),comms:{center:at(0,0),radius:110,falloff:18},exit:'terminal',
    zones:[zone('base',t('Hábitat de Aurora','Aurora habitat'),3,62,24),zone('valley',t('Valle de estudio','Survey valley'),33,20,40),
      zone('terrace',t('Terrazas de la meseta','Terraces of the plateau'),-61,-11,34),
      zone('relay',t('Enlace de retorno','Return relay'),37,-58,24)],
    points:[
      point('habitat','base',-5,59,'service',t('Reactivar el hábitat y leer bitácora','Restore the habitat and read the log'),
        t('Tu hermana anotó una señal repetitiva. Las últimas coordenadas están en el equipo de campo.','Your sister noted a repeating signal. The last coordinates are at the field station.'),[],3),
      point('outcrop','valley',23,33,'scan',t('Medir estratos del afloramiento','Measure the exposed layers'),
        t('Los estratos ordenan los materiales en el tiempo. Son parte de la reconstrucción local.','The layers place the materials in time. They are part of the local reconstruction.'),camp,1),
      point('basin','valley',54,5,'scan',t('Comparar sedimento del valle','Compare valley sediment'),
        t('El grano fino es compatible con transporte; la lectura no basta para concluir su origen.','Fine grain is consistent with transport. The reading alone cannot establish its origin.'),camp,1),
      point('ridge','terrace',-58,-17,'scan',t('Medir el borde de la meseta','Measure the plateau edge'),
        t('La plataforma permite recuperar el equipo por dos accesos estables.','Two stable approaches reach the equipment on the plateau.'),camp,1),
      point('navigation','terrace',-48,-33,'salvage',t('Recuperar navegación y cotejar bitácora','Recover navigation and cross-check the log'),
        t('Los registros coinciden. Aurora dejó Marte para seguir la baliza. Falta interpretar el mensaje posterior.',
          'The records agree. Aurora left Mars to follow the beacon. The later message still needs to be interpreted.'),survey,3),
      point('relay','relay',37,-54,'service',t('Restablecer relé y descargar mensaje','Restore the relay and download the message'),
        t('Archivo recibido con fecha e integridad verificadas. Hay una caída de potencia; cambia al circuito de reserva.',
          'File received and date and integrity checked. Power is dropping. Switch to the backup circuit.'),camp,3),
      point('backup','relay',52,-45,'service',t('Conmutar circuito de reserva','Switch to backup power'),
        t('Retorno asegurado. Usa la baliza para bordear el valle hasta el hábitat.','Return secured. Follow the beacon around the valley to the habitat.'),backup,1),
      point('luma-rest','base',7,48,'service',t('Preparar descanso para LUMA','Prepare a rest for LUMA'),
        t('LUMA apoya las patas en la manta y respira mejor.','LUMA rests its paws on the blanket and breathes more easily.'),camp,0,false),
      point('terminal','base',7,66,'upload',t('Registrar retorno al hábitat','Log return to the habitat'),
        t('Paquete sellado para validar el mensaje y calcular plazas en el nodo.','Packet sealed for message authentication and seat planning at the node.'),['navigation','backup']),
    ],
    props:[set('lander',4,75,4,4,4.6),set('shelter',-9,60,3,3,3.2),set('mast',39,-57,.45,0,13),set('cache',-45,-35,1.3,1,1.2),
      set('console',9,66,.65,.6,1.2),set('console',54,-44,.65,.5,1.2),set('pillar',-61,-26,1.2,0,5),
      set('boulder',12,16,3.1,0,3),set('boulder',59,8,4.2,0,5.5),set('boulder',-38,0,4.6,0,6),
      set('shelter',35,-66,3,3.1,3.5),...[-25,0,28,60].map(x=>set('marker',x,44-x*.22,.16,0,1.5))],
    collectibles:[[-10,40],[20,23],[-42,32],[-68,-28],[-61,-43],[62,-6],[44,-59],[66,-39],[13,69],[5,-50]]
      .map(([x,z],i)=>({id:'mars-echo-'+i,position:at(x,z)})),
  };
}

export const marsDialogue:Record<string,Line[]>={
  chat:[{speaker:'LUMA',text:t('Hoy me cuesta el camino. Si vamos más despacio, puedo seguir contándote lo que recuerdo.',
    'The walk is hard today. If we go slower, I can keep telling you what I remember.')}],
  intro:[{speaker:'LUMA',text:t('Antes subía de un salto. Hoy necesito una pausa. Ve a la baliza. Yo sigo tu ritmo.',
    'I used to get up there in one jump. Today I need a pause. Go to the beacon. I will follow at your pace.')}],
  'point:luma-rest':[{speaker:'LUMA',text:t('Ella también me dejaba algo tibio cerca. Así aprendí que podía quedarme.',
    'She used to leave something warm nearby too. That is how I learned I could stay.')}],
  'point:relay':[{speaker:'CONTROL',text:t('El archivo tiene sello y fecha. Leemos el destino cuando esté cotejado en el nodo.',
    'The packet has a seal and a date. We read the destination after the cross-check at the node.')}],
};
