/**
 * The lids and the skin around them: one ring mesh, built in the vertex stage
 * on the margin curves (margins.ts), so it blinks, follows the gaze and
 * squints with no geometry ever re-uploaded.
 *
 * Across the mesh (α) runs once around the eye: from the inner corner along
 * the upper margin to the outer corner, and back along the lower margin.
 * Down the mesh (q) runs from where the lid touches the globe, round the
 * margin's rounded edge, then out over the skin:
 *
 *   q 0 ─────────── 0.14 ───────────────────────────────── 1
 *     inner face     │ margin edge   crease   brow / cheek
 *     (conjunctiva,  │  (grey line, lash line)
 *      waterline)    │
 *
 * A lid is a slab ~1.5 mm thick, so its margin has a face you can see: the
 * wet waterline on the inner side, the grey line, the lash line. The skin is
 * anchored far out and stretches near the margin, so a blink pulls the lid
 * down without dragging the brow with it.
 *
 * Skin: the person's Monk tone, warmer and thinner toward the margin, pores
 * and lines from a bake (bake/skin.ts), the screen's light wrapping past the
 * terminator with red bleeding through, a faint sheen and a wet waterline
 * that mirror the screen. Far from the eye it darkens into the room.
 */

import {
  BackSide,
  DoubleSide,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  type RenderTarget,
  SphereGeometry,
} from 'three/webgpu';
import { ANATOMY, BELL_PITCH, GAZE_PITCH, GAZE_YAW } from '../anatomy';
import { BROW_BOUNDS, type BrowBake, VELLUS_TILE_MM } from '../bake/brow';
import { SKIN_MAP, SKIN_TILE_MM, type SkinFaceBake } from '../bake/skin-face';
import { DEBUG_VIEWS, type EyeUniforms } from '../uniforms';
import { browMoveNet } from './brow-net';
import { inPanel, type N, smoothstepDown, vnoise } from './common';
import { screenKey } from './light';
import { azimuthOf, faceAngles, LID_THICKNESS, marginsAt, sideOf } from './margins';
import { sampleScreen, screenLight } from './screen';
// (a row is either the margin's inner face or skin: each vertex builds only its own)
import { T } from './tsl';

const {
  Fn,
  If,
  abs,
  cameraPosition,
  clamp,
  cos,
  cross,
  dFdx,
  dFdy,
  dot,
  exp,
  float,
  fract,
  length,
  max,
  min,
  mix,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  reflect,
  select,
  sin,
  smoothstep,
  sqrt,
  step,
  texture,
  uv,
  varyingProperty,
  vec2,
  vec3,
  vec4,
} = T;

/** How far the skin reaches out from the margin, mm: past a phone's tall frame. */
export const REACH = 36;
/** The share of the mesh's rows given to the margin's inner face. */
export const QI = 0.14;
const R = ANATOMY.eyeballRadius;
const VIEW = (name: (typeof DEBUG_VIEWS)[number]) => DEBUG_VIEWS.indexOf(name);

export function lidGeometry() {
  return new PlaneGeometry(1, 1, 320, 64);
}

/**
 * The face around the eye, as a height field: how far toward the camera the
 * skin sits at (x, y), mm from the globe's centre. It sits behind the lids'
 * curve near the eye, falls away fast toward the temple and slowly toward the
 * nose; the brow stands out above, and a shallow trough runs under the lower
 * lid toward the nose.
 */
function faceShell(xy: N, Ux: EyeUniforms): N {
  const x = xy.x;
  const y = xy.y;
  const U: N = Ux;
  const kx = mix(float(0.014), float(0.028), smoothstep(-8, 8, x));
  const ky = mix(float(0.016), float(0.004), smoothstep(-6, 6, y));
  const g = (v: N, c: number, w: number) => exp(v.sub(c).div(w).mul(v.sub(c).div(w)).negate());
  // The ridge stays on this material point. The move-net (brow-net.ts) carries
  // the point; shifting the ridge here as well slid it off the hairs.
  const brow = g(y, 10.5, 3.3)
    .mul(g(x, 1, 20))
    .mul(1.6);
  const trough = g(y, -11, 3)
    .mul(g(x, -4, 10))
    .mul(0.9);
  // the roll of skin between the brow and the lid (the brow's fat pad), the
  // nose rising at the inner side, and the cheek's swell under the lower lid.
  // The roll flattens as the arch rises and bunches as it comes down.
  const pad = g(y, 6.9, 1.9)
    .mul(g(x, 1, 11))
    .mul(float(0.9).sub(U.lids.brow.mul(0.12)));
  const nose = smoothstep(-14, -26, x)
    .mul(g(y, 1, 12))
    .mul(3);
  const cheek = g(y, -14.5, 4)
    .mul(g(x, 5, 12))
    .mul(1.2);
  return float(11)
    .sub(kx.mul(x).mul(x))
    .sub(ky.mul(y).mul(y))
    .add(brow)
    .sub(trough)
    .add(pad)
    .add(nose)
    .add(cheek);
}

/**
 * The lids' own curve: the globe plus the lid's thickness, at (x, y), with
 * the cornea's bump riding under it wherever the eye is looking (and rolled
 * up under a closing lid, as the globe is).
 */
function lidCurve(xy: N, Ux: EyeUniforms): N {
  const U: N = Ux;
  const rr = dot(xy, xy);
  const r2 = (R + LID_THICKNESS) ** 2;
  const pitch = U.gaze.y.mul(GAZE_PITCH).add(U.blink.mul(BELL_PITCH));
  const yaw = U.gaze.x.mul(GAZE_YAW);
  const apex = vec2(sin(yaw).mul(cos(pitch)), sin(pitch)).mul(R);
  const off = xy.sub(apex);
  const bump = exp(dot(off, off).div(-20)).mul(0.6);
  return sqrt(max(float(r2).sub(rr), 0))
    .sub(max(rr.sub(r2), 0).mul(0.5))
    .add(bump);
}

