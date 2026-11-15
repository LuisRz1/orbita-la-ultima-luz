// Bennu terrain: a rubble pile seen up close (OSIRIS-REx is the real reference; this site is invented). The surface
// drops away with distance to fake the curvature of a body about half a kilometre wide (simplification), and it is
// littered with boulders, some very large. Analytic height function shared by the game, the checker and the baker.
// x grows east, z grows south. Units: metres.

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hash(i: number, j: number) {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function valueNoise(x: number, z: number) {
  const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j;
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return (a * (1 - su) + b * su) * (1 - sv) + (c * (1 - su) + d * su) * sv;
}

/** Landmarks shared with the level definition. */
export const landmarks = {
  lander: { x: 0, z: 76 },
  /** Aurora's shelter, joined to the fictional service module, in a hollow on the far side of the site. */
  refuge: { x: 0, z: -72 },
  /** The two access routes to the refuge: east over a boulder field, west along a ridge of finer gravel. */
  eastAccess: { x: 44, z: -24 },
  westAccess: { x: -46, z: -20 },
  /** A huge boulder in the middle of the site: it blocks the direct line and is the best viewpoint. */
  monolith: { x: 0, z: 6 },
  /** Fake curvature radius: the ground falls by d²/2R. */
  curvature: 260,
};

/** Big boulders: [x, z, radius, height]. Fixed list so the map never changes. */
export const boulders = [
  [24, 44, 5, 4], [-28, 50, 4, 3], [58, 10, 6, 5], [-60, 30, 5, 4], [34, -52, 4.5, 3.5],
  [-30, -50, 5, 4], [70, -40, 4, 3], [-72, -36, 4, 3], [14, -26, 3.5, 2.8], [-16, 28, 3, 2.4],
] as const;

/** The monolith: a flat-topped block about 18 m across. A rubble slope on its south-west side makes it climbable. */
function monolith(x: number, z: number) {
  const dx = x - landmarks.monolith.x, dz = z - landmarks.monolith.z;
  const d = Math.hypot(dx * 1.1, dz);
  const angle = Math.atan2(dx, dz), notch = -2.3;
  let a = Math.abs(angle - notch); if (a > Math.PI) a = 2 * Math.PI - a;
  const inNotch = 1 - ss(0.25, 0.5, a);
  const cliff = 9 * (1 - ss(8, 10, d));
  const ramp = 9 * (1 - ss(3, 22, d));
  return cliff * (1 - inNotch) + ramp * inNotch;
}

/** The refuge sits in a shallow hollow, sheltered from the sun. */
function hollow(x: number, z: number) {
  const d = Math.hypot(x - landmarks.refuge.x, z - landmarks.refuge.z);
  return -3 * (1 - ss(6, 20, d));
}

/** East access: a field of small blocks (rough but walkable). West: a gravel ridge. */
function accesses(x: number, z: number) {
  const de = Math.hypot(x - landmarks.eastAccess.x, z - landmarks.eastAccess.z);
  const rough = (valueNoise(x / 2.2, z / 2.2) - 0.5) * 1.6 * (1 - ss(10, 18, de));
  const dw = Math.hypot((x - landmarks.westAccess.x) * 1.8, z - landmarks.westAccess.z);
  const ridge = 2.5 * (1 - ss(4, 26, dw));
  return rough + ridge;
}

export function bennuHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = -(r * r) / (2 * landmarks.curvature);
  h += monolith(x, z) + hollow(x, z) + accesses(x, z);
  for (const [bx, bz, br, bh] of boulders) {
    const d = Math.hypot(x - bx, z - bz) / br;
    h += bh * (1 - ss(0.55, 1, d));
  }
  // Coarse regolith everywhere: lumpier than the Moon, no fine dust plains.
  h += (valueNoise(x / 11, z / 11) - 0.5) * 1.6 + (valueNoise(x / 4 + 31, z / 4 - 7) - 0.5) * 0.5;
  return h;
}
