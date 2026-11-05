/**
 * The engraved eye as strokes — the third writing of the same eye.
 *
 * rig.ts holds the eye in numbers; shader.ts cuts it as line fields on the GPU;
 * this file lays it as a list of strokes in the order a hand makes them, so a pen
 * can draw it at a pace (the pen's vocabulary is hand/pen.ts):
 *
 *   I    construction, in chalk: the axis, the corners, the globe swung by compass
 *        with its parallels and meridians, the iris, the lids, the crease, the brow,
 *        the orbit (the plate's own ① – ⑧)
 *   II   contour: the lash line, the lower lid, the crease, the limbus, the pupil
 *   III  hatching, each family following its form: the upper lid's band, the lower
 *        lid's pillow, the socket's rings, arcs on the white, fibres in the iris
 *   IV   cross-hatching where the form turns from the light, the face's shade on the
 *        white, then the detail: the iris's limbal ring, collarette and crypts, veins,
 *        the caruncle, lashes and brow as flicked hairs
 *   V    the plate: the pupil inked round the kiruk star, and the cornea's window
 *
 * Light. One light from the upper left, as on the plate. The socket round the eye
 * is a height field (a bowl rising from the lids to its rim, the brow ridge, the
 * nose's wall, the cheekbone), and the tone of every ring follows its slope, held
 * to a mid tone, so the shadows fall where the form puts them: under the brow,
 * down the nose's wall, in the crescent under the eye. Black is never one family
 * flooded but two crossed. The whites are left as paper.
 *
 * The socket. Following the anatomical plates, the skin round the eye is one
 * family of rings, nested between the loop where the lids fold into the socket
 * (the crease above, the lower lid's fold below) and the rim of the orbit, and
 * fading past it to a ragged edge, spent before ±1.72 across and 1.56 above (the
 * loader's frame is ±1.78, -1.62 … 1.22). Spiral families cross them only in the
 * shade.
 *
 * Layers say how each stroke lives once the eye is drawn:
 *   cons  the chalk underdrawing, faded under the ink
 *   skin  everything that never moves (brow, socket, crease, lower lid)
 *   ball  the globe: white and iris, moved by the gaze, clipped by the lids and
 *         cut at the plica
 *   lid   the upper lid, and what the face lays over the globe: the shade on the
 *         white, the caruncle and the plica; redrawn as it blinks
 *
 * Units: CSS px from the eye's centre (x right, y down). S is CSS px per eye unit.
 * Pure TypeScript, no DOM: it runs in a worker.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md · ideas/studio-dawn/ink-strokes.md
 */
import {
  byAngle,
  byParam,
  byX,
  chalkWidth,
  clamp,
  cutWidth,
  fract,
  HAIRLINE,
  Hand,
  hairWidth,
  hash1,
  hash2,
  type LayOpts,
  type Meta,
  mix,
  type Pen,
  parseAbsPath,
  type Stroke,
  type StrokeLayer,
  smooth,
  TAU,
  vnoise,
} from '../../hand/pen';
import { LOGOGRAM_FILLS, LOGOGRAM_NEEDLES, LOGOGRAM_VIEW } from '../../logogram';
import { brow, crease, EYE, GLOBE, lowerLid, type Pose, REST, upperLid } from './rig';

export type { Pen, Stroke, StrokeInk, StrokeLayer } from '../../hand/pen';
export { parseAbsPath } from '../../hand/pen';

export interface EyeDrawing {
  strokes: Stroke[];
  S: number;
  pitch: number;
  pose: Pose;
  /** The lids' opening as a closed outline, px: the upper lid out, the lower lid back. */
  opening: Float32Array;
  /** The opening the white shows through: off the tear meniscus, and cut at the plica. */
  window: Float32Array;
  /** The pupil's outline and the iris's, px (clips for the star and the cornea's window). */
  pupil: Float32Array;
  iris: Float32Array;
  /** When the hand lifts the pen for the last time, s at speed 1. */
  end: number;
}

// ── light ───────────────────────────────────────────────────────────────────

/** The shader's n0 channels, in eye units: r the lines' wobble, g patina. */
const n0r = (x: number, y: number) => vnoise(x * 2.3 + 7.1, y * 2.3 + 3.7, 11);
const n0g = (x: number, y: number) => vnoise(x * 5.1 + 1.3, y * 5.1 + 9.2, 23);

/** The plate's resting light: from the upper left, 37° above the sheet (EyeEngine's default). */
const SUN = (() => {
  const az = -2.36;
  const el = 0.64;
  return [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)] as const;
})();
const LZ = Math.max(SUN[2], 0.25);
const LXY = Math.hypot(SUN[0], SUN[1]) || 1;
/** Tone change of a surface tilted to (nx, ny), against the flat sheet: < 0 lit, > 0 in shade. */
const shade = (nx: number, ny: number) =>
  SUN[2] - (nx * SUN[0] + ny * SUN[1] + SUN[2]) / Math.hypot(nx, ny, 1);
const gauss = (dx: number, dy: number, sx: number, sy: number) =>
  Math.exp(-(dx * dx) / sx - (dy * dy) / sy);

// ── the eye's curves for a pose, as lookup tables (rig.ts is the truth) ─────

const LUT_X0 = -2.2;
const LUT_N = 2201;
const LUT_DX = 4.4 / (LUT_N - 1);

function lut(f: (x: number) => number) {
  const t = new Float32Array(LUT_N);
  for (let i = 0; i < LUT_N; i++) t[i] = f(LUT_X0 + i * LUT_DX);
  return (x: number) => {
    const u = clamp((x - LUT_X0) / LUT_DX, 0, LUT_N - 1.001);
    const i = u | 0;
    return t[i] + (t[i + 1] - t[i]) * (u - i);
  };
}

/** The upper lid has a thickness: the lash line in front, the edge on the eye behind. */
const marginAt = (x: number) => (1 - smooth(0.86, 1.03, Math.abs(x))) * 0.02 + 0.002;
/** px across a curve per px of height: the slope's correction for a line's pitch. */
const slopeOf = (f: (x: number) => number) =>
  lut((x) => Math.hypot((f(x + 0.012) - f(x - 0.012)) / 0.024, 1));

type Curve = (x: number) => number;
interface Curves {
  gy: number;
  yU: Curve;
  yL: Curve;
  yC: Curve;
  yB: Curve;
  /** The lower lid's fold: the pillow of the lid ends here and the socket begins. */
  yF: Curve;
  kU: Curve;
}

/**
 * The curves for a pose. Only the upper lid moves with the aperture, so a blink passes
 * the resting curves as `base` and rebuilds that one alone.
 */
function curvesFor(pose: Pose, base?: Curves): Curves {
  const yU = lut((x) => upperLid(x, pose));
  const kU = slopeOf(yU);
  if (base && base.gy === pose.gy) return { ...base, yU, kU };
  const yL = lut((x) => lowerLid(x, pose));
  const yF = lut(
    (x) => lowerLid(x, pose) + 0.165 * (1 - 0.62 * smooth(0.55, 1.05, Math.abs(x - 0.05))),
  );
  return { gy: pose.gy, yU, yL, yC: lut((x) => crease(x, pose)), yB: lut(brow), yF, kU };
}

// ── the socket: the loop where the lids fold in, and the rings round it ─────

const ORBIT_C = [0.02, -0.12] as const;
const NB = 1440;

interface Orbit {
  /** Where a point sits between the loop (0) and the orbit's rim (1); negative inside the loop. */
  t(x: number, y: number): number;
  /** Inside the loop (the lids' own ground), the cheap test strokes ask per sample. */
  inLoop(x: number, y: number): boolean;
  /** The point at ring coordinate t and angle a about the socket's centre. */
  at(t: number, a: number): [number, number];
  /** Eye units from ring t to the rim along angle a: ring t's share of it is its pitch. */
  span(a: number, t: number): number;
}

/** How far a ring has relaxed the loop's corners, by its t: none at the loop, round at the rim. */
const RELAX_T = [0, 0.12, 0.3, 0.55, 0.85, 1.4] as const;
const RELAX_A = [0, 0.035, 0.08, 0.14, 0.22, 0.32] as const;

/**
 * The loop runs along the crease above and the lower lid's fold below, closing round
 * both corners; the rim is an egg, nearer on the nose's side and under the eye.
 * Rings are nested between them, so they wrap the corners with no seam, and each ring
 * relaxes the loop's corners the further out it lies, the way contour lines soften away
 * from a fold: the first rings hug the lids, the last are the orbit's smooth egg.
 */
