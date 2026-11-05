/**
 * Outer measurement — what a figure says about its own size and place, round its edge.
 *
 *   neatline   a double frame graduated in the plate's unit, counted from the figure's own
 *              origin (an axis, a centre), so the reader can measure anything on the sheet
 *   extents    the figure's overall width and height, measured from the extremes of its ink,
 *              set outside everything else (the outermost tier)
 *   chainDims  consecutive dimensions along one line, with the overall one tier further out
 *              (ISO 129: smaller dimensions inside, larger outside)
 *   angle      an angular dimension: an arc with arrowheads and its value in degrees
 *   sweep      a path of motion or a turn: an arc with an arrowhead, round the figure
 *   frame      a UI box (optionally rounded) drawn as part of the figure
 *   redline    the gap between two boxes, as a designer's redline (px or mm)
 *   padding    the four gaps between a box and its content
 *
 * Every value is computed from geometry at the plate's scale and recorded, so the critic
 * can re-measure it. Research 03 §2.2: gap ≈ 1.5 mm off the ink, overshoot 2.5–3 mm, first
 * tier 10–12 mm out, further tiers 6–10 mm apart.
 */
import { arc as arcPath, line } from '../core/path.ts';
import { polygonD } from '../core/svg.ts';
import { add, DEG, type MVec, norm, perp, scale, type Vec } from '../core/vec.ts';
import type { Role } from '../hand/hand.ts';
import { letter } from '../letter/letter.ts';
import type { LineType } from '../plate/linetype.ts';
import type { Mark, Plate } from '../plate/plate.ts';
import { dimension, formatValue, isOverlay, valueInk } from './measure.ts';

export type Rect = readonly [x0: number, y0: number, x1: number, y1: number];

/** A filled arrowhead, length:width ≈ 3:1 (research 03 §2.2). */
export function arrowhead(
  plate: Plate,
  tip: Vec,
  dir: Vec,
  o: { role?: Role; len?: number; id?: string; part?: string } = {},
): Mark {
  const role = o.role ?? 'dimension';
  const kit = plate.kit(role);
  const L = o.len ?? 2.2;
  const u = norm(dir);
  const n = perp(u);
  const exact = isOverlay(plate, role);
  const rng = plate.rng.fork(`arrow:${o.id ?? plate.marks.length}`);
  const skew = exact ? 0 : rng.normal() * 0.05;
  const back = add(tip, scale(u, -L));
  const tri: MVec[] = [
    [tip[0], tip[1]],
    add(back, scale(n, L / 6 + skew)),
    add(add(back, scale(u, L * 0.18)), scale(n, 0)),
    add(back, scale(n, -L / 6 + skew)),
  ];
  return plate.addShape({
    role,
    parts: [{ kind: 'body', d: polygonD(tri), density: 0.92 }],
    spine: [[tip[0], tip[1]]],
    ink: kit.ink,
    layer: kit.layer,
    id: o.id,
    part: o.part,
  });
}

export interface NeatlineOptions {
  id?: string;
  /** Graduation step in plate units (e.g. 10 mm at the plate's scale). */
  every: number;
  /** A longer, numbered tick every `major` steps. */
  major?: number;
  /** The sheet point the count starts from (the figure's axis or centre). */
  origin: Vec;
  /** Distance between the two lines of the frame, mm. */
  gap?: number;
  role?: Role;
  /** Number the major ticks. */
  numbers?: boolean;
  /** Which sides carry the numbers (default top and left). */
  numbersOn?: readonly ('top' | 'left')[];
  cap?: number;
}

/**
 * A graduated neatline round `rect`: an inner and an outer line, ticks between them every
 * `every` plate units counted from `origin`, longer and numbered every `major`.
 */
