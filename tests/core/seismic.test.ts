import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seismicAction } from '../../src/core/seismic.ts';
import { unlocks } from '../../src/core/achievements.ts';
import { walkable } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

const net = moonLevel.seismic!;

test('the crate and the three geophone sites are reachable on foot', () => {
  const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);
  const reach = walkable(hf, moonLevel.spawn, defaultParams.maxSlope);
  const step = hf.size / (hf.res - 1);
  for (const p of [net.pickup, ...net.sites.map(s => s.position)])
    assert.equal(reach[Math.round((p.z + hf.size / 2) / step) * hf.res + Math.round((p.x + hf.size / 2) / step)], 1, `${p.x}, ${p.z}`);
});

test('pick up as many geophones as sites remain, plant only while carrying, nothing once complete', () => {
  const { x, z } = net.pickup;
  assert.deepEqual(seismicAction(moonLevel, [], 0, x, z), { kind: 'pickup', count: 3 });
  assert.deepEqual(seismicAction(moonLevel, ['geophone-west'], 0, x, z), { kind: 'pickup', count: 2 });
  assert.equal(seismicAction(moonLevel, [], 3, x, z), null);
  const site = net.sites[0].position;
  assert.equal(seismicAction(moonLevel, [], 0, site.x, site.z), null);
  assert.deepEqual(seismicAction(moonLevel, [], 1, site.x, site.z), { kind: 'plant', site: 'geophone-west' });
  assert.equal(seismicAction(moonLevel, net.sites.map(s => s.id), 2, site.x, site.z), null);
  assert.match(net.card.source.url, /^https:\/\/www\.nasa\.gov\//);
  assert.deepEqual(unlocks({ kind: 'seismic', planted: 3, total: 3 }, []), ['seismic']);
});
