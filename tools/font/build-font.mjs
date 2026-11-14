// Builds "Perihelio Mono", the project's own typeface, from stroke data. Original design, no third-party outlines.
// Every glyph is a set of centre-line strokes on a 4 × 7 grid (x 0–4; y: baseline 0, x-height 5, cap 7, descender −2).
// Strokes become rectangles plus octagonal joints, which gives the 45° cut corners of the design.
// Usage: node tools/font/build-font.mjs   → public/fonts/perihelio-mono-{400,700}.otf
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const advance = 600, side = 72, cap = 700;

// ---------- glyph strokes ----------
const P = (...pts) => pts;
const ring = (x0, y0, x1, y1, c = 1) => P([x0 + c, y0], [x0, y0 + c], [x0, y1 - c], [x0 + c, y1], [x1 - c, y1], [x1, y1 - c], [x1, y0 + c], [x1 - c, y0], [x0 + c, y0]);

const O = [ring(0, 0, 4, 7)];
const Pbowl = P([0, 0], [0, 7], [3, 7], [4, 6], [4, 4], [3, 3], [0, 3]);
const glyphs = {
  A: [P([0, 0], [0, 5.5], [1.5, 7], [2.5, 7], [4, 5.5], [4, 0]), P([0, 2.8], [4, 2.8])],
  B: [P([0, 0], [0, 7], [3, 7], [4, 6], [4, 4.6], [3, 3.6], [0, 3.6]), P([3, 3.6], [4, 2.6], [4, 1], [3, 0], [0, 0])],
  C: [P([4, 7], [1, 7], [0, 6], [0, 1], [1, 0], [4, 0])],
  D: [P([0, 0], [0, 7], [2.5, 7], [4, 5.5], [4, 1.5], [2.5, 0], [0, 0])],
  E: [P([4, 7], [0, 7], [0, 0], [4, 0]), P([0, 3.6], [3, 3.6])],
  F: [P([4, 7], [0, 7], [0, 0]), P([0, 3.6], [3, 3.6])],
  G: [P([4, 6], [3, 7], [1, 7], [0, 6], [0, 1], [1, 0], [4, 0], [4, 3.4], [2.4, 3.4])],
  H: [P([0, 0], [0, 7]), P([4, 0], [4, 7]), P([0, 3.6], [4, 3.6])],
  I: [P([2, 0], [2, 7]), P([0.8, 7], [3.2, 7]), P([0.8, 0], [3.2, 0])],
  J: [P([1.2, 7], [4, 7], [4, 1], [3, 0], [1, 0], [0, 1], [0, 2])],
  K: [P([0, 0], [0, 7]), P([0, 3.4], [1.2, 3.4], [4, 7]), P([1.2, 3.4], [4, 0])],
  L: [P([0, 7], [0, 0], [4, 0])],
  M: [P([0, 0], [0, 7], [2, 4.2], [4, 7], [4, 0])],
  N: [P([0, 0], [0, 7], [4, 0], [4, 7])],
  O,
  P: [Pbowl],
  Q: [...O, P([2.4, 1.6], [4, -0.6])],
  R: [Pbowl, P([2, 3], [4, 0])],
  S: [P([4, 6], [3, 7], [1, 7], [0, 6], [0, 4.6], [1, 3.6], [3, 3.6], [4, 2.6], [4, 1], [3, 0], [1, 0], [0, 1])],
  T: [P([0, 7], [4, 7]), P([2, 7], [2, 0])],
  U: [P([0, 7], [0, 1], [1, 0], [3, 0], [4, 1], [4, 7])],
  V: [P([0, 7], [0, 3], [2, 0], [4, 3], [4, 7])],
  W: [P([0, 7], [0, 0], [2, 2.8], [4, 0], [4, 7])],
  X: [P([0, 7], [0, 6], [4, 1], [4, 0]), P([4, 7], [4, 6], [0, 1], [0, 0])],
  Y: [P([0, 7], [0, 5.5], [2, 3.4], [4, 5.5], [4, 7]), P([2, 3.4], [2, 0])],
  Z: [P([0, 7], [4, 7], [4, 6], [0, 1], [0, 0], [4, 0])],

  0: [...O, P([1, 2], [3, 5])],
  1: [P([0.6, 5.6], [2, 7], [2, 0]), P([0.6, 0], [3.4, 0])],
  2: [P([0, 6], [1, 7], [3, 7], [4, 6], [4, 4.4], [0, 1], [0, 0], [4, 0])],
  3: [P([0, 6], [1, 7], [3, 7], [4, 6], [4, 4.6], [3, 3.6], [1.4, 3.6]), P([3, 3.6], [4, 2.6], [4, 1], [3, 0], [1, 0], [0, 1])],
  4: [P([3, 0], [3, 7], [0, 2.2], [0, 1.8], [4, 1.8])],
  5: [P([4, 7], [0, 7], [0, 4], [3, 4], [4, 3], [4, 1], [3, 0], [0, 0])],
  6: [P([3.6, 7], [1.5, 7], [0, 5.5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [3, 4], [0, 4])],
  7: [P([0, 7], [4, 7], [4, 6], [1.6, 0])],
  8: [P([1, 3.6], [0, 4.6], [0, 6], [1, 7], [3, 7], [4, 6], [4, 4.6], [3, 3.6], [1, 3.6], [0, 2.6], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2.6], [3, 3.6])],
  9: [P([0.4, 0], [2.5, 0], [4, 1.5], [4, 6], [3, 7], [1, 7], [0, 6], [0, 4], [1, 3], [4, 3])],

  a: [P([0.4, 5], [3, 5], [4, 4], [4, 0]), P([4, 3], [1, 3], [0, 2], [0, 1], [1, 0], [4, 0])],
  b: [P([0, 7], [0, 0], [3, 0], [4, 1], [4, 4], [3, 5], [0, 5])],
  c: [P([4, 5], [1, 5], [0, 4], [0, 1], [1, 0], [4, 0])],
  d: [P([4, 7], [4, 0], [1, 0], [0, 1], [0, 4], [1, 5], [4, 5])],
  e: [P([0, 2.6], [4, 2.6], [4, 4], [3, 5], [1, 5], [0, 4], [0, 1], [1, 0], [3.8, 0])],
  f: [P([4, 7], [2.6, 7], [1.6, 6], [1.6, 0]), P([0, 5], [3.6, 5])],
  g: [P([4, 5], [4, -1], [3, -2], [0.4, -2]), P([4, 5], [1, 5], [0, 4], [0, 1], [1, 0], [4, 0])],
  h: [P([0, 7], [0, 0]), P([0, 5], [3, 5], [4, 4], [4, 0])],
  i: [P([0.8, 5], [2, 5], [2, 0]), P([0.8, 0], [3.2, 0]), P([2, 6.6])],
  j: [P([1.2, 5], [3, 5], [3, -1], [2, -2], [0.2, -2]), P([3, 6.6])],
  k: [P([0, 7], [0, 0]), P([0, 2], [1.4, 2], [4, 5]), P([1.4, 2], [4, 0])],
  l: [P([0.6, 7], [2, 7], [2, 1], [3, 0], [4, 0])],
  m: [P([0, 0], [0, 5], [3, 5], [4, 4], [4, 0]), P([2, 5], [2, 0])],
  n: [P([0, 0], [0, 5], [3, 5], [4, 4], [4, 0])],
  o: [ring(0, 0, 4, 5)],
  p: [P([0, -2], [0, 5], [3, 5], [4, 4], [4, 1], [3, 0], [0, 0])],
  q: [P([4, -2], [4, 5], [1, 5], [0, 4], [0, 1], [1, 0], [4, 0])],
  r: [P([0, 0], [0, 5]), P([0, 3.4], [1.6, 5], [4, 5])],
  s: [P([4, 5], [1, 5], [0, 4], [0, 3.4], [1, 2.6], [3, 2.6], [4, 1.8], [4, 1], [3, 0], [0, 0])],
  t: [P([1.6, 7], [1.6, 1], [2.6, 0], [4, 0]), P([0, 5], [3.6, 5])],
  u: [P([0, 5], [0, 1], [1, 0], [4, 0], [4, 5])],
  v: [P([0, 5], [0, 3], [2, 0], [4, 3], [4, 5])],
  w: [P([0, 5], [0, 0], [2, 2.2], [4, 0], [4, 5])],
  x: [P([0, 5], [4, 0]), P([4, 5], [0, 0])],
  y: [P([0, 5], [0, 1], [1, 0], [4, 0]), P([4, 5], [4, -1], [3, -2], [0.4, -2])],
  z: [P([0, 5], [4, 5], [4, 4.2], [0, 0.8], [0, 0], [4, 0])],

  '.': [P([2, 0])], ',': [P([2, 0], [1.3, -1.2])], ':': [P([2, 0]), P([2, 4])], ';': [P([2, 4]), P([2, 0], [1.3, -1.2])],
  '!': [P([2, 7], [2, 2.2]), P([2, 0])], '?': [P([0, 6], [1, 7], [3, 7], [4, 6], [4, 4.6], [2, 3.2], [2, 2.2]), P([2, 0])],
  '-': [P([0.8, 2.8], [3.2, 2.8])], '–': [P([0, 2.8], [4, 2.8])], '—': [P([-0.6, 2.8], [4.6, 2.8])], '_': [P([0, -1.4], [4, -1.4])],
  '/': [P([0.4, -0.6], [3.6, 7.6])], '\\': [P([0.4, 7.6], [3.6, -0.6])], '|': [P([2, -1.6], [2, 7.6])],
  '(': [P([3, 7.6], [1.6, 6.2], [1.6, 0.8], [3, -0.6])], ')': [P([1, 7.6], [2.4, 6.2], [2.4, 0.8], [1, -0.6])],
  '[': [P([3, 7.6], [1.4, 7.6], [1.4, -0.6], [3, -0.6])], ']': [P([1, 7.6], [2.6, 7.6], [2.6, -0.6], [1, -0.6])],
  '{': [P([3, 7.6], [2, 7.6], [1.6, 7.2], [1.6, 4], [0.8, 3.5], [1.6, 3], [1.6, -0.2], [2, -0.6], [3, -0.6])],
  '}': [P([1, 7.6], [2, 7.6], [2.4, 7.2], [2.4, 4], [3.2, 3.5], [2.4, 3], [2.4, -0.2], [2, -0.6], [1, -0.6])],
  '+': [P([2, 1.2], [2, 4.4]), P([0.4, 2.8], [3.6, 2.8])], '=': [P([0.4, 1.9], [3.6, 1.9]), P([0.4, 3.7], [3.6, 3.7])],
  '*': [P([2, 3.6], [2, 6.6]), P([0.7, 4.35], [3.3, 5.85]), P([0.7, 5.85], [3.3, 4.35])],
  '<': [P([3.6, 5.4], [0.4, 2.8], [3.6, 0.2])], '>': [P([0.4, 5.4], [3.6, 2.8], [0.4, 0.2])],
  '%': [P([0, 0], [4, 7]), P([0.6, 6]), P([3.4, 1])], '#': [P([1.2, 0.4], [1.2, 6.6]), P([2.8, 0.4], [2.8, 6.6]), P([0, 2.2], [4, 2.2]), P([0, 4.8], [4, 4.8])],
  "'": [P([2, 7], [2, 5.4])], '"': [P([1.2, 7], [1.2, 5.4]), P([2.8, 7], [2.8, 5.4])],
  '@': [P([3, 2], [3, 4.4], [1.4, 4.4], [1.4, 2], [4, 2], [4, 6], [3, 7], [1, 7], [0, 6], [0, 1], [1, 0], [4, 0])],
  '&': [P([4, 0], [0.6, 4.6], [0.6, 6.2], [1.4, 7], [2.6, 7], [3.2, 6.2], [3.2, 5.4], [0, 2.6], [0, 1], [1, 0], [2.6, 0], [4, 2])],
  '·': [P([2, 2.9])], '…': [P([0.4, 0]), P([2, 0]), P([3.6, 0])], '°': [ring(1, 5.2, 3, 7.2, 0.5)],
  '«': [P([2, 4.6], [0.4, 2.8], [2, 1]), P([3.8, 4.6], [2.2, 2.8], [3.8, 1])], '»': [P([0.2, 4.6], [1.8, 2.8], [0.2, 1]), P([2, 4.6], [3.6, 2.8], [2, 1])],
  '$': [P([4, 5.6], [1, 5.6], [0, 4.8], [0, 4.2], [1, 3.5], [3, 3.5], [4, 2.8], [4, 2.2], [3, 1.4], [0, 1.4]), P([2, 0], [2, 7])],
  '^': [P([0.6, 4.6], [2, 7], [3.4, 4.6])], '~': [P([0.2, 2.4], [1.2, 3.4], [2.8, 2.4], [3.8, 3.4])], '`': [P([1.4, 7.4], [2.4, 6.2])],
  '→': [P([0, 2.8], [4, 2.8]), P([2.4, 4.6], [4, 2.8], [2.4, 1])], '←': [P([4, 2.8], [0, 2.8]), P([1.6, 4.6], [0, 2.8], [1.6, 1])],
  '↗': [P([0.4, 0.6], [3.6, 5.8]), P([1.4, 5.8], [3.6, 5.8], [3.6, 3.6])],
  '■': [P([0.6, 0.8], [3.4, 0.8], [3.4, 4.2], [0.6, 4.2], [0.6, 0.8]), P([1.2, 1.6], [2.8, 1.6]), P([1.2, 2.5], [2.8, 2.5]), P([1.2, 3.4], [2.8, 3.4])],
  '□': [P([0.6, 0.8], [3.4, 0.8], [3.4, 4.2], [0.6, 4.2], [0.6, 0.8])],
  '▮': [P([1.2, 0], [2.8, 0]), P([1.2, 1], [2.8, 1]), P([1.2, 2], [2.8, 2]), P([1.2, 3], [2.8, 3]), P([1.2, 4], [2.8, 4]), P([1.2, 5], [2.8, 5])],
  '▯': [P([1.2, 0], [2.8, 0], [2.8, 5], [1.2, 5], [1.2, 0])],
  '✓': [P([0, 2.6], [1.4, 1], [4, 5])],
};

