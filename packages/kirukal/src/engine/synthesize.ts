/**
 * Recipe + box + seed -> SVG path data.
 *
 * Uses perfect-freehand (tldraw's stroke engine) to turn pen samples into a
 * filled outline. `simulatePressure` is false because our pressure is real —
 * captured from the tablet, not inferred from velocity. Pressure and taper are
 * the half of "hand-drawn" that a randomizer cannot fake, and the reason the
 * forge captures the pen stream at all.
 */
import { getStroke } from 'perfect-freehand';
import { placeCorner, resampleEdge } from './resample';
import { createRandom, pickTake } from './seed';
import type { Sample, StrokeRecipe, SynthesizeOptions } from './types';

/**
 * Tuning for real stylus input, per perfect-freehand's own guidance for pen
 * data. `size` is overridden per call by the absolute stroke-width token.
 */
const STROKE_OPTIONS = {
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
  last: true,
} as const;

/** perfect-freehand outline -> SVG path data, via quadratic midpoint smoothing. */
export function outlineToPath(outline: readonly (readonly number[])[]): string {
  if (outline.length === 0) return '';
  const first = outline[0]!;
  let d = `M ${first[0]!.toFixed(2)} ${first[1]!.toFixed(2)}`;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    const mx = (a[0]! + b[0]!) / 2;
    const my = (a[1]! + b[1]!) / 2;
    d += ` Q ${a[0]!.toFixed(2)} ${a[1]!.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }
  return `${d} Z`;
}

function strokeToPath(samples: readonly Sample[], strokeWidth: number): string {
  if (samples.length < 2) return '';
  const input = samples.map(([x, y, p]) => [x, y, p]);
  return outlineToPath(getStroke(input, { ...STROKE_OPTIONS, size: strokeWidth }));
}

/**
 * Synthesize a frame at an arbitrary box.
 *
 * Corners are placed unscaled; each edge is re-drawn at the length it actually
 * needs, carrying its perpendicular deviation over in absolute px. That is what
 * lets one captured frame serve a 60px button and a 900px card honestly.
 */
export function synthesizeFrame(recipe: StrokeRecipe, opts: SynthesizeOptions): string[] {
  const take = recipe.takes[pickTake(opts.seed, recipe.takes.length)];
  if (take === undefined) return [];

  const { width: w, height: h } = opts;
  const [refW, refH] = recipe.referenceBox;
  // Corner extent in the reference box, reused as the target inset so corners
  // keep their drawn size rather than scaling with the target.
  const inset = Math.min(refW, refH) * 0.25;
  const ix = Math.min(inset, w / 2);
  const iy = Math.min(inset, h / 2);

  const paths: string[] = [];

  for (const stroke of take.strokes) {
    let placed: Sample[];
    switch (stroke.role) {
      case 'edge-top':
        placed = resampleEdge(stroke.samples, [ix, 0], [w - ix, 0]);
        break;
      case 'edge-right':
        placed = resampleEdge(stroke.samples, [w, iy], [w, h - iy]);
        break;
      case 'edge-bottom':
        placed = resampleEdge(stroke.samples, [w - ix, h], [ix, h]);
        break;
      case 'edge-left':
        placed = resampleEdge(stroke.samples, [0, h - iy], [0, iy]);
        break;
      case 'corner-tl':
        placed = placeCorner(stroke.samples, [0, 0]);
        break;
      case 'corner-tr':
        placed = placeCorner(stroke.samples, [w - ix, 0]);
        break;
      case 'corner-br':
        placed = placeCorner(stroke.samples, [w - ix, h - iy]);
        break;
      case 'corner-bl':
        placed = placeCorner(stroke.samples, [0, h - iy]);
        break;
      default:
        placed = [...stroke.samples];
    }
    const d = strokeToPath(placed, opts.strokeWidth);
    if (d !== '') paths.push(d);
  }

  return paths;
}

/**
 * Synthesize a glyph or part — fixed intrinsic aspect, so it is placed and
 * uniformly positioned rather than re-drawn edge by edge.
 *
 * Geometry is NOT scaled to the target box here: scaling a drawn mark also
 * scales its stroke, which is the fastest way to make the system look like a
 * zoomed image. Size it with the viewBox and let `vector-effect` hold the
 * stroke, or draw a dedicated mark at the size you need.
 */
export function synthesizeMark(recipe: StrokeRecipe, opts: SynthesizeOptions): string[] {
  const take = recipe.takes[pickTake(opts.seed, recipe.takes.length)];
  if (take === undefined) return [];
  const paths: string[] = [];
  for (const stroke of take.strokes) {
    const d = strokeToPath(stroke.samples, opts.strokeWidth);
    if (d !== '') paths.push(d);
  }
  return paths;
}

/**
 * Micro-variation between takes, so repeated components on one screen do not
 * read as stamped copies. Deterministic, and deliberately small — the real
 * variety comes from Arun's separate takes, not from jitter.
 */
export function jitterSeedFor(identity: string, seed: number): number {
  return Math.floor(createRandom(seed)() * 0xffffffff) ^ seed ^ identity.length;
}
