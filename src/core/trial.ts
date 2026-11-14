import { defineWorld, type Localized, type POI, type Point, type World } from './contract/grid-v1.ts';
const t = (es:string,en:string): Localized => ({es,en});

type Trial = {
  id: Exclude<World['id'], 'moon'>; title: Localized; landscape: string;
  subtitle: Localized; briefing: Localized;
  names: [Localized,Localized,Localized]; dimensions: [number,number];
  spawn: Point; positions: [Point,Point,Point,Point,Point];
  blocked: Point[]; hazards: Point[];
};
export function trial(s:Trial):World {
  const points:POI[] = [
    {id:'survey',position:s.positions[0],prop:s.id==='orbit'?'beacon':'rock',action:'scan',
      title:s.names[0],hint:t('Haz la lectura desde una casilla segura.','Take the reading from a safe tile.'),
      result:t('Lectura de ensayo registrada.','Test reading recorded.'),power:2,required:true,prerequisites:[]},
    {id:'package',position:s.positions[1],prop:'cache',action:'salvage',
      title:s.names[1],hint:t('Recoge el paquete para la terminal.','Recover the packet for the terminal.'),
      result:t('Paquete de ensayo recuperado.','Test packet recovered.'),power:3,required:true,prerequisites:[]},
    {id:'relay',position:s.positions[2],prop:'relay',action:'service',
      title:s.names[2],hint:t('Restablece la alimentación del equipo.','Restore the equipment power.'),
      result:t('Equipo de ensayo operativo.','Test equipment operational.'),power:6,required:true,prerequisites:[]},
    {id:'terminal',position:s.positions[3],prop:'console',action:'upload',
      title:t('Terminal de retorno','Return terminal'),hint:t('Comprueba los tres requisitos antes de enviar.','Check the three requirements before sending.'),
      result:t('Control recibió el paquete de ensayo.','Control received the test packet.'),power:0,required:true,prerequisites:['survey','package','relay']},
    {id:'shelter',position:s.positions[4],prop:'habitat',action:'scan',
      title:t('Módulo seguro','Safe module'),hint:t('Reconoce el punto de inicio.','Identify the starting point.'),
      result:t('Punto seguro identificado.','Safe point identified.'),power:0,required:false,prerequisites:[]},
  ];
  return defineWorld({kitVersion:1,id:s.id,mission:s.id+'-sandbox',width:s.dimensions[0],height:s.dimensions[1],
    landscape:s.landscape,title:s.title,subtitle:s.subtitle,briefing:s.briefing,
    arrival:t('Inicio de prueba del kit. El progreso de campaña está separado.','Kit trial started. Campaign progress is separate.'),
    outcome:t('Prueba de integración completada: el registro llegó con los requisitos de retorno.','Integration trial complete: the record arrived with the return requirements met.'),
    spawn:s.spawn,exit:'terminal',points,blocked:s.blocked,hazards:s.hazards});
}
