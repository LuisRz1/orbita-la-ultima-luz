import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLevel, walkable } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield, slopeAt } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';
import { landmarks } from '../../src/levels/moon/terrain.ts';

const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);

test('the lunar level passes its checks: points placed, required ones reachable on foot', () => {
  assert.deepEqual(checkLevel(moonLevel, hf, defaultParams.maxSlope), []);
});

test('the crater rim and the summit cliff are too steep to walk, the summit ramp is not', () => {
  assert.ok(slopeAt(hf, 0, 104) > defaultParams.maxSlope, 'rim');
  assert.ok(slopeAt(hf, 9, 9) > defaultParams.maxSlope, 'summit cliff');
  assert.ok(slopeAt(hf, -6, 6) < defaultParams.maxSlope, 'summit ramp');
});

test('the rift cannot be walked straight across but can be walked around', () => {
  const reach = walkable(hf, moonLevel.spawn, defaultParams.maxSlope);
  const step = hf.size / (hf.res - 1);
  const at = (x: number, z: number) => reach[Math.round((z + hf.size / 2) / step) * hf.res + Math.round((x + hf.size / 2) / step)];
  assert.equal(at(0, landmarks.riftZ - 12), 1, 'far side reachable');
  const wall = slopeAt(hf, 0, landmarks.riftZ - 8);
  assert.ok(wall > defaultParams.maxSlope, 'rift wall ' + wall);
});

test('every v1 lunar point has a 3D placement and keeps its rules', () => {
  assert.equal(moonLevel.points.length, 6);
  const relay = moonLevel.points.find(p => p.id === 'relay')!;
  assert.equal(relay.power, 6);
  assert.equal(relay.required, true);
});
