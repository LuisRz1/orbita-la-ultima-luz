// Builds the three.js objects for a level. Terrain light (sun, cast shadows, cavities) is baked once into vertex
// colours with three painted bands; characters and props use toon shading with ink outlines. No shadow maps.
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CircleGeometry, Color, CylinderGeometry, DirectionalLight,
  DodecahedronGeometry, DynamicDrawUsage, Float32BufferAttribute, Fog, Group, HemisphereLight, InstancedMesh, Matrix4,
  BackSide, Euler, Mesh, MeshBasicMaterial, MeshLambertMaterial, OctahedronGeometry, PlaneGeometry, Points, PointsMaterial, Quaternion, ShaderMaterial,
  RepeatWrapping, RingGeometry, Scene, SphereGeometry, Sprite, SpriteMaterial, Vector3, type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { LevelV2 } from '../core/contract/level-v2.ts';
import { heightAt, normalAt, type Heightfield } from '../core/heightfield.ts';
import { buildAstronaut, buildLuma, buildProp, colors, type Astronaut, type Luma } from './models.ts';
import { biome, earthTexture, footprintTexture, glowTexture, marsMoonTexture, outlineMaterial, terrainMaterial, toon } from './style.ts';

const fromBiome = () => ({
  sky: biome.skyTop, lit: biome.lit, mid: biome.mid, shadow: biome.shadow, deep: biome.deep, ink: biome.ink,
  accent: biome.cyan, warn: biome.amber,
});
/** Scene colours of the active biome; refreshed when a level's view is built. */
export const palette = fromBiome();

export type PointView = { id: string; beam: Mesh; ring: Mesh };
export type Ambience = { update(dt: number, camera: Vector3, time: number): void; setStorm(level: number): void };
export type Footprints = { place(x: number, y: number, z: number, facing: number): void };
export type Dust = { burst(x: number, y: number, z: number, count: number, spread: number): void; update(dt: number): void };
export type WorldView = {
  scene: Scene; player: Group; astronaut: Astronaut; luma: Group; lumaModel: Luma; shadow: Mesh; beacon: Mesh;
  points: Map<string, PointView>; echoes: Map<string, Mesh>;
  /** Atlas rocks (mint). `setScanned` dims one once it is in the atlas. */
  specimens: Map<string, Mesh>; setScanned(id: string, scanned: boolean): void; dust: Dust; footprints: Footprints; ambience: Ambience;
  /** Lamps that blink in sequence (ramp markers). */
  blinkers: Mesh[];
  sun: [number, number, number];
  dispose(): void;
};

export function sunDirection(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const a = azimuthDeg * Math.PI / 180, e = elevationDeg * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

/** Fraction of sunlight reaching (x, z): 0 when the terrain between it and the sun is higher than the ray. */
function sunVisibility(hf: Heightfield, x: number, z: number, sun: [number, number, number]) {
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

function terrainMesh(hf: Heightfield, sun: [number, number, number], octaves: number, cold: Circle[]) {
  const geometry = new PlaneGeometry(hf.size, hf.size, hf.res - 1, hf.res - 1);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position as BufferAttribute;
  const colorsOut = new Float32Array(pos.count * 3);
  const lit = new Color(palette.lit), mid = new Color(palette.mid), line = new Color(palette.ink), c = new Color();
  const shadow = new Color(palette.shadow), deep = new Color(palette.deep), dark = new Color(), space = new Color(biome.fog);
  const h = (x: number, z: number) => heightAt(hf, x, z);
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    pos.setY(k, hf.data[k]);
    const n = normalAt(hf, x, z);
    // Light relative to flat ground, so low suns still read: flat ≈ 0.75, sun-facing slopes brighter.
    const facing = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]) / Math.max(sun[1], 0.2);
    const direct = Math.min(1, facing / 1.35) * sunVisibility(hf, x, z, sun);
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
  return new Mesh(geometry, terrainMaterial(octaves, biome.plating));
}

