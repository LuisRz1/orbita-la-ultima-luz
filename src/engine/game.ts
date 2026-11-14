import { PerspectiveCamera, Vector3, type MeshBasicMaterial } from 'three';
import type { LevelV2 } from '../core/contract/level-v2.ts';
import { buildHeightfield, heightAt, slopeAt } from '../core/heightfield.ts';
import { createBody, groundAt, stepBody, type Body, type Ground } from '../core/movement.ts';
import { emptyProgress, readProgress, writeProgress, type Progress } from '../core/save/progress3d.ts';
import { collect, missingFor, pointInReach, signalAt, zoneAt } from '../core/session.ts';
import { buildReport, dashCost, drain, sortieInteract, spend, spendable, startSortie, type Sortie } from '../core/sortie.ts';
import { actionCost, assessSuit, instrumentFor, instruments, proposals, suitMovement, type SuitDesign } from '../core/suit.ts';
import { unlocks, type GameEvent } from '../core/achievements.ts';
import { prefs } from '../ui/prefs.ts';
import { commands, hud, type DialogueLine, type Notice } from '../ui/store.ts';
import { exposeDebug } from './debug.ts';
import { Input, type Actions } from './input.ts';
import { Loop } from './loop.ts';
import { detectTier, tierIds, type Tier } from './quality.ts';
import { createViewport } from './renderer.ts';
import { tuning } from './tuning.ts';
import { buildWorldView, palette } from './world-view.ts';

export type Game = { dispose(): void };

const verbs = {
  scan: { es: 'Escanear', en: 'Scan' }, salvage: { es: 'Recuperar', en: 'Recover' },
  service: { es: 'Reparar', en: 'Repair' }, upload: { es: 'Transmitir', en: 'Transmit' },
};
const say = (es: string, en: string) => ({ es, en });

function startingTier(): Tier {
  const asked = new URLSearchParams(window.location.search).get('quality');
  const forced = tierIds.find(id => id === asked);
  if (forced) return forced;
  const chosen = prefs.getState().quality;
  if (chosen !== 'auto') return chosen;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return detectTier({ deviceMemory: nav.deviceMemory, hardwareConcurrency: nav.hardwareConcurrency, touch: matchMedia('(pointer: coarse)').matches });
}

