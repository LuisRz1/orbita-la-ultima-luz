// Ground of a level: the terrain mesh and its scattered rocks (package B owns this file).
// «Ilustrado» is the original look, moved here verbatim from world-view.ts and style.ts: sun, cast shadows and
// cavities baked once into vertex colours with three painted bands. «Realista» is a PHASE 0 STUB: the same grid with
// a plain MeshStandardMaterial that casts and receives real shadows; the contract is `buildGround()`.
import {
  BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, type BufferAttribute, type Vector3,
  type WebGLRenderer,
} from 'three';
import type { LevelV2, SurfaceMarking } from '../core/contract/level-v2.ts';
import { heightAt, normalAt, type Heightfield } from '../core/heightfield.ts';
import type { Lighting } from './lighting.ts';
import { look } from './look.ts';
import { enhance } from './shared.ts';
import type { Tier } from './quality.ts';
import { scatterRocks } from './rocks.ts';
import { biome } from './style.ts';

export type GroundOptions = {
  tier: Tier;
  /** Density multiplier for scattered rocks (the tier's `scatter`). */
  scatter: number;
  lighting: Lighting;
  /** For GPU texture bakes; null when the caller has none (tests, tools). */
  renderer: WebGLRenderer | null;
};
export type Ground = {
  group: Group;
  /** Per-vertex sun visibility (0–1) of the terrain grid, row-major like the heightfield: the baked shadow term for
   * tiers without a shadow map. */
  bakedSun: Float32Array;
  /** Optional per-frame hook (camera position, seconds): distance fades, skirt recentring. */
  update?(camera: Vector3, time: number): void;
};

/** Fraction of sunlight reaching (x, z): 0 when the terrain between it and the sun is higher than the ray. */
export function sunVisibility(hf: Heightfield, x: number, z: number, sun: [number, number, number]) {
  const flat = Math.hypot(sun[0], sun[2]), rise = sun[1] / flat;
  const dx = sun[0] / flat, dz = sun[2] / flat, h0 = heightAt(hf, x, z) + 0.15;
  let lit = 1;
  for (let d = 1.5; d < 110; d += d < 20 ? 1 : 2.5) {
    // Clearance between the sun ray and the terrain under it; a small clearance gives a soft edge.
    const clearance = h0 + d * rise - heightAt(hf, x + dx * d, z + dz * d);
    if (clearance <= 0) return 0;
    lit = Math.min(lit, clearance / (0.3 + d * 0.08));
  }
  return Math.min(1, lit);
}

type Circle = { x: number; z: number; r: number; hazard?: 'cold' | 'dust' | 'sun' };
const hazardCircles = (level: LevelV2): Circle[] =>
  level.zones.filter(z => z.drain || z.surge).map(z => ({ x: z.center.x, z: z.center.z, r: z.radius, hazard: z.hazard }));

/**
 * Terrain look on top of the baked vertex light: per-pixel regolith detail (multi-scale noise and small pits,
 * no visible tiling) and rock strata on steep faces, fading with distance.
 * `octaves` trades detail for cost on low-end GPUs.
 */
function terrainMaterial(octaves: number, plating: boolean, day: boolean) {
  const m = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  if (plating) {
    // Station deck: panel seams every 3 m, rivet rows and a faint brushed variation instead of regolith.
    m.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;\nfloat h2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }')
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  // The void under the decks is not drawn: each deck reads as a 1.5 m slab floating over Earth.
  if (vWorld.y < -1.5) discard;
  vec2 cell = vWorld.xz / 3.0;
  vec2 f = abs(fract(cell) - 0.5);
  float seam = smoothstep(0.47, 0.495, max(f.x, f.y));
  vec2 r = abs(fract(cell * 4.0) - 0.5);
  float rivet = (1.0 - smoothstep(0.06, 0.1, length(r))) * step(0.4, max(f.x, f.y));
  float tone = 0.94 + (h2(floor(cell)) - 0.5) * 0.08;
  diffuseColor.rgb *= tone * (1.0 - seam * 0.35) * (1.0 - rivet * 0.25);
}`);
    };
    m.customProgramCacheKey = () => 'plating';
    return m;
  }
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
  ${day ? '' : `
    float c = pits(xz * 0.32 + broad * 1.5);
    albedo *= 1.0 - near * (smoothstep(1.0, 0.45, c) * 0.18 - smoothstep(1.25, 1.0, c) * smoothstep(0.85, 1.0, c) * 0.12);`}
  // Steep faces show layered rock.
  float steep = smoothstep(0.35, 0.6, 1.0 - vN.y);
  float strata = 0.93 + 0.07 * sin(vWorld.y * 3.2 + broad * 6.0 + vnoise(xz * 0.4) * 3.0);
  float mid = 1.0 - smoothstep(60.0, 150.0, vDist);
  albedo *= mix(1.0, strata * 0.92, steep * (0.35 + 0.65 * mid));
  diffuseColor.rgb *= albedo;
}`);
  };
  m.customProgramCacheKey = () => (day?'day-terrain':'terrain') + octaves;
  return m;
}

