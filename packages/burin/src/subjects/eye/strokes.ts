/**
 * The engraved eye as strokes — the third writing of the same eye.
 *
 * rig.ts holds the eye in numbers; shader.ts cuts it as line fields on the GPU;
 * this file lays it as a list of strokes in the order a hand makes them, so a
 * pen can draw it at a pace:
 *
 *   I    construction, in chalk: the axis, the corners, the globe swung by
 *        compass with its parallels and meridians, the iris, the lids, the
 *        crease, the brow, the orbit (the plate's own ① – ⑧)
 *   II   contour: the lash line, the lower lid, the crease, the limbus, the pupil
 *   III  hatching: the lid's band, the skin above the crease and below the lid,
 *        arcs on the white, spokes in the iris
 *   IV   cross-hatching and detail: the diagonal family in the deep shade, the
 *        iris rings and collarette, vessels, lashes and brow as flicked hairs,
 *        crow's feet, the plica, the lower fold
 *   V    the plate: the pupil inked round the kiruk star, and the cornea's window
 *
 * The families, their tones and their widths follow shader.ts: a line swells in
 * shade and thins in light, and in the lightest passages it breaks into dots and
 * flicks (gpu/lines engrave). What the GPU decides per pixel is decided here per
 * sample along each line. Change one writing, change the others.
 *
 * Layers say how each stroke lives once the eye is drawn:
 *   cons  the chalk underdrawing, faded under the ink
 *   skin  everything that never moves (brow, skin, crease, lower lid)
 *   ball  the globe: white and iris, moved by the gaze, clipped by the lids
 *   lid   the upper lid: its band, its margin, its lashes, redrawn as it blinks
 *
 * Units: CSS px from the eye's centre (x right, y down). S is CSS px per eye unit.
 * Pure TypeScript, no DOM: it runs in a worker.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md · ideas/studio-dawn/eye.md
 */
import { LOGOGRAM_FILLS, LOGOGRAM_NEEDLES, LOGOGRAM_VIEW } from '../../logogram';
import { brow, crease, EYE, GLOBE, lowerLid, type Pose, REST, skewBump, upperLid } from './rig';

/** What a stroke lays down: ink, the chalk of the construction, or paper (a highlight kept clear). */
export type StrokeInk = 'ink' | 'chalk' | 'clear';
export type StrokeLayer = 'cons' | 'skin' | 'ball' | 'lid';
/** How the pen moves along a stroke. */
export type Pen = 'chalk' | 'contour' | 'hatch' | 'flick' | 'fill';

export interface Stroke {
  /** Samples, CSS px from the eye's centre: x0, y0, x1, y1, … about one px apart. */
  p: Float32Array;
  /** Unit normal at each sample, interleaved like p. */
  n: Float32Array;
  /** Half-width at each sample, CSS px. 0 lifts the pen: a gap. */
  w: Float32Array;
  ink: StrokeInk;
  layer: StrokeLayer;
  /** I … V */
  pass: 1 | 2 | 3 | 4 | 5;
  /** The family it belongs to; the hand lays a family in its own window of time. */
  group: string;
  pen: Pen;
  /** The samples the resting eye shows (ball strokes reach under the lids, for the gaze). */
  from: number;
  to: number;
  /** Ball strokes: 1 where the resting lids show the sample (wet ink is masked, not clipped). */
  vis?: Uint8Array;
  /** A closed outline filled when the stroke is done (the pupil, the star's points), CSS px. */
  fill?: Float32Array;
  /** Clipped to the pupil or the iris as well as to the lids (the star, the cornea's window). */
  clip?: 'pupil' | 'iris';
  /** Opacity of a fill (the window is cleared to 0.92, as on the plate). */
  alpha?: number;
  /** Set by the schedule: when the pen starts it, and how long it takes, s. */
  t0: number;
  dur: number;
}

export interface EyeDrawing {
  strokes: Stroke[];
  S: number;
  pitch: number;
  pose: Pose;
  /** The lids' opening as a closed outline, px: the upper lid out, the lower lid back. */
  opening: Float32Array;
  /** The opening the white shows through: its lower edge sits above the tear meniscus. */
  window: Float32Array;
  /** The pupil's outline and the iris's, px (clips for the star and the cornea's window). */
  pupil: Float32Array;
  iris: Float32Array;
  /** When the hand lifts the pen for the last time, s at speed 1. */
  end: number;
}

// ── small maths, the shader's own ──────────────────────────────────────────

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const fract = (x: number) => x - Math.floor(x);
/** The GPU's hash (gpu/lines hash1), so a family's jitter matches the plate's. */
const hash1 = (x: number) => fract(Math.sin(x * 91.3458) * 47453.5453);

function hash2(ix: number, iy: number, seed: number) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth value noise on a unit lattice, 0…1. */
function vnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
/** The shader's n0 channels, in eye units: r the lines' wobble, g patina, a the fade's edge. */
const n0r = (x: number, y: number) => vnoise(x * 2.3 + 7.1, y * 2.3 + 3.7, 11);
const n0g = (x: number, y: number) => vnoise(x * 5.1 + 1.3, y * 5.1 + 9.2, 23);
const n0a = (x: number, y: number) => vnoise(x * 1.6 + 4.4, y * 1.6 + 2.2, 37);

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

/**
 * The burin's width for a tone (gpu/lines engrave): half-width in CSS px, 0 for a gap.
 *   t      tone, 0 paper … 1 solid
 *   pitch  px between this line and the next
 *   idx    the line's number (each cut is its own: a little heavier or lighter)
 *   psi    along the line, in dash lengths
 */
export function burinWidth(t: number, pitch: number, idx: number, psi: number) {
  if (!(t > 0.012)) return 0;
  const tt = Math.min(t, 1);
  const jitter = hash1(idx) * 0.3 + 0.85;
  const burr = (hash1(idx * 7.13 + Math.floor(psi * 2.7)) - 0.5) * 0.14 + 1;
  const full = mix(0.2, pitch * 0.52, tt ** 1.12) * jitter * burr;
  const light = smooth(0.24, 0.32, tt);
  if (light >= 1) return full;
  // Dot and flick: below ~0.3 the line is cut as lozenges whose length follows the tone.
  const duty = clamp(tt / 0.3, 0.07, 1);
  const dp = fract(psi + hash1(idx + 17.31));
  if (dp >= duty) return light > 0.5 ? full * light : 0;
  const lozenge = Math.sin((dp / duty) * Math.PI) ** 0.55 * 1.25;
  return full * mix(lozenge, 1, light);
}

