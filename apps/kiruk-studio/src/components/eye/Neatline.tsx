'use client';
/**
 * The neatline: the plate's border as a graduated scale, after the old maps and the
 * architectural plates (alternate segments filled, figures every other segment, the
 * figure's axes pointed out on the border).
 *
 * The segments are counted from the eye's own axes — 0 where the vertical centre line
 * meets the top, 0 where the horizontal one meets the sides — in the reader's unit
 * (0.5 d · 5 mm · 50 px · 2 lignes a segment). Resize the page and the segments in px
 * change length; in d or mm they keep counting the same eye. Printed with the plate.
 * spec-link: ideas/studio-dawn/eye.md — measure
 */
import { MM_PER_LIGNE, MM_PER_UNIT, type Unit } from '@kiruk/burin/rig';
import { useEffect, useState } from 'react';
import { useEye } from './store';

/** One segment, in eye units, and how a count of segments is written. */
function segment(unit: Unit, S: number): { u: number; label: (n: number) => string } {
  if (unit === 'd') return { u: 0.36, label: (n) => `${n / 2}` };
  if (unit === 'mm') return { u: 5 / MM_PER_UNIT, label: (n) => `${n * 5}` };
  if (unit === 'px') return { u: 50 / S, label: (n) => `${n * 50}` };
  return { u: (2 * MM_PER_LIGNE) / MM_PER_UNIT, label: (n) => `${n * 2}` };
}

type Box = { x: number; y: number; w: number; h: number };
const SYM: Record<Unit, string> = { d: 'd', mm: 'mm', px: 'px', ligne: 'l.' };

export function Neatline() {
  const S = useEye((s) => s.S);
  const cx = useEye((s) => s.cx);
  const cy = useEye((s) => s.cy);
  const W = useEye((s) => s.W);
  const H = useEye((s) => s.H);
  const unit = useEye((s) => s.unit);
  const [plate, setPlate] = useState<Box | null>(null);
  const [title, setTitle] = useState<Box | null>(null);

  useEffect(() => {
    const read = (sel: string) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r && r.width > 1 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
    };
    const id = requestAnimationFrame(() => {
      setPlate(read('.platemark'));
      setTitle(read('.eye-title'));
    });
    return () => cancelAnimationFrame(id);
  }, [S, cx, cy, W, H]);

  if (!plate || S < 60 || W < 900) return null;
  const seg = segment(unit, S);
  const step = seg.u * S;
  if (step < 6) return null;
  const o = 6; // outer rule, inset from the platemark
  const band = 5; // the graduated band between the rules
  const x0 = plate.x + o;
  const y0 = plate.y + o;
  const x1 = plate.x + plate.w - o;
  const y1 = plate.y + plate.h - o;

  // Alternate segments filled, counted from an axis outward both ways.
  const run = (from: number, to: number, axis: number) => {
    const out: { a: number; b: number; n: number }[] = [];
    const k0 = Math.floor((from - axis) / step);
    const k1 = Math.ceil((to - axis) / step);
    for (let k = k0; k < k1; k++) {
      const a = Math.max(from, axis + k * step);
      const b = Math.min(to, axis + (k + 1) * step);
      if (b > a) out.push({ a, b, n: k });
    }
    return out;
  };
  const top = run(x0, x1, cx);
  const left = run(y0, y1, cy);
  const clearOfTitle = (x: number, y: number) =>
    !title ||
    x < title.x - 6 ||
    x > title.x + title.w + 6 ||
    y < title.y - 6 ||
    y > title.y + title.h + 6;

  return (
    <svg className="neatline" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {/* The double rule round three sides; the foot stays clear for the studies' names. */}
      <path className="nl-rule" d={`M${x0} ${y1}V${y0}H${x1}V${y1}`} />
      <path className="nl-rule nl-thin" d={`M${x0 + band} ${y1}V${y0 + band}H${x1 - band}V${y1}`} />
      {top.map((s) =>
        s.n % 2 === 0 ? (
          <rect
            key={`t${s.n}`}
            className="nl-fill"
            x={s.a}
            y={y0}
            width={s.b - s.a}
            height={band}
          />
        ) : null,
      )}
      {left.map((s) =>
        s.n % 2 === 0 ? (
          <g key={`l${s.n}`}>
            <rect className="nl-fill" x={x0} y={s.a} width={band} height={s.b - s.a} />
            <rect className="nl-fill" x={x1 - band} y={s.a} width={band} height={s.b - s.a} />
          </g>
        ) : null,
      )}
      {/* The figure's axes, pointed out on the border. */}
      <path
        className="nl-axis"
        d={`M${cx - 4} ${y0 + band + 1}L${cx} ${y0 + band + 7}L${cx + 4} ${y0 + band + 1}Z`}
      />
      <path
        className="nl-axis"
        d={`M${x0 + band + 1} ${cy - 4}L${x0 + band + 7} ${cy}L${x0 + band + 1} ${cy + 4}Z`}
      />
      <path
        className="nl-axis"
        d={`M${x1 - band - 1} ${cy - 4}L${x1 - band - 7} ${cy}L${x1 - band - 1} ${cy + 4}Z`}
      />
      {/* Figures every other segment: along the top, and outside the right edge (the plate stays for notes). */}
      {top
        .filter(
          (s) =>
            s.n % 2 === 0 &&
            s.n !== 0 &&
            s.a > x0 + 20 &&
            s.a < x1 - 20 &&
            clearOfTitle(s.a, y0 + band + 9),
        )
        .map((s) => {
          const x = cx + s.n * step;
          return (
            <text key={`tt${s.n}`} className="nl-text" x={x} y={y0 + band + 10} textAnchor="middle">
              {seg.label(Math.abs(s.n))}
            </text>
          );
        })}
      <text className="nl-text nl-unit" x={cx + 9} y={y0 + band + 10}>
        0 {SYM[unit]}
      </text>
      {left
        .filter((s) => s.n % 2 === 0 && s.n !== 0 && s.a > y0 + 20 && s.a < y1 - 20)
        .map((s) => {
          const y = cy + s.n * step;
          return (
            <text
              key={`lt${s.n}`}
              className="nl-text"
              x={plate.x + plate.w + 4}
              y={y + 3.5}
              textAnchor="start"
            >
              {seg.label(Math.abs(s.n))}
            </text>
          );
        })}
    </svg>
  );
}
