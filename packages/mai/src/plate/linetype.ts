/**
 * Line types — what a line's pattern says about it (ISO 128, research 03 §2.1):
 *
 *   solid     a visible edge or outline
 *   dashed    a hidden edge: what is behind
 *   chain     a centre line or an axis: long dash, gap, dot, gap
 *   phantom   an alternative position or an adjacent part: long dash, two dots
 *   dotted    construction a hand runs quickly, or a path of motion
 *
 * Proportions in units of the line's width d (ISO 128): dot ≤ 0.5 d, gap 3 d, dash 12 d,
 * long dash 24 d. Dashed and chain lines meet at a dash: the pattern is fitted so a line
 * starts and ends on a dash, never on a gap. A hand's dashes are separate strokes (the
 * pen lifts between them), so their lengths and gaps vary; an exact line's do not.
 */
import { cumulative, lengthOf, type Path, pointAt } from '../core/path.ts';
import type { Rng } from '../core/rng.ts';
import type { MVec } from '../core/vec.ts';

export type LineType = 'solid' | 'dashed' | 'chain' | 'phantom' | 'dotted';

/** On/off lengths in units of d; odd entries are gaps. A 0.5 entry is a dot. */
export const PATTERNS: Record<Exclude<LineType, 'solid'>, readonly number[]> = {
  dashed: [12, 3],
  chain: [24, 3, 0.5, 3],
  phantom: [24, 3, 0.5, 3, 0.5, 3],
  dotted: [0.5, 3],
};

export interface Dash {
  pts: MVec[];
  /** A dot rather than a dash (drawn as a dab). */
  dot: boolean;
}

/**
 * Cut a path into the dashes of a line type.
 *   d        the reference width (mm): the drawn line's width, ≈ 0.25–0.5 mm for a pen
 *   hand     true for a drawn line (lengths vary), false for the exact overlay
 *   centred  fit an even number of periods, so the pattern is symmetric and a dash (never a
 *            dot or a gap) lies on the line's middle: centre lines cross on dashes (ISO 128).
 *            A line too short for two periods comes out continuous, as ISO 128 allows for
 *            the centre lines of small circles.
 */
export function dashes(
  path: Path,
  type: LineType,
  o: { d: number; hand: boolean; rng: Rng; centred?: boolean },
): Dash[] {
  if (type === 'solid' || path.length < 2)
    return [{ pts: path.map((p) => [p[0], p[1]] as MVec), dot: false }];
  const pat = PATTERNS[type];
  const lens = cumulative(path);
  const L = lengthOf(path);
  const unit = Math.max(0.12, o.d);
  const period = pat.reduce((a, b) => a + b, 0) * unit;
  // fit: a whole number of periods plus a closing dash, so both ends are dashes
  const first = (pat[0] as number) * unit;
  const fit = (L - first) / period;
  const n = Math.max(0, o.centred ? 2 * Math.round(fit / 2) : Math.round(fit));
  const k = n > 0 ? (L - first) / (n * period + 1e-9) : 1;
  const out: Dash[] = [];
  let s = 0;
  let i = 0;
  const vary = (len: number, gap: boolean) => {
    if (!o.hand) return len;
    // a hand's gaps wander more than its dashes; dots stay dots
    const sd = gap ? 0.28 : 0.16;
    return Math.max(len * 0.45, len * (1 + o.rng.normal() * sd));
  };
  while (s < L - 1e-6) {
    const raw = pat[i % pat.length] as number;
    const gap = i % 2 === 1;
    const isDot = !gap && raw <= 0.5;
    let len = isDot ? Math.max(0.12, raw * unit) : vary(raw * unit * k, gap);
    if (!gap && s + len > L) len = L - s;
    if (!gap && len > 0.05) {
      const m = Math.max(2, Math.ceil(len / 0.2));
      const pts: MVec[] = [];
      for (let j = 0; j <= m; j++) pts.push(pointAt(path, lens, s + (len * j) / m));
      out.push({ pts, dot: isDot });
    }
    s += len;
    i++;
    // never end on a gap: if the remainder is less than a dash, close with a dash
    if (gap && L - s < first * 0.5 && L - s > 0.2) {
      const m = Math.max(2, Math.ceil((L - s) / 0.2));
      const pts: MVec[] = [];
      for (let j = 0; j <= m; j++) pts.push(pointAt(path, lens, s + ((L - s) * j) / m));
      out.push({ pts, dot: false });
      break;
    }
  }
  return out;
}
