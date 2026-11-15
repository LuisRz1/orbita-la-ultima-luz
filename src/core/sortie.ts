// One EVA sortie with a given suit: energy ledger, gated interactions and the report that links outcome to design.
import type { Localized } from './contract/grid-v1.ts';
import { zoneDrain, type LevelPoint, type LevelV2 } from './contract/level-v2.ts';
import { createSession, missingFor, pointInReach, type Session } from './session.ts';
import {
  actionCost, antennas, assessSuit, batteries, dashCost, instrumentFor, instruments, lifeDrain, moveDrain, reserve, thrusters,
  type SuitDesign, type SuitStats,
} from './suit.ts';

const t = (es: string, en: string): Localized => ({ es, en });

export type LedgerKey = 'life' | 'move' | 'dash' | 'thruster' | 'actions' | 'cold' | 'dust' | 'sun';
export type Outcome = 'complete' | 'recalled';
export type Sortie = {
  design: SuitDesign; stats: SuitStats; energy: number; ledger: Record<LedgerKey, number>;
  session: Session; time: number; outcome: Outcome | null; blocked: string[];
  /** True when the battery ran out on the way back and LUMA had to drag the player home. */
  emergency: boolean;
};

export const ledgerLabels: Record<LedgerKey, Localized> = {
  life: t('Soporte vital', 'Life support'), move: t('Desplazamiento', 'Walking'), dash: t('Dash', 'Dash'),
  thruster: t('Propulsor', 'Thruster'), actions: t('Instrumentos y reparaciones', 'Instruments and repairs'), cold: t('Frío en sombra', 'Cold in shadow'),
  dust: t('Polvo y viento', 'Dust and wind'), sun: t('Refrigeración al sol', 'Cooling in sunlight'),
};

export function startSortie(design: SuitDesign): Sortie {
  const stats = assessSuit(design);
  return { design, stats, energy: stats.capacity, ledger: { life: 0, move: 0, dash: 0, thruster: 0, actions: 0, cold: 0, dust: 0, sun: 0 },
    session: createSession(), time: 0, outcome: null, blocked: [], emergency: false };
}

/** Energy above the return reserve, i.e. what actions may still spend. */
export const spendable = (s: Sortie) => s.energy - reserve;

export function spend(s: Sortie, key: LedgerKey, amount: number) {
  s.energy = Math.max(0, s.energy - amount);
  s.ledger[key] += amount;
}

/** Continuous drain for one step. Returns true when the battery has reached the return reserve. */
export function drain(s: Sortie, level: LevelV2, dt: number, moving: boolean, zone: string | null) {
  s.time += dt;
  spend(s, 'life', lifeDrain * dt);
  if (moving) spend(s, 'move', moveDrain * dt);
  const here = level.zones.find(z => z.id === zone);
  const extra = zoneDrain(here, s.session.completed);
  const hazard = here?.hazard ?? 'cold';
  if (extra) spend(s, hazard, extra * dt * (hazard === 'cold' ? s.stats.coldFactor : 1));
  // Wrist panel: a trickle while standing still, except in shadowed cold zones.
  if (s.stats.solar && !moving && !(extra && hazard === 'cold')) s.energy = Math.min(s.stats.capacity, s.energy + s.stats.solar * dt);
  return s.energy <= reserve;
}

export type InteractError = 'none' | 'requirements' | 'instrument' | 'power';
export type SortieInteract = { ok: true; point: LevelPoint; cost: number } | { ok: false; error: InteractError; point?: LevelPoint; cost?: number };

export function sortieInteract(level: LevelV2, s: Sortie, x: number, z: number): SortieInteract {
  const point = pointInReach(level, s.session, x, z);
  if (!point) return { ok: false, error: 'none' };
  if (missingFor(level, s.session, point).length) return { ok: false, error: 'requirements', point };
  const needs = instrumentFor[point.action];
  if (needs && !s.design.instruments.includes(needs)) {
    if (!s.blocked.includes(point.id)) s.blocked.push(point.id);
    return { ok: false, error: 'instrument', point };
  }
  const cost = actionCost(point.power, point.action, s.design);
  if (cost > spendable(s)) {
    if (!s.blocked.includes(point.id)) s.blocked.push(point.id);
    return { ok: false, error: 'power', point, cost };
  }
  spend(s, 'actions', cost);
  s.session.completed.push(point.id);
  if (point.id === level.exit) s.outcome = 'complete';
  return { ok: true, point, cost };
}

export type Report = {
  outcome: Outcome; completed: string[]; required: number; requiredDone: number;
  missed: { id: string; title: Localized; cause: Localized }[];
  ledger: Record<LedgerKey, number>; capacity: number; used: number; left: number; time: number;
  insights: Localized[]; echoes: number; recalls: number; emergency: boolean;
};