function starfield(count: number) {
  const positions = new Float32Array(count * 3);
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1, phi = rand() * Math.PI * 2, r = 420, s = Math.sqrt(1 - u * u);
    positions.set([Math.cos(phi) * s * r, Math.abs(u) * r * 0.9 + 10, Math.sin(phi) * s * r], i * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(geometry, new PointsMaterial({ color: biome.stars, size: 1.4, sizeAttenuation: false, fog: false }));
}

/** Small decorative rocks: one instanced draw call, no collision, kept away from points of interest. */
function scatterRocks(level: LevelV2, hf: Heightfield, density: number) {
  const count = Math.round(320 * density * biome.rockScatter);
  if (!count) return new Group();
  const geo = new DodecahedronGeometry(1, 0);
  const rocks = new InstancedMesh(geo, toon(biome.rockLit), count);
  const outline = new InstancedMesh(geo, outlineMaterial(0.08), count);
  let seed = 99;
  const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3(), axis = new Vector3();
  let placed = 0;
  for (let tries = 0; placed < count && tries < count * 10; tries++) {
    const r = Math.sqrt(rand()) * 108, a = rand() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (level.points.some(pt => Math.hypot(pt.position.x - x, pt.position.z - z) < pt.radius + 2.5)) continue;
    if (level.props.some(pr => Math.hypot(pr.solid.x - x, pr.solid.z - z) < 4)) continue;
    if (Math.hypot(level.spawn.x - x, level.spawn.z - z) < 4) continue;
    const size = 0.12 + Math.pow(rand(), 3) * 0.75;
    p.set(x, heightAt(hf, x, z) + size * 0.25, z);
    q.setFromAxisAngle(axis.set(rand(), rand(), rand()).normalize(), rand() * 6);
    s.set(size, size * (0.5 + rand() * 0.4), size * (0.8 + rand() * 0.4));
    m.compose(p, q, s);
    rocks.setMatrixAt(placed, m); outline.setMatrixAt(placed, m);
    placed++;
  }
  rocks.count = outline.count = placed;
  const g = new Group();
  g.add(rocks, outline);
  return g;
}

/** Ring buffer of boot prints pressed into the regolith; one instanced draw call. */
function footprintPool(): { mesh: InstancedMesh; footprints: Footprints } {
  const max = 220;
  const geo = new PlaneGeometry(0.28, 0.42);
  geo.rotateX(-Math.PI / 2);
  const mat = new MeshBasicMaterial({ map: footprintTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false });
  const mesh = new InstancedMesh(geo, mat, max);
  mesh.count = 0;
  mesh.frustumCulled = false;
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), one = new Vector3(1, 1, 1);
  let next = 0, left = false;
  return {
    mesh,
    footprints: {
      place(x, y, z, facing) {
        left = !left;
        const side = left ? 0.11 : -0.11;
        p.set(x + Math.cos(facing) * side, y + 0.015, z - Math.sin(facing) * side);
        q.setFromEuler(e.set(0, facing, 0));
        m.compose(p, q, one);
        mesh.setMatrixAt(next, m);
        next = (next + 1) % max;
        mesh.count = Math.min(max, mesh.count + 1);
        mesh.instanceMatrix.needsUpdate = true;
      },
    },
  };
}

