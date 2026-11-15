import Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import type { Language, Localized } from '../core/contract/grid-v1.ts';
import { artUrl, mountSurface } from './scene.ts';
import { t } from '../core/orbit/engineering.ts';
import { advanceFlight, flightChecks, flightFailure, flightSpecs, neutral,
  type FlightControls, type FlightId, type FlightState } from '../core/orbit/flight.ts';

const W=960,H=540;
const labels:Record<FlightId,{target:Localized,confirm:Localized,guide:Localized}> = {
  launch:{target:t('Corredor orbital','Orbital corridor'),confirm:t('Confirmar órbita','Confirm orbit'),guide:t('Guiar ascenso','Guide ascent')},
  dock:{target:t('Puerto de la estación','Station port'),confirm:t('Acoplar a la estación','Dock at station'),guide:t('Guiar acople','Guide docking')},
  depart:{target:t('Ventana de salida','Departure window'),confirm:t('Entrar en crucero','Enter cruise'),guide:t('Guiar salida','Guide departure')},
  'lunar-approach':{target:t('Puerto del nodo lunar','Lunar node port'),confirm:t('Acoplar al nodo lunar','Dock at lunar node'),guide:t('Guiar llegada','Guide arrival')},
};

export class FlightScene extends Phaser.Scene {
  private state:FlightState;
  private accumulator=0;
  private sampled=0;
  private body!:Phaser.GameObjects.Image;
  private telemetry!:Phaser.GameObjects.Graphics;
  private heading!:number;
  constructor(private mode:FlightId, private start:FlightState, private mass:number,
    private minimumFuel:number, private inputState:()=>FlightControls|null, private onSample:(state:FlightState)=>void) {
    super('orbital-flight');
    this.state={...start};
  }
  preload(){
    this.load.image('shuttle',artUrl('shuttle.png'));
    this.load.image('habitat',artUrl('habitat.png'));
    this.load.image('beacon',artUrl('beacon.png'));
  }
  private project(x:number,y:number){
    const ascent=this.mode==='launch';
    return {x:745+x*6.2,y:(ascent?144:270)+y*4.1-(ascent?x*3.1:0)};
  }
  create(){
    const sky=this.add.graphics();
    sky.fillGradientStyle(0x192747,0x11192f,0x10172b,0x0d1527).fillRect(0,0,W,H);
    let seed=2513;
    for(let i=0;i<208;i++){
      seed=(seed*16807)%2147483647;
      const x=seed%W;
      seed=(seed*16807)%2147483647;
      sky.fillStyle(i%13===0?0xffe9bb:0xb7cadf,i%9===0?.7:.3).fillRect(x,seed%H,i%11===0?2:1,1);
    }
    const lunar=this.mode==='lunar-approach';
    for(let i=11;i>=0;i--)sky.fillStyle(lunar?0x98a9c2:0x8aafe4,.026).fillCircle(814,484,188+4*i);
    sky.fillStyle(lunar?0x566175:0x344e7c,.89).fillCircle(814,484,188);
    sky.lineStyle(1,0x93bbd9,.48).strokeCircle(814,484,188);
    sky.fillStyle(lunar?0xcbccd0:0x7593bc,.27).fillCircle(767,438,121);
    sky.lineStyle(1,0x92b2c5,.17);
    for(let y=91;y<=441;y+=35)sky.lineBetween(42,y,918,y);
    for(let x=55;x<=920;x+=35)sky.lineBetween(x,91,x,442);
    const outline=[this.project(-107,-9),this.project(0,-9),this.project(0,9),this.project(-107,9)]
      .map(p=>new Phaser.Math.Vector2(p.x,p.y));
    sky.fillStyle(0x617f9d,.13).fillPoints(outline,true);
    sky.lineStyle(1,0x92b5cd,.52).strokePoints(outline,true);
    sky.lineStyle(1,0xdcd2a6,.65);
    for(let x=-106;x<-1.7;x+=4){
      const from=this.project(x,0),to=this.project(x+1.7,0);
      sky.lineBetween(from.x,from.y,to.x,to.y);
    }
    const target=this.project(0,0);
    const port=flightSpecs[this.mode].radius*6.2;
    sky.lineStyle(2,0xa4eadf,.82).strokeCircle(target.x,target.y,port);
    sky.lineBetween(target.x,target.y-port-13,target.x,target.y-port-3);
    sky.lineBetween(target.x,target.y+port+3,target.x,target.y+port+13);
    this.add.image(target.x+83,target.y-13,this.mode==='dock'||lunar?'habitat':'beacon').setScale(this.mode==='dock'||lunar?1.55:1.27);
    if(this.mode==='launch'){
      const pad=this.project(-85,-7);
      this.add.image(pad.x,pad.y+38,'habitat').setScale(1.3);
    }
    this.telemetry=this.add.graphics();
    this.body=this.add.image(0,0,'shuttle').setScale(.92);
    this.heading=this.mode==='launch'?-13:16;
    this.paint();
    this.onSample(this.state);
  }
  snapshot(){return this.state;}
  reset(){
    this.state={...this.start};this.accumulator=0;this.sampled=0;
    if(this.body){this.paint();this.onSample(this.state);}
  }
  private paint(){
    const {x,y}=this.project(this.state.x,this.state.y);
    this.body.setPosition(x,y).setAngle(this.heading+this.state.heading);
    const g=this.telemetry;
    g.clear();
    const stable=flightChecks(this.mode,this.state).canCapture;
    const color=stable?0xa4eadf:0xf2cf92;
    g.lineStyle(1,color,.64).strokeCircle(x,y+2,37);
    const vector=this.project(this.state.x+this.state.vx*.65,this.state.y+this.state.vy*.65);
    g.lineStyle(2,color,.74).lineBetween(x,y+2,vector.x,vector.y+2);
  }
  update(_time:number,delta:number){
    const input=this.inputState();
    const interrupted=()=>flightFailure(this.state)||this.state.fuel<this.minimumFuel;
    if(!input||interrupted())return;
    this.accumulator+=Math.min(delta,50)/1000;
    let advanced=false;
    while(this.accumulator>=1/60&&!interrupted()){
      this.state=advanceFlight(this.mode,this.state,input,1/60,this.mass);
      this.accumulator-=1/60;this.sampled+=1/60;advanced=true;
    }
    if(!advanced)return;
    this.paint();
    if(this.sampled>=.09||interrupted()){
      this.sampled=0;this.onSample(this.state);
    }
  }
}

