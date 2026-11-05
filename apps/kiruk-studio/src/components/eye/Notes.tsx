'use client';
/**
 * The notes: written into whatever margin the layout leaves, the way a notebook page
 * fills — around the drawing, sideways up the edge, along the foot of the plate, one
 * line in mirror script — and tied to the part they talk about by a rubric leader.
 * They read in order, i → vi: scribble, measure, light, paper, water, make.
 *
 * Pretext lays them out: it measures with the font itself (no DOM reflow), so each
 * line can take its own width. The note under the eye flows into the curve of the
 * drawing, line by line. On every layout change the notes are placed again: a note
 * tries its preferred margins, then smaller type, and is left out if nothing fits.
 * Lines are real DOM spans, printed into the paper with the rest of the type.
 *
 * Some notes keep their revisions, as a corrected proof does: the word struck through
 * stays in the line, the correction is written above it, and a deleatur (δ) marks the
 * line in the margin. The page shows how it was arrived at, not only where.
 *
 * spec-link: ideas/studio-dawn/eye.md — notes
 */
import {
  type LayoutCursor,
  layoutNextLine,
  type PreparedTextWithSegments,
  prepareWithSegments,
} from '@chenglou/pretext';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useEye } from './store';

type Target = [number, number] | 'toggle';
/** fixes: [struck, written above] — the struck word stays in the measured line. */
type NoteDef = {
  id: string;
  no: string;
  text: string;
  target: Target;
  zones: string[];
  mirror?: boolean;
  fixes?: [string, string][];
};

export const NOTES: NoteDef[] = [
  {
    id: 'i',
    no: 'i.',
    text: 'Scribble first: the whole eye, loose, in red chalk, before a line is cut; then let the lids hide most of it. In order, ① – ⑧. → ii',
    target: [-0.47, -0.45],
    zones: ['left', 'curve'],
    fixes: [['eye', 'globe']],
  },
  {
    id: 'ii',
    no: 'ii.',
    text: "Then measure, in inches. Resize the page and the figure's scale changes; the measures do not. → iii",
    target: [-1, 0.92],
    zones: ['curve', 'left', 'margin'],
    fixes: [['inches', 'the iris']],
  },
  {
    id: 'iii',
    no: 'iii.',
    text: 'One light for the paper and the eye; it follows your hand. The lid throws its shadow on the ball, the brow on the lid. No grey: only how wide the burin cut. → iv',
    target: [0.48, -0.27],
    zones: ['margin', 'left'],
  },
  {
    id: 'v',
    no: 'v.',
    text: 'Wet it: shift-drag across the lashes. The ink lifts, runs along the fibres, dries darkest at its edge and fades, the way a scribble does once it has become the thing. → vi',
    target: [0.3, 0.36],
    zones: ['bottom', 'margin', 'left'],
  },
  {
    id: 'vi',
    no: 'vi.',
    text: 'And in the pupil, the light it holds: the kiruk star. To scribble, and make something.',
    target: [0.66, -0.6],
    zones: ['margin', 'left', 'curve'],
  },
  {
    id: 'iv',
    no: 'iv.',
    text: 'Two papers. Dawn Light, where the hand drew, keeps its years; Dawn Departs, where the code draws, has none. → v',
    target: 'toggle',
    zones: ['left', 'margin'],
  },
  {
    id: 'mirror',
    no: '',
    text: 'scribble first, measure after',
    target: [-1.2, -1.05],
    zones: ['mirror'],
    mirror: true,
  },
];

type Zone = {
  id: string;
  /** screen origin of the zone (its top-left before rotation) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** degrees; −90 runs the lines up the page */
  rotate: number;
  /** the usable span [left, right] of a line occupying [top, bottom], zone-local px */
  span?: (top: number, bottom: number) => [number, number];
  oneLine?: boolean;
  /** how many notes the zone may hold */
  max?: number;
  used: number;
  count: number;
};

type Line = { x: number; y: number; text: string; w: number };