export function neatline(plate: Plate, rect: Rect, o: NeatlineOptions) {
  const id = o.id ?? plate.nextId('neatline');
  const role = o.role ?? 'dimension';
  const exact = isOverlay(plate, role);
  const guide = exact ? 'exact' : 'ruler';
  const gap = o.gap ?? 1.8;
  const major = o.major ?? 5;
  const perMm = plate.scale.perMm;
  const stepMm = o.every / perMm;
  const [x0, y0, x1, y1] = rect;
  const marks: Mark[] = [];
  const box = (inset: number, pressure: number, sid: string) => {
    const a: MVec = [x0 - inset, y0 - inset];
    const b: MVec = [x1 + inset, y0 - inset];
    const c: MVec = [x1 + inset, y1 + inset];
    const d: MVec = [x0 - inset, y1 + inset];
    for (const [p, q, k] of [
      [a, b, 't'],
      [b, c, 'r'],
      [c, d, 'b'],
      [d, a, 'l'],
    ] as const)
      marks.push(
        ...plate.stroke(line(p, q, 0.5), {
          role,
          guide,
          pressure,
          id: `${id}-${sid}-${k}`,
          group: id,
          start: 'touch',
          end: 'lift',
          overshoot: exact ? undefined : [0.6, 0.6],
        }),
      );
  };
  box(0, 0.38, 'in');
  box(gap, 0.6, 'out');
  // the numbers are values, read like dimension values: ISO 3098's 2.5 mm, not the 1.8 mm minimum
  const cap = o.cap ?? 2.5;
  const tick = (p: MVec, q: MVec, tid: string) =>
    marks.push(
      ...plate.stroke([p, q], {
        role,
        guide,
        pressure: 0.42,
        id: tid,
        group: id,
        start: 'touch',
        end: 'lift',
      }),
    );
  // along x (top and bottom), counted from origin
  const kx0 = Math.ceil((x0 - o.origin[0]) / stepMm);
  const kx1 = Math.floor((x1 - o.origin[0]) / stepMm);
  for (let k = kx0; k <= kx1; k++) {
    const x = o.origin[0] + k * stepMm;
    const isMajor = k % major === 0;
    const len = isMajor ? gap : gap * 0.5;
    tick([x, y0], [x, y0 - len], `${id}-tx${k}`);
    tick([x, y1], [x, y1 + len], `${id}-bx${k}`);
    if (isMajor && o.numbers !== false && (o.numbersOn ?? ['top', 'left']).includes('top'))
      marks.push(
        ...letter(plate, formatValue(Math.abs(k * o.every), 2), [x, y0 - gap - 1.2], {
          cap,
          anchor: 'middle',
          kind: 'scale',
          exact,
          role: exact ? 'overlay' : 'letter',
          ink: valueInk(plate, role),
          layer: plate.kit(role).layer,
          id: `${id}-nx${k}`,
        }).marks,
      );
  }
  const ky0 = Math.ceil((y0 - o.origin[1]) / stepMm);
  const ky1 = Math.floor((y1 - o.origin[1]) / stepMm);
  for (let k = ky0; k <= ky1; k++) {
    const y = o.origin[1] + k * stepMm;
    const isMajor = k % major === 0;
    const len = isMajor ? gap : gap * 0.5;
    tick([x0, y], [x0 - len, y], `${id}-ly${k}`);
    tick([x1, y], [x1 + len, y], `${id}-ry${k}`);
    if (isMajor && o.numbers !== false && (o.numbersOn ?? ['top', 'left']).includes('left'))
      marks.push(
        ...letter(plate, formatValue(Math.abs(k * o.every), 2), [x0 - gap - 1.2, y + cap / 2], {
          cap,
          anchor: 'end',
          kind: 'scale',
          exact,
          role: exact ? 'overlay' : 'letter',
          ink: valueInk(plate, role),
          layer: plate.kit(role).layer,
          id: `${id}-ny${k}`,
        }).marks,
      );
  }
  plate.neatlines.push({
    id,
    rect: [x0, y0, x1, y1],
    perMm,
    every: o.every,
    unit: plate.scale.unit,
    origin: [o.origin[0], o.origin[1]],
  });
  return { id, marks };
}

/** The extreme ink points of a set of marks. */
export function inkExtremes(marks: readonly Mark[]) {
  let l: MVec = [Infinity, 0];
  let r: MVec = [-Infinity, 0];
  let t: MVec = [0, Infinity];
  let b: MVec = [0, -Infinity];
  for (const m of marks)
    for (const p of m.spine) {
      if (p[0] < l[0]) l = [p[0], p[1]];
      if (p[0] > r[0]) r = [p[0], p[1]];
      if (p[1] < t[1]) t = [p[0], p[1]];
      if (p[1] > b[1]) b = [p[0], p[1]];
    }
  return { left: l, right: r, top: t, bottom: b };
}

