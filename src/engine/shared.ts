// Uniforms shared by every patched material of the realistic look, and the patcher that binds them.
// The idea (one uniform object for the whole scene plus named hooks into MeshStandardMaterial) follows Valle Morta's
// `shared.js` / `materials.js` (MIT, see THIRD-PARTY-NOTICES.md); the code here is our own.
import {
  Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, UnsignedByteType, Vector3, Vector4,
  type IUniform, type Material, type Texture,
} from 'three';

/**
 * Scene-wide uniforms. Every material patched with `enhance` references these same objects, so writing a value here
 * updates the whole scene. Colours are linear and scene-referred (the sun colour already carries its intensity).
 */
export const G = {
  /** Seconds since the level started (0 with reduced motion is the caller's choice). */
  uTime: { value: 0 },
  /** Unit vector toward the Sun, world space. */
  uSunDir: { value: new Vector3(0.4, 0.6, 0.3).normalize() },
  /** Sun colour × intensity, as given to the DirectionalLight. */
  uSunColor: { value: new Color(1, 1, 1) },
  /** Mean radiance of the upper and lower hemispheres of the environment (for cheap custom shaders). */
  uAmbSky: { value: new Color(0, 0, 0) },
  uAmbGround: { value: new Color(0.02, 0.02, 0.02) },
  /** 256² tiling value noise, four independent channels. Created on first use (see `noiseTexture`). */
  uNoiseTex: { value: null as Texture | null },
  /** Height fog (Mars): x = density at the base height (1/m), y = 1/scale height (1/m), z = base height (m). x = 0 turns it off. */
  uFog: { value: new Vector4(0, 0, 0, 0) },
  /** In-scatter colour of the fog away from the Sun, and toward it. */
  uFogColor: { value: new Color(0, 0, 0) },
  uFogSunColor: { value: new Color(0, 0, 0) },
} satisfies Record<string, IUniform>;

/** Declarations for the shared uniforms plus the fog helpers. Included once per shader stage by `enhance`. */
export const GLSL_SHARED = /* glsl */`
#ifndef ORBITA_SHARED
#define ORBITA_SHARED
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform sampler2D uNoiseTex;
uniform vec4 uFog;
uniform vec3 uFogColor;
uniform vec3 uFogSunColor;
// Hemispherical ambient radiance for a world-space normal.
vec3 gAmbient(vec3 n) { return mix(uAmbGround, uAmbSky, n.y * 0.5 + 0.5); }
// Optical depth of an exponential layer along the segment camera → point (closed form).
float gFogDepth(float camY, float dy, float dist) {
  float h0 = uFog.y * (camY - uFog.z), t = uFog.y * dy;
  float e0 = exp(-clamp(h0, -8.0, 40.0));
  float f = abs(t) > 1e-3 ? (e0 - exp(-clamp(h0 + t, -8.0, 40.0))) / t : e0 * (1.0 - 0.5 * t);
  return uFog.x * dist * f;
}
// Fog between the camera and a world position: dust lit by the sky, warmer and brighter toward the Sun.
vec3 gApplyFog(vec3 color, vec3 camPos, vec3 worldPos) {
  if (uFog.x <= 0.0) return color;
  vec3 v = worldPos - camPos;
  float dist = length(v);
  float T = exp(-gFogDepth(camPos.y, v.y, dist));
  float s = max(dot(v / max(dist, 1e-4), uSunDir), 0.0);
  vec3 scatter = mix(uFogColor, uFogSunColor, 0.6 * pow(s, 4.0) + 0.4 * pow(s, 24.0));
  return color * T + scatter * (1.0 - T);
}
#endif
`;

let noise: DataTexture | null = null;
/** Tiling value noise (256², RGBA, each channel independent, four octaves). Seeded: identical on every load. */
export function noiseTexture(): DataTexture {
  if (noise) return noise;
  const size = 256, data = new Uint8Array(size * size * 4);
  let seed = 20261115;
  const rand = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9 | 0) >>> 0) / 4294967296;
  for (let ch = 0; ch < 4; ch++) {
    const acc = new Float32Array(size * size);
    let amp = 0.5, total = 0;
    for (const period of [8, 16, 32, 64]) {
      const lattice = new Float32Array(period * period);
      for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
      const scale = period / size;
      for (let y = 0; y < size; y++) {
        const fy = y * scale, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
        const r0 = (y0 % period) * period, r1 = ((y0 + 1) % period) * period;
        for (let x = 0; x < size; x++) {
          const fx = x * scale, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx);
          const c0 = x0 % period, c1 = (x0 + 1) % period;
          const a = lattice[r0 + c0] + (lattice[r0 + c1] - lattice[r0 + c0]) * sx;
          const b = lattice[r1 + c0] + (lattice[r1 + c1] - lattice[r1 + c0]) * sx;
          acc[y * size + x] += (a + (b - a) * sy) * amp;
        }
      }
      total += amp; amp *= 0.5;
    }
    for (let i = 0; i < acc.length; i++) data[i * 4 + ch] = Math.max(0, Math.min(255, Math.round(acc[i] / total * 255)));
  }
  noise = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  noise.wrapS = noise.wrapT = RepeatWrapping;
  noise.magFilter = LinearFilter; noise.minFilter = LinearMipmapLinearFilter;
  noise.generateMipmaps = true;
  noise.needsUpdate = true;
  G.uNoiseTex.value = noise;
  return noise;
}

