// Procedural audio with Web Audio: no sound files. Mature, low register: a sub drone in D, a slow breathing pad,
// sparse bell notes in a long reverb, and muffled suit sounds (there is no air on the Moon, so what the player hears
// is what travels through the suit). Every voice takes a BaseAudioContext so it can also render offline for review.

export type Mood = 'silent' | 'menu' | 'surface' | 'cold' | 'complete' | 'recalled';
export type Sfx =
  | 'step' | 'jump' | 'thrust' | 'dash' | 'land' | 'scan' | 'objective' | 'blocked' | 'echo' | 'achievement'
  | 'luma' | 'luma-sniff' | 'luma-growl' | 'luma-fetch' | 'luma-absent' | 'control' | 'click' | 'recall' | 'heartbeat'
  | 'whoosh' | 'touchdown'
  | 'ui-hover' | 'ui-select' | 'ui-step' | 'ui-open' | 'ui-close' | 'ui-confirm' | 'ui-tic';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// D aeolian, low. Chords as MIDI notes: Dm(add9) → B♭maj7 → Gm9 → A sus4.
const chords = [[38, 45, 52, 53, 57], [34, 41, 45, 50, 57], [31, 38, 45, 46, 50], [33, 40, 45, 50, 52]];
const bells = [50, 53, 55, 57, 60, 62, 65];

let noiseBuffer: AudioBuffer | null = null;
function noise(ctx: BaseAudioContext) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = b.getChannelData(0);
  let seed = 1;
  for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741823.5 - 1; }
  return (noiseBuffer = b);
}

/** Long dark reverb built from decaying filtered noise (no impulse files). */
export function makeReverb(ctx: BaseAudioContext, seconds = 5.5) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let seed = 7 + ch, low = 0;
    for (let i = 0; i < len; i++) {
      seed = (seed * 48271) % 2147483647;
      const white = seed / 1073741823.5 - 1;
      low += (white - low) * 0.18; // darken the tail
      d[i] = low * Math.pow(1 - i / len, 2.6);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

type Env = { a: number; d: number; peak: number };
function envelope(g: GainNode, t: number, e: Env) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(e.peak, t + e.a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + e.a + e.d);
}

function tone(ctx: BaseAudioContext, out: AudioNode, t: number, freq: number, e: Env, type: OscillatorType = 'sine', glideTo?: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + e.a + e.d);
  envelope(g, t, e);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + e.a + e.d + 0.05);
}

function hiss(ctx: BaseAudioContext, out: AudioNode, t: number, e: Env, filter: BiquadFilterType, from: number, to = from, q = 0.8) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise(ctx); f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + e.a + e.d);
  envelope(g, t, e);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 1.5); s.stop(t + e.a + e.d + 0.05);
}

