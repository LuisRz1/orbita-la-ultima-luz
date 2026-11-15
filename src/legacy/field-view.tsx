import { useEffect, useRef, useState } from 'react';
import { distance, type Language, type Localized, type Point, type POI, type World } from '../core/contract/grid-v1.ts';
import { approachRange, budget, cost, type MissionState } from '../core/mission.ts';
import { mountSurface, Surface } from './scene.ts';
import { solarSource } from '../core/orbit/content.ts';

const glyph={scan:'⌕',salvage:'◇',service:'⌁',upload:'↑'};

export function FieldPreview({world,lang}:{world:World;lang:Language}){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!host.current)return;
    const scene=new Surface(world,world.spawn,{onNear:()=>{},onUse:()=>{},onSelect:()=>{},onReady:()=>{},onStop:()=>{}});
    scene.setStatus({active:false,completed:new Set(),focus:null,companionVisible:false,available:new Set()});
    const game=mountSurface(host.current,scene);
    return()=>game.destroy(true);
  },[world]);
  return <section className="camera-card" aria-label={world.subtitle[lang]}>
    <div className="panel-head"><span><span className="dot"/> {lang==='es'?'VISTA DE CAMPO':'FIELD VIEW'}</span><span>C1-R01</span></div>
    <div className="view"><div className="surface" ref={host}/><div className="view-corner" aria-hidden="true"><span>⌖</span> <b>{world.subtitle[lang]}</b></div></div>
  </section>;
}

type FieldProps = {world:World;save:MissionState;lang:Language;tethered?:boolean;showCompanion:boolean;
  onUse:(id:string|undefined,at:Point,scan?:boolean)=>void;onPosition:(p:Point)=>void;onHint:(text:Localized)=>void};

