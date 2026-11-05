/**
 * Projection — the solids kit. Constructions in space drawn orthographically on the sheet,
 * with the conventions that make space readable on paper:
 *
 *   hidden lines   what lies behind a nearer surface is dashed (ISO 128: dashed = hidden)
 *   axes           centre lines are chain lines (long dash, dot) and run past the solid to a
 *                  label at each end (A and A′), so the axis is named where it leaves
 *   rotation       a small circular arrow round an axis says which way it turns
 *   poles          where an axis pierces the surface it is marked with a dot
 *
 * World: x right, y up, z toward the viewer (right-handed). The camera turns the world by
 * yaw (about y), pitch (about x) and roll (about z), in degrees, then drops z.
 */
import { add, DEG, type MVec, norm, scale, sub, type Vec } from '../core/vec.ts';
import type { Role } from '../hand/hand.ts';
import { letter } from '../letter/letter.ts';
import type { Mark, Plate } from '../plate/plate.ts';
import { arrowhead } from './outer.ts';

export type V3 = readonly [number, number, number];

export interface Camera {
  center: Vec;
  /** Sheet mm per world unit. */
  scale: number;
  /** Row-major 3×3 rotation. */
  m: readonly number[];
}

export function camera(o: {
  center: Vec;
  scale: number;
  yaw?: number;
  pitch?: number;
  roll?: number;
}): Camera {
  const y = (o.yaw ?? 0) * DEG;
  const x = (o.pitch ?? 0) * DEG;
  const z = (o.roll ?? 0) * DEG;
  const Ry = [Math.cos(y), 0, Math.sin(y), 0, 1, 0, -Math.sin(y), 0, Math.cos(y)];
  const Rx = [1, 0, 0, 0, Math.cos(x), -Math.sin(x), 0, Math.sin(x), Math.cos(x)];
  const Rz = [Math.cos(z), -Math.sin(z), 0, Math.sin(z), Math.cos(z), 0, 0, 0, 1];
  const mul = (a: number[], b: number[]) => {
    const r = new Array<number>(9).fill(0);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < 3; k++)
          r[i * 3 + j] =
            (r[i * 3 + j] as number) + (a[i * 3 + k] as number) * (b[k * 3 + j] as number);
    return r;
  };
  return { center: o.center, scale: o.scale, m: mul(Rz, mul(Rx, Ry)) };
}

/** World → view (rotated) coordinates. */
export function view(cam: Camera, p: V3): V3 {
  const m = cam.m;
  return [
    (m[0] as number) * p[0] + (m[1] as number) * p[1] + (m[2] as number) * p[2],
    (m[3] as number) * p[0] + (m[4] as number) * p[1] + (m[5] as number) * p[2],
    (m[6] as number) * p[0] + (m[7] as number) * p[1] + (m[8] as number) * p[2],
  ];
}

/** World → sheet (mm), with depth toward the viewer. */
export function project(cam: Camera, p: V3): { p: MVec; z: number } {
  const q = view(cam, p);
  return { p: [cam.center[0] + q[0] * cam.scale, cam.center[1] - q[1] * cam.scale], z: q[2] };
}

const cross3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm3v = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** A circle in space: centre c, normal n, radius r, as sheet points with depth. */
export function circle3d(cam: Camera, c: V3, n: V3, r: number, steps = 240) {
  const nn = norm3v(n);
  const helper: V3 = Math.abs(nn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm3v(cross3(nn, helper));
  const v = cross3(nn, u);
  const out: { p: MVec; z: number; w: V3 }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const w: V3 = [
      c[0] + r * (Math.cos(t) * u[0] + Math.sin(t) * v[0]),
      c[1] + r * (Math.cos(t) * u[1] + Math.sin(t) * v[1]),
      c[2] + r * (Math.cos(t) * u[2] + Math.sin(t) * v[2]),
    ];
    const pr = project(cam, w);
    out.push({ p: pr.p, z: pr.z, w });
  }
  return out;
}