const angleLerp = (a: number, b: number, t: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/** Mounts the engine with the lunar level. Resolves once the level is built and the first frame is queued. */
export async function createGame(host: HTMLElement): Promise<Game> {
  const [{ moonLevel: level }, { moonDialogue }] = await Promise.all([
    import('../levels/moon/level.ts') as Promise<{ moonLevel: LevelV2 }>, import('../levels/moon/dialogue.ts')]);
  const tier = startingTier();
  const viewport = createViewport(host, tier);
  const hf = buildHeightfield(level.terrain.size, level.terrain.res, level.terrain.height);
  const ground: Ground = { height: (x, z) => heightAt(hf, x, z), slope: (x, z) => slopeAt(hf, x, z), solids: level.props.map(p => p.solid) };
  const view = buildWorldView(level, hf);
  const camera = new PerspectiveCamera(62, 1, 0.1, 700);
  viewport.onResize((w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); });
  const input = new Input(viewport.renderer.domElement);
  const applyPrefs = () => { input.sensitivity = 0.0025 * prefs.getState().sensitivity; };
  applyPrefs();
  const unsubscribePrefs = prefs.subscribe(applyPrefs);

  let progress: Progress = emptyProgress(level.id, proposals[0].design);
  let saveError = false;
  try {
    const saved = await readProgress(level.id);
    if (saved && saved !== 'invalid') progress = saved;
  } catch { saveError = true; }
  const save = () => writeProgress(progress).then(() => { saveError = false; }).catch(() => { saveError = true; }).finally(() => publish(true));

  let phase: 'menu' | 'design' | 'eva' | 'report' = 'menu';
  let paused = false, wasLocked = false;
  let dialogue: { lines: DialogueLine[]; index: number } | null = null;
  let toast: { id: string; at: number } | null = null;
  let sortie: Sortie = startSortie(progress.design);
  let body: Body = createBody(level.spawn.x, level.spawn.z, ground);
  const prev = { x: body.x, y: body.y, z: body.z };
  let time = 0, zone: string | null = null, lostFor = 0, fade = 0, recalling = false, idleFor = 0, ending = 0;
  let endReason: 'reserve' | null = null;
  let notice: Notice | null = null;
  const lumaPos = new Vector3(body.x + 1, body.y + 1.6, body.z + 1);
  const camPos = new Vector3(), target = new Vector3();

  const tell = (text: Notice['text'], tone: Notice['tone'] = 'luma') => { notice = { text, at: time, tone }; publish(true); };

  /** Plays a story sequence once per save. */
  function play(key: string) {
    const lines = moonDialogue[key];
    if (!lines || progress.seen.includes(key)) return;
    progress = { ...progress, seen: [...progress.seen, key] };
    void save();
    dialogue = { lines, index: 0 };
    publish(true);
  }
  function advance() {
    if (!dialogue) return;
    dialogue.index++;
    if (dialogue.index >= dialogue.lines.length) dialogue = null;
    publish(true);
  }
  function award(event: GameEvent) {
    const fresh = unlocks(event, progress.achievements);
    if (!fresh.length) return;
    progress = { ...progress, achievements: [...progress.achievements, ...fresh] };
    void save();
    toast = { id: fresh[0], at: time };
    publish(true);
  }

  function teleport(x: number, z: number) {
    body = createBody(x, z, ground);
    Object.assign(prev, { x: body.x, y: body.y, z: body.z });
    lumaPos.set(x + 1, body.y + 1.6, z + 1);
  }

  function resetPointsView() {
    for (const p of level.points) {
      const v = view.points.get(p.id)!;
      const done = sortie.session.completed.includes(p.id);
      (v.beam.material as MeshBasicMaterial).color.set(done ? palette.warn : palette.accent);
      (v.ring.material as MeshBasicMaterial).color.set(done ? palette.warn : palette.accent);
      v.beam.scale.y = done ? 0.15 : 1;
    }
    for (const [id, m] of view.echoes) m.visible = !progress.echoes.includes(id);
  }

  function start(design: SuitDesign) {
    if (assessSuit(design).problems.length) return;
    sortie = startSortie(design);
    sortie.session.collected = [...progress.echoes];
    progress = { ...progress, design };
    void save();
    teleport(level.spawn.x, level.spawn.z);
    input.look.yaw = 0; input.look.pitch = 0.32;
    zone = null; lostFor = 0; fade = 0; recalling = false; ending = 0; endReason = null;
    resetPointsView();
    phase = 'eva'; paused = false;
    tell(level.arrival);
    award({ kind: 'sortie', designs: [...progress.attempts.map(a => a.design), design] });
    play('intro');
  }

  function finish() {
    const report = buildReport(level, sortie);
    award({ kind: 'report', report, previous: progress.attempts.map(a => a.outcome) });
    progress = { ...progress, attempts: [...progress.attempts, {
      design: sortie.design, outcome: report.outcome, completed: report.completed,
      used: Math.round(report.used * 10) / 10, time: Math.round(report.time), echoes: report.echoes,
    }].slice(-50) };
    void save();
    phase = 'report';
    hud.setState({ report });
    if (document.pointerLockElement) document.exitPointerLock();
    play(report.outcome === 'complete' ? 'complete' : 'recalled');
    publish(true);
  }

  function toDesign() { phase = 'design'; paused = false; dialogue = null; teleport(level.spawn.x, level.spawn.z); hud.setState({ report: null }); publish(true); }

  commands.start = start;
  commands.retry = () => start(sortie.design);
  commands.redesign = toDesign;
  commands.continueGame = toDesign;
  commands.newGame = () => { progress = { ...progress, design: proposals[0].design }; void save(); toDesign(); };
  commands.toMenu = () => { phase = 'menu'; paused = false; dialogue = null; hud.setState({ report: null }); if (document.pointerLockElement) document.exitPointerLock(); publish(true); };
  commands.resume = () => { paused = false; publish(true); };
  commands.abandon = toDesign;
  commands.advance = advance;

  function updateEva(dt: number) {
    const params = suitMovement(tuning, sortie.stats);
    const k = input.look.yaw, fx = -Math.sin(k), fz = -Math.cos(k), rx = Math.cos(k), rz = -Math.sin(k);
    const ax = (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
    const ay = (input.isHeld('up') ? 1 : 0) - (input.isHeld('down') ? 1 : 0);
    Object.assign(prev, { x: body.x, y: body.y, z: body.z });
    const frozen = recalling || ending > 0;
    let dash = !frozen && input.wasPressed('dash');
    if (dash && spendable(sortie) < dashCost) { dash = false; tell(say('Energía en reserva: sin dash.', 'Energy at reserve: no dash.'), 'warn'); }
    if (!body.grounded && spendable(sortie) < sortie.stats.airJumpCost) body.airJumpsLeft = 0;
    const events = stepBody(body, frozen ? { x: 0, z: 0, jump: false, jumpHeld: false, dash: false } : {
      x: fx * ay + rx * ax, z: fz * ay + rz * ax,
      jump: input.wasPressed('jump'), jumpHeld: input.isHeld('jump'), dash,
    }, ground, params, dt);
    if (events.dashed) { spend(sortie, 'dash', dashCost); award({ kind: 'dash' }); }
    if (events.airJumped) { spend(sortie, 'thruster', sortie.stats.airJumpCost); award({ kind: 'air-jump' }); }

    if (!frozen && input.wasPressed('interact')) {
      const result = sortieInteract(level, sortie, body.x, body.z);
      if (result.ok) {
        resetPointsView();
        tell(result.point.result);
        if (sortie.outcome === 'complete') ending = 1.2;
      } else if (result.error === 'requirements') {
        tell(say('Todavía no. Faltan pasos antes de esto: revisa la lista de objetivos.', 'Not yet. Other steps come first: check the objective list.'), 'warn');
      } else if (result.error === 'instrument' && result.point) {
        const needs = instruments[instrumentFor[result.point.action]!].name;
        tell(say(`El traje no lleva ${needs.es.toLowerCase()}. Anotado para el informe.`, `The suit has no ${needs.en.toLowerCase()}. Noted for the report.`), 'warn');
      } else if (result.error === 'power') {
        tell(say(`Cuesta ${result.cost} u. y no puedes tocar la reserva de retorno.`, `It costs ${result.cost} u and the return reserve is off limits.`), 'warn');
      }
    }

    const picked = collect(level, sortie.session, body.x, body.y, body.z, (x, z) => heightAt(hf, x, z));
    for (const id of picked) {
      view.echoes.get(id)!.visible = false;
      progress = { ...progress, echoes: [...progress.echoes, id] };
      void save();
      award({ kind: 'echo', found: progress.echoes.length, total: level.collectibles.length });
      tell(say(`Eco de Aurora ${progress.echoes.length}/${level.collectibles.length}.`, `Aurora echo ${progress.echoes.length}/${level.collectibles.length}.`), 'system');
    }

    const nowZone = zoneAt(level, body.x, body.z);
    if (nowZone && nowZone !== zone) {
      const z = level.zones.find(q => q.id === nowZone)!;
      hud.setState({ zone: z.title, zoneAt: time });
      if (z.drain) tell(say('Sombra permanente: el frío gasta batería más rápido.', 'Permanent shadow: the cold drains the battery faster.'), 'warn');
      award({ kind: 'zone', cold: !!z.drain });
      play('zone:' + z.id);
    }
    zone = nowZone;

    const moving = Math.hypot(body.vx, body.vz) > 0.5;
    if (!frozen && drain(sortie, level, dt, moving, zone) && !endReason) {
      endReason = 'reserve';
      tell(say('Batería en reserva. LUMA activa el regreso al módulo.', 'Battery at reserve. LUMA starts the return to the lander.'), 'warn');
    }

    // Radio link: losing it for a moment is a warning; losing it for longer triggers LUMA's recall.
    const signal = signalAt(level, body.x, body.z, sortie.stats.commsRadius);
    lostFor = signal <= 0 ? lostFor + dt : 0;
    if (signal < 0.5 && signal > 0 && notice?.tone !== 'warn') tell(say('La señal cae. Vuelve hacia el cráter.', 'Signal fading. Head back into the crater.'), 'warn');
    if (lostFor > 1.5 && !recalling) { recalling = true; tell(say('Sin enlace. LUMA te guía de vuelta al módulo.', 'Link lost. LUMA guides you back to the lander.'), 'warn'); }
    if (recalling || endReason) {
      fade = Math.min(1, fade + dt * 1.6);
      if (fade >= 1) {
        if (endReason) { finish(); return; }
        teleport(level.spawn.x, level.spawn.z); sortie.session.recalls++; recalling = false; lostFor = 0;
      }
    } else fade = Math.max(0, fade - dt * 1.2);
    if (ending > 0) { ending -= dt; if (ending <= 0) { finish(); return; } }

    idleFor = moving ? 0 : idleFor + dt;
    if (moving && performance.now() - input.lastLook > 1800) input.look.yaw = angleLerp(input.look.yaw, Math.atan2(-body.dirX, -body.dirZ), dt * 0.9);
    if (events.landed || events.dashed || events.airJumped) publish(true);
  }

  function update(dt: number) {
    time += dt;
    // Losing pointer lock in the middle of a sortie (Esc, alt-tab) pauses it.
    const locked = input.locked;
    if (wasLocked && !locked && phase === 'eva' && !dialogue) { paused = true; publish(true); }
    wasLocked = locked;
    if (dialogue && (input.wasPressed('interact') || input.wasPressed('jump'))) advance();
    else if (phase === 'eva' && input.wasPressed('pause')) { paused = !paused; publish(true); }
    if (phase === 'eva' && !paused && !dialogue) updateEva(dt);
    else {
      Object.assign(prev, { x: body.x, y: body.y, z: body.z });
      if (phase !== 'eva') fade = Math.max(0, fade - dt * 1.5);
      if (phase === 'design' && !prefs.getState().reduceMotion) { input.look.yaw += dt * 0.12; input.look.pitch = 0.18; }
    }
    input.endStep();
  }

  let sincePublish = 0;
  function publish(now = false) {
    if (!now && sincePublish < 100) return;
    sincePublish = 0;
    const reach = phase === 'eva' ? pointInReach(level, sortie.session, body.x, body.z) : null;
    const needs = reach ? instrumentFor[reach.action] : undefined;
    const info = viewport.renderer.info.render;
    const cold = level.zones.find(q => q.id === zone)?.drain;
    hud.setState({
      ready: true, phase, tier, frameMs: viewport.governor.average, renderScale: viewport.governor.scale,
      drawCalls: info.calls, triangles: info.triangles,
      levelTitle: level.title, briefing: level.briefing,
      objectives: level.points.map(p => ({ id: p.id, title: p.title, required: p.required, done: sortie.session.completed.includes(p.id), action: p.action, power: p.power })),
      echoes: { found: progress.echoes.length, total: level.collectibles.length },
      prompt: reach ? { verb: verbs[reach.action], title: reach.title, cost: actionCost(reach.power, reach.action, sortie.design),
        blocked: missingFor(level, sortie.session, reach).map(id => level.points.find(p => p.id === id)!.title),
        missing: needs && !sortie.design.instruments.includes(needs) ? instruments[needs].name : null } : null,
      notice, signal: signalAt(level, body.x, body.z, sortie.stats.commsRadius), fade, locked: input.locked,
      player: { x: body.x, y: body.y, z: body.z, speed: Math.hypot(body.vx, body.vz), grounded: body.grounded },
      realGravity: level.realGravity, elapsed: sortie.time, now: time,
      design: progress.design, energy: sortie.energy, capacity: sortie.stats.capacity,
      draining: cold && phase === 'eva' ? say('frío', 'cold') : null,
      attempts: progress.attempts, saveError,
      paused, dialogue: dialogue ? dialogue.lines[dialogue.index] : null, toast, achievements: progress.achievements,
      hasProgress: progress.attempts.length > 0,
    });
  }

  function render(alpha: number, frameMs: number) {
    viewport.tick(frameMs);
    const px = prev.x + (body.x - prev.x) * alpha, py = prev.y + (body.y - prev.y) * alpha, pz = prev.z + (body.z - prev.z) * alpha;
    view.player.position.set(px, py, pz);
    view.player.rotation.y = angleLerp(view.player.rotation.y, body.facing + Math.PI, Math.min(1, frameMs / 60));

    const floor = groundAt(ground, px, pz, py + 0.05);
    const lift = Math.max(0, py - floor);
    view.shadow.position.set(px, floor + 0.04, pz);
    view.shadow.scale.setScalar(Math.max(0.35, 1 - lift * 0.12));
    (view.shadow.material as MeshBasicMaterial).opacity = Math.max(0.12, 0.45 - lift * 0.05);

    // LUMA floats behind the player's shoulder; after a while idle it drifts toward the next pending point.
    const pending = level.points.find(p => p.required && !sortie.session.completed.includes(p.id) && !missingFor(level, sortie.session, p).length);
    const smooth = 1 - Math.exp(-frameMs / 1000 * 3.5);
    if (phase === 'eva' && idleFor > 5 && pending) {
      const dx = pending.position.x - px, dz = pending.position.z - pz, d = Math.hypot(dx, dz) || 1;
      target.set(px + dx / d * 2.4, py + 1.8, pz + dz / d * 2.4);
    } else target.set(px - Math.sin(body.facing) * 1.2 + Math.cos(body.facing) * 0.9, py + 1.7, pz - Math.cos(body.facing) * 1.2 - Math.sin(body.facing) * 0.9);
    lumaPos.lerp(target, smooth);
    view.luma.position.set(lumaPos.x, lumaPos.y + (prefs.getState().reduceMotion ? 0 : Math.sin(time * 2.2) * 0.12), lumaPos.z);
    view.luma.rotation.y = Math.atan2(px - lumaPos.x, pz - lumaPos.z) + Math.PI;

    if (phase === 'menu') {
      // Slow cinematic orbit over the whole crater, as on the title screen.
      const a = prefs.getState().reduceMotion ? 0.6 : time * 0.035;
      camera.position.set(Math.sin(a) * 120, 46, Math.cos(a) * 120);
      camera.lookAt(0, 4, 0);
    } else {
      const { yaw, pitch } = input.look, dist = phase === 'eva' ? 6.4 : 4.6;
      camPos.set(px + Math.sin(yaw) * Math.cos(pitch) * dist, py + 1.5 + Math.sin(pitch) * dist, pz + Math.cos(yaw) * Math.cos(pitch) * dist);
      camPos.y = Math.max(camPos.y, heightAt(hf, camPos.x, camPos.z) + 0.8);
      camera.position.copy(camPos);
      camera.lookAt(px, py + (phase === 'eva' ? 1.4 : 1.1), pz);
    }

    view.beacon.visible = Math.sin(time * 3) > -0.2;
    for (const [id, m] of view.echoes) if (m.visible) m.rotation.y = time * 1.5 + id.length;

    viewport.renderer.render(view.scene, camera);
    sincePublish += frameMs;
    publish();
  }

  const loop = new Loop({ update, render });
  const hideDebug = exposeDebug({
    state: () => ({ steps: loop.steps, paused: loop.paused, gamePaused: paused, dialogue: !!dialogue, tier, phase, x: body.x, y: body.y, z: body.z, grounded: body.grounded,
      zone, completed: [...sortie.session.completed], collected: [...progress.echoes], recalls: sortie.session.recalls,
      signal: signalAt(level, body.x, body.z, sortie.stats.commsRadius), energy: sortie.energy, outcome: sortie.outcome, attempts: progress.attempts.length }),
    step: (count: number) => loop.step(count),
    pause: (value: boolean) => { loop.paused = value; },
    perf: () => ({ ...hud.getState(), ratio: viewport.ratio, width: viewport.width, height: viewport.height }),
    teleport: (x: number, z: number) => teleport(x, z),
    press: (action: Actions) => input.press(action),
    hold: (action: Actions, down: boolean) => input.hold(action, down),
    look: (yaw: number, pitch: number) => { input.look.yaw = yaw; input.look.pitch = pitch; },
    start: (design: SuitDesign | string) => start(typeof design === 'string' ? proposals.find(p => p.id === design)!.design : design),
    // Spends through the ledger so the report stays consistent with the battery level.
    menu: () => commands.toMenu(),
    design: () => toDesign(),
    advance: () => advance(),
    setEnergy: (value: number) => { if (value < sortie.energy) spend(sortie, 'move', sortie.energy - value); else sortie.energy = value; },
    level: () => ({ points: level.points.map(p => ({ id: p.id, ...p.position, required: p.required })),
      collectibles: level.collectibles.map(c => ({ id: c.id, ...c.position, y: c.y })), spawn: level.spawn, comms: level.comms }),
  });
  resetPointsView();
  publish(true);
  loop.start();

  return {
    dispose() {
      loop.stop();
      hideDebug();
      input.dispose();
      unsubscribePrefs();
      view.dispose();
      viewport.dispose();
      for (const name of Object.keys(commands) as (keyof typeof commands)[]) commands[name] = () => {};
      hud.setState({ ready: false, phase: 'loading', report: null });
    },
  };
}
