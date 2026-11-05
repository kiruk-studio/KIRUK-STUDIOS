/**
 * The pen's vocabulary: how a burin hand lays any line, for any subject.
 *
 *   cut     a line whose width is its tone. In the light it is a hairline,
 *           continuous, the way an engraver lightens a passage by thinning the
 *           cut. In the shade it swells until neighbouring lines merge into black.
 *           Only at the very faintest does it break, into long uneven flicks.
 *   taper   every inked run enters thin and leaves thin, as the tool bites and lifts.
 *           A line never ends in a flat, clipped edge.
 *   swell   a slow change of pressure along each line, so no two cuts are alike.
 *   grain   chalk skips on the paper's tooth. The construction is crumbly, not
 *           ruled, so it reads as the hand's underdrawing beneath the ink.
 *   hair    a flicked stroke, heavy at the root and a hairline at the tip
 *           (brow, lashes, the needles of the star).
 *
 * Families are laid by subjects (subjects/eye/strokes.ts). The pen (ink.ts) draws
 * them at a hand's pace. Strokes are sampled about a CSS pixel apart, in CSS px
 * from the subject's centre.
 *
 * Learned from engraved plates (anatomical eyes, Fornasetti's eye, a vintage
 * crossed-hatched eye): tone by width before tone by spacing; long lines that
 * follow the form; curved cross-hatching only where the form turns away; whites
 * left as paper.
 *
 * spec-link: ideas/studio-dawn/ink-strokes.md
 */

/** What a stroke lays down: ink, the chalk of the construction, or paper (a highlight kept clear). */
export type StrokeInk = 'ink' | 'chalk' | 'clear';
/** How a stroke lives once drawn: the construction, fixed skin, the turning globe, the blinking lid. */
export type StrokeLayer = 'cons' | 'skin' | 'ball' | 'lid';
/** How the pen moves along a stroke. */
export type Pen = 'chalk' | 'contour' | 'hatch' | 'flick' | 'fill';

export interface Stroke {
  /** Samples, CSS px from the subject's centre: x0, y0, x1, y1, … about one px apart. */
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
  /** The samples a resting subject shows (strokes that reach under something, for motion). */
  from: number;
  to: number;
  /** 1 where the resting subject shows the sample (wet ink is masked, not clipped). */
  vis?: Uint8Array;
  /** A closed outline filled when the stroke is done, CSS px. */
  fill?: Float32Array;
  /** Clipped to the pupil or the iris as well as to the lids. */
  clip?: 'pupil' | 'iris';
  /** Opacity of a fill. */
  alpha?: number;
  /** Set by the schedule: when the pen starts it, and how long it takes, s. */
  t0: number;
  dur: number;
}

// ── small maths ─────────────────────────────────────────────────────────────

export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const fract = (x: number) => x - Math.floor(x);
/** The GPU's hash (gpu/lines hash1), so a family's jitter matches the plate's. */
export const hash1 = (x: number) => fract(Math.sin(x * 91.3458) * 47453.5453);