/** One-shot sounds. `dry` is the direct path, `wet` feeds the reverb. */
export function playSfx(ctx: BaseAudioContext, dry: AudioNode, wet: AudioNode, name: Sfx, t = ctx.currentTime) {
  switch (name) {
    case 'step':
      // In a suit on the Moon there is no air to carry a crunch: the step arrives through the body as a soft,
      // muffled thud. Slow attack and low level so it never reads as a drum.
      hiss(ctx, dry, t, { a: 0.014, d: 0.13, peak: 0.075 }, 'lowpass', 320, 110);
      tone(ctx, dry, t, 66, { a: 0.012, d: 0.11, peak: 0.045 }, 'sine', 46);
      break;
    case 'jump':
      tone(ctx, dry, t, 96, { a: 0.01, d: 0.22, peak: 0.22 }, 'sine', 62);
      hiss(ctx, dry, t, { a: 0.02, d: 0.25, peak: 0.06 }, 'bandpass', 500, 260);
      break;
    case 'thrust':
      // Cold-gas thruster: a sustained pressurised hiss that falls in pitch, with a soft low rumble under it.
      hiss(ctx, dry, t, { a: 0.06, d: 0.55, peak: 0.2 }, 'bandpass', 2200, 700, 0.9);
      hiss(ctx, dry, t, { a: 0.08, d: 0.5, peak: 0.1 }, 'lowpass', 400, 160);
      hiss(ctx, wet, t, { a: 0.1, d: 0.7, peak: 0.04 }, 'bandpass', 1200, 500);
      break;
    case 'dash':
      // Whoosh: noise that swells and sweeps, no transient at the start.
      hiss(ctx, dry, t, { a: 0.14, d: 0.32, peak: 0.22 }, 'bandpass', 260, 1100, 2.2);
      hiss(ctx, dry, t + 0.05, { a: 0.12, d: 0.3, peak: 0.1 }, 'bandpass', 180, 600, 1.4);
      break;
    case 'land':
      tone(ctx, dry, t, 64, { a: 0.003, d: 0.28, peak: 0.32 }, 'sine', 38);
      hiss(ctx, dry, t, { a: 0.004, d: 0.3, peak: 0.12 }, 'lowpass', 340, 80);
      break;
    case 'scan':
      tone(ctx, dry, t, 147, { a: 0.05, d: 0.7, peak: 0.08 }, 'sine', 294);
      tone(ctx, wet, t, 147, { a: 0.05, d: 0.9, peak: 0.08 }, 'triangle', 294);
      break;
    case 'objective':
      for (const [i, n] of [50, 57, 62].entries()) {
        tone(ctx, dry, t + i * 0.16, midi(n), { a: 0.01, d: 1.6, peak: 0.08 }, 'sine');
        tone(ctx, wet, t + i * 0.16, midi(n), { a: 0.01, d: 2.2, peak: 0.07 }, 'triangle');
      }
      break;
    case 'blocked':
      // Low, dull buzz: two detuned saws held flat, then cut.
      for (const i of [0, 1]) {
        const f = ctx.createBiquadFilter(), g = ctx.createGain(), at = t + i * 0.3;
        f.type = 'lowpass'; f.frequency.value = 700;
        g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.06, at + 0.02);
        g.gain.setValueAtTime(0.06, at + 0.2); g.gain.linearRampToValueAtTime(0.0001, at + 0.24);
        for (const detune of [-12, 12]) {
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 82; o.detune.value = detune;
          o.connect(f); o.start(at); o.stop(at + 0.26);
        }
        f.connect(g).connect(dry);
      }
      break;
    case 'echo':
      for (const [i, n] of [62, 65, 69].entries()) tone(ctx, wet, t + i * 0.12, midi(n), { a: 0.01, d: 2.4, peak: 0.07 }, 'sine');
      tone(ctx, dry, t, midi(50), { a: 0.02, d: 1.4, peak: 0.07 });
      break;
    case 'achievement':
      for (const n of [38, 45, 50, 53, 57]) {
        tone(ctx, wet, t, midi(n), { a: 0.4, d: 3.2, peak: 0.05 }, 'triangle');
        tone(ctx, dry, t, midi(n), { a: 0.3, d: 2.4, peak: 0.03 }, 'sine');
      }
      break;
    case 'luma':
      // Translator chirps: warm creature syllables, each a curved glide with a little wobble.
      for (let i = 0; i < 5; i++) {
        const f = 240 + ((i * 97) % 5) * 45, at = t + i * 0.11;
        const o = ctx.createOscillator(), g = ctx.createGain(), wob = ctx.createOscillator(), depth = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, at);
        o.frequency.exponentialRampToValueAtTime(f * (i % 2 ? 1.6 : 0.7), at + 0.06);
        o.frequency.exponentialRampToValueAtTime(f * (i % 2 ? 1.1 : 1.3), at + 0.12);
        wob.frequency.value = 28; depth.gain.value = f * 0.05;
        wob.connect(depth).connect(o.frequency);
        envelope(g, at, { a: 0.015, d: 0.11, peak: 0.06 });
        o.connect(g).connect(dry); o.start(at); o.stop(at + 0.15); wob.start(at); wob.stop(at + 0.15);
      }
      tone(ctx, wet, t, 220, { a: 0.02, d: 0.5, peak: 0.02 }, 'sine', 330);
      break;
    case 'luma-sniff':
      // Three quick snuffles through the translator band, then a bright rising chirp as it sets off.
      for (let i = 0; i < 3; i++) hiss(ctx, dry, t + i * 0.13, { a: 0.012, d: 0.08, peak: 0.07 }, 'bandpass', 1800, 900, 2.5);
      tone(ctx, dry, t + 0.42, 330, { a: 0.02, d: 0.22, peak: 0.06 }, 'triangle', 720);
      tone(ctx, wet, t + 0.42, 660, { a: 0.02, d: 0.8, peak: 0.025 }, 'sine', 990);
      break;
    case 'luma-growl':
      // A low creature rumble with a slow tremolo: a warning, not aggression.
      {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), wob = ctx.createOscillator(), depth = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(92, t); o.frequency.linearRampToValueAtTime(78, t + 0.7);
        f.type = 'lowpass'; f.frequency.value = 420;
        wob.frequency.value = 17; depth.gain.value = 0.025;
        envelope(g, t, { a: 0.08, d: 0.62, peak: 0.07 });
        wob.connect(depth).connect(g.gain);
        o.connect(f).connect(g).connect(dry);
        o.start(t); o.stop(t + 0.75); wob.start(t); wob.stop(t + 0.75);
      }
      break;
    case 'luma-fetch':
      // Wing-less lift: a soft upward sweep and a pleased trill.
      hiss(ctx, dry, t, { a: 0.1, d: 0.35, peak: 0.08 }, 'bandpass', 400, 2400, 1.6);
      for (const [i, n] of [69, 74, 78].entries()) tone(ctx, wet, t + 0.3 + i * 0.07, midi(n), { a: 0.01, d: 0.5, peak: 0.04 }, 'triangle');
      break;
    case 'luma-absent':
      // Pressing for LUMA after the farewell: one low bell, nothing answers.
      tone(ctx, wet, t, midi(45), { a: 0.02, d: 3, peak: 0.05 }, 'sine');
      break;
    case 'whoosh':
      // Camera sweep of the arrival shot: a long airy swell.
      hiss(ctx, dry, t, { a: 0.9, d: 1.4, peak: 0.07 }, 'bandpass', 180, 900, 1.2);
      hiss(ctx, wet, t + 0.2, { a: 1, d: 1.6, peak: 0.04 }, 'bandpass', 300, 1400, 1);
      break;
    case 'touchdown':
      // The lander settling: deep thump, then a creak of the struts.
      tone(ctx, dry, t, 48, { a: 0.006, d: 0.9, peak: 0.35 }, 'sine', 30);
      hiss(ctx, dry, t, { a: 0.01, d: 0.8, peak: 0.16 }, 'lowpass', 260, 60);
      tone(ctx, wet, t + 0.25, 140, { a: 0.05, d: 0.5, peak: 0.03 }, 'triangle', 120);
      break;
    case 'control':
      // Mission Control: a short bed of radio static and a Quindar tone (2525 Hz), the keying beep of Apollo-era
      // air-to-ground loops.
      hiss(ctx, dry, t, { a: 0.03, d: 0.4, peak: 0.05 }, 'bandpass', 1600, 1400, 0.4);
      tone(ctx, dry, t + 0.05, 2525, { a: 0.005, d: 0.25, peak: 0.03 }, 'sine');
      break;
    case 'click':
    case 'ui-select':
      // A fingertip on glass: a soft body, a very short tick and a breath of noise; no click at the start.
      tone(ctx, dry, t, 240, { a: 0.0015, d: 0.05, peak: 0.08 }, 'sine', 200);
      tone(ctx, dry, t, 1400, { a: 0.001, d: 0.012, peak: 0.025 }, 'sine');
      hiss(ctx, dry, t, { a: 0.001, d: 0.01, peak: 0.02 }, 'bandpass', 3500, 3000, 1);
      break;
    case 'ui-hover':
      tone(ctx, dry, t, 520, { a: 0.002, d: 0.03, peak: 0.018 }, 'sine', 480);
      break;
    case 'ui-step':
      // Ratchet: two teeth, the second softer.
      for (const [i, peak] of [[0, 0.05], [1, 0.03]]) {
        hiss(ctx, dry, t + i * 0.035, { a: 0.001, d: 0.018, peak }, 'bandpass', 1800, 1500, 3);
        tone(ctx, dry, t + i * 0.035, 300, { a: 0.001, d: 0.03, peak: peak * 0.8 }, 'triangle', 260);
      }
      break;
    case 'ui-open':
      hiss(ctx, dry, t, { a: 0.08, d: 0.25, peak: 0.04 }, 'bandpass', 400, 1600, 1.2);
      tone(ctx, wet, t + 0.05, midi(50), { a: 0.005, d: 0.9, peak: 0.04 }, 'triangle');
      break;
    case 'ui-close':
      hiss(ctx, dry, t, { a: 0.03, d: 0.2, peak: 0.035 }, 'bandpass', 1400, 380, 1.2);
      tone(ctx, dry, t, midi(45), { a: 0.005, d: 0.4, peak: 0.03 }, 'sine');
      break;
    case 'ui-confirm':
      // Latch: two knocks 22 ms apart with a low body, then a short tonal ring (the suit locking in).
      for (const i of [0, 1]) {
        hiss(ctx, dry, t + i * 0.022, { a: 0.001, d: 0.03, peak: 0.09 - i * 0.03 }, 'bandpass', 900, 700, 1.5);
        tone(ctx, dry, t + i * 0.022, 120, { a: 0.002, d: 0.08, peak: 0.12 - i * 0.04 }, 'sine', 80);
      }
      tone(ctx, wet, t + 0.05, midi(62), { a: 0.004, d: 1.2, peak: 0.04 }, 'sine');
      tone(ctx, dry, t + 0.05, midi(69), { a: 0.004, d: 0.5, peak: 0.02 }, 'sine');
      break;
    case 'ui-tic':
      // Marimba-like note in the score's key (D), one octave lower than a bright UI would use.
      tone(ctx, dry, t, midi(62), { a: 0.0015, d: 0.2, peak: 0.06 }, 'sine');
      tone(ctx, dry, t, midi(62) * 3.99, { a: 0.0015, d: 0.03, peak: 0.015 }, 'sine');
      break;
    case 'recall':
      tone(ctx, dry, t, midi(57), { a: 0.05, d: 2.4, peak: 0.07 }, 'triangle', midi(45));
      tone(ctx, wet, t, midi(50), { a: 0.3, d: 3, peak: 0.06 }, 'sine', midi(38));
      break;
    case 'heartbeat':
      tone(ctx, dry, t, 58, { a: 0.006, d: 0.16, peak: 0.24 }, 'sine', 42);
      tone(ctx, dry, t + 0.22, 52, { a: 0.006, d: 0.2, peak: 0.16 }, 'sine', 40);
      break;
  }
}

