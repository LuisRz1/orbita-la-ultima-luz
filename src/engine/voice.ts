import type { Language } from '../core/contract/grid-v1.ts';
import type { LumaRecording } from '../levels/moon/dialogue.ts';
import { sound } from './audio.ts';

const prefix=import.meta.env.BASE_URL+'assets/voice/luma/';
const bundled=import.meta.glob('../assets/voice/luma/*/*/*.m4a',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
let manifest:Promise<Record<string,unknown>>|null=null;
let request=0;

export function bundledLumaVoice(lang:Language,{level,key,index}:LumaRecording):string|undefined {
  return bundled[`../assets/voice/luma/${lang}/${level}/${key.replace(/:/g,'_')}-${index}.m4a`];
}

/** Owner-supplied clips can override a matching bundled recording. */
export async function playLumaLine(scene:string,key:string,index:number,lang:Language,fallback?:string):Promise<number>{
  const ticket=++request;
  sound.stopVoice();
  manifest??=fetch(prefix+'clips.json')
    .then(async r=>r.ok&&r.headers.get('content-type')?.includes('json')?await r.json() as unknown:{})
    .then(data=>data&&typeof data==='object'?data as Record<string,unknown>:{})
    .catch(()=>({}));
  const list=await manifest;
  const clip=list[[scene,key,index,lang].join('/')];
  if(ticket!==request)return 0;
  if(typeof clip==='string'&&/^[a-z0-9][a-z0-9_-]*[.](m4a|ogg|wav|mp3)$/i.test(clip)){
    const seconds=await sound.narrate(prefix+clip);
    if(seconds||ticket!==request)return seconds;
  }
  return fallback?sound.narrate(fallback):0;
}

export function stopLumaLine(){
  request++;
  sound.stopVoice();
}
