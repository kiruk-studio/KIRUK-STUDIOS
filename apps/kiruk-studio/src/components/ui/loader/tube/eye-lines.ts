/**
 * The live eye's lines, in mm round its globe (y up), traced off the eye
 * itself, open and shut, gaze at rest (/lab/opening?grid=1): what the
 * opening's circuit is wired along, so it lands on the real eye at any
 * screen shape. Also the frame the opening draws in.
 */

export type Vec = [number, number];

/** Where the eye is on the canvas, CSS px, and how big a millimetre is there. */
export interface TubeFrame {
  w: number;
  h: number;
  dpr: number;
  cx: number;
  cy: number;
  pxPerMm: number;
}

/** started: the canvas paints the room now · landing: the eye is being uncovered · open: open the real lids · done: unmount. */
export type TubeEvent = 'started' | 'landing' | 'open' | 'done';

/** The live eye, open (traced at the gaze's rest). */
export const OPEN_UPPER: Vec[] = [
  [-12, -0.7],
  [-8.5, 2.1],
  [-4.4, 3.65],
  [0, 4.1],
  [5, 3.6],
  [8, 2.1],
  [9.8, 0],
];
export const OPEN_LOWER: Vec[] = [
  [9.8, 0],
  [9.4, -1.6],
  [7.4, -3.8],
  [4.1, -5.1],
  [0, -5.4],
  [-6.1, -4.2],
  [-10.6, -2.0],
  [-12, -0.7],
];
export const IRIS = { c: [0.1, 0.3] as Vec, r: 5.8 };
export const BROW: Vec[] = [
  [-11, 8.3],
  [-6.5, 9.4],
  [-1.5, 9.95],
  [3.5, 9.9],
  [8.5, 8.9],
  [12.5, 7.6],
  [15.5, 6.4],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A smooth curve through the points (centripetal enough for hand curves). */
export function through(pts: Vec[], perSeg = 14): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** n points at equal steps of arc length. */
export function resample(pts: Vec[], n: number): Vec[] {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = acc[acc.length - 1] || 1;
  const out: Vec[] = [];
  let k = 1;
  for (let i = 0; i < n; i++) {
    const d = (i / (n - 1)) * total;
    while (k < acc.length - 1 && acc[k] < d) k++;
    const seg = acc[k] - acc[k - 1] || 1;
    const t = (d - acc[k - 1]) / seg;
    out.push([lerp(pts[k - 1][0], pts[k][0], t), lerp(pts[k - 1][1], pts[k][1], t)]);
  }
  return out;
}
