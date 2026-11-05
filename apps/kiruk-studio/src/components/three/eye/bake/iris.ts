/**
 * The iris, baked once per person into a polar map: across is the angle
 * around the pupil, down is the distance from the centre (0) to the root (1),
 * at the person's resting pupil.
 *
 * What is in it, from the pupil out (docs/EYE_TSL_PLAN.md §3.4):
 *  · the pupillary ruff: a dark, crenellated rim at the pupil margin;
 *  · the pupillary zone, in the inner colour;
 *  · the collarette: a raised zigzag ring a third of the way out, where the
 *    colour changes (central heterochromia lives here);
 *  · the ciliary zone, in the outer colour;
 *  · stroma: radial, wavy trabeculae, fine and coarse, pale where the stroma
 *    scatters (blue, grey) and buried where melanin covers them (brown);
 *  · crypts of Fuchs: dark holes, densest either side of the collarette;
 *  · contraction furrows: broken concentric rings in the outer ciliary zone;
 *  · freckles; the limbal ring; with age, an arcus.
 *
 * Two outputs: albedo + height (relief, for parallax and shading), and masks
 * (furrows, crypts, fibres) that the runtime deepens as the pupil opens.
 * Two sets, A and B, so an era change can crossfade one person into the next.
 *
 * MaterialX noise in polar space is seamless: the angle enters the noise as
 * a point on a circle, never as a number that wraps.
 */

import {
  Color,
  LinearFilter,
  LinearMipmapLinearFilter,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  RepeatWrapping,
  Vector3,
  type WebGPURenderer,
} from 'three/webgpu';
import type { EyeIdentity } from '../identity';
import { smoothstepDown } from '../nodes/common';
import { type N, T } from '../nodes/tsl';
import { seedOffset } from './vessels';

const {
  Fn,
  TWO_PI,
  abs,
  clamp,
  cos,
  exp,
  float,
  max,
  mix,
  mx_noise_float,
  mx_worley_noise_float,
  pow,
  sin,
  smoothstep,
  step,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} = T;

export interface IrisSet {
  /** rgb albedo, a height (0.5 = the stroma's mean surface) */
  albedo: RenderTarget;
  /** r furrows, g crypts, b fibres */
  masks: RenderTarget;
}

export interface IrisBake {
  sets: [IrisSet, IrisSet];
  /** Bakes this person into a set on the next `render`. */
  request: (set: 0 | 1, identity: EyeIdentity, restPupil: number) => void;
  /** Renders an owed bake; returns the set it baked, or -1. */
  render: (renderer: WebGPURenderer) => number;
  /** Bakes the last request again, into the same set, on the next `render` (see VesselBake.redo). */
  redo: () => void;
  quads: QuadMesh[];
  dispose: () => void;
}

