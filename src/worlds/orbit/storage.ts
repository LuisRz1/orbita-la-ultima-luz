import Dexie, { type Table } from 'dexie';
import { orbitSaveSlot, lunarHandoff, restoreOrbit, type OrbitState } from './progress.ts';

class CampaignSaves extends Dexie {
  chapters!:Table<{id:string;state:OrbitState},string>;
  constructor(){
    super('orbita-chapters');
    this.version(1).stores({chapters:'id'});
  }
}
const db=new CampaignSaves();
let tail:Promise<unknown>=Promise.resolve();

export async function readOrbit():Promise<{state:OrbitState|null;incompatible:boolean}> {
  await tail.catch(()=>{});
  const row=await db.chapters.get(orbitSaveSlot);
  const state=restoreOrbit(row?.state);
  return {state,incompatible:row!==undefined&&state===null};
}
export async function writeOrbit(state:OrbitState):Promise<void> {
  const write=tail.catch(()=>{}).then(()=>db.chapters.put({id:orbitSaveSlot,state}));
  tail=write;
  await write;
}
export async function readLunarHandoff(){
  const {state}=await readOrbit();
  return state?lunarHandoff(state):null;
}