/** Generative score. `schedule` is called ahead of time and places notes in [from, to). */
export class Score {
  mood: Mood = 'silent';
  private chord = 0;
  private nextChord = 0;
  private nextBell = 0;
  private readonly ctx: BaseAudioContext;
  private readonly out: AudioNode;
  private readonly wet: AudioNode;
  private readonly drone: GainNode;
  private readonly filter: BiquadFilterNode;
  constructor(ctx: BaseAudioContext, out: AudioNode, wet: AudioNode) {
    this.ctx = ctx; this.out = out; this.wet = wet;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass'; this.filter.frequency.value = 520; this.filter.Q.value = 0.7;
    this.filter.connect(out);
    this.filter.connect(wet);
    // Sub drone on D1/D2 with a slow beating detune; it carries the low register under everything.
    this.drone = ctx.createGain();
    this.drone.gain.value = 0;
    this.drone.connect(out);
    for (const [f, type, level] of [[36.71, 'sine', 0.5], [73.42, 'sine', 0.22], [73.9, 'triangle', 0.08]] as const) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = level;
      o.connect(g).connect(this.drone); o.start();
    }
    // Slow filter breathing (about 14 s per cycle).
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 0.07; depth.gain.value = 180;
    lfo.connect(depth).connect(this.filter.frequency); lfo.start();
  }

  setMood(mood: Mood, t = this.ctx.currentTime) {
    if (mood === this.mood) return;
    this.mood = mood;
    const levels: Record<Mood, [number, number]> = {
      silent: [0, 200], menu: [0.18, 560], surface: [0.14, 480], cold: [0.2, 300], complete: [0.12, 720], recalled: [0.16, 340],
    };
    const [drone, cutoff] = levels[mood];
    this.drone.gain.cancelScheduledValues(t);
    this.drone.gain.setTargetAtTime(drone, t, 2.5);
    this.filter.frequency.setTargetAtTime(cutoff, t, 3);
    if (mood === 'complete') this.chord = 1;
    if (mood === 'recalled') this.chord = 2;
    this.nextChord = t + 0.5;
  }

  /** One chord: fades in over 4 s, holds, and crossfades into the next one over 5 s. */
  private pad(t: number, notes: number[], length: number) {
    notes.forEach((n, i) => {
      const g = this.ctx.createGain(), level = i === 0 ? 0.05 : 0.026, end = t + length + 5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(level, t + 4);
      g.gain.setValueAtTime(level, t + length);
      g.gain.linearRampToValueAtTime(0.0001, end);
      g.connect(this.filter);
      for (const cents of [-7, 6]) {
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = cents;
        o.connect(g); o.start(t); o.stop(end + 0.1);
      }
    });
  }

  schedule(from: number, to: number) {
    if (this.mood === 'silent') return;
    const length = this.mood === 'menu' ? 18 : 16;
    if (this.nextChord < to) {
      const at = Math.max(from, this.nextChord);
      this.pad(at, chords[this.chord % chords.length], length);
      this.chord++;
      this.nextChord = at + length;
    }
    while (this.nextBell < to) {
      const at = Math.max(from, this.nextBell);
      // Sparse bells: one every 3–9 s, from the chord's colour, low octave; fewer in the cold.
      const pool = this.mood === 'cold' ? bells.slice(0, 3) : bells;
      const n = pool[(Math.floor(at * 7.3) % pool.length + pool.length) % pool.length] - (this.mood === 'cold' ? 12 : 0);
      tone(this.ctx, this.wet, at, midi(n), { a: 0.01, d: 3.5, peak: this.mood === 'menu' ? 0.05 : 0.035 }, 'triangle');
      tone(this.ctx, this.out, at, midi(n), { a: 0.005, d: 1.8, peak: 0.02 }, 'sine');
      this.nextBell = at + 3 + ((Math.sin(at * 12.9898) * 43758.5453) % 1 + 1) % 1 * 6;
    }
  }
}

