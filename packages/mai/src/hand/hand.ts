/**
 * The hand — how an intended path becomes a performed stroke.
 *
 * A plotter draws the path. A hand performs it: it lands, accelerates, slows into every
 * bend (speed ∝ curvature^(−1/3), the two-thirds power law of human movement), shakes a
 * little at 8–12 Hz (physiological tremor, visible only where the pen is slow), drifts off
 * the ideal line on long fast runs (speed costs accuracy), and leaves the paper in one of a
 * few characteristic ways: a taper, a hook return, or a stop where the ink pools.
 *
 * Everything here is deterministic from the stroke's seed. Units: mm, s, mm/s.
 *
 * Research: ideas/kiruk-codex/research/01-leonardo.md §1 (stroke anatomy: hatching starts
 * where the ink weight shows, pulls and tapers; contour strokes end in a small hook return;
 * travel direction varies while the slope stays constant).
 */
import { noise1 } from '../core/noise.ts';
import {
  cumulative,
  curvature,
  lengthOf,
  type Path,
  pointAt,
  resample,
  tangents,
} from '../core/path.ts';
import type { Rng } from '../core/rng.ts';
import { DEG, dist, type MVec, type Vec } from '../core/vec.ts';

export type Role =
  | 'contour'
  | 'hatch'
  | 'stipple'
  | 'construction'
  | 'underdrawing'
  | 'searching'
  | 'letter'
  | 'dimension'
  | 'leader'
  | 'overlay'
  | 'wash'
  | 'heightening';

export type Start = 'dip' | 'touch' | 'carry';
export type End = 'taper' | 'hook' | 'stop' | 'lift';
export type Guide = 'free' | 'ruler' | 'compass' | 'exact';

export interface HandSpec {
  handed: 'left' | 'right';
  /** Physiological tremor at the pen tip, mm (amplitude of the summed oscillators). */
  tremor: number;
  tremorHz: readonly [number, number];
  /** Low-frequency departure from the ideal line, as a fraction of stroke length. */
  drift: number;
  /** Cap on drift, mm. */
  driftMax: number;
  /** Peak speed of a fluent stroke, mm/s. */
  pace: number;
  /** How far one stroke runs before the hand lifts to move, mm. */
  reach: number;
  /** Radius of the wrist's arc when hatching, mm. */
  wrist: number;
  /** Length range of the landing hook, mm. */
  hook: readonly [number, number];
  /** Length range of a hook return or taper tail, mm. */
  tail: readonly [number, number];
  /** 1σ of where an anchored stroke lands relative to its target, mm. */
  land: number;
}

export const HANDS: Record<'left' | 'right', HandSpec> = {
  left: {
    handed: 'left',
    tremor: 0.024,
    tremorHz: [8.5, 11.5],
    drift: 0.006,
    driftMax: 0.65,
    pace: 140,
    reach: 42,
    wrist: 72,
    hook: [0.15, 0.55],
    tail: [0.35, 1.1],
    land: 0.12,
  },
  right: {
    handed: 'right',
    tremor: 0.024,
    tremorHz: [8.5, 11.5],
    drift: 0.006,
    driftMax: 0.65,
    pace: 140,
    reach: 42,
    wrist: 72,
    hook: [0.15, 0.55],
    tail: [0.35, 1.1],
    land: 0.12,
  },
};

export interface StrokeIntent {
  /** What the stroke means, in mm. */
  path: Path;
  role: Role;
  /** Base pressure 0..1, or a profile over u = s/L. */
  pressure?: number | ((u: number) => number);
  /** Multiplier on the hand's pace: 0.3 deliberate … 1.8 swift. */
  pace?: number;
  /** 0 loose … 1 careful (less drift, less tremor, slower). */
  precision?: number;
  start?: Start;
  end?: End;
  guide?: Guide;
  /** Bow the stroke on the wrist's arc: +1 / −1 picks the side, 0 none. */
  bow?: number;
  /** Run past each end, mm (construction crosses its corners). */
  overshoot?: readonly [number, number];
  /** Keep the ends near where they are meant to land (contours that join). */
  anchored?: boolean;
  /** Pressure multiplier from the light or the form, per point. */
  weight?: (p: Vec, tangent: Vec) => number;
  /** Direction the hand moves next (for the shape of a tail). */
  next?: Vec;
}

