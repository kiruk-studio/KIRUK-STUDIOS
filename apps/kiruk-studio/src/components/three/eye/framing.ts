/**
 * The macro shot at any viewport shape: which millimetres round the globe's
 * centre are on screen, and where that puts the iris in CSS pixels.
 *
 * Three-free, so the loader's poster is placed by the same numbers the live
 * eye's camera uses, and the tap that means "go in" lands on the same iris.
 *
 * Every screen holds a box round the eye: the whole almond with the brow over
 * it, as tall as the box or as wide, whichever the window needs. A phone used
 * to push in to the eyeball and throw the corners away (era-eye-frame's crop);
 * on a phone that read as a blur of iris rather than an eye, so a phone now
 * fits the box's width and shows the face above and below the eye instead.
 */

import { EYE_IRIS_R } from '@/lib/era-eye-frame';
import { MM_PER_UNIT } from './anatomy';

/** A shot, mm round the globe's centre. */
export interface FrameBox {
  halfW: number;
  top: number;
  bottom: number;
}

/**
 * What a wide screen frames: the whole brow with a little forehead above it,
 * the lower lid's bulge and lashes below, and the corners with some face to
 * each side. The shot fits this box whatever the window's shape, so the brow
 * never leaves the frame.
 */
export const FRAME_BOX: FrameBox = { halfW: 16, top: 12, bottom: -10 };

/**
 * A phone: the same width, so the whole almond spans the screen with a little
 * skin past each corner. The box reaches further down, which lifts the eye a
 * little above the middle of a tall screen, where a portrait's eye rests.
 */
const PHONE_BOX: FrameBox = { halfW: 16, top: 12, bottom: -16 };

/** Aspects over which the phone's box hands over to the wide screen's. */
const PHONE_UNTIL = 0.75;
const WIDE_FROM = 1.1;

function boxFor(aspect: number): FrameBox {
  const t = Math.min(1, Math.max(0, (aspect - PHONE_UNTIL) / (WIDE_FROM - PHONE_UNTIL)));
  const s = t * t * (3 - 2 * t);
  return {
    halfW: PHONE_BOX.halfW + (FRAME_BOX.halfW - PHONE_BOX.halfW) * s,
    top: PHONE_BOX.top + (FRAME_BOX.top - PHONE_BOX.top) * s,
    bottom: PHONE_BOX.bottom + (FRAME_BOX.bottom - PHONE_BOX.bottom) * s,
  };
}

export interface EyeShot {
  /** Viewport aspect, width over height. */
  aspect: number;
  /** Eye units spanned by the viewport's height. */
  span: number;
  /** How far above the eye the camera looks, eye units. */
  offsetY: number;
  /** Eye centre as a fraction of viewport height, from the top. */
  centerY: number;
  /** Eye centre, CSS px. */
  cx: number;
  cy: number;
  /** Iris radius, CSS px. */
  irisPx: number;
}

/**
 * @param box a shot of the caller's own (the lab's); by default a phone's or
 *            a wide screen's, blended by the window's shape.
 */
export function eyeShot(w: number, h: number, box?: FrameBox): EyeShot {
  const width = Math.max(w, 1);
  const height = Math.max(h, 1);
  const aspect = width / height;
  const B = box ?? boxFor(aspect);
  const span = Math.max(B.top - B.bottom, (B.halfW * 2) / aspect) / MM_PER_UNIT;
  // the frame's middle on the box's middle
  const offsetY = -((B.top + B.bottom) / 2) / MM_PER_UNIT;
  const centerY = 0.5 - offsetY / span;
  return {
    aspect,
    span,
    offsetY,
    centerY,
    cx: width / 2,
    cy: centerY * height,
    irisPx: (EYE_IRIS_R / span) * height,
  };
}
