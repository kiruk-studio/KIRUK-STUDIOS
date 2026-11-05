/**
 * The critic — every plate is proved before anyone is asked to look at it.
 *
 * Eight dimensions, each check ending in a number, a target and a reason with its source:
 *   lighting · measurement · style · connections · typography · bleed · layout · creativity
 *
 * Two families of failure are hunted on purpose:
 *   PLOTTER  the hand is missing: constant width, butt ends, zero tremor, evenly spaced
 *            hatching, lines that meet exactly, no dip rhythm
 *   COSTUME  the look without the reasons: faux age, mirror or script notes nobody can read,
 *            ornamental geometry, cross-hatching all over a left-handed codex, blots
 *            everywhere, many colours (research 01 §5)
 *
 * Creativity cannot be computed. The critic checks its preconditions (a claim, true
 * numbers, a device, selective finish, process shown, the eye motif) and always leaves
 * one item open for the founder's eye.
 */
import { contrast, type RGB } from '../core/color.ts';
import { distToPath, segmentIntersection } from '../core/path.ts';
import type { MVec, Vec } from '../core/vec.ts';
import { INKS } from '../ink/inks.ts';
import { light2d } from '../light/light.ts';
import type { Mark, Plate } from '../plate/plate.ts';

export type Dimension =
  | 'lighting'
  | 'measurement'
  | 'style'
  | 'connections'
  | 'typography'
  | 'bleed'
  | 'layout'
  | 'creativity';
export type Status = 'pass' | 'warn' | 'fail' | 'human';

export interface Check {
  id: string;
  dimension: Dimension;
  title: string;
  status: Status;
  value: string;
  target: string;
  why: string;
  fix?: string;
  where?: string[];
}

export interface PixelFacts {
  /** Darkness-weighted centroid of the ink, as fractions of width and height. */
  centroid: [number, number];
  /** Contrast of each text item against the paper round it (by text id). */
  textContrast: Record<string, number>;
  /** Share of the sheet inside the margins with essentially no ink. */
  white: number;
}

export interface AnatomyRow {
  id: string;
  name: string;
  finish: 'construction' | 'line' | 'tone';
  ok: boolean;
  issues: string[];
}

export interface Report {
  plate: string;
  title: string;
  style: string;
  verdict: 'pass' | 'warn' | 'fail';
  checks: Check[];
  /** The plate's parts, each checked on its own. */
  anatomy: AnatomyRow[];
  counts: Record<Dimension, Record<Status, number>>;
  stats: Record<string, number>;
}

