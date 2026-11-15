// Physically based materials for characters and props in the realistic look (package C owns this file).
// PHASE 0 STUB: plain MeshStandardMaterial per kind, cached. The contract is `surface()` and its types; the bodies
// are placeholders to be replaced with detail normals, dust masks and the visor's physical material.
import { Color, MeshStandardMaterial, type ColorRepresentation, type Material, type Texture } from 'three';

export type SurfaceKind = 'fabric' | 'metal' | 'paint' | 'foil' | 'rubber' | 'glass' | 'emissive';
export type SurfaceOptions = {
  roughness?: number; metalness?: number;
  /** Emissive colour; its radiance is `emissiveIntensity` (scene-referred: lamps 2–4, LUMA's core 4–6). */
  emissive?: ColorRepresentation; emissiveIntensity?: number;
  /** 0–1: how much regolith dust has settled on the surface. */
  dust?: number;
  /** Albedo map (sRGB), for labelled hull panels and the like. A mapped surface is not cached. */
  map?: Texture;
};
/** What `toon(color, emissive, hint)` forwards in the realistic look. */
export type SurfaceHint = SurfaceOptions & { kind?: SurfaceKind };

const defaults: Record<SurfaceKind, { roughness: number; metalness: number }> = {
  fabric: { roughness: 0.9, metalness: 0 }, paint: { roughness: 0.65, metalness: 0 }, rubber: { roughness: 0.95, metalness: 0 },
  metal: { roughness: 0.4, metalness: 1 }, foil: { roughness: 0.3, metalness: 1 }, glass: { roughness: 0.08, metalness: 1 },
  emissive: { roughness: 0.6, metalness: 0 },
};

const cache = new Map<string, MeshStandardMaterial>();

/** Material for a surface of the given kind. Same arguments give the same shared instance: do not mutate it. */
export function surface(kind: SurfaceKind, color: ColorRepresentation, o: SurfaceOptions = {}): Material {
  const key = o.map ? null : [kind, new Color(color).getHexString(), o.roughness, o.metalness, o.emissive === undefined ? '' : new Color(o.emissive).getHexString(), o.emissiveIntensity, o.dust].join('|');
  const hit = key ? cache.get(key) : undefined;
  if (hit) return hit;
  const d = defaults[kind];
  const emissive = o.emissive ?? (kind === 'emissive' ? color : '#000000');
  const m = new MeshStandardMaterial({
    color, map: o.map ?? null, roughness: o.roughness ?? d.roughness, metalness: o.metalness ?? d.metalness,
    emissive, emissiveIntensity: o.emissiveIntensity ?? (kind === 'emissive' ? 3 : 2),
  });
  if (key) cache.set(key, m);
  return m;
}