function orbitFor(C: Curves): Orbit {
  const [cx, cy] = ORBIT_C;
  const xs: number[] = [];
  const ys: number[] = [];
  const XC = 1.163;
  const quad = (
    a: readonly [number, number],
    b: readonly [number, number],
    c: readonly [number, number],
    t: number,
  ) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * b[0] + t * t * c[0],
      u * u * a[1] + 2 * u * t * b[1] + t * t * c[1],
    ];
  };
  for (let i = 0; i <= 400; i++) {
    const x = -XC + (2 * XC * i) / 400;
    xs.push(x);
    ys.push(C.yC(x));
  }
  for (let i = 1; i < 40; i++) {
    const [x, y] = quad([XC, C.yC(XC)], [1.215, 0.035], [1.0, C.yF(1.0)], i / 40);
    xs.push(x);
    ys.push(y);
  }
  for (let i = 0; i <= 300; i++) {
    const x = 1.0 - (1.95 * i) / 300;
    xs.push(x);
    ys.push(C.yF(x));
  }
  for (let i = 1; i < 40; i++) {
    const [x, y] = quad([-0.95, C.yF(-0.95)], [-1.205, 0.16], [-XC, C.yC(-XC)], i / 40);
    xs.push(x);
    ys.push(y);
  }
  const n = xs.length;
  const th = xs.map((x, i) => Math.atan2(ys[i] - cy, x - cx));
  const rr = xs.map((x, i) => Math.hypot(x - cx, ys[i] - cy));
  const order = th.map((_, i) => i).sort((a, b) => th[a] - th[b]);
  const rIn = new Float32Array(NB);
  const rOut = new Float32Array(NB);
  let k = 0;
  for (let b = 0; b < NB; b++) {
    const a = -Math.PI + (b / NB) * TAU;
    while (k < n && th[order[k]] < a) k++;
    const i1 = order[k % n];
    const i0 = order[(k - 1 + n) % n];
    let a0 = th[i0];
    let a1 = th[i1];
    if (k === 0) a0 -= TAU;
    if (k >= n) a1 += TAU;
    const f = a1 > a0 ? (a - a0) / (a1 - a0) : 0;
    rIn[b] = mix(rr[i0], rr[i1], f);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const ax = mix(1.78, 1.95, smooth(-0.25, 0.25, c));
    const by = mix(1.5, 1.32, smooth(-0.25, 0.25, s));
    rOut[b] = 1 / Math.hypot(c / ax, s / by);
  }
  const look = (tab: Float32Array, a: number) => {
    const u = ((a + Math.PI) / TAU) * NB;
    const i = Math.floor(u);
    const f = u - i;
    const i0 = ((i % NB) + NB) % NB;
    const i1 = (i0 + 1) % NB;
    return tab[i0] + (tab[i1] - tab[i0]) * f;
  };
  // The loop relaxed by a circular gaussian over the angle, one table per level.
  const levels = RELAX_A.map((sig) => {
    if (sig === 0) return rIn;
    const sb = (sig / TAU) * NB;
    const K = Math.ceil(sb * 3);
    const wts = new Float32Array(2 * K + 1);
    let sum = 0;
    for (let k = -K; k <= K; k++) sum += wts[k + K] = Math.exp(-((k / sb) ** 2) / 2);
    const out = new Float32Array(NB);
    for (let i = 0; i < NB; i++) {
      let acc = 0;
      for (let k = -K; k <= K; k++) acc += rIn[(i + k + NB * 4) % NB] * wts[k + K];
      out[i] = acc / sum;
    }
    return out;
  });
  const riAt = (a: number, t: number) => {
    if (t <= 0) return look(rIn, a);
    let k = 0;
    while (k < RELAX_T.length - 2 && t > RELAX_T[k + 1]) k++;
    const f = clamp((t - RELAX_T[k]) / (RELAX_T[k + 1] - RELAX_T[k]), 0, 1);
    return mix(look(levels[k], a), look(levels[k + 1], a), f);
  };
  return {
    t(x, y) {
      const a = Math.atan2(y - cy, x - cx);
      const r = Math.hypot(x - cx, y - cy);
      const ro = look(rOut, a);
      let ri = look(rIn, a);
      let t = (r - ri) / (ro - ri);
      // A ring's own relaxation depends on its t: two steps settle it.
      for (let q = 0; q < 2 && t > 0; q++) {
        ri = riAt(a, t);
        t = (r - ri) / (ro - ri);
      }
      return t;
    },
    inLoop(x, y) {
      return Math.hypot(x - cx, y - cy) < look(rIn, Math.atan2(y - cy, x - cx));
    },
    at(t, a) {
      const ri = riAt(a, t);
      const r = ri + t * (look(rOut, a) - ri);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    },
    span(a, t) {
      return look(rOut, a) - riAt(a, t);
    },
  };
}

/** A tone sampled on a grid in eye units and read back bilinearly (the form's light is smooth). */
interface Grid {
  at(x: number, y: number): number;
}

/**
 * The brow ridge's line: a smooth arc under the brow (the rig's brow curve has cusps
 * past its ends, and the ridge runs on past them into the nose and the temple).
 */
const ridgeY = (x: number) => -1.03 - 0.24 * Math.exp(-(((x - 0.2) / 1.15) ** 2));

/**
 * The socket's tone. Its height rises from the loop to the rim and rolls away past it;
 * the brow ridge, the nose's wall and the cheekbone stand out of it. Shade follows the
 * slope against the light, held to a mid tone so the form reads in line weight, not in
 * black; occlusion darkens the folds and the hollow at the inner corner under the brow's
 * head; the brow casts onto the hollow; the drawing frays out past the rim, sooner
 * below the eye than above it.
 */
function socketTone(
  C: Curves,
  O: Orbit,
  S: number,
  browCast: (x: number, y: number) => number,
): Grid {
  const b = EYE.brow;
  /** Inside the brow's mass (1) or off it (0): there the hair carries the tone, not the rings. */
  const browIn = (x: number, y: number) => {
    const s = (x - b.x0) / (b.x1 - b.x0);
    if (s < -0.08 || s > 1.08) return 0;
    const half = mix(b.w0, b.w1, clamp(s, 0, 1) ** 0.85);
    const d = Math.abs(y - C.yB(clamp(x, b.x0, b.x1)) - half * 0.12) / half;
    return (1 - smooth(0.75, 1.3, d)) * smooth(-0.08, 0.1, s) * (1 - smooth(0.9, 1.06, s));
  };
  const cell = Math.max(0.015, 4.5 / S);
  const X0 = -2.15;
  const X1 = 2.25;
  const Y0 = -1.9;
  const Y1 = 1.6;
  const nx = Math.ceil((X1 - X0) / cell) + 1;
  const ny = Math.ceil((Y1 - Y0) / cell) + 1;
  const tt = new Float32Array(nx * ny);
  const hh = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = Y0 + j * cell;
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * cell;
      const t = O.t(x, y);
      tt[j * nx + i] = t;
      // The bowl: a gentle rise from the loop to its rim, rolling away past it. Above
      // the eye the rim is the brow ridge (the forehead beyond it is a lit plane), so
      // the socket's wall under the brow faces down, away from the light.
      const up = smooth(0.1, 0.6, -(y - ORBIT_C[1]) / Math.hypot(x - ORBIT_C[0], y - ORBIT_C[1]));
      const tr = mix(1, 0.6, up);
      let h =
        t < tr ? 0.36 * smooth(-0.08, tr, t) : 0.36 * (1 - ((t - tr) / tr) ** 2 * 1.2 * (1 - up));
      // The brow ridge stands out above the socket and runs on into the nose and the temple.
      h +=
        0.15 *
        Math.exp(-(((y - (ridgeY(x) + 0.02)) / 0.26) ** 2)) *
        smooth(-1.75, -1.0, x) *
        (1 - smooth(1.4, 1.95, x));
      // The nose's wall rises on the inner side, highest level with the brow's head.
      h += 0.34 * smooth(-1.08, -1.85, x) * (1 - smooth(0.0, 0.9, y)) * smooth(-1.6, -1.0, y);
      // The cheekbone, a soft swell under the outer half.
      h += 0.1 * Math.exp(-(((y - 0.98) / 0.32) ** 2)) * smooth(-0.6, 0.7, x);
      hh[j * nx + i] = h;
    }
  }
  const T = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = Y0 + j * cell;
    const j0 = Math.max(j - 1, 0);
    const j1 = Math.min(j + 1, ny - 1);
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * cell;
      const i0 = Math.max(i - 1, 0);
      const i1 = Math.min(i + 1, nx - 1);
      const hx = (hh[j * nx + i1] - hh[j * nx + i0]) / ((i1 - i0) * cell);
      const hy = (hh[j1 * nx + i] - hh[j0 * nx + i]) / ((j1 - j0) * cell);
      const t = tt[j * nx + i];
      const tp = Math.max(t, 0);
      // Above the eye or below it, blended across the corners so nothing seams.
      const up = 1 - smooth(-0.22, 0.3, y - 0.02);
      // The slope's shade, held between a lit plane and a mid tone.
      const form = clamp(shade(-hx, -hy) * 1.1, -0.12, 0.48);
      // The fold: deep under the crease, shallow along the lower lid's fold.
      const fold = Math.exp(-tp / mix(0.05, 0.07, up)) * mix(0.18, 0.34, up);
      // The hollow at the inner corner, under the brow's head, against the nose.
      const hollow =
        gauss(x + 1.16, y + 0.2, 0.03, 0.12) * 0.22 + gauss(x + 1.1, y - 0.03, 0.008, 0.012) * 0.16;
      // The outer corner's fold, where the lids meet under the crease.
      const outer = gauss(x - 1.2, y + 0.02, 0.006, 0.01) * 0.26;
      // The tear trough: a crescent under the inner half of the lower lid.
      const trough =
        (1 - up) * Math.exp(-(((t - 0.15) / 0.11) ** 2)) * (0.32 - 0.18 * smooth(-0.2, 0.9, x));
      let v =
        0.05 +
        form +
        fold +
        hollow +
        outer +
        trough +
        browCast(x, y) * 0.16 +
        (vnoise(x * 5 + 2, y * 5 + 7, 41) - 0.5) * 0.06;
      // Fade: the drawing frays out past the rim, sooner below the eye and toward the temple.
      const reach = mix(0.8, 1.02, up);
      const fray = (vnoise(x * 2.4 + 3, y * 2.4 + 1, 43) - 0.5) * mix(0.18, 0.3, up);
      v *= 1 - smooth(reach - 0.2, reach + mix(0.14, 0.22, up), t + fray);
      // The sheet: the fray is spent before ±1.72 across and 1.56 above, so a frame cut
      // round the drawing (the loader's is ±1.78, -1.62 … 1.22) never cuts a line.
      v *= 1 - smooth(1.36, 1.72, Math.abs(x - 0.02) + fray * 0.7);
      v *= 1 - smooth(-1.36, -1.56, y + fray * 0.5);
      v *= 1 - 0.62 * browIn(x, y);
      // The single family stays a family of lines: the crossing makes the black.
      T[j * nx + i] = Math.min(v, 0.94);
    }
  }
  return {
    at(x, y) {
      const u = (x - X0) / cell;
      const v = (y - Y0) / cell;
      if (!(u >= 0 && v >= 0 && u < nx - 1 && v < ny - 1)) return 0;
      const i = u | 0;
      const j = v | 0;
      const fu = u - i;
      const fv = v - j;
      const k = j * nx + i;
      const a = T[k] + (T[k + 1] - T[k]) * fu;
      const b = T[k + nx] + (T[k + nx + 1] - T[k + nx]) * fu;
      return a + (b - a) * fv;
    },
  };
}