/** max(a, b) with the corner rounded over k mm, so lid and face meet in a soft fold. */
function smax(a: N, b: N, k: number): N {
  const h = max(float(k).sub(abs(a.sub(b))), 0).div(k);
  return max(a, b).add(h.mul(h).mul(k / 4));
}

/** The skin's depth at (x, y): the lid where it stands in front of the face, else the face. */
function skinZ(xy: N, Ux: EyeUniforms): N {
  return smax(faceShell(xy, Ux), lidCurve(xy, Ux), 2);
}

/** Side position along the margin for α: upper half medial → lateral, lower half back. */
export function sideFromAlpha(alpha: N): N {
  return select(alpha.lessThan(0.5), alpha.mul(4).sub(1), float(3).sub(alpha.mul(4)));
}

/** Where the margin's line is, at rest, for α, projected onto the shot (mm). */
function restAt(a: N, Ux: EyeUniforms): N {
  const aa = fract(a).toVar();
  const ss = sideFromAlpha(aa).toVar();
  const mm = marginsAt(ss, Ux);
  const th = select(aa.lessThan(0.5), mm.upOpen, mm.loOpen).toVar();
  return vec2(cos(th).mul(sin(azimuthOf(ss, Ux))), sin(th))
    .mul(R + LID_THICKNESS)
    .toVar();
}

/** Outward from the resting margin at α, in the image plane. */
export function outwardAt(a: N, Ux: EyeUniforms): N {
  const tan = restAt(a.add(0.002), Ux).sub(restAt(a.sub(0.002), Ux));
  return normalize(vec2(tan.y.negate(), tan.x)).toVar();
}

/**
 * One column of the lid mesh: where the margin is at α, now and at rest, and
 * which way the skin runs out from it. Near a corner that direction turns
 * smoothly onto the corner's bisector (passed in: it is the same for every
 * column on that side), so the skin fans round the corner over many columns
 * instead of two.
 *
 * Every piece is a var (rule 17): select() compiles to if/else, and a shared
 * piece built first inside one branch would only be assigned there.
 */
export function lidColumn(alphaIn: N, bisector: N, Ux: EyeUniforms) {
  const alpha = fract(alphaIn).toVar();
  const upper = alpha.lessThan(0.5).toVar();
  const s = sideFromAlpha(alpha).toVar();
  const m = marginsAt(s, Ux);
  const thetaNow = select(upper, m.up, m.lo).toVar();
  const thetaRest = select(upper, m.upOpen, m.loOpen).toVar();
  const phi0 = azimuthOf(s, Ux).toVar();
  // Round each corner the skin fans out: from a fixed point before the corner
  // (s0) its direction turns evenly from the margin's outward direction there
  // onto the corner's bisector. Following the margin's own outward direction
  // into the corner instead let the tear lake's rounding (and the outer
  // corner's tilt) swing it, so neighbouring columns crossed and the skin
  // folded over itself in a crease running out of the corner.
  const s0 = select(s.lessThan(0), float(0.62), float(0.72)).toVar();
  const sEdge = select(s.lessThan(0), s0.negate(), s0);
  const alpha0 = select(upper, sEdge.add(1).div(4), float(3).sub(sEdge).div(4));
  const fanT = clamp(abs(s).sub(s0).div(float(1).sub(s0)), 0, 1).toVar();
  const fanDir = normalize(mix(outwardAt(alpha0, Ux), bisector, fanT));
  const n2 = select(fanT.greaterThan(0), fanDir, outwardAt(alpha, Ux)).toVar();
  return { upper, s, thetaNow, thetaRest, phi0, n2 };
}

/**
 * A point of the lid mesh, face space (mm): column `c`, row q.
 *
 * The skin is laid out in the image plane, outward from the margin's line,
 * and stands at the depth `skinZ` gives it: the lid's curve over the globe,
 * the face beyond, with a soft fold where they meet. Toward the corners the
 * face is in front of the globe, so the canthi sit forward of it, and the
 * margin's inner face stretches back to the globe as the pocket's wall (the
 * caruncle and the lacrimal lake lie behind it).
 */
export type LidColumn = ReturnType<typeof lidColumn>;

/**
 * The lids' folds, as in any anatomical plate of the eye: relief (mm toward
 * the camera) and how much the fold shades the skin, at side s (−1 inner
 * corner … +1 outer) and d mm out from the margin, on the upper (u = 1) or
 * lower (u = 0) lid. The geometry and the shading read the same numbers.
 *
 *  · Upper: the supratarsal crease hugs the margin near the nose, rises over
 *    the middle and runs on past the outer corner; the skin above it rolls
 *    forward over it (more so for a hood), leaving a shadow under the fold.
 *  · Lower: a low roll of lid just under the lashes, then the lid–cheek
 *    crease, then a fainter second fold below it.
 */
