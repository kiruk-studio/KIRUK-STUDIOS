/**
 * Ink on paper — a performed stroke becomes marks, with the anomalies a real pen leaves.
 *
 * The anomalies of the act (always on, each scaled by instrument × ink × paper × load):
 *   pool        where the pen rests (a fresh dip, a stop, a sharp corner) ink gathers, rounder and darker
 *   rim         a pool dries darkest at its edge (the coffee ring)
 *   swell       width follows pressure; slow passages spread, fast ones thin
 *   starve      as the reservoir empties the line breaks into dry streaks on the paper's peaks
 *   rails       a flexed split nib, low on ink, leaves its two tines and a starved middle
 *   feather     wet ink wicks out along the fibres in fine spikes; sized paper allows little
 *   spread      the edge is never a vector edge: it wanders with the sheet's absorbency
 *   catch       a pushed nib snags the tooth: a skip and a spatter
 *   spatter     a fast loaded flick throws a droplet or two
 *   dip rhythm  strokes pale as the reservoir drains, then a dip, a pool, and dark again
 *   ruler       against a straight-edge one side stays crisp, the open side feathers
 *   blind       a stylus leaves no ink, only a groove the raking light finds
 *
 * Damage of time (off unless the plate sets `time` and says why): an oxidation halo past
 * the stroke. The research names faux halos as a costume tell (research 01 §1, §5).
 */
import type { RGB } from '../core/color.ts';
import { clamp, noise1, noise2, smoothstep } from '../core/noise.ts';
import { simplify } from '../core/path.ts';
import type { Rng } from '../core/rng.ts';
import { f2, polygonD, polylineD } from '../core/svg.ts';
import type { MVec, Vec } from '../core/vec.ts';
import type { Performance, Sample } from '../hand/hand.ts';
import { footprint, type InstrumentSpec } from '../nib/instruments.ts';
import type { Paper } from '../paper/paper.ts';
import type { InkSpec } from './inks.ts';

export interface InkState {
  /** 0 empty … 1 freshly dipped. */
  reservoir: number;
  /** Below this the scribe dips again before the next stroke. */
  redipAt: number;
  dips: number;
  strokesSinceDip: number;
  /** The scribe keeps drawing without dipping (a specimen of a pen running dry). */
  hold?: boolean;
}

export const freshInk = (rng: Rng): InkState => ({
  reservoir: rng.range(0.55, 1),
  redipAt: rng.range(0.1, 0.26),
  dips: 0,
  strokesSinceDip: 0,
});

export type PartKind =
  | 'body'
  | 'faint'
  | 'feather'
  | 'pool'
  | 'rim'
  | 'halo'
  | 'grain'
  | 'spatter'
  | 'emboss-light'
  | 'emboss-dark';

export interface MarkPart {
  kind: PartKind;
  d: string;
  /** Fill (or stroke) opacity. */
  density: number;
  /** Stroked instead of filled, at this width (mm). */
  stroke?: number;
  evenodd?: boolean;
  /** Colour override (halo, emboss); otherwise the mark's ink. */
  color?: RGB;
  /** Normal blending (heightening, emboss light) instead of multiply. */
  normal?: boolean;
  /** Seen through the sheet's tooth: light grain (peaks only) or heavy (most of the tooth). */
  grain?: 'light' | 'heavy';
}

export interface StrokeStats {
  length: number;
  duration: number;
  wMin: number;
  wMax: number;
  wMean: number;
  /** Coefficient of variation of the width along the stroke. */
  wCv: number;
  /** Width near each end over the mean width (taper < 1, pooled ≥ 1). */
  endIn: number;
  endOut: number;
  load: number;
  starved: number;
  railed: number;
  pools: number;
  catches: number;
  spatter: number;
  feathers: number;
  featherLen: number;
  spread: number;
  halo: number;
  density: number;
  dip: boolean;
  tremorRms: number;
  deviationRms: number;
  startMiss: number;
  endMiss: number;
}

export interface InkOptions {
  /** As-found time, 0 as made. */
  time: number;
  /** Layer weight: construction and searching passes sit lighter. */
  layerDensity: number;
  /** Toward the light on the page (x right, y down), for blind lines. */
  light: Vec;
}

export interface InkedStroke {
  parts: MarkPart[];
  stats: StrokeStats;
  /** The performed centreline (simplified), for connection checks. */
  spine: MVec[];
  /** Width along the spine, for the critic's weight checks. */
  widths: number[];
}

