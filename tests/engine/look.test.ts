import { test } from 'node:test';
import assert from 'node:assert/strict';
import { look, resolveLook, setLook } from '../../src/engine/look.ts';
import { tiers } from '../../src/engine/quality.ts';

test('low quality keeps the illustrated look unless the address asks for the realistic one', () => {
  assert.equal(resolveLook('?debug&quality=low', 'realista', 'low'), 'ilustrado');
  assert.equal(resolveLook('?debug&quality=low&look=realista', 'ilustrado', 'low'), 'realista');
});

test('medium and high follow the setting, and ?look= wins over it', () => {
  assert.equal(resolveLook('', 'realista', 'medium'), 'realista');
  assert.equal(resolveLook('', 'ilustrado', 'high'), 'ilustrado');
  assert.equal(resolveLook('?look=ilustrado', 'realista', 'high'), 'ilustrado');
  assert.equal(resolveLook('?look=otro', 'realista', 'high'), 'realista');
});

test('setLook updates the shared object in place', () => {
  setLook('realista');
  assert.deepEqual(look, { id: 'realista', real: true });
  setLook('ilustrado');
  assert.deepEqual(look, { id: 'ilustrado', real: false });
});

test('only tiers with a shadow map give it a range, and low has none', () => {
  assert.equal(tiers.low.shadow, 0);
  for (const spec of Object.values(tiers)) assert.equal(spec.shadow > 0, spec.shadowRange > 0);
});
