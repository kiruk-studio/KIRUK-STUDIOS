/**
 * Hatching — tone laid in lines, computed from the plate's one light.
 *
 * Built the way the research describes it:
 *   1  a general shadow over everything turned from the light (Leonardo ¶555), one family
 *      at the style's slope — for the codex, "\" top-left to bottom-right, the left hand's
 *   2  the darker zones deepened by lines laid between the first ones, then between those
 *      (no change of slope: cross-hatching only where the style allows it, research 01 R10)
 *   3  each stroke lands where the ink weight shows (the dark end), pulls toward the light
 *      and tapers; its ends are ragged so the lit edge stays a hand's edge (01 §1)
 *   4  pressure follows the tone along the stroke; strokes bow on the wrist's arc
 *
 * Every stroke records the tone it was asked to give and the form it describes, so the
 * critic can prove the light: darker target ⇒ more ink, everywhere.
 */
import { noise1 } from '../core/noise.ts';
import {
  bbox,
  cumulative,
  lengthOf,
  lineInsidePolygon,
  pointAt,
  pointInPolygon,
  signedArea,
} from '../core/path.ts';
import type { Rng } from '../core/rng.ts';
import { DEG, type MVec, type Vec } from '../core/vec.ts';
import type { Role } from '../hand/hand.ts';
import type { Mark, Plate } from '../plate/plate.ts';
import type { Form } from './forms.ts';
import { light2d } from './light.ts';

export interface HatchOptions {
  /** The form whose tone is laid. Registered on the plate for the lighting checks. */
  form: Form;
  /** Clip region (mm); defaults to the form's outline. */
  region?: MVec[];
  /** Override the tone field (0 lit … 1 dark). */
  tone?: (p: Vec) => number;
  /** 'parallel' (one slope), 'contour' (follow the form), 'stipple' (dots). */
  manner?: 'parallel' | 'contour' | 'stipple';
  /** Slope in degrees (page, y down). Defaults to the style's. */
  slope?: number;
  /** Widest line gap (the first pass), mm. Defaults to the style's. */
  gap?: number;
  /** Tone below which the paper is left (the light). */
  threshold?: number;
  /** Tones at which the deepening passes begin. */
  deepen?: readonly [number, number];
  /** Allow a crossing family (if the style allows cross-hatching). */
  cross?: boolean;
  role?: Role;
  id?: string;
  /** Strength of pressure, 0..1. */
  pressure?: number;
  /** For contour hatching: the line seeds are spread along (a → b). */
  seedLine?: readonly [Vec, Vec];
  /** Shortest stroke the hand will lay, mm (default 2.1; a narrow channel needs less). */
  minSpan?: number;
}

interface Span {
  pts: MVec[];
  tones: number[];
}

/** Sample a polyline every `step` mm with the tone at each point. */
function toneRun(pts: MVec[], tone: (p: Vec) => number, step: number): Span {
  const lens = cumulative(pts);
  const L = lens[lens.length - 1] as number;
  const k = Math.max(1, Math.ceil(L / step));
  const out: MVec[] = [];
  const tones: number[] = [];
  for (let i = 0; i <= k; i++) {
    const p = pointAt(pts, lens, (L * i) / k);
    out.push(p);
    tones.push(tone(p));
  }
  return { pts: out, tones };
}

/** Split a sampled run into spans where tone (with a ragged per-line jitter) passes `at`. */
function spans(run: Span, at: number, rng: Rng, raggedness: number, minSpan = 2.1): Span[] {
  const seed = rng.int(1, 1e9);
  const lineJ = rng.normal() * raggedness * 0.6;
  const out: Span[] = [];
  let cur: Span | null = null;
  for (let i = 0; i < run.pts.length; i++) {
    const t = run.tones[i] as number;
    const local = at + lineJ + noise1(i * 0.21, seed) * raggedness;
    if (t > local) {
      if (!cur) cur = { pts: [], tones: [] };
      cur.pts.push(run.pts[i] as MVec);
      cur.tones.push(t);
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  // a gap under ~1 mm is the hand's, not the light's: join it; a span under ~2 mm would
  // only make a comma, so the hand leaves that paper alone
  const merged: Span[] = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    if (prev) {
      const a = prev.pts[prev.pts.length - 1] as MVec;
      const b = s.pts[0] as MVec;
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1) {
        prev.pts.push(...s.pts);
        prev.tones.push(...s.tones);
        continue;
      }
    }
    merged.push({ pts: s.pts.slice(), tones: s.tones.slice() });
  }
  return merged.filter((s) => lengthOf(s.pts) >= minSpan);
}

