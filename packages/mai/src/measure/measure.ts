/**
 * Measure — construction and dimension, the lines that hold a drawing up.
 *
 *   ruled      a straight-edge line that crosses its corners (construction runs past)
 *   compass    an arc with its centre pricked; a full circle never quite closes
 *   point      a constructed point: dot, cross, ring or prick, with its number
 *   dimension  extension lines, a dimension line, terminators, and a value computed from
 *              the geometry at the plate's scale — a label cannot disagree with the ink
 *   scaleBar   alternate filled segments with ticks and numbers (research 03 R14: 3–5 ticks)
 *   leader     a label's line to its part: one angled run and a shoulder, a dot inside a
 *              body, an arrow on an edge, nothing on a line (research 03 §2.3, R4–5)
 *
 * Numbers (research 03 §2.2, ASME as cited there): extension line gap from the object
 * ≈ 1.5 mm, overshoot past the dimension line 2.5–3 mm, first dimension line 10–12 mm out,
 * further tiers 6–10 mm apart, arrowhead length:width ≈ 3:1. Every construction records
 * what it generated; one that generated nothing is ornament, and the critic fails it.
 */
import { contrast } from '../core/color.ts';
import { arc as arcPath, line } from '../core/path.ts';
import { f2, polygonD } from '../core/svg.ts';
import { add, DEG, type MVec, norm, perp, scale, sub, type Vec } from '../core/vec.ts';
import type { Role } from '../hand/hand.ts';
import { INKS, type InkId } from '../ink/inks.ts';
import type { MarkPart } from '../ink/render.ts';
import { letter, measureText } from '../letter/letter.ts';
import type { Mark, Plate } from '../plate/plate.ts';

export interface Built {
  id: string;
  marks: Mark[];
}

/** The inks of the modern line: rubric by day, Dawn Departs on the night sheet. */
const MODERN_INKS: ReadonlySet<string> = new Set(['rubric', 'departs']);

/**
 * Is this role’s kit the exact overlay — the ruling pen on the overlay layer, in a modern ink —
 * which never wobbles? One rule for every measure (MA-31). It used to be two: `outer.ts` asked
 * only for overlay + ruling, `measure.ts` also for rubric, so on the night sheet the neatlines
 * were exact while the dimensions beside them were ruled by hand with ticks. Historic styles
 * (architect’s sepia, engraver’s carbon) keep a hand-ruled overlay throughout.
 */
export function isOverlay(plate: Plate, role: Role) {
  const k = plate.kit(role);
  return k.layer === 'overlay' && k.instrument === 'ruling' && MODERN_INKS.has(k.ink);
}

export function ruled(
  plate: Plate,
  a: Vec,
  b: Vec,
  o: {
    id?: string;
    overshoot?: readonly [number, number];
    role?: Role;
    generates?: string[];
    kind?: 'line' | 'axis';
    label?: string;
    pressure?: number;
  } = {},
): Built {
  const id = o.id ?? plate.nextId('ruled');
  const rng = plate.rng.fork(`ruled:${id}`);
  const [lo, hi] = o.overshoot ?? [1.5, 4];
  const marks = plate.stroke(line(a, b, 0.5), {
    role: o.role ?? 'construction',
    guide: 'ruler',
    overshoot: [rng.range(lo, hi), rng.range(lo, hi)],
    start: 'touch',
    end: 'lift',
    group: id,
    pressure: o.pressure,
    id,
  });
  plate.addConstruction({
    id,
    kind: o.kind ?? 'line',
    path: [
      [a[0], a[1]],
      [b[0], b[1]],
    ],
    generates: o.generates ?? [],
    label: o.label,
  });
  return { id, marks };
}

