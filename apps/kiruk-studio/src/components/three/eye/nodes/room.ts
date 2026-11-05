/**
 * The room behind the eye — a port of "the room" in ERA_EYE_FRAG.
 *
 * Near-black, with one lit object in it: the era's monitor, up and to the
 * left, out of focus because the shot is focused on the eye. A tube is
 * curved, so the panel is sampled through a barrel; it sits in a deep beige
 * bezel when it is a CRT and almost none when it is flat. The desk under it
 * is polished enough to hold a blurred, upside-down copy of it.
 *
 * Drawn as the scene's background, in the eye's own units, so it frames
 * exactly as the live eye's room does at any viewport.
 */

import { Mesh, MeshBasicNodeMaterial, PlaneGeometry, type RenderTarget } from 'three/webgpu';
import type { EyeUniforms } from '../uniforms';
import { hash21, inPanel, lensScale, type N, smoothstepDown } from './common';
import { eyeSpace, vUvUp } from './frame';
import { sampleScreen } from './screen';
import { T } from './tsl';

const {
  Fn,
  abs,
  cos,
  dot,
  exp,
  float,
  floor,
  fract,
  length,
  max,
  mix,
  mod,
  positionGeometry,
  screenCoordinate,
  screenSize,
  select,
  sin,
  smoothstep,
  step,
  vec2,
  vec3,
  vec4,
} = T;

/** Same near-black as the picker's ROOM, so a poster's edges and the stage meet. */
export const ROOM_HEX = '#040507';

/** The monitor in the shot behind the eye. Eye units. */
const ROOM_C = vec2(-0.86, 0.34);
const ROOM_H = vec2(0.62, 0.38);

/**
 * A cathode-ray tube: aperture grille, scanlines locked to the panel, the slow
 * refresh bar rolling on an eight-second loop, static, and phosphor bloom.
 */
export function tube(c: N, tuv: N, amt: N, t: N): N {
  const m = mod(screenCoordinate.x, 3);
  const grille = vec3(step(m, 1), step(1, m).mul(step(m, 2)), step(2, m));
  const g = c.mul(mix(vec3(1), grille.mul(0.85).add(0.55), amt.mul(0.65))).toVar();
  g.mulAssign(float(1).sub(amt.mul(0.26).mul(cos(tuv.y.mul(780)).mul(0.5).add(0.5))));
  const bar = fract(tuv.y.mul(0.9).sub(t.div(8)));
  g.mulAssign(
    float(1).sub(
      amt
        .mul(0.2)
        .mul(smoothstepDown(0.1, 0, bar))
        .mul(smoothstep(0, 0.02, bar)),
    ),
  );
  g.addAssign(
    hash21(tuv.mul(screenSize).add(fract(t.mul(7))))
      .sub(0.5)
      .mul(amt)
      .mul(0.055),
  );
  g.addAssign(g.mul(amt).mul(0.3));
  return select(amt.lessThan(0.002), c, g);
}

/**
 * Where a point of the shot lands on the monitor behind the eye: through the
 * room's perspective and the tube's barrel. Returns the panel UV (y up).
 */
export function monitorUv(p: N, crt: N): N {
  const persp = p.y.mul(0.1).add(1);
  const flat0 = p.div(persp).sub(ROOM_C).div(ROOM_H).mul(0.5).add(0.5);
  const cc = flat0.mul(2).sub(1).toVar();
  const bulge = crt.mul(0.14).add(0.05);
  cc.mulAssign(lensScale(bulge, dot(cc, cc).mul(0.35)));
  return cc.mul(0.5).add(0.5);
}

/** How much of the monitor's glow reaches this point of the shot. */
export function monitorThrow(p: N, crt: N): N {
  const sIn = abs(monitorUv(p, crt).sub(0.5));
  return exp(max(max(sIn.x, sIn.y).sub(0.5), 0).mul(-3.6));
}

/** The monitor's colour as it lights the room: page ground toward its panels. */
export function screenTint(S: N): N {
  return mix(S.bg, mix(S.panel, S.accent, 0.5), 0.65);
}

