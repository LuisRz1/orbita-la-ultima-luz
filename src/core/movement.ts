// Character movement on a heightfield with simple solids. Pure and deterministic: same inputs, same path.

export type MoveParams = {
  gravityUp: number; gravityDown: number; cutGravity: number;
  jumpSpeed: number; airJumpSpeed: number; airJumps: number;
  runSpeed: number; groundAccel: number; airAccel: number;
  dashSpeed: number; dashTime: number; dashKeep: number; dashCooldown: number;
  coyote: number; buffer: number; maxSlope: number; slideAccel: number; radius: number; stepUp: number;
};

/** Stylised low gravity: real lunar g (1.62 m/s²) would keep the player airborne for about five seconds. */
export const defaultParams: MoveParams = {
  gravityUp: 5, gravityDown: 8, cutGravity: 14,
  jumpSpeed: 5.5, airJumpSpeed: 4.5, airJumps: 1,
  runSpeed: 6, groundAccel: 30, airAccel: 8,
  dashSpeed: 16, dashTime: 0.18, dashKeep: 9, dashCooldown: 0.8,
  coyote: 0.12, buffer: 0.12, maxSlope: 40, slideAccel: 14, radius: 0.35, stepUp: 0.4,
};

export type Solid =
  | { kind: 'box'; x: number; z: number; hx: number; hz: number; top: number }
  | { kind: 'cylinder'; x: number; z: number; r: number; top: number };

export type Ground = {
  height(x: number, z: number): number;
  slope(x: number, z: number): number;
  solids: readonly Solid[];
};

export type Body = {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  grounded: boolean; coyote: number; buffer: number; airJumpsLeft: number;
  dash: number; dashCooldown: number; airDashUsed: boolean; dirX: number; dirZ: number; facing: number;
};

/** `x`/`z` is the wished direction in world space, length up to 1. Edge flags are true for one step only. */
export type MoveInput = { x: number; z: number; jump: boolean; jumpHeld: boolean; dash: boolean };

export type MoveEvents = { jumped: boolean; airJumped: boolean; dashed: boolean; landed: boolean; sliding: boolean };

export const idleInput: MoveInput = { x: 0, z: 0, jump: false, jumpHeld: false, dash: false };

export function createBody(x: number, z: number, ground: Ground): Body {
  return { x, y: groundAt(ground, x, z, Infinity), z, vx: 0, vy: 0, vz: 0, grounded: true, coyote: 0, buffer: 0,
    airJumpsLeft: 0, dash: 0, dashCooldown: 0, airDashUsed: false, dirX: 0, dirZ: -1, facing: Math.PI };
}

function inside(s: Solid, x: number, z: number, pad: number) {
  return s.kind === 'box'
    ? Math.abs(x - s.x) < s.hx + pad && Math.abs(z - s.z) < s.hz + pad
    : Math.hypot(x - s.x, z - s.z) < s.r + pad;
}

/** Highest standable surface at (x, z) that is not above `y + stepUp`. */
export function groundAt(ground: Ground, x: number, z: number, y: number, stepUp = defaultParams.stepUp) {
  let h = ground.height(x, z);
  for (const s of ground.solids) if (s.top > h && s.top <= y + stepUp && inside(s, x, z, 0)) h = s.top;
  return h;
}

function pushOut(b: Body, ground: Ground, p: MoveParams) {
  for (const s of ground.solids) {
    if (s.top <= b.y + p.stepUp || !inside(s, b.x, b.z, p.radius)) continue;
    if (s.kind === 'cylinder') {
      const dx = b.x - s.x, dz = b.z - s.z, d = Math.hypot(dx, dz) || 1, push = s.r + p.radius;
      b.x = s.x + dx / d * push; b.z = s.z + dz / d * push;
      const along = (b.vx * dx + b.vz * dz) / d;
      if (along < 0) { b.vx -= along * dx / d; b.vz -= along * dz / d; }
    } else {
      const ox = s.hx + p.radius - Math.abs(b.x - s.x), oz = s.hz + p.radius - Math.abs(b.z - s.z);
      if (ox < oz) { b.x += Math.sign(b.x - s.x) * ox; b.vx = 0; } else { b.z += Math.sign(b.z - s.z) * oz; b.vz = 0; }
    }
  }
}

