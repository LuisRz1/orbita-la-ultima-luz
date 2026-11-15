import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, drain, sortieInteract, spend, startSortie } from '../../src/core/sortie.ts';
import { actionCost, assessSuit, massLimit, proposals, reserve, suitMovement, type SuitDesign } from '../../src/core/suit.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const at = (id: string) => moonLevel.points.find(p => p.id === id)!.position;
const visit = (s: ReturnType<typeof startSortie>, id: string) => sortieInteract(moonLevel, s, at(id).x, at(id).z);

test('both proposals respect the mass limit and the full kit does not fit', () => {
  for (const p of proposals) assert.deepEqual(assessSuit(p.design).problems, [], p.id);
  const everything: SuitDesign = { battery: 'extended', thruster: 'strong', antenna: 'long', instruments: ['camera', 'drill', 'kit'] };
  assert.ok(assessSuit(everything).mass > massLimit);
  assert.equal(assessSuit(everything).problems.length, 1);
});

test('mass lowers the jump and the thruster decides air jumps', () => {
  const heavy = assessSuit(proposals[1].design), light = assessSuit({ battery: 'light', thruster: 'none', antenna: 'short', instruments: ['camera'] });
  assert.ok(suitMovement(defaultParams, heavy).jumpSpeed < suitMovement(defaultParams, light).jumpSpeed);
  assert.equal(suitMovement(defaultParams, light).airJumps, 0);
  assert.equal(suitMovement(defaultParams, heavy).airJumps, 1);
});

test('every required objective fits in both proposals with the reserve and three minutes of life support', () => {
  for (const p of proposals) {
    const required = moonLevel.points.filter(q => q.required).reduce((sum, q) => sum + actionCost(q.power, q.action, p.design), 0);
    assert.ok(required + reserve + 180 * 0.16 <= assessSuit(p.design).capacity, `${p.id}: ${required}`);
  }
});

test('a suit without the drill cannot recover the cache and the report names that decision', () => {
  const s = startSortie({ battery: 'extended', thruster: 'none', antenna: 'medium', instruments: ['camera', 'kit'] });
  for (const id of ['sample', 'relay']) assert.equal(visit(s, id).ok, true, id);
  const archive = visit(s, 'archive');
  assert.equal(archive.ok, false);
  assert.equal(!archive.ok && archive.error, 'instrument');
  assert.equal(visit(s, 'terminal').ok, false);
  const report = buildReport(moonLevel, s);
  assert.equal(report.outcome, 'recalled');
  assert.match(report.missed.find(m => m.id === 'archive')!.cause.es, /taladro/i);
});

test('the reserve is never spent on actions, and the report blames the energy', () => {
  const s = startSortie(proposals[0].design);
  spend(s, 'move', s.energy - reserve - 5);
  const relay = visit(s, 'relay');
  assert.equal(!relay.ok && relay.error, 'power');
  assert.ok(s.energy >= reserve);
  assert.match(buildReport(moonLevel, s).missed.find(m => m.id === 'relay')!.cause.es, /reserva/);
});

test('a complete sortie ends at the terminal with every required point, and cold drains extra', () => {
  const s = startSortie(proposals[1].design);
  for (const id of ['sample', 'archive', 'relay', 'terminal']) assert.equal(visit(s, id).ok, true, id);
  assert.equal(s.outcome, 'complete');
  const before = s.energy;
  drain(s, moonLevel, 1, false, 'shadow');
  assert.ok(before - s.energy > 0.6);
  const report = buildReport(moonLevel, s);
  assert.equal(report.requiredDone, report.required);
  assert.equal(report.missed.length, 0);
});

test('the repair kit halves the relay cost', () => {
  const relay = moonLevel.points.find(p => p.id === 'relay')!;
  assert.equal(actionCost(relay.power, 'service', proposals[0].design), actionCost(relay.power, 'service', proposals[1].design) / 2);
});
