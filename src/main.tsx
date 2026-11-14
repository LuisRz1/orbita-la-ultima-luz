import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { type Language, type Localized, type Point, type POI, type World, distance, isWalkable } from './kit/contract.ts';
import { applyAction, approachRange, begin, budget, cost, initial, restore, type Failure, type Loadout, type MissionState } from './kit/mission.ts';
import { artUrl, mountSurface, Surface } from './kit/scene.ts';
import { readSlot, writeSlot } from './kit/storage.ts';
import { moon, worlds } from './worlds/index.ts';
import type { LunarHandoff } from './worlds/orbit/progress.ts';
import './style.css';

const OrbitChapter=lazy(()=>import('./worlds/orbit/OrbitChapter.tsx').then(module=>({default:module.OrbitChapter})));
const pack = (es:string,en:string):Localized => ({es,en});
const plans = [
  {id:'survey', title:pack('Exploración','Survey'), desc:pack('Más reserva y escaneo eficiente','More reserve and efficient scans')},
  {id:'repair', title:pack('Reparación','Repair'), desc:pack('Repara el relé con 3 unidades menos','Repair the relay with 3 fewer units')},
] as const;
const glyph = {scan:'⌕',salvage:'◇',service:'⌁',upload:'↑'};
const err:Record<Failure,Localized> = {
  inactive:pack('La expedición aún no está activa.','The expedition is not active yet.'),
  unknown:pack('Acércate a un objetivo marcado.','Approach a marked objective.'),
  distance:pack('Acércate al punto antes de actuar.','Approach the point before acting.'),
  done:pack('Este punto ya quedó registrado.','This point has already been recorded.'),
  requirements:pack('Faltan requisitos. Consulta la lista de objetivos.','Requirements remain. Check the objectives.'),
  power:pack('Guarda energía para los objetivos pendientes y el regreso.','Keep enough power for pending objectives and your return.'),
};
const voice = pack('Canal de expedición','Expedition channel');
const other = (lang:Language) => lang==='es'?'en':'es';