// Accented letters reuse the base strokes plus a mark placed above x-height or cap height.
const marks = {
  acute: y => [P([1.6, y], [2.8, y + 1.1])], grave: y => [P([1.2, y + 1.1], [2.4, y])],
  diaeresis: y => [P([1.1, y + 0.5]), P([2.9, y + 0.5])], circumflex: y => [P([0.8, y], [2, y + 1.1], [3.2, y])],
  tilde: y => [P([0.3, y], [1.2, y + 0.9], [2.8, y], [3.7, y + 0.9])],
};
const dotless = { i: [P([0.8, 5], [2, 5], [2, 0]), P([0.8, 0], [3.2, 0])] };
const accented = {
  á: ['a', 'acute'], é: ['e', 'acute'], í: ['ı', 'acute'], ó: ['o', 'acute'], ú: ['u', 'acute'], ñ: ['n', 'tilde'], ü: ['u', 'diaeresis'],
  à: ['a', 'grave'], è: ['e', 'grave'], ò: ['o', 'grave'], ç: null,
  Á: ['A', 'acute'], É: ['E', 'acute'], Í: ['I', 'acute'], Ó: ['O', 'acute'], Ú: ['U', 'acute'], Ñ: ['N', 'tilde'], Ü: ['U', 'diaeresis'],
  ê: ['e', 'circumflex'], â: ['a', 'circumflex'], ô: ['o', 'circumflex'],
};
glyphs['ı'] = dotless.i;
for (const [ch, spec] of Object.entries(accented)) {
  if (!spec) continue;
  const [base, mark] = spec;
  const upper = base === base.toUpperCase() && base !== 'ı';
  glyphs[ch] = [...glyphs[base], ...marks[mark](upper ? 7.9 : 5.9)];
}
glyphs['¡'] = glyphs['!'].map(s => s.map(([x, y]) => [x, 5 - y]));
glyphs['¿'] = glyphs['?'].map(s => s.map(([x, y]) => [4 - x, 5 - y]));

