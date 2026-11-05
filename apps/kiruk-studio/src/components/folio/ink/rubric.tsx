/**
 * The rubric — the modern line laid over the ink, in one red, a hairline.
 * Every line ends on what it explains; terminators carry data-end; extension
 * lines carry data-ext; the whole layer prints a touch off register.
 *
 * spec-link: .claude/skills/kiruk-codex/references/line.md
 */
import type { ReactNode } from 'react';
import { n, type P } from './pen';

/** The line's half of "slightly broken in both directions": shifted, never rotated. */
export const REGISTER = 'translate(1.2 -0.8)';

const unit = (a: P, b: P): [number, number] => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};

/** Filled arrowhead, 8 u long, 25° included, its point on `tip`, pointing along `from → tip`. */
export function Arrow({ tip, from }: { tip: P; from: P }) {
  const [ux, uy] = unit(from, tip);
  const L = 8;
  const half = Math.tan((12.5 * Math.PI) / 180) * L;
  const bx = tip[0] - ux * L;
  const by = tip[1] - uy * L;
  return (
    <path
      data-end=""
      className="rub-fill"
      d={`M${n(tip[0])} ${n(tip[1])}L${n(bx - uy * half)} ${n(by + ux * half)}L${n(bx + uy * half)} ${n(by - ux * half)}Z`}
    />
  );
}

/** A dot, 5 u across, for a line that ends inside a surface. */
export const Dot = ({ at }: { at: P }) => (
  <circle data-end="" className="rub-fill" cx={n(at[0])} cy={n(at[1])} r={2.5} />
);

export const Seg = ({
  a,
  b,
  cls = 'rub',
  ext,
  free,
  dash,
}: {
  a: P;
  b: P;
  cls?: string;
  ext?: boolean;
  free?: boolean;
  dash?: string;
}) => (
  <path
    className={cls}
    d={`M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`}
    data-ext={ext ? '' : undefined}
    data-free={free ? '' : undefined}
    strokeDasharray={dash}
    vectorEffect="non-scaling-stroke"
  />
);

export function Label({
  at,
  children,
  anchor = 'start',
  cls = 'lbl',
  rotate,
}: {
  at: P;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  cls?: string;
  rotate?: number;
}) {
  return (
    <text
      className={cls}
      x={n(at[0])}
      y={n(at[1])}
      textAnchor={anchor}
      transform={rotate ? `rotate(${rotate} ${n(at[0])} ${n(at[1])})` : undefined}
    >
      {children}
    </text>
  );
}

/**
 * A dimension between two points on the ink. Extension lines leave a 3 u gap at
 * the ink and run 8 u past the dimension line; arrows land on the extension lines.
 * `offset` moves the dimension line along the normal of a → b (positive = left of a→b).
 */
export function Dim({
  a,
  b,
  offset,
  label,
  labelAt = 0.5,
  labelDy = -5,
  anchor = 'middle',
  outside = false,
}: {
  a: P;
  b: P;
  offset: number;
  label: ReactNode;
  labelAt?: number;
  labelDy?: number;
  anchor?: 'start' | 'middle' | 'end';
  outside?: boolean;
}) {
  const [ux, uy] = unit(a, b);
  const nx = uy;
  const ny = -ux;
  const s = Math.sign(offset) || 1;
  const a1: P = [a[0] + nx * offset, a[1] + ny * offset];
  const b1: P = [b[0] + nx * offset, b[1] + ny * offset];
  const gap = 3 * s;
  const over = 8 * s;
  const ea0: P = [a[0] + nx * gap, a[1] + ny * gap];
  const ea1: P = [a1[0] + nx * over, a1[1] + ny * over];
  const eb0: P = [b[0] + nx * gap, b[1] + ny * gap];
  const eb1: P = [b1[0] + nx * over, b1[1] + ny * over];
  const L = Math.hypot(b1[0] - a1[0], b1[1] - a1[1]);
  const lp: P = [a1[0] + (b1[0] - a1[0]) * labelAt, a1[1] + (b1[1] - a1[1]) * labelAt];
  const horizontal = Math.abs(uy) < 0.2;
  return (
    <g className="dim">
      {offset !== 0 && (
        <>
          <Seg a={ea0} b={ea1} ext />
          <Seg a={eb0} b={eb1} ext />
        </>
      )}
      {outside || L < 30 ? (
        <>
          <Seg a={[a1[0] - ux * 18, a1[1] - uy * 18]} b={a1} />
          <Seg a={[b1[0] + ux * 18, b1[1] + uy * 18]} b={b1} />
          <Arrow tip={a1} from={[a1[0] - ux * 18, a1[1] - uy * 18]} />
          <Arrow tip={b1} from={[b1[0] + ux * 18, b1[1] + uy * 18]} />
          <Seg a={a1} b={b1} />
        </>
      ) : (
        <>
          <Seg a={a1} b={b1} />
          <Arrow tip={a1} from={b1} />
          <Arrow tip={b1} from={a1} />
        </>
      )}
      <Label
        at={
          horizontal
            ? [lp[0], lp[1] + labelDy]
            : [lp[0] + (anchor === 'start' ? 6 : anchor === 'end' ? -6 : 0), lp[1] + 4]
        }
        anchor={anchor}
      >
        {label}
      </Label>
    </g>
  );
}

