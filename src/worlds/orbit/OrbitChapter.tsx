import { useEffect, useMemo, useRef, useState } from 'react';
import { isWalkable, type Language, type Localized, type Point } from '../../kit/contract.ts';
import { artUrl } from '../../kit/scene.ts';
import { chapterTitle, discoveries, earth, exteriors, extras, missions, station } from './content.ts';
import { assessDesign, orbits, t } from './engineering.ts';
import { flightIds, initialFlight, type FlightId } from './flight.ts';
import { FieldPreview, FieldView } from './field-view.tsx';
import { FlightView } from './flight-view.tsx';
import { PlanConsole, TransferConsole } from './planner.tsx';
import {
  activateField, advanceCruise, archiveComparison, authorizeLaunch, beginEva, captureFlight, collectedStages, completedMissions,
  currentFuel, evidence, fileReport, finishCruise, freshOrbit, fuelLeft, has, lunarHandoff, missionNumber, planTransfer,
  readBriefing, recordedData, requiredFlightFuel, setDesign, type LunarHandoff, type OrbitState,
} from './progress.ts';
import { AttemptReport, MissionReport, type Attempt } from './report.tsx';
import { readOrbit, writeOrbit } from './storage.ts';
import { CruiseView, EvaConsole } from './transit.tsx';
import './orbit.css';

const intro=t('Reconstruye la ruta de Aurora a partir de la cápsula recuperada. Tu hermana viajaba en esa expedición.',
  'Reconstruct Aurora’s route from the recovered capsule. Your sister was aboard the expedition.');
const unrecognized=t('No se cargó el registro de Órbita porque el formato no es compatible.',
  'The Orbit record was not loaded because its format is incompatible.');
const advances = {
  launch:t('Ascenso registrado. Corredor de encuentro confirmado.','Ascent recorded. Rendezvous corridor confirmed.'),
  dock:station.arrival,
  depart:t('Salida confirmada. La nave entra en el tramo de crucero.','Departure confirmed. The craft enters cruise.'),
  'lunar-approach':t('Acople al nodo lunar confirmado. Revisa el informe antes del descenso.','Docking at the lunar node confirmed. Review the report before descent.'),
};
const modes={planning:t('Complejo de lanzamiento','Launch complex'),launch:t('Ascenso guiado','Guided ascent'),
  dock:t('Corredor orbital','Orbital corridor'),station:station.subtitle,'eva-plan':t('Esclusa exterior','Exterior airlock'),
  eva:t('Exterior de estación','Station exterior'),transfer:t('Plan de traslado','Transfer plan'),
  depart:t('Salida del corredor','Corridor departure'),cruise:t('Crucero lunar','Lunar cruise'),
  'lunar-approach':t('Aproximación final','Final approach'),report:t('Nodo lunar','Lunar node'),complete:t('Nodo lunar','Lunar node')};

