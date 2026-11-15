import { useEffect, useState } from 'react';
import { collectedEvidence, documents, fuelLeft, option, people, rescueProfiles, spacecraft, validEvidence, viableRescue,
  voyage, type Campaign } from '../../core/campaign.ts';
import { evaRoutes, solarSource } from '../../core/orbit/content.ts';
import { assessTransfer, routeIds, routes, t } from '../../core/orbit/engineering.ts';
import { archiveId, evaRouteLength, pendingFirstLightEvidence, visorSource } from '../../core/orbit/first-light.ts';
import { archiveComparison, freshOrbit, readBriefing, setDesign } from '../../core/orbit/progress.ts';
import type { Localized } from '../../core/contract/grid-v1.ts';
import { useT } from '../i18n.ts';
import { PlanConsole } from './planner.tsx';
import { FirstLightArrival, FirstLightCabinSubtitle, FirstLightDossier } from './first-light.tsx';

export function CampaignDesign({onAccept,busy}:{onAccept:(plan:ReturnType<typeof freshOrbit>)=>void;busy:boolean}){
  const [plan,setPlan]=useState(freshOrbit);
  const {lang}=useT();
  return <div className="orb-chapter campaign-design">
    <fieldset disabled={busy}>
      <PlanConsole state={plan} lang={lang} briefing={<FirstLightDossier/>} onRead={()=>setPlan(readBriefing)} onCompare={()=>setPlan(archiveComparison)}
        onChange={d=>setPlan(p=>setDesign(p,d))} onLaunch={()=>onAccept(plan)}/>
    </fieldset>
  </div>;
}

type Option={id:string;name:Localized;details:Localized;ok?:boolean};
const selectable=(id:string,name:Localized,details:Localized,ok=true):Option=>({id,name,details,ok});
const missionChoices:Record<string,{intro:Localized;choices:Option[];source?:string}>={
  'eva-plan':{intro:t('La visera, el anclaje y el fotómetro están disponibles. Contrasta la luz y vuelve a la esclusa con el registrador.',
      'Visor, tether and light meter are available. Compare lighting and bring the recorder back to the airlock.'),
    source:visorSource,choices:([
      selectable('sheltered',evaRoutes.sheltered.title,t(`≈ ${evaRouteLength.sheltered} m · Luz de trabajo cian · Recuperación: 12 u. de traje`,
        `≈ ${evaRouteLength.sheltered} m · Cyan work lights · Recovery: 12 suit units`)),
      selectable('sunlit',evaRoutes.sunlit.title,t(`≈ ${evaRouteLength.sunlit} m · Visera antideslumbramiento · Recuperación: 20 u. de traje`,
        `≈ ${evaRouteLength.sunlit} m · Glare visor · Recovery: 20 suit units`)),
    ])},
  'moon-site':{intro:t('Contrasta pendiente, luz, cobertura y distancia al refugio antes del descenso.',
    'Compare slope, sunlight, coverage and range to shelter before descent.'),
    choices:[
      selectable('ridge',t('Planicie de enlace','Relay plain'),t('5° · Luz plena · Enlace directo · Refugio a 12 m','5° · Full sunlight · Direct link · Shelter 12 m')),
      selectable('slope',t('Ladera oriental','Eastern slope'),t('11° · Luz oblicua · Enlace directo · Refugio a 38 m','11° · Oblique sunlight · Direct link · Shelter 38 m')),
      selectable('shadow',t('Interior del cráter','Crater floor'),t('33° · En sombra · Sin enlace estable para el descenso','33° · In shadow · No stable link for descent'),false),
    ],source:'https://science.nasa.gov/moon/facts/'},
  'mars-plan':{intro:t('AUR-E03 sitúa el antiguo puesto de Aurora en Marte. La distancia implica demora; la nave corrige localmente antes del crucero.',
    'AUR-E03 places Aurora’s former field station on Mars. Communications are delayed; correct locally before cruising.'),
    choices:[
      selectable('efficient',t('Trayectoria de ahorro','Fuel-saving trajectory'),t('5 280 h · 18 u. de combustible','5,280 h · 18 fuel units')),
      selectable('express',t('Trayectoria rápida','Fast trajectory'),t('3 840 h · 29 u. de combustible','3,840 h · 29 fuel units')),
    ],source:'https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/'},
  'mars-site':{intro:t('Compara el relieve de la base con la baliza y confirma dónde puedes aterrizar con margen de retorno.',
    'Compare the base survey with the beacon and select a site that keeps return reserves.'),
    choices:[
      selectable('beacon',t('Planicie de la baliza','Beacon plain'),t('Pendiente suave · baliza en línea de vista','Shallow slope · beacon in line of sight')),
      selectable('basin',t('Cuenca de aproximación','Approach basin'),t('Terreno transitable · acceso más largo al hábitat','Walkable ground · longer walk to habitat')),
      selectable('cliff',t('Cornisa del valle','Valley ledge'),t('Pendiente y obstáculos fuera del margen de descenso','Slope and obstacles exceed the descent margin'),false),
    ],source:'https://science.nasa.gov/mars/facts/'},
  'rescue-plan':{intro:t('AUR-E05 · El mensaje está fechado. Tu hermana y dos personas más informaron estar en un refugio de Bennu. Aurora recuperó allí el contenedor de LUMA. Aún tienes que confirmar sus identidades y estado en persona.',
    'AUR-E05 · The message is dated. Your sister and two others reported being in a refuge on Bennu. Aurora recovered LUMA’s container there. Their identities and condition still require in-person confirmation.'),
    choices:(Object.keys(rescueProfiles) as (keyof typeof rescueProfiles)[]).map(id=>{
      const p=rescueProfiles[id];
      return selectable(id,id==='rescue'?t('Carga de rescate','Rescue loadout'):t('Carga de muestreo','Sampling loadout'),
        t(p.seats+' plazas para Aurora · '+p.lifeSupport+' h de soporte · '+p.fuel+' u. de combustible',
          p.seats+' Aurora seats · '+p.lifeSupport+' h of life support · '+p.fuel+' fuel units'),viableRescue(id));
    })},
};

