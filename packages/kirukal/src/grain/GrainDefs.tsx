// eye-motif: none — justified: paper substrate, carries no mark. See packages/kirukal/README.md#eye-motif
/**
 * The paper ground. Mount ONCE per document.
 *
 * LAW: grain lives on the paper, not on the stroke.
 *
 * feTurbulence is expensive enough to max out CPU cores, and an element that
 * both filters and transforms re-runs the whole filter every frame instead of
 * compositing a cached layer. So there is exactly one filter in a kiruk page,
 * on a rect that never moves. Strokes get no filter at all.
 *
 * That is also the more faithful choice: a paper texture *behind* the stroke
 * makes the eye read the tooth as belonging to the paper, where real graphite
 * grain actually comes from, rather than as noise painted onto the line.
 *
 * spec-link: packages/kirukal/README.md#the-six-laws
 */
import type { JSX } from 'react';

export interface GrainDefsProps {
  /**
   * Tooth size. Fixed in device pixels on purpose — paper grain is a property of
   * the paper, so it must not change when a component resizes.
   */
  readonly baseFrequency?: number;
  readonly octaves?: number;
  /** How much the tooth darkens the ground. Keep low; graphite is subtle. */
  readonly opacity?: number;
}

export const KIRUKAL_PAPER_FILTER_ID = 'kirukal-paper';

export function GrainDefs({
  baseFrequency = 0.8,
  octaves = 4,
  opacity = 0.055,
}: GrainDefsProps): JSX.Element {
  return (
    <svg aria-hidden="true" focusable="false" width={0} height={0} style={{ position: 'absolute' }}>
      <defs>
        <filter id={KIRUKAL_PAPER_FILTER_ID} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={octaves}
            stitchTiles="stitch"
            result="tooth"
          />
          <feColorMatrix
            in="tooth"
            type="matrix"
            values={`0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 ${opacity} 0`}
          />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * The ground itself. Render once, behind everything.
 *
 * Must never be transformed or animated — that is what keeps the filter on a
 * cached layer instead of recomputing per frame.
 */
export function PaperGround(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        filter: `url(#${KIRUKAL_PAPER_FILTER_ID})`,
        background: 'var(--color-bg, #fff)',
      }}
    />
  );
}

export default GrainDefs;
