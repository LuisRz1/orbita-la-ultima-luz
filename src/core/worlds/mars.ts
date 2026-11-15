import { trial } from '../trial.ts';
const t = (es:string,en:string) => ({es,en});
const p = (x:number,y:number) => ({x,y});
export const mars = trial({
  id:'mars', title:t('El mundo rojo','The red world'), landscape:'#391c24', subtitle:t('Valle de reconocimiento','Survey valley'),
  briefing:t('Usa el refugio y toma una lectura del terreno antes de enviar los datos.','Use the shelter and survey the terrain before transmitting the data.'),
  names:[t('Afloramiento','Outcrop'),t('Caché de campo','Field cache'),t('Relé del valle','Valley relay')],
  dimensions:[15,11], spawn:p(2,7), positions:[p(6,7),p(12,3),p(11,8),p(2,8),p(1,7)],
  blocked:[p(4,3),p(5,4),p(5,5),p(8,4),p(9,4),p(10,4),p(11,4),p(12,4),p(5,8),p(3,9),p(8,8),p(12,8),p(13,6)],
  hazards:[p(7,5),p(8,5),p(9,5),p(10,5),p(11,5),p(10,6),p(11,6)],
});
