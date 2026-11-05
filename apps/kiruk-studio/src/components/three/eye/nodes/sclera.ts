/**
 * The globe: a wet, lit ball in a socket, seen through the lids.
 *
 *  · Light. The era's screen is the key: in front of the face, up and to the
 *    left. Its colour is the screen's own 1×1 mip. The white is not chalk, so
 *    the light wraps past the terminator, red furthest, the way it does
 *    through any tissue that scatters.
 *  · The person. Vessels and mottling come from a per-person bake
 *    (bake/vessels.ts), looked up by the ball's own direction, so they turn
 *    with the gaze. Age yellows the exposed corners.
 *  · Wet. The tear film mirrors the screen: the reflected ray is traced to the
 *    screen's plane and the screen is sampled there, blurred by a mip bias for
 *    the roughness of conjunctiva under a tear film, weighted by Fresnel.
 *  · The socket. The upper lid rests on the ball and shades it; the lower lid
 *    a little; the corners are pockets almost no light reaches; the white
 *    reddens toward the lid margins. Measured from the same lid curves the
 *    lids are drawn with (lids.ts).
 *
 * The iris and pupil here are a stand-in cap. P3 adds the cornea over them
 * and P4 replaces them with the refracted, baked iris.
 */

import { MeshBasicNodeMaterial, type RenderTarget } from 'three/webgpu';
import { ANATOMY } from '../anatomy';
import { vesselUv } from '../bake/vessels';
import { DEBUG_VIEWS, type EyeUniforms } from '../uniforms';
import { inPanel, type N, smoothstepDown } from './common';
import { socketShade3d } from './margins';
import { sampleScreen, screenLight } from './screen';
import { T } from './tsl';

const {
  Fn,
  abs,
  cameraPosition,
  clamp,
  dot,
  float,
  max,
  min,
  mix,
  normalLocal,
  normalWorld,
  positionWorld,
  pow,
  reflect,
  select,
  smoothstep,
  sqrt,
  step,
  texture,
  vec2,
  vec3,
} = T;

const VIEW = (name: (typeof DEBUG_VIEWS)[number]) => DEBUG_VIEWS.indexOf(name);