/** The tones of the eye's own parts, for a pose, under the resting light. */
function tonesFor(C: Curves, pose: Pose) {
  const { yU, yL, yC, yB, yF } = C;
  const b = EYE.brow;
  const ic: [number, number] = [EYE.iris.gx * pose.gx, EYE.iris.gy * pose.gy + EYE.iris.cy];
  const rxy: [number, number] = [
    EYE.iris.R * Math.cos(pose.gx * 0.61) ** 0.9,
    EYE.iris.R * Math.cos(pose.gy * 0.44),
  ];
  const inOpen = (x: number, y: number) => Math.abs(x) <= 1 && y >= yU(x) && y <= yL(x);
  const castLid = (x: number, y: number) => {
    const k = 0.075 / LZ;
    return smooth(-0.014, 0.014, yU(x + SUN[0] * k) - (y + SUN[1] * k));
  };
  /** The lashes' shadow on the white: soft strands, leaning as the lashes lean, never bars. */
  const lashShadow = (x: number, y: number) => {
    const k = 0.17 / LZ;
    const qx = x + SUN[0] * k;
    const qy = y + SUN[1] * k;
    const d = yU(qx) - qy;
    if (d < 0.004 || d > 0.15 || Math.abs(qx) > 0.95) return 0;
    const u = qx * 44 + d * (14 + 30 * smooth(-0.8, 1, qx));
    return (
      smooth(0.5, 0.78, vnoise(u, 3.7, 29)) *
      smooth(0.004, 0.03, d) *
      (1 - smooth(0.09, 0.15, d)) *
      (1 - smooth(0.85, 0.95, Math.abs(qx)))
    );
  };
  const browHalf = (x: number) => mix(b.w0, b.w1, clamp((x - b.x0) / (b.x1 - b.x0), 0, 1) ** 0.85);
  /** The brow's mass casts a soft shadow down onto the hollow under it. */
  const browCast = (x: number, y: number) => {
    const below = smooth(-0.02, 0.05, y - yB(clamp(x, b.x0, b.x1)));
    if (below <= 0) return 0;
    const k = 0.13 / LZ;
    const qx = x + SUN[0] * k;
    const qy = y + SUN[1] * k;
    const h = browHalf(qx);
    return (
      below *
      (1 - smooth(h * 0.6, h * 1.6, Math.abs(qy - yB(clamp(qx, b.x0, b.x1))))) *
      smooth(b.x0 - 0.05, b.x0 + 0.12, qx) *
      (1 - smooth(b.x1 - 0.2, b.x1 + 0.05, qx))
    );
  };
  const foldReach = clamp(-SUN[1] / LZ, 0.3, 1.6) * 0.3;

  /** The upper lid: lit as it rolls over the globe, in shade under the fold and under the lashes. */
  const lid = (x: number, y: number) => {
    const u = yU(x);
    const cc = yC(x);
    const band = Math.max(u - cc, 0.03);
    const tl = clamp((u - y) / band, 0, 1);
    const lidShade = shade(x * 0.45, mix(0.55, -0.22, smooth(0, 0.85, tl)));
    return (
      0.04 +
      smooth(-0.35, 1.05, x) * 0.08 +
      (1 - smooth(0, 0.16, tl)) * 0.3 +
      tl * 0.06 +
      smooth(1 - foldReach, 1, tl) * 0.3 +
      Math.exp(-(1 - tl) / 0.09) * 0.2 +
      lidShade * 0.7 +
      smooth(0.72, 1.12, Math.abs(x)) * 0.16 +
      (n0g(x, y) - 0.5) * 0.05
    );
  };

  /** The lower lid's pillow: it faces up into the light, and turns down into its fold. */
  const pillow = (x: number, y: number) => {
    const top = yL(x) + 0.03;
    const tp = clamp((y - top) / Math.max(yF(x) - top, 0.02), 0, 1);
    return (
      0.04 +
      Math.exp(-tp / 0.16) * 0.26 +
      smooth(0.62, 1, tp) * 0.3 +
      shade(x * 0.35, mix(-0.45, 0.42, tp)) * 0.6 +
      smooth(0.7, 1.05, Math.abs(x)) * 0.25 +
      (1 - smooth(-0.9, -0.3, x)) * 0.1 +
      (n0g(x, y) - 0.5) * 0.05
    );
  };

  /**
   * The white's own form, carried by the globe as it turns: darker away from the cornea,
   * and a little where the globe curves from the light. Held light, so whatever part of
   * the white the gaze brings into view arrives as clean as the rest.
   */
  const sclera = (x: number, y: number) => {
    const svx = x - ic[0];
    const svy = (y - ic[1]) * 1.08;
    const gdx = x / 1.12;
    const gdy = (y - 0.02) / 0.92;
    const gz = Math.sqrt(Math.max(1 - gdx * gdx - gdy * gdy, 0.03));
    const shadeGlobe =
      SUN[2] - (gdx * SUN[0] + gdy * SUN[1] + gz * SUN[2]) / Math.hypot(gdx, gdy, gz);
    return (
      0.02 +
      smooth(0.5, 1.0, Math.hypot(svx * 0.8, svy * 1.25)) * 0.14 +
      clamp(shadeGlobe, -0.1, 0.4) * 0.5 +
      (n0g(x, y) - 0.5) * 0.06
    );
  };

  /**
   * The shade the face lays on the white, which stays where it is when the globe turns:
   * the upper lid's band and its lashes' broken shadow, the corners, the lower lid's
   * contact, and the globe's far side turning from the light.
   */
  const whiteShade = (x: number, y: number) => {
    const xs = clamp(x, -0.97, 0.97);
    return (
      -0.04 +
      (1 - smooth(0, 0.08, y - yU(xs))) * 0.42 +
      castLid(x, y) * 0.45 +
      lashShadow(x, y) * 0.16 +
      smooth(0.5, 1.0, Math.abs(x)) * 0.34 +
      (1 - smooth(0, 0.035, yL(xs) - y)) * 0.18 +
      smooth(0.42, 1.0, x) * 0.24 +
      (n0g(x + 3.1, y + 1.7) - 0.5) * 0.06
    );
  };

  /** The collarette, where the iris's two zones meet: a ragged zig-zag, never regular. */
  const collarR = (th: number) => {
    const lobe = 1 - 4 * Math.abs(fract((th * 17) / TAU + 0.06 * Math.sin(th * 3) + 0.25) - 0.5);
    const amp = 0.45 + 0.9 * vnoise(Math.cos(th) * 1.7 + 3, Math.sin(th) * 1.7 + 5, 57);
    return (
      0.56 +
      0.032 * lobe * amp +
      (vnoise(Math.cos(th) * 3 + 1, Math.sin(th) * 3 + 2, 59) - 0.5) * 0.03
    );
  };

  /**
   * The iris: a dark limbal ring, a darker pupillary zone inside the collarette and a
   * light ridge just outside it, streaks, the lid's shadow across its top, and the light
   * that passes the cornea to brighten its far side.
   */
  const iris = (x: number, y: number) => {
    const qx = (x - ic[0]) / rxy[0];
    const qy = (y - ic[1]) / rxy[1];
    const r = Math.hypot(qx, qy);
    const th = Math.atan2(qy, qx);
    const rc = collarR(th);
    const streak = vnoise((th / TAU) * 15 + 2, r * 1.05 + 5, 51);
    return (
      0.34 +
      (r < rc ? 0.1 : 0) -
      Math.exp(-(((r - rc - 0.03) / 0.032) ** 2)) * 0.3 +
      (streak - 0.5) * 0.42 +
      smooth(0.8, 0.97, r) * 0.62 +
      (1 - smooth(0, 0.08, y - yU(x))) * 0.16 +
      castLid(x, y) * 0.22 +
      ((qx * SUN[0] + qy * SUN[1]) / LXY) * 0.12
    );
  };

  return { ic, rxy, inOpen, lid, pillow, sclera, whiteShade, iris, collarR, browCast };
}

/** The pupil's crenellated ruff, as a radius in iris units (shader: ruffR). */
const ruffAt = (th: number, pupilK: number) =>
  pupilK + 0.045 + Math.sin(th * 42) * 0.012 + hash1(Math.floor(fract(th / TAU) * 42)) * 0.012;

/** The lids' opening for a pose, px; `meniscus` lifts its lower edge off the wet line. */
export function openingOutline(S: number, pose: Pose, meniscus = 0): Float32Array {
  const n = Math.max(24, Math.ceil(S * 1.2));
  const out = new Float32Array((n + 1) * 4);
  for (let i = 0; i <= n; i++) {
    const x = -1 + (2 * i) / n;
    out[2 * i] = x * S;
    out[2 * i + 1] = upperLid(x, pose) * S;
  }
  for (let i = 0; i <= n; i++) {
    const x = 1 - (2 * i) / n;
    const j = n + 1 + i;
    out[2 * j] = x * S;
    out[2 * j + 1] = Math.max(upperLid(x, pose), lowerLid(x, pose) - meniscus) * S;
  }
  return out;
}

/**
 * The plica's fold, x at height y. The white shows only to its right: the caruncle and
 * the plica sit in front of the globe, fixed to the face, so the turning white never
 * slides over them.
 */
