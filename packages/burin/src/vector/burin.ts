/**
 * Burin strokes as vectors — the same hand as the GPU fields, for the parts of a
 * plate that are drawn once and must stay crisp at any size: guides, scales,
 * frames, the instrument's charts. Pure functions returning SVG path data, so
 * they render on the server.
 *
 * A burin line enters the copper thin, swells as the tool bites, and leaves thin:
 * width follows sin(πt)^k along the stroke, never a constant-width plotter line.
 */

export type Pt = readonly [number, number];

/** One decimal, deterministic, no "-0". */
export const n = (v: number) => {
  const r = Math.round(v * 10) / 10;
  return (Object.is(r, -0) ? 0 : r).toString();
};

function resample(pts: readonly Pt[], step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.ceil(L / step));
    for (let j = 0; j < k; j++)
      out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  const last = pts[pts.length - 1];
  if (last) out.push([last[0], last[1]]);
  return out;
}

/**
 * A swelling, tapering burin stroke as a filled outline.
 *   width  widest point, in user units
 *   swell  exponent of the swell; < 1 fuller, > 1 more pointed
 *   taper  fraction of the width kept at the ends (0 = a point)
 */
export function burinLine(
  pts: readonly Pt[],
  o: { width: number; swell?: number; taper?: number; step?: number },
) {
  const { width, swell = 0.7, taper = 0.08, step = 2 } = o;
  const p = resample(pts, step);
  if (p.length < 2) return '';
  const a: string[] = [];
  const b: string[] = [];
  for (let i = 0; i < p.length; i++) {
    const t = i / (p.length - 1);
    const q = p[Math.min(p.length - 1, i + 1)]!;
    const r = p[Math.max(0, i - 1)]!;
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const d = Math.hypot(dx, dy) || 1;
    const w = (width / 2) * (taper + (1 - taper) * Math.sin(Math.PI * t) ** swell);
    const [x, y] = p[i]!;
    a.push(`${n(x + (dy / d) * w)} ${n(y - (dx / d) * w)}`);
    b.push(`${n(x - (dy / d) * w)} ${n(y + (dx / d) * w)}`);
  }
  return `M${a.join('L')}L${b.reverse().join('L')}Z`;
}

/** A dot-and-dash guide, the engraver's construction line: dash, gap, dot, gap. */
export function guide(a: Pt, b: Pt, o: { dash?: number; gap?: number; dot?: number } = {}) {
  const { dash = 9, gap = 3.5, dot = 1.2 } = o;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / (L || 1);
  const uy = (b[1] - a[1]) / (L || 1);
  let s = 0;
  let d = '';
  let on = true;
  while (s < L) {
    const len = on ? dash : dot;
    const e = Math.min(L, s + len);
    d += `M${n(a[0] + ux * s)} ${n(a[1] + uy * s)}L${n(a[0] + ux * e)} ${n(a[1] + uy * e)}`;
    s = e + gap;
    on = !on;
  }
  return d;
}

/** A map-maker's scale bar: alternate segments filled, a thin outline round all. */
export function scaleBar(x: number, y: number, len: number, segments: number, h: number) {
  const w = len / segments;
  let fill = '';
  for (let i = 0; i < segments; i += 2)
    fill += `M${n(x + i * w)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;
  const outline = `M${n(x)} ${n(y)}h${n(len)}v${n(h)}h${n(-len)}Z`;
  return { fill, outline };
}

/** Ticks along a vertical rule, every `every`, longer every `major`. */
export function ticks(x: number, y0: number, y1: number, every: number, major: number, len = 6) {
  let d = '';
  let k = 0;
  for (let y = y0; y <= y1 + 1e-6; y += every, k++)
    d += `M${n(x)} ${n(y)}h${n(k % major === 0 ? -len : -len * 0.55)}`;
  return d;
}