/** A pricked centre: a dark pin-hole with the paper raised round it. */
export function prick(plate: Plate, c: Vec, id: string): Mark {
  const rng = plate.rng.fork(`prick:${id}`);
  const r = rng.range(0.06, 0.09);
  const ring: MVec[] = [];
  const hole: MVec[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ring.push([c[0] + Math.cos(a) * r * 2.3, c[1] + Math.sin(a) * r * 2.3]);
    hole.push([
      c[0] + Math.cos(a) * r * (0.9 + 0.2 * rng.next()),
      c[1] + Math.sin(a) * r * (0.9 + 0.2 * rng.next()),
    ]);
  }
  const parts: MarkPart[] = [
    { kind: 'emboss-light', d: polygonD(ring), density: 0.35, color: [1, 1, 1], normal: true },
    { kind: 'body', d: polygonD(hole), density: 0.7, color: [0.22, 0.18, 0.15] },
  ];
  return plate.addShape({
    role: 'construction',
    parts,
    spine: [[c[0], c[1]]],
    group: id,
    id: `${id}-prick`,
  });
}

export function compass(
  plate: Plate,
  c: Vec,
  r: number,
  o: {
    id?: string;
    a0?: number;
    a1?: number;
    prick?: boolean;
    role?: Role;
    generates?: string[];
    label?: string;
    pressure?: number;
  } = {},
): Built {
  const id = o.id ?? plate.nextId('compass');
  const rng = plate.rng.fork(`compass:${id}`);
  const full = o.a0 === undefined || o.a1 === undefined;
  const a0 = o.a0 ?? rng.range(0, Math.PI * 2);
  let a1 = o.a1 ?? a0 + Math.PI * 2;
  let path: MVec[];
  if (full) {
    // the leg slips a hair and the hand stops a little past or a little short of the start
    a1 += rng.range(-1.2, 2.6) / r;
    const slip = rng.normal() * 0.12;
    path = arcPath(c, r, a0, a1, 0.35).map((p, i, all) => {
      const u = i / (all.length - 1);
      const k = Math.max(0, (u - 0.72) / 0.28);
      const rr = r + slip * k * k;
      const ang = Math.atan2(p[1] - c[1], p[0] - c[0]);
      return [c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr] as MVec;
    });
  } else path = arcPath(c, r, a0, a1, 0.35);
  const marks = plate.stroke(path, {
    role: o.role ?? 'construction',
    guide: 'compass',
    start: 'touch',
    end: 'lift',
    group: id,
    pressure: o.pressure,
    id,
  });
  if (o.prick !== false) marks.push(prick(plate, c, id));
  plate.addConstruction({
    id,
    kind: full ? 'circle' : 'arc',
    path: arcPath(c, r, o.a0 ?? 0, o.a1 ?? Math.PI * 2, 1),
    generates: o.generates ?? [],
    label: o.label,
  });
  return { id, marks };
}

export function point(
  plate: Plate,
  p: Vec,
  o: {
    id?: string;
    label?: string;
    style?: 'dot' | 'cross' | 'ring' | 'prick';
    cap?: number;
    offset?: Vec;
    generates?: string[];
    role?: Role;
  } = {},
): Built {
  const id = o.id ?? plate.nextId('point');
  const style = o.style ?? 'cross';
  const marks: Mark[] = [];
  const role = o.role ?? 'construction';
  if (style === 'cross') {
    const s = 0.9;
    marks.push(
      ...plate.stroke(line([p[0] - s, p[1] - s], [p[0] + s, p[1] + s], 0.2), {
        role,
        guide: 'ruler',
        group: id,
        start: 'touch',
        end: 'lift',
      }),
    );
    marks.push(
      ...plate.stroke(line([p[0] + s, p[1] - s], [p[0] - s, p[1] + s], 0.2), {
        role,
        guide: 'ruler',
        group: id,
        start: 'touch',
        end: 'lift',
      }),
    );
  } else if (style === 'ring') {
    marks.push(
      ...plate.stroke(arcPath(p, 0.6, 0, Math.PI * 2.1, 0.12), {
        role,
        guide: 'compass',
        group: id,
        start: 'touch',
        end: 'lift',
      }),
    );
  } else if (style === 'prick') {
    marks.push(prick(plate, p, id));
  } else {
    marks.push(
      ...plate.stroke(
        [
          [p[0], p[1]],
          [p[0] + 0.08, p[1] + 0.05],
        ],
        { role: 'stipple', end: 'stop', group: id, pressure: 0.7 },
      ),
    );
  }
  if (o.label) {
    const off = o.offset ?? [1.2, -1.2];
    const t = letter(plate, o.label, add(p, off), {
      cap: o.cap ?? 2.5,
      kind: 'numeral',
      refers: p,
      id: `${id}-label`,
    });
    marks.push(...t.marks);
  }
  plate.addConstruction({
    id,
    kind: 'point',
    path: [[p[0], p[1]]],
    generates: o.generates ?? [],
    label: o.label,
  });
  return { id, marks };
}