const plicaX = (y: number) => -0.83 + ((y - 0.04) / 0.17) ** 2 * 0.05;

/** The opening the white shows through, px: off the tear meniscus, and cut at the plica. */
export function windowOutline(S: number, pose: Pose): Float32Array {
  const o = openingOutline(S, pose, 0.016);
  for (let i = 0; i < o.length; i += 2) o[i] = Math.max(o[i], plicaX(o[i + 1] / S) * S);
  return o;
}

/** The pitch for an eye drawn at S: a big eye is cut a little coarser, as a big plate was. */
export const pitchFor = (S: number) => clamp(3.4 + (S - 200) * 0.004, 3.2, 4.2);

/** Contrast: the darks pushed toward black, the lights left to the paper. */
const deep = (t: number) => (t <= 0 ? t : t ** 0.92 * 1.08);

const ink = (
  group: string,
  layer: StrokeLayer,
  pass: Stroke['pass'],
  pen: Pen,
  extra: Partial<Meta> = {},
): Meta => ({ ink: 'ink', layer, pass, group, pen, ...extra });

/** Hatching: every run tapers in and out over a few px. */
const HATCH: LayOpts = { taper: 7 };

// ── the eye ─────────────────────────────────────────────────────────────────

/**
 * The whole eye for one pose (rest by default), as strokes in drawing order, with
 * their times. lidStrokes redraws the upper lid alone for another aperture.
 */
