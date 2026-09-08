/**
 * EyePortal — concentric portal rings. Secondary eye-mark #3.
 *
 * spec-link: openspec/specs/brand-system/spec.md#requirement-secondary-eye-marks
 *
 * Three rings that collapse inward — the motion motif "portal-transition" expressed
 * as a static mark. Used for loading states, between-universe transitions, call-to-action focal points.
 */
import type * as React from 'react';

export interface EyePortalProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  label?: string;
}

export function EyePortal({ size = 200, label = 'Kiruk portal mark', ...props }: EyePortalProps) {
  const r = size / 2;

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
      {/* Outer ring */}
      <circle cx={r} cy={r} r={r * 0.98} fill="var(--color-ink, #0A0A0A)" opacity={0.18} />
      {/* Mid ring */}
      <circle cx={r} cy={r} r={r * 0.68} fill="var(--color-ink, #0A0A0A)" opacity={0.45} />
      {/* Inner ring */}
      <circle cx={r} cy={r} r={r * 0.38} fill="var(--color-ink, #0A0A0A)" />
      {/* Core — void center */}
      <circle cx={r} cy={r} r={r * 0.15} fill="var(--color-paper, #FFFFFF)" />
    </svg>
  );
}

export default EyePortal;