function Expedition({world,lang}: {world:World;lang:Language}) {
  const t=(es:string,en:string)=>lang==='es'?es:en;
  const [state,setState]=useState<MissionState>(()=>initial(world));
  const [loaded,setLoaded]=useState(false);
  const [ready,setReady]=useState(false);
  const [paused,setPaused]=useState(false);
  const [focus,setFocus]=useState<string|null>(null);
  const [near,setNear]=useState<POI|null>(null);
  const [position,setPosition]=useState<Point>(world.spawn);
  const [notice,setNotice]=useState<Localized|null>(null);
  const [saveError,setSaveError]=useState(false);
  const mount=useRef<HTMLDivElement>(null);
  const scene=useRef<Surface|null>(null);
  const stateRef=useRef(state);
  const sync=useRef(Promise.resolve());
  const slot=world.mission;
  const selected=world.points.find(p=>p.id===focus)??near;
  const completed=new Set(state.completed);
  const required=world.points.filter(p=>p.required);
  const score=required.filter(p=>completed.has(p.id)).length;
  const isTest=world.id!=='moon';
  function show(next:MissionState, persist:boolean) {
    stateRef.current=next;
    setState(next);
    if(persist) sync.current=sync.current.then(()=>writeSlot(slot,next)).then(()=>setSaveError(false))
      .catch(()=>setSaveError(true));
  }
  function perform(id:string|undefined, at:Point, onlyScan=false) {
    const p=world.points.find(item=>item.id===id);
    if(!p){setNotice(err.unknown);return;}
    if(onlyScan&&p.action!=='scan'){setNotice(pack('Usa E para este equipo.','Use E for this equipment.'));return;}
    const result=applyAction(world,stateRef.current,p.id,at);
    setFocus(p.id);
    if(result.error){setNotice(err[result.error]);return;}
    setNotice(p.result);
    show(result.state,true);
  }
  useEffect(()=>{
    let current=true;
    readSlot(slot).then(data=>{
      if(!current)return;
      const saved=restore(world,data);
      if(saved){stateRef.current=saved;setState(saved);setPosition(saved.position);}
      if(data&&!saved)setNotice(pack('No se usó un guardado incompatible.','An incompatible save was not loaded.'));
    }).catch(()=>{ if(current)setSaveError(true); }).finally(()=>{if(current)setLoaded(true);});
    return()=>{current=false;};
  },[world,slot]);
  useEffect(()=>{
    if(!loaded||!mount.current)return;
    const instance=new Surface(world,stateRef.current.position,{onNear:setNear,
      onSelect:setFocus,onUse:perform,onReady:()=>setReady(true),
      onStop:position=>{stateRef.current={...stateRef.current,position};setPosition(position);}});
    scene.current=instance;
    const game=mountSurface(mount.current,instance);
    return()=>{scene.current=null;game.destroy(true);};
    // The loaded scene owns the stable world and uses stateRef for live state.
  },[world,loaded]);
  useEffect(()=>{
    scene.current?.setStatus({active:state.phase==='operation',completed:new Set(state.completed),focus});
  },[state.phase,state.completed,focus,loaded]);
  useEffect(()=>{ scene.current?.setPaused(paused); },[paused]);
  useEffect(()=>{
    const pauseWhenHidden=()=>{
      if(document.hidden&&stateRef.current.phase==='operation')setPaused(true);
    };
    document.addEventListener('visibilitychange',pauseWhenHidden);
    return()=>document.removeEventListener('visibilitychange',pauseWhenHidden);
  },[]);
  function go(p:POI) {
    setFocus(p.id);
    setNotice(p.hint);
    scene.current?.goTo(p.id);
  }
  function newRun(loadout:Loadout) {
    scene.current?.reset(world.spawn);
    setPosition(world.spawn);
    setFocus(null);setPaused(false);setNotice(world.arrival);
    show(begin(world,loadout),true);
  }
  function backToBriefing() {
    setFocus(null);setPaused(false);setNotice(null);
    setPosition(world.spawn);
    scene.current?.reset(world.spawn);
    show(initial(world,state.loadout),true);
  }
  function interact() {
    const p=selected;
    if(!p)return;
    const at=scene.current?.current()??stateRef.current.position;
    if(isWalkable(world,at))perform(p.id,at);
  }
  const cannotUse=!selected || distance(position,selected.position)>approachRange;
  return <>
    <div className="mission-heading">
      <div>
        <div className="eyebrow"><span className="signal"/> {t('MUNDO', 'WORLD')} 0{worlds.indexOf(world)+1} <span className="slash">//</span> {world.subtitle[lang]}</div>
        <h1>{world.title[lang]}<span>.</span></h1>
        <p>{world.briefing[lang]}</p>
      </div>
      <div className="mission-label"><span>{isTest?t('PRUEBA DE INTEGRACIÓN','INTEGRATION TRIAL'):t('MISIÓN DE REFERENCIA','REFERENCE MISSION')}</span><strong>{isTest?'SANDBOX':'AURORA / C2'}</strong></div>
    </div>
    <div className="console-grid">
      <section className="camera-card" aria-label={t('Campo de operación','Operations field')}>
        <div className="panel-head">
          <span><span className="dot"/> {t('VISTA DE CAMPO','FIELD VIEW')}</span>
          <span>{ready?t('ENLACE LOCAL','LOCAL LINK'):t('CARGANDO','LOADING')} <b>◈</b></span>
        </div>
        <div className="view">
          <div className="surface" ref={mount}/>
          <div className="view-corner" aria-hidden="true"><span>⌖</span> <b>{world.id.toUpperCase()} / 01</b></div>
          {state.phase==='briefing'&&<div className="view-overlay">
            <div className="briefing">
              <span className="mini">{t('01 / PLANIFICACIÓN','01 / PLANNING')}</span>
              <h2>{t('Prepara la salida','Plan your sortie')}</h2>
              <p>{t('Elige una carga. Conserva 2 unidades para volver.','Choose a loadout. Keep 2 units in reserve for your return.')}</p>
              <div className="loadouts">
                {plans.map(p=><button key={p.id} className={state.loadout===p.id?'plan active':'plan'}
                  aria-pressed={state.loadout===p.id} onClick={()=>show(initial(world,p.id),false)}>
                  <b>{p.title[lang]}</b><span>{p.desc[lang]}</span><small>{budget[p.id]} {t('u. energía','power units')}</small>
                </button>)}
              </div>
              <button className="primary" disabled={!ready} onClick={()=>newRun(state.loadout)}>{t('Iniciar expedición','Start expedition')} <span>↗</span></button>
            </div>
          </div>}
          {state.phase==='report'&&<div className="view-overlay report-overlay">
            <div className="briefing report" role="region" aria-label={t('Informe de misión','Mission report')}>
              <span className="mini"><span className="green">✓</span> {t('03 / INFORME','03 / REPORT')}</span>
              <h2>{t('Transmisión recibida','Transmission received')}</h2>
              <p>{world.outcome[lang]}</p>
              <div className="report-stats">
                <div><b>{score}/{required.length}</b><span>{t('Objetivos','Objectives')}</span></div>
                <div><b>{budget[state.loadout]-state.power}</b><span>{t('Energía usada','Power used')}</span></div>
                <div><b>{state.power}</b><span>{t('Reserva final','Final reserve')}</span></div>
              </div>
              <p>{t('Configuración utilizada:', 'Loadout used:')} {plans.find(p=>p.id===state.loadout)?.title[lang]}.</p>
              <button className="primary" onClick={backToBriefing}>{t('Volver a planificar','Plan again')} <span>↺</span></button>
            </div>
          </div>}
          {paused&&state.phase==='operation'&&<div className="view-overlay"><div className="briefing compact">
            <span className="mini">{t('PAUSA LOCAL','LOCAL PAUSE')}</span><h2>{t('Expedición en pausa','Expedition paused')}</h2>
            <button className="primary" onClick={()=>setPaused(false)}>{t('Continuar','Resume')} <span>↗</span></button>
            <details className="abort"><summary>{t('Volver a planificar','Plan again')}</summary>
              <p>{t('Se reiniciará esta expedición de prueba.','This trial expedition will restart.')}</p>
              <button className="secondary" onClick={backToBriefing}>{t('Reiniciar expedición','Restart expedition')}</button>
            </details>
          </div></div>}
        </div>
        <div className="field-footer">
          <span><kbd>WASD</kbd> {t('mover','move')} <kbd>E</kbd> {t('usar','use')} <kbd>R</kbd> {t('escanear','scan')}</span>
          <span>{t('También puedes hacer clic en el mapa.','You can also click the map.')}</span>
          {state.phase==='operation'&&<button className="small-action" onClick={()=>setPaused(!paused)}>{paused?t('Continuar','Resume'):t('Pausa','Pause')}</button>}
        </div>
      </section>
      <aside className="mission-card" aria-label={t('Diario de misión','Mission journal')}>
        <div className="panel-head"><span><span className="dot gold"/> {t('DIARIO DE MISIÓN','MISSION JOURNAL')}</span><span>{score}/{required.length}</span></div>
        <div className="journal">
          <div className="power-label"><span>{t('ENERGÍA DE CAMPO','FIELD POWER')}</span><strong>{state.power}<small> / {budget[state.loadout]}</small></strong></div>
          <div className="energy" role="progressbar" aria-label={t('Energía disponible','Available power')} aria-valuenow={state.power} aria-valuemax={budget[state.loadout]} aria-valuemin={0}>
            <span style={{width:100*state.power/budget[state.loadout]+'%'}}/>
          </div>
          <p className="reserve">{t('Reserva mínima de retorno: 2 u.','Minimum return reserve: 2 units.')}</p>
          <div className="objectives">
            {world.points.map(p=><button key={p.id} data-point={p.id} disabled={!ready||state.phase!=='operation'||paused}
              className={'objective'+(selected?.id===p.id?' selected':'')+(completed.has(p.id)?' done':'')}
              onClick={()=>go(p)}>
              <span className="objective-icon" aria-hidden="true">{completed.has(p.id)?'✓':glyph[p.action]}</span>
              <span><b>{p.title[lang]}</b><small>{completed.has(p.id)?t('Registrado','Recorded'):p.required?t('Principal','Required'):t('Opcional','Optional')}</small></span>
              <span className="objective-cost">{!completed.has(p.id)&&cost(p,state.loadout)>0?cost(p,state.loadout)+' u.':'›'}</span>
            </button>)}
          </div>
          <div className="target">
            <p>{selected?.hint[lang]??t('Selecciona un objetivo para ver su ruta.','Select an objective to see its route.')}</p>
            <button className="secondary" disabled={!ready||state.phase!=='operation'||paused||cannotUse}
              onClick={interact}>{t('Interactuar','Interact')} <kbd>E</kbd></button>
          </div>
        </div>
      </aside>
    </div>
    <section className="signal-card" aria-live="polite">
      <div className={'portrait '+world.id} aria-hidden="true" style={{backgroundImage:'url('+artUrl('luma-'+world.id+'.png')+')'}}/>
      <div><span className="mini">{voice[lang]} / LUMA</span><p>{notice?.[lang]??t('«Estoy contigo. Revisa el plan antes de salir».','“I’m with you. Check the plan before we head out.”')}</p></div>
      <span className="save-state"><span className="dot"/> {saveError?t('Guardado no disponible','Save unavailable'):t('Partida local','Local save')}</span>
    </section>
  </>;
}

