import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBody, defaultParams, idleInput, stepBody, type Ground, type MoveInput, type Solid } from '../../src/core/movement.ts';

const dt = 1 / 60;
const flat = (solids: Solid[] = []): Ground => ({ height: () => 0, slope: () => 0, solids });
const run = (body: ReturnType<typeof createBody>, ground: Ground, steps: number, input: (i: number) => Partial<MoveInput>) => {
  let maxY = body.y;
  for (let i = 0; i < steps; i++) { stepBody(body, { ...idleInput, ...input(i) }, ground, defaultParams, dt); maxY = Math.max(maxY, body.y); }
  return maxY;
};

test('a held jump peaks near three metres and lands back on the ground', () => {
  const g = flat(), b = createBody(0, 0, g);
  const apex = run(b, g, 240, i => ({ jump: i === 0, jumpHeld: true }));
  assert.ok(apex > 2.8 && apex < 3.2, 'apex ' + apex);
  assert.equal(b.grounded, true);
  assert.equal(b.y, 0);
});

test('releasing early cuts the jump short', () => {
  const g = flat(), b = createBody(0, 0, g);
  const apex = run(b, g, 240, i => ({ jump: i === 0, jumpHeld: i < 6 }));
  assert.ok(apex < 1.6, 'short hop apex ' + apex);
});

test('the double jump adds height only when air jumps are allowed', () => {
  const g = flat();
  const twice = (i: number) => ({ jump: i === 0 || i === 60, jumpHeld: true });
  const withThruster = run(createBody(0, 0, g), g, 300, twice);
  const b = createBody(0, 0, g);
  let maxY = 0;
  for (let i = 0; i < 300; i++) { stepBody(b, { ...idleInput, ...twice(i) }, g, { ...defaultParams, airJumps: 0 }, dt); maxY = Math.max(maxY, b.y); }
  assert.ok(withThruster > maxY + 1.5, `thruster ${withThruster} vs none ${maxY}`);
});

test('a dash covers more ground than running and has a cooldown', () => {
  const g = flat();
  const runner = createBody(0, 0, g); run(runner, g, 30, () => ({ x: 1 }));
  const dasher = createBody(0, 0, g);
  let dashes = 0;
  for (let i = 0; i < 30; i++) if (stepBody(dasher, { ...idleInput, x: 1, dash: true }, g, defaultParams, dt).dashed) dashes++;
  assert.equal(dashes, 1);
  assert.ok(dasher.x > runner.x + 1.5, `dash ${dasher.x} vs run ${runner.x}`);
});

test('coyote time allows a jump just after walking off a ledge', () => {
  const g: Ground = { height: x => (x < 1 ? 2 : 0), slope: () => 0, solids: [] };
  const b = createBody(0, 0, g);
  let jumped = false;
  for (let i = 0; i < 40 && !jumped; i++) {
    const offLedge = b.x > 1.05 && !b.grounded;
    jumped = stepBody(b, { ...idleInput, x: 1, jump: offLedge, jumpHeld: true }, g, defaultParams, dt).jumped;
  }
  assert.equal(jumped, true);
});

test('steep slopes block climbing', () => {
  const g: Ground = { height: x => Math.max(0, (x - 2) * 3), slope: x => (x > 2 ? 71 : 0), solids: [] };
  const b = createBody(0, 0, g);
  run(b, g, 180, () => ({ x: 1 }));
  assert.ok(b.y < 0.8, 'climbed to ' + b.y);
});

test('the player stands on solids it jumps onto and is pushed out of ones that are too tall', () => {
  const low: Solid = { kind: 'box', x: 2, z: 0, hx: 1, hz: 1, top: 1.5 };
  const g = flat([low]), b = createBody(0, 0, g);
  run(b, g, 120, i => ({ x: i < 30 ? 1 : 0, jump: i === 2, jumpHeld: true }));
  assert.equal(b.y, 1.5);
  const tall: Solid = { kind: 'cylinder', x: 2, z: 0, r: 1, top: 10 };
  const g2 = flat([tall]), c = createBody(0, 0, g2);
  run(c, g2, 120, () => ({ x: 1 }));
  assert.ok(c.x <= 2 - 1 - defaultParams.radius + 1e-6, 'went into the pillar: ' + c.x);
});
