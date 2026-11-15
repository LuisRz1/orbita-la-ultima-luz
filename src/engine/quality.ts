// Quality tiers and the resolution governor. No three.js imports: the numbers are testable on their own.

export const tierIds = ['low', 'medium', 'high'] as const;
export type Tier = typeof tierIds[number];

export type TierSpec = {
  /** Upper bound of rendered pixels, independent of the display's pixel ratio. */
  maxPixels: number;
  /** Lowest fraction of that budget the governor may fall to. */
  minScale: number;
  antialias: boolean;
  /** Edge length of baked light textures a level should load. */
  lightSize: 512 | 1024;
  /** Density multiplier for instanced scenery. */
  scatter: number;
  /** Realistic look only. Edge of the sun's shadow map in texels; 0 = no shadow map (baked sun visibility instead). */
  shadow: 0 | 1024 | 2048 | 4096;
  /** Half-width in metres of the shadow volume centred on the viewer. */
  shadowRange: number;
  /** Screen-space ambient occlusion: off, half resolution or full resolution. */
  ao: 0 | 1 | 2;
  /** Edge of the procedural tile sets (ground, rock, hull) generated at load. */
  tile: 256 | 512 | 1024;
  /** Anisotropic filtering for tiled ground textures (clamped to what the GPU offers). */
  aniso: number;
};

export const tiers: Record<Tier, TierSpec> = {
  low: { maxPixels: 1280 * 720, minScale: 0.6, antialias: false, lightSize: 512, scatter: 0.5, shadow: 0, shadowRange: 0, ao: 0, tile: 256, aniso: 1 },
  medium: { maxPixels: 1600 * 900, minScale: 0.62, antialias: true, lightSize: 1024, scatter: 0.8, shadow: 2048, shadowRange: 70, ao: 1, tile: 512, aniso: 4 },
  high: { maxPixels: 1920 * 1080, minScale: 0.7, antialias: true, lightSize: 1024, scatter: 1, shadow: 4096, shadowRange: 110, ao: 2, tile: 1024, aniso: 8 },
};

type Hints = { deviceMemory?: number; hardwareConcurrency?: number; touch?: boolean };

/** Picks a starting tier from coarse device hints. The player can override it in settings. */
export function detectTier(hints: Hints): Tier {
  const memory = hints.deviceMemory ?? 8;
  const cores = hints.hardwareConcurrency ?? 4;
  if (hints.touch || memory <= 4 || cores <= 4) return 'low';
  if (memory >= 16 && cores >= 12) return 'high';
  return 'medium';
}

/** Pixel ratio that keeps width × height × ratio² within the tier budget. */
export function budgetRatio(width: number, height: number, devicePixelRatio: number, spec: TierSpec) {
  const fit = Math.sqrt(spec.maxPixels / Math.max(1, width * height));
  return Math.min(devicePixelRatio, fit);
}

/**
 * Lowers the render scale when frames run long and raises it again when there is headroom.
 * It reacts to a smoothed frame time and waits between changes so the image does not pump.
 */
export class ResolutionGovernor {
  scale = 1;
  average = 1000 / 60;
  private sinceChange = 0;
  private readonly spec: TierSpec;
  constructor(spec: TierSpec) { this.spec = spec; }

  /** Returns true when the scale changed and the renderer must be resized. */
  update(frameMs: number): boolean {
    // A single hitch (tab switch, shader compile) must not count as sustained load.
    const clamped = Math.min(frameMs, 50);
    this.average += (clamped - this.average) * 0.08;
    this.sinceChange += clamped;
    if (this.sinceChange < 600) return false;
    const before = this.scale;
    if (this.average > 20) this.scale = Math.max(this.spec.minScale, this.scale - 0.06);
    else if (this.average < 14.5) this.scale = Math.min(1, this.scale + 0.03);
    if (this.scale === before) return false;
    this.sinceChange = 0;
    return true;
  }
}