/** Split sampled points into runs of one visibility (with the run's last point shared). */
export function runs<T extends { p: MVec }>(
  pts: T[],
  visible: (q: T) => boolean,
): { pts: MVec[]; visible: boolean }[] {
  const out: { pts: MVec[]; visible: boolean }[] = [];
  let cur: { pts: MVec[]; visible: boolean } | null = null;
  for (const q of pts) {
    const v = visible(q);
    if (!cur || cur.visible !== v) {
      if (cur) cur.pts.push(q.p);
      cur = { pts: [q.p], visible: v };
      out.push(cur);
    } else cur.pts.push(q.p);
  }
  return out.filter((r) => r.pts.length > 1);
}

export interface WireSphereOptions {
  id: string;
  cam: Camera;
  /** Centre in world units (default the origin) and radius. */
  center?: V3;
  radius: number;
  /** Great circles by their normals. */
  circles?: { id: string; n: V3; part?: string }[];
  /** Axes through the centre: labels at the negative and positive ends, how far they run past the sphere (world units), and an optional turn arrow. */
  axes?: {
    id: string;
    dir: V3;
    labels?: readonly [string, string];
    extend?: number;
    turn?: 1 | -1;
    part?: string;
  }[];
  role?: Role;
  /** Mark the poles where each axis pierces the sphere. */
  poles?: boolean;
  cap?: number;
}

export interface WireSphere {
  id: string;
  centre: MVec;
  radiusMm: number;
  marks: Mark[];
  axisEnds: Record<string, [MVec, MVec]>;
  poles: Record<string, [MVec, MVec]>;
}

/**
 * A sphere drawn as a wire: its outline, great circles (front solid, back dashed), axes as
 * chain lines named at both ends, poles, and turn arrows. The construction a stereometry
 * plate, an armillary sphere or the eye's own axes of rotation is built from.
 */