function lidFolds(u: N, s: N, d: N, Ux: EyeUniforms) {
  const U: N = Ux;
  const S = U.skin;
  const a = clamp(abs(s), 0, 1);
  const bow = float(1).sub(a.mul(a));
  // upper
  const creaseAt = S.creaseD
    .mul(mix(select(s.lessThan(0), float(0.58), float(0.84)), float(1), bow))
    .toVar();
  const zU = d.sub(creaseAt).div(1.05);
  const groove = exp(zU.mul(zU).negate())
    .mul(S.creaseDepth.mul(1.1))
    .mul(float(1).sub(U.blink.mul(0.7)));
  // (everyone's skin swells a little over the crease: the fat behind it)
  const foldAmt = S.hood
    .mul(0.9)
    .add(S.creaseDepth.mul(0.6))
    .add(0.3)
    .mul(clamp(float(1).sub(U.lids.pitch.mul(2)), 0.75, 1.25));
  const fold = foldAmt
    .mul(smoothstep(creaseAt.sub(1.2), creaseAt.add(0.7), d))
    .mul(float(1).sub(smoothstep(creaseAt.add(3), creaseAt.add(10), d)));
  const endsU = smoothstepDown(0.97, 0.72, s.negate()).mul(smoothstepDown(1.25, 1.0, s));
  const reliefU = fold.sub(groove).mul(endsU);
  const zS = d.sub(creaseAt.sub(0.55)).div(0.75);
  const shadeU = exp(zU.mul(zU).negate())
    .mul(S.creaseDepth.mul(0.9).add(0.25))
    .add(exp(zS.mul(zS).negate()).mul(foldAmt.mul(0.45)))
    .mul(endsU);
  // lower
  const zR = d.sub(2).div(1.5);
  const roll = exp(zR.mul(zR).negate()).mul(0.32);
  const creaseL = mix(float(4), float(5.4), bow).toVar();
  const zL = d.sub(creaseL).div(1.15);
  const grooveL = exp(zL.mul(zL).negate()).mul(0.32);
  const zB = d.sub(creaseL.add(2.6)).div(2.2);
  const bag = exp(zB.mul(zB).negate()).mul(0.36);
  const zL2 = d.sub(creaseL.add(5.2)).div(1.4);
  const grooveL2 = exp(zL2.mul(zL2).negate()).mul(0.12);
  const endsL = smoothstepDown(1, 0.78, a);
  const reliefL = roll.sub(grooveL).add(bag).sub(grooveL2).mul(endsL);
  const shadeL = exp(zL.mul(zL).negate())
    .mul(0.32)
    .add(exp(zL2.mul(zL2).negate()).mul(0.14))
    .mul(endsL);
  // Toward each corner both lids take the same blend of the two, so where
  // their skin meets (the corners' bisectors) it meets at one height: the
  // hood runs on round the outer corner instead of ending in a step.
  const w = mix(u, float(0.5), smoothstep(0.8, 1, a));
  return { relief: mix(reliefL, reliefU, w), shade: mix(shadeL, shadeU, w) };
}

/** A point of the skin, face space (mm): column `c`, `d` mm out from the margin's edge. */
export function skinAt(c: LidColumn, d: N, Ux: EyeUniforms): N {
  const U: N = Ux;
  const rM = R + LID_THICKNESS;
  // the skin stretches: near the margin it moves with the lid, far out it stays
  const theta0 = mix(c.thetaNow, c.thetaRest, smoothstep(0, 14, d)).toVar();

  // the lids' folds: the upper crease and its overhang, the lower roll and creases
  const lift = lidFolds(select(c.upper, float(1), float(0)), c.s, d, Ux).relief.toVar();

  const skinXY = vec2(cos(theta0).mul(sin(c.phi0)), sin(theta0))
    .mul(rM)
    .add(c.n2.mul(d))
    .toVar();
  // closing, the upper lid comes down over the lower, a hair in front of it
  // (where they meet, toward the corners, the two would otherwise coincide)
  const over = select(c.upper, U.blink.mul(0.08).mul(smoothstepDown(1.5, 0, d)), float(0));
  return vec3(skinXY, skinZ(skinXY, Ux).add(lift).add(over)).toVar();
}

/**
 * How much of a margin's inner face shows from the front, 0..1 (the share of
 * its run back to the globe laid across the image rather than along the
 * view). A lid rests on the globe nearly edge-on to us: the upper margin is
 * the lash line with the white right under it, the lower one a thin pale wet
 * edge, and the two meet at both corners in a point; at the inner one the
 * caruncle (`caruncleMaterial`) sits in the angle. Laid out radially, the
 * faces read as a rim round the opening.
 */
export function rimShow(s: N, upper: N): N {
  const a = clamp(abs(s), 0, 1);
  const lower = mix(float(0.5), float(0.2), smoothstep(0.35, 0.95, a));
  const top = float(0.14).mul(float(1).sub(smoothstep(0.5, 1, s).mul(0.6)));
  return select(upper, top, lower).mul(float(1).sub(smoothstep(0.8, 0.97, s.negate()).mul(0.85)));
}

/**
 * A point of the margin's inner face, face space (mm): column `c`, t from 1
 * where the lid touches the globe to 0 at the margin's front edge.
 */
export function innerAt(c: LidColumn, t: N, Ux: EyeUniforms): N {
  const rM = R + LID_THICKNESS;
  const toEdge = vec3(
    cos(c.thetaNow).mul(sin(c.phi0)),
    sin(c.thetaNow),
    cos(c.thetaNow).mul(cos(c.phi0)),
  ).toVar();
  const edge = toEdge.mul(rM).toVar();
  const rIn = pow(float(1).sub(t), 1.4).toVar();
  const radial = toEdge
    .mul(rIn.mul(LID_THICKNESS - 0.06).add(R + 0.06))
    .add(
      vec3(c.n2.mul(sin(t.mul(Math.PI / 2)).mul(-0.15)), skinZ(edge.xy, Ux).sub(edge.z).mul(rIn)),
    )
    .toVar();
  // the same depths, turned toward the view so only `rimShow` of it shows
  return vec3(mix(edge.xy, radial.xy, rimShow(c.s, c.upper)), radial.z).toVar();
}

