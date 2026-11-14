import { trial } from '../kit/trial.ts';
const t = (es:string,en:string) => ({es,en});
const p = (x:number,y:number) => ({x,y});
export const bennu = trial({
  id:'bennu', title:t('Lo que queda de la luz','What remains of the light'), landscape:'#242030', subtitle:t('Plataforma de ensayo','Test platform'),
  briefing:t('Revisa el equipo de anclaje, recoge el paquete de ensayo y confirma el retorno.',
             'Inspect the tether equipment, recover the test packet and confirm your return.'),
  names:[t('Lectura de anclaje','Tether reading'),t('Contenedor de ensayo','Test container'),t('Acople auxiliar','Auxiliary coupling')],
  dimensions:[11,12], spawn:p(2,8), positions:[p(4,7),p(8,3),p(9,8),p(2,9),p(1,8)],
  blocked:[p(4,4),p(4,5),p(5,5),p(6,5),p(6,6),p(7,6),p(8,7),p(9,4),p(6,9),p(7,9),p(10,6)],
  hazards:[p(2,4),p(3,4),p(3,5),p(3,6),p(4,6),p(5,6),p(7,8)],
});
