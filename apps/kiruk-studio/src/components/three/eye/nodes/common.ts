/**
 * Small TSL helpers shared by the eye's layers, ported from the live GLSL.
 *
 * Plain functions that build graph, not Fn: they inline where they are used,
 * which keeps their types honest and costs nothing the GPU would notice at
 * these sizes.
 */

import { type N, T } from './tsl';

export type { N };

const { abs, dot, float, fract, floor, length, max, min, mix, select, smoothstep, vec2 } = T;

/**
 * smoothstep with its edges reversed (fading out as x grows). GLSL tolerates
 * smoothstep(0.8, 0.2, x); WGSL refuses low >= high when the edges are
 * constants, at shader creation. This is the same curve, said the legal way.
 */
export function smoothstepDown(from: number, to: number, x: N): N {
  return float(1).sub(smoothstep(to, from, x));
}

export function hash21(p: N): N {
  const a = fract(p.mul(vec2(123.34, 456.21))).toVar();
  a.addAssign(vec2(dot(a, a.add(45.32))));
  return fract(a.x.mul(a.y));
}

/** Coverage of a rounded box: 1 inside, 0 outside, anti-aliased over `aa`. */
export function rbox(p: N, c: N, h: N, r: N | number, aa: N | number): N {
  const q = abs(p.sub(c)).sub(h).add(r);
  const d = min(max(q.x, q.y), 0)
    .add(length(max(q, vec2(0))))
    .sub(r);
  return float(1).sub(smoothstep(float(aa).negate(), aa, d));
}

/** 1 inside the unit panel, 0 outside, with a soft edge. */
export function inPanel(uv: N, soft: N | number): N {
  const d = abs(uv.sub(0.5));
  const e = float(0.5).sub(soft);
  return float(1)
    .sub(smoothstep(e, 0.5, d.x))
    .mul(float(1).sub(smoothstep(e, 0.5, d.y)));
}

/** Radial lens scale. Positive bulges, negative pinches. */
export function lensScale(distortion: N, r2: N): N {
  return select(
    distortion.greaterThanEqual(0),
    distortion.mul(r2).add(1),
    float(1).div(float(1).sub(distortion.mul(r2))),
  );
}

/** Value noise on the hash above. */
export function vnoise(p: N): N {
  const i = floor(p).toVar();
  const f = fract(p);
  const u = f.mul(f).mul(f.mul(-2).add(3)).toVar();
  const a = hash21(i);
  const b = hash21(i.add(vec2(1, 0)));
  const c = hash21(i.add(vec2(0, 1)));
  const d = hash21(i.add(vec2(1, 1)));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/**
 * Three octaves, as the live eye uses: the last two of five were worth a few
 * percent of contrast and a third of the cost.
 */
export function fbm(p: N): N {
  let s: N = float(0);
  let q: N = p;
  let a = 0.5;
  for (let k = 0; k < 3; k++) {
    s = s.add(vnoise(q).mul(a));
    q = q.mul(2.03);
    a *= 0.5;
  }
  return s;
}

export function bayer2(a: N): N {
  const f = floor(a);
  return fract(f.x.div(2).add(f.y.mul(f.y).mul(0.75)));
}

export function bayer4(a: N): N {
  return bayer2(a.mul(0.5)).mul(0.25).add(bayer2(a));
}
