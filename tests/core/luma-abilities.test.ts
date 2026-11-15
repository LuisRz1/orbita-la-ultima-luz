import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cooldownLeft, createAbilities, fetchReach, glowRelief, hazardAhead, highEcho, lumaStages, sniffTarget, trail, trailLength,
} from '../../src/core/luma-abilities.ts';
import { buildHeightfield, heightAt } from '../../src/core/heightfield.ts';
import { createSession } from '../../src/core/session.ts';
import { buildReport, drain, startSortie } from '../../src/core/sortie.ts';
import { proposals } from '../../src/core/suit.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';
import { marsLevel } from '../../src/levels/mars/level.ts';

const none = { echoes: [], ruins: [], atlas: [], beacons: [] };
const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);
const ground = (x: number, z: number) => heightAt(hf, x, z);

test('wear follows the story: later chapters wait longer and glow less, and the extraction cannot fetch', () => {
  const order = (['orbit', 'moon', 'mars', 'bennu', 'extraction'] as const).map(id => lumaStages[id]);
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i].cooldown > order[i - 1].cooldown);
    assert.ok(order[i].glow < order[i - 1].glow);
  }
  assert.equal(createAbilities('extraction').fetchesLeft, 0);
  const a = createAbilities('moon');
  assert.equal(cooldownLeft(a, 0), 0);
  a.readyAt = 20;
  assert.equal(cooldownLeft(a, 5), 15);
});

test('the sniff leads to the closest thing left and falls back to a doable objective, never a locked one', () => {
  const { x, z } = moonLevel.spawn;
  const first = sniffTarget(moonLevel, none, createSession(), x, z)!;
  assert.ok(first);
  assert.notEqual(first.kind, 'goal');
  const everything = {
    echoes: moonLevel.collectibles.map(c => c.id), ruins: (moonLevel.ruins ?? []).map(r => r.id),
    atlas: (moonLevel.specimens ?? []).map(s => s.id), beacons: (moonLevel.beacons?.posts ?? []).map(p => p.id),
  };
  const goal = sniffTarget(moonLevel, everything, createSession(), x, z)!;
  assert.equal(goal.kind, 'goal');
  assert.notEqual(goal.id, moonLevel.exit, 'the terminal needs every other objective first');
  const done = createSession();
  done.completed = moonLevel.points.map(p => p.id);
  assert.equal(sniffTarget(moonLevel, everything, done, x, z), null);
});

test('the trail runs straight toward the target and stops at its maximum length', () => {
  const marks = trail({ x: 0, z: 0 }, { x: 0, z: 10 }, 2);
  assert.deepEqual(marks.map(m => m.z), [2, 4, 6, 8, 10]);
  const long = trail({ x: 0, z: 0 }, { x: 300, z: 0 }, 1.6);
  assert.ok(long.at(-1)!.x <= trailLength + 1e-6);
  assert.deepEqual(trail({ x: 0, z: 0 }, { x: 1, z: 0 }, 1.6), []);
});

test('a fetch is only for an echo on a ledge, close by, and out of reach standing', () => {
  const high = moonLevel.collectibles.find(c => c.y !== undefined && c.y - ground(c.position.x, c.position.z) > 2.5)!;
  assert.ok(high, 'the Moon has echoes on top of props');
  const { x, z } = high.position, y = ground(x + 3, z);
  assert.equal(highEcho(moonLevel, [], x + 3, y, z, ground)?.id, high.id);
  assert.equal(highEcho(moonLevel, [high.id], x + 3, y, z, ground)?.id === high.id, false);
  assert.equal(highEcho(moonLevel, [], x + fetchReach + 4, y, z, ground)?.id === high.id, false);
  // Standing on the ledge it is no longer out of reach.
  assert.equal(highEcho(moonLevel, [], x, high.y! - 0.9, z, ground)?.id === high.id, false);
});

test('the glow only warms in cold, only close by, and the report counts what it spared', () => {
  const stage = lumaStages.moon;
  assert.equal(glowRelief(stage, 'cold', 2, true), stage.glow);
  assert.equal(glowRelief(stage, undefined, 2, true), stage.glow);
  assert.equal(glowRelief(stage, 'cold', 9, true), 0);
  assert.equal(glowRelief(stage, 'cold', 2, false), 0);
  assert.equal(glowRelief(stage, 'dust', 1, true), 0);
  assert.equal(glowRelief(stage, 'sun', 1, true), 0);

  const design = proposals[0].design;
  const plain = startSortie(design), warmed = startSortie(design);
  for (let i = 0; i < 600; i++) { drain(plain, moonLevel, 1 / 60, false, 'shadow'); drain(warmed, moonLevel, 1 / 60, false, 'shadow', stage.glow); }
  assert.ok(warmed.ledger.cold < plain.ledger.cold);
  assert.ok(Math.abs(warmed.ledger.cold - plain.ledger.cold * (1 - stage.glow)) < 1e-6);
  assert.ok(Math.abs(warmed.lumaWarmth - plain.ledger.cold * stage.glow) < 1e-6);
  // Life support is untouched: the suit still matters.
  assert.equal(warmed.ledger.life, plain.ledger.life);
  assert.ok(buildReport(moonLevel, warmed).insights.some(i => i.en.includes('LUMA')));
  assert.ok(!buildReport(moonLevel, plain).insights.some(i => i.en.includes('LUMA')));
});

test('LUMA bristles once when the player heads into a draining zone, not when walking away', () => {
  const shadow = moonLevel.zones.find(z => z.id === 'shadow')!;
  const x = shadow.center.x - shadow.radius - 5, z = shadow.center.z;
  assert.equal(hazardAhead(moonLevel, [], [], x, z, 3, 0)?.id, 'shadow');
  assert.equal(hazardAhead(moonLevel, [], [], x, z, -3, 0), null);
  assert.equal(hazardAhead(moonLevel, [], ['shadow'], x, z, 3, 0), null);
  assert.equal(hazardAhead(moonLevel, [], [], x, z, 0, 0), null);
  // Mars: the dunes drain from the start; the storm makes them worse but they warn only once.
  const dunes = marsLevel.zones.find(q => q.id === 'dunes')!;
  assert.equal(hazardAhead(marsLevel, [], [], dunes.center.x, dunes.center.z - dunes.radius - 4, 0, 3)?.id, 'dunes');
});
