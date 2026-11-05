/**
 * The folio as a function: UI = f(W).
 *
 * After Shu Ding's "The Calculus of Interfaces" (Vercel Labs): the page's layout
 * is written once as weighted sums, products, ReLUs and steps — no branches — so
 * the same formula can be evaluated four ways:
 *
 *   exact     τ = 0, what the CSS draws
 *   soft      every step a sigmoid σ(a / sτ): a layout animation nobody wrote
 *   dual      value + ∂/∂W, forward-mode, for the margin's derivative plots
 *   interval  [lo, hi] over a whole range of widths, to prove a rule for all of them
 *
 * The CSS in folio.css draws the exact layout with clamp()/media/container
 * queries from the same constants; keep the two in step (K below is the source).
 *
 * spec-link: ideas/studio-dawn/folio.md — the margin
 */

export const K = {
  W_MIN: 320,
  W_MAX: 2560,
  /** The margin appears at this width (a jump). */
  RAIL_AT: 1180,
  RAIL_W: 296,
  RAIL_GAP: 42,
  /** The sheet stops growing here (a bend). */
  MAXW: 1680,
  PAD_MIN: 20,
  PAD_K: 0.04,
  PAD_MAX: 72,
  /** Notes flow in up to three columns, each at least NOTE_MIN wide (jumps). */
  NOTE_MIN: 260,
  /** 392 / 7.6 ≈ 51.6 characters: the measure cap that keeps the rule below true. */
  NOTE_MAX: 392,
  NOTE_GAP: 26,
  /** Average advance of IM Fell English at 17 px, in px per character. */
  CHAR: 7.6,
  /** Figures: a 1200-unit sheet on wide columns, a recomposed 420-unit sheet below this. */
  SHEET_AT: 720,
  SHEET_WIDE: 1200,
  SHEET_PHONE: 420,
  /** Plate I's ascender, in sheet units, on each sheet. */
  ASC_WIDE: 285,
  ASC_PHONE: 128,
} as const;

/** Rubric label size (sheet units) by column width — the container-query steps in folio.css. */
export const LABEL_STEPS = [
  { from: 1080, units: 13 },
  { from: 900, units: 15 },
  { from: 720, units: 18.5 },
  { from: 480, units: 12 },
  { from: 0, units: 17 },
] as const;

// ── number systems ──────────────────────────────────────────────────────────

export type Kind = 'jump' | 'bend';

export interface Ops<T> {
  c(v: number): T;
  add(a: T, b: T): T;
  sub(a: T, b: T): T;
  mul(a: T, b: T): T;
  k(a: T, k: number): T;
  /** 1[a ≥ 0] — a jump where a crosses zero. */
  step(a: T, tag: string): T;
  /** max(0, a) — a bend where a crosses zero. */
  relu(a: T, tag: string): T;
}

const min = <T>(o: Ops<T>, a: T, b: T, tag: string) => o.sub(a, o.relu(o.sub(a, b), tag));
const max = <T>(o: Ops<T>, a: T, b: T, tag: string) => o.add(a, o.relu(o.sub(b, a), tag));
const clamp = <T>(o: Ops<T>, lo: number, x: T, hi: number, tag: string) =>
  max(o, o.c(lo), min(o, x, o.c(hi), `${tag}·max`), `${tag}·min`);

export interface Layout<T> {
  pad: T;
  container: T;
  rail: T;
  main: T;
  cols: T;
  noteW: T;
  measure: T;
  sheet: T;
  heroAsc: T;
  labelPx: T;
}

