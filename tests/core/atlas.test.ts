import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canScan, scanCost, specimenInReach } from '../../src/core/atlas.ts';
import { unlocks } from '../../src/core/achievements.ts';
import { walkable } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { progressSchema } from '../../src/core/save/progress3d.ts';
import { proposals } from '../../src/core/suit.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const rocks = moonLevel.specimens!;

test('the lunar atlas has six sourced rocks, each reachable on foot', () => {
  assert.equal(rocks.length, 6);
  const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);
  const reach = walkable(hf, moonLevel.spawn, defaultParams.maxSlope);
  const step = hf.size / (hf.res - 1);
  for (const r of rocks) {
    assert.match(r.source.url, /^https:\/\/[a-z.]*nasa\.gov\//, r.id);
    assert.ok(r.fact.es && r.fact.en, r.id);
    assert.equal(reach[Math.round((r.position.z + hf.size / 2) / step) * hf.res + Math.round((r.position.x + hf.size / 2) / step)], 1, 'on foot: ' + r.id);
  }
});

test('a rock is in reach only nearby and only until it is catalogued', () => {
  const r = rocks[0];
  assert.equal(specimenInReach(moonLevel, [], r.position.x + 1, r.position.z)?.id, r.id);
  assert.equal(specimenInReach(moonLevel, [], r.position.x + 6, r.position.z), null);
  assert.equal(specimenInReach(moonLevel, [r.id], r.position.x, r.position.z), null);
});

test('scanning needs the spectral camera and one unit above the reserve', () => {
  const withCamera = { ...proposals[0].design, instruments: ['camera' as const] };
  assert.deepEqual(canScan(withCamera, scanCost), { ok: true });
  assert.deepEqual(canScan(withCamera, scanCost - 0.1), { ok: false, error: 'power' });
  assert.deepEqual(canScan({ ...withCamera, instruments: [] }, 50), { ok: false, error: 'instrument' });
});

test('atlas achievements and old saves without an atlas', () => {
  assert.deepEqual(unlocks({ kind: 'atlas', found: 1, total: 6 }, []), ['first-rock']);
  assert.deepEqual(unlocks({ kind: 'atlas', found: 6, total: 6 }, ['first-rock']), ['full-atlas']);
  const old = { version: 1, level: 'moon', design: proposals[0].design, attempts: [], echoes: [], achievements: [], seen: [] };
  assert.deepEqual(progressSchema.parse(old).atlas, []);
});
