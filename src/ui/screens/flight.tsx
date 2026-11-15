import { useEffect, useRef, useState } from 'react';
import { flightMinimum, fuelLeft, spacecraft, type Campaign } from '../../core/campaign.ts';
import { assessDesign, t } from '../../core/orbit/engineering.ts';
import { advanceFlight, flightChecks, flightFailure, initialFlight, neutral, type FlightState } from '../../core/orbit/flight.ts';
import { buildFlightView, flightLook } from '../../engine/flight-view.ts';
import { exposeDebug } from '../../engine/debug.ts';
import { Loop } from '../../engine/loop.ts';
import { useT } from '../i18n.ts';
import { prefs } from '../prefs.ts';
import { firstLightFlightRadio } from '../../core/orbit/first-light.ts';

const keys=['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','KeyX','ShiftLeft','ShiftRight'];
const paired=(held:Set<string>,a:string,b:string)=>Number(held.has(a))-Number(held.has(b));

export function CampaignFlight({state,stage,onCapture,busy}:{
  state:Campaign;stage:NonNullable<ReturnType<typeof import('../../core/campaign.ts').activeStage>>;
  onCapture:(f:FlightState)=>void;busy:boolean;
}){
  const {t:translate}=useT();
  const leg=stage.flight!;
  const host=useRef<HTMLDivElement>(null);
  const [start]=useState(()=>initialFlight(leg.mode,fuelLeft(state),spacecraft(state).orbit));
  const [shown,setShown]=useState(start);
  const craft=useRef(start);
  const [control,setControl]=useState<'standby'|'manual'|'assist'|'paused'>('standby');
  const [alive,setAlive]=useState(false);
  const [graphicsError,setGraphicsError]=useState(false);
  const mode=useRef(control);
  mode.current=control;
  const held=useRef(new Set<string>());
  const look=useRef(flightLook());
  const mass=assessDesign(spacecraft(state)).mass;
  const minimum=flightMinimum(state,stage);
  const checks=flightChecks(leg.mode,shown);
  const flightError=(f:FlightState)=>f.fuel<minimum?'fuel':flightFailure(f);
  const rejected=flightError(shown);
  useEffect(()=>{
    const node=host.current;
    if(!node)return;
    const quality=prefs.getState().quality;
    const forced=new URLSearchParams(location.search).get('quality');
    const tier=forced==='low'||forced==='medium'||forced==='high'?forced:quality==='auto'?'medium':quality;
    let graphics:ReturnType<typeof buildFlightView>;
    try{graphics=buildFlightView(node,leg.body,tier);}
    catch{setGraphicsError(true);return;}
    const bindings=new AbortController();
    const signal=bindings.signal;
    const canvas=node.querySelector('canvas')!;
    let since=0,time=0,drag:number|null=null;
    const clear=()=>{held.current.clear();drag=null;};
    const pause=()=>{
      clear();
      if(mode.current==='manual'||mode.current==='assist')setControl('paused');
    };
    window.addEventListener('keydown',event=>{
      if(event.ctrlKey||event.altKey||event.metaKey||event.defaultPrevented||document.querySelector('dialog[open]'))return;
      if(event.code==='Escape'&&mode.current!=='standby'){pause();return;}
      if(event.code==='KeyC'){look.current=flightLook();return;}
      if(mode.current!=='manual'||!keys.includes(event.code))return;
      event.preventDefault();held.current.add(event.code);
    },{signal});
    window.addEventListener('keyup',event=>held.current.delete(event.code),{signal});
    window.addEventListener('blur',pause,{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal});
    canvas.addEventListener('pointerdown',e=>{if(e.button===0){drag=e.pointerId;canvas.setPointerCapture(e.pointerId);}},{signal});
    canvas.addEventListener('lostpointercapture',()=>{drag=null;},{signal});
    canvas.addEventListener('pointermove',e=>{
      if(drag!==e.pointerId)return;
      const c=look.current;
      c.azimuth=Math.max(-1.05,Math.min(1.05,c.azimuth-e.movementX*.006));
      c.elevation=Math.max(-.1,Math.min(.75,c.elevation+e.movementY*.004));
    },{signal});
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();
      look.current.distance=Math.max(12,Math.min(34,look.current.distance+Math.sign(e.deltaY)*1.3));
    },{signal,passive:false});
    const loop=new Loop({
      update(dt){
        time+=dt;
        const h=held.current,running=mode.current==='manual'||mode.current==='assist';
        if(!running||document.hidden||document.querySelector('dialog[open]')||craft.current.fuel<minimum||flightFailure(craft.current))return;
        craft.current=advanceFlight(leg.mode,craft.current,{
          ...neutral,guide:mode.current==='assist',thrust:paired(h,'KeyW','KeyS'),turn:paired(h,'KeyD','KeyA'),
          strafe:paired(h,'KeyE','KeyQ'),brake:h.has('KeyX'),precision:h.has('ShiftLeft')||h.has('ShiftRight'),
        },dt,mass);
        since+=dt;
        if(since>=.08){setShown(craft.current);since=0;}
      },
      render(_alpha,ms){graphics.draw(craft.current,look.current,time,ms);},
    });
    const hide=exposeDebug({
      flightSteps:(count:number)=>{loop.step(count);setShown(craft.current);},
      flightState:()=>({...craft.current,look:{...look.current}}),
    });
    loop.start();setAlive(true);
    return ()=>{bindings.abort();loop.stop();hide();graphics.dispose();};
  },[leg,mass,minimum]);
  const setMode=(next:typeof control)=>{held.current.clear();mode.current=next;setControl(next);};
  const ready=checks.canCapture&&!rejected;
  const radio=firstLightFlightRadio[stage.id];
  return <>
    <div className="game-host" ref={host}/>
    <div className="screen campaign-flight">
      <section className="panel flight-heading" aria-label={translate(t('Control de maniobra','Maneuver control'))}>
        <span className="panel-title">{translate(t('PILOTAJE LOCAL','LOCAL PILOTING'))}</span>
        <h1>{translate(stage.title)}</h1>
        <p>{translate(radio??t('Frena y alinea la nave antes de confirmar.','Brake and align before confirming.'))}</p>
      </section>
      <section className="panel flight-telemetry" aria-label={translate(t('Telemetría de vuelo','Flight telemetry'))}>
        <dl>
          <dt>{translate(t('Distancia','Range'))}</dt><dd className={checks.near?'ok':''}>{checks.distance.toFixed(1)} m</dd>
          <dt>{translate(t('Velocidad','Speed'))}</dt><dd className={checks.slow?'ok':''}>{checks.speed.toFixed(1)} m/s</dd>
          <dt>{translate(t('Rumbo','Heading'))}</dt><dd className={checks.aligned?'ok':''}>{shown.heading.toFixed(0)}°</dd>
          <dt>{translate(t('Combustible','Fuel'))}</dt><dd>{shown.fuel.toFixed(1)} u.</dd>
          <dt>{translate(t('Reserva prevista','Planned reserve'))}</dt><dd>{minimum} u.</dd>
        </dl>
      </section>
      <section className="panel flight-controls">
        <p><kbd>W/S</kbd> {translate(t('Impulso','Thrust'))} <kbd>A/D</kbd> {translate(t('Giro','Turn'))}
          <kbd> Q/E</kbd> {translate(t('Traslación','Translation'))} <kbd>X</kbd> {translate(t('Freno','Brake'))}</p>
        <p>{translate(t('Arrastra para mover la cámara · Rueda para zoom · C para centrar','Drag to move the camera · Scroll to zoom · C to centre'))}</p>
        {graphicsError?<p role="alert">{translate(t('No se pudo iniciar el visor 3D.','The 3D viewport could not start.'))}</p>:null}
        {rejected?<p className="warn" role="status">{translate(rejected==='fuel'?
          t('Se agotó el margen de combustible del tramo.','The fuel margin for this leg ran out.'):
          t('La nave salió del corredor seguro.','The spacecraft left the safe corridor.'))}</p>:null}
        <div className="actions">
          {rejected?<button onClick={()=>{craft.current=start;setShown(start);look.current=flightLook();setMode('standby');}}>
            {translate(t('Reintentar maniobra','Retry maneuver'))}</button>:<>
            <button disabled={!alive||control==='manual'||busy} onClick={()=>setMode('manual')}>
              {translate(t('Pilotar manualmente','Fly manually'))}</button>
            <button disabled={!alive||control==='assist'||busy} onClick={()=>setMode('assist')}>
              {translate(t('Guiar maniobra','Guide maneuver'))}</button>
            <button disabled={control!=='manual'&&control!=='assist'||busy} onClick={()=>setMode('paused')}>{translate(t('Pausar','Pause'))}</button>
            <button className="primary" data-capture disabled={!ready||busy} onClick={()=>{
              const f=craft.current;
              if(!flightError(f)&&flightChecks(leg.mode,f).canCapture){setMode('paused');onCapture(f);}
            }}>{translate(t('Registrar maniobra','Record maneuver'))} ↗</button>
          </>}
        </div>
      </section>
    </div>
  </>;
}
