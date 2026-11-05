/**
 * The eye, measured. Every layer of the TSL eye reads its sizes from here, in
 * millimetres, so a cornea and the iris under it can never disagree about how
 * far apart they are. Adult averages; see docs/EYE_TSL_PLAN.md §3.
 */

import { EYE_IRIS_R } from '@/lib/era-eye-frame';

export const ANATOMY = {
  /** Eyeball radius. Axial length is about 24 mm. */
  eyeballRadius: 12,
  /** Front surface of the cornea. Steeper than the ball, so it bulges. */
  corneaRadius: 7.8,
  corneaDiameter: 11.8,
  corneaThickness: 0.55,
  /** Cornea apex to the iris, across the aqueous humour. */
  chamberDepth: 3,
  iorCornea: 1.376,
  iorAqueous: 1.336,
  irisRadius: 6,
  /** Pupil diameter in bright light and in the dark. */
  pupilMin: 2,
  pupilMax: 8,
  fissureWidth: 29,
  fissureHeight: 9.5,
} as const;

/**
 * The 2D picker measures the eye in "eye units": 1 is half the eye's width and
 * the iris radius is EYE_IRIS_R. The 3D eye keeps that scale, so the dial and
 * the tap target that means "go in" stay over the same iris.
 */
export const MM_PER_UNIT = ANATOMY.irisRadius / EYE_IRIS_R;

/**
 * The plane the framing is measured on: the iris, a little behind the cornea's
 * apex. eyeFrame's span is a height on this plane.
 */
export const FRAME_PLANE_Z = Math.sqrt(ANATOMY.eyeballRadius ** 2 - ANATOMY.irisRadius ** 2);

/** Where the cornea meets the white: half the corneal diameter. */
export const LIMBUS_RADIUS = ANATOMY.corneaDiameter / 2;

/**
 * The cornea as a cap of its own sphere, seated on the globe at the limbus.
 * Its centre of curvature sits on the visual axis, CORNEA_CENTER_Z mm in
 * front of the globe's centre; the cap spans CORNEA_CAP radians from its apex.
 */
const limbusZ = Math.sqrt(ANATOMY.eyeballRadius ** 2 - LIMBUS_RADIUS ** 2);
export const CORNEA_CENTER_Z = limbusZ - Math.sqrt(ANATOMY.corneaRadius ** 2 - LIMBUS_RADIUS ** 2);
export const CORNEA_CAP = Math.asin(LIMBUS_RADIUS / ANATOMY.corneaRadius);

/**
 * The iris is not flat: the lens pushes its pupil margin forward, so it is a
 * shallow cone, ~0.4 mm higher at the pupil than at the root. Anterior
 * chamber depth (apex to pupil margin) comes out ~3 mm.
 */
export const IRIS_Z_ROOT = 9.8;
export const IRIS_Z_PUPIL = 10.2;

/**
 * A macro lens: long and narrow, so the eye is not stretched by perspective
 * the way a wide lens at this distance would stretch it.
 */
export const CAMERA_FOV = 12;

/**
 * How far the globe turns at the ends of the gaze range, in radians. Matched
 * to how far the live eye's iris travels; a real eye goes further, but this
 * one is wandering a room, not reading a wall.
 */
export const GAZE_YAW = (24 * Math.PI) / 180;
export const GAZE_PITCH = (10 * Math.PI) / 180;
/**
 * Bell's phenomenon: under a closing lid the eye rolls up. The live eye
 * nudges its iris up a tenth of a unit on a blink; this is that, as a turn.
 */
export const BELL_PITCH = (9 * Math.PI) / 180;
