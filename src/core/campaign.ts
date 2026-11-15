import { z } from 'zod';
import { assessDesign, assessTransfer, defaultDesign, designSchema, flightReserve, routeIds, routes, t } from './orbit/engineering.ts';
import { flightChecks, flightStateSchema, type FlightId } from './orbit/flight.ts';
import type { Localized } from './contract/grid-v1.ts';
import { archiveId, capsuleId, receptionId, validFirstLightField } from './orbit/first-light.ts';

type WorldSite='ground'|'station'|'eva'|'moon'|'mars'|'bennu'|'service'|'earth';
type Body='earth'|'orbit'|'moon'|'mars'|'bennu';
type MissionId=`C${1|2|3|4}-M0${1|2|3|4|5|6}`;
type FlightLeg={mode:FlightId;body:Body;reserve:number};
type Stage={
  id:string;title:Localized;chapter:1|2|3|4;missions?:readonly MissionId[];
  action:'field'|'design'|'flight'|'briefing'|'cruise'|'report';
  site?:WorldSite;required?:readonly string[];flight?:FlightLeg;
  reveal?:readonly EvidenceId[];
};
type EvidenceId=`AUR-E0${1|2|3|4|5|6|7}`;
const stage=(item:Stage)=>item;
export const people=[
  {id:'sister',name:t('Tu hermana','Your sister')},{id:'pilot',name:t('Piloto de Aurora','Aurora pilot')},
  {id:'geologist',name:t('Geóloga de Aurora','Aurora geologist')},
] as const;
const crew=people.map(p=>'board-'+p.id);
const returned=people.map(p=>'receive-'+p.id);

