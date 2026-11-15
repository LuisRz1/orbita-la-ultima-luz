// Short-lived visual effects: LUMA's scent trail, its warm glow in the cold, the scanner pulse over the ground and
// the touchdown ring. Each is one or two draw calls with pooled geometry; nothing allocates per frame.
import {
  AdditiveBlending, Color, DoubleSide, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, OctahedronGeometry, Quaternion,
  RingGeometry, Sprite, SpriteMaterial, Vector3, type Scene,
} from 'three';
import type { Vec2 } from '../core/contract/level-v2.ts';
import { biome, glowTexture } from './style.ts';

export type Fx = {
  /** Lays the trail marks; they light up one after another, as fast as LUMA runs, and fade after `life` s. */
  trail(marks: Vec2[], ground: (x: number, z: number) => number, now: number, speed?: number, life?: number): void;
  /** Ring that expands over the terrain from (x, y, z). */
  pulse(x: number, y: number, z: number, radius: number, color?: string): void;
  /** Warm halo on the ground under LUMA while its glow spares the suit (0 hides it). */
  warmth(x: number, y: number, z: number, strength: number): void;
  update(now: number, dt: number): void;
  readonly group: Group;
};

const maxMarks = 40;

export function createFx(scene: Scene): Fx {
  const group = new Group();
  scene.add(group);
  const core = new Color(biome.lumaCore), fur = new Color(biome.luma);

  // Trail: small glowing crystals hovering over the ground, scaled in and out (instances cannot fade alpha).
  const markMat = new MeshBasicMaterial({ color: core.clone().lerp(fur, 0.35), transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
  const marks = new InstancedMesh(new OctahedronGeometry(0.11), markMat, maxMarks);
  marks.count = 0; marks.frustumCulled = false;
  const markHalo = new InstancedMesh(new OctahedronGeometry(0.22), new MeshBasicMaterial({ color: fur, transparent: true, opacity: 0.14, blending: AdditiveBlending, depthWrite: false, fog: false }), maxMarks);
  markHalo.count = 0; markHalo.frustumCulled = false;
  const at = new Float32Array(maxMarks * 3), born = new Float32Array(maxMarks), die = new Float32Array(maxMarks);
  group.add(marks, markHalo);

  // Pulses: three pooled rings so a scan and a sniff can overlap.
  const pulses = [0, 1, 2].map(() => {
    const ring = new Mesh(new RingGeometry(0.86, 1, 64), new MeshBasicMaterial({ color: biome.cyan, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false;
    group.add(ring);
    return { ring, start: -1, radius: 1 };
  });
  let nextPulse = 0, clock = 0;

  const halo = new Sprite(new SpriteMaterial({ map: glowTexture(biome.lumaCore), color: fur, blending: AdditiveBlending, transparent: true, opacity: 0, depthWrite: false }));
  halo.scale.set(5, 5, 1); halo.visible = false;
  group.add(halo);

  const m = new Matrix4(), q = new Quaternion(), p = new Vector3(), s = new Vector3();
  return {
    group,
    trail(list, ground, now, speed = 12, life = 9) {
      const n = Math.min(maxMarks, list.length);
      for (let i = 0; i < n; i++) {
        const { x, z } = list[i];
        at.set([x, ground(x, z) + 0.35, z], i * 3);
        born[i] = now + (i * 1.6) / speed;
        die[i] = born[i] + life;
      }
      marks.count = markHalo.count = n;
    },
    pulse(x, y, z, radius, color) {
      const pl = pulses[nextPulse]; nextPulse = (nextPulse + 1) % pulses.length;
      pl.ring.position.set(x, y + 0.08, z);
      pl.start = clock; pl.radius = radius; pl.ring.visible = true;
      (pl.ring.material as MeshBasicMaterial).color.set(color ?? biome.cyan);
    },
    warmth(x, y, z, strength) {
      halo.visible = strength > 0.01;
      if (!halo.visible) return;
      halo.position.set(x, y, z);
      (halo.material as SpriteMaterial).opacity = Math.min(0.55, strength);
    },
    update(now, dt) {
      clock += dt;
      for (let i = 0; i < marks.count; i++) {
        const age = now - born[i], left = die[i] - now;
        const k = age < 0 ? 0 : Math.min(1, age / 0.25, Math.max(0, left) / 1.5);
        const bob = Math.sin(now * 3 + i * 0.7) * 0.08;
        p.set(at[i * 3], at[i * 3 + 1] + bob, at[i * 3 + 2]);
        q.setFromAxisAngle(s.set(0, 1, 0), now * 2 + i);
        s.setScalar(Math.max(0.0001, k * (1 + 0.25 * Math.sin(now * 6 + i))));
        m.compose(p, q, s);
        marks.setMatrixAt(i, m); markHalo.setMatrixAt(i, m);
      }
      if (marks.count) { marks.instanceMatrix.needsUpdate = true; markHalo.instanceMatrix.needsUpdate = true; }
      for (const pl of pulses) {
        if (!pl.ring.visible) continue;
        const k = (clock - pl.start) / 1.3;
        if (k >= 1) { pl.ring.visible = false; continue; }
        const r = 0.5 + pl.radius * (1 - Math.pow(1 - k, 3));
        pl.ring.scale.set(r, r, 1);
        (pl.ring.material as MeshBasicMaterial).opacity = 0.75 * (1 - k);
      }
    },
  };
}
