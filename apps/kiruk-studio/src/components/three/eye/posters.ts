/**
 * Posters: a still of the eye for each era, painted before any shader has
 * compiled, so the loader is never a blank room (PERF_IDENTITY, wave 1).
 *
 * A poster is captured at one of two shapes and then placed by the eye's own
 * framing rather than by object-fit: the iris in the poster lands where the
 * live eye's iris will be, at any viewport, so the crossfade does not jump.
 *
 * Pure TS: imported by the loader, the lab and the capture route alike.
 */

import { eyeShot } from './framing';

export const POSTER_VARIANTS = {
  /** Desktop and landscape: the whole almond. */
  wide: { cssW: 1600, cssH: 900, outW: 1600 },
  /** Phones: the whole almond across a tall frame. Twice a 390 × 844 phone, so it is sharp at 2×. */
  tall: { cssW: 780, cssH: 1688, outW: 780 },
} as const;

export type PosterVariant = keyof typeof POSTER_VARIANTS;

export const POSTER_DIR = '/eye/posters';

/** A still of the live eye, its era's screen and all, so the eye that fades in over it matches. */
export function posterSrc(eraId: string, variant: PosterVariant): string {
  return `${POSTER_DIR}/${eraId}-${variant}.avif`;
}

/** The capture closest in shape to this viewport. */
export function posterVariantFor(w: number, h: number): PosterVariant {
  return w / Math.max(h, 1) < 0.9 ? 'tall' : 'wide';
}

export interface PosterPlacement {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where to put a poster so its eye sits on the live eye: same pixels per eye
 * unit, same eye centre. The poster may not cover the whole viewport at an
 * odd shape; the room behind it is the same near-black, and the edges of every
 * poster are already vignetted down to it.
 */
export function posterPlacement(w: number, h: number, variant: PosterVariant): PosterPlacement {
  const v = POSTER_VARIANTS[variant];
  const at = eyeShot(v.cssW, v.cssH);
  const here = eyeShot(w, h);
  const scale = h / here.span / (v.cssH / at.span);
  const width = v.cssW * scale;
  const height = v.cssH * scale;
  return {
    left: w / 2 - width / 2,
    top: here.cy - at.centerY * v.cssH * scale,
    width,
    height,
  };
}