/** Octilinear leader: one 45°/90° leg, then a 16 u shoulder to the label. Ends on the ink with a dot or an arrow. */
export function Leader({
  at,
  elbow,
  dir = 1,
  label,
  end = 'dot',
}: {
  at: P;
  elbow: P;
  dir?: 1 | -1;
  label: ReactNode;
  end?: 'dot' | 'arrow';
}) {
  const shoulder: P = [elbow[0] + 16 * dir, elbow[1]];
  return (
    <g className="leader">
      <Seg a={elbow} b={at} />
      <Seg a={elbow} b={shoulder} />
      {end === 'dot' ? <Dot at={at} /> : <Arrow tip={at} from={elbow} />}
      <Label at={[shoulder[0] + 4 * dir, shoulder[1] + 4]} anchor={dir === 1 ? 'start' : 'end'}>
        {label}
      </Label>
    </g>
  );
}

/** The one selection: a box 6 u outside the ink, four 7 u handles, a tag under it. */
export function Selection({
  box,
  tag,
  tagAbove = false,
}: {
  box: readonly [number, number, number, number];
  tag: ReactNode;
  tagAbove?: boolean;
}) {
  const [x, y, w, h] = box;
  const pad = 6;
  const X = Math.round(x - pad) + 0.5;
  const Y = Math.round(y - pad) + 0.5;
  const W = Math.round(w + pad * 2);
  const H = Math.round(h + pad * 2);
  const corners: P[] = [
    [X, Y],
    [X + W, Y],
    [X + W, Y + H],
    [X, Y + H],
  ];
  return (
    <g className="selection">
      <rect
        className="rub"
        x={X}
        y={Y}
        width={W}
        height={H}
        fill="none"
        vectorEffect="non-scaling-stroke"
        data-free=""
      />
      {corners.map(([cx, cy]) => (
        <rect
          key={`${cx}-${cy}`}
          data-knockout=""
          data-end=""
          className="handle"
          x={cx - 3.5}
          y={cy - 3.5}
          width={7}
          height={7}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <Label at={[X + W / 2, tagAbove ? Y - 8 : Y + H + 18]} anchor="middle">
        {tag}
      </Label>
    </g>
  );
}

/** A key letter (A–H) on a part, in the rubric, in Fell capitals. */
export const KeyLetter = ({ at, children }: { at: P; children: ReactNode }) => (
  <text className="key-letter" x={n(at[0])} y={n(at[1])} textAnchor="middle">
    {children}
  </text>
);

/** Register crosses at two opposite corners: the line was printed in a second pass. */
export function Register({ w, h }: { w: number; h: number }) {
  const cross = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <Seg a={[x - 7, y]} b={[x + 7, y]} free />
      <Seg a={[x, y - 7]} b={[x, y + 7]} free />
      <circle
        className="rub"
        cx={x}
        cy={y}
        r={3.5}
        fill="none"
        vectorEffect="non-scaling-stroke"
        data-free=""
      />
    </g>
  );
  return <g className="register">{[cross(14, 14), cross(w - 14, h - 14)]}</g>;
}
