import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLevel } from '../../src/core/contract/level-v2.ts';
import { buildHeightfield } from '../../src/core/heightfield.ts';
import { defaultParams } from '../../src/core/movement.ts';
import { extractionLevel } from '../../src/levels/extraction/level.ts';
import { extractionDialogue, farewell } from '../../src/levels/extraction/dialogue.ts';
import { gatherMemories } from '../../src/levels/memories.ts';
import { emptyProgress } from '../../src/core/save/progress3d.ts';
import { proposals } from '../../src/core/suit.ts';

const hf = buildHeightfield(extractionLevel.terrain.size, extractionLevel.terrain.res, extractionLevel.terrain.height);

test('the extraction passes its checks and keeps the M04-M05 order', () => {
  assert.deepEqual(checkLevel(extractionLevel, hf, defaultParams.maxSlope), []);
  const byId = (id: string) => extractionLevel.points.find(p => p.id === id)!;
  assert.deepEqual(byId('life-support').prerequisites, ['boarding']);
  assert.deepEqual(byId('undock').prerequisites.sort(), ['cargo', 'life-support', 'reserves']);
  assert.equal(extractionLevel.exit, 'safe-bay');
  assert.equal(extractionLevel.carryAfter, 'undock');
  assert.equal(extractionLevel.farewell, true);
});

test('LUMA chooses the duct itself: the incident blames nobody and offers no false choice', () => {
  const text = extractionDialogue['point:undock'].map(l => l.text.es).join(' ');
  assert.match(text, /Quiero hacerlo/);
  assert.doesNotMatch(text, /culpa|por tu culpa|si hubieras/i);
});

test('the farewell recalls only real memories, at most two, and always ends the same way', () => {
  const empty = farewell(gatherMemories([]));
  assert.match(empty.map(l => l.text.es).join(' '), /Estuvimos/);
  const moon = { ...emptyProgress('moon', proposals[0].design), ruins: ['ruin-dish'], beacons: ['b1', 'b2', 'b3', 'b4'], atlas: ['a'], echoes: ['e'] };
  const full = farewell(gatherMemories([moon]));
  const lumaMemories = full.slice(1, -4);
  assert.equal(lumaMemories.length, 2);
  assert.match(lumaMemories[0].text.es, /pulgar/);
  for (const lines of [empty, full]) {
    assert.equal(lines.at(-1)!.speaker, 'CONTROL');
    assert.equal(lines.at(-2)!.speaker, 'AURORA');
  }
});