export function RouteChoices({id,state,busy,onChoose}:{id:string;state:Campaign;busy:boolean;onChoose:(s:string)=>void}){
  const {t:translate}=useT();
  const entry=id==='moon-plan'?{
    intro:t(`El registrador verificó el archivo ${archiveId}. Elige una transferencia que quepa en tu autonomía y conserve combustible para salida y acople.`,
      `The recorder verified archive ${archiveId}. Pick a transfer that fits your endurance and leaves fuel to depart and dock.`),
    choices:routeIds.map(r=>{
      const a=assessTransfer(spacecraft(state),r,fuelLeft(state));
      return selectable(r,routes[r].name,t(routes[r].description.es+' Total: '+a.hours+' h.',
        routes[r].description.en+' Total: '+a.hours+' h.'),a.ok);
    }),source:'https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/',
  }:missionChoices[id];
  const [chosen,setChosen]=useState(()=>entry.choices.find(o=>o.ok)?.id);
  const current=entry.choices.find(o=>o.id===chosen);
  return <>
    <p>{translate(entry.intro)}</p>
    <div className="campaign-choices" role="group" aria-label={translate(t('Alternativas de misión','Mission alternatives'))}>
      {entry.choices.map(o=><button key={o.id} type="button" data-choice={o.id} aria-pressed={chosen===o.id}
        onClick={()=>setChosen(o.id)}><strong>{translate(o.name)}</strong>
        <small>{translate(o.details)}</small><small className={o.ok?'ok':'warn'}>{translate(o.ok?t('Viable','Viable'):t('Fuera de límites','Outside limits'))}</small>
      </button>)}
    </div>
    {entry.source&&<p><a href={entry.source} target="_blank" rel="noreferrer">{translate(t('Referencia NASA ↗','NASA reference ↗'))}</a></p>}
    {id==='eva-plan'&&<p className="reserve">{translate(t('LUMA espera en la nave. Los metros y consumos son valores del escenario.',
      'LUMA is waiting aboard. Distances and energy costs are scenario values.'))} <a href={solarSource} target="_blank" rel="noreferrer">
      {translate(t('Luz en órbita · NASA ↗','Light in orbit · NASA ↗'))}</a></p>}
    <button type="button" className="primary" data-route disabled={busy||!current?.ok}
      onClick={()=>current?.ok&&onChoose(current.id)}>{translate(t('Confirmar preparación','Confirm preparations'))} ↗</button>
  </>;
}

export function EvidenceList({state,points=[]}:{state:Campaign;points?:readonly string[]}){
  const {t:translate}=useT();
  const validated=validEvidence(state);
  const collected=collectedEvidence(state);
  for(const [id,received,accepted] of [['AUR-E01','capsule','capsule-auth'],['AUR-E02','recorder','airlock']] as const){
    if(points.includes(received)&&!collected.includes(id))collected.push(id);
    if(points.includes(accepted)&&!validated.includes(id))validated.push(id);
  }
  return collected.length?<ul className="campaign-documents">
    {collected.map(id=>{
      const ok=validated.includes(id);
      const note=ok?documents[id]:id==='AUR-E01'||id==='AUR-E02'?pendingFirstLightEvidence[id]:null;
      return <li key={id} data-evidence={id} data-evidence-status={ok?'validated':'collected'}>
        <b>{id} · {translate(ok?t('Validada','Validated'):t('Recogida','Collected'))}</b>{note&&<span>{translate(note)}</span>}
      </li>;
    })}
  </ul>:<p>{translate(t('Todavía no hay pruebas registradas.','No evidence is logged yet.'))}</p>;
}

