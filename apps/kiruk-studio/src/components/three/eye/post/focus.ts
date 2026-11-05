/**
 * The macro lens's depth of field, built for this one shot and cheap.
 *
 * three's DepthOfFieldNode (a 64-tap near/far gather) cost ~10 ms a frame
 * here; this does what the shot needs for a fraction of that:
 *
 *   1. half resolution: the colour, with its signed circle of confusion in
 *      alpha (+ in front of the focal plane, − behind, ±1 fully soft);
 *   2. a 9-tap gather across, then down, still at half resolution. A tap
 *      counts only if its own blur reaches the pixel being gathered, so a
 *      soft lash in front spills over the sharp iris behind it (as a near
 *      field does), while the sharp iris never smears into the soft face;
 *      alpha carries how blurred each pixel ends up;
 *   3. the lens pass mixes the sharp frame and this by that amount
 *      (`focusedAt`), full resolution.
 *
 * Focus distance and how fast things go soft are uniforms (U.cam), so the
 * rack focus and the era's aperture never recompile anything.
 */

import { HalfFloatType } from 'three/webgpu';
import { type N, T } from '../nodes/tsl';
import type { EyeUniforms } from '../uniforms';

const { Fn, abs, clamp, max, mix, rtt, screenSize, smoothstep, uv, vec2, vec4 } = T;

const TAPS = 4; // each side of the centre: 9 taps

export interface MacroFocus {
  /** The scene at a UV, through the lens: sharp where in focus, soft elsewhere. */
  focusedAt: (uv: N) => N;
  dispose: () => void;
}

/**
 * @param color the scene's colour (a pass texture node)
 * @param viewZ the scene's view-space depth (negative in front of the camera)
 */
export function macroFocus(Ux: EyeUniforms, color: N, viewZ: N): MacroFocus {
  const U: N = Ux;
  const opts = { type: HalfFloatType, resolutionScale: 0.5 };

  // 1. colour and signed circle of confusion, half resolution
  const coc = clamp(U.cam.focus.sub(viewZ.negate()).div(U.cam.focal), -1, 1);
  const half: N = rtt(vec4(color.rgb, coc), null, null, opts);

  // the widest blur, in half-resolution pixels: the bokeh is given per 720 px of height
  const reach = U.cam.bokeh.mul(screenSize.y.div(720)).mul(0.5);

  const gather = (src: N, dir: N) =>
    Fn(() => {
      const at = uv();
      const px = dir.div(screenSize.mul(0.5));
      const centre = src.sample(at);
      const sum = vec4(centre.rgb, 1).toVar();
      const spread = abs(centre.a).toVar();
      for (let i = -TAPS; i <= TAPS; i++) {
        if (i === 0) continue;
        const off = Math.abs(i) / TAPS;
        const s = src.sample(at.add(px.mul(reach).mul(i / TAPS)));
        // the tap's own blur must reach this far
        const w = smoothstep(off - 0.25, off, abs(s.a));
        sum.addAssign(vec4(s.rgb.mul(w), w));
        // a soft thing in front widens what lands here
        spread.assign(max(spread, max(s.a, 0).mul(w)));
      }
      return vec4(sum.rgb.div(sum.a), spread);
    })();

  // 2. across, then down
  const across: N = rtt(gather(half, vec2(1, 0)), null, null, opts);
  const down: N = rtt(gather(across, vec2(0, 1)), null, null, opts);

  return {
    focusedAt(at: N) {
      const sharp = color.sample(at);
      const soft = down.sample(at);
      return mix(sharp.rgb, soft.rgb, smoothstep(0.06, 0.4, soft.a));
    },
    dispose() {
      half.renderTarget?.dispose();
      across.renderTarget?.dispose();
      down.renderTarget?.dispose();
    },
  };
}