export function roomNode(U: EyeUniforms, screen: RenderTarget) {
  const S: N = U.screen;
  const mip: N = U.mip;
  const screenTex = (uvUp: N, blur: N | number) => sampleScreen(screen, uvUp, float(blur).add(mip));

  return Fn(() => {
    const t = S.time;
    const crt = S.crt;
    const aspect = screenSize.x.div(screenSize.y);
    const vUv = vUvUp();
    const p = eyeSpace(U).toVar();

    // ---- the monitor, through a barrel ------------------------------------
    const scrUv = monitorUv(p, crt).toVar();

    const sIn = abs(scrUv.sub(0.5)).toVar();
    const onScr = inPanel(scrUv, 0.01).toVar();
    // A tube needs a deep beige box around it; a flat panel needs almost nothing.
    const bw = mix(0.016, 0.062, crt);
    const bezel = float(1)
      .sub(smoothstep(bw.mul(0.72).add(0.5), bw.add(0.5), sIn.x))
      .mul(float(1).sub(smoothstep(bw.add(0.5), bw.mul(1.34).add(0.5), sIn.y)))
      .sub(onScr);

    // out of focus: the shot is focused on the eye, not on the monitor
    const panel = tube(screenTex(scrUv, crt.mul(1.2).add(3.4)), scrUv, crt, t).mul(onScr);
    const glow = mix(S.bg, mix(S.panel, S.accent, 0.5), 0.62).toVar();

    // Studio: the room is the sheet. The eye is lit by that paper, not a dark set.
    const col = vec3(0.9, 0.83, 0.72).toVar();
    const throwOff = exp(max(max(sIn.x, sIn.y).sub(0.5), 0).mul(-3.6)).toVar();
    col.addAssign(glow.mul(throwOff).mul(0.22));

    // ---- the desk: the panel again, flipped and blurred --------------------
    const floorY = -0.46;
    const below = smoothstepDown(floorY + 0.12, floorY - 0.12, p.y).toVar();
    const depth = max(float(floorY).sub(p.y), 0);
    const mirroredY = float(floorY * 2)
      .sub(p.y)
      .add(depth.mul(0.22));
    const mUv = vec2(p.x, mirroredY).sub(ROOM_C).div(ROOM_H).mul(0.5).add(0.5).toVar();
    mUv.assign(
      vec2(
        mUv.x.add(
          sin(mirroredY.mul(26).add(t.mul(0.4)))
            .mul(0.004)
            .mul(depth),
        ),
        mUv.y,
      ),
    );
    const mirror = screenTex(mUv, depth.mul(5).add(3.4)).mul(inPanel(mUv, 0.1));
    col.addAssign(
      mirror
        .mul(exp(depth.mul(-3.6)))
        .mul(below)
        .mul(0.18),
    );
    col.addAssign(
      glow
        .mul(exp(depth.mul(-2.6)))
        .mul(below)
        .mul(0.04),
    );
    col.mulAssign(float(1).sub(below.mul(0.3))); // the desk in shadow

    col.assign(
      mix(col, mix(vec3(0.01, 0.011, 0.014), vec3(0.062, 0.057, 0.046), crt), max(bezel, 0)),
    );
    col.assign(mix(col, panel.mul(0.3), onScr.mul(0.75)));

    // the desk in front of the monitor, so the bottom of the shot is a room
    const desk = smoothstepDown(-0.1, -0.62, p.y);
    col.addAssign(
      glow
        .mul(desk)
        .mul(0.055)
        .mul(float(1).sub(smoothstep(0.2, 1.4, abs(p.x)))),
    );
    col.addAssign(glow.mul(0.03).mul(exp(length(p.sub(vec2(-0.86, 0.34))).mul(-1.15))));

    // motes float in the room, and the room has grain
    const dust = smoothstep(0.99, 1, hash21(floor(vUv.mul(screenSize).div(3))));
    col.addAssign(dust.mul(throwOff).mul(0.2));
    col.addAssign(
      hash21(vUv.mul(screenSize).add(fract(t)))
        .sub(0.5)
        .mul(0.012),
    );
    // depth: everything falls away from the middle of the shot
    col.mulAssign(
      smoothstepDown(1.6, 0.06, length(vUv.sub(0.5).mul(vec2(aspect, 1))))
        .mul(0.76)
        .add(0.24),
    );
    return col;
  })();
}

/**
 * The room as a quad on the far plane, drawn after everything opaque. Where
 * the skin or the globe already covers a pixel the depth test skips it; as a
 * scene background it would run on every pixel before anything else.
 */
export function roomMesh(U: EyeUniforms, screen: RenderTarget) {
  const material = new MeshBasicNodeMaterial();
  material.name = 'Room';
  material.colorNode = roomNode(U, screen);
  material.vertexNode = vec4(positionGeometry.xy, 1, 1);
  material.depthWrite = false;
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.name = 'room';
  mesh.frustumCulled = false;
  mesh.renderOrder = 100;
  return mesh;
}
