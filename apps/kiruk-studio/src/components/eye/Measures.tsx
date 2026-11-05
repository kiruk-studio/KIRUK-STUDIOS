'use client';
/**
 * The live measures: the modern line laid over the old plate.
 *
 * The printed plate (type, guides, notes) is the hand's; this layer is the code's.
 * It is not printed into the paper, because its numbers change as the eye moves, and
 * re-printing the whole type layer at 15 Hz would cost a full texture upload each time.
 *
 *   W   the opening, corner to corner, as an aligned dimension (it carries the canthal tilt)
 *   A   the aperture, lid to lid, live through a blink
 *   p   the pupil, live through the light reflex
 *   bar ten millimetres of the real eye at this layout, and the scale it is drawn at
 *   calipers (M, then drag): any span, its ends snapped to the nearest landmark
 *
 * Every length reads in the chosen unit (U): d (the iris), mm (the human eye), px (this
 * screen, so it converts with the layout), or Paris lines (the engraver's unit).
 * spec-link: ideas/studio-dawn/eye.md — measure
 */
import {
  drawnScale,
  EYE,
  formatLength,
  irisCentre,
  irisRadii,
  lowerLid,
  MM_PER_UNIT,
  upperLid,
} from '@kiruk/burin/rig';
import { useEye } from './store';

type Pt = [number, number];

const deg = (r: number) => (r * 180) / Math.PI;