/** Faint Milky Way band painted on a sky dome behind the stars. */
function skyBand() {
  const mat = new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new Color(biome.skyTop) }, uHorizon: { value: new Color(biome.skyHorizon) }, uBand: { value: new Color(biome.milkyWay) } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir;
      uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBand;
      float h(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float n(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main() {
        vec3 axis = normalize(vec3(0.35, 0.55, 0.76));
        float d = dot(vDir, axis);
        float cloud = n(vDir * 6.0) * 0.6 + n(vDir * 14.0) * 0.3 + n(vDir * 30.0) * 0.1;
        float band = exp(-pow(d / 0.2, 2.0)) * smoothstep(0.25, 0.85, cloud);
        float dust = exp(-pow(d / 0.05, 2.0)) * smoothstep(0.55, 0.75, n(vDir * 20.0));
        vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.14, vDir.y));
        vec3 col = sky + uBand * band * 0.25 * smoothstep(-0.05, 0.12, vDir.y) - vec3(0.02) * dust;
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
      }`,
  });
  const dome = new Mesh(new SphereGeometry(460, 32, 16), mat);
  dome.renderOrder = -1;
  return dome;
}

/**
 * Ambient particles, one draw call each: levitated dust around the camera (stylised from the horizon glow seen by
 * Apollo 17 crews), sparkles orbiting uncollected echoes, frost falling inside cold zones (fiction) and your ship
 * crossing the sky in orbit. No meteor streaks: without an atmosphere they are not visible.
 */
function ambienceSystem(echoes: Map<string, Mesh>, density: number, cold: Circle[], heightAt0: (x: number, z: number) => number) {
  const group = new Group();
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cloud = (count: number, color: string, size: number, opacity: number, additive = false) => {
    const pos = new Float32Array(count * 3);
    const geo = new BufferGeometry();
    // BufferAttribute keeps a reference to `pos` (Float32BufferAttribute would copy it, and the per-frame updates
    // below would never reach the GPU: every particle stayed at the origin).
    const attr = new BufferAttribute(pos, 3);
    attr.setUsage(DynamicDrawUsage);
    geo.setAttribute('position', attr);
    const pts = new Points(geo, new PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false,
      blending: additive ? AdditiveBlending : undefined }));
    pts.frustumCulled = false;
    group.add(pts);
    return { pos, attr, count };
  };

  const radius = 20;
  const dust = cloud(Math.round(300 * density * biome.ambientDust), biome.airDust, 0.08, 0.4);
  const drift = new Float32Array(dust.count * 2);
  for (let i = 0; i < dust.count; i++) {
    dust.pos.set([(rand() - 0.5) * radius * 2, rand() * 6, (rand() - 0.5) * radius * 2], i * 3);
    drift.set([(rand() - 0.5) * 0.12, (rand() - 0.5) * 0.12], i * 2);
  }
  const sparks = cloud(6 * echoes.size, '#ffd59a', 0.09, 0.9, true);
  // Sunlit zones have no particles of their own; cold and dust zones do.
  const frostZone = cold.find(z => z.hazard !== 'sun');
  // Cold zones get falling frost (fiction); dust zones get sand swirling up in a slow devil.
  const swirling = frostZone?.hazard === 'dust';
  const frost = cloud(frostZone ? Math.round((swirling ? 320 : 120) * density) : 0, biome.hazardParticle, swirling ? 0.32 : 0.07, swirling ? 0.6 : 0.75);
  for (let i = 0; i < frost.count; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * (frostZone?.r ?? 1) * 0.8;
    frost.pos.set([(frostZone?.x ?? 0) + Math.cos(a) * r, rand() * 8, (frostZone?.z ?? 0) + Math.sin(a) * r], i * 3);
  }
  const ship = cloud(1, '#ffe3a3', 0.5, 1, true);
  (group.children.at(-1) as Points).material = new PointsMaterial({ color: '#ffe3a3', size: 3, sizeAttenuation: false, fog: false, transparent: true });

  const echoList = [...echoes.values()];
  let storm = 1;  const ambience: Ambience = {
    setStorm(level) { storm = level; },
    update(dt, cam, time) {
      // With wind, airborne dust streams downwind instead of drifting.
      const gust = biome.wind * (1.2 + Math.sin(time * 0.3) * 0.8);
      for (let i = 0; i < dust.count; i++) {
        const k = i * 3;
        dust.pos[k] += (drift[i * 2] + gust) * dt;
        dust.pos[k + 1] += 0.05 * dt;
        dust.pos[k + 2] += drift[i * 2 + 1] * dt;
        for (const [axis, c] of [[0, cam.x], [2, cam.z]] as const) {
          if (dust.pos[k + axis] < c - radius) dust.pos[k + axis] += radius * 2; else if (dust.pos[k + axis] > c + radius) dust.pos[k + axis] -= radius * 2;
        }
        if (dust.pos[k + 1] < cam.y - 4) dust.pos[k + 1] += 9; else if (dust.pos[k + 1] > cam.y + 5) dust.pos[k + 1] -= 9;
      }
      dust.attr.needsUpdate = true;
      echoList.forEach((e, j) => {
        for (let n = 0; n < 6; n++) {
          const k = (j * 6 + n) * 3, a = time * (0.9 + n * 0.15) + n * 1.05, r = 0.45 + 0.1 * Math.sin(time * 2 + n);
          if (!e.visible) { sparks.pos[k + 1] = -1e4; continue; }
          sparks.pos[k] = e.position.x + Math.cos(a) * r;
          sparks.pos[k + 1] = e.position.y + Math.sin(a * 1.7 + n) * 0.35;
          sparks.pos[k + 2] = e.position.z + Math.sin(a) * r;
        }
      });
      sparks.attr.needsUpdate = true;
      for (let i = 0; i < frost.count; i++) {
        const k = i * 3;
        if (swirling && frostZone) {
          // Each grain circles the zone centre while rising; a storm widens and speeds the swirl.
          const a = time * (0.35 + (i % 7) * 0.05) * storm + i * 2.4;
          const r = (0.15 + ((i * 7919) % 1000) / 1000) * frostZone.r * (0.3 + 0.2 * storm);
          frost.pos[k] = frostZone.x + Math.cos(a) * r;
          frost.pos[k + 2] = frostZone.z + Math.sin(a) * r;
          frost.pos[k + 1] += (0.3 + 0.4 * storm) * dt;
          const floor = heightAt0(frost.pos[k], frost.pos[k + 2]);
          if (frost.pos[k + 1] > floor + 1.5 + 2.5 * storm || frost.pos[k + 1] < floor) frost.pos[k + 1] = floor + (i % 3) * 0.3;
          continue;
        }
        frost.pos[k + 1] -= 0.2 * dt;
        frost.pos[k] += Math.sin(time + i) * 0.003;
        const floor = heightAt0(frost.pos[k], frost.pos[k + 2]);
        if (frost.pos[k + 1] < floor) frost.pos[k + 1] = floor + 6 + (i % 5);
      }
      if (frost.count) frost.attr.needsUpdate = true;
      // Your ship in orbit: one light crossing the sky every 90 s.
      const a = (time / 90) * Math.PI * 2;
      ship.pos.set([cam.x + Math.cos(a) * 380, 120 + Math.sin(a) * 160, cam.z + Math.sin(a * 0.5) * 200 - 150]);
      ship.attr.needsUpdate = true;
    },
  };
  return { group, ambience };
}

/**
 * Props never move, so every mesh sharing a material is baked into one geometry: hundreds of small parts (and their
 * ink outlines) become a few dozen draw calls. Meshes flagged `blink` stay separate so their visibility can toggle.
 */
function mergeStatic(root: Group, keep: Mesh[]) {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, { material: Material; geometries: BufferGeometry[] }>();
  const out = new Group();
  root.traverse(o => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData.blink) {
      const copy = mesh.clone(false);
      mesh.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
      out.add(copy); keep.push(copy);
      return;
    }
    const material = mesh.material as Material;
    let g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    const attrs = Object.keys(g.attributes).sort().join(',');
    const key = material.uuid + '|' + attrs;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { material, geometries: [] }));
    b.geometries.push(g);
  });
  for (const { material, geometries } of buckets.values()) {
    const merged = mergeGeometries(geometries);
    geometries.forEach(g => g.dispose());
    if (merged) out.add(new Mesh(merged, material));
  }
  return out;
}

/** Pooled dust puffs for landings and dashes. */
function dustPool(gravity: number, air: number): { points: Points; dust: Dust } {
  const max = 96;
  const pos = new Float32Array(max * 3), vel = new Float32Array(max * 3), life = new Float32Array(max);
  const geometry = new BufferGeometry();
  const attr = new BufferAttribute(pos, 3);
  attr.setUsage(DynamicDrawUsage);
  geometry.setAttribute('position', attr);
  const points = new Points(geometry, new PointsMaterial({ color: biome.puff, size: 0.22, transparent: true, opacity: 0.8, depthWrite: false }));
  points.frustumCulled = false;
  let next = 0, seed = 3;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < max; i++) pos[i * 3 + 1] = -1e4;
  return {
    points,
    dust: {
      burst(x, y, z, count, spread) {
        for (let n = 0; n < count; n++) {
          const i = next; next = (next + 1) % max;
          const a = rand() * Math.PI * 2, sp = spread * (0.4 + rand() * 0.6);
          pos.set([x, y + 0.05, z], i * 3);
          vel.set([Math.cos(a) * sp, 0.6 + rand() * 1.2, Math.sin(a) * sp], i * 3);
          life[i] = 0.7 + rand() * 0.5;
        }
      },
      update(dt) {
        for (let i = 0; i < max; i++) {
          if (life[i] <= 0) continue;
          // In vacuum dust flies in clean arcs and does not linger; with air it is slowed and hangs longer.
          life[i] -= dt / (1 + air * 0.6);
          vel[i * 3 + 1] -= gravity * dt;
          if (air) { const k = Math.max(0, 1 - air * dt); vel[i * 3] *= k; vel[i * 3 + 1] *= k; vel[i * 3 + 2] *= k; }
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          if (life[i] <= 0) pos[i * 3 + 1] = -1e4;
        }
        attr.needsUpdate = true;
      },
    },
  };
}

export function buildWorldView(level: LevelV2, hf: Heightfield, scatter = 1, octaves = 4): WorldView {
  Object.assign(palette, fromBiome());
  const scene = new Scene();
  scene.background = new Color(palette.sky);
  // On the Moon fog is a style choice (there is no air): it softens the far rim into the indigo horizon. On Mars
  // it is the real dusty atmosphere, so it starts closer.
  scene.fog = new Fog(biome.fog, biome.fogNear, biome.fogFar);
  const sun = sunDirection(level.sun.azimuth, level.sun.elevation);

  const light = new DirectionalLight(biome.sunColor, 2.4);
  light.position.set(sun[0] * 50, sun[1] * 50, sun[2] * 50);
  scene.add(light, new HemisphereLight(biome.hemiSky, biome.hemiGround, 1.1));
  const cold = level.zones.filter(z => z.drain || z.surge).map(z => ({ x: z.center.x, z: z.center.z, r: z.radius, hazard: z.hazard }));
  scene.add(terrainMesh(hf, sun, octaves, cold), scatterRocks(level, hf, scatter));
  if (biome.starCount) scene.add(starfield(biome.starCount));

  const glow = new Sprite(new SpriteMaterial({ map: glowTexture(biome.sunGlow), blending: AdditiveBlending, depthWrite: false, fog: false }));
  glow.position.set(sun[0] * 400, sun[1] * 400, sun[2] * 400);
  glow.scale.setScalar(biome.sunScale);
  scene.add(glow, skyBand());
  if (biome.sky === 'earth') {
    const earth = new Mesh(new SphereGeometry(16, 32, 20), new MeshLambertMaterial({ map: earthTexture(), fog: false }));
    earth.position.set(-140, 150, -330);
    earth.rotation.set(0.3, 1.2, 0.1);
    scene.add(earth);
  } else if (biome.sky === 'earth-below') {
    // Low orbit: Earth fills the lower sky beneath the decks, with a thin blue limb of atmosphere.
    const map = earthTexture();
    map.repeat.set(3, 2);
    map.wrapS = map.wrapT = RepeatWrapping;
    const earth = new Mesh(new SphereGeometry(330, 64, 40), new MeshLambertMaterial({ map, fog: false }));
    earth.position.set(40, -520, -260);
    earth.rotation.set(0.4, 0.8, 0);
    const limb = new Mesh(new SphereGeometry(342, 64, 40), new MeshBasicMaterial({ color: '#5fa8ff', transparent: true, opacity: 0.22, side: BackSide, fog: false, depthWrite: false }));
    limb.position.copy(earth.position);
    scene.add(earth, limb);
  } else {
    // Mars as seen from its surface: a smaller Sun with a blue halo (dust scatters blue light forward around it),
    // and Phobos and Deimos, small and dark. Their sizes are exaggerated so they read on screen.
    const core = new Sprite(new SpriteMaterial({ map: glowTexture('#fff8ea'), blending: AdditiveBlending, depthWrite: false, fog: false }));
    core.position.copy(glow.position);
    core.scale.setScalar(26);
    scene.add(core);
    for (const [x, y, z, r, seed] of [[160, 120, -300, 7, 3], [-230, 170, -260, 3.5, 9]] as const) {
      const moonlet = new Mesh(new SphereGeometry(r, 18, 12), new MeshLambertMaterial({ map: marsMoonTexture(seed), fog: false }));
      moonlet.scale.set(1.25, 0.9, 1);
      moonlet.position.set(x, y, z);
      scene.add(moonlet);
    }
  }

  const blinkers: Mesh[] = [];
  const propsRoot = new Group();
  for (const p of level.props) propsRoot.add(buildProp(p, heightAt(hf, p.solid.x, p.solid.z)));
  scene.add(mergeStatic(propsRoot, blinkers));

  const mast = level.props.find(p => p.kind === 'mast')?.solid;
  const beacon = new Mesh(new SphereGeometry(0.4, 12, 8), new MeshBasicMaterial({ color: palette.warn, fog: false }));
  if (mast) beacon.position.set(mast.x, mast.top + 0.4, mast.z);
  scene.add(beacon);

  const points = new Map<string, PointView>();
  const beamGeo = new CylinderGeometry(0.18, 0.18, 60, 6, 1, true);
  beamGeo.translate(0, 30, 0);
  for (const p of level.points) {
    const y = heightAt(hf, p.position.x, p.position.z);
    const beam = new Mesh(beamGeo, new MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false, fog: false }));
    beam.position.set(p.position.x, y, p.position.z);
    const ring = new Mesh(new RingGeometry(p.radius - 0.12, p.radius, 40), new MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.55, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.position.x, y + 0.06, p.position.z);
    scene.add(beam, ring);
    points.set(p.id, { id: p.id, beam, ring });
  }

  const echoes = new Map<string, Mesh>();
  const echoGeo = new OctahedronGeometry(0.3);
  const echoMat = new MeshBasicMaterial({ color: palette.warn });
  for (const c of level.collectibles) {
    const m = new Mesh(echoGeo, echoMat);
    m.add(new Mesh(echoGeo, outlineMaterial(0.04)));
    m.position.set(c.position.x, c.y ?? heightAt(hf, c.position.x, c.position.z) + 0.9, c.position.z);
    scene.add(m);
    echoes.set(c.id, m);
  }

  // Atlas rocks: a single mint accent (LUNA-NACAR.md) so they read as catalogue targets, never as loot or hazards.
  const specimens = new Map<string, Mesh>();
  const rockGeo = new DodecahedronGeometry(0.6, 0);
  const rockFresh = toon('#9dffc8', '#1d4a36'), rockDone = toon('#6f8f82');
  for (const sp of level.specimens ?? []) {
    const m = new Mesh(rockGeo, rockFresh);
    m.add(new Mesh(rockGeo, outlineMaterial(0.05)));
    m.position.set(sp.position.x, heightAt(hf, sp.position.x, sp.position.z) + 0.2, sp.position.z);
    m.rotation.set(0.4, sp.position.x, 0.2);
    m.scale.set(1, 0.7, 0.85);
    scene.add(m);
    specimens.set(sp.id, m);
  }
  const setScanned = (id: string, scanned: boolean) => { const m = specimens.get(id); if (m) m.material = scanned ? rockDone : rockFresh; };

  const astronaut = buildAstronaut();
  const player = astronaut.group;
  const lumaModel = buildLuma();
  const luma = lumaModel.group;
  const shadow = new Mesh(new CircleGeometry(0.5, 20), new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.45, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  const { points: dustPoints, dust } = dustPool(level.realGravity, biome.air);
  const { mesh: printMesh, footprints } = footprintPool();
  const { group: ambienceGroup, ambience } = ambienceSystem(echoes, scatter, cold, (x, z) => heightAt(hf, x, z));
  scene.add(player, luma, shadow, dustPoints, printMesh, ambienceGroup);

  return {
    scene, player, astronaut, luma, lumaModel, shadow, beacon, points, echoes, specimens, setScanned, dust, footprints, ambience, blinkers, sun,
    dispose() {
      const seen = new Set<unknown>();
      scene.traverse(o => {
        const m = o as Mesh;
        if (m.geometry && !seen.has(m.geometry)) { seen.add(m.geometry); m.geometry.dispose(); }
        const mat = m.material as Material | Material[] | undefined;
        for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) if (!seen.has(x)) { seen.add(x); x.dispose(); }
      });
    },
  };
}