// ── the eye's curves for a pose, as lookup tables (rig.ts is the truth) ─────

const LUT_X0 = -2;
const LUT_N = 2001;
const LUT_DX = 4 / (LUT_N - 1);

function lut(f: (x: number) => number) {
  const t = new Float32Array(LUT_N);
  for (let i = 0; i < LUT_N; i++) t[i] = f(LUT_X0 + i * LUT_DX);
  return (x: number) => {
    const u = clamp((x - LUT_X0) / LUT_DX, 0, LUT_N - 1.001);
    const i = u | 0;
    const k = u - i;
    return t[i] + (t[i + 1] - t[i]) * k;
  };
}

const midline = (x: number) => mix(EYE.canthus.inY, EYE.canthus.outY, (x + 1) / 2);
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
  kU: Curve;
  kL: Curve;
  kC: Curve;
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
  const yC = lut((x) => crease(x, pose));
  return { gy: pose.gy, yU, yL, yC, yB: lut(brow), kU, kL: slopeOf(yL), kC: slopeOf(yC) };
}

/** The tones of the plate, for a pose, under the resting light (shader.ts, region by region). */
function tonesFor(c: Curves, pose: Pose) {
  const { yU, yL, yC, yB } = c;
  const b = EYE.brow;
  const ic: [number, number] = [EYE.iris.gx * pose.gx, EYE.iris.gy * pose.gy + EYE.iris.cy];
  const rxy: [number, number] = [
    EYE.iris.R * Math.cos(pose.gx * 0.61) ** 0.9,
    EYE.iris.R * Math.cos(pose.gy * 0.44),
  ];
  const inOpen = (x: number, y: number) => Math.abs(x) <= 1 && y >= yU(x) && y <= yL(x);
  /** Outside the opening and off the lid's pale margin: where the skin's lines may run. */
  const onSkin = (x: number, y: number) => {
    if (Math.abs(x) > 1) return true;
    const u = yU(x);
    return y < u - marginAt(x) || y > yL(x);
  };
  const castLid = (x: number, y: number) => {
    const k = 0.075 / LZ;
    return smooth(-0.014, 0.014, yU(x + SUN[0] * k) - (y + SUN[1] * k));
  };
  const lashShadow = (x: number, y: number) => {
    const k = 0.17 / LZ;
    const qx = x + SUN[0] * k;
    const qy = y + SUN[1] * k;
    const yl = yU(qx);
    return qy >= yl - 0.15 &&
      qy <= yl - 0.006 &&
      hash1(Math.floor(qx * 48)) >= 0.42 &&
      Math.abs(qx) <= 0.95
      ? 1
      : 0;
  };
  const browHalf = (x: number) => mix(b.w0, b.w1, clamp((x - b.x0) / (b.x1 - b.x0), 0, 1) ** 0.85);
  const browCast = (x: number, y: number) => {
    if (y < yB(x)) return 0;
    const k = 0.13 / LZ;
    const qx = x + SUN[0] * k;
    const qy = y + SUN[1] * k;
    const h = browHalf(qx);
    return (
      (1 - smooth(h * 0.6, h * 1.4, Math.abs(qy - yB(qx)))) *
      smooth(b.x0 - 0.05, b.x0 + 0.12, qx) *
      (1 - smooth(b.x1 - 0.2, b.x1 + 0.05, qx))
    );
  };
  const browMass = (x: number, y: number) =>
    Math.exp(-(((y - yB(x)) / (browHalf(x) * 1.25)) ** 2)) *
    smooth(b.x0 - 0.05, b.x0 + 0.15, x) *
    (1 - smooth(b.x1 - 0.25, b.x1 + 0.05, x));
  const corners = (x: number, y: number) =>
    gauss(x + 1.07, y + 0.22, 0.05, 0.22) * 0.38 + gauss(x - 1.08, y + 0.03, 0.04, 0.07) * 0.3;
  const fadeAt = (x: number, y: number) =>
    1 -
    smooth(0.8, 1.0, Math.hypot((x - 0.06) / 1.52, (y + 0.22) / 1.18) + (n0a(x, y) - 0.5) * 0.16);
  const foldReach = clamp(-SUN[1] / LZ, 0.3, 1.6) * 0.3;

  /** The skin: above the crease, on the lid's band, or below the lower lid (shader Tskin). */
  const skin = (x: number, y: number) => {
    let T: number;
    if (y <= midline(x)) {
      const cc = yC(x);
      if (y <= cc) {
        const dC = cc - y;
        const sB = clamp(dC / Math.max(cc - yB(x), 0.2), 0, 1);
        const hollow = shade(x * 0.35, mix(0.5, -0.45, smooth(0.15, 0.85, sB)));
        T =
          Math.exp(-dC / 0.1) * 0.46 +
          smooth(0.1, 1.15, x) * Math.exp(-dC / 0.32) * 0.12 +
          hollow * 0.55 +
          browCast(x, y) * 0.3;
      } else {
        const u = yU(x);
        const band = Math.max(u - cc, 0.03);
        const tl = clamp((u - y) / band, 0, 1);
        const lidShade = shade(x * 0.45, mix(0.55, -0.22, smooth(0, 0.85, tl)));
        T =
          0.07 +
          smooth(-0.35, 1.05, x) * 0.12 +
          (1 - smooth(0, 0.16, tl)) * 0.26 +
          tl * 0.08 +
          smooth(1 - foldReach, 1, tl) * 0.28 +
          lidShade * 0.6;
      }
    } else {
      const dLo = Math.max(y - yL(x), 0);
      const lowNy =
        dLo < 0.165 ? mix(-0.45, 0.35, dLo / 0.165) : mix(0.35, -0.25, smooth(0.165, 0.45, dLo));
      T =
        Math.exp(-dLo / 0.045) * 0.42 +
        Math.exp(-((dLo - 0.17) ** 2) / 0.004) * 0.2 +
        smooth(0.25, 1.1, x) * Math.exp(-dLo / 0.3) * 0.08 +
        shade(x * 0.35, lowNy) * 0.5;
    }
    const bm = browMass(x, y);
    return (T + corners(x, y) + bm * 0.3) * Math.max(fadeAt(x, y), bm * 0.9);
  };

  /**
   * The white (shader Ts): contact shade under the lid, its cast shadow, the corners, the
   * globe. The lids' shade is read at the nearest point the opening shows, so the white
   * that waits under the lids for the gaze comes into view as a continuation of the
   * white, not as the shadow it sat in.
   */
  const sclera = (x: number, y: number) => {
    const svx = x - ic[0];
    const svy = (y - ic[1]) * 1.08;
    const gdx = x / 1.12;
    const gdy = (y - 0.02) / 0.92;
    const gz = Math.sqrt(Math.max(1 - gdx * gdx - gdy * gdy, 0.03));
    const shadeGlobe =
      SUN[2] - (gdx * SUN[0] + gdy * SUN[1] + gz * SUN[2]) / Math.hypot(gdx, gdy, gz);
    const xs = clamp(x, -0.97, 0.97);
    const ys = clamp(y, yU(xs), yL(xs));
    const out = Math.hypot(Math.max(Math.abs(x) - 1, 0), Math.max(yU(xs) - y, y - yL(xs), 0));
    const lids = 1 - smooth(0, 0.12, out);
    return (
      -0.04 +
      ((1 - smooth(0, 0.045, ys - yU(xs))) * 0.3 +
        castLid(xs, ys) * 0.5 +
        lashShadow(xs, ys) * 0.22 +
        smooth(0.5, 1.0, Math.abs(xs)) * 0.3) *
        lids +
      smooth(0.45, 1.0, Math.hypot(svx * 0.8, svy * 1.25)) * 0.18 +
      shadeGlobe * 0.75 +
      (n0g(x, y) - 0.5) * 0.08
    );
  };

  /** The iris (shader Ti): streaks, crypts, a dark rim, the lid's shade, the limbal glow. */
  const iris = (x: number, y: number) => {
    const qx = (x - ic[0]) / rxy[0];
    const qy = (y - ic[1]) / rxy[1];
    const r = Math.hypot(qx, qy);
    const th = Math.atan2(qy, qx);
    const streak = vnoise((th / TAU) * 15 + 2, r * 1.05 + 5, 51);
    const cu = (th / TAU) * 26;
    const ci = Math.floor(cu);
    const rc = 0.66 + hash1(ci + 11.1) * 0.14;
    const crypt =
      hash1(ci + 5.5) >= 0.38
        ? 1 -
          smooth(
            0.7,
            1.0,
            Math.hypot((fract(cu) - 0.5) / 0.36, (r - rc) / (0.06 + hash1(ci + 3.3) * 0.04)),
          )
        : 0;
    return (
      0.4 +
      (r <= 0.54 ? 0.16 : 0) +
      (streak - 0.5) * 0.42 +
      crypt * 0.42 +
      smooth(0.8, 0.99, r) * 0.5 +
      (1 - smooth(0, 0.06, y - yU(x))) * 0.2 +
      castLid(x, y) * 0.36 +
      ((qx * SUN[0] + qy * SUN[1]) / LXY) * 0.11
    );
  };

  return { ic, rxy, inOpen, onSkin, skin, sclera, iris, fadeAt };
}

