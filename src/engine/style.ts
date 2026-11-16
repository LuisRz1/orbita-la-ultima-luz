// Shared look: three-tone toon shading, ink outlines and textures generated in code (no image files to load).
// In the realistic look (look.ts) the same entry points hand out physically based materials and no ink.
import {
  BackSide, CanvasTexture, Color, DataTexture, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat,
  RepeatWrapping, SRGBColorSpace, type ColorRepresentation, type Material, type Texture,
} from 'three';
import { look } from './look.ts';
import { surface, type SurfaceHint } from './surfaces.ts';

/** Biome palette for the Moon («Nácar»): lavender and pearl under an indigo sky, violet shadows instead of grey. */
const nacar = {
  lit: '#ddd4ea', mid: '#a99cc8', shadow: '#4b3f7c', deep: '#2a2350', ink: '#1b1530',
  skyTop: '#0d0a22', skyHorizon: '#2b2459', fog: '#2b2459', stars: '#f3ecff', milkyWay: '#6b5aa8',
  rockLit: '#c7bcdc', rockDark: '#7f71a6', gold: '#f2c14e', pink: '#ff9ec7', mint: '#9dffc8', coral: '#ff7a5c',
  cyan: '#7fe3e0', amber: '#ffaf68',
  /** Sky objects, light and air. */
  sky: 'earth' as 'earth' | 'mars-moons' | 'earth-below' | 'deep' | 'day', sunGlow: '#fff1cf', sunScale: 110, sunColor: '#fff4e0',
  /** Ground: scattered rocks and boot prints (factor and switch), regolith or metal plating, and the height below
   * which the terrain is the void under a station deck (vertices there take the sky colour and vanish in fog). */
  rockScatter: 1, footprints: true, plating: false, voidBelow: null as number | null, ambientDust: 1,
  hemiSky: '#9fb0cc', hemiGround: '#2a2a33', fogNear: 60, fogFar: 230, starCount: 1800,
  airDust: '#f6e9ff', puff: '#d8d2c4', hazardParticle: '#bfe9ff', porthole: '#cbbfe6',
  /** Drag on dust puffs: 0 in vacuum, so they fly in clean arcs. */
  air: 0, wind: 0,
  /** LUMA's fur and core for this chapter (its colour follows a Sun-like star through the story). */
  luma: '#ffb05c', lumaCore: '#fff2c4',
  /** Painted-sky nebula colours (optional setting); null where the sky is daytime and no nebula would show. */
  nebula: ['#7a4fb0', '#ff9ec7'] as [string, string] | null,
  /**
   * Realistic look. Albedos are sRGB colours whose linear value is the measured reflectance; the Sun's intensity
   * scales with the inverse square of the distance (8 at 1 au, an engine unit); `exposure` stands in for a camera's
   * auto-exposure. Sources and labels: brain/04-Ciencia/FUENTES.md («Aspecto realista»).
   */
  real: {
    sun: '#fff5ea', sunIntensity: 8, exposure: 3.4,
    /** Mean ground and rock albedo: lunar regolith reflects about 12 % of sunlight. */
    ground: '#625f5b', rock: '#6b6864',
    /** Radiance of the sky itself (black without air) and its colours for the dome and the environment. */
    skyFill: '#000000', skyZenith: '#000000', skyHorizon: '#000000',
    /** Earthshine or planetshine reaching the shade, as a fraction of sunlight (0 where no planet fills the sky). */
    planetshine: 0.0012, planetColor: '#9db8e8',
    /** Apparent radius of the Sun's disc in degrees. */
    sunRadius: 0.267,
    /** Height fog (dusty air): density at the base (1/m), scale height (m), colours away from and toward the Sun. */
    fog: null as null | { density: number; scale: number; base: number; color: string; sunColor: string },
    /** Bloom strength and the AO radius in metres for the post chain. */
    bloom: 0.07, aoRadius: 1.2,
  },
};
export type Biome = typeof nacar;

/**
 * Mars («Terracota y menta»): peach ground, plum shadows, a butterscotch sky with the blue halo the real Martian
 * sky shows around the Sun, two small moons and a thin, dusty atmosphere that carries sound and drags dust.
 */
