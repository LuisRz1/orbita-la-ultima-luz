import { z } from 'zod';
import { distance, isWalkable, type Point, type World } from './contract/grid-v1.ts';

export const loadouts = ['survey','repair'] as const;
export type Loadout = typeof loadouts[number];
export const budget = { survey: 18, repair: 15 };
export const reserve = 2;
export const stateSchema = z.object({
  version: z.literal(1), world: z.string(), mission: z.string(),
  phase: z.enum(['briefing','operation','report']),
  loadout: z.enum(loadouts), power: z.number().int().nonnegative(),
  completed: z.array(z.string()), position: z.object({x:z.number().int(),y:z.number().int()}),
  last: z.string().nullable(),
}).strict();
export type MissionState = z.infer<typeof stateSchema>;
export type Failure = 'inactive' | 'unknown' | 'distance' | 'done' | 'requirements' | 'power';
export type ActionResult = { state: MissionState; error?: Failure };
export const approachRange = 1.01;

export function initial(world:World, loadout:Loadout = 'survey'): MissionState {
  return {version:1,world:world.id,mission:world.mission,phase:'briefing',loadout,power:budget[loadout],
    position:{...world.spawn},completed:[],last:null};
}
export function begin(world:World, loadout:Loadout): MissionState {
  return {...initial(world,loadout),phase:'operation'};
}
export function cost(p:World['points'][number], plan:Loadout) {
  return p.action === 'scan' && plan === 'survey' ? Math.max(0,p.power-1)
    : p.action === 'service' && plan === 'repair' ? Math.max(0,p.power-3) : p.power;
}
function mandatoryCost(world:World, plan:Loadout, done:ReadonlySet<string>) {
  return world.points.reduce((sum,p)=>sum+(p.required&&!done.has(p.id)?cost(p,plan):0),0);
}
export function validateLoads(world:World) {
  for(const plan of loadouts)
    if(mandatoryCost(world,plan,new Set())+reserve>budget[plan])
      throw new Error('Mandatory objectives exceed the return reserve: '+world.mission+' / '+plan);
  return world;
}
export function applyAction(world:World, state:MissionState, id:string, at:Point):ActionResult {
  if (state.phase !== 'operation') return {state,error:'inactive'};
  const p = world.points.find(p => p.id === id);
  if (!p) return {state,error:'unknown'};
  if (state.completed.includes(id)) return {state,error:'done'};
  if (distance(at,p.position)>approachRange) return {state,error:'distance'};
  if (!p.prerequisites.every(x=>state.completed.includes(x)) ||
       (id === world.exit && world.points.some(p=>p.required && p.id!==id && !state.completed.includes(p.id)))) {
    return {state,error:'requirements'};
  }
  const power = state.power - cost(p,state.loadout);
  if (power < reserve+mandatoryCost(world,state.loadout,new Set([...state.completed,id]))) return {state,error:'power'};
  const rounded = {x:Math.round(at.x),y:Math.round(at.y)};
  return {state:{...state,power,last:id,phase:id===world.exit?'report':'operation',
    position:isWalkable(world, rounded)?rounded:state.position, completed:[...state.completed,id]}};
}
export function restore(world:World, saved:unknown): MissionState | null {
  const parsed = stateSchema.safeParse(saved);
  if (!parsed.success) return null;
  const s = parsed.data;
  if (s.world !== world.id || s.mission !== world.mission || !isWalkable(world,s.position) ||
      s.power > budget[s.loadout] || s.power < reserve || new Set(s.completed).size!==s.completed.length) return null;
  const done = new Set<string>(); let power = budget[s.loadout];
  for (const id of s.completed) {
    const p = world.points.find(x=>x.id===id);
    if (!p || !p.prerequisites.every(x=>done.has(x)) ||
        (id===world.exit && world.points.some(x=>x.required && x.id!==id && !done.has(x.id)))) return null;
    power -= cost(p,s.loadout); done.add(id);
    if (power < reserve+mandatoryCost(world,s.loadout,done)) return null;
  }
  if (s.power !== power || s.last !== (s.completed.at(-1) ?? null)
    || ((s.phase === 'report') !== done.has(world.exit))
    || (s.phase === 'briefing' && done.size>0)
    || (done.has(world.exit) && s.last!==world.exit)) return null;
  return s;
}