/** The pupil's crenellated ruff, as a radius in iris units (shader: ruffR). */
const ruffAt = (th: number, pupilK: number) =>
  pupilK + 0.045 + Math.sin(th * 42) * 0.012 + hash1(Math.floor(fract(th / TAU) * 42)) * 0.012;

// ── laying strokes ──────────────────────────────────────────────────────────

type Meta = Pick<Stroke, 'ink' | 'layer' | 'pass' | 'group' | 'pen'> &
  Partial<Pick<Stroke, 'clip' | 'alpha'>>;

/** Half-width of a sample: eye units (x, y) and px along the stroke (s). */
type WidthAt = (x: number, y: number, s: number) => number;
/** Whether the resting eye shows a sample (ball strokes only). */
type Shown = (x: number, y: number) => boolean;

class Hand {
  out: Stroke[] = [];
  constructor(readonly S: number) {}

  /**
   * Lay one line: resample a curve (eye units) every `step` px, give each sample
   * its half-width, drop the pen-up ends, split where the pen would travel a long
   * way lifted, and keep what is left.
   */
  lay(curve: number[], width: WidthAt, meta: Meta, shown?: Shown, gapSplit = 14, step = 1) {
    const S = this.S;
    const n0 = curve.length / 2;
    if (n0 < 1) return;
    const xs: number[] = [];
    const ys: number[] = [];
    const ss: number[] = [];
    if (n0 === 1) {
      xs.push(curve[0]);
      ys.push(curve[1]);
      ss.push(0);
    }
    let acc = 0;
    let next = 0;
    for (let i = 0; i < n0 - 1; i++) {
      const ax = curve[2 * i];
      const ay = curve[2 * i + 1];
      const bx = curve[2 * i + 2];
      const by = curve[2 * i + 3];
      const L = Math.hypot(bx - ax, by - ay) * S;
      while (next <= acc + L) {
        const t = L > 0 ? (next - acc) / L : 0;
        xs.push(ax + (bx - ax) * t);
        ys.push(ay + (by - ay) * t);
        ss.push(next);
        next += step;
      }
      acc += L;
    }
    const m = xs.length;
    if (m < 1) return;
    const w = new Float32Array(m);
    for (let i = 0; i < m; i++) w[i] = Math.max(0, width(xs[i], ys[i], ss[i]) || 0);
    let i = 0;
    while (i < m) {
      while (i < m && !(w[i] > 0)) i++;
      if (i >= m) break;
      let j = i;
      let lastInk = i;
      while (j < m) {
        if (w[j] > 0) lastInk = j;
        else if ((j - lastInk) * step > gapSplit) break;
        j++;
      }
      this.push(xs, ys, w, i, lastInk, meta, shown);
      i = j;
    }
  }