function lidPoint(c: LidColumn, q: N, Ux: EyeUniforms) {
  const inner = q.lessThan(QI).toVar();
  // inner face: 1 where it touches the globe, 0 at the margin's front edge
  const t = clamp(float(1).sub(q.div(QI)), 0, 1).toVar();
  // skin: mm out from the edge, rows closer together near the margin
  const d = pow(clamp(q.sub(QI).div(1 - QI), 0, 1), 1.6)
    .mul(REACH)
    .toVar();
  const P = vec3(0).toVar();
  // where this material point sat before the brow's move-net (the hairs are painted there)
  const rest = vec2(0).toVar();
  If(inner, () => {
    const ip = innerAt(c, t, Ux);
    P.assign(ip);
    rest.assign(ip.xy);
  }).Else(() => {
    const base = skinAt(c, d, Ux);
    rest.assign(base.xy);
    P.assign(vec3(base.xy.add(browMoveNet(rest, Ux)), base.z));
  });
  return { P, rest, d, t, inner };
}

export function lidMaterial(
  Ux: EyeUniforms,
  screen: RenderTarget,
  detail: RenderTarget,
  hair: BrowBake,
  face: SkinFaceBake,
) {
  const U: N = Ux;
  const S = U.skin;
  const material = new MeshBasicNodeMaterial();
  material.name = 'Lids';

  // ---- vertex: the surface, and its normal by finite differences ------------
  // All in one function, so each vertex works out its column twice (here and
  // a step along) and its row three times, instead of everything six times.
  const vNormal = varyingProperty('vec3', 'vLidNormal');
  const vParams = varyingProperty('vec4', 'vLidParams');
  const vSide = varyingProperty('float', 'vLidSide');
  const vFold = varyingProperty('float', 'vLidFold');
  const vRest = varyingProperty('vec2', 'vLidRest');
  material.positionNode = Fn(() => {
    const a = uv().x;
    const q = uv().y;
    const side = sideFromAlpha(fract(a)).toVar();
    const bisector = outwardAt(select(side.lessThan(0), float(0), float(0.5)), Ux);
    const col = lidColumn(a, bisector, Ux);
    const colA = lidColumn(a.add(0.0015), bisector, Ux);
    const colB = lidColumn(a.sub(0.0015), bisector, Ux);
    const h = lidPoint(col, q, Ux);
    const pa = lidPoint(colA, q, Ux).P;
    const pb = lidPoint(colB, q, Ux).P;
    const pq = lidPoint(col, q.add(0.004), Ux).P;
    const n = normalize(cross(pa.sub(pb), pq.sub(h.P))).toVar();
    // whichever side the camera sees
    vNormal.assign(select(dot(n, cameraPosition.sub(h.P)).lessThan(0), n.negate(), n));
    vParams.assign(
      vec4(h.d, h.t, select(h.inner, float(1), float(0)), select(col.upper, float(1), float(0))),
    );
    vSide.assign(col.s);
    vFold.assign(lidFolds(select(col.upper, float(1), float(0)), col.s, h.d, Ux).shade);
    vRest.assign(h.rest);
    return h.P;
  })();

  // ---- fragment: skin, margin, waterline ------------------------------------
  const shade = () => {
    const d = vParams.x;
    const t = vParams.y;
    const inner = vParams.z;
    const upper = vParams.w;
    const N = normalize(vNormal).toVar();
    const P = positionWorld;
    const V = cameraPosition.sub(P).normalize();
    const det = texture(detail.texture, uv()).toVar();
    // the face-space detail (bake/skin-face.ts): fine tile, broad map
    // pores and the brow are painted on the skin before the move-net, so they
    // ride the nodes instead of sliding across them
    const rest = vRest;
    const tile = texture(face.tile.texture, rest.div(SKIN_TILE_MM)).toVar();
    const map = texture(
      face.map.texture,
      rest.sub(vec2(SKIN_MAP.x0, SKIN_MAP.y0)).div(vec2(SKIN_MAP.w, SKIN_MAP.h)),
    ).toVar();

    // The person's tone, its undertone, and its unevenness. Mottle is laid
    // across the face (mm), not round the mesh, which fans out far from the eye.
    const albedo = vec3(S.tone).toVar();
    albedo.mulAssign(mix(vec3(1, 0.97, 0.9), vec3(1.06, 0.94, 0.92), S.undertone));
    const mottle = map.r;
    albedo.mulAssign(mottle.sub(0.45).mul(0.2).add(1));
    // lid skin is the thinnest on the body: warmer and pinker toward the margin
    albedo.assign(
      mix(
        albedo,
        albedo.mul(vec3(1.12, 0.86, 0.86)),
        smoothstepDown(5, 0, d).mul(S.translucency).mul(0.6),
      ),
    );
    // (the bake's cells and lines follow the mesh, which fans out far from the
    // eye, so they belong near it)
    albedo.mulAssign(
      float(1).sub(
        det.r
          .mul(S.pores)
          .mul(0.1)
          .mul(smoothstepDown(14, 6, d)),
      ),
    );
    // Pores and the skin's fine grain, laid across the face (mm), so the skin
    // away from the eye has texture too and never reads as plastic
    const pore = tile.r.mul(float(1).sub(inner));
    const grain = tile.g;
    albedo.mulAssign(float(1).sub(pore.mul(0.08)).sub(grain.sub(0.5).mul(0.04)));
    // (darker round the eye than further out, as most skin is, and deep-toned skin most)
    albedo.mulAssign(
      mix(float(0.8), float(1), smoothstep(2.5, 12, d))
        .mul(float(1).sub(inner))
        .add(inner),
    );
    // freckles: small and clustered, across the face (mm), thinning far out
    const freckle = map.g
      .mul(S.freckles)
      .mul(smoothstepDown(20, 8, d))
      .mul(float(1).sub(inner));
    albedo.assign(mix(albedo, albedo.mul(vec3(0.6, 0.4, 0.27)), freckle.mul(0.9)));
    // Crow's feet fan out from the outer corner across the face, so they are
    // drawn there, not on the mesh, which bunches up round the corner.
    const LU = U.lids;
    // (baked: bake/skin-face.ts map B)
    const crows = map.b;
    const lines = det.g
      .mul(S.lines)
      .mul(0.12)
      .mul(smoothstepDown(9, 3, d))
      .add(crows.mul(S.lines.mul(0.4).add(LU.squint.mul(0.6))).mul(0.3));
    albedo.mulAssign(float(1).sub(lines.mul(0.5)));
    // Fine lines that follow the lid, broken and uneven: under the lower
    // lashes, and across the upper lid below the crease. A dark line with a
    // lit edge just above it reads as a crease in the skin, not a stroke.
    // (both baked on the mesh's coordinates: bake/skin.ts B and A)
    const wob = det.b.mul(3);
    const broken = det.a;
    const crease = (o: number) =>
      pow(
        abs(
          sin(
            d
              .add(o)
              .mul(Math.PI / 0.62)
              .add(wob),
          ),
        ),
        12,
      );
    const lineBand = mix(
      smoothstep(1.4, 2.6, d).mul(smoothstepDown(9.5, 6, d)),
      smoothstep(0.9, 1.6, d).mul(smoothstepDown(S.creaseD.sub(0.2), S.creaseD.sub(1.2), d)),
      upper,
    )
      .mul(broken)
      .mul(smoothstepDown(1, 0.82, abs(vSide)))
      .mul(S.lines.mul(0.6).add(0.4))
      .mul(float(1).sub(inner))
      .toVar();
    If(lineBand.greaterThan(0.001), () => {
      albedo.mulAssign(float(1).sub(crease(0).mul(lineBand).mul(0.22)));
      albedo.mulAssign(float(1).add(crease(0.13).mul(lineBand).mul(0.07)));
    });
    // the crease's own shadow
    // (a fold's shadow, never a black stroke, however deep the crease)
    const creaseShade = min(vFold.mul(0.6), 0.4).mul(float(1).sub(inner));

    albedo.mulAssign(float(1).sub(creaseShade));

    // the margin: the grey line
    const greyLine = smoothstepDown(0.35, 0.1, d).mul(float(1).sub(inner)).mul(upper);
    albedo.mulAssign(float(1).sub(greyLine.mul(0.45)));
    // The lower lid's margin shows its width from the front, as in any close
    // look at an eye: a smooth, glossy, slightly paler strip of skin about
    // 0.7 mm wide (the intermarginal strip) between the wet pink edge and the
    // dark line of lash roots at its outer edge.
    const strip = smoothstepDown(0.4, 0.2, d)
      .mul(float(1).sub(upper))
      .mul(float(1).sub(inner))
      .toVar();
    // The lash line: the roots' dark mass (lashes.ts draws the strands). The
    // lower lid's lashes are few and fine; its line is a shadow, not a stroke.
    const roots = float(1).toVar();
    If(d.lessThan(1.2), () => {
      roots.assign(
        vnoise(vec2(vSide.mul(90), 0.5))
          .mul(0.35)
          .add(0.75),
      );
    });
    const lashLineU = smoothstep(0.0, 0.1, d)
      .mul(smoothstepDown(0.95, 0.4, d))
      .mul(0.88);
    const lashLineL = smoothstep(0.12, 0.26, d)
      .mul(smoothstepDown(0.75, 0.45, d))
      .mul(0.62);
    const lashLine = mix(lashLineL, lashLineU, upper).mul(roots).mul(float(1).sub(inner));
    albedo.assign(mix(albedo, vec3(0.02, 0.016, 0.015), lashLine));

    // Inside the margin: on the lower lid, the wet waterline over deep pink
    // conjunctiva; on the upper lid that face looks down and sits behind the
    // lash roots, so it reads as the dark line it is in every photograph.
    // (darker margins carry a little of the skin's pigment onto the waterline)
    const toneLum = dot(vec3(S.tone), vec3(0.3, 0.55, 0.15));
    const conj = mix(
      vec3(0.34, 0.16, 0.15),
      vec3(0.54, 0.36, 0.33),
      smoothstep(0.35, 0.85, float(1).sub(t)),
    )
      .mul(mix(0.45, 1, smoothstep(0.03, 0.5, toneLum)))
      .toVar();
    // (in shadow, not black: mucosa under a lid is still flesh)
    const underUpper = mix(conj, vec3(0.11, 0.055, 0.05), 0.65);
    // the lower margin faces up into the light: a pale, wet, flesh-pink edge
    const toneK = smoothstep(0.03, 0.5, toneLum);
    const lowerEdge = mix(conj, mix(vec3(0.22, 0.12, 0.1), vec3(0.78, 0.5, 0.47), toneK), 0.5);
    const glands = float(0).toVar();
    If(inner.greaterThan(0.5), () => {
      glands.assign(
        smoothstep(0.72, 0.92, vnoise(vec2(vSide.mul(140), t.mul(2).add(0.3))))
          .mul(smoothstep(0.1, 0.25, t))
          .mul(smoothstepDown(0.5, 0.35, t)),
      );
    });
    const waterline = mix(albedo.mul(1.05), lowerEdge, smoothstep(0.05, 0.6, t)).mul(
      float(1).sub(glands.mul(0.35)),
    );
    albedo.assign(mix(albedo, mix(waterline, underUpper, upper), inner));
    // The inner corner's pocket is the caruncle: a pink, wet, bumpy mound,
    // not a hole. It takes over the margins' inner faces there.
    // One mound for both lids' inner faces, so no seam where they meet: it
    // swells toward its middle and rolls away into shadow at its edges.
    const caruncleAt = smoothstep(0.6, 0.9, vSide.negate()).mul(inner).toVar();
    const bumps = tile.a.mul(0.3).add(0.82);
    const mound = sin(t.mul(Math.PI)).mul(0.35).add(0.7);
    albedo.assign(
      mix(
        albedo,
        mix(vec3(0.3, 0.15, 0.14), vec3(0.66, 0.36, 0.34), toneK)
          .mul(bumps)
          .mul(mound),
        caruncleAt,
      ),
    );

    // ---- light ---------------------------------------------------------------
    // the caruncle is one mound facing out of the corner, whichever lid's
    // inner face it is drawn on: light it as one
    N.assign(normalize(mix(N, vec3(0.25, 0, 1), caruncleAt.mul(0.4))));
    const L = screenKey(Ux, screen);
    const NL = dot(N, L.dir);
    // The screen lights the face with its own picture, the way a monitor in
    // a dark room does: its layout falls softly across the skin, as from a
    // projector (blurred, and lifted toward its average so it colours the light
    // rather than replacing it), on whatever faces the screen.
    // ---- the brow and the fine hair (bake/brow.ts), lying on the skin ----------
    // Each hair is coloured as the person's, lit along its length (Kajiya–Kay,
    // a sheen running along it), and lays a thin shadow on the skin away
    // from the screen. The skin under a brow is a little darker.
    const LS = U.lashes;
    const B = BROW_BOUNDS;
    const bUv = rest.sub(vec2(B.x0, B.y0)).div(vec2(B.w, B.h)).toVar();
    const inB = step(0, bUv.x)
      .mul(step(bUv.x, 1))
      .mul(step(0, bUv.y))
      .mul(step(bUv.y, 1))
      .mul(float(1).sub(inner));
    const gx = dFdx(bUv);
    const gy = dFdy(bUv);
    const shadowUv = bUv.add(L.dir.xy.mul(0.1).div(vec2(B.w, B.h)));
    const browTex = vec4(0.5, 0.5, 0.5, 0).toVar();
    const browShadow = float(0).toVar();
    const browUnder = float(0).toVar();
    If(inB.greaterThan(0.5), () => {
      browTex.assign(texture(hair.brow, bUv).grad(gx, gy));
      browShadow.assign(texture(hair.brow, shadowUv).grad(gx, gy).a);
      browUnder.assign(texture(hair.brow, bUv).level(4.5).a);
    });
    const browA = browTex.a.mul(inB).toVar();
    const hairCol = mix(vec3(LS.root), vec3(LS.tip), 0.4);
    albedo.mulAssign(float(1).sub(browUnder.mul(0.14)));
    albedo.mulAssign(float(1).sub(browShadow.mul(0.32).mul(float(1).sub(browA))));
    albedo.assign(mix(albedo, hairCol, browA.mul(0.97)));
    const hairT = normalize(vec3(browTex.rg.mul(2).sub(1), 0.18));
    const hairH = normalize(L.dir.add(V));
    const hTH = dot(hairT, hairH);
    // (faint: dark hair on dark skin shows by a soft sheen along it, not a grey cast)
    const hairSheen = pow(sqrt(max(float(1).sub(hTH.mul(hTH)), 0)), 80)
      .mul(0.012)
      .mul(browA);
    // the fine hair: faint, pale, everywhere but the margin, catching the light
    const vellus = texture(hair.vellus, rest.div(VELLUS_TILE_MM))
      .a.mul(smoothstep(1.5, 4, d))
      .mul(float(1).sub(inner))
      .mul(float(1).sub(browA))
      .toVar();
    albedo.assign(mix(albedo, albedo.mul(1.1).add(0.015), vellus.mul(0.22)));

    const Ls = U.light;
    const facesScreen = clamp(dot(N, Ls.normal).negate().mul(2.5), 0, 1);
    const throwUv = vec2(float(0.5).sub(P.x.div(72)), P.y.div(44).add(0.5));
    const picture = sampleScreen(screen, clamp(throwUv, 0.02, 0.98), float(8).add(U.mip));
    const avgLum = max(dot(screenLight(screen), vec3(0.3, 0.55, 0.15)), 0.04);
    const tint = clamp(picture.div(avgLum), 0.45, 2.2);
    const key = L.key.mul(mix(vec3(1), tint, facesScreen.mul(0.22))).toVar();
    const wrapW = vec3(0.55, 0.35, 0.28);
    const diff = pow(clamp(vec3(NL).add(wrapW).div(wrapW.add(1)), 0, 1), vec3(1.5));
    // light through thin skin comes back red at the terminator
    const bleed = albedo
      .mul(vec3(0.3, 0.06, 0.03))
      .mul(S.translucency)
      .mul(smoothstep(-0.25, 0.35, NL))
      .mul(float(1).sub(smoothstep(0.35, 0.9, NL)));
    // the screen's light pools around the eye and falls away into the room
    const pool = mix(1, 0.55, smoothstep(10, 30, length(P.xy)));
    // corners are pockets; the inner face sits in its own lid's shadow
    const corner = float(1).sub(
      smoothstep(0.85, 1, abs(vSide))
        .mul(smoothstepDown(3, 0, d))
        .mul(0.22),
    );
    // (the caruncle stands up into the light)
    const innerFace = mix(
      mix(float(0.62), float(0.95), float(1).sub(t)),
      mix(float(0.22), float(0.75), float(1).sub(t)),
      upper,
    );
    const innerShade = mix(mix(float(1), innerFace, inner), float(0.75), caruncleAt);
    // (the screen lights the face from the front, which flattens it; the room
    // above adds the modelling: what faces up catches more, undersides less)
    const overhead = mix(
      0.84,
      1.12,
      smoothstep(-0.25, 0.85, dot(N, normalize(vec3(-0.1, 0.78, 0.62)))),
    );
    const lit = albedo
      .mul(mix(float(1.18), float(1), inner))
      .mul(
        L.amb
          .add(key.mul(diff).mul(overhead))
          .add(L.fill.mul(clamp(dot(N, L.fillDir).add(0.25).div(1.25), 0, 1))),
      )
      .add(bleed.mul(key))
      .mul(pool)
      .mul(corner)
      .mul(innerShade)
      .toVar();

    // ---- the screen, mirrored: a faint sheen on skin, a glint on the waterline -
    const Rr = reflect(V.negate(), N);
    const Nn = U.light.normal;
    const denom = dot(Rr, Nn);
    const tHit = dot(U.light.center.sub(P), Nn).div(min(denom, -0.02));
    const h = P.add(Rr.mul(tHit)).sub(U.light.center);
    const suv = vec2(
      dot(h, U.light.right).div(U.light.size.x).add(0.5),
      dot(h, U.light.up).div(U.light.size.y).add(0.5),
    );
    const wet = inner.mul(smoothstep(0.15, 0.55, float(1).sub(t)));
    // Skin's sheen holds a soft image of the interface (its oil is a poor
    // mirror, not none); the waterline is wet enough to hold the panel's shape
    const mirror = screenLight(screen).toVar();
    If(wet.greaterThan(0.01), () => {
      mirror.assign(
        texture(screen.texture, vec2(suv.x, float(1).sub(suv.y))).level(
          mix(6.5, 3.5, wet).add(U.mip),
        ).rgb,
      );
    });
    mirror.mulAssign(inPanel(suv, mix(0.2, 0.08, wet)).mul(step(denom, -0.02)));
    const fres = float(0.03).add(pow(float(1).sub(max(dot(N, V), 0)), 5).mul(0.97));
    // The skin's texture breaks the sheen up: pores and lines don't shine,
    // and the lids and the skin by the eye are oilier than the face further out.
    const gloss = clamp(
      float(1).sub(det.r.mul(S.pores).mul(1.6)).sub(det.g.mul(S.lines).mul(0.8)),
      0.15,
      1,
    )
      .mul(mix(0.55, 1, smoothstepDown(16, 2, d)))
      .mul(float(1).sub(caruncleAt.mul(0.5)))
      .mul(float(1).sub(browA.mul(0.8)));
    // (the sheen is also what shows the form of the darkest skin)
    const spec = mirror
      .mul(fres.mul(2).add(0.25))
      .mul(mix(mix(float(0.1), float(0.55), wet), float(0.4), caruncleAt))
      .mul(mix(float(1), gloss, float(1).sub(wet)))
      .mul(pool)
      .toVar();

    // far out the face gives way to the dark room (a fade in colour, so the
    // mesh stays opaque)
    // the hairs' sheen, and the fine hair catching the light at a glance
    spec.addAssign(L.key.mul(hairSheen));
    spec.addAssign(L.key.mul(vellus).mul(fres).mul(0.25));
    // (in soft clusters that follow oily zones, not a scatter of points)
    const spark = tile.b
      .mul(0.5)
      .add(0.75)
      .mul(float(1).sub(pore.mul(0.6)));
    const hl = pow(max(dot(N, normalize(L.dir.add(V))), 0), 12);
    const oily = smoothstepDown(14, 2, d)
      .mul(0.7)
      .add(0.3)
      .add(strip.mul(1.5))
      .mul(float(1).sub(inner))
      .mul(float(1).sub(browA));
    spec.addAssign(L.key.mul(hl).mul(spark).mul(oily).mul(0.035));
    const final = lit
      .add(spec)
      .mul(smoothstepDown(REACH, REACH - 8, d))
      .mul(U.fade)
      .toVar();
    const view = U.debugView;
    const color = select(
      view.equal(VIEW('normal')),
      N.mul(0.5).add(0.5),
      select(
        view.equal(VIEW('lit')),
        L.amb.add(L.key.mul(diff)).mul(pool),
        select(
          view.equal(VIEW('masks')),
          det.rgb,
          select(view.equal(VIEW('spec')), spec.mul(4), final),
        ),
      ),
    );
    return color;
  };

  material.colorNode = Fn(shade)();
  material.side = DoubleSide;
  return material;
}

