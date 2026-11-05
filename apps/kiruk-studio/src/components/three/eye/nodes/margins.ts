/**
 * The lid margins, in 3D: angles around the globe's centre, in face space (the
 * lids belong to the face, not to the turning eye).
 *
 * Every point of the eye region is an azimuth φ (0 straight ahead, medial
 * negative, lateral positive) and an elevation θ. The upper and lower margins
 * are curves θ(φ) between the two corners. The lid mesh is built on them, and
 * the shadow the lids lay on the white and the iris is measured from them, so
 * the shadow can never drift off the lid that casts it.
 *
 * What moves the margins, per frame (all uniforms):
 *  · blink — the upper lid sweeps down onto the lower, which rises a little;
 *  · gaze — the upper lid follows the eye's pitch closely, the lower lid a
 *    little; the apex drifts toward where the cornea is (lid–gaze coupling);
 *  · squint — a bright screen narrows both lids;
 *  · the person — aperture, canthal tilt, an epicanthic fold.
 */

import { ANATOMY } from '../anatomy';
import type { EyeUniforms } from '../uniforms';
import { type N, smoothstepDown, vnoise } from './common';
import { T } from './tsl';

const {
  abs,
  asin,
  atan,
  clamp,
  cos,
  exp,
  float,
  length,
  max,
  min,
  mix,
  pow,
  select,
  sin,
  smoothstep,
  sqrt,
  vec2,
} = T;

/** The margin's front edge stands this far off the globe: the lid's thickness. */
export const LID_THICKNESS = 1.1;
export const MARGIN_RADIUS = ANATOMY.eyeballRadius + LID_THICKNESS;

/**
 * The fissure, as the margin's front edge projects onto the shot (mm): medial
 * and lateral half-width, then the upper margin and the lower one. Taken from
 * the reference close-up (docs/EYE_TSL_PLAN.md, "Benchmark plan"): about
 * 26 × 9.9, the upper lid over the iris's top ~1.6 mm (radius 6), the lower
 * one at its foot. Converted to angles on the margin's sphere by
 * `fissureAngles`.
 */
export const FISSURE_MM = { medial: 14, lateral: 11.8, upper: 4.4, lower: 5.5 } as const;

export function fissureAngles(aperture = 1) {
  const r = MARGIN_RADIUS;
  const a = (mm: number) => Math.asin(Math.min(0.99, mm / r));
  return {
    phiM: -a(FISSURE_MM.medial),
    phiL: a(FISSURE_MM.lateral),
    upper: a(FISSURE_MM.upper * aperture),
    lower: a(FISSURE_MM.lower * aperture),
  };
}

/** Where a point is, as seen from the globe's centre. */
export function faceAngles(P: N) {
  return { phi: atan(P.x, P.z), theta: asin(clamp(P.y.div(max(length(P), 1e-4)), -1, 1)) };
}

/** -1 at the medial corner, 0 at the apex, +1 at the lateral corner (beyond, |s| > 1). */
export function sideOf(phi: N, Ux: EyeUniforms): N {
  const L: N = Ux.lids;
  return select(
    phi.lessThan(L.peak),
    phi.sub(L.peak).div(L.peak.sub(L.phiM)),
    phi.sub(L.peak).div(L.phiL.sub(L.peak)),
  );
}

/** The azimuth at a side position s (inverse of sideOf). */
export function azimuthOf(s: N, Ux: EyeUniforms): N {
  const L: N = Ux.lids;
  return select(
    s.lessThan(0),
    L.peak.add(s.mul(L.peak.sub(L.phiM))),
    L.peak.add(s.mul(L.phiL.sub(L.peak))),
  );
}

/** The tear lake's rounding (marginsAt): 1 until the lake, falling to 0 at the corner like a circle. */
function cap0(a: N): N {
  const t = clamp(a.sub(0.92).div(0.08), 0, 1);
  return sqrt(max(float(1).sub(t.mul(t)), 0));
}
function lake0(a: N, inner: N): N {
  return select(inner, smoothstep(0.87, 0.92, a), float(0));
}

/**
 * The margins' elevation at side position s: open (no blink: the lid's resting
 * line, which the far skin is anchored to) and now.
 */