// ---------- outlines ----------
function outline(strokes, weight) {
  const h = weight / 2;
  const gx = x => side + h + x * (advance - 2 * side - weight) / 4;
  const gy = y => h + y * (cap - weight) / 7;
  const polys = [];
  const r = h / Math.cos(Math.PI / 8);
  const octagon = (cx, cy, scale = 1) => Array.from({ length: 8 }, (_, k) => {
    const a = Math.PI / 8 + k * Math.PI / 4;
    return [cx + Math.cos(a) * r * scale, cy + Math.sin(a) * r * scale];
  });
  for (const stroke of strokes) {
    const pts = stroke.map(([x, y]) => [gx(x), gy(y)]);
    // A single-point stroke is a dot (period, i, j, %): drawn larger so it reads at small sizes.
    const dot = pts.length === 1 ? 1.5 : 1;
    for (const p of pts) polys.push(octagon(p[0], p[1], dot));
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1e-6) continue;
      const nx = -(y1 - y0) / len * h, ny = (x1 - x0) / len * h;
      polys.push([[x0 + nx, y0 + ny], [x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx, y1 + ny]]);
    }
  }
  const path = new opentype.Path();
  for (let poly of polys) {
    const area = poly.reduce((s, [x, y], i) => { const [u, v] = poly[(i + 1) % poly.length]; return s + x * v - u * y; }, 0);
    if (area < 0) poly = [...poly].reverse(); // all contours counter-clockwise, so overlaps fill under non-zero
    poly.forEach(([x, y], i) => (i ? path.lineTo(Math.round(x), Math.round(y)) : path.moveTo(Math.round(x), Math.round(y))));
    path.close();
  }
  return path;
}

