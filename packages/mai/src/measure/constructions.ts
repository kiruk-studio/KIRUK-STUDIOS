/**
 * Historic constructions, drawn as they were made: with the compass and the rule, every
 * centre pricked and numbered, every arc continuing the last without a kink.
 *
 * A construction is shown only if it generated the drawing (research 01 R11). These
 * helpers return the geometry they produced; the plate records what each construction
 * generated, and the critic fails any that generated nothing (ornamental golden spirals
 * are a named fake, research 01 §5).
 */
import { arc as arcPath } from '../core/path.ts';
import type { MVec, Vec } from '../core/vec.ts';
import type { Plate } from '../plate/plate.ts';
import { compass, point, ruled } from './measure.ts';

export const PHI = (1 + Math.sqrt(5)) / 2;

export interface Volute {
  /** Centres of the twelve quarter-arcs, in the order they are struck (1…12). */
  centres: MVec[];
  /** Radii of the twelve arcs. */
  radii: number[];
  /** The outer spiral as one path, and per-arc pieces. */
  outer: MVec[];
  arcs: MVec[][];
  /** The inner line of the volute's band (the fillet), narrowing into the eye. */
  inner: MVec[];
  /** Start angle of each arc (radians, screen). */
  starts: number[];
  /** Centres and radii of the fillet's arcs (the inner line). */
  innerCentres: MVec[];
  innerRadii: number[];
  hand: 1 | -1;
  eye: { c: MVec; r: number };
}

/**
 * The volute as a polycentric spiral of quarter-arcs. Each arc is struck from a centre
 * inside the eye; the next centre lies on the last arc's end radius, so the curve turns
 * without a kink (G1 by construction), and the centres step inward on shrinking squares.
 *
 *   eye     the volute's eye (oculus): centre and radius
 *   start   radius of the first arc (the volute's outermost reach from its first centre)
 *   turns   quarter-arcs (12 = three full turns, the classical count)
 *   band    width of the fillet at the start; it narrows to nothing at the eye
 *   hand    1 = clockwise from the top (a right volute), −1 = the mirror (a left volute)
 */
export function voluteGeometry(
  eye: Vec,
  eyeR: number,
  start: number,
  o: { turns?: number; band?: number; hand?: 1 | -1 } = {},
): Volute {
  const turns = o.turns ?? 12;
  const hand = o.hand ?? 1;
  const total = start - eyeR;
  // centre steps shrink linearly: the k-th step is proportional to (turns − k)
  const sum = (turns * (turns + 1)) / 2;
  const steps = Array.from({ length: turns }, (_, k) => (total * (turns - k)) / sum);
  // directions of the end radius of each arc: right, down, left, up (clockwise on screen)
  const dirs: Vec[] =
    hand === 1
      ? [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ]
      : [
          [-1, 0],
          [0, 1],
          [1, 0],
          [0, -1],
        ];
  const raw: MVec[] = [[0, 0]];
  const radii = [start];
  for (let k = 0; k < turns - 1; k++) {
    const d = dirs[k % 4] as Vec;
    const c = raw[k] as MVec;
    raw.push([c[0] + d[0] * (steps[k] as number), c[1] + d[1] * (steps[k] as number)]);
    radii.push((radii[k] as number) - (steps[k] as number));
  }
  // centre the square spiral of centres on the eye
  const mx = raw.reduce((s, p) => s + p[0], 0) / raw.length;
  const my = raw.reduce((s, p) => s + p[1], 0) / raw.length;
  const centres = raw.map((p) => [eye[0] + p[0] - mx, eye[1] + p[1] - my] as MVec);
  const startAng = -Math.PI / 2;
  const arcs: MVec[][] = [];
  const starts: number[] = [];
  const outer: MVec[] = [];
  for (let k = 0; k < turns; k++) {
    const a0 = startAng + (hand * (k * Math.PI)) / 2;
    const a1 = a0 + (hand * Math.PI) / 2;
    starts.push(a0);
    const pts = arcPath(centres[k] as MVec, radii[k] as number, a0, a1, 0.25);
    arcs.push(pts);
    outer.push(...(k === 0 ? pts : pts.slice(1)));
  }
  // the fillet: centres pulled toward the eye by κ so both lines end at the eye together
  const band = o.band ?? total * 0.12;
  const kappa = (start - band - eyeR) / (start - eyeR);
  const inner: MVec[] = [];
  const innerCentres: MVec[] = [];
  const innerRadii: number[] = [];
  let rIn = start - band;
  for (let k = 0; k < turns; k++) {
    const c = centres[k] as MVec;
    const ci: MVec = [eye[0] + (c[0] - eye[0]) * kappa, eye[1] + (c[1] - eye[1]) * kappa];
    innerCentres.push(ci);
    innerRadii.push(rIn);
    const a0 = starts[k] as number;
    const pts = arcPath(ci, rIn, a0, a0 + (hand * Math.PI) / 2, 0.25);
    inner.push(...(k === 0 ? pts : pts.slice(1)));
    if (k < turns - 1) rIn -= (steps[k] as number) * kappa;
  }
  return {
    centres,
    radii,
    outer,
    arcs,
    inner,
    starts,
    innerCentres,
    innerRadii,
    hand,
    eye: { c: [eye[0], eye[1]], r: eyeR },
  };
}

/**
 * A line inside the volute's band, a fraction `s` of the way from the outer line (0) to
 * the fillet (1), sampled at the same angles on both: the channel lines an engraver cuts
 * to shade the canalis, following the scroll instead of crossing it.
 */
