/**
 * The screen as a light, the same for every surface it falls on: its colour
 * from its own 1×1 mip (no readback), its strength from how bright the era's
 * page is, kept under 1 so the filmic curve is left for the reflections.
 * And the era's second light, if it has one (look.ts FillLight): a
 * direction and a colour already scaled by its strength (black for none).
 */

import type { RenderTarget } from 'three/webgpu';
import type { EyeUniforms } from '../uniforms';
import { screenLight } from './screen';
import { type N, T } from './tsl';

const { max, mix, vec3 } = T;

export function screenKey(Ux: EyeUniforms, screen: RenderTarget) {
  const U: N = Ux;
  const lum = U.screenLum;
  const avg = screenLight(screen).toVar();
  const hue = avg.div(max(max(avg.r, avg.g), max(avg.b, 0.001))).toVar();
  return {
    /** Direction to the screen, face space. */
    dir: U.light.dir,
    hue,
    key: mix(vec3(1), hue, 0.3).mul(lum.mul(0.25).add(0.62)).toVar(),
    amb: mix(vec3(1), hue, 0.5).mul(lum.mul(0.1).add(0.07)).toVar(),
    fillDir: U.fill.dir,
    fill: vec3(U.fill.color),
  };
}