/** Live audio for the game: buses, reverb, score scheduler and continuous layers (static, heartbeat). */
export class GameAudio {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private wet!: GainNode;
  private staticGain!: GainNode;
  private score!: Score;
  private timer = 0;
  private lastBeat = 0;
  private pendingMood: Mood = 'silent';
  private voiceGain!: GainNode;
  private voices = new Map<string, Promise<AudioBuffer | null>>();
  private speaking: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  /**
   * Wind bed. 0 on the Moon (no air carries sound); on Mars the thin atmosphere does carry a low, breathy wind, as
   * the microphones on NASA's Perseverance rover recorded. `storm` raises it during the dust contingency.
   */
  private windLevel = 0;
  private storm = 0;
  volumes = { master: 0.8, music: 0.7, sfx: 0.9 };

  setWind(level: number) { this.windLevel = level; this.applyWind(); }
  setStorm(level: number) { this.storm = level; this.applyWind(); }
  private applyWind() {
    if (!this.ctx || !this.windGain) return;
    this.windGain.gain.setTargetAtTime(this.windLevel * (0.05 + this.storm * 0.09), this.ctx.currentTime, 1.2);
  }

  /** Built once, silent until setWind. */
  private buildWind(ctx: AudioContext) {
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
    windBed(ctx, this.windGain);
    this.windGain.connect(this.sfx);
  }

