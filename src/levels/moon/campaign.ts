import type { LevelV2 } from '../../core/contract/level-v2.ts';
import { at, point, scenery, t, zone } from '../expedition-shapes.ts';
import { moonDialogue, type Line } from './dialogue.ts';
import { moonLevel } from './level.ts';
import { moonHeight } from './terrain.ts';

const prop=scenery(moonHeight);
const base=['habitat'];
const notes=['geo-1','geo-2','geo-3'];
const cache=['shadow'];
const index=['relay'];
const exit=['field-notes','archive','return-route'];
export function campaignMoon(site:'ridge'|'slope'):LevelV2{
  // Both viable sites connect to the same base and to both sides of the team's crater.
  return {...moonLevel,mission:'campaign-moon-'+site,spawn:site==='ridge'?moonLevel.spawn:at(30,65),
    briefing:t('Prepara una base y reúne un registro geológico, la caché de respaldo y el índice del relé.','Set up a base and recover the geological log, the backup cache and the relay index.'),
    arrival:t('Control, hemos alunizado. Primero asegura el refugio y comprueba el enlace.','Control, we have landed. Secure the shelter and check the link first.'),
    outcome:t('Tres piezas reunidas. Sube al nodo para cotejar sus fechas e identificadores.','Three pieces recovered. Return to the node to cross-check their dates and identifiers.'),
    zones:[...moonLevel.zones,zone('plain',t('Llanura iluminada','Sunlit plain'),22,32,31)],
    props:[...moonLevel.props,prop('console',19,41,.45,.5,1.2),prop('marker',46,36,.21,0,1.8),
      prop('pillar',-19,20,.4,0,2.4),prop('cache',57,-13,.72,.6,.9)],
    points:[
      point('habitat','landing',-7,73,'service',t('Activar refugio y antena','Activate shelter and antenna'),
        t('Base segura. Carga y rover listos. LUMA comprueba el conducto de cables desde el refugio.',
          'Base secure. Cargo and rover are ready. LUMA checks the cable duct from the shelter.'),[],2),
      point('geo-1','plain',18,41,'scan',t('Escanear llanura iluminada','Scan the sunlit plain'),
        t('El regolito suelto deja huellas. Registra la pendiente antes de cruzar.','Loose regolith holds footprints. Record the slope before crossing.'),base,1),
      point('geo-2','plain',43,34,'scan',t('Medir pendiente oriental','Measure the eastern slope'),
        t('La pendiente permite bordear la hondonada y alcanzar el puesto de campo.','The slope gives a way around the depression to the field station.'),base,1),
      point('geo-3','ridge',-43,12,'scan',t('Comparar roca de la cresta','Compare ridge rock'),
        t('La cresta deja el material expuesto. La muestra sola no identifica el destino de Aurora.','The ridge exposes the material. The sample alone cannot identify Aurora’s destination.'),base,1),
      point('field-notes','plain',-18,19,'salvage',t('Entregar geología y recuperar bitácora','File geology and recover the log'),
        t('La bitácora trae un número de mantenimiento, con el destino incompleto.','The log contains a maintenance number and a partial destination.'),notes,3),
      point('shadow','shadow',58,-8,'scan',t('Medir temperatura en sombra','Measure temperature in shadow'),
        t('El instrumento confirma un contraste térmico. La lectura no identifica hielo.','The instrument confirms a temperature contrast. It does not identify ice.'),base,1),
      point('archive','archive',0,-80,'salvage',t('Recuperar caché protegida','Recover the protected cache'),
        t('El sello conserva una copia fechada. Falta cotejarla con el índice de transmisión.','The seal preserved a dated copy. Cross-check it with the transmission index.'),cache,3),
      point('relay','peak',0,0,'service',t('Alinear y alimentar el relé','Align and power the relay'),
        t('Línea de vista restablecida. El relé conserva un índice de transmisión.','Line of sight restored. The relay holds a transmission index.'),base,3),
      point('return-route','ridge',-51,28,'service',t('Registrar ruta por el oeste','Register the western return route'),
        t('La ruta de ladera bordea la grieta y comunica con el módulo.','The slope route goes around the rift and connects to the lander.'),index),
      point('terminal','landing',6,72,'upload',t('Entregar lecturas y piezas de la prueba','Deliver readings and evidence fragments'),
        t('Paquete listo para cotejo en órbita.','The packet is ready for orbital cross-check.'),exit),
    ],
  };
}

export const lunarCampaignDialogue:Record<string,Line[]>={
  ...moonDialogue,complete:[],
  chat:[{speaker:'LUMA',text:t('Aquí las sombras tienen un borde limpio. Quédate un momento conmigo donde todavía llega la luz.',
    'The shadows have a sharp edge here. Stay with me for a moment while there is still light.')}],
  'point:habitat':[
    {speaker:'LUMA',text:t('Yo paso por el conducto. Tú mira desde la consola. Así no perdemos el enlace cuando cierre la tapa.',
      'I can fit through the duct. Watch from the console so we keep the link when the cover shuts.')},
    {speaker:'LUMA',text:t('¿Nos quedamos aquí un momento? Desde el alunizaje me cuesta más seguirte.',
      'Can we stay here a moment? It has been harder to keep up since we landed.')},
  ],
};
