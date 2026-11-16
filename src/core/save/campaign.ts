import Dexie, { type Table } from 'dexie';
import {
  acceptStage, acknowledgeCampaignScene, activeStage, newCampaign, pendingCampaignScene, restoreCampaign, transitionAfter,
  type Campaign, type CampaignResult, type CampaignScene,
} from '../campaign.ts';

class CampaignDatabase extends Dexie {
  campaign!:Table<{id:string;data:unknown},string>;
  constructor(){super('orbita-campaign-3d');this.version(1).stores({campaign:'id'});}
}
const db=new CampaignDatabase();
export type CampaignSlot='aurora'|'primera-luz';
export async function readCampaign(slot:CampaignSlot='aurora'):Promise<Campaign>{
  const row=await db.campaign.get(slot);
  if(!row)return newCampaign();
  const state=restoreCampaign(row.data);
  if(!state)throw new Error('Invalid campaign');
  return state;
}
export function checkpoint(expected:Campaign,id:string,result:CampaignResult,slot:CampaignSlot,cinematics:boolean):Promise<Campaign>{
  return updateCampaign(expected,slot,current=>{
    if(pendingCampaignScene(current))return current;
    const next=acceptStage(current,id,result);
    const cinematic=cinematics&&transitionAfter(id);
    return next!==current&&cinematic?{...next,cinematic}:next;
  });
}

export function finishScene(expected:Campaign,scene:CampaignScene,slot:CampaignSlot,cinematics:boolean):Promise<Campaign>{
  return updateCampaign(expected,slot,current=>acknowledgeCampaignScene(current,scene,cinematics));
}

function updateCampaign(expected:Campaign,slot:CampaignSlot,update:(current:Campaign)=>Campaign):Promise<Campaign>{
  return db.transaction('rw',db.campaign,async ()=>{
    const current=await readCampaign(slot);
    if(JSON.stringify(current)!==JSON.stringify(expected))return current;
    const next=update(current);
    if(next!==current)await db.campaign.put({id:slot,data:next});
    return next;
  });
}

/** Continue from the filed lunar report if the campaign slot has no progress. */
export async function continueFromFirstLight(): Promise<'transferred' | 'existing'> {
  return db.transaction('rw', db.campaign, async () => {
    const chapter = await readCampaign('primera-luz');
    if (activeStage(chapter)?.id !== 'moon-site' || pendingCampaignScene(chapter)) throw new Error('First Light report is incomplete');

    const campaign = await readCampaign('aurora');
    if (campaign.log.length > 0 || campaign.departureSeen) return 'existing';

    await db.campaign.put({ id: 'aurora', data: chapter });
    return 'transferred';
  });
}
