import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { arrivalShot } from '../../src/engine/cinematic.ts';
import { buildHeightfield, heightAt } from '../../src/core/heightfield.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';

test('the arrival shot starts high, never dips into the terrain and ends where the sortie camera begins', () => {
  const hf = buildHeightfield(moonLevel.terrain.size, moonLevel.terrain.res, moonLevel.terrain.height);
  const h = (x: number, z: number) => heightAt(hf, x, z);
  const { x, z } = moonLevel.spawn;
  const player = new Vector3(x, h(x, z), z);
  const lander = moonLevel.props.find(p => p.kind === 'lander')!.solid;
  const end = new Vector3(x, player.y + 1.5 + Math.sin(0.32) * 6.4, z + Math.cos(0.32) * 6.4);
  const shot = arrivalShot(player, 0, end, new Vector3(lander.x, h(lander.x, lander.z), lander.z), h);
  const frame = { position: new Vector3(), look: new Vector3(), focus: 0 };
  shot.at(0, frame);
  assert.ok(frame.position.y > player.y + 20, 'opens from above');
  for (let t = 0; t <= shot.duration; t += 0.1) {
    shot.at(t, frame);
    assert.ok(frame.position.y > h(frame.position.x, frame.position.z) + 0.5, `above ground at ${t.toFixed(1)} s`);
    assert.ok(frame.focus > 0);
  }
  shot.at(shot.duration, frame);
  assert.ok(frame.position.distanceTo(end) < 1e-3, 'hands over to the sortie camera');
  assert.ok(frame.look.distanceTo(new Vector3(x, player.y + 1.4, z)) < 1e-3, 'ends looking at the player');
});
