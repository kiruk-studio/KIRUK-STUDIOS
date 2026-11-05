/**
 * Points and their labels — a figure full of named points (research 02 §4: keys sit in
 * clear space, never on hatching or lines; 02 R5) laid out the way a cartographer places
 * names: try the positions round the point in order of preference (upper right first,
 * then lower right, upper left, lower left, right, above, left, below), at three
 * distances, and keep the one with the least ink and no other label under it.
 */
import { circle } from '../core/path.ts';
import type { MVec, Vec } from '../core/vec.ts';
import type { Role } from '../hand/hand.ts';
import type { InkId } from '../ink/inks.ts';
import type { Mark, Plate } from '../plate/plate.ts';
import type { HersheyFont } from './hershey-data.ts';
import { type Lettered, letter, measureText } from './letter.ts';

export type PointStyle = 'dot' | 'ring' | 'ring-dot' | 'cross';

/** A constructed or named point: a dot, a small ring, a ringed dot, or a cross. */
export function pointMark(
  plate: Plate,
  p: Vec,
  o: {
    style?: PointStyle;
    size?: number;
    role?: Role;
    id?: string;
    part?: string;
    ink?: InkId;
  } = {},
): Mark[] {
  const style = o.style ?? 'ring-dot';
  const r = o.size ?? 0.75;
  const id = o.id ?? plate.nextId('pt');
  const role = o.role ?? 'contour';
  const marks: Mark[] = [];
  if (style === 'ring' || style === 'ring-dot')
    marks.push(
      ...plate.stroke(circle(p, r, -1, 0.1), {
        role,
        guide: 'compass',
        pressure: 0.42,
        id: `${id}-ring`,
        group: id,
        part: o.part,
        ink: o.ink,
        start: 'touch',
        end: 'lift',
      }),
    );
  if (style === 'dot' || style === 'ring-dot')
    marks.push(
      ...plate.stroke(
        [
          [p[0] - 0.06, p[1]],
          [p[0] + 0.06, p[1] + 0.04],
        ],
        {
          role: 'stipple',
          end: 'stop',
          start: 'dip',
          pressure: style === 'dot' ? 0.95 : 0.7,
          id: `${id}-dot`,
          group: id,
          part: o.part,
          ink: o.ink,
        },
      ),
    );
  if (style === 'cross') {
    const s = r;
    marks.push(
      ...plate.stroke(
        [
          [p[0] - s, p[1] - s],
          [p[0] + s, p[1] + s],
        ],
        {
          role,
          guide: 'ruler',
          pressure: 0.42,
          id: `${id}-x1`,
          group: id,
          part: o.part,
          ink: o.ink,
        },
      ),
    );
    marks.push(
      ...plate.stroke(
        [
          [p[0] + s, p[1] - s],
          [p[0] - s, p[1] + s],
        ],
        {
          role,
          guide: 'ruler',
          pressure: 0.42,
          id: `${id}-x2`,
          group: id,
          part: o.part,
          ink: o.ink,
        },
      ),
    );
  }
  return marks;
}

/** Ink laid inside a box (mm²), from the marks' spines and widths. */
export function inkIn(
  plate: Plate,
  box: readonly [number, number, number, number],
  exclude?: string,
): number {
  const [x0, y0, x1, y1] = box;
  let ink = 0;
  for (const m of plate.marks) {
    if (exclude && (m.group === exclude || m.id.startsWith(exclude))) continue;
    if (m.layer === 'stylus') continue;
    const sp = m.spine;
    for (let i = 1; i < sp.length; i++) {
      const a = sp[i - 1] as MVec;
      const b = sp[i] as MVec;
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      if (mx < x0 || mx > x1 || my < y0 || my > y1) continue;
      ink += Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.max(0.15, m.widths[i] ?? 0.2);
    }
    // a single-point mark (a dot, a prick) still occupies its place
    if (sp.length === 1) {
      const q = sp[0] as MVec;
      if (q[0] >= x0 && q[0] <= x1 && q[1] >= y0 && q[1] <= y1) ink += 0.3;
    }
  }
  return ink;
}

const PREFERENCE: readonly [number, number][] = [
  [1, -1],
  [1, 1],
  [-1, -1],
  [-1, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];

export interface PlaceOptions {
  cap?: number;
  font?: HersheyFont;
  kind?: 'key' | 'numeral' | 'note' | 'caption';
  id?: string;
  exact?: boolean;
  role?: Role;
  ink?: InkId;
  /** Extra clearance from the point, mm. */
  gap?: number;
}

/**
 * Place a label near a point where it sits on clear paper. Returns the lettering, and the
 * score of the place it chose (0 is perfectly clear).
 */
export function placeLabel(
  plate: Plate,
  text: string,
  anchor: Vec,
  o: PlaceOptions = {},
): Lettered & { score: number } {
  const cap = o.cap ?? 2.5;
  const w = measureText(text, cap, o.font ?? plate.style.letter.font);
  const h = cap;
  const [W, H] = plate.size;
  let best: { x: number; y: number; score: number } | null = null;
  const gaps = [0.5, 1.1, 1.9].map((g) => g * cap + (o.gap ?? 0));
  PREFERENCE.forEach(([dx, dy], rank) => {
    gaps.forEach((g, gi) => {
      // the label box's nearest edge sits g away from the point in direction (dx, dy)
      const x = dx > 0 ? anchor[0] + g : dx < 0 ? anchor[0] - g - w : anchor[0] - w / 2;
      const yTop = dy > 0 ? anchor[1] + g : dy < 0 ? anchor[1] - g - h : anchor[1] - h / 2;
      const box: [number, number, number, number] = [
        x - 0.3,
        yTop - 0.3,
        x + w + 0.3,
        yTop + h + 0.5,
      ];
      const area = (box[2] - box[0]) * (box[3] - box[1]);
      const ink = inkIn(plate, box) / area;
      let clash = 0;
      for (const t of plate.texts) {
        const ox = Math.max(0, Math.min(t.box[2], box[2]) - Math.max(t.box[0], box[0]));
        const oy = Math.max(0, Math.min(t.box[3], box[3]) - Math.max(t.box[1], box[1]));
        clash += ox * oy;
      }
      const off = box[0] < 0 || box[1] < 0 || box[2] > W || box[3] > H ? 100 : 0;
      const score = ink * 12 + clash * 4 + off + rank * 0.05 + gi * 0.12;
      if (!best || score < best.score) best = { x, y: yTop + h, score };
    });
  });
  const b = best as unknown as { x: number; y: number; score: number };
  const lettered = letter(plate, text, [b.x, b.y], {
    cap,
    font: o.font,
    kind: o.kind ?? 'key',
    refers: anchor,
    id: o.id,
    exact: o.exact,
    role: o.role,
    ink: o.ink,
  });
  return { ...lettered, score: b.score };
}