export interface Sample {
  x: number;
  y: number;
  /** Arc length along the performed stroke, mm. */
  s: number;
  /** Time since touchdown, s. */
  t: number;
  /** Tangential speed, mm/s. */
  v: number;
  /** Pressure 0..1. */
  p: number;
  /** Unit tangent. */
  tx: number;
  ty: number;
}

export interface Performance {
  samples: Sample[];
  /** The path the hand aimed at (after overshoot and bow), mm. */
  intended: MVec[];
  start: Start;
  end: End;
  /** Seconds the pen rested at touchdown and at the lift. */
  dwellStart: number;
  dwellEnd: number;
  guide: Guide;
  role: Role;
  length: number;
  duration: number;
  /** How far the performed line strayed from the aim, mm. */
  deviation: { rms: number; max: number; startMiss: number; endMiss: number };
  /** RMS of the high-frequency part of the deviation (the tremor actually left), mm. */
  tremorRms: number;
}

const ROLE_PACE: Record<Role, number> = {
  contour: 0.55,
  hatch: 1.35,
  stipple: 0.5,
  construction: 0.85,
  underdrawing: 0.9,
  searching: 1.3,
  letter: 0.42,
  dimension: 0.7,
  leader: 0.8,
  overlay: 0.7,
  wash: 0.6,
  heightening: 0.7,
};

const ROLE_PRESSURE: Record<Role, number> = {
  contour: 0.62,
  hatch: 0.48,
  stipple: 0.6,
  construction: 0.3,
  underdrawing: 0.35,
  searching: 0.22,
  letter: 0.55,
  dimension: 0.4,
  leader: 0.38,
  overlay: 0.5,
  wash: 0.5,
  heightening: 0.5,
};

/** How often a stroke of each role lands with a visible hook. */
const HOOK_CHANCE: Record<Role, number> = {
  contour: 0.5,
  hatch: 0.1,
  stipple: 0,
  construction: 0.05,
  underdrawing: 0.25,
  searching: 0.2,
  letter: 0.6,
  dimension: 0,
  leader: 0.1,
  overlay: 0,
  wash: 0,
  heightening: 0.2,
};

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Extend a path past its ends along the end tangents. */
function extend(pts: MVec[], a: number, b: number): MVec[] {
  if (pts.length < 2) return pts;
  const out = pts.slice();
  if (a > 0) {
    const p0 = pts[0] as MVec;
    const p1 = pts[Math.min(3, pts.length - 1)] as MVec;
    const d = dist(p0, p1) || 1;
    out.unshift([p0[0] - ((p1[0] - p0[0]) / d) * a, p0[1] - ((p1[1] - p0[1]) / d) * a]);
  }
  if (b > 0) {
    const pn = pts[pts.length - 1] as MVec;
    const pm = pts[Math.max(0, pts.length - 4)] as MVec;
    const d = dist(pn, pm) || 1;
    out.push([pn[0] + ((pn[0] - pm[0]) / d) * b, pn[1] + ((pn[1] - pm[1]) / d) * b]);
  }
  return out;
}

/** Move each end by a signed amount: > 0 runs past it, < 0 stops short of it. */
function adjustEnds(pts: MVec[], a: number, b: number): MVec[] {
  let out = extend(pts, Math.max(0, a), Math.max(0, b));
  if (a >= 0 && b >= 0) return out;
  const lens = cumulative(out);
  const total = lens[lens.length - 1] as number;
  const s0 = Math.max(0, -a);
  const s1 = total - Math.max(0, -b);
  if (s1 - s0 < 0.3) return out;
  const kept: MVec[] = [pointAt(out, lens, s0)];
  for (let i = 0; i < out.length; i++) {
    const s = lens[i] as number;
    if (s > s0 + 1e-6 && s < s1 - 1e-6) kept.push(out[i] as MVec);
  }
  kept.push(pointAt(out, lens, s1));
  out = kept;
  return out;
}

/** Bend a path onto the wrist's arc: a sagitta that peaks mid-stroke. */
function bowPath(pts: MVec[], radius: number, side: number): MVec[] {
  const L = lengthOf(pts);
  if (L < 1 || side === 0) return pts;
  const lens = cumulative(pts);
  const tan = tangents(pts);
  const sag = (L * L) / (8 * radius);
  return pts.map((p, i) => {
    const u = (lens[i] as number) / L;
    const off = side * sag * 4 * u * (1 - u);
    const t = tan[i] as MVec;
    return [p[0] + t[1] * off, p[1] - t[0] * off] as MVec;
  });
}

