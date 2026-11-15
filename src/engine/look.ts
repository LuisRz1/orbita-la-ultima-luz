// The game's look: «realista» (physically based light, shadow maps, no ink) or «ilustrado» (the original toon
// shading with ink outlines). It is chosen once, before a level's scene is built, exactly like the biome: changing
// it reloads the level. No three.js imports, so the rule is testable on its own.

export const lookIds = ['realista', 'ilustrado'] as const;
export type Look = typeof lookIds[number];

/** Active look. Mutated in place by setLook so every importer sees the same object. */
export const look: { id: Look; real: boolean } = { id: 'ilustrado', real: false };

export function setLook(id: Look) {
  look.id = id;
  look.real = id === 'realista';
}

/**
 * Look for this visit. `?look=` in the address wins (tests and tooling). Otherwise low quality always uses the
 * illustrated look, which needs no shadow maps or render targets, and medium and high follow the player's setting.
 */
export function resolveLook(search: string, preferred: Look, tier: 'low' | 'medium' | 'high'): Look {
  const asked = new URLSearchParams(search).get('look');
  const forced = lookIds.find(id => id === asked);
  if (forced) return forced;
  return tier === 'low' ? 'ilustrado' : preferred;
}