export function marginsAt(s: N, Ux: EyeUniforms) {
  const U: N = Ux;
  const L = U.lids;
  const inner = s.lessThan(0);
  // The shape is drawn as the eye is seen, across the image. s runs evenly in
  // azimuth, which crowds into the corners as the globe turns away from us
  // (the inner corner's last fifth of s spans about a millimetre), so arcs
  // bowed in s close bluntly there, in a rounded end that reads as a boot.
  // Bowed in the projected x instead, the outer corner tapers to a point and
  // the inner one rounds off round the tear lake (below).
  const sp = sin(L.peak);
  const sx = sin(azimuthOf(s, Ux)).sub(sp);
  const xs = select(inner, sx.div(sp.sub(sin(L.phiM))), sx.div(sin(L.phiL).sub(sp))).toVar();
  const a = clamp(abs(xs), 0, 1);
  // An almond: two near-symmetric arcs that meet in pointed corners. Only a
  // hint of a real eye's asymmetry (strong asymmetry read as a boot once the
  // eye filled the frame): the upper lid's highest point a little toward the
  // nose, the lower lid's lowest a little toward the temple.
  const bowU0 = float(1).sub(pow(a, select(inner, float(2.6), float(2.2))));
  const sl = xs.sub(0.07);
  const bowU = mix(bowU0, cap0(a).mul(1 - 0.92 ** 2.6), lake0(a, inner));
  const innerL = sl.lessThan(0);
  const al = clamp(select(innerL, sl.negate().div(1.07), sl.div(0.93)), 0, 1);
  const bowL0 = float(1).sub(pow(al, select(innerL, float(2), float(2.3))));
  // The inner corner is not a point like the outer one: the lids part round
  // the tear lake (lacus lacrimalis) that holds the caruncle, so the last
  // millimetre or so closes in a rounded end about 2 mm tall. (Each lid holds
  // the height it had where the lake begins, then rounds off to the corner.)
  const bowL = mix(bowL0, cap0(a).mul(1 - (0.99 / 1.07) ** 2), lake0(a, inner));
  // the outer corner lifts by the canthal tilt; the inner corner sits a
  // little lower than the middle, where the caruncle and the tear duct are
  const lift = L.tilt.mul(pow(clamp(xs, 0, 1), 2)).sub(smoothstep(0.3, 1, xs.negate()).mul(0.075));
  // An epicanthic fold draws the upper lid down toward the inner corner; it
  // lets go at the corner itself, where both margins have to meet.
  const fold = L.epicanthus
    .mul(0.035)
    .mul(smoothstep(0.4, 0.9, s.negate()))
    .mul(float(1).sub(pow(a, 6)));
  // No lid is a drawn curve: a little unevenness along each margin, different
  // on the two lids, so the almond is not a perfect one
  const unevenU = sin(xs.mul(4.1).add(0.6))
    .mul(0.018)
    .add(sin(xs.mul(9.3).add(2.2)).mul(0.007));
  const unevenL = sin(xs.mul(5.7).add(1.1))
    .mul(0.012)
    .add(sin(xs.mul(11.1).add(0.3)).mul(0.005));
  const upOpen = L.upper
    .mul(bowU)
    .add(unevenU.mul(bowU))
    .mul(float(1).sub(L.squint.mul(0.25)))
    .add(L.pitch.mul(select(L.pitch.lessThan(0), float(0.7), float(0.85))).mul(bowU))
    .add(lift)
    .sub(fold);
  const loOpen = L.lower
    .mul(bowL)
    .mul(float(1).sub(L.squint.mul(0.2)))
    .negate()
    .add(unevenL.mul(bowL))
    .add(L.pitch.mul(0.35).mul(bowL))
    .add(lift)
    .toVar();
  // the margins never cross, whatever folds or gazes ask
  const upOpenSafe = max(upOpen, loOpen.add(0.004)).toVar();
  // the blink: the upper lid comes down to the lower, which rises to meet it
  const lo = loOpen.add(U.blink.mul(0.12).mul(L.lower).mul(bowL)).toVar();
  const up = max(mix(upOpenSafe, lo.add(0.012), U.blink), lo.add(0.004)).toVar();
  return { upOpen: upOpenSafe, loOpen, up, lo };
}

