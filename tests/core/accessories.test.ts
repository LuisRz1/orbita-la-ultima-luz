import { test } from 'node:test';
import assert from 'node:assert/strict';
import { designSchema, proposals, suitMass, unlockedAccessories } from '../../src/core/suit.ts';
import { drain, startSortie } from '../../src/core/sortie.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const base = proposals[1].design;

test('the accessory slot is optional: old designs stay valid and weigh the same', () => {
  assert.deepEqual(designSchema.parse(base), base);
  assert.equal(suitMass({ ...base, accessory: 'liner' }), suitMass(base) + 2);
  assert.ok(proposals.every(p => !p.design.accessory));
});

test('accessories unlock only from their ruins', () => {
  assert.deepEqual(unlockedAccessories([]), []);
  assert.deepEqual(unlockedAccessories(['ruin-shelter']), ['liner']);
  assert.deepEqual(unlockedAccessories(['ruin-shelter', 'ruin-dish', 'ruin-tube']), ['liner', 'wrist-panel']);
});

test('the thermal liner halves the cold drain in the shadowed crater', () => {
  const plain = startSortie(base), lined = startSortie({ ...base, accessory: 'liner' });
  for (let i = 0; i < 600; i++) { drain(plain, moonLevel, 1 / 60, false, 'shadow'); drain(lined, moonLevel, 1 / 60, false, 'shadow'); }
  assert.ok(Math.abs(lined.ledger.cold - plain.ledger.cold / 2) < 1e-6);
});

test('the wrist panel offsets most of life support standing still out of shadow, never in it, never above capacity', () => {
  const s = startSortie({ ...base, accessory: 'wrist-panel' }), plain = startSortie(base);
  s.energy = plain.energy = 50;
  for (let i = 0; i < 600; i++) { drain(s, moonLevel, 1 / 60, false, 'landing'); drain(plain, moonLevel, 1 / 60, false, 'landing'); }
  assert.ok(Math.abs((50 - s.energy) - (50 - plain.energy) * (0.03 / 0.08)) < 1e-6, 'net 0.03 u/s: ' + s.energy);
  const cold = startSortie({ ...base, accessory: 'wrist-panel' });
  cold.energy = 50;
  for (let i = 0; i < 600; i++) drain(cold, moonLevel, 1 / 60, false, 'shadow');
  assert.ok(cold.energy < 50);
  const full = startSortie({ ...base, accessory: 'wrist-panel' });
  for (let i = 0; i < 600; i++) drain(full, moonLevel, 1 / 60, false, 'landing');
  assert.ok(full.energy <= full.stats.capacity);
});
