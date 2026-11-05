/**
 * Forms — the solids a plate shades. Each knows its silhouette, its surface normal at a
 * point of the drawing, and the direction its cross-contours run (for hatching that
 * follows the form, research 01 §1). Tone comes from the plate's one light.
 *
 * Orthographic, seen square-on; a form may tilt its axis in the picture plane.
 */
import { circle, ellipse, pointInPolygon } from '../core/path.ts';
import { DEG, type MVec, norm3, type Vec, type Vec3 } from '../core/vec.ts';
import { type Light, toneOf } from './light.ts';

export interface Form {
  id: string;
  kind: 'sphere' | 'cylinder' | 'cone' | 'plane' | 'shadow' | 'custom';
  outline: MVec[];
  contains(p: Vec): boolean;
  /** Surface normal (screen x right, y down, z toward the viewer); null outside. */
  normal(p: Vec): Vec3 | null;
  /** Direction cross-contour hatching runs at p (unit, on the page). */
  flow(p: Vec): Vec;
  /** Tone under a light, 0 lit … 1 darkest. */
  tone(p: Vec, light: Light): number;
}

/** A sphere of radius r. Its cross-contours are latitudes about a slightly tilted axis. */
export function sphere(id: string, c: Vec, r: number, axisTilt = -18 * DEG): Form {
  const outline = circle(c, r, 0, Math.max(0.25, r / 60));
  const A: Vec3 = norm3([Math.sin(axisTilt), -Math.cos(axisTilt), 0.32]);
  const normal = (p: Vec): Vec3 | null => {
    const dx = (p[0] - c[0]) / r;
    const dy = (p[1] - c[1]) / r;
    const d2 = dx * dx + dy * dy;
    if (d2 > 1) return null;
    return [dx, dy, Math.sqrt(Math.max(0, 1 - d2))];
  };
  return {
    id,
    kind: 'sphere',
    outline,
    contains: (p) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 <= r * r,
    normal,
    flow: (p) => {
      const n = normal(p) ?? [0, 0, 1];
      // latitude direction: perpendicular to both the axis and the normal
      const t: Vec3 = [
        A[1] * n[2] - A[2] * n[1],
        A[2] * n[0] - A[0] * n[2],
        A[0] * n[1] - A[1] * n[0],
      ];
      const l = Math.hypot(t[0], t[1]) || 1;
      return [t[0] / l, t[1] / l];
    },
    tone: (p, light) => {
      const n = normal(p);
      return n ? toneOf(n, light) : 0;
    },
  };
}

/**
 * A cylinder of radius r whose axis runs from a to b in the picture plane. `ellipse` bends
 * its cross-contours (the rings) by how far the eye sits above or below: 0 = straight.
 */
export function cylinder(id: string, a: Vec, b: Vec, r: number, ellipseRatio = 0.12): Form {
  const ax = b[0] - a[0];
  const ay = b[1] - a[1];
  const len = Math.hypot(ax, ay) || 1;
  const ex: Vec = [ax / len, ay / len];
  const px: Vec = [-ex[1], ex[0]];
  const outline: MVec[] = [
    [a[0] + px[0] * r, a[1] + px[1] * r],
    [b[0] + px[0] * r, b[1] + px[1] * r],
    [b[0] - px[0] * r, b[1] - px[1] * r],
    [a[0] - px[0] * r, a[1] - px[1] * r],
  ];
  const local = (p: Vec) => {
    const rx = p[0] - a[0];
    const ry = p[1] - a[1];
    return [rx * ex[0] + ry * ex[1], (rx * px[0] + ry * px[1]) / r] as const;
  };
  const normal = (p: Vec): Vec3 | null => {
    const [u, d] = local(p);
    if (u < 0 || u > len || Math.abs(d) > 1) return null;
    const z = Math.sqrt(Math.max(0, 1 - d * d));
    return [px[0] * d, px[1] * d, z];
  };
  return {
    id,
    kind: 'cylinder',
    outline,
    contains: (p) => {
      const [u, d] = local(p);
      return u >= 0 && u <= len && Math.abs(d) <= 1;
    },
    normal,
    flow: (p) => {
      // rings: across the axis, bent into a shallow ellipse arc
      const [, d] = local(p);
      const bend = ellipseRatio * d;
      const fx = px[0] + ex[0] * bend;
      const fy = px[1] + ex[1] * bend;
      const l = Math.hypot(fx, fy) || 1;
      return [fx / l, fy / l];
    },
    tone: (p, light) => {
      const n = normal(p);
      return n ? toneOf(n, light) : 0;
    },
  };
}

/** A flat face with a fixed normal (an architectural plane, a cut surface). */
export function plane(id: string, outline: MVec[], n: Vec3, flowDir: Vec = [1, 0]): Form {
  const nn = norm3(n);
  const l = Math.hypot(flowDir[0], flowDir[1]) || 1;
  const f: Vec = [flowDir[0] / l, flowDir[1] / l];
  return {
    id,
    kind: 'plane',
    outline,
    contains: (p) => pointInPolygon(p, outline),
    normal: (p) => (pointInPolygon(p, outline) ? nn : null),
    flow: () => f,
    tone: (p, light) => (pointInPolygon(p, outline) ? toneOf(nn, light) : 0),
  };
}

/**
 * A cast shadow on the ground: an ellipse thrown away from the light, darkest where the
 * body meets the ground and softening with distance (umbra into penumbra).
 */
export function castShadow(
  id: string,
  contact: Vec,
  size: number,
  light: Light,
  strength = 0.85,
): Form {
  const h = Math.hypot(light.dir[0], light.dir[1]) || 1;
  const away: Vec = [-light.dir[0] / h, -light.dir[1] / h];
  const elev = Math.max(0.15, light.dir[2]);
  const reach = size * Math.min(2.6, 0.9 / elev);
  const c: Vec = [contact[0] + away[0] * reach * 0.45, contact[1] + away[1] * reach * 0.12];
  const rx = reach * 0.62;
  const ry = size * 0.22;
  const rot = Math.atan2(away[1] * 0.2, away[0]);
  const outline = ellipse(c, rx, ry, rot, 0, Math.PI * 2, 0.3);
  return {
    id,
    kind: 'shadow',
    outline,
    contains: (p) => pointInPolygon(p, outline),
    normal: () => [0, -1, 0.2],
    flow: () => [Math.cos(rot), Math.sin(rot)],
    tone: (p) => {
      if (!pointInPolygon(p, outline)) return 0;
      const dc = Math.hypot((p[0] - contact[0]) / rx, (p[1] - contact[1]) / (ry * 1.6));
      const de = Math.hypot((p[0] - c[0]) / rx, (p[1] - c[1]) / ry);
      return strength * Math.max(0, 1 - 0.55 * dc) * Math.max(0, 1 - de ** 4);
    },
  };
}

/** Any form from your own normal function and outline. */
export function customForm(
  id: string,
  outline: MVec[],
  normal: (p: Vec) => Vec3 | null,
  flow: (p: Vec) => Vec = () => [1, 0],
): Form {
  return {
    id,
    kind: 'custom',
    outline,
    contains: (p) => pointInPolygon(p, outline),
    normal,
    flow,
    tone: (p, light) => {
      const n = normal(p);
      return n ? toneOf(n, light) : 0;
    },
  };
}