export function FieldView({world,save,lang,tethered=false,showCompanion,onUse,onPosition,onHint}:FieldProps){
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const [ready,setReady]=useState(false);
  const [paused,setPaused]=useState(false);
  const [focus,setFocus]=useState<string|null>(null);
  const [near,setNear]=useState<POI|null>(null);
  const [position,setPosition]=useState(save.position);
  const host=useRef<HTMLDivElement>(null);
  const scene=useRef<Surface|null>(null);
  const first=useRef(save.position);
  const callbacks=useRef({onUse,onPosition,onHint});
  callbacks.current={onUse,onPosition,onHint};
  const done=new Set(save.completed);
  const allowed=world.points.filter(p=>p.prerequisites.every(x=>done.has(x)));
  const picked=allowed.find(p=>p.id===focus)??allowed.find(p=>p.id===near?.id);
  const available=new Set(allowed.map(p=>p.id));
  function select(id:string){
    const poi=world.points.find(p=>p.id===id);
    if(poi){setFocus(id);callbacks.current.onHint(poi.hint);}
  }
  useEffect(()=>{
    if(!host.current)return;
    const instance=new Surface(world,first.current,{
      onNear:setNear,onSelect:select,onReady:()=>setReady(true),
      onUse:(id,point,scan)=>callbacks.current.onUse(id,point,scan),
      onStop:p=>{setPosition(p);callbacks.current.onPosition(p);},
    },{tethered});
    scene.current=instance;
    const game=mountSurface(host.current,instance);
    return()=>{scene.current=null;game.destroy(true);};
  },[world,tethered]);
  useEffect(()=>{
    scene.current?.setStatus({active:true,completed:new Set(save.completed),focus,
      companionVisible:showCompanion,available:new Set(world.points.filter(p=>p.prerequisites.every(x=>save.completed.includes(x))).map(p=>p.id))});
  },[save.completed,focus,world,showCompanion]);
  useEffect(()=>{scene.current?.setPaused(paused);},[paused]);
  useEffect(()=>{
    const hidden=()=>{if(document.hidden)setPaused(true);};
    document.addEventListener('visibilitychange',hidden);
    return()=>document.removeEventListener('visibilitychange',hidden);
  },[]);
  const interactive=ready&&!paused;
  return <>
    <section className="camera-card" aria-label={loc('Campo de operación','Operations field')}>
      <div className="panel-head"><span><span className="dot"/> {loc('VISTA DE CAMPO','FIELD VIEW')}</span>
        <span>{tethered?loc('EVA / ANCLAJE ACTIVO','EVA / TETHER ACTIVE'):loc('HÁBITAT PRESURIZADO','PRESSURIZED HABITAT')}</span>
      </div>
      <div className="view">
        <div className="surface" ref={host}/>
        <div className="view-corner" aria-hidden="true"><span>⌖</span> <b>{world.subtitle[lang]}</b></div>
        {paused?<div className="view-overlay"><div className="briefing compact">
          <h2>{loc('Operación en pausa','Operations paused')}</h2>
          <button className="primary" onClick={()=>setPaused(false)}>{loc('Continuar','Resume')} ↗</button>
        </div></div>:null}
      </div>
      <div className="field-footer">
        <span><kbd>WASD</kbd> {tethered?loc('barandas','handrails'):loc('mover','move')} <kbd>E</kbd> {loc('usar','use')} <kbd>R</kbd> {loc('escanear','scan')}</span>
        <span>{loc('También puedes hacer clic en el mapa.','You can also click the map.')}</span>
        <button className="small-action" disabled={!ready} onClick={()=>setPaused(p=>!p)}>
          {paused?loc('Reanudar','Resume'):loc('Pausa','Pause')}
        </button>
      </div>
    </section>
    <section className="mission-card" aria-label={loc('Operación actual','Current operation')}>
      <div className="panel-head"><span><span className="dot gold"/> {loc('PUNTOS DE MISIÓN','MISSION POINTS')}</span>
        <span>{done.size}/{world.points.length}</span>
      </div>
      <div className="journal">
        <div className="power-label"><span>{loc('ENERGÍA DE CAMPO','FIELD POWER')}</span><strong>{save.power}<small> / {budget[save.loadout]}</small></strong></div>
        <div className="energy" role="progressbar" aria-label={loc('Energía de campo','Field power')}
          aria-valuenow={save.power} aria-valuemax={budget[save.loadout]} aria-valuemin={0}>
          <span style={{width:100*save.power/budget[save.loadout]+'%'}}/>
        </div>
        <p className="reserve">{loc('Reserva mínima de retorno: 2 u.','Minimum return reserve: 2 units.')}</p>
        <div className="objectives">{world.points.map(p=>{
          const unlocked=available.has(p.id), completed=done.has(p.id);
          // La presencia de LUMA no se revela antes de abrir el compartimento.
          if(!unlocked&&['rest','protection','translator','keepsake','capsule-auth'].includes(p.id))return null;
          return <button key={p.id} data-orbit-point={p.id} disabled={!interactive||!unlocked}
            className={'objective'+(picked?.id===p.id?' selected':'')+(completed?' done':'')}
            onClick={()=>{select(p.id);scene.current?.goTo(p.id);}}>
            <span className="objective-icon" aria-hidden="true">{completed?'✓':unlocked?glyph[p.action]:'·'}</span>
            <span><b>{p.title[lang]}</b><small>{completed?loc('Registrado','Recorded'):!unlocked?
              loc('Pendiente','Locked'):p.required?loc('Principal','Required'):loc('Opcional','Optional')}</small></span>
            <span className="objective-cost">{unlocked&&!completed&&cost(p,save.loadout)>0?cost(p,save.loadout)+' u.':'›'}</span>
          </button>;
        })}</div>
        <div className="target">
          <p>{picked?.hint[lang]??loc('Selecciona un punto para seguir su ruta.','Select a point to follow its route.')}</p>
          <button className="secondary" disabled={!interactive||!picked||done.has(picked.id)||distance(position,picked.position)>approachRange}
            onClick={()=>onUse(picked?.id,scene.current?.current()??position)}>
            {loc('Interactuar','Interact')} <kbd>E</kbd>
          </button>
          {tethered?<p className="orb-source"><a href={solarSource} rel="noreferrer" target="_blank">{loc('NASA · luz y sombra en órbita','NASA · light and shadow in orbit')}</a></p>:null}
        </div>
      </div>
    </section>
  </>;
}
