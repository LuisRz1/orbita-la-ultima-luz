// Debrief after a sortie: which design decision led to which result, what to try next, and how this attempt compares
// with the previous one. Deterministic rules over the report; nothing here changes progress or rewards.
import type { Localized } from './contract/grid-v1.ts';
import type { Report } from './sortie.ts';
import {
  accessories, antennas, assessSuit, batteries, instrumentFor, instruments, massLimit, reserve, thrusters,
  type AccessoryId, type AntennaId, type BatteryId, type InstrumentId, type SuitDesign, type ThrusterId,
} from './suit.ts';

const t = (es: string, en: string): Localized => ({ es, en });
const pct = (f: number) => Math.round(f * 100);

export type Slot = 'battery' | 'thruster' | 'antenna' | 'instruments' | 'accessory';
export type Tone = 'good' | 'bad' | 'neutral';
/** One design decision and the result it produced in this sortie. */
export type Link = { slot: Slot | 'mass'; choice: Localized; effect: Localized; tone: Tone };

const batteryOrder: BatteryId[] = ['light', 'standard', 'extended'];
const antennaOrder: AntennaId[] = ['short', 'medium', 'long'];
const thrusterOrder: ThrusterId[] = ['none', 'compact', 'strong'];
const names = (ids: readonly InstrumentId[]) => t(ids.map(id => instruments[id].name.es).join(', ') || 'ninguno', ids.map(id => instruments[id].name.en).join(', ') || 'none');
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Decision → result table for the report: every slot of the suit with what it did in this sortie. */
export function decisionLinks(r: Report): Link[] {
  const d = r.design, links: Link[] = [];
  const reserveAt = r.marks.find(m => m.kind === 'reserve');
  const spare = Math.round(r.left - reserve);
  const lostPower = r.missed.filter(m => m.reason === 'power' || m.reason === 'reserve');
  links.push({
    slot: 'battery', choice: t(`${batteries[d.battery].name.es} · ${r.capacity} u.`, `${batteries[d.battery].name.en} · ${r.capacity} u`),
    effect: reserveAt
      ? t(`Llegó a la reserva en ${clock(reserveAt.t)}${lostPower.length ? `; quedaron ${lostPower.length} objetivo(s) sin energía` : ''}.`,
        `Hit the reserve at ${clock(reserveAt.t)}${lostPower.length ? `; ${lostPower.length} objective(s) left without energy` : ''}.`)
      : t(`Sobraron ${Math.max(0, spare)} u. sobre la reserva.`, `${Math.max(0, spare)} u to spare above the reserve.`),
    tone: reserveAt || lostPower.length ? 'bad' : spare > r.capacity * 0.4 ? 'neutral' : 'good',
  });
  const th = thrusters[d.thruster];
  const jumps = th.airJumpCost ? Math.round(r.ledger.thruster / th.airJumpCost) : 0;
  links.push({
    slot: 'thruster', choice: th.name,
    effect: d.thruster === 'none' ? t('Sin doble salto: ningún gasto en el aire.', 'No double jump: nothing spent in the air.')
      : jumps ? t(`${jumps} doble(s) salto(s): ${Math.round(r.ledger.thruster)} u.`, `${jumps} double jump(s): ${Math.round(r.ledger.thruster)} u.`)
      : t(`No se usó: ${th.mass} kg de peso sin aprovechar.`, `Not used: ${th.mass} kg carried for nothing.`),
    tone: d.thruster !== 'none' && !jumps ? 'neutral' : 'good',
  });
  links.push({
    slot: 'antenna', choice: t(`${antennas[d.antenna].name.es} · ${antennas[d.antenna].radius} m`, `${antennas[d.antenna].name.en} · ${antennas[d.antenna].radius} m`),
    effect: r.recalls ? t(`Enlace perdido ${r.recalls} vez/veces: te guiaron de vuelta al punto de partida.`, `Link lost ${r.recalls} time(s): you were guided back to the start.`)
      : t('Enlace estable durante toda la salida.', 'Link held for the whole sortie.'),
    tone: r.recalls ? 'bad' : 'good',
  });
  const lacking = r.missed.filter(m => m.reason === 'instrument');
  links.push({
    slot: 'instruments', choice: names(d.instruments),
    effect: lacking.length
      ? t(`Sin el instrumento necesario: ${lacking.map(m => m.title.es).join(', ')}.`, `Missing the instrument for: ${lacking.map(m => m.title.en).join(', ')}.`)
      : t('Cada objetivo tenía su instrumento.', 'Every objective had its instrument.'),
    tone: lacking.length ? 'bad' : 'good',
  });
  if (d.accessory) links.push({
    slot: 'accessory', choice: accessories[d.accessory].name,
    effect: d.accessory === 'liner'
      ? t(`El frío costó ${Math.round(r.ledger.cold)} u. (la mitad sin forro: ${Math.round(r.ledger.cold * 2)} u.).`, `Cold cost ${Math.round(r.ledger.cold)} u (twice that without the liner).`)
      : t('Recarga lenta al estar quieto fuera de la sombra.', 'Slow recharge while standing still out of shadow.'),
    tone: 'good',
  });
  links.push({
    slot: 'mass', choice: t(`${r.mass} / ${massLimit} kg`, `${r.mass} / ${massLimit} kg`),
    effect: t(`Salto al ${pct(r.jumpFactor)} % de un traje ligero.`, `Jump at ${pct(r.jumpFactor)}% of a light suit.`),
    tone: r.jumpFactor < 0.85 ? 'neutral' : 'good',
  });
  return links;
}