/** Lay one span as one or more strokes: dark end first, split at the hand's reach. */
function laySpan(
  plate: Plate,
  span: Span,
  o: {
    form: Form;
    group: string;
    role: Role;
    slope: number;
    pressure: number;
    bow: number;
    reach: number;
    rng: Rng;
    minPiece: number;
  },
): Mark[] {
  const n = span.pts.length;
  const t0 = (span.tones[0] as number) + (span.tones[1] as number);
  const t1 = (span.tones[n - 1] as number) + (span.tones[n - 2] as number);
  let pts = span.pts;
  let tones = span.tones;
  // land where the ink weight shows; if even, the lower end (the hand pulls up and away)
  const darkFirst =
    Math.abs(t0 - t1) > 0.04 ? t0 >= t1 : (pts[0] as MVec)[1] >= (pts[n - 1] as MVec)[1];
  if (!darkFirst) {
    pts = pts.slice().reverse();
    tones = tones.slice().reverse();
  }
  // Rows of short strokes: each line is cut into pieces of about the hand's hatch reach,
  // starting at a random phase so the breaks never line up across neighbouring lines;
  // a piece overlaps the next a little, or stops a hair short of it.
  const lens = cumulative(pts);
  const L = lens[n - 1] as number;
  const cuts: number[] = [0];
  let at = o.reach * o.rng.range(0.35, 1);
  while (at < L - o.reach * 0.35) {
    cuts.push(at);
    at += o.reach * o.rng.range(0.75, 1.25);
  }
  cuts.push(L);
  const marks: Mark[] = [];
  for (let k = 0; k + 1 < cuts.length; k++) {
    // the next piece lands a hair past where the last one lifted: a gap, never an overlap
    // (two tapered ends side by side read as an eye-shaped lens, a machine's join)
    const s0 = Math.max(0, (cuts[k] as number) + (k > 0 ? o.rng.range(0.25, 0.9) : 0));
    const s1 = cuts[k + 1] as number;
    let a = 0;
    while (a < n - 1 && (lens[a] as number) < s0) a++;
    let b = a;
    while (b < n - 1 && (lens[b] as number) < s1) b++;
    const sub = pts.slice(a, b + 1);
    const subT = tones.slice(a, b + 1);
    if (sub.length < 2 || lengthOf(sub) < Math.min(1.2, o.minPiece)) continue;
    const meanT = subT.reduce((x, y) => x + y, 0) / subT.length;
    const maxT = Math.max(...subT, 0.01);
    const prof = (u: number) => {
      const t = subT[Math.min(subT.length - 1, Math.round(u * (subT.length - 1)))] as number;
      return o.pressure * (0.5 + 0.5 * (t / maxT) ** 0.8) * (0.75 + 0.35 * meanT);
    };
    marks.push(
      ...plate.stroke(sub, {
        role: o.role,
        pressure: prof,
        start: 'touch',
        // a long pulled line lifts; a short flick tapers
        end: lengthOf(sub) > 8 ? 'lift' : 'taper',
        bow: o.bow,
        group: o.group,
        form: o.form.id,
        tone: meanT,
        slope: o.slope,
      }),
    );
  }
  return marks;
}

function registerForm(plate: Plate, form: Form, tone: (p: Vec) => number) {
  if (!plate.forms.some((f) => f.id === form.id))
    plate.addForm({ id: form.id, kind: form.kind, outline: form.outline, tone });
}

/**
 * Lay tone on a form. Returns the strokes, in the order the hand made them.
 */