/** Format a measured value: fixed digits, no trailing zeros past what was asked. */
export function formatValue(v: number, digits = 1): string {
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return r
    .toFixed(digits)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1');
}

export interface DimensionOptions {
  id?: string;
  /** Distance of the dimension line from the measured edge, mm, signed (+ = left of a→b). */
  offset: number;
  /** Override the value text (it must still agree with the geometry, or the critic fails it). */
  text?: string;
  unit?: string;
  digits?: number;
  terminator?: 'arrow' | 'tick' | 'dot';
  role?: Role;
  cap?: number;
  gap?: number;
  over?: number;
  /** Measure along one axis only (a vertical or horizontal dimension of two points). */
  axis?: 'x' | 'y';
  /** Value per sheet mm for this dimension (an enlargement has its own scale). */
  perMm?: number;
  /** detail (default) · overall (outer extent) · chain (a link) · redline (a gap between boxes). */
  kind?: 'detail' | 'overall' | 'chain' | 'redline';
}

/**
 * The ink a value is lettered in. A line is seen; a value is read, in strokes a quarter of a
 * millimetre wide that lose a fifth to two fifths of their contrast on real pixels.
 *   1. An ink that is for strokes only names its type twin (`typeInk`): the rubric line
 *      (#B5462B) letters its values in the rubric for type (#983A22), as the tokens say.
 *   2. Otherwise a value takes its role's ink when that ink clears 7:1 against the paper.
 *   3. Otherwise the lettering ink.
 * (The measure specimen read 2.9:1 with values in the line red on Dawn Departs; KC-8.)
 */
export function valueInk(plate: Plate, role: Role): InkId {
  const ink = plate.kit(role).ink;
  const twin = INKS[ink].typeInk;
  if (twin) return twin;
  return contrast(INKS[ink].color, plate.paper.spec.tone) >= 7 ? ink : plate.kit('letter').ink;
}

