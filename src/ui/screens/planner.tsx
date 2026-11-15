import { useState, type ReactNode } from 'react';
import type { Language,Localized } from '../../core/contract/grid-v1.ts';
import {
  antennas, assessDesign, assessTransfer, batteries, defaultDesign, instrumentIds, instruments, launchers,
  objectives, orbits, routeIds, routes, scienceDesign, structures, type Design, type TransferRoute,
} from '../../core/orbit/engineering.ts';
import { fuelLeft, type OrbitState } from '../../core/orbit/progress.ts';
import { lowOrbitReference } from '../../core/orbit/science.ts';

const I=(value:number)=>Number.isInteger(value)?String(value):value.toFixed(1);
const presets=[
  {design:defaultDesign,name:{es:'Propuesta ligera',en:'Light design'}},
  {design:scienceDesign,name:{es:'Propuesta científica',en:'Science design'}},
] as const;
const groups=[
  {key:'objective',label:{es:'Objetivo de misión',en:'Mission objective'},options:objectives},
  {key:'structure',label:{es:'Estructura de la nave',en:'Spacecraft body'},options:structures},
  {key:'battery',label:{es:'Sistema de potencia',en:'Power system'},options:batteries},
  {key:'antenna',label:{es:'Comunicaciones',en:'Communications'},options:antennas},
  {key:'launcher',label:{es:'Vehículo de lanzamiento',en:'Launch vehicle'},options:launchers},
  {key:'orbit',label:{es:'Órbita de encuentro',en:'Rendezvous orbit'},options:orbits},
] as const;

type PlannerProps = {state:OrbitState;lang:Language;onRead:()=>void;onCompare:()=>void;onLaunch:()=>void;onChange:(design:Design)=>void;briefing?:ReactNode};

export function PlanConsole({state,lang,onRead,onCompare,onLaunch,onChange,briefing}:PlannerProps) {
  const d=state.design;
  const stats=assessDesign(d);
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  return <section className="mission-card orb-board" aria-label={loc('Planificador de misión','Mission planner')}>
    <div className="panel-head"><span><span className="dot"/> {loc('C1-M01 / PLANIFICACIÓN','C1-M01 / PLANNING')}</span><span>{loc('TIERRA','EARTH')}</span></div>
    <div className="journal orb-plan">
      <div className="orb-intro">
        {briefing??<>
        <span className="mini">{loc('AVISO DE RECUPERACIÓN','RECOVERY NOTICE')}</span>
        <h2>{loc('Aurora vuelve a dar una pista','A new lead on Aurora')}</h2>
        <p>{loc(
          'Meses después de suspender la búsqueda, la estación recibió una cápsula de emergencia. El identificador apunta a Aurora, la expedición de tu hermana. Control autoriza reconstruir la ruta.',
          'Months after the search was suspended, the station received an emergency capsule. Its identifier points to Aurora, your sister’s expedition. Mission control authorizes a search for the route.')}</p>
        <p>{loc(
          'Expediente de comunicaciones: tu hermana formaba parte de la tripulación. La cápsula es una pista; su supervivencia aún no está confirmada.',
          'Communications file: your sister was part of the crew. The capsule is a lead; her survival is still unconfirmed.')}</p>
        </>}
        {!state.briefingRead&&<button className="primary" onClick={onRead}>{loc('Registrar objetivo de búsqueda','Record the search objective')} ↗</button>}
      </div>
      {state.briefingRead&&<>
        <div className="loadouts orb-presets" aria-label={loc('Comparar propuestas iniciales','Compare starting designs')}>
          {presets.map(({design,name})=>{
            const a=assessDesign(design);
            return <button type="button" className="plan" key={design.objective}
              onClick={()=>onChange({...design,instruments:[...design.instruments]})}>
              <b>{name[lang]}</b><span>{a.mass} kg · {a.cost} cr · {a.data} GB · {a.science} {loc('ciencia','science')}</span>
              <small>{loc('Cargar y editar propuesta','Load and edit design')} ↗</small>
            </button>;
          })}
        </div>
        <fieldset className="orb-config">
          <legend>{loc('Configura la expedición','Configure the expedition')}</legend>
          <div className="orb-config-grid">
            {groups.map(group=>{
              const choices:Record<string,{name:Localized;description:Localized}>=group.options;
              const current=d[group.key];
              return <div className="orb-choice" key={group.key}>
                <label htmlFor={'plan-'+group.key}>{group.label[lang]}</label>
                <select id={'plan-'+group.key} value={current}
                  onChange={e=>onChange({...d,[group.key]:e.currentTarget.value})}>
                  {Object.entries(choices).map(([id,entry])=><option key={id} value={id}>{entry.name[lang]}</option>)}
                </select>
                <small>{choices[current].description[lang]}</small>
              </div>;
            })}
          </div>
          <fieldset className="orb-instruments">
            <legend>{loc('Instrumentos científicos','Science instruments')}</legend>
            {instrumentIds.map(id=>{
              const i=instruments[id], chosen=d.instruments.includes(id);
              return <label className={chosen?'plan active':'plan'} key={id}>
                <span><input type="checkbox" checked={chosen}
                  onChange={()=>onChange({...d,instruments:chosen?d.instruments.filter(x=>x!==id):[...d.instruments,id]})}/>
                  <b>{i.name[lang]}</b></span>
                <span>{i.description[lang]}</span>
                <small>{i.mass} kg · {I(i.power)} kW · {i.data} GB · {i.cost} cr · +{i.science} {loc('ciencia','science')}</small>
              </label>;
            })}
          </fieldset>
          <p className="reserve">{loc('El equipo obligatorio de protección, acople y EVA está incluido en masa, potencia y coste.',
            'Mandatory protection, docking and EVA equipment is included in mass, power and cost.')}</p>
        </fieldset>
        <div className="orb-checks" aria-label={loc('Validación del diseño','Design validation')}>
          {stats.constraints.map(c=><div key={c.id} className={c.ok?'orb-check':'orb-check orb-check-fail'}>
            <span>{c.ok?'✓':'×'} {c.label[lang]}</span>
            <b>{c.id==='orbit'?(c.ok?loc('Compatible','Compatible'):loc('Incompatible','Incompatible')):
              I(c.used)+' / '+I(c.limit)+(c.unit?' '+c.unit:'')}</b>
            {!c.ok&&<small>{c.reason[lang]}</small>}
          </div>)}
        </div>
        <p className="reserve">{loc('Órbita del escenario','Scenario orbit')}: {stats.altitude} km ·
          {' '}{loc('Tasa del enlace','Downlink rate')}: {I(stats.rate)} GB/h × {stats.contact} h ·
          {' '}{loc('Autonomía total','Total endurance')}: {stats.time} h.</p>
        <p className="reserve">{loc('Periodo estimado','Estimated period')}: {stats.observation.periodMinutes.toFixed(1)} min ·
          {' '}{stats.observation.passes} {loc('pasadas de observación modeladas','modeled observation passes')}.{' '}
          <a href={lowOrbitReference.source} target="_blank" rel="noreferrer">{loc('Referencia NASA: órbita baja de la ISS','NASA reference: ISS low Earth orbit')}</a>.
        </p>
        <p className="reserve">{loc('Modelo educativo: créditos, ventanas y límites se calibraron para este escenario.',
          'Educational model: credits, contact windows and limits are tuned for this scenario.')}</p>
        <div className="orb-panel-actions">
          <button type="button" className="small-action" onClick={()=>onChange({...defaultDesign,instruments:[...defaultDesign.instruments]})}>
            {loc('Restaurar propuesta inicial','Restore starting design')}
          </button>
          <button type="button" className="primary" disabled={!stats.ok} onClick={onLaunch}>
            {loc('Autorizar lanzamiento','Authorize launch')} ↗
          </button>
        </div>
        <details className="abort orb-details">
          <summary>{loc('Archivo de alternativas · opcional','Alternatives log · optional')}</summary>
          <p>{loc('El lector básico y el fotómetro mantienen un enlace ligero. Para obtener más ciencia, una cámara y un lector avanzado requieren potencia y transmisión adicionales.',
            'The basic reader and photometer keep downlink demand low. A camera and advanced reader offer more science but require extra power and data capacity.')}</p>
          <button className="small-action" disabled={state.compared} onClick={onCompare}>{state.compared?loc('Comparación archivada','Comparison saved'):loc('Archivar comparación','Save comparison')}</button>
        </details>
      </>}
    </div>
  </section>;
}