export function wireSphere(plate: Plate, o: WireSphereOptions): WireSphere {
  const c: V3 = o.center ?? [0, 0, 0];
  const R = o.radius;
  const role: Role = o.role ?? 'contour';
  const cc = project(o.cam, c);
  const rMm = R * o.cam.scale;
  const marks: Mark[] = [];
  const zc = cc.z;
  // outline: the silhouette is a circle in orthographic view
  const sil: MVec[] = [];
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * Math.PI * 2 - 1.1;
    sil.push([cc.p[0] + Math.cos(t) * rMm, cc.p[1] + Math.sin(t) * rMm]);
  }
  marks.push(
    ...plate.stroke(sil, {
      role,
      id: `${o.id}-outline`,
      anchored: true,
      pressure: 0.62,
      part: o.id,
    }),
  );
  for (const gc of o.circles ?? []) {
    const pts = circle3d(o.cam, c, gc.n, R, 360);
    runs(pts, (q) => q.z - zc >= -1e-6).forEach((r, i) => {
      marks.push(
        ...plate.stroke(r.pts, {
          role,
          id: `${gc.id}-${r.visible ? 'front' : 'back'}-${i}`,
          group: gc.id,
          pressure: r.visible ? 0.48 : 0.36,
          line: r.visible ? 'solid' : 'dashed',
          hidden: !r.visible,
          part: gc.part ?? gc.id,
          start: 'touch',
          end: 'lift',
        }),
      );
    });
  }
  const axisEnds: Record<string, [MVec, MVec]> = {};
  const poles: Record<string, [MVec, MVec]> = {};
  for (const ax of o.axes ?? []) {
    const d = norm3v(ax.dir);
    const ext = ax.extend ?? R * 0.8;
    const at = (t: number): V3 => [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t];
    const pA = project(o.cam, at(-(R + ext)));
    const pB = project(o.cam, at(R + ext));
    const inA = project(o.cam, at(-R));
    const inB = project(o.cam, at(R));
    axisEnds[ax.id] = [pA.p, pB.p];
    poles[ax.id] = [inA.p, inB.p];
    // inside the sphere: a fine solid line through the centre
    marks.push(
      ...plate.stroke([inA.p, inB.p], {
        role,
        id: `${ax.id}-in`,
        guide: 'ruler',
        pressure: 0.34,
        part: ax.part ?? ax.id,
        start: 'touch',
        end: 'lift',
      }),
    );
    // outside: chain lines (centre-line convention), dashed where the sphere hides them
    for (const [from, to, side] of [
      [pA, inA, 'neg'],
      [inB, pB, 'pos'],
    ] as const) {
      const behind =
        (from.z + to.z) / 2 < zc &&
        Math.hypot((from.p[0] + to.p[0]) / 2 - cc.p[0], (from.p[1] + to.p[1]) / 2 - cc.p[1]) < rMm;
      marks.push(
        ...plate.stroke([from.p, to.p], {
          role,
          id: `${ax.id}-${side}`,
          group: ax.id,
          guide: 'ruler',
          line: behind ? 'dashed' : 'chain',
          hidden: behind,
          pressure: 0.38,
          part: ax.part ?? ax.id,
        }),
      );
    }
    // the axis is named where it leaves the figure
    if (ax.labels) {
      const dir2 = norm(sub(pB.p, pA.p));
      const cap = o.cap ?? 3.2;
      const off = cap * 0.95;
      const la = add(pA.p, scale(dir2, -off));
      const lb = add(pB.p, scale(dir2, off));
      marks.push(
        ...letter(plate, ax.labels[0], [la[0], la[1] + cap / 2], {
          cap,
          anchor: 'middle',
          kind: 'key',
          id: `${ax.id}-label-a`,
          refers: pA.p,
        }).marks,
      );
      marks.push(
        ...letter(plate, ax.labels[1], [lb[0], lb[1] + cap / 2], {
          cap,
          anchor: 'middle',
          kind: 'key',
          id: `${ax.id}-label-b`,
          refers: pB.p,
        }).marks,
      );
    }
    if (o.poles !== false) {
      for (const [q, front] of [
        [inA, inA.z >= zc],
        [inB, inB.z >= zc],
      ] as const) {
        const r = front ? 0.55 : 0.4;
        marks.push(
          ...plate.stroke(
            [
              [q.p[0] - r * 0.2, q.p[1]],
              [q.p[0] + r * 0.2, q.p[1] + 0.05],
            ],
            {
              role: 'stipple',
              end: 'stop',
              start: 'dip',
              pressure: front ? 0.95 : 0.6,
              id: `${ax.id}-pole-${front ? 'f' : 'b'}-${q.p[0].toFixed(1)}`,
              part: ax.part ?? ax.id,
            },
          ),
        );
      }
    }
    if (ax.turn) {
      // a small circular arrow round the axis, out beyond the sphere on the positive side
      const tc = at(R + ext * 0.55);
      const rr = R * 0.16;
      const pts = circle3d(o.cam, tc, d, rr, 120).map((q) => q.p);
      const n = pts.length;
      const keep = pts.slice(0, Math.floor(n * 0.84));
      const arc = ax.turn === 1 ? keep : keep.slice().reverse();
      marks.push(
        ...plate.stroke(arc, {
          role,
          id: `${ax.id}-turn`,
          pressure: 0.42,
          start: 'touch',
          end: 'lift',
          part: ax.part ?? ax.id,
        }),
      );
      const tip = arc[arc.length - 1] as MVec;
      const prev = arc[arc.length - 4] as MVec;
      marks.push(
        arrowhead(plate, tip, norm(sub(tip, prev)), {
          role,
          len: 1.9,
          id: `${ax.id}-turn-head`,
          part: ax.part ?? ax.id,
        }),
      );
    }
  }
  return { id: o.id, centre: cc.p, radiusMm: rMm, marks, axisEnds, poles };
}