const terracota: Biome = {
  lit: '#f0a77a', mid: '#c46b4e', shadow: '#6b3b4f', deep: '#4a2638', ink: '#2a141c',
  skyTop: '#a8694d', skyHorizon: '#e9b98c', fog: '#d9a07a', stars: '#fff1e0', milkyWay: '#000000',
  rockLit: '#d98f68', rockDark: '#8f4f45', gold: '#f2c14e', pink: '#ff9ec7', mint: '#9dffc8', coral: '#ff7a5c',
  cyan: '#7fe3e0', amber: '#ffaf68',
  sky: 'mars-moons', sunGlow: '#8fb7e6', sunScale: 80, sunColor: '#ffe6cc',
  rockScatter: 1, footprints: true, plating: false, voidBelow: null, ambientDust: 1,
  hemiSky: '#e9b98c', hemiGround: '#5a2e2a', fogNear: 45, fogFar: 200, starCount: 0,
  airDust: '#f3c9a6', puff: '#c98a66', hazardParticle: '#8a4a35', porthole: '#f2b98e',
  air: 1.4, wind: 1,
  luma: '#e8553f', lumaCore: '#ffd2b8',
  nebula: null,
  real: {
    // Mars is 1.52 au from the Sun: 43 % of the sunlight at Earth, reddened a little by the dust it crosses.
    sun: '#ffe9d2', sunIntensity: 3.4, exposure: 2.6,
    ground: '#a5714e', rock: '#8a5a44',
    skyFill: '#6b5540', skyZenith: '#8f7458', skyHorizon: '#c9a47c',
    planetshine: 0, planetColor: '#000000',
    sunRadius: 0.175,
    fog: { density: 0.0022, scale: 900, base: 0, color: '#b89472', sunColor: '#d9c4b0' },
    bloom: 0.09, aoRadius: 1.4,
  },
};

/**
 * Low Earth orbit («Quirófano azul»): clean white plating, blue shadows lit by earthshine, coral accents, black
 * space above and Earth filling the sky below the decks. No air, no rocks, no prints on metal.
 */
const quirofano: Biome = {
  lit: '#d3dbe8', mid: '#a4b2c9', shadow: '#6f83a8', deep: '#3a4766', ink: '#141b2e',
  skyTop: '#02040b', skyHorizon: '#0b1636', fog: '#02040b', stars: '#eef3ff', milkyWay: '#4a5a8a',
  rockLit: '#c9d3e6', rockDark: '#7d8fb3', gold: '#f2c14e', pink: '#ff9ec7', mint: '#9dffc8', coral: '#ff7a5c',
  cyan: '#7fe3e0', amber: '#ffaf68',
  sky: 'earth-below', sunGlow: '#fff6e6', sunScale: 120, sunColor: '#ffffff',
  rockScatter: 0, footprints: false, plating: true, voidBelow: -20, ambientDust: 0.25,
  hemiSky: '#7fb0e8', hemiGround: '#1a2440', fogNear: 140, fogFar: 255, starCount: 1800,
  airDust: '#cfe0ff', puff: '#dfe8f5', hazardParticle: '#fff6d8', porthole: '#7fb0e8',
  air: 0, wind: 0,
  luma: '#ffe2a0', lumaCore: '#ffffff',
  nebula: ['#2f5fa8', '#7fe3e0'],
  real: {
    sun: '#fff5ea', sunIntensity: 8, exposure: 0.62,
    // White thermal paint on the decks.
    ground: '#c9ccd0', rock: '#9aa0a8',
    skyFill: '#000000', skyZenith: '#000000', skyHorizon: '#000000',
    // Earth fills half the sky from low orbit: strong blue-white fill from below.
    planetshine: 0.09, planetColor: '#a9c4ee',
    sunRadius: 0.267,
    fog: null,
    bloom: 0.07, aoRadius: 0.9,
  },
};

/**
 * Bennu («Carbono»): one of the darkest surfaces known, so the ground is charcoal with warm sand highlights, deep
 * blue shadows and a black sky. LUMA is in its blue-white phase. No air: dust flies in clean arcs.
 */
