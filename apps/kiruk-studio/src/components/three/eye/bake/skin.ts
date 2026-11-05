/**
 * The skin around the eye, baked once: laid out on the lid mesh's own
 * coordinates (across: around the eye, from the inner corner along the upper
 * margin and back along the lower; down: out from the margin), so pores and
 * lines sit on the skin and stretch with it when the lid closes.
 *
 *   R  pores            — small cells, a quarter millimetre apart
 *   G  lid lines        — fine wrinkles running with the margin
 *   B  wobble           — how the lid's fine creases waver (÷3)
 *   A  broken           — where those creases run and where they stop
 *
 * (Crow's feet and the skin's mottle are laid across the face in the lid
 * shader instead: the mesh fans out round the corners and far from the eye.)
 *
 * Around the eye is periodic, so the noise takes it as a point on a circle.
 */

import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  RepeatWrapping,
  type WebGPURenderer,
} from 'three/webgpu';
import { smoothstepDown, vnoise } from '../nodes/common';
import { QI, REACH, sideFromAlpha } from '../nodes/lid-mesh';
import { T } from '../nodes/tsl';

const {
  Fn,
  TWO_PI,
  abs,
  clamp,
  cos,
  float,
  fract,
  mx_noise_float,
  mx_worley_noise_float,
  pow,
  sin,
  smoothstep,
  uv,
  vec2,
  vec3,
  vec4,
} = T;

export interface SkinBake {
  target: RenderTarget;
  quad: QuadMesh;
  /** Renders once; later calls do nothing. */
  render: (renderer: WebGPURenderer) => boolean;
  /**
   * Bakes again on the next `render`. On WebGPU the stage's first frames
   * build pipelines asynchronously and skip any draw not ready yet, which
   * includes a bake's one draw; the stage redoes every bake once it is warm.
   */
  redo: () => void;
  dispose: () => void;
}

export function createSkinBake(width = 2048, height = 256): SkinBake {
  const target = new RenderTarget(width, height, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  target.texture.wrapS = RepeatWrapping;
  target.texture.name = 'SkinDetail';

  const material = new NodeMaterial();
  material.name = 'SkinDetailBake';
  material.fragmentNode = Fn(() => {
    const a = uv().x;
    const q = uv().y;
    const ring = vec2(cos(a.mul(TWO_PI)), sin(a.mul(TWO_PI))).toVar();

    const pores = smoothstepDown(0.22, 0.05, mx_worley_noise_float(vec3(ring.mul(60), q.mul(70))));
    const lidLines = pow(
      float(1).sub(abs(mx_noise_float(vec3(ring.mul(5), q.mul(130)).add(7.3)))),
      10,
    );
    // the lid shader's own coordinates at this texel: side along the margin, mm out from it
    const s = sideFromAlpha(fract(a));
    const d = pow(clamp(q.sub(QI).div(1 - QI), 0, 1), 1.6).mul(REACH);
    const wob = vnoise(vec2(s.mul(9), d.mul(0.7)));
    const broken = smoothstep(0.35, 0.7, vnoise(vec2(s.mul(14), d.mul(1.5)).add(5.3)));
    return vec4(clamp(pores, 0, 1), clamp(lidLines, 0, 1), wob, broken);
  })();
  material.depthTest = false;
  material.depthWrite = false;
  const quad = new QuadMesh(material);
  let done = false;

  return {
    target,
    quad,
    redo() {
      done = false;
    },
    render(renderer) {
      if (done) return false;
      done = true;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      quad.render(renderer);
      renderer.setRenderTarget(prev);
      return true;
    },
    dispose() {
      target.dispose();
      material.dispose();
    },
  };
}