export const campaignStages=[
  stage({id:'ground',title:t('Complejo de lanzamiento','Launch complex'),chapter:1,action:'field',site:'ground',required:['control']}),
  stage({id:'design',title:t('Antes de despegar','Before liftoff'),chapter:1,action:'design',missions:['C1-M01']}),
  stage({id:'launch',title:t('De la Tierra a la órbita','From Earth to orbit'),chapter:1,action:'flight',flight:{mode:'launch',body:'earth',reserve:58},missions:['C1-M02']}),
  stage({id:'dock',title:t('Encuentro en la estación','Rendezvous with the station'),chapter:1,action:'flight',flight:{mode:'dock',body:'earth',reserve:46}}),
  stage({id:'station',title:t('La carga inesperada','The unexpected cargo'),chapter:1,action:'field',site:'station',
    required:['supplies','capsule','protected-bay','rest','protection','translator','capsule-auth'],missions:['C1-M03','C1-M04'],reveal:['AUR-E01']}),
  stage({id:'eva-plan',title:t('Preparar la salida exterior','Prepare the EVA'),chapter:1,action:'briefing'}),
  stage({id:'eva',title:t('Fuera del casco','Outside the hull'),chapter:1,action:'field',site:'eva',required:['sun-record','recorder','airlock'],missions:['C1-M05'],reveal:['AUR-E02']}),
  stage({id:'moon-plan',title:t('Una ruta hacia la Luna','A route to the Moon'),chapter:1,action:'briefing'}),
  stage({id:'moon-depart',title:t('Abandonar el corredor orbital','Depart the orbital corridor'),chapter:1,action:'flight',flight:{mode:'depart',body:'earth',reserve:24}}),
  stage({id:'moon-cruise',title:t('Crucero hacia la Luna','Cruise to the Moon'),chapter:1,action:'cruise'}),
  stage({id:'moon-arrive',title:t('Acople al nodo lunar','Dock at the lunar node'),chapter:1,action:'flight',flight:{mode:'lunar-approach',body:'moon',reserve:12}}),
  stage({id:'moon-handoff',title:t('Informe de Primera luz','First Light report'),chapter:1,action:'report',missions:['C1-M06']}),
  stage({id:'moon-site',title:t('Comparar sitios de alunizaje','Compare landing sites'),chapter:2,action:'briefing'}),
  stage({id:'moon-land',title:t('Elegir dónde bajar','Choose where to land'),chapter:2,action:'flight',flight:{mode:'lunar-approach',body:'moon',reserve:24},missions:['C2-M01']}),
  stage({id:'moon',title:t('Bajo otro cielo','Under another sky'),chapter:2,action:'field',site:'moon',
    required:['habitat','geo-1','geo-2','geo-3','field-notes','shadow','archive','relay','return-route','terminal'],
    missions:['C2-M02','C2-M03','C2-M04','C2-M05']}),
  stage({id:'moon-rise',title:t('Ascender al nodo lunar','Ascent to the lunar node'),chapter:2,action:'flight',flight:{mode:'launch',body:'moon',reserve:12}}),
  stage({id:'moon-report',title:t('Volver con evidencia','Return with evidence'),chapter:2,action:'report',missions:['C2-M06'],reveal:['AUR-E03']}),
  stage({id:'mars-plan',title:t('Entre dos mundos','Between two worlds'),chapter:3,action:'briefing'}),
  stage({id:'mars-depart',title:t('Corrección interplanetaria','Interplanetary correction'),chapter:3,action:'flight',flight:{mode:'depart',body:'moon',reserve:26}}),
  stage({id:'mars-cruise',title:t('Crucero hacia Marte','Cruise to Mars'),chapter:3,action:'cruise'}),
  stage({id:'mars-arrive',title:t('Encuentro en el nodo marciano','Rendezvous at Mars'),chapter:3,action:'flight',flight:{mode:'dock',body:'mars',reserve:14},missions:['C3-M01']}),
  stage({id:'mars-site',title:t('Elegir corredor de descenso','Choose a descent corridor'),chapter:3,action:'briefing'}),
  stage({id:'mars-land',title:t('Aterrizar lejos de casa','Land far from home'),chapter:3,action:'flight',flight:{mode:'lunar-approach',body:'mars',reserve:24},missions:['C3-M02']}),
  stage({id:'mars',title:t('El mundo rojo','The red world'),chapter:3,action:'field',site:'mars',
    required:['habitat','outcrop','basin','ridge','navigation','relay','backup','terminal'],
    missions:['C3-M03','C3-M04','C3-M05'],reveal:['AUR-E04']}),
  stage({id:'mars-rise',title:t('Volver al nodo marciano','Return to Mars orbit'),chapter:3,action:'flight',flight:{mode:'launch',body:'mars',reserve:12}}),
  stage({id:'rescue-plan',title:t('Lo que llevamos','What we carry'),chapter:3,action:'briefing',missions:['C3-M06'],reveal:['AUR-E05']}),
  stage({id:'bennu-depart',title:t('Partida del nodo marciano','Departure from Mars orbit'),chapter:4,action:'flight',flight:{mode:'depart',body:'mars',reserve:28}}),
  stage({id:'bennu-cruise',title:t('Rumbo a Bennu','Bound for Bennu'),chapter:4,action:'cruise'}),
  stage({id:'bennu-arrive',title:t('Igualar velocidad con el refugio','Match velocity with the refuge'),chapter:4,action:'flight',flight:{mode:'lunar-approach',body:'bennu',reserve:16},missions:['C4-M01']}),
  stage({id:'bennu',title:t('Lo que queda de la luz','What remains of the light'),chapter:4,action:'field',site:'bennu',
    required:['contact','access-west','access-east','sister','manifest','sample',...crew,'life-support','evacuate'],
    missions:['C4-M02','C4-M03','C4-M04'],reveal:['AUR-E06']}),
  stage({id:'service',title:t('Todavía hay camino','There is still a way'),chapter:4,action:'field',site:'service',
    required:['disconnect','life-line','safe-bay']}),
  stage({id:'farewell',title:t('Compartimento seguro','Safe compartment'),chapter:4,action:'report',missions:['C4-M05']}),
  stage({id:'return-depart',title:t('Salida hacia la Tierra','Departure for Earth'),chapter:4,action:'flight',flight:{mode:'depart',body:'bennu',reserve:34}}),
  stage({id:'return-cruise',title:t('Regreso con Aurora','Return with Aurora'),chapter:4,action:'cruise'}),
  stage({id:'earth-dock',title:t('Corredor de recepción terrestre','Earth reception corridor'),chapter:4,action:'flight',flight:{mode:'dock',body:'earth',reserve:12}}),
  stage({id:'earth',title:t('Las cosas que quedan','The things that remain'),chapter:4,action:'field',site:'earth',
    required:[...returned,'receipts']}),
  stage({id:'epilogue',title:t('Informe de rescate','Rescue report'),chapter:4,action:'report',missions:['C4-M06'],reveal:['AUR-E07']}),
] as const;

export const chapterNames=[t('Primera luz','First light'),t('Bajo otro cielo','Under another sky'),
  t('El mundo rojo','The red world'),t('Lo que queda de la luz','What remains of the light')];

