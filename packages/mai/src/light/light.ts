/**
 * Light — one source per plate, declared, never implied.
 *
 * Convention (research 02 §11, 37 CFR 1.84(m)): light from the upper left at 45°. Leonardo
 * (¶555): "first give a general shadow to the whole of that extended part which is away
 * from the light". Every tone on a plate is computed from this one light, so the critic
 * can check that hatching, contour weight and cast shadows all agree with it.
 *
 * Screen convention: x right, y down, z out of the sheet toward the viewer.
 */
import { dot3, norm3, type Vec, type Vec3 } from '../core/vec.ts';

export interface Light {
  /** Unit vector toward the light. */
  dir: Vec3;
  /** Light that is everywhere (sky, room), 0..1. */
  ambient: number;
  /** Light bounced back into the shadow from the ground or a wall (Leonardo's reflected light). */
  bounce: number;
  /** Direction the bounce comes from (toward it). */
  bounceDir: Vec3;
}

/**
 * Light from an azimuth on the page (degrees; 0 = from the right, 90 = from below,
 * 180 = from the left, 225 = from the upper left) and an elevation above the sheet.
 */
export function lightFrom(
  azimuthDeg: number,
  elevationDeg = 45,
  ambient = 0.18,
  bounce = 0.14,
): Light {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  const dir = norm3([Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)]);
  // the bounce comes from roughly the opposite side, low
  const bounceDir = norm3([-dir[0], -dir[1] * 0.4 + 0.6, 0.25]);
  return { dir, ambient, bounce, bounceDir };
}

/** The studio default: upper left, 45° (research 02 §11). */
export const UPPER_LEFT = lightFrom(225, 45);

/** Direction toward the light on the page (2D, unit). */
export function light2d(l: Light): Vec {
  const h = Math.hypot(l.dir[0], l.dir[1]) || 1;
  return [l.dir[0] / h, l.dir[1] / h];
}

/**
 * Tone of a surface with normal n under the light: 0 = paper (fully lit) … 1 = darkest.
 * Lambert diffuse, an ambient floor, and a bounce that lifts the shadow's far side, so
 * the core of the shadow sits at the terminator, as Leonardo described it.
 */
export function toneOf(n: Vec3, l: Light): number {
  const nn = norm3(n);
  const diffuse = Math.max(0, dot3(nn, l.dir));
  const bounce = Math.max(0, dot3(nn, l.bounceDir)) * l.bounce * (diffuse < 0.05 ? 1 : 0.3);
  const lit = l.ambient + (1 - l.ambient) * diffuse + bounce;
  return Math.max(0, Math.min(1, 1 - lit));
}