export interface ExtentsOptions {
  id?: string;
  /** Which sides carry an overall dimension: bottom/top (the width), right/left (the height). */
  sides?: readonly ('bottom' | 'top' | 'right' | 'left')[];
  /** Distance of the dimension line beyond the outermost ink, mm (the outer tier). */
  tier?: number;
  digits?: number;
  role?: Role;
  /** 'none' when the unit is stated once for the figure (drafting practice). */
  unit?: string;
  /** Value units per sheet mm, when not the plate's scale (a UI drawn at 4 px to the mm). */
  perMm?: number;
  /**
   * Marks the dimension lines must clear (default: the measured marks). Measure a part of a
   * figure (the capital, not its broken shaft) and still set the tier outside the whole.
   */
  clear?: readonly Mark[];
  /** Distance from a dimension already standing on that side to the overall, mm (default 8). */
  tierGap?: number;
}

/**
 * The figure's overall size, measured from the extremes of its ink (never its bounding
 * box: research 03 R9) and set in the outermost tier. Never pass a break line or a
 * construction: a broken view is not dimensioned to its break (ISO 129).
 */
export function extents(plate: Plate, marks: readonly Mark[], o: ExtentsOptions = {}) {
  const id = o.id ?? plate.nextId('extent');
  const ex = inkExtremes(marks.filter((m) => m.spine.length > 0));
  const far = o.clear ? inkExtremes([...marks, ...o.clear].filter((m) => m.spine.length > 0)) : ex;
  const tier = o.tier ?? 12;
  const gap = o.tierGap ?? 8;
  const out: string[] = [];
  // the overall stands in the outermost tier: one tier gap beyond any dimension already on
  // that side whose span it overlaps (ISO 129; research 03 §2.2: tiers 6–10 mm apart)
  const beyond = (
    side: 'bottom' | 'top' | 'right' | 'left',
    base: number,
    lo: number,
    hi: number,
  ) => {
    const horiz = side === 'bottom' || side === 'top';
    const sign = side === 'bottom' || side === 'right' ? 1 : -1;
    let at = base;
    for (const d of plate.dimensions) {
      if (d.kind === 'redline') continue;
      const dh = Math.abs(d.line[0][1] - d.line[1][1]) < 0.01;
      if (dh !== horiz) continue;
      const k = horiz ? 1 : 0;
      const along = horiz ? 0 : 1;
      const c = d.line[0][k];
      const s0 = Math.min(d.line[0][along], d.line[1][along]);
      const s1 = Math.max(d.line[0][along], d.line[1][along]);
      if (s1 < lo || s0 > hi) continue;
      if (sign * (c - base) > -tier) at = sign > 0 ? Math.max(at, c + gap) : Math.min(at, c - gap);
    }
    return at;
  };
  for (const side of o.sides ?? ['bottom', 'right']) {
    const did = `${id}-${side}`;
    if (side === 'bottom' || side === 'top') {
      const a = ex.left;
      const b = ex.right;
      const y = beyond(
        side,
        side === 'bottom' ? far.bottom[1] + tier : far.top[1] - tier,
        a[0],
        b[0],
      );
      const offset = side === 'bottom' ? y - Math.max(a[1], b[1]) : y - Math.min(a[1], b[1]);
      dimension(plate, a, b, {
        axis: 'x',
        offset,
        id: did,
        digits: o.digits,
        role: o.role,
        kind: 'overall',
        unit: o.unit,
        perMm: o.perMm,
      });
    } else {
      const a = ex.top;
      const b = ex.bottom;
      const x = beyond(
        side,
        side === 'right' ? far.right[0] + tier : far.left[0] - tier,
        a[1],
        b[1],
      );
      const offset = side === 'right' ? x - Math.max(a[0], b[0]) : x - Math.min(a[0], b[0]);
      dimension(plate, a, b, {
        axis: 'y',
        offset,
        id: did,
        digits: o.digits,
        role: o.role,
        kind: 'overall',
        unit: o.unit,
        perMm: o.perMm,
      });
    }
    out.push(did);
  }
  return { id, dims: out, extremes: ex };
}