/** A line's text with its revisions drawn in: the struck word, the correction above it. */
function revised(text: string, pending: [string, string][], key: string) {
  const out: ReactNode[] = [];
  let rest = text;
  let marked = false;
  for (let i = 0; i < pending.length; i++) {
    const [del, ins] = pending[i] as [string, string];
    const at = rest.indexOf(del);
    if (at < 0) continue;
    out.push(rest.slice(0, at));
    out.push(
      <s key={`${key}-${del}`} className="note-del">
        {del}
        <span className="note-ins">{ins}</span>
      </s>,
    );
    rest = rest.slice(at + del.length);
    pending.splice(i, 1);
    i--;
    marked = true;
  }
  out.push(rest);
  return { parts: out, marked };
}
type Placed = {
  def: NoteDef;
  zone: Zone;
  size: number;
  lh: number;
  lines: Line[];
  anchor: [number, number];
  target: [number, number];
};

const SIZES = [13.5, 13, 12.5, 12, 11.5];
const prepared = new Map<string, PreparedTextWithSegments>();
const prep = (text: string, font: string) => {
  const k = `${font}|${text}`;
  let p = prepared.get(k);
  if (!p) {
    p = prepareWithSegments(text, font);
    prepared.set(k, p);
  }
  return p;
};

const box = (sel: string) => {
  const el = document.querySelector(sel);
  if (!el || getComputedStyle(el).display === 'none') return null;
  const r = el.getBoundingClientRect();
  return r.width > 1 ? r : null;
};

/** Lay a note into a zone at one size: lines, or null if it does not fit. */
function fit(text: string, font: string, lh: number, z: Zone): Line[] | null {
  const p = prep(text, font);
  const lines: Line[] = [];
  let cursor: LayoutCursor | undefined;
  let y = z.used;
  let skipped = 0;
  for (;;) {
    const [l, r] = z.span ? z.span(y, y + lh) : [0, z.w];
    if (r - l < 46) {
      // Too narrow here (the drawing is in the way): skip the band, a few times at most.
      if (++skipped > 4 || y + lh > z.h) return null;
      y += lh;
      continue;
    }
    const line = layoutNextLine(p, r - l, cursor);
    if (!line) return lines.length ? lines : null;
    // Only a line that exists has to fit.
    if (y + lh > z.h + 0.5) return null;
    lines.push({ x: l, y, text: line.text, w: line.width });
    cursor = line.end;
    y += lh;
    if (z.oneLine && lines.length > 1) return null;
  }
}

