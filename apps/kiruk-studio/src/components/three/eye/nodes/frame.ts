/**
 * Screen space, in the eye's own units (era-eye-frame): 1 is half the live
 * eye's width, the iris radius is EYE_IRIS_R, and the framing (span, offset)
 * is the one the dial and the tap target use. The room, the placeholder lids
 * and the sclera's lid shadows all measure from here, so they line up with
 * each other and with the live eye at any viewport.
 */

import type { EyeUniforms } from '../uniforms';
import { type N, T } from './tsl';

const { float, screenSize, screenUV, vec2 } = T;

/** The GLSL's vUv: screen UV measured from the bottom. */
export function vUvUp(): N {
  return vec2(screenUV.x, float(1).sub(screenUV.y));
}

/** This fragment's position in eye units, origin at the eye's centre, y up. */
export function eyeSpace(U: EyeUniforms): N {
  const span: N = U.span;
  const offsetY: N = U.offsetY;
  const aspect = screenSize.x.div(screenSize.y);
  return vUvUp().sub(0.5).mul(vec2(aspect, 1)).mul(span).sub(vec2(0, offsetY));
}

/** One device pixel, in eye units: the anti-aliasing width. */
export function pixelUnit(U: EyeUniforms): N {
  const span: N = U.span;
  return span.div(screenSize.y);
}
