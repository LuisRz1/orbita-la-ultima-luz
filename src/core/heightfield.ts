// Square heightfield centred on the origin. x grows east, z grows south, heights in metres.

export type Heightfield = { size: number; res: number; data: Float32Array };

export function buildHeightfield(size: number, res: number, height: (x: number, z: number) => number): Heightfield {
  const data = new Float32Array(res * res);
  const step = size / (res - 1);
  for (let j = 0; j < res; j++)
    for (let i = 0; i < res; i++) data[j * res + i] = height(-size / 2 + i * step, -size / 2 + j * step);
  return { size, res, data };
}

/** Bilinear height; positions outside the field clamp to its border. */
export function heightAt(hf: Heightfield, x: number, z: number) {
  const step = hf.size / (hf.res - 1);
  const fx = Math.min(hf.res - 1.0001, Math.max(0, (x + hf.size / 2) / step));
  const fz = Math.min(hf.res - 1.0001, Math.max(0, (z + hf.size / 2) / step));
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
  const a = hf.data[j * hf.res + i], b = hf.data[j * hf.res + i + 1];
  const c = hf.data[(j + 1) * hf.res + i], d = hf.data[(j + 1) * hf.res + i + 1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Unit surface normal as [x, y, z]. */
export function normalAt(hf: Heightfield, x: number, z: number): [number, number, number] {
  const e = hf.size / (hf.res - 1);
  const dx = (heightAt(hf, x + e, z) - heightAt(hf, x - e, z)) / (2 * e);
  const dz = (heightAt(hf, x, z + e) - heightAt(hf, x, z - e)) / (2 * e);
  const len = Math.hypot(dx, 1, dz);
  return [-dx / len, 1 / len, -dz / len];
}

/** Slope in degrees from horizontal. */
export function slopeAt(hf: Heightfield, x: number, z: number) {
  return Math.acos(normalAt(hf, x, z)[1]) * 180 / Math.PI;
}
