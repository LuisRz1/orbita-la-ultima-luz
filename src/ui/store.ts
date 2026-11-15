import { createStore } from 'zustand/vanilla';
import type { Localized } from '../core/contract/grid-v1.ts';
import type { AccessoryId } from '../core/suit.ts';
import type { PatchId } from '../core/patches.ts';
import type { Memories } from '../levels/memories.ts';
import type { Attempt } from '../core/save/progress3d.ts';
import type { Report } from '../core/sortie.ts';
import type { SuitDesign } from '../core/suit.ts';
import type { Tier } from '../engine/quality.ts';
import type { LevelFacts } from '../levels/facts.ts';

export type Objective = { id: string; title: Localized; required: boolean; done: boolean; action: string; power: number };
export type Prompt = { verb: Localized; title: Localized; blocked: Localized[]; cost: number; missing: Localized | null };
export type Notice = { text: Localized; at: number; tone: 'luma' | 'system' | 'warn' };
export type CompassMark = { id: string; label: Localized | null; bearing: number; dist: number; kind: 'goal' | 'home' };
export type Phase = 'loading' | 'menu' | 'ship' | 'eva' | 'report';
export type StationId = 'battery' | 'thruster' | 'antenna' | 'instruments' | 'locker' | 'airlock';
export type ShipState = { draft: SuitDesign; done: StationId[]; next: StationId | null; open: StationId | null; near: StationId | null; guided: boolean };
export type DialogueLine = { speaker: 'LUMA' | 'CONTROL' | 'AURORA'; text: Localized };

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
  atlas: { found: number; total: number };
  beacons: { lit: number; total: number };
  pages: { found: number; total: number };
  /** Campaign closed: the farewell level is complete. Memories across saves, for the epilogue. */
  finale: { memories: Memories } | null;
  /** Suit accessories unlocked in ruins (any destination). */
  accessories: AccessoryId[];
  /** Cosmetic patches earned (any destination). */
  patches: PatchId[];
  /** Atlas cards and journal pages of the current destination, for the menu; unfound ones carry no text. */
  collection: {
    atlas: { id: string; title: Localized; fact: Localized | null; basis: 'observation' | 'simplification'; source: { name: string; url: string } | null }[];
    pages: { id: string; title: Localized; text: Localized | null }[];
  };
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
  /** Camera heading and marks for the compass, as angles in radians (0 = south, π/2 = east). */
  compass: { heading: number; marks: CompassMark[] };
  dialogue: DialogueLine | null;
  toast: { id: string; at: number } | null;
  achievements: string[];
  hasProgress: boolean;
  ship: ShipState | null;
  /** Destination being played, its title-screen card and the text that closes a completed mission. */
  levelId: string;
  facts: LevelFacts | null;
  outcome: Localized | null;
  /** Story route: which destinations exist, which one is open and which can be travelled to. */
  destinations: Destination[];
  /** Next destination, once this one has a completed sortie. */
  next: { id: string; name: Localized } | null;
};
export type Destination = { id: string; name: Localized; current: boolean; unlocked: boolean };

export const hud = createStore<HudState>(() => ({
  ready: false, phase: 'loading', tier: 'medium', frameMs: 0, renderScale: 1, drawCalls: 0, triangles: 0,
  levelTitle: null, briefing: null, zone: null, zoneAt: 0, objectives: [], echoes: { found: 0, total: 0 }, atlas: { found: 0, total: 0 }, beacons: { lit: 0, total: 0 }, pages: { found: 0, total: 0 }, accessories: [], patches: [], finale: null, collection: { atlas: [], pages: [] }, prompt: null, notice: null,
  signal: 1, fade: 0, locked: false, player: { x: 0, y: 0, z: 0, speed: 0, grounded: true }, realGravity: 0, elapsed: 0, now: 0,
  design: null, energy: 0, capacity: 0, draining: null, report: null, attempts: [], saveError: false,
  paused: false, compass: { heading: Math.PI, marks: [] }, dialogue: null, toast: null, achievements: [], hasProgress: false, ship: null,
  levelId: 'moon', facts: null, outcome: null, destinations: [], next: null,
}));

/** Commands the interface sends to the engine. The running game replaces these no-ops. */
export const commands = {
  start: (_design: SuitDesign) => {},
  /** Shows a design on the astronaut while the player edits it. */
  preview: (_design: SuitDesign) => {},
  redesign: () => {},
  retry: () => {},
  newGame: () => {},
  continueGame: () => {},
  toMenu: () => {},
  resume: () => {},
  abandon: () => {},
  advance: () => {},
  pick: (_draft: SuitDesign) => {},
  confirmStation: () => {},
  closeStation: () => {},
  /** Opens another unlocked destination (reloads the page with ?level=). */
  travel: (_id: string) => {},
};
