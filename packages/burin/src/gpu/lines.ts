/**
 * Burin primitives on the GPU (TSL, so one source compiles to WGSL and GLSL).
 *
 * An engraving is lines whose *width* carries the tone. Each line set is a phase
 * field φ whose integer level sets are the line centres; the shader measures how
 * far a pixel is from the nearest centre, in CSS pixels, and lets the line swell
 * with the tone. Light tones break the line into dashes, then dots ("dot and
 * flick"), the way an engraver lightens a passage without changing tools.
 *
 * Antialiasing is analytic: every field passes its own gradient g (phase per CSS
 * px), so no derivatives are taken — samples stay legal inside branches and
 * seams (atan, region edges) never blur.
 */
import {
  abs,
  clamp,
  Fn,
  float,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  pow,
  sin,
  smoothstep,
  sqrt,
  step,
  vec2,
} from 'three/tsl';

// TSL nodes: @types/three is stricter than the runtime; the graph is checked by the shader compiler.
// eslint-disable-next-line
type N = any;

/** Cheap 1D hash for per-line and per-cell jitter (inputs stay small). */
export const hash1 = Fn(([x]: [N]) => fract(sin(x.mul(91.3458)).mul(47453.5453)));
export const hash2 = Fn(([p]: [N]) =>
  fract(sin(p.x.mul(127.1).add(p.y.mul(311.7))).mul(43758.5453)),
);

/**
 * Engraved lines.
 *   phi   phase; line centres at integers
 *   g     |∇φ| in phase units per CSS px (so 1/g is the pitch in px)
 *   tone  0 paper … 1 solid
 *   psi   along-line coordinate, in dash lengths
 *   aa    antialias half-width, CSS px (≈ 0.6 / dpr)
 */
export const engrave = Fn(([phi, g, tone, psi, aa]: [N, N, N, N, N]) => {
  const idx = floor(phi.add(0.5));
  const gg = max(g, 1e-4);
  const dPx = abs(phi.sub(idx)).div(gg);
  const pitch = float(1).div(gg);
  const t = clamp(tone, 0, 1);
  // Each cut is its own: a little heavier or lighter, with a faint burr along its length.
  const jitter = hash1(idx).mul(0.3).add(0.85);
  const burr = hash1(idx.mul(7.13).add(floor(psi.mul(2.7))))
    .sub(0.5)
    .mul(0.14)
    .add(1);
  const full = mix(float(0.2), pitch.mul(0.52), pow(t, 1.12)).mul(jitter).mul(burr);
  // Dot and flick: below ~0.3 the line is cut as lozenges — each swells as the burin bites
  // and tapers as it leaves — and their length follows the tone, down to dots.
  const duty = clamp(t.div(0.3), 0.07, 1);
  const dp = fract(psi.add(hash1(idx.add(17.31))));
  const along = clamp(dp.div(duty), 0, 1);
  const lozenge = pow(sin(along.mul(Math.PI)), 0.55).mul(1.25);
  const light = smoothstep(0.24, 0.32, t);
  const hw = full.mul(mix(lozenge, float(1), light));
  const dash = float(1).sub(smoothstep(duty.sub(0.03), duty.add(0.03), dp));
  const cov = float(1).sub(smoothstep(hw.sub(aa), hw.add(aa), dPx));
  return cov.mul(mix(dash, float(1), light)).mul(step(0.012, t));
});

/**
 * Dot and lozenge: in a cross-hatched passage the engraver set a dot in each diamond
 * between the two families, so the tone deepens without a third set of lines.
 */
export const between = Fn(([phiA, gA, phiB, gB, tone, aa]: [N, N, N, N, N, N]) => {
  const ax = fract(phiA).sub(0.5).div(max(gA, 1e-4));
  const by = fract(phiB).sub(0.5).div(max(gB, 1e-4));
  const cell = min(float(1).div(max(gA, 1e-4)), float(1).div(max(gB, 1e-4)));
  const rr = sqrt(clamp(tone, 0, 1))
    .mul(cell)
    .mul(0.24);
  return float(1)
    .sub(smoothstep(rr.sub(aa), rr.add(aa), length(vec2(ax, by))))
    .mul(step(0.06, tone));
});

/** A drawn contour: a line of half-width hw (px) at signed distance dPx. */
export const contour = Fn(([dPx, hw, aa]: [N, N, N]) =>
  float(1).sub(smoothstep(hw.sub(aa), hw.add(aa), abs(dPx))),
);

/** Stipple: a jittered dot grid; the dot's area follows the tone. */
export const stipple = Fn(([pPx, cell, tone, aa]: [N, N, N, N]) => {
  const q = pPx.div(cell);
  const c = floor(q);
  const j = vec2(hash2(c), hash2(c.add(vec2(7.1, 3.3))))
    .sub(0.5)
    .mul(0.55);
  const local = fract(q).sub(0.5).sub(j);
  const r = sqrt(clamp(tone, 0, 1))
    .mul(cell)
    .mul(0.42);
  return float(1)
    .sub(smoothstep(r.sub(aa), r.add(aa), length(local).mul(cell)))
    .mul(step(0.02, tone));
});

/** Union of coverages, the way two passes of the burin overlap. */
export const over = (a: N, b: N) => max(a, b);
export const under = (a: N, b: N) => min(a, b);
