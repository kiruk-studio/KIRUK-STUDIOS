'use client';
/**
 * The construction's own writing, printed with the plate (after the old construction
 * sheets: a letter's arcs annotated along the arcs themselves; a figure's circles
 * numbered in the order they were struck, with the compass swing shown dashed).
 *
 *   along the globe   what it is, written on its own upper arc
 *   along the orbit   the socket's rim, written up its side
 *   ① – ⑧             the order of drawing: axis, corners, globe, iris, lids, crease, brow, orbit
 *   the swing         a radius of the globe, dashed, with its arc and arrow
 *
 * Shown with the construction (W: faint or full), hidden with it. Drawn in page pixels
 * from the eye's centre and S, so the type is set at real sizes.
 * spec-link: ideas/studio-dawn/eye.md — construction
 */
import { GLOBE } from '@kiruk/burin/rig';
import { useEye } from './store';

const ORBIT = { cx: 0.05, cy: -0.22, rx: 1.46, ry: 1.1 };

/** Where each step's numeral sits (eye units), clear of the figure's letters. ③ and ⑧ are written on their arcs. */
const STEPS: [string, number, number][] = [
  ['1', -1.55, -0.04],
  ['2', -1.02, -0.13],
  ['4', -0.45, 0.6],
  ['5', 1.2, -0.2],
  ['6', 1.08, -0.6],
  ['7', 1.44, -1.0],
];

export function Construction() {
  const S = useEye((s) => s.S);
  const cx = useEye((s) => s.cx);
  const cy = useEye((s) => s.cy);
  const W = useEye((s) => s.W);
  const H = useEye((s) => s.H);
  if (S < 60 || W < 900) return null;

  const f = (n: number) => n.toFixed(1);
  const at = (ox: number, oy: number, rx: number, ry: number, deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [cx + (ox + rx * Math.cos(a)) * S, cy + (oy + ry * Math.sin(a)) * S];
  };
  /** An arc between two angles (degrees, clockwise on screen), in page px. */
  const arc = (ox: number, oy: number, rx: number, ry: number, from: number, to: number) => {
    const [x0, y0] = at(ox, oy, rx, ry, from);
    const [x1, y1] = at(ox, oy, rx, ry, to);
    return `M${f(x0)} ${f(y0)}A${f(rx * S)} ${f(ry * S)} 0 ${Math.abs(to - from) > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
  };
  const R = GLOBE.R;
  const g: [number, number] = [cx + GLOBE.cx * S, cy + GLOBE.cy * S];
  const A = 28;
  const tip = at(GLOBE.cx, GLOBE.cy, R - 0.025, R - 0.025, A);
  const rad = (A * Math.PI) / 180;
  const head = (side: number) => {
    const bx = tip[0] - 9 * Math.cos(rad);
    const by = tip[1] - 9 * Math.sin(rad);
    return `M${f(bx - side * 4 * Math.sin(rad))} ${f(by + side * 4 * Math.cos(rad))}L${f(tip[0])} ${f(tip[1])}`;
  };
  const fs = Math.max(10.5, Math.min(13, S * 0.054));

  return (
    <svg
      className="cons-notes"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="The construction, annotated: the globe, the orbit, and the order of drawing, one to eight"
    >
      <defs>
        <path id="cons-globe" d={arc(GLOBE.cx, GLOBE.cy, R + 0.03, R + 0.03, 206, 334)} />
        <path
          id="cons-orbit"
          d={arc(ORBIT.cx, ORBIT.cy, ORBIT.rx + 0.03, ORBIT.ry + 0.03, 172, 214)}
        />
      </defs>
      <text className="cons-text" style={{ fontSize: fs }}>
        <textPath href="#cons-globe" startOffset="50%" textAnchor="middle">
          ③ globus: the whole eye, drawn first; the lids hide most of it
        </textPath>
      </text>
      <text className="cons-text" style={{ fontSize: fs }}>
        <textPath href="#cons-orbit" startOffset="50%" textAnchor="middle">
          ⑧ orbita, the socket&apos;s rim
        </textPath>
      </text>

      {/* The compass swing: a radius of the globe, dashed, its arc, its arrow. */}
      <path className="cons-swing" d={`M${f(g[0])} ${f(g[1])}L${f(tip[0])} ${f(tip[1])}`} />
      <path className="cons-swing" d={arc(GLOBE.cx, GLOBE.cy, R + 0.06, R + 0.06, 16, 40)} />
      <path className="cons-head" d={`${head(1)}${head(-1)}`} />
      <text
        className="cons-r"
        x={f((g[0] + tip[0]) / 2 + 4)}
        y={f((g[1] + tip[1]) / 2 - 5)}
        style={{ fontSize: fs }}
      >
        R
      </text>

      {STEPS.map(([n, x, y]) => (
        <g key={n} className="cons-step">
          <circle cx={f(cx + x * S)} cy={f(cy + y * S)} r={7.5} />
          <text x={f(cx + x * S)} y={f(cy + y * S)} textAnchor="middle" dominantBaseline="central">
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}