/** Explains the sortie in terms of the design: every missed objective gets the decision that caused it. */
export function buildReport(level: LevelV2, s: Sortie): Report {
  const outcome = s.outcome ?? 'recalled';
  const done = new Set(s.session.completed);
  const missed = level.points.filter(p => p.required && !done.has(p.id)).map(p => {
    const needs = instrumentFor[p.action];
    let cause: Localized;
    if (needs && !s.design.instruments.includes(needs))
      cause = t(`El traje no llevaba ${instruments[needs].name.es.toLowerCase()}.`, `The suit carried no ${instruments[needs].name.en.toLowerCase()}.`);
    else if (s.blocked.includes(p.id))
      cause = t(`No quedaba energía sobre la reserva para su coste (${actionCost(p.power, p.action, s.design)} u.).`, `Not enough energy above the reserve for its cost (${actionCost(p.power, p.action, s.design)} u).`);
    else if (outcome === 'recalled')
      cause = t('La batería llegó a la reserva antes de alcanzarlo.', 'The battery reached the reserve before you got there.');
    else cause = t('No se visitó.', 'Not visited.');
    return { id: p.id, title: p.title, cause };
  });
  const used = s.stats.capacity - s.energy;
  const top = (Object.keys(s.ledger) as LedgerKey[]).sort((a, b) => s.ledger[b] - s.ledger[a])[0];
  const insights: Localized[] = [
    t(`${batteries[s.design.battery].name.es}: ${s.stats.capacity} u.; se usaron ${Math.round(used)} u. El mayor gasto fue ${ledgerLabels[top].es.toLowerCase()} (${Math.round(s.ledger[top])} u.).`,
      `${batteries[s.design.battery].name.en}: ${s.stats.capacity} u; ${Math.round(used)} u used. The largest drain was ${ledgerLabels[top].en.toLowerCase()} (${Math.round(s.ledger[top])} u).`),
    t(`Masa del traje ${s.stats.mass} kg: salto al ${Math.round(s.stats.jumpFactor * 100)} % de un traje ligero.`,
      `Suit mass ${s.stats.mass} kg: jump at ${Math.round(s.stats.jumpFactor * 100)}% of a light suit.`),
  ];
  if (s.ledger.thruster > 0) insights.push(t(`${thrusters[s.design.thruster].name.es}: ${Math.round(s.ledger.thruster)} u. en saltos en el aire.`, `${thrusters[s.design.thruster].name.en}: ${Math.round(s.ledger.thruster)} u on air jumps.`));
  if (s.ledger.cold > 0) insights.push(t(`El cráter en sombra costó ${Math.round(s.ledger.cold)} u. por el frío.`, `The shadowed crater cost ${Math.round(s.ledger.cold)} u to the cold.`));
  if (s.ledger.dust > 0) insights.push(t(`Cruzar el polvo costó ${Math.round(s.ledger.dust)} u.: tras la contingencia, rodear las dunas suele salir más barato.`,
    `Crossing the dust cost ${Math.round(s.ledger.dust)} u: after the contingency, going around the dunes is usually cheaper.`));
  if (s.ledger.sun > 0) insights.push(t(`La ruta al sol costó ${Math.round(s.ledger.sun)} u. de refrigeración: la baranda en sombra es más larga pero no calienta el traje.`,
    `The sunlit route cost ${Math.round(s.ledger.sun)} u of cooling: the shaded handrail is longer but does not heat the suit.`));
  if (outcome === 'recalled') insights.push(s.emergency
    ? t('La reserva se agotó antes de llegar al módulo: LUMA tuvo que arrastrarte de vuelta.', 'The reserve ran out before you reached the lander: LUMA had to drag you back.')
    : t('Volviste al módulo con la reserva de retorno: repliegue seguro.', 'You walked back to the lander on the return reserve: a safe recall.'));
  if (s.session.recalls > 0) insights.push(t(`${antennas[s.design.antenna].name.es} (${s.stats.commsRadius} m): perdiste el enlace ${s.session.recalls} vez/veces.`, `${antennas[s.design.antenna].name.en} (${s.stats.commsRadius} m): link lost ${s.session.recalls} time(s).`));
  const required = level.points.filter(p => p.required);
  return {
    outcome, completed: [...s.session.completed], required: required.length, requiredDone: required.filter(p => done.has(p.id)).length,
    missed, ledger: { ...s.ledger }, capacity: s.stats.capacity, used, left: s.energy, time: s.time, insights,
    echoes: s.session.collected.length, recalls: s.session.recalls, emergency: s.emergency,
  };
}

export { dashCost, reserve };
