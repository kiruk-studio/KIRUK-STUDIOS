/**
 * The brow's move-net.
 *
 * The brow is five nodes on the curve the hairs are drawn on (bake/brow.ts):
 * head, inner, arch, outer, tail. The lid mesh already rides with the eye
 * (the open lid, pitch included, is what the skin is built on). The net does
 * not slide or scale that skin. It reshapes it: the arch node rises, the head
 * draws toward the nose, the tail drops. Every node moves its whole thickness
 * by the same amount, so the brow gets a new shape and not a thicker one.
 *
 * The hairs are sampled on the curve before this move, so they stay on the
 * nodes. A decal slid across the skin reads as a separate brow zooming.
 */

import { BROW_SHAPE } from '../bake/brow';
import type { EyeUniforms } from '../uniforms';
import type { N } from './tsl';
import { T } from './tsl';

const { Fn, clamp, exp, float, max, min, mix, pow, sin, smoothstep, vec2 } = T;

/** Head, inner, arch, outer, tail. The arch sits where the frontalis peaks. */
const BROW_NODES = [0, 0.22, 0.42, 0.7, 1] as const;

const layout = (name: string, type: string, inputs: [string, string][]) => ({
  name,
  type,
  inputs: inputs.map(([n, t]) => ({ name: n, type: t })),
});

/** Lower edge of the curve at u (0 head … 1 tail), mm. Matches bake/brow.ts. */
function browLower(u: N): N {
  const S = BROW_SHAPE;
  const t = min(u.div(S.riseEnd), float(1));
  const rise = float(S.rise).mul(sin(t.mul(Math.PI / 2)));
  const f = clamp(u.sub(S.riseEnd).div(1 - S.riseEnd), 0, 1);
  // pow(0, 1.5) is NaN on some GPUs; the curve is 0 there anyway
  return float(S.lower0)
    .add(rise)
    .sub(float(S.fall).mul(pow(max(f, float(1e-4)), S.fallPow)));
}

/** How deep the brow is at u, mm. */
function browDepth(u: N): N {
  const S = BROW_SHAPE;
  const head = mix(float(S.depth0), float(S.depth1), smoothstep(0, S.depthAt, u));
  const tail = mix(float(S.tail0), float(S.tail1), smoothstep(S.tailAt0, S.tailAt1, u));
  return head.mul(tail);
}

/**
 * One node's move, mm, the same for the whole thickness at that station.
 * Frontalis only at the arch, corrugator at the head, orbicularis toward the tail.
 */
function nodeMove(nu: number, brow: N, frown: N, squint: N, blink: N): N {
  const arch = exp(
    float(nu - 0.38)
      .div(0.26)
      .mul(float(nu - 0.38).div(0.26))
      .negate(),
  );
  const head = float(1).sub(smoothstep(0, 0.45, float(nu)));
  const tail = smoothstep(0.62, 1, float(nu));
  const orbi = squint
    .mul(0.5)
    .add(blink.mul(0.25))
    .mul(float(0.4 + 0.6 * nu));
  const dy = brow
    .mul(arch)
    .mul(float(1).sub(tail.mul(0.65)))
    .sub(orbi)
    .sub(frown.mul(head).mul(0.9));
  const dx = frown.mul(head).negate();
  return vec2(dx, dy);
}

/**
 * How far the skin at `xy` (face mm, before the net) moves, mm.
 * One WGSL function: the vertex stage calls it for the point and its normal.
 */
const browMoveNetFn = Fn(([xy, brow, frown, squint, blink]: N[]) => {
  const S = BROW_SHAPE;
  const x = xy.x;
  const y = xy.y;
  const u = clamp(x.sub(S.x0).div(S.span), 0, 1);
  const lower = browLower(u);
  const top = lower.add(browDepth(u));
  // the whole hair design, then a short ease into the lid below and the forehead above
  const band = smoothstep(-3.6, -0.5, y.sub(lower)).mul(
    float(1).sub(smoothstep(0.8, 3.2, y.sub(top))),
  );
  const ends = smoothstep(-3.2, -0.4, x.sub(S.x0)).mul(
    float(1).sub(smoothstep(0.5, 4.2, x.sub(S.x0 + S.span))),
  );
  const mask = band.mul(ends);

  const acc = vec2(0, 0).toVar();
  const wsum = float(0).toVar();
  for (const nu of BROW_NODES) {
    const du = u.sub(nu);
    const w = exp(max(du.div(0.22).mul(du.div(0.22)).negate(), float(-16)));
    acc.addAssign(nodeMove(nu, brow, frown, squint, blink).mul(w));
    wsum.addAssign(w);
  }
  return acc.div(max(wsum, float(1e-3))).mul(mask);
}).setLayout(
  layout('browMoveNet', 'vec2', [
    ['xy', 'vec2'],
    ['brow', 'float'],
    ['frown', 'float'],
    ['squint', 'float'],
    ['blink', 'float'],
  ]),
);

/** The move-net at face point `xy`, mm. Zero outside the brow. */
export function browMoveNet(xy: N, Ux: EyeUniforms): N {
  const U: N = Ux;
  const L = U.lids;
  return browMoveNetFn(xy, L.brow, L.frown, L.squint, U.blink);
}
