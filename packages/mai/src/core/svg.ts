/**
 * SVG output helpers. Coordinates are mm; two decimals is 10 µm, finer than any pen,
 * and keeps a plate of thousands of strokes small. Deterministic: no "-0", no exponent.
 */
import type { Vec } from './vec.ts';

export const f2 = (x: number): string => {
  const r = Math.round(x * 100) / 100;
  return (Object.is(r, -0) ? 0 : r).toString();
};
export const f3 = (x: number): string => {
  const r = Math.round(x * 1000) / 1000;
  return (Object.is(r, -0) ? 0 : r).toString();
};

/** A closed polygon as path data, relative after the first point (shorter). */
export function polygonD(pts: readonly Vec[]): string {
  if (pts.length < 3) return '';
  let d = `M${f2(pts[0]![0])} ${f2(pts[0]![1])}`;
  let px = Math.round(pts[0]![0] * 100);
  let py = Math.round(pts[0]![1] * 100);
  let body = '';
  for (let i = 1; i < pts.length; i++) {
    const qx = Math.round(pts[i]![0] * 100);
    const qy = Math.round(pts[i]![1] * 100);
    const dx = qx - px;
    const dy = qy - py;
    if (dx === 0 && dy === 0) continue;
    body += `${body ? ' ' : ''}${f2(dx / 100)} ${f2(dy / 100)}`;
    px = qx;
    py = qy;
  }
  if (!body) return '';
  d += `l${body.replace(/ -/g, '-')}z`;
  return d;
}

/** An open polyline as path data (for stroked lanes and hairlines). */
export function polylineD(pts: readonly Vec[]): string {
  if (pts.length < 2) return '';
  let d = `M${f2(pts[0]![0])} ${f2(pts[0]![1])}l`;
  let px = Math.round(pts[0]![0] * 100);
  let py = Math.round(pts[0]![1] * 100);
  const parts: string[] = [];
  for (let i = 1; i < pts.length; i++) {
    const qx = Math.round(pts[i]![0] * 100);
    const qy = Math.round(pts[i]![1] * 100);
    if (qx === px && qy === py) continue;
    parts.push(`${f2((qx - px) / 100)} ${f2((qy - py) / 100)}`);
    px = qx;
    py = qy;
  }
  if (!parts.length) return '';
  d += parts.join(' ').replace(/ -/g, '-');
  return d;
}

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