  private push(
    xs: number[],
    ys: number[],
    w: Float32Array,
    a: number,
    b: number,
    meta: Meta,
    shown?: Shown,
  ) {
    const S = this.S;
    const k = b - a + 1;
    const p = new Float32Array(k * 2);
    const n = new Float32Array(k * 2);
    const ww = new Float32Array(k);
    for (let i = 0; i < k; i++) {
      p[2 * i] = xs[a + i] * S;
      p[2 * i + 1] = ys[a + i] * S;
      ww[i] = w[a + i];
    }
    for (let i = 0; i < k; i++) {
      const q = Math.min(k - 1, i + 1);
      const r = Math.max(0, i - 1);
      const dx = p[2 * q] - p[2 * r];
      const dy = p[2 * q + 1] - p[2 * r + 1];
      const d = Math.hypot(dx, dy);
      n[2 * i] = d > 0 ? -dy / d : 0;
      n[2 * i + 1] = d > 0 ? dx / d : 1;
    }
    let from = 0;
    let to = k - 1;
    let vis: Uint8Array | undefined;
    if (shown) {
      from = -1;
      vis = new Uint8Array(k);
      for (let i = 0; i < k; i++) {
        if (shown(xs[a + i], ys[a + i])) {
          vis[i] = 1;
          if (ww[i] > 0) {
            if (from < 0) from = i;
            to = i;
          }
        }
      }
      if (from < 0) {
        // Never seen at rest: the hand skips it, the live eye still has it for the gaze.
        from = 0;
        to = -1;
      }
    }
    this.out.push({ ...meta, p, n, w: ww, from, to, vis, t0: 0, dur: 0 });
  }

  /** A filled outline (eye units) with nothing to draw on the way: it lands when its time comes. */
  fill(poly: number[], meta: Meta, at: readonly [number, number]) {
    const S = this.S;
    const f = new Float32Array(poly.length);
    for (let i = 0; i < poly.length; i++) f[i] = poly[i] * S;
    this.out.push({
      ...meta,
      p: new Float32Array([at[0] * S, at[1] * S]),
      n: new Float32Array([0, 1]),
      w: new Float32Array([0]),
      from: 0,
      to: 0,
      fill: f,
      t0: 0,
      dur: 0,
    });
  }
}

/** Points along y = f(x), dense enough to resample (eye units). */
function byX(x0: number, x1: number, S: number, f: (x: number) => number) {
  const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) * S * 0.75));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    out.push(x, f(x));
  }
  return out;
}
/** Points round an ellipse from angle a0 to a1 (screen angles, y down); r scales the radius by angle. */
function byAngle(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  S: number,
  r?: (a: number) => number,
) {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) * S * 0.75));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const k = r ? r(a) : 1;
    out.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
  }
  return out;
}
function byParam(n: number, f: (t: number) => readonly [number, number]) {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = f(i / n);
    out.push(x, y);
  }
  return out;
}

/** Absolute M/L/H/V/C/Z path data → polygons, in the path's own units. */
export function parseAbsPath(d: string): number[][] {
  const tok = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const polys: number[][] = [];
  let cur: number[] = [];
  let x = 0;
  let y = 0;
  let i = 0;
  let cmd = '';
  const num = () => Number(tok[i++]);
  while (i < tok.length) {
    const t = tok[i];
    if (/^[MLHVCZ]$/i.test(t)) {
      cmd = t.toUpperCase();
      i++;
      if (cmd === 'Z') {
        if (cur.length) polys.push(cur);
        cur = [];
      }
      continue;
    }
    if (cmd === 'M') {
      if (cur.length) polys.push(cur);
      x = num();
      y = num();
      cur = [x, y];
      cmd = 'L';
    } else if (cmd === 'L') {
      x = num();
      y = num();
      cur.push(x, y);
    } else if (cmd === 'H') {
      x = num();
      cur.push(x, y);
    } else if (cmd === 'V') {
      y = num();
      cur.push(x, y);
    } else if (cmd === 'C') {
      const x1 = num();
      const y1 = num();
      const x2 = num();
      const y2 = num();
      const x3 = num();
      const y3 = num();
      for (let k = 1; k <= 8; k++) {
        const t = k / 8;
        const u = 1 - t;
        cur.push(
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        );
      }
      x = x3;
      y = y3;
    } else i++;
  }
  if (cur.length) polys.push(cur);
  return polys;
}

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

/** The pitch for an eye drawn at S: a big eye is cut a little coarser, as a big plate was. */
export const pitchFor = (S: number) => clamp(3.4 + (S - 200) * 0.004, 3.2, 4.2);

