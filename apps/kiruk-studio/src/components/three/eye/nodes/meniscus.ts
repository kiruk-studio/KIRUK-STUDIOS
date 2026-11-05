/**
 * The tear meniscus: the bead of fluid, a quarter of a millimetre, that lies
 * in the corner where each lid meets the globe, all along both margins.
 *
 * One strip, built in the vertex stage on the lid mesh's own columns
 * (lid-mesh.ts), so it rides every blink, gaze and squint. Across the strip,
 * v runs from the globe a bead's width into the aperture, through the corner
 * where the lid touches the globe, up the margin's inner face: a quadratic
 * curve with its control point in that corner, so the surface is concave,
 * the way fluid fills a corner.
 *
 * It draws only what fluid adds: the screen, mirrored in a surface whose
 * normal sweeps from the globe's to the lid's, so somewhere across it the
 * bead catches the screen as a thin bright line. The lower one faces up into
 * the light and shines; the upper one faces down and mostly doesn't, as in
 * every photograph. Added over what is beneath.
 *
 * The bead is wider at the inner corner (the lacrimal lake), swells and
 * brightens just after a blink, and more with reflex tears.
 */

import {
  AdditiveBlending,
  DoubleSide,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  type RenderTarget,
} from 'three/webgpu';
import { ANATOMY } from '../anatomy';
import type { EyeUniforms } from '../uniforms';
import { inPanel, type N, smoothstepDown } from './common';
import { innerAt, type LidColumn, lidColumn, outwardAt, sideFromAlpha } from './lid-mesh';
import { sampleScreen } from './screen';
import { T } from './tsl';

const {
  Fn,
  abs,
  cameraPosition,
  cross,
  dot,
  float,
  fract,
  max,
  min,
  mix,
  mrt,
  normalize,
  positionWorld,
  pow,
  reflect,
  select,
  smoothstep,
  sqrt,
  step,
  uv,
  varyingProperty,
  vec2,
  vec3,
  vec4,
} = T;

const R = ANATOMY.eyeballRadius;

export function meniscusGeometry() {
  return new PlaneGeometry(1, 1, 320, 6);
}

/** A point of the bead, face space (mm): column `c`, v across (globe → corner → lid). */
function beadPoint(c: LidColumn, v: N, Ux: EyeUniforms): N {
  const U: N = Ux;
  // wider by the inner corner, where tears pool in the lacrimal lake
  const lake = smoothstep(0.6, 1, c.s.negate()).mul(1.6).add(1);
  const w = U.tear.meniscus.mul(lake).toVar();
  // where the lid touches the globe, and a little way up its inner face
  const corner = innerAt(c, float(1), Ux).toVar();
  // (a short way up: the lower lid's inner face is wide now, and the bead is a thread)
  const onLid = innerAt(c, float(0.9), Ux);
  // on the globe, a bead's width into the aperture
  const gxy = corner.xy.sub(c.n2.mul(w));
  const onGlobe = vec3(gxy, sqrt(max(float(R * R).sub(dot(gxy, gxy)), 0)).add(0.04));
  // lift the corner off the surfaces a hair, so the fluid stands in front of both
  const k = corner.add(normalize(corner).mul(0.03));
  const a = float(1).sub(v);
  return onGlobe
    .mul(a.mul(a))
    .add(k.mul(v.mul(a).mul(2)))
    .add(onLid.mul(v.mul(v)))
    .toVar();
}

export function meniscusMaterial(Ux: EyeUniforms, screen: RenderTarget, emissive: boolean) {
  const U: N = Ux;
  const material = new MeshBasicNodeMaterial();
  material.name = 'Meniscus';

  const vNormal = varyingProperty('vec3', 'vBeadNormal');
  const vV = varyingProperty('float', 'vBeadV');
  const vLower = varyingProperty('float', 'vBeadLower');
  const vSide = varyingProperty('float', 'vBeadSide');

  material.positionNode = Fn(() => {
    const a = uv().x;
    const v = uv().y;
    const side = sideFromAlpha(fract(a)).toVar();
    const bisector = outwardAt(select(side.lessThan(0), float(0), float(0.5)), Ux);
    const col = lidColumn(a, bisector, Ux);
    const colA = lidColumn(a.add(0.002), bisector, Ux);
    const P = beadPoint(col, v, Ux);
    const along = beadPoint(colA, v, Ux).sub(P);
    const across = beadPoint(col, min(v.add(0.05), 1), Ux).sub(
      beadPoint(col, max(v.sub(0.05), 0), Ux),
    );
    const n0 = normalize(cross(along, across)).toVar();
    // out of the fluid: away from the corner it fills
    const corner = innerAt(col, float(1), Ux);
    const away = beadPoint(col, float(0.5), Ux).sub(corner);
    vNormal.assign(select(dot(n0, away).lessThan(0), n0.negate(), n0));
    vV.assign(v);
    vLower.assign(select(col.upper, float(0), float(1)));
    vSide.assign(col.s);
    return P;
  })();

  const bead = Fn(() => {
    const N_ = normalize(vNormal);
    const V = cameraPosition.sub(positionWorld).normalize();
    // the screen, mirrored in the bead
    const Rr = reflect(V.negate(), N_);
    const Nn = U.light.normal;
    const denom = dot(Rr, Nn);
    const tHit = dot(U.light.center.sub(positionWorld), Nn).div(min(denom, -0.02));
    const h = positionWorld.add(Rr.mul(tHit)).sub(U.light.center);
    const suv = vec2(
      dot(h, U.light.right).div(U.light.size.x).add(0.5),
      dot(h, U.light.up).div(U.light.size.y).add(0.5),
    );
    const mirror = sampleScreen(screen, suv, float(1.5).add(U.mip))
      .mul(inPanel(suv, 0.06))
      .mul(step(denom, -0.02));
    const fres = float(0.02).add(pow(float(1).sub(max(dot(N_, V), 0)), 5).mul(0.98));
    // where across the bead the screen lands is the normal's business; only its edges feather
    const core = smoothstep(0, 0.12, vV).mul(smoothstepDown(1, 0.85, vV));
    // it runs out into the corners
    const ends = smoothstepDown(1, 0.93, abs(vSide));
    const strength = mix(0.5, 0.9, vLower).mul(U.tear.wet);
    // the screen is far brighter than the eye it lights: weighted as the cornea's mirror is
    return mirror
      .mul(fres.mul(3.6).add(0.7).mul(0.5))
      .mul(core)
      .mul(ends)
      .mul(strength)
      .mul(U.reflect)
      .mul(U.fade);
  })();
  material.colorNode = bead;
  // what the bead adds is light: it blooms (where there is an emissive target)
  if (emissive) material.mrtNode = mrt({ emissive: vec4(bead, 1) });
  material.transparent = true;
  material.blending = AdditiveBlending;
  material.depthWrite = false;
  material.side = DoubleSide;
  material.forceSinglePass = true;
  return material;
}
