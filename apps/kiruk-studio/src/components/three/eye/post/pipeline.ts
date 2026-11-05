/**
 * The post chain:
 *
 *   pass ─ MRT (output, emissive; depth for viewZ)
 *        → depth of field (focus and how fast things go soft are uniforms;
 *          off on T1, where nothing pays for it)
 *        → bloom on the emissive target only: the reflection, the tear
 *          meniscus, a flash's catchlight, never the white of the eye
 *        → the era's lens, linear (post/era-lens.ts)
 *        → exposure (a white page is stopped down) and the dark room's falloff
 *        → the filmic curve
 *        → the era's lens, display (lift, gain, gamma, grain)
 *        → sRGB (the renderer's output transform)
 *
 * The Canvas runs flat (no renderer tone mapping), so the curve here is the
 * only one. Materials put their own light in the emissive target with an
 * `mrtNode`; everything else writes nothing there.
 *
 * Lab debug views: "screen" (the era screen pass un-graded, for parity),
 * "focus" (how far each pixel is from the focal plane: red in front, blue
 * behind), "emissive" (what blooms).
 */

import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import {
  type Camera,
  LinearMipmapLinearFilter,
  RenderPipeline,
  type RenderTarget,
  type Scene,
  UnsignedByteType,
  type WebGPURenderer,
} from 'three/webgpu';
import { type N, smoothstepDown } from '../nodes/common';
import { sampleScreen } from '../nodes/screen';
import { T } from '../nodes/tsl';
import type { TierSpec } from '../tiers';
import type { EyeUniforms } from '../uniforms';
import { DEBUG_VIEWS } from '../uniforms';
import { eraLensDisplay, eraLensLinear } from './era-lens';
import { eraMedium } from './era-medium';
import { macroFocus } from './focus';

const {
  Fn,
  abs,
  clamp,
  convertToTexture,
  float,
  length,
  max,
  mix,
  mrt,
  output,
  pass,
  pow,
  sRGBTransferEOTF,
  screenUV,
  select,
  smoothstep,
  vec2,
  vec3,
  vec4,
} = T;

const SCREEN_VIEW = DEBUG_VIEWS.indexOf('screen');
const FOCUS_VIEW = DEBUG_VIEWS.indexOf('focus');
const EMISSIVE_VIEW = DEBUG_VIEWS.indexOf('emissive');

/**
 * Filmic roll-off (the ACES fit), as the live eye grades it. A white page
 * reflected in a wet cornea is genuinely brighter than 1.0; this keeps the
 * highlight and the content.
 */
export function filmic(x: N): N {
  const y = x.mul(0.92);
  return clamp(y.mul(y.mul(2.51).add(0.03)).div(y.mul(y.mul(2.43).add(0.59)).add(0.14)), 0, 1);
}

export interface EyePipeline {
  pipeline: RenderPipeline;
  /** The bloom's strength; the stage writes it per frame (era × lens). */
  bloomStrength: { value: number };
  /** Draws the frame: with the media, through the medium `U.medium.cur` names. */
  render: () => void;
  /**
   * With the media on, each era's medium is its own small pipeline, so the
   * first frame compiles only the era on screen instead of all ten at once
   * (one shader of ~470 KB took 16 s to build on an integrated GPU, and the
   * loader's opening gave up waiting). `quad(n)` is era n's draw material,
   * for telling when its pipeline is built; `warm(n)` also draws era n,
   * first and under the era on screen, so its pipeline gets built (null
   * stops). Null without the media.
   */
  media: { quad: (n: number) => object; warm: (n: number | null) => void } | null;
  dispose: () => void;
}

