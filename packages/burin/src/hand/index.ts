/**
 * @kiruk/burin/hand — the eye drawn by hand, stroke by stroke, then alive.
 *
 *   pen      the stroke vocabulary: hairline to swell, tapers, flicks, chalk,
 *            hair (any subject drawn by hand starts here)
 *   strokes  the engraved eye as ordered strokes (subjects/eye/strokes.ts)
 *   ink      the pen that lays them on a 2D canvas, wet ink drying
 *   live     the drawn eye's globe turning under its lids, and its blinks
 *
 * No three.js and no DOM beyond a 2D canvas: it runs in a worker on an
 * OffscreenCanvas, and on the main thread where there is none.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md · ideas/studio-dawn/ink-strokes.md
 */
export { BLINK_LENGTH, blinkAt, Critical } from '../motion/dynamics';
export { createEyeMotion, type EyeMotion } from '../subjects/eye/motion';
export { EYE, type Pose, REST } from '../subjects/eye/rig';
export {
  EYE_PASSES,
  EYE_TIMELINE,
  type EyeDrawing,
  eyeDrawing,
  lidStrokes,
  openingOutline,
  type Pen,
  pitchFor,
  type Stroke,
  type StrokeInk,
  type StrokeLayer,
  scheduleEye,
  windowOutline,
} from '../subjects/eye/strokes';
export {
  type Clips,
  type Ctx2D,
  type InkColors,
  InkHand,
  type InkLayers,
  outlinePath,
  paintStrokes,
  traceStroke,
  WET_S,
} from './ink';
export { GAZE_RANGE, LiveEye, makeCanvas } from './live';
export {
  byAngle,
  byParam,
  byX,
  chalkWidth,
  cutWidth,
  HAIRLINE,
  Hand,
  hairWidth,
  type LayOpts,
  type Meta,
  type Shown,
  taperRuns,
  type WidthAt,
} from './pen';