/** Consecutive dimensions along one line, and the overall one tier further out. */
export function chainDims(
  plate: Plate,
  points: readonly Vec[],
  o: {
    axis: 'x' | 'y';
    offset: number;
    overall?: boolean;
    id?: string;
    digits?: number;
    role?: Role;
    unit?: string;
  },
) {
  const id = o.id ?? plate.nextId('chain');
  const k = o.axis === 'x' ? 0 : 1;
  const pts = points.slice().sort((p, q) => p[k] - q[k]);
  const across = o.axis === 'x' ? 1 : 0;
  const base =
    o.offset > 0
      ? Math.max(...pts.map((p) => p[across])) + o.offset
      : Math.min(...pts.map((p) => p[across])) + o.offset;
  const ids: string[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i] as Vec;
    const b = pts[i + 1] as Vec;
    const off =
      o.offset > 0 ? base - Math.max(a[across], b[across]) : base - Math.min(a[across], b[across]);
    const did = `${id}-${i + 1}`;
    dimension(plate, a, b, {
      axis: o.axis,
      offset: off,
      id: did,
      digits: o.digits,
      role: o.role,
      kind: 'chain',
      unit: o.unit,
    });
    ids.push(did);
  }
  if (o.overall !== false && pts.length > 2) {
    const a = pts[0] as Vec;
    const b = pts[pts.length - 1] as Vec;
    const tierBase = base + Math.sign(o.offset || 1) * 8;
    const off =
      o.offset > 0
        ? tierBase - Math.max(a[across], b[across])
        : tierBase - Math.min(a[across], b[across]);
    dimension(plate, a, b, {
      axis: o.axis,
      offset: off,
      id: `${id}-overall`,
      digits: o.digits,
      role: o.role,
      kind: 'overall',
      unit: o.unit,
    });
    ids.push(`${id}-overall`);
  }
  return { id, dims: ids };
}