export function stepBody(b: Body, input: MoveInput, ground: Ground, p: MoveParams, dt: number): MoveEvents {
  const events: MoveEvents = { jumped: false, airJumped: false, dashed: false, landed: false, sliding: false };
  const wish = Math.hypot(input.x, input.z);
  const ix = wish > 1 ? input.x / wish : input.x, iz = wish > 1 ? input.z / wish : input.z;
  if (wish > 0.05) { b.dirX = input.x / wish; b.dirZ = input.z / wish; b.facing = Math.atan2(b.dirX, b.dirZ); }
  if (b.grounded) { b.airJumpsLeft = p.airJumps; b.airDashUsed = false; }

  b.buffer = input.jump ? p.buffer : Math.max(0, b.buffer - dt);
  b.coyote = b.grounded ? p.coyote : Math.max(0, b.coyote - dt);
  b.dashCooldown = Math.max(0, b.dashCooldown - dt);

  if (input.dash && b.dashCooldown <= 0 && b.dash <= 0 && (b.grounded || !b.airDashUsed)) {
    b.dash = p.dashTime; b.dashCooldown = p.dashCooldown;
    if (!b.grounded) b.airDashUsed = true;
    b.vx = b.dirX * p.dashSpeed; b.vz = b.dirZ * p.dashSpeed; b.vy = Math.max(0, b.vy);
    events.dashed = true;
  }

  if (b.buffer > 0 && b.coyote > 0) {
    b.vy = p.jumpSpeed; b.buffer = 0; b.coyote = 0; b.grounded = false; events.jumped = true;
  } else if (b.buffer > 0 && !b.grounded && b.coyote <= 0 && b.airJumpsLeft > 0) {
    b.vy = p.airJumpSpeed; b.buffer = 0; b.airJumpsLeft--; events.airJumped = true;
  }

  if (b.dash > 0) {
    b.dash -= dt;
    if (b.dash <= 0) { const s = Math.hypot(b.vx, b.vz) || 1, keep = Math.min(s, p.dashKeep); b.vx *= keep / s; b.vz *= keep / s; }
  } else {
    const accel = (b.grounded ? p.groundAccel : p.airAccel) * dt;
    const tx = ix * p.runSpeed - b.vx, tz = iz * p.runSpeed - b.vz, d = Math.hypot(tx, tz);
    if (d <= accel) { b.vx += tx; b.vz += tz; } else { b.vx += tx / d * accel; b.vz += tz / d * accel; }
    const g = b.vy > 0 ? (input.jumpHeld ? p.gravityUp : p.cutGravity) : p.gravityDown;
    b.vy -= g * dt;
  }

  // Steep terrain: slide downhill and refuse uphill moves.
  if (b.grounded && ground.slope(b.x, b.z) > p.maxSlope) {
    const e = 0.5, gx = ground.height(b.x + e, b.z) - ground.height(b.x - e, b.z), gz = ground.height(b.x, b.z + e) - ground.height(b.x, b.z - e);
    const gl = Math.hypot(gx, gz) || 1;
    b.vx -= gx / gl * p.slideAccel * dt; b.vz -= gz / gl * p.slideAccel * dt; events.sliding = true;
  }
  const nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
  const here = ground.height(b.x, b.z), there = ground.height(nx, nz);
  // Blocked when walking up into steep rock, or when the body would end up inside it in the air.
  if (there > here && ground.slope(nx, nz) > p.maxSlope && (b.y - here < 0.1 || there > b.y)) {
    b.vx = 0; b.vz = 0; // wall of rock in front: stop instead of climbing it
  } else { b.x = nx; b.z = nz; }
  pushOut(b, ground, p);

  b.y += b.vy * dt;
  const floor = groundAt(ground, b.x, b.z, b.y - b.vy * dt, p.stepUp);
  const wasGrounded = b.grounded;
  if (b.y <= floor) {
    if (!wasGrounded) events.landed = true;
    b.y = floor; b.vy = 0; b.grounded = true; b.airJumpsLeft = p.airJumps; b.airDashUsed = false;
  } else if (wasGrounded && b.vy <= 0 && b.y - floor < 0.35) {
    b.y = floor; b.vy = 0; // stay glued to the ground when walking down slopes
  } else {
    b.grounded = false;
  }
  return events;
}