/** The caruncle's mesh: a unit sphere, shaped into its mound in the vertex stage. */
export function caruncleGeometry() {
  return new SphereGeometry(1, 40, 24);
}

/**
 * The caruncle: the small pink mound in the inner corner, a teardrop between
 * the lids, pointed where they meet and rounded toward the white, which it
 * stands in front of. Fleshy, a little lumpy (it carries fine hairs and
 * glands) and wet, so it holds a soft image of the screen. It sits in the
 * angle of the margins (marginsAt at s = -1), on the globe's edge and behind
 * the skin, which covers it when the lids close.
 */
export function caruncleMaterial(Ux: EyeUniforms, screen: RenderTarget) {
  const U: N = Ux;
  const material = new MeshBasicNodeMaterial();
  material.name = 'Caruncle';
  const vN = varyingProperty('vec3', 'vCarNormal');
  const vU = varyingProperty('vec3', 'vCarLocal');
  const size = vec3(2, 1, 0.9);
  material.positionNode = Fn(() => {
    const u = positionLocal.toVar();
    const rM = R + LID_THICKNESS;
    const th = marginsAt(float(-1), Ux).up;
    const tip = vec2(sin(U.lids.phiM).mul(cos(th)), sin(th)).mul(rM);
    const c = tip.add(vec2(U.gaze.x.mul(0.4).add(1.75), 0.05)).toVar();
    // its middle just in front of the white's edge behind it, tucked under
    // both margins, so the lids cut its top and bottom and only its rounded
    // end stands free against the white
    const z = sqrt(max(float(R * R).sub(dot(c, c)), 0)).add(0.6);
    // an egg, fuller toward the white than toward the corner
    const egg = mix(float(0.55), float(1.1), smoothstep(-1, 1, u.x));
    const moved = vec3(
      U.gaze.x.mul(0.12).add(1),
      float(1).sub(U.gaze.x.mul(0.06)),
      float(1).sub(U.blink.mul(0.3)),
    );
    const p = u
      .mul(size)
      .mul(moved)
      .mul(vec3(egg, 1, 1));
    vN.assign(normalize(u.div(size)));
    vU.assign(u);
    return vec3(c, z).add(p);
  })();
  material.colorNode = Fn(() => {
    const P = positionWorld;
    const N = normalize(vN).toVar();
    // lumpy: the surface's bumps tip the normal and mottle the colour
    const bx = vnoise(P.xy.mul(26).add(3.7)).sub(0.5);
    const by = vnoise(P.xy.mul(26).add(9.1)).sub(0.5);
    N.assign(normalize(N.add(vec3(bx, by, 0).mul(0.45))));
    // (darker skin carries some of its pigment into the caruncle, as it does
    // onto the waterline: lidMaterial's `conj`)
    const toneLum = dot(vec3(U.skin.tone), vec3(0.3, 0.55, 0.15));
    const plica = smoothstep(0.1, 0.9, vU.x);
    // (pigmented on darker skin: a deep rose-brown rather than pink)
    const toneK = smoothstep(0.03, 0.5, toneLum);
    const albedo = mix(vec3(0.3, 0.14, 0.13), vec3(0.62, 0.36, 0.34), toneK)
      .mul(mix(vec3(1), vec3(1.15, 1.1, 1.08), plica))
      .mul(vnoise(P.xy.mul(18).add(1.3)).mul(0.12).add(0.94))
      .toVar();
    const L = screenKey(Ux, screen);
    // wet flesh takes the screen's colour more than skin does
    albedo.mulAssign(mix(vec3(1), L.hue, 0.35));
    const NL = dot(N, L.dir);
    const diff = clamp(NL.add(0.45).div(1.45), 0, 1);
    // It sits in the corner's pocket, in the lids' shadow (as the skin there
    // is: lidMaterial's `corner`), the more so the deeper into the angle.
    const deep = smoothstep(-1.4, 0.6, P.z.sub(sqrt(max(float(R * R).sub(dot(P.xy, P.xy)), 0))));
    const lit = albedo
      .mul(L.amb.add(L.key.mul(diff)))
      .add(albedo.mul(vec3(0.25, 0.05, 0.03)).mul(L.key))
      .mul(mix(0.28, 0.55, deep));
    // wet: the screen, softly mirrored
    const V = cameraPosition.sub(P).normalize();
    const Rr = reflect(V.negate(), N);
    const Nn = U.light.normal;
    const denom = dot(Rr, Nn);
    const tHit = dot(U.light.center.sub(P), Nn).div(min(denom, -0.02));
    const h = P.add(Rr.mul(tHit)).sub(U.light.center);
    const suv = vec2(
      dot(h, U.light.right).div(U.light.size.x).add(0.5),
      dot(h, U.light.up).div(U.light.size.y).add(0.5),
    );
    const mirror = sampleScreen(screen, suv, float(5).add(U.mip))
      .mul(inPanel(suv, 0.3))
      .mul(step(denom, -0.02));
    const fres = float(0.03).add(pow(float(1).sub(max(dot(N, V), 0)), 5).mul(0.97));
    const spec = mirror.mul(fres.mul(2).add(0.3)).mul(0.16);
    return lit.add(spec).mul(U.fade);
  })();
  // Its edges thin out where it turns away, so it melts into the white and
  // the lids round it instead of standing in the corner as a separate blob.
  material.opacityNode = Fn(() => {
    const V = cameraPosition.sub(positionWorld).normalize();
    return smoothstep(0.04, 0.5, dot(normalize(vN), V)).mul(smoothstepDown(0.95, 0.25, vU.x));
  })();
  material.transparent = true;
  material.depthWrite = true;
  return material;
}

/**
 * Behind the globe, the socket: where the aperture runs past the white's
 * silhouette, what shows is the wet pocket of conjunctiva, and at the inner
 * corner the caruncle — pink, wet, lit a little by the screen. A sphere seen
 * from inside, larger than the globe, so it only ever shows round its edge.
 */
export function socketMaterial(Ux: EyeUniforms, screen: RenderTarget) {
  const U: N = Ux;
  const material = new MeshBasicNodeMaterial();
  material.name = 'Socket';
  material.colorNode = Fn(() => {
    const { theta } = faceAngles(positionWorld);
    const s = sideOf(faceAngles(positionWorld).phi, Ux);
    const m = marginsAt(s, Ux);
    const mid = m.up.add(m.lo).mul(0.5);
    const caruncle = smoothstep(0.78, 1.02, s.negate()).mul(
      smoothstepDown(0.16, 0, abs(theta.sub(mid))),
    );
    const tissue = mix(vec3(0.05, 0.022, 0.02), vec3(0.42, 0.2, 0.18), caruncle);
    const L = screenKey(Ux, screen);
    return tissue.mul(L.amb.mul(2).add(L.key.mul(0.55))).mul(U.fade);
  })();
  material.side = BackSide;
  return material;
}