export function hatch(plate: Plate, o: HatchOptions): Mark[] {
  const manner = plate.style.hatch;
  const tone = o.tone ?? ((p: Vec) => o.form.tone(p, plate.light));
  registerForm(plate, o.form, tone);
  const kind = o.manner ?? 'parallel';
  const region = o.region ?? o.form.outline;
  const id = o.id ?? plate.nextId('hatch');
  const rng = plate.rng.fork(`hatch:${id}`);
  const role = o.role ?? 'hatch';
  const threshold = o.threshold ?? 0.2;
  const [deep1, deep2] = o.deepen ?? [0.5, 0.74];
  const G = o.gap ?? manner.gap[1];
  const pressure = o.pressure ?? 0.52;
  if (kind === 'stipple') return stipple(plate, { ...o, tone, region, id, rng, threshold });

  const marks: Mark[] = [];
  const passes: { at: number; offsets: number[] }[] = [
    { at: threshold, offsets: [0] },
    { at: deep1, offsets: [0.5] },
    { at: deep2, offsets: [0.25, 0.75] },
  ];

  if (kind === 'parallel') {
    const families = [{ slope: o.slope ?? manner.slope, at: 0 }];
    if ((o.cross ?? manner.cross) && manner.cross)
      families.push({ slope: (o.slope ?? manner.slope) + manner.crossAngle, at: manner.crossAt });
    for (const fam of families) {
      const th = fam.slope * DEG;
      const d: Vec = [Math.cos(th), Math.sin(th)];
      const nrm: Vec = [-Math.sin(th), Math.cos(th)];
      const [x0, y0, x1, y1] = bbox(region);
      const corners: Vec[] = [
        [x0, y0],
        [x1, y0],
        [x0, y1],
        [x1, y1],
      ];
      const proj = corners.map((c) => c[0] * nrm[0] + c[1] * nrm[1]);
      const tMin = Math.min(...proj);
      const tMax = Math.max(...proj);
      for (const pass of passes) {
        const at = Math.max(pass.at, fam.at);
        if (fam.at > 0 && pass.offsets[0] !== 0) continue; // the crossing family is one pass
        for (let base = tMin; base <= tMax; base += G * rng.range(0.92, 1.08)) {
          for (const off of pass.offsets) {
            const t = base + G * off + rng.normal() * G * 0.07;
            const ang = th + rng.normal() * 1.2 * DEG;
            const dd: Vec = [Math.cos(ang), Math.sin(ang)];
            const o0: Vec = [nrm[0] * t, nrm[1] * t];
            for (const [a, b] of lineInsidePolygon(o0, dd, region)) {
              if (b - a < 0.8) continue;
              const line: MVec[] = [
                [o0[0] + dd[0] * a, o0[1] + dd[1] * a],
                [o0[0] + dd[0] * b, o0[1] + dd[1] * b],
              ];
              const run = toneRun(line, tone, 0.3);
              for (const sp of spans(run, at, rng, 0.05, o.minSpan))
                marks.push(
                  ...laySpan(plate, sp, {
                    form: o.form,
                    group: id,
                    role,
                    slope: fam.slope,
                    pressure: pressure * (fam.at > 0 ? 0.8 : 1),
                    bow: manner.bow,
                    reach: manner.reach,
                    rng,
                    minPiece: o.minSpan ?? 2.1,
                  }),
                );
            }
          }
        }
      }
    }
    return marks;
  }

  // contour: lines that follow the form (rings on a column, latitudes on a globe)
  const [x0, y0, x1, y1] = bbox(region);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const f0 = o.form.flow([cx, cy]);
  const half = Math.hypot(x1 - x0, y1 - y0) / 2;
  const seedA: Vec = o.seedLine?.[0] ?? [cx - f0[1] * half, cy + f0[0] * half];
  const seedB: Vec = o.seedLine?.[1] ?? [cx + f0[1] * half, cy - f0[0] * half];
  const seedLen = Math.hypot(seedB[0] - seedA[0], seedB[1] - seedA[1]);
  const step = 0.3;
  const trace = (s: Vec): MVec[] => {
    const both: MVec[][] = [];
    for (const dir of [1, -1]) {
      const pts: MVec[] = [];
      let p: MVec = [s[0], s[1]];
      for (let i = 0; i < 1200; i++) {
        if (!pointInPolygon(p, region)) break;
        pts.push(p);
        const f = o.form.flow(p);
        // midpoint step for smooth curves
        const mid: Vec = [p[0] + f[0] * dir * step * 0.5, p[1] + f[1] * dir * step * 0.5];
        const fm = o.form.flow(mid);
        const sgn = fm[0] * f[0] + fm[1] * f[1] < 0 ? -1 : 1;
        p = [p[0] + fm[0] * sgn * dir * step, p[1] + fm[1] * sgn * dir * step];
      }
      both.push(pts);
    }
    return [...(both[1] as MVec[]).slice(1).reverse(), ...(both[0] as MVec[])];
  };
  for (const pass of passes) {
    for (let base = 0; base <= seedLen; base += G * rng.range(0.92, 1.08)) {
      for (const off of pass.offsets) {
        const u = (base + G * off + rng.normal() * G * 0.07) / seedLen;
        if (u < 0 || u > 1) continue;
        const s: Vec = [seedA[0] + (seedB[0] - seedA[0]) * u, seedA[1] + (seedB[1] - seedA[1]) * u];
        if (!pointInPolygon(s, region)) continue;
        const line = trace(s);
        if (line.length < 4) continue;
        const run = toneRun(line, tone, 0.3);
        for (const sp of spans(run, pass.at, rng, 0.05, o.minSpan))
          marks.push(
            ...laySpan(plate, sp, {
              form: o.form,
              group: id,
              role,
              slope: Math.round((Math.atan2(f0[1], f0[0]) / DEG) * 10) / 10,
              pressure,
              bow: 0,
              reach: manner.reach * 1.4,
              rng,
              minPiece: o.minSpan ?? 2.1,
            }),
          );
      }
    }
  }
  return marks;
}