function place(S: number, cx: number, cy: number, family: string): Placed[] {
  const E = (x: number, y: number): [number, number] => [cx + x * S, cy + y * S];
  const title = box('.eye-title');
  const key = box('.eye-key');
  const ins = box('.instrument');
  const plate = box('.platemark');
  const strip = box('.studies');
  const toggle = box('.dawn-toggle');
  if (!plate || S < 60) return [];
  const labels = [...document.querySelectorAll('.g-label')].map((e) => e.getBoundingClientRect());
  const eyeL = cx - 1.6 * S;
  const eyeR = cx + 1.6 * S;
  const zones: Record<string, Zone> = {};

  // Left, between the title block and the key.
  if (title && key) {
    const y = title.bottom + 16;
    const h = key.top - 16 - y;
    if (h >= 30)
      zones.left = {
        id: 'left',
        x: title.left,
        y,
        w: Math.max(title.width, key.width),
        h,
        rotate: 0,
        used: 0,
        count: 0,
      };
  }

  // Under the eye, flowing into the curve of the drawing (the skin fades by ρ ≈ 0.9).
  {
    const top = cy + 0.42 * S;
    const bottom = cy + 0.84 * S;
    let x = eyeL + 10;
    if (key && key.right + 18 > x && key.bottom > top && key.top < bottom) x = key.right + 18;
    const xEdge = (yy: number) => {
      const t = (yy + 0.22) / 1.062;
      return 0.06 - 1.368 * Math.sqrt(Math.max(0, 1 - t * t));
    };
    const span = (t0: number, t1: number): [number, number] => {
      const y0 = (top + t0 - cy) / S;
      const y1 = (top + t1 - cy) / S;
      let right = Math.min(xEdge(y0), xEdge(y1));
      // Keep clear of the iris dimension and its label.
      if (y1 > 0.55 && y0 < 0.76) right = Math.min(right, -0.44);
      return [0, cx + right * S - 8 - x];
    };
    if (bottom - top > 40)
      zones.curve = {
        id: 'curve',
        x,
        y: top,
        w: eyeR - x,
        h: bottom - top,
        rotate: 0,
        span,
        max: 1,
        used: 0,
        count: 0,
      };
  }

  // Up the right margin, sideways, between the scale and the instrument (or the plate's edge).
  {
    const x0 = Math.max(eyeR, ...labels.map((r) => r.right)) + 16;
    // Clear of the instrument, and of the neatline's figures inside the plate's right edge.
    const x1 = Math.min(ins ? ins.left - 14 : Number.POSITIVE_INFINITY, plate.right - 16);
    const top = cy - 1.3 * S;
    const bottom = cy + 1.0 * S;
    // Two notes at most up the margin: sideways text is read slowly.
    if (x1 - x0 >= 30)
      zones.margin = {
        id: 'margin',
        x: x0,
        y: bottom,
        w: bottom - top,
        h: x1 - x0,
        rotate: -90,
        max: 2,
        used: 0,
        count: 0,
      };
  }

  // Along the foot of the drawing, above the studies: a line, or two where the gap allows.
  if (strip) {
    const y = cy + 1.1 * S + 2;
    const h = strip.top - y - 2;
    if (h >= 14)
      zones.bottom = {
        id: 'bottom',
        x: eyeL + 10,
        y,
        w: 3.2 * S - 20,
        h: Math.min(h, 36),
        rotate: 0,
        oneLine: h < 30,
        max: 1,
        used: 0,
        count: 0,
      };
  }

  // Over the head of the brow: a line in mirror script.
  {
    const x = eyeL + 8;
    const w = cx - 0.75 * S - x;
    if (w > 80)
      zones.mirror = {
        id: 'mirror',
        x,
        y: cy - 1.44 * S,
        w,
        h: 20,
        rotate: 0,
        oneLine: true,
        max: 1,
        used: 0,
        count: 0,
      };
  }

  const out: Placed[] = [];
  for (const def of NOTES) {
    const text = def.no ? `${def.no} ${def.text}` : def.text;
    let done = false;
    for (const zid of def.zones) {
      const z = zones[zid];
      if (!z || done || (z.max !== undefined && z.count >= z.max)) continue;
      for (const size of SIZES) {
        const lh = Math.round(size * 1.3 * 10) / 10;
        const font = `italic 400 ${size}px ${family}`;
        const lines = fit(text, font, lh, z);
        if (!lines) continue;
        const target: [number, number] =
          def.target === 'toggle'
            ? toggle
              ? [toggle.left + toggle.width * 0.3, toggle.bottom - 2]
              : E(-1.4, -1.2)
            : E(def.target[0], def.target[1]);
        // Anchor: the point of the note nearest its target — a line's end, or anywhere along the
        // top of the first line or the foot of the last — so the leader is as short as it can be
        // and never crosses the note's own lines.
        const rad = (z.rotate * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const toScreen = (lx: number, ly: number): [number, number] => [
          z.x + lx * cos - ly * sin,
          z.y + lx * sin + ly * cos,
        ];
        const tl: [number, number] = [
          (target[0] - z.x) * cos + (target[1] - z.y) * sin,
          -(target[0] - z.x) * sin + (target[1] - z.y) * cos,
        ];
        const cands: [number, number][] = [];
        for (const l of lines)
          cands.push([l.x - 5, l.y + lh * 0.55], [l.x + l.w + 5, l.y + lh * 0.55]);
        const first = lines[0] as Line;
        const last = lines[lines.length - 1] as Line;
        cands.push([Math.min(Math.max(tl[0], first.x), first.x + first.w), first.y - 1]);
        cands.push([Math.min(Math.max(tl[0], last.x), last.x + last.w), last.y + lh + 1]);
        let anchor: [number, number] = toScreen(first.x, first.y);
        let best = Number.POSITIVE_INFINITY;
        for (const [lx, ly] of cands) {
          const pt = toScreen(lx, ly);
          const d = Math.hypot(pt[0] - target[0], pt[1] - target[1]);
          if (d < best) {
            best = d;
            anchor = pt;
          }
        }
        z.used = last.y + lh + 10;
        z.count++;
        out.push({ def, zone: z, size, lh, lines, anchor, target });
        done = true;
        break;
      }
    }
  }
  return out;
}

export function Notes() {
  const S = useEye((s) => s.S);
  const cx = useEye((s) => s.cx);
  const cy = useEye((s) => s.cy);
  const W = useEye((s) => s.W);
  const H = useEye((s) => s.H);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [hot, setHot] = useState<string | null>(null);
  const [fonts, setFonts] = useState(false);
  // Bumped when the plate's type settles (the title or key changes size, e.g. when the
  // canvas starts laying out its subtree): the margins it leaves have moved.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    for (const sel of ['.eye-title', '.eye-key', '.dawn-toggle']) {
      const el = document.querySelector(sel);
      if (el) ro.observe(el);
    }
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    void document.fonts.ready.then(() => alive && setFonts(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!fonts || W < 900) {
      setPlaced([]);
      return;
    }
    // After the title block and key have their final layout (tick: they just changed size).
    void tick;
    const id = requestAnimationFrame(() => {
      const probe = document.querySelector('.notes');
      const family = probe ? getComputedStyle(probe).fontFamily : 'serif';
      setPlaced(place(S, cx, cy, family));
    });
    return () => cancelAnimationFrame(id);
  }, [fonts, S, cx, cy, W, H, tick]);

  const leaders = useMemo(
    () =>
      placed
        .filter((p) => !p.def.mirror)
        .map((p, i) => {
          const [ax, ay] = p.anchor;
          const [tx, ty] = p.target;
          const dx = tx - ax;
          const dy = ty - ay;
          const len = Math.hypot(dx, dy) || 1;
          // A hand-drawn leader: a gentle bow, alternating side, ending in a dot on the part.
          const bow = Math.min(40, len * 0.12) * (i % 2 ? 1 : -1);
          const qx = (ax + tx) / 2 + (-dy / len) * bow;
          const qy = (ay + ty) / 2 + (dx / len) * bow;
          return {
            id: p.def.id,
            d: `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`,
            tx,
            ty,
          };
        }),
    [placed],
  );

  return (
    <aside className="notes" aria-label="Notes on the plate, i to vi">
      {placed.map((p) => (
        <p
          key={p.def.id}
          className={`note${p.def.mirror ? ' note-mirror' : ''}${hot === p.def.id ? ' is-hot' : ''}`}
          data-note={p.def.id}
          style={{
            left: p.zone.x,
            top: p.zone.y,
            width: p.zone.w,
            height: p.zone.h,
            fontSize: p.size,
            lineHeight: `${p.lh}px`,
            transform: p.zone.rotate ? `rotate(${p.zone.rotate}deg)` : undefined,
          }}
          onPointerEnter={() => setHot(p.def.id)}
          onPointerLeave={() => setHot(null)}
        >
          {(() => {
            const pending = [...(p.def.fixes ?? [])];
            return p.lines.map((l, i) => {
              const pre = i === 0 && p.def.no && l.text.startsWith(p.def.no) ? p.def.no : '';
              const { parts, marked } = revised(
                pre ? l.text.slice(pre.length) : l.text,
                pending,
                `${p.def.id}-${i}`,
              );
              return (
                <span
                  key={`${p.def.id}-${l.y}`}
                  className="note-line"
                  style={{ left: l.x, top: l.y, width: p.def.mirror ? l.w : undefined }}
                >
                  {marked && (
                    <span className="note-dele" aria-hidden="true">
                      δ
                    </span>
                  )}
                  {pre && <b className="note-no">{pre}</b>}
                  {parts}
                </span>
              );
            });
          })()}
        </p>
      ))}
      <svg
        className="note-leaders"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        {leaders.map((l) => (
          <g key={l.id} className={hot === l.id ? 'is-hot' : undefined}>
            <path className="note-leader" d={l.d} />
            <circle className="note-dot" cx={l.tx} cy={l.ty} r={2.2} />
          </g>
        ))}
      </svg>
    </aside>
  );
}