/** A concrete next step. `design`, when present, is a valid suit (within the mass limit) the player can load. */
export type Advice = { id: string; text: Localized; design?: SuitDesign };

const fits = (d: SuitDesign) => assessSuit(d).problems.length === 0;

/**
 * Makes a design fit the mass limit without touching `keep`: first drops instruments no required objective needs,
 * then steps down the antenna, the thruster and finally the battery. Returns null when nothing fits.
 */
export function fitMass(d: SuitDesign, needed: InstrumentId[], keep: Slot[] = []): SuitDesign | null {
  let next: SuitDesign = { ...d, instruments: [...d.instruments] };
  if (fits(next)) return next;
  for (const id of ['kit', 'camera', 'drill'] as InstrumentId[]) {
    if (needed.includes(id) || !next.instruments.includes(id) || keep.includes('instruments')) continue;
    next = { ...next, instruments: next.instruments.filter(x => x !== id) };
    if (fits(next)) return next;
  }
  if (next.accessory && !keep.includes('accessory')) { next = { ...next, accessory: undefined }; if (fits(next)) return next; }
  // One step down, never below the floor: a medium antenna, a compact thruster and a standard battery.
  const down = <T extends string>(order: T[], value: T, floor: number) => (order.indexOf(value) - 1 >= floor ? order[order.indexOf(value) - 1] : value);
  for (let i = 0; i < 2; i++) {
    if (!keep.includes('antenna')) { next = { ...next, antenna: down(antennaOrder, next.antenna, 1) }; if (fits(next)) return next; }
    if (!keep.includes('thruster')) { next = { ...next, thruster: down(thrusterOrder, next.thruster, 1) }; if (fits(next)) return next; }
    if (!keep.includes('battery')) { next = { ...next, battery: down(batteryOrder, next.battery, 1) }; if (fits(next)) return next; }
  }
  return fits(next) ? next : null;
}

/** Instruments the required objectives call for (the kit is never required, only cheaper repairs). */
export const neededInstruments = (objectives: { required: boolean; action: string }[]) =>
  [...new Set(objectives.filter(o => o.required).map(o => instrumentFor[o.action as keyof typeof instrumentFor]).filter((x): x is InstrumentId => !!x))];

const same = (a: SuitDesign, b: SuitDesign) => a.battery === b.battery && a.thruster === b.thruster && a.antenna === b.antenna &&
  a.accessory === b.accessory && a.instruments.length === b.instruments.length && a.instruments.every(i => b.instruments.includes(i));

