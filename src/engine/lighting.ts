// Scene lighting for both looks. «Ilustrado» keeps the original pair (a soft sun plus a strong hemisphere fill).
// «Realista» is one hard Sun with a shadow map centred on the viewer, plus image-based fill from a small procedural
// environment (ground bounce, sky, earthshine): on airless worlds nothing else lights the shade.
// The viewer-centred, texel-snapped shadow volume follows Valle Morta's engine (MIT, see THIRD-PARTY-NOTICES.md).
import {
  Color, DirectionalLight, HemisphereLight, PCFShadowMap, Vector3, type Scene, type Texture, type WebGLRenderer,
} from 'three';
import { look } from './look.ts';
import { tiers, type Tier } from './quality.ts';
import { G } from './shared.ts';
import { biome } from './style.ts';

export type Lighting = {
  sun: DirectionalLight;
  /** Re-centres the shadow volume on the viewer, snapped to shadow texels so shadows do not shimmer. Call once per frame. */
  follow(cam: Vector3): void;
  /** Whether a shadow map is rendered (realistic look on medium and high). When false, use baked sun visibility. */
  shadows: boolean;
  /** Prefiltered environment (also on `scene.environment`), or null in the illustrated look. */
  envMap: Texture | null;
  dispose(): void;
};

/** Distance from the shadow volume's centre back to the light, and the depth of the volume, in metres. */
const lightBack = 350, lightDepth = 700;

export function createLighting(scene: Scene, sunDir: [number, number, number], opts: { tier: Tier; renderer: WebGLRenderer | null; envMap?: Texture | null }): Lighting {
  const dir = new Vector3(sunDir[0], sunDir[1], sunDir[2]).normalize();
  if (!look.real) {
    const sun = new DirectionalLight(biome.sunColor, 2.4);
    sun.position.copy(dir).multiplyScalar(50);
    const fill = new HemisphereLight(biome.hemiSky, biome.hemiGround, 1.1);
    scene.add(sun, fill);
    G.uSunDir.value.copy(dir);
    G.uSunColor.value.set(biome.sunColor).multiplyScalar(2.4);
    return { sun, follow() {}, shadows: false, envMap: null, dispose() { sun.dispose(); fill.dispose(); } };
  }

  const spec = tiers[opts.tier], real = biome.real;
  const sun = new DirectionalLight(real.sun, real.sunIntensity);
  sun.position.copy(dir).multiplyScalar(lightBack);
  scene.add(sun, sun.target);
  G.uSunDir.value.copy(dir);
  G.uSunColor.value.set(real.sun).multiplyScalar(real.sunIntensity);

  const envMap = opts.envMap ?? null;
  let fill: HemisphereLight | null = null;
  if (envMap) {
    scene.environment = envMap;
    scene.environmentIntensity = 1;
  } else {
    // Without an environment (low tier): a flat ground-bounce fill of the same magnitude.
    const bounce = new Color(real.ground).multiplyScalar(real.sunIntensity * Math.max(0.2, dir.y) / Math.PI);
    // From above: the sky where there is one, planetshine, and a share of the light bounced off sunlit ground
    // nearby (slopes, rocks, the suit itself), which is all that fills a shadow on an airless world.
    const above = new Color(real.skyFill).add(new Color(real.planetColor).multiplyScalar(real.planetshine * real.sunIntensity)).add(bounce.clone().multiplyScalar(0.7));
    fill = new HemisphereLight(above, bounce, 1);
    G.uAmbSky.value.copy(above); G.uAmbGround.value.copy(bounce);
    scene.add(fill);
  }

  const shadows = !!opts.renderer && spec.shadow > 0;
  if (shadows) {
    const renderer = opts.renderer!;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    const size = Math.min(spec.shadow, renderer.capabilities.maxTextureSize);
    sun.castShadow = true;
    sun.shadow.mapSize.set(size, size);
    // In vacuum the penumbra comes only from the Sun's half-degree disc: keep the filter tight.
    sun.shadow.radius = biome.air > 0 ? 1.6 : 1;
    sun.shadow.bias = -0.0003;
    // The terrain is a 1 m grid lit at grazing angles: a generous normal offset stops acne on slopes.
    sun.shadow.normalBias = (spec.shadowRange * 2 / size) * 1.8;
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -spec.shadowRange; cam.right = cam.top = spec.shadowRange;
    cam.near = 1; cam.far = lightDepth;
    cam.updateProjectionMatrix();
  }

  const up = new Vector3(), right = new Vector3(), upL = new Vector3(), c = new Vector3();
  if (Math.abs(dir.y) > 0.99) up.set(1, 0, 0); else up.set(0, 1, 0);
  right.crossVectors(up, dir).normalize();
  upL.crossVectors(dir, right).normalize();
  const texel = shadows ? (spec.shadowRange * 2) / sun.shadow.mapSize.x : 1;

  return {
    sun, shadows, envMap,
    follow(cam) {
      if (!shadows) return;
      // Centre on the viewer (not ahead of it: a volume pushed along the view direction drops and regains shadows
      // at its rim while turning) and move in whole texels in the light's own basis.
      const sx = Math.round(cam.dot(right) / texel) * texel, sy = Math.round(cam.dot(upL) / texel) * texel;
      c.copy(right).multiplyScalar(sx).addScaledVector(upL, sy).addScaledVector(dir, cam.dot(dir));
      sun.target.position.copy(c);
      sun.position.copy(c).addScaledVector(dir, lightBack);
      sun.target.updateMatrixWorld();
      sun.updateMatrixWorld();
    },
    dispose() { sun.dispose(); fill?.dispose(); sun.shadow.map?.dispose(); },
  };
}
