import type { Language } from '../core/contract/grid-v1.ts';
import { sound } from './audio.ts';

const prefix=import.meta.env.BASE_URL+'assets/voice/luma/';
let manifest:Promise<Record<string,unknown>>|null=null;
let request=0;

/** Optional clips supplied by the owner. The game requests only files declared in the manifest. */
export async function playLumaLine(scene:string,key:string,index:number,lang:Language){
  const ticket=++request;
  sound.stopVoice();
  manifest??=fetch(prefix+'clips.json')
    .then(async r=>r.ok&&r.headers.get('content-type')?.includes('json')?await r.json() as unknown:{})
    .then(data=>data&&typeof data==='object'?data as Record<string,unknown>:{})
    .catch(()=>({}));
  const list=await manifest;
  const clip=list[[scene,key,index,lang].join('/')];
  if(ticket===request&&typeof clip==='string'&&/^[a-z0-9][a-z0-9_-]*[.](m4a|ogg|wav|mp3)$/i.test(clip)){
    sound.voice(prefix+clip);
  }
}

export function stopLumaLine(){
  request++;
  sound.stopVoice();
}
