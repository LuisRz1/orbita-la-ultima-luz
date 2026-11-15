import { z } from 'zod';

export const actions = ['scan', 'salvage', 'service', 'upload'] as const;
export const worldIds = ['orbit', 'moon', 'mars', 'bennu'] as const;
export const sharedProps = ['habitat', 'relay', 'cache', 'console', 'beacon', 'shuttle', 'rock'] as const;
export const localized = z.object({ es: z.string().min(1), en: z.string().min(1) }).strict();
export type Localized = z.infer<typeof localized>;
export type Language = keyof Localized;
export type Point = { x: number; y: number };
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const point = z.object({ x: z.number().int().min(0), y: z.number().int().min(0) }).strict();
const poi = z.object({
  id, position: point, prop: z.enum(sharedProps), action: z.enum(actions),
  title: localized, hint: localized, result: localized, prerequisites: z.array(id),
  power: z.number().int().nonnegative(), required: z.boolean(),
}).strict();
export const worldSchema = z.object({
  kitVersion: z.literal(1), id: z.enum(worldIds), mission: id,
  title: localized, subtitle: localized, briefing: localized, arrival: localized,
  outcome: localized, landscape: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  width: z.number().int().min(6).max(22), height: z.number().int().min(6).max(22),
  spawn: point, exit: id, blocked: z.array(point),
  hazards: z.array(point), points: z.array(poi).min(2),
}).strict();
export type World = z.infer<typeof worldSchema>;
export type POI = World['points'][number];
export const pointKey = ({ x, y }: Point) => x + ',' + y;
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const inBounds = (world: World, p: Point) => p.x >= 0 && p.y >= 0 && p.x < world.width && p.y < world.height;
export const isWalkable = (world: World, p: Point) => inBounds(world,p) &&
  !world.blocked.some(b => pointKey(b) === pointKey(p)) &&
  !world.points.some(b => pointKey(b.position) === pointKey(p));

export function accessible(world: World, a: Point, b: Point) {
  if (Math.abs(a.x-b.x)+Math.abs(a.y-b.y) !== 1) return false;
  return isWalkable(world, b);
}
export function route(world: World, start: Point, to: Point, radius = 1.01): Point[] | null {
  const from = { x: Math.round(start.x), y: Math.round(start.y) };
  if (!isWalkable(world, from)) return null;
  if (distance(from, to) <= radius) return [];
  const queue = [from];
  const path = new Map<string, Point | null>([[pointKey(from), null]]);
  for (let i = 0; i < queue.length; i++) {
    const a = queue[i];
    for (const b of [{x:a.x+1,y:a.y},{x:a.x-1,y:a.y},{x:a.x,y:a.y+1},{x:a.x,y:a.y-1}]) {
      if (path.has(pointKey(b)) || !accessible(world,a,b)) continue;
      path.set(pointKey(b),a);
      if (distance(b,to) <= radius) {
        const steps: Point[] = []; let current: Point | null = b;
        while (current && pointKey(current) !== pointKey(from)) {
          steps.push(current); current = path.get(pointKey(current)) ?? null;
        }
        return steps.reverse();
      }
      queue.push(b);
    }
  }
  return null;
}
export function defineWorld(input: unknown): World {
  const world = worldSchema.parse(input);
  const ids = new Set(world.points.map(p => p.id));
  const occupied = [...world.blocked, ...world.points.map(p => p.position)];
  const spaces = new Set(occupied.map(pointKey));
  const exit = world.points.find(p => p.id === world.exit);
  if (ids.size !== world.points.length || spaces.size !== occupied.length ||
      ![...occupied, ...world.hazards].every(p => inBounds(world,p)) || !isWalkable(world,world.spawn) ||
      !exit || exit.action !== 'upload' || !exit.required || exit.power !== 0 ||
      world.points.filter(p => p.action === 'upload').length !== 1) {
    throw new Error('Invalid world layout or exit: ' + world.id);
  }
  if (world.hazards.some(p => !isWalkable(world,p)) || new Set(world.hazards.map(pointKey)).size !== world.hazards.length) {
    throw new Error('Invalid hazard cells: ' + world.id);
  }
  const visiting = new Set<string>(), checked = new Set<string>();
  function check(p: POI) {
    if (visiting.has(p.id)) throw new Error('Circular prerequisites: ' + p.id);
    if (checked.has(p.id)) return;
    visiting.add(p.id);
    for (const key of p.prerequisites) {
      const pre = world.points.find(x => x.id === key);
      if (!pre || (p.required && !pre.required)) throw new Error('Invalid prerequisite: ' + key);
      check(pre);
    }
    visiting.delete(p.id); checked.add(p.id);
  }
  for (const p of world.points) {
    check(p);
    if(p.prerequisites.includes(world.exit)) throw new Error('An objective cannot depend on the exit: ' + p.id);
    if (route(world,world.spawn,p.position) === null) throw new Error('Unreachable POI: ' + p.id);
  }
  return world;
}
