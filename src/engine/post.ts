// Post-processing for medium and high quality: bloom on everything that glows (beams, LUMA, the Sun, trails), light
// shafts toward the Sun where there is air (Mars) and a faint streak elsewhere, depth of field during the arrival shot,
// and a graded vignette. Low quality renders straight to the screen, as before.
import { Color, HalfFloatType, Vector2, Vector3, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import type { Tier } from './quality.ts';

export type PostSettings = { bloom: number; shafts: number; tint: string };
export type Post = {
  /** Whether frames go through the composer (false on low quality or when the player turns effects off). */
  active: boolean;
  /** Draw calls and triangles of the last frame, all passes included (read for the HUD). */
  stats: { calls: number; triangles: number };
  render(scene: Scene, camera: Camera, dt: number): void;
  setSize(width: number, height: number, ratio: number): void;
  /** Focus distance for the arrival shot; null turns depth of field off. */
  focus(distance: number | null): void;
  /** Sun direction in world space, for the light shafts. */
  sun(direction: [number, number, number]): void;
  /** Screen-space punch for impacts (0–1): a brief chromatic fringe and vignette tighten. */
  kick(amount: number): void;
  dispose(): void;
};

/** Radial light shafts toward the Sun's screen position, from the bright parts of the image. */
const shaftShader = {
  uniforms: {
    tDiffuse: { value: null }, uSun: { value: new Vector2(0.5, 0.5) }, uStrength: { value: 0 }, uTint: { value: new Color('#ffe0b0') },
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uStrength; uniform vec3 uTint; varying vec2 vUv;
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uStrength <= 0.0) { gl_FragColor = base; return; }
      vec2 delta = (uSun - vUv) / 40.0;
      vec2 uv = vUv; float decay = 1.0; vec3 acc = vec3(0.0);
      for (int i = 0; i < 40; i++) {
        uv += delta;
        vec3 c = texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).rgb;
        float lum = max(0.0, dot(c, vec3(0.299, 0.587, 0.114)) - 0.75);
        acc += c * lum * decay;
        decay *= 0.955;
      }
      float edge = smoothstep(1.4, 0.2, length(uSun - vec2(0.5)));
      gl_FragColor = vec4(base.rgb + acc * uTint * uStrength * edge / 40.0 * 6.0, base.a);
    }`,
};

/** Grade: vignette, a touch of lift in the shadows and a chromatic fringe that only shows on impacts. */
const gradeShader = {
  uniforms: { tDiffuse: { value: null }, uKick: { value: 0 }, uVignette: { value: 0.32 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uKick; uniform float uVignette; varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      float r = dot(d, d);
      vec2 shift = d * uKick * 0.012;
      vec3 c = vec3(texture2D(tDiffuse, vUv + shift).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - shift).b);
      c *= 1.0 - (uVignette + uKick * 0.25) * smoothstep(0.08, 0.5, r);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: Camera, tier: Tier, settings: PostSettings): Post {
  if (tier === 'low') {
    return {
      active: false, stats: { calls: 0, triangles: 0 },
      render(s, c) { renderer.render(s, c); this.stats.calls = renderer.info.render.calls; this.stats.triangles = renderer.info.render.triangles; },
      setSize() {}, focus() {}, sun() {}, kick() {}, dispose() {},
    };
  }
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new Vector2(256, 256), settings.bloom, 0.55, 0.78);
  const shafts = new ShaderPass(shaftShader);
  shafts.uniforms.uTint.value = new Color(settings.tint);
  const bokeh = tier === 'high' ? new BokehPass(scene, camera, { focus: 8, aperture: 0.0012, maxblur: 0.004 }) : null;
  const grade = new ShaderPass(gradeShader);
  const output = new OutputPass();
  composer.addPass(renderPass);
  if (bokeh) { bokeh.enabled = false; composer.addPass(bokeh); }
  composer.addPass(bloom);
  if (tier === 'high' && settings.shafts > 0) composer.addPass(shafts);
  composer.addPass(grade);
  composer.addPass(output);

  const sunDir = new Vector3(0, 1, 0), projected = new Vector3();
  let kick = 0;
  const post: Post = {
    active: true, stats: { calls: 0, triangles: 0 },
    render(s, c, dt) {
      renderPass.scene = s; renderPass.camera = c;
      if (bokeh) { (bokeh as unknown as { scene: Scene; camera: Camera }).scene = s; (bokeh as unknown as { camera: Camera }).camera = c; }
      // Shafts only when the Sun is in front of the camera.
      projected.copy(c.position).addScaledVector(sunDir, 400).project(c);
      const inFront = projected.z < 1 && Math.abs(projected.x) < 1.6 && Math.abs(projected.y) < 1.6;
      shafts.uniforms.uSun.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
      shafts.uniforms.uStrength.value = inFront ? settings.shafts : 0;
      kick = Math.max(0, kick - dt * 3);
      grade.uniforms.uKick.value = kick;
      // Count every pass of the frame in renderer.info (the HUD's draw calls), not only the last full-screen quad.
      renderer.info.autoReset = false;
      renderer.info.reset();
      composer.render(dt);
      post.stats.calls = renderer.info.render.calls; post.stats.triangles = renderer.info.render.triangles;
      renderer.info.autoReset = true;
    },
    setSize(w, h, ratio) { composer.setPixelRatio(ratio); composer.setSize(w, h); bloom.resolution.set(w * ratio / 2, h * ratio / 2); },
    focus(distance) {
      if (!bokeh) return;
      bokeh.enabled = distance !== null;
      if (distance !== null) (bokeh.uniforms as unknown as Record<string, { value: number }>).focus.value = distance;
    },
    sun(d) { sunDir.set(d[0], d[1], d[2]).normalize(); },
    kick(amount) { kick = Math.max(kick, amount); },
    dispose() { composer.dispose(); target.dispose(); bloom.dispose(); bokeh?.dispose(); },
  };
  return post;
}