export function TransferConsole({state,lang,onSelect}:{state:OrbitState;lang:Language;onSelect:(route:TransferRoute)=>void}) {
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const [choice,setChoice]=useState<TransferRoute>('express');
  const fuel=fuelLeft(state);
  const plan=assessDesign(state.design);
  const current=assessTransfer(state.design,choice,fuel);
  return <section className="mission-card orb-board" aria-label={loc('Planificar traslado lunar','Plan lunar transfer')}>
    <div className="panel-head"><span><span className="dot"/> C1-M06 / {loc('RUTA','ROUTE')}</span><span>{loc('ESTACIÓN → NODO LUNAR','STATION → LUNAR NODE')}</span></div>
    <div className="journal orb-intro">
      <h2>{loc('Planifica el traslado lunar','Plan the lunar transfer')}</h2>
      <p>{loc('El registrador autentica el enlace del archivo lunar. Confirma una ruta, las reservas de retorno y la ventana de enlace antes de salir.',
        'The recorder authenticates the lunar archive link. Confirm a route, return reserves and the contact window before departure.')}</p>
      <p className="reserve">{loc('Autonomía total','Total endurance')}: {plan.time} h · {loc('Enlace de misión','Mission downlink')}: {I(plan.link)} GB · {loc('Combustible actual','Current fuel')}: {I(fuel)} u.</p>
      <div className="loadouts">
        {routeIds.map(id=>{
          const a=assessTransfer(state.design,id,fuel);
          return <button key={id} className={choice===id?'plan active':'plan'} aria-pressed={choice===id} onClick={()=>setChoice(id)}>
            <b>{routes[id].name[lang]}</b><span>{routes[id].description[lang]}</span>
            <small>{routes[id].time} h / {routes[id].fuel} u. · {a.ok?loc('✓ Viable','✓ Viable'):loc('× No viable','× Not viable')}</small>
          </button>;
        })}
      </div>
      <p role="status">{!current.okTime?loc('El tiempo total de esa ruta supera la autonomía.','Total time for this route exceeds mission endurance.'):
        !current.okFuel?loc('No quedan reservas de maniobra suficientes para esa ruta.','Not enough maneuvering reserves remain for this route.'):
        loc('Ruta viable. Queda margen para aproximación y reserva de seguridad.','Route viable. Approach margin and safety reserve remain.')}</p>
      <button className="primary" disabled={!current.ok} onClick={()=>onSelect(choice)}>{loc('Confirmar plan de traslado','Confirm transfer plan')} ↗</button>
    </div>
  </section>;
}
