/**
 * Scribble sheet — shared stroke model + renderer.
 *
 * One module turns a stored pen stream into SVG. Astro calls it at build time
 * (readers get static SVG, zero JS); the dev-only ScribbleDesk calls it live
 * while the founder writes. Same maths both sides, so what you draw is what ships.
 *
 * Pen   — one filled perfect-freehand outline: pressure-thinned, tapered, low lag.
 * Pencil — several thin strands laid side by side with a slow wobble, so the
 *          centre builds darker than the edges like graphite; the group is then
 *          broken up by paper tooth (noise anchored to the sheet, not the stroke)
 *          and lightens with softer pressure.
 *
 * Colour: everything fills `currentColor` (the sheet sets `color: var(--ink)`),
 * so no literal colour lives here — design-tokens R4 / brand-consistency-ci.
 *
 * spec-link: openspec/specs/pen-and-paper/spec.md#requirement-scribbles-survive-iteration
 */
import { getStroke, type StrokeOptions } from 'perfect-freehand';

export type Tool = 'pen' | 'pencil';

/** [x, y, pressure 0..1] in sheet units. */
export type Point = [x: number, y: number, pressure: number];

export interface ScribbleStroke {
  tool: Tool;
  /** Nib size in sheet units. */
  size: number;
  /** True when pressure came from a real stylus; mouse/touch strokes simulate it. */
  stylus: boolean;
  points: Point[];
}

export interface ScribbleSheetData {
  version: 1;
  width: number;
  height: number;
  strokes: ScribbleStroke[];
}

/** Sheets are drawn on a fixed-width artboard and scale with the viewport. */
export const SHEET_WIDTH = 1440;

export const EMPTY_SHEET: ScribbleSheetData = {
  version: 1,
  width: SHEET_WIDTH,
  height: 0,
  strokes: [],
};

/* ── pen ─────────────────────────────────────────────────────────── */

/** Low streamline keeps the ink attached to the nib instead of trailing it. */
const PEN: StrokeOptions = {
  thinning: 0.58,
  smoothing: 0.5,
  streamline: 0.24,
  easing: (t) => Math.sin((t * Math.PI) / 2),
  start: { taper: 6, cap: true },
  end: { taper: 12, cap: true },
};

/* ── pencil ──────────────────────────────────────────────────────── */

const PENCIL: StrokeOptions = {
  thinning: 0.12,
  smoothing: 0.55,
  streamline: 0.2,
  start: { taper: 3, cap: true },
  end: { taper: 5, cap: true },
};

/** Strands across the stroke: offset + width as fractions of nib size. */
const STRANDS = [
  { offset: 0, width: 0.72, wobble: 0 },
  { offset: 0.24, width: 0.46, wobble: 0.45 },
  { offset: -0.22, width: 0.42, wobble: 0.5 },
  { offset: 0.06, width: 0.3, wobble: 0.9 },
] as const;

/** Per-strand alpha; overlaps build the darker graphite core. */
export const PENCIL_STRAND_OPACITY = 0.62;

/** Stable per-stroke phase so SSR and the desk wobble identically. */
function phaseOf(stroke: ScribbleStroke): number {
  const p = stroke.points[0];
  return p ? (Math.abs(Math.round(p[0] * 7919 + p[1] * 104729)) % 628) / 100 : 0;
}

/** Shift points along the local normal, with a slow sinusoidal wander. */
function offsetAlong(points: Point[], dist: number, wobble: number, phase: number): Point[] {
  if (dist === 0 && wobble === 0) return points;
  const last = points.length - 1;
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 2)] ?? p;
    const b = points[Math.min(last, i + 2)] ?? p;
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    const k = dist + wobble * Math.sin(i * 0.37 + phase);
    return [p[0] - (ty / len) * k, p[1] + (tx / len) * k, p[2]];
  });
}

/* ── outline → path ──────────────────────────────────────────────── */