  /** Browsers only allow audio after a user gesture; call this from one. */
  unlock() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.ratio.value = 6; limiter.attack.value = 0.005; limiter.release.value = 0.3;
    this.master = ctx.createGain(); this.music = ctx.createGain(); this.sfx = ctx.createGain(); this.wet = ctx.createGain();
    const reverb = makeReverb(ctx);
    this.wet.gain.value = 0.9;
    this.music.connect(this.master); this.sfx.connect(this.master);
    this.wet.connect(reverb).connect(this.master);
    this.voiceGain = ctx.createGain();
    this.voiceGain.connect(this.master);
    this.master.connect(limiter).connect(ctx.destination);
    const s = ctx.createBufferSource(), band = ctx.createBiquadFilter();
    s.buffer = noise(ctx); s.loop = true; band.type = 'bandpass'; band.frequency.value = 1400; band.Q.value = 0.9;
    this.staticGain = ctx.createGain(); this.staticGain.gain.value = 0;
    s.connect(band).connect(this.staticGain).connect(this.sfx); s.start();
    this.score = new Score(ctx, this.music, this.wet);
    this.buildWind(ctx);
    this.applyWind();
    this.applyVolumes();
    this.score.setMood(this.pendingMood);
    this.timer = window.setInterval(() => { const t = ctx.currentTime; this.score.schedule(t, t + 0.6); }, 250);
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.master, t, 0.05);
    this.music.gain.setTargetAtTime(this.volumes.music, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.volumes.sfx, t, 0.05);
    this.voiceGain.gain.setTargetAtTime(Math.min(1, this.volumes.sfx * 1.1), t, 0.05);
  }

  /** Plays a recorded line (LUMA's translated voice). Lines load on first use; music dips while it speaks. */
  voice(url: string) {
    const ctx = this.ctx;
    if (!ctx) return;
    let buffer = this.voices.get(url);
    if (!buffer) {
      buffer = fetch(url).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then(b => ctx.decodeAudioData(b)).catch(() => null);
      this.voices.set(url, buffer);
    }
    void buffer.then(buf => {
      if (!buf || this.ctx !== ctx) return;
      this.stopVoice();
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(this.voiceGain);
      source.start();
      this.speaking = source;
      this.music.gain.setTargetAtTime(this.volumes.music * 0.4, ctx.currentTime, 0.12);
      source.onended = () => { if (this.speaking === source) { this.speaking = null; this.music.gain.setTargetAtTime(this.volumes.music, ctx.currentTime, 0.4); } };
    });
  }

  stopVoice() {
    if (!this.speaking || !this.ctx) return;
    try { this.speaking.stop(); } catch { /* already stopped */ }
    this.speaking = null;
    this.music.gain.setTargetAtTime(this.volumes.music, this.ctx.currentTime, 0.4);
  }

  mood(m: Mood) { this.pendingMood = m; if (this.ctx) this.score.setMood(m); }

  play(name: Sfx) { if (this.ctx && this.ctx.state === 'running') playSfx(this.ctx, this.sfx, this.wet, name); }

  /** Continuous cues driven every frame: radio static as the link fades, heartbeat near the reserve. */
  tick(signal: number, lowEnergy: boolean) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    this.staticGain.gain.setTargetAtTime(signal < 1 ? (1 - signal) * 0.05 : 0, t, 0.2);
    if (lowEnergy && t - this.lastBeat > 1.25) { this.lastBeat = t; this.play('heartbeat'); }
  }

  suspend(hidden: boolean) { if (this.ctx) void (hidden ? this.ctx.suspend() : this.ctx.resume()); }

  dispose() { clearInterval(this.timer); void this.ctx?.close(); this.ctx = null; }
}