export const DIMENSIONS: readonly Dimension[] = [
  'lighting',
  'measurement',
  'style',
  'connections',
  'typography',
  'bleed',
  'layout',
  'creativity',
];

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const cv = (xs: number[]) => {
  const m = mean(xs);
  if (!xs.length || m === 0) return 0;
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) / Math.abs(m);
};
const r2 = (x: number) => (Math.round(x * 100) / 100).toString();
const r3 = (x: number) => (Math.round(x * 1000) / 1000).toString();
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Spearman rank correlation. */
function spearman(a: number[], b: number[]): number {
  const rank = (xs: number[]) => {
    const idx = xs.map((x, i) => [x, i] as const).sort((p, q) => p[0] - q[0]);
    const r = new Array<number>(xs.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (
        j + 1 < idx.length &&
        (idx[j + 1] as readonly [number, number])[0] === (idx[i] as readonly [number, number])[0]
      )
        j++;
      const avg = (i + j) / 2;
      for (let k = i; k <= j; k++) r[(idx[k] as readonly [number, number])[1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const ra = rank(a);
  const rb = rank(b);
  const ma = mean(ra);
  const mb = mean(rb);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    const x = (ra[i] as number) - ma;
    const y = (rb[i] as number) - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Ink area laid along each spine segment, binned on a grid (mm²). */
function coverageGrid(marks: Mark[], x0: number, y0: number, w: number, h: number, cell: number) {
  const nx = Math.max(1, Math.ceil(w / cell));
  const ny = Math.max(1, Math.ceil(h / cell));
  const g = new Float64Array(nx * ny);
  for (const m of marks) {
    const sp = m.spine;
    for (let i = 1; i < sp.length; i++) {
      const a = sp[i - 1] as MVec;
      const b = sp[i] as MVec;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const wi = (((m.widths[i - 1] ?? 0) as number) + ((m.widths[i] ?? 0) as number)) / 2;
      const area = len * wi * m.stats.density;
      const cx = Math.floor(((a[0] + b[0]) / 2 - x0) / cell);
      const cy = Math.floor(((a[1] + b[1]) / 2 - y0) / cell);
      if (cx >= 0 && cy >= 0 && cx < nx && cy < ny)
        g[cy * nx + cx] = (g[cy * nx + cx] as number) + area;
    }
  }
  return { g, nx, ny };
}

function boxOf(m: Mark): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of m.spine) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

const overlap = (a: readonly number[], b: readonly number[]) =>
  Math.max(0, Math.min(a[2] as number, b[2] as number) - Math.max(a[0] as number, b[0] as number)) *
  Math.max(0, Math.min(a[3] as number, b[3] as number) - Math.max(a[1] as number, b[1] as number));

export interface CritiqueOptions {
  /** Width the plate is shown at on a phone, px (the 11 px floor is checked there). */
  phoneWidthPx?: number;
  pixels?: PixelFacts;
}

export function critique(plate: Plate, o: CritiqueOptions = {}): Report {
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);
  const S = plate.style;
  const [W, H] = plate.size;
  const [mt, mr, mb, ml] = plate.margins;
  const L2 = light2d(plate.light);
  const marks = plate.marks;
  const inkLayers = new Set(['ink', 'letter']);
  const free = marks.filter(
    (m) => m.guide === 'free' && inkLayers.has(m.layer) && m.stats.length >= 3 && !INKS[m.ink].dry,
  );
  const freeAll = marks.filter(
    (m) => m.guide === 'free' && inkLayers.has(m.layer) && m.stats.length >= 3,
  );
  const hatches = marks.filter((m) => m.role === 'hatch');
  const contours = marks.filter((m) => m.role === 'contour');

  // ───────────────────────── lighting ─────────────────────────
  const untied = hatches.filter((m) => !m.form);
  add({
    id: 'light.tied',
    dimension: 'lighting',
    title: 'Every tone is tied to a form under the one light',
    status: untied.length === 0 ? 'pass' : 'warn',
    value: `${untied.length} of ${hatches.length} hatch strokes without a form`,
    target: '0',
    why: 'One light per plate, declared (research 02 §11). Tone not tied to a form cannot be proved against it.',
    fix: 'Lay tone with hatch({ form }) so each stroke records its form and target tone.',
  });
  for (const f of plate.forms) {
    const fm = marks.filter((m) => m.form === f.id && (m.role === 'hatch' || m.role === 'stipple'));
    if (fm.length < 8) continue;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of f.outline) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    // cells sized to the form (a thin channel needs fine cells), tone averaged over each
    let area = 0;
    for (let i = 0; i < f.outline.length; i++) {
      const a = f.outline[i] as MVec;
      const b = f.outline[(i + 1) % f.outline.length] as MVec;
      area += a[0] * b[1] - b[0] * a[1];
    }
    const cell = Math.max(0.8, Math.min(3, Math.sqrt(Math.abs(area / 2)) / 12));
    const { g, nx, ny } = coverageGrid(fm, x0, y0, x1 - x0, y1 - y0, cell);
    const tones: number[] = [];
    const cov: number[] = [];
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let tSum = 0;
        let tN = 0;
        for (const dy of [0.2, 0.5, 0.8])
          for (const dx of [0.2, 0.5, 0.8]) {
            const q: Vec = [x0 + (i + dx) * cell, y0 + (j + dy) * cell];
            if (!pointInOutline(q, f.outline)) continue;
            tSum += f.tone(q);
            tN++;
          }
        if (tN < 5) continue;
        tones.push(tSum / tN);
        cov.push((g[j * nx + i] as number) / (cell * cell));
      }
    if (tones.length < 6) continue;
    const tMean = mean(tones);
    if (Math.sqrt(mean(tones.map((t) => (t - tMean) ** 2))) < 0.02) {
      const inked = cov.filter((c) => c > 0).length / cov.length;
      add({
        id: `light.even:${f.id}`,
        dimension: 'lighting',
        title: `“${f.id}” is one even tone, laid as asked`,
        status: inked >= 0.5 ? 'pass' : 'warn',
        value: `${pct(inked)} of its cells carry ink`,
        target: '≥ 50%',
        why: 'A flat tone (a cast shadow, a cut face) has no gradient to follow; it must still be laid across the region.',
      });
      continue;
    }
    const rho = spearman(tones, cov);
    add({
      id: `light.follows:${f.id}`,
      dimension: 'lighting',
      title: `Ink follows the light on “${f.id}”`,
      status: rho >= 0.6 ? 'pass' : rho >= 0.4 ? 'warn' : 'fail',
      value: `ρ = ${r2(rho)} (tone vs ink, ${tones.length} cells)`,
      target: 'ρ ≥ 0.6',
      why: 'Darker target tone must carry more ink everywhere on the form; Leonardo ¶555: shadow first on the part away from the light.',
      fix: 'Check the form’s normals and the plate light; do not hand-place hatching that the light does not ask for.',
    });
    const order = tones.map((t, i) => [t, cov[i] as number] as const).sort((a, b) => a[0] - b[0]);
    const q = Math.max(1, Math.floor(order.length / 4));
    const litCov = mean(order.slice(0, q).map((x) => x[1]));
    const darkCov = mean(order.slice(-q).map((x) => x[1]));
    add({
      id: `light.lit-clear:${f.id}`,
      dimension: 'lighting',
      title: `The lit side of “${f.id}” stays paper`,
      status: litCov <= 0.25 * darkCov + 1e-6 ? 'pass' : litCov <= 0.45 * darkCov ? 'warn' : 'fail',
      value: `lit ${r3(litCov)} vs dark ${r3(darkCov)} ink/mm²`,
      target: 'lit ≤ 25% of dark',
      why: 'Where the light falls the paper is the light; ink there flattens the form.',
    });
  }
  const shaded = contours.filter((m) => m.form && m.spine.length > 6);
  if (shaded.length) {
    let litW = 0;
    let litN = 0;
    let darkW = 0;
    let darkN = 0;
    for (const m of shaded) {
      const f = plate.forms.find((x) => x.id === m.form);
      if (!f) continue;
      let cx = 0;
      let cy = 0;
      for (const [x, y] of f.outline) {
        cx += x;
        cy += y;
      }
      cx /= f.outline.length;
      cy /= f.outline.length;
      m.spine.forEach((p, i) => {
        const nxv = p[0] - cx;
        const nyv = p[1] - cy;
        const l = Math.hypot(nxv, nyv) || 1;
        const facing = (nxv / l) * L2[0] + (nyv / l) * L2[1];
        const w = m.widths[i] ?? 0;
        if (facing > 0.35) {
          litW += w;
          litN++;
        } else if (facing < -0.35) {
          darkW += w;
          darkN++;
        }
      });
    }
    const ratio = litN && darkN ? darkW / darkN / (litW / litN) : 1;
    add({
      id: 'light.contour-weight',
      dimension: 'lighting',
      title: 'Contours are heavy away from the light',
      status: ratio >= 1.15 ? 'pass' : ratio >= 1.03 ? 'warn' : 'fail',
      value: `shadow side ${r2(ratio)}× the lit side`,
      target: '≥ 1.15×',
      why: 'The quill contour swells where the edge turns from the light (research 01 §1: variable weight).',
      fix: 'Draw outlines with contour(), which weights pressure by the light.',
    });
  }

  // ───────────────────────── measurement ─────────────────────────
  for (const d of plate.dimensions) {
    const num = Number.parseFloat(
      d.text
        .replace(/[^0-9.-]+/g, ' ')
        .trim()
        .split(' ')[0] ?? 'NaN',
    );
    const digits = (d.text.match(/\.(\d+)/)?.[1]?.length ?? 0) as number;
    const tol = Math.max(0.5 * 10 ** -digits, Math.abs(d.value) * 0.005);
    const ok = Number.isFinite(num) && Math.abs(num - d.value) <= tol + 1e-9;
    add({
      id: `measure.true:${d.id}`,
      dimension: 'measurement',
      title: `Dimension ${d.id} says what the ink measures`,
      status: ok ? 'pass' : 'fail',
      value: `label “${d.text}”, ink ${r3(d.value)} ${d.unit}`,
      target: `|Δ| ≤ ${r3(tol)}`,
      why: 'Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed.',
      fix: 'Let dimension() compute the value, or correct the geometry, not the label.',
    });
    // a redline sits in the gap it measures, ticked at the edges, with no extension lines
    // (the design-review convention): the drafting tiers do not apply to it
    const red = d.kind === 'redline';
    const gapA = Math.hypot(d.ext[0][0][0] - d.a[0], d.ext[0][0][1] - d.a[1]);
    const overA = Math.hypot(d.ext[0][1][0] - d.line[0][0], d.ext[0][1][1] - d.line[0][1]);
    if (!red)
      add({
        id: `measure.extension:${d.id}`,
        dimension: 'measurement',
        title: `Extension lines of ${d.id}: gap and overshoot`,
        status: gapA >= 0.8 && gapA <= 2.5 && overA >= 1.5 && overA <= 3.6 ? 'pass' : 'warn',
        value: `gap ${r2(gapA)} mm, overshoot ${r2(overA)} mm`,
        target: 'gap ≈ 1.5 (0.8–2.5), overshoot 2.5–3 (1.5–3.6) mm',
        why: 'ISO 129-1 / ASME as cited in research 03 §2.2.',
      });
    const inkMarks = marks.filter(
      (m) => m.layer === 'ink' && (m.role === 'contour' || m.role === 'hatch'),
    );
    const onInk = (p: Vec) =>
      inkMarks.some((m) => m.spine.length > 1 && distToPath(p, m.spine) <= 0.8);
    const both = onInk(d.feature[0]) && onInk(d.feature[1]);
    add({
      id: `measure.on-ink:${d.id}`,
      dimension: 'measurement',
      title: `${d.id} measures the visible ink`,
      status: both ? 'pass' : 'fail',
      value: both ? 'both ends on ink' : 'an end is not on any drawn line',
      target: 'both ends within 0.8 mm of ink',
      why: 'Measure to the visible ink or a stated datum, never to the bounding box (research 03 R9).',
    });
    const off = Math.hypot(d.line[0][0] - d.a[0], d.line[0][1] - d.a[1]);
    if (!red)
      add({
        id: `measure.tier:${d.id}`,
        dimension: 'measurement',
        title: `${d.id} stands clear of the drawing`,
        status: off >= 6 ? 'pass' : off >= 4 ? 'warn' : 'fail',
        value: `${r2(off)} mm from the feature`,
        target: '≥ 6 mm (first tier 10–12 mm)',
        why: 'Research 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart.',
      });
  }
  const hasScale =
    plate.dimensions.length > 0 || Object.keys(plate.truth).some((k) => k.startsWith('scale:'));
  add({
    id: 'measure.unit',
    dimension: 'measurement',
    title: 'The plate states a unit or module',
    status: hasScale ? 'pass' : 'fail',
    value: hasScale ? `unit ${plate.scale.unit}` : 'no scale bar, no dimension',
    target: 'a scale bar or a dimension',
    why: 'Every plate states a unit or module, or shows a familiar object at scale (research 01 R13, 02 R13).',
  });
  const unsourced = Object.entries(plate.truth).filter(([, t]) => !t.source || t.source.length < 3);
  add({
    id: 'measure.sourced',
    dimension: 'measurement',
    title: 'Every fact on the plate has a source',
    status: unsourced.length ? 'fail' : Object.keys(plate.truth).length ? 'pass' : 'warn',
    value: `${Object.keys(plate.truth).length} facts, ${unsourced.length} without a source`,
    target: 'all sourced',
    why: 'If it is not in the truth table it is not on the sheet (codex step 2).',
  });

  // ───────────────────────── style ─────────────────────────
  const env = S.envelope;
  const wcv = median(freeAll.map((m) => m.stats.wCv));
  add({
    id: 'style.width',
    dimension: 'style',
    title: 'Line width breathes (not a plotter, not chaos)',
    status:
      freeAll.length === 0
        ? 'warn'
        : wcv < env.wCv[0]
          ? 'fail'
          : wcv > env.wCv[1]
            ? 'warn'
            : 'pass',
    value: `median width CV ${r2(wcv)} over ${freeAll.length} strokes`,
    target: `${env.wCv[0]}–${env.wCv[1]} (${S.id})`,
    why: 'Taper and variable weight are the defining marks of the hand (research 01 §1); constant width is the plotter tell.',
  });
  const trem = median(freeAll.map((m) => m.stats.tremorRms));
  add({
    id: 'style.tremor',
    dimension: 'style',
    title: 'The hand trembles a little, where it is slow',
    status: trem < env.tremor[0] ? 'fail' : trem > env.tremor[1] ? 'warn' : 'pass',
    value: `median tremor ${r3(trem)} mm`,
    target: `${env.tremor[0]}–${env.tremor[1]} mm`,
    why: 'Physiological tremor (8–12 Hz) shows on slow strokes; none at all is a plotter, too much is a costume wobble.',
  });
  const tapered = free.filter(
    (m) => m.stats.endIn < 0.85 || m.stats.endOut < 0.85 || m.stats.pools > 0,
  );
  const tShare = free.length ? tapered.length / free.length : 1;
  add({
    id: 'style.ends',
    dimension: 'style',
    title: 'Strokes enter and leave like a pen',
    status: tShare >= 0.7 ? 'pass' : tShare >= 0.5 ? 'warn' : 'fail',
    value: `${pct(tShare)} tapered or pooled`,
    target: '≥ 70%',
    why: 'A quill lands on its weight, tapers or hooks as it leaves (research 01 §1); butt ends read as plotted.',
  });
  if (S.hatch.rule === 'one-slope') {
    const parallel = hatches.filter(
      (m) => m.slope !== undefined && plate.forms.find((f) => f.id === m.form),
    );
    const offSlope = parallel.filter((m) => {
      const d = Math.abs((((((m.slope as number) - S.hatch.slope + 90) % 180) + 180) % 180) - 90);
      return d > S.hatch.slopeTolerance;
    });
    if (parallel.length)
      add({
        id: 'style.slope',
        dimension: 'style',
        title: `Hatching keeps the ${S.id} slope`,
        status: offSlope.length / parallel.length <= 0.1 ? 'pass' : 'fail',
        value: `${offSlope.length} of ${parallel.length} off ${S.hatch.slope}° ± ${S.hatch.slopeTolerance}°`,
        target: '≤ 10%',
        why:
          S.id === 'codex'
            ? 'Leonardo hatched “\\” with the left hand; right-handed hatching is the experts’ tell (research 01 §1).'
            : 'One hand, one slope: travel varies, the slope stays (research 01 §1).',
      });
  } else {
    // per form: one family on each surface (plus the style's crossing family where it allows one)
    const bad: string[] = [];
    const byGroup = new Map<string, Set<number>>();
    for (const m of hatches) {
      if (!m.group || m.slope === undefined) continue;
      const set = byGroup.get(m.group) ?? new Set<number>();
      set.add(Math.round((((m.slope as number) % 180) + 180) % 180));
      byGroup.set(m.group, set);
    }
    for (const [g, set] of byGroup) if (set.size > (S.hatch.cross ? 2 : 1)) bad.push(g);
    add({
      id: 'style.slope',
      dimension: 'style',
      title: 'Each surface keeps its own direction',
      status: bad.length ? 'fail' : 'pass',
      value: bad.length
        ? `mixed directions in ${bad.join(', ')}`
        : `${byGroup.size} hatch fields, one direction each`,
      target: 'one family per surface',
      why: 'A different angle for each adjacent part, regular within it (research 02 §11, R9).',
    });
  }
  if (!S.hatch.cross) {
    const fams = new Map<string, Set<number>>();
    for (const m of hatches) {
      if (!m.form || m.slope === undefined) continue;
      const s = fams.get(m.form) ?? new Set<number>();
      s.add(Math.round((m.slope as number) / 15));
      fams.set(m.form, s);
    }
    const crossed = [...fams.entries()].filter(([, s]) => s.size > 1).map(([k]) => k);
    add({
      id: 'style.no-cross',
      dimension: 'style',
      title: 'No cross-hatching where the style forbids it',
      status: crossed.length ? 'fail' : 'pass',
      value: crossed.length ? `crossed on ${crossed.join(', ')}` : 'one family per form',
      target: 'one slope family',
      why: 'Cross-hatching everywhere is a named fake (research 01 R10, §5).',
    });
  }
  // evenly spaced hatching is the plotter's
  const groups = new Map<string, Mark[]>();
  for (const m of hatches) if (m.group) groups.set(m.group, [...(groups.get(m.group) ?? []), m]);
  const evenGroups: string[] = [];
  const minGaps: number[] = [];
  for (const [gid, ms] of groups) {
    if (ms.length < 12) continue;
    const slope = ((ms[0]?.slope ?? 0) * Math.PI) / 180;
    const nrm: Vec = [-Math.sin(slope), Math.cos(slope)];
    const proj = ms.map((m) => {
      const mid = m.spine[Math.floor(m.spine.length / 2)] as MVec;
      return mid[0] * nrm[0] + mid[1] * nrm[1];
    });
    proj.sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < proj.length; i++) {
      const g = (proj[i] as number) - (proj[i - 1] as number);
      if (g > 0.05) gaps.push(g);
    }
    const lens = ms.map((m) => m.stats.length);
    if (gaps.length > 6 && cv(gaps) < 0.06 && cv(lens) < 0.12) evenGroups.push(gid);
    if (gaps.length) minGaps.push(median(gaps));
  }
  add({
    id: 'style.uneven',
    dimension: 'style',
    title: 'Hatching is laid by hand, not by machine',
    status: evenGroups.length ? 'fail' : 'pass',
    value: evenGroups.length
      ? `mechanically even: ${evenGroups.join(', ')}`
      : `${groups.size} hatch fields, none mechanical`,
    target: 'gap CV ≥ 0.06 or length CV ≥ 0.12',
    why: 'Equal gaps and equal lengths are the screen of a plotter.',
  });
  const hues = new Set<string>();
  for (const m of marks) {
    const c = INKS[m.ink].color;
    if (m.ink === 'white') continue;
    const mx = Math.max(...c);
    const mn = Math.min(...c);
    hues.add(
      mx - mn < 0.08
        ? 'neutral'
        : c[0] >= c[1] && c[0] >= c[2]
          ? c[1] > 0.3
            ? 'warm'
            : 'red'
          : c[2] >= c[0]
            ? 'blue'
            : 'green',
    );
  }
  add({
    id: 'style.palette',
    dimension: 'style',
    title: 'Few colours: ink, construction, overlay',
    status: hues.size <= env.hues ? 'pass' : 'fail',
    value: `${hues.size} hue families (${[...hues].join(', ')})`,
    target: `≤ ${env.hues}`,
    why: 'Monochrome ink on a light ground plus at most one accent (research 01 R12); many colours or effects is a named fake (01 §5).',
  });
  const reds =
    marks.some((m) => m.layer === 'overlay' && (m.ink === 'rubric' || m.ink === 'rubric-type')) &&
    marks.some(
      (m) => (m.layer === 'construction' || m.layer === 'underdrawing') && m.ink === 'sanguine',
    );
  if (reds)
    add({
      id: 'style.red-confusion',
      dimension: 'style',
      title: 'Red construction under a red overlay',
      status: 'warn',
      value: 'sanguine construction and rubric overlay on one plate',
      target: 'one red meaning',
      why: 'Red-letter vs red-part confusion (research 02 C1); the research leaves the red-chalk accent vs the rubric overlay open for the founder.',
      fix: 'Use stylus or graphite construction under a rubric overlay, or keep the overlay off this plate.',
    });
  const wobblyOverlay = marks.filter(
    (m) =>
      m.layer === 'overlay' &&
      (m.ink === 'rubric' || m.ink === 'rubric-type') &&
      m.guide !== 'exact',
  );
  add({
    id: 'style.overlay-crisp',
    dimension: 'style',
    title: 'The modern line is exact',
    status: wobblyOverlay.length ? 'fail' : 'pass',
    value: `${wobblyOverlay.length} overlay marks drawn by hand`,
    target: '0',
    why: 'Overlay: one hue, true segments and arcs, no jitter, texture or filter (research 03 R1, R3). The drawing keeps the hand; the line keeps its precision.',
  });
  // visual weight: a wide faint graphite line weighs less than a fine dark ink line
  const wOf = (role: string) =>
    median(
      marks
        .filter((m) => m.role === role && m.stats.wMean > 0)
        .map((m) => m.stats.wMean * m.stats.density),
    );
  const wc = wOf('contour');
  const wh = wOf('hatch');
  const wk = wOf('construction');
  if (wc && wh)
    add({
      id: 'style.hierarchy',
      dimension: 'style',
      title: 'Outline > interior > construction',
      status: wc > wh && (!wk || wh >= wk * 0.9) ? 'pass' : 'fail',
      value: `contour ${r3(wc)} · hatch ${r3(wh)} · construction ${r3(wk)} (width × density)`,
      target: 'decreasing',
      why: 'Line weight hierarchy (research 02 R14).',
    });
  const dipped = free.filter((m) => m.stats.dip && m.role !== 'hatch');
  const poolRate = dipped.length
    ? dipped.filter((m) => m.stats.pools > 0).length / dipped.length
    : -1;
  if (poolRate >= 0)
    add({
      id: 'style.dip-pools',
      dimension: 'style',
      title: 'A fresh dip shows, sometimes',
      status: poolRate >= env.poolRate[0] && poolRate <= env.poolRate[1] ? 'pass' : 'warn',
      value: `${pct(poolRate)} of dipped strokes pool`,
      target: `${pct(env.poolRate[0])}–${pct(env.poolRate[1])}`,
      why: 'The dip rhythm is the clock of a pen drawing: dark after the dip, paler as it drains.',
    });

  // ───────────────────────── connections ─────────────────────────
  const anchored = contours.filter((m) => m.stats.length > 4);
  const misses = anchored.flatMap((m) => [m.stats.startMiss, m.stats.endMiss]);
  if (misses.length) {
    const mx = Math.max(...misses);
    const md = median(misses);
    add({
      id: 'connect.landing',
      dimension: 'connections',
      title: 'Contours land where they are meant to (near, not on)',
      status: mx > 1.2 ? 'fail' : md === 0 ? 'warn' : md > 0.35 ? 'warn' : 'pass',
      value: `median miss ${r3(md)} mm, worst ${r2(mx)} mm`,
      target: 'median 0.02–0.35, worst ≤ 1.2 mm',
      why: 'A hand lands a joined line a hair short or a hair past; exactly on is a plotter, far off is a broken drawing.',
    });
  }
  const orphans = plate.constructions.filter((c) => c.generates.length === 0);
  add({
    id: 'connect.generative',
    dimension: 'connections',
    title: 'Every construction generated something',
    status: orphans.length ? 'fail' : 'pass',
    value: `${orphans.length} of ${plate.constructions.length} generate nothing${
      orphans.length
        ? `: ${orphans
            .slice(0, 6)
            .map((c) => c.id)
            .join(', ')}`
        : ''
    }`,
    target: '0 orphans',
    why: 'Construction appears only if it generated the drawing (research 01 R11); ornamental circles and spirals are a named fake (01 §5).',
    fix: 'plate.generated(constructionId, ...markIds) — or delete it.',
  });
  const leaders = marks.filter((m) => m.role === 'leader' && m.spine.length > 1);
  const crossings: string[] = [];
  for (let i = 0; i < leaders.length; i++)
    for (let j = i + 1; j < leaders.length; j++) {
      const a = leaders[i] as Mark;
      const b = leaders[j] as Mark;
      if (a.group === b.group) continue;
      outer: for (let p = 1; p < a.spine.length; p++)
        for (let q = 1; q < b.spine.length; q++)
          if (
            segmentIntersection(
              a.spine[p - 1] as Vec,
              a.spine[p] as Vec,
              b.spine[q - 1] as Vec,
              b.spine[q] as Vec,
            )
          ) {
            crossings.push(`${a.group}×${b.group}`);
            break outer;
          }
    }
  add({
    id: 'connect.leaders',
    dimension: 'connections',
    title: 'Leaders never cross',
    status: crossings.length ? 'fail' : 'pass',
    value: crossings.length
      ? crossings.join(', ')
      : `${leaders.length} leader strokes, no crossings`,
    target: '0 crossings',
    why: 'ISO 128-22 / research 03 R4–5: no free ends, no crossings.',
  });

  // ───────────────────────── typography ─────────────────────────
  const texts = plate.texts;
  const small = texts.filter((t) => t.cap < 1.8);
  const smallish = texts.filter(
    (t) => t.cap >= 1.8 && t.cap < 2.5 && (t.kind === 'note' || t.kind === 'dimension'),
  );
  add({
    id: 'type.size',
    dimension: 'typography',
    title: 'Lettering meets ISO 3098 sizes',
    status: small.length ? 'fail' : smallish.length ? 'warn' : 'pass',
    value: `${small.length} under 1.8 mm, ${smallish.length} notes/dimensions under 2.5 mm`,
    target: 'notes and dimensions ≥ 2.5 mm; nothing under 1.8 mm',
    why: 'ISO 3098 heights; print ≥ 2.5 mm (research 03 §2.5, §8).',
  });
  const phone = o.phoneWidthPx ?? 390;
  const pxPerMm = phone / W;
  const tooSmallOnPhone = texts.filter((t) => (t.cap / 0.7) * pxPerMm < 11);
  add({
    id: 'type.phone',
    dimension: 'typography',
    title: `Lettering holds 11 px on a ${phone} px phone`,
    status: tooSmallOnPhone.length === 0 ? 'pass' : 'warn',
    value: `${tooSmallOnPhone.length} of ${texts.length} fall under 11 px (sheet shown at ${r2(pxPerMm)} px/mm)`,
    target: '0, or a phone layout that moves them out',
    why: 'Anything under ~11 px at phone width goes outside on a leader, per breakpoint (research 02 C2).',
  });
  const collisions: string[] = [];
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i] as (typeof texts)[number];
      const b = texts[j] as (typeof texts)[number];
      if (a.twin === b.id || b.twin === a.id) continue;
      if (overlap(a.box, b.box) > 0.3) collisions.push(`${a.id}/${b.id}`);
    }
  add({
    id: 'type.collisions',
    dimension: 'typography',
    title: 'No two labels touch',
    status: collisions.length ? 'fail' : 'pass',
    value: collisions.length
      ? collisions.slice(0, 8).join(', ')
      : `${texts.length} labels, none overlapping`,
    target: '0',
    why: 'Each letter in clear space (research 02 R5).',
  });
  const grounded: string[] = [];
  for (const t of texts) {
    const [x0, y0, x1, y1] = t.box;
    const area = Math.max(0.01, (x1 - x0) * (y1 - y0));
    const under = marks.filter(
      (m) =>
        m.group !== t.id &&
        !m.group?.startsWith(t.id) &&
        m.layer !== 'letter' &&
        m.layer !== 'stylus' &&
        m.role !== 'dimension' &&
        m.role !== 'leader' &&
        m.role !== 'overlay',
    );
    let ink = 0;
    for (const m of under) {
      const b = boxOf(m);
      if (overlap(b, t.box) <= 0) continue;
      for (let i = 1; i < m.spine.length; i++) {
        const p = m.spine[i] as MVec;
        if (p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1)
          ink +=
            Math.hypot(p[0] - (m.spine[i - 1] as MVec)[0], p[1] - (m.spine[i - 1] as MVec)[1]) *
            (m.widths[i] ?? 0.2);
      }
    }
    if (ink / area > 0.18) grounded.push(`${t.id} (${pct(ink / area)})`);
  }
  add({
    id: 'type.clear-ground',
    dimension: 'typography',
    title: 'Letters sit on clear paper, never on hatching',
    status: grounded.length ? 'fail' : 'pass',
    value: grounded.length ? grounded.slice(0, 6).join(', ') : 'all clear',
    target: 'ink under a label ≤ 18%',
    why: 'Letters sit in clear space, never on hatching or lines; otherwise outside on a leader (research 02 R5).',
  });
  const outside = texts.filter((t) => t.box[0] < 0 || t.box[1] < 0 || t.box[2] > W || t.box[3] > H);
  add({
    id: 'type.on-sheet',
    dimension: 'typography',
    title: 'Every label is on the sheet',
    status: outside.length ? 'fail' : 'pass',
    value: `${outside.length} off the sheet`,
    target: '0',
    why: 'A label off the sheet is lost.',
  });
  const mirrors = texts.filter((t) => t.mirror);
  const badMirrors = mirrors.filter(
    (t) => !t.twin || !texts.some((u) => u.id === t.twin && !u.mirror),
  );
  add({
    id: 'type.mirror-twin',
    dimension: 'typography',
    title: 'Mirror script always has a readable twin',
    status: badMirrors.length ? 'fail' : 'pass',
    value: `${mirrors.length} mirror texts, ${badMirrors.length} without a readable twin`,
    target: '0',
    why: 'Notes are readable, non-mirrored, true (research 01 R9); pseudo-mirror writing is a named fake (01 §5).',
  });
  const keys = texts.filter((t) => t.kind === 'key');
  // A and A′ name one axis, and a part keeps its label in every view: count distinct names
  const keyNames = [...new Set(keys.map((t) => t.text.replace(/[′'_^{}]/g, '')))];
  const letters = keyNames.filter((k) => /^[A-Z]{1,2}$/.test(k));
  const nums = keyNames.filter((k) => /^\d+$/.test(k));
  add({
    id: 'type.keys',
    dimension: 'typography',
    title: 'One key system, few labelled parts',
    status:
      letters.length && nums.length
        ? 'fail'
        : keyNames.length > 8
          ? 'fail'
          : keyNames.length > 7
            ? 'warn'
            : 'pass',
    value: `${keyNames.length} named parts (${letters.length} letters, ${nums.length} numerals) on ${keys.length} key labels`,
    target: '≤ 7, letters or numerals, never mixed',
    why: 'Capitals for up to ~8 parts, numerals beyond, never mixed (research 02 R4); at most 7 labelled items (03 R12).',
  });
  const paperTone: RGB = plate.paper.spec.tone;
  const lowContrast = texts.filter((t) => {
    if (o.pixels?.textContrast[t.id] !== undefined)
      return (o.pixels.textContrast[t.id] as number) < 4.5;
    return !t.drawn && contrast(t.color, paperTone) < 4.5;
  });
  const measured = Object.entries(o.pixels?.textContrast ?? {}).sort((a, b) => a[1] - b[1]);
  const lowest = measured[0];
  add({
    id: 'type.contrast',
    dimension: 'typography',
    title: 'Lettering reads against the paper',
    status: lowContrast.length ? 'fail' : 'pass',
    value: `${
      o.pixels
        ? `${lowContrast.length} under 4.5:1 on real pixels`
        : `${lowContrast.length} typeset under 4.5:1 (colour estimate)`
    }${
      lowContrast.length
        ? `: ${lowContrast
            .slice(0, 5)
            .map(
              (t) =>
                `${t.id}${o.pixels?.textContrast[t.id] !== undefined ? ` ${r2(o.pixels.textContrast[t.id] as number)}:1` : ''}`,
            )
            .join(', ')}`
        : ''
    }${lowest ? ` (lowest ${r2(lowest[1])}:1, ${lowest[0]})` : ''}`,
    target: '≥ 4.5:1',
    why: 'WCAG 1.4.3, read on the rendered pixels when a proof is run (codex KC-8: estimates lied once), at 12 px/mm where a lettering stroke is three pixels wide, so the reading is the ink as laid and not the screen’s antialiasing.',
  });
  const unglyphed = texts.filter((t) => t.drawn && t.missing);
  add({
    id: 'type.glyphs',
    dimension: 'typography',
    title: 'Every character is drawn',
    status: unglyphed.length ? 'fail' : 'pass',
    value: unglyphed.length
      ? unglyphed
          .slice(0, 5)
          .map((t) => `${t.id} lacks “${t.missing}”`)
          .join(', ')
      : 'every drawn character has a glyph',
    target: '0 blank characters',
    why: 'A character with no glyph comes out as a space: “41°” read “41” before the degree sign was drawn. A silent blank changes what a value says.',
    fix: 'Add the glyph to EXTRA in letter/letter.ts (in Hershey units), or write the character the Hershey subset has.',
  });
  // a dip blots the first letter after it; a blot wider than a third of the letter fills its counter
  const blots = marks.filter((m) => {
    if (m.role !== 'letter' || !m.stats.poolMax || m.spine.length < 1) return false;
    const q = m.spine[Math.floor(m.spine.length / 2)] as MVec;
    const t = texts.find(
      (x) =>
        q[0] >= x.box[0] - 0.3 &&
        q[0] <= x.box[2] + 0.3 &&
        q[1] >= x.box[1] - 0.3 &&
        q[1] <= x.box[3] + 0.3,
    );
    const cap = t ? t.cap : 2.5;
    return 2 * m.stats.poolMax > cap * 0.32;
  });
  const lettered = marks.filter((m) => m.role === 'letter').length;
  if (lettered)
    add({
      id: 'type.blots',
      dimension: 'typography',
      title: 'A blot never fills a letter',
      status: blots.length ? 'fail' : 'pass',
      value: blots.length
        ? `${blots.length} letter strokes blotted past a third of the cap: ${blots
            .slice(0, 4)
            .map((m) => m.id)
            .join(', ')}`
        : `${lettered} letter strokes, every pool under a third of its cap`,
      target: 'pool diameter ≤ 0.32 × cap height',
      why: 'A fresh dip may blot the first letter, but a blot that fills a counter turns a 4 into a 9: a value nobody can trust (plate III, the 345 mm).',
      fix: 'pools on letters are capped at 0.7 × the line width in ink/render.ts; check the renderer was not bypassed',
    });

  // ───────────────────────── bleed ─────────────────────────
  const wet = marks.filter((m) => !INKS[m.ink].dry && m.stats.length > 0 && m.guide !== 'exact');
  const wetLen = wet.reduce((a, m) => a + m.stats.length, 0);
  const feathers = wet.reduce((a, m) => a + m.stats.feathers, 0);
  const fLen = median(wet.filter((m) => m.stats.feathers > 0).map((m) => m.stats.featherLen));
  const per100 = wetLen ? (feathers / wetLen) * 100 : 0;
  const sized = plate.paper.spec.sizing >= 0.6;
  add({
    id: 'bleed.feather',
    dimension: 'bleed',
    title: 'Ink wicks into the sheet as much as this paper allows',
    status: wetLen === 0 ? 'pass' : (sized && per100 > 30) || fLen > 0.35 ? 'warn' : 'pass',
    value: `${r2(per100)} feathers per 100 mm, median ${r3(fLen)} mm (sizing ${plate.paper.spec.sizing})`,
    target: sized ? '≤ 30 per 100 mm on sized paper; length ≤ 0.35 mm' : 'length ≤ 0.35 mm',
    why: 'Feathering follows fibres and sizing; it stays local (founder, ideas/studio-dawn/ink-bleed.md: only the nearby area).',
  });
  const longest = Math.max(0, ...wet.map((m) => m.stats.featherLen));
  add({
    id: 'bleed.local',
    dimension: 'bleed',
    title: 'Bleed stays near its line',
    status: longest <= 0.6 ? 'pass' : 'fail',
    value: `longest mean wisp ${r3(longest)} mm`,
    target: '≤ 0.6 mm',
    why: 'When ink scatters it does not affect the overall area, only the nearby (founder).',
  });
  const spreads = wet.filter((m) => m.stats.spread > 0).map((m) => m.stats.spread);
  if (spreads.length > 10)
    add({
      id: 'bleed.varies',
      dimension: 'bleed',
      title: 'Bleed varies with the sheet (not a filter)',
      status: cv(spreads) >= 0.15 ? 'pass' : 'warn',
      value: `spread CV ${r2(cv(spreads))}`,
      target: '≥ 0.15',
      why: 'Uniform bleed is a filter look; real bleed follows absorbency, load and fibre.',
    });
  const dryBad = marks.filter(
    (m) => INKS[m.ink].dry && (m.stats.pools > 0 || m.stats.feathers > 0),
  );
  add({
    id: 'bleed.dry-media',
    dimension: 'bleed',
    title: 'Chalk, graphite and metalpoint never pool or feather',
    status: dryBad.length ? 'fail' : 'pass',
    value: `${dryBad.length} dry marks with pools or feathers`,
    target: '0',
    why: 'Dry media sit on the tooth; they have no liquid to move.',
  });
  const pooled = wet.filter((m) => m.stats.pools > 0).length;
  const poolShare = wet.length ? pooled / wet.length : 0;
  add({
    id: 'bleed.pools',
    dimension: 'bleed',
    title: 'Blots are events, not decoration',
    status:
      wet.length === 0
        ? 'pass'
        : poolShare > 0.4
          ? 'fail'
          : poolShare < 0.01 && wet.length > 40
            ? 'warn'
            : 'pass',
    value: `${pct(poolShare)} of wet strokes pool`,
    target: '1%–40%',
    why: 'Blots everywhere are costume; none at all is a plotter.',
  });
  if ((plate.spec.time ?? 0) > 0)
    add({
      id: 'bleed.time',
      dimension: 'bleed',
      title: 'Shown as found (halo, browning)',
      status: 'human',
      value: `time ${plate.spec.time}: “${plate.spec.timeReason}”`,
      target: 'founder confirms',
      why: 'Faux age is the first tell of a fake (research 01 §1, R14). Confirm the reason is real.',
    });

  // ───────────────────────── layout ─────────────────────────
  const inkMarks = marks.filter((m) => m.layer === 'ink' && m.spine.length);
  const off = inkMarks.filter((m) =>
    m.spine.some(([x, y]) => x < ml - 0.5 || y < mt - 0.5 || x > W - mr + 0.5 || y > H - mb + 0.5),
  );
  add({
    id: 'layout.margins',
    dimension: 'layout',
    title: 'The drawing keeps its margins',
    status: off.length === 0 ? 'pass' : off.length <= 3 ? 'warn' : 'fail',
    value: `${off.length} ink strokes in the margins`,
    target: '0',
    why: 'Rule the sheet first: margins, subject zone, key and notes zones (research 02 R1).',
  });
  let cxw = 0;
  let cyw = 0;
  let wsum = 0;
  for (const m of marks) {
    if (m.layer === 'stylus') continue;
    for (let i = 1; i < m.spine.length; i++) {
      const a = m.spine[i - 1] as MVec;
      const b = m.spine[i] as MVec;
      const wgt = Math.hypot(b[0] - a[0], b[1] - a[1]) * (m.widths[i] ?? 0.2) * m.stats.density;
      cxw += ((a[0] + b[0]) / 2) * wgt;
      cyw += ((a[1] + b[1]) / 2) * wgt;
      wsum += wgt;
    }
  }
  const cxF = o.pixels ? o.pixels.centroid[0] : wsum ? cxw / wsum / W : 0.5;
  const cyF = o.pixels ? o.pixels.centroid[1] : wsum ? cyw / wsum / H : 0.5;
  add({
    id: 'layout.rise',
    dimension: 'layout',
    title: 'The weight of the ink sits at or above the middle',
    status: cyF <= 0.52 ? 'pass' : cyF <= 0.58 ? 'warn' : 'fail',
    value: `ink centroid at ${pct(cyF)} of the height`,
    target: '≤ 52%',
    why: 'The codex “rise”: the sheet carries its weight high (kiruk-codex check.mjs; KC rows). Measured here as the ink-weighted centroid.',
  });
  add({
    id: 'layout.balance',
    dimension: 'layout',
    title: 'The sheet is balanced left to right',
    status: Math.abs(cxF - 0.5) <= 0.12 ? 'pass' : Math.abs(cxF - 0.5) <= 0.2 ? 'warn' : 'fail',
    value: `ink centroid at ${pct(cxF)} of the width`,
    target: '50% ± 12%',
    why: 'The subject is centred and largest; commentary frames it (research 02 R2).',
  });
  if (o.pixels)
    add({
      id: 'layout.white',
      dimension: 'layout',
      title: 'White space is reserved on purpose',
      status: o.pixels.white >= 0.3 && o.pixels.white <= 0.85 ? 'pass' : 'warn',
      value: `${pct(o.pixels.white)} of the sheet is paper`,
      target: '30%–85%',
      why: 'Main figure first, details around it, white space reserved (research 01 §2, R8); collage density is a named fake (01 §5).',
    });

  // ───────────────────────── creativity (preconditions) ─────────────────────────
  const claimWords = plate.spec.claim.trim().split(/\s+/).length;
  add({
    id: 'create.claim',
    dimension: 'creativity',
    title: 'The plate says what it explains',
    status: claimWords >= 6 && plate.spec.claim !== plate.spec.title ? 'pass' : 'fail',
    value: `“${plate.spec.claim}”`,
    target: 'one true sentence, ≥ 6 words',
    why: 'Claim first (codex): the drawing shows what it is; the line shows why it works.',
  });
  const eye = plate.spec.eye;
  const eyeText = eye.motif === 'drawn' ? eye.ref : eye.justification;
  add({
    id: 'create.eye',
    dimension: 'creativity',
    title: 'The eye motif is drawn, or its absence justified',
    status: eyeText.trim().split(/\s+/).length >= 3 ? 'pass' : 'fail',
    value: `${eye.motif}: ${eyeText}`,
    target: 'a reference or a reason',
    why: 'Non-negotiable 4 (CLAUDE.md §5).',
  });
  const devices = [
    'section',
    'cutaway',
    'exploded',
    'build-up',
    'layer',
    'phase',
    'side-by-side',
    'comparison',
    'thread',
    'construction',
    'measured',
  ];
  add({
    id: 'create.device',
    dimension: 'creativity',
    title: 'An explanatory device, not a pretty view',
    status: devices.some((d) => plate.spec.device.toLowerCase().includes(d)) ? 'pass' : 'warn',
    value: plate.spec.device,
    target: 'section · exploded · build-up · phase · side-by-side · thread · construction',
    why: 'Choose the device by what must be explained (research 01 R4); one pretty 3/4 view with arrows is a named fake (01 §5).',
  });
  const formsHatched = new Set(hatches.map((m) => m.form).filter(Boolean));
  const process = marks.some(
    (m) => m.layer === 'construction' || m.layer === 'underdrawing' || m.layer === 'stylus',
  );
  // a part left at construction: construction far from any ink
  const inkSp = marks
    .filter((m) => m.layer === 'ink')
    .flatMap((m) => m.spine.filter((_, i) => i % 3 === 0));
  const consPts = marks
    .filter((m) => m.layer === 'construction' || m.layer === 'underdrawing')
    .flatMap((m) => m.spine.filter((_, i) => i % 4 === 0));
  const bare = consPts.filter(
    (q) => !inkSp.some((r) => Math.abs(r[0] - q[0]) < 6 && Math.abs(r[1] - q[1]) < 6),
  ).length;
  const bareShare = consPts.length ? bare / consPts.length : 0;
  // a line plate with a declared anatomy is selective by declaration
  const declaredLine = plate.parts.length >= 3 && plate.parts.some((pt) => pt.finish !== 'tone');
  const selective =
    formsHatched.size < plate.forms.length ||
    plate.forms.length <= 1 ||
    bareShare >= 0.2 ||
    declaredLine;
  add({
    id: 'create.selective',
    dimension: 'creativity',
    title: 'Finish is selective; the process shows',
    status: process && selective ? 'pass' : 'warn',
    value: `${formsHatched.size} of ${plate.forms.length} forms toned; ${pct(bareShare)} of the construction stands bare`,
    target: 'some parts left at line or construction; construction visible',
    why: 'Everything finished to the same degree is a named fake (research 01 §5, ¶579); kiruk shows its process (CLAUDE.md §2).',
  });
  const views = plate.spec.views ?? 1;
  add({
    id: 'create.views',
    dimension: 'creativity',
    title: 'More than one view of the subject',
    status: views >= 2 ? 'pass' : 'warn',
    value: `${views} view${views === 1 ? '' : 's'}`,
    target: '≥ 2',
    why: 'Leonardo asked for three or four views (research 01 R3, ¶798).',
  });
  const costume: string[] = [];
  if ((plate.spec.time ?? 0) > 0) costume.push('faux age');
  if (badMirrors.length) costume.push('unreadable mirror script');
  if (orphans.length) costume.push('ornamental construction');
  if (checks.some((c) => c.id === 'style.no-cross' && c.status === 'fail'))
    costume.push('cross-hatching in a codex');
  if (checks.some((c) => c.id === 'bleed.pools' && c.status === 'fail'))
    costume.push('blots everywhere');
  add({
    id: 'create.costume',
    dimension: 'creativity',
    title: 'No costume: the look comes with its reasons',
    status: costume.length ? 'fail' : 'pass',
    value: costume.length ? costume.join(', ') : 'none found',
    target: 'none',
    why: 'Research 01 §5: faux age, pseudo-mirror writing, ornamental geometry, all-over cross-hatching, many effects.',
  });
  add({
    id: 'create.founder',
    dimension: 'creativity',
    title: 'Founder’s eye: a hand, not a plotter, not a costume — and new',
    status: 'human',
    value: 'open',
    target: 'founder’s verdict',
    why: 'Non-negotiables 1–3 (no trend-chasing, no boring work, no shallow branding) cannot be computed. Look at the 4× crops first, then the whole sheet at phone width.',
  });

  // ───────────────────────── outer measurement ─────────────────────────
  const overall = plate.dimensions.filter((d) => d.kind === 'overall');
  add({
    id: 'measure.outer',
    dimension: 'measurement',
    title: 'The figure states its overall size',
    status: overall.length || plate.neatlines.length ? 'pass' : 'warn',
    value: `${overall.length} overall dimensions, ${plate.neatlines.length} graduated neatlines`,
    target: 'overall extents in the outer tier, or a graduated neatline',
    why: 'A reader must be able to measure the whole, not only its parts (ISO 129; research 03 §2.2, R14).',
    fix: 'extents(plate, marks) or neatline(plate, rect, { every, origin })',
  });
  const horiz = (d: (typeof plate.dimensions)[number]) =>
    Math.abs(d.line[0][1] - d.line[1][1]) < 0.01;
  const reach = (d: (typeof plate.dimensions)[number]) =>
    horiz(d) ? d.line[0][1] - (d.a[1] + d.b[1]) / 2 : d.line[0][0] - (d.a[0] + d.b[0]) / 2;
  const inverted: string[] = [];
  for (const o of overall) {
    const oh = horiz(o);
    const span = oh
      ? [Math.min(o.line[0][0], o.line[1][0]), Math.max(o.line[0][0], o.line[1][0])]
      : [Math.min(o.line[0][1], o.line[1][1]), Math.max(o.line[0][1], o.line[1][1])];
    const side = Math.sign(reach(o));
    const outO = oh ? o.line[0][1] * side : o.line[0][0] * side;
    for (const d of plate.dimensions) {
      if (d === o || d.kind === 'overall' || d.kind === 'redline' || horiz(d) !== oh) continue;
      if (Math.sign(reach(d)) !== side) continue;
      const dsp = oh
        ? [Math.min(d.line[0][0], d.line[1][0]), Math.max(d.line[0][0], d.line[1][0])]
        : [Math.min(d.line[0][1], d.line[1][1]), Math.max(d.line[0][1], d.line[1][1])];
      if ((dsp[1] as number) < (span[0] as number) || (dsp[0] as number) > (span[1] as number))
        continue;
      const outD = oh ? d.line[0][1] * side : d.line[0][0] * side;
      if (outD > outO + 0.3) inverted.push(`${d.id} outside ${o.id}`);
    }
  }
  if (overall.length)
    add({
      id: 'measure.tiers-order',
      dimension: 'measurement',
      title: 'Smaller dimensions inside, the overall outside',
      status: inverted.length ? 'fail' : 'pass',
      value: inverted.length
        ? inverted.slice(0, 4).join(', ')
        : `${overall.length} overall dimensions outermost`,
      target: 'every overall dimension in the outermost tier on its side',
      why: 'ISO 129 / research 03 §2.2: smaller dimensions inside, larger outside, so lines do not cross.',
    });
  // parallel tiers that overlap must stand a tier apart, or their values collide
  const tight: string[] = [];
  const cramped: string[] = [];
  const tiers = plate.dimensions.filter((d) => d.kind !== 'redline');
  for (let i = 0; i < tiers.length; i++)
    for (let j = i + 1; j < tiers.length; j++) {
      const a = tiers[i] as (typeof tiers)[number];
      const b = tiers[j] as (typeof tiers)[number];
      if (horiz(a) !== horiz(b)) continue;
      const k = horiz(a) ? 1 : 0;
      const along = horiz(a) ? 0 : 1;
      const sa = [
        Math.min(a.line[0][along], a.line[1][along]),
        Math.max(a.line[0][along], a.line[1][along]),
      ] as const;
      const sb = [
        Math.min(b.line[0][along], b.line[1][along]),
        Math.max(b.line[0][along], b.line[1][along]),
      ] as const;
      if (sa[1] <= sb[0] + 0.5 || sb[1] <= sa[0] + 0.5) continue;
      const gap = Math.abs(a.line[0][k] - b.line[0][k]);
      if (gap < 0.01) continue; // one chain, collinear
      if (gap < 4) tight.push(`${a.id}/${b.id} ${r2(gap)} mm`);
      else if (gap < 6) cramped.push(`${a.id}/${b.id} ${r2(gap)} mm`);
    }
  if (tiers.length > 1)
    add({
      id: 'measure.tier-gap',
      dimension: 'measurement',
      title: 'Parallel tiers stand a tier apart',
      status: tight.length ? 'fail' : cramped.length ? 'warn' : 'pass',
      value:
        tight.length || cramped.length
          ? [...tight, ...cramped].slice(0, 4).join(', ')
          : 'every overlapping pair ≥ 6 mm apart',
      target: '≥ 6 mm between overlapping parallel dimension lines (fail under 4 mm)',
      why: 'Research 03 §2.2: tiers 6–10 mm apart. Closer, the values of two tiers sit side by side and read as one (plate III: 281 mm against 250 mm, 2 mm apart).',
      fix: 'extents() steps one tier gap beyond the dimensions already on its side; set inner tiers further in.',
    });
  for (const n of plate.neatlines) {
    const agree = Math.abs(n.perMm - plate.scale.perMm) < 1e-9 && n.unit === plate.scale.unit;
    const [x0, y0, x1, y1] = n.rect;
    const crossing = marks.filter((m) => {
      if (m.layer !== 'ink' || m.spine.length < 2) return false;
      let inside = 0;
      let outside = 0;
      for (const [x, y] of m.spine) {
        if (x >= x0 - 0.4 && x <= x1 + 0.4 && y >= y0 - 0.4 && y <= y1 + 0.4) inside++;
        else outside++;
      }
      return inside > 0 && outside > 0;
    });
    add({
      id: `measure.neatline:${n.id}`,
      dimension: 'measurement',
      title: `Neatline ${n.id} is graduated true and frames its figure`,
      status: !agree ? 'fail' : crossing.length ? 'warn' : 'pass',
      value: `${n.every} ${n.unit} per step at ${r3(n.perMm)} ${n.unit}/mm; ${crossing.length} ink strokes cross it`,
      target: 'the plate scale; no ink across the frame',
      why: 'A graduated frame is a ruler laid round the figure: its steps must be the plate’s unit at the plate’s scale.',
    });
  }
  for (const a of plate.angles) {
    const num = Number.parseFloat(
      a.text
        .replace(/[^0-9.-]+/g, ' ')
        .trim()
        .split(' ')[0] ?? 'NaN',
    );
    const digits = a.text.match(/\.(\d+)/)?.[1]?.length ?? 0;
    const ok = Number.isFinite(num) && Math.abs(num - a.degrees) <= 0.5 * 10 ** -digits + 1e-9;
    add({
      id: `measure.angle:${a.id}`,
      dimension: 'measurement',
      title: `Angle ${a.id} says what the rays make`,
      status: ok ? 'pass' : 'fail',
      value: `label “${a.text}”, rays ${r2(a.degrees)}°`,
      target: '|Δ| ≤ half the last digit',
      why: 'Nothing on a plate is invented; an angle is measured from its rays.',
    });
  }

  // ───────────────────────── line types ─────────────────────────
  const hiddenSolid = marks.filter((m) => m.hidden && (m.lineType ?? 'solid') === 'solid');
  const hiddenCount = marks.filter((m) => m.hidden).length;
  if (hiddenCount || hiddenSolid.length)
    add({
      id: 'line.hidden',
      dimension: 'style',
      title: 'What is behind is dashed',
      status: hiddenSolid.length ? 'fail' : 'pass',
      value: `${hiddenSolid.length} of ${hiddenCount} hidden strokes drawn solid`,
      target: '0',
      why: 'ISO 128: a dashed narrow line is a hidden edge (research 03 §2.1); a hidden edge drawn solid lies about depth.',
    });
  const dashGroups = new Map<string, Mark[]>();
  for (const m of marks)
    if (m.lineType && m.lineType !== 'solid' && m.group)
      dashGroups.set(m.group, [...(dashGroups.get(m.group) ?? []), m]);
  const evenHand: string[] = [];
  const unevenExact: string[] = [];
  for (const [gid, ms] of dashGroups) {
    const ls = ms.filter((m) => m.stats.length > 0.6).map((m) => m.stats.length);
    // the end dashes are fitted to the line; judge only lines with ≥ 5 dashes between them
    if (ls.length < 7) continue;
    const exact = ms.every((m) => m.guide === 'exact');
    const c = cv(ls.slice(1, -1));
    if (exact && c > 0.08) unevenExact.push(gid);
    if (!exact && c < 0.05) evenHand.push(gid);
  }
  if (dashGroups.size)
    add({
      id: 'line.dashes',
      dimension: 'style',
      title: 'A hand’s dashes vary; an exact line’s do not',
      status: unevenExact.length ? 'fail' : evenHand.length ? 'warn' : 'pass',
      value: `${dashGroups.size} dashed lines; ${evenHand.length} drawn ones even, ${unevenExact.length} exact ones uneven`,
      target: 'hand dash CV ≥ 0.05; exact dash CV ≤ 0.08',
      why: 'Equal dashes by hand are a plotter’s; uneven dashes on the overlay break its precision (research 03 R3).',
    });
  const axesUnnamed: string[] = [];
  for (const [gid, ms] of dashGroups) {
    if (!ms.every((m) => m.lineType === 'chain')) continue;
    const pts = ms.flatMap((m) => m.spine);
    if (pts.length < 2) continue;
    let far = 0;
    let ends: [MVec, MVec] = [pts[0] as MVec, pts[1] as MVec];
    for (let i = 0; i < pts.length; i += Math.max(1, Math.floor(pts.length / 40)))
      for (let j = i + 1; j < pts.length; j += Math.max(1, Math.floor(pts.length / 40))) {
        const d = Math.hypot(
          (pts[i] as MVec)[0] - (pts[j] as MVec)[0],
          (pts[i] as MVec)[1] - (pts[j] as MVec)[1],
        );
        if (d > far) {
          far = d;
          ends = [pts[i] as MVec, pts[j] as MVec];
        }
      }
    if (far < 30) continue;
    const named = (q: MVec) =>
      texts.some((t) => {
        const cx = Math.max(t.box[0], Math.min(q[0], t.box[2]));
        const cy = Math.max(t.box[1], Math.min(q[1], t.box[3]));
        return Math.hypot(cx - q[0], cy - q[1]) < 6;
      });
    if (!named(ends[0]) && !named(ends[1])) axesUnnamed.push(gid);
  }
  if ([...dashGroups.values()].some((ms) => ms.every((m) => m.lineType === 'chain')))
    add({
      id: 'connect.axes-named',
      dimension: 'connections',
      title: 'A long axis is named where it leaves the figure',
      status: axesUnnamed.length ? 'warn' : 'pass',
      value: axesUnnamed.length
        ? `unnamed: ${axesUnnamed.slice(0, 5).join(', ')}`
        : 'every long chain line named at an end',
      target: 'a label within 6 mm of an end of every chain line over 30 mm',
      why: 'An axis is read by its name (A–A′); the reader finds it where it runs out of the drawing.',
    });

  // ───────────────────────── labels near their points ─────────────────────────
  const strays = texts.filter((t) => {
    if (!t.refers || !(t.kind === 'key' || t.kind === 'numeral')) return false;
    const q = t.refers;
    const cx = Math.max(t.box[0], Math.min(q[0], t.box[2]));
    const cy = Math.max(t.box[1], Math.min(q[1], t.box[3]));
    const d = Math.hypot(cx - q[0], cy - q[1]);
    const led = marks.some(
      (m) => m.role === 'leader' && m.spine.some((s) => Math.hypot(s[0] - q[0], s[1] - q[1]) < 3.5),
    );
    return d > 8 && !led;
  });
  add({
    id: 'type.near',
    dimension: 'typography',
    title: 'A label sits near its point, or a leader joins them',
    status: strays.length ? 'warn' : 'pass',
    value: strays.length
      ? `far: ${strays
          .slice(0, 5)
          .map((t) => t.id)
          .join(', ')}`
      : 'all within 8 mm or led',
    target: '≤ 8 mm, or a leader',
    why: 'Labels sit within one leader length of their referent (research 03 R10).',
  });

  // ───────────────────────── the anatomy: every part on its own ─────────────────────────
  const anatomy: AnatomyRow[] = plate.parts.map((pt) => {
    const issues: string[] = [];
    const pm = marks.filter(
      (m) =>
        m.part === pt.id ||
        m.group === pt.id ||
        m.id === pt.id ||
        m.id.startsWith(`${pt.id}-`) ||
        m.id.startsWith(`${pt.id}.`) ||
        (!!pt.form && m.form === pt.form),
    );
    const inked = pm.some((m) => m.layer === 'ink' || m.layer === 'letter');
    if (!pm.length) issues.push('nothing drawn');
    if ((pt.finish === 'line' || pt.finish === 'tone') && !inked) issues.push('not inked');
    if (pt.finish === 'construction' && inked) issues.push('inked, but declared construction');
    if (pt.finish === 'tone') {
      if (!pt.form) issues.push('toned without a form');
      else if (
        !hatches.some((m) => m.form === pt.form) &&
        !marks.some((m) => m.form === pt.form && m.role === 'stipple')
      )
        issues.push(`no tone laid on form ${pt.form}`);
    }
    if (pt.key) {
      if (!texts.some((t) => t.kind === 'key' && t.text === pt.key))
        issues.push(`key ${pt.key} not on the drawing`);
      if (
        !texts.some(
          (t) => (t.kind === 'note' || t.kind === 'caption') && t.text.startsWith(`${pt.key} `),
        )
      )
        issues.push(`no note for ${pt.key}`);
    }
    if (pt.measured && !('none' in pt.measured))
      for (const did of pt.measured)
        if (!plate.dimensions.some((d) => d.id === did) && !plate.angles.some((a) => a.id === did))
          issues.push(`measure ${did} missing`);
    if (pt.measured && 'none' in pt.measured && pt.measured.none.trim().split(/\s+/).length < 3)
      issues.push('unmeasured without a reason');
    for (const cid of pt.generatedBy ?? [])
      if (!plate.constructions.some((c) => c.id === cid))
        issues.push(`construction ${cid} missing`);
    return { id: pt.id, name: pt.name, finish: pt.finish, ok: issues.length === 0, issues };
  });
  const broken = anatomy.filter((a) => !a.ok);
  add({
    id: 'create.anatomy',
    dimension: 'creativity',
    title: 'The subject is listed part by part, and every part is complete',
    status: !anatomy.length ? 'warn' : broken.length ? 'fail' : 'pass',
    value: anatomy.length
      ? `${anatomy.length} parts, ${broken.length} incomplete${
          broken.length
            ? `: ${broken
                .slice(0, 4)
                .map((a) => `${a.id} (${a.issues[0]})`)
                .join('; ')}`
            : ''
        }`
      : 'no parts table',
    target: 'every part drawn, keyed and noted, finished and measured as declared',
    why: 'List the parts before drawing; check each on its own (the anatomy method: size, truth, the object, its parts, verify).',
    fix: 'plate.part({ id, name, key, finish, form, measured, generatedBy }) for each part',
  });

  // ───────────────────────── verdict ─────────────────────────
  const counts = Object.fromEntries(
    DIMENSIONS.map((d) => [d, { pass: 0, warn: 0, fail: 0, human: 0 }]),
  ) as Report['counts'];
  for (const c of checks) counts[c.dimension][c.status]++;
  const verdict = checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'pass';
  return {
    plate: plate.spec.id,
    title: plate.spec.title,
    style: S.id,
    verdict,
    checks,
    anatomy,
    counts,
    stats: {
      marks: marks.length,
      inkStrokes: free.length,
      hatchFields: groups.size,
      texts: texts.length,
      dimensions: plate.dimensions.length,
      constructions: plate.constructions.length,
      forms: plate.forms.length,
      minHatchGap: minGaps.length ? Math.min(...minGaps) : 0,
    },
  };
}

function pointInOutline(p: Vec, poly: readonly MVec[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i] as MVec;
    const b = poly[j] as MVec;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

/** The report as Markdown, for the proof folder and the founder. */
export function reportMarkdown(r: Report): string {
  const icon: Record<Status, string> = { pass: 'PASS', warn: 'WARN', fail: 'FAIL', human: 'LOOK' };
  const lines: string[] = [];
  lines.push(`# Proof — ${r.title}`);
  lines.push('');
  lines.push(
    `Plate \`${r.plate}\` · style \`${r.style}\` · verdict **${r.verdict.toUpperCase()}**`,
  );
  lines.push('');
  lines.push('| Dimension | pass | warn | fail | look |');
  lines.push('| --- | --: | --: | --: | --: |');
  for (const d of DIMENSIONS) {
    const c = r.counts[d];
    lines.push(`| ${d} | ${c.pass} | ${c.warn} | ${c.fail} | ${c.human} |`);
  }
  lines.push('');
  for (const d of DIMENSIONS) {
    const cs = r.checks.filter((c) => c.dimension === d);
    if (!cs.length) continue;
    lines.push(`## ${d[0]?.toUpperCase()}${d.slice(1)}`);
    lines.push('');
    for (const c of cs) {
      lines.push(`- **${icon[c.status]}** ${c.title} — ${c.value} (target ${c.target})`);
      lines.push(`  - why: ${c.why}${c.fix && c.status !== 'pass' ? ` · fix: ${c.fix}` : ''}`);
    }
    lines.push('');
  }
  if (r.anatomy.length) {
    lines.push('## Anatomy');
    lines.push('');
    lines.push('| Part | Name | Finish | Status |');
    lines.push('| --- | --- | --- | --- |');
    for (const a of r.anatomy)
      lines.push(
        `| ${a.id} | ${a.name} | ${a.finish} | ${a.ok ? 'complete' : a.issues.join('; ')} |`,
      );
    lines.push('');
  }
  lines.push('## Stats');
  lines.push('');
  for (const [k, v] of Object.entries(r.stats))
    lines.push(`- ${k}: ${Math.round(v * 1000) / 1000}`);
  lines.push('');
  return lines.join('\n');
}
