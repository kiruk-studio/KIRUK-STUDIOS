/**
 * The era's lens: how that era's camera recorded a face (look.ts EraLens).
 *
 * One pass over the focused, bloomed image. Everything here is a uniform:
 * eras crossfade by damping numbers, and the artefact is chosen by a branch
 * on a uniform (the same for every pixel, so free), so only the era's own
 * artefact pays for its samples. `lens.on` at 0 is the kill switch: what is
 * left is a clean photograph (focus, bloom, the grade).
 *
 * Before the tone curve (linear): the frame's drift on a film gate, webcam
 * blocks, interlace combing, lateral colour, sharpening or softness,
 * halation, the comet tail, the CCD smear and its fringes, flare ghosts,
 * exposure pumping, white balance, a split tone, saturation.
 * After it (display): lift, gain, gamma, grain.
 */

import { LENS_ARTEFACTS, type LensArtefact } from '../look';
import { smoothstepDown } from '../nodes/common';
import { type N, T } from '../nodes/tsl';
import type { EyeUniforms } from '../uniforms';

const {
  If,
  abs,
  dot,
  float,
  floor,
  fract,
  max,
  mix,
  mod,
  pow,
  screenCoordinate,
  screenSize,
  screenUV,
  sin,
  smoothstep,
  vec2,
  vec3,
} = T;

const ART = (a: LensArtefact) => LENS_ARTEFACTS.indexOf(a);

/**
 * A hash with no sin() in it (Hoskins' hash12): sin-based hashes lose
 * precision at pixel coordinates in the thousands and show as stripes, which
 * grain over a whole frame makes obvious.
 */
function grainHash(p: N): N {
  const p3 = fract(vec3(p.x, p.y, p.x).mul(0.1031)).toVar();
  p3.addAssign(dot(p3, vec3(p3.y, p3.z, p3.x).add(33.33)));
  return fract(p3.x.add(p3.y).mul(p3.z));
}
const LUMA = vec3(0.2126, 0.7152, 0.0722);

/**
 * @param image the scene, focused and bloomed, at a UV (top-left)
 * @param glow  the bloom alone, at a UV: what halation and the fringes are made of
 * @param light the emissive target, at a UV: the whole reflection, which the
 *              comet tail, the CCD smear and the flare ghosts are made of
 * @param sharp the scene before focus and bloom, at a UV: one sample, for the
 *              sharpening's neighbours (a halo doesn't need the bokeh)
 * @param hasLight whether `light` is real (WebGPU) or black (WebGL2)
 * @returns the linear colour before the tone curve
 */
