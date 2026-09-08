/**
 * EyeIris — standalone iris mark. Secondary eye-mark #1.
 *
 * spec-link: openspec/specs/brand-system/spec.md#requirement-secondary-eye-marks
 *
 * Solid iris disk with centered pupil. Used for favicons, pattern tiles,
 * tight UI contexts where full sclera is too heavy.
 */
import type * as React from 'react';

export interface EyeIrisProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  label?: string;
}

export function EyeIris({ size = 120, label = 'Kiruk iris mark', ...props }: EyeIrisProps) {
  const r = size / 2;
  const pupilR = r * 0.4;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      {...props}
    >
      <circle cx={r} cy={r} r={r} fill="var(--color-ink, #0A0A0A)" />
      <circle cx={r} cy={r} r={pupilR} fill="var(--color-paper, #FFFFFF)" />
    </svg>
  );
}

export default EyeIris;