function ChapterJournal({state,lang}:{state:OrbitState;lang:Language}) {
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const completed=completedMissions(state);
  const stage=missionNumber(state);
  const finds=collectedStages(state);
  const known=evidence(state);
  const count=discoveries.filter(item=>finds.has(item.stage)).length;
  const side=extras.filter(item=>finds.has(item.id)).length;
  const plan=assessDesign(state.design);
  return <aside className="mission-card orb-journal" aria-label={loc('Diario del capítulo','Chapter journal')}>
    <div className="panel-head"><span><span className="dot gold"/> {loc('DIARIO DE MISIÓN','MISSION JOURNAL')}</span><span>{completed}/6</span></div>
    <div className="journal">
      <ol className="objectives orb-mission-list">{missions.map((mission,i)=>{
        const done=i<completed, current=!done&&i+1===stage, locked=!done&&!current;
        return <li key={mission.id} aria-current={current?'step':undefined}
          className={'objective'+(done?' done':'')+(current?' selected':'')+(locked?' orb-locked':'')}>
          <span className="objective-icon" aria-hidden="true">{done?'✓':String(i+1).padStart(2,'0')}</span>
          <span><b>{mission.title[lang]}</b><small>{mission.id} · {done?loc('Registrada','Recorded'):
            current?loc('En curso','In progress'):loc('Pendiente','Locked')}</small></span>
        </li>;
      })}</ol>
      <div className="orb-journal-details">
        <details className="abort">
          <summary>{loc('Telemetría y recursos','Telemetry and resources')}</summary>
          <ul className="orb-evidence">
            <li>{loc('Combustible de maniobra','Maneuver fuel')}: {currentFuel(state).toFixed(1)} / {plan.fuel} u.</li>
            <li>{loc('Datos obtenidos','Data collected')}: {recordedData(state)} / {plan.storage} GB.</li>
            <li>{loc('Capacidad de enlace','Downlink capacity')}: {plan.link} GB / {orbits[state.design.orbit].contact} h.</li>
            <li>{loc('Tiempo contabilizado','Accounted time')}: {(state.captures.length>0?plan.groundTime:0)+state.cruiseHours} / {plan.time} h.</li>
          </ul>
        </details>
        <details className="abort">
          <summary>{loc('Pruebas de Aurora','Aurora evidence')} · {known.length}/2</summary>
          <ul className="orb-evidence">
            <li><b>AUR-E01:</b> {known.includes('AUR-E01')?loc('Validada','Validated'):has(state,'capsule')?
              loc('Cotejada, pendiente de validar','Cross-checked, pending validation'):loc('Pendiente','Pending')}</li>
            <li><b>AUR-E02:</b> {known.includes('AUR-E02')?loc('Validada','Validated'):has(state,'recorder')?
              loc('Recuperada, pendiente de validar','Recovered, pending validation'):loc('Pendiente','Pending')}</li>
          </ul>
        </details>
        <details className="abort">
          <summary>{loc('Hallazgos','Discoveries')} · {count}/15</summary>
          <ul className="orb-evidence">{discoveries.filter(item=>finds.has(item.stage)).map(item=><li key={item.label.en}>{item.label[lang]}</li>)}</ul>
        </details>
        <details className="abort">
          <summary>{loc('Encargos opcionales','Optional assignments')} · {side}/4</summary>
          <ul className="orb-evidence">{extras.map(item=><li key={item.id}>{finds.has(item.id)?'✓':'○'} {item.id==='keepsake'&&!has(state,'protected-bay')?
            loc('Recuerdo sin identificar','Unidentified keepsake'):item.text[lang]}</li>)}</ul>
        </details>
      </div>
    </div>
  </aside>;
}

