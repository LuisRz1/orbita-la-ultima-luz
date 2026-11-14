import { z } from 'zod';
import { flightReserve, type Design } from './engineering.ts';

export const flightIds = ['launch','dock','depart','lunar-approach'] as const;
export type FlightId = typeof flightIds[number];
export const flightStateSchema = z.object({
  x:z.number().finite(), y:z.number().finite(), vx:z.number().finite(), vy:z.number().finite(),
  heading:z.number().finite(), fuel:z.number().finite().nonnegative(),
}).strict();
export type FlightState = z.infer<typeof flightStateSchema>;
export type FlightControls = {
  thrust:number; strafe:number; turn:number; brake:boolean; precision:boolean; guide:boolean;
};
export const neutral:FlightControls = {thrust:0,strafe:0,turn:0,brake:false,precision:false,guide:false};
export const flightSpecs = {
  launch:{x:-65,y:-13,vx:2,vy:0,heading:14,radius:3.2,speed:4.8,angle:21},
  dock:{x:-63,y:13,vx:4,vy:0.8,heading:-14,radius:2.6,speed:3.1,angle:13},
  depart:{x:-51,y:-9,vx:1,vy:0,heading:11,radius:3.1,speed:4.5,angle:20},
  'lunar-approach':{x:-70,y:15,vx:4.5,vy:-0.4,heading:-12,radius:2.6,speed:3.1,angle:13},
} as const;

const radians=Math.PI/180;
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const normalized=(v:number)=>((v+540)%360)-180;
const bound=(v:number,max:number)=>clamp(v,-max,max);

export function initialFlight(id:FlightId, fuel:number, orbit:Design['orbit']):FlightState {
  const { x, y, vx, vy, heading }=flightSpecs[id];
  const correction=orbit==='survey'&&id==='dock';
  return {x,y:y+(correction?9:0),vx,vy,heading,fuel};
}
export function flightFailure(state:FlightState):'fuel'|'corridor'|null {
  if(state.fuel<flightReserve)return 'fuel';
  if(state.x>6||state.x < -107||Math.abs(state.y)>38)return 'corridor';
  return null;
}
export function flightChecks(id:FlightId,f:FlightState) {
  const spec=flightSpecs[id];
  const distance=Math.hypot(f.x,f.y),speed=Math.hypot(f.vx,f.vy);
  const near=distance<=spec.radius, slow=speed<=spec.speed, aligned=Math.abs(normalized(f.heading))<=spec.angle;
  return {distance,speed,near,slow,aligned,canCapture:near&&slow&&aligned&&f.x<=1&&!flightFailure(f)};
}

// Marco 2D local. Soltar propulsores conserva velocidad; cada corrección consume combustible.
export function advanceFlight(id:FlightId, state:FlightState, input:FlightControls, dt:number, mass:number):FlightState {
  if(flightFailure(state)||!(dt>0)||dt>.1)return state;
  const {x,y,vx,vy,heading,fuel}=state;
  const accel=clamp(7.8*6100/mass,5.2,9.2)*(input.precision?.45:1);
  let turn=bound(input.turn,1)*73*(input.precision?.52:1);
  const h=heading*radians;
  let ax=(Math.cos(h)*bound(input.thrust,1)-Math.sin(h)*bound(input.strafe,1))*accel;
  let ay=(Math.sin(h)*bound(input.thrust,1)+Math.cos(h)*bound(input.strafe,1))*accel;
  if(input.guide){
    const acceptable=flightChecks(id,state).canCapture;
    const stopAt=-1.2;
    const targetVx=acceptable?0:clamp((stopAt-x)*.6,-2.4,10.5);
    const targetVy=acceptable?0:clamp(-y*.8,-6.3,6.3);
    ax=bound((targetVx-vx)*1.65,accel);
    ay=bound((targetVy-vy)*1.65,accel);
    turn=bound(-heading*3,72);
  } else if(input.brake) {
    ax=bound(-vx*2,accel);
    ay=bound(-vy*2,accel);
    turn=bound(-heading*2,60);
  }
  const spend=dt*(Math.hypot(ax,ay)*.21+Math.abs(turn)*.011);
  const nextVx=vx+ax*dt,nextVy=vy+ay*dt;
  return {
    x:x+nextVx*dt,y:y+nextVy*dt,vx:nextVx,vy:nextVy,
    heading:normalized(heading+turn*dt),fuel:Math.max(0,fuel-spend),
  };
}
