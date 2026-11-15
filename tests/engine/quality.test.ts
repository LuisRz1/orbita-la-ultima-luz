import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budgetRatio, detectTier, ResolutionGovernor, tiers } from '../../src/engine/quality.ts';

test('tier detection falls back to low on constrained devices and never guesses high without evidence', () => {
  assert.equal(detectTier({ deviceMemory: 4, hardwareConcurrency: 8 }), 'low');
  assert.equal(detectTier({ deviceMemory: 8, hardwareConcurrency: 4 }), 'low');
  assert.equal(detectTier({ deviceMemory: 32, hardwareConcurrency: 16, touch: true }), 'low');
  assert.equal(detectTier({ deviceMemory: 8, hardwareConcurrency: 12 }), 'medium');
  assert.equal(detectTier({}), 'low');
  assert.equal(detectTier({ deviceMemory: 16, hardwareConcurrency: 12 }), 'high');
});

test('the pixel budget caps large displays and leaves small ones at their native ratio', () => {
  const spec = tiers.low;
  const ratio = budgetRatio(2560, 1440, 2, spec);
  assert.ok(2560 * 1440 * ratio * ratio <= spec.maxPixels + 1);
  assert.equal(budgetRatio(640, 360, 1, spec), 1);
});

test('the governor lowers resolution under sustained slow frames, stops at the floor and recovers', () => {
  const governor = new ResolutionGovernor(tiers.low);
  let changes = 0;
  for (let i = 0; i < 600; i++) if (governor.update(33)) changes++;
  assert.ok(changes > 0);
  assert.equal(governor.scale, tiers.low.minScale);
  for (let i = 0; i < 4000; i++) governor.update(10);
  assert.equal(governor.scale, 1);
});

test('a single long frame does not change the resolution', () => {
  const governor = new ResolutionGovernor(tiers.medium);
  for (let i = 0; i < 120; i++) governor.update(16.6);
  assert.equal(governor.update(400), false);
  assert.equal(governor.scale, 1);
});