/** The whole page, once, with no branches. */
export function layout<T>(o: Ops<T>, W: T): Layout<T> {
  const pad = clamp(o, K.PAD_MIN, o.k(W, K.PAD_K), K.PAD_MAX, 'padding');
  const container = min(o, W, o.c(K.MAXW), 'sheet max width');
  const rail = o.step(o.sub(W, o.c(K.RAIL_AT)), 'margin appears');
  const main = o.sub(o.sub(container, o.k(pad, 2)), o.k(rail, K.RAIL_W + K.RAIL_GAP));

  // Note columns: 1 + Σ 1[main + gap ≥ k (min + gap)], k = 2..3.
  let cols = o.c(1);
  for (let k = 2; k <= 3; k++) {
    cols = o.add(
      cols,
      o.step(
        o.sub(o.add(main, o.c(K.NOTE_GAP)), o.c(k * (K.NOTE_MIN + K.NOTE_GAP))),
        `${k} note columns`,
      ),
    );
  }
  // Width of one column for each count, blended by which count is on (one-hot).
  const e2 = o.step(
    o.sub(o.add(main, o.c(K.NOTE_GAP)), o.c(2 * (K.NOTE_MIN + K.NOTE_GAP))),
    '2 note columns',
  );
  const e3 = o.step(
    o.sub(o.add(main, o.c(K.NOTE_GAP)), o.c(3 * (K.NOTE_MIN + K.NOTE_GAP))),
    '3 note columns',
  );
  const w1 = main;
  const w2 = o.k(o.sub(main, o.c(K.NOTE_GAP)), 1 / 2);
  const w3 = o.k(o.sub(main, o.c(2 * K.NOTE_GAP)), 1 / 3);
  const one = o.sub(o.c(1), e2);
  const two = o.sub(e2, e3);
  const raw = o.add(o.add(o.mul(one, w1), o.mul(two, w2)), o.mul(e3, w3));
  const noteW = min(o, raw, o.c(K.NOTE_MAX), 'note measure cap');
  const measure = o.k(noteW, 1 / K.CHAR);

  // Figures: the wide sheet or the recomposed phone sheet.
  const wide = o.step(o.sub(main, o.c(K.SHEET_AT)), 'phone sheet → wide sheet');
  const sheet = o.add(o.k(wide, K.SHEET_WIDE), o.k(o.sub(o.c(1), wide), K.SHEET_PHONE));
  const heroAsc = o.add(
    o.k(o.mul(wide, main), K.ASC_WIDE / K.SHEET_WIDE),
    o.k(o.mul(o.sub(o.c(1), wide), main), K.ASC_PHONE / K.SHEET_PHONE),
  );

  // Label size: units by column width (a staircase of steps), times the sheet's scale.
  let units = o.c(LABEL_STEPS[LABEL_STEPS.length - 1]!.units);
  for (let i = LABEL_STEPS.length - 2; i >= 0; i--) {
    const s = LABEL_STEPS[i]!;
    const below = LABEL_STEPS[i + 1]!;
    units = o.add(
      units,
      o.k(o.step(o.sub(main, o.c(s.from)), `labels ${s.units}u`), s.units - below.units),
    );
  }
  const scale = o.add(o.k(wide, 1 / K.SHEET_WIDE), o.k(o.sub(o.c(1), wide), 1 / K.SHEET_PHONE));
  const labelPx = o.mul(o.mul(units, main), scale);

  return { pad, container, rail, main, cols, noteW, measure, sheet, heroAsc, labelPx };
}

// ── exact and softened ──────────────────────────────────────────────────────

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** τ = 0 is the page the CSS draws; τ > 0 softens every step into σ(a / sτ). */
export function numOps(tau = 0, s = 90): Ops<number> {
  const soft = tau > 1e-6;
  return {
    c: (v) => v,
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mul: (a, b) => a * b,
    k: (a, k) => a * k,
    step: (a) => (soft ? sigmoid(a / (s * tau)) : a >= 0 ? 1 : 0),
    relu: (a) => (soft ? a * sigmoid(a / (s * tau)) : Math.max(0, a)),
  };
}

export const at = (W: number, tau = 0) => layout(numOps(tau), W);

// ── dual numbers: value and ∂/∂W ────────────────────────────────────────────

export type Dual = { v: number; d: number };

export function dualOps(tau = 0, s = 90): Ops<Dual> {
  const soft = tau > 1e-6;
  return {
    c: (v) => ({ v, d: 0 }),
    add: (a, b) => ({ v: a.v + b.v, d: a.d + b.d }),
    sub: (a, b) => ({ v: a.v - b.v, d: a.d - b.d }),
    mul: (a, b) => ({ v: a.v * b.v, d: a.d * b.v + a.v * b.d }),
    k: (a, k) => ({ v: a.v * k, d: a.d * k }),
    step: (a) => {
      if (!soft) return { v: a.v >= 0 ? 1 : 0, d: 0 };
      const z = sigmoid(a.v / (s * tau));
      return { v: z, d: (z * (1 - z) * a.d) / (s * tau) };
    },
    relu: (a) => {
      if (!soft) return { v: Math.max(0, a.v), d: a.v >= 0 ? a.d : 0 };
      const z = sigmoid(a.v / (s * tau));
      return { v: a.v * z, d: a.d * z + (a.v * z * (1 - z) * a.d) / (s * tau) };
    },
  };
}

export const derivativeAt = (W: number, tau = 0) => layout(dualOps(tau), { v: W, d: 1 });

// ── breakpoints ─────────────────────────────────────────────────────────────

export type Breakpoint = { W: number; kind: Kind; tag: string };