const carbono: Biome = {
  lit: '#726b62', mid: '#4a4642', shadow: '#262838', deep: '#1a1b29', ink: '#0d0d16',
  skyTop: '#020208', skyHorizon: '#0a0c1c', fog: '#05060f', stars: '#f4f6ff', milkyWay: '#4b4f7a',
  rockLit: '#6a645c', rockDark: '#34312f', gold: '#f2c14e', pink: '#ff9ec7', mint: '#9dffc8', coral: '#ff7a5c',
  cyan: '#7fe3e0', amber: '#ffaf68',
  sky: 'deep', sunGlow: '#fff6e6', sunScale: 70, sunColor: '#ffffff',
  rockScatter: 2.2, footprints: true, plating: false, voidBelow: null, ambientDust: 0.6,
  hemiSky: '#8a94c8', hemiGround: '#141420', fogNear: 90, fogFar: 260, starCount: 2200,
  airDust: '#c9c2b6', puff: '#6f6a62', hazardParticle: '#ffd9a8', porthole: '#8a94c8',
  air: 0, wind: 0,
  luma: '#cfe6ff', lumaCore: '#ffffff',
  nebula: ['#3b3f8a', '#9fb8ff'],
  real: {
    // Bennu reflects about 4.4 % of sunlight: among the darkest bodies visited. Sunlight at 1.13 au.
    sun: '#fff5ea', sunIntensity: 6.3, exposure: 6.5,
    ground: '#3a3a3c', rock: '#403f40',
    skyFill: '#000000', skyZenith: '#000000', skyHorizon: '#000000',
    planetshine: 0, planetColor: '#000000',
    sunRadius: 0.236,
    fog: null,
    bloom: 0.06, aoRadius: 1.2,
  },
};

const tierra: Biome = {
  ...nacar, sky: 'day', starCount: 0, nebula: null, air: 1.6, wind: .4,
  lit: '#82975f', mid: '#5c7d50', shadow: '#435f50', deep: '#183539', ink: '#243c3f',
  skyTop: '#4d86ba', skyHorizon: '#c3d6d8', fog: '#adc0bf', hemiSky: '#a6c3df',
  rockLit: '#818778', rockDark: '#4e5a61', luma: '#ffe2a0', lumaCore: '#ffffff',
  real: { ...nacar.real, exposure: .85, ground: '#849071', rock: '#686f65', planetshine: 0,
    skyFill: '#9fc9ea', skyZenith: '#4d7dab', skyHorizon: '#c9dedf',
    fog: { density: .001, scale: 900, base: 0, color: '#b8cdcf', sunColor: '#e9e3c8' } },
};

export const biomes = { nacar, terracota, quirofano, carbono, tierra };
export type BiomeId = keyof typeof biomes;

/** Active biome. Mutated in place by setBiome so every importer sees the level's palette. */
export const biome: Biome = { ...nacar };
export let ink = biome.ink;
/** Colour toon shadows lean toward; one value per biome. */
const shadeTint = new Color(biome.shadow);

/** Selects the palette before a level's scene is built. The Moon keeps the original Nácar values. */
export function setBiome(id: BiomeId) {
  Object.assign(biome, biomes[id]);
  ink = biome.ink;
  shadeTint.set(biome.shadow);
  for (const m of outlineCache.values()) m.color.set(ink);
}

