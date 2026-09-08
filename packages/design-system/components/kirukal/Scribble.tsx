/**
 * Scribble — Kirukal mark. The "raw origin" component.
 *
 * spec-link: openspec/specs/brand-system/spec.md
 *
 * A deliberately rough, hand-drawn-looking SVG path. Represents the studio's
 * core belief: every world starts from kirukal (scribble). Used in loading states,
 * hero backgrounds, section separators, and anywhere the "in-progress" energy matters.
 */
import type * as React from 'react';

export interface ScribbleProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  label?: string;
  /** Stroke color. Defaults to CSS var --color-ink. */
  color?: string;
  /** Stroke width. Defaults to 3. */
  strokeWidth?: number;
}

export function Scribble({
  size = 240,
  label = 'Kiruk scribble mark',
  color,
  strokeWidth = 3,
  ...props
}: ScribbleProps) {
  const w = size;
  const h = size * 0.5;

  // A freehand-feeling path: jittered lines that don't repeat and don't resolve neatly.
  const path = `
    M ${w * 0.04} ${h * 0.75}
    C ${w * 0.14} ${h * 0.1}, ${w * 0.24} ${h * 0.6}, ${w * 0.3} ${h * 0.35}
    S ${w * 0.44} ${h * 0.05}, ${w * 0.5} ${h * 0.25}
    S ${w * 0.64} ${h * 0.7}, ${w * 0.73} ${h * 0.45}
    L ${w * 0.82} ${h * 0.2}
    M ${w * 0.1} ${h * 0.88}
    L ${w * 0.22} ${h * 0.6}
    M ${w * 0.36} ${h * 0.82}
    C ${w * 0.44} ${h * 0.55}, ${w * 0.58} ${h * 0.9}, ${w * 0.68} ${h * 0.65}
  `;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      role="img"
      aria-label={label}
      {...props}
    >
      <path
        d={path}
        stroke={color ?? 'var(--color-ink, #0A0A0A)'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Scribble;