export function eyeDrawing(o: { S: number; pitch?: number; pose?: Pose }): EyeDrawing {
  const S = o.S;
  const P = o.pitch ?? pitchFor(S);
  const pose = o.pose ?? REST;
  const hand = new Hand(S);
  const C = curvesFor(pose);
  const { yU, yL, yC, yB } = C;
  const O = orbitFor(C);
  const T = tonesFor(C, pose);
  const socket = socketTone(C, O, S, T.browCast);
  const { ic, rxy } = T;
  const b = EYE.brow;
  const pupilK = pose.pupil;
  const RS = S * EYE.iris.R;
  const rOf = (x: number, y: number) => Math.hypot((x - ic[0]) / rxy[0], (y - ic[1]) / rxy[1]);
  const thOf = (x: number, y: number) => Math.atan2((y - ic[1]) / rxy[1], (x - ic[0]) / rxy[0]);
  const fromQ = (r: number, th: number): [number, number] => [
    ic[0] + rxy[0] * r * Math.cos(th),
    ic[1] + rxy[1] * r * Math.sin(th),
  ];
  const shownBall = (x: number, y: number) =>
    Math.abs(x) <= 1 && y >= yU(x) && y <= yL(x) - 0.016 && x >= plicaX(y);
  /** How far the white reaches under the lids: enough for the gaze to turn it. */
  const underLids = (x: number, y: number) => {
    const xc = clamp(x, -1, 1);
    return Math.abs(x) <= 1.45 && y >= yU(xc) - 0.16 && y <= yL(xc) + 0.14;
  };

  // ── I · construction, in chalk, in the plate's order of drawing ──
  const chalk = (group: string): Meta => ({
    ink: 'chalk',
    layer: 'cons',
    pass: 1,
    group,
    pen: 'chalk',
  });
  const CH = 0.5; // chalk half-width, px
  let chalkIdx = 0;
  /** The centre line's long-short dash, every 22 px, in chalk. */
  const centreDash = (id: number) => (_x: number, _y: number, s: number) => {
    const f = fract(s / 22);
    return f < 0.55 || (f > 0.68 && f < 0.78) ? chalkWidth(CH, s, id) : 0;
  };
  /** Hidden lines dashed (6 on, 4 off); lines the opening shows are lighter, and kept off the cornea. */
  const hiddenDash = (id: number) => (x: number, y: number, s: number) => {
    if (T.inOpen(x, y)) return rOf(x, y) <= 1.02 ? 0 : chalkWidth(CH * 0.7, s, id);
    return fract(s / 10) < 0.6 ? chalkWidth(CH, s, id) : 0;
  };
  const solid = (id: number) => (_x: number, _y: number, s: number) => chalkWidth(CH, s, id);
  const NOSPLIT: LayOpts = { gapSplit: 1e9 };
  // ① the axis: the centre lines through the globe
  hand.lay(
    byX(-1.5, 1.5, S, () => GLOBE.cy),
    centreDash(chalkIdx++),
    chalk('cons-1'),
    NOSPLIT,
  );
  hand.lay(
    byParam(Math.ceil(2.38 * S), (t) => [GLOBE.cx, -1.38 + t * 2.38]),
    centreDash(chalkIdx++),
    chalk('cons-1'),
    NOSPLIT,
  );
  // ② the corners
  for (const cx of [-1, 1])
    hand.lay(
      byParam(Math.ceil(0.9 * S), (t) => [cx, -0.45 + t * 0.9]),
      solid(chalkIdx++),
      chalk('cons-2'),
      NOSPLIT,
    );
  // ③ the globe, swung by compass from the upper left, then its parallels and meridians
  const R = GLOBE.R;
  hand.lay(
    byAngle(GLOBE.cx, GLOBE.cy, R, R, -2.0, -2.0 + TAU, S),
    hiddenDash(chalkIdx++),
    chalk('cons-3'),
    NOSPLIT,
  );
  for (let k = 1; k <= 5; k++) {
    const rr = R * Math.sin((k * Math.PI) / 12);
    hand.lay(
      byAngle(GLOBE.cx, GLOBE.cy, rr, rr, -Math.PI / 2, -Math.PI / 2 + TAU, S),
      hiddenDash(chalkIdx++),
      chalk('cons-3'),
      NOSPLIT,
    );
  }
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const r0 = R * Math.sin(0.2);
    hand.lay(
      byParam(Math.ceil((R - r0) * S), (t) => [
        GLOBE.cx + Math.cos(a) * mix(R, r0, t),
        GLOBE.cy + Math.sin(a) * mix(R, r0, t),
      ]),
      hiddenDash(chalkIdx++),
      chalk('cons-3'),
      NOSPLIT,
    );
  }
  // ④ the iris and the pupil, with a cross on the pole
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0], rxy[1], -2.2, -2.2 + TAU, S),
    solid(chalkIdx++),
    chalk('cons-4'),
    NOSPLIT,
  );
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0] * pupilK, rxy[1] * pupilK, -2.2, -2.2 + TAU, S),
    solid(chalkIdx++),
    chalk('cons-4'),
    NOSPLIT,
  );
  hand.lay(
    byX(ic[0] - 0.07, ic[0] + 0.07, S, () => ic[1]),
    solid(chalkIdx++),
    chalk('cons-4'),
  );
  hand.lay(
    byParam(Math.ceil(0.14 * S), (t) => [ic[0], ic[1] - 0.07 + t * 0.14]),
    solid(chalkIdx++),
    chalk('cons-4'),
  );
  // ⑤ the lids, ⑥ the crease, ⑦ the brow
  hand.lay(byX(-1.25, 1.25, S, yU), solid(chalkIdx++), chalk('cons-5'), NOSPLIT);
  hand.lay(byX(-1.25, 1.25, S, yL), solid(chalkIdx++), chalk('cons-5'), NOSPLIT);
  hand.lay(byX(-1.25, 1.25, S, yC), solid(chalkIdx++), chalk('cons-6'), NOSPLIT);
  hand.lay(byX(b.x0 - 0.05, b.x1 + 0.05, S, yB), solid(chalkIdx++), chalk('cons-7'), NOSPLIT);
  // ⑧ the orbit, the socket's rim, dashed
  {
    const id = chalkIdx++;
    hand.lay(
      byAngle(0.05, -0.22, 1.46, 1.1, Math.PI * 0.95, Math.PI * 0.95 + TAU, S),
      (_x, _y, s) => (fract(s / 10) < 0.6 ? chalkWidth(CH * 0.85, s, id) : 0),
      chalk('cons-8'),
      NOSPLIT,
    );
  }

  // ── II · contours ──
  lidContours(hand, S, C);
  {
    const taperL = (x: number) => 1 - smooth(0.84, 1.03, Math.abs(x));
    hand.lay(
      byX(-1.04, 1.04, S, yL),
      (x) => 0.6 * taperL(x) + 0.1,
      ink('contour-lower', 'skin', 2, 'contour'),
    );
    // The lower lash line: the lid's outer edge, heavier toward the temple.
    hand.lay(
      byX(-1.04, 1.04, S, (x) => yL(x) + 0.03),
      (x) => (0.85 + 0.55 * smooth(-0.2, 0.9, x)) * taperL(x) + 0.1,
      ink('contour-lower', 'skin', 2, 'contour'),
    );
    const taperC = (x: number) => 1 - smooth(0.9, 1.16, Math.abs(x));
    hand.lay(
      byX(-1.16, 1.16, S, yC),
      (x) => (0.75 + (1 - smooth(-0.6, 0.6, x)) * 0.85) * taperC(x),
      ink('contour-crease', 'skin', 2, 'contour'),
    );
  }
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0], rxy[1], -2.2, -2.2 + TAU, S),
    () => 1.1,
    ink('contour-iris', 'ball', 2, 'contour'),
    { shown: shownBall, gapSplit: 1e9 },
  );
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0] * pupilK, rxy[1] * pupilK, -2.2, -2.2 + TAU, S),
    () => 0.9,
    ink('contour-iris', 'ball', 2, 'contour'),
    { shown: shownBall, gapSplit: 1e9 },
  );

  // ── III · hatching ──
  // The upper lid's band: copies of the lid's own curve, compressing into the crease.
  lidBand(hand, S, P, C, O, T.lid);
  // The lower lid's pillow: copies of the lower lid, compressing into its fold.
  {
    const nP = Math.max(3, Math.round((0.135 * S) / P));
    for (let j = 1; j < nP; j++) {
      const curve = byX(-0.97, 1.05, S, (x) => {
        const top = yL(x) + 0.03;
        return top + ((j - (n0r(x, top) - 0.5) * 0.4) / nP) * (C.yF(x) - top);
      });
      hand.lay(
        curve,
        (x, y, s) => {
          if (!O.inLoop(x, y)) return 0;
          const pitch = ((C.yF(x) - yL(x) - 0.03) * S) / nP;
          return cutWidth(deep(T.pillow(x, y)), pitch, 1500 + j, s);
        },
        ink('pillow', 'skin', 3, 'hatch'),
        HATCH,
      );
    }
  }
  // The socket: rings nested between the loop and the rim, frayed out past it.
  const NR = Math.max(12, Math.round((0.8 * S) / (1.12 * P)));
  const T_MAX = 1.32;
  const ringT = (k: number) => ((k - 0.35) / NR) ** 1.12;
  for (let k = 1; ringT(k) < T_MAX; k++) {
    const tk = ringT(k);
    const dt = ringT(k + 1) - tk;
    // Start where the ring is lightest, so its two ends meet in the paper.
    let a0 = 0;
    let lo = 1e9;
    for (let q = 0; q < 48; q++) {
      const a = (q / 48) * TAU - Math.PI;
      const [x, y] = O.at(tk, a);
      const v = socket.at(x, y);
      if (v < lo) {
        lo = v;
        a0 = a;
      }
    }
    const span = (a: number) => O.span(a, tk);
    // A point every few px is plenty: the pen resamples the ring every px.
    const n = Math.ceil(TAU * (1.2 + tk * 0.7) * S * 0.35);
    const curve = byParam(n, (u) => {
      const a = a0 + u * TAU;
      const [x0, y0] = O.at(tk, a);
      const wob = (n0r(x0, y0) - 0.5) * 0.35 * dt;
      return O.at(tk + wob, a);
    });
    hand.lay(
      curve,
      (x, y, s) => {
        const a = Math.atan2(y - ORBIT_C[1], x - ORBIT_C[0]);
        return cutWidth(deep(socket.at(x, y)), dt * span(a) * S, 6000 + k, s);
      },
      ink('orbit', 'skin', 3, 'hatch'),
      HATCH,
    );
  }
  // The white: arcs about the iris, the eyeball's curvature, in two halves top to bottom.
  {
    const k0 = Math.floor((0.3 * S) / P);
    const k1 = Math.ceil((1.32 * S) / P);
    for (let k = k0; k <= k1; k++) {
      const rr = (k * P) / S;
      // Only the part of the arc the white can show, at any gaze (underLids reaches
      // about 0.56 above and below the iris's centre).
      const as = Math.asin(Math.min(1, 0.64 / rr));
      for (const [a0, a1] of [
        [-as, as],
        [Math.PI + as, Math.PI - as],
      ] as const) {
        hand.lay(
          byAngle(ic[0], ic[1], rr, rr / 1.08, a0, a1, S),
          (x, y, s) => {
            if (rOf(x, y) <= 1 || !underLids(x, y)) return 0;
            return cutWidth(deep(T.sclera(x, y)), P / 1.04, k, s);
          },
          ink('hatch-sclera', 'ball', 3, 'hatch'),
          { ...HATCH, shown: shownBall },
        );
      }
    }
  }
  // The iris: fibres cut from the limbus in to the collarette, nearly straight, each with a
  // slight bend of its own, sweeping round from twelve o'clock.
  const NSP = Math.max(Math.floor((RS * TAU * 0.72) / P), 24);
  for (let j = 0; j < NSP; j++) {
    const th0 = (j * TAU) / NSP - Math.PI / 2;
    const h = hash1(j * 2.7 + 1);
    const bend = (h - 0.5) * 0.08;
    const rc = T.collarR(th0) + 0.01;
    hand.lay(
      byParam(Math.ceil((1 - rc) * RS * 1.5), (t) => {
        const r = mix(1, rc, t);
        return fromQ(r, th0 + bend * Math.sin(Math.PI * t) + 0.007 * Math.sin(r * 23 + h * 6.3));
      }),
      (x, y, s) => {
        const r = rOf(x, y);
        if (r > 1 || r < pupilK) return 0;
        return cutWidth(deep(T.iris(x, y)), (TAU * r * RS) / NSP, j, s);
      },
      ink('hatch-spokes', 'ball', 3, 'hatch'),
      { ...HATCH, taper: 4, shown: shownBall },
    );
  }

  // ── IV · cross-hatching where the form turns from the light, then the detail ──
  // Two spiral families over the socket's rings: one where it is in shade, both in the deepest.
  for (const [twist, from, group] of [
    [0.85, 0.42, 'orbit-cross'],
    [-0.85, 0.66, 'orbit-cross'],
  ] as const) {
    const pitch = 1.25 * P;
    const count = Math.round((TAU * 1.05 * S) / pitch);
    const Q = 24;
    for (let j = 0; j < count; j++) {
      const th0 = (j / count) * TAU - Math.PI;
      // Only the stretch of the spiral that reaches the shade is cut; one that never
      // does is not cut at all.
      let q0 = -1;
      let q1 = -1;
      for (let q = 0; q <= Q; q++) {
        const t = (q / Q) * 1.25;
        const [x, y] = O.at(t, th0 + twist * t);
        if (socket.at(x, y) > from - 0.04) {
          if (q0 < 0) q0 = q;
          q1 = q;
        }
      }
      if (q0 < 0) continue;
      const tA = (Math.max(q0 - 1, 0) / Q) * 1.25;
      const tB = (Math.min(q1 + 1, Q) / Q) * 1.25;
      hand.lay(
        byParam(Math.ceil((tB - tA) * S * 0.6), (u) => {
          const t = mix(tA, tB, u);
          return O.at(t, th0 + twist * t);
        }),
        (x, y, s) => {
          if (O.inLoop(x, y)) return 0;
          return cutWidth(
            deep((socket.at(x, y) - from) / (1 - from)),
            pitch,
            7000 + j * 2 + (twist > 0 ? 0 : 1),
            s,
          );
        },
        ink(group, 'skin', 4, 'hatch'),
        { ...HATCH, gapSplit: 10 },
      );
    }
  }
  lidCross(hand, S, P, C, O, T.lid);
  whiteShadeLines(hand, S, P, C, T.whiteShade);
  // The pillow's shade, crossed where it turns into its fold.
  {
    const g = 1.25 * P;
    for (let x0 = -1.0; x0 <= 1.1; x0 += g / S) {
      hand.lay(
        byParam(Math.ceil(0.2 * S), (u) => {
          const x = x0 - 0.12 * u;
          const top = C.yL(x) + 0.03;
          return [x, top + u * (C.yF(x) - top)];
        }),
        (x, y, s) => {
          if (!O.inLoop(x, y)) return 0;
          return cutWidth(deep((T.pillow(x, y) - 0.5) / 0.5), g, 8000 + Math.round(x0 * 997), s);
        },
        ink('pillow-cross', 'skin', 4, 'hatch'),
        HATCH,
      );
    }
  }
  // The iris's detail: the limbal ring, the collarette's zig-zag, the crypts, the pupillary fibres.
  {
    for (let k = 0; k < 5; k++) {
      const rr = 0.875 + k * 0.025;
      hand.lay(
        byAngle(ic[0], ic[1], rxy[0] * rr, rxy[1] * rr, -Math.PI / 2, -Math.PI / 2 + TAU, S),
        (x, y, s) => {
          const fleck = vnoise(thOf(x, y) * 9 + k * 3, rr * 4, 61);
          return cutWidth(
            deep(0.78 + (fleck - 0.5) * 0.5 + (T.iris(x, y) - 0.6) * 0.3),
            0.025 * RS,
            700 + k,
            s,
          );
        },
        ink('iris', 'ball', 4, 'hatch'),
        { ...HATCH, shown: shownBall },
      );
    }
    hand.lay(
      byAngle(ic[0], ic[1], rxy[0], rxy[1], -Math.PI / 2, -Math.PI / 2 + TAU, S, (a) =>
        T.collarR(a),
      ),
      () => 0.62,
      ink('iris', 'ball', 4, 'contour'),
      { shown: shownBall, gapSplit: 1e9 },
    );
    // Finer fibres inside the collarette, the pupillary zone.
    const NP2 = Math.round(NSP * 1.5);
    for (let j = 0; j < NP2; j++) {
      const th = (j * TAU) / NP2 + 0.5 / NP2;
      const rc = T.collarR(th);
      hand.lay(
        byParam(Math.ceil((rc - pupilK) * RS * 1.5), (t) =>
          fromQ(mix(rc - 0.01, pupilK + 0.04, t), th),
        ),
        (x, y, s) => cutWidth(deep(T.iris(x, y) * 0.8), (TAU * 0.45 * RS) / NP2, 900 + j, s),
        ink('iris', 'ball', 4, 'hatch'),
        { ...HATCH, taper: 3, shown: shownBall },
      );
    }
    // Crypts of Fuchs: lens-shaped hollows among the fibres, dark and drawn along them.
    for (let i = 0; i < 22; i++) {
      const th = hash1(i * 3.1 + 0.7) * TAU;
      const r0 = 0.6 + hash1(i * 5.3 + 1.1) * 0.24;
      const len = 0.07 + hash1(i * 7.7 + 2.9) * 0.08;
      const wmax = 0.9 + hash1(i * 1.9 + 4.4) * 0.9;
      hand.lay(
        byParam(Math.ceil(len * RS * 1.5), (t) => fromQ(r0 + t * len, th + (t - 0.5) * 0.04)),
        (_x, _y, s) => wmax * Math.sin(Math.PI * clamp(s / (len * RS), 0, 1)) ** 0.7,
        ink('iris', 'ball', 4, 'flick'),
        { shown: shownBall },
      );
    }
  }
  // A few veins on the white, wandering in from the corners and branching.
  for (const [vx, vy, dir, len, seed] of [
    [-0.97, 0.07, 0.04, 0.4, 1],
    [-0.92, -0.1, -0.12, 0.28, 2],
    [0.97, -0.04, Math.PI - 0.06, 0.38, 3],
    [0.93, 0.13, Math.PI + 0.22, 0.3, 4],
  ] as const) {
    const walk = (x0: number, y0: number, a0: number, L: number, sd: number, w0: number) => {
      const pts: number[] = [x0, y0];
      let x = x0;
      let y = y0;
      let a = a0;
      const n = Math.ceil(L / 0.008);
      for (let q = 1; q <= n; q++) {
        // A vein wanders, but keeps its heading: no curls.
        a += (vnoise(sd * 7.1, q * 0.09, 71) - 0.5) * 0.22 + (a0 - a) * 0.06;
        x += Math.cos(a) * 0.008;
        y += Math.sin(a) * 0.008;
        if (rOf(x, y) < 1.04) break;
        pts.push(x, y);
      }
      const total = (pts.length / 2 - 1) * 0.008 * S;
      hand.lay(
        pts,
        (_x, _y, s) => mix(w0, 0.12, clamp(s / Math.max(total, 1), 0, 1)),
        ink('vessels', 'ball', 4, 'flick'),
        { shown: shownBall },
      );
      return pts;
    };
    const trunk = walk(vx, vy, dir, len, seed, 0.36);
    const mid = Math.floor(trunk.length / 4) * 2;
    if (mid > 4)
      walk(trunk[mid], trunk[mid + 1], dir + (seed % 2 ? 0.6 : -0.6), len * 0.45, seed + 10, 0.24);
  }
  // Lashes, flicked from the lash line, inner corner to outer.
  upperLashes(hand, S, C);
  lowerLashes(hand, S, C);
  // The brow: hair combed along a flow, flicked from its head to its tail.
  browHair(hand, S, C);
  // The lower lid's fold, and the lacrimal punctum.
  hand.lay(
    byX(-0.92, 1.02, S, (x) => C.yF(x)),
    (x) => 0.45 * (1 - smooth(0.55, 0.95, Math.abs(x - 0.05))) + 0.08,
    ink('detail', 'skin', 4, 'contour'),
    { taper: 10 },
  );
  hand.lay(
    byAngle(-0.8, 0.171, 1.8 / S, 1.8 / S, 0, TAU, S),
    () => 0.5,
    ink('detail', 'skin', 4, 'contour'),
    NOSPLIT,
  );
  openDetail(hand, S, C);

  // ── V · the plate: the pupil inked round the kiruk star; the cornea's window ──
  const pupilOutline: number[] = [];
  {
    const NPp = Math.max(48, Math.ceil(pupilK * RS * TAU));
    for (let i = 0; i < NPp; i++) {
      const th = (i / NPp) * TAU;
      pupilOutline.push(...fromQ(ruffAt(th, pupilK), th));
    }
    // The hand fills the dark in a spiral from the ruff inward; the outline lands at the end.
    const hw = 1.7;
    const step = (hw * 1.35) / RS;
    const curve: number[] = [];
    for (let a = 0; a < 400; a += 0.02) {
      const rr = ruffAt(a, pupilK) - (hw * 0.8) / RS - (a / TAU) * step;
      if (rr <= 0.01) break;
      curve.push(...fromQ(rr, a));
    }
    const at = hand.out.length;
    hand.lay(curve, () => hw, ink('pupil', 'ball', 5, 'fill'), NOSPLIT);
    const st = hand.out[at];
    if (st) {
      const f = new Float32Array(pupilOutline.length);
      for (let i = 0; i < f.length; i++) f[i] = pupilOutline[i] * S;
      st.fill = f;
    }
  }
  {
    // The catchlight: the logogram, paths unchanged, scratched clear of the pupil's ink.
    const starC: [number, number] = [
      ic[0] - 0.16 * rxy[0] * pupilK,
      ic[1] - 0.18 * rxy[1] * pupilK,
    ];
    const starD = rxy[1] * pupilK * 2.1;
    const v = LOGOGRAM_VIEW;
    const at = (lx: number, ly: number): [number, number] => [
      starC[0] + ((lx - v.cx) / v.size) * starD,
      starC[1] + ((ly - v.cy) / v.size) * starD,
    ];
    // Never finer than a clean hairline: it is the mark, and it has to read.
    const needleW = Math.max((v.stroke / 2 / v.size) * starD * S, HAIRLINE * 2.2);
    const scratch = (pen: Pen): Meta => ({
      ink: 'clear',
      layer: 'ball',
      pass: 5,
      group: 'star',
      pen,
      clip: 'pupil',
    });
    for (const d of LOGOGRAM_NEEDLES) {
      const [poly] = parseAbsPath(d);
      if (!poly || poly.length < 4) continue;
      const a = at(poly[0], poly[1]);
      const z = at(poly[2], poly[3]);
      const n = Math.max(2, Math.ceil(Math.hypot(z[0] - a[0], z[1] - a[1]) * S));
      hand.lay(
        byParam(n, (t) => [mix(a[0], z[0], t), mix(a[1], z[1], t)]),
        () => needleW,
        scratch('flick'),
      );
    }
    for (const d of LOGOGRAM_FILLS) {
      for (const poly of parseAbsPath(d)) {
        const pts: number[] = [];
        for (let i = 0; i < poly.length; i += 2) pts.push(...at(poly[i], poly[i + 1]));
        hand.fill(pts, scratch('fill'), starC);
      }
    }
    // The hole at the logogram's heart stays ink.
    const hole: number[] = [];
    const hr = (v.hole / v.size) * starD;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU;
      hole.push(starC[0] + Math.cos(a) * hr, starC[1] + Math.sin(a) * hr);
    }
    hand.fill(hole, ink('star', 'ball', 5, 'fill', { clip: 'pupil' }), starC);
  }
  {
    // The cornea holds the room's window: four panes cut clear, the glazing bars left in ink.
    const l = Math.hypot(SUN[0], SUN[1], SUN[2] + 1);
    const hv = [(SUN[0] / l) * 1.12, (SUN[1] / l) * 1.12] as const;
    const q = (qx: number, qy: number): [number, number] => [
      ic[0] + rxy[0] * qx,
      ic[1] + rxy[1] * qy,
    ];
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const x0 = hv[0] + sx * 0.015;
      const x1 = hv[0] + sx * 0.16;
      const y0 = hv[1] + sy * 0.015;
      const y1 = hv[1] + sy * 0.12;
      hand.fill(
        [...q(x0, y0), ...q(x1, y0), ...q(x1, y1), ...q(x0, y1)],
        {
          ink: 'clear',
          layer: 'ball',
          pass: 5,
          group: 'glaze',
          pen: 'fill',
          clip: 'iris',
          alpha: 0.92,
        },
        q(hv[0], hv[1]),
      );
    }
  }

  const irisN = Math.max(48, Math.ceil(RS * TAU));
  const iris = new Float32Array(irisN * 2);
  for (let i = 0; i < irisN; i++) {
    const [x, y] = fromQ(1, (i / irisN) * TAU);
    iris[2 * i] = x * S;
    iris[2 * i + 1] = y * S;
  }
  const pupil = new Float32Array(pupilOutline.length);
  for (let i = 0; i < pupil.length; i++) pupil[i] = pupilOutline[i] * S;

  const end = scheduleEye(hand.out);
  return {
    strokes: hand.out,
    S,
    pitch: P,
    pose,
    opening: openingOutline(S, pose),
    window: windowOutline(S, pose),
    pupil,
    iris,
    end,
  };
}