/**
 * How much of the screen's light the upper lashes take from a point of the
 * globe or cornea, 0..1, given where the point is (side s, elevation θ) and
 * where the upper margin is above it. A lash is a tenth of a millimetre wide,
 * so this is a projected density, not a shadow map. A strand leaves the
 * margin heading at the camera and curls up: h mm in front of the lid it
 * stands about k·h²/2 above the margin (k its curl per mm). Look from the
 * point toward the screen at three such heights and ask how much fringe is
 * there; the margin there is the one above the point, stepped along its
 * slope (one lookup, not three). The fringe gathers into clumps and thins
 * out at the corners, as the lashes do.
 */
export function lashShade(s: N, theta: N, up: N, Ux: EyeUniforms): N {
  const U: N = Ux;
  const LS = U.lashes;
  const L = U.lids;
  const rM = MARGIN_RADIUS;
  const slopeS = marginsAt(s.add(0.04), Ux).up.sub(up).div(0.04).toVar();
  const span = select(s.lessThan(0), L.peak.sub(L.phiM), L.phiL.sub(L.peak));
  const perS = float(1)
    .div(max(cos(theta), 0.3).mul(rM).mul(span))
    .toVar();
  const len = max(LS.length, 0.3).mul(10).toVar();
  const k = LS.curl.mul(0.9).add(0.45).div(len);
  const toLight = U.light.dir.xy.div(max(U.light.dir.z, 0.25)).toVar();
  let sum: N = float(0);
  for (const f of [0.25, 0.45, 0.65]) {
    const h = len.mul(f);
    const off = toLight.mul(h);
    const dS = off.x.mul(perS);
    const sQ = s.add(dS);
    const above = theta
      .add(off.y.div(rM))
      .sub(up.add(slopeS.mul(dS)))
      .mul(rM);
    const at = k.mul(h).mul(h).mul(0.5);
    const spread = h.mul(0.12).add(0.35);
    const z = above.sub(at).div(spread);
    const fringe = exp(z.mul(z).negate());
    const along = smoothstep(-0.85, -0.5, sQ).mul(smoothstepDown(0.98, 0.85, sQ));
    const strands = vnoise(vec2(sQ.mul(38), f * 7));
    sum = sum.add(fringe.mul(along).mul(mix(float(0.3), float(1.2), strands)));
  }
  return clamp(sum.div(3).mul(LS.upper).mul(LS.mascara.mul(0.4).add(1.1)), 0, 0.75);
}

/**
 * How much of the screen's light the lids leave on the eye at a point of the
 * globe or cornea (face-space position): the upper lid shades a third of what
 * it rests on, the lash line darkens a band right under it, the lashes lay
 * their fringe's shadow below that, the lower lid shades a little, the
 * corners are pockets. Also how near the point is to a margin, for the
 * white's reddening.
 */
export function socketShade3d(P: N, Ux: EyeUniforms) {
  const { phi, theta } = faceAngles(P);
  const s = sideOf(phi, Ux).toVar();
  const m = marginsAt(s, Ux);
  const R = ANATOMY.eyeballRadius;
  // Seen from the front the white shows right up to each margin's front edge
  // (lid-mesh.ts turns the inner faces nearly along the view), so measure
  // from where that edge falls on the globe: the margins stand a little
  // proud of it, by the share of the inner face that still shows.
  const upF = asin(clamp(sin(m.up).mul(1.078), -1, 1)).toVar();
  const loF = asin(clamp(sin(m.lo).mul(1.05), -1, 1)).toVar();
  const underUpper = max(upF.sub(theta), 0).mul(R); // mm
  const aboveLower = max(theta.sub(loF), 0).mul(R);
  const shade = float(1)
    .sub(smoothstepDown(5.6, 0, underUpper).mul(0.66))
    .mul(float(1).sub(smoothstepDown(0.8, 0, underUpper).mul(0.5)))
    .mul(float(1).sub(smoothstepDown(2.5, 0, aboveLower).mul(0.26)))
    .mul(float(1).sub(smoothstepDown(0.9, 0, aboveLower).mul(0.3)))
    .toVar();
  const canthus = smoothstepDown(0.34, 0.02, float(1).sub(abs(s)));
  // (a pocket in shadow, not a hole: the corners stay flesh, never black)
  shade.mulAssign(float(1).sub(canthus.mul(canthus).mul(0.28)));
  shade.mulAssign(float(1).sub(lashShade(s, theta, upF, Ux)));
  const fromMargin = min(underUpper, aboveLower);
  const toRim = smoothstepDown(3.4, 0, fromMargin);
  return { shade, toRim, s };
}
