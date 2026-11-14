import { createStore } from 'zustand/vanilla';
import type { Localized } from '../core/contract/grid-v1.ts';
import type { Attempt } from '../core/save/progress3d.ts';
import type { Report } from '../core/sortie.ts';
import type { SuitDesign } from '../core/suit.ts';
import type { Tier } from '../engine/quality.ts';

export type Objective = { id: string; title: Localized; required: boolean; done: boolean; action: string; power: number };
export type Prompt = { verb: Localized; title: Localized; blocked: Localized[]; cost: number; missing: Localized | null };
export type Notice = { text: Localized; at: number; tone: 'luma' | 'system' | 'warn' };
export type Phase = 'loading' | 'menu' | 'design' | 'eva' | 'report';
export type DialogueLine = { speaker: 'LUMA' | 'CONTROL'; text: Localized };

/** State the engine publishes for the DOM interface. Continuous values are refreshed ten times per second. */
export type HudState = {
  ready: boolean;
  phase: Phase;
  tier: Tier;
  frameMs: number; renderScale: number; drawCalls: number; triangles: number;
  levelTitle: Localized | null; briefing: Localized | null;
  zone: Localized | null; zoneAt: number;
  objectives: Objective[];
  echoes: { found: number; total: number };
  prompt: Prompt | null;
  notice: Notice | null;
  signal: number;
  fade: number;
  locked: boolean;
  player: { x: number; y: number; z: number; speed: number; grounded: boolean };
  realGravity: number;
  /** Mission elapsed time of the current sortie. */
  elapsed: number;
  /** Engine clock, for timing transient UI such as zone titles and notices. */
  now: number;
  design: SuitDesign | null;
  energy: number; capacity: number; draining: Localized | null;
  report: Report | null;
  attempts: Attempt[];
  saveError: boolean;
  paused: boolean;
  dialogue: DialogueLine | null;
  toast: { id: string; at: number } | null;
  achievements: string[];
  hasProgress: boolean;
};

export const hud = createStore<HudState>(() => ({
  ready: false, phase: 'loading', tier: 'medium', frameMs: 0, renderScale: 1, drawCalls: 0, triangles: 0,
  levelTitle: null, briefing: null, zone: null, zoneAt: 0, objectives: [], echoes: { found: 0, total: 0 }, prompt: null, notice: null,
  signal: 1, fade: 0, locked: false, player: { x: 0, y: 0, z: 0, speed: 0, grounded: true }, realGravity: 0, elapsed: 0, now: 0,
  design: null, energy: 0, capacity: 0, draining: null, report: null, attempts: [], saveError: false,
  paused: false, dialogue: null, toast: null, achievements: [], hasProgress: false,
}));

/** Commands the interface sends to the engine. The running game replaces these no-ops. */
export const commands = {
  start: (_design: SuitDesign) => {},
  redesign: () => {},
  retry: () => {},
  newGame: () => {},
  continueGame: () => {},
  toMenu: () => {},
  resume: () => {},
  abandon: () => {},
  advance: () => {},
};
