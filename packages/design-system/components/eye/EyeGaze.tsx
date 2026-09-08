/**
 * EyeGaze — horizontal almond-lid gaze. Secondary eye-mark #2.
 *
 * spec-link: openspec/specs/brand-system/spec.md#requirement-secondary-eye-marks
 *
 * The iris sits right-weighted as if tracking something. Communicates
 * attention, focus, creative anticipation.
 */
import type * as React from 'react';

export interface EyeGazeProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  label?: string;
}

export function EyeGaze({ size = 160, label = 'Kiruk gaze mark', ...props }: EyeGazeProps) {
  const w = size;
  const h = size * 0.625; // almond proportions
  const cx = w / 2;
  const cy = h / 2;
  // almond lid path: pointed at both ends, fat in the middle
  const lidPath = `M 0 ${cy} Q ${cx * 0.4} 0 ${cx} ${cy * 0.2} Q ${w * 0.7} 0 ${w} ${cy} Q ${w * 0.7} ${h} ${cx} ${h * 0.8} Q ${cx * 0.4} ${h} 0 ${cy}Z`;
  // iris positioned right-of-center (gaze direction)
  const irisX = cx + w * 0.12;
  const irisR = h * 0.35;
  const pupilR = irisR * 0.45;

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
      {/* Sclera lid */}
      <path d={lidPath} fill="var(--color-paper, #FFFFFF)" />
      {/* Iris */}
      <circle cx={irisX} cy={cy} r={irisR} fill="var(--color-ink, #0A0A0A)" />
      {/* Pupil */}
      <circle cx={irisX} cy={cy} r={pupilR} fill="var(--color-paper, #FFFFFF)" />
    </svg>
  );
}

export default EyeGaze;
