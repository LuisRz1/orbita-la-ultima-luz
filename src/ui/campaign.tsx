import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import {
  acceptStage, activeStage, chapterNames, fuelLeft, missionLog, option, pendingCampaignScene, spacecraft,
  type Campaign, type CampaignResult, type CampaignScene,
} from '../core/campaign.ts';
import { t } from '../core/orbit/engineering.ts';
import { checkpoint, continueFromFirstLight, finishScene, readCampaign, type CampaignSlot } from '../core/save/campaign.ts';
import { firstLightSuit } from '../core/orbit/first-light.ts';
import type { Report } from '../core/sortie.ts';
import { loadCampaignLevel, loadReturnExpedition } from '../levels/campaign.ts';
import type { LevelModule } from '../levels/registry.ts';
import { GameCanvas } from './game-canvas.tsx';
import { useT } from './i18n.ts';
import { prefs } from './prefs.ts';
import { CampaignCruise, CampaignDesign, CampaignReport, EvidenceList, RouteChoices } from './screens/campaign-panels.tsx';
import { CampaignFlight } from './screens/flight.tsx';
import { CampaignCinematicScene } from './screens/campaign-scenes.tsx';
import { FirstLightArchive, FirstLightArrival, FirstLightCabin, firstLightSummaries } from './screens/first-light.tsx';
import { SortieScreen } from './screens/sortie.tsx';
import { hud } from './store.ts';
import './screens/orbit.css';
import './campaign.css';

type Stage=NonNullable<ReturnType<typeof activeStage>>;
const missionNames=[
  [t('Antes de despegar','Before liftoff'),t('De la Tierra a la órbita','From Earth to orbit'),t('Encuentro en la estación','Rendezvous with the station'),
    t('La carga inesperada','The unexpected cargo'),t('Fuera del casco','Outside the hull'),t('Una ruta hacia la Luna','A route to the Moon')],
  [t('Elegir dónde bajar','Choose where to land'),t('Una casa bajo la luz','A home in the light'),t('Huellas del terreno','Traces in the terrain'),
    t('Frontera de sombra','Border of shadow'),t('La voz que se pierde','A fading voice'),t('Volver con evidencia','Return with evidence')],
  [t('Entre dos mundos','Between two worlds'),t('Aterrizar lejos de casa','Land far from home'),t('Un refugio en Marte','A refuge on Mars'),
    t('Historia escrita en las rocas','History written in stone'),t('El camino de vuelta','The way back'),t('Lo que llevamos','What we carry')],
  [t('Rumbo a Bennu','Bound for Bennu'),t('Un mundo sin suelo','A world without ground'),t('Memoria del Sistema Solar','Memory of the Solar System'),
    t('Preparar el regreso','Prepare the return'),t('Todavía hay camino','There is still a way'),t('Las cosas que quedan','The things that remain')],
];

function CampaignJournal({state,firstOnly,close}:{state:Campaign;firstOnly:boolean;close:()=>void}){
  const {t:translate}=useT();
  const dialog=useRef<HTMLDialogElement>(null);
  const done=new Set<string>(missionLog(state));
  const stage=activeStage(state),current=firstOnly?1:stage?.chapter??4;
  const [points]=useState(()=>{
    if(stage?.id!=='station'&&stage?.id!=='eva')return [];
    return hud.getState().objectives.filter(objective=>objective.done).map(objective=>objective.id);
  });
  const fieldRegistered=stage?.id==='station'&&points.includes('capsule');
  const currentC1=stage?.chapter===1?'C1-M0'+(done.size+(fieldRegistered?2:1)):null;
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  return <dialog data-campaign-journal ref={dialog} className="campaign-journal" aria-label={translate(t('Diario de campaña','Campaign journal'))}
    onCancel={e=>{e.preventDefault();close();}}>
    <header>
      <h2>{translate(t('Diario de campaña','Campaign journal'))}</h2>
      <button onClick={close}>{translate(t('Volver','Back'))} <kbd>Esc</kbd></button>
    </header>
    <p className="campaign-kicker">{done.size} / {firstOnly?6:24} · {translate(t('Misiones registradas','Missions logged'))}</p>
    <div className="campaign-chapters">
      {missionNames.slice(0,firstOnly?1:missionNames.length).map((list,i)=><section key={i}>
        <h3>{i+1<=current?translate(chapterNames[i]):translate(t('Capítulo','Chapter'))+' '+(i+1)}</h3>
        <ol>{list.map((label,j)=>{
          const id='C'+(i+1)+'-M0'+(j+1), complete=done.has(id);
          const inSortie=id==='C1-M03'&&fieldRegistered;
          return <li key={id} data-mission={id} aria-current={currentC1===id?'step':undefined}
            data-status={complete?'complete':inSortie?'in-sortie':'pending'}>
            <span aria-hidden="true">{complete||inSortie?'✓':currentC1===id?'◆':'○'}</span> {i+1<=current?translate(label):id}
            {inSortie&&<small> · {translate(t('Cotejo listo','Cross-check complete'))}</small>}
          </li>;
        })}</ol>
      </section>)}
    </div>
    <h3>{translate(t('Pruebas de Aurora','Aurora evidence'))}</h3>
    <EvidenceList state={state} points={points}/>
    <FirstLightArchive state={state} points={points}/>
  </dialog>;
}