function build(weight, cssWeight, styleName) {
  const list = [
    new opentype.Glyph({ name: '.notdef', advanceWidth: advance, path: outline([ring(0, 0, 4, 7, 0)], weight) }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: advance, path: new opentype.Path() }),
    new opentype.Glyph({ name: 'nbspace', unicode: 160, advanceWidth: advance, path: new opentype.Path() }),
  ];
  for (const [ch, strokes] of Object.entries(glyphs)) {
    const code = ch.codePointAt(0);
    list.push(new opentype.Glyph({ name: 'uni' + code.toString(16).toUpperCase().padStart(4, '0'), unicode: code, advanceWidth: advance, path: outline(strokes, weight) }));
  }
  const font = new opentype.Font({
    familyName: 'Perihelio Mono', styleName, unitsPerEm: 1000, ascender: 960, descender: -260,
    designer: 'Órbita: La última luz', description: 'Original monospaced typeface for Órbita: La última luz.',
    license: 'SIL Open Font License 1.1', weightClass: cssWeight, glyphs: list,
  });
  const out = join(root, 'public', 'fonts', `perihelio-mono-${cssWeight}.otf`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(font.toArrayBuffer()));
  console.log(out, list.length, 'glyphs');
}

build(76, 400, 'Regular');
build(124, 700, 'Bold');
