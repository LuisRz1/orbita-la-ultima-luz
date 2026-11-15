// Procedural PBR tile sets generated at load (package B owns this file).
// PHASE 0 STUB: flat 1×1 textures with the right formats, so callers can already bind and sample them. The contract is
// `tileSet()`, `TileSet` and the two GLSL helpers; the bodies are placeholders.
import { DataTexture, LinearFilter, NoColorSpace, RepeatWrapping, RGBAFormat, SRGBColorSpace, UnsignedByteType, type Texture, type WebGLRenderer } from 'three';

export type TileKind = 'regolith' | 'basalt' | 'marsDust' | 'bennuRubble' | 'rock' | 'panel' | 'fabric' | 'foil' | 'brushedMetal';
export type TileSet = {
  /** sRGB albedo with no baked light, AO in alpha. */
  map: Texture;
  /** Tangent-space normal.xy in rg (0.5 = flat), roughness in b, height in a. Linear. */
  normalRH: Texture;
  /** Edge of one tile in metres. */
  tileM: number;
};

const cache = new Map<string, TileSet>();

function flat(r: number, g: number, b: number, a: number, srgb: boolean) {
  const t = new DataTexture(new Uint8Array([r, g, b, a]), 1, 1, RGBAFormat, UnsignedByteType);
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
}

/**
 * Tile set of the given kind. Seeded and deterministic; the same arguments return the same cached set.
 * `renderer` may be null on tiers that must not bake on the GPU: the set is then flat.
 */
export function tileSet(_renderer: WebGLRenderer | null, kind: TileKind, size: 256 | 512 | 1024, seed = 1): TileSet {
  const key = `${kind}|${size}|${seed}`;
  let set = cache.get(key);
  if (!set) {
    const rough = kind === 'foil' || kind === 'brushedMetal' ? 90 : kind === 'panel' ? 150 : 235;
    set = { map: flat(255, 255, 255, 255, true), normalRH: flat(128, 128, rough, 128, false), tileM: kind === 'fabric' || kind === 'foil' ? 0.5 : 4 };
    cache.set(key, set);
  }
  return set;
}

/**
 * GLSL: `vec4 triplanar(sampler2D tex, vec3 p, vec3 n)` samples a tile along the three world axes and blends by
 * the normal. `p` is the position already divided by the tile size.
 */
export const GLSL_TRIPLANAR = /* glsl */`
vec4 triplanar(sampler2D tex, vec3 p, vec3 n) {
  vec3 w = pow(abs(n), vec3(4.0));
  w /= w.x + w.y + w.z;
  return texture2D(tex, p.zy) * w.x + texture2D(tex, p.xz) * w.y + texture2D(tex, p.xy) * w.z;
}`;

/**
 * GLSL: `float layerBlend(float hA, float hB, float t)` returns the weight of layer B for a transition `t` (0–1):
 * the layer whose height map is higher wins, so sand fills the gaps between stones instead of cross-fading.
 */
export const GLSL_LAYER = /* glsl */`
float layerBlend(float hA, float hB, float t) {
  float a = hA + (1.0 - t), b = hB + t;
  return clamp((b - a) / 0.2 + 0.5, 0.0, 1.0);
}`;
