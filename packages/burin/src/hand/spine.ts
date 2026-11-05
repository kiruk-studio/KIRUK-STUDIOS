/**
 * The spine of a stroke: the path the hand travels and how hard it presses along it.
 *
 * Every mark the hand makes is a spine first and a medium second. A spine is a list of
 * [x, y, pressure]; p5.brush draws it with a brush (quill, chalk, white), its width and
 * ink following the pressure. Keeping the spine separate from the brush means one gesture
 * can be drawn in any medium, and a recorded pen stroke (kirukal's pen samples) can be
 * replayed by any brush.
 *
 *   tremor     the hand is never a plotter: a slow lateral drift along the stroke
 *   pressure   profiles: swell (the burin's), flick (a hatch: firm, then lifted), drag (chalk)
 *   hatch      "hash strokes": parallel strokes clipped to a shape, broken into short flicks
 *              the way a pen hatches; left-handed (\) by default, as Leonardo's run
 *
 * Pure functions, no DOM, no GPU: they run in the worker and in tests.
 *
 * spec-link: ideas/studio-dawn/hand.md
 */

export type Pt = readonly [number, number];
export type SpinePt = [number, number, number];
export type Spine = SpinePt[];

/** A seeded hand: every random choice goes through it, so a seed is an impression. */
export type Rng = {
  /** uniform in [a, b) (or [0, a) with one argument) */
  R(a?: number, b?: number): number;
  /** gaussian, mean m, deviation s */
  G(m?: number, s?: number): number;
  pick<T>(xs: readonly T[]): T;
  chance(p: number): boolean;
};

export function rng(seed: number): Rng {
  let a = (seed | 0) ^ 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare: number | null = null;
  return {
    R: (x = 1, y?: number) => (y === undefined ? next() * x : x + next() * (y - x)),
    G(m = 0, s = 1) {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return m + s * v;
      }
      const u = Math.max(1e-9, next());
      const v = next();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return m + s * r * Math.cos(2 * Math.PI * v);
    },
    pick: (xs) => xs[Math.floor(next() * xs.length)]!,
    chance: (p) => next() < p,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Points every `step` along a polyline (arc length), ends kept. */
export function resample(pts: readonly Pt[], step: number): [number, number][] {
  const out: [number, number][] = [];
  if (pts.length === 0) return out;
  out.push([pts[0]![0], pts[0]![1]]);
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let s = step - carry;
    while (s <= L) {
      const t = s / L;
      out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
      s += step;
    }
    carry = L - (s - step);
  }
  const last = pts[pts.length - 1]!;
  const end = out[out.length - 1]!;
  if (Math.hypot(end[0] - last[0], end[1] - last[1]) > step * 0.25) out.push([last[0], last[1]]);
  return out;
}

/** Arc length of a polyline. */
export function length(pts: readonly Pt[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++)
    L += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  return L;
}

/**
 * The hand's tremor: a slow sideways drift along the stroke, a few cycles per stroke,
 * `amp` CSS px at most. Seeded, so the same impression trembles the same way.
 */
export function tremor(pts: readonly Pt[], amp: number, h: Rng, waves = 2.2): [number, number][] {
  const n = pts.length;
  if (n < 3 || amp <= 0) return pts.map((p) => [p[0], p[1]]);
  const ph1 = h.R(Math.PI * 2);
  const ph2 = h.R(Math.PI * 2);
  const k2 = h.R(1.7, 2.9);
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(n - 1, i + 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    const t = i / (n - 1);
    // Still at the ends (the pen is placed and lifted where it was meant to be).
    const env = Math.sin(Math.PI * t) ** 0.6;
    const w =
      amp *
      env *
      (0.7 * Math.sin(ph1 + t * Math.PI * 2 * waves) +
        0.3 * Math.sin(ph2 + t * Math.PI * 2 * waves * k2));
    return [p[0] - (dy / d) * w, p[1] + (dx / d) * w];
  });
}

/** Pressure along a stroke, t ∈ [0, 1] → 0 … 1.5. */
export type Pressure = (t: number) => number;

export const PRESSURE = {
  /** the burin's: enters thin, swells as it bites, leaves thin */
  swell: ((t) => 0.25 + 0.95 * Math.sin(Math.PI * t) ** 0.7) as Pressure,
  /** a hatch: set down firm, pulled, lifted at the end (a "hash" stroke) */
  flick: ((t) =>
    t < 0.12
      ? 0.75 + 2.5 * t
      : 1.05 * (1 - Math.max(0, t - 0.55) / 0.45) ** 1.4 + 0.08) as Pressure,
  /** chalk dragged on its side: heavy where it lands, thinning as it goes */
  drag: ((t) => 0.45 + 0.75 * (1 - t) ** 0.8 * Math.min(1, t * 10)) as Pressure,
  /** a searching line: light, a press in the middle, light again */
  search: ((t) => 0.35 + 0.65 * Math.sin(Math.PI * t) ** 1.6) as Pressure,
  /** even, for washes of white laid with the side of a brush */
  even: (() => 1) as Pressure,
};

