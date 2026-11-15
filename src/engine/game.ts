import { PerspectiveCamera, Vector3, type MeshBasicMaterial } from 'three';
import { buildHeightfield, heightAt, slopeAt } from '../core/heightfield.ts';
import { createBody, groundAt, stepBody, type Body, type Ground } from '../core/movement.ts';
import { emptyProgress, readProgress, writeProgress, type Progress } from '../core/save/progress3d.ts';
import { canScan, scanCost, specimenInReach } from '../core/atlas.ts';
import { beaconCost, beaconInReach } from '../core/beacons.ts';
import { ruinInReach } from '../core/ruins.ts';
import type { Ruin, Specimen } from '../core/contract/level-v2.ts';
import { collect, missingFor, pointInReach, signalAt, zoneAt } from '../core/session.ts';
import { buildReport, dashCost, drain, sortieInteract, spend, spendable, startSortie, type Sortie } from '../core/sortie.ts';
import { actionCost, assessSuit, instrumentFor, instruments, proposals, suitMovement, type SuitDesign } from '../core/suit.ts';
import { unlocks, type GameEvent } from '../core/achievements.ts';
import { prefs } from '../ui/prefs.ts';
import { commands, hud, type DialogueLine, type Notice } from '../ui/store.ts';
import { sound as audio, type Mood } from './audio.ts';
import { exposeDebug } from './debug.ts';
import { Input, type Actions } from './input.ts';
import { Loop } from './loop.ts';
import { detectTier, tierIds, tiers, type Tier } from './quality.ts';
import { createViewport } from './renderer.ts';
import { tuning } from './tuning.ts';
import { buildInterior, type StationId } from './interior.ts';
import { buildWorldView, palette } from './world-view.ts';
import { biome, setBiome } from './style.ts';
import { zoneDrain } from '../core/contract/level-v2.ts';

export type Game = { dispose(): void };

