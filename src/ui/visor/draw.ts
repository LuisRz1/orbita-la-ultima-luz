// Canvas side of the helmet HUD: everything that must move smoothly (heading tape, pitch ladder, reticle, speed and
// altitude readouts, radar) is drawn here once per animation frame from the per-frame feed, without re-rendering React.
// Every line is stroked twice (a dark under-stroke, then the colour) so it stays readable over bright regolith.
import { reserve } from '../../core/suit.ts';
import { prefs } from '../prefs.ts';
import { hud } from '../store.ts';
import { radarRange, visorFeed, type BlipKind } from './feed.ts';

const cyan = '127 227 224', amber = '255 175 104', warm = '255 196 111', ink = '4 10 14';
const font = (px: number, bold = false) => `${bold ? 700 : 400} ${px}px 'Perihelio Mono', ui-monospace, Menlo, Consolas, monospace`;
const rad = Math.PI / 180;
const wrapDeg = (d: number) => ((d + 540) % 360 + 360) % 360 - 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function fit(canvas: HTMLCanvasElement, ratio: number) {
  const w = Math.round(canvas.clientWidth * ratio), h = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

/** Starts the draw loop; returns the function that stops it. */
export function startHelmet(glass: HTMLCanvasElement, scope: HTMLCanvasElement) {
  const g = glass.getContext('2d')!, r = scope.getContext('2d')!;
  const born = performance.now();
  let frame = 0, alive = true, sweep = 0, last = born, promptAt = 0, hadPrompt = false;

  function stroke(c: CanvasRenderingContext2D, color: string, alpha: number, width: number) {
    c.lineWidth = width + 2.2; c.strokeStyle = `rgb(${ink} / ${alpha * 0.5})`; c.stroke();
    c.lineWidth = width; c.strokeStyle = `rgb(${color} / ${alpha})`; c.stroke();
  }
  function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, alpha: number) {
    c.lineWidth = 3; c.strokeStyle = `rgb(${ink} / ${alpha * 0.6})`; c.strokeText(s, x, y);
    c.fillStyle = `rgb(${color} / ${alpha})`; c.fillText(s, x, y);
  }

  function drawGlass(now: number) {
    const s = hud.getState(), f = visorFeed, calm = prefs.getState().reduceMotion, es = prefs.getState().lang === 'es';
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    fit(glass, ratio);
    const W = glass.clientWidth, H = glass.clientHeight, u = H / 720, cx = W / 2;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!W || !H) return;
    // Power-on: each block comes alive in turn; with reduced motion everything is simply there.
    const boot = calm ? 1 : clamp((now - born) / 900, 0, 1);
    const stage = (from: number) => { const k = clamp((boot - from) / 0.18, 0, 1); return k >= 1 || calm ? k : k * (Math.sin(now / 17 + from * 40) > -0.3 ? 1 : 0.35); };
    const low = s.capacity > 0 && s.energy - reserve < 15, weak = s.signal < 0.5;
    const blink = calm ? 1 : 0.72 + 0.28 * Math.sign(Math.sin(now / 260));
    // Landing and dash reactions: the projection lags a few pixels behind the helmet, then settles.
    const sinceLand = (now - f.landAt) / 1000, sinceDash = (now - f.dashAt) / 1000;
    const bounce = calm || sinceLand > 0.5 ? 0 : Math.exp(-sinceLand * 9) * Math.cos(sinceLand * 26) * clamp(f.landHard * 1.1, 2, 12) * u;
    // Link static: the picture tears sideways now and then as the signal drops.
    const noise = calm || !weak ? 0 : clamp((0.5 - s.signal) * 2.2, 0.15, 1);
    const tear = noise && Math.random() < noise * 0.12 ? (Math.random() - 0.5) * 10 * u : 0;
    g.save();
    g.translate(tear, bounce);
    g.lineCap = 'butt'; g.textBaseline = 'middle';

    // ---- heading tape ----
    const a1 = stage(0.2);
    if (a1 > 0) {
      const ty = H * 0.152, half = Math.min(W * 0.23, 360 * u), ppd = half / 48, hd = ((-f.yaw / rad) % 360 + 360) % 360;
      g.save();
      g.beginPath(); g.rect(cx - half, ty - 26 * u, half * 2, 64 * u); g.clip();
      g.beginPath();
      g.font = font(11 * u, true); g.textAlign = 'center';
      const names: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: es ? 'SO' : 'SW', 270: es ? 'O' : 'W', 315: es ? 'NO' : 'NW' };
      const labels: [string, number, boolean][] = [];
      for (let d = Math.ceil((hd - 50) / 5) * 5; d <= hd + 50; d += 5) {
        const x = cx + (d - hd) * ppd, m = ((d % 360) + 360) % 360, major = m % 15 === 0;
        g.moveTo(x, ty); g.lineTo(x, ty - (major ? 9 : 5) * u);
        if (major) labels.push([names[m] ?? String(m).padStart(3, '0'), x, m % 90 === 0]);
      }
      g.moveTo(cx - half, ty); g.lineTo(cx + half, ty);
      stroke(g, cyan, 0.8 * a1, 1.2 * u);
      for (const [label, x, cardinal] of labels) { g.font = font((cardinal ? 13 : 10) * u, cardinal); text(g, label, x, ty - 18 * u, cyan, (cardinal ? 1 : 0.7) * a1); }
      // Objective and lander on the tape; pinned to the edge, dimmer, when they are behind the shoulder.
      for (const m of s.compass.marks) {
        // Angle to the right of the view: the published bearing against this frame's yaw.
        const live = wrapDeg(((f.yaw + Math.PI) - m.bearing) / rad), out = Math.abs(live) > 46;
        const x = cx + clamp(live, -46, 46) * ppd, y = ty + 11 * u, color = m.kind === 'home' ? amber : cyan, k = 5.5 * u;
        g.beginPath();
        if (m.kind === 'home') { g.moveTo(x - k, y + k); g.lineTo(x - k, y - k * 0.2); g.lineTo(x, y - k); g.lineTo(x + k, y - k * 0.2); g.lineTo(x + k, y + k); g.closePath(); }
        else { g.moveTo(x, y - k); g.lineTo(x + k, y); g.lineTo(x, y + k); g.lineTo(x - k, y); g.closePath(); }
        g.fillStyle = `rgb(${color} / ${(out ? 0.25 : 0.9) * a1})`; g.fill();
        stroke(g, color, (out ? 0.5 : 1) * a1, 1.2 * u);
        g.font = font(10 * u); g.textAlign = out ? (live > 0 ? 'right' : 'left') : 'center';
        text(g, (out ? (live > 0 ? '' : '◂ ') : '') + Math.round(m.dist) + ' m' + (out && live > 0 ? ' ▸' : ''), out ? x + (live > 0 ? k : -k) : x, y + 15 * u, color, (out ? 0.7 : 1) * a1);
      }
      // Soft ends.
      g.globalCompositeOperation = 'destination-out';
      for (const side of [-1, 1]) {
        const grad = g.createLinearGradient(cx + side * half, 0, cx + side * half * 0.78, 0);
        grad.addColorStop(0, 'rgb(0 0 0 / 1)'); grad.addColorStop(1, 'rgb(0 0 0 / 0)');
        g.fillStyle = grad; g.fillRect(side < 0 ? cx - half : cx + half * 0.78, ty - 26 * u, half * 0.22, 64 * u);
      }
      g.restore();
      // Caret and boxed heading above the tape.
      g.beginPath(); g.moveTo(cx, ty + 2 * u); g.lineTo(cx - 5 * u, ty - 0 * u + 9 * u); g.lineTo(cx + 5 * u, ty + 9 * u); g.closePath();
      g.fillStyle = `rgb(${cyan} / ${a1})`; g.fill();
      const bw = 50 * u, bh = 19 * u, by = ty - 40 * u;
      g.fillStyle = `rgb(${ink} / ${0.55 * a1})`; g.fillRect(cx - bw / 2, by - bh / 2, bw, bh);
      g.beginPath(); g.rect(cx - bw / 2, by - bh / 2, bw, bh); stroke(g, cyan, 0.9 * a1, 1.2 * u);
      g.font = font(12 * u, true); g.textAlign = 'center';
      text(g, String(Math.round(hd) % 360).padStart(3, '0') + '°', cx, by + 0.5 * u, cyan, a1);
      // Warnings sit under the tape, where a pilot's master caution would be.
      const warn = low ? (es ? 'BATERÍA BAJA · VUELVE AL MÓDULO' : 'BATTERY LOW · HEAD BACK') : weak ? (es ? 'ENLACE DÉBIL · ' : 'WEAK LINK · ') + Math.round(s.signal * 100) + '%' : null;
      if (warn) {
        g.font = font(12 * u, true);
        const ww = g.measureText(warn).width + 26 * u, wy = ty + 52 * u;
        g.fillStyle = `rgb(${ink} / ${0.6 * a1})`; g.fillRect(cx - ww / 2, wy - 11 * u, ww, 22 * u);
        g.beginPath(); g.rect(cx - ww / 2, wy - 11 * u, ww, 22 * u); stroke(g, amber, blink * a1, 1.2 * u);
        text(g, warn, cx, wy + 0.5 * u, amber, blink * a1);
      }
    }

    // ---- pitch ladder, registered to the real horizon ----
    const cy = H / 2, a2 = stage(0.42);
    if (a2 > 0) {
      const focal = (H / 2) / Math.tan(f.fov * rad / 2), reach = H * 0.215;
      g.save();
      g.beginPath(); g.rect(cx - 190 * u, cy - reach, 380 * u, reach * 2); g.clip();
      g.font = font(10 * u); g.textAlign = 'left';
      for (let e = -80; e <= 80; e += 10) {
        const rel = e * rad + f.pitch;
        if (Math.abs(rel) > 1.1) continue;
        const y = cy - Math.tan(rel) * focal;
        if (y < cy - reach - 10 || y > cy + reach + 10) continue;
        // Rungs fade toward the edge of the window, so they never end on a hard cut.
        const fade = clamp(1.25 - Math.abs(y - cy) / reach, 0, 1) * a2;
        const inner = e === 0 ? 60 * u : 46 * u, outer = e === 0 ? 172 * u : 104 * u;
        g.beginPath();
        if (e < 0) g.setLineDash([7 * u, 5 * u]); else g.setLineDash([]);
        for (const side of [-1, 1]) {
          g.moveTo(cx + side * inner, y); g.lineTo(cx + side * outer, y);
          if (e !== 0) { g.moveTo(cx + side * outer, y); g.lineTo(cx + side * outer, y + Math.sign(e) * 6 * u); }
        }
        stroke(g, cyan, (e === 0 ? 0.85 : 0.6) * fade, (e === 0 ? 1.5 : 1.1) * u);
        g.setLineDash([]);
        if (e !== 0) text(g, String(Math.abs(e)), cx + outer + 6 * u, y, cyan, 0.65 * fade);
      }
      g.restore();
    }

    // ---- reticle ----
    const a3 = stage(0.5), prompt = s.prompt && !s.dialogue ? s.prompt : null;
    if (prompt && !hadPrompt) promptAt = now;
    hadPrompt = !!prompt;
    if (a3 > 0) {
      const kick = calm || sinceDash > 0.35 ? 0 : (1 - sinceDash / 0.35) * 9 * u;
      if (prompt) {
        // Something in reach: the reticle opens into brackets that close in on it; amber when the suit cannot do it yet.
        const stuck = prompt.blocked.length > 0 || !!prompt.missing, color = stuck ? amber : cyan;
        const k = calm ? 1 : clamp((now - promptAt) / 220, 0, 1), size = (26 - 8 * k) * u + (calm ? 0 : Math.sin(now / 240) * 1.2 * u), arm = 7 * u;
        g.beginPath();
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
          g.moveTo(cx + sx * size, cy + sy * (size - arm)); g.lineTo(cx + sx * size, cy + sy * size); g.lineTo(cx + sx * (size - arm), cy + sy * size);
        }
        stroke(g, color, a3, 1.8 * u);
        g.beginPath(); g.moveTo(cx, cy - 4 * u); g.lineTo(cx + 4 * u, cy); g.lineTo(cx, cy + 4 * u); g.lineTo(cx - 4 * u, cy); g.closePath();
        g.fillStyle = `rgb(${color} / ${a3})`; g.fill(); stroke(g, color, a3, 1 * u);
      } else {
        const gap = 7 * u + kick, len = 7 * u;
        g.beginPath();
        g.moveTo(cx - gap - len, cy); g.lineTo(cx - gap, cy); g.moveTo(cx + gap, cy); g.lineTo(cx + gap + len, cy);
        g.moveTo(cx, cy + gap); g.lineTo(cx, cy + gap + len * 0.7);
        stroke(g, cyan, 0.9 * a3, 1.4 * u);
        g.beginPath(); g.arc(cx, cy, 1.4 * u, 0, Math.PI * 2); g.fillStyle = `rgb(${cyan} / ${a3})`; g.fill();
      }
      // Dash: streaks rush outward for a moment.
      if (kick > 0) {
        const k = sinceDash / 0.35;
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2 + 0.3, r0 = (120 + 220 * k) * u, r1 = r0 + (60 - 40 * k) * u;
          g.moveTo(cx + Math.cos(ang) * r0 * 1.5, cy + Math.sin(ang) * r0 * 0.8); g.lineTo(cx + Math.cos(ang) * r1 * 1.5, cy + Math.sin(ang) * r1 * 0.8);
        }
        stroke(g, cyan, 0.5 * (1 - k), 1.4 * u);
      }
    }

    // ---- speed (left) and altitude (right) ----
    const a4 = stage(0.62);
    if (a4 > 0) {
      const off = Math.min(W * 0.2, 290 * u), moving = f.speed > 0.3 || !f.grounded, dim = (moving ? 1 : 0.6) * a4;
      const box = (side: number, label: string, value: string, unit: string) => {
        const x = cx + side * off, w = 74 * u, h = 30 * u;
        g.fillStyle = `rgb(${ink} / ${0.4 * a4})`; g.fillRect(x - w / 2, cy - h / 2, w, h);
        g.beginPath();
        // Bracket open toward the reticle, with a pointer on the inner side.
        g.moveTo(x - side * w / 2, cy - h / 2); g.lineTo(x + side * w / 2, cy - h / 2); g.lineTo(x + side * w / 2, cy + h / 2); g.lineTo(x - side * w / 2, cy + h / 2);
        g.moveTo(x - side * w / 2, cy - 5 * u); g.lineTo(x - side * (w / 2 + 6 * u), cy); g.lineTo(x - side * w / 2, cy + 5 * u);
        stroke(g, cyan, 0.8 * dim, 1.2 * u);
        g.font = font(9.5 * u); g.textAlign = 'center';
        text(g, label, x, cy - h / 2 - 9 * u, cyan, 0.7 * dim);
        g.font = font(15 * u, true); text(g, value, x - 7 * u, cy + 1 * u, cyan, dim);
        g.font = font(9 * u); g.textAlign = 'left'; text(g, unit, x + w / 2 - 22 * u, cy + 2 * u, cyan, 0.7 * dim);
      };
      box(-1, es ? 'VEL' : 'SPD', f.speed.toFixed(1), 'm/s');
      box(1, 'ALT', f.alt.toFixed(1), 'm');
      if (!f.grounded) {
        // In the air: vertical speed with an arrow and a small bar that grows with it.
        const x = cx + off, y = cy + 30 * u, up = f.vy >= 0, len = clamp(Math.abs(f.vy) * 3.2, 3, 30) * u;
        g.font = font(11 * u, true); g.textAlign = 'center';
        text(g, (up ? '▲ ' : '▼ ') + Math.abs(f.vy).toFixed(1) + ' m/s', x, y, up ? cyan : amber, a4);
        g.beginPath(); g.moveTo(x + 48 * u, cy); g.lineTo(x + 48 * u, cy - Math.sign(f.vy || 1) * len); stroke(g, up ? cyan : amber, a4, 3 * u);
      }
    }
    g.restore();

    // ---- link static ----
    if (noise > 0) {
      g.fillStyle = `rgb(${cyan} / ${0.1 + noise * 0.14})`;
      for (let i = 0, n = Math.round(noise * 46); i < n; i++) g.fillRect(Math.random() * W, Math.random() * H * 0.78, (8 + Math.random() * 90) * u, u);
      if (Math.random() < noise * 0.2) { g.fillStyle = `rgb(${amber} / 0.07)`; g.fillRect(0, Math.random() * H * 0.7, W, (2 + Math.random() * 10) * u); }
    }
  }

  const shapes: Record<BlipKind, (c: CanvasRenderingContext2D, x: number, y: number, k: number) => void> = {
    goal: (c, x, y, k) => { c.moveTo(x, y - k * 1.3); c.lineTo(x + k * 1.3, y); c.lineTo(x, y + k * 1.3); c.lineTo(x - k * 1.3, y); c.closePath(); },
    point: (c, x, y, k) => { c.rect(x - k * 0.7, y - k * 0.7, k * 1.4, k * 1.4); },
    home: (c, x, y, k) => { c.moveTo(x - k, y + k); c.lineTo(x - k, y - k * 0.2); c.lineTo(x, y - k * 1.2); c.lineTo(x + k, y - k * 0.2); c.lineTo(x + k, y + k); c.closePath(); },
    luma: (c, x, y, k) => { c.arc(x, y, k * 0.9, 0, Math.PI * 2); },
    echo: (c, x, y, k) => { c.arc(x, y, k * 0.55, 0, Math.PI * 2); },
    rock: (c, x, y, k) => { c.moveTo(x, y - k); c.lineTo(x + k * 0.9, y + k * 0.7); c.lineTo(x - k * 0.9, y + k * 0.7); c.closePath(); },
  };
  const colors: Record<BlipKind, string> = { goal: cyan, point: cyan, home: amber, luma: warm, echo: '236 244 250', rock: cyan };

  function drawScope(now: number, dt: number) {
    const f = visorFeed, s = hud.getState(), calm = prefs.getState().reduceMotion;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    fit(scope, ratio);
    const S = scope.clientWidth, c = S / 2, R = c - 3, k = S / 34;
    r.setTransform(ratio, 0, 0, ratio, 0, 0);
    r.clearRect(0, 0, S, S);
    if (!S) return;
    const boot = calm ? 1 : clamp((now - born - 350) / 500, 0, 1);
    r.save();
    r.beginPath(); r.arc(c, c, R, 0, Math.PI * 2); r.clip();
    r.globalAlpha = boot;
    // Range rings, cross hairs and the view cone.
    r.beginPath();
    for (const q of [1 / 3, 2 / 3]) { r.moveTo(c + R * q, c); r.arc(c, c, R * q, 0, Math.PI * 2); }
    r.moveTo(c - R, c); r.lineTo(c + R, c); r.moveTo(c, c - R); r.lineTo(c, c + R);
    r.lineWidth = 1; r.strokeStyle = `rgb(${cyan} / 0.2)`; r.stroke();
    const half = Math.atan(Math.tan(f.fov * rad / 2) * (window.innerWidth / Math.max(1, window.innerHeight)));
    r.beginPath(); r.moveTo(c, c); r.arc(c, c, R, -Math.PI / 2 - half, -Math.PI / 2 + half); r.closePath();
    r.fillStyle = `rgb(${cyan} / 0.07)`; r.fill();
    // Sweep: a rotating wedge that fades behind its leading edge.
    if (!calm) {
      sweep = (sweep + dt * 1.9) % (Math.PI * 2);
      const grad = r.createConicGradient?.(sweep - Math.PI * 0.5, c, c);
      if (grad) {
        grad.addColorStop(0, `rgb(${cyan} / 0)`); grad.addColorStop(0.82, `rgb(${cyan} / 0)`); grad.addColorStop(1, `rgb(${cyan} / 0.28)`);
        r.fillStyle = grad; r.beginPath(); r.arc(c, c, R, 0, Math.PI * 2); r.fill();
      }
    }
    // North tick on the rim (heading-up scope).
    const north = f.yaw - Math.PI / 2;
    r.font = font(Math.max(8, k * 2.6), true); r.textAlign = 'center'; r.textBaseline = 'middle';
    r.fillStyle = `rgb(${cyan} / 0.75)`; r.fillText('N', c + Math.cos(north) * (R - k * 2.4), c + Math.sin(north) * (R - k * 2.4));
    // Blips, rotated into the camera frame: right = +x on screen, forward = up.
    const cos = Math.cos(f.yaw), sin = Math.sin(f.yaw), pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(now / 300);
    for (const b of f.blips) {
      const dx = b.x - f.x, dz = b.z - f.z;
      let right = dx * cos - dz * sin, fwd = -dx * sin - dz * cos;
      const d = Math.hypot(right, fwd), far = d > radarRange * 0.93;
      if (far) {
        if (b.kind !== 'goal' && b.kind !== 'home') continue;
        right *= radarRange * 0.93 / d; fwd *= radarRange * 0.93 / d;
      }
      const x = c + right / radarRange * R, y = c - fwd / radarRange * R, color = colors[b.kind];
      r.beginPath(); shapes[b.kind](r, x, y, k);
      if (b.kind === 'point' || far) { r.lineWidth = 1.3; r.strokeStyle = `rgb(${color} / ${far ? 0.75 : 0.8})`; r.stroke(); }
      else { r.fillStyle = `rgb(${color} / 0.95)`; r.fill(); }
      if (b.kind === 'goal' || b.kind === 'luma') {
        r.beginPath(); r.arc(x, y, k * (1.6 + pulse * 1.3), 0, Math.PI * 2);
        r.lineWidth = 1; r.strokeStyle = `rgb(${color} / ${0.55 - pulse * 0.4})`; r.stroke();
      }
    }
    // The wearer, pointing up.
    r.beginPath(); r.moveTo(c, c - k * 1.5); r.lineTo(c + k * 1.1, c + k * 1.2); r.lineTo(c, c + k * 0.5); r.lineTo(c - k * 1.1, c + k * 1.2); r.closePath();
    r.fillStyle = '#eafcff'; r.fill();
    // Weak link: the scope loses lines.
    if (!calm && s.signal < 0.5) {
      r.fillStyle = 'rgb(3 8 11 / 0.8)';
      for (let i = 0; i < 5; i++) r.fillRect(0, Math.random() * S, S, 1 + Math.random() * 3 * (1 - s.signal));
    }
    r.restore();
  }

  function tick(now: number) {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    drawGlass(now); drawScope(now, dt);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(frame); };
}
