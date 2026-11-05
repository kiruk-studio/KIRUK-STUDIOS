/**
 * The iris, as seen through the cornea (called from cornea.ts, which has
 * already refracted the view ray and found where it lands on the iris).
 *
 *  · Dilation is muscle, not scale. The baked map is laid out at the person's
 *    resting pupil. For the pupil the eye has now, a point's distance out from
 *    the margin is bent back to where that tissue sits at rest: opening the
 *    pupil bunches the fibres toward the root, closing it stretches them
 *    (after Pamplona et al. 2009). Furrows deepen as it opens.
 *  · Seamless polar sampling: the angle wraps, so mip levels come from
 *    explicit gradients taken off whichever of two angle measures has no seam
 *    under this pixel (Tarini's trick); the map itself repeats around.
 *  · Relief: one parallax step along the refracted ray, then one height
 *    sample toward the light for shading.
 *  · Light comes in through the cornea too. It is focused onto the far side
 *    of the iris in a bright crescent (the caustic, reference R2), and the
 *    near side sits in the shadow of the limbus.
 *  · Wobble: after a saccade the membrane lags the turn and settles.
 */

import type { RenderTarget } from 'three/webgpu';
import { ANATOMY } from '../anatomy';
import type { IrisBake, IrisSet } from '../bake/iris';
import type { EyeUniforms } from '../uniforms';
import { type N, smoothstepDown } from './common';
import { sampleScreen } from './screen';
import { T } from './tsl';

const {
  If,
  TWO_PI,
  abs,
  atan,
  clamp,
  dFdx,
  dFdy,
  dot,
  exp,
  float,
  fract,
  fwidth,
  length,
  max,
  mix,
  select,
  sin,
  smoothstep,
  texture,
  vec2,
  vec3,
  vec4,
} = T;

const RI = ANATOMY.irisRadius;

/** Where a point on the iris (mm, globe-local) sits in a set's baked map. */
function polar(xy: N, pupil: N, rest: N) {
  const rho = length(xy).div(RI).toVar();
  const tNow = clamp(rho.sub(pupil).div(float(1).sub(pupil)), 0, 1);
  // open the pupil and the tissue bunches toward the root; close it and it stretches
  const gamma = clamp(pupil.sub(rest).mul(2.2).add(1), 0.6, 2.2);
  const tRest = tNow.pow(gamma);
  const rho0 = rest.add(tRest.mul(float(1).sub(rest)));
  const u = atan(xy.y, xy.x).div(TWO_PI); // -0.5..0.5, seam at ±π
  return { rho, uv: vec2(u, rho0) };
}

/** Mip gradients with no seam: take the angle's from whichever measure is smooth here. */
function polarGrads(uv: N) {
  const u2 = fract(uv.x); // seam at 0 instead of ±π
  const ux = dFdx(uv.x);
  const ux2 = dFdx(u2);
  const uy = dFdy(uv.x);
  const uy2 = dFdy(u2);
  const gx = vec2(select(abs(ux).lessThanEqual(abs(ux2)), ux, ux2), dFdx(uv.y));
  const gy = vec2(select(abs(uy).lessThanEqual(abs(uy2)), uy, uy2), dFdy(uv.y));
  return { gx, gy };
}

export interface IrisInput {
  /** Where the refracted view ray meets the iris, globe-local mm. */
  hit: N;
  /** The refracted ray, globe-local. */
  ray: N;
  /** Direction to the screen's light, globe-local. */
  light: N;
  key: N;
  amb: N;
  /** The lids' shade at this point of the shot (lid-shape.ts socketShade). */
  socket: N;
}