/** Recorded LUMA lines known at build time (lang/level/key-index.m4a); lines without a recording stay silent. */
const lumaVoices = import.meta.glob('../assets/voice/luma/*/*/*.m4a', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

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

/** Mounts the engine with the requested level. Resolves once the level is built and the first frame is queued. */
export async function createGame(host: HTMLElement): Promise<Game> {
  const { levels, requestedLevel, route, levelUrl } = await import('../levels/registry.ts');
  const levelId = requestedLevel(window.location.search);
  const { level, dialogue: script, facts, biome: biomeId } = await levels[levelId]();
  // The palette must be chosen before any material, texture or model is built.
  setBiome(biomeId);
  audio.setWind(biome.wind);
  audio.setStorm(0);
  const tier = startingTier();
  const viewport = createViewport(host, tier);
  const hf = buildHeightfield(level.terrain.size, level.terrain.res, level.terrain.height);
  const ground: Ground = { height: (x, z) => heightAt(hf, x, z), slope: (x, z) => slopeAt(hf, x, z), solids: level.props.map(p => p.solid) };
  const view = buildWorldView(level, hf, tiers[tier].scatter, tier === 'low' ? 3 : 4);
  const interior = buildInterior();
  let activeGround: Ground = ground;
  const camera = new PerspectiveCamera(62, 1, 0.1, 700);
  viewport.onResize((w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); });
  const input = new Input(viewport.renderer.domElement);
  const applyPrefs = () => {
    const p = prefs.getState();
    input.sensitivity = 0.0025 * p.sensitivity;
    audio.volumes = { master: p.master, music: p.music, sfx: p.sfx };
    audio.applyVolumes();
    view?.setSky(p.paintedSky);
  };
  // Browsers start audio only after a gesture: the first click or key press unlocks it.
  const unlockAudio = () => audio.unlock();
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  const onVisibility = () => audio.suspend(document.hidden);
  document.addEventListener('visibilitychange', onVisibility);
  let stepDistance = 0, lastLine: unknown = null, pendingZoneLine: string | null = null;
  applyPrefs();
  const unsubscribePrefs = prefs.subscribe(applyPrefs);

  let progress: Progress = emptyProgress(level.id, proposals[0].design);
  let saveError = false;
  try {
    const saved = await readProgress(level.id);
    if (saved && saved !== 'invalid') progress = saved;
  } catch { saveError = true; }
  const save = () => writeProgress(progress).then(() => { saveError = false; }).catch(() => { saveError = true; }).finally(() => publish(true));

  // Destinations follow the story order: each opens once the previous one has a completed sortie. A destination
  // already played (it has attempts of its own) stays open, so the player can always go back to it.
  const completedHere = () => progress.attempts.some(a => a.outcome === 'complete');
  const unlocked = new Set<string>([route[0].id, levelId]);
  const saves = new Map<string, Progress | null>();
  for (const r of route) {
    try {
      const p = r.id === levelId ? progress : await readProgress(r.id);
      saves.set(r.id, p && p !== 'invalid' ? p : null);
    } catch { saves.set(r.id, null); /* storage unavailable: only the current destination is listed */ }
  }
  route.forEach((r, i) => {
    const own = saves.get(r.id), prior = i > 0 ? saves.get(route[i - 1].id) : null;
    if (own?.attempts.length || prior?.attempts.some(a => a.outcome === 'complete')) unlocked.add(r.id);
  });
  const routeIndex = route.findIndex(r => r.id === levelId);
  const nextStop = routeIndex >= 0 && routeIndex < route.length - 1 ? route[routeIndex + 1] : null;
  const travel = (id: string) => { if (unlocked.has(id)) window.location.assign(levelUrl(id, window.location.search)); };
  let storm = false;
  function setStorm(on: boolean) {
    storm = on;
    view.ambience.setStorm(on ? 2.2 : 1);
    audio.setStorm(on ? 1 : 0);
  }

  let phase: 'menu' | 'ship' | 'eva' | 'report' = 'menu';
  // Ship (lander interior): the suit is assembled station by station; `draft` is what the player is wearing.
  const slotStations = ['battery', 'thruster', 'antenna', 'instruments'] as const;
  const tour: StationId[] = [...slotStations, 'locker', 'airlock'];
  let ship = { draft: progress.design, done: new Set<StationId>(), guided: false, open: null as StationId | null, near: null as StationId | null, exiting: 0 };
  let paused = false, wasLocked = false;
  let dialogue: { key: string; lines: DialogueLine[]; index: number } | null = null;
  let toast: { id: string; at: number } | null = null;
  let sortie: Sortie = startSortie(progress.design);
  let body: Body = createBody(level.spawn.x, level.spawn.z, ground);
  const prev = { x: body.x, y: body.y, z: body.z };
  let time = 0, zone: string | null = null, lostFor = 0, fade = 0, recalling = false, idleFor = 0, ending = 0;
  let endReason: 'reserve' | null = null, returning = false, lowWarned = false;
  let notice: Notice | null = null;
  const lumaPos = new Vector3(body.x + 1, body.y + 1.6, body.z + 1);
  const camPos = new Vector3(), target = new Vector3();
  let camDist = 6.4;

  const untag = (v: string) => v.replace(/^LUMA:\s*/, '');
  /** LUMA is with the player unless the level makes it join later (chapter 1: once the protected bay is open). */
  const lumaHere = () => !level.companionAfter || (phase === 'eva' && sortie.session.completed.includes(level.companionAfter));
  const tell = (text: Notice['text'], tone: Notice['tone'] = 'luma') => {
    // Before LUMA has joined, its messages come from the suit system instead.
    if (tone === 'luma' && !lumaHere()) tone = 'system';
    notice = { text: tone === 'luma' ? { es: untag(text.es), en: untag(text.en) } : text, at: time, tone };
    publish(true);
  };
  /** The same line said by LUMA when it is present, or by Control before it joins. */
  const guide = (luma: Notice['text'], control: Notice['text']) => (lumaHere() ? luma : control);

  /** Plays a story sequence once per save. */
  function play(key: string) {
    const lines = script[key];
    if (!lines || progress.seen.includes(key)) return;
    progress = { ...progress, seen: [...progress.seen, key] };
    void save();
    dialogue = { key, lines, index: 0 };
    publish(true);
  }
  function advance() {
    if (!dialogue) return;
    audio.play('click');
    dialogue.index++;
    if (dialogue.index >= dialogue.lines.length) { dialogue = null; audio.stopVoice(); }
    publish(true);
  }
  function award(event: GameEvent) {
    const fresh = unlocks(event, progress.achievements);
    if (!fresh.length) return;
    audio.play('achievement');
    progress = { ...progress, achievements: [...progress.achievements, ...fresh] };
    void save();
    toast = { id: fresh[0], at: time };
    publish(true);
  }

  function teleport(x: number, z: number) {
    body = createBody(x, z, activeGround);
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
    for (const id of view.specimens.keys()) view.setScanned(id, progress.atlas.includes(id));
    for (const id of view.beacons.keys()) view.setBeacon(id, progress.beacons.includes(id));
  }

  function start(design: SuitDesign) {
    if (assessSuit(design).problems.length) return;
    sortie = startSortie(design);
    view.astronaut.setLoadout(design);
    sortie.session.collected = [...progress.echoes];
    progress = { ...progress, design };
    void save();
    enterWorld('surface');
    teleport(level.spawn.x, level.spawn.z);
    input.look.yaw = 0; input.look.pitch = 0.32;
    zone = null; lostFor = 0; fade = 1; recalling = false; ending = 0; endReason = null; returning = false; lowWarned = false;
    setStorm(false);
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
    if (report.outcome === 'complete' && nextStop) unlocked.add(nextStop.id);
    setStorm(false);
    phase = 'report';
    hud.setState({ report });
    if (document.pointerLockElement) document.exitPointerLock();
    play(report.outcome === 'complete' ? 'complete' : 'recalled');
    publish(true);
  }

  /** Moves the player, LUMA and the contact shadow into the scene that is about to render. */
  function enterWorld(where: 'surface' | 'ship') {
    const target = where === 'ship' ? interior.scene : view.scene;
    target.add(view.player, view.luma, view.shadow);
    activeGround = where === 'ship' ? interior.ground : ground;
  }

  /** Enters the lander. A guided first visit lights the stations in order; later visits are free. */
  function enterShip(guided: boolean) {
    phase = 'ship'; paused = false; dialogue = null; fade = 1;
    enterWorld('ship');
    teleport(interior.spawn.x, interior.spawn.z);
    camPos.set(1.6, 2.45, 2.2);
    input.look.yaw = 0; input.look.pitch = 0.42;
    ship = { draft: progress.design, done: new Set(guided ? [] : slotStations), guided, open: null, near: null, exiting: 0 };
    view.astronaut.setLoadout(ship.draft);
    interior.highlight(nextStation(), ship.done);
    hud.setState({ report: null });
    tell(guided ? say('Prepara el traje: empieza por el soporte de baterías (anillo iluminado).', 'Prepare the suit: start at the battery rack (lit ring).')
      : say('Ajusta lo que quieras, ponte el casco en la taquilla y sal por la esclusa.', 'Adjust anything, take your helmet from the locker and leave through the airlock.'), 'system');
    publish(true);
  }
  const nextStation = (): StationId | null => (ship.guided ? tour.find(s => !ship.done.has(s)) ?? null : ship.done.has('locker') ? 'airlock' : null);
  const toDesign = () => enterShip(false);

  function useStation(id: StationId) {
    if (ship.guided && id !== nextStation() && !ship.done.has(id)) {
      audio.play('blocked');
      tell(say('Primero el puesto iluminado.', 'The lit station first.'), 'system');
      return;
    }
    if (id === 'locker') { ship.done.add('locker'); audio.play('ui-confirm'); tell(say('Casco puesto. La esclusa está lista.', 'Helmet on. The airlock is ready.'), 'system'); }
    else if (id === 'airlock') {
      const problems = assessSuit(ship.draft).problems;
      if (problems.length) { audio.play('blocked'); tell(problems[0], 'warn'); return; }
      if (!ship.done.has('locker')) { audio.play('blocked'); tell(say('Falta el casco: está en la taquilla.', 'Helmet missing: it is in the locker.'), 'warn'); return; }
      audio.play('ui-confirm');
      ship.exiting = 0.9;
    } else { ship.open = id; audio.play('ui-open'); }
    interior.highlight(nextStation(), ship.done);
    publish(true);
  }

  function updateShip(dt: number) {
    // Directions follow the fixed room camera (looking toward -z), so W always walks toward the airlock.
    const fx = 0, fz = -1, rx = 1, rz = 0;
    const frozen = ship.open !== null || ship.exiting > 0;
    const ax = frozen ? 0 : (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
    const ay = frozen ? 0 : (input.isHeld('up') ? 1 : 0) - (input.isHeld('down') ? 1 : 0);
    Object.assign(prev, { x: body.x, y: body.y, z: body.z });
    stepBody(body, { x: fx * ay + rx * ax, z: fz * ay + rz * ax, jump: false, jumpHeld: false, dash: false }, interior.ground, { ...tuning, runSpeed: 3, groundAccel: 24 }, dt);
    const near = interior.stations.find(st => Math.hypot(body.x - st.x, body.z - st.z) < st.radius + 0.15)?.id ?? null;
    if (near !== ship.near) { ship.near = near; publish(true); }
    if (!frozen && near && input.wasPressed('interact')) useStation(near);
    else if (ship.open && input.wasPressed('pause')) { ship.open = null; audio.play('ui-close'); publish(true); }
    if (ship.exiting > 0) {
      ship.exiting -= dt;
      fade = Math.min(1, fade + dt * 1.6);
      if (ship.exiting <= 0) start(ship.draft);
    } else fade = Math.max(0, fade - dt * 1.5);
    idleFor = Math.hypot(body.vx, body.vz) > 0.3 ? 0 : idleFor + dt;
  }

  commands.start = start;
  commands.preview = d => view.astronaut.setLoadout(d);
  commands.retry = () => start(sortie.design);
  commands.redesign = toDesign;
  commands.continueGame = toDesign;
  commands.newGame = () => enterShip(true);
  commands.pick = (draft: SuitDesign) => { ship.draft = draft; view.astronaut.setLoadout(draft); publish(true); };
  commands.confirmStation = () => {
    if (!ship.open) return;
    // The key that confirmed must not reopen the station on the next step.
    input.endStep();
    ship.done.add(ship.open); ship.open = null; audio.play('ui-confirm');
    interior.highlight(nextStation(), ship.done);
    const next = nextStation();
    if (ship.guided && next) tell(stationHints[next], 'system');
    publish(true);
  };
  commands.closeStation = () => { input.endStep(); ship.open = null; audio.play('ui-close'); publish(true); };
  commands.toMenu = () => { phase = 'menu'; paused = false; dialogue = null; hud.setState({ report: null }); if (document.pointerLockElement) document.exitPointerLock(); publish(true); };
  commands.resume = () => { paused = false; publish(true); };
  commands.abandon = toDesign;
  commands.advance = advance;
  commands.travel = travel;

  /** Atlas scan: optional, costs one unit above the reserve and is saved at once, even if the sortie ends in a recall. */
  function scanSpecimen(rock: Specimen) {
    const check = canScan(sortie.design, spendable(sortie));
    if (!check.ok) {
      audio.play('blocked');
      tell(check.error === 'instrument'
        ? say('Sin cámara espectral no puedo catalogar esta roca.', 'Without the spectral camera this rock cannot be catalogued.')
        : say(`Escanear cuesta ${scanCost} u. y no puedes tocar la reserva de retorno.`, `A scan costs ${scanCost} u and the return reserve is off limits.`), 'warn');
      return;
    }
    spend(sortie, 'actions', scanCost);
    audio.play('scan');
    progress = { ...progress, atlas: [...progress.atlas, rock.id] };
    void save();
    view.setScanned(rock.id, true);
    const total = level.specimens?.length ?? 0;
    award({ kind: 'atlas', found: progress.atlas.length, total });
    const basis = rock.basis === 'observation' ? say('observación', 'observation') : say('simplificación', 'simplification');
    tell({ es: `Atlas ${progress.atlas.length}/${total} · ${rock.title.es}. ${rock.fact.es} [${basis.es} · ${rock.source.name}]`,
      en: `Atlas ${progress.atlas.length}/${total} · ${rock.title.en}. ${rock.fact.en} [${basis.en} · ${rock.source.name}]` }, 'system');
    publish(true);
  }

  /** Ruin: opening the entrance costs energy; the journal page is read at once and kept in the save. */
  function openRuin(ruin: Ruin) {
    if (spendable(sortie) < ruin.cost) {
      audio.play('blocked');
      tell(say(`Abrir la entrada cuesta ${ruin.cost} u. y no puedes tocar la reserva de retorno.`, `Opening the entrance costs ${ruin.cost} u and the return reserve is off limits.`), 'warn');
      return;
    }
    spend(sortie, 'actions', ruin.cost);
    audio.play('objective');
    progress = { ...progress, ruins: [...progress.ruins, ruin.id] };
    void save();
    award({ kind: 'page', found: progress.ruins.length, total: level.ruins!.length });
    if (ruin.card) {
      const basis = ruin.card.basis === 'observation' ? say('observación', 'observation') : say('simplificación', 'simplification');
      tell({ es: `${ruin.card.fact.es} [${basis.es} · ${ruin.card.source.name}]`, en: `${ruin.card.fact.en} [${basis.en} · ${ruin.card.source.name}]` }, 'system');
    } else tell(say(`${ruin.page.title.es} encontrada.`, `${ruin.page.title.en} found.`), 'system');
    dialogue = { key: 'page:' + ruin.id, lines: [{ speaker: 'AURORA', text: ruin.page.text }], index: 0 };
    publish(true);
  }

  /** Side mission S2: repairing a post is saved at once and never touches the return reserve. */
  function repairBeacon(id: string) {
    const cost = beaconCost(sortie.design);
    if (spendable(sortie) < cost) {
      audio.play('blocked');
      tell(say(`Reparar la baliza cuesta ${cost} u. y no puedes tocar la reserva de retorno.`, `Repairing the beacon costs ${cost} u and the return reserve is off limits.`), 'warn');
      return;
    }
    spend(sortie, 'actions', cost);
    audio.play('objective');
    progress = { ...progress, beacons: [...progress.beacons, id] };
    void save();
    view.setBeacon(id, true);
    const total = level.beacons!.posts.length, lit = progress.beacons.length;
    award({ kind: 'beacon', lit, total });
    tell(lit >= total ? level.beacons!.reward : say(`Baliza ${lit}/${total} encendida.`, `Beacon ${lit}/${total} lit.`), 'system');
    publish(true);
  }

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
    if (events.dashed) { spend(sortie, 'dash', dashCost); award({ kind: 'dash' }); view.dust.burst(body.x, body.y, body.z, 10, 1.2); audio.play('dash'); }
    if (events.landed) { view.dust.burst(body.x, body.y, body.z, 14, 1.8); audio.play('land'); }
    if (events.airJumped) { spend(sortie, 'thruster', sortie.stats.airJumpCost); award({ kind: 'air-jump' }); audio.play('thrust'); }
    if (events.jumped) audio.play('jump');
    if (body.grounded) {
      stepDistance += Math.hypot(body.vx, body.vz) * dt;
      if (stepDistance > 1.15) {
        stepDistance = 0; audio.play('step');
        if (biome.footprints) view.footprints.place(body.x, groundAt(ground, body.x, body.z, body.y + 0.1), body.z, body.facing);
      }
    }

    if (!frozen && input.wasPressed('interact')) {
      const result = sortieInteract(level, sortie, body.x, body.z);
      if (result.ok) {
        audio.play(result.point.action === 'scan' ? 'scan' : 'objective');
        resetPointsView();
        tell(result.point.result);
        if (sortie.outcome === 'complete') ending = 1.2;
        // Contingency: a point can set off a hazard (the relay repair on Mars brings a dust front over the dunes).
        const surge = level.zones.find(z => z.surge?.after === result.point.id)?.surge;
        if (surge) { setStorm(true); tell(surge.warning, 'warn'); play('storm'); }
        if (result.point.id === level.companionAfter) lumaPos.set(result.point.position.x, body.y + 1.2, result.point.position.z);
        play('point:' + result.point.id);
      } else if (result.error === 'none') {
        // No mission point in reach: maybe an atlas rock. Nothing at all needs no feedback.
        const ruin = ruinInReach(level, progress.ruins, body.x, body.z);
        const rock = ruin ? null : specimenInReach(level, progress.atlas, body.x, body.z);
        if (ruin) openRuin(ruin);
        else if (rock) scanSpecimen(rock);
        else { const post = beaconInReach(level, progress.beacons, body.x, body.z); if (post) repairBeacon(post.id); }
      } else if (result.error === 'requirements') {
        audio.play('blocked');
        tell(say('Todavía no. Faltan pasos antes de esto: revisa la lista de objetivos.', 'Not yet. Other steps come first: check the objective list.'), 'warn');
      } else if (result.error === 'instrument' && result.point) {
        audio.play('blocked');
        const needs = instruments[instrumentFor[result.point.action]!].name;
        tell(say(`El traje no lleva ${needs.es.toLowerCase()}. Anotado para el informe.`, `The suit has no ${needs.en.toLowerCase()}. Noted for the report.`), 'warn');
      } else if (result.error === 'power') {
        audio.play('blocked');
        tell(say(`Cuesta ${result.cost} u. y no puedes tocar la reserva de retorno.`, `It costs ${result.cost} u and the return reserve is off limits.`), 'warn');
      }
    }

    const picked = collect(level, sortie.session, body.x, body.y, body.z, (x, z) => heightAt(hf, x, z));
    for (const id of picked) {
      view.echoes.get(id)!.visible = false;
      audio.play('echo');
      progress = { ...progress, echoes: [...progress.echoes, id] };
      void save();
      award({ kind: 'echo', found: progress.echoes.length, total: level.collectibles.length });
      tell(say(`Eco de Aurora ${progress.echoes.length}/${level.collectibles.length}.`, `Aurora echo ${progress.echoes.length}/${level.collectibles.length}.`), 'system');
    }

    const nowZone = zoneAt(level, body.x, body.z);
    if (nowZone && nowZone !== zone) {
      const z = level.zones.find(q => q.id === nowZone)!;
      hud.setState({ zone: z.title, zoneAt: time });
      const dusty = z.hazard === 'dust';
      if (zoneDrain(z, sortie.session.completed)) tell(dusty
        ? (storm ? say('Tormenta de polvo: cada segundo aquí gasta mucha batería.', 'Dust storm: every second here costs a lot of battery.')
          : say('Dunas: el polvo y el viento gastan batería.', 'Dunes: dust and wind drain the battery.'))
        : z.hazard === 'sun' ? say('Sol directo: la refrigeración del traje gasta batería.', 'Direct sunlight: suit cooling drains the battery.')
        : say('Sombra permanente: el frío gasta batería más rápido.', 'Permanent shadow: the cold drains the battery faster.'), 'warn');
      award({ kind: 'zone', cold: !!z.drain && (z.hazard ?? 'cold') === 'cold', dust: dusty });
      pendingZoneLine = z.id;
    }
    zone = nowZone;
    if (pendingZoneLine) {
      const z = level.zones.find(q => q.id === pendingZoneLine)!;
      if (zone !== z.id) pendingZoneLine = null;
      else if (Math.hypot(body.x - z.center.x, body.z - z.center.z) < z.radius * 0.45) { play('zone:' + z.id); pendingZoneLine = null; }
    }

    const moving = Math.hypot(body.vx, body.vz) > 0.5;
    if (!frozen) {
      const atReserve = drain(sortie, level, dt, moving, zone);
      if (!lowWarned && spendable(sortie) < 15) { lowWarned = true; tell(say('Batería baja: queda poco sobre la reserva de retorno.', 'Battery low: little left above the return reserve.'), 'warn'); }
      // At the reserve the sortie is not over: walk home on what is left. Reaching the lander is a safe recall;
      // running dry on the way is an emergency rescue.
      if (atReserve && !returning) {
        returning = true;
        audio.play('recall');
        tell(say('Reserva de retorno: vuelve al módulo (⌂). Solo puedes caminar.', 'Return reserve: walk back to the lander (⌂). Walking only.'), 'warn');
      }
      if (returning && !endReason && Math.hypot(body.x - level.spawn.x, body.z - level.spawn.z) < 9) endReason = 'reserve';
      if (returning && !endReason && sortie.energy <= 0) {
        sortie.emergency = true; endReason = 'reserve';
        tell(guide(say('Sin energía. LUMA te arrastra al módulo.', 'Out of power. LUMA drags you to the lander.'),
          say('Sin energía. El cable de seguridad te recoge hasta el acople.', 'Out of power. The safety tether reels you back to the dock.')), 'warn');
      }
    }

    // Off the edge of a station deck: the safety tether stops the fall and reels the player back.
    if (level.fallLimit !== undefined && body.y < level.fallLimit && !recalling && !endReason) {
      recalling = true; audio.play('recall');
      tell(say('Fuera de la cubierta. El cable de seguridad te recoge.', 'Off the deck. The safety tether reels you in.'), 'warn');
    }

    // Radio link: losing it for a moment is a warning; losing it for longer triggers LUMA's recall.
    const signal = signalAt(level, body.x, body.z, sortie.stats.commsRadius);
    lostFor = signal <= 0 ? lostFor + dt : 0;
    if (signal < 0.5 && signal > 0 && notice?.tone !== 'warn') tell(say('La señal cae. Vuelve hacia el cráter.', 'Signal fading. Head back into the crater.'), 'warn');
    if (lostFor > 1.5 && !recalling) {
      recalling = true; audio.play('recall');
      tell(guide(say('Sin enlace. LUMA te guía de vuelta al módulo.', 'Link lost. LUMA guides you back to the lander.'),
        say('Sin enlace. Control te guía de vuelta al acople.', 'Link lost. Control guides you back to the dock.')), 'warn');
    }
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

  const stationHints: Record<StationId, Notice['text']> = {
    battery: say('Soporte de baterías.', 'Battery rack.'),
    thruster: say('Ahora el propulsor: decide si podrás hacer doble salto.', 'Now the thruster: decide whether you can double jump.'),
    antenna: say('La antena define hasta dónde llega tu enlace.', 'The antenna sets how far your link reaches.'),
    instruments: say('Banco de instrumentos: cada objetivo necesita el suyo.', 'Instrument bench: each objective needs its own.'),
    locker: say('Traje listo. Ponte el casco en la taquilla.', 'Suit ready. Take your helmet from the locker.'),
    airlock: say('Sal por la esclusa cuando quieras.', 'Leave through the airlock when ready.'),
  };

  function currentMood(): Mood {
    if (phase === 'menu' || phase === 'ship') return 'menu';
    if (phase === 'report') return sortie.outcome === 'complete' ? 'complete' : 'recalled';
    return zoneDrain(level.zones.find(q => q.id === zone), sortie.session.completed) ? 'cold' : 'surface';
  }

  function update(dt: number) {
    time += dt;
    audio.mood(currentMood());
    audio.tick(phase === 'eva' && !paused ? signalAt(level, body.x, body.z, sortie.stats.commsRadius) : 1,
      phase === 'eva' && !paused && spendable(sortie) < 15);
    const line = dialogue ? dialogue.lines[dialogue.index] : null;
    if (line && line !== lastLine && dialogue) {
      audio.play(line.speaker === 'LUMA' ? 'luma' : 'control');
      // LUMA speaks through the translator: a recorded line per language, if one exists for this line.
      const voiceUrl = lumaVoices[`../assets/voice/luma/${prefs.getState().lang}/${level.id}/${dialogue.key.replace(/:/g, '_')}-${dialogue.index}.m4a`];
      if (line.speaker === 'LUMA' && voiceUrl) audio.voice(voiceUrl);
      else audio.stopVoice();
    }
    lastLine = line;
    // Losing pointer lock in the middle of a sortie (Esc, alt-tab) pauses it.
    const locked = input.locked;
    const lostLock = wasLocked && !locked;
    if (lostLock && phase === 'eva' && !dialogue) { paused = true; publish(true); }
    wasLocked = locked;
    if (dialogue && (input.wasPressed('interact') || input.wasPressed('jump'))) advance();
    else if (phase === 'eva' && input.wasPressed('pause') && !lostLock) { paused = !paused; publish(true); }
    if (phase === 'eva' && !paused && !dialogue) updateEva(dt);
    else if (phase === 'ship' && !dialogue) updateShip(dt);
    else {
      Object.assign(prev, { x: body.x, y: body.y, z: body.z });
      if (phase !== 'eva') fade = Math.max(0, fade - dt * 1.5);
    }
    input.endStep();
  }

  let sincePublish = 0;
  function publish(now = false) {
    if (!now && sincePublish < 100) return;
    sincePublish = 0;
    const reach = phase === 'eva' ? pointInReach(level, sortie.session, body.x, body.z) : null;
    const needs = reach ? instrumentFor[reach.action] : undefined;
    const ruin = phase === 'eva' && !reach ? ruinInReach(level, progress.ruins, body.x, body.z) : null;
    const rock = phase === 'eva' && !reach && !ruin ? specimenInReach(level, progress.atlas, body.x, body.z) : null;
    const post = phase === 'eva' && !reach && !rock ? beaconInReach(level, progress.beacons, body.x, body.z) : null;
    const info = viewport.renderer.info.render;
    const here = level.zones.find(q => q.id === zone);
    const cold = zoneDrain(here, sortie.session.completed) > 0;
    // Compass: the next objective that can be done now, or the lander when heading home.
    const goal = level.points.find(p => p.required && !sortie.session.completed.includes(p.id) && missingFor(level, sortie.session, p).length === 0);
    const marks: { id: string; label: Notice['text'] | null; bearing: number; dist: number; kind: 'goal' | 'home' }[] = [];
    if (phase === 'eva' && goal && !returning) marks.push({ id: goal.id, label: goal.title, bearing: Math.atan2(goal.position.x - body.x, goal.position.z - body.z), dist: Math.hypot(goal.position.x - body.x, goal.position.z - body.z), kind: 'goal' });
    if (phase === 'eva') marks.push({ id: 'lander', label: null, bearing: Math.atan2(level.spawn.x - body.x, level.spawn.z - body.z), dist: Math.hypot(level.spawn.x - body.x, level.spawn.z - body.z), kind: 'home' });
    hud.setState({
      compass: { heading: input.look.yaw + Math.PI, marks },
      ready: true, phase, tier, frameMs: viewport.governor.average, renderScale: viewport.governor.scale,
      drawCalls: info.calls, triangles: info.triangles,
      levelTitle: level.title, briefing: level.briefing,
      objectives: level.points.map(p => ({ id: p.id, title: p.title, required: p.required, done: sortie.session.completed.includes(p.id), action: p.action, power: p.power })),
      echoes: { found: progress.echoes.length, total: level.collectibles.length },
      prompt: reach ? { verb: verbs[reach.action], title: reach.title, cost: actionCost(reach.power, reach.action, sortie.design),
        blocked: missingFor(level, sortie.session, reach).map(id => level.points.find(p => p.id === id)!.title),
        missing: needs && !sortie.design.instruments.includes(needs) ? instruments[needs].name : null }
        : ruin ? { verb: say('Abrir', 'Open'), title: ruin.title, cost: ruin.cost, blocked: [], missing: null }
        : rock ? { verb: say('Catalogar', 'Catalogue'), title: rock.title, cost: scanCost, blocked: [],
          missing: sortie.design.instruments.includes('camera') ? null : instruments.camera.name }
        : post ? { verb: say('Reparar', 'Repair'), title: level.beacons!.title, cost: beaconCost(sortie.design), blocked: [], missing: null } : null,
      collection: {
        atlas: (level.specimens ?? []).map(sp => { const got = progress.atlas.includes(sp.id); return { id: sp.id, title: got ? sp.title : say('Roca sin catalogar', 'Uncatalogued rock'), fact: got ? sp.fact : null, basis: sp.basis, source: got ? sp.source : null }; }),
        pages: (level.ruins ?? []).map(r => ({ id: r.id, title: r.page.title, text: progress.ruins.includes(r.id) ? r.page.text : null })),
      },
      pages: { found: progress.ruins.length, total: level.ruins?.length ?? 0 },
      beacons: { lit: progress.beacons.length, total: level.beacons?.posts.length ?? 0 },
      atlas: { found: progress.atlas.length, total: level.specimens?.length ?? 0 },
      notice, signal: signalAt(level, body.x, body.z, sortie.stats.commsRadius), fade, locked: input.locked,
      player: { x: body.x, y: body.y, z: body.z, speed: Math.hypot(body.vx, body.vz), grounded: body.grounded },
      realGravity: level.realGravity, elapsed: sortie.time, now: time,
      design: progress.design, energy: sortie.energy, capacity: sortie.stats.capacity,
      draining: cold && phase === 'eva' ? (here?.hazard === 'dust' ? say('polvo', 'dust') : here?.hazard === 'sun' ? say('sol', 'sun') : say('frío', 'cold')) : null,
      levelId, facts, outcome: level.outcome,
      destinations: route.map(r => ({ id: r.id, name: r.name, current: r.id === levelId, unlocked: unlocked.has(r.id) })),
      next: nextStop && unlocked.has(nextStop.id) && completedHere() ? { id: nextStop.id, name: nextStop.name } : null,
      attempts: progress.attempts, saveError,
      paused, dialogue: dialogue ? dialogue.lines[dialogue.index] : null, toast, achievements: progress.achievements,
      hasProgress: progress.attempts.length > 0,
      ship: phase === 'ship' ? { draft: ship.draft, done: [...ship.done], next: nextStation(), open: ship.open, near: ship.near, guided: ship.guided } : null,
    });
  }

  function render(alpha: number, frameMs: number) {
    viewport.tick(frameMs);
    const px = prev.x + (body.x - prev.x) * alpha, py = prev.y + (body.y - prev.y) * alpha, pz = prev.z + (body.z - prev.z) * alpha;
    view.player.position.set(px, py, pz);
    view.player.rotation.y = angleLerp(view.player.rotation.y, body.facing + Math.PI, Math.min(1, frameMs / 60));
    const frameDt = Math.min(0.1, frameMs / 1000);
    view.astronaut.setBattery(sortie.energy / sortie.stats.capacity, phase === 'eva' && spendable(sortie) <= 0.5);
    view.astronaut.animate((phase === 'eva' && !paused && !dialogue) || phase === 'ship' ? frameDt : 0, Math.hypot(body.vx, body.vz), body.grounded, body.vy);
    view.lumaModel.animate(time, idleFor > 2);
    view.luma.visible = lumaHere();
    view.dust.update(frameDt);
    view.ambience.update(frameDt, camera.position, time);

    const floor = groundAt(activeGround, px, pz, py + 0.05);
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
    } else if (phase === 'ship') {
      // Fixed diagonal camera from a high corner, like a small house in a top-down adventure: the whole room
      // stays readable and nothing large ever sits between the camera and the player.
      target.set(Math.max(-2.7, Math.min(2.7, px * 0.55 + 1.6)), 2.45, Math.max(-2.2, Math.min(2.25, pz * 0.55 + 2.2)));
      camPos.lerp(target, Math.min(1, frameMs / 1000 * 6));
      camera.position.copy(camPos);
      camera.lookAt(px * 0.8, 0.7, pz * 0.8 - 0.3);
    } else {
      const { yaw, pitch } = input.look;
      // Pull the camera in when terrain would sit between it and the player (slopes, crater walls), instead of
      // lifting it until it stares at the ground.
      let dist = phase === 'eva' ? input.zoom : 4.6;
      for (; dist > 2.4; dist -= 0.4) {
        let clear = true;
        for (const f of [0.35, 0.7, 1]) {
          const cx = px + Math.sin(yaw) * Math.cos(pitch) * dist * f, cz = pz + Math.cos(yaw) * Math.cos(pitch) * dist * f;
          const cy = py + 1.5 + Math.sin(pitch) * dist * f;
          if (heightAt(hf, cx, cz) + 0.5 > cy) { clear = false; break; }
        }
        if (clear) break;
      }
      camDist += (dist - camDist) * Math.min(1, frameMs / 1000 * (dist < camDist ? 14 : 4));
      camPos.set(px + Math.sin(yaw) * Math.cos(pitch) * camDist, py + 1.5 + Math.sin(pitch) * camDist, pz + Math.cos(yaw) * Math.cos(pitch) * camDist);
      camPos.y = Math.max(camPos.y, heightAt(hf, camPos.x, camPos.z) + 0.6);
      camera.position.copy(camPos);
      camera.lookAt(px, py + (phase === 'eva' ? 1.4 : 1.1), pz);
    }

    view.tickSky(prefs.getState().reduceMotion ? 0 : time);
    view.beacon.visible = Math.sin(time * 3) > -0.2;
    for (const lamp of view.blinkers) lamp.visible = Math.sin(time * 2.4 - lamp.position.x * 0.2) > -0.5;
    for (const [id, m] of view.echoes) if (m.visible) m.rotation.y = time * 1.5 + id.length;

    viewport.renderer.render(phase === 'ship' ? interior.scene : view.scene, camera);
    sincePublish += frameMs;
    publish();
  }

  const loop = new Loop({ update, render });
  const hideDebug = exposeDebug({
    state: () => ({ steps: loop.steps, paused: loop.paused, gamePaused: paused, dialogue: !!dialogue, tier, phase, x: body.x, y: body.y, z: body.z, grounded: body.grounded,
      zone, storm, level: levelId, unlocked: [...unlocked], ledger: { ...sortie.ledger }, luma: lumaHere(),
      completed: [...sortie.session.completed], collected: [...progress.echoes], recalls: sortie.session.recalls,
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
    ship: (guided: boolean) => enterShip(guided),
    station: (id: StationId) => { const st = interior.stations.find(q => q.id === id)!; teleport(st.x, st.z); useStation(id); },
    advance: () => advance(),
    audio: () => ({ state: audio.ctx?.state ?? 'locked', mood: currentMood() }),
    setEnergy: (value: number) => { if (value < sortie.energy) spend(sortie, 'move', sortie.energy - value); else sortie.energy = value; },
    level: () => ({ points: level.points.map(p => ({ id: p.id, ...p.position, required: p.required })),
      collectibles: level.collectibles.map(c => ({ id: c.id, ...c.position, y: c.y })), spawn: level.spawn, comms: level.comms }),
  });
  resetPointsView();
  view.astronaut.setLoadout(progress.design);
  publish(true);
  loop.start();

  return {
    dispose() {
      loop.stop();
      hideDebug();
      input.dispose();
      unsubscribePrefs();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('visibilitychange', onVisibility);
      audio.mood('silent');
      view.dispose();
      interior.dispose();
      viewport.dispose();
      for (const name of Object.keys(commands) as (keyof typeof commands)[]) commands[name] = () => {};
      hud.setState({ ready: false, phase: 'loading', report: null });
    },
  };
}