let gradient: DataTexture | null = null;
/** Three hard bands (shadow, mid, lit): the painted-light look of the reference. */
export function toonGradient() {
  if (gradient) return gradient;
  gradient = new DataTexture(new Uint8Array([70, 150, 255]), 3, 1, RedFormat);
  gradient.minFilter = gradient.magFilter = NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const toonCache = new Map<string, MeshToonMaterial>();
/**
 * Toon material whose dark band is tinted toward the biome shade instead of going grey: the single change that
 * makes shadows read as painted colour.
 */
export function toon(color: ColorRepresentation, emissive: ColorRepresentation = '#000000', hint?: SurfaceHint): Material {
  // Realistic look: the same call hands out a physically based material; `hint` says what the surface is made of.
  if (look.real) return surface(hint?.kind ?? 'paint', color, { ...hint, emissive: hint?.emissive ?? (new Color(emissive).getHex() ? emissive : undefined) });
  const key = String(color) + String(emissive);
  let m = toonCache.get(key);
  if (!m) { m = tintShadows(new MeshToonMaterial({ color, emissive, gradientMap: toonGradient() })); toonCache.set(key, m); }
  return m;
}

function tintShadows<T extends MeshToonMaterial>(m: T): T {
  m.onBeforeCompile = shader => {
    shader.uniforms.uShade = { value: shadeTint };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uShade;')
      .replace('#include <opaque_fragment>', `{
  float base = max(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)), 0.02);
  float lit = dot(outgoingLight - totalEmissiveRadiance, vec3(0.299, 0.587, 0.114)) / base;
  vec3 shaded = mix(diffuseColor.rgb, uShade, 0.55) * 0.62;
  outgoingLight = mix(shaded + totalEmissiveRadiance, outgoingLight, smoothstep(0.42, 0.7, lit));
}
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'tinted-toon';
  return m;
}

/** Whether meshes get an ink outline hull: only in the illustrated look. */
export const inked = () => !look.real;

/**
 * Unlit colour for lamps, beams and screens. In the realistic look the colour is scene-referred: `strength` is its
 * radiance (lamps 2–4, beams up to 1.5), so it stays bright next to sunlit ground and blooms a little.
 */
export function glowColor(color: ColorRepresentation, strength = 2) {
  const c = new Color(color);
  return look.real ? c.multiplyScalar(strength) : c;
}

const outlineCache = new Map<number, MeshBasicMaterial>();
/**
 * Inverted-hull outline: back faces pushed out along their normals in the vertex shader. Works for any mesh,
 * including instanced ones, without a post-processing pass.
 */
export function outlineMaterial(thickness = 0.035) {
  let m = outlineCache.get(thickness);
  if (m) return m;
  m = new MeshBasicMaterial({ color: ink, side: BackSide });
  // No ink in the realistic look: builders skip the hull (see `inked`), and a stray one never draws.
  m.visible = !look.real;
  m.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>\n transformed += normalize(normal) * ${thickness.toFixed(4)};`);
  };
  m.customProgramCacheKey = () => 'outline' + thickness;
  outlineCache.set(thickness, m);
  return m;
}

function canvas(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void, repeat = true): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/** Seeded generator so textures look the same on every load. */
function rng(seed: number) {
  return () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9 | 0) >>> 0) / 4294967296;
}

/** Earth seen from the Moon: oceans, continents and cloud bands; lit by the scene's sun. */
export function earthTexture() {
  return canvas(256, (g, s) => {
    const r = rng(5);
    g.fillStyle = '#2f6ea8'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) { g.fillStyle = r() > 0.5 ? '#6f8f4e' : '#a58c5c'; g.beginPath(); g.ellipse(r() * s, s * 0.2 + r() * s * 0.6, 8 + r() * 26, 6 + r() * 18, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * s, r() * s, 10 + r() * 40, 2 + r() * 5, r() * 0.4, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f2f4f6'; g.fillRect(0, 0, s, 10); g.fillRect(0, s - 12, s, 12);
  }, false);
}

/** Phobos and Deimos: small, dark, cratered potatoes. */
export function marsMoonTexture(seed: number) {
  return canvas(64, (g, s) => {
    const r = rng(seed);
    g.fillStyle = '#6e5a50'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(40,28,24,0.45)' : 'rgba(150,126,110,0.35)';
      g.beginPath(); g.arc(r() * s, r() * s, 2 + r() * 7, 0, Math.PI * 2); g.fill();
    }
  }, false);
}

/** Soft radial glow for the sun disc. */
export function glowTexture(color: string) {
  return canvas(128, (g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    const c = new Color(color);
    const rgb = `${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0}`;
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.12, `rgba(${rgb},0.9)`);
    grad.addColorStop(0.35, `rgba(${rgb},0.22)`); grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad; g.fillRect(0, 0, s, s);
  }, false);
}

/** Warning stripes for hardware (cache, lander skirt). */
export function stripeTexture() {
  return canvas(64, (g, s) => {
    g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#e28c3f';
    for (let i = -s; i < s * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 8 - s, s); g.lineTo(i - s, s); g.fill(); }
  });
}