function Panel({title,children}:{title:string;children:ReactNode}){
  return <div className="screen campaign-terminal">
    <section className="panel campaign-panel" aria-label={title}>
      <h1>{title}</h1>
      {children}
    </section>
  </div>;
}

function Field({site,state,stage,revisit,busy,onDone,onExit,slot}:{
  site:string;state:Campaign;stage:Stage|null;revisit:boolean;busy:boolean;
  onDone:(value:Report)=>void;onExit:()=>void;slot?:CampaignSlot;
}){
  const {t:translate}=useT();
  const [module,setModule]=useState<LevelModule|null>(null);
  const [error,setError]=useState<string|null>(null);
  const ready=useStore(hud,s=>s.ready);
  useEffect(()=>{
    let live=true;
    const load=revisit?loadReturnExpedition:loadCampaignLevel;
    load(site,state).then(value=>{if(live)setModule(value);}).catch(()=>{if(live)setError('level');});
    return ()=>{live=false;};
  },[site,state,revisit]);
  const chapter=stage?.chapter??(site==='departure'?1:4);
  const options=useMemo(()=>module?{module,site,chapter,autostart:['departure','ground','station','eva','service','earth'].includes(site),
    luma:!revisit,saveId:slot==='primera-luz'?'first-light:'+module.level.mission:undefined,
    entryDesign:site==='station'||site==='eva'?firstLightSuit(spacecraft(state)):undefined}:undefined,[module,site,chapter,revisit,slot,state]);
  if(error)return <Panel title={translate(t('No se pudo abrir el terreno','The terrain could not be opened'))}>
    <button onClick={onExit}>{translate(t('Volver al menú','Back to menu'))}</button>
  </Panel>;
  return <>
    {options&&<GameCanvas options={options} onError={setError}/>}
    {!ready&&<p className="loading" role="status">{translate('loading')}</p>}
    {ready&&<SortieScreen campaign civilian={module?.level.attire==='civilian'} onExit={onExit} onComplete={onDone} busy={busy}
      summary={chapter===1?firstLightSummaries[site]:undefined}/>}
  </>;
}

