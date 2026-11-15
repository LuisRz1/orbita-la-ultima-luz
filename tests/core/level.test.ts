import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLevel, walkable, zoneDrain } from '../../src/core/contract/level-v2.ts';
import { marsLevel } from '../../src/levels/mars/level.ts';
import { orbitLevel } from '../../src/levels/orbit/level.ts';
import { deckMask, voidDepth } from '../../src/levels/orbit/terrain.ts';
import { channelZ, landmarks as marsLandmarks } from '../../src/levels/mars/terrain.ts';
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

const marsHf = buildHeightfield(marsLevel.terrain.size, marsLevel.terrain.res, marsLevel.terrain.height);
const marsReach = walkable(marsHf, marsLevel.spawn, defaultParams.maxSlope);
const marsAt = (x: number, z: number) => {
  const step = marsHf.size / (marsHf.res - 1);
  return marsReach[Math.round((z + marsHf.size / 2) / step) * marsHf.res + Math.round((x + marsHf.size / 2) / step)];
};

test('the Martian level passes its checks: points placed, required ones reachable on foot', () => {
  assert.deepEqual(checkLevel(marsLevel, marsHf, defaultParams.maxSlope), []);
});

test('the dry channel cannot be walked straight across, but the fords at both ends can', () => {
  const wall = slopeAt(marsHf, 0, channelZ(0) - 7.2);
  assert.ok(wall > defaultParams.maxSlope, 'channel wall ' + wall);
  assert.equal(marsAt(0, channelZ(0) - 14), 1, 'far bank reachable by going around');
  for (const x of [-62, 64]) assert.ok(slopeAt(marsHf, x, channelZ(x)) < defaultParams.maxSlope, 'ford at ' + x);
});

test('the mesa cliff is too steep to walk, its south-west ramp is not, and the overlook is reachable', () => {
  assert.ok(slopeAt(marsHf, marsLandmarks.mesa.x + 14.2, marsLandmarks.mesa.z) > defaultParams.maxSlope, 'east cliff');
  assert.ok(slopeAt(marsHf, marsLandmarks.mesa.x - 10, marsLandmarks.mesa.z + 12) < defaultParams.maxSlope, 'ramp');
  const overlook = marsLevel.points.find(p => p.id === 'mesa')!;
  assert.equal(marsAt(overlook.position.x, overlook.position.z), 1, 'overlook on foot');
});

test('the Martian mission keeps chapter 3 rules: free M04/M05 order, a contingency after the relay and one exit', () => {
  const byId = (id: string) => marsLevel.points.find(p => p.id === id)!;
  assert.deepEqual(byId('logbook').prerequisites, ['habitat']);
  for (const id of ['outcrop', 'field-kit', 'relay']) assert.deepEqual(byId(id).prerequisites, [], id);
  assert.equal(marsLevel.points.filter(p => p.action === 'upload').length, 1);
  const dunes = marsLevel.zones.find(z => z.id === 'dunes')!;
  assert.equal(zoneDrain(dunes, []), 0.3);
  assert.equal(zoneDrain(dunes, ['relay']), 1.6);
  assert.equal(marsLevel.collectibles.length, 8);
});

const orbitHf = buildHeightfield(orbitLevel.terrain.size, orbitLevel.terrain.res, orbitLevel.terrain.height);

test('the chapter 1 station passes its checks: every required point on a deck and reachable on foot', () => {
  assert.deepEqual(checkLevel(orbitLevel, orbitHf, defaultParams.maxSlope), []);
  for (const p of orbitLevel.points) assert.ok(deckMask(p.position.x, p.position.z) > 0.99, 'on deck: ' + p.id);
  // Every prop except the solar wings (which hang over the void) stands on fully flat deck.
  for (const pr of orbitLevel.props) if (pr.kind !== 'panel') assert.ok(deckMask(pr.solid.x, pr.solid.z) > 0.99, `prop ${pr.kind} at ${pr.solid.x}, ${pr.solid.z}`);
});

test('the station decks are joined without gaps and the void is far below the tether limit', () => {
  const reach = walkable(orbitHf, orbitLevel.spawn, defaultParams.maxSlope);
  const step = orbitHf.size / (orbitHf.res - 1);
  const at = (x: number, z: number) => reach[Math.round((z + orbitHf.size / 2) / step) * orbitHf.res + Math.round((x + orbitHf.size / 2) / step)];
  // Both routes to the recorder are walkable: the sunlit truss and the shaded handrail through the cradle.
  for (const [x, z] of [[0, -15], [-37, -28], [-20, -72], [-36, 22], [-30, 60]]) assert.equal(at(x, z), 1, `deck at ${x}, ${z}`);
  assert.equal(at(20, 0), 0, 'void beside the truss');
  assert.ok(orbitLevel.fallLimit! > voidDepth);
});

test('chapter 1: LUMA joins at the protected bay, the sun costs battery and the airlock closes everything', () => {
  const byId = (id: string) => orbitLevel.points.find(p => p.id === id)!;
  assert.equal(orbitLevel.companionAfter, 'protected-bay');
  assert.deepEqual(byId('protected-bay').prerequisites, ['capsule']);
  assert.deepEqual(byId('recorder').prerequisites, ['sun-record']);
  const sunlit = orbitLevel.zones.find(z => z.id === 'sunlit')!;
  assert.equal(sunlit.hazard, 'sun');
  assert.ok(zoneDrain(sunlit, []) > 0);
  assert.equal(orbitLevel.exit, 'airlock');
  assert.equal(orbitLevel.collectibles.length, 8);
});

test('every v1 lunar point has a 3D placement and keeps its rules', () => {
  assert.equal(moonLevel.points.length, 6);
  const relay = moonLevel.points.find(p => p.id === 'relay')!;
  assert.equal(relay.power, 6);
  assert.equal(relay.required, true);
});
