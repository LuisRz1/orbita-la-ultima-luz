import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beaconCost, beaconInReach } from '../../src/core/beacons.ts';
import { unlocks } from '../../src/core/achievements.ts';
import { walkable } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { proposals } from '../../src/core/suit.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const posts = moonLevel.beacons!.posts;

test('the four Aurora beacons stand on walkable ground', () => {
  assert.equal(posts.length, 4);
  const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);
  const reach = walkable(hf, moonLevel.spawn, defaultParams.maxSlope);
  const step = hf.size / (hf.res - 1);
  for (const p of posts) assert.equal(reach[Math.round((p.position.z + hf.size / 2) / step) * hf.res + Math.round((p.position.x + hf.size / 2) / step)], 1, p.id);
});

test('a beacon costs two units, one with the repair kit, and leaves reach once lit', () => {
  assert.equal(beaconCost({ ...proposals[0].design, instruments: [] }), 2);
  assert.equal(beaconCost({ ...proposals[0].design, instruments: ['kit'] }), 1);
  const p = posts[0];
  assert.equal(beaconInReach(moonLevel, [], p.position.x + 1, p.position.z)?.id, p.id);
  assert.equal(beaconInReach(moonLevel, [p.id], p.position.x, p.position.z), null);
  assert.deepEqual(unlocks({ kind: 'beacon', lit: 3, total: 4 }, []), []);
  assert.deepEqual(unlocks({ kind: 'beacon', lit: 4, total: 4 }, []), ['beacons']);
});
