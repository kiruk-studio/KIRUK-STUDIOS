/**
 * Gradient noise, seeded and deterministic. Used for the slow drift of a hand, the
 * irregular edge of a stroke, the formation of a sheet, and the fibres that carry ink.
 * Output of noise1 / noise2 is in about [−1, 1]; fbm normalises to the same range.
 */
import { hash3 } from './rng.ts';

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** 1D gradient noise. */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const g0 = hash3(i, 0, seed) * 2 - 1;
  const g1 = hash3(i + 1, 0, seed) * 2 - 1;
  const a = g0 * f;
  const b = g1 * (f - 1);
  return (a + (b - a) * fade(f)) * 2;
}

function grad(ix: number, iy: number, seed: number, dx: number, dy: number) {
  const ang = hash3(ix, iy, seed) * Math.PI * 2;
  return Math.cos(ang) * dx + Math.sin(ang) * dy;
}

/** 2D gradient (Perlin-style) noise. */
export function noise2(x: number, y: number, seed = 0): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fade(fx);
  const v = fade(fy);
  const n00 = grad(ix, iy, seed, fx, fy);
  const n10 = grad(ix + 1, iy, seed, fx - 1, fy);
  const n01 = grad(ix, iy + 1, seed, fx, fy - 1);
  const n11 = grad(ix + 1, iy + 1, seed, fx - 1, fy - 1);
  const nx0 = n00 + (n10 - n00) * u;
  const nx1 = n01 + (n11 - n01) * u;
  return (nx0 + (nx1 - nx0) * v) * Math.SQRT2;
}

/** Fractal sum of noise2: `octaves` layers, each `lacunarity` finer and `gain` weaker. */
export function fbm2(
  x: number,
  y: number,
  seed = 0,
  octaves = 4,
  lacunarity = 2.03,
  gain = 0.5,
): number {
  let s = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let o = 0; o < octaves; o++) {
    s += amp * noise2(fx, fy, seed + o * 131);
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
  }
  return s / norm;
}

/** Fractal sum of noise1. */
export function fbm1(x: number, seed = 0, octaves = 3, lacunarity = 2.1, gain = 0.5): number {
  let s = 0;
  let amp = 1;
  let norm = 0;
  let f = x;
  for (let o = 0; o < octaves; o++) {
    s += amp * noise1(f, seed + o * 977);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return s / norm;
}

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
