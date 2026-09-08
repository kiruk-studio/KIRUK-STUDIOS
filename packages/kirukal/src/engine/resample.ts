/**
 * Arc-length resampling for drawn edges.
 *
 * A hand-drawn rectangle cannot be stretched. The naive fix — 9-slice — repeats
 * the middle band, so a wide card shows one short run of pencil tiled eight
 * times and the eye catches it immediately. Instead an edge is re-drawn at the
 * length actually required.
 *
 * LAW: deviation amplitude is ABSOLUTE, never normalized by size. Excalidraw
 * scaled roughness with element size and users reported the hand-drawn feel had
 * disappeared (excalidraw#7239). A longer edge should wander *more* in absolute
 * pixels, because a real hand does.
 */
import type { Sample } from './types';

type Pt = { x: number; y: number; p: number; tx: number; ty: number };

function toPts(samples: readonly Sample[]): Pt[] {
  return samples.map(([x, y, p, tx, ty]) => ({ x, y, p, tx, ty }));
}

/** Cumulative arc length along a sample run. */
function arcLengths(pts: readonly Pt[]): number[] {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a === undefined || b === undefined) continue;
    acc.push(acc[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return acc;
}

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    p: a.p + (b.p - a.p) * t,
    tx: a.tx + (b.tx - a.tx) * t,
    ty: a.ty + (b.ty - a.ty) * t,
  };
}

/** Sample a run at an arbitrary arc-length position. */
function atLength(pts: readonly Pt[], lens: readonly number[], target: number): Pt {
  const last = pts.length - 1;
  if (target <= 0) return pts[0]!;
  if (target >= lens[last]!) return pts[last]!;
  let i = 1;
  while (i < lens.length && lens[i]! < target) i++;
  const segStart = lens[i - 1]!;
  const segLen = lens[i]! - segStart;
  const t = segLen === 0 ? 0 : (target - segStart) / segLen;
  return lerpPt(pts[i - 1]!, pts[i]!, t);
}

/**
 * Re-draw a captured edge along a straight run of arbitrary length.
 *
 * The captured stroke is decomposed into "progress along the edge" plus
 * "perpendicular deviation from the ideal straight line". Progress is stretched
 * to the new length; **deviation is carried over unscaled**, which is what keeps
 * the hand honest at every size. Pressure and tilt ride along with progress.
 *
 * @param samples captured edge, in the recipe's reference box
 * @param from    start point of the target edge, in target px
 * @param to      end point of the target edge, in target px
 * @param count   output sample count; defaults to one per ~2px of edge
 */
export function resampleEdge(
  samples: readonly Sample[],
  from: readonly [number, number],
  to: readonly [number, number],
  count?: number,
): Sample[] {
  const pts = toPts(samples);
  if (pts.length < 2) return [];

  const lens = arcLengths(pts);
  const total = lens[lens.length - 1]!;
  if (total === 0) return [];

  // Ideal straight line of the captured stroke: first sample to last.
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  const srcDx = b.x - a.x;
  const srcDy = b.y - a.y;
  const srcLen = Math.hypot(srcDx, srcDy) || 1;
  const srcUx = srcDx / srcLen;
  const srcUy = srcDy / srcLen;

  // Target edge basis.
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dstLen = Math.hypot(dx, dy);
  if (dstLen === 0) return [];
  const ux = dx / dstLen;
  const uy = dy / dstLen;
  // Perpendicular, so deviation is re-applied in the target edge's own frame.
  const nx = -uy;
  const ny = ux;

  const n = Math.max(2, count ?? Math.ceil(dstLen / 2));
  const out: Sample[] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const src = atLength(pts, lens, t * total);

    // Decompose the captured point against its own straight line.
    const rx = src.x - a.x;
    const ry = src.y - a.y;
    const deviation = rx * -srcUy + ry * srcUx; // perpendicular component, px

    // Progress stretches with the target length; deviation does NOT.
    const px = from[0] + ux * (t * dstLen) + nx * deviation;
    const py = from[1] + uy * (t * dstLen) + ny * deviation;

    out.push([px, py, src.p, src.tx, src.ty]);
  }

  return out;
}

/**
 * Place a captured corner without resampling it.
 *
 * Corners carry the most character of any part of a drawn frame, and a stretched
 * corner is the single most legible tell that a "hand-drawn" UI is generated.
 * They are translated and uniformly placed, never scaled to fit.
 */
export function placeCorner(
  samples: readonly Sample[],
  origin: readonly [number, number],
): Sample[] {
  return samples.map(([x, y, p, tx, ty]) => [x + origin[0], y + origin[1], p, tx, ty] as Sample);
}