/** Up to three suggestions, most important first. */
export function recommend(r: Report, objectives: { required: boolean; action: string }[], unlocked: AccessoryId[] = []): Advice[] {
  const d = r.design, out: Advice[] = [];
  const needed = neededInstruments(objectives);
  const push = (a: Advice) => { if (out.length < 3 && !out.some(o => o.id === a.id) && (!a.design || !same(a.design, d))) out.push(a); };
  const done = r.outcome === 'complete';

  // 1. Objectives impossible with this suit: add the instrument they need.
  const lacking = [...new Set(r.missed.filter(m => m.reason === 'instrument').map(m => instrumentFor[m.action as keyof typeof instrumentFor]!))];
  if (lacking.length) {
    const fitted = fitMass({ ...d, instruments: [...new Set([...d.instruments, ...lacking])] }, needed, ['instruments']);
    const title = r.missed.filter(m => m.reason === 'instrument').map(m => m.title);
    push({ id: 'instrument', design: fitted ?? undefined,
      text: t(`Lleva ${names(lacking).es.toLowerCase()}: sin él no se puede hacer ${title.map(x => x.es).join(', ')}.${fitted ? ` Para no pasar de ${massLimit} kg la propuesta queda en ${assessSuit(fitted).mass} kg.` : ''}`,
        `Carry the ${names(lacking).en.toLowerCase()}: without it ${title.map(x => x.en).join(', ')} cannot be done.${fitted ? ` To stay under ${massLimit} kg the proposal weighs ${assessSuit(fitted).mass} kg.` : ''}`) });
  }

  // 2. Energy ran short. Cheaper repairs first, then more battery, then the biggest avoidable drain.
  const short = r.missed.filter(m => m.reason === 'power' || m.reason === 'reserve');
  if (short.length || r.emergency) {
    if (short.some(m => m.action === 'service') && !d.instruments.includes('kit')) {
      const fitted = fitMass({ ...d, instruments: [...d.instruments, 'kit'] }, [...needed, 'kit']);
      if (fitted) push({ id: 'kit', design: fitted, text: t('El kit de reparación reduce a la mitad el coste de reparar.', 'The repair kit halves the cost of repairs.') });
    }
    const up = batteryOrder[batteryOrder.indexOf(d.battery) + 1];
    if (up) {
      const fitted = fitMass({ ...d, battery: up }, needed, ['battery', ...(lacking.length ? ['instruments' as const] : [])]);
      if (fitted) {
        const s = assessSuit(fitted);
        push({ id: 'battery-up', design: fitted,
          text: t(`${batteries[up].name.es}: ${batteries[up].capacity - r.capacity} u. más. Pesa más: salto al ${pct(s.jumpFactor)} %.`,
            `${batteries[up].name.en}: ${batteries[up].capacity - r.capacity} u more. Heavier: jump at ${pct(s.jumpFactor)}%.`) });
      }
    }
    const moving = r.ledger.dash + r.ledger.thruster;
    if (moving > r.used * 0.15) push({ id: 'movement', text: t(`El dash y el doble salto costaron ${Math.round(moving)} u.: camina en los tramos llanos.`, `Dash and double jumps cost ${Math.round(moving)} u: walk on flat stretches.`) });
    if (r.ledger.cold > r.used * 0.15) {
      if (unlocked.includes('liner') && d.accessory !== 'liner') {
        const fitted = fitMass({ ...d, accessory: 'liner' }, needed, ['accessory']);
        if (fitted) push({ id: 'liner', design: fitted, text: t(`El frío costó ${Math.round(r.ledger.cold)} u.: el forro térmico lo reduce a la mitad.`, `Cold cost ${Math.round(r.ledger.cold)} u: the thermal liner halves it.`) });
      } else push({ id: 'cold', text: t(`El frío costó ${Math.round(r.ledger.cold)} u.: cruza la sombra en línea recta y sin pararte.`, `Cold cost ${Math.round(r.ledger.cold)} u: cross the shadow in a straight line without stopping.`) });
    }
    if (r.ledger.dust > r.used * 0.15) push({ id: 'dust', text: t(`El polvo costó ${Math.round(r.ledger.dust)} u.: tras la contingencia, rodea las dunas.`, `Dust cost ${Math.round(r.ledger.dust)} u: after the contingency, go around the dunes.`) });
    if (r.ledger.sun > r.used * 0.15) push({ id: 'sun', text: t(`El sol costó ${Math.round(r.ledger.sun)} u. de refrigeración: prueba la ruta en sombra.`, `Sunlight cost ${Math.round(r.ledger.sun)} u of cooling: try the shaded route.`) });
  }

  // 3. Link lost: a longer antenna.
  if (r.recalls > 0) {
    const up = antennaOrder[antennaOrder.indexOf(d.antenna) + 1];
    const fitted = up ? fitMass({ ...d, antenna: up }, needed, ['antenna']) : null;
    push(fitted ? { id: 'antenna', design: fitted, text: t(`${antennas[up].name.es}: enlace hasta ${antennas[up].radius} m.`, `${antennas[up].name.en}: link up to ${antennas[up].radius} m.`) }
      : { id: 'antenna', text: t('Vigila la barra de señal: vuelve antes de que caiga a cero.', 'Watch the signal bar: turn back before it reaches zero.') });
  }

  // 4. Mission done: optimise. Spare energy means a lighter suit; a thin margin means risk.
  if (done) {
    const spare = r.left - reserve;
    const down = batteryOrder[batteryOrder.indexOf(d.battery) - 1];
    if (down && spare > batteries[d.battery].capacity - batteries[down].capacity + 8) {
      const lighter = { ...d, battery: down }, s = assessSuit(lighter);
      push({ id: 'battery-down', design: lighter,
        text: t(`Sobraron ${Math.round(spare)} u.: con la ${batteries[down].name.es.toLowerCase()} pesas ${r.mass - s.mass} kg menos y saltas más (${pct(r.jumpFactor)} % → ${pct(s.jumpFactor)} %).`,
          `${Math.round(spare)} u to spare: the ${batteries[down].name.en.toLowerCase()} is ${r.mass - s.mass} kg lighter and jumps higher (${pct(r.jumpFactor)}% → ${pct(s.jumpFactor)}%).`) });
    }
    if (d.thruster !== 'none' && r.ledger.thruster === 0)
      push({ id: 'thruster-off', design: { ...d, thruster: 'none' },
        text: t(`No usaste el doble salto: sin propulsor el traje pesa ${thrusters[d.thruster].mass} kg menos.`, `You never double jumped: without a thruster the suit is ${thrusters[d.thruster].mass} kg lighter.`) });
    if (spare < 6) push({ id: 'thin-margin', text: t(`Llegaste con ${Math.max(0, Math.round(spare))} u. de margen: una tormenta o un desvío te habría obligado a replegarte.`, `You arrived with ${Math.max(0, Math.round(spare))} u of margin: a storm or a detour would have forced a recall.`) });
    if (!out.length) push({ id: 'balanced', text: t('Diseño equilibrado. Usa la energía sobrante en el atlas, las balizas o los ecos.', 'A balanced design. Spend the spare energy on the atlas, beacons or echoes.') });
  } else if (!out.length) push({ id: 'unvisited', text: t('El traje podía completar la misión: planifica el orden de los objetivos según la brújula.', 'The suit could complete the mission: plan the order of objectives with the compass.') });
  return out;
}

