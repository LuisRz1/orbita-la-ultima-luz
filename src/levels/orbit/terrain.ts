// Chapter 1 station: walkable decks and walkways of a fictional reception station in low Earth orbit, over the void.
// The player walks with magnetic boots; leaving the deck is a fall into the void that the safety tether stops.
// Same analytic-height approach as the Moon and Mars, so the checker and the light baker share the shape.
// x grows east, z grows south. Units: metres.

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Depth of the void under the decks: far enough that fog hides it completely. */
export const voidDepth = -260;

/**
 * Deck rectangles [x0, x1, z0, z1]. Together they form one connected walkable structure; neighbours overlap by
 * at least 2 m so the soft edges never open a gap where they join.
 */
export const decks = {
  dock: [-14, 14, 50, 80],
  truss: [-3.5, 3.5, -92, 54],
  walkway: [-44, -12, 55, 64],
  cradle: [-48, -24, 18, 58],
  shade: [-40, -34, -74, 20],
  crossover: [-40, 1, -76, -68],
  boom: [-11, 11, -94, -77],
} as const;

export const landmarks = {
  lander: { x: 0, z: 76 },
  capsule: { x: -36, z: 46 },
  bay: { x: -36, z: 30 },
  recorder: { x: 0, z: -86 },
  sunlit: { x: 0, z: -15 },
  shade: { x: -37, z: -28 },
};

/** 1 on a deck, 0 over the void, with a short soft edge. */
export function deckMask(x: number, z: number) {
  let m = 0;
  for (const [x0, x1, z0, z1] of Object.values(decks)) {
    const d = Math.max(x0 - x, x - x1, z0 - z, z - z1);
    m = Math.max(m, 1 - ss(-0.6, 0.9, d));
  }
  return m;
}

export function orbitHeight(x: number, z: number) {
  const m = deckMask(x, z);
  // Shallow raised walkway plates along the truss every 12 m: a visual rhythm that never blocks walking.
  const plate = Math.abs(x) < 3.5 && z < 50 ? 0.12 * ss(0.3, 0.5, Math.abs(((z + 600) % 12) / 12 - 0.5) * 2) : 0;
  return voidDepth * (1 - m) + plate * m;
}