const destinations=[['moon',t('Luna','Moon')],['mars',t('Marte','Mars')],['bennu',t('Bennu','Bennu')]] as const;
export function CampaignGame({onExit,slot,onFullCampaign}:{
  onExit:()=>void;slot:CampaignSlot;onFullCampaign:()=>void;
}){
  const {t:translate,lang}=useT();
  const [state,setState]=useState<Campaign|null>(null);
  const [busy,setBusy]=useState(false);
  const writing=useRef(false);
  const [error,setError]=useState<'read'|'write'|'rule'|'handoff'|null>(null);
  const [campaignExists,setCampaignExists]=useState(false);
  const [journal,setJournal]=useState(false);
  const [revisit,setRevisit]=useState<string|null>(null);
  const firstOnly=slot==='primera-luz';
  const pending=state?pendingCampaignScene(state):null;
  const cinematic=pending&&pending!=='departure'?pending:null;
  const load=useCallback(()=>{
    setError(null);
    readCampaign(slot).then(setState).catch(()=>setError('read'));
  },[slot]);
  useEffect(load,[load]);
  useEffect(()=>{
    if(cinematic)return;
    const keys=(event:KeyboardEvent)=>{
      if(event.key==='Tab'&&!event.shiftKey&&!event.metaKey&&!event.ctrlKey&&
        (event.target===document.body||event.target instanceof HTMLCanvasElement)){
        event.preventDefault();setJournal(true);
      }
    };
    window.addEventListener('keydown',keys);
    return()=>window.removeEventListener('keydown',keys);
  },[cinematic]);
  const active=state?activeStage(state):null;
  const stage=firstOnly&&active?.chapter!==1?null:active;
  async function saveProgress(update:()=>Promise<Campaign>){
    if(writing.current)return;
    writing.current=true;setBusy(true);setError(null);
    try {setState(await update());}
    catch {setError('write');}
    finally{writing.current=false;setBusy(false);}
  }
  function record(result:CampaignResult){
    if(!state||!stage||pending)return;
    if(acceptStage(state,stage.id,result)===state){setError('rule');return;}
    return saveProgress(()=>checkpoint(state,stage.id,result,slot,prefs.getState().cinematics));
  }
  function closeScene(id:CampaignScene){
    if(state)return saveProgress(()=>finishScene(state,id,slot,prefs.getState().cinematics));
  }
  function fileField(report:Report){
    if(report.outcome==='complete'&&report.requiredDone===report.required)void record({
      kind:'field',points:report.completed,energy:report.left,
    });
  }
  async function handoffToCampaign() {
    if (!firstOnly || stage || pending || writing.current) return;
    writing.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await continueFromFirstLight();
      if (result === 'existing') setCampaignExists(true);
      else onFullCampaign();
    } catch {
      setError('handoff');
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  if(!state)return <div className="campaign-sky">
    <Panel title={translate(t('Campaña de Aurora','Aurora campaign'))}>
      {error?<><p role="alert">{translate(t('No se pudo leer el guardado local.','Local progress could not be read.'))}</p>
        <button onClick={load}>{translate(t('Reintentar','Retry'))}</button> <button onClick={onExit}>{translate(t('Volver','Back'))}</button></>:
        <p role="status">{translate('loading')}</p>}
    </Panel>
  </div>;
  const finished=!stage;
  let scene:ReactNode;
  if(pending==='departure')scene=<Field key="departure" site="departure" state={state} stage={null} revisit={false} busy={busy}
    onDone={report=>{if(report.outcome==='complete'&&report.completed.includes('sister-goodbye'))void closeScene('departure');}}
    onExit={onExit} slot={slot}/>;
  else if(cinematic)scene=prefs.getState().cinematics?<CampaignCinematicScene key={cinematic} scene={cinematic} busy={busy}
    onFinish={()=>void closeScene(cinematic)}/>:<div className="campaign-sky">
    <Panel title={translate(t('Continuar la historia','Continue the story'))}>
      <button className="primary" onClick={()=>void closeScene(cinematic)} disabled={busy}>{translate(t('Continuar','Continue'))}</button>
    </Panel>
  </div>;
  else if(revisit)scene=<Field key={'post-'+revisit} site={revisit} state={state} stage={null} revisit busy={false}
    onDone={()=>setRevisit(null)} onExit={()=>setRevisit(null)}/>;
  else if(stage?.action==='field')scene=<Field key={stage.id} site={stage.site!} state={state} stage={stage} revisit={false} busy={busy} slot={slot}
    onDone={fileField} onExit={onExit}/>;
  else if(stage?.action==='flight')scene=<CampaignFlight key={stage.id} state={state} stage={stage} busy={busy}
    onCapture={telemetry=>void record({kind:'flight',telemetry})}/>;
  else scene=<div className="campaign-sky">
    <div className="campaign-orbital-art" aria-hidden="true"><i/><b/><span/></div>
    {stage?.id==='moon-cruise'&&<FirstLightCabin/>}
    <Panel title={stage?translate(stage.title):translate(firstOnly?t('Primera luz completado','First Light complete'):t('Aurora está en casa','Aurora is home'))}>
      {stage?.action==='design'&&<CampaignDesign busy={busy}
        onAccept={plan=>{if(plan.briefingRead)void record({kind:'design',design:plan.design,briefing:true,compared:plan.compared});}}/>}
      {stage?.action==='briefing'&&<RouteChoices key={stage.id} id={stage.id} state={state} busy={busy}
        onChoose={option=>{void record({kind:'choice',option});}}/>}
      {stage?.action==='cruise'&&<CampaignCruise key={stage.id} id={stage.id} state={state} busy={busy}
        onComplete={hours=>{void record({kind:'cruise',hours});}}/>}
      {stage?.action==='report'&&<CampaignReport key={stage.id} id={stage.id} state={state} busy={busy}
        onComplete={()=>{void record({kind:'report'});}}/>}
      {finished&&firstOnly&&<>
        <FirstLightArrival state={state} route={option(state,'moon-plan')==='economy'?'economy':'express'}/>
        <EvidenceList state={state}/>
        {campaignExists ? <>
          <p role="status">{translate(t('Ya hay una campaña guardada. Puedes reanudarla desde su último hito.',
            'A campaign is already saved. You can resume it from its last checkpoint.'))}</p>
          <button type="button" className="primary" onClick={onFullCampaign}>
            {translate(t('Reanudar campaña guardada','Resume saved campaign'))} ↗
          </button>
        </> : <button type="button" className="primary" onClick={() => void handoffToCampaign()} disabled={busy}>
          {translate(t('Continuar con el capítulo 2','Continue to Chapter 2'))} ↗
        </button>}
      </>}
      {finished&&!firstOnly&&<>
        <p>{translate(t('Las tres personas de Aurora volvieron a salvo. Se archivaron los resultados, las muestras y el recuerdo de LUMA.',
          'All three members of Aurora returned safely. The findings, samples and memory of LUMA are archived.'))}</p>
        <EvidenceList state={state}/>
        <h2>{translate(t('Expediciones posteriores','Follow-up expeditions'))}</h2>
        <div className="actions">{destinations.map(([id,title])=><button key={id} type="button" onClick={()=>setRevisit(id)}>
          {translate(title)} ↗</button>)}</div>
      </>}
    </Panel>
  </div>;
  const chapter=firstOnly?1:stage?.chapter??4;
  return <div className="campaign-game" data-stage={pending==='departure'?'departure':cinematic?'scene-'+cinematic:
    revisit?'revisit-'+revisit:stage?.id??'complete'}>
    {scene}
    {!cinematic&&<div className="campaign-toolbar">
      <span>{translate(chapterNames[chapter-1])} · {missionLog(state).length}/{firstOnly?6:24}</span>
      <button type="button" data-journal onClick={()=>setJournal(true)}>{translate(t('Diario','Journal'))}</button>
      <button type="button" data-campaign-lang onClick={()=>prefs.setState({lang:lang==='es'?'en':'es'})}
        aria-label={translate(t('Cambiar a inglés','Switch to Spanish'))}>{lang==='es'?'EN':'ES'}</button>
      {stage?.action!=='field'&&!revisit&&<button type="button" onClick={onExit} disabled={busy}>
        {translate(t('Menú','Menu'))}</button>}
    </div>}
    {!pending&&stage?.action==='flight'&&<p className="campaign-fuel">{translate(t('Combustible al inicio del tramo','Fuel at leg start'))} · {fuelLeft(state).toFixed(1)} u.</p>}
    {!cinematic&&journal&&<CampaignJournal state={state} firstOnly={firstOnly} close={()=>setJournal(false)}/>}
    {error&&<p className="save-error" role="alert">{translate(error==='rule'?
      t('Faltan requisitos para cerrar este tramo.','Some requirements for this leg are missing.'):error==='handoff'?
      t('No se pudo transferir el informe. Vuelve a confirmar para reintentar.','The report could not be transferred. Confirm again to retry.'):
      t('No se pudo guardar. Vuelve a confirmar para reintentar.','Could not save. Confirm again to retry.'))}</p>}
  </div>;
}
