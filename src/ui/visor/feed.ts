// Per-frame channel from the engine to the helmet HUD. The zustand store is published ten times per second, which is
// too coarse for a pitch ladder or a heading tape; the engine writes these plain numbers on every rendered frame and
// the HUD canvas reads them from its own requestAnimationFrame. Read-only for the interface: nothing here feeds back
// into the simulation.
import type { LevelV2 } from '../../core/contract/level-v2.ts';
import type { Body } from '../../core/movement.ts';
import type { Progress } from '../../core/save/progress3d.ts';
import { missingFor } from '../../core/session.ts';
import type { Sortie } from '../../core/sortie.ts';

export type BlipKind = 'goal' | 'point' | 'home' | 'luma' | 'echo' | 'rock';
export type Blip = { x: number; z: number; kind: BlipKind };

/** Radar range in metres; echoes and rocks only show up once they are this close. */
export const radarRange = 60;
const nearRange = 34;

export const visorFeed = {
  /** Camera yaw (radians; forward is −sin, −cos) and pitch (radians, positive looking down). */
  yaw: 0, pitch: 0, fov: 62,
  x: 0, z: 0,
  /** Height above the ground, vertical and horizontal speed. */
  alt: 0, vy: 0, speed: 0, grounded: true,
  /** Dash recharge, 0 (just used) to 1 (ready); double jumps left and fitted. */
  dashReady: 1, airJumps: 0, airJumpsLeft: 0,
  /** Clock times (performance.now) of the last dash and landing, and how hard the landing was (m/s). */
  dashAt: -1e9, landAt: -1e9, landHard: 0,
  blips: [] as Blip[],
  /** Last frame written, so the HUD can tell a paused engine from a live one. */
  stamp: 0,
};

let dashMax = 0.8, wasGrounded = true, lastVy = 0, wasDashing = false, blipsAt = 0;

/** Called by the engine once per rendered frame while the helmet view is on. */
export function writeVisor(body: Body, yaw: number, pitch: number, fov: number, alt: number,
  level: LevelV2, sortie: Sortie, progress: Progress, luma: { x: number; z: number } | null) {
  const f = visorFeed, now = performance.now();
  f.yaw = yaw; f.pitch = pitch; f.fov = fov; f.x = body.x; f.z = body.z;
  f.alt = alt; f.vy = body.vy; f.speed = Math.hypot(body.vx, body.vz); f.grounded = body.grounded;
  if (body.dashCooldown > dashMax) dashMax = body.dashCooldown;
  f.dashReady = 1 - Math.min(1, body.dashCooldown / dashMax);
  f.airJumps = sortie.stats.airJumps; f.airJumpsLeft = Math.min(body.airJumpsLeft, sortie.stats.airJumps);
  const dashing = body.dash > 0;
  if (dashing && !wasDashing) f.dashAt = now;
  if (body.grounded && !wasGrounded) { f.landAt = now; f.landHard = Math.abs(lastVy); }
  wasDashing = dashing; wasGrounded = body.grounded; lastVy = body.grounded ? 0 : body.vy;
  f.stamp = now;
  if (now - blipsAt < 160) return;
  blipsAt = now;
  const blips: Blip[] = [{ x: level.spawn.x, z: level.spawn.z, kind: 'home' }];
  const done = sortie.session.completed;
  let goal = false;
  for (const p of level.points) {
    if (done.includes(p.id)) continue;
    const open = p.required && !goal && missingFor(level, sortie.session, p).length === 0;
    if (open) goal = true;
    blips.push({ x: p.position.x, z: p.position.z, kind: open ? 'goal' : 'point' });
  }
  const near = (q: { x: number; z: number }) => Math.hypot(q.x - body.x, q.z - body.z) < nearRange;
  for (const c of level.collectibles) if (!progress.echoes.includes(c.id) && !sortie.session.collected.includes(c.id) && near(c.position)) blips.push({ x: c.position.x, z: c.position.z, kind: 'echo' });
  for (const s of level.specimens ?? []) if (!progress.atlas.includes(s.id) && near(s.position)) blips.push({ x: s.position.x, z: s.position.z, kind: 'rock' });
  if (luma) blips.push({ x: luma.x, z: luma.z, kind: 'luma' });
  f.blips = blips;
}