export function CampaignCruise({id,state,busy,onComplete}:{id:string;state:Campaign;busy:boolean;onComplete:(hours:number)=>void}){
  const {t:translate}=useT();
  const plan=voyage(state,id)!;
  const [hours,setHours]=useState(0);
  const [running,setRunning]=useState(false);
  const [cabin,setCabin]=useState(false);
  const reached=hours>=plan.time;
  const each=Math.ceil(plan.time/24);
  useEffect(()=>{
    if(!running||reached)return;
    const timer=window.setInterval(()=>{
      if(!document.hidden&&!document.querySelector('dialog[open]'))setHours(h=>Math.min(plan.time,h+each));
    },185);
    return()=>window.clearInterval(timer);
  },[running,reached,plan.time,each]);
  useEffect(()=>{
    const pause=()=>{if(document.hidden)setRunning(false);};
    document.addEventListener('visibilitychange',pause);
    return()=>document.removeEventListener('visibilitychange',pause);
  },[]);
  return <>
    <div className="cruise-route" aria-hidden="true"><i/><div><b style={{width:hours/plan.time*100+'%'}}/></div><i/></div>
    <div className="campaign-stats"><div>{translate(t('Horas de viaje','Travel hours'))}<b>{hours} / {plan.time}</b></div>
      <div>{translate(t('Combustible','Fuel'))}<b>{(fuelLeft(state)-plan.fuel*hours/plan.time).toFixed(1)} u.</b></div></div>
    <progress className="campaign-progress" value={hours} max={plan.time} aria-label={translate(t('Progreso del crucero','Cruise progress'))}/>
    <p>{translate(t('Tiempo y consumos son valores de escenario. Retoma el mando para corregir la llegada.',
      'Time and consumption are scenario values. Take the controls again to correct the approach.'))}</p>
    {id==='moon-cruise'&&<div className="first-light-cabin-chat">
      <button type="button" aria-pressed={cabin} onClick={()=>setCabin(v=>!v)}>
        {translate(cabin?t('Cerrar conversación','Close conversation'):t('Asomarte al compartimento de LUMA','Check on LUMA in his compartment'))}
      </button>
      <FirstLightCabinSubtitle open={cabin}/>
    </div>}
    {reached?<button className="primary" data-cruise-end disabled={busy} onClick={()=>onComplete(plan.time)}>
      {translate(t('Terminar crucero','End cruise'))} ↗</button>:
      <button className="primary" data-cruise-start onClick={()=>setRunning(r=>!r)}>
        {translate(running?t('Pausar crucero','Pause cruise'):t('Acelerar crucero','Accelerate cruise'))}</button>}
  </>;
}

const reports:Record<string,Localized>={
  'moon-report':t('El número de la bitácora coincide con el sello de la caché y el índice del relé. El expediente autentica la localización del antiguo puesto marciano de Aurora.',
    'The log number matches the cache seal and relay index. The packet authenticates the location of Aurora’s former Mars outpost.'),
  farewell:t('Tu hermana sostiene la compuerta mientras te sientas con LUMA. El brillo de su traductor baja. Esperas con la mano bajo sus patas hasta que deja de respirar.',
    'Your sister holds the hatch while you sit with LUMA. His translator grows dim. You keep your hand under his paws until he stops breathing.'),
  epilogue:t('Tu hermana, la geóloga y el piloto han llegado a salvo. El archivo reúne sus testimonios, las muestras y los resultados de la expedición.',
    'Your sister, the geologist and the pilot have arrived safely. The archive contains their accounts, samples and findings.'),
};
export function CampaignReport({id,state,busy,onComplete}:{id:string;state:Campaign;busy:boolean;onComplete:()=>void}){
  const {t:translate}=useT();
  const record=id==='farewell'?t('Registrar la despedida','Record the farewell'):t('Cerrar informe','File report');
  return <>
    {id==='moon-handoff'?<FirstLightArrival state={state} route={option(state,'moon-plan')==='economy'?'economy':'express'}/>:
      <p>{translate(reports[id])}</p>}
    {id==='epilogue'&&<ul>{people.map(p=><li key={p.id}>{translate(p.name)} · {translate(t('Recepción confirmada','Reception confirmed'))}</li>)}</ul>}
    {id!=='farewell'&&<EvidenceList state={state}/>}
    <button className="primary" data-file disabled={busy} onClick={onComplete}>{translate(record)} ↗</button>
  </>;
}