/** Signed sweep from angle a0 to a1, the short way round. */
const shortSweep = (a0: number, a1: number) => {
  let d = a1 - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** An angular dimension between the rays vertex→a and vertex→b. */
export function angleDim(
  plate: Plate,
  vertex: Vec,
  a: Vec,
  b: Vec,
  o: { r?: number; digits?: number; id?: string; role?: Role; cap?: number } = {},
) {
  const id = o.id ?? plate.nextId('angle');
  const role = o.role ?? 'dimension';
  const exact = isOverlay(plate, role);
  const a0 = Math.atan2(a[1] - vertex[1], a[0] - vertex[0]);
  const a1 = Math.atan2(b[1] - vertex[1], b[0] - vertex[0]);
  const sw = shortSweep(a0, a1);
  const r = o.r ?? 14;
  const pts = arcPath(vertex, r, a0, a0 + sw, 0.25);
  const marks = plate.stroke(pts, {
    role,
    guide: exact ? 'exact' : 'compass',
    id: `${id}-arc`,
    group: id,
    pressure: 0.45,
    start: 'touch',
    end: 'lift',
  });
  const s = Math.sign(sw) || 1;
  const t0: Vec = [-Math.sin(a0) * -s, Math.cos(a0) * -s];
  const t1: Vec = [-Math.sin(a0 + sw) * s, Math.cos(a0 + sw) * s];
  marks.push(arrowhead(plate, pts[0] as MVec, t0, { role, len: 2, id: `${id}-h0` }));
  marks.push(arrowhead(plate, pts[pts.length - 1] as MVec, t1, { role, len: 2, id: `${id}-h1` }));
  const deg = Math.abs(sw) / DEG;
  const text = `${formatValue(deg, o.digits ?? 0)}°`;
  const am = a0 + sw / 2;
  const cap = o.cap ?? 2.5;
  const lp: Vec = [
    vertex[0] + Math.cos(am) * (r + cap * 1.1),
    vertex[1] + Math.sin(am) * (r + cap * 1.1) + cap / 2,
  ];
  const t = letter(plate, text, lp, {
    cap,
    anchor: 'middle',
    kind: 'dimension',
    exact,
    role: exact ? 'overlay' : 'letter',
    ink: valueInk(plate, role),
    layer: plate.kit(role).layer,
    id: `${id}-value`,
  });
  marks.push(...t.marks);
  plate.angles.push({
    id,
    vertex: [vertex[0], vertex[1]],
    a: [a[0], a[1]],
    b: [b[0], b[1]],
    degrees: deg,
    text,
    textId: t.id,
  });
  return { id, marks, degrees: deg };
}

/** A path of motion or a turn: an arc from a0 to a1 (radians, screen), with arrowheads. */
export function sweep(
  plate: Plate,
  c: Vec,
  r: number,
  a0: number,
  a1: number,
  o: {
    arrow?: 'end' | 'both' | 'none';
    label?: string;
    cap?: number;
    line?: LineType;
    role?: Role;
    id?: string;
    pressure?: number;
    part?: string;
  } = {},
) {
  const id = o.id ?? plate.nextId('sweep');
  const role = o.role ?? 'contour';
  const pts = arcPath(c, r, a0, a1, 0.3);
  const marks = plate.stroke(pts, {
    role,
    id: `${id}-arc`,
    group: id,
    line: o.line,
    pressure: o.pressure ?? 0.5,
    start: 'touch',
    end: 'lift',
    part: o.part,
  });
  const s = Math.sign(a1 - a0) || 1;
  const tan = (a: number, k: number): Vec => [-Math.sin(a) * k, Math.cos(a) * k];
  if (o.arrow !== 'none')
    marks.push(
      arrowhead(plate, pts[pts.length - 1] as MVec, tan(a1, s), {
        role,
        len: 2.6,
        id: `${id}-head`,
        part: o.part,
      }),
    );
  if (o.arrow === 'both')
    marks.push(
      arrowhead(plate, pts[0] as MVec, tan(a0, -s), {
        role,
        len: 2.6,
        id: `${id}-tail`,
        part: o.part,
      }),
    );
  if (o.label) {
    // named outside the arc, at the middle of its sweep
    const am = (a0 + a1) / 2;
    const cap = o.cap ?? 2.5;
    const on: Vec = [c[0] + Math.cos(am) * r, c[1] + Math.sin(am) * r];
    const lp: Vec = [
      c[0] + Math.cos(am) * (r + cap * 1.3),
      c[1] + Math.sin(am) * (r + cap * 1.3) + cap / 2,
    ];
    marks.push(
      ...letter(plate, o.label, lp, {
        cap,
        anchor: 'middle',
        kind: 'key',
        id: `${id}-label`,
        refers: on,
        ink: valueInk(plate, role),
      }).marks,
    );
  }
  return { id, marks, path: pts };
}

/**
 * A circle's centre lines: two thin chain lines crossing at its centre and running `over`
 * past its edge (ISO 128: centre lines are thin chain lines; they cross on dashes, and a
 * circle too small for the pattern takes a continuous thin line). On an exact overlay they
 * are ruled exact; under the hand, along a ruler.
 */
export function centreLines(
  plate: Plate,
  c: Vec,
  r: number,
  o: { over?: number; role?: Role; id?: string; part?: string; pressure?: number } = {},
) {
  const id = o.id ?? plate.nextId('centre');
  const role = o.role ?? 'dimension';
  const guide = isOverlay(plate, role) ? 'exact' : 'ruler';
  const e = r + (o.over ?? 3);
  const opts = {
    role,
    guide,
    line: 'chain',
    centred: true,
    pressure: o.pressure ?? 0.4,
    part: o.part,
  } as const;
  const marks = [
    ...plate.stroke(
      [
        [c[0] - e, c[1]],
        [c[0] + e, c[1]],
      ],
      { ...opts, id: `${id}-x`, group: `${id}-x` },
    ),
    ...plate.stroke(
      [
        [c[0], c[1] - e],
        [c[0], c[1] + e],
      ],
      { ...opts, id: `${id}-y`, group: `${id}-y` },
    ),
  ];
  return { id, marks };
}

/** A UI box (rounded if `radius`), drawn by the hand or exact. */
export function frame(
  plate: Plate,
  rect: Rect,
  o: {
    radius?: number;
    role?: Role;
    id?: string;
    part?: string;
    exact?: boolean;
    pressure?: number;
  } = {},
) {
  const [x0, y0, x1, y1] = rect;
  const r = Math.min(o.radius ?? 0, (x1 - x0) / 2, (y1 - y0) / 2);
  const pts: MVec[] = [];
  const corner = (cx: number, cy: number, from: number) => {
    if (r <= 0.01) {
      pts.push([cx + Math.cos(from + Math.PI / 4) * 0, cy]);
      return;
    }
    pts.push(...arcPath([cx, cy], r, from, from + Math.PI / 2, 0.2));
  };
  if (r > 0.01) {
    corner(x1 - r, y0 + r, -Math.PI / 2);
    corner(x1 - r, y1 - r, 0);
    corner(x0 + r, y1 - r, Math.PI / 2);
    corner(x0 + r, y0 + r, Math.PI);
    pts.push(pts[0] as MVec);
  } else pts.push([x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]);
  return plate.stroke(pts, {
    role: o.role ?? 'contour',
    guide: o.exact ? 'exact' : 'ruler',
    id: o.id,
    part: o.part,
    anchored: true,
    pressure: o.pressure ?? 0.5,
  });
}

/**
 * A redline: the gap between two boxes, measured edge to edge where they face each other,
 * as a design review shows it (value in the plate's unit, or `px` with `perMm`).
 */
export function redline(
  plate: Plate,
  a: Rect,
  b: Rect,
  o: { id?: string; unit?: string; perMm?: number; digits?: number; role?: Role } = {},
) {
  const id = o.id ?? plate.nextId('redline');
  let p: Vec;
  let q: Vec;
  let axis: 'x' | 'y';
  const ovY: [number, number] = [Math.max(a[1], b[1]), Math.min(a[3], b[3])];
  const ovX: [number, number] = [Math.max(a[0], b[0]), Math.min(a[2], b[2])];
  if (a[2] <= b[0] || b[2] <= a[0]) {
    const ym = ovY[1] > ovY[0] ? (ovY[0] + ovY[1]) / 2 : (a[1] + a[3]) / 2;
    const left = a[2] <= b[0] ? a : b;
    const right = left === a ? b : a;
    p = [left[2], ym];
    q = [right[0], ym];
    axis = 'x';
  } else {
    const xm = ovX[1] > ovX[0] ? (ovX[0] + ovX[1]) / 2 : (a[0] + a[2]) / 2;
    const top = a[3] <= b[1] ? a : b;
    const bot = top === a ? b : a;
    p = [xm, top[3]];
    q = [xm, bot[1]];
    axis = 'y';
  }
  dimension(plate, p, q, {
    axis,
    offset: 0.0001,
    id,
    digits: o.digits ?? 0,
    unit: o.unit,
    perMm: o.perMm,
    role: o.role ?? 'overlay',
    terminator: 'tick',
    gap: 0,
    over: 0.0001,
    kind: 'redline',
  });
  return { id };
}

/**
 * The four gaps between a box and its content (a designer's padding redlines). Each gap is
 * measured to the content that is there: the topmost element for the top, the rightmost for
 * the right, and so on, at the middle of that element's edge, so both ends land on ink.
 */
export function padding(
  plate: Plate,
  outer: Rect,
  content: Rect | readonly Rect[],
  o: { id?: string; unit?: string; perMm?: number; role?: Role } = {},
) {
  const id = o.id ?? plate.nextId('padding');
  const els: readonly Rect[] =
    typeof content[0] === 'number' ? [content as Rect] : (content as readonly Rect[]);
  const pick = (score: (r: Rect) => number) =>
    els.reduce((b, r) => (score(r) < score(b) ? r : b), els[0] as Rect);
  const top = pick((r) => r[1]);
  const right = pick((r) => -r[2]);
  const bottom = pick((r) => -r[3]);
  const left = pick((r) => r[0]);
  const mid = (a: number, b: number) => (a + b) / 2;
  const at = (x: number, y0: number, y1: number): Rect => [x - 0.01, y0, x + 0.01, y1];
  const atY = (y: number, x0: number, x1: number): Rect => [x0, y - 0.01, x1, y + 0.01];
  redline(
    plate,
    [outer[0], outer[1], outer[2], outer[1]],
    at(mid(top[0], top[2]), top[1], top[3]),
    { ...o, id: `${id}-top` },
  );
  redline(
    plate,
    atY(mid(right[1], right[3]), right[0], right[2]),
    [outer[2], outer[1], outer[2], outer[3]],
    { ...o, id: `${id}-right` },
  );
  redline(
    plate,
    at(mid(bottom[0], bottom[2]), bottom[1], bottom[3]),
    [outer[0], outer[3], outer[2], outer[3]],
    { ...o, id: `${id}-bottom` },
  );
  redline(
    plate,
    [outer[0], outer[1], outer[0], outer[3]],
    atY(mid(left[1], left[3]), left[0], left[2]),
    { ...o, id: `${id}-left` },
  );
  return { id };
}

/** Sheet distance of `v` value units at the plate's scale. */
export const toSheet = (plate: Plate, v: number) => v / plate.scale.perMm;