// ── the upper lid: everything that moves when the eye blinks ───────────────

function lidContours(hand: Hand, S: number, C: Curves, step = 1) {
  const { yU } = C;
  const taperU = (x: number) => 1 - smooth(0.86, 1.03, Math.abs(x));
  const meta = ink('contour-lid', 'lid', 2, 'contour');
  // The lash line: heavy, heaviest toward the temple, where the lashes crowd.
  hand.lay(
    byX(-1.04, 1.04, S, (x) => yU(x) - marginAt(x)),
    (x) => (1.25 + (1 - x * x) * 1.1 + 0.75 * smooth(0.1, 0.9, x)) * taperU(x) + 0.15,
    meta,
    { step },
  );
  hand.lay(byX(-1.0, 1.0, S, yU), (x) => 0.42 * taperU(x) + 0.05, meta, { step });
}

/** The upper lid's band, between the lash line and the crease, inside the socket's loop. */
function lidBand(
  hand: Hand,
  S: number,
  P: number,
  C: Curves,
  O: Orbit,
  tone: (x: number, y: number) => number,
  step = 1,
) {
  const { yU, yC, kU } = C;
  const nBand = Math.max(2, Math.floor((S * 0.39) / P + 0.5));
  for (let j = 1; j < nBand; j++) {
    const curve = byX(-1.16, 1.14, S, (x) => {
      const u = yU(x) - marginAt(x);
      const band = Math.max(u - yC(x), 0.03);
      return u - ((j - (n0r(x, u - (j * band) / nBand) - 0.5) * 0.5) * band) / nBand;
    });
    hand.lay(
      curve,
      (x, y, s) => {
        if (y < yC(x) || (Math.abs(x) > 0.95 && !O.inLoop(x, y))) return 0;
        const band = Math.max(yU(x) - marginAt(x) - yC(x), 0.03);
        const t = tone(x, y);
        return cutWidth(deep(t), (band * S) / nBand / kU(x), 1000 + j, s);
      },
      ink('hatch-band', 'lid', 3, 'hatch'),
      { taper: 7, step },
    );
  }
}