export function hash2(ix: number, iy: number, seed: number) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth value noise on a unit lattice, 0…1. */
export function vnoise(x: number, y: number, seed: number) {
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

// ── widths ──────────────────────────────────────────────────────────────────

/** The finest line the burin leaves, half-width CSS px. */
export const HAIRLINE = 0.21;
/** Below this tone a cut breaks into flicks; below FAINT it is paper. */
const FLICK = 0.1;
const FAINT = 0.018;

/**
 * A cut's half-width for a tone (0 paper … 1 black; a little over 1 is allowed).
 * At full tone a sliver of paper still shows between neighbours: black is made by
 * crossing a second family, never by flooding one.
 *   pitch  px to the next line of its family: at full tone the line fills it
 *   idx    the line's number, so each cut has its own weight and rhythm
 *   s      px along the line
 */
export function cutWidth(t: number, pitch: number, idx: number, s: number) {
  if (!(t > FAINT)) return 0;
  const tt = Math.min(t, 1.15);
  const jitter = 0.88 + hash1(idx * 1.37 + 0.5) * 0.24;
  if (tt < FLICK) {
    // The faintest: long uneven flicks of hairline; the gaps grow as the tone fades.
    const period = 9 + hash1(idx + 4.1) * 15;
    const u = s / period + hash1(idx * 3.3);
    const k = Math.floor(u);
    const duty = 0.16 + smooth(FAINT, FLICK, tt) * 0.72 + (hash1(k * 1.7 + idx) - 0.5) * 0.18;
    const f = u - k;
    if (f > duty) return 0;
    return HAIRLINE * (0.7 + tt * 3) * Math.sin((f / duty) * Math.PI) ** 0.6 * jitter;
  }
  const swell = 1 + (vnoise(s / 46 + idx * 7.3, idx * 0.71, 3) - 0.5) * 0.24;
  const v = Math.min(1, (tt - FLICK) / (1 - FLICK));
  return mix(HAIRLINE, pitch * 0.47, v ** 1.25) * jitter * swell;
}

/** Chalk on the paper's tooth: a soft, crumbly line that skips where the tooth stands up. */
export function chalkWidth(base: number, s: number, idx: number) {
  const g = vnoise(s / 2.6 + idx * 9.1, idx * 0.37, 17);
  if (g < 0.2) return 0;
  const pressure = 0.8 + vnoise(s / 60 + idx * 2.3, 1.5, 19) * 0.45;
  return base * (0.6 + 0.55 * g) * pressure;
}

/** A hair along its length (u 0 root … 1 tip): heavy at the root, a hairline at the tip. */
export function hairWidth(u: number, root: number, sharp = 0.7) {
  const tip = (1 - clamp(u, 0, 1)) ** sharp;
  const bite = 0.55 + 0.45 * smooth(0, 0.08, u);
  return Math.max(root * tip * bite, u < 0.985 ? HAIRLINE * 0.7 : 0);
}

// ── laying strokes ──────────────────────────────────────────────────────────

export type Meta = Pick<Stroke, 'ink' | 'layer' | 'pass' | 'group' | 'pen'> &
  Partial<Pick<Stroke, 'clip' | 'alpha'>>;

/** Half-width of a sample: subject units (x, y) and px along the stroke (s). */
export type WidthAt = (x: number, y: number, s: number) => number;
/** Whether the resting subject shows a sample. */
export type Shown = (x: number, y: number) => boolean;

export interface LayOpts {
  /** Ball strokes: which samples the resting subject shows. */
  shown?: Shown;
  /** A pen-up stretch longer than this (px) splits the line into two strokes. */
  gapSplit?: number;
  /** Sampling step, px. */
  step?: number;
  /** Taper every inked run over this many px at each end (0: the width function owns its ends). */
  taper?: number;
}

/** Lays curves as strokes, in the subject's units, scaled by S to CSS px. */
export class Hand {
  out: Stroke[] = [];
  constructor(readonly S: number) {}

  /**
   * Lay one line: resample a curve (subject units) every `step` px, give each
   * sample its half-width, taper each inked run, drop the pen-up ends, split where
   * the pen would travel a long way lifted, and keep what is left.
   */
  lay(curve: number[], width: WidthAt, meta: Meta, o: LayOpts = {}) {
    const S = this.S;
    const step = o.step ?? 1;
    const gapSplit = o.gapSplit ?? 14;
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
    if (o.taper && o.taper > 0) taperRuns(w, step, o.taper);
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
      this.push(xs, ys, w, i, lastInk, meta, o.shown);
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
        // Never seen at rest: the hand skips it; a moving subject still has it.
        from = 0;
        to = -1;
      }
    }
    this.out.push({ ...meta, p, n, w: ww, from, to, vis, t0: 0, dur: 0 });
  }

  /**
   * Stipple: dots (subject units) laid as one stroke, in the order given, each its own
   * touch of the pen (an empty sample between dots lifts it).
   */
  dots(pts: readonly number[], radii: readonly number[], meta: Meta) {
    const S = this.S;
    const k = radii.length;
    if (k < 1) return;
    const p = new Float32Array(k * 4);
    const n = new Float32Array(k * 4);
    const w = new Float32Array(k * 2);
    for (let i = 0; i < k; i++) {
      p[4 * i] = p[4 * i + 2] = pts[2 * i] * S;
      p[4 * i + 1] = p[4 * i + 3] = pts[2 * i + 1] * S;
      n[4 * i + 1] = n[4 * i + 3] = 1;
      w[2 * i] = radii[i];
    }
    this.out.push({ ...meta, p, n, w, from: 0, to: 2 * k - 2, t0: 0, dur: 0 });
  }

  /** A filled outline (subject units) with nothing to draw on the way: it lands when its time comes. */
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

/**
 * Taper each inked run (a stretch of samples with ink) over `len` px at both ends:
 * the burin enters thin and leaves thin, so no line ends in a clipped edge.
 */
export function taperRuns(w: Float32Array, step: number, len: number) {
  const m = w.length;
  let i = 0;
  while (i < m) {
    while (i < m && !(w[i] > 0)) i++;
    if (i >= m) break;
    let j = i;
    while (j + 1 < m && w[j + 1] > 0) j++;
    const run = (j - i) * step;
    const L = Math.min(len, run / 2);
    if (L > 0.5) {
      for (let k = i; k <= j; k++) {
        const d = Math.min(k - i, j - k) * step;
        if (d < L) w[k] *= Math.sin((Math.PI / 2) * (d / L)) ** 0.75;
      }
    }
    i = j + 1;
  }
}

// ── curves (subject units) ──────────────────────────────────────────────────

/** Points along y = f(x), dense enough to resample. */
export function byX(x0: number, x1: number, S: number, f: (x: number) => number) {
  const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) * S * 0.75));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    out.push(x, f(x));
  }
  return out;
}
/** Points round an ellipse from angle a0 to a1 (screen angles, y down); r scales the radius by angle. */
export function byAngle(
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
export function byParam(n: number, f: (t: number) => readonly [number, number]) {
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