export function irisShade(Ux: EyeUniforms, bake: IrisBake, screen: RenderTarget, inp: IrisInput) {
  const U: N = Ux;
  const I = U.iris;
  const pupil = U.pupil;

  // ---- wobble: the membrane lags the turn, most in the middle of the iris --
  const rhoHit = length(inp.hit.xy).div(RI);
  const mid = clamp(rhoHit.sub(pupil).div(float(1).sub(pupil)), 0, 1);
  const xy0 = inp.hit.xy.add(I.wobble.mul(mid.mul(float(1).sub(mid)).mul(4))).toVar();

  // derivatives are taken here, before any branch, on the unparallaxed point
  const pa = polar(xy0, pupil, I.restA);
  const pb = polar(xy0, pupil, I.restB);
  const ga = polarGrads(pa.uv);
  const gb = polarGrads(pb.uv);

  const wB = I.weightB;
  const sampleAlbedo = (set: IrisSet, uv: N, g: { gx: N; gy: N }) =>
    texture(set.albedo.texture, uv).grad(g.gx, g.gy);
  const sampleMasks = (set: IrisSet, uv: N, g: { gx: N; gy: N }) =>
    texture(set.masks.texture, uv).grad(g.gx, g.gy);

  /** Height at a point, crossfaded between the two people. */
  const heightAt = (xy: N) => {
    const h = float(0).toVar();
    If(wB.lessThan(0.999), () => {
      h.addAssign(
        sampleAlbedo(bake.sets[0], polar(xy, pupil, I.restA).uv, ga).a.mul(float(1).sub(wB)),
      );
    });
    If(wB.greaterThan(0.001), () => {
      h.addAssign(sampleAlbedo(bake.sets[1], polar(xy, pupil, I.restB).uv, gb).a.mul(wB));
    });
    return h;
  };

  // ---- one parallax step along the refracted ray ---------------------------
  const h0 = heightAt(xy0);
  const slide = inp.ray.xy.div(max(abs(inp.ray.z), 0.3));
  const xy = xy0.add(slide.mul(h0.sub(0.5)).mul(I.relief)).toVar();

  const albedo = vec4(0).toVar();
  const masks = vec4(0).toVar();
  If(wB.lessThan(0.999), () => {
    const uv = polar(xy, pupil, I.restA).uv;
    albedo.addAssign(sampleAlbedo(bake.sets[0], uv, ga).mul(float(1).sub(wB)));
    masks.addAssign(sampleMasks(bake.sets[0], uv, ga).mul(float(1).sub(wB)));
  });
  If(wB.greaterThan(0.001), () => {
    const uv = polar(xy, pupil, I.restB).uv;
    albedo.addAssign(sampleAlbedo(bake.sets[1], uv, gb).mul(wB));
    masks.addAssign(sampleMasks(bake.sets[1], uv, gb).mul(wB));
  });

  const rho = length(xy).div(RI).toVar();
  const radial = xy.div(max(length(xy), 1e-4)).toVar();

  // ---- relief shading: is the surface climbing toward the light here? -----
  const L2 = inp.light.xy.div(max(length(inp.light.xy), 1e-4)).toVar();
  const towardLight = heightAt(xy.add(L2.mul(0.07)));
  const relief = clamp(float(0.62).sub(towardLight.sub(albedo.a).mul(3.2)), 0.25, 1.15);

  // ---- light through the cornea --------------------------------------------
  const oblique = clamp(length(inp.light.xy), 0, 1);
  const across = dot(radial, L2);
  // focused onto the far side, in a crescent near the root
  const caustic = smoothstep(0.15, 0.85, across.negate())
    .mul(exp(rho.sub(0.78).div(0.15).pow(2).negate()))
    .mul(oblique)
    .mul(1.4);
  // the near side sits in the shadow of the limbus
  const limbShadow = smoothstep(0.1, 0.85, across)
    .mul(smoothstep(0.62, 1, rho))
    .mul(oblique);

  const diffuse = inp.amb.mul(1.4).add(inp.key.mul(relief));
  const lit = albedo.rgb
    .mul(diffuse)
    .mul(float(1).sub(limbShadow.mul(0.55)))
    .add(albedo.rgb.mul(inp.key).mul(caustic))
    .mul(inp.socket)
    .toVar();
  // opening the pupil deepens the furrows
  lit.mulAssign(
    float(1).sub(masks.r.mul(clamp(pupil.sub(mix(I.restA, I.restB, wB)).mul(2.5), 0, 0.6))),
  );

  // ---- the pupil: a hole with depth, a faint red fundus, P3 and P4 -------------
  // No pupil is a drawn circle: its margin is a little uneven, a few percent
  const ang = atan(xy.y, xy.x);
  const uneven = float(1)
    .add(sin(ang.mul(2).add(0.7)).mul(0.024))
    .add(sin(ang.mul(3).add(2.1)).mul(0.015))
    .add(sin(ang.mul(5).add(0.4)).mul(0.008));
  const pupilHere = pupil.mul(uneven).toVar();
  const into = rho.div(max(pupilHere, 1e-3)).toVar();
  const edge = fwidth(rho).add(0.003);
  const inPupil = float(1)
    .sub(smoothstep(pupilHere.sub(edge), pupilHere.add(edge), rho))
    .toVar();
  const hole = mix(vec3(0.012, 0.009, 0.01), vec3(0.002), smoothstep(0.2, 1, into)).toVar();
  hole.addAssign(
    vec3(0.09, 0.02, 0.02)
      .mul(smoothstepDown(1, 0.25, into))
      .mul(0.3),
  );
  // Purkinje P4: the back of the lens, a small, dim, upside-down image of the screen
  const p4uv = xy
    .div(max(pupil.mul(RI), 1e-3))
    .negate()
    .mul(vec2(0.26, 0.17))
    .add(vec2(0.5, 0.55));
  hole.addAssign(
    sampleScreen(screen, p4uv, 4)
      .mul(0.035)
      .mul(smoothstepDown(1, 0.1, into)),
  );
  // Purkinje P3: the front of the lens, larger, dimmer, upright, and deep.
  // Both kept blurred and faint: a legible page inside a pupil reads as a bug.
  const p3uv = xy
    .div(max(pupil.mul(RI), 1e-3))
    .mul(vec2(0.22, 0.15))
    .add(vec2(0.5, 0.5));
  hole.addAssign(
    sampleScreen(screen, p3uv, 4.5)
      .mul(0.02)
      .mul(smoothstepDown(1, 0.2, into)),
  );
  // the red reflex: a light on the camera's axis lights the fundus through the
  // pupil, brightest in the middle
  hole.addAssign(
    vec3(0.85, 0.16, 0.07)
      .mul(U.redReflex)
      .mul(smoothstepDown(1.02, 0.4, into).mul(0.6).add(0.4)),
  );
  // The margin has thickness. Seen at an angle, a sliver of its inner wall
  // shows on the far side of the hole, the side the view ray is heading to.
  const slant = length(inp.ray.xy).div(max(abs(inp.ray.z), 0.2));
  const wallW = slant.mul(0.3 / RI).mul(max(dot(radial, inp.ray.xy.normalize()), 0));
  // (edges kept apart: equal smoothstep edges are undefined, NaN on some GPUs)
  const wall = smoothstep(pupilHere.sub(wallW).sub(2e-4), pupilHere.sub(wallW.mul(0.4)), rho).mul(
    inPupil,
  );
  hole.assign(
    mix(
      hole,
      vec3(0.07, 0.04, 0.03).mul(inp.key.mul(0.5).add(inp.amb)).mul(inp.socket),
      wall.mul(0.9),
    ),
  );

  // past the root, under the rim of the cornea: tissue in shadow
  const beyond = smoothstep(0.98, 1.04, rho);
  const color = mix(mix(lit, hole, inPupil), vec3(0.022, 0.02, 0.022), beyond);
  const flat = mix(mix(albedo.rgb, vec3(0), inPupil), vec3(0.03), beyond);
  return { color, albedo: flat, rho };
}

/** The iris cone's height at a distance from the axis (anatomy.ts IRIS_Z_*). */
export function irisZ(rho: N, zRoot: number, zPupil: number): N {
  return float(zRoot).add(float(zPupil - zRoot).mul(float(1).sub(clamp(rho, 0, 1))));
}

/** Where a refracted ray from the cornea meets the iris cone: two iterations. */
export function hitIris(origin: N, ray: N, zRoot: number, zPupil: number): N {
  const dz = min0(ray.z);
  const t0 = float((zRoot + zPupil) / 2)
    .sub(origin.z)
    .div(dz);
  const h0 = origin.add(ray.mul(t0));
  const t1 = irisZ(length(h0.xy).div(RI), zRoot, zPupil).sub(origin.z).div(dz);
  return origin.add(ray.mul(t1));
}

/** Keeps a ray heading into the eye from dividing by ~0 at grazing angles. */
function min0(z: N): N {
  return select(z.lessThan(-0.05), z, float(-0.05));
}
