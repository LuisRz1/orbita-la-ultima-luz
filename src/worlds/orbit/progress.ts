import { z } from 'zod';
import { isWalkable, type Point } from '../../kit/contract.ts';
import {
  applyAction, begin, restore, stateSchema, type Failure, type Loadout, type MissionState,
} from '../../kit/mission.ts';
import { exteriors, station, type EvaRoute } from './content.ts';
import {
  assessDesign, assessTransfer, defaultDesign, designSchema, evaluateMission, flightReserve, instruments, routeIds, routes,
  type Design, type TransferRoute,
} from './engineering.ts';
import { flightChecks, flightIds, flightStateSchema, type FlightId, type FlightState } from './flight.ts';

const phases = [
  'planning','launch','dock','station','eva-plan','eva','transfer','depart','cruise','lunar-approach','report','complete',
] as const;
export const orbitSaveSlot = 'c1-first-light';
const schema = z.object({
  version:z.literal(1), design:designSchema,
  phase:z.enum(phases), briefingRead:z.boolean(), compared:z.boolean(),
  captures:z.array(z.object({id:z.enum(flightIds),state:flightStateSchema}).strict()).max(4),
  station:stateSchema.nullable(),
  eva:stateSchema.nullable(), evaRoute:z.enum(['sheltered','sunlit']).nullable(),
  transfer:z.enum(routeIds).nullable(), cruiseHours:z.number().int().nonnegative(),
}).strict();
export type OrbitState = z.infer<typeof schema>;
type Field = 'station'|'eva';
const rank=(phase:OrbitState['phase'])=>phases.indexOf(phase);

export const freshOrbit = ():OrbitState => ({
  version:1,design:{...defaultDesign,instruments:[...defaultDesign.instruments]},phase:'planning',
  briefingRead:false,compared:false,captures:[],station:null,eva:null,evaRoute:null,transfer:null,cruiseHours:0,
});

export function fieldLoadout(design:Design):Loadout {
  return design.battery==='expanded'?'survey':'repair';
}
export const has = (state:OrbitState, id:string) =>
  state.station?.completed.includes(id) || state.eva?.completed.includes(id) || false;
export const evidence = (state:OrbitState):('AUR-E01'|'AUR-E02')[] => [
  ...(has(state,'capsule-auth')?['AUR-E01' as const]:[]),
  ...(has(state,'airlock')?['AUR-E02' as const]:[]),
];
export function recordedData(state:OrbitState):number {
  return state.design.instruments.reduce((sum,id)=>{
    const instrument=instruments[id], checkpoint=instrument.role==='light'?'sun-record':'recorder';
    return sum+(has(state,checkpoint)?instrument.data:0);
  },0);
}
export function missionNumber(state:OrbitState):number {
  switch(state.phase){
    case 'planning':return 1;
    case 'launch':return 2;
    case 'dock':return 3;
    case 'station':return has(state,'capsule')?4:3;
    case 'eva-plan':case 'eva':return 5;
    default:return 6;
  }
}
export function completedMissions(state:OrbitState):number {
  return state.phase==='complete'?6:missionNumber(state)-1;
}
export function collectedStages(state:OrbitState):Set<string> {
  const collected = new Set([
    ...state.captures.map(x=>x.id), ...(state.station?.completed??[]), ...(state.eva?.completed??[]),
  ]);
  if(state.briefingRead)collected.add('briefing');
  if(state.compared)collected.add('build-review');
  return collected;
}

export function readBriefing(state:OrbitState):OrbitState {
  return state.phase==='planning'?{...state,briefingRead:true}:state;
}
export function setDesign(state:OrbitState, design:Design):OrbitState {
  if(state.phase!=='planning'||!state.briefingRead)return state;
  const parsed=designSchema.safeParse(design);
  return parsed.success?{...state,design:parsed.data}:state;
}
export function archiveComparison(state:OrbitState):OrbitState {
  return state.phase==='planning'&&state.briefingRead?{...state,compared:true}:state;
}
export function authorizeLaunch(state:OrbitState):OrbitState {
  return state.phase==='planning'&&state.briefingRead&&assessDesign(state.design).ok?{...state,phase:'launch'}:state;
}

export function fuelLeft(state:OrbitState):number {
  const last=state.captures.at(-1);
  const fuel=last?.state.fuel??assessDesign(state.design).fuel;
  return last?.id==='depart'&&state.transfer&&rank(state.phase)>=rank('lunar-approach')?fuel-routes[state.transfer].fuel:fuel;
}
export function currentFuel(state:OrbitState):number {
  if(state.phase!=='cruise'||!state.transfer)return fuelLeft(state);
  const route=routes[state.transfer];
  return fuelLeft(state)-route.fuel*(state.cruiseHours/route.time);
}

export function requiredFlightFuel(state:OrbitState):number {
  if(state.phase==='depart'&&state.transfer)return routes[state.transfer].fuel+flightReserve+12;
  if(state.phase==='dock'||state.phase==='launch'){
    const minTransfer=Math.min(...routeIds.filter(id=>assessTransfer(state.design,id,Infinity).okTime).map(id=>routes[id].fuel));
    return flightReserve+12+minTransfer+(state.phase==='launch'?10:0);
  }
  return flightReserve;
}

export function captureFlight(state:OrbitState, id:FlightId, arrived:FlightState):OrbitState {
  if(state.phase!==id || !flightChecks(id,arrived).canCapture ||
      arrived.fuel>fuelLeft(state)||arrived.fuel<requiredFlightFuel(state))return state;
  const captures=[...state.captures,{id,state:arrived}];
  switch(id){
    case 'launch':return {...state,captures,phase:'dock'};
    case 'dock':return {...state,captures,phase:'station',station:begin(station,fieldLoadout(state.design))};
    case 'depart':return {...state,captures,phase:'cruise'};
    case 'lunar-approach':return {...state,captures,phase:'report'};
  }
}

