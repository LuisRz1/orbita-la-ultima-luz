import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import type { MoveParams } from '../core/movement.ts';
import { sound, type Sfx } from '../engine/audio.ts';
import { debugEnabled } from '../engine/debug.ts';
import { webglAvailable } from '../engine/renderer.ts';
import { resetTuning, setTuning, tuning } from '../engine/tuning.ts';
import { AchievementToast, Compass, DialogueBox, Fade, LumaCard, MissionPanel, Prompt, Telemetry, ZoneTitle } from './hud.tsx';
import { useT } from './i18n.ts';
import { MainMenu, PauseMenu } from './screens/menu.tsx';
import { SortieReport } from './screens/sortie-report.tsx';
import { Epilogue } from './screens/epilogue.tsx';
import { ShipScreen } from './screens/ship.tsx';
import { commands, hud } from './store.ts';
import './ui.css';

function GameCanvas({ onError }: { onError(message: string): void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    let alive = true, dispose: (() => void) | null = null;
    import('../engine/game.ts')
      .then(({ createGame }) => createGame(host.current!))
      .then(game => { if (alive) dispose = game.dispose; else game.dispose(); })
      .catch((e: unknown) => onError(e instanceof Error ? e.message : String(e)));
    return () => { alive = false; dispose?.(); };
  }, [onError]);
  return <div className="game-host" ref={host} />;
}

function PerfPanel() {
  const state = useStore(hud);
  return <section className="panel perf" aria-label="Render">
    <span className="panel-title">RENDER</span>
    <dl>
      <dt>ms</dt><dd data-perf="frame">{state.frameMs.toFixed(1)}</dd>
      <dt>scale</dt><dd>{Math.round(state.renderScale * 100)}%</dd>
      <dt>tier</dt><dd>{state.tier}</dd>
      <dt>calls</dt><dd>{state.drawCalls}</dd>
      <dt>tris</dt><dd>{state.triangles}</dd>
    </dl>
  </section>;
}

/** Developer panel for tuning movement live (?debug only); labels stay technical on purpose. */
const tunables: [keyof MoveParams, number][] = [
  ['runSpeed', 0.5], ['jumpSpeed', 0.25], ['airJumpSpeed', 0.25], ['airJumps', 1], ['gravityUp', 0.25], ['gravityDown', 0.25],
  ['cutGravity', 0.5], ['dashSpeed', 1], ['dashTime', 0.02], ['dashKeep', 0.5], ['dashCooldown', 0.05], ['groundAccel', 2],
  ['airAccel', 1], ['coyote', 0.02], ['maxSlope', 1],
];

function TuningPanel() {
  const [, redraw] = useState(0);
  const [open, setOpen] = useState(false);
  return <section className="panel tuning" aria-label="Tuning">
    <button className="panel-title as-button" onClick={() => setOpen(!open)}>MOVE {open ? '▾' : '▸'}</button>
    {open && <>
      {tunables.map(([name, step]) => <label key={name}>
        <span>{name}</span>
        <input type="number" step={step} value={tuning[name]} onChange={e => { setTuning(name, Number(e.target.value)); redraw(n => n + 1); }} />
      </label>)}
      <button className="small" onClick={() => { resetTuning(); redraw(n => n + 1); }}>defaults</button>
    </>}
  </section>;
}

function Screens() {
  const { t } = useT();
  const { phase, report, saveError, paused } = useStore(hud);
  const [epilogue, setEpilogue] = useState(false);
  let body = null;
  if (phase === 'menu') body = <MainMenu />;
  else if (phase === 'ship') body = <ShipScreen />;
  else if (phase === 'report' && report) body = epilogue ? <Epilogue onClose={() => setEpilogue(false)} />
    : <SortieReport report={report} onRedesign={() => commands.redesign()} onRetry={() => commands.retry()} onEpilogue={() => setEpilogue(true)} />;
  else if (phase === 'eva') body = <>
    <MissionPanel /><Compass /><Telemetry /><LumaCard /><ZoneTitle /><Prompt /><Fade />
    {paused && <PauseMenu />}
  </>;
  return <>
    {body}
    <DialogueBox />
    <AchievementToast />
    {saveError && <p className="save-error">{t('saveError')}</p>}
  </>;
}

/** Interface sounds for every button: `data-sfx` picks one, the default is a soft select click. */
function useUiSounds() {
  useEffect(() => {
    let lastHover: Element | null = null;
    const button = (e: Event) => (e.target as Element | null)?.closest?.('.orbita button, .orbita input[type=checkbox], .orbita [data-sfx]') ?? null;
    const click = (e: Event) => { const b = button(e); if (b) { sound.unlock(); sound.play(((b as HTMLElement).dataset.sfx as Sfx) || 'ui-select'); } };
    const over = (e: Event) => { const b = button(e); if (b && b !== lastHover && !(b as HTMLButtonElement).disabled) sound.play('ui-hover'); lastHover = b; };
    document.addEventListener('click', click, true);
    document.addEventListener('pointerover', over);
    return () => { document.removeEventListener('click', click, true); document.removeEventListener('pointerover', over); };
  }, []);
}

export function App() {
  useUiSounds();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const ready = useStore(hud, s => s.ready);
  if (!webglAvailable() || error) {
    return <main className="fallback">
      <h1>Órbita: La última luz</h1>
      <p>{error ? 'No se pudo iniciar el juego / The game could not start: ' + error
        : 'Este navegador no tiene WebGL disponible. / This browser has no WebGL available.'}</p>
    </main>;
  }
  return <div className="orbita">
    <GameCanvas onError={setError} />
    <div className="film" aria-hidden="true" />
    {!ready && <p className="loading">{t('loading')}</p>}
    {ready && <Screens />}
    {ready && debugEnabled() && <><PerfPanel /><TuningPanel /></>}
  </div>;
}
