// Builds the three.js objects for a level and wires the pieces together: lighting (lighting.ts), ground and rocks
// (ground.ts), props and characters (models.ts), sky, particles and the gameplay cues (beams, lamps, rings).
// Illustrated look: terrain light baked into vertex colours, toon shading and ink outlines, no shadow maps.
// Realistic look: one hard Sun with a shadow map, image-based fill, physically based materials, no ink.
import {
  AdditiveBlending, NormalBlending, BufferAttribute, BufferGeometry, CircleGeometry, Color, CylinderGeometry,
  DodecahedronGeometry, DynamicDrawUsage, Float32BufferAttribute, Fog, FogExp2, Group, InstancedMesh, Matrix4,
  BackSide, Euler, Mesh, MeshBasicMaterial, MeshLambertMaterial, OctahedronGeometry, PlaneGeometry, Points, PointsMaterial, Quaternion, ShaderMaterial,
  Line, LineBasicMaterial, LineSegments, RepeatWrapping, RingGeometry, Scene, SphereGeometry, Sprite, SpriteMaterial, Vector3, type Material, type Object3D, type WebGLRenderer,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { LevelV2, Prop } from '../core/contract/level-v2.ts';
import { heightAt, type Heightfield } from '../core/heightfield.ts';
import { buildEarthProp } from './earth-props.ts';
import { buildGround } from './ground.ts';
import { createLighting, type Lighting } from './lighting.ts';
import { look } from './look.ts';
import { buildAstronaut, buildCrewFigure, buildLuma, buildProp, colors, type Astronaut, type Luma } from './models.ts';
import { buildStationHabitat } from './station-habitat.ts';
import { tiers, type Tier } from './quality.ts';
import { G, noiseTexture } from './shared.ts';
import { biome, earthTexture, footprintTexture, glowColor, glowTexture, inked, marsMoonTexture, outlineMaterial, toon } from './style.ts';

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
type CrewFigure = {group:Group;rig?:Astronaut};
export type WorldView = {
  scene: Scene; player: Group; astronaut: Astronaut; luma: Group; lumaModel: Luma; shadow: Mesh; beacon: Mesh;
  points: Map<string, PointView>; echoes: Map<string, Mesh>;
  hardware: Map<Prop, Group>; anchorLine: Line | null;
  /** Atlas rocks (mint). `setScanned` dims one once it is in the atlas. */
  specimens: Map<string, Mesh>; setScanned(id: string, scanned: boolean): void;
  /** Side-mission beacons: a post with a lamp that lights up once repaired. */
  beacons: Map<string, Mesh>; setBeacon(id: string, lit: boolean): void;
  /** Geophone sites (S1): a short post whose lamp lights once a geophone is planted. */
  geophones: Map<string, Mesh>; setGeophone(id: string, on: boolean): void;
  /** Rescued crew figures by id (empty unless the level has a crew). */
  crew: Map<string, CrewFigure>; dust: Dust; footprints: Footprints; ambience: Ambience;
  /** Switches between the plain sky band and the painted nebula (setting); `tick` drifts the nebula. */
  setSky(painted: boolean): void; tickSky(time: number): void;
  /** Lamps that blink in sequence (ramp markers). */
  blinkers: Mesh[];
  sun: [number, number, number];
  lighting: Lighting;
  /** Once per rendered frame: shadow volume, shared uniforms and the ground's own per-frame work. */
  tick(camera: Vector3, time: number): void;
  dispose(): void;
};

export function sunDirection(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const a = azimuthDeg * Math.PI / 180, e = elevationDeg * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

type Circle = { x: number; z: number; r: number; hazard?: 'cold' | 'dust' | 'sun' };

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

/** Ring buffer of boot prints pressed into the regolith; one instanced draw call. */
function footprintPool(): { mesh: InstancedMesh; footprints: Footprints } {
  const max = 480;
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

/**
 * Optional painted sky: a domain-warped nebula posterised into soft bands so it reads like the cel-shaded ground
 * (fiction, an art choice). Drifts slowly; one dome, one draw call. Built only for biomes with a night sky.
 */
function paintedSky(colors: [string, string]) {
  const mat = new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTime: { value: 0 }, uTop: { value: new Color(biome.skyTop) }, uHorizon: { value: new Color(biome.skyHorizon) },
      uA: { value: new Color(colors[0]) }, uB: { value: new Color(colors[1]) },
    },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir;
      uniform float uTime; uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uA; uniform vec3 uB;
      float h(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float n(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
      // Soft posterisation: flat bands with a narrow blend, like brush layers.
      float bands(float v, float k) { float x = v * k; return (floor(x) + smoothstep(0.85, 1.0, fract(x))) / k; }
      void main() {
        vec3 d = vDir * 2.2 + vec3(uTime * 0.004, 0.0, uTime * 0.002);
        vec3 w = vec3(fbm(d + 3.1), fbm(d + 7.4), fbm(d + 1.3));
        float cloud = fbm(d + w * 1.6);
        float rim = fbm(d * 2.5 + w * 2.0);
        vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.3, vDir.y));
        float body = bands(smoothstep(0.34, 0.72, cloud), 4.0);
        float glow = bands(smoothstep(0.5, 0.85, rim * cloud * 1.7), 3.0);
        float up = smoothstep(-0.02, 0.18, vDir.y);
        vec3 col = mix(sky, uA * 0.85, body * 0.85 * up);
        col = mix(col, uB, glow * 0.6 * up);
        // A few bright knots where the clouds are densest: young stars lighting the gas.
        col += uB * pow(max(0.0, cloud - 0.68), 2.0) * 6.0 * up;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const dome = new Mesh(new SphereGeometry(455, 32, 16), mat);
  dome.renderOrder = -1;
  return dome;
}

/** Daylight over Earth or a faint Milky Way band behind the stars. */
function skyBand() {
  const day=biome.sky==='day';
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
        ${day ? `
        vec3 sky = mix(uHorizon,uTop,smoothstep(-0.04,0.68,vDir.y));
        vec3 p = vDir * vec3(7.0,18.0,7.0);
        float clouds = smoothstep(0.50,0.73,0.72*n(p)+0.28*n(p*2.4));
        float height = smoothstep(0.01,0.21,vDir.y)*(1.0-smoothstep(0.73,0.96,vDir.y));
        gl_FragColor = vec4(mix(sky,vec3(0.93,0.95,0.94),0.55*height*clouds),1.0);
        #include <colorspace_fragment>
        ` : `
        vec3 axis = normalize(vec3(0.35, 0.55, 0.76));
        float d = dot(vDir, axis);
        float cloud = n(vDir * 6.0) * 0.6 + n(vDir * 14.0) * 0.3 + n(vDir * 30.0) * 0.1;
        float band = exp(-pow(d / 0.2, 2.0)) * smoothstep(0.25, 0.85, cloud);
        float dust = exp(-pow(d / 0.05, 2.0)) * smoothstep(0.55, 0.75, n(vDir * 20.0));
        vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.14, vDir.y));
        vec3 col = sky + uBand * band * 0.25 * smoothstep(-0.05, 0.12, vDir.y) - vec3(0.02) * dust;
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        `}
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
      blending: additive ? AdditiveBlending : NormalBlending }));
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
  const buckets = new Map<string, { material: Material; geometries: BufferGeometry[]; noShadow: boolean }>();
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
    // Ink hulls do not exist in the realistic look.
    if (!material.visible) return;
    let g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    const attrs = Object.keys(g.attributes).sort().join(',');
    const flat = !!mesh.userData.noShadow;
    const key = material.uuid + '|' + attrs + (flat ? '|flat' : '');
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { material, geometries: [], noShadow: flat }));
    b.geometries.push(g);
  });
  for (const { material, geometries, noShadow } of buckets.values()) {
    const merged = mergeGeometries(geometries);
    geometries.forEach(g => g.dispose());
    if (!merged) continue;
    const mesh = new Mesh(merged, material);
    mesh.userData.noShadow = noShadow;
    out.add(mesh);
  }
  return out;
}