export type EnhanceOptions = {
  /** Program cache key: materials with the same key and the same hooks share one compiled program. */
  key: string;
  uniforms?: Record<string, IUniform>;
  /** GLSL before main() of the vertex shader. */
  vertexPars?: string;
  /** GLSL right after <begin_vertex>; may modify `transformed`. */
  vertexBegin?: string;
  /** GLSL before main() of the fragment shader. */
  fragmentPars?: string;
  /** GLSL after the maps are sampled; may modify `diffuseColor`, `roughnessFactor`, `metalnessFactor`, `normal`. */
  surface?: string;
  /** GLSL expression (float) multiplied into indirect light. May read anything the surface hook declared at main() scope. */
  ao?: string;
  /** GLSL expression (float) multiplied into direct light: baked sun visibility on tiers without a shadow map. */
  sun?: string;
  /** GLSL after the lights; may add to `totalEmissiveRadiance`. */
  emissive?: string;
  /** Skip the shared height fog (three's own fog chunk stays). */
  noFog?: boolean;
};

function swap(source: string, search: string, replacement: string, key: string) {
  // A missing chunk would silently drop the hook; three is pinned, so this only fires after an upgrade.
  if (!source.includes(search)) throw new Error(`enhance(${key}): shader chunk not found: ${search}`);
  return source.replace(search, replacement);
}

/**
 * Patches a lit three.js material (MeshStandardMaterial / MeshPhysicalMaterial; Lambert works for every hook except
 * roughness and metalness) with named hooks and binds the shared uniforms. Inside every hook the fragment shader has
 * `vWorld` (world position, also valid for instanced meshes) and the `G` uniforms.
 */
export function enhance<T extends Material>(material: T, opts: EnhanceOptions): T {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, G, opts.uniforms);
    const k = opts.key;
    let vs = shader.vertexShader;
    vs = swap(vs, '#include <common>', `#include <common>\n${GLSL_SHARED}\nvarying vec3 vWorld;\n${opts.vertexPars ?? ''}`, k);
    vs = swap(vs, '#include <begin_vertex>', `#include <begin_vertex>\n${opts.vertexBegin ?? ''}`, k);
    vs = swap(vs, '#include <project_vertex>', `#include <project_vertex>
{
  vec4 gWorld = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    gWorld = batchingMatrix * gWorld;
  #endif
  #ifdef USE_INSTANCING
    gWorld = instanceMatrix * gWorld;
  #endif
  vWorld = (modelMatrix * gWorld).xyz;
}`, k);
    let fs = shader.fragmentShader;
    fs = swap(fs, '#include <common>', `#include <common>\n${GLSL_SHARED}\nvarying vec3 vWorld;\n${opts.fragmentPars ?? ''}`, k);
    if (opts.surface) fs = swap(fs, '#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${opts.surface}`, k);
    if (opts.emissive) fs = swap(fs, '#include <lights_fragment_end>', `#include <lights_fragment_end>\n${opts.emissive}`, k);
    if (opts.ao || opts.sun) fs = swap(fs, '#include <aomap_fragment>', `#include <aomap_fragment>
${opts.ao ? `{ float gAO = ${opts.ao}; reflectedLight.indirectDiffuse *= gAO; reflectedLight.indirectSpecular *= gAO; }` : ''}
${opts.sun ? `{ float gSun = ${opts.sun}; reflectedLight.directDiffuse *= gSun; reflectedLight.directSpecular *= gSun; }` : ''}`, k);
    if (!opts.noFog) fs = swap(fs, '#include <fog_fragment>', `#ifdef USE_FOG
  gl_FragColor.rgb = gApplyFog(gl_FragColor.rgb, cameraPosition, vWorld);
#endif`, k);
    shader.vertexShader = vs;
    shader.fragmentShader = fs;
  };
  material.customProgramCacheKey = () => 'enh:' + opts.key;
  material.needsUpdate = true;
  return material;
}