function App() {
  const [world,setWorld]=useState(()=> {
    const id=new URLSearchParams(window.location.search).get('world');
    return worlds.find(w=>w.id===id)??moon;
  });
  const [handoff,setHandoff]=useState<LunarHandoff|null>(null);
  const [lang,setLang]=useState<Language>('es');
  const t=(es:string,en:string)=>lang==='es'?es:en;
  const selectWorld=useCallback((selected:World, arrival:LunarHandoff|null=null)=>{
    const url=new URL(window.location.href);
    if(selected.id==='orbit'||arrival)url.searchParams.set('world',selected.id);
    else url.searchParams.delete('world');
    if(arrival)url.searchParams.set('arrival','orbit');
    else url.searchParams.delete('arrival');
    window.history.replaceState(window.history.state,'',url);
    setHandoff(arrival);
    setWorld(selected);
  },[]);
  const continueToMoon=useCallback((arrival:LunarHandoff)=>selectWorld(moon,arrival),[selectWorld]);
  useEffect(()=>{
    if(world.id!=='moon'||new URLSearchParams(window.location.search).get('arrival')!=='orbit')return;
    let current=true;
    import('./worlds/orbit/storage.ts').then(({readLunarHandoff})=>readLunarHandoff()).then(arrival=>{
      if(current&&new URLSearchParams(window.location.search).get('arrival')==='orbit')setHandoff(arrival);
    }).catch(()=>{});
    return()=>{current=false;};
  },[world.id]);
  return <div className="app">
    <header className="topbar">
      <div className="brand"><span className="logomark" aria-hidden="true"><i/></span><span><b>ÓRBITA</b><small>LA ÚLTIMA LUZ</small></span></div>
      <nav aria-label={t('Mundos de referencia','Reference worlds')}>
        {worlds.map(w=><button key={w.id} aria-current={w.id===world.id?'page':undefined}
          onClick={()=>selectWorld(w)}>{({orbit:t('Órbita','Orbit'),moon:t('Luna','Moon'),mars:t('Marte','Mars'),bennu:'Bennu'})[w.id]}</button>)}
      </nav>
      <button className="language" aria-label={t('Cambiar idioma a inglés','Switch language to Spanish')} onClick={()=>{
        document.documentElement.lang=other(lang);setLang(other(lang));
      }}>{lang.toUpperCase()} <span>⌄</span></button>
    </header>
    <main>{world.id==='orbit'
      ?<Suspense fallback={<p role="status">{t('Cargando Órbita…','Loading Orbit…')}</p>}>
        <OrbitChapter lang={lang} onContinue={continueToMoon}/>
      </Suspense>
      :<>
        {world.id==='moon'&&handoff?<section className="signal-card" aria-label={t('Entrega desde Órbita','Handoff from Orbit')}>
          <div><span className="mini">{t('NODO LUNAR / INFORME DE ÓRBITA','LUNAR NODE / ORBIT REPORT')}</span>
            <p>{handoff.evidence.join(' · ')} · {t('Pruebas validadas. Siguiente hito: preparar el descenso al archivo lunar.',
              'Evidence validated. Next milestone: prepare the descent to the lunar archive.')}</p></div>
        </section>:null}
        <Expedition key={world.id} world={world} lang={lang}/>
      </>}</main>
    <footer className="site-footer"><span>ÓRBITA / {t('EXPLORACIÓN ESPACIAL','SPACE EXPLORATION')}</span><span>{t('Simulación educativa · Valores de juego','Educational simulation · Gameplay values')}</span></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App/>);
