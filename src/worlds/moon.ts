import { defineWorld, type Localized, type POI } from '../kit/contract.ts';

const t = (es:string,en:string): Localized => ({ es,en });
function point(id:string, x:number, y:number, prop:POI['prop'], action:POI['action'], title:Localized,
  hint:Localized, result:Localized, power:number, required:boolean, prerequisites:string[] = []): POI {
  return {id,position:{x,y},prop,action,title,hint,result,power,required,prerequisites};
}

export const moon = defineWorld({
  kitVersion:1, id:'moon', mission:'c2-reference', width:14, height:13, landscape:'#171a35',
  title:t('Bajo otro cielo','Under another sky'),
  subtitle:t('Archivo lunar de Aurora','Aurora lunar archive'),
  briefing:t(
    'Recupera un registro parcial de Aurora y envíalo desde la terminal. El relé está sin alimentación.',
    'Recover a partial Aurora record and send it from the terminal. The relay is offline.'
  ),
  arrival:t('Alunizaje confirmado. LUMA reconoce la marca de Aurora en el refugio.',
            'Landing confirmed. LUMA recognizes Aurora’s mark on the shelter.'),
  outcome:t('Registro parcial enviado. El archivo aún no permite confirmar el destino de Aurora.',
            'Partial record transmitted. The archive cannot establish Aurora’s destination yet.'),
  spawn:{x:2,y:9}, exit:'terminal',
  blocked:[{x:4,y:3},{x:5,y:4},{x:8,y:3},{x:10,y:4},{x:11,y:8},{x:4,y:10},{x:9,y:9},{x:1,y:6},{x:2,y:4},{x:11,y:3},{x:11,y:10}],
  hazards:[{x:7,y:5},{x:8,y:5},{x:9,y:5},{x:7,y:6},{x:8,y:6},{x:9,y:6},{x:8,y:7},{x:9,y:7}],
  points:[
    point('shelter',1,9,'habitat','scan',t('Refugio','Shelter'),
      t('Revisa la salida segura y el equipo.', 'Review your equipment and safe route.'),
      t('LUMA: «Conozco ese símbolo. Estaba en la cápsula».','LUMA: “I know that symbol. It was on the capsule.”'),0,false),
    point('ridge',4,6,'beacon','scan',t('Mirador','Overlook'),
      t('Observa la sombra entre el archivo y la terminal.', 'Look at the shadow between the archive and the terminal.'),
      t('La sombra reduce visibilidad; el borde iluminado sigue accesible.','The shadow reduces visibility; the illuminated ridge is still accessible.'),1,false),
    point('sample',5,8,'rock','scan',t('Muestra de regolito','Regolith sample'),
      t('Escanea el terreno para contrastar la observación.', 'Scan the terrain to compare your observations.'),
      t('Muestra registrada. El análisis describe regolito; no prueba presencia de hielo.', 'Sample recorded. The analysis describes regolith; it does not establish the presence of ice.'),2,true),
    point('archive',9,4,'cache','salvage',t('Caché de Aurora','Aurora cache'),
      t('Recupera el bloque de navegación dañado.', 'Recover the damaged navigation block.'),
      t('LUMA: «Éste también lo llevaron en la nave. ¿Crees que nos dejó una ruta?»','LUMA: “They carried one of these on the ship, too. Do you think they left us a route?”'),3,true),
    point('relay',10,7,'relay','service',t('Relé averiado','Offline relay'),
      t('Restablece la alimentación del enlace.', 'Restore power to the communications link.'),
      t('Enlace restablecido. Ya puedes entregar el registro.', 'Link restored. You can now submit the record.'),6,true),
    point('terminal',2,10,'console','upload',t('Terminal de retorno','Return terminal'),
      t('Entrega la muestra y el registro cuando vuelva el enlace.', 'Submit the sample and record once the link is restored.'),
      t('Control recibió el envío desde la superficie.', 'Control received the transmission from the surface.'),0,true,['sample','archive','relay']),
  ],
});