type Props = {mode:FlightId; initial:FlightState; mass:number; minimumFuel:number; lang:Language;
  onCapture:(state:FlightState)=>void; onFailure:(failure:'fuel'|'corridor', state:FlightState)=>void};

export function FlightView({mode,initial,mass,minimumFuel,lang,onCapture,onFailure}:Props){
  const loc=(es:string,en:string)=>lang==='es'?es:en;
  const [state,setState]=useState(initial);
  const [started,setStarted]=useState(false);
  const [ready,setReady]=useState(false);
  const [guide,setGuide]=useState(false);
  const [paused,setPaused]=useState(false);
  const anchor=useRef<HTMLDivElement>(null);
  const scene=useRef<FlightScene|null>(null);
  const input=useRef<FlightControls>({...neutral});
  const keys=useRef(new Set<string>());
  const controlRefs=useRef({started,guide,paused});
  controlRefs.current={started,guide,paused};
  const rejected=flightFailure(state)??(state.fuel<minimumFuel?'fuel':null);
  const check=flightChecks(mode,state);
  const active=started&&!paused&&!rejected;
  const retry=()=>{
    keys.current.clear();input.current={...neutral};setGuide(false);setStarted(false);setPaused(false);
    scene.current?.reset();
  };
  useEffect(()=>{
    if(!anchor.current)return;
    const instance=new FlightScene(mode,initial,mass,minimumFuel,()=>{
      const s=controlRefs.current,h=keys.current;
      if(!s.started||s.paused||document.hidden)return null;
      return {guide:s.guide,brake:h.has('x')||input.current.brake,
        precision:h.has('shift')||input.current.precision,
        thrust:Number(h.has('w'))-Number(h.has('s'))+input.current.thrust,
        strafe:Number(h.has('e'))-Number(h.has('q'))+input.current.strafe,
        turn:Number(h.has('d'))-Number(h.has('a'))+input.current.turn};
    },sample=>{setState(sample);setReady(true);});
    scene.current=instance;
    const game=mountSurface(anchor.current,instance);
    const release=()=>{keys.current.clear();input.current={...neutral};};
    const down=(event:KeyboardEvent)=>{
      const k=event.key.toLowerCase();
      if(!controlRefs.current.started||controlRefs.current.paused||event.ctrlKey||event.metaKey||event.altKey||
        !['w','s','a','d','q','e','x','shift'].includes(k))return;
      if(event.target instanceof HTMLElement&&
        (event.target.matches('input,select,textarea')||event.target.isContentEditable))return;
      event.preventDefault();keys.current.add(k);
    };
    const up=(event:KeyboardEvent)=>keys.current.delete(event.key.toLowerCase());
    const visibility=()=>{if(document.hidden){release();if(controlRefs.current.started)setPaused(true);}};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    window.addEventListener('blur',release);document.addEventListener('visibilitychange',visibility);
    return()=>{
      scene.current=null;release();game.destroy(true);
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);
      window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',visibility);
    };
  },[mode,initial,mass,minimumFuel]);

  function changeInput<K extends keyof FlightControls>(key:K,value:FlightControls[K]){
    input.current={...input.current,[key]:value};
  }
  function control<K extends 'thrust'|'turn'|'strafe'|'brake'>(key:K,value:FlightControls[K],label:string,k:string){
    const release=()=>changeInput(key,neutral[key]);
    return <button type="button" disabled={!active||guide} className="small-action"
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);changeInput(key,value);}}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
      onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();changeInput(key,value);}}}
      onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release();}}} onBlur={release}>
      {label} <kbd>{k}</kbd>
    </button>;
  }

  const failedMessage=rejected==='fuel'
    ?loc('Sin margen de combustible para el resto de la ruta. Esta maniobra no queda registrada.',
         'There is not enough fuel for the rest of the route. This maneuver does not count.')
    :loc('La nave salió del corredor. La maniobra no se registró.', 'The craft left the corridor. The maneuver was not recorded.');
  return <section className="camera-card orb-flight" aria-label={loc('Pilotaje local','Local piloting')}>
    <div className="panel-head"><span><span className="dot"/> {loc('PILOTAJE LOCAL','LOCAL PILOTING')}</span><span>{labels[mode].target[lang]}</span></div>
    <div className="view">
      <div className="surface" ref={anchor}/>
      <div className="view-corner" aria-hidden="true"><span>⌖</span> <b>{labels[mode].target[lang]}</b></div>
      <div className="orb-telemetry" aria-label={loc('Telemetría de vuelo','Flight telemetry')}>
        <span><b>{check.distance.toFixed(1)}</b>{loc('Distancia','Distance')}</span>
        <span><b>{check.speed.toFixed(1)}</b>{loc('Velocidad relativa','Relative speed')}</span>
        <span><b>{Math.round(state.heading)}°</b>{loc('Rumbo','Heading')}</span>
        <span><b>{state.fuel.toFixed(1)}</b>{loc('Combustible','Fuel')}</span>
      </div>
      {!started||paused||rejected?<div className="view-overlay">
        <div className="briefing">
          <span className="mini">{labels[mode].target[lang]}</span>
          <h2>{rejected?loc('Maniobra interrumpida','Maneuver interrupted'):paused?loc('Vuelo en pausa','Flight paused'):loc('Control de vuelo','Flight control')}</h2>
          <p>{rejected?failedMessage:loc(
            'Corrige la trayectoria con los propulsores. Soltar los mandos conserva el movimiento. Reduce velocidad y alinea la nave para confirmar.',
            'Adjust the trajectory with thrusters. Releasing the controls keeps the craft moving. Slow down and align before confirming.')}</p>
          {rejected?<>
            <button className="primary" onClick={retry}>{loc('Reintentar desde el control anterior','Retry from the last checkpoint')} ↺</button>
            <button className="secondary orb-follow-up" onClick={()=>onFailure(rejected,state)}>{loc('Ver informe del intento','View attempt report')}</button>
          </>:paused?
            <button className="primary" onClick={()=>setPaused(false)}>{loc('Continuar vuelo','Resume flight')} ↗</button>
          :<div className="orb-flight-start">
            <button className="primary" disabled={!ready} onClick={()=>setStarted(true)}>{loc('Tomar controles','Take controls')} ↗</button>
            <button className="secondary" disabled={!ready} onClick={()=>{setGuide(true);setStarted(true);}}>{labels[mode].guide[lang]}</button>
          </div>}
        </div>
      </div>:null}
    </div>
    <div className="orb-flight-actions">
      <div className="orb-flight-buttons">
        {control('thrust',1,loc('Impulsar','Thrust'),'W')}
        {control('thrust',-1,loc('Retropropulsar','Reverse'),'S')}
        {control('turn',-1,loc('Girar izq.','Turn left'),'A')}
        {control('turn',1,loc('Girar der.','Turn right'),'D')}
        {control('strafe',-1,loc('Trasladar −','Slide −'),'Q')}
        {control('strafe',1,loc('Trasladar +','Slide +'),'E')}
        {control('brake',true,loc('Igualar velocidad','Match velocity'),'X')}
      </div>
      <p className="reserve">{loc('Acople:', 'Capture:')} {check.near?'✓':'○'} {loc('distancia','distance')} · {check.slow?'✓':'○'} {loc('velocidad','speed')} · {check.aligned?'✓':'○'} {loc('alineación','alignment')}</p>
      <div className="orb-flight-end">
        <button className="small-action" disabled={!active} aria-pressed={guide} onClick={()=>{keys.current.clear();input.current={...neutral};setGuide(v=>!v);}}>
          {guide?loc('Desactivar asistencia','Disable assist'):loc('Activar asistencia','Enable assist')}
        </button>
        <button className="small-action" disabled={!started||!!rejected} onClick={()=>setPaused(v=>!v)}>{paused?loc('Continuar','Resume'):loc('Pausa','Pause')}</button>
        <button className="primary" disabled={!active||!check.canCapture}
          onClick={()=>{const current=scene.current?.snapshot();if(current)onCapture(current);}}>{labels[mode].confirm[lang]} ↗</button>
      </div>
    </div>
    <div className="field-footer"><span>{loc('Mayús: precisión · Valores de simulación','Shift: precision · Simulation values')}</span>
      <span>{loc('La asistencia y el frenado consumen combustible.','Assist and braking use fuel.')}</span></div>
  </section>;
}