/**
 * Perform an intended stroke. The rng should be the mark's own fork.
 */
export function perform(intent: StrokeIntent, hand: HandSpec, rng: Rng): Performance {
  const guide: Guide = intent.guide ?? 'free';
  const role = intent.role;
  const precision = clamp01(intent.precision ?? (guide === 'free' ? 0.45 : 0.85));
  const exact = guide === 'exact';

  // 1 · the aim: overshoot, landing error, the wrist's bow
  let aim = intent.path.map((p) => [p[0], p[1]] as MVec);
  if (intent.overshoot) aim = extend(aim, intent.overshoot[0], intent.overshoot[1]);
  if (!exact && intent.anchored) {
    // A joined contour lands near, not on, its mark: a little short or a little past.
    const spread = hand.land * (1.2 - precision * 0.6);
    aim = adjustEnds(aim, rng.normal() * spread, rng.normal() * spread);
  }
  if (intent.bow && guide === 'free')
    aim = bowPath(aim, hand.wrist * rng.range(0.8, 1.25), intent.bow);

  const L = lengthOf(aim);
  const step = L > 160 ? 0.3 : L > 60 ? 0.2 : 0.12;
  const pts = resample(aim, Math.min(step, Math.max(0.05, L / 8)));
  const n = pts.length;
  const lens = cumulative(pts);
  const tan = tangents(pts);

  // 2 · speed: an envelope (land, run, leave) under the power law's ceiling
  const start: Start = intent.start ?? (role === 'hatch' ? 'touch' : 'dip');
  const end: End =
    intent.end ?? (role === 'contour' ? 'hook' : role === 'hatch' ? 'taper' : 'lift');
  const vPeak =
    hand.pace * (intent.pace ?? 1) * ROLE_PACE[role] * (1 - precision * 0.35) * rng.range(0.9, 1.1);
  const kRaw = curvature(pts);
  const kS = kRaw.map((_, i) => {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - 4); j <= Math.min(n - 1, i + 4); j++) {
      s += Math.abs(kRaw[j] as number);
      c++;
    }
    return s / c;
  });
  const K = 0.27 * vPeak;
  const accel = Math.min(L * 0.3, 2.5 + L * 0.08);
  const decel = Math.min(L * 0.3, 2 + L * 0.07);
  const vIn = start === 'carry' ? 0.75 : start === 'touch' ? 0.3 : 0.12;
  const vOut = end === 'taper' ? 0.7 : end === 'hook' ? 0.35 : end === 'lift' ? 0.3 : 0.04;
  const speed: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = lens[i] as number;
    const up = accel > 0 ? smooth(clamp01(s / accel)) : 1;
    const down = decel > 0 ? smooth(clamp01((L - s) / decel)) : 1;
    let env = vPeak * (vIn + (1 - vIn) * up) * (vOut + (1 - vOut) * down);
    if (guide === 'free') env = Math.min(env, K * (kS[i] as number) ** (-1 / 3));
    speed.push(Math.max(2, env));
  }
  const t: number[] = [0];
  for (let i = 1; i < n; i++) {
    const ds = (lens[i] as number) - (lens[i - 1] as number);
    t.push((t[i - 1] as number) + (2 * ds) / ((speed[i] as number) + (speed[i - 1] as number)));
  }

  // 3 · deviation: slow drift (speed costs accuracy) + tremor in time (shows where slow)
  const seedD = rng.int(1, 1e9);
  const seedT = rng.int(1, 1e9);
  const vMean = speed.reduce((a, b) => a + b, 0) / n;
  const driftAmp = exact
    ? 0
    : guide === 'free'
      ? Math.min(hand.driftMax, hand.drift * L * (0.55 + 0.45 * (vMean / 120))) *
        (1 - precision * 0.6)
      : 0;
  const lambda = Math.max(7, L / rng.range(1.2, 2.4));
  const trem = exact ? 0 : hand.tremor * (1.15 - precision * 0.5) * (guide === 'free' ? 1 : 0.18);
  const f1 = rng.range(hand.tremorHz[0], hand.tremorHz[1]);
  const f2 = f1 * rng.range(1.31, 1.47);
  const ph1 = rng.range(0, Math.PI * 2);
  const ph2 = rng.range(0, Math.PI * 2);
  // A ruler is laid a hair off true, and a compass leg never sits quite still.
  const tilt = guide === 'ruler' ? rng.normal() * 0.12 * DEG : 0;
  const shift = guide === 'ruler' ? rng.normal() * 0.04 : 0;
  const c0 = pts[0] as MVec;

  const out: Sample[] = [];
  const devs: number[] = [];
  const hf: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = lens[i] as number;
    const u = L > 0 ? s / L : 0;
    const tg = tan[i] as MVec;
    const nx = tg[1];
    const ny = -tg[0];
    const envD = 0.35 + 0.65 * Math.sin(Math.PI * u);
    const dLow = driftAmp * noise1(s / lambda, seedD) * envD;
    const ti = t[i] as number;
    const dHigh =
      trem *
      (0.62 * Math.sin(2 * Math.PI * f1 * ti + ph1) +
        0.28 * Math.sin(2 * Math.PI * f2 * ti + ph2) +
        0.25 * noise1(ti * 38, seedT));
    let x = (pts[i] as MVec)[0] + nx * (dLow + dHigh);
    let y = (pts[i] as MVec)[1] + ny * (dLow + dHigh);
    if (tilt !== 0 || shift !== 0) {
      const rx = x - c0[0];
      const ry = y - c0[1];
      const cs = Math.cos(tilt);
      const sn = Math.sin(tilt);
      x = c0[0] + rx * cs - ry * sn + nx * shift;
      y = c0[1] + rx * sn + ry * cs + ny * shift;
    }
    devs.push(Math.hypot(x - (pts[i] as MVec)[0], y - (pts[i] as MVec)[1]));
    hf.push(dHigh);
    out.push({ x, y, s, t: ti, v: speed[i] as number, p: 0, tx: tg[0], ty: tg[1] });
  }

  // 4 · pressure: base, ramps, a slow breath, the pull, the light
  const base =
    typeof intent.pressure === 'number'
      ? intent.pressure
      : ROLE_PRESSURE[role] * rng.range(0.92, 1.08);
  const prof = typeof intent.pressure === 'function' ? intent.pressure : null;
  const seedP = rng.int(1, 1e9);
  const pull = hand.handed === 'left' ? [0.28, 0.96] : [-0.28, 0.96];
  const inLen = Math.max(0.25, L * 0.06);
  const outLen = Math.max(0.35, L * (end === 'taper' ? 0.22 : end === 'stop' ? 0.04 : 0.1));
  for (let i = 0; i < n; i++) {
    const sm = out[i] as Sample;
    const u = L > 0 ? sm.s / L : 0;
    let p = prof ? prof(u) : base;
    const rampIn =
      start === 'carry'
        ? 1
        : start === 'dip'
          ? 0.8 + 0.2 * smooth(clamp01(sm.s / inLen))
          : 0.35 + 0.65 * smooth(clamp01(sm.s / inLen));
    const rampOut =
      end === 'stop'
        ? 1
        : end === 'taper'
          ? 0.06 + 0.94 * smooth(clamp01((L - sm.s) / outLen))
          : 0.3 + 0.7 * smooth(clamp01((L - sm.s) / outLen));
    const breath = exact ? 1 : 1 + 0.11 * noise1(sm.s / 5.5, seedP);
    const pulling = 1 + 0.1 * (sm.tx * (pull[0] as number) + sm.ty * (pull[1] as number));
    const slow = 1 + 0.08 * clamp01((60 - sm.v) / 60);
    const lightW = intent.weight ? intent.weight([sm.x, sm.y], [sm.tx, sm.ty]) : 1;
    p *= rampIn * rampOut * breath * (exact ? 1 : pulling * slow) * lightW;
    sm.p = clamp01(p);
  }

  // 5 · the landing hook and the leaving tail
  // Slow, deliberate strokes (contours, letters) land with a visible hook; a hatch is a
  // fast wrist flick that lands on its weight and goes (research 01 §1).
  const hookSide = (hand.handed === 'left' ? -1 : 1) * (rng.chance(0.72) ? 1 : -1);
  const hookChance = HOOK_CHANCE[role];
  if (
    !exact &&
    guide === 'free' &&
    (start === 'touch' || start === 'dip') &&
    n > 3 &&
    rng.chance(hookChance)
  ) {
    const h =
      rng.range(hand.hook[0], hand.hook[1]) *
      (start === 'dip' ? 0.6 : 1) *
      (role === 'hatch' ? 0.35 : 1);
    const ang = hookSide * rng.range(28, 70) * DEG;
    const f = out[0] as Sample;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const dx = f.tx * ca - f.ty * sa;
    const dy = f.tx * sa + f.ty * ca;
    const pre: Sample[] = [];
    const k = 4;
    for (let j = k; j >= 1; j--) {
      const w = j / k;
      // a short curve that arrives along the stroke: blend from the hook direction to the tangent
      const bx = f.tx * (1 - w) + dx * w;
      const by = f.ty * (1 - w) + dy * w;
      const r = h * w;
      pre.push({
        x: f.x - bx * r,
        y: f.y - by * r,
        s: -r,
        t: -0.012 * w,
        v: f.v * 0.6,
        p: f.p * (0.25 + 0.6 * (1 - w)),
        tx: bx,
        ty: by,
      });
    }
    out.unshift(...pre);
  }
  if (!exact && guide === 'free' && (end === 'hook' || end === 'taper') && n > 3) {
    const lastS = out[out.length - 1] as Sample;
    const len = rng.range(hand.tail[0], hand.tail[1]) * (end === 'hook' ? 0.8 : 0.7);
    const turn =
      end === 'hook'
        ? -hookSide * rng.range(95, 155) * DEG
        : (intent.next
            ? Math.sign(lastS.tx * intent.next[1] - lastS.ty * intent.next[0]) || 1
            : hookSide) *
          rng.range(8, 30) *
          DEG;
    const k = 6;
    let px = lastS.x;
    let py = lastS.y;
    let dir = Math.atan2(lastS.ty, lastS.tx);
    for (let j = 1; j <= k; j++) {
      const w = j / k;
      dir += turn / k;
      px += Math.cos(dir) * (len / k);
      py += Math.sin(dir) * (len / k);
      out.push({
        x: px,
        y: py,
        s: lastS.s + len * w,
        t: lastS.t + 0.01 * j,
        v: lastS.v,
        p: lastS.p * (1 - w) ** 1.3 * (end === 'hook' ? 0.9 : 0.55),
        tx: Math.cos(dir),
        ty: Math.sin(dir),
      });
    }
  }

  // Re-measure arc length and time over the final samples (hook and tail included).
  let acc = 0;
  const t0 = (out[0] as Sample).t;
  for (let i = 0; i < out.length; i++) {
    const sm = out[i] as Sample;
    if (i > 0) {
      const q = out[i - 1] as Sample;
      acc += Math.hypot(sm.x - q.x, sm.y - q.y);
    }
    sm.s = acc;
    sm.t -= t0;
    if (i > 0 && sm.t <= (out[i - 1] as Sample).t) sm.t = (out[i - 1] as Sample).t + 1e-4;
  }

  // 6 · dwell, and how far it strayed
  const dwellStart = exact
    ? 0
    : start === 'dip'
      ? rng.range(0.06, 0.18)
      : start === 'touch'
        ? rng.range(0.005, 0.03)
        : 0;
  const dwellEnd = exact
    ? 0
    : end === 'stop'
      ? rng.range(0.08, 0.26)
      : end === 'lift'
        ? rng.range(0.01, 0.04)
        : 0;
  const rms = Math.sqrt(devs.reduce((a, b) => a + b * b, 0) / Math.max(1, devs.length));
  const max = devs.reduce((a, b) => Math.max(a, b), 0);
  const tremorRms = Math.sqrt(hf.reduce((a, b) => a + b * b, 0) / Math.max(1, hf.length));
  const p0 = intent.path[0] as Vec;
  const pN = intent.path[intent.path.length - 1] as Vec;
  const f0 = out[0] as Sample;
  const fN = out[out.length - 1] as Sample;

  return {
    samples: out,
    intended: pts,
    start,
    end,
    dwellStart,
    dwellEnd,
    guide,
    role,
    length: L,
    duration: (t[n - 1] as number) + dwellStart + dwellEnd,
    deviation: {
      rms,
      max,
      startMiss: Math.hypot(f0.x - p0[0], f0.y - p0[1]),
      endMiss: Math.hypot(fN.x - pN[0], fN.y - pN[1]),
    },
    tremorRms,
  };
}