/** Martian wind: low-passed noise whose cutoff and level breathe slowly, like gusts, into `out`. */
export function windBed(ctx: BaseAudioContext, out: AudioNode) {
  const src = ctx.createBufferSource(), low = ctx.createBiquadFilter(), gust = ctx.createGain();
  src.buffer = noise(ctx); src.loop = true;
  low.type = 'lowpass'; low.frequency.value = 380; low.Q.value = 0.7;
  gust.gain.value = 0.7;
  const lfo = ctx.createOscillator(), lfoDepth = ctx.createGain();
  lfo.frequency.value = 0.11; lfoDepth.gain.value = 220;
  lfo.connect(lfoDepth).connect(low.frequency);
  const lfo2 = ctx.createOscillator(), lfo2Depth = ctx.createGain();
  lfo2.frequency.value = 0.07; lfo2Depth.gain.value = 0.3;
  lfo2.connect(lfo2Depth).connect(gust.gain);
  src.connect(low).connect(gust).connect(out);
  src.start(); lfo.start(); lfo2.start();
}

/** Shared instance: the engine drives music and game sounds, the interface plays its own clicks through it. */
export const sound = new GameAudio();

/** Renders a sound or a stretch of score offline and returns 16-bit PCM WAV bytes (used for review tooling). */
export async function renderWav(what: { sfx?: Sfx; mood?: Mood; wind?: number }, seconds: number, sampleRate = 44100) {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const out = ctx.createGain(), wet = ctx.createGain();
  const reverb = makeReverb(ctx);
  wet.gain.value = 0.9;
  out.connect(ctx.destination); wet.connect(reverb).connect(ctx.destination);
  if (what.sfx) playSfx(ctx, out, wet, what.sfx, 0.05);
  if (what.mood) { const score = new Score(ctx, out, wet); score.setMood(what.mood, 0); score.schedule(0, seconds); }
  if (what.wind) { const g = ctx.createGain(); g.gain.value = 0.05 + what.wind * 0.09; windBed(ctx, g); g.connect(out); }
  const buf = await ctx.startRendering();
  const frames = buf.length, bytes = new DataView(new ArrayBuffer(44 + frames * 4));
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) bytes.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); bytes.setUint32(4, 36 + frames * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 2, true); bytes.setUint32(24, sampleRate, true);
  bytes.setUint32(28, sampleRate * 4, true); bytes.setUint16(32, 4, true); bytes.setUint16(34, 16, true); w(36, 'data'); bytes.setUint32(40, frames * 4, true);
  const l = buf.getChannelData(0), r = buf.getChannelData(1);
  for (let i = 0; i < frames; i++) {
    bytes.setInt16(44 + i * 4, Math.max(-1, Math.min(1, l[i])) * 32767, true);
    bytes.setInt16(46 + i * 4, Math.max(-1, Math.min(1, r[i])) * 32767, true);
  }
  return new Uint8Array(bytes.buffer);
}
