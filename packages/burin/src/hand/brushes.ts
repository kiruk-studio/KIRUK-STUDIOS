/// <reference path="./p5-brush.d.ts" />
/**
 * kiruk's brush box for p5.brush: the tools of an old drawing, not a digital set.
 *
 *   k-quill      iron-gall from a cut quill: fine, crisp, a little grain where it runs dry
 *   k-hatch      the same quill, lighter in the hand, for hatching ("hash strokes")
 *   k-reed       a reed pen: broader, drier, the stroke breaks on the tooth
 *   k-sanguine   red chalk on its point: grainy, catches the paper
 *   k-side       red chalk laid on its side, for massing a shadow
 *   k-white      lead white with a dry brush, for heightening
 *   k-silver     a metal point: hair-fine, grey, hard
 *
 * Weights are for a figure drawn at 60 CSS px per unit; `useBrushes` scales them to the
 * figure's real size (p5.brush's scaleBrushes compounds, so the scale is tracked here).
 *
 * spec-link: ideas/studio-dawn/hand.md
 */
import * as brush from 'p5.brush/standalone';

type Params = Parameters<typeof brush.add>[1];

export const BRUSHES: Record<string, Params> = {
  'k-quill': {
    type: 'default',
    weight: 0.3,
    scatter: 0.1,
    sharpness: 0.88,
    grain: 0.75,
    opacity: 185,
    spacing: 0.08,
    pressure: [1.05, 0.95],
    noise: 0.35,
  },
  'k-hatch': {
    type: 'default',
    weight: 0.4,
    scatter: 0.1,
    sharpness: 0.86,
    grain: 0.75,
    opacity: 205,
    spacing: 0.08,
    pressure: [1.05, 0.95],
    noise: 0.45,
  },
  'k-reed': {
    type: 'default',
    weight: 0.5,
    scatter: 0.22,
    sharpness: 0.62,
    grain: 1.2,
    opacity: 150,
    spacing: 0.07,
    pressure: [1.1, 0.9],
    noise: 0.5,
  },
  'k-sanguine': {
    type: 'default',
    weight: 0.55,
    scatter: 1.1,
    sharpness: 0.74,
    grain: 1.8,
    opacity: 190,
    spacing: 0.06,
    pressure: [1.1, 0.9],
    rotate: 'natural',
    noise: 0.8,
  },
  'k-side': {
    type: 'default',
    weight: 0.7,
    scatter: 4,
    sharpness: 0.9,
    grain: 1,
    opacity: 26,
    spacing: 0.03,
    pressure: { mode: 'gaussian', curve: [0.4, 0.05], min_max: [1.09, 0.93] },
    rotate: 'natural',
    noise: 1,
  },
  'k-white': {
    type: 'default',
    weight: 0.55,
    scatter: 0.6,
    sharpness: 0.6,
    grain: 1.7,
    opacity: 115,
    spacing: 0.05,
    pressure: [1.1, 0.85],
    noise: 0.7,
  },
  'k-silver': {
    type: 'default',
    weight: 0.12,
    scatter: 0.06,
    sharpness: 0.95,
    grain: 0.6,
    opacity: 120,
    spacing: 0.08,
    pressure: [1, 1],
    noise: 0.2,
  },
};

let registered = false;
let scaled = 1;

/** Register the box once, then keep every brush (p5.brush's too) at `scale` × its base size. */
export function useBrushes(scale: number) {
  if (!registered) {
    // p5.brush keeps (and mutates) the params it is given: hand it copies.
    for (const [name, p] of Object.entries(BRUSHES)) brush.add(name, { ...p });
    registered = true;
  }
  const k = Math.max(0.25, scale);
  if (Math.abs(k / scaled - 1) > 1e-6) {
    brush.scaleBrushes(k / scaled);
    scaled = k;
  }
}