const ink = (
  group: string,
  layer: StrokeLayer,
  pass: Stroke['pass'],
  pen: Pen,
  extra: Partial<Meta> = {},
): Meta => ({ ink: 'ink', layer, pass, group, pen, ...extra });

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
  const T = tonesFor(C, pose);
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
  const shownBall = (x: number, y: number) => Math.abs(x) <= 1 && y >= yU(x) && y <= yL(x) - 0.016;
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
  const HAIR = 0.45; // half-width, px (the plate's `near`)
  /** The centre line's long-short dash, every 22 px. */
  const centreDash = (s: number) => {
    const f = fract(s / 22);
    return f < 0.55 || (f > 0.68 && f < 0.78) ? HAIR : 0;
  };
  /** Hidden lines dashed (6 on, 4 off); lines the opening shows are lighter, and kept off the cornea. */
  const hiddenDash = (x: number, y: number, s: number) => {
    if (T.inOpen(x, y)) return rOf(x, y) <= 1.02 ? 0 : HAIR * 0.7;
    return fract(s / 10) < 0.6 ? HAIR : 0;
  };
  // ① the axis: the centre lines through the globe
  hand.lay(
    byX(-1.5, 1.5, S, () => GLOBE.cy),
    (_x, _y, s) => centreDash(s),
    chalk('cons-1'),
  );
  hand.lay(
    byParam(Math.ceil(2.38 * S), (t) => [GLOBE.cx, -1.38 + t * 2.38]),
    (_x, _y, s) => centreDash(s),
    chalk('cons-1'),
  );
  // ② the corners
  for (const cx of [-1, 1])
    hand.lay(
      byParam(Math.ceil(0.9 * S), (t) => [cx, -0.45 + t * 0.9]),
      () => HAIR,
      chalk('cons-2'),
    );
  // ③ the globe, swung by compass from the upper left, then its parallels and meridians
  const R = GLOBE.R;
  hand.lay(
    byAngle(GLOBE.cx, GLOBE.cy, R, R, -2.0, -2.0 + TAU, S),
    hiddenDash,
    chalk('cons-3'),
    undefined,
    1e9,
  );
  for (let k = 1; k <= 5; k++) {
    const rr = R * Math.sin((k * Math.PI) / 12);
    hand.lay(
      byAngle(GLOBE.cx, GLOBE.cy, rr, rr, -Math.PI / 2, -Math.PI / 2 + TAU, S),
      hiddenDash,
      chalk('cons-3'),
      undefined,
      1e9,
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
      hiddenDash,
      chalk('cons-3'),
      undefined,
      1e9,
    );
  }
  // ④ the iris and the pupil, with a cross on the pole
  hand.lay(byAngle(ic[0], ic[1], rxy[0], rxy[1], -2.2, -2.2 + TAU, S), () => HAIR, chalk('cons-4'));
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0] * pupilK, rxy[1] * pupilK, -2.2, -2.2 + TAU, S),
    () => HAIR,
    chalk('cons-4'),
  );
  hand.lay(
    byX(ic[0] - 0.07, ic[0] + 0.07, S, () => ic[1]),
    () => HAIR,
    chalk('cons-4'),
  );
  hand.lay(
    byParam(Math.ceil(0.14 * S), (t) => [ic[0], ic[1] - 0.07 + t * 0.14]),
    () => HAIR,
    chalk('cons-4'),
  );
  // ⑤ the lids, ⑥ the crease, ⑦ the brow
  hand.lay(byX(-1.25, 1.25, S, yU), () => HAIR, chalk('cons-5'));
  hand.lay(byX(-1.25, 1.25, S, yL), () => HAIR, chalk('cons-5'));
  hand.lay(byX(-1.25, 1.25, S, yC), () => HAIR, chalk('cons-6'));
  hand.lay(byX(b.x0 - 0.05, b.x1 + 0.05, S, yB), () => HAIR, chalk('cons-7'));
  // ⑧ the orbit, the socket's rim, dashed
  hand.lay(
    byAngle(0.05, -0.22, 1.46, 1.1, Math.PI * 0.95, Math.PI * 0.95 + TAU, S),
    (_x, _y, s) => (fract(s / 10) < 0.6 ? HAIR * 0.85 : 0),
    chalk('cons-8'),
    undefined,
    1e9,
  );

  // ── II · contours ──
  lidContours(hand, S, C);
  {
    const taperL = (x: number) => 1 - smooth(0.84, 1.03, Math.abs(x));
    hand.lay(
      byX(-1.04, 1.04, S, yL),
      (x) => 0.7 * taperL(x) + 0.1,
      ink('contour-lower', 'skin', 2, 'contour'),
    );
    hand.lay(
      byX(-1.04, 1.04, S, (x) => yL(x) + 0.03),
      (x) => (0.95 * taperL(x) + 0.1) * 0.85,
      ink('contour-lower', 'skin', 2, 'contour'),
    );
    const taperC = (x: number) => 1 - smooth(0.9, 1.16, Math.abs(x));
    hand.lay(
      byX(-1.16, 1.16, S, yC),
      (x) => (0.6 + (1 - smooth(-0.6, 0.6, x)) * 0.8) * taperC(x),
      ink('contour-crease', 'skin', 2, 'contour'),
    );
  }
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0], rxy[1], -2.2, -2.2 + TAU, S),
    () => 1.05,
    ink('contour-iris', 'ball', 2, 'contour'),
    shownBall,
    1e9,
  );
  hand.lay(
    byAngle(ic[0], ic[1], rxy[0] * pupilK, rxy[1] * pupilK, -2.2, -2.2 + TAU, S),
    () => 0.9,
    ink('contour-iris', 'ball', 2, 'contour'),
    shownBall,
    1e9,
  );

  // ── III · hatching ──
  // The lid's band: copies of the lid's own curve, compressing into the crease.
  lidBand(hand, S, P, C, T.skin);
  // Above the crease: copies of the crease, rising to the brow.
  {
    const top = -1.52;
    const M = Math.ceil((yC(0) - top) * (S / P)) + 6;
    for (let m = 1; m <= M; m++) {
      const curve = byX(-1.72, 1.74, S, (x) => {
        const c = yC(x);
        return c - ((m - (n0r(x, c - (m * P) / S) - 0.5) * 0.55) * P) / S;
      });
      hand.lay(
        curve,
        (x, y, s) => {
          if (y > yC(x) || y < top || y > midline(x) || !T.onSkin(x, y)) return 0;
          return burinWidth(T.skin(x, y), P / C.kC(x), 3000 + m, s / 7);
        },
        ink('hatch-above', 'skin', 3, 'hatch'),
      );
    }
  }
  // Below the lower lid: copies of the lid, falling away down the cheek.
  {
    const K = Math.ceil(1.16 * (S / P)) + 2;
    for (let k = 1; k <= K; k++) {
      const curve = byX(-1.72, 1.74, S, (x) => {
        const l = yL(x);
        return l + ((k - (n0r(x, l + (k * P) / S) - 0.5) * 0.55) * P) / S;
      });
      hand.lay(
        curve,
        (x, y, s) => {
          if (y <= midline(x) || y < yL(x) || y > 1.16 || !T.onSkin(x, y)) return 0;
          return burinWidth(T.skin(x, y), P / C.kL(x), 5000 + k, s / 7);
        },
        ink('hatch-below', 'skin', 3, 'hatch'),
      );
    }
  }
  // The white: arcs about the iris, the eyeball's curvature. Each in two halves, top to
  // bottom, so the hand cuts the side the lids show, not the part they hide.
  {
    const k0 = Math.floor((0.3 * S) / P);
    const k1 = Math.ceil((1.32 * S) / P);
    for (let k = k0; k <= k1; k++) {
      const rr = (k * P) / S;
      for (const [a0, a1] of [
        [-Math.PI / 2, Math.PI / 2],
        [Math.PI * 1.5, Math.PI / 2],
      ] as const) {
        hand.lay(
          byAngle(ic[0], ic[1], rr, rr / 1.08, a0, a1, S),
          (x, y, s) => {
            if (rOf(x, y) <= 1 || !underLids(x, y)) return 0;
            return burinWidth(T.sclera(x, y), P / 1.04, k, s / 7);
          },
          ink('hatch-sclera', 'ball', 3, 'hatch'),
          shownBall,
        );
      }
    }
  }
  // The iris: spokes converging on the pupil, cut from the rim inward.
  {
    const NSP = Math.max(Math.floor((RS * TAU * 0.72) / P), 24);
    for (let j = 0; j < NSP; j++) {
      const th = (j * TAU) / NSP - Math.PI / 2;
      hand.lay(
        byParam(Math.ceil((1 - pupilK) * RS * 1.5), (t) => fromQ(mix(1, pupilK, t), th)),
        (x, y) => {
          const r = rOf(x, y);
          if (r > 1 || r < pupilK) return 0;
          return burinWidth(T.iris(x, y), (TAU * r * RS) / NSP, j, (r * RS) / 5);
        },
        ink('hatch-spokes', 'ball', 3, 'hatch'),
        shownBall,
      );
    }
  }

  // ── IV · cross-hatching and detail ──
  // The diagonal family, cut across the first where the shade is deepest.
  {
    const g = 1.2 * P;
    const c0 = Math.floor((-2.2 * S) / g);
    const c1 = Math.ceil((1.9 * S) / g);
    for (let k = c0; k <= c1; k++) {
      const c = (k * g) / S;
      const curve = byParam(Math.ceil(4.4 * S * 0.4), (t) => {
        const u = -2.2 + t * 4.4;
        const x0 = c * 0.5 + u * 0.866;
        const y0 = c * 0.866 - u * 0.5;
        const off = (-(n0r(x0, y0) - 0.5) * 0.55 * 0.6 * g) / S;
        return [x0 + off * 0.5, y0 + off * 0.866];
      });
      hand.lay(
        curve,
        (x, y, s) => {
          if (x < -1.66 || x > 1.66 || y < -1.52 || y > 1.16 || !T.onSkin(x, y)) return 0;
          return burinWidth((T.skin(x, y) - 0.44) / 0.56, g, 9000 + k, s / 7);
        },
        ink('cross', 'skin', 4, 'hatch'),
        undefined,
        14,
        1.5,
      );
    }
  }
  // The iris's rings (in the dark only), the collarette, the contraction furrows.
  {
    const kr0 = Math.ceil((pupilK * RS) / (0.82 * P));
    const kr1 = Math.floor(RS / (0.82 * P));
    for (let k = kr0; k <= kr1; k++) {
      const rr = (k * 0.82 * P) / RS;
      hand.lay(
        byAngle(ic[0], ic[1], rxy[0] * rr, rxy[1] * rr, -Math.PI / 2, -Math.PI / 2 + TAU, S),
        (x, y, s) => burinWidth((T.iris(x, y) - 0.5) * 1.6, 0.82 * P, 700 + k, s / 6),
        ink('rings', 'ball', 4, 'hatch'),
        shownBall,
      );
    }
    hand.lay(
      byAngle(
        ic[0],
        ic[1],
        rxy[0],
        rxy[1],
        -Math.PI / 2,
        -Math.PI / 2 + TAU,
        S,
        (a) => 0.54 + Math.sin(a * 13) * 0.035,
      ),
      () => 0.95,
      ink('rings', 'ball', 4, 'contour'),
      shownBall,
      1e9,
    );
    for (const [rr, seed] of [
      [0.86, 7],
      [0.925, 13],
    ] as const) {
      hand.lay(
        byAngle(ic[0], ic[1], rxy[0] * rr, rxy[1] * rr, -Math.PI / 2, -Math.PI / 2 + TAU, S),
        (x, y) => (fract((thOf(x, y) * 2.3) / Math.PI + hash1(seed)) >= 0.42 ? 0.5 : 0),
        ink('rings', 'ball', 4, 'hatch'),
        shownBall,
      );
    }
  }
  // A few vessels, fine and wandering, toward the corners only.
  for (let i = -9; i < 9; i++) {
    if (hash1(i + 41) < 0.58) continue;
    const curve = byParam(Math.ceil(0.8 * S), (t) => {
      const sr = mix(0.42, 1.18, t);
      let a = (i * Math.PI) / 9;
      for (let it = 0; it < 2; it++) {
        const x = ic[0] + Math.cos(a) * sr;
        const y = ic[1] + (Math.sin(a) * sr) / 1.08;
        a = ((i - (n0r(x, y) - 0.5) * 3.2 - Math.sin(sr * 17) * 0.16) * Math.PI) / 9;
      }
      return [ic[0] + Math.cos(a) * sr, ic[1] + (Math.sin(a) * sr) / 1.08];
    });
    hand.lay(
      curve,
      (x, y) => {
        if (rOf(x, y) <= 1 || !underLids(x, y)) return 0;
        const sr = Math.hypot(x - ic[0], (y - ic[1]) * 1.08);
        return 0.32 * 0.85 * smooth(0.62, 0.95, Math.abs(x)) * smooth(0.42, 0.62, sr);
      },
      ink('vessels', 'ball', 4, 'hatch'),
      shownBall,
    );
  }
  // Lashes, flicked from the lash line, inner corner to outer.
  upperLashes(hand, S, C);
  {
    const NL = 48;
    const x0 = -0.66;
    const dx = 1.62 / NL;
    for (let i = 0; i < NL; i++) {
      const xr = x0 + (i + 0.5 + (hash1(i + 311) - 0.5) * 0.7) * dx;
      if (xr < x0 || xr > 0.97) continue;
      const len = 0.024 + Math.max(skewBump(xr, 0.3, 1), 0) * 0.045 + hash1(i + 377) * 0.035;
      const sl = xr * 0.35 + 0.1 + (hash1(i + 401) - 0.5) * 0.5;
      const Lpx = len * S * Math.hypot(sl, 1);
      hand.lay(
        byParam(Math.max(3, Math.ceil(Lpx * 1.5)), (t) => {
          const v = t * len;
          const x = xr + sl * v;
          return [x, yL(x) + 0.03 + v];
        }),
        (_x, _y, s) => (1 - clamp(s / Lpx, 0, 1)) ** 0.7 * 0.85,
        ink('lashes-lower', 'skin', 4, 'flick'),
      );
    }
  }
  // The brow: four layers of hair, each a tapered, bent stroke, swept from its head to its tail.
  {
    const span = b.x1 - b.x0;
    const NH = 96;
    const ang = (s: number) => mix(mix(-1.15, -0.26, smooth(0, 0.3, s)), 0.2, smooth(0.62, 1, s));
    const hairs: {
      root: [number, number];
      dir: [number, number];
      L: number;
      bend: number;
      s: number;
    }[] = [];
    for (let layer = 0; layer < 4; layer++) {
      for (let j = -2; j < NH + 2; j++) {
        const s = (j + layer / 4 + (hash1(j + layer * 211) - 0.5) * 0.5) / NH;
        if (s < 0 || s > 1) continue;
        const xr = b.x0 + s * span;
        const half = mix(b.w0, b.w1, clamp(s, 0, 1) ** 0.85);
        const qr = hash1(j + layer * 97 + 13) * 1.7 - 0.95;
        const a0 = ang(s) + (hash1(j + layer * 53 + 7) - 0.5) * 0.32;
        const L = mix(0.19, 0.12, smooth(0.3, 1, s)) * (hash1(j + layer * 29) * 0.4 + 0.78);
        const bend = (hash1(j + layer * 31 + 3) - 0.35) * 2.4;
        hairs.push({
          root: [xr, yB(xr) + qr * half],
          dir: [Math.cos(a0), Math.sin(a0)],
          L,
          bend,
          s,
        });
      }
    }
    hairs.sort((p, q) => p.root[0] - q.root[0]);
    for (const h of hairs) {
      const nx = h.dir[1];
      const ny = -h.dir[0];
      const Lpx = h.L * S;
      hand.lay(
        byParam(Math.max(3, Math.ceil(Lpx * 1.5)), (t) => {
          const a = t * h.L;
          return [
            h.root[0] + h.dir[0] * a + nx * h.bend * a * a,
            h.root[1] + h.dir[1] * a + ny * h.bend * a * a,
          ];
        }),
        (_x, _y, s) => (1 - clamp(s / Lpx, 0, 1)) ** 0.55 * (1.05 + (1 - h.s) * 0.25),
        ink('brow', 'skin', 4, 'flick'),
      );
    }
  }
  // Crow's feet, the lower lid's fold, the lacrimal punctum.
  for (const [a, len, bend] of [
    [-0.62, 0.3, 0.6],
    [-0.3, 0.38, 0.4],
    [0.04, 0.34, -0.2],
    [0.34, 0.26, -0.5],
  ] as const) {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const Lpx = (len - 0.06) * S;
    hand.lay(
      byParam(Math.ceil(Lpx * 1.2), (t) => {
        const u = 0.06 + t * (len - 0.06);
        return [1.03 + ca * u + sa * bend * u * u, -0.02 + sa * u - ca * bend * u * u];
      }),
      (x, y, s) => (1 - clamp(s / Lpx, 0, 1)) ** 0.7 * 0.6 * T.fadeAt(x, y),
      ink('detail', 'skin', 4, 'flick'),
    );
  }
  hand.lay(
    byX(-0.9, 1.0, S, (x) => yL(x) + 0.165),
    (x) => 0.5 * (1 - smooth(0.5, 0.88, Math.abs(x - 0.08))),
    ink('detail', 'skin', 4, 'contour'),
  );
  hand.lay(
    byAngle(-0.8, 0.171, 1.8 / S, 1.8 / S, 0, TAU, S),
    () => 0.5,
    ink('detail', 'skin', 4, 'contour'),
    undefined,
    1e9,
  );
  openDetail(hand, S, C);

  // ── V · the plate: the pupil inked round the kiruk star; the cornea's window ──
  const pupilOutline: number[] = [];
  {
    const NP = Math.max(48, Math.ceil(pupilK * RS * TAU));
    for (let i = 0; i < NP; i++) {
      const th = (i / NP) * TAU;
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
    hand.lay(curve, () => hw, ink('pupil', 'ball', 5, 'fill'), undefined, 1e9);
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
    const needleW = Math.max((v.stroke / 2 / v.size) * starD * S, 0.35);
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
    window: openingOutline(S, pose, 0.016),
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
  hand.lay(
    byX(-1.04, 1.04, S, (x) => yU(x) - marginAt(x)),
    (x) => (1.3 + (1 - x * x) * 1.25) * taperU(x) + 0.15,
    meta,
    undefined,
    14,
    step,
  );
  hand.lay(byX(-1.0, 1.0, S, yU), (x) => 0.42 * taperU(x) + 0.05, meta, undefined, 14, step);
}

function lidBand(
  hand: Hand,
  S: number,
  P: number,
  C: Curves,
  skin: (x: number, y: number) => number,
  step = 1,
) {
  const { yU, yC, kU } = C;
  const nBand = Math.max(2, Math.floor((S * 0.39) / P + 0.5));
  for (let j = 1; j < nBand; j++) {
    const curve = byX(-1.45, 1.5, S, (x) => {
      const u = yU(x);
      const band = Math.max(u - yC(x), 0.03);
      return u - ((j - (n0r(x, u - (j * band) / nBand) - 0.5) * 0.55) * band) / nBand;
    });
    hand.lay(
      curve,
      (x, y, s) => {
        const u = yU(x);
        if (y > midline(x) || y < yC(x) || (Math.abs(x) <= 1 && y >= u - marginAt(x))) return 0;
        const band = Math.max(u - yC(x), 0.03);
        return burinWidth(skin(x, y), (band * S) / nBand / kU(x), 1000 + j, s / 7);
      },
      ink('hatch-band', 'lid', 3, 'hatch'),
      undefined,
      14,
      step,
    );
  }
}

function upperLashes(hand: Hand, S: number, C: Curves, step = 1) {
  const { yU } = C;
  const NL = 92;
  const lx0 = -0.9;
  const ldx = 1.9 / NL;
  const list: { xr: number; i: number; rf: number }[] = [];
  for (let rf = 0; rf < 2; rf++)
    for (let i = 0; i < NL; i++)
      list.push({
        i,
        rf,
        xr: lx0 + (i + 0.5 + rf * 0.5 + (hash1(i + rf * 101) - 0.5) * 0.6) * ldx,
      });
  list.sort((a, b) => a.xr - b.xr);
  for (const { xr, i, rf } of list) {
    if (xr < -0.92 || xr > 1.0) continue;
    const lenB = Math.max(skewBump(xr, 0.28, 1.0), 0);
    const len = (0.07 + lenB * 0.115 + hash1(i + rf * 31 + 57) * 0.045) * mix(1, 0.72, rf);
    const sl = xr * 0.55 + 0.18 + (hash1(i + rf * 13 + 9) - 0.5) * 0.28;
    const curl = 3.4 + hash1(i + rf * 7 + 23) * 1.4;
    // Lashes clump: the tips of four or five lean together.
    const cc = lx0 + (Math.floor(i / 4) * 4 + 2) * ldx;
    const curve = byParam(Math.max(4, Math.ceil(len * S * 2)), (t) => {
      const v = t * len;
      const x = xr + sl * v + sl * v * v * curl + (cc - xr) * 0.38 * t * t;
      return [x, yU(x) - marginAt(x) - v];
    });
    let total = 0;
    for (let q = 2; q < curve.length; q += 2)
      total += Math.hypot(curve[q] - curve[q - 2], curve[q + 1] - curve[q - 1]) * S;
    const w0 = mix(1.2, 0.9, rf);
    hand.lay(
      curve,
      (_x, _y, s) => (1 - clamp(s / Math.max(total, 1), 0, 1)) ** 0.62 * w0,
      ink('lashes-upper', 'lid', 4, 'flick'),
      undefined,
      14,
      step,
    );
  }
}

/** Inside the opening, fixed to the face: the plica at the inner corner, and the tear meniscus. */
function openDetail(hand: Hand, S: number, C: Curves) {
  const { yU, yL } = C;
  const inOpen = (x: number, y: number) => Math.abs(x) <= 1 && y >= yU(x) && y <= yL(x);
  const meta = ink('detail-open', 'lid', 4, 'contour');
  const xp = (y: number) => -0.8 + ((y - 0.07) / 0.14) ** 2 * 0.06;
  hand.lay(
    byParam(Math.ceil(0.26 * S), (t) => {
      const y = 0.07 - 0.13 + t * 0.26;
      return [xp(y), y];
    }),
    (x, y) => (inOpen(x, y) ? 0.55 : 0),
    meta,
  );
  // Stipple beside the plica: a jittered grid of dots, each its own touch of the pen.
  const cell = 2.6;
  const r = Math.sqrt(0.26) * cell * 0.42;
  const dots = ink('detail-open', 'lid', 4, 'flick');
  for (
    let gy = Math.floor(((0.07 - 0.13) * S) / cell);
    gy <= Math.ceil(((0.07 + 0.13) * S) / cell);
    gy++
  ) {
    for (let gx = Math.floor((-1.0 * S) / cell); gx <= Math.ceil((-0.72 * S) / cell); gx++) {
      const x = ((gx + 0.5 + (hash2(gx, gy, 5) - 0.5) * 0.55) * cell) / S;
      const y = ((gy + 0.5 + (hash2(gx, gy, 9) - 0.5) * 0.55) * cell) / S;
      if (Math.abs(y - 0.07) > 0.13 || x >= xp(y) || x <= -0.97 || !inOpen(x, y)) continue;
      hand.lay([x, y], () => r, dots);
    }
  }
  // The tear meniscus: a wet line of light along the lower lid; its top edge is drawn.
  hand.lay(
    byX(-0.88, 0.88, S, (x) => yL(x) - 0.016),
    (x, y) => (inOpen(x, y) ? 0.3 : 0),
    meta,
  );
}

/**
 * The upper lid alone, for an aperture: its band, its margin, its lashes, and what it
 * covers in the corner. The live eye redraws only these as it blinks.
 */
export function lidStrokes(
  S: number,
  pose: Pose,
  o: { pitch?: number; step?: number; base?: LidBase } = {},
): Stroke[] {
  const hand = new Hand(S);
  const C = curvesFor(pose, o.base?.curves);
  const T = tonesFor(C, pose);
  const step = o.step ?? 1;
  lidBand(hand, S, o.pitch ?? pitchFor(S), C, T.skin, step);
  lidContours(hand, S, C, step);
  upperLashes(hand, S, C, step);
  openDetail(hand, S, C);
  return hand.out;
}

/** The resting curves, kept so a blink rebuilds only the lid that moves. */
export type LidBase = { curves: Curves };
export const lidBase = (pose: Pose = REST): LidBase => ({ curves: curvesFor(pose) });

// ── the hand's timing ───────────────────────────────────────────────────────

/**
 * When each family is laid, s, at speed 1. The plate's order: construction, contour,
 * hatching, cross-hatching and hair, the plate. Families of one pass overlap, the way
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
  'hatch-above': [2.7, 3.72],
  'hatch-below': [2.8, 3.72],
  'hatch-sclera': [2.95, 3.78],
  'hatch-spokes': [3.1, 3.86],
  cross: [3.66, 4.3],
  rings: [3.74, 4.26],
  vessels: [3.96, 4.26],
  'lashes-upper': [3.84, 4.5],
  'lashes-lower': [4.14, 4.5],
  brow: [3.92, 4.78],
  detail: [4.36, 4.74],
  'detail-open': [4.3, 4.66],
  pupil: [4.7, 5.06],
  star: [5.1, 5.46],
  glaze: [5.4, 5.58],
};

/** When each pass begins, s at speed 1 (for a caption that names the pass being drawn). */
export const EYE_PASSES = [0, 1.5, 2.62, 3.66, 4.7] as const;

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
