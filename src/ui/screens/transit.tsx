import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../core/contract/grid-v1.ts';
import { evaRoutes, solarSource, type EvaRoute } from '../../core/orbit/content.ts';
import { assessDesign, assessTransfer, routes } from '../../core/orbit/engineering.ts';
import { currentFuel, fuelLeft, type OrbitState } from '../../core/orbit/progress.ts';

export function EvaConsole({lang,onBegin}:{lang:Language;onBegin:(route:EvaRoute)=>void}) {
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const [route,setRoute]=useState<EvaRoute>('sheltered');
  return <section className="mission-card orb-board" aria-label={loc('Preparar EVA','Prepare EVA')}>
    <div className="panel-head"><span><span className="dot"/> C1-M05 / {loc('ESCLUSA','AIRLOCK')}</span><span>C1-R03</span></div>
    <div className="journal orb-intro">
      <span className="mini">{loc('ACTIVIDAD EXTRAVEHICULAR','EXTRAVEHICULAR ACTIVITY')}</span>
      <h2>{loc('Fuera del casco','Outside the hull')}</h2>
      <p>{loc(
        'El registrador está en el exterior. La luz directa deslumbra y las sombras son nítidas: compara las dos barandas antes de salir. LUMA se queda en el hábitat presurizado.',
        'The recorder is on the exterior. Direct light can glare and shadows are sharp: compare both handrails before leaving. LUMA stays in the pressurized habitat.')}</p>
      <div className="loadouts">{(['sheltered','sunlit'] as const).map(id=>
        <button className={route===id?'plan active':'plan'} key={id} aria-pressed={route===id} onClick={()=>setRoute(id)}>
          <b>{evaRoutes[id].title[lang]}</b><span>{evaRoutes[id].description[lang]}</span>
        </button>)}</div>
      <p>{loc('El anclaje limita el movimiento a las barandas. Mide en la esclusa, recoge el registrador y vuelve con los datos.',
             'The tether limits movement to the handrails. Take a reading at the airlock, recover the recorder and return with the data.')}</p>
      <button className="primary" onClick={()=>onBegin(route)}>{loc('Anclar e iniciar EVA','Attach tether and start EVA')} ↗</button>
      <p className="orb-source"><a href={solarSource} target="_blank" rel="noreferrer">{loc('NASA · luz y sombra en órbita','NASA · light and shadow in orbit')}</a></p>
    </div>
  </section>;
}

export function CruiseView({state,lang,onAdvance,onArrive}:{state:OrbitState;lang:Language;onAdvance:()=>void;onArrive:()=>void}){
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const [running,setRunning]=useState(false);
  const duration=state.transfer?routes[state.transfer].time:0;
  const complete=duration>0&&state.cruiseHours>=duration;
  const advance=useRef(onAdvance);
  advance.current=onAdvance;
  const advancing=running&&!complete;
  useEffect(()=>{
    if(!advancing)return;
    const timer=window.setInterval(()=>advance.current(),125);
    return()=>window.clearInterval(timer);
  },[advancing]);
  useEffect(()=>{
    const hidden=()=>{if(document.hidden)setRunning(false);};
    document.addEventListener('visibilitychange',hidden);
    return()=>document.removeEventListener('visibilitychange',hidden);
  },[]);
  if(!state.transfer)return null;
  const route=routes[state.transfer];
  const fuel=fuelLeft(state);
  const projected=assessTransfer(state.design,state.transfer,fuel);
  const elapsed=state.cruiseHours;
  const pct=100*elapsed/route.time;
  const craft=assessDesign(state.design);
  return <section className="camera-card orb-board" aria-label={loc('Crucero lunar','Lunar cruise')}>
    <div className="panel-head"><span><span className="dot"/> {loc('CRUCERO ACELERADO','ACCELERATED CRUISE')}</span><span>{route.name[lang]}</span></div>
    <div className="journal orb-cruise">
      <div className="orb-transit-map" aria-hidden="true">
        <span className="orb-transit-body"/><span className="orb-transit-track"><i style={{width:pct+'%'}}/></span>
        <span className="orb-transit-body orb-transit-moon"/>
      </div>
      <div className="orb-transit-labels"><span>{loc('ESTACIÓN','STATION')}</span><span>{loc('NODO LUNAR','LUNAR NODE')}</span></div>
      <h2>{loc('En tránsito hacia la Luna','In transit to the Moon')}</h2>
      <p>{loc(
        'LUMA descansa en su compartimento. El receptor conserva el código del archivo hasta la siguiente ventana de enlace.',
        'LUMA rests in its compartment. The receiver keeps the archive code until the next contact window.')}</p>
      <div className="report-stats">
        <div><b>{elapsed} / {route.time} h</b><span>{loc('Tiempo de crucero','Cruise time')}</span></div>
        <div><b>{projected.hours} / {craft.time} h</b><span>{loc('Tiempo de misión / autonomía','Mission time / endurance')}</span></div>
        <div><b>{currentFuel(state).toFixed(1)} u.</b><span>{loc('Combustible en tránsito','Fuel in transit')}</span></div>
      </div>
      <div className="energy" role="progressbar" aria-label={loc('Progreso del crucero','Cruise progress')} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{width:pct+'%'}}/>
      </div>
      <p className="reserve">{loc('Horas del escenario; el reloj se comprime solo durante el crucero.',
        'Scenario hours; time compresses only during cruise.')}</p>
      {complete?
        <button className="primary" onClick={onArrive}>{loc('Pilotar aproximación lunar','Pilot lunar approach')} ↗</button>:
        <button className="primary" onClick={()=>setRunning(advance=>!advance)}>
          {running?loc('Pausar crucero','Pause cruise'):loc('Acelerar crucero','Accelerate cruise')} {running?'■':'≫'}
        </button>}
    </div>
  </section>;
}