/** The lid's shade, crossed: strokes down the lid, slanting, where the fold and the corners darken it. */
function lidCross(
  hand: Hand,
  S: number,
  P: number,
  C: Curves,
  O: Orbit,
  tone: (x: number, y: number) => number,
  step = 1,
) {
  const { yU, yC } = C;
  const g = 1.3 * P;
  const along = (x0: number, u: number): [number, number] => {
    const x = x0 + 0.2 * u + 0.06 * u * u;
    const lo = yU(x) - marginAt(x);
    return [x, lo + u * (yC(x) - lo)];
  };
  for (let x0 = -1.2; x0 <= 1.2; x0 += g / S) {
    // A line that never reaches the lid's shade is not cut at all.
    let dark = false;
    for (let q = 0; q <= 10 && !dark; q++) {
      const [x, y] = along(x0, q / 10);
      if (tone(x, y) > 0.5) dark = true;
    }
    if (!dark) continue;
    hand.lay(
      byParam(Math.ceil(0.5 * S), (u) => along(x0, u)),
      (x, y, s) => {
        if (y < yC(x) || y > yU(x) - marginAt(x) || (Math.abs(x) > 0.95 && !O.inLoop(x, y)))
          return 0;
        const t = (tone(x, y) - 0.5) / 0.5;
        return cutWidth(deep(t), g, 4000 + Math.round(x0 * 1013), s);
      },
      ink('lid-cross', 'lid', 4, 'hatch'),
      { taper: 7, step },
    );
  }
}

/**
 * The white's shade, fixed to the face: lines that follow the lids across the opening,
 * from the upper lid down to the lower, cut only where the lids and the corners shade
 * the white. They cross the globe's own arcs, so the shade reads as cross-hatching, and
 * they stay put while the globe turns under them.
 */
function whiteShadeLines(
  hand: Hand,
  S: number,
  P: number,
  C: Curves,
  tone: (x: number, y: number) => number,
  step = 1,
) {
  const { yU, yL } = C;
  const bot = (x: number) => Math.max(yU(x), yL(x) - 0.016);
  const N = Math.max(4, Math.round((0.74 * S) / (1.2 * P)));
  const inWhite = (x: number, y: number) =>
    Math.abs(x) <= 1 && y >= yU(x) && y <= bot(x) && x >= plicaX(y);
  for (let j = 1; j < N; j++) {
    const f = j / N;
    hand.lay(
      byX(-0.96, 1.0, S, (x) => mix(yU(x), bot(x), f) + (n0r(x * 1.3, f * 3) - 0.5) * 0.004),
      (x, y, s) => {
        if (!inWhite(x, y)) return 0;
        const pitch = ((bot(x) - yU(x)) * S) / N;
        // Where the lines crowd (toward the corners, under a closing lid) only every
        // second, fourth … line is cut, as an engraver drops lines that converge.
        const lev = pitch >= P * 0.85 ? 1 : pitch >= P * 0.42 ? 2 : pitch >= P * 0.21 ? 4 : 8;
        if (j % lev) return 0;
        return cutWidth(deep(tone(x, y)), pitch * lev, 8800 + j, s);
      },
      ink('white-shade', 'lid', 4, 'hatch'),
      { taper: 6, step },
    );
  }
}

function upperLashes(hand: Hand, S: number, C: Curves, step = 1) {
  const { yU } = C;
  const lashes: { x: number; row: number; i: number }[] = [];
  for (let row = 0; row < 2; row++) {
    const N = row === 0 ? 74 : 54;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5 + (hash1(i * 1.7 + row * 31) - 0.5) * 0.7) / N;
      lashes.push({ x: -0.9 + 1.88 * u ** 0.93, row, i });
    }
  }
  lashes.sort((a, b) => a.x - b.x);
  for (const { x: xr, row, i } of lashes) {
    if (xr < -0.92 || xr > 1.0) continue;
    const h = (k: number) => hash1(i * 7.13 + row * 101 + k);
    // Short at the inner corner, longest past the middle, a little shorter at the corner itself.
    const reach =
      (0.05 + 0.2 * smooth(-0.9, 0.35, xr) * (1 - 0.4 * smooth(0.78, 1.0, xr))) *
      (row === 0 ? 1 : 0.76) *
      (0.82 + h(1) * 0.36);
    // Lashes lean toward the temple the further out they grow; they curl up and out.
    const lean = -0.18 + 0.72 * smooth(-0.8, 1.0, xr) + (h(2) - 0.5) * 0.22;
    const curl = (1.6 + h(3) * 1.6) * Math.sign(lean + 0.05);
    // Clumps: the tips of four or five lean together.
    const clump = Math.floor((xr + 1) * 26 + 0.5);
    const pull = (hash1(clump * 3.9) - 0.5) * 0.06;
    const n = Math.max(6, Math.ceil(reach * S * 1.6));
    const pts: number[] = [];
    let x = xr;
    let y = yU(xr) - marginAt(xr);
    let a = -Math.PI / 2 + lean;
    pts.push(x, y);
    for (let q = 1; q <= n; q++) {
      const u = q / n;
      a += (curl * reach) / n + (u > 0.6 ? pull / n : 0);
      x += Math.cos(a) * (reach / n);
      y += Math.sin(a) * (reach / n);
      pts.push(x, y);
    }
    const Lpx = reach * S;
    const root = (row === 0 ? 1.35 : 0.95) * (0.85 + h(4) * 0.3);
    hand.lay(
      pts,
      (_x, _y, s) => hairWidth(s / Lpx, root, 0.62),
      ink('lashes-upper', 'lid', 4, 'flick'),
      { step },
    );
  }
}

function lowerLashes(hand: Hand, S: number, C: Curves) {
  const { yL } = C;
  const N = 40;
  for (let i = 0; i < N; i++) {
    const h = (k: number) => hash1(i * 5.31 + k);
    if (h(0) < 0.14) continue;
    const xr = -0.62 + 1.58 * ((i + 0.5 + (h(1) - 0.5) * 0.8) / N) ** 0.85;
    const reach =
      (0.03 + 0.07 * smooth(-0.4, 0.8, xr) * (1 - 0.4 * smooth(0.85, 1, xr))) * (0.75 + h(2) * 0.5);
    let a = Math.PI / 2 - 0.3 - 0.55 * smooth(-0.4, 1.0, xr) + (h(3) - 0.5) * 0.3;
    const curl = -0.8 - h(4) * 1.2;
    const n = Math.max(4, Math.ceil(reach * S * 1.6));
    let x = xr;
    let y = yL(xr) + 0.032;
    const pts: number[] = [x, y];
    for (let q = 1; q <= n; q++) {
      a += (curl * reach) / n;
      x += Math.cos(a) * (reach / n);
      y += Math.sin(a) * (reach / n);
      pts.push(x, y);
    }
    const Lpx = reach * S;
    hand.lay(
      pts,
      (_x, _y, s) => hairWidth(s / Lpx, 0.78, 0.7),
      ink('lashes-lower', 'skin', 4, 'flick'),
    );
  }
}

/**
 * The brow as hair combed along a flow: at its head the hairs rise and fan out, short
 * and sparse; along its body they lie toward the temple, the lower ones rising and the
 * upper ones falling to meet on the spine; at the tail they turn down and thin out.
 * Two layers, as an engraver builds a brow: a sparse underlayer of fine long hairs that
 * gives it its ground, then the body's darker hairs, densest along the lower edge.
 * Every hair is a flick: a bite at the root, a long taper to a hairline tip, paper left
 * between them, so the brow reads as hair and never as a band.
 */
function browHair(hand: Hand, S: number, C: Curves) {
  const b = EYE.brow;
  const span = b.x1 - b.x0;
  const half = (s: number) => mix(b.w0, b.w1, clamp(s, 0, 1) ** 0.85);
  const flow = (s: number, v: number) => {
    const head = mix(-1.32, -0.55, smooth(0.0, 0.26, s));
    const body = mix(-0.3, 0.2, smooth(0.32, 0.98, s));
    const a = s < 0.26 ? mix(head, body, smooth(0.1, 0.26, s)) : body;
    return a - 0.3 * v * smooth(0.14, 0.38, s);
  };
  const hairs: { s: number; pts: number[]; L: number; root: number; layer: number }[] = [];
  for (const [layer, count, seed] of [
    [0, 0.42, 0],
    [1, 0.78, 977],
  ] as const) {
    const N = clamp(Math.round(count * S), 70, 300);
    for (let i = 0; i < N; i++) {
      const h = (k: number) => hash1((i + seed) * 3.917 + k * 17.3);
      const s = clamp(h(1) ** 0.92, 0, 1);
      // Across the brow, -1 its upper edge … 1 its lower; the body crowds low.
      const v = clamp((h(2) + h(3) + h(4)) / 1.5 - 1 + (layer ? 0.18 : 0), -1.2, 1.2);
      const keep =
        (1 - 0.6 * smooth(0.5, 1.1, Math.abs(v))) *
        (1 - 0.6 * smooth(0.72, 1, s)) *
        (0.7 + 0.3 * smooth(0.0, 0.2, s));
      if (h(5) > keep) continue;
      const x0 = b.x0 + s * span;
      let x = x0;
      let y = C.yB(x0) + v * half(s);
      const L =
        (0.15 + 0.13 * h(6)) *
        mix(1.12, 0.7, smooth(0.5, 1, s)) *
        mix(0.42, 1, smooth(0.04, 0.32, s)) *
        (layer ? 1 : mix(0.7, 1.18, smooth(0.12, 0.34, s)));
      const bend = (h(7) - 0.45) * 1.5;
      const steps = 12;
      const pts: number[] = [x, y];
      for (let q = 1; q <= steps; q++) {
        const ss = clamp((x - b.x0) / span, 0, 1);
        const vv = clamp((y - C.yB(x)) / Math.max(half(ss), 0.01), -1.4, 1.4);
        const a = flow(ss, vv) + bend * (q / steps) * 0.38;
        x += Math.cos(a) * (L / steps);
        y += Math.sin(a) * (L / steps);
        pts.push(x, y);
      }
      const root =
        (layer ? 0.78 + h(8) * 0.36 : 0.42 + h(8) * 0.2) *
        (1.05 - 0.3 * Math.abs(v)) *
        mix(0.7, 1, smooth(0.0, 0.2, s));
      hairs.push({ s, pts, L: L * S, root, layer });
    }
  }
  hairs.sort((p, q) => p.layer - q.layer || p.s - q.s);
  for (const hr of hairs) {
    hand.lay(
      hr.pts,
      (_x, _y, s) => hairWidth(s / hr.L, hr.root, 0.5),
      ink('brow', 'skin', 4, 'flick'),
    );
  }
}

