import { useEffect, useRef } from 'react';
import type { GameOptions } from '../engine/game.ts';

export function GameCanvas({onError,options}:{onError:(message:string)=>void;options?:GameOptions}){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const node=host.current;
    if(!node)return;
    const load=new AbortController();
    let dispose:(()=>void)|null=null;
    import('../engine/game.ts').then(({createGame})=>{
      load.signal.throwIfAborted();
      return createGame(node,options,load.signal);
    }).then(game=>{
      if(load.signal.aborted)game.dispose();
      else dispose=game.dispose;
    }).catch((e:unknown)=>{
      if(!load.signal.aborted)onError(e instanceof Error?e.message:String(e));
    });
    return ()=>{load.abort();dispose?.();};
  },[onError,options]);
  return <div className="game-host" ref={host}/>;
}