export function dimension(plate: Plate, a: Vec, b: Vec, o: DimensionOptions): Built {
  const id = o.id ?? plate.nextId('dim');
  const rng = plate.rng.fork(`dim:${id}`);
  const role = o.role ?? 'dimension';
  const exact = isOverlay(plate, role);
  const guide = exact ? 'exact' : 'ruler';
  const gap = o.gap ?? 1.5;
  const over = o.over ?? 2.6;
  // aligned: along a→b; projected: the dimension line runs along one axis, set off from
  // the outermost of the two features
  let u: Vec = norm(sub(b, a));
  let a1: Vec;
  let b1: Vec;
  if (o.axis === 'y') {
    u = [0, Math.sign(b[1] - a[1]) || 1];
    const x = o.offset > 0 ? Math.max(a[0], b[0]) + o.offset : Math.min(a[0], b[0]) + o.offset;
    a1 = [x, a[1]];
    b1 = [x, b[1]];
  } else if (o.axis === 'x') {
    u = [Math.sign(b[0] - a[0]) || 1, 0];
    const y = o.offset > 0 ? Math.max(a[1], b[1]) + o.offset : Math.min(a[1], b[1]) + o.offset;
    a1 = [a[0], y];
    b1 = [b[0], y];
  } else {
    const nn = perp(u);
    a1 = add(a, scale(nn, o.offset));
    b1 = add(b, scale(nn, o.offset));
  }
  const n: Vec = perp(u);
  const marks: Mark[] = [];
  // extension lines run from the feature (a gap off the ink) to just past the dimension line
  const ex = (p: Vec, q: Vec): [Vec, Vec] => {
    const d = sub(q, p);
    const l = Math.hypot(d[0], d[1]) || 1;
    const e: Vec = [d[0] / l, d[1] / l];
    return [add(p, scale(e, gap)), add(q, scale(e, over))];
  };
  const eA = ex(a, a1);
  const eB = ex(b, b1);
  // a dimension laid on the edges themselves (a redline) has no extension lines
  for (const [p, q] of Math.hypot(eA[1][0] - eA[0][0], eA[1][1] - eA[0][1]) > 0.6 ? [eA, eB] : [])
    marks.push(
      ...plate.stroke(line(p, q, 0.3), {
        role,
        guide,
        start: 'touch',
        end: 'lift',
        group: id,
        pressure: 0.45,
      }),
    );
  marks.push(
    ...plate.stroke(line(a1, b1, 0.3), {
      role,
      guide,
      start: 'touch',
      end: 'lift',
      group: id,
      pressure: 0.45,
    }),
  );

  // terminators
  const term = o.terminator ?? (exact ? 'arrow' : 'tick');
  const kit = plate.kit(role);
  const tip = (p: Vec, dir: Vec) => {
    if (term === 'arrow') {
      const L = 2.4 * (exact ? 1 : rng.range(0.9, 1.1));
      const W = L / 3;
      const back = add(p, scale(dir, -L));
      const skew = exact ? 0 : rng.normal() * 0.06;
      const tri: MVec[] = [
        [p[0], p[1]],
        add(back, scale(n, W / 2 + skew)),
        add(back, scale(n, -W / 2 + skew)),
      ];
      marks.push(
        plate.addShape({
          role,
          parts: [{ kind: 'body', d: polygonD(tri), density: 0.92 }],
          spine: [[p[0], p[1]]],
          group: id,
          ink: kit.ink,
          layer: kit.layer,
        }),
      );
    } else if (term === 'tick') {
      const d = add(scale(u, Math.SQRT1_2), scale(n, Math.SQRT1_2));
      marks.push(
        ...plate.stroke(line(add(p, scale(d, -1.3)), add(p, scale(d, 1.3)), 0.2), {
          role,
          guide,
          start: 'touch',
          end: 'lift',
          group: id,
          pressure: 0.6,
        }),
      );
    } else {
      const r = 0.32;
      const dot: MVec[] = [];
      for (let i = 0; i < 12; i++)
        dot.push([
          p[0] + Math.cos((i / 12) * Math.PI * 2) * r,
          p[1] + Math.sin((i / 12) * Math.PI * 2) * r,
        ]);
      marks.push(
        plate.addShape({
          role,
          parts: [{ kind: 'body', d: polygonD(dot), density: 0.92 }],
          spine: [[p[0], p[1]]],
          group: id,
          ink: kit.ink,
          layer: kit.layer,
        }),
      );
    }
  };
  tip(a1, scale(u, -1));
  tip(b1, u);

  // the value: measured, never typed
  const sc = plate.scale;
  const sheet =
    o.axis === 'y'
      ? Math.abs(b[1] - a[1])
      : o.axis === 'x'
        ? Math.abs(b[0] - a[0])
        : Math.hypot(b[0] - a[0], b[1] - a[1]);
  const value = sheet * (o.perMm ?? sc.perMm);
  const unit = o.unit ?? sc.unit;
  const text =
    o.text ??
    `${formatValue(value, o.digits ?? sc.digits ?? 1)}${unit && unit !== 'none' ? ` ${unit}` : ''}`;
  let ang = Math.atan2(u[1], u[0]) / DEG;
  if (ang > 90) ang -= 180;
  if (ang <= -90) ang += 180;
  const cap = o.cap ?? 2.5;
  const mid: Vec = [(a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2];
  const tw = measureText(text, cap);
  let at: Vec;
  let rot = ang;
  let anchor: 'middle' | 'start' = 'middle';
  if (o.kind === 'redline') {
    // a design redline reads level: the value sits beside the line, never turned with it
    rot = 0;
    const vertical = Math.abs(u[1]) > Math.abs(u[0]);
    at = vertical ? [mid[0] + 1.2, mid[1] + cap / 2] : [mid[0], mid[1] - 1.1];
    anchor = vertical ? 'start' : 'middle';
  } else {
    // above the line as read: the text's "up" is −y rotated with the line
    const up: Vec = [Math.sin(ang * DEG), -Math.cos(ang * DEG)];
    at = add(mid, scale(up, 1.1));
    // a value wider than its span is set outside, past the far end (drafting practice)
    if (tw > sheet - 1.2) {
      const along: Vec = [Math.cos(ang * DEG), Math.sin(ang * DEG)];
      const far = Math.max(
        (a1[0] - mid[0]) * along[0] + (a1[1] - mid[1]) * along[1],
        (b1[0] - mid[0]) * along[0] + (b1[1] - mid[1]) * along[1],
      );
      at = add(at, scale(along, far + tw / 2 + 2.2));
    }
  }
  const t = letter(plate, text, at, {
    cap,
    anchor,
    kind: 'dimension',
    rotate: rot,
    role: exact ? 'overlay' : 'letter',
    exact,
    id: `${id}-value`,
    ink: valueInk(plate, role),
    layer: kit.layer,
  });
  marks.push(...t.marks);
  plate.dimensions.push({
    id,
    a: [a[0], a[1]],
    b: [b[0], b[1]],
    sheet,
    value,
    unit,
    text,
    line: [a1, b1],
    ext: [eA, eB],
    feature: [
      [a[0], a[1]],
      [b[0], b[1]],
    ],
    textId: t.id,
    kind: o.kind ?? 'detail',
  });
  return { id, marks };
}

export function scaleBar(
  plate: Plate,
  origin: Vec,
  o: {
    units: number;
    segments?: number;
    height?: number;
    id?: string;
    label?: string;
    cap?: number;
    role?: Role;
  },
): Built {
  const id = o.id ?? plate.nextId('scale');
  const role = o.role ?? 'dimension';
  const kit = plate.kit(role);
  const exact = isOverlay(plate, role);
  const segs = o.segments ?? 4;
  const sheetLen = o.units / plate.scale.perMm;
  const h = o.height ?? 1.4;
  const w = sheetLen / segs;
  const marks: Mark[] = [];
  const parts: MarkPart[] = [];
  for (let i = 0; i < segs; i += 2) {
    const x = origin[0] + i * w;
    parts.push({
      kind: 'body',
      d: polygonD([
        [x, origin[1]],
        [x + w, origin[1]],
        [x + w, origin[1] + h],
        [x, origin[1] + h],
      ]),
      density: 0.85,
    });
  }
  marks.push(
    plate.addShape({
      role,
      parts,
      group: id,
      ink: kit.ink,
      layer: kit.layer,
      spine: [
        [origin[0], origin[1]],
        [origin[0] + sheetLen, origin[1]],
      ],
    }),
  );
  const guide = exact ? 'exact' : 'ruler';
  marks.push(
    ...plate.stroke(line(origin, [origin[0] + sheetLen, origin[1]], 0.4), {
      role,
      guide,
      group: id,
      start: 'touch',
      end: 'lift',
      pressure: 0.4,
    }),
  );
  marks.push(
    ...plate.stroke(line([origin[0], origin[1] + h], [origin[0] + sheetLen, origin[1] + h], 0.4), {
      role,
      guide,
      group: id,
      start: 'touch',
      end: 'lift',
      pressure: 0.4,
    }),
  );
  const cap = o.cap ?? 1.8;
  for (let i = 0; i <= segs; i++) {
    const x = origin[0] + i * w;
    marks.push(
      ...plate.stroke(line([x, origin[1] - 0.6], [x, origin[1] + h], 0.2), {
        role,
        guide,
        group: id,
        start: 'touch',
        end: 'lift',
        pressure: 0.45,
      }),
    );
    const v = formatValue((o.units * i) / segs, 2);
    marks.push(
      ...letter(plate, v, [x, origin[1] + h + cap + 1], {
        cap,
        anchor: 'middle',
        kind: 'scale',
        exact,
        role: exact ? 'overlay' : 'letter',
        ink: valueInk(plate, role),
        layer: kit.layer,
        id: `${id}-n${i}`,
      }).marks,
    );
  }
  const lab = o.label ?? plate.scale.unit;
  if (lab)
    marks.push(
      ...letter(plate, lab, [origin[0] + sheetLen + 2, origin[1] + h], {
        cap,
        kind: 'scale',
        exact,
        role: exact ? 'overlay' : 'letter',
        ink: valueInk(plate, role),
        layer: kit.layer,
        id: `${id}-unit`,
      }).marks,
    );
  plate.fact(
    `scale:${id}`,
    `${f2(sheetLen)} mm on the sheet = ${o.units} ${plate.scale.unit}`,
    'plate.scale',
  );
  return { id, marks };
}

export function leader(
  plate: Plate,
  from: Vec,
  to: Vec,
  o: { id?: string; terminator?: 'dot' | 'arrow' | 'none'; shoulder?: number; role?: Role } = {},
): Built {
  const id = o.id ?? plate.nextId('leader');
  const role = o.role ?? 'leader';
  const kit = plate.kit(role);
  const exact = isOverlay(plate, role);
  const sh = o.shoulder ?? 3.5;
  const dir = Math.sign(to[0] - from[0]) || 1;
  const elbow: Vec = [from[0] + dir * sh, from[1]];
  const marks = plate.stroke([...line(from, elbow, 0.3), ...line(elbow, to, 0.3).slice(1)], {
    role,
    guide: exact ? 'exact' : 'free',
    precision: 0.8,
    start: 'touch',
    end: 'lift',
    group: id,
    pressure: 0.4,
  });
  const term = o.terminator ?? 'dot';
  if (term === 'dot') {
    const r = 0.3;
    const dot: MVec[] = [];
    for (let i = 0; i < 12; i++)
      dot.push([
        to[0] + Math.cos((i / 12) * Math.PI * 2) * r,
        to[1] + Math.sin((i / 12) * Math.PI * 2) * r,
      ]);
    marks.push(
      plate.addShape({
        role,
        parts: [{ kind: 'body', d: polygonD(dot), density: 0.9 }],
        spine: [[to[0], to[1]]],
        group: id,
        ink: kit.ink,
        layer: kit.layer,
      }),
    );
  } else if (term === 'arrow') {
    const u = norm(sub(to, elbow));
    const n = perp(u);
    const L = 2.2;
    const back = add(to, scale(u, -L));
    marks.push(
      plate.addShape({
        role,
        parts: [
          {
            kind: 'body',
            d: polygonD([[to[0], to[1]], add(back, scale(n, L / 6)), add(back, scale(n, -L / 6))]),
            density: 0.9,
          },
        ],
        spine: [[to[0], to[1]]],
        group: id,
        ink: kit.ink,
        layer: kit.layer,
      }),
    );
  }
  return { id, marks };
}
