import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLevel, walkable } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield, heightAt } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { bennuLevel } from '../../src/levels/bennu/level.ts';
import { bennuDialogue } from '../../src/levels/bennu/dialogue.ts';
import { landmarks } from '../../src/levels/bennu/terrain.ts';

const hf = buildHeightfield(bennuLevel.terrain.size, bennuLevel.terrain.res, bennuLevel.terrain.height);

test('Bennu passes its checks: points placed, required ones reachable on foot', () => {
  assert.deepEqual(checkLevel(bennuLevel, hf, defaultParams.maxSlope), []);
});

test('chapter 4 order: anchor, then voice, then the site; the refuge closes AUR-E06', () => {
  const byId = (id: string) => bennuLevel.points.find(p => p.id === id)!;
  assert.deepEqual(byId('voice').prerequisites, ['anchor']);
  for (const id of ['access-east', 'access-west', 'sample', 'archive']) assert.deepEqual(byId(id).prerequisites, ['voice'], id);
  assert.equal(bennuLevel.exit, 'refuge');
  assert.match(byId('refuge').result.es, /AUR-E06/);
  assert.equal(bennuLevel.collectibles.length, 8);
});

test('microgravity is stylised but slower than the Moon, and the anchor line caps the height', () => {
  assert.ok(bennuLevel.movement!.gravityUp! < defaultParams.gravityUp);
  assert.ok(bennuLevel.movement!.runSpeed! < defaultParams.runSpeed);
  assert.ok(bennuLevel.tether! > 0);
});

test('the ground curves away from the centre (fake curvature) and the monolith top is reachable on foot', () => {
  assert.ok(heightAt(hf, 0, 110) < heightAt(hf, 0, 60) - 10);
  const reach = walkable(hf, bennuLevel.spawn, defaultParams.maxSlope);
  const step = hf.size / (hf.res - 1);
  const p = bennuLevel.points.find(q => q.id === 'overlook')!.position;
  assert.equal(reach[Math.round((p.z + hf.size / 2) / step) * hf.res + Math.round((p.x + hf.size / 2) / step)], 1);
  assert.ok(heightAt(hf, landmarks.monolith.x, landmarks.monolith.z) > heightAt(hf, 0, 40) + 5);
});

test('LUMA and Control never spoil the incident; the sister speaks only after AUR-E06', () => {
  for (const [key, lines] of Object.entries(bennuDialogue)) for (const line of lines) {
    assert.doesNotMatch(line.text.es + line.text.en, /sacrificio|sacrifice|morir|die\b|adiós|goodbye/i, key);
    if (line.speaker === 'AURORA') assert.equal(key, 'complete');
  }
});
