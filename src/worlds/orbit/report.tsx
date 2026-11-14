import type { Language } from '../../kit/contract.ts';
import { mechanicsSource, navigationSource, solarSource } from './content.ts';
import { antennas, maxBudget, objectives, orbits, routes } from './engineering.ts';
import { evidence, orbitReport, recordedData, type OrbitState } from './progress.ts';
import type { FlightState } from './flight.ts';
import { lowOrbitReference } from './science.ts';

export type Attempt = {failure:'fuel'|'corridor';ship:FlightState};

export function AttemptReport({attempt,lang,onRetry,onRedesign}:{
  attempt:Attempt;lang:Language;onRetry:()=>void;onRedesign:()=>void
}){
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  return <section className="mission-card orb-board" aria-label={loc('Informe del intento','Attempt report')}>
    <div className="panel-head"><span><span className="dot gold"/> {loc('INFORME DEL INTENTO','ATTEMPT REPORT')}</span><span>{loc('INCOMPLETO','INCOMPLETE')}</span></div>
    <div className="journal orb-intro">
      <h2>{loc('La maniobra no se completó','The maneuver was not completed')}</h2>
      <p>{attempt.failure==='fuel'?loc(
        'Las correcciones dejaron demasiado poco combustible para las maniobras restantes y la reserva.',
        'Corrections left too little fuel for the remaining maneuvers and safety reserve.'):
        loc('La posición relativa salió del corredor permitido. La nave no puede confirmar la maniobra fuera del corredor.',
          'Relative position left the allowed corridor. The spacecraft cannot confirm a maneuver outside this corridor.')}</p>
      <div className="report-stats">
        <div><b>{Math.hypot(attempt.ship.x,attempt.ship.y).toFixed(1)}</b><span>{loc('Distancia al objetivo','Distance to target')}</span></div>
        <div><b>{Math.hypot(attempt.ship.vx,attempt.ship.vy).toFixed(1)}</b><span>{loc('Velocidad relativa','Relative speed')}</span></div>
        <div><b>{attempt.ship.fuel.toFixed(1)} u.</b><span>{loc('Combustible al interrumpir','Fuel at interruption')}</span></div>
      </div>
      <p>{loc('Prueba un frenado más temprano o activa la guía. Al reintentar vuelves al punto de control anterior.',
        'Try braking earlier or enable guidance. A retry takes you back to the previous checkpoint.')}</p>
      <button className="primary" onClick={onRetry}>{loc('Reintentar desde el control anterior','Retry from the last checkpoint')} ↺</button>
      <details className="abort orb-details">
        <summary>{loc('Volver a diseñar la misión','Redesign the mission')}</summary>
        <p>{loc('Se reinicia únicamente Primera luz.','Only First light will restart.')}</p>
        <button className="secondary" onClick={onRedesign}>{loc('Reiniciar Primera luz','Restart First light')}</button>
      </details>
    </div>
  </section>;
}