export function eraLensLinear(
  Ux: EyeUniforms,
  image: (uv: N) => N,
  glow: (uv: N) => N,
  light: (uv: N) => N,
  sharp: (uv: N) => N,
  hasLight = true,
): N {
  const U: N = Ux;
  const L = U.lens;
  const on = L.on;
  const amount = L.amount.mul(on).toVar();
  const art = L.artefact;
  const t = U.time;
  const px = vec2(1).div(screenSize).toVar();

  // ---- where each pixel samples from -------------------------------------
  const uv = screenUV.toVar();
  // film: the gate weave, the whole frame drifting a fraction of a pixel
  If(art.equal(ART('film')), () => {
    const weave = vec2(
      sin(t.mul(0.7))
        .mul(0.6)
        .add(sin(t.mul(0.19)).mul(0.4)),
      sin(t.mul(0.53).add(1)).mul(0.5),
    );
    uv.addAssign(weave.mul(px).mul(amount).mul(0.7));
  });
  // a 320×240 webcam: every pixel is one of its blocks
  If(art.equal(ART('webcam')), () => {
    const cells = vec2(320, 240);
    uv.assign(mix(uv, floor(uv.mul(cells)).add(0.5).div(cells), amount));
  });
  // interlace: alternate rows are a field late, so a moving image combs
  If(art.equal(ART('interlace')), () => {
    const odd = mod(floor(screenCoordinate.y), 2);
    uv.subAssign(L.motion.div(50).mul(odd).mul(amount));
  });

  // Each of these costs samples, so each runs only for an era that uses it
  // (branches on uniforms: the same for every pixel, so free).
  const c = image(uv).toVar();
  // ---- lateral colour: each channel lands a little apart, more at the edge
  const chroma = L.chroma.mul(on);
  If(chroma.greaterThan(0.01), () => {
    const ca = uv.sub(0.5).mul(chroma.mul(0.008));
    c.assign(vec3(image(uv.add(ca)).r, c.g, image(uv.sub(ca)).b));
  });
  // ---- sharpening halos, or a soft lens: unsharp mask, four taps a pixel out
  const sharpen = L.sharpen.mul(on);
  If(abs(sharpen).greaterThan(0.01), () => {
    const blur = sharp(uv.add(vec2(px.x, 0)))
      .add(sharp(uv.sub(vec2(px.x, 0))))
      .add(sharp(uv.add(vec2(0, px.y))))
      .add(sharp(uv.sub(vec2(0, px.y))))
      .mul(0.25);
    c.assign(max(c.add(sharp(uv).sub(blur).mul(sharpen.mul(2.2))), 0));
  });
  // ---- halation: film's red layer and a tube's glow, round what is brightest
  const halation = L.halation.mul(on);
  If(halation.greaterThan(0.01), () => {
    c.addAssign(
      glow(uv)
        .mul(vec3(1, 0.22, 0.08))
        .mul(halation.mul(1.6)),
    );
  });

  // ---- the era's artefact -------------------------------------------------
  // a tube camera: highlights smear into a tail behind any move
  If(art.equal(ART('comet')), () => {
    const back = L.motion.mul(0.022);
    let tail: N = vec3(0);
    for (let i = 1; i <= 5; i++) tail = tail.add(light(uv.sub(back.mul(i))).mul(0.72 ** i));
    c.addAssign(tail.mul(amount).mul(0.45));
  });
  // an early digital camera: JPEG blocks in the shadows, purple fringes on hard
  // edges, and the bright reflection smearing down its column of the CCD
  If(art.equal(ART('ccd')), () => {
    const cells = screenSize.div(8);
    const blocks = floor(uv.mul(cells)).add(0.5).div(cells);
    const shadow = smoothstepDown(0.12, 0.015, dot(c, LUMA));
    c.assign(mix(c, image(blocks).rgb, shadow.mul(amount).mul(0.85)));
    let smear: N = vec3(0);
    for (const k of [0.04, 0.09, 0.16, 0.26, 0.4]) {
      smear = smear.add(
        light(vec2(uv.x, uv.y.add(k)))
          .add(light(vec2(uv.x, uv.y.sub(k))))
          .mul(0.5 - k),
      );
    }
    c.addAssign(
      smear
        .mul(vec3(1, 0.97, 0.92))
        .mul(amount)
        .mul(0.22),
    );
    const edge = max(glow(uv.add(px.mul(2))).sub(glow(uv)), 0);
    c.addAssign(
      edge
        .mul(vec3(0.55, 0.05, 0.95))
        .mul(amount)
        .mul(2.5),
    );
  });
  // a phone lens: ghosts of the bright reflection mirrored through the centre
  If(art.equal(ART('flare')), () => {
    const m = float(1).sub(uv);
    const ghosts = light(m)
      .mul(vec3(0.5, 0.8, 1))
      .mul(0.12)
      .add(
        light(m.sub(0.5).mul(0.55).add(0.5))
          .mul(vec3(1, 0.7, 0.4))
          .mul(0.09),
      )
      .add(
        glow(uv.sub(0.5).mul(-1.6).add(0.5))
          .mul(vec3(0.6, 1, 0.7))
          .mul(0.15),
      );
    c.addAssign(ghosts.mul(amount));
  });
  // a webcam's auto-exposure, forever hunting
  If(art.equal(ART('webcam')), () => {
    c.mulAssign(
      sin(t.mul(1.9))
        .mul(0.07)
        .add(sin(t.mul(0.53)).mul(0.05))
        .mul(amount)
        .add(1),
    );
  });

  // ---- colour ---------------------------------------------------------------
  const wb = L.wb.mul(on);
  c.mulAssign(vec3(wb.mul(0.1).add(1), wb.mul(0.015).add(1), wb.mul(-0.13).add(1)));
  const lum = dot(c, LUMA).toVar();
  const split = L.split.mul(on);
  c.addAssign(
    vec3(0.05, 0.012, -0.045)
      .mul(smoothstep(0.25, 0.85, lum))
      .add(vec3(-0.025, 0.004, 0.035).mul(smoothstepDown(0.35, 0.03, lum)))
      .mul(split)
      .mul(max(lum, 0.05).mul(2).add(0.3)),
  );
  // saturation, except (with isolate) where the reflection is: 1970's green
  // rows stay the only colour in the frame
  // (with no emissive target to find the reflection by, an isolating era
  // keeps its colour rather than lose the one colour it is about)
  const keep = hasLight
    ? smoothstep(0.03, 0.22, dot(light(uv), LUMA)).mul(L.isolate.mul(on))
    : L.isolate.mul(on);
  // (the monochrome leans green where the era's screen was a phosphor)
  const mono = vec3(dot(c, LUMA)).mul(mix(vec3(1), vec3(0.84, 1.06, 0.9), L.phosphor.mul(on)));
  c.assign(mix(mono, c, mix(mix(float(1), L.sat, on), float(1), keep)));
  return max(c, 0);
}

/**
 * After the tone curve: lift, gain, gamma and grain, all off with the kill
 * switch. They are display-referred, so they work on the encoded value (≈
 * sRGB, γ 2.2) and hand back linear for the output transform: a lift of 0.09
 * means 0.09 on screen, not three times that.
 */
export function eraLensDisplay(Ux: EyeUniforms, graded: N): N {
  const U: N = Ux;
  const L = U.lens;
  const on = L.on;
  const c = pow(max(graded, 0), vec3(1 / 2.2)).toVar();
  const lift = L.lift.mul(on);
  c.assign(
    c
      .mul(mix(float(1), L.gain, on))
      .mul(float(1).sub(lift))
      .add(lift),
  );
  c.assign(pow(max(c, 0), vec3(float(1).div(mix(float(1), L.gamma, on)))));
  // grain: per frame (frozen under reduced motion), stronger in the shadows
  const cell = floor(screenCoordinate.xy.div(max(L.grainSize, 0.5)));
  const n = grainHash(cell.add(vec2(L.seed.mul(13.0), L.seed.mul(7.0)))).sub(0.5);
  const lum = dot(c, LUMA);
  c.addAssign(
    n
      .mul(L.grain.mul(on))
      .mul(float(1).sub(lum.mul(0.5)))
      .mul(0.9),
  );
  return pow(max(c, 0), vec3(2.2));
}
