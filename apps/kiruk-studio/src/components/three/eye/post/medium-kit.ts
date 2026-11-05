/**
 * What every era's medium (post/era-medium.ts) is built from: the frame's
 * scale and the eye's place in it, the masks of the lid opening and the
 * cornea, the tone curve that keeps the reflected page legible once a medium
 * quantises it, ordered dither and a hash.
 *
 * Sizes are given in pixels at the 1440×900 reference and scaled by the iris
 * on screen (`kc`), never in device pixels: the stage's watchdog changes the
 * pixel ratio, and a pattern pinned to device pixels would turn to moiré.
 * Everything here is arithmetic on values built once, before the era's
 * branch, so a helper may be called inside any branch.
 */

import { type N, T } from '../nodes/tsl';

const {
  clamp,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  pow,
  select,
  smoothstep,
  sin,
  vec2,
  vec3,
} = T;

export const LUMA = vec3(0.2126, 0.7152, 0.0722);
/** Linear to display (≈ sRGB) and back. */
export const disp = (c: N) => pow(max(c, 0), vec3(1 / 2.2));
export const lin = (d: N) => pow(max(d, 0), vec3(2.2));
export const luma = (d: N) => dot(d, LUMA);
/** A display-referred colour from a hex string. */
export function hex(h: string): N {
  const n = parseInt(h.slice(1), 16);
  return vec3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Ordered dither thresholds in 0..1 (the recursive Bayer matrix). */
export const bayer2 = (a: N) => {
  const f = floor(a);
  return fract(dot(f, vec2(0.5, f.y.mul(0.75))));
};
export const bayer4 = (a: N) => bayer2(a.mul(0.5)).mul(0.25).add(bayer2(a));
export const bayer8 = (a: N) => bayer4(a.mul(0.5)).mul(0.25).add(bayer2(a));

/** A hash in 0..1 with no sin() in it (Hoskins' hash12), steady at pixel coordinates in the thousands. */
export function hash(q: N): N {
  const p3 = fract(vec3(q.x, q.y, q.x).mul(0.1031)).toVar();
  p3.addAssign(dot(p3, vec3(p3.y, p3.z, p3.x).add(33.33)));
  return fract(p3.x.add(p3.y).mul(p3.z));
}

export const easeInQuad = (t: N) => t.mul(t);
export const easeInCubic = (t: N) => t.mul(t).mul(t);
export const easeOutCubic = (t: N) => float(1).sub(pow(float(1).sub(t), 3));
export const easeInOutSine = (t: N) =>
  float(0.5).sub(sin(t.mul(Math.PI).add(Math.PI / 2)).mul(0.5));

/**
 * The frame as the medium sees it, all in device pixels: the pixel `p`, the
 * frame's `size` and height `H`, the scale `kc` (1 at the reference), the
 * globe's centre `e`, the iris's centre `pc` and radius `R`, the pupil's
 * radius `pupilR`, and the lid opening's reach from `e` (`apX`: medial,
 * lateral; `apY`: upper, lower; shares of the height).
 */
export interface MediumFrame {
  p: N;
  size: N;
  H: N;
  kc: N;
  e: N;
  pc: N;
  R: N;
  pupilR: N;
  apX: N;
  apY: N;
}

/** n reference pixels, at least two device pixels (strokes and offsets). */
export const px = (F: MediumFrame, n: number) => max(F.kc.mul(n), 2);
/**
 * n reference pixels rounded to whole device pixels, at least `min`: the
 * pitch of a dither or a grid, so every cell is the same width (a fractional
 * pitch beats against the pixels in seams).
 */
export const cellPx = (F: MediumFrame, n: number, min = 2) => max(floor(F.kc.mul(n).add(0.5)), min);
/** n reference pixels, at least one device pixel (hairlines). */
export const hair = (F: MediumFrame, n: number) => max(F.kc.mul(n), 1);

/**
 * 1 inside the lid opening (scaled by k round the globe's centre), soft at
 * its edge. The medial corner is on the left of the frame, as the stage
 * draws this eye. The margins are signed offsets from the globe's centre
 * (`apY.x` up, `apY.y` down, as the lids stand this frame), so when a blink
 * brings the upper margin down to the lower one the opening closes to
 * nothing.
 */
export function almond(F: MediumFrame, p: N, k = 1): N {
  const d = p.sub(F.e);
  const aw = select(d.x.lessThan(0), F.apX.x, F.apX.y).mul(F.H).mul(k);
  const sx = pow(max(float(1).sub(d.x.div(aw).mul(d.x.div(aw))), 0), 0.75);
  const top = F.apY.x.mul(F.H).mul(k).mul(sx).negate();
  const bot = F.apY.y.mul(F.H).mul(k).mul(sx);
  const open = min(d.y.sub(top), bot.sub(d.y));
  const soft = max(F.apY.x.add(F.apY.y).mul(F.H).mul(k).mul(0.05), 1);
  // (past the corners both margins meet at zero: closed, not half open)
  return smoothstep(soft.negate(), soft, open).mul(smoothstep(0, 0.04, sx));
}

/** 1 over the cornea (the iris's disc, inside the opening). */
export function cornea(F: MediumFrame, p: N): N {
  const r = length(p.sub(F.pc));
  return float(1)
    .sub(smoothstep(F.R.mul(0.92), F.R.mul(1.04), r))
    .mul(almond(F, p));
}

/** A soft shoulder, x(1 + x/4)/(1 + x): pushes a dark face up without clipping its highlights. */
const shoulder = (x: N) => x.mul(x.mul(0.25).add(1)).div(x.add(1));

/**
 * The developed luminance a quantising medium works from. The face is pushed
 * up by `E` (a dark face on a dark ground would otherwise dither to nothing);
 * over the cornea (`c`) the bright reflected page is pulled into the middle
 * greys, 0.12..0.9, so its layout survives a 1-bit or 4-grey screen instead
 * of blowing out to a white disc.
 */
export function develop(l: N, E: number, Ec: number, c: N, lo = 0.12, hi = 0.9): N {
  const face = shoulder(l.mul(E));
  const page = shoulder(l.mul(Ec))
    .div(shoulder(float(Ec)))
    .mul(hi - lo)
    .add(lo);
  return clamp(mix(face, page, c), 0, 1);
}

/**
 * A fade (0..1) through the era's own ordered dither, so a sign appearing in
 * a 1-bit or 4-grey medium dissolves cell by cell instead of leaving the
 * palette. 0 is fully off.
 */
export const dissolve = (m: N, ci: N, levels = 4) =>
  T.step((levels === 8 ? bayer8(ci) : bayer4(ci)).add(levels === 8 ? 1 / 128 : 1 / 32), m);

/** Local contrast: L pushed away from its neighbourhood's mean m by g (a number or a node). */
export const lc = (L: N, m: N, g: N | number) => L.add(L.sub(m).mul(g));
