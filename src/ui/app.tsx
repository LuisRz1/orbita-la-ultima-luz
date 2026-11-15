import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import type { MoveParams } from '../core/movement.ts';
import { sound, type Sfx } from '../engine/audio.ts';
import { debugEnabled } from '../engine/debug.ts';
import { resetTuning, setTuning, tuning } from '../engine/tuning.ts';
import { useT } from './i18n.ts';
import { prefs, type Prefs } from './prefs.ts';
import { SortieScreen } from './screens/sortie.tsx';
import { LaunchSetup } from './screens/launch.tsx';
import { GameCanvas } from './game-canvas.tsx';
import { hud } from './store.ts';
import './ui.css';

const CampaignGame=lazy(()=>import('./campaign.tsx').then(m=>({default:m.CampaignGame})));
type GameMode = 'setup' | 'menu' | 'aurora' | 'primera-luz';

function initialMode(): GameMode {
  const query = new URLSearchParams(location.search);
  if (query.has('primera-luz')) return 'primera-luz';
  if (query.has('campana')) return 'aurora';
  return query.has('menu') || query.has('level') ? 'menu' : 'setup';
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

/** Interface sounds for every button: `data-sfx` picks one, the default is a soft select click. */
function useUiSounds() {
  useEffect(() => {
    const setVolumes = ({ master, music, sfx }: Prefs) => {
      sound.volumes = { master, music, sfx };
      sound.applyVolumes();
    };
    setVolumes(prefs.getState());
    const unsubscribe = prefs.subscribe(setVolumes);
    let lastHover: Element | null = null;
    const button = (e: Event) => (e.target as Element | null)?.closest?.('.orbita button, .orbita input[type=checkbox], .orbita [data-sfx]') ?? null;
    const click = (e: Event) => { const b = button(e); if (b) { sound.unlock(); sound.play(((b as HTMLElement).dataset.sfx as Sfx) || 'ui-select'); } };
    const over = (e: Event) => { const b = button(e); if (b && b !== lastHover && !(b as HTMLButtonElement).disabled) sound.play('ui-hover'); lastHover = b; };
    document.addEventListener('click', click, true);
    document.addEventListener('pointerover', over);
    return () => {
      unsubscribe();
      document.removeEventListener('click', click, true);
      document.removeEventListener('pointerover', over);
    };
  }, []);
}

export function App() {
  useUiSounds();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [mode,setMode]=useState(initialMode);
  const root=useRef<HTMLDivElement>(null);
  const [fullscreen,setFullscreen]=useState(false);
  const [fullscreenError,setFullscreenError]=useState(false);
  const switchGame=useCallback((next:GameMode)=>{
    const url=new URL(location.href);
    if(next==='aurora'||next==='primera-luz')url.searchParams.set('campana','');
    else url.searchParams.delete('campana');
    if(next==='primera-luz')url.searchParams.set('primera-luz','');
    else url.searchParams.delete('primera-luz');
    if(next==='menu')url.searchParams.set('menu','');
    else url.searchParams.delete('menu');
    if(next==='setup')url.searchParams.delete('level');
    history.replaceState(null,'',url);
    setError(null);
    setMode(next);
  },[]);
  const open=useCallback(()=>switchGame('aurora'),[switchGame]);
  const openFirstLight=useCallback(()=>switchGame('primera-luz'),[switchGame]);
  const openExpeditions=useCallback(()=>switchGame('menu'),[switchGame]);
  const exit=useCallback(()=>switchGame('setup'),[switchGame]);
  const toggleFullscreen=useCallback(async ()=>{
    setFullscreenError(false);
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(root.current?.requestFullscreen)await root.current.requestFullscreen();
      else setFullscreenError(true);
    }catch{setFullscreenError(true);}
  },[]);
  useEffect(()=>{
    const changed=()=>setFullscreen(document.fullscreenElement===root.current);
    const key=(event:KeyboardEvent)=>{
      if(event.code!=='KeyF'||event.repeat||event.metaKey||event.altKey||event.ctrlKey||
        event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,[contenteditable]'))return;
      void toggleFullscreen();
    };
    document.addEventListener('fullscreenchange',changed);
    window.addEventListener('keydown',key);
    return()=>{
      document.removeEventListener('fullscreenchange',changed);
      window.removeEventListener('keydown',key);
    };
  },[toggleFullscreen]);
  const ready = useStore(hud, s => s.ready);
  if (error) {
    return <main className="fallback">
      <h1>Órbita: La última luz</h1>
      <p>{t({ es: 'No se pudo iniciar el visor 3D.', en: 'The 3D viewport could not start.' })}</p>
      <button onClick={exit}>{t({ es: 'Volver a la configuración', en: 'Back to setup' })}</button>
    </main>;
  }
  return <div className="orbita" ref={root}>
    {mode==='setup'?<LaunchSetup onPlay={openFirstLight} onCampaign={open} onExpeditions={openExpeditions}/>:
    mode!=='menu'?<Suspense fallback={<p className="loading" role="status">{t('loading')}</p>}>
      <CampaignGame key={mode} slot={mode} onExit={exit} onFullCampaign={open}/>
    </Suspense>:<>
      <GameCanvas onError={setError}/>
      {!ready&&<p className="loading" role="status">{t('loading')}</p>}
      {ready&&<SortieScreen onCampaign={open} onExit={exit}/>}
    </>}
    <div className="film" aria-hidden="true" />
    <button type="button" className="viewport-fullscreen" aria-pressed={fullscreen}
      aria-label={t(fullscreen?{es:'Salir de pantalla completa',en:'Exit fullscreen'}:{es:'Pantalla completa',en:'Fullscreen'})}
      onClick={()=>void toggleFullscreen()}><span aria-hidden="true">⛶</span> <kbd>F</kbd></button>
    {fullscreenError&&<p className="fullscreen-error" role="status">{t({
      es:'El navegador no concedió la pantalla completa.',en:'The browser did not grant fullscreen.',
    })}</p>}
    {ready && debugEnabled() && <><PerfPanel /><TuningPanel /></>}
  </div>;
}
