/**
 * The cornea: the glass. A cap of a 7.8 mm sphere seated on the globe at the
 * limbus, standing ~1 mm proud of it, turning with the gaze.
 *
 * It draws nothing of its own. It is a mirror and an emitter for the screen
 * in front of the face: the view ray is reflected off the dome (rippled by the
 * tear film) and traced to the screen's rectangle, so the page lands in it
 * mirrored, fisheyed by the curvature and Fresnel-weighted, with no fake
 * geometry. Ported from the live eye's dome math, which these numbers come
 * from:
 *  · dispersion: each channel refracts through the dome's own curvature, so
 *    fringes grow toward the rim and vanish at the apex;
 *  · roughness grows toward the limbus where the tear film thins;
 *  · a white page is compressed against its own highlight so its layout
 *    survives it;
 *  · the limbus shades inward and catches a thin rim; one streak tells you
 *    it is glass;
 *  · a faint second image off the back of the cornea (Purkinje P2);
 *  · a flash on the camera's axis (an era's lens) leaves a hard catchlight
 *    where the dome faces the lens;
 *  · the tear film (bake/tear.ts): its slope tilts the mirror, its dry spots
 *    after a long stare blur and dim it in patches, and on T3 its lipid
 *    layer tints the highlights with faint interference colours.
 *
 * Output is premultiplied: the reflection screens over the iris beneath, and
 * the limbal shade darkens it. The reflection alone also goes to the emissive
 * target, which is what the post chain blooms.
 */

import { MeshBasicNodeMaterial, type RenderTarget, type Texture } from 'three/webgpu';
import { ANATOMY, CORNEA_CENTER_Z, IRIS_Z_PUPIL, IRIS_Z_ROOT, LIMBUS_RADIUS } from '../anatomy';
import type { IrisBake } from '../bake/iris';
import { DEBUG_VIEWS, type EyeUniforms } from '../uniforms';
import { inPanel, lensScale, type N, smoothstepDown } from './common';
import { hitIris, irisShade } from './iris';
import { socketShade3d } from './margins';
import { screenTint, tube } from './room';
import { sampleScreen, screenLight } from './screen';
import { T } from './tsl';

const {
  Fn,
  abs,
  cameraPosition,
  clamp,
  cos,
  dot,
  float,
  mrt,
  property,
  length,
  max,
  min,
  mix,
  modelWorldMatrixInverse,
  normalWorld,
  positionLocal,
  positionWorld,
  pow,
  reflect,
  refract,
  select,
  smoothstep,
  step,
  texture,
  vec2,
  vec3,
  vec4,
} = T;

const SPEC_VIEW = DEBUG_VIEWS.indexOf('spec');
const IRIS_VIEW = DEBUG_VIEWS.indexOf('iris');
const TEAR_VIEW = DEBUG_VIEWS.indexOf('tear');

/**
 * @param tear     the tear film's map (bake/tear.ts)
 * @param thinFilm the lipid layer's interference colours (T3)
 * @param emissive whether the post pass has an emissive target to bloom (WebGPU)
 */