/** perfect-freehand outline -> SVG path data, via quadratic midpoint smoothing. */
function outlineToPath(outline: number[][]): string {
  const n = outline.length;
  if (n === 0) return '';
  const f = (v: number) => (Math.round(v * 10) / 10).toString();
  let d = '';
  for (let i = 0; i < n; i++) {
    const [ax = 0, ay = 0] = outline[i] ?? [];
    const [bx = 0, by = 0] = outline[(i + 1) % n] ?? [];
    d += i === 0 ? `M${f(ax)} ${f(ay)}Q` : '';
    d += `${f(ax)} ${f(ay)} ${f((ax + bx) / 2)} ${f((ay + by) / 2)} `;
  }
  return `${d.trimEnd()}Z`;
}

/* ── public renderer ─────────────────────────────────────────────── */

export interface InkShape {
  paths: string[];
  pencil: boolean;
  /** Group opacity — pencil darkness follows pressure. */
  opacity: number;
}

/**
 * @param last  perfect-freehand `last` — false while the pointer is still down,
 *              so the end taper does not pinch mid-gesture.
 * @param tail  predicted points (live only, never stored) to cancel input lag.
 */
export function inkShape(
  stroke: ScribbleStroke,
  last = true,
  tail: readonly Point[] = [],
): InkShape {
  const points = tail.length ? [...stroke.points, ...tail] : stroke.points;

  if (stroke.tool === 'pen') {
    const options = {
      ...PEN,
      // Simulated pressure is velocity-driven; halve it so mouse lines don't balloon.
      thinning: stroke.stylus ? PEN.thinning : (PEN.thinning ?? 0) * 0.5,
      size: stroke.size,
      simulatePressure: !stroke.stylus,
      last,
    };
    return { paths: [outlineToPath(getStroke(points, options))], pencil: false, opacity: 1 };
  }

  const phase = phaseOf(stroke);
  const paths = STRANDS.map((s, i) =>
    outlineToPath(
      getStroke(
        offsetAlong(points, s.offset * stroke.size, s.wobble * stroke.size * 0.3, phase + i * 2.1),
        {
          ...PENCIL,
          size: Math.max(1, stroke.size * s.width),
          simulatePressure: false,
          last,
        },
      ),
    ),
  );

  let opacity = 0.82;
  if (stroke.stylus && stroke.points.length) {
    const avg = stroke.points.reduce((sum, p) => sum + p[2], 0) / stroke.points.length;
    opacity = Math.min(0.95, Math.max(0.38, 0.3 + avg * 0.75));
  }
  return { paths, pencil: true, opacity: Math.round(opacity * 100) / 100 };
}

/** Markup form — Astro's static render and the desk's live (imperative) layer. */
export function inkMarkup(shape: InkShape, filterId: string): string {
  if (!shape.pencil) return shape.paths.map((d) => `<path d="${d}" fill="currentColor"/>`).join('');
  const strands = shape.paths
    .map((d) => `<path d="${d}" fill="currentColor" opacity="${PENCIL_STRAND_OPACITY}"/>`)
    .join('');
  return `<g filter="url(#${filterId})" opacity="${shape.opacity}">${strands}</g>`;
}

/**
 * Paper tooth: fine noise thresholded into speckle, used as an alpha mask, then a
 * little displacement for ragged graphite edges and a hair of blur to soften it.
 */
export function graphiteFilterMarkup(id: string): string {
  return (
    `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">` +
    '<feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" seed="7" result="tooth"/>' +
    '<feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.72" result="grain"/>' +
    '<feComposite in="SourceGraphic" in2="grain" operator="in" result="grained"/>' +
    '<feDisplacementMap in="grained" in2="tooth" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="rough"/>' +
    '<feGaussianBlur in="rough" stdDeviation="0.2"/>' +
    '</filter>'
  );
}

/** Artboard height that fits every stroke, plus a little breathing room. */
export function sheetHeight(strokes: readonly ScribbleStroke[]): number {
  let bottom = 0;
  for (const s of strokes) {
    for (const p of s.points) bottom = Math.max(bottom, p[1] + s.size);
  }
  return bottom === 0 ? 0 : Math.ceil(bottom + 48);
}