/** An architect's dimension: the line, slashed ends, a little overshoot. */
function Dim({
  a,
  b,
  label,
  side = -1,
  cls = '',
}: {
  a: Pt;
  b: Pt;
  label: string;
  side?: 1 | -1;
  cls?: string;
}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const over = 5;
  const tick = (p: Pt) =>
    `M${p[0] - 4 * (ux - uy)} ${p[1] - 4 * (uy + ux)}L${p[0] + 4 * (ux - uy)} ${p[1] + 4 * (uy + ux)}`;
  const mid: Pt = [(a[0] + b[0]) / 2 + -uy * 9 * side * -1, (a[1] + b[1]) / 2 + ux * 9 * side];
  const angle = deg(Math.atan2(dy, dx));
  const upright = angle > 90 || angle < -90 ? angle + 180 : angle;
  return (
    <g className={`m-dim ${cls}`}>
      <path
        className="m-line"
        d={`M${a[0] - ux * over} ${a[1] - uy * over}L${b[0] + ux * over} ${b[1] + uy * over}`}
      />
      <path className="m-tick" d={`${tick(a)}${tick(b)}`} />
      <text
        className="m-text"
        x={mid[0]}
        y={mid[1]}
        transform={`rotate(${upright} ${mid[0]} ${mid[1]})`}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

export function Measures() {
  const S = useEye((s) => s.S);
  const cx = useEye((s) => s.cx);
  const cy = useEye((s) => s.cy);
  const W = useEye((s) => s.W);
  const H = useEye((s) => s.H);
  const unit = useEye((s) => s.unit);
  const open = useEye((s) => s.open);
  const pupil = useEye((s) => s.pupil);
  const gx = useEye((s) => s.gx);
  const gy = useEye((s) => s.gy);
  const calipers = useEye((s) => s.calipers);
  const caliper = useEye((s) => s.caliper);
  const hover = useEye((s) => s.hover);

  const P = (x: number, y: number): Pt => [cx + x * S, cy + y * S];
  const pose = { gx, gy, open, pupil };
  const fmt = (u: number) => formatLength(u, unit, S);

  // W: the opening, corner to corner, aligned with the fissure, 0.9 below it.
  const inC: Pt = [-1, EYE.canthus.inY];
  const outC: Pt = [1, EYE.canthus.outY];
  const wLen = Math.hypot(outC[0] - inC[0], outC[1] - inC[1]);
  const tilt = deg(Math.atan2(inC[1] - outC[1], outC[0] - inC[0]));
  const wa = P(inC[0], inC[1] + 0.86);
  const wb = P(outC[0], outC[1] + 0.86);

  // A: the aperture at x = −0.55, between the lids, live.
  const ax = -0.55;
  const aTop = upperLid(ax, pose);
  const aBot = lowerLid(ax, pose);

  // p: the pupil, live, under the iris's own dimension.
  const [icx] = irisCentre(pose);
  const [rx] = irisRadii(pose);
  const pr = rx * pupil;

  // The bar: ten millimetres of the real eye, here and now.
  const tenMm = 10 / MM_PER_UNIT;
  const bar0 = P(0.84, 0.99);
  const barW = tenMm * S;
  const k = drawnScale(S);

  let cal: { a: Pt; b: Pt; label: string; names: string } | null = null;
  if (caliper) {
    const du = Math.hypot(caliper.b[0] - caliper.a[0], caliper.b[1] - caliper.a[1]);
    const ang = deg(Math.atan2(-(caliper.b[1] - caliper.a[1]), caliper.b[0] - caliper.a[0]));
    cal = {
      a: P(caliper.a[0], caliper.a[1]),
      b: P(caliper.b[0], caliper.b[1]),
      label: `${fmt(du)} · ${ang.toFixed(1)}°`,
      names: [caliper.snapA, caliper.snapB].filter(Boolean).join(' → '),
    };
  }

  // Over a caliper end the caliper speaks for itself: no second label on top of it.
  const nearCaliper = (h: { x: number; y: number }) =>
    !!caliper &&
    Math.min(
      Math.hypot(h.x - caliper.a[0], h.y - caliper.a[1]),
      Math.hypot(h.x - caliper.b[0], h.y - caliper.b[1]),
    ) *
      S <
      24;

  if (S < 2) return null;
  return (
    <svg
      className="eye-live"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Live measures of the eye"
    >
      <title>Live measures</title>
      <Dim a={wa} b={wb} label={`W ${fmt(wLen)} · tilt ${tilt.toFixed(1)}°`} side={1} />

      <g className="m-a">
        <Dim a={P(ax, aTop)} b={P(ax, aBot)} label={`A ${fmt(aBot - aTop)}`} side={1} />
      </g>

      <Dim
        a={P(icx - pr, 0.72)}
        b={P(icx + pr, 0.72)}
        label={`p ${fmt(2 * pr)}`}
        side={1}
        cls="m-small"
      />

      <g className="m-bar">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={bar0[0] + (barW / 5) * i}
            y={bar0[1]}
            width={barW / 5}
            height={3.5}
            className={i % 2 ? 'm-bar-open' : 'm-bar-fill'}
          />
        ))}
        <text className="m-text m-small" x={bar0[0]} y={bar0[1] + 14} textAnchor="middle">
          0
        </text>
        <text
          className="m-text m-small"
          x={bar0[0] + barW / 2}
          y={bar0[1] + 14}
          textAnchor="middle"
        >
          5
        </text>
        <text className="m-text m-small" x={bar0[0] + barW} y={bar0[1] + 14} textAnchor="middle">
          10 mm
        </text>
        <text className="m-text m-small" x={bar0[0] + barW} y={bar0[1] - 6} textAnchor="end">
          Fig. 1 at {k.toFixed(2)} : 1
        </text>
      </g>

      {cal && (
        <g className="m-cal">
          <Dim a={cal.a} b={cal.b} label={cal.label} side={-1} />
          {caliper?.snapA && <circle className="m-snap" cx={cal.a[0]} cy={cal.a[1]} r={4.5} />}
          {caliper?.snapB && <circle className="m-snap" cx={cal.b[0]} cy={cal.b[1]} r={4.5} />}
          {cal.names && (
            <text
              className="m-text m-small"
              x={(cal.a[0] + cal.b[0]) / 2}
              y={(cal.a[1] + cal.b[1]) / 2 + 20}
              textAnchor="middle"
            >
              {cal.names}
            </text>
          )}
        </g>
      )}

      {calipers && hover && !nearCaliper(hover) && (
        <g className="m-hover">
          <path
            className="m-cross"
            d={`M${P(hover.x, hover.y)[0] - 9} ${P(hover.x, hover.y)[1]}h18M${P(hover.x, hover.y)[0]} ${P(hover.x, hover.y)[1] - 9}v18`}
          />
          {hover.snap && (
            <circle
              className="m-snap"
              cx={P(hover.x, hover.y)[0]}
              cy={P(hover.x, hover.y)[1]}
              r={4.5}
            />
          )}
          <text
            className="m-text m-small"
            x={P(hover.x, hover.y)[0] + 12}
            y={P(hover.x, hover.y)[1] - 10}
          >
            {hover.snap ? `${hover.snap} · ` : ''}x {fmt(hover.x)}, y {fmt(-hover.y)}
          </text>
        </g>
      )}
    </svg>
  );
}