/** Shared toon material that takes a texture map. In the realistic look the map becomes the albedo of `hint`'s surface. */
export function toonMapped(map: Texture, color: ColorRepresentation = '#ffffff', hint?: SurfaceHint): Material {
  if (look.real) return surface(hint?.kind ?? 'paint', color, { ...hint, map });
  return tintShadows(new MeshToonMaterial({ color, map, gradientMap: toonGradient() }));
}

/** Helmet visor: deep indigo glass reflecting a cyan horizon band and a pink highlight. */
export function visorTexture() {
  return canvas(128, (g, s) => {
    const grad = g.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, '#15123a'); grad.addColorStop(0.42, '#2b2a5c'); grad.addColorStop(0.5, '#7fe3e0');
    grad.addColorStop(0.56, '#3a3a78'); grad.addColorStop(1, '#100d2a');
    g.fillStyle = grad; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,158,199,0.9)'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.arc(s * 0.32, s * 0.95, s * 0.62, -1.75, -1.3); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.arc(s * 0.32, s * 0.95, s * 0.5, -1.7, -1.45); g.stroke();
  }, false);
}

/** LUMA's translator band: glyphs in its own script, scrolled while it talks or thinks. */
export function glyphTexture() {
  return canvas(256, (g, s) => {
    g.fillStyle = '#20232d'; g.fillRect(0, 0, s, s);
    const r = rng(23);
    g.strokeStyle = '#ffd59a'; g.lineWidth = 3; g.lineCap = 'round';
    for (let x = 8; x < s - 8; x += 22) {
      const y = s / 2;
      g.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = r() * 6, b = r() * 6;
        g.moveTo(x + Math.cos(a) * 7, y + Math.sin(a) * 18);
        g.lineTo(x + Math.cos(b) * 7, y + Math.sin(b) * 18);
      }
      g.stroke();
    }
  });
}

/** Gold multilayer insulation: crinkled foil facets catching the light. */
export function foilTexture() {
  return canvas(256, (g, s) => {
    const r = rng(31);
    g.fillStyle = '#f2c14e'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) {
      const x = r() * s, y = r() * s, w = 10 + r() * 34;
      g.fillStyle = r() > 0.5 ? `rgba(255,226,140,${0.18 + r() * 0.3})` : `rgba(120,78,20,${0.15 + r() * 0.25})`;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + r() * 12 - 6); g.lineTo(x + w * 0.6, y + w * 0.7); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(90,60,15,0.45)'; g.lineWidth = 1.5;
    for (let i = 0; i < 26; i++) { g.beginPath(); g.moveTo(r() * s, r() * s); g.lineTo(r() * s, r() * s); g.stroke(); }
  });
}

/** Painted hull panels with ink seams, rivets and a stencilled label. */
export function hullTexture(label = 'AURORA-2') {
  return canvas(256, (g, s) => {
    g.fillStyle = '#e6e2d6'; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, s * 0.5, s, s * 0.5);
    g.strokeStyle = 'rgba(30,34,46,0.55)'; g.lineWidth = 2;
    for (const x of [0, s / 3, (2 * s) / 3]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s); g.stroke(); }
    for (const y of [s / 2]) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    g.fillStyle = 'rgba(30,34,46,0.5)';
    for (const x of [6, s / 3 - 6, s / 3 + 6, (2 * s) / 3 - 6, (2 * s) / 3 + 6, s - 6])
      for (let y = 8; y < s; y += 22) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#e28c3f'; g.fillRect(s * 0.38, s * 0.12, s * 0.24, 8);
    g.fillStyle = '#2b3140'; g.font = 'bold 20px monospace'; g.fillText(label, s * 0.36, s * 0.34);
    g.font = '11px monospace'; g.fillText('NO STEP', s * 0.06, s * 0.9);
  });
}

/** Boot-sole print for footprints: tread bars inside a rounded outline, dark on transparent. */
export function footprintTexture() {
  return canvas(64, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.fillStyle = 'rgba(40,40,56,0.62)';
    g.beginPath(); g.ellipse(s / 2, s * 0.32, s * 0.3, s * 0.27, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(s / 2, s * 0.75, s * 0.24, s * 0.2, 0, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (let y = s * 0.1; y < s * 0.95; y += 7) g.fillRect(s * 0.18, y, s * 0.64, 2);
  }, false);
}
