// Mars terrain: an eroded crater with layered sediments, after the kind of site rovers study (Gale crater and its
// layered mound are the real reference; this valley is invented). Analytic height function, like the Moon, so the
// game, the level checker and the light baker share the same shape. x grows east, z grows south. Units: metres.

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
  habitat: { x: -18, z: 56 },
  mesa: { x: 52, z: -8 },
  relayHill: { x: -52, z: -34 },
  dunes: { x: -4, z: -16 },
  fieldKit: { x: 6, z: -80 },
  craterRadius: 98,
  /** The dry channel meanders east–west across the valley; its centre line is z = channelZ(x). */
  channelDepth: 7,
};

/** Centre line of the dry channel. */
export const channelZ = (x: number) => 22 + 5 * Math.sin(x / 23);

/** Small impact craters, placed away from the landmarks. Fixed list so the map never changes. */
const pits = [
  [-40, 74, 5, 1], [30, 70, 4, 0.8], [-70, 40, 6, 1.2], [76, 46, 5, 1], [-24, -50, 5, 1],
  [34, -52, 6, 1.1], [-74, -6, 5, 1], [78, -44, 4, 0.8], [-12, 40, 3.5, 0.6], [22, 6, 3, 0.5],
  [-40, -70, 4.5, 0.9], [44, -70, 4, 0.7],
] as const;

/** Layered mesa with a flat cap. A notch on its south-west side turns the cliff into a walkable ramp. */
function mesa(x: number, z: number) {
  const dx = x - landmarks.mesa.x, dz = (z - landmarks.mesa.z) / 1.25;
  const d = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz), notch = -0.785;
  let a = Math.abs(angle - notch); if (a > Math.PI) a = 2 * Math.PI - a;
  const inNotch = 1 - ss(0.2, 0.42, a);
  const cliff = 8 * (1 - ss(13, 15.5, d));
  const ramp = 8 * (1 - ss(4, 24, d));
  const cap = 1.2 * (1 - ss(5, 9, d));
  return cliff * (1 - inNotch) + ramp * inNotch + cap;
}

function relayHill(x: number, z: number) {
  const d = Math.hypot(x - landmarks.relayHill.x, z - landmarks.relayHill.z);
  return 7 * (1 - ss(5, 26, d));
}

/** Wind-sculpted ripples over a low mound of sand. */
function dunes(x: number, z: number) {
  const d = Math.hypot(x - landmarks.dunes.x, z - landmarks.dunes.z);
  const inside = 1 - ss(16, 28, d);
  const ripple = Math.sin(x * 0.55 + z * 0.22 + Math.sin(z * 0.08) * 2) * 0.35;
  return (1.4 * (1 - ss(0, 26, d)) + ripple) * inside;
}

/** Dry channel: steep walls in the middle of the valley, shallow fords toward both ends. */
function channel(x: number, z: number) {
  const across = 1 - ss(6, 8.5, Math.abs(z - channelZ(x)));
  const along = 1 - ss(38, 66, Math.abs(x));
  return -landmarks.channelDepth * across * along;
}

export function marsHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = 22 * ss(landmarks.craterRadius, 114, r) - 8 * ss(118, 140, r);
  h += mesa(x, z) + relayHill(x, z) + dunes(x, z) + channel(x, z);
  for (const [px, pz, pr, depth] of pits) {
    const d = Math.hypot(x - px, z - pz) / pr;
    h += -depth * (1 - ss(0.2, 1, d)) + depth * 0.35 * ss(0.8, 1.05, d) * (1 - ss(1.05, 1.5, d));
  }
  h += (valueNoise(x / 20, z / 20) - 0.5) * 1.1 + (valueNoise(x / 7 + 13, z / 7 - 29) - 0.5) * 0.3;
  return h;
}
