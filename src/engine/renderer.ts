import { ACESFilmicToneMapping, AgXToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';
import { look } from './look.ts';
import { budgetRatio, ResolutionGovernor, tiers, type Tier } from './quality.ts';

export type Viewport = {
  renderer: WebGLRenderer;
  governor: ResolutionGovernor;
  tier: Tier;
  width: number;
  height: number;
  /** Effective pixel ratio after the tier budget and the governor. */
  ratio: number;
  /** Call once per frame with the last frame time; resizes the buffer when the governor reacts. */
  tick(frameMs: number): void;
  onResize(listener: (width: number, height: number) => void): void;
  dispose(): void;
};

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch { return false; }
}

/** Creates the renderer inside `host` and keeps its buffer within the tier's pixel budget. */
export function createViewport(host: HTMLElement, tier: Tier): Viewport {
  const spec = tiers[tier];
  const renderer = new WebGLRenderer({ antialias: spec.antialias, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = SRGBColorSpace;
  // Realistic look: AgX keeps hue in blown highlights (white suits under a hard Sun) where ACES skews them.
  renderer.toneMapping = look.real ? AgXToneMapping : ACESFilmicToneMapping;
  renderer.domElement.className = 'game-canvas';
  host.appendChild(renderer.domElement);

  const governor = new ResolutionGovernor(spec);
  const listeners: ((width: number, height: number) => void)[] = [];
  const viewport: Viewport = {
    renderer, governor, tier, width: 1, height: 1, ratio: 1,
    tick(frameMs) { if (governor.update(frameMs)) apply(); },
    onResize(listener) { listeners.push(listener); listener(viewport.width, viewport.height); },
    dispose() {
      observer.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  function apply() {
    viewport.width = Math.max(1, host.clientWidth);
    viewport.height = Math.max(1, host.clientHeight);
    viewport.ratio = budgetRatio(viewport.width, viewport.height, window.devicePixelRatio || 1, spec) * governor.scale;
    renderer.setPixelRatio(viewport.ratio);
    renderer.setSize(viewport.width, viewport.height, false);
    for (const listener of listeners) listener(viewport.width, viewport.height);
  }
  const observer = new ResizeObserver(apply);
  observer.observe(host);
  apply();
  return viewport;
}
