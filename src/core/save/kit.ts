import Dexie, { type Table } from 'dexie';
import { type MissionState } from '../mission.ts';

class Saves extends Dexie {
  sessions!: Table<{ id:string; state:MissionState }, string>;
  constructor() {
    super('orbita-kit');
    this.version(1).stores({ sessions: 'id' });
  }
}
const db = new Saves();
export async function readSlot(id:string): Promise<unknown> {
  return (await db.sessions.get(id))?.state;
}
export async function writeSlot(id:string, state:MissionState) {
  await db.sessions.put({id,state});
}
