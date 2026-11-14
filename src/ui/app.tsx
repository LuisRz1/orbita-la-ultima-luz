import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { debugEnabled } from '../engine/debug.ts';
import { createGame } from '../engine/game.ts';
import { webglAvailable } from '../engine/renderer.ts';
import { hud } from './store.ts';
import './ui.css';

function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = createGame(host.current);
    return () => game.dispose();
  }, []);
  return <div className="game-host" ref={host} />;
}

function PerfPanel() {
  const state = useStore(hud);
  return <aside className="panel perf" aria-label="Rendimiento">
    <span className="panel-title">RENDER</span>
    <dl>
      <dt>ms/cuadro</dt><dd data-perf="frame">{state.frameMs.toFixed(1)}</dd>
      <dt>escala</dt><dd>{Math.round(state.renderScale * 100)}%</dd>
      <dt>calidad</dt><dd>{state.tier}</dd>
      <dt>dibujos</dt><dd>{state.drawCalls}</dd>
      <dt>triángulos</dt><dd>{state.triangles}</dd>
    </dl>
  </aside>;
}

export function App() {
  if (!webglAvailable()) {
    return <main className="fallback">
      <h1>Órbita: La última luz</h1>
      <p>Este navegador no tiene WebGL disponible. Actívalo o prueba con otro navegador.</p>
    </main>;
  }
  return <div className="orbita">
    <GameCanvas />
    {debugEnabled() && <PerfPanel />}
  </div>;
}