export function createEyePipeline(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  Ux: EyeUniforms,
  screen: RenderTarget,
  tier: TierSpec,
  emissiveTarget: boolean,
  /** Ten ways of seeing (post/era-medium.ts): the finished frame, once more, through the era's medium. */
  media = false,
): EyePipeline {
  const U: N = Ux;
  const pipeline = new RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  // the emissive target (WebGPU only: three's MRT merge fails on WebGL2,
  // where nothing blooms and the lens's smears have nothing to smear)
  if (emissiveTarget) scenePass.setMRT(mrt({ output, emissive: vec4(0, 0, 0, 1) }));
  const color = scenePass.getTextureNode('output');
  const emissive: N = emissiveTarget ? scenePass.getTextureNode('emissive') : null;
  // what emits stays under 1 (it is a reflection), so 8 bits a channel do: half the bandwidth
  if (emissiveTarget) scenePass.getTexture('emissive').type = UnsignedByteType;
  const viewZ = scenePass.getViewZNode();

  // Depth of field on the macro (post/focus.ts): the iris plane sharp, lashes
  // in front and the face falling away behind going soft. Off on T1.
  const focus = tier.dof === 'off' ? null : macroFocus(Ux, color, viewZ);
  // only what is brighter than the page's own light blooms, and gently
  // (the addon's types lag three's runtime, which has getTextureNode)
  const glowNode: N = emissive ? bloom(emissive, 0.25, 0.4, 0.42) : null;
  // a quarter of the frame is plenty for a soft glow
  glowNode?.setResolutionScale(0.25);

  const none = vec3(0);
  const glow = (uv: N) => (glowNode ? glowNode.getTextureNode().sample(uv).rgb : none);
  const light = (uv: N) => (emissive ? emissive.sample(uv).rgb : none);
  const image = (uv: N) => {
    const base = focus ? focus.focusedAt(uv) : color.sample(uv).rgb;
    return glowNode ? base.add(glow(uv)) : base;
  };

  const screenLum: N = U.screenLum;
  const debugView: N = U.debugView;

  const finished = Fn(() => {
    const c = eraLensLinear(
      Ux,
      image,
      glow,
      light,
      (uv: N) => color.sample(uv).rgb,
      emissiveTarget,
    ).toVar();
    // A phosphor terminal is printed as it is; a white page is stopped down,
    // which is the only way its layout survives its own light.
    const blown = smoothstep(0.3, 0.92, screenLum);
    c.mulAssign(float(1).sub(blown.mul(0.34)));
    // the outer frame is a dark room and stays one; the lens may darken it more
    const vr = length(screenUV.sub(0.5).mul(vec2(1.22, 1)));
    const room = mix(0.38, 1, smoothstepDown(0.8, 0.22, vr));
    const lensVig = mix(
      float(1),
      smoothstepDown(0.95, 0.25, vr),
      U.lens.vignette.sub(0.3).max(0).mul(U.lens.on).mul(1.4),
    );
    c.mulAssign(room);
    c.mulAssign(lensVig);
    const graded = eraLensDisplay(Ux, filmic(c));

    // the screen pass as stored; EOTF here so the output transform hands it back untouched
    const raw = sRGBTransferEOTF(
      sampleScreen(screen, vec2(screenUV.x, float(1).sub(screenUV.y)), 0),
    );
    // how far from the focal plane, as the depth of field sees it
    const off = viewZ.negate().sub(U.cam.focus).div(U.cam.focal);
    const focusView = mix(
      vec3(0.08),
      select(off.lessThan(0), vec3(1, 0.25, 0.15), vec3(0.2, 0.45, 1)),
      clamp(abs(off), 0, 1),
    ).add(color.rgb.mul(0.25));
    const emissiveView = light(screenUV).add(glow(screenUV).mul(0.5));
    return vec4(
      select(
        debugView.equal(SCREEN_VIEW),
        raw,
        select(
          debugView.equal(FOCUS_VIEW),
          focusView,
          select(debugView.equal(EMISSIVE_VIEW), emissiveView, graded),
        ),
      ),
      1,
    );
  })();
  // The medium resamples the finished frame (cells, curves, halftone), so it
  // reads it as a texture: display-encoded, 8 bits a channel, as a screen
  // shows it (every medium works on display values; half the bandwidth of
  // a linear half-float copy, and no decode per tap). Its mips are the
  // frosted glass's blur, a few taps of a coarse level. Its alpha is the
  // depth, ±20 mm about the focal plane (near is 1), which 2013's components
  // stand on.
  const relief = clamp(float(0.5).sub(viewZ.negate().sub(U.cam.focus).div(40)), 0, 1);
  pipeline.outputNode = finished;
  const frameTex: N = media
    ? convertToTexture(vec4(pow(max(finished.rgb, 0), vec3(1 / 2.2)), relief), null, null, {
        type: UnsignedByteType,
        generateMipmaps: true,
        minFilter: LinearMipmapLinearFilter,
      })
    : null;
  // one pipeline per era's medium (0: none, the frame as it is), made when first asked for
  const stages = new Map<number, RenderPipeline>();
  const stage = (n: number) => {
    let st = stages.get(n);
    if (!st) {
      st = new RenderPipeline(renderer);
      st.outputNode = eraMedium(Ux, frameTex, n);
      stages.set(n, st);
    }
    return st;
  };
  const shown = () => Math.round(Math.min(10, Math.max(0, U.medium.cur.value)));
  let warming: number | null = null;

  return {
    pipeline,
    bloomStrength: glowNode ? glowNode.strength : { value: 0 },
    render: () => {
      if (!media) return pipeline.render();
      const n = shown();
      // (drawn first, so the era on screen overwrites it)
      if (warming !== null && warming !== n) stage(warming).render();
      stage(n).render();
    },
    media: media
      ? {
          quad: (n) =>
            (stage(n) as unknown as { _quadMesh: { material: object } })._quadMesh.material,
          warm: (n) => {
            warming = n;
          },
        }
      : null,
    dispose: () => {
      for (const st of stages.values()) st.dispose();
      pipeline.dispose();
      focus?.dispose();
      glowNode?.dispose();
    },
  };
}
