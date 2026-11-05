/**
 * Paths: what a mark is meant to be before a hand performs it. Polylines in mm,
 * sampled finely enough that curvature can be read off them.
 */
import { add, dist, type MVec, sub, type Vec } from './vec.ts';

export type Path = readonly Vec[];

export function lengthOf(pts: Path): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1] as Vec, pts[i] as Vec);
  return s;
}

export function cumulative(pts: Path): number[] {
  const acc = [0];
  for (let i = 1; i < pts.length; i++)
    acc.push((acc[i - 1] as number) + dist(pts[i - 1] as Vec, pts[i] as Vec));
  return acc;
}

/** The point at arc length `s` along a polyline (clamped to its ends). */
export function pointAt(pts: Path, lens: readonly number[], s: number): MVec {
  const n = pts.length;
  if (n === 0) return [0, 0];
  if (s <= 0) return [pts[0]![0], pts[0]![1]];
  const total = lens[n - 1] as number;
  if (s >= total) return [pts[n - 1]![0], pts[n - 1]![1]];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if ((lens[m] as number) < s) lo = m;
    else hi = m;
  }
  const a = pts[lo] as Vec;
  const b = pts[hi] as Vec;
  const seg = (lens[hi] as number) - (lens[lo] as number);
  const t = seg > 0 ? (s - (lens[lo] as number)) / seg : 0;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Resample at an even arc-length step; the ends are kept exactly. */
export function resample(pts: Path, step: number): MVec[] {
  if (pts.length < 2) return pts.map((p) => [p[0], p[1]] as MVec);
  const lens = cumulative(pts);
  const total = lens[lens.length - 1] as number;
  const k = Math.max(1, Math.round(total / step));
  const out: MVec[] = [];
  for (let i = 0; i <= k; i++) out.push(pointAt(pts, lens, (total * i) / k));
  return out;
}

export function line(a: Vec, b: Vec, step = 0.5): MVec[] {
  const k = Math.max(1, Math.ceil(dist(a, b) / step));
  const out: MVec[] = [];
  for (let i = 0; i <= k; i++)
    out.push([a[0] + ((b[0] - a[0]) * i) / k, a[1] + ((b[1] - a[1]) * i) / k]);
  return out;
}

/** Circular arc. Screen angles (y down): 0 = east, π/2 = south. */
export function arc(c: Vec, r: number, a0: number, a1: number, step = 0.4): MVec[] {
  const k = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / step));
  const out: MVec[] = [];
  for (let i = 0; i <= k; i++) {
    const a = a0 + ((a1 - a0) * i) / k;
    out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
  }
  return out;
}

export function circle(c: Vec, r: number, start = 0, step = 0.4): MVec[] {
  return arc(c, r, start, start + Math.PI * 2, step);
}

/** Ellipse arc with semi-axes rx, ry, rotated by `rot`. */
export function ellipse(
  c: Vec,
  rx: number,
  ry: number,
  rot = 0,
  a0 = 0,
  a1 = Math.PI * 2,
  step = 0.4,
): MVec[] {
  const k = Math.max(6, Math.ceil((Math.abs(a1 - a0) * Math.max(rx, ry)) / step));
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const out: MVec[] = [];
  for (let i = 0; i <= k; i++) {
    const a = a0 + ((a1 - a0) * i) / k;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    out.push([c[0] + x * cr - y * sr, c[1] + x * sr + y * cr]);
  }
  return out;
}

export function quad(p0: Vec, p1: Vec, p2: Vec, step = 0.4): MVec[] {
  const k = Math.max(2, Math.ceil((dist(p0, p1) + dist(p1, p2)) / step));
  const out: MVec[] = [];
  for (let i = 0; i <= k; i++) {
    const t = i / k;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
  return out;
}

export function cubic(p0: Vec, p1: Vec, p2: Vec, p3: Vec, step = 0.4): MVec[] {
  const k = Math.max(3, Math.ceil((dist(p0, p1) + dist(p1, p2) + dist(p2, p3)) / step));
  const out: MVec[] = [];
  for (let i = 0; i <= k; i++) {
    const t = i / k;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ]);
  }
  return out;
}

/** Catmull–Rom through the given points: a hand's curve through chosen landmarks. */
export function spline(points: Path, step = 0.4, closed = false): MVec[] {
  const n = points.length;
  if (n < 3) return points.map((p) => [p[0], p[1]] as MVec);
  const P = (i: number): Vec => {
    if (closed) return points[((i % n) + n) % n] as Vec;
    return points[Math.max(0, Math.min(n - 1, i))] as Vec;
  };
  const out: MVec[] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    const c1: MVec = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: MVec = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    const part = cubic(p1, c1, c2, p2, step);
    if (i > 0) part.shift();
    out.push(...part);
  }
  return out;
}

/** Join parts into one path, dropping duplicated joints. */
export function chain(...parts: Path[]): MVec[] {
  const out: MVec[] = [];
  for (const part of parts)
    for (const p of part) {
      const last = out[out.length - 1];
      if (!last || dist(last, p) > 1e-6) out.push([p[0], p[1]]);
    }
  return out;
}