const smooth = (x: number) => x * x * (3 - 2 * x);

/** A noisy closed blob: a pool, a droplet, a dab. */
function blob(c: Vec, r: number, along: Vec, elong: number, rng: Rng, k = 26): MVec[] {
  const seed = rng.int(1, 1e9);
  const ax = along[0];
  const ay = along[1];
  const out: MVec[] = [];
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2;
    const wob = 1 + 0.13 * noise1(a * 1.6, seed) + 0.05 * noise1(a * 4.3, seed + 7);
    const lx = Math.cos(a) * r * elong * wob;
    const ly = Math.sin(a) * r * wob;
    out.push([c[0] + lx * ax - ly * ay, c[1] + lx * ay + ly * ax]);
  }
  return out;
}

/** Normals of the performed path (smoothed over a few samples). */
function normals(s: readonly Sample[]): MVec[] {
  const n = s.length;
  const out: MVec[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 2)] as Sample;
    const b = s[Math.min(n - 1, i + 2)] as Sample;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let l = Math.hypot(dx, dy);
    if (l < 1e-9) {
      dx = (s[i] as Sample).tx;
      dy = (s[i] as Sample).ty;
      l = Math.hypot(dx, dy) || 1;
    }
    out.push([dy / l, -dx / l]);
  }
  return out;
}

