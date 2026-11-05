/**
 * Plate geometry is in millimetres on the sheet, y down (screen convention), origin at
 * the sheet's top-left corner. A mark that is 0.3 mm wide is 0.3 mm wide at any zoom:
 * the sheet scales as one object, the way a scan of a real page does.
 */
export type Vec = readonly [number, number];
export type MVec = [number, number];
export type Vec3 = readonly [number, number, number];

export const v = (x: number, y: number): MVec => [x, y];
export const add = (a: Vec, b: Vec): MVec => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec, b: Vec): MVec => [a[0] - b[0], a[1] - b[1]];
export const scale = (a: Vec, k: number): MVec => [a[0] * k, a[1] * k];
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1];
export const cross = (a: Vec, b: Vec) => a[0] * b[1] - a[1] * b[0];
export const len = (a: Vec) => Math.hypot(a[0], a[1]);
export const dist = (a: Vec, b: Vec) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const norm = (a: Vec): MVec => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
/** Left-hand normal on screen (y down): rotates +90° visually counter-clockwise. */
export const perp = (a: Vec): MVec => [a[1], -a[0]];
export const lerpV = (a: Vec, b: Vec, t: number): MVec => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
export const rotate = (a: Vec, ang: number): MVec => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
export const rotateAbout = (p: Vec, c: Vec, ang: number): MVec => add(c, rotate(sub(p, c), ang));
export const fromAngle = (ang: number, r = 1): MVec => [Math.cos(ang) * r, Math.sin(ang) * r];
export const angleOf = (a: Vec) => Math.atan2(a[1], a[0]);
export const mid = (a: Vec, b: Vec): MVec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export const norm3 = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Smallest signed difference between two angles, in (−π, π]. */
export function angleDiff(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export const DEG = Math.PI / 180;