export const documents:Record<EvidenceId,Localized>={
  'AUR-E01':t(`${capsuleId} coincide con la recepción ${receptionId}. El historial confirma que Aurora envió la cápsula con LUMA; la tripulación sigue sin localizarse.`,
    `${capsuleId} matches reception record ${receptionId}. The log confirms Aurora sent the capsule with LUMA aboard; the crew remains missing.`),
  'AUR-E02':t(`El registrador de la estación y la esclusa verificaron la firma de ${archiveId}, el archivo del relé lunar. Allí falta recuperar un tramo de navegación.`,
    `The station recorder and the airlock verified the signature of ${archiveId}, the lunar relay archive. A navigation segment still needs to be recovered there.`),
  'AUR-E03':t('Bitácora, caché e índice autenticados. Aurora trabajó en Marte.','Log, cache and index authenticated. Aurora worked on Mars.'),
  'AUR-E04':t('Aurora se desvió para investigar una baliza. El destino completo sigue pendiente.','Aurora diverted to investigate a beacon. The full destination is still pending.'),
  'AUR-E05':t('Un mensaje fechado confirma supervivientes en Bennu. La respuesta local sigue pendiente.','A dated message places survivors on Bennu. Local contact is still pending.'),
  'AUR-E06':t('Tu hermana y las otras dos personas del manifiesto están identificadas y a bordo.','Your sister and the other two people on the manifest are identified and aboard.'),
  'AUR-E07':t('Las tres personas del manifiesto fueron recibidas a salvo. Informe de rescate y ciencia archivado.','All three people on the manifest were received safely. The rescue and science report is archived.'),
};

const resultSchema=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('field'),points:z.array(z.string()).max(50),energy:z.number().finite().min(6).max(120)}).strict(),
  z.object({kind:z.literal('design'),design:designSchema,briefing:z.literal(true),compared:z.boolean().optional()}).strict(),
  z.object({kind:z.literal('flight'),telemetry:flightStateSchema}).strict(),
  z.object({kind:z.literal('cruise'),hours:z.number().int().positive()}).strict(),
  z.object({kind:z.literal('choice'),option:z.string()}).strict(),
  z.object({kind:z.literal('report')}).strict(),
]);
export type CampaignResult=z.infer<typeof resultSchema>;
const schema=z.object({
  version:z.literal(1),
  log:z.array(z.object({id:z.string(),result:resultSchema}).strict()).max(campaignStages.length),
}).strict();
export type Campaign=z.infer<typeof schema>;
export const newCampaign=():Campaign=>({version:1,log:[]});
export const activeStage=(state:Campaign)=>campaignStages[state.log.length]??null;
export const passed=(state:Campaign,id:string)=>state.log.some(item=>item.id===id);
export function option(state:Campaign,id:string){
  const result=state.log.find(item=>item.id===id)?.result;
  return result?.kind==='choice'?result.option:null;
}
export function spacecraft(state:Campaign){
  const result=state.log.find(item=>item.id==='design')?.result;
  return result?.kind==='design'?result.design:defaultDesign;
}
export function validEvidence(state:Campaign){
  return campaignStages.slice(0,state.log.length).flatMap(s=>s.reveal??[]);
}
export function collectedEvidence(state:Campaign):EvidenceId[] {
  const proof:readonly [string,EvidenceId][]=[['station','AUR-E01'],['eva','AUR-E02'],['moon','AUR-E03'],
    ['mars','AUR-E04'],['mars','AUR-E05'],['bennu','AUR-E06'],['earth','AUR-E07']];
  return proof.filter(([id])=>passed(state,id)).map(([,id])=>id);
}
export function missionLog(state:Campaign){
  return campaignStages.slice(0,state.log.length).flatMap(s=>s.missions??[]);
}

export function firstLightArchive(state:Campaign){
  const recorded=new Set<string>();
  for(const {id,result} of state.log){
    if(id==='design'&&result.kind==='design'){
      recorded.add('briefing');
      if(result.compared)recorded.add('build-review');
    }else if(id==='station'||id==='eva'){
      if(result.kind==='field')result.points.forEach(p=>recorded.add(p));
    }else if(id==='launch'||id==='dock'||id==='moon-arrive'){
      recorded.add(id==='moon-arrive'?'lunar-approach':id);
    }
  }
  return recorded;
}