/** Stipple: dots whose density follows the tone; each a pen's dab with its own pool. */
function stipple(
  plate: Plate,
  o: HatchOptions & {
    tone: (p: Vec) => number;
    region: MVec[];
    id: string;
    rng: Rng;
    threshold: number;
  },
): Mark[] {
  const [x0, y0, x1, y1] = bbox(o.region);
  const cell = 0.42;
  const marks: Mark[] = [];
  for (let y = y0; y <= y1; y += cell)
    for (let x = x0; x <= x1; x += cell) {
      const p: MVec = [x + o.rng.range(0, cell), y + o.rng.range(0, cell)];
      if (!pointInPolygon(p, o.region)) continue;
      const t = o.tone(p);
      if (t < o.threshold || !o.rng.chance(Math.min(0.95, (t - o.threshold) * 1.6))) continue;
      const a = o.rng.range(0, Math.PI * 2);
      const len = o.rng.range(0.04, 0.12);
      marks.push(
        ...plate.stroke(
          [
            [p[0], p[1]],
            [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len],
          ],
          {
            role: 'stipple',
            start: 'touch',
            end: 'stop',
            pressure: 0.4 + 0.5 * t,
            group: o.id,
            form: o.form.id,
            tone: t,
          },
        ),
      );
    }
  return marks;
}

/**
 * A quill contour round a form: heavy where the edge turns away from the light, a hair
 * where it faces it (research 01 §1: variable weight; 02 R14: outline heaviest).
 * `outline` is closed; the stroke is laid in arcs as a hand would, with joins.
 */
export function contour(
  plate: Plate,
  outline: readonly Vec[],
  o: {
    closed?: boolean;
    min?: number;
    max?: number;
    id?: string;
    form?: string;
    role?: Role;
    pressure?: number;
    anchored?: boolean;
  } = {},
): Mark[] {
  const l = light2d(plate.light);
  const closed = o.closed ?? true;
  const area = signedArea(outline);
  // outward normal of travel: (t_y, −t_x) on a clockwise (screen) outline, the opposite otherwise
  const out = area > 0 ? -1 : 1;
  const min = o.min ?? 0.55;
  const max = o.max ?? 1.35;
  const weight = (_p: Vec, t: Vec) => {
    const nx = -t[1] * out;
    const ny = t[0] * out;
    const shade = Math.max(0, -(nx * l[0] + ny * l[1]));
    return min + (max - min) * shade;
  };
  const pts = closed ? [...outline, outline[0] as Vec] : [...outline];
  return plate.stroke(pts, {
    role: o.role ?? 'contour',
    weight,
    pressure: o.pressure,
    anchored: o.anchored ?? true,
    group: o.id,
    form: o.form,
    id: o.id,
  });
}
