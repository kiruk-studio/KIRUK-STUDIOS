/**
 * The white of the eye, baked: vessels and mottling, once per person.
 *
 * Two depths of vessel, because the eye has two: the conjunctival ones ride
 * on the surface, fine and sharp, and the episcleral ones run deeper, thicker
 * and blurred by the tissue over them. Both thin out toward the limbus and
 * gather toward the corners, where the lids keep the white out of the light
 * and the vessels are actually visible. A low, warm mottling keeps the white
 * from reading as paint.
 *
 * MaterialX noise is expensive and none of this moves, so it is rendered once
 * into an equirectangular map of the globe (front of the eye at the centre)
 * and the sclera samples it by direction. Re-baked when the person changes.
 *
 *   R  episcleral (deep, coarse)   G  conjunctival (fine)   B  mottle   A  1
 */

import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  RepeatWrapping,
  Vector3,
  type WebGPURenderer,
} from 'three/webgpu';
import { ANATOMY } from '../anatomy';
import { type N, T } from '../nodes/tsl';

const {
  Fn,
  PI,
  TWO_PI,
  abs,
  acos,
  clamp,
  cos,
  float,
  max,
  mix,
  mx_fractal_noise_float,
  mx_noise_float,
  pow,
  sin,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
} = T;

export const VESSEL_W = 1024;
export const VESSEL_H = 512;

/** Angle from the visual axis to the limbus on the globe. */
const LIMBUS = Math.asin(ANATOMY.irisRadius / ANATOMY.eyeballRadius);

/** A small, stable offset into noise space from a person's seed. */
export function seedOffset(seed: number, out = new Vector3()): Vector3 {
  const r = (k: number) => {
    const x = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
    return (x - Math.floor(x)) * 97;
  };
  return out.set(r(1), r(2), r(3));
}

/** Direction on the globe for a texel of the map (front of the eye at the centre). */
function texelDirection(u: N, vTop: N): N {
  const lon = u.sub(0.5).mul(TWO_PI);
  const lat = float(0.5).sub(vTop).mul(PI);
  return vec3(sin(lon).mul(cos(lat)), sin(lat), cos(lon).mul(cos(lat)));
}

/** Where a direction on the globe lives in the map (top-left UV). */
export function vesselUv(dir: N): N {
  const { asin, atan, vec2 } = T;
  return vec2(
    atan(dir.x, dir.z).div(TWO_PI).add(0.5),
    float(0.5).sub(asin(clamp(dir.y, -1, 1)).div(PI)),
  );
}

export interface VesselBake {
  target: RenderTarget;
  /** Re-bakes for this seed on the next `render`. */
  setSeed: (seed: number) => void;
  /** Renders if a bake is owed; returns whether it did. */
  render: (renderer: WebGPURenderer) => boolean;
  /**
   * Bakes again on the next `render`. On WebGPU the stage's first frames
   * build pipelines asynchronously and skip any draw not ready yet, which
   * includes a bake's one draw; the stage redoes every bake once it is warm.
   */
  redo: () => void;
  quad: QuadMesh;
  dispose: () => void;
}

export function createVesselBake(): VesselBake {
  const target = new RenderTarget(VESSEL_W, VESSEL_H, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  target.texture.wrapS = RepeatWrapping;
  target.texture.name = 'ScleraVessels';

  const seed: N = uniform(new Vector3());

  const material = new NodeMaterial();
  material.name = 'ScleraVesselsBake';
  material.fragmentNode = Fn(() => {
    const d = texelDirection(uv().x, uv().y).toVar();
    const theta = acos(clamp(d.z, -1, 1));
    // tortuous, not straight: the vessels wander on a slow warp
    const w = d.mul(2.6).add(seed);
    const warp = vec3(
      mx_noise_float(w),
      mx_noise_float(w.add(17.1)),
      mx_noise_float(w.add(31.7)),
    ).mul(0.22);
    const q = d.add(warp).toVar();

    const coarse = pow(float(1).sub(abs(mx_noise_float(q.mul(4.2).add(seed)))), 7);
    const fineA = pow(float(1).sub(abs(mx_noise_float(q.mul(10.5).add(seed.mul(1.7))))), 24);
    const fineB = pow(float(1).sub(abs(mx_noise_float(q.mul(22).add(seed.mul(2.3))))), 34).mul(
      0.55,
    );
    // vessels come in patches, not a uniform net
    const patch = smoothstep(-0.25, 0.45, mx_noise_float(d.mul(1.8).add(seed.mul(0.5))));

    // none over the cornea, few by the limbus, most toward the corners
    const fromLimbus = smoothstep(LIMBUS + 0.06, LIMBUS + 0.75, theta);
    const corners = mix(0.45, 1, smoothstep(0.1, 0.7, abs(d.x)));
    const cover = fromLimbus.mul(corners);

    const deep = coarse.mul(cover).mul(patch.mul(0.6).add(0.4));
    const fine = max(fineA, fineB).mul(cover).mul(patch);
    const mottle = mx_fractal_noise_float(d.mul(5.5).add(seed), 3, 2, 0.5).mul(0.5).add(0.5);
    return vec4(clamp(deep, 0, 1), clamp(fine, 0, 1), clamp(mottle, 0, 1), 1);
  })();
  material.depthTest = false;
  material.depthWrite = false;
  const quad = new QuadMesh(material);

  let owed = true;
  let currentSeed = Number.NaN;

  return {
    target,
    quad,
    setSeed(next) {
      if (next === currentSeed) return;
      currentSeed = next;
      seedOffset(next, seed.value as Vector3);
      owed = true;
    },
    redo() {
      owed = true;
    },
    render(renderer) {
      if (!owed) return false;
      owed = false;
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
