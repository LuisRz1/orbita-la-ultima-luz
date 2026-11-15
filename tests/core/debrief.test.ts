import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, drain, sortieInteract, spend, startSortie, traceLimit } from '../../src/core/sortie.ts';
import { compareAttempts, decisionLinks, fitMass, neededInstruments, recommend } from '../../src/core/debrief.ts';
import { assessSuit, proposals, reserve, type SuitDesign } from '../../src/core/suit.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const at = (id: string) => moonLevel.points.find(p => p.id === id)!.position;
const visit = (s: ReturnType<typeof startSortie>, id: string) => sortieInteract(moonLevel, s, at(id).x, at(id).z);
const objectives = moonLevel.points.map(p => ({ required: p.required, action: p.action }));
const noDrill: SuitDesign = { battery: 'standard', thruster: 'compact', antenna: 'medium', instruments: ['camera', 'kit'] };

test('the trace records the battery over time, marks objectives and the reserve, and stays bounded', () => {
  const s = startSortie(proposals[1].design);
  for (let i = 0; i < 20; i++) drain(s, moonLevel, 0.5, true, null);
  assert.ok(visit(s, 'sample').ok);
  const zone = moonLevel.zones.find(z => z.drain)!;
  drain(s, moonLevel, 0.5, true, zone.id);
  spend(s, 'move', s.energy - reserve);
  drain(s, moonLevel, 0.5, false, zone.id);
  const r = buildReport(moonLevel, s);
  assert.equal(r.trace[0].e, s.stats.capacity);
  assert.ok(r.trace.length > 5);
  for (let i = 1; i < r.trace.length; i++) assert.ok(r.trace[i].t >= r.trace[i - 1].t);
  assert.deepEqual(r.marks.map(m => m.kind), ['point', 'hazard', 'reserve']);
  assert.equal(r.marks[0].id, 'sample');
  // A very long sortie halves its sampling instead of growing without limit.
  for (let i = 0; i < 3000; i++) drain(s, moonLevel, 1, false, null);
  assert.ok(s.trace.length <= traceLimit + 1);
  assert.ok(s.traceStep > 1);
});

test('missing an instrument is linked to the suit and the advice loads a valid suit that carries it', () => {
  const s = startSortie(noDrill);
  for (const id of ['sample', 'relay', 'archive']) visit(s, id);
  const r = buildReport(moonLevel, s);
  assert.equal(r.missed.find(m => m.id === 'archive')?.reason, 'instrument');
  const links = decisionLinks(r);
  assert.equal(links.find(l => l.slot === 'instruments')?.tone, 'bad');
  const advice = recommend(r, objectives);
  assert.equal(advice[0].id, 'instrument');
  assert.ok(advice[0].design!.instruments.includes('drill'));
  assert.deepEqual(assessSuit(advice[0].design!).problems, []);
  assert.ok(advice.length <= 3);
});

test('running out of energy suggests a bigger battery that still fits under the mass limit', () => {
  const s = startSortie(noDrill);
  visit(s, 'sample');
  spend(s, 'move', s.energy - reserve);
  drain(s, moonLevel, 0.1, false, null);
  const r = buildReport(moonLevel, s);
  const up = recommend(r, objectives).find(a => a.id === 'battery-up');
  assert.ok(up?.design);
  assert.equal(up.design.battery, 'extended');
  assert.deepEqual(assessSuit(up.design).problems, []);
  assert.equal(decisionLinks(r).find(l => l.slot === 'battery')?.tone, 'bad');
});

test('a completed sortie with plenty to spare proposes a lighter battery and flags an unused thruster', () => {
  const s = startSortie(proposals[1].design);
  for (const id of ['sample', 'archive', 'relay', 'terminal']) assert.ok(visit(s, id).ok, id);
  const r = buildReport(moonLevel, s);
  const ids = recommend(r, objectives).map(a => a.id);
  assert.ok(ids.includes('battery-down'));
  assert.ok(ids.includes('thruster-off'));
  for (const a of recommend(r, objectives)) if (a.design) assert.deepEqual(assessSuit(a.design).problems, [], a.id);
});

test('fitMass keeps the requested slot, drops unneeded instruments first and never upgrades anything', () => {
  const heavy: SuitDesign = { battery: 'extended', thruster: 'compact', antenna: 'medium', instruments: ['camera', 'drill', 'kit'] };
  const fitted = fitMass(heavy, neededInstruments(objectives), ['battery'])!;
  assert.equal(fitted.battery, 'extended');
  assert.deepEqual(fitted.instruments, ['camera', 'drill']);
  const short = fitMass({ battery: 'light', thruster: 'none', antenna: 'short', instruments: [] }, []);
  assert.equal(short!.antenna, 'short');
});

test('comparing two attempts lists only the slots that changed and the results side by side', () => {
  const required = moonLevel.points.filter(p => p.required).map(p => p.id);
  const c = compareAttempts(
    { design: noDrill, outcome: 'recalled', completed: ['sample', 'relay'], used: 79, time: 300 },
    { design: { ...proposals[1].design, instruments: ['drill', 'camera'] }, outcome: 'complete', completed: ['sample', 'archive', 'relay', 'terminal'], used: 52, time: 260 },
    required);
  assert.deepEqual(c.changes.map(x => x.slot), ['battery', 'instruments']);
  assert.deepEqual(c.required, [2, 4]);
  assert.deepEqual(c.outcome, ['recalled', 'complete']);
});
