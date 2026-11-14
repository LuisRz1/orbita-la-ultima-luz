import { trial } from '../kit/trial.ts';
const t = (es:string,en:string) => ({es,en});
const p = (x:number,y:number) => ({x,y});
export const orbit = trial({
  id:'orbit', title:t('Primera luz','First light'), landscape:'#172444', subtitle:t('Estación de enlace','Relay station'),
  briefing:t('Entra al módulo y contrasta el registro de recepción.','Enter the module and compare the reception log.'),
  names:[t('Panel de recepción','Reception panel'),t('Registrador de ensayo','Test recorder'),t('Antena orbital','Orbital antenna')],
  dimensions:[12,9], spawn:p(2,6), positions:[p(5,4),p(9,2),p(9,6),p(2,7),p(1,6)],
  blocked:[p(4,2),p(4,3),p(4,5),p(4,6),p(7,2),p(7,3),p(7,5),p(7,6)],
  hazards:[p(10,2),p(10,3),p(10,4),p(10,5),p(10,6)],
});