type Aprons = LevelV2['terrain']['aprons'];
function apronCoverage(aprons:NonNullable<Aprons>,x:number,z:number){
  let coverage=0;
  for(const {min,max} of aprons){
    const edge=Math.min(x-min.x,max.x-x,z-min.z,max.z-z);
    if(edge>=1.6)return 1;
    coverage=Math.max(coverage,edge/1.6);
  }
  return coverage;
}

function paintedMarkings(hf:Heightfield,markings:SurfaceMarking[]) {
  const positions:number[]=[],colors:number[]=[];
  const paint=new Color();
  function vertex(x:number,z:number){
    positions.push(x,heightAt(hf,x,z)+.028,z);
    colors.push(paint.r,paint.g,paint.b);
  }
  for(const {min,max,color} of markings){
    paint.set(color);
    const nx=Math.ceil((max.x-min.x)/2),nz=Math.ceil((max.z-min.z)/2);
    const dx=(max.x-min.x)/nx,dz=(max.z-min.z)/nz;
    for(let row=0;row<nz;row++)for(let col=0;col<nx;col++){
      const x=min.x+col*dx,z=min.z+row*dz;
      vertex(x,z);vertex(x,z+dz);vertex(x+dx,z);
      vertex(x+dx,z);vertex(x,z+dz);vertex(x+dx,z+dz);
    }
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  return new Mesh(geometry,new MeshBasicMaterial({vertexColors:true,toneMapped:false}));
}

/** The illustrated terrain: light baked into banded vertex colours, per-pixel albedo detail, no shadow map. */
function terrainIllustrated(hf: Heightfield, sun: [number, number, number], octaves: number, cold: Circle[], aprons:Aprons) {
  const geometry = new PlaneGeometry(hf.size, hf.size, hf.res - 1, hf.res - 1);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position as BufferAttribute;
  const colorsOut = new Float32Array(pos.count * 3), bakedSun = new Float32Array(pos.count);
  const lit = new Color(biome.lit), mid = new Color(biome.mid), line = new Color(biome.ink), c = new Color();
  const shadow = new Color(biome.shadow), deep = new Color(biome.deep), dark = new Color(), space = new Color(biome.fog);
  const concrete = new Color('#919c9d'), paved = new Color();
  const h = (x: number, z: number) => heightAt(hf, x, z);
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    pos.setY(k, hf.data[k]);
    const n = normalAt(hf, x, z);
    // Light relative to flat ground, so low suns still read: flat ≈ 0.75, sun-facing slopes brighter.
    const facing = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]) / Math.max(sun[1], 0.2);
    const visible = sunVisibility(hf, x, z, sun);
    bakedSun[k] = visible;
    const direct = Math.min(1, facing / 1.35) * visible;
    // Painted bands with a narrow blend between them, like brush edges.
    const toLit = Math.min(1, Math.max(0, (direct - 0.56) / 0.08)), toMid = Math.min(1, Math.max(0, (direct - 0.14) / 0.06));
    // Inside cold zones the unlit band sinks to the deeper violet.
    let inCold = 0;
    for (const zone of cold) {
      if (zone.hazard && zone.hazard !== 'cold') continue;
      const edge = (Math.hypot(x - zone.x, z - zone.z) - zone.r * 0.6) / (zone.r * 0.4);
      inCold = Math.max(inCold, 1 - Math.min(1, Math.max(0, edge)));
    }
    dark.copy(shadow).lerp(deep, inCold);
    c.copy(dark).lerp(mid, toMid).lerp(lit, toLit);
    if(aprons)c.lerp(paved.copy(concrete).multiplyScalar(.48+.52*toLit),apronCoverage(aprons,x,z));
    // Cavity and crest terms from curvature: hollows darken; sharp breaks get an ink line.
    const lap = (h(x + 2, z) + h(x - 2, z) + h(x, z + 2) + h(x, z - 2) - 4 * hf.data[k]) / 4;
    c.multiplyScalar(Math.min(1.0, Math.max(0.62, 1 - lap * 0.7)));
    if (Math.abs(lap) > 0.55) c.lerp(line, Math.min(0.75, (Math.abs(lap) - 0.55) * 1.2));
    // Under a station deck the terrain is the void: it takes the space colour so the deck sides fade into it.
    if (biome.voidBelow !== null && hf.data[k] < biome.voidBelow) c.copy(space);
    colorsOut[k * 3] = c.r; colorsOut[k * 3 + 1] = c.g; colorsOut[k * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colorsOut, 3));
  geometry.computeVertexNormals();
  return { mesh: new Mesh(geometry, terrainMaterial(octaves, biome.plating, biome.sky==='day')), bakedSun };
}

