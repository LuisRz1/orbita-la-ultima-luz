import { MathUtils, PerspectiveCamera, Vector3, type BufferAttribute, type MeshBasicMaterial } from 'three';
import type { LevelModule } from '../levels/registry.ts';
import { bulkheadColliders } from '../core/contract/level-v2.ts';
import { buildHeightfield, heightAt, slopeAt } from '../core/heightfield.ts';
import { createBody, groundAt, stepBody, type Body, type Ground } from '../core/movement.ts';
import { emptyProgress, readProgress, writeProgress, type Progress } from '../core/save/progress3d.ts';
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
import { playLumaLine, stopLumaLine } from './voice.ts';

export type Game = { dispose(): void };
export type GameOptions={module:LevelModule;chapter:number;site:string;autostart:boolean;luma?:boolean;
  saveId?:string;entryDesign?:SuitDesign};

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

/** Mounts a sortie with the shared engine. An abandoned load must not publish commands for a later scene. */
export async function createGame(host: HTMLElement,options?:GameOptions,signal?:AbortSignal): Promise<Game> {
  const { levels, requestedLevel } = await import('../levels/registry.ts');
  const { level, dialogue: linesByKey } = options?.module??await levels[requestedLevel(window.location.search)]();
  const saveId=options?.saveId??(options?level.mission:level.id);
  let progress: Progress = emptyProgress(saveId, proposals[0].design);
  let saveError = false;
  try {
    const saved = await readProgress(saveId);
    if (saved && saved !== 'invalid') progress = saved;
  } catch { saveError = true; }
  signal?.throwIfAborted();
  const tier = startingTier();
  const viewport = createViewport(host, tier);
  const hf = buildHeightfield(level.terrain.size, level.terrain.res, level.terrain.height);
  const bay = level.pressurizedBay;
  const bulkheads = bay ? bulkheadColliders(bay) : [];
  const ground: Ground = { height: (x, z) => heightAt(hf, x, z), slope: (x, z) => slopeAt(hf, x, z), solids: [] };
  const view = buildWorldView(level, hf, tiers[tier].scatter, tier === 'low' ? 3 : 4,options?.chapter??2);
  const interior = buildInterior();
  let activeGround: Ground = ground;
  const camera = new PerspectiveCamera(62, 1, 0.1, 700);
  viewport.onResize((w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); });
  const input = new Input(viewport.renderer.domElement);
  const applyPrefs = () => {
    input.sensitivity = 0.0025 * prefs.getState().sensitivity;
  };
  // Browsers start audio only after a gesture: the first click or key press unlocks it.
  const unlockAudio = () => audio.unlock();
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  const onVisibility = () => audio.suspend(document.hidden);
  document.addEventListener('visibilitychange', onVisibility);
  let stepDistance = 0, lastLine: unknown = null, lastLang='',pendingZoneLine: string | null = null;
  applyPrefs();
  const unsubscribePrefs = prefs.subscribe(applyPrefs);

  let disposed=false;
  const save = () => writeProgress(progress).then(() => { saveError = false; }).catch(() => { saveError = true; }).finally(() => publish(true));

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
  let endReason: 'reserve' | null = null, returning = false, lowWarned = false, releasing=0;
  let notice: Notice | null = null;
  const lumaPos = new Vector3(body.x + 1, body.y + 1.6, body.z + 1);
  const camPos = new Vector3(), target = new Vector3();
  let camDist = 6.4;
  const site=options?.site;
  const berth=level.companionBerth;
  let actorHeading=body.facing+Math.PI,hatchOpenedAt=0;
  const done=(id:string)=>sortie.session.completed.includes(id);
  const companionOn=()=>options?.luma!==false&&site!=='ground'&&site!=='eva'&&site!=='earth'&&
    (!berth||done('protected-bay'));
  const canTalk=()=>phase==='eva'&&!paused&&!dialogue&&!recalling&&!returning&&!ending&&companionOn()&&
    (!berth||done('translator'))&&!!linesByKey.chat;
  const radius=()=>options?Math.min(level.comms.radius,sortie.stats.commsRadius+(level.comms.radius>100?10:0)):sortie.stats.commsRadius;
  const link=()=>signalAt(level,body.x,body.z,radius());
  const anchorAt=(x:number,z:number)=>level.tether?.anchors.reduce((nearest,p)=>
    Math.hypot(p.x-x,p.z-z)<Math.hypot(nearest.x-x,nearest.z-z)?p:nearest);

  const untag = (v: string) => v.replace(/^LUMA:\s*/, '');
  const tell = (text: Notice['text'], tone: Notice['tone'] = 'luma') => {
    notice = { text: tone === 'luma' ? { es: untag(text.es), en: untag(text.en) } : text, at: time, tone };
    publish(true);
  };

  /** Plays a story sequence once per save. */
  function play(key: string,repeat=false) {
    const lines = linesByKey[key];
    if(!lines?.length||!repeat&&progress.seen.includes(key))return;
    if(!repeat){
      progress={...progress,seen:[...progress.seen,key]};
      void save();
    }
    dialogue = { key, lines, index: 0 };
    publish(true);
  }
  function advance() {
    if (!dialogue) return;
    audio.play('click');
    dialogue.index++;
    stopLumaLine();
    if (dialogue.index >= dialogue.lines.length) dialogue = null;
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
    actorHeading=body.facing+Math.PI;
    view.player.rotation.y=actorHeading;
    view.astronaut.resetMotion();
    Object.assign(prev, { x: body.x, y: body.y, z: body.z });
    if(berth&&phase!=='ship'&&!done('translator')){
      const where=done('rest')?berth.rest:berth.hatch;
      lumaPos.set(where.x,done('rest')?.51:.62,where.z);
    }else lumaPos.set(x + 1, body.y + 1.6, z + 1);
  }

  function resetPointsView() {
    for (const p of level.points) {
      const v = view.points.get(p.id)!;
      const done = sortie.session.completed.includes(p.id);
      (v.beam.material as MeshBasicMaterial).color.set(done ? palette.warn : palette.accent);
      (v.ring.material as MeshBasicMaterial).color.set(done ? palette.warn : palette.accent);
      v.beam.scale.y = done ? 0.15 : 1;
      const open=missingFor(level,sortie.session,p).length===0||done;
      v.beam.visible=options?open:true;
      v.ring.visible=options?open:true;
    }
    for (const [id, m] of view.echoes) m.visible = !progress.echoes.includes(id);
    const hardwareSolids=level.props.filter(p=>{
      const visible=p.kind==='gate'?sortie.session.completed.includes('disconnect')&&
        (releasing>0||!sortie.session.completed.includes('life-line')):!p.hideAfter||!sortie.session.completed.includes(p.hideAfter);
      view.hardware.get(p)!.visible=visible;
      return visible;
    }).map(p=>p.solid);
    ground.solids=[...bulkheads,...hardwareSolids];
    view.luma.visible=companionOn();
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
    zone = null; lostFor = 0; fade = 1; recalling = false; ending = 0; endReason = null; returning = false; lowWarned = false; releasing=0;
    resetPointsView();
    phase = 'eva'; paused = false;
    tell(level.arrival,level.id==='orbit'?'system':companionOn()?'luma':'system');
    award({ kind: 'sortie', designs: [...progress.attempts.map(a => a.design), design] });
    play('intro');
  }

  function finish() {
    const report = buildReport(level, sortie,companionOn());
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
    view.astronaut.act('service');
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
  commands.newGame = () => enterShip(!options);
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
  commands.talk=()=>{if(canTalk())play('chat',true);};

  function updateEva(dt: number) {
    const params = suitMovement(level.tether?{...tuning,runSpeed:site==='bennu'?5.5:4.5}:tuning, sortie.stats);
    const k = input.look.yaw, fx = -Math.sin(k), fz = -Math.cos(k), rx = Math.cos(k), rz = -Math.sin(k);
    const ax = (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
    const ay = (input.isHeld('up') ? 1 : 0) - (input.isHeld('down') ? 1 : 0);
    Object.assign(prev, { x: body.x, y: body.y, z: body.z });
    const frozen = recalling || ending > 0 || releasing > 0;
    let dash = !level.tether && !frozen && input.wasPressed('dash');
    if (dash && spendable(sortie) < dashCost) { dash = false; tell(say('Energía en reserva: sin dash.', 'Energy at reserve: no dash.'), 'warn'); }
    if (!body.grounded && spendable(sortie) < sortie.stats.airJumpCost) body.airJumpsLeft = 0;
    const events = stepBody(body, frozen ? { x: 0, z: 0, jump: false, jumpHeld: false, dash: false } : {
      x: fx * ay + rx * ax, z: fz * ay + rz * ax,
      jump: !level.tether&&input.wasPressed('jump'), jumpHeld: !level.tether&&input.isHeld('jump'), dash,
    }, ground, params, dt);
    const anchor=anchorAt(body.x,body.z);
    if(level.tether&&anchor&&Math.hypot(body.x-anchor.x,body.z-anchor.z)>level.tether.length){
      body.x=prev.x;body.y=prev.y;body.z=prev.z;body.vx=0;body.vz=0;
      if(notice?.tone!=='warn'||time-notice.at>3) tell(say('Línea tensa. Busca el poste iluminado más cercano.',
        'Tether taut. Find the nearest lit post.'),'warn');
    }
    if(releasing>0){
      releasing=Math.max(0,releasing-dt);
      if(!releasing){audio.play('objective');resetPointsView();}
    }
    if (events.dashed) { spend(sortie, 'dash', dashCost); award({ kind: 'dash' }); view.dust.burst(body.x, body.y, body.z, 10, 1.2); audio.play('dash'); }
    if (events.landed) { view.dust.burst(body.x, body.y, body.z, 14, 1.8); audio.play('land'); }
    if (events.airJumped) { spend(sortie, 'thruster', sortie.stats.airJumpCost); award({ kind: 'air-jump' }); audio.play('thrust'); }
    if (events.jumped) audio.play('jump');
    if (body.grounded) { stepDistance += Math.hypot(body.vx, body.vz) * dt; if (stepDistance > 1.15) { stepDistance = 0; audio.play('step'); view.footprints.place(body.x, groundAt(ground, body.x, body.z, body.y + 0.1), body.z, body.facing); } }

    const reach=pointInReach(level,sortie.session,body.x,body.z);
    if (!frozen && (input.wasPressed('interact')||reach?.action==='scan'&&input.wasPressed('scan'))) {
      const result = sortieInteract(level, sortie, body.x, body.z);
      if (result.ok) {
        audio.play(result.point.action === 'scan' ? 'scan' : 'objective');
        view.astronaut.act(result.point.action);
        const {x,z}=result.point.position;
        if(Math.hypot(x-body.x,z-body.z)>.25)body.facing=Math.atan2(x-body.x,z-body.z);
        if(berth&&result.point.id==='protected-bay'){
          hatchOpenedAt=time;
          lumaPos.set(berth.hatch.x,.62,berth.hatch.z);
          audio.play('luma');
        }
        if(site==='service'&&result.point.id==='life-line')releasing=2.6;
        resetPointsView();
        tell(result.point.result,level.id==='orbit'?'system':companionOn()?'luma':'system');
        play('point:'+result.point.id);
        if (sortie.outcome === 'complete') ending = 1.2;
      } else if (result.error === 'none') {
        // Nothing in reach: no feedback needed.
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
      if (z.drain) tell(say('El frío en sombra gasta batería más rápido.', 'Cold in shadow drains the battery faster.'), 'warn');
      award({ kind: 'zone', cold: !!z.drain });
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
      if (returning && !endReason && sortie.energy <= 0) { sortie.emergency = true; endReason = 'reserve'; tell(companionOn()?
        say('Sin energía. LUMA te arrastra al módulo.', 'Out of power. LUMA drags you to the lander.'):
        say('Sin energía. Control te devuelve a la esclusa.', 'Out of power. Control returns you to the airlock.'), 'warn'); }
    }

    // Radio link: losing it for a moment is a warning; losing it for longer triggers LUMA's recall.
    const signal = link();
    lostFor = signal <= 0 ? lostFor + dt : 0;
    if (signal < 0.5 && signal > 0 && notice?.tone !== 'warn') tell(say('El enlace cae. Vuelve hacia las balizas.', 'Link fading. Head back toward the beacons.'), 'warn');
    if (lostFor > 1.5 && !recalling) { recalling = true; audio.play('recall'); tell(say('Sin enlace. Repliegue al punto de partida.', 'Link lost. Returning to the starting point.'), 'warn'); }
    if (recalling || endReason) {
      fade = Math.min(1, fade + dt * 1.6);
      if (fade >= 1) {
        if (endReason) { finish(); return; }
        teleport(level.spawn.x, level.spawn.z); sortie.session.recalls++; recalling = false; lostFor = 0;
      }
    } else fade = Math.max(0, fade - dt * 1.2);
    if (ending > 0) { ending -= dt; if (ending <= 0) { finish(); return; } }

    idleFor = moving ? 0 : idleFor + dt;
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
    return level.zones.find(q => q.id === zone)?.drain ? 'cold' : 'surface';
  }

  function update(dt: number) {
    time += dt;
    audio.mood(currentMood());
    audio.tick(phase === 'eva' && !paused ? link() : 1,
      phase === 'eva' && !paused && spendable(sortie) < 15);
    const line = dialogue ? dialogue.lines[dialogue.index] : null;
    const lang=prefs.getState().lang;
    if(line&&(line!==lastLine||lang!==lastLang)&&dialogue){
      if(line!==lastLine)audio.play(line.speaker==='LUMA'?'luma':'control');
      // LUMA speaks through the translator: a recorded line per language, if one exists for this line.
      if (line.speaker === 'LUMA') void playLumaLine(site??level.id,dialogue.key,dialogue.index,lang);
      else stopLumaLine();
    }
    lastLine=line;lastLang=lang;
    // Losing pointer lock in the middle of a sortie (Esc, alt-tab) pauses it.
    const locked = input.locked;
    const lostLock = wasLocked && !locked;
    if (lostLock && phase === 'eva' && !dialogue) { paused = true; publish(true); }
    wasLocked = locked;
    if(document.querySelector('dialog[data-campaign-journal][open]')){input.endStep();return;}
    if(input.wasPressed('center')&&phase==='eva'){
      input.look.yaw=Math.atan2(-body.dirX,-body.dirZ);input.look.pitch=.32;input.zoom=6.4;
    }
    if(input.wasPressed('talk'))commands.talk();
    if(dialogue&&(input.wasPressed('interact')||input.wasPressed('jump'))){advance();input.endStep();}
    else if (phase === 'eva' && input.wasPressed('pause') && !lostLock) { paused = !paused; publish(true); }
    if (phase === 'eva' && !paused && !dialogue) updateEva(dt);
    else if (phase === 'ship' && !dialogue) updateShip(dt);
    else {
      Object.assign(prev, { x: body.x, y: body.y, z: body.z });
      if (phase !== 'eva') fade = Math.max(0, fade - dt * 1.5);
    }
    const heading=body.facing+Math.PI;
    const turn=Math.sin(heading-actorHeading);
    actorHeading=angleLerp(actorHeading,heading,1-Math.exp(-dt*17));
    view.player.rotation.y=actorHeading;
    const moving=phase==='ship'||phase==='eva'&&!paused&&!dialogue;
    view.astronaut.animate(paused&&phase==='eva'?0:dt,{
      speed:moving?Math.hypot(body.vx,body.vz):0,grounded:body.grounded,vertical:body.vy,turn,
      boosting:body.dash>0&&moving,tethered:!!level.tether,
    });
    input.endStep();
  }

  let sincePublish = 0;
  function publish(now = false) {
    if (disposed||!now && sincePublish < 100) return;
    sincePublish = 0;
    const reach = phase === 'eva' ? pointInReach(level, sortie.session, body.x, body.z) : null;
    const needs = reach ? instrumentFor[reach.action] : undefined;
    const info = viewport.renderer.info.render;
    const cold = level.zones.find(q => q.id === zone)?.drain;
    // Compass: the next objective that can be done now, or the lander when heading home.
    const goal = level.points.find(p => p.required && !sortie.session.completed.includes(p.id) && missingFor(level, sortie.session, p).length === 0);
    const marks: { id: string; label: Notice['text'] | null; bearing: number; dist: number; kind: 'goal' | 'home' }[] = [];
    if (phase === 'eva' && goal && !returning) marks.push({ id: goal.id, label: goal.title, bearing: Math.atan2(goal.position.x - body.x, goal.position.z - body.z), dist: Math.hypot(goal.position.x - body.x, goal.position.z - body.z), kind: 'goal' });
    if (phase === 'eva') marks.push({ id: 'lander', label: null, bearing: Math.atan2(level.spawn.x - body.x, level.spawn.z - body.z), dist: Math.hypot(level.spawn.x - body.x, level.spawn.z - body.z), kind: 'home' });
    hud.setState({
      compass: { heading: input.look.yaw + Math.PI, marks },
      ready: true, phase, tier, frameMs: viewport.governor.average, renderScale: viewport.governor.scale,
      drawCalls: info.calls, triangles: info.triangles,
      levelTitle: level.title, levelSubtitle:level.subtitle, briefing: level.briefing,
      objectives: level.points.map(p => ({ id: p.id, title: p.title, required: p.required, done: sortie.session.completed.includes(p.id), action: p.action, power: p.power })),
      echoes: { found: progress.echoes.length, total: level.collectibles.length },
      prompt: reach ? { verb:level.id==='orbit'&&reach.action==='service'?say('Usar','Use'):verbs[reach.action],
        title: reach.title, hint:reach.hint,cost: actionCost(reach.power, reach.action, sortie.design),
        blocked: missingFor(level, sortie.session, reach).map(id => level.points.find(p => p.id === id)!.title),
        missing: needs && !sortie.design.instruments.includes(needs) ? instruments[needs].name : null } : null,
      notice, signal:link(), fade, locked: input.locked,tethered:!!level.tether,
      player: { x: body.x, y: body.y, z: body.z, speed: Math.hypot(body.vx, body.vz), grounded: body.grounded },
      realGravity: level.realGravity, elapsed: sortie.time, now: time,
      design: progress.design, energy: sortie.energy, capacity: sortie.stats.capacity,
      draining: cold && phase === 'eva' ? say('frío', 'cold') : null,
      attempts: progress.attempts, saveError,
      paused, dialogue: dialogue ? dialogue.lines[dialogue.index] : null,canTalk:canTalk(), toast, achievements: progress.achievements,
      hasProgress: progress.attempts.length > 0,
      ship: phase === 'ship' ? { draft: ship.draft, done: [...ship.done], next: nextStation(), open: ship.open, near: ship.near, guided: ship.guided } : null,
    });
  }

  function render(alpha: number, frameMs: number) {
    viewport.tick(frameMs);
    const px = prev.x + (body.x - prev.x) * alpha, py = prev.y + (body.y - prev.y) * alpha, pz = prev.z + (body.z - prev.z) * alpha;
    view.player.position.set(px, py, pz);
    const frameDt = Math.min(0.1, frameMs / 1000);
    const reduced=prefs.getState().reduceMotion;
    view.astronaut.setBattery(sortie.energy / sortie.stats.capacity, phase === 'eva' && spendable(sortie) <= 0.5);
    const goodbye=site==='service'&&sortie.session.completed.includes('safe-bay');
    const vitality=goodbye?(dialogue?.key==='point:safe-bay'?.39:Math.min(.39,ending/1.2*.39)):1;
    const waitingInBerth=berth&&(!done('translator')||done('capsule-auth'));
    view.lumaModel.animate(time,!!waitingInBerth||idleFor>2,vitality);
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
    if(berth){
      if(done('capsule-auth'))target.set(berth.secured.x,.48,berth.secured.z);
      else if(!done('translator')){
        const rest=done('rest'),where=rest?berth.rest:berth.hatch;
        const peeking=reduced||rest||!done('protected-bay')?0:Math.min(.58,Math.max(0,time-hatchOpenedAt)*.24);
        target.set(where.x-peeking,rest?.51:.62,where.z);
      }else target.y=py+.47;
    }
    if(site==='service'&&releasing>0){
      const p=1-releasing/2.6;
      target.set(p<.64?7.65:7.65-(p-.64)*11,.75,-6+15*p);
    }
    if(site==='service'&&sortie.session.completed.includes('life-line')&&!releasing)target.set(px+.45,py+1.05,pz-.33);
    if(goodbye)target.set(px+.64,py+.21,pz-.72);
    lumaPos.lerp(target, smooth);
    view.luma.position.set(lumaPos.x,lumaPos.y+(reduced||waitingInBerth?0:Math.sin(time*2.2)*(berth?.05:.12)*vitality),lumaPos.z);
    view.luma.rotation.y = Math.atan2(px - lumaPos.x, pz - lumaPos.z) + Math.PI;
    if(view.tether){
      const a=anchorAt(px,pz);
      view.tether.visible=!!a&&phase==='eva';
      if(a){
        const positions=view.tether.geometry.attributes.position as BufferAttribute;
        positions.setXYZ(0,a.x,heightAt(hf,a.x,a.z)+1,a.z);
        positions.setXYZ(1,px,py+1.03,pz);
        positions.needsUpdate=true;
      }
    }

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
          const behindBulkhead = bay && (cx < bay.min.x + .18 || cx > bay.max.x - .18 ||
            cz < bay.min.z + .18 || cz > bay.max.z - .18 || cy > bay.ceiling - .3);
          if (behindBulkhead || heightAt(hf, cx, cz) + 0.5 > cy) { clear = false; break; }
        }
        if (clear) break;
      }
      camDist += (dist - camDist) * Math.min(1, frameMs / 1000 * (dist < camDist ? 14 : 4));
      camPos.set(px + Math.sin(yaw) * Math.cos(pitch) * camDist, py + 1.5 + Math.sin(pitch) * camDist, pz + Math.cos(yaw) * Math.cos(pitch) * camDist);
      camPos.y = Math.max(camPos.y, heightAt(hf, camPos.x, camPos.z) + 0.6);
      if (bay) {
        camPos.x = MathUtils.clamp(camPos.x, bay.min.x + .18, bay.max.x - .18);
        camPos.z = MathUtils.clamp(camPos.z, bay.min.z + .18, bay.max.z - .18);
        camPos.y = Math.min(camPos.y, bay.ceiling - .3);
      }
      camera.position.copy(camPos);
      camera.lookAt(px, py + (phase === 'eva' ? 1.4 : 1.1), pz);
    }

    view.beacon.visible = level.props.some(p=>p.kind==='mast')&&Math.sin(time * 3) > -0.2;
    for (const lamp of view.blinkers) lamp.visible = Math.sin(time * 2.4 - lamp.position.x * 0.2) > -0.5;
    for (const [id, m] of view.echoes) if (m.visible) m.rotation.y = time * 1.5 + id.length;

    viewport.renderer.render(phase === 'ship' ? interior.scene : view.scene, camera);
    sincePublish += frameMs;
    publish();
  }

  const loop = new Loop({ update, render });
  const hideDebug = exposeDebug({
    state: () => ({ steps: loop.steps, paused: loop.paused, gamePaused: paused, dialogue: !!dialogue, tier, phase, x: body.x, y: body.y, z: body.z, grounded: body.grounded,
      zone, completed: [...sortie.session.completed], collected: [...progress.echoes], recalls: sortie.session.recalls,
      signal:link(),energy:sortie.energy,outcome:sortie.outcome,attempts:progress.attempts.length,
      companion:view.luma.visible,companionAt:{x:lumaPos.x,z:lumaPos.z},
      look:{...input.look},gate:level.props.some(p=>p.kind==='gate'&&view.hardware.get(p)?.visible) }),
    step: (count: number) => loop.step(count),
    pause: (value: boolean) => { loop.paused = value; },
    perf: () => ({ ...hud.getState(), ratio: viewport.ratio, width: viewport.width, height: viewport.height }),
    teleport: (x: number, z: number) => teleport(x, z),
    press: (action: Actions) => input.press(action),
    hold: (action: Actions, down: boolean) => input.hold(action, down),
    look: (yaw: number, pitch: number) => { input.look.yaw = yaw; input.look.pitch = pitch; },
    pose: () => ['astronaut rig','left hip','right hip','left knee','right knee','torso','right elbow'].map(name=>{
      const part=view.player.getObjectByName(name)!;
      return [part.rotation.x,part.rotation.y,part.rotation.z,part.position.y];
    }),
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
  if(options){
    if(options.autostart)start(options.entryDesign??progress.design);
    else enterShip(false);
  }
  publish(true);
  loop.start();

  return {
    dispose() {
      disposed=true;
      loop.stop();
      hideDebug();
      input.dispose();
      unsubscribePrefs();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('visibilitychange', onVisibility);
      audio.mood('silent');
      stopLumaLine();
      enterWorld('surface');
      view.dispose();
      interior.dispose();
      viewport.dispose();
      for (const name of Object.keys(commands) as (keyof typeof commands)[]) commands[name] = () => {};
      hud.setState({ ready: false, phase: 'loading', report: null });
    },
  };
}
