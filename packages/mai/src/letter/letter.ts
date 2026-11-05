/**
 * Lettering — keys, numerals, dimension values and short notes, drawn by the same hand
 * with the same pen as the drawing (research 01 §1: one dark line carries contour,
 * hatching and lettering).
 *
 * Sizes follow ISO 3098 heights (research 03 §2.5): 1.8, 2.5, 3.5, 5, 7, 10 mm cap height;
 * notes and dimensions 2.5–3.5 mm; nothing printed under 2.5 mm, nothing on screen under
 * 11 px. Notes must stay readable and true (01 R9): script and mirror writing are named
 * fakes unless a readable twin carries the same words (the critic checks this).
 */
import { noise1 } from '../core/noise.ts';
import type { Rng } from '../core/rng.ts';
import { DEG, type MVec, type Vec } from '../core/vec.ts';
import type { Role } from '../hand/hand.ts';
import type { InkId } from '../ink/inks.ts';
import type { InstrumentId } from '../nib/instruments.ts';
import type { Mark, Plate, TextItem } from '../plate/plate.ts';
import type { LayerId } from '../styles/styles.ts';
import { HERSHEY, type HersheyFont } from './hershey-data.ts';

export const ISO_3098 = [1.8, 2.5, 3.5, 5, 7, 10, 14, 20] as const;

/** Units per cap height in the Hershey data (cap top 1 → baseline 22). */
const CAP_UNITS = 21;
const BASELINE = 22;

type Glyph = { strokes: MVec[][]; advance: number; missing?: boolean };
const cache = new Map<string, Glyph>();

function parseGlyph(d: string): MVec[][] {
  const out: MVec[][] = [];
  for (const part of d.split('M').filter(Boolean)) {
    const nums = part
      .replace('L', ' ')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const pts: MVec[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2)
      pts.push([nums[i] as number, nums[i + 1] as number]);
    if (pts.length >= 1)
      out.push(
        pts.length === 1 ? [pts[0] as MVec, [(pts[0] as MVec)[0] + 0.3, (pts[0] as MVec)[1]]] : pts,
      );
  }
  return out;
}

/** Ring points for the synthetic glyphs (Hershey units). */
const ring = (cx: number, cy: number, r: number, n = 14): MVec[] =>
  Array.from(
    { length: n + 1 },
    (_, i) =>
      [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)] as MVec,
  );

/**
 * Glyphs the Hershey subset lacks, drawn in the same units (cap top 1, baseline 22):
 * degree, prime, times, diameter, plus-minus, the middle dot, en and em dashes, the
 * apostrophe, an arrow and delta. Anything else outside ASCII is recorded as missing on
 * its text (`type.glyphs` fails it), never drawn as a silent blank.
 */
const EXTRA: Record<string, Glyph> = {
  '°': { strokes: [ring(5, 4.5, 2.6)], advance: 10 },
  '·': { strokes: [ring(5, 12, 0.9, 6)], advance: 10 },
  '–': {
    strokes: [
      [
        [2, 12],
        [14, 12],
      ],
    ],
    advance: 16,
  },
  '—': {
    strokes: [
      [
        [2, 12],
        [26, 12],
      ],
    ],
    advance: 28,
  },
  '’': {
    strokes: [
      [
        [5, 1],
        [5, 3.5],
        [3.8, 6.5],
      ],
    ],
    advance: 8,
  },
  '→': {
    strokes: [
      [
        [2, 12],
        [20, 12],
      ],
      [
        [14.5, 7.5],
        [20, 12],
        [14.5, 16.5],
      ],
    ],
    advance: 22,
  },
  Δ: {
    strokes: [
      [
        [10, 1],
        [1, 22],
        [19, 22],
        [10, 1],
      ],
    ],
    advance: 20,
  },
  '′': {
    strokes: [
      [
        [5, 1],
        [4, 6],
      ],
    ],
    advance: 7,
  },
  '×': {
    strokes: [
      [
        [4, 8],
        [14, 18],
      ],
      [
        [14, 8],
        [4, 18],
      ],
    ],
    advance: 18,
  },
  Ø: {
    strokes: [
      ring(10, 11.5, 8, 24),
      [
        [2, 21],
        [18, 2],
      ],
    ],
    advance: 20,
  },
  '±': {
    strokes: [
      [
        [10, 6],
        [10, 16],
      ],
      [
        [4, 11],
        [16, 11],
      ],
      [
        [4, 19],
        [16, 19],
      ],
    ],
    advance: 20,
  },
};