export function activateField(state:OrbitState, field:Field, id:string, position:Point):{state:OrbitState;error?:Failure} {
  const save=state[field];
  if(state.phase!==field||!save)return {state,error:'inactive'};
  if(field==='eva'&&!state.evaRoute)return {state,error:'inactive'};
  const world=field==='station'?station:exteriors[state.evaRoute!];
  if(!isWalkable(world,position))return {state,error:'distance'};
  const result=applyAction(world,save,id,position);
  if(result.error)return {state,error:result.error};
  const phase=result.state.phase==='report'?(field==='station'?'eva-plan':'transfer'):field;
  return {state:{...state,[field]:result.state,phase}};
}
export function beginEva(state:OrbitState, route:EvaRoute):OrbitState {
  return state.phase==='eva-plan'&&has(state,'capsule-auth')
    ?{...state,phase:'eva',evaRoute:route,eva:begin(exteriors[route],fieldLoadout(state.design))}:state;
}
export function planTransfer(state:OrbitState, route:TransferRoute):OrbitState {
  return state.phase==='transfer'&&has(state,'airlock')&&assessTransfer(state.design,route,fuelLeft(state)).ok
    ?{...state,phase:'depart',transfer:route}:state;
}
export function advanceCruise(state:OrbitState):OrbitState {
  if(state.phase!=='cruise'||!state.transfer)return state;
  const hours=routes[state.transfer].time;
  if(state.cruiseHours===hours)return state;
  return {...state,cruiseHours:Math.min(hours,state.cruiseHours+Math.ceil(hours/24))};
}
export function finishCruise(state:OrbitState):OrbitState {
  return state.phase==='cruise'&&state.transfer&&state.cruiseHours===routes[state.transfer].time&&
    assessTransfer(state.design,state.transfer,fuelLeft(state)).ok?{...state,phase:'lunar-approach'}:state;
}
export function fileReport(state:OrbitState):OrbitState {
  return state.phase==='report'&&state.captures.at(-1)?.id==='lunar-approach'&&
    evidence(state).length===2&&recordedData(state)===assessDesign(state.design).data
    ?{...state,phase:'complete'}:state;
}

export function lunarHandoff(state:OrbitState) {
  if(state.phase!=='complete'||!state.transfer||evidence(state).length!==2)return null;
  return {
    version:1,chapter:'C1',nextChapter:'C2',entryMission:'C2-M01',destination:'lunar-node',
    evidence:evidence(state),arrived:true,safe:true,reportFiled:true,
    missionIds:['C1-M01','C1-M02','C1-M03','C1-M04','C1-M05','C1-M06'],
    craft:{design:state.design,fuel:fuelLeft(state)},
    companion:{id:'luma',protected:true,translatorCalibrated:true},
  } as const;
}
export type LunarHandoff = NonNullable<ReturnType<typeof lunarHandoff>>;
export function orbitReport(state:OrbitState) {
  return state.transfer?evaluateMission(state.design,state.transfer,fuelLeft(state)):null;
}

export function restoreOrbit(raw:unknown):OrbitState|null {
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return null;
  const s=parsed.data, phase=rank(s.phase);
  if(!s.briefingRead&&s.compared)return null;
  if(s.phase!=='planning'&&(!s.briefingRead||!assessDesign(s.design).ok))return null;

  const expectedCaptures:FlightId[]=phase>=rank('report')?['launch','dock','depart','lunar-approach']
    :phase>=rank('cruise')?['launch','dock','depart']:phase>=rank('station')?['launch','dock']
    :phase>=rank('dock')?['launch']:[];
  if(expectedCaptures.length!==s.captures.length)return null;
  if((s.transfer!==null)!==(phase>=rank('depart')))return null;
  if(phase<rank('cruise')&&s.cruiseHours!==0)return null;
  if(s.transfer){
    const time=routes[s.transfer].time;
    if(s.cruiseHours>time||(phase>=rank('lunar-approach')&&s.cruiseHours!==time))return null;
  }
  let simulated={...freshOrbit(),design:s.design,briefingRead:s.briefingRead,transfer:s.transfer,captures:[] as OrbitState['captures']};
  for (let i=0;i<expectedCaptures.length;i++) {
    const capture=s.captures[i];
    if(capture.id!==expectedCaptures[i])return null;
    simulated={...simulated,phase:capture.id};
    if(capture.id==='depart'&&(!s.transfer||!assessTransfer(s.design,s.transfer,fuelLeft(simulated)).ok))return null;
    const accepted=captureFlight(simulated,capture.id,capture.state);
    if(accepted===simulated)return null;
    simulated={...simulated,captures:accepted.captures};
  }
  function verifyField(saved:MissionState|null, region:typeof station, inPhase:OrbitState['phase'], endPhase:OrbitState['phase']){
    if (phase<rank(inPhase))return saved===null;
    return saved!==null&&saved.loadout===fieldLoadout(s.design)&&restore(region,saved)!==null
      &&saved.phase===(phase>=rank(endPhase)?'report':'operation');
  }
  if(!verifyField(s.station,station,'station','eva-plan'))return null;
  if((s.evaRoute!==null)!==(phase>=rank('eva')))return null;
  if(!verifyField(s.eva,exteriors[s.evaRoute??'sheltered'],'eva','transfer'))return null;
  return s;
}