/**
 * Realistic look: every lit, opaque mesh under `root` casts and receives the Sun's shadow unless its builder set
 * `userData.noShadow`. Unlit meshes (lamps, screens, beams) and transparent ones are left alone.
 */
export function castShadows(root: Object3D) {
  root.traverse(o => {
    const mesh = o as Mesh;
    if (!mesh.isMesh || mesh.userData.noShadow) return;
    const material = mesh.material as Material & { isMeshBasicMaterial?: boolean };
    if (Array.isArray(material) || material.isMeshBasicMaterial || material.transparent || !material.visible) return;
    mesh.castShadow = mesh.receiveShadow = true;
  });
}

/** Pooled dust puffs for landings and dashes. */
function dustPool(gravity: number, air: number): { points: Points; dust: Dust } {
  const max = 192;
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

export function buildWorldView(level: LevelV2, hf: Heightfield, tier: Tier = 'medium', renderer: WebGLRenderer | null = null): WorldView {
  Object.assign(palette, fromBiome());
  const scatter = tiers[tier].scatter, real = look.real;
  const scene = new Scene();
  scene.background = new Color(real ? biome.real.skyZenith : palette.sky);
  if (!real) {
    // On the Moon fog is a style choice (there is no air): it softens the far rim into the indigo horizon. On Mars
    // it is the real dusty atmosphere, so it starts closer.
    scene.fog = new Fog(biome.fog, biome.fogNear, biome.fogFar);
  } else if (biome.real.fog) {
    // Only where there is air. Patched materials integrate the height fog themselves; the rest use this plain one.
    const f = biome.real.fog;
    scene.fog = new FogExp2(f.color, f.density);
    G.uFog.value.set(f.density, 1 / f.scale, f.base, 0);
    G.uFogColor.value.set(f.color); G.uFogSunColor.value.set(f.sunColor);
  }
  if (!biome.real.fog || !real) G.uFog.value.set(0, 0, 0, 0);
  const sun = sunDirection(level.sun.azimuth, level.sun.elevation);
  noiseTexture();

  const lighting = createLighting(scene, sun, { tier, renderer });
  const ground = buildGround(level, hf, sun, { tier, scatter, lighting, renderer });
  scene.add(ground.group);
  if (level.pressurizedBay) scene.add(buildStationHabitat(level.pressurizedBay));
  const cold = level.zones.filter(z => z.drain || z.surge).map(z => ({ x: z.center.x, z: z.center.z, r: z.radius, hazard: z.hazard }));
  if (biome.starCount) scene.add(starfield(biome.starCount));

  const glow = new Sprite(new SpriteMaterial({ map: glowTexture(biome.sunGlow), blending: AdditiveBlending, depthWrite: false, fog: false }));
  glow.position.set(sun[0] * 400, sun[1] * 400, sun[2] * 400);
  // Realistic look: a small hard disc; the low bloom adds the only halo.
  glow.scale.setScalar(real ? biome.sunScale * 0.3 : biome.sunScale);
  const band = skyBand();
  // The painted nebula is an illustrated-look option (fiction); the realistic sky never shows it.
  const painted = biome.nebula && !real ? paintedSky(biome.nebula) : null;
  if (painted) { painted.visible = false; scene.add(painted); }
  if (real && biome.sky!=='day') band.visible = false;
  scene.add(glow, band);
  if (level.pressurizedBay || level.anchorCourse && level.id === 'orbit') {
    const earth = new Mesh(new SphereGeometry(52, 32, 20), new MeshLambertMaterial({ map: earthTexture(), fog: false }));
    earth.position.set(-49, 25, -240);
    earth.rotation.set(.3, 1.2, .1);
    scene.add(earth);
  } else if (biome.sky === 'deep') {
    // Deep space (Bennu): Earth is only a faint blue point, far from the Sun.
    const dot = new Sprite(new SpriteMaterial({ map: glowTexture('#9fc4ff'), blending: AdditiveBlending, depthWrite: false, fog: false }));
    dot.position.set(-160, 120, -330);
    dot.scale.setScalar(5);
    scene.add(dot);
  } else if (biome.sky === 'earth') {
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
  } else if (biome.sky === 'mars-moons') {
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
  const hardware = new Map<Prop, Group>();
  for (const p of level.props) {
    const base=heightAt(hf,p.solid.x,p.solid.z);
    const model = buildEarthProp(p,base)??buildProp(p,base);
    if (p.kind === 'gate' || p.hideAfter || p.kind === 'solar-rack') {
      hardware.set(p, model);
      scene.add(model);
    } else propsRoot.add(model);
  }
  const props = mergeStatic(propsRoot, blinkers);
  scene.add(props);

  let anchorLine: Line | null = null;
  const course = level.anchorCourse;
  if (course) {
    const lines: Vector3[] = [];
    course.anchors.forEach((a, i) => course.anchors.slice(i + 1).forEach(b => {
      if (Math.hypot(a.x - b.x, a.z - b.z) > 2 * course.length - 2) return;
      for (let j = 0; j < 12; j++) for (const k of [j, j + 1]) {
        const x = a.x + (b.x - a.x) * k / 12, z = a.z + (b.z - a.z) * k / 12;
        lines.push(new Vector3(x, heightAt(hf, x, z) + .18, z));
      }
    }));
    const tint = course.accent ?? '#ffca86';
    scene.add(new LineSegments(new BufferGeometry().setFromPoints(lines), new LineBasicMaterial({ color: tint, transparent: true, opacity: .72 })));
    anchorLine = new Line(new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]), new LineBasicMaterial({ color: tint }));
    anchorLine.frustumCulled = false;
    scene.add(anchorLine);
  }

  const mast = level.props.find(p => p.kind === 'mast'||p.kind==='earth-tower')?.solid;
  const beacon = new Mesh(new SphereGeometry(0.4, 12, 8), new MeshBasicMaterial({ color: glowColor(palette.warn, 3), fog: false }));
  if (mast) beacon.position.set(mast.x, mast.top + 0.4, mast.z);
  scene.add(beacon);

  const points = new Map<string, PointView>();
  const isDay=biome.sky==='day';
  const beamHeight = level.pressurizedBay ? level.pressurizedBay.ceiling - .6 : isDay ? 3.2 : 60;
  const beamRadius = isDay ? .09 : .18;
  const beamGeo = new CylinderGeometry(beamRadius,beamRadius,beamHeight,6,1,true);
  beamGeo.translate(0, beamHeight / 2, 0);
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
  const echoMat = new MeshBasicMaterial({ color: glowColor(palette.warn, 2.5) });
  for (const c of level.collectibles) {
    const m = new Mesh(echoGeo, echoMat);
    if (inked()) m.add(new Mesh(echoGeo, outlineMaterial(0.04)));
    m.position.set(c.position.x, c.y ?? heightAt(hf, c.position.x, c.position.z) + 0.9, c.position.z);
    scene.add(m);
    echoes.set(c.id, m);
  }

  // Atlas rocks: a single mint accent (LUNA-NACAR.md) so they read as catalogue targets, never as loot or hazards.
  const specimens = new Map<string, Mesh>();
  const rockGeo = new DodecahedronGeometry(0.6, 0);
  // Realistic look: an uncatalogued rock glows faintly mint (fiction: the spectral camera's tag), a catalogued one is plain stone.
  const rockFresh = toon('#9dffc8', '#1d4a36', { kind: 'emissive', emissive: '#3dd69a', emissiveIntensity: 1.6, roughness: 0.8 }), rockDone = toon('#6f8f82', '#000000', { kind: 'paint', roughness: 0.9 });
  for (const sp of level.specimens ?? []) {
    const m = new Mesh(rockGeo, rockFresh);
    if (inked()) m.add(new Mesh(rockGeo, outlineMaterial(0.05)));
    m.position.set(sp.position.x, heightAt(hf, sp.position.x, sp.position.z) + 0.2, sp.position.z);
    m.rotation.set(0.4, sp.position.x, 0.2);
    m.scale.set(1, 0.7, 0.85);
    scene.add(m);
    specimens.set(sp.id, m);
  }
  const setScanned = (id: string, scanned: boolean) => { const m = specimens.get(id); if (m) m.material = scanned ? rockDone : rockFresh; };

  const beacons = new Map<string, Mesh>();
  const postGeo = new CylinderGeometry(0.09, 0.12, 2.2, 8), lampGeo = new SphereGeometry(0.22, 12, 8);
  const lampOff = new MeshBasicMaterial({ color: '#3a3542' }), lampOn = new MeshBasicMaterial({ color: glowColor(palette.warn, 4), fog: false });
  const haloMat = new SpriteMaterial({ map: glowTexture('#ffd59a'), transparent: true, opacity: 0.8, depthWrite: false, blending: AdditiveBlending });
  for (const b of level.beacons?.posts ?? []) {
    const y = heightAt(hf, b.position.x, b.position.z);
    const post = new Mesh(postGeo, toon('#cfc8d6'));
    if (inked()) post.add(new Mesh(postGeo, outlineMaterial(0.03)));
    post.position.set(b.position.x, y + 1.1, b.position.z);
    const lamp = new Mesh(lampGeo, lampOff);
    lamp.position.y = 1.2;
    const halo = new Sprite(haloMat);
    halo.scale.setScalar(2.2); halo.visible = false; halo.name = 'halo';
    lamp.add(halo);
    post.add(lamp);
    scene.add(post);
    beacons.set(b.id, lamp);
  }
  const setBeacon = (id: string, lit: boolean) => {
    const lamp = beacons.get(id); if (!lamp) return;
    lamp.material = lit ? lampOn : lampOff;
    lamp.getObjectByName('halo')!.visible = lit;
  };

  const geophones = new Map<string, Mesh>();
  const geoOff = new MeshBasicMaterial({ color: '#3a3542' }), geoOn = new MeshBasicMaterial({ color: glowColor(palette.accent, 4), fog: false });
  for (const site of level.seismic?.sites ?? []) {
    const y = heightAt(hf, site.position.x, site.position.z);
    const post = new Mesh(new CylinderGeometry(0.05, 0.08, 0.7, 6), toon('#9a93a8'));
    post.position.set(site.position.x, y + 0.35, site.position.z);
    const lamp = new Mesh(new SphereGeometry(0.1, 8, 6), geoOff);
    lamp.position.y = 0.4;
    post.add(lamp);
    scene.add(post);
    geophones.set(site.id, lamp);
  }
  const setGeophone = (id: string, on: boolean) => { const l = geophones.get(id); if (l) l.material = on ? geoOn : geoOff; };

  const crew = new Map<string,CrewFigure>();
  for (const m of level.crew?.members ?? []) {
    const rig=m.uniform==='flight'?buildAstronaut('flight'):undefined;
    const f = rig?.group??buildCrewFigure(!!m.sister);
    f.position.set(m.at.x, heightAt(hf, m.at.x, m.at.z), m.at.z);
    if(m.uniform)f.rotation.y=Math.atan2(m.at.x-level.spawn.x,m.at.z-level.spawn.z);
    scene.add(f);
    crew.set(m.id,{group:f,rig});
  }

  const astronaut = buildAstronaut(level.attire);
  const player = astronaut.group;
  const lumaModel = buildLuma();
  const luma = lumaModel.group;
  const shadow = new Mesh(new CircleGeometry(0.5, 20), new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.45, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  const { points: dustPoints, dust } = dustPool(level.realGravity, biome.air);
  const { mesh: printMesh, footprints } = footprintPool();
  const { group: ambienceGroup, ambience } = ambienceSystem(echoes, scatter, cold, (x, z) => heightAt(hf, x, z));
  scene.add(player, luma, shadow, dustPoints, printMesh, ambienceGroup);
  if (lighting.shadows) {
    // Real shadows replace the blob under the player.
    shadow.visible = false;
    castShadows(props); castShadows(player); castShadows(luma);
    for (const f of crew.values()) castShadows(f.group);
    for (const m of specimens.values()) castShadows(m);
    for (const lamp of [...beacons.values(), ...geophones.values()]) if (lamp.parent) castShadows(lamp.parent);
  }

  return {
    scene, player, astronaut, luma, lumaModel, shadow, beacon, points, echoes, hardware, anchorLine, specimens, setScanned, beacons, setBeacon, crew, geophones, setGeophone,
    setSky(on: boolean) { if (!painted) return; painted.visible = on; band.visible = !on; },
    tickSky(t: number) { if (painted?.visible) (painted.material as ShaderMaterial).uniforms.uTime.value = t; },
    dust, footprints, ambience, blinkers, sun, lighting,
    tick(camera, time) {
      G.uTime.value = time;
      lighting.follow(camera);
      ground.update?.(camera, time);
    },
    dispose() {
      const seen = new Set<unknown>();
      scene.traverse(o => {
        const m = o as Mesh;
        if (m.geometry && !seen.has(m.geometry)) { seen.add(m.geometry); m.geometry.dispose(); }
        const mat = m.material as Material | Material[] | undefined;
        for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) if (!seen.has(x)) { seen.add(x); x.dispose(); }
      });
      lighting.dispose();
    },
  };
}