/** PHASE 0 STUB of the realistic terrain: the heightfield grid with one flat physically based material. */
function terrainRealistic(hf: Heightfield, sun: [number, number, number], shadows: boolean, aprons:Aprons) {
  const geometry = new PlaneGeometry(hf.size, hf.size, hf.res - 1, hf.res - 1);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position as BufferAttribute;
  const bakedSun = new Float32Array(pos.count), tint = new Float32Array(pos.count * 3);
  const ground=new Color(biome.real.ground), concrete=new Color('#919c9d'), base=new Color();
  for (let k = 0; k < pos.count; k++) {
    pos.setY(k, hf.data[k]);
    const x=pos.getX(k), z=pos.getZ(k);
    const visible = sunVisibility(hf, x, z, sun);
    bakedSun[k] = visible;
    // Without a shadow map the baked visibility darkens the albedo instead (crude; B replaces it with the `sun` hook).
    const light=shadows?1:.25+.75*visible;
    if(aprons)base.copy(ground).lerp(concrete,apronCoverage(aprons,x,z)).multiplyScalar(light).toArray(tint,k*3);
    else tint.fill(light,k*3,k*3+3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(tint, 3));
  geometry.computeVertexNormals();
  const material = new MeshStandardMaterial({ color: aprons?'#ffffff':biome.real.ground, roughness: biome.plating ? 0.55 : 0.95, metalness: 0, vertexColors: true });
  if (biome.voidBelow !== null) {
    // Station: the void under the decks is not drawn, so each deck reads as a slab floating over Earth. Panel seams
    // every 3 m darken the paint a little.
    enhance(material, { key: 'deck', surface: `
      if (vWorld.y < -1.5) discard;
      { vec2 f = abs(fract(vWorld.xz / 3.0) - 0.5); float seam = smoothstep(0.47, 0.495, max(f.x, f.y));
        diffuseColor.rgb *= (0.92 + 0.16 * texture2D(uNoiseTex, vWorld.xz / 48.0).r) * (1.0 - seam * 0.45);
        roughnessFactor = mix(roughnessFactor, 0.9, seam); }` });
  } else {
    // Regolith without textures: albedo mottling at three scales and a bump from the shared noise, strongest near
    // the camera (fine grain) and fading into broad undulation far away.
    enhance(material, { key: 'regolith', fragmentPars: `
      float gH(vec2 p) { return texture2D(uNoiseTex, p / 37.0).r * 0.6 + texture2D(uNoiseTex, p / 5.3).g * 0.28 + texture2D(uNoiseTex, p / 0.9).b * 0.12; }`,
      surface: `
      { vec2 p = vWorld.xz; float d = length(cameraPosition - vWorld);
        float broad = texture2D(uNoiseTex, p / 190.0).a, mid = texture2D(uNoiseTex, p / 23.0).r, fine = texture2D(uNoiseTex, p / 1.7).g;
        diffuseColor.rgb *= 0.72 + 0.34 * broad + 0.2 * (mid - 0.5) + 0.16 * (fine - 0.5) * smoothstep(40.0, 4.0, d);
        float e = 0.06 + d * 0.004, h0 = gH(p);
        vec2 slope = vec2(gH(p + vec2(e, 0.0)) - h0, gH(p + vec2(0.0, e)) - h0) / e;
        vec3 bumpW = normalize(vec3(-slope.x, 1.0, -slope.y) * vec3(0.35, 1.0, 0.35));
        vec3 nW = inverseTransformDirection(normal, viewMatrix);
        nW = normalize(nW + vec3(bumpW.x, 0.0, bumpW.z) * smoothstep(120.0, 10.0, d));
        normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz); }` });
  }
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  // The terrain casts too: crater rims and ridges throw long shadows under a low sun.
  mesh.castShadow = shadows && biome.voidBelow === null;
  return { mesh, bakedSun };
}

/**
 * Builds the ground for the active look. `sun` is the unit vector toward the Sun (also in `G.uSunDir`).
 * Meshes set their own castShadow / receiveShadow; small rocks (under 0.9 m) never cast.
 */
export function buildGround(level: LevelV2, hf: Heightfield, sun: [number, number, number], opts: GroundOptions): Ground {
  const group = new Group();
  const { mesh, bakedSun } = look.real
    ? terrainRealistic(hf, sun, opts.lighting.shadows, level.terrain.aprons)
    : terrainIllustrated(hf, sun, opts.tier === 'low' ? 3 : 4, hazardCircles(level), level.terrain.aprons);
  group.add(mesh, scatterRocks(level, hf, opts.scatter, { shadows: opts.lighting.shadows }));
  if(level.terrain.markings?.length)group.add(paintedMarkings(hf,level.terrain.markings));
  return { group, bakedSun };
}