export function MissionReport({state,lang,onFile,onContinue,onReset}:{
  state:OrbitState;lang:Language;onFile:()=>void;onContinue:()=>void;onReset:()=>void
}){
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const report=orbitReport(state);
  if(!report||!state.transfer)return null;
  const record=evidence(state), filed=state.phase==='complete', design=state.design, limits=report.limits;
  return <section className="mission-card orb-board orb-report" aria-label={loc('Informe de misión','Mission report')}>
    <div className="panel-head"><span><span className="dot"/> C1-M06 / {loc('INFORME DE MISIÓN','MISSION REPORT')}</span>
      <span>{filed?loc('ARCHIVADO','FILED'):loc('PENDIENTE DE CIERRE','PENDING CLOSE')}</span></div>
    <div className="journal orb-intro">
      <span className="mini">{loc('NODO LUNAR · NAVE SEGURA','LUNAR NODE · SPACECRAFT SECURE')}</span>
      <h2>{loc('Llegada al nodo lunar','Arrival at the lunar node')}</h2>
      <p>{loc('El acople está confirmado. El enlace abre una búsqueda en el archivo lunar; la tripulación de Aurora sigue sin localizarse.',
        'Docking is confirmed. The link opens a search at the lunar archive; Aurora’s crew remains missing.')}</p>
      <div className="report-stats">
        <div><b>{filed?'6/6':'5/6'}</b><span>{loc('Misiones registradas','Recorded missions')}</span></div>
        <div><b>{report.score}/100</b><span>{loc('Evaluación del diseño y la operación','Design and operations score')}</span></div>
        <div><b>{report.fuel.toFixed(1)} u.</b><span>{loc('Combustible restante','Remaining fuel')}</span></div>
      </div>
      <h3>{loc('Pruebas validadas','Validated evidence')}</h3>
      <ul className="orb-evidence">
        {record.includes('AUR-E01')&&<li><b>AUR-E01</b> · {loc('Cápsula de Aurora y LUMA confirmados en el pasado.','Aurora’s capsule and LUMA confirmed in the past.')}</li>}
        {record.includes('AUR-E02')&&<li><b>AUR-E02</b> · {loc('Registrador y observación archivados. Enlace al archivo lunar.','Recorder and observation logged. Link to the lunar archive.')}</li>}
      </ul>
      <h3>{loc('Qué hicieron posible tus decisiones','What your choices made possible')}</h3>
      <ul className="orb-evidence">
        <li>{loc('Objetivo:', 'Objective:')} {objectives[design.objective].name[lang]}. {loc(
          'La órbita y los instrumentos aportaron','Orbit and instruments produced')} {limits.science} {loc('u. de ciencia en','science units in')}
          {' '}{limits.observation.passes} {loc('pasadas modeladas.','modeled passes.')}</li>
        <li>{limits.mass} / {limits.lift} kg · {loc('La carga cupo en el lanzador para la órbita elegida.','The payload fit the chosen launch vehicle and orbit.')}</li>
        <li>{limits.draw} / {limits.power} kW · {limits.cost} / {maxBudget} cr · {loc('Potencia y presupuesto dentro de los límites.','Power and budget stayed within their limits.')}</li>
        <li>{recordedData(state)} / {limits.storage} GB · {loc('La memoria conservó los datos.','Onboard storage retained the data.')}</li>
        <li>{recordedData(state)} / {limits.link} GB · {antennas[design.antenna].name[lang]} · {loc('Ventana de enlace:','Contact window:')} {orbits[design.orbit].contact} h.</li>
        <li>{routes[state.transfer].name[lang]} · {report.hours} / {limits.time} h · {report.fuelUsed.toFixed(1)} {loc('u. de combustible usado.','fuel units used.')}</li>
        <li>{loc('Evaluación:', 'Score:')} 60 {loc('misión','mission')} + {report.sciencePoints} {loc('ciencia','science')} + {report.efficiency} {loc('eficiencia','efficiency')}.</li>
      </ul>
      {!filed?<button className="primary" onClick={onFile}>{loc('Cerrar informe de búsqueda','File search report')} ↗</button>:
        <>
          <p>{loc('Siguiente operación: elegir sitio y descender desde el nodo lunar.','Next operation: choose a site and descend from the lunar node.')}</p>
          <button className="primary" onClick={onContinue}>{loc('Continuar a la Luna','Continue to the Moon')} ↗</button>
          <details className="abort orb-details">
            <summary>{loc('Comparar otro diseño','Compare another design')}</summary>
            <p>{loc('Reinicia esta misión con una configuración distinta. La partida de la Luna no cambia.',
              'Restart this mission with a different configuration. Your Moon save stays as it was.')}</p>
            <button className="secondary" onClick={onReset}>{loc('Reiniciar Primera luz','Restart First light')}</button>
          </details>
        </>}
      <p className="orb-source">{loc('Referencias NASA:', 'NASA references:')} <a href={lowOrbitReference.source} target="_blank" rel="noreferrer">{loc('órbita baja','low Earth orbit')}</a> · <a href={mechanicsSource} target="_blank" rel="noreferrer">{loc('inercia','inertia')}</a> · <a href={navigationSource} target="_blank" rel="noreferrer">{loc('aproximación','rendezvous')}</a> · <a href={solarSource} target="_blank" rel="noreferrer">{loc('iluminación','illumination')}</a>.</p>
    </div>
  </section>;
}