export function scleraMaterial(Ux: EyeUniforms, screen: RenderTarget, vessels: RenderTarget) {
  const U: N = Ux;

  const shade = Fn(() => {
    const nO = normalLocal.normalize().toVar(); // the ball's own frame: turns with the gaze
    const nW = normalWorld.normalize().toVar();
    const V = cameraPosition.sub(positionWorld).normalize().toVar();
    const NV = max(dot(nW, V), 0).toVar();

    // ---- the socket, measured from the lids' own margins ----------------------
    const sock = socketShade3d(positionWorld, Ux);
    const toRim = sock.toRim.toVar();
    const occl = sock.shade.toVar();

    // ---- the person's white ------------------------------------------------
    const ves = texture(vessels.texture, vesselUv(nO)).toVar();
    const vesAmt = U.sclera.vessels
      .mul(toRim.mul(0.8).add(0.6))
      .mul(mix(float(1), float(1.3), smoothstepDown(-5, -10, positionWorld.x)));
    const albedo = vec3(U.sclera.tint).toVar();
    albedo.assign(
      mix(
        albedo,
        vec3(0.86, 0.8, 0.64),
        U.sclera.age.mul(0.35).mul(smoothstep(0.2, 0.8, abs(nO.x))),
      ),
    );
    albedo.mulAssign(ves.b.mul(0.12).add(0.94));
    albedo.assign(mix(albedo, vec3(0.8, 0.46, 0.44), clamp(ves.r.mul(vesAmt).mul(0.8), 0, 0.6))); // deep, broad, soft
    albedo.assign(mix(albedo, vec3(0.6, 0.1, 0.09), clamp(ves.g.mul(vesAmt).mul(2.2), 0, 0.9))); // fine, red, sharp
    albedo.assign(mix(albedo, vec3(0.5, 0.4, 0.39), toRim.mul(0.55)));
    // the plica: a soft pink fold of conjunctiva beside the caruncle, so the
    // mound meets the white through flesh rather than along an edge
    const Pw = positionWorld;
    const plica = smoothstepDown(-7.4, -9.2, Pw.x).mul(
      smoothstepDown(2.6, 0.8, abs(Pw.y.add(0.8))),
    );
    albedo.assign(mix(albedo, vec3(0.72, 0.48, 0.45), plica.mul(0.55)));
    albedo.assign(mix(albedo, vec3(0.86, 0.6, 0.56), smoothstepDown(-5.5, -10.5, Pw.x).mul(0.2)));

    // ---- stand-in iris (P4 replaces) ----------------------------------------
    const rad = sqrt(max(float(1).sub(nO.z.mul(nO.z)), 0))
      .mul(U.ballRadius)
      .div(ANATOMY.irisRadius)
      .toVar();
    const front = step(0, nO.z);
    const irisMask = float(1)
      .sub(smoothstep(0.985, 1, rad))
      .mul(front)
      .toVar();
    const iris = mix(
      vec3(0.07, 0.05, 0.04),
      vec3(0.3, 0.21, 0.13),
      smoothstep(U.pupil, 1, rad),
    ).toVar();
    iris.assign(mix(iris, vec3(0.035, 0.035, 0.048), smoothstep(0.82, 1, rad).mul(0.88))); // the limbal ring
    const pupil = float(1)
      .sub(smoothstep(U.pupil.sub(0.012), U.pupil.add(0.012), rad))
      .mul(front);
    const base = mix(albedo, iris, irisMask).toVar();
    base.assign(mix(base, vec3(0.008), pupil));
    // the limbus: a soft blue-grey halo on the white just outside the iris
    base.assign(
      mix(
        base,
        vec3(0.13, 0.14, 0.18),
        smoothstepDown(0.055, 0, abs(rad.sub(1.01)))
          .mul(0.62)
          .mul(front),
      ),
    );
    base.assign(
      mix(
        base,
        vec3(0.46, 0.49, 0.56),
        smoothstepDown(0.045, 0, abs(rad.sub(1.075)))
          .mul(0.22)
          .mul(front),
      ),
    );

    // ---- light ----------------------------------------------------------------
    const D = U.light.dir;
    const NL = dot(nW, D);
    const wrapW = vec3(0.42, 0.3, 0.24);
    const diff = pow(clamp(vec3(NL).add(wrapW).div(wrapW.add(1)), 0, 1), vec3(1.6));
    const avg = screenLight(screen).toVar();
    const hue = avg.div(max(max(avg.r, avg.g), max(avg.b, 0.001)));
    const lum = U.screenLum;
    // Kept under 1 at its brightest: the filmic curve is for the screen's
    // reflection, and a white that already sits on the shoulder loses every
    // shadow the lids lay on it.
    const key = mix(vec3(1), hue, 0.3).mul(lum.mul(0.22).add(0.54));
    const amb = mix(vec3(1), hue, 0.5).mul(lum.mul(0.1).add(0.07));
    // the globe falls into the socket's shadow toward its silhouette
    const socket = smoothstep(0.05, 0.75, NV).mul(0.5).add(0.5);
    // and the era's second light, if it has one
    const fill = vec3(U.fill.color).mul(clamp(dot(nW, U.fill.dir), 0, 1));
    const light = amb.add(key.mul(diff)).add(fill).mul(socket).mul(occl).toVar();

    // The cornea stands proud of the ball, so it shades the white beside it on
    // the side away from the screen and lends it a thin bright rim on the side
    // toward it. Without this the iris is a circle drawn on a ball.
    const cRad = rad.mul(ANATOMY.irisRadius / ANATOMY.corneaRadius);
    const beside = smoothstep(0.97, 1.3, cRad)
      .mul(float(1).sub(smoothstep(1.3, 1.85, cRad)))
      .mul(front);
    const towardKey = dot(nO.xy.normalize(), D.xy.normalize());
    light.mulAssign(float(1).sub(beside.mul(clamp(towardKey.negate(), 0, 1)).mul(0.34)));
    light.addAssign(
      vec3(0.9, 0.92, 1)
        .mul(beside)
        .mul(clamp(towardKey, 0, 1))
        .mul(0.05),
    );

    // ---- wet: the screen, mirrored --------------------------------------------
    // traced to the screen's rectangle, as the cornea does
    const R = reflect(V.negate(), nW);
    const Nn = U.light.normal;
    const denom = dot(R, Nn);
    const tHit = dot(U.light.center.sub(positionWorld), Nn).div(min(denom, -0.02));
    const hit = positionWorld.add(R.mul(tHit)).sub(U.light.center);
    const suv = vec2(
      dot(hit, U.light.right).div(U.light.size.x).add(0.5),
      dot(hit, U.light.up).div(U.light.size.y).add(0.5),
    ).toVar();
    const onPanel = inPanel(suv, 0.06).mul(step(denom, -0.02));
    const mirror = sampleScreen(screen, suv, float(4.2).add(U.mip)).mul(onPanel);
    const F0 = 0.025;
    const fres = float(F0).add(pow(float(1).sub(NV), 5).mul(1 - F0));
    // the stand-in iris is not wet: P3's cornea carries its reflection
    const spec = mirror
      .mul(fres.mul(3).add(0.35))
      .mul(U.reflect)
      .mul(0.3)
      .mul(occl)
      .mul(float(1).sub(irisMask))
      .toVar();

    const final = base.mul(light).add(spec).mul(U.fade);
    const view = U.debugView;
    return select(
      view.equal(VIEW('normal')),
      nW.mul(0.5).add(0.5),
      select(
        view.equal(VIEW('lit')),
        light,
        select(
          view.equal(VIEW('masks')),
          ves.rgb,
          select(
            view.equal(VIEW('spec')),
            spec.mul(4),
            select(view.equal(VIEW('socket')), vec3(occl, toRim, 0), final),
          ),
        ),
      ),
    );
  });

  const material = new MeshBasicNodeMaterial();
  material.name = 'Sclera';
  material.colorNode = shade();
  return material;
}