/** Saved summary of one attempt (see save/progress3d.ts). */
export type AttemptSummary = { design: SuitDesign; outcome: 'complete' | 'recalled'; completed: string[]; used: number; time: number };
export type Change = { slot: Slot; from: Localized; to: Localized };
export type Comparison = {
  changes: Change[];
  outcome: [AttemptSummary['outcome'], AttemptSummary['outcome']];
  required: [number, number]; used: [number, number]; time: [number, number];
};

const slotName = (slot: Slot, d: SuitDesign): Localized => {
  if (slot === 'battery') return batteries[d.battery].name;
  if (slot === 'thruster') return thrusters[d.thruster].name;
  if (slot === 'antenna') return antennas[d.antenna].name;
  if (slot === 'accessory') return d.accessory ? accessories[d.accessory].name : t('sin accesorio', 'no accessory');
  return names([...d.instruments].sort());
};

/** What changed between two attempts on the same destination: design slots and results. */
export function compareAttempts(prev: AttemptSummary, cur: AttemptSummary, requiredIds: string[]): Comparison {
  const changes: Change[] = [];
  for (const slot of ['battery', 'thruster', 'antenna', 'instruments', 'accessory'] as Slot[]) {
    const a = slotName(slot, prev.design), b = slotName(slot, cur.design);
    if (a.es !== b.es) changes.push({ slot, from: a, to: b });
  }
  const req = (a: AttemptSummary) => a.completed.filter(id => requiredIds.includes(id)).length;
  return { changes, outcome: [prev.outcome, cur.outcome], required: [req(prev), req(cur)], used: [prev.used, cur.used], time: [prev.time, cur.time] };
}