/** Every width where a step flips (jump) or a ReLU bends, found exactly by bisection. */
export function breakpoints(lo: number = K.W_MIN, hi: number = K.W_MAX): Breakpoint[] {
  const signs = (W: number) => {
    const out = new Map<string, { kind: Kind; s: boolean }>();
    const o: Ops<number> = {
      ...numOps(0),
      step: (a, tag) => {
        out.set(`j:${tag}`, { kind: 'jump', s: a >= 0 });
        return a >= 0 ? 1 : 0;
      },
      relu: (a, tag) => {
        out.set(`b:${tag}`, { kind: 'bend', s: a >= 0 });
        return Math.max(0, a);
      },
    };
    layout(o, W);
    return out;
  };
  const found: Breakpoint[] = [];
  let prevW = lo;
  let prev = signs(lo);
  for (let W = lo + 1; W <= hi; W += 1) {
    const cur = signs(W);
    for (const [key, v] of cur) {
      const p = prev.get(key);
      if (p && p.s !== v.s) {
        let a = prevW;
        let b = W;
        for (let i = 0; i < 30; i++) {
          const m = (a + b) / 2;
          if (signs(m).get(key)?.s === p.s) a = m;
          else b = m;
        }
        const W0 = Math.round(((a + b) / 2) * 100) / 100;
        if (!found.some((f) => f.tag === key.slice(2) && Math.abs(f.W - W0) < 0.5)) {
          found.push({ W: W0, kind: v.kind, tag: key.slice(2) });
        }
      }
    }
    prev = cur;
    prevW = W;
  }
  return found.sort((x, y) => x.W - y.W);
}

// ── interval arithmetic: prove a rule for every width at once ───────────────

export type Iv = readonly [number, number];

export const ivOps: Ops<Iv> = {
  c: (v) => [v, v],
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[1], a[1] - b[0]],
  mul: (a, b) => {
    const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
    return [Math.min(...p), Math.max(...p)];
  },
  k: (a, k) => (k >= 0 ? [a[0] * k, a[1] * k] : [a[1] * k, a[0] * k]),
  step: (a) => (a[0] >= 0 ? [1, 1] : a[1] < 0 ? [0, 0] : [0, 1]),
  relu: (a) => [Math.max(0, a[0]), Math.max(0, a[1])],
};

export type Verdict = 'proven' | 'fails' | 'boundary';
export type Proof = {
  verdict: Verdict;
  segments: { lo: number; hi: number; v: Verdict }[];
  boxes: number;
};

/**
 * Branch and bound over [lo, hi]: g(W) ≤ 0 is the rule. If the upper bound of g
 * over a box is ≤ 0 the rule holds on the whole box; if the lower bound is > 0
 * it fails on all of it; otherwise split the box and try both halves.
 */
export function prove(
  g: (L: Layout<Iv>) => Iv,
  lo: number = K.W_MIN,
  hi: number = K.W_MAX,
  minWidth = 0.25,
): Proof {
  const segments: Proof['segments'] = [];
  let boxes = 0;
  const exact = (W: number) => g(layout(ivOps, [W, W]))[1];
  const visit = (a: number, b: number) => {
    boxes++;
    const r = g(layout(ivOps, [a, b]));
    if (r[1] <= 1e-9) return segments.push({ lo: a, hi: b, v: 'proven' });
    if (r[0] > 1e-9) return segments.push({ lo: a, hi: b, v: 'fails' });
    if (b - a <= minWidth) {
      // A box this small that still straddles is sitting on a jump: the step is [0, 1]
      // and the blend loses track of which side it is on. Each side is affine, so
      // check the exact value on both sides of the jump instead.
      const probes = Array.from({ length: 9 }, (_, i) => exact(a + ((b - a) * i) / 8));
      const v: Verdict = probes.every((p) => p <= 1e-9)
        ? 'proven'
        : probes.every((p) => p > 1e-9)
          ? 'fails'
          : 'boundary';
      return segments.push({ lo: a, hi: b, v });
    }
    const m = (a + b) / 2;
    visit(a, m);
    visit(m, b);
  };
  visit(lo, hi);
  // Merge neighbours with the same verdict so the margin can draw them as one stretch.
  const merged: Proof['segments'] = [];
  for (const s of segments) {
    const last = merged[merged.length - 1];
    if (last && last.v === s.v && Math.abs(last.hi - s.lo) < 1e-9) last.hi = s.hi;
    else merged.push({ ...s });
  }
  const verdict: Verdict = merged.every((s) => s.v === 'proven')
    ? 'proven'
    : merged.some((s) => s.v === 'fails')
      ? 'fails'
      : 'boundary';
  return { verdict, segments: merged, boxes };
}

/** The rules the margin proves, each written as g(W) ≤ 0. */
export const RULES = [
  {
    id: 'measure',
    text: 'Notes keep a 28–52 character measure',
    g: (L: Layout<Iv>): Iv => {
      const over = ivOps.sub(L.measure, ivOps.c(52));
      const under = ivOps.sub(ivOps.c(28), L.measure);
      return [Math.max(over[0], under[0]), Math.max(over[1], under[1])];
    },
  },
  {
    id: 'name',
    text: 'The name stands at least 64 px tall',
    g: (L: Layout<Iv>): Iv => ivOps.sub(ivOps.c(64), L.heroAsc),
  },
  {
    id: 'labels',
    text: 'No rubric label renders under 11 px',
    g: (L: Layout<Iv>): Iv => ivOps.sub(ivOps.c(11), L.labelPx),
  },
  {
    id: 'room',
    text: 'With the margin open, plates keep 640 px',
    g: (L: Layout<Iv>): Iv => ivOps.mul(L.rail, ivOps.sub(ivOps.c(640), L.main)),
  },
] as const;