export function inkStroke(
  perf: Performance,
  ins: InstrumentSpec,
  inkSpec: InkSpec,
  paper: Paper,
  state: InkState,
  rng: Rng,
  o: InkOptions,
): InkedStroke {
  const S = perf.samples;
  const n = S.length;
  const L = perf.length;
  const dry = inkSpec.dry || ins.kind === 'dry';
  const blind = ins.kind === 'stylus';
  const burin = ins.kind === 'burin';
  const exact = perf.guide === 'exact';
  const wetPen = !dry && !blind;
  const tPaper = paper.spec.tooth;

  // ── the dip: when the pen is low, or would run dry well before this stroke ends ──
  let dip = false;
  if (wetPen && Number.isFinite(ins.capacity)) {
    const need =
      (inkSpec.flow / ins.capacity) *
      (Math.max(ins.w0, ins.w0 + (ins.w1 - ins.w0) * 0.45) / 0.4) *
      L;
    if (!state.hold && (state.reservoir < state.redipAt || state.reservoir - need * 0.7 < 0.04)) {
      state.reservoir = rng.range(0.9, 1);
      state.redipAt = rng.range(0.1, 0.26);
      state.dips++;
      state.strokesSinceDip = 0;
      dip = true;
    }
    state.strokesSinceDip++;
  }

  // ── per sample: width, load ──
  const N = normals(S);
  const w = new Float64Array(n);
  const load = new Float64Array(n);
  let R = wetPen ? state.reservoir : 1;
  // capacity is mm of a 0.4 mm line per dip: a w-wide line uses (w / 0.4) / capacity per mm
  const flowK = wetPen && Number.isFinite(ins.capacity) ? inkSpec.flow / ins.capacity : 0;
  for (let i = 0; i < n; i++) {
    const sm = S[i] as Sample;
    const u = L > 0 ? clamp(sm.s / Math.max(L, 1e-6)) : 0;
    let wi: number;
    if (burin) {
      wi =
        ins.w0 +
        (ins.w1 - ins.w0) * sm.p ** 0.85 * Math.sin(Math.PI * clamp(u, 0.001, 0.999)) ** 0.7;
    } else {
      wi = footprint(ins, sm.p, Math.atan2(sm.ty, sm.tx), sm.v);
      // a lifting pen goes to a point, whatever the nib's rest width
      wi *= smooth(clamp(sm.p / 0.14));
    }
    w[i] = Math.max(0.004, wi);
    if (wetPen && i > 0) {
      const ds = sm.s - (S[i - 1] as Sample).s;
      R = Math.max(0, R - flowK * (wi / 0.4) * ds);
    }
    const slow = clamp((45 - sm.v) / 45);
    const fast = clamp((sm.v - 160) / 160);
    load[i] = wetPen ? clamp(R ** 0.55 * (1 + 0.22 * slow) - 0.1 * fast) : 1;
    // a loaded pen lays a fuller line; a draining one thins
    if (wetPen && !burin) w[i] = (w[i] as number) * (0.84 + 0.24 * (load[i] as number));
  }
  if (wetPen) state.reservoir = R;

  // ── stats on width ──
  let wSum = 0;
  let wMin = Infinity;
  let wMax = 0;
  for (let i = 0; i < n; i++) {
    const wi = w[i] as number;
    wSum += wi;
    if (wi < wMin) wMin = wi;
    if (wi > wMax) wMax = wi;
  }
  const wMean = wSum / Math.max(1, n);
  let wVar = 0;
  for (let i = 0; i < n; i++) wVar += ((w[i] as number) - wMean) ** 2;
  const wCv = Math.sqrt(wVar / Math.max(1, n)) / Math.max(1e-6, wMean);
  const at = (u: number) => w[Math.min(n - 1, Math.max(0, Math.round(u * (n - 1))))] as number;
  const loadMean = load.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const pMean = S.reduce((a, b) => a + b.p, 0) / Math.max(1, n);

  // ── density ──
  // The dip rhythm: a fresh pen prints dark, a draining one pales (visible across a passage).
  const density = clamp(
    dry
      ? inkSpec.density * (0.55 + 0.45 * pMean) * o.layerDensity
      : inkSpec.density * (0.6 + 0.4 * loadMean ** 0.8) * o.layerDensity,
    0.02,
    0.985,
  );

  const parts: MarkPart[] = [];
  const stats: StrokeStats = {
    length: L,
    duration: perf.duration,
    wMin,
    wMax,
    wMean,
    wCv,
    endIn: at(0.04) / Math.max(1e-6, wMean),
    endOut: at(0.96) / Math.max(1e-6, wMean),
    load: loadMean,
    starved: 0,
    railed: 0,
    pools: 0,
    catches: 0,
    spatter: 0,
    feathers: 0,
    featherLen: 0,
    spread: 0,
    halo: 0,
    density,
    dip,
    tremorRms: perf.tremorRms,
    deviationRms: perf.deviation.rms,
    startMiss: perf.deviation.startMiss,
    endMiss: perf.deviation.endMiss,
  };
  // the performed centreline every ≈ 0.5 mm, with the width there (for the critic)
  const spine: MVec[] = [];
  const widths: number[] = [];
  let lastS = -Infinity;
  for (let i = 0; i < n; i++) {
    const sm = S[i] as Sample;
    if (i === 0 || i === n - 1 || sm.s - lastS >= 0.5) {
      spine.push([sm.x, sm.y]);
      widths.push(w[i] as number);
      lastS = sm.s;
    }
  }

  // ── a blind line: a groove, lit on the side that faces the light ──
  if (blind) {
    const ll = Math.hypot(o.light[0], o.light[1]) || 1;
    const lx = o.light[0] / ll;
    const ly = o.light[1] / ll;
    const a: MVec[] = [];
    const b: MVec[] = [];
    for (let i = 0; i < n; i++) {
      const sm = S[i] as Sample;
      const nn = N[i] as MVec;
      const h = (w[i] as number) / 2;
      a.push([sm.x + nn[0] * h, sm.y + nn[1] * h]);
      b.push([sm.x - nn[0] * h, sm.y - nn[1] * h]);
    }
    // The wall whose normal faces away from the light is in shade.
    const nAvg = N[Math.floor(n / 2)] as MVec;
    const faceA = nAvg[0] * lx + nAvg[1] * ly;
    const light = faceA < 0 ? a : b;
    const dark = faceA < 0 ? b : a;
    // a groove is seen only by its walls: a shaded wall and a lit one, both faint
    parts.push({
      kind: 'emboss-dark',
      d: polylineD(simplify(dark, 0.01)),
      density: 0.34,
      stroke: 0.075,
      color: [0.33, 0.28, 0.22],
    });
    parts.push({
      kind: 'emboss-light',
      d: polylineD(simplify(light, 0.01)),
      density: 0.62,
      stroke: 0.07,
      color: [1, 1, 1],
      normal: true,
    });
    return { parts, stats, spine, widths };
  }

  // ── which samples are wet, starved, railed, skipped ──
  const starveAt = new Float64Array(n);
  const rail = new Uint8Array(n);
  const skip = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    starveAt[i] = dry ? 1 : smoothstep(0.34, 0.1, load[i] as number);
    if (ins.rails && !dry && (w[i] as number) > 0.66 * ins.w1 && (load[i] as number) < 0.42)
      rail[i] = 1;
  }
  // a rail run shorter than 1.5 mm is a flicker, not a split nib
  for (let i = 0; i < n; ) {
    if (!rail[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < n && rail[j]) j++;
    if ((S[Math.min(n - 1, j)] as Sample).s - (S[i] as Sample).s < 1.5)
      for (let k = i; k < j; k++) rail[k] = 0;
    i = j;
  }
  // nib catch on pushed strokes (the pen moving away from the hand, up the page)
  let catches = 0;
  const spatterPts: { c: MVec; r: number }[] = [];
  if (wetPen && ins.catch > 0 && !exact) {
    for (let i = 2; i < n - 2; i++) {
      const sm = S[i] as Sample;
      const push = clamp(-sm.ty * 0.9 - Math.abs(sm.tx) * 0.1);
      const ds = sm.s - (S[i - 1] as Sample).s;
      if (push > 0.2 && rng.chance(ins.catch * tPaper * 0.05 * push * ds)) {
        const gap = rng.range(0.12, 0.45);
        for (let j = i; j < n && (S[j] as Sample).s - sm.s < gap; j++) skip[j] = 1;
        catches++;
        if (rng.chance(0.5)) {
          // the snag throws a droplet just past the skip, close to the line
          const nn = N[i] as MVec;
          const side = rng.sign() * ((w[i] as number) / 2 + rng.range(0.05, 0.35));
          spatterPts.push({
            c: [
              sm.x + nn[0] * side + sm.tx * rng.range(0.1, 0.5),
              sm.y + nn[1] * side + sm.ty * rng.range(0.1, 0.5),
            ],
            r: rng.range(0.02, 0.055),
          });
        }
      }
    }
  }

  // ── the wet body: ribbons with spread and feathers ──
  const rulerSide = perf.guide === 'ruler' ? rng.sign() : 0;
  let feathers = 0;
  let featherSum = 0;
  let spreadSum = 0;
  let spreadN = 0;
  const seedE = rng.int(1, 1e9);
  const wisps: MVec[][] = [];
  const edgePoint = (i: number, side: 1 | -1, out: MVec[], halfW: number) => {
    const sm = S[i] as Sample;
    const nn = N[i] as MVec;
    let off = halfW;
    if (wetPen && !exact && side !== rulerSide) {
      const ab = paper.absorb(sm.x, sm.y);
      const sp =
        inkSpec.bleed *
        ab *
        (load[i] as number) *
        0.07 *
        (0.55 + 0.45 * noise2(sm.x * 3.1, sm.y * 3.1, seedE + side));
      off += Math.max(0, sp) + 0.006 * noise2(sm.x * 9.7, sm.y * 9.7, seedE + 3 * side);
      spreadSum += Math.max(0, sp);
      spreadN++;
      // feathers: where a fibre runs outward, ink wicks along it in a fine wisp
      const [fa, fs] = paper.fibre(sm.x, sm.y);
      const fx = Math.cos(fa);
      const fy = Math.sin(fa);
      const align = Math.abs(fx * nn[0] * side + fy * nn[1] * side);
      const ds = i > 0 ? sm.s - (S[i - 1] as Sample).s : 0.15;
      const rate =
        3.2 * inkSpec.bleed * ab * (load[i] as number) * fs * smoothstep(0.55, 0.97, align);
      if (rng.chance(rate * ds)) {
        const lenF = Math.min(
          0.42,
          -Math.log(1 - rng.next() * 0.95) * (0.035 + 0.24 * ab * inkSpec.bleed),
        );
        const sgn = fx * nn[0] * side + fy * nn[1] * side >= 0 ? 1 : -1;
        const bx = sm.x + nn[0] * off * side * 0.92;
        const by = sm.y + nn[1] * off * side * 0.92;
        const bend = rng.normal() * 0.25;
        const dxF = fx * sgn;
        const dyF = fy * sgn;
        wisps.push([
          [bx, by],
          [
            bx + dxF * lenF * 0.5 - dyF * bend * lenF * 0.25,
            by + dyF * lenF * 0.5 + dxF * bend * lenF * 0.25,
          ],
          [bx + dxF * lenF, by + dyF * lenF],
        ]);
        feathers++;
        featherSum += lenF;
      }
    }
    out.push([sm.x + nn[0] * off * side, sm.y + nn[1] * off * side]);
  };

  const bodyD: string[] = [];
  const faintD: string[] = [];
  // runs of consecutive samples in the same state
  type Mode = 'wet' | 'starved' | 'rail' | 'skip';
  const mode = (i: number): Mode =>
    skip[i]
      ? 'skip'
      : dry
        ? 'starved'
        : rail[i]
          ? 'rail'
          : (starveAt[i] as number) > 0.18
            ? 'starved'
            : 'wet';
  const runs: { m: Mode; a: number; b: number }[] = [];
  for (let i = 0; i < n; i++) {
    const m = mode(i);
    const last = runs[runs.length - 1];
    if (last && last.m === m) last.b = i;
    else runs.push({ m, a: i, b: i });
  }

  let starvedLen = 0;
  let railLen = 0;
  const grainParts: { d: string; heavy: boolean; density: number }[] = [];

  for (const run of runs) {
    const a = Math.max(0, run.a - (run.m === 'wet' ? 0 : 1));
    const b = Math.min(n - 1, run.b + (run.m === 'wet' ? 1 : 0));
    const runLen = (S[b] as Sample).s - (S[a] as Sample).s;
    if (run.m === 'skip') continue;
    if (run.m === 'wet') {
      const left: MVec[] = [];
      const right: MVec[] = [];
      for (let i = a; i <= b; i++) {
        edgePoint(i, 1, left, (w[i] as number) / 2);
        edgePoint(i, -1, right, (w[i] as number) / 2);
      }
      // round caps where the run is an end of the stroke
      const cap = (i: number, dirSign: number): MVec[] => {
        const sm = S[i] as Sample;
        const nn = N[i] as MVec;
        const h = (w[i] as number) / 2;
        const pts: MVec[] = [];
        for (let k = 1; k < 5; k++) {
          const ang = (k / 5) * Math.PI;
          const cx = Math.cos(ang);
          const sx = Math.sin(ang);
          pts.push([
            sm.x + nn[0] * h * cx + sm.tx * dirSign * h * sx * 0.9,
            sm.y + nn[1] * h * cx + sm.ty * dirSign * h * sx * 0.9,
          ]);
        }
        return pts;
      };
      const endCap = ins.kind === 'ruling' || burin ? [] : cap(b, 1);
      const startCap = ins.kind === 'ruling' || burin ? [] : cap(a, -1).reverse();
      const poly = [...left, ...endCap, ...right.reverse(), ...startCap];
      bodyD.push(polygonD(simplify(poly, 0.006)));
      continue;
    }
    if (run.m === 'rail') {
      railLen += runLen;
      // two tines and a pale middle
      const l1: MVec[] = [];
      const l2: MVec[] = [];
      const r1: MVec[] = [];
      const r2: MVec[] = [];
      const mid1: MVec[] = [];
      const mid2: MVec[] = [];
      for (let i = a; i <= b; i++) {
        const sm = S[i] as Sample;
        const nn = N[i] as MVec;
        const h = (w[i] as number) / 2;
        // the tines part gradually as the ink falls: no step at the start of a split
        const t = Math.max(0.045, h * (0.3 + 0.7 * smoothstep(0.24, 0.42, load[i] as number)));
        l1.push([sm.x + nn[0] * h, sm.y + nn[1] * h]);
        l2.push([sm.x + nn[0] * (h - t), sm.y + nn[1] * (h - t)]);
        r1.push([sm.x - nn[0] * h, sm.y - nn[1] * h]);
        r2.push([sm.x - nn[0] * (h - t), sm.y - nn[1] * (h - t)]);
        mid1.push([sm.x + nn[0] * (h - t), sm.y + nn[1] * (h - t)]);
        mid2.push([sm.x - nn[0] * (h - t), sm.y - nn[1] * (h - t)]);
      }
      bodyD.push(polygonD(simplify([...l1, ...l2.reverse()], 0.006)));
      bodyD.push(polygonD(simplify([...r1, ...r2.reverse()], 0.006)));
      faintD.push(polygonD(simplify([...mid1, ...mid2.reverse()], 0.006)));
      continue;
    }
    // starved (or a dry medium): the line lands only on the paper's peaks. The ribbon is
    // drawn whole and the plate's grain mask lets through the tooth (one feTurbulence
    // per sheet): light grain for a draining pen or a light hand, heavy for a firm one.
    if (!dry) starvedLen += runLen;
    const seedR = rng.int(1, 1e9);
    const left: MVec[] = [];
    const right: MVec[] = [];
    let pRun = 0;
    let lRun = 0;
    for (let i = a; i <= b; i++) {
      const sm = S[i] as Sample;
      const nn = N[i] as MVec;
      // granular edges: chalk and graphite never leave a clean edge
      const g1 = 0.03 * noise2(sm.x * 11.3, sm.y * 11.3, seedR) * (dry ? 1 : 0.6);
      const g2 = 0.03 * noise2(sm.x * 11.3, sm.y * 11.3, seedR + 9) * (dry ? 1 : 0.6);
      const h = ((w[i] as number) / 2) * (dry ? 0.95 : 0.85);
      left.push([sm.x + nn[0] * (h + g1), sm.y + nn[1] * (h + g1)]);
      right.push([sm.x - nn[0] * (h + g2), sm.y - nn[1] * (h + g2)]);
      pRun += sm.p;
      lRun += load[i] as number;
    }
    const cnt = Math.max(1, b - a + 1);
    pRun /= cnt;
    lRun /= cnt;
    const ribbon = polygonD(simplify([...left, ...right.reverse()], 0.008));
    if (!ribbon) continue;
    if (dry) {
      faintD.push(ribbon);
      grainParts.push({ d: ribbon, heavy: pRun > 0.5, density: Math.min(0.95, density * 1.12) });
    } else {
      grainParts.push({
        d: ribbon,
        heavy: false,
        density: density * (0.55 + 0.45 * clamp(lRun / 0.34)),
      });
    }
  }

  stats.starved = L > 0 ? starvedLen / L : 0;
  stats.railed = L > 0 ? railLen / L : 0;
  stats.feathers = feathers;
  stats.featherLen = feathers ? featherSum / feathers : 0;
  stats.spread = spreadN ? spreadSum / spreadN : 0;
  stats.catches = catches;

  const bodyStr = bodyD.filter(Boolean).join('');
  if (bodyStr) parts.push({ kind: 'body', d: bodyStr, density });
  if (wisps.length)
    parts.push({
      kind: 'feather',
      d: wisps.map((wp) => polylineD(wp)).join(''),
      density: density * 0.62,
      stroke: 0.016,
    });
  const faintStr = faintD.filter(Boolean).join('');
  // dry media: a continuous pale tone under the grain (chalk shows more paper than graphite)
  const baseK = ins.id === 'chalk' ? 0.34 : ins.id === 'silverpoint' ? 0.6 : 0.5;
  if (faintStr)
    parts.push({ kind: 'faint', d: faintStr, density: dry ? density * baseK : density * 0.28 });
  for (const g of grainParts)
    parts.push({ kind: 'grain', d: g.d, density: g.density, grain: g.heavy ? 'heavy' : 'light' });

  // ── pools: where the pen rests ──
  if (wetPen && !exact) {
    const pools: { c: MVec; r: number; along: MVec }[] = [];
    const first = S[0] as Sample;
    // a contour or a letter rests after the dip and blots; a hatch is a flick and rarely does
    const fast = perf.role === 'hatch' || perf.role === 'searching';
    const dipRest = fast
      ? rng.chance(0.35)
        ? rng.range(0.03, 0.06)
        : 0
      : rng.chance(0.5)
        ? Math.max(perf.dwellStart, 0.08)
        : Math.min(perf.dwellStart, 0.02);
    const restStart = dip ? dipRest : perf.dwellStart;
    if (restStart > 0.03) {
      const wi = Math.max(w[Math.min(n - 1, 2)] as number, ins.w0 * 1.5);
      const r = Math.min(
        0.95,
        Math.max(
          wi * 0.55,
          (wi / 2) *
            (1.05 + 1.15 * inkSpec.pool * Math.sqrt(restStart / 0.12)) *
            (0.75 + 0.35 * (load[0] as number)),
        ),
      );
      pools.push({
        c: [first.x - first.tx * r * 0.22, first.y - first.ty * r * 0.22],
        r,
        along: [first.tx, first.ty],
      });
    }
    if (perf.end === 'stop' && perf.dwellEnd > 0.04) {
      const last = S[n - 1] as Sample;
      const wi = Math.max(w[Math.max(0, n - 3)] as number, ins.w0 * 1.5);
      const r = Math.min(
        0.85,
        (wi / 2) *
          (1.0 + 0.9 * inkSpec.pool * Math.sqrt(perf.dwellEnd / 0.12)) *
          (0.7 + 0.4 * (load[n - 1] as number)),
      );
      pools.push({
        c: [last.x + last.tx * r * 0.15, last.y + last.ty * r * 0.15],
        r,
        along: [last.tx, last.ty],
      });
    }
    // a sharp corner taken slowly (not in lettering: a 2.5 mm letter would blot at every turn)
    for (let i = 3; i < n - 3 && perf.role !== 'letter'; i++) {
      const sm = S[i] as Sample;
      if (sm.v < 7 && (S[i - 1] as Sample).v >= 7 && (load[i] as number) > 0.35) {
        const r = (w[i] as number) * 0.62;
        pools.push({ c: [sm.x, sm.y], r, along: [sm.tx, sm.ty] });
      }
    }
    const poolD: string[] = [];
    const rimD: string[] = [];
    for (const pl of pools) {
      const shape = blob(pl.c, pl.r, pl.along, rng.range(1.08, 1.32), rng);
      poolD.push(polygonD(shape));
      if (inkSpec.rim > 0) {
        const inner = shape.map(
          (p) => [pl.c[0] + (p[0] - pl.c[0]) * 0.8, pl.c[1] + (p[1] - pl.c[1]) * 0.8] as MVec,
        );
        rimD.push(polygonD(shape) + polygonD(inner.reverse()));
      }
    }
    stats.pools = pools.length;
    if (poolD.length)
      parts.push({
        kind: 'pool',
        d: poolD.join(''),
        density: clamp(density + 0.05 + 0.1 * inkSpec.pool * loadMean, 0, 0.985),
      });
    if (rimD.length)
      parts.push({
        kind: 'rim',
        d: rimD.join(''),
        density: 0.06 + 0.16 * inkSpec.rim,
        evenodd: true,
      });
  }

  // ── spatter: a fast loaded flick, a catch ──
  if (wetPen && !exact && perf.end === 'taper') {
    const last = S[n - 1] as Sample;
    if (last.v > 110 && (load[n - 1] as number) > 0.45 && rng.chance(0.07 * inkSpec.pool)) {
      const k = rng.int(1, 3);
      for (let q = 0; q < k; q++) {
        const dd = rng.range(0.3, 2.4);
        const side = rng.normal() * 0.35;
        spatterPts.push({
          c: [last.x + last.tx * dd - last.ty * side, last.y + last.ty * dd + last.tx * side],
          r: rng.range(0.025, 0.11),
        });
      }
    }
  }
  if (spatterPts.length) {
    const d = spatterPts
      .map((sp) => polygonD(blob(sp.c, sp.r, [1, 0], rng.range(1, 1.4), rng, 12)))
      .join('');
    parts.push({ kind: 'spatter', d, density });
    stats.spatter = spatterPts.length;
  }

  // ── damage of time: the halo (only when a plate sets time) ──
  if (wetPen && o.time > 0 && inkSpec.haloStrength > 0) {
    const seedH = rng.int(1, 1e9);
    const left: MVec[] = [];
    const right: MVec[] = [];
    let hSum = 0;
    for (let i = 0; i < n; i++) {
      const sm = S[i] as Sample;
      const nn = N[i] as MVec;
      const ab = paper.absorb(sm.x, sm.y);
      const hw =
        inkSpec.haloStrength *
        o.time *
        (0.1 + 0.32 * ab * (load[i] as number)) *
        (0.75 + 0.25 * noise2(sm.x * 1.7, sm.y * 1.7, seedH));
      hSum += hw;
      const h = (w[i] as number) / 2 + hw;
      left.push([sm.x + nn[0] * h, sm.y + nn[1] * h]);
      right.push([sm.x - nn[0] * h, sm.y - nn[1] * h]);
    }
    stats.halo = hSum / Math.max(1, n);
    parts.push({
      kind: 'halo',
      d: polygonD(simplify([...left, ...right.reverse()], 0.01)),
      density: 0.05 + 0.1 * inkSpec.haloStrength * o.time,
      color: inkSpec.halo,
    });
  }

  return { parts, stats, spine, widths };
}

/** A compact description of a stroke for debugging and the specimen captions. */
export function describe(st: StrokeStats): string {
  return `w ${f2(st.wMin)}–${f2(st.wMax)} mm (cv ${f2(st.wCv)}) · load ${f2(st.load)} · pools ${st.pools} · starved ${f2(st.starved * 100)}% · feathers ${st.feathers}`;
}
