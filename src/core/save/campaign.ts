import Dexie, { type Table } from 'dexie';
import { acceptStage, activeStage, newCampaign, restoreCampaign, type Campaign, type CampaignResult } from '../campaign.ts';

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
export async function checkpoint(expected:Campaign,id:string,result:CampaignResult,slot:CampaignSlot='aurora'):Promise<Campaign>{
  return db.transaction('rw',db.campaign,async ()=>{
    const current=await readCampaign(slot);
    if(JSON.stringify(current)!==JSON.stringify(expected))return current;
    const next=acceptStage(current,id,result);
    if(next!==current)await db.campaign.put({id:slot,data:next});
    return next;
  });
}

/** Continue from the filed lunar report if the campaign slot has no progress. */
export async function continueFromFirstLight(): Promise<'transferred' | 'existing'> {
  return db.transaction('rw', db.campaign, async () => {
    const chapter = await readCampaign('primera-luz');
    if (activeStage(chapter)?.id !== 'moon-site') throw new Error('First Light report is incomplete');

    const campaign = await readCampaign('aurora');
    if (campaign.log.length > 0) return 'existing';

    await db.campaign.put({ id: 'aurora', data: chapter });
    return 'transferred';
  });
}
