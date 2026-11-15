import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruinInReach } from '../../src/core/ruins.ts';
import { unlocks } from '../../src/core/achievements.ts';
import { walkable } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const ruins = moonLevel.ruins!;

test('the three lunar ruins have entrances reachable on foot', () => {
  assert.equal(ruins.length, 3);
  const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);
  const reach = walkable(hf, moonLevel.spawn, defaultParams.maxSlope);
  const step = hf.size / (hf.res - 1);
  for (const r of ruins) assert.equal(reach[Math.round((r.entrance.z + hf.size / 2) / step) * hf.res + Math.round((r.entrance.x + hf.size / 2) / step)], 1, r.id);
});

test('journal pages keep the story rules: no LUMA, no later destination, no field log', () => {
  for (const r of ruins) for (const text of [r.page.text.es, r.page.text.en])
    assert.doesNotMatch(text, /LUMA|Marte|Mars|Bennu|registro de campo|field log/i, r.id);
});

test('a ruin leaves reach once opened, and pages unlock their achievements', () => {
  const r = ruins[0];
  assert.equal(ruinInReach(moonLevel, [], r.entrance.x, r.entrance.z)?.id, r.id);
  assert.equal(ruinInReach(moonLevel, [r.id], r.entrance.x, r.entrance.z), null);
  assert.deepEqual(unlocks({ kind: 'page', found: 1, total: 3 }, []), ['first-page']);
  assert.deepEqual(unlocks({ kind: 'page', found: 3, total: 3 }, ['first-page']), ['all-pages']);
});