function makeTarget(w: number, h: number, name: string) {
  const t = new RenderTarget(w, h, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  t.texture.wrapS = RepeatWrapping;
  t.texture.name = name;
  return t;
}

/** @param width angular resolution (tier.irisBake); radial is a quarter of it. */
export function createIrisBake(width: number): IrisBake {
  const height = Math.max(64, width / 4);
  const sets: [IrisSet, IrisSet] = [
    {
      albedo: makeTarget(width, height, 'IrisAlbedoA'),
      masks: makeTarget(width, height, 'IrisMasksA'),
    },
    {
      albedo: makeTarget(width, height, 'IrisAlbedoB'),
      masks: makeTarget(width, height, 'IrisMasksB'),
    },
  ];

  // the person being baked
  const P = {
    seed: uniform(new Vector3()),
    inner: uniform(new Color()),
    outer: uniform(new Color()),
    melanin: uniform(0.7),
    scatter: uniform(0.2),
    collarette: uniform(0.34),
    crypts: uniform(0.5),
    furrows: uniform(0.4),
    wave: uniform(0.5),
    freckles: uniform(0.1),
    limbal: uniform(0.7),
    arcus: uniform(0),
    rest: uniform(0.34),
  };
  const Pn: N = P;

  /** The whole iris at one texel; both outputs read from this. */
  const features = () => {
    const th = uv().x.mul(TWO_PI);
    const rho = uv().y;
    const seed = Pn.seed;
    const p0 = Pn.rest;
    // 0 at the pupil margin, 1 at the root
    const t = clamp(rho.sub(p0).div(float(1).sub(p0)), 0, 1).toVar();
    const cs = vec2(cos(th), sin(th)).toVar();

    // the fibres wander: bend the angle by a slow noise along the radius
    const bend = mx_noise_float(vec3(cs.mul(2.5), t.mul(3)).add(seed))
      .mul(Pn.wave)
      .mul(0.09);
    const cs2 = vec2(cos(th.add(bend)), sin(th.add(bend))).toVar();
    const fine = pow(float(1).sub(abs(mx_noise_float(vec3(cs2.mul(52), t.mul(2.4)).add(seed)))), 3);
    const coarse = pow(
      float(1).sub(abs(mx_noise_float(vec3(cs2.mul(17), t.mul(1.5)).add(seed.mul(1.3))))),
      6,
    );
    // threads over depth, not a carpet: most of the stroma is the dark between them
    const fib = clamp(fine.mul(0.38).add(coarse.mul(0.9)).sub(0.18), 0, 1).toVar();

    // the collarette: a zigzag ring a third of the way out
    const colR = Pn.collarette
      .add(mx_noise_float(vec3(cs.mul(3), 7).add(seed)).mul(0.05))
      .add(sin(th.mul(14).add(mx_noise_float(vec3(cs.mul(5), 3).add(seed)).mul(3))).mul(0.022))
      .toVar();
    const inner = float(1)
      .sub(smoothstep(colR.sub(0.025), colR.add(0.025), t))
      .toVar();
    const ridge = smoothstepDown(0.055, 0, abs(t.sub(colR))).toVar();

    // crypts: dark lens-shaped holes, radially elongated, near the collarette
    const cell = mx_worley_noise_float(vec3(cs.mul(10), t.mul(4.5)).add(seed.mul(1.7)));
    const nearCollarette = exp(t.sub(colR).div(0.16).pow(2).negate()).mul(0.8).add(0.2);
    const crypt = smoothstepDown(0.34, 0.14, cell)
      .mul(nearCollarette)
      .mul(smoothstep(0.04, 0.12, t))
      .mul(smoothstepDown(0.92, 0.8, t))
      .mul(Pn.crypts.mul(1.4))
      .clamp(0, 1)
      .toVar();

    // contraction furrows: broken rings in the outer ciliary zone
    const ringPhase = t.mul(5.5).add(mx_noise_float(vec3(cs.mul(4), 1).add(seed)).mul(0.35));
    const ring = smoothstepDown(0.16, 0, abs(sin(ringPhase.mul(Math.PI))))
      .mul(smoothstep(0.58, 0.7, t))
      .mul(smoothstepDown(0.97, 0.88, t))
      .mul(step(0, mx_noise_float(vec3(cs.mul(6), 9).add(seed))))
      .mul(Pn.furrows)
      .toVar();

    // the ruff at the pupil margin
    const ruff = smoothstepDown(0.06, 0, t)
      .mul(sin(th.mul(64)).mul(0.25).add(0.75))
      .toVar();
    const limb = smoothstep(0.84, 1, t).mul(Pn.limbal).toVar();
    const freckle = smoothstepDown(
      0.07,
      0.02,
      mx_worley_noise_float(vec3(cs.mul(15), t.mul(8)).add(seed.mul(2.1))),
    )
      .mul(
        step(
          mx_noise_float(vec3(cs.mul(3), 5).add(seed))
            .mul(0.5)
            .add(0.5),
          Pn.freckles,
        ),
      )
      .toVar();

    return { th, t, cs, fib, inner, ridge, crypt, ring, ruff, limb, freckle };
  };

  const albedoMaterial = new NodeMaterial();
  albedoMaterial.name = 'IrisBakeAlbedo';
  albedoMaterial.fragmentNode = Fn(() => {
    const f = features();
    const zone = mix(Pn.outer, Pn.inner, f.inner).toVar();
    // pigment drifts across the iris in slow patches
    zone.mulAssign(
      mx_noise_float(vec3(f.cs.mul(2), f.t.mul(2)).add(Pn.seed.mul(0.7)))
        .mul(0.15)
        .add(1),
    );
    // fibres: pale and scattering in a light iris, buried in a dark one
    const fibreTone = mix(zone.mul(1.45), vec3(0.72, 0.75, 0.8), Pn.scatter).toVar();
    // the depth between the fibres is darker the less pigment covers it
    const depth = zone.mul(mix(0.32, 0.62, Pn.melanin));
    const col = mix(depth, fibreTone, f.fib.mul(float(1).sub(Pn.melanin.mul(0.55)))).toVar();
    col.assign(mix(col, zone.mul(0.22), f.crypt));
    col.mulAssign(float(1).sub(f.ring.mul(0.45)));
    // the collarette is raised tissue, not a drawn line: a soft lift
    col.assign(mix(col, mix(Pn.inner, vec3(0.8, 0.72, 0.6), 0.2).mul(1.15), f.ridge.mul(0.22)));
    col.assign(mix(col, vec3(0.07, 0.04, 0.03), f.ruff.mul(0.85)));
    col.assign(mix(col, vec3(0.13, 0.07, 0.04), f.freckle.mul(0.85)));
    col.assign(mix(col, vec3(0.03, 0.03, 0.036), f.limb.mul(0.9)));
    // arcus: a grey-white ring just inside the root, with age
    col.assign(
      mix(
        col,
        vec3(0.62, 0.62, 0.6),
        smoothstep(0.88, 0.95, f.t)
          .mul(smoothstepDown(1, 0.97, f.t))
          .mul(Pn.arcus),
      ),
    );
    const h = float(0.5)
      .add(f.fib.sub(0.5).mul(0.35))
      .add(f.ridge.mul(0.25))
      .sub(f.crypt.mul(0.45))
      .sub(f.ring.mul(0.3))
      .add(f.ruff.mul(0.1));
    return vec4(clamp(col, 0, 1), clamp(h, 0, 1));
  })();
  albedoMaterial.depthTest = false;
  albedoMaterial.depthWrite = false;

  const masksMaterial = new NodeMaterial();
  masksMaterial.name = 'IrisBakeMasks';
  masksMaterial.fragmentNode = Fn(() => {
    const f = features();
    return vec4(f.ring, f.crypt, f.fib, max(f.ruff, f.limb));
  })();
  masksMaterial.depthTest = false;
  masksMaterial.depthWrite = false;

  const albedoQuad = new QuadMesh(albedoMaterial);
  const masksQuad = new QuadMesh(masksMaterial);

  let owed: { set: 0 | 1; identity: EyeIdentity; rest: number } | null = null;
  let last: { set: 0 | 1; identity: EyeIdentity; rest: number } | null = null;

  return {
    sets,
    quads: [albedoQuad, masksQuad],
    request(set, identity, restPupil) {
      owed = { set, identity, rest: restPupil };
      last = owed;
    },
    redo() {
      if (!owed && last) owed = last;
    },
    render(renderer) {
      if (!owed) return -1;
      const { set, identity, rest } = owed;
      owed = null;
      const i = identity.iris;
      seedOffset(identity.seed, P.seed.value as Vector3);
      (P.inner.value as Color).set(i.inner);
      (P.outer.value as Color).set(i.outer);
      P.melanin.value = i.melanin;
      P.scatter.value = i.scatter;
      P.collarette.value = i.collaretteR;
      P.crypts.value = i.crypts;
      P.furrows.value = i.furrows;
      P.wave.value = i.fibreWave;
      P.freckles.value = i.freckles;
      P.limbal.value = i.limbal;
      P.arcus.value = i.arcus;
      P.rest.value = rest;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(sets[set].albedo);
      albedoQuad.render(renderer);
      renderer.setRenderTarget(sets[set].masks);
      masksQuad.render(renderer);
      renderer.setRenderTarget(prev);
      return set;
    },
    dispose() {
      for (const s of sets) {
        s.albedo.dispose();
        s.masks.dispose();
      }
      albedoMaterial.dispose();
      masksMaterial.dispose();
    },
  };
}