export function glyph(font: HersheyFont, ch: string): Glyph {
  const key = `${font}:${ch}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const code = ch.charCodeAt(0);
  let g: Glyph;
  const extra = EXTRA[ch];
  if (extra) g = extra;
  else if (ch === ' ' || ch === '\u00a0') g = { strokes: [], advance: 16 };
  else if (code < 33 || code > 126) g = { strokes: [], advance: 16, missing: true };
  else {
    const entry = HERSHEY[font][code - 33];
    g = entry
      ? { strokes: parseGlyph(entry[0]), advance: entry[1] * 2 }
      : { strokes: [], advance: 16, missing: true };
  }
  cache.set(key, g);
  return g;
}

/** Width of a line of lettering at a cap height (mm), before the hand's variation. */
/**
 * Lettering markup: `_x` or `_{xy}` sets a subscript, `^x` or `^{xy}` a superscript
 * (0.68 of the cap height). A prime is typed as ′ itself: an apostrophe stays an apostrophe (A' is not A′).
 */
export interface Glyphed {
  ch: string;
  /** 1 for normal, 0.68 for sub- and superscripts. */
  size: number;
  /** Baseline shift as a fraction of the cap height (down positive). */
  shift: number;
}

export function tokens(text: string): Glyphed[] {
  const out: Glyphed[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    if ((ch === '_' || ch === '^') && i + 1 < text.length) {
      const sub = ch === '_';
      let body: string;
      if (text[i + 1] === '{') {
        const close = text.indexOf('}', i + 2);
        body = text.slice(i + 2, close < 0 ? undefined : close);
        i = close < 0 ? text.length : close;
      } else {
        body = text[i + 1] as string;
        i += 1;
      }
      for (const b of body) out.push({ ch: b, size: 0.68, shift: sub ? 0.32 : -0.55 });
      continue;
    }
    out.push({ ch, size: 1, shift: 0 });
  }
  return out;
}

export function measureText(
  text: string,
  cap: number,
  font: HersheyFont = 'futural',
  tracking = 0.06,
): number {
  const k = cap / CAP_UNITS;
  let w = 0;
  for (const t of tokens(text))
    w += glyph(font, t.ch).advance * k * t.size + cap * tracking * t.size;
  return Math.max(0, w - cap * tracking);
}

export interface LetterOptions {
  font?: HersheyFont;
  /** Cap height, mm (ISO 3098: 2.5 or 3.5 for notes and dimensions). */
  cap?: number;
  anchor?: 'start' | 'middle' | 'end';
  kind?: TextItem['kind'];
  /** Right-to-left mirror script. Needs a readable twin (`twin`) or the critic fails it. */
  mirror?: boolean;
  twin?: string;
  /** Extra slant of the hand, degrees (positive leans right). */
  slant?: number;
  /** Rotate the baseline, degrees. */
  rotate?: number;
  role?: Role;
  ink?: InkId;
  instrument?: InstrumentId;
  layer?: LayerId;
  tracking?: number;
  id?: string;
  /** The point this text names (for leaders and the label checks). */
  refers?: Vec;
  /** Overlay lettering: exact strokes, no hand (research 03 R3). */
  exact?: boolean;
  pressure?: number;
}

export interface Lettered {
  id: string;
  marks: Mark[];
  item: TextItem;
}

/**
 * Letter a line of text with its baseline starting at `at` (or centred / ended there).
 */
export function letter(plate: Plate, text: string, at: Vec, o: LetterOptions = {}): Lettered {
  const font: HersheyFont = o.font ?? plate.style.letter.font;
  const cap = o.cap ?? plate.style.letter.height;
  const id = o.id ?? plate.nextId('text');
  const rng: Rng = plate.rng.fork(`letter:${id}`);
  const k = cap / CAP_UNITS;
  const tracking = o.tracking ?? 0.06;
  const width = measureText(text, cap, font, tracking);
  const anchor = o.anchor ?? 'start';
  const x0 = anchor === 'middle' ? at[0] - width / 2 : anchor === 'end' ? at[0] - width : at[0];
  const baseSlant = (o.slant ?? (font === 'scripts' ? 0 : 0)) * DEG;
  const rot = (o.rotate ?? 0) * DEG;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const seedB = rng.int(1, 1e9);
  const exact = !!o.exact;

  // lay out glyph strokes in text space (x along the baseline from x0, y down from the baseline)
  const laid: { pts: MVec[]; gi: number }[] = [];
  let pen = 0;
  let gi = 0;
  let missing = '';
  for (const tk of tokens(text)) {
    const g = glyph(font, tk.ch);
    // a character the hand cannot draw comes out blank: record it, never drop it silently
    if (g.missing && !missing.includes(tk.ch)) missing += tk.ch;
    const sz = (exact ? 1 : 1 + rng.normal() * 0.025) * tk.size;
    const drift = (exact ? 0 : noise1(gi * 0.45, seedB) * cap * 0.035) + tk.shift * cap;
    const sl = baseSlant + (exact ? 0 : rng.normal() * 1.2 * DEG);
    const tsl = Math.tan(sl);
    for (const s of g.strokes) {
      const pts = s.map(([gx, gy]) => {
        const lx = gx * k * sz;
        const ly = (gy - BASELINE) * k * sz + drift;
        return [pen + lx - ly * tsl, ly] as MVec;
      });
      laid.push({ pts, gi });
    }
    pen += g.advance * k * sz + cap * tracking * tk.size * (exact ? 1 : rng.range(0.7, 1.3));
    gi++;
  }
  const total = pen - cap * tracking;
  // mirror: the line runs right to left with every letter reversed; rotation is about `at`
  const place = (p: MVec): MVec => {
    const lx = x0 - at[0] + (o.mirror ? total - p[0] : p[0]);
    return [at[0] + lx * cr - p[1] * sr, at[1] + lx * sr + p[1] * cr];
  };

  const marks: Mark[] = [];
  let bx0 = Infinity;
  let by0 = Infinity;
  let bx1 = -Infinity;
  let by1 = -Infinity;
  for (const { pts } of laid) {
    const world = pts.map(place);
    for (const [x, y] of world) {
      if (x < bx0) bx0 = x;
      if (y < by0) by0 = y;
      if (x > bx1) bx1 = x;
      if (y > by1) by1 = y;
    }
    marks.push(
      ...plate.stroke(world, {
        role: o.role ?? 'letter',
        ink: o.ink,
        instrument: o.instrument,
        layer: o.layer,
        guide: exact ? 'exact' : 'free',
        start: 'touch',
        end: 'lift',
        pressure: o.pressure,
        group: id,
      }),
    );
  }
  if (!Number.isFinite(bx0)) {
    bx0 = x0;
    bx1 = x0;
    by0 = at[1] - cap;
    by1 = at[1];
  }
  const item = plate.addText({
    id,
    text,
    x: at[0],
    y: at[1],
    anchor,
    cap,
    kind: o.kind ?? 'key',
    drawn: true,
    mirror: !!o.mirror,
    twin: o.twin,
    box: [bx0, by0, bx1, by1],
    color: [0, 0, 0],
    refers: o.refers,
    rotate: o.rotate,
    missing: missing || undefined,
  });
  return { id, marks, item };
}

/**
 * Typeset a note (real SVG text: selectable, translatable, read aloud). The box is an
 * estimate from the cap height (≈ 0.62 cap per character, safe for fallback serifs).
 */
export function typeset(
  plate: Plate,
  text: string,
  at: Vec,
  o: {
    cap?: number;
    anchor?: 'start' | 'middle' | 'end';
    kind?: TextItem['kind'];
    italic?: boolean;
    color?: readonly [number, number, number];
    id?: string;
    mirror?: boolean;
    twin?: string;
    refers?: Vec;
    rotate?: number;
  } = {},
): TextItem {
  const cap = o.cap ?? 2.5;
  // estimate: ≈ 0.62 cap per character covers IM Fell and the wider fallback serifs
  const w = text.length * cap * 0.62;
  const anchor = o.anchor ?? 'start';
  const x0 = anchor === 'middle' ? at[0] - w / 2 : anchor === 'end' ? at[0] - w : at[0];
  return plate.addText({
    id: o.id ?? plate.nextId('type'),
    text,
    x: at[0],
    y: at[1],
    anchor,
    cap,
    kind: o.kind ?? 'note',
    drawn: false,
    mirror: !!o.mirror,
    twin: o.twin,
    box: [x0, at[1] - cap * 1.05, x0 + w, at[1] + cap * 0.3],
    // ink on a light sheet; on the night sheet, Dawn Departs (TOKEN color.dawn.departs)
    color:
      o.color ??
      (plate.paper.spec.tone[0] + plate.paper.spec.tone[1] + plate.paper.spec.tone[2] < 1.2
        ? [0.8, 1, 1]
        : [0.137, 0.102, 0.078]),
    italic: o.italic,
    refers: o.refers,
    rotate: o.rotate,
  });
}
