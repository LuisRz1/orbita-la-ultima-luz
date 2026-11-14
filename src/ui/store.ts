import { createStore } from 'zustand/vanilla';
import type { Tier } from '../engine/quality.ts';

/** State the engine publishes for the DOM interface. The engine writes at most ten times per second. */
export type HudState = {
  ready: boolean;
  tier: Tier;
  frameMs: number;
  renderScale: number;
  drawCalls: number;
  triangles: number;
};

export const hud = createStore<HudState>(() => ({
  ready: false, tier: 'medium', frameMs: 0, renderScale: 1, drawCalls: 0, triangles: 0,
}));