/** Attach pressure to points by their arc-length position; `wobble` adds the hand's unevenness. */
export function spine(pts: readonly Pt[], pressure: Pressure, h?: Rng, wobble = 0.08): Spine {
  const L = length(pts) || 1;
  let s = 0;
  return pts.map((p, i) => {
    if (i > 0) s += Math.hypot(p[0] - pts[i - 1]![0], p[1] - pts[i - 1]![1]);
    const t = s / L;
    const w = h ? 1 + h.G(0, wobble) : 1;
    return [p[0], p[1], Math.max(0.05, pressure(t) * w)];
  });
}

/** A curve sampled from a function x(t), y(t), t ∈ [t0, t1]. */
export function curve(f: (t: number) => Pt, t0: number, t1: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const p = f(lerp(t0, t1, i / n));
    out.push([p[0], p[1]]);
  }
  return out;
}

/** Ray-cast point-in-polygon. */
export function inside(x: number, y: number, poly: readonly Pt[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1] || 1e-9) + a[0])
      c = !c;
  }
  return c;
}

export type HatchOptions = {
  /** stroke direction, radians on screen (y down). π/4 runs \ — left-handed, as Leonardo's */
  angle?: number;
  /** distance between strokes, CSS px */
  spacing: number;
  /** cut each chord into strokes this long (CSS px); 0 keeps whole chords */
  stroke?: number;
  /** gap between consecutive strokes on one line, CSS px */
  gap?: number;
  /** strokes start and end this far past or short of the shape (± CSS px) */
  overshoot?: number;
  /** each stroke bows sideways by up to this fraction of its length (the wrist's arc) */
  bow?: number;
  /** keep a stroke with this probability: thins the hatching toward the light */
  density?: (x: number, y: number) => number;
  pressure?: Pressure;
};

/**
 * Hatching clipped to a shape: parallel lines across it, each chord cut into short strokes
 * (the "hash" of a pen), each stroke bowed by the wrist, set down firm and lifted.
 * Returns spines in the shape's coordinates.
 */
export function hatch(poly: readonly Pt[], o: HatchOptions, h: Rng): Spine[] {
  const angle = o.angle ?? Math.PI / 4;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const nx = -uy;
  const ny = ux;
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const p of poly) {
    const o2 = p[0] * nx + p[1] * ny;
    lo = Math.min(lo, o2);
    hi = Math.max(hi, o2);
  }
  const out: Spine[] = [];
  const pressure = o.pressure ?? PRESSURE.flick;
  for (let off = lo + o.spacing * h.R(0.2, 0.8); off < hi; off += o.spacing * h.R(0.82, 1.18)) {
    // Where this line crosses the outline, ordered along the stroke direction.
    const ts: number[] = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[j]!;
      const b = poly[i]!;
      const da = a[0] * nx + a[1] * ny - off;
      const db = b[0] * nx + b[1] * ny - off;
      if (da > 0 === db > 0) continue;
      const t = da / (da - db);
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      ts.push(x * ux + y * uy);
    }
    ts.sort((p, q) => p - q);
    for (let k = 0; k + 1 < ts.length; k += 2) {
      const over = o.overshoot ?? 0;
      let s0 = ts[k]! - h.R(-over, over);
      const s1 = ts[k + 1]! + h.R(-over, over);
      const piece = o.stroke && o.stroke > 0 ? o.stroke : s1 - s0;
      while (s1 - s0 > 1.5) {
        const len = Math.min(s1 - s0, piece * h.R(0.75, 1.25));
        const a: Pt = [nx * off + ux * s0, ny * off + uy * s0];
        const b: Pt = [nx * off + ux * (s0 + len), ny * off + uy * (s0 + len)];
        const keep = o.density ? o.density((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) : 1;
        if (h.R() < keep) {
          const bow = (o.bow ?? 0.04) * len * h.G(0, 1);
          const pts = curve(
            (t) => {
              const c = Math.sin(Math.PI * t) * bow;
              return [lerp(a[0], b[0], t) + nx * c, lerp(a[1], b[1], t) + ny * c];
            },
            0,
            1,
            Math.max(2, Math.ceil(len / 3)),
          );
          out.push(spine(pts, pressure, h, 0.1));
        }
        s0 += len + (o.gap ?? piece * 0.35) * h.R(0.6, 1.4);
      }
    }
  }
  return out;
}

/**
 * Kirukal's pen samples ([x, y, pressure, tiltX, tiltY], packages/kirukal) as a spine, mapped
 * into page coordinates. The founder's own captured strokes can be redrawn by any brush.
 */
export function fromSamples(
  samples: readonly (readonly [number, number, number, ...number[]])[],
  map: (x: number, y: number) => Pt,
): Spine {
  return samples.map(([x, y, p]) => {
    const [px, py] = map(x, y);
    return [px, py, Math.max(0.05, p * 1.2)];
  });
}