/**
 * Inside the opening, fixed to the face: the caruncle at the inner corner, the plica
 * beside it, the corner's flesh in stipple, and the tear meniscus along the lower lid.
 */
function openDetail(hand: Hand, S: number, C: Curves) {
  const { yU, yL } = C;
  const inOpen = (x: number, y: number) => Math.abs(x) <= 1 && y >= yU(x) && y <= yL(x);
  const meta = ink('detail-open', 'lid', 4, 'contour');
  // The caruncle: a small wet mound, lit from the upper left. Its outline is heavier
  // underneath; curved hatching gathers on its shaded side; its lit shoulder stays paper.
  const [mx, my, rx, ry] = [-0.915, 0.04, 0.065, 0.05];
  hand.lay(
    byAngle(mx, my, rx, ry, -2.4, -2.4 + TAU, S),
    (x, y) => (inOpen(x, y) ? 0.3 + 0.24 * smooth(my - 0.03, my + ry, y) : 0),
    meta,
    { gapSplit: 1e9, taper: 3 },
  );
  for (let k = 1; k <= 7; k++) {
    const f = k / 8;
    hand.lay(
      byAngle(mx + 0.016 * f, my + 0.012 * f, rx * (1 - f * 0.8), ry * (1 - f * 0.8), -0.5, 2.3, S),
      (x, y, s) => (inOpen(x, y) ? cutWidth(0.62 - f * 0.32, 1.6, 9500 + k, s) : 0),
      meta,
      { taper: 4 },
    );
  }
  // The plica: the fold the white turns under, drawn fine.
  hand.lay(
    byParam(Math.ceil(0.34 * S), (t) => {
      const y = -0.15 + t * 0.32;
      return [plicaX(y), y];
    }),
    (x, y) => (inOpen(x, y) ? 0.4 : 0),
    meta,
    { taper: 6 },
  );
  // The corner's flesh, in stipple: dense in the lids' shadow and against the plica,
  // thin on the open ground, none on the mound.
  const cell = 2.6;
  const r = HAIRLINE * 2;
  const stipple: { x: number; y: number; r: number; k: number }[] = [];
  for (let gy = Math.floor((-0.2 * S) / cell); gy <= Math.ceil((0.18 * S) / cell); gy++) {
    for (let gx = Math.floor((-1 * S) / cell); gx <= Math.ceil((-0.74 * S) / cell); gx++) {
      const x = ((gx + 0.5 + (hash2(gx, gy, 5) - 0.5) * 0.7) * cell) / S;
      const y = ((gy + 0.5 + (hash2(gx, gy, 9) - 0.5) * 0.7) * cell) / S;
      if (!inOpen(x, y) || x >= plicaX(y) - 0.004) continue;
      if (Math.hypot((x - mx) / rx, (y - my) / ry) < 1.12) continue;
      const tone =
        0.2 +
        (1 - smooth(0, 0.07, y - yU(x))) * 0.5 +
        (1 - smooth(0, 0.03, plicaX(y) - x)) * 0.3 +
        (1 - smooth(0, 0.03, yL(x) - y)) * 0.2;
      if (hash2(gx, gy, 13) > tone) continue;
      stipple.push({ x, y, r: r * (0.8 + hash2(gx, gy, 17) * 0.4), k: hash2(gx, gy, 23) });
    }
  }
  // Dotted all over at once, the way a hand stipples, not row by row.
  stipple.sort((p, q) => p.k - q.k);
  hand.dots(
    stipple.flatMap((d) => [d.x, d.y]),
    stipple.map((d) => d.r),
    meta,
  );
  // The tear meniscus: a wet line of light along the lower lid; its top edge is drawn.
  hand.lay(
    byX(-0.8, 0.88, S, (x) => yL(x) - 0.016),
    (x, y) => (inOpen(x, y) ? 0.3 : 0),
    meta,
    { taper: 8 },
  );
}

/** The resting curves and socket, kept so a blink rebuilds only the lid that moves. */
export type LidBase = { curves: Curves; orbit: Orbit };
export const lidBase = (pose: Pose = REST): LidBase => {
  const curves = curvesFor(pose);
  return { curves, orbit: orbitFor(curves) };
};

/**
 * The upper lid alone, for an aperture: its band and its shade crossed, its margin, its
 * lashes, and what it covers in the corner. The live eye redraws only these as it blinks.
 */
export function lidStrokes(
  S: number,
  pose: Pose,
  o: { pitch?: number; step?: number; base?: LidBase } = {},
): Stroke[] {
  const hand = new Hand(S);
  const base = o.base ?? lidBase({ ...pose, open: 1 });
  const C = curvesFor(pose, base.curves);
  const T = tonesFor(C, pose);
  const step = o.step ?? 1;
  const P = o.pitch ?? pitchFor(S);
  lidBand(hand, S, P, C, base.orbit, T.lid, step);
  lidCross(hand, S, P, C, base.orbit, T.lid, step);
  whiteShadeLines(hand, S, P, C, T.whiteShade, step);
  lidContours(hand, S, C, step);
  upperLashes(hand, S, C, step);
  openDetail(hand, S, C);
  return hand.out;
}

// ── the hand's timing ───────────────────────────────────────────────────────

/**
 * When each family is laid, s, at speed 1. The plate's order: construction, contour,
 * hatching, cross-hatching and detail, the plate. Families of one pass overlap, the way
 * a hand moves on before the last stroke of a passage has dried.
 */
export const EYE_TIMELINE: Readonly<Record<string, readonly [number, number]>> = {
  'cons-1': [0.0, 0.3],
  'cons-2': [0.2, 0.38],
  'cons-3': [0.3, 0.92],
  'cons-4': [0.8, 1.04],
  'cons-5': [0.98, 1.26],
  'cons-6': [1.14, 1.32],
  'cons-7': [1.22, 1.42],
  'cons-8': [1.3, 1.62],
  'contour-lid': [1.5, 1.98],
  'contour-lower': [1.86, 2.26],
  'contour-crease': [2.12, 2.42],
  'contour-iris': [2.34, 2.72],
  'hatch-band': [2.62, 3.4],
  pillow: [2.7, 3.3],
  orbit: [2.74, 3.86],
  'hatch-sclera': [2.95, 3.78],
  'hatch-spokes': [3.1, 3.86],
  'orbit-cross': [3.62, 4.4],
  'lid-cross': [3.66, 4.2],
  'white-shade': [3.7, 4.28],
  'pillow-cross': [3.7, 4.2],
  iris: [3.74, 4.3],
  vessels: [3.96, 4.26],
  'lashes-upper': [3.84, 4.5],
  'lashes-lower': [4.14, 4.5],
  brow: [3.9, 4.86],
  detail: [4.36, 4.74],
  'detail-open': [4.3, 4.66],
  pupil: [4.7, 5.06],
  star: [5.1, 5.46],
  glaze: [5.4, 5.58],
};

/** When each pass begins, s at speed 1 (for a caption that names the pass being drawn). */
export const EYE_PASSES = [0, 1.5, 2.62, 3.62, 4.7] as const;

/** Pen speeds, px/s, and the shortest and longest a stroke may take, s. */
const PENS: Record<Pen, { speed: number; min: number; max: number }> = {
  chalk: { speed: 1100, min: 0.07, max: 0.42 },
  contour: { speed: 720, min: 0.14, max: 0.5 },
  hatch: { speed: 2600, min: 0.05, max: 0.3 },
  flick: { speed: 900, min: 0.04, max: 0.11 },
  fill: { speed: 1800, min: 0.03, max: 0.42 },
};

/**
 * Give every stroke its start and its length in time. Within a family the strokes
 * start evenly across its window, so the first begins with it and the last ends
 * with it; each takes as long as its pen needs over its length.
 * Returns the time the last stroke ends.
 */
export function scheduleEye(strokes: Stroke[], timeline = EYE_TIMELINE): number {
  const groups = new Map<string, Stroke[]>();
  for (const st of strokes) {
    const g = groups.get(st.group);
    if (g) g.push(st);
    else groups.set(st.group, [st]);
  }
  let end = 0;
  for (const [name, list] of groups) {
    const [g0, g1] = timeline[name] ?? [0, 0.4];
    const span = Math.max(0.01, g1 - g0);
    const drawn = list.filter((st) => st.to >= st.from);
    const n = drawn.length;
    drawn.forEach((st, i) => {
      const pen = PENS[st.pen];
      const len = st.to - st.from + 1;
      let dur = clamp(len / pen.speed, pen.min, pen.max);
      if (n <= 2 && st.pen === 'contour') dur = span * (n === 1 ? 1 : 0.72);
      dur = Math.min(dur, span);
      st.dur = dur;
      st.t0 = n > 1 ? g0 + ((span - dur) * i) / (n - 1) : g0;
      end = Math.max(end, st.t0 + st.dur);
    });
    for (const st of list) {
      if (st.to < st.from) {
        st.t0 = 0;
        st.dur = 0;
      }
    }
  }
  return end;
}