export function corneaMaterial(
  Ux: EyeUniforms,
  screen: RenderTarget,
  irisBake: IrisBake,
  tear: RenderTarget,
  thinFilm: boolean,
  emissive: boolean,
) {
  const U: N = Ux;
  const S: N = U.screen;

  const material = new MeshBasicNodeMaterial();
  material.name = 'Cornea';
  // With the emissive target (WebGPU), the reflection also goes there: the
  // shader is the material's outputNode and its mrtNode carries the glow, so
  // three merges both into the pass's MRT. On WebGL2 that path fails inside
  // three, so there the cornea is a plain fragment and nothing blooms.
  const glowOut = emissive ? property('vec4', 'corneaGlow') : null;
  const shade = Fn(() => {
    const t = S.time;
    const lum = U.screenLum;
    const local = positionLocal.toVar();
    // 0 at the apex, 1 at the limbus
    const cd = clamp(length(local.xy).div(LIMBUS_RADIUS), 0, 1).toVar();
    const mask = float(1)
      .sub(smoothstep(0.965, 1, cd))
      .toVar();

    // The tear film over the dome, from its map (film coordinates: ±1 at the
    // limbus, y up; the map's rows run top-down). Its slope tilts the mirror;
    // where it has broken up, the surface goes irregular.
    const filmUv = vec2(
      local.x.div(LIMBUS_RADIUS).mul(0.5).add(0.5),
      float(0.5).sub(local.y.div(LIMBUS_RADIUS).mul(0.5)),
    ).toVar();
    const tearTex = tear.texture as Texture;
    const film = texture(tearTex, filmUv).toVar();
    const slope = vec2(
      texture(tearTex, filmUv.add(vec2(0.012, 0))).r.sub(film.r),
      texture(tearTex, filmUv.sub(vec2(0, 0.012))).r.sub(film.r),
    );
    const dry = smoothstepDown(0.42, 0.1, film.r).toVar();
    // a slow, shallow ripple, so the glass is never perfect, rougher where dry
    // (the film's own lipid pattern is the ripple: it drifts up after a blink
    // and then holds still, which is what a living tear film does; two fbm
    // noises per pixel used to do this, at real cost now the eye fills the frame)
    const tear_ = vec2(film.g.sub(0.5), film.b.sub(0.5).mul(0.6))
      .mul(0.55)
      .mul(dry.mul(2.5).add(1))
      .sub(slope.mul(6))
      .toVar();
    const N_ = normalWorld
      .add(vec3(tear_.mul(0.08), 0))
      .normalize()
      .toVar();
    const V = cameraPosition.sub(positionWorld).normalize().toVar();

    // ---- through the glass: refract into the eye and find the iris --------------
    // All in the eye's own frame (the cornea's local space, shifted to the
    // globe's centre), so the iris turns with the gaze.
    const camLocal = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz;
    const Vl = camLocal.sub(local).normalize();
    const Nl = local
      .normalize()
      .add(vec3(tear_.mul(0.08), 0))
      .normalize();
    const ray = refract(Vl.negate(), Nl, 1 / ANATOMY.iorAqueous).toVar();
    const origin = local.add(vec3(0, 0, CORNEA_CENTER_Z));
    const hit = hitIris(origin, ray, IRIS_Z_ROOT, IRIS_Z_PUPIL);
    const lightLocal = modelWorldMatrixInverse.mul(vec4(U.light.dir, 0)).xyz.normalize();

    // the same light as the white: the screen's own colour, kept under 1
    const avg = screenLight(screen).toVar();
    const hue = avg.div(max(max(avg.r, avg.g), max(avg.b, 0.001)));
    const key = mix(vec3(1), hue, 0.3).mul(lum.mul(0.25).add(0.62));
    const amb = mix(vec3(1), hue, 0.5).mul(lum.mul(0.1).add(0.07));
    const socket = socketShade3d(positionWorld, Ux).shade;
    const iris = irisShade(Ux, irisBake, screen, { hit, ray, light: lightLocal, key, amb, socket });

    // ---- trace the reflected ray to the screen --------------------------------
    const R = reflect(V.negate(), N_);
    const C = U.light.center;
    const Nn = U.light.normal;
    const denom = dot(R, Nn);
    const facing = step(denom, -0.02);
    const tHit = dot(C.sub(positionWorld), Nn).div(min(denom, -0.02));
    const h = positionWorld.add(R.mul(tHit)).sub(C);
    const ruv = vec2(
      dot(h, U.light.right).div(U.light.size.x).add(0.5),
      dot(h, U.light.up).div(U.light.size.y).add(0.5),
    ).toVar();

    // the dome is the lens: each wavelength its own index, fringes at the rim
    const rc = ruv.mul(2).sub(1);
    const r2 = clamp(dot(rc, rc), 0, 2).toVar();
    const ior = cd.mul(0.7).add(0.3).mul(-0.13);
    const uvR = ruv
      .sub(0.5)
      .mul(lensScale(ior.mul(1.07), r2))
      .add(0.5);
    const uvG = ruv.sub(0.5).mul(lensScale(ior, r2)).add(0.5).toVar();
    const uvB = ruv
      .sub(0.5)
      .mul(lensScale(ior.mul(0.93), r2))
      .add(0.5);

    // crisp across the middle of the dome, softening toward the limbus
    const blown = smoothstep(0.3, 0.92, lum).toVar();
    // The live eye stopped bright pages down hard because its output was
    // encoded twice and ran hot; this pipeline encodes once, so it needs less.
    const calm = float(1).sub(blown.mul(0.25));
    const soft = cd.mul(0.022).add(0.004);
    const onRefl = inPanel(uvG, soft).mul(facing).toVar();
    const rough = cd
      .pow(3)
      .mul(3.2)
      .add(0.45)
      .add(r2.mul(r2).mul(0.8))
      .add(length(tear_).mul(1.1))
      .add(dry.mul(2.4))
      .mul(float(1).sub(blown.mul(0.5)))
      .add(U.mip);
    const refl = vec3(
      sampleScreen(screen, uvR, rough).r,
      sampleScreen(screen, uvG, rough).g,
      sampleScreen(screen, uvB, rough).b,
    ).toVar();
    refl.assign(tube(refl, uvG, S.crt.mul(0.45), t));
    if (thinFilm) {
      // the lipid layer, a tenth of a micron: faint interference colours in
      // the highlight, drifting up with the film after a blink
      const phase = film.g.mul(1.6).add(film.r.mul(0.4));
      const fringe = cos(vec3(0, 0.33, 0.67).add(phase).mul(6.283))
        .mul(0.5)
        .add(0.5);
      refl.mulAssign(mix(vec3(1), fringe.mul(0.5).add(0.6), float(0.16).mul(float(1).sub(dry))));
    }
    // thick glass gathers light in the middle and shades into its own edge
    refl.mulAssign(float(1).sub(cd.mul(cd)).mul(0.55).add(0.75));
    // a white page is compressed against its highlight, then its midtones
    // pulled apart again: what survives a highlight is contrast, not light
    refl.assign(mix(refl, refl.div(refl.mul(0.9).add(1)), blown.mul(0.8)));
    refl.assign(mix(refl, clamp(refl.sub(0.5).mul(1.5).add(0.42), 0, 1), blown.mul(0.7)));

    // the monitor's body around the panel, then the dark room past it
    const body = inPanel(uvG.sub(0.5).mul(0.86).add(0.5), soft);
    const mirrored = mix(
      mix(vec3(0.008, 0.009, 0.012), vec3(0.03, 0.031, 0.036), body),
      refl,
      onRefl,
    );

    // Schlick against the rippled dome; the screen is far brighter than the
    // eye it lights, so the source carries most of its own weight
    const f0 = 0.035;
    const fres = float(f0).add(pow(float(1).sub(max(dot(N_, V), 0)), 5).mul(1 - f0));
    const source = lum.mul(-0.22).add(0.86);
    const k = clamp(
      U.reflect
        .mul(source)
        .mul(fres.mul(3.6).add(0.7))
        .mul(mask)
        .mul(mix(0.16, 1, onRefl))
        .mul(float(1).sub(lum.mul(0.2)))
        .mul(calm)
        .mul(0.5)
        .mul(float(1).sub(dry.mul(0.3))),
      0,
      1,
    );
    const screened = mirrored.mul(k).toVar();

    // the era's second light, mirrored: a fluorescent bar overhead, a lamp's
    // disc to the side, traced to its own small shape as the screen is
    const F = U.fill;
    const fDen = dot(R, F.normal);
    const fT = dot(F.center.sub(positionWorld), F.normal).div(min(fDen, -0.02));
    const fH = positionWorld.add(R.mul(fT)).sub(F.center);
    const fUv = vec2(dot(fH, F.right).div(F.size.x), dot(fH, F.up).div(F.size.y)).mul(2);
    const corner = mix(float(0.05), float(1), F.round);
    const fDist = length(max(abs(fUv).sub(float(1).sub(corner)), 0)).sub(corner);
    const fMask = smoothstepDown(cd.mul(0.25).add(0.06), 0, fDist).mul(step(fDen, -0.02)).mul(mask);
    screened.addAssign(vec3(F.color).mul(fMask).mul(fres.mul(3).add(0.6)).mul(U.reflect).mul(2.6));

    // the panel as an emitter, and its blown-out middle
    // A white page reflected at a few percent is dimmer than the lit iris under
    // it; what keeps the page readable is its contrast, not its light.
    const emit = refl.mul(onRefl).mul(mask).mul(U.reflect).mul(lum.mul(-0.08).add(0.2)).mul(calm);
    const coreDist = max(abs(uvG.x.sub(0.5)), abs(uvG.y.sub(0.5))).sub(0.18);
    const core = onRefl.mul(smoothstepDown(0.3, 0, coreDist));
    const coreGlow = screenTint(S).mul(core).mul(mask).mul(lum.mul(0.03).add(0.07)).mul(calm);

    // Purkinje P2: the back of the cornea mirrors the screen too, a little
    // smaller and far dimmer, almost on top of the first image
    const uvP2 = uvG.sub(0.5).mul(1.09).add(0.5);
    const p2 = sampleScreen(screen, uvP2, rough.add(1))
      .mul(inPanel(uvP2, 0.03))
      .mul(facing)
      .mul(mask)
      .mul(0.05);

    // the limbus: the rim of the lens catching light, the shade just inside it
    const limbShade = smoothstep(0.68, 1, cd).mul(0.24).mul(mask);
    const rim = vec3(1)
      .mul(smoothstep(0.94, 1, cd))
      .mul(mask)
      .mul(lum.mul(0.09).add(0.05));
    // one streak across the top-left of the dome: glass, not paint
    const across = dot(local.xy.div(ANATOMY.corneaRadius), vec2(0.722, 0.692)).add(0.42);
    const streak = vec3(1)
      .mul(smoothstepDown(0.06, 0, abs(across)))
      .mul(mask)
      .mul(float(1).sub(cd.mul(cd)))
      .mul(lum.mul(0.13).add(0.09));

    // a flash on the camera's axis: a hard dot where the dome looks straight back at the lens
    const facingLens = float(1).sub(max(dot(N_, V), 0));
    const catchlight = vec3(1)
      .mul(smoothstepDown(0.0013, 0.0006, facingLens))
      .mul(U.lens.catchlight)
      .mul(mask)
      .mul(2.2);

    // the mirror screens over the iris, the panel glows on top, the limbus shades
    // all of it, and the rim, the streak and P2 sit on the surface
    const under = iris.color;
    const mirrored_ = under.add(screened.mul(float(1).sub(under)));
    const lit = mirrored_
      .add(emit)
      .add(coreGlow)
      .mul(float(1).sub(limbShade))
      .add(p2)
      .add(rim)
      .add(streak)
      .add(catchlight)
      .mul(U.fade);
    const reflectionOnly = screened
      .add(emit)
      .add(coreGlow)
      .add(p2)
      .add(rim)
      .add(streak)
      .add(catchlight)
      .toVar();
    if (glowOut) glowOut.assign(vec4(reflectionOnly.mul(mask).mul(U.fade), mask));

    // the film: thickness in grey, broken-up spots in red, the lipid layer's drift in blue
    const tearView = mix(vec3(film.r.mul(0.8)), vec3(1, 0.15, 0.1), dry).add(
      vec3(0, 0, film.g.mul(0.25)),
    );

    const view = U.debugView;
    return select(
      view.equal(SPEC_VIEW),
      vec4(reflectionOnly, 1),
      select(
        view.equal(IRIS_VIEW),
        vec4(iris.albedo.mul(mask), mask),
        select(view.equal(TEAR_VIEW), vec4(tearView.mul(mask), mask), vec4(lit.mul(mask), mask)),
      ),
    );
  })();
  if (glowOut) {
    material.outputNode = shade;
    material.mrtNode = mrt({ emissive: glowOut });
  } else {
    material.fragmentNode = shade;
  }
  material.transparent = true;
  material.premultipliedAlpha = true;
  material.depthWrite = false;
  return material;
}
