import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlocks } from '../../src/core/achievements.ts';
import { buildReport, sortieInteract, spend, startSortie } from '../../src/core/sortie.ts';
import { proposals, reserve } from '../../src/core/suit.ts';
import { moonLevel } from '../../src/levels/moon/level.ts';
import { moonDialogue } from '../../src/levels/moon/dialogue.ts';

const completed = () => {
  const s = startSortie(proposals[1].design);
  for (const id of ['sample', 'archive', 'relay', 'terminal']) {
    const p = moonLevel.points.find(q => q.id === id)!;
    sortieInteract(moonLevel, s, p.position.x, p.position.z);
  }
  return s;
};

test('movement and exploration achievements unlock once', () => {
  assert.deepEqual(unlocks({ kind: 'dash' }, []), ['first-dash']);
  assert.deepEqual(unlocks({ kind: 'dash' }, ['first-dash']), []);
  assert.deepEqual(unlocks({ kind: 'zone', cold: false }, []), []);
  assert.deepEqual(unlocks({ kind: 'echo', found: 8, total: 8 }, []), ['first-echo', 'all-echoes']);
});

test('two different designs are needed for the iteration achievement', () => {
  const [a, b] = proposals.map(p => p.design);
  assert.deepEqual(unlocks({ kind: 'sortie', designs: [a, a] }, []), []);
  assert.deepEqual(unlocks({ kind: 'sortie', designs: [a, b] }, []), ['two-designs']);
});

test('report achievements: completion, steady link, learning from a recall and a tight reserve', () => {
  const s = completed();
  const report = buildReport(moonLevel, s);
  assert.deepEqual(unlocks({ kind: 'report', report, previous: ['recalled'] }, []).sort(), ['complete', 'learn', 'no-recall']);
  const tight = completed();
  spend(tight, 'move', tight.energy - reserve - 3);
  assert.ok(unlocks({ kind: 'report', report: buildReport(moonLevel, tight), previous: [] }, []).includes('tight-reserve'));
  const recalled = startSortie(proposals[0].design);
  assert.deepEqual(unlocks({ kind: 'report', report: buildReport(moonLevel, recalled), previous: [] }, []), []);
});

test('lunar dialogue is bilingual and never names later destinations', () => {
  for (const lines of Object.values(moonDialogue)) for (const line of lines) {
    assert.ok(line.text.es && line.text.en);
    assert.doesNotMatch(line.text.es + line.text.en, /Marte|Mars|Bennu|AUR-E0[3-7]/);
  }
});