const choices:Record<string,readonly string[]>={
  'eva-plan':['sheltered','sunlit'],'moon-plan':routeIds,'moon-site':['ridge','slope'],'mars-plan':['efficient','express'],
  'mars-site':['beacon','basin'],'rescue-plan':['rescue'],
};
export const rescueProfiles={
  science:{seats:2,lifeSupport:4800,fuel:94},
  rescue:{seats:3,lifeSupport:9200,fuel:115},
} as const;
export function viableRescue(profile:keyof typeof rescueProfiles){
  const p=rescueProfiles[profile];
  return p.seats>=people.length&&p.lifeSupport>=3120+4320+600&&p.fuel>=23+26+flightReserve+28;
}
export type Voyage={time:number;fuel:number};
export function voyage(state:Campaign,id:string):Voyage|null {
  if(id==='moon-cruise')return routes[option(state,'moon-plan')==='economy'?'economy':'express'];
  if(id==='mars-cruise')return option(state,'mars-plan')==='express'?{time:3840,fuel:29}:{time:5280,fuel:18};
  if(id==='bennu-cruise')return {time:3120,fuel:23};
  if(id==='return-cruise')return {time:4320,fuel:26};
  return null;
}
export function fuelLeft(state:Campaign){
  let fuel=assessDesign(spacecraft(state)).fuel;
  for(const {id,result} of state.log){
    if(result.kind==='flight')fuel=result.telemetry.fuel;
    if(result.kind==='cruise')fuel-=voyage(state,id)?.fuel??0;
    if(id==='moon-handoff')fuel=68; // Depósitos del nodo para descenso y ascenso.
    if(id==='moon-report')fuel=98; // Carga de la etapa marciana en el nodo lunar.
    if(id==='mars-arrive')fuel=66; // Etapa de descenso y ascenso del nodo.
    if(id==='rescue-plan')fuel=rescueProfiles.rescue.fuel; // Reabastecimiento de la etapa de rescate en Marte.
  }
  return fuel;
}
export function flightMinimum(state:Campaign,leg:Stage){
  const budgetByFlight:Record<string,string>={'moon-depart':'moon-cruise','mars-depart':'mars-cruise',
    'bennu-depart':'bennu-cruise','return-depart':'return-cruise'};
  const cruise=budgetByFlight[leg.id];
  const laterCosts=leg.id==='bennu-arrive'?42:0;
  return (leg.flight?.reserve??flightReserve)+laterCosts+(cruise?voyage(state,cruise)?.fuel??0:0);
}

export function acceptStage(state:Campaign,id:string,input:CampaignResult):Campaign {
  const current=activeStage(state), parsed=resultSchema.safeParse(input);
  if(!current||current.id!==id||!parsed.success)return state;
  const result=parsed.data;
  let valid=false;
  switch(current.action){
    case 'field':
      valid=result.kind==='field'&&new Set(result.points).size===result.points.length&&
        !!current.required?.every(p=>result.points.includes(p));
      if(valid&&result.kind==='field'&&(id==='station'||id==='eva')){
        valid=validFirstLightField(id,result.points,option(state,'eva-plan')==='sunlit'?'sunlit':'sheltered');
      }
      break;
    case 'design':valid=result.kind==='design'&&assessDesign(result.design).ok;break;
    case 'flight':
      valid=result.kind==='flight'&&!!current.flight&&flightChecks(current.flight.mode,result.telemetry).canCapture&&
        result.telemetry.fuel>=flightMinimum(state,current)&&result.telemetry.fuel<=fuelLeft(state);
      break;
    case 'cruise': {
      const plan=voyage(state,id);
      valid=result.kind==='cruise'&&!!plan&&result.hours===plan.time&&fuelLeft(state)-plan.fuel>=flightReserve;
      break;
    }
    case 'briefing':
      valid=result.kind==='choice'&&!!choices[id]?.includes(result.option)&&
        (id!=='moon-plan'||routeIds.some(r=>r===result.option&&assessTransfer(spacecraft(state),r,fuelLeft(state)).ok))&&
        (id!=='rescue-plan'||result.option==='rescue'&&viableRescue(result.option));
      break;
    case 'report':valid=result.kind==='report';break;
  }
  return valid?{...state,log:[...state.log,{id,result}]}:state;
}
export function restoreCampaign(raw:unknown):Campaign|null{
  const record=schema.safeParse(raw);
  if(!record.success)return null;
  let state=newCampaign();
  for(const {id,result} of record.data.log){
    const next=acceptStage(state,id,result);
    if(next===state)return null;
    state=next;
  }
  return state;
}
