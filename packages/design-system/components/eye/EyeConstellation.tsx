/**
 * EyeConstellation — multi-eye pattern mark. Secondary eye-mark #4.
 *
 * spec-link: openspec/specs/brand-system/spec.md#requirement-secondary-eye-marks
 *
 * Five iris dots at constellation positions. Used for hero patterns, textile prints,
 * section dividers, and anywhere a surface needs eye density without a single focal point.
 */
import type * as React from 'react';

export interface EyeConstellationProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  label?: string;
}

// Constellation positions as [cx%, cy%, r%, color-var] tuples
const DOTS: [number, number, number, string][] = [
  [0.13, 0.44, 0.13, 'var(--color-pencil-600, #1A1A1A)'],
  [0.34, 0.16, 0.1, 'var(--color-pencil-300, #9A9A9A)'],
  [0.55, 0.56, 0.15, 'var(--color-pencil-500, #3A3A3A)'],
  [0.83, 0.27, 0.08, 'var(--color-pencil-200, #C9C9C9)'],
  [0.77, 0.68, 0.11, 'var(--color-pencil-400, #6B6B6B)'],
];

export function EyeConstellation({
  size = 320,
  label = 'Kiruk constellation mark',
  ...props
}: EyeConstellationProps) {
  const w = size;
  const h = size * 0.5;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      {...props}
    >
      {DOTS.map(([pct_x, pct_y, pct_r, fill]) => {
        const cx = pct_x * w;
        const cy = pct_y * h;
        const r = pct_r * Math.min(w, h);
        const pupilR = r * 0.38;
        return (
          <g key={`${pct_x}-${pct_y}`}>
            <circle cx={cx} cy={cy} r={r} fill={fill} />
            <circle cx={cx} cy={cy} r={pupilR} fill="var(--color-paper, #FFFFFF)" />
          </g>
        );
      })}
    </svg>
  );
}

export default EyeConstellation;