export function bandLine(v: Volute, s: number, step = 0.3): MVec[] {
  const out: MVec[] = [];
  for (let k = 0; k < v.centres.length; k++) {
    const a0 = v.starts[k] as number;
    const co = v.centres[k] as MVec;
    const ci = v.innerCentres[k] as MVec;
    const r = (v.radii[k] as number) * (1 - s) + (v.innerRadii[k] as number) * s;
    const n = Math.max(3, Math.ceil(((Math.PI / 2) * r) / step));
    for (let i = k === 0 ? 0 : 1; i <= n; i++) {
      const a = a0 + (v.hand * (Math.PI / 2) * i) / n;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const po: MVec = [co[0] + (v.radii[k] as number) * ux, co[1] + (v.radii[k] as number) * uy];
      const pi: MVec = [
        ci[0] + (v.innerRadii[k] as number) * ux,
        ci[1] + (v.innerRadii[k] as number) * uy,
      ];
      out.push([po[0] * (1 - s) + pi[0] * s, po[1] * (1 - s) + pi[1] * s]);
    }
  }
  return out;
}

/**
 * Draw the volute's construction: the eye (pricked), the cathetus and the horizontal
 * through it, and the twelve centres numbered in the order they are struck.
 * Returns the construction ids so the caller can say what they generated.
 */
export function drawVoluteConstruction(
  plate: Plate,
  v: Volute,
  o: { id?: string; numbers?: boolean; cathetus?: [number, number] } = {},
): { eye: string; cathetus: string; horizontal: string; centres: string[] } {
  const id = o.id ?? plate.nextId('volute');
  const [c, r] = [v.eye.c, v.eye.r];
  const reach = o.cathetus ?? [v.radii[0] as number, v.radii[0] as number];
  const cath = ruled(plate, [c[0], c[1] - reach[0] - 3], [c[0], c[1] + reach[1] + 3], {
    id: `${id}-cathetus`,
    kind: 'axis',
    label: 'cathetus',
  });
  const hor = ruled(
    plate,
    [c[0] - (v.radii[1] as number) - 3, c[1]],
    [c[0] + (v.radii[1] as number) + 3, c[1]],
    { id: `${id}-horizontal`, kind: 'axis' },
  );
  const eye = compass(plate, c, r, { id: `${id}-eye`, label: 'eye' });
  const centres: string[] = [];
  v.centres.forEach((p, k) => {
    const pid = `${id}-c${k + 1}`;
    point(plate, p, { id: pid, style: 'prick' });
    centres.push(pid);
  });
  return { eye: eye.id, cathetus: cath.id, horizontal: hor.id, centres };
}

/** A golden rectangle with its squares and the quarter-arc spiral (compass work). */
export function goldenRectangle(
  plate: Plate,
  origin: Vec,
  width: number,
  o: { depth?: number; spiral?: boolean; id?: string } = {},
): { id: string; rect: MVec[]; squares: MVec[][]; spiral: MVec[]; constructionIds: string[] } {
  const id = o.id ?? plate.nextId('golden');
  const depth = o.depth ?? 5;
  let x = origin[0];
  let y = origin[1];
  let w = width;
  let h = width / PHI;
  const rect: MVec[] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const ids: string[] = [];
  ids.push(ruled(plate, [x, y], [x + w, y], { id: `${id}-t` }).id);
  ids.push(ruled(plate, [x, y + h], [x + w, y + h], { id: `${id}-b` }).id);
  ids.push(ruled(plate, [x, y], [x, y + h], { id: `${id}-l` }).id);
  ids.push(ruled(plate, [x + w, y], [x + w, y + h], { id: `${id}-r` }).id);
  const squares: MVec[][] = [];
  const spiral: MVec[] = [];
  // cut a square off the left, then the top, the right, the bottom… turning inward
  for (let k = 0; k < depth; k++) {
    const s = Math.min(w, h);
    let sq: MVec[];
    let cx: number;
    let cy: number;
    let a0: number;
    switch (k % 4) {
      case 0:
        sq = [
          [x, y],
          [x + s, y],
          [x + s, y + s],
          [x, y + s],
        ];
        ids.push(ruled(plate, [x + s, y], [x + s, y + h], { id: `${id}-s${k}` }).id);
        cx = x + s;
        cy = y + s;
        a0 = Math.PI;
        x += s;
        w -= s;
        break;
      case 1:
        sq = [
          [x, y],
          [x + w, y],
          [x + w, y + s],
          [x, y + s],
        ];
        ids.push(ruled(plate, [x, y + s], [x + w, y + s], { id: `${id}-s${k}` }).id);
        cx = x;
        cy = y + s;
        a0 = -Math.PI / 2;
        y += s;
        h -= s;
        break;
      case 2:
        sq = [
          [x + w - s, y],
          [x + w, y],
          [x + w, y + h],
          [x + w - s, y + h],
        ];
        ids.push(ruled(plate, [x + w - s, y], [x + w - s, y + h], { id: `${id}-s${k}` }).id);
        cx = x + w - s;
        cy = y;
        a0 = 0;
        w -= s;
        break;
      default:
        sq = [
          [x, y + h - s],
          [x + w, y + h - s],
          [x + w, y + h],
          [x, y + h],
        ];
        ids.push(ruled(plate, [x, y + h - s], [x + w, y + h - s], { id: `${id}-s${k}` }).id);
        cx = x + w;
        cy = y + h - s;
        a0 = Math.PI / 2;
        h -= s;
        break;
    }
    squares.push(sq);
    if (o.spiral !== false) {
      const part = arcPath([cx, cy], s, a0, a0 + Math.PI / 2, 0.3);
      spiral.push(...(spiral.length ? part.slice(1) : part));
    }
  }
  plate.fact(`${id}:ratio`, PHI, 'φ = (1 + √5) / 2');
  return { id, rect, squares, spiral, constructionIds: ids };
}