export function OrbitChapter({lang,onContinue}:{lang:Language;onContinue:(handoff:LunarHandoff)=>void}){
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const [state,setState]=useState(freshOrbit);
  const current=useRef(state);
  const [loaded,setLoaded]=useState(false);
  const [notice,setNotice]=useState<Localized|null>(null);
  const [attempt,setAttempt]=useState<Attempt|null>(null);
  const [saved,setSaved]=useState<'ready'|'saving'|'failed'>('ready');
  const [passage,setPassage]=useState<OrbitState|null>(null);
  const [handoffRequested,requestHandoff]=useState(false);
  const revision=useRef(0);
  const briefing=missionNumber(state);
  const mission=missions[briefing-1];
  const lumaSeen=has(state,'protected-bay');
  const calibrated=has(state,'translator');
  const fuel=fuelLeft(state);
  const assessed=useMemo(()=>assessDesign(state.design),[state.design]);
  const flight:FlightId|null=flightIds.find(id=>id===state.phase)??null;
  const start=useMemo(()=>flight?initialFlight(flight,fuel,state.design.orbit):null,[flight,fuel,state.design.orbit]);
  const field=state.phase==='station'||state.phase==='eva'?state.phase:null;

  useEffect(()=>{
    let live=true;
    readOrbit().then(({state:stored,incompatible})=>{
      if(!live)return;
      if(stored){current.current=stored;setState(stored);if(stored.phase==='complete')setPassage(stored);}
      if(incompatible)setNotice(unrecognized);
    }).catch(()=>{if(live)setSaved('failed');}).finally(()=>{if(live)setLoaded(true);});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    if(!handoffRequested||!passage)return;
    const handoff=lunarHandoff(passage);
    if(handoff)onContinue(handoff);
  },[handoffRequested,passage,onContinue]);

  function store(next:OrbitState){
    const ticket=++revision.current;
    setSaved('saving');
    writeOrbit(next).then(()=>{
      if(ticket!==revision.current)return;
      setSaved('ready');setPassage(next.phase==='complete'?next:null);
    }).catch(()=>{
      if(ticket!==revision.current)return;
      setSaved('failed');setPassage(null);
    });
  }
  function change(next:OrbitState,message?:Localized){
    if(next===current.current)return;
    current.current=next;
    setState(next);
    if(message)setNotice(message);
    store(next);
  }
  function reset(){
    const redesign=current.current.design;
    setAttempt(null);setNotice(null);setPassage(null);requestHandoff(false);
    change({...freshOrbit(),design:redesign});
  }
  function landed(id:FlightId, telemetry:Parameters<typeof captureFlight>[2]){
    const next=captureFlight(current.current,id,telemetry);
    if(next===current.current){setNotice(t('Aún no se cumplen posición, rumbo, velocidad o reserva.',
      'Position, heading, speed or reserve requirements are not met.'));return;}
    change(next,advances[id]);
  }
  function useField(id:string|undefined,at:Point,scan=false){
    const s=current.current;
    const mode=s.phase;
    if(mode!=='station'&&mode!=='eva')return;
    const world=mode==='station'?station:exteriors[s.evaRoute??'sheltered'];
    const point=world.points.find(p=>p.id===id);
    if(!point){setNotice(t('Acércate a un punto de misión.','Approach a mission point.'));return;}
    if(!isWalkable(world,at))return;
    if(scan&&point.action!=='scan'){setNotice(t('Usa E para esta acción.','Use E for this action.'));return;}
    const result=activateField(s,mode,point.id,at);
    if(result.error){
      setNotice(result.error==='power'?t('La operación gastaría energía necesaria para regresar.',
        'This action would use power needed for return.'):
        result.error==='distance'?t('Acércate al punto antes de actuar.','Approach the point before acting.'):
        result.error==='done'?t('Ya está registrado.','Already recorded.'):
        t('Termina los requisitos del diario antes de continuar.','Complete the journal prerequisites first.'));
      return;
    }
    change(result.state,point.result);
  }
  function applyPosition(at:Point){
    const s=current.current;
    if(s.phase!=='station'&&s.phase!=='eva')return;
    const save=s[s.phase];
    if(save) current.current={...s,[s.phase]:{...save,position:at}};
  }

  const fieldWorld=field==='station'?station:exteriors[state.evaRoute??'sheltered'];
  const fieldSave=field?state[field]:null;
  const region=state.phase==='planning'?'C1-R01':state.phase==='station'?'C1-R02':'C1-R03';
  const description=notice??(field==='station'&&lumaSeen?
    t('LUMA se mueve por el hábitat. Conserva el contacto con el compartimento protegido.',
      'LUMA moves around the habitat. Keep contact with its protected bay.'):intro);
  return <article className="orb-chapter">
    <div className="mission-heading">
      <div>
        <div className="eyebrow"><span className="signal"/> {loc('MUNDO','WORLD')} 01 <span className="slash">//</span> {modes[state.phase][lang]}</div>
        <h1>{chapterTitle[lang]}<span>.</span></h1>
        <p>{mission.task[lang]}</p>
      </div>
      <div className="mission-label">
        <span>{state.phase==='complete'?loc('CAPÍTULO REGISTRADO','CHAPTER RECORDED'):loc('CAPÍTULO 01','CHAPTER 01')}</span>
        <strong>{mission.id} / {region}</strong>
      </div>
    </div>
    {!loaded?<div className="mission-card"><div className="journal" role="status">{loc('Cargando registro de Órbita…','Loading Orbit record…')}</div></div>:
      <div className="console-grid orb-layout">
        <div className={field?'orb-work orb-field-work':'orb-work'}>
          {state.phase==='planning'?<>
            <FieldPreview world={earth} lang={lang}/>
            <PlanConsole state={state} lang={lang} onRead={()=>change(readBriefing(current.current))}
              onCompare={()=>change(archiveComparison(current.current))}
              onChange={design=>change(setDesign(current.current,design))}
              onLaunch={()=>change(authorizeLaunch(current.current),t('Control autorizó el ascenso.','Control authorized ascent.'))}/>
          </>:null}
          {flight&&start?(attempt?
            <AttemptReport attempt={attempt} lang={lang} onRetry={()=>setAttempt(null)} onRedesign={reset}/>:
            <FlightView key={flight} mode={flight} initial={start} mass={assessed.mass} minimumFuel={requiredFlightFuel(state)}
              lang={lang} onCapture={telemetry=>landed(flight,telemetry)} onFailure={(failure,ship)=>setAttempt({failure,ship})}/>
          ):null}
          {field&&fieldSave?<FieldView key={fieldWorld.mission} world={fieldWorld} save={fieldSave} lang={lang}
            tethered={field==='eva'} showCompanion={field==='station'&&lumaSeen} onUse={useField}
            onHint={setNotice} onPosition={applyPosition}/>:null}
          {state.phase==='eva-plan'?<EvaConsole lang={lang} onBegin={route=>change(beginEva(current.current,route),exteriors[route].arrival)}/>:null}
          {state.phase==='transfer'?<TransferConsole state={state} lang={lang} onSelect={route=>change(planTransfer(current.current,route))}/>:null}
          {state.phase==='cruise'?<CruiseView state={state} lang={lang}
            onAdvance={()=>change(advanceCruise(current.current))}
            onArrive={()=>change(finishCruise(current.current))}/>:null}
          {state.phase==='report'||state.phase==='complete'?<MissionReport state={state} lang={lang}
            onFile={()=>change(fileReport(current.current),t('Informe archivado. Luna recibe las pruebas validadas.',
              'Report filed. The Moon receives the validated evidence.'))}
            onContinue={()=>{requestHandoff(true);if(passage===null&&saved!=='saving')store(current.current);}} onReset={reset}/>:null}
          {handoffRequested&&saved==='failed'?<p role="alert" className="orb-save-warning">{loc(
            'No se guardó la entrega lunar. Vuelve a pulsar Continuar a la Luna para reintentar.',
            'The lunar handoff was not saved. Select Continue to the Moon again to retry.')}</p>:null}
        </div>
        <ChapterJournal state={state} lang={lang}/>
      </div>}
    <section className="signal-card" aria-live="polite">
      {lumaSeen?<div className="portrait orbit" aria-hidden="true" style={{backgroundImage:'url('+artUrl('luma-orbit.png')+')'}}/>:null}
      <div><span className="mini">{calibrated?loc('CANAL / CONTROL Y LUMA','CHANNEL / CONTROL AND LUMA'):
        lumaSeen?loc('CANAL / COMPARTIMENTO PROTEGIDO','CHANNEL / PROTECTED BAY'):loc('CANAL / CONTROL DE MISIÓN','CHANNEL / MISSION CONTROL')}</span>
        <p>{description[lang]}</p></div>
      <span className="save-state"><span className="dot"/> {saved==='failed'?loc('Guardado no disponible','Save unavailable'):
        saved==='saving'?loc('Guardando…','Saving…'):loc('Partida local','Local save')}</span>
    </section>
  </article>;
}
