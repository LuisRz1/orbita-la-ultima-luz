import { test } from 'node:test';
import assert from 'node:assert/strict';
import { earnedPatches } from '../../src/core/patches.ts';

test('patches come only from their side content', () => {
  assert.deepEqual(earnedPatches([], []), []);
  assert.deepEqual(earnedPatches(['seismic'], []), ['sismo']);
  assert.deepEqual(earnedPatches(['beacons', 'first-dash'], ['ruin-tube']), ['faro', 'grieta']);
});