/** Signed curvature at each vertex (1/mm), from the turning of neighbouring chords. */
export function curvature(pts: Path): number[] {
  const n = pts.length;
  const k = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const a = pts[i - 1] as Vec;
    const b = pts[i] as Vec;
    const c = pts[i + 1] as Vec;
    const ab = dist(a, b);
    const bc = dist(b, c);
    const ac = dist(a, c);
    const area2 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const denom = ab * bc * ac;
    k[i] = denom > 1e-12 ? (2 * area2) / denom : 0;
  }
  if (n > 2) {
    k[0] = k[1] as number;
    k[n - 1] = k[n - 2] as number;
  }
  return k;
}

/** Unit tangent at each vertex (central differences). */
export function tangents(pts: Path, closed = false): MVec[] {
  const n = pts.length;
  const out: MVec[] = [];
  for (let i = 0; i < n; i++) {
    const a = closed ? (pts[(i - 1 + n) % n] as Vec) : (pts[Math.max(0, i - 1)] as Vec);
    const b = closed ? (pts[(i + 1) % n] as Vec) : (pts[Math.min(n - 1, i + 1)] as Vec);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    out.push([dx / l, dy / l]);
  }
  return out;
}

/** Douglas–Peucker simplification (tolerance in mm). */
export function simplify(pts: Path, tol: number): MVec[] {
  if (pts.length < 3) return pts.map((p) => [p[0], p[1]] as MVec);
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop() as [number, number];
    const a = pts[i0] as Vec;
    const b = pts[i1] as Vec;
    let best = -1;
    let bestD = tol;
    for (let i = i0 + 1; i < i1; i++) {
      const d = distToSegment(pts[i] as Vec, a, b);
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) {
      keep[best] = 1;
      stack.push([i0, best], [best, i1]);
    }
  }
  const out: MVec[] = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push([pts[i]![0], pts[i]![1]]);
  return out;
}

export function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const ab = sub(b, a);
  const l2 = ab[0] * ab[0] + ab[1] * ab[1];
  if (l2 < 1e-18) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2));
  return dist(p, add(a, [ab[0] * t, ab[1] * t]));
}

/** Nearest distance from a point to a polyline. */
export function distToPath(p: Vec, pts: Path): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const d = distToSegment(p, pts[i - 1] as Vec, pts[i] as Vec);
    if (d < best) best = d;
  }
  if (pts.length === 1) best = dist(p, pts[0] as Vec);
  return best;
}

export function bbox(pts: Path): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

/** Shoelace area; > 0 means clockwise on screen (y down). */
export function signedArea(poly: Path): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i] as Vec;
    const b = poly[(i + 1) % poly.length] as Vec;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

export function pointInPolygon(p: Vec, poly: Path): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i] as Vec;
    const b = poly[j] as Vec;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

/**
 * Where the infinite line through `o` with direction `d` lies inside `poly` (even–odd),
 * as sorted [t0, t1] intervals of the line parameter.
 */
export function lineInsidePolygon(o: Vec, d: Vec, poly: Path): [number, number][] {
  const ts: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i] as Vec;
    const b = poly[(i + 1) % poly.length] as Vec;
    const e: Vec = [b[0] - a[0], b[1] - a[1]];
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-12) continue;
    const w: Vec = [a[0] - o[0], a[1] - o[1]];
    const t = (w[0] * e[1] - w[1] * e[0]) / den;
    const u = (w[0] * d[1] - w[1] * d[0]) / den;
    if (u >= 0 && u < 1) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < ts.length; i += 2) out.push([ts[i] as number, ts[i + 1] as number]);
  return out;
}

/** Intersection point of segments ab and cd, or null. */
export function segmentIntersection(a: Vec, b: Vec, c: Vec, d: Vec): MVec | null {
  const r: Vec = [b[0] - a[0], b[1] - a[1]];
  const s: Vec = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a[0] + r[0] * t, a[1] + r[1] * t];
}

/** Split a polyline into pieces no longer than `maxLen` (mm), cutting at the gentlest bends. */
export function splitByLength(pts: Path, maxLen: number): MVec[][] {
  const total = lengthOf(pts);
  if (total <= maxLen || pts.length < 4) return [pts.map((p) => [p[0], p[1]] as MVec)];
  const pieces = Math.ceil(total / maxLen);
  const lens = cumulative(pts);
  const k = curvature(pts);
  const cuts: number[] = [];
  for (let c = 1; c < pieces; c++) {
    const target = (total * c) / pieces;
    let best = -1;
    let bestScore = Infinity;
    for (let i = 1; i < pts.length - 1; i++) {
      const off = Math.abs((lens[i] as number) - target);
      if (off > maxLen * 0.25) continue;
      const score = Math.abs(k[i] as number) * 40 + off / maxLen;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best > 0) cuts.push(best);
  }
  const out: MVec[][] = [];
  let start = 0;
  for (const c of [...cuts, pts.length - 1]) {
    if (c <= start) continue;
    out.push(pts.slice(start, c + 1).map((p) => [p[0], p[1]] as MVec));
    start = c;
  }
  return out;
}

/** Translate a path. */
export const translate = (pts: Path, d: Vec): MVec[] => pts.map((p) => [p[0] + d[0], p[1] + d[1]]);
