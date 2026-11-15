import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, writeProgress } from '../../src/core/save/progress3d.ts';
import { proposals } from '../../src/core/suit.ts';

test('an invalid save is rejected through the promise, never thrown into the game loop', async () => {
  const bad = { ...emptyProgress('moon', proposals[0].design), attempts: [{ design: proposals[0].design, outcome: 'complete' as const, completed: [], used: -5, time: 1, echoes: 0 }] };
  let result: Promise<void> | undefined;
  assert.doesNotThrow(() => { result = writeProgress(bad); });
  await assert.rejects(result!);
});
