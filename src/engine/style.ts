// Shared look: three-tone toon shading, ink outlines and textures generated in code (no image files to load).
import {
  BackSide, CanvasTexture, Color, DataTexture, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat,
  RepeatWrapping, SRGBColorSpace, type ColorRepresentation, type Texture,
} from 'three';

/** Biome palette for the Moon («Nácar»): lavender and pearl under an indigo sky, violet shadows instead of grey. */
const nacar = {
  lit: '#ddd4ea', mid: '#a99cc8', shadow: '#4b3f7c', deep: '#2a2350', ink: '#1b1530',
  skyTop: '#0d0a22', skyHorizon: '#2b2459', fog: '#2b2459', stars: '#f3ecff', milkyWay: '#6b5aa8',
  rockLit: '#c7bcdc', rockDark: '#7f71a6', gold: '#f2c14e', pink: '#ff9ec7', mint: '#9dffc8', coral: '#ff7a5c',
  cyan: '#7fe3e0', amber: '#ffaf68',
  /** Sky objects, light and air. */
  sky: 'earth' as 'earth' | 'mars-moons', sunGlow: '#fff1cf', sunScale: 110, sunColor: '#fff4e0',
  hemiSky: '#9fb0cc', hemiGround: '#2a2a33', fogNear: 60, fogFar: 230, starCount: 1800,
  airDust: '#f6e9ff', puff: '#d8d2c4', hazardParticle: '#bfe9ff', porthole: '#cbbfe6',
  /** Drag on dust puffs: 0 in vacuum, so they fly in clean arcs. */
  air: 0, wind: 0,
  /** LUMA's fur and core for this chapter (its colour follows a Sun-like star through the story). */
  luma: '#ffb05c', lumaCore: '#fff2c4',
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
  hemiSky: '#e9b98c', hemiGround: '#5a2e2a', fogNear: 45, fogFar: 200, starCount: 0,
  airDust: '#f3c9a6', puff: '#c98a66', hazardParticle: '#8a4a35', porthole: '#f2b98e',
  air: 1.4, wind: 1,
  luma: '#e8553f', lumaCore: '#ffd2b8',
};

export const biomes = { nacar, terracota };
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
export function toon(color: ColorRepresentation, emissive: ColorRepresentation = '#000000') {
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

const outlineCache = new Map<number, MeshBasicMaterial>();
/**
 * Inverted-hull outline: back faces pushed out along their normals in the vertex shader. Works for any mesh,
 * including instanced ones, without a post-processing pass.
 */
export function outlineMaterial(thickness = 0.035) {
  let m = outlineCache.get(thickness);
  if (m) return m;
  m = new MeshBasicMaterial({ color: ink, side: BackSide });
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

/** Shared toon material that takes a texture map. */
export function toonMapped(map: Texture, color: ColorRepresentation = '#ffffff') {
  return tintShadows(new MeshToonMaterial({ color, map, gradientMap: toonGradient() }));
}

/**
 * Terrain look on top of the baked vertex light: per-pixel regolith detail (multi-scale noise and small pits,
 * no visible tiling) and rock strata on steep faces, fading with distance.
 * `octaves` trades detail for cost on low-end GPUs.
 */
export function terrainMaterial(octaves: number) {
  const m = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  m.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;\nvarying vec3 vN;\nvarying float vDist;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvN = normalize(mat3(modelMatrix) * normal);')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDist = -mvPosition.z;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWorld;
varying vec3 vN;
varying float vDist;
float h2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < ${Math.max(1, Math.round(octaves))}; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s;
}
// Distance to the nearest small crater, normalised by its own radius (< 1 inside). Only some cells hold one,
// with varied sizes, so the pattern never reads as a grid.
float pits(vec2 p) {
  vec2 i = floor(p), f = fract(p); float d = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    float k = h2(i + o + 3.7);
    if (k < 0.62) continue;
    vec2 r = o + vec2(h2(i + o), h2(i + o + 17.0)) * 0.7 + 0.15 - f;
    float radius = 0.08 + (k - 0.62) * 0.55;
    d = min(d, length(r) / radius);
  }
  return d;
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 xz = vWorld.xz;
  float near = 1.0 - smoothstep(28.0, 85.0, vDist);
  // Large soft albedo variation plus fine grain.
  float broad = fbm(xz * 0.045);
  float grain = vnoise(xz * 3.1) - 0.5;
  float albedo = 0.9 + (broad - 0.5) * 0.22 + grain * 0.08 * near;
  // Small pits: a darker bowl with a lit rim, only close to the camera.
  float c = pits(xz * 0.32 + broad * 1.5);
  albedo *= 1.0 - near * (smoothstep(1.0, 0.45, c) * 0.18 - smoothstep(1.25, 1.0, c) * smoothstep(0.85, 1.0, c) * 0.12);
  // Steep faces show layered rock.
  float steep = smoothstep(0.35, 0.6, 1.0 - vN.y);
  float strata = 0.93 + 0.07 * sin(vWorld.y * 3.2 + broad * 6.0 + vnoise(xz * 0.4) * 3.0);
  float mid = 1.0 - smoothstep(60.0, 150.0, vDist);
  albedo *= mix(1.0, strata * 0.92, steep * (0.35 + 0.65 * mid));
  diffuseColor.rgb *= albedo;
}`);
  };
  m.customProgramCacheKey = () => 'terrain' + octaves;
  return m;
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
