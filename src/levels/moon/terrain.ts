// Moon grey-box terrain: an analytic height function, so the same shape is available to the game,
// the level checker and the light baker. x grows east, z grows south. Units: metres.

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
  peak: { x: 0, z: 0 },
  ridge: { x: -62, z: 8 },
  shadow: { x: 58, z: -8 },
  riftZ: -56,
  archive: { x: 0, z: -80 },
  craterRadius: 95,
};

/** Small impact craters, placed away from the landmarks. Fixed list so the map never changes. */
const pits = [
  [-30, 40, 6, 1.2], [34, 46, 5, 1], [-46, -24, 7, 1.4], [26, -30, 4.5, 0.8], [70, 34, 6, 1.1],
  [-78, 44, 5, 1], [-20, -78, 4, 0.7], [44, -66, 6, 1.2], [-58, -60, 5.5, 1], [80, -40, 4, 0.8],
  [16, 30, 3.5, 0.6], [-14, 22, 3, 0.5],
] as const;

function peak(x: number, z: number) {
  const r = Math.hypot(x, z);
  const lower = 6 * (1 - ss(14, 30, r));
  // A notch on the south-west side turns the cliff into a ramp, so the summit is reachable without thrusters.
  const angle = Math.atan2(x, z), notch = -0.785;
  let d = Math.abs(angle - notch); if (d > Math.PI) d = 2 * Math.PI - d;
  const inNotch = 1 - ss(0.22, 0.42, d);
  const cliff = 4.2 * (1 - ss(11.5, 13.5, r));
  const ramp = 4.2 * (1 - ss(4, 13.5, r));
  return lower + cliff * (1 - inNotch) + ramp * inNotch;
}

function ridge(x: number, z: number) {
  const d = Math.hypot(x - landmarks.ridge.x, (z - landmarks.ridge.z) * 0.6);
  return 2.4 * (1 - ss(14, 16, d)) + 2.4 * (1 - ss(8, 10, d));
}

function shadowCrater(x: number, z: number) {
  const d = Math.hypot(x - landmarks.shadow.x, z - landmarks.shadow.z);
  return -5 * (1 - ss(4, 18, d)) + 1.2 * ss(15, 19, d) * (1 - ss(19, 24, d));
}

function rift(x: number, z: number) {
  const across = 1 - ss(7, 9, Math.abs(z - landmarks.riftZ));
  const along = 1 - ss(20, 60, Math.abs(x));
  return -12 * across * along;
}

export function moonHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = 20 * ss(landmarks.craterRadius, 112, r) - 8 * ss(116, 140, r);
  h += peak(x, z) + ridge(x, z) + shadowCrater(x, z) + rift(x, z);
  for (const [px, pz, pr, depth] of pits) {
    const d = Math.hypot(x - px, z - pz) / pr;
    h += -depth * (1 - ss(0.2, 1, d)) + depth * 0.35 * ss(0.8, 1.05, d) * (1 - ss(1.05, 1.5, d));
  }
  h += (valueNoise(x / 18, z / 18) - 0.5) * 0.9 + (valueNoise(x / 6 + 31, z / 6 - 17) - 0.5) * 0.25;
  return h;
}
