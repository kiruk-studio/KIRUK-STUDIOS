/**
 * The paper engine — one full-screen pass on three.js WebGPURenderer
 * (WebGPU, or its WebGL2 backend), drawn only when something changes.
 *
 *   reflected light   rag paper as made: flocs, tooth under an upper-left raking light, fibres
 *   transmitted light hold the page up: laid and chain wires and the eye watermark show through
 *   ink pass          HTML-in-Canvas (Chrome origin trial 148–150 / flag): a live DOM line is
 *                     drawn into a texture and inked *into* the paper — starved on the tooth,
 *                     wicked along the fibres where the pointer wets it
 *
 * spec-link: ideas/studio-dawn/folio.md — HTML-in-Canvas
 */

import {
  abs,
  clamp,
  dot,
  exp,
  float,
  fract,
  length,
  max,
  mix,
  mod,
  normalize,
  screenUV,
  smoothstep,
  step,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  HTMLTexture,
  LinearFilter,
  NoColorSpace,
  NodeMaterial,
  QuadMesh,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  WebGPURenderer,
} from 'three/webgpu';
import { bakePaper, bakeWatermark, TILE } from './bake';

export type PaperInfo = { backend: 'webgpu' | 'webgl2'; htmlInCanvas: boolean; dpr: number };

export type PaperState = {
  scroll: number;
  transmit: number;
  pointer: [number, number];
  wet: number;
  chainStep: number;
  chainOffset: number;
  inkRect: [number, number, number, number] | null;
};

/** Is the HTML-in-Canvas API here, in any of its shipped shapes? */
export function htmlInCanvasSupported() {
  return typeof HTMLCanvasElement !== 'undefined' && 'requestPaint' in HTMLCanvasElement.prototype;
}

const PAPER = vec3(0.957, 0.925, 0.875); // #f4ecdf — the sheet's working value
const LIGHT = vec3(1.0, 0.965, 0.89); // a window, warm
const INK = vec3(0.102, 0.071, 0.055); // #1a120e

export async function createPaper(canvas: HTMLCanvasElement, inkSource: HTMLElement | null) {
  const renderer = new WebGPURenderer({ canvas, antialias: false, alpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  await renderer.init();
  const backend: PaperInfo['backend'] = (renderer.backend as { isWebGPUBackend?: boolean })
    .isWebGPUBackend
    ? 'webgpu'
    : 'webgl2';

  const img = bakePaper();
  const paperTex = new DataTexture(new Uint8Array(img.data.buffer), TILE, TILE, RGBAFormat);
  paperTex.wrapS = paperTex.wrapT = RepeatWrapping;
  paperTex.magFilter = paperTex.minFilter = LinearFilter;
  paperTex.colorSpace = NoColorSpace;
  paperTex.needsUpdate = true;

  const wmTex = new CanvasTexture(bakeWatermark() as unknown as HTMLCanvasElement);
  wmTex.wrapS = wmTex.wrapT = ClampToEdgeWrapping;
  wmTex.colorSpace = NoColorSpace;

  const uRes = uniform(vec2(window.innerWidth, window.innerHeight));
  const uScroll = uniform(0);
  const uTransmit = uniform(0);
  const uChainStep = uniform(260);
  const uChainOffset = uniform(0);
  const uPointer = uniform(vec2(-999, -999));
  const uWet = uniform(0);
  const uInk = uniform(vec4(0, 0, 1, 1));
  const uInkOn = uniform(0);

  // HTML-in-Canvas: the ink source lives inside the canvas; three uploads it on every paint.
  let inkTex: HTMLTexture | null = null;
  if (inkSource && htmlInCanvasSupported()) {
    try {
      canvas.setAttribute('layoutsubtree', '');
      canvas.setAttribute('content', 'drawable');
      inkSource.setAttribute('drawable', '');
      inkTex = new HTMLTexture(inkSource);
      inkTex.colorSpace = SRGBColorSpace;
      inkTex.flipY = false;
    } catch {
      inkTex = null;
    }
  }

  const css = screenUV.mul(uRes);
  const doc = css.add(vec2(0, uScroll));
  const tuv = doc.div(TILE);
  const s = texture(paperTex, tuv);
  const sx = texture(paperTex, tuv.add(vec2(1 / TILE, 0))).x;
  const sy = texture(paperTex, tuv.add(vec2(0, 1 / TILE))).x;
  const nrm = normalize(vec3(s.x.sub(sx).mul(5), s.x.sub(sy).mul(5), 1));
  const diffuse = dot(nrm, normalize(vec3(-0.55, -0.6, 0.6)));

  // The mould: laid wires every 4 px, chain wires on the layout's columns, pulp banked beside them.
  const laid = float(4);
  const dl = abs(fract(doc.y.div(laid)).sub(0.5)).mul(laid);
  const laidW = float(1).sub(smoothstep(0.3, 1.0, dl));
  const dc = abs(fract(doc.x.sub(uChainOffset).div(uChainStep).add(0.5)).sub(0.5)).mul(uChainStep);
  const chainW = float(1).sub(smoothstep(0.5, 1.5, dc));
  const chainBank = smoothstep(1.5, 3.0, dc).mul(float(1).sub(smoothstep(3.0, 10.0, dc)));

  // The watermark: one eye per 1400 px of the sheet, right of centre.
  const every = float(1400);
  const wsize = float(300);
  const wl = vec2(doc.x.sub(uRes.x.mul(0.68)), mod(doc.y.sub(520), every).sub(every.mul(0.5)))
    .div(wsize)
    .add(0.5);
  const inside = step(0, wl.x).mul(step(wl.x, 1)).mul(step(0, wl.y)).mul(step(wl.y, 1));
  const wm = texture(wmTex, clamp(wl, 0, 1)).x.mul(inside);

  const flocs = s.y.sub(0.5);
  const fibre = s.z.sub(0.5);
  const thickness = float(1)
    .add(flocs.mul(0.6))
    .add(fibre.mul(-0.08))
    .sub(laidW.mul(0.08))
    .sub(chainW.mul(0.16))
    .add(chainBank.mul(0.06))
    .sub(wm.mul(0.34));

  const reflected = PAPER.mul(float(0.935).add(diffuse.mul(0.11)))
    .mul(float(1).add(flocs.mul(0.035)).add(fibre.mul(0.05)))
    .sub(vec3(laidW.mul(0.006).add(chainW.mul(0.01))));
  // Against the light the sheet goes amber and cloudy; every thin place (wire, watermark) glows.
  const transmitted = LIGHT.mul(vec3(1.0, 0.86, 0.62)).mul(
    clamp(float(0.6).add(float(1).sub(thickness).mul(2.1)), 0.08, 1.25),
  );
  let color = mix(reflected, transmitted, uTransmit);

  if (inkTex) {
    const iuv = css.sub(uInk.xy).div(uInk.zw);
    const iin = step(0, iuv.x)
      .mul(step(iuv.x, 1))
      .mul(step(0, iuv.y))
      .mul(step(iuv.y, 1))
      .mul(uInkOn);
    const a = texture(inkTex, clamp(iuv, 0, 1)).w.mul(iin);
    // Starved on the tooth: thin ink skips the peaks of the paper.
    const starved = a.mul(smoothstep(0.08, 0.55, a.add(s.x.sub(0.5).mul(0.7))));
    // Wicked along the fibres, only where the pointer has wet the sheet; it dries back.
    const px = vec2(1).div(uInk.zw);
    const halo = texture(inkTex, clamp(iuv.add(px.mul(vec2(2.2, 0.8))), 0, 1))
      .w.add(texture(inkTex, clamp(iuv.sub(px.mul(vec2(2.2, 0.8))), 0, 1)).w)
      .add(texture(inkTex, clamp(iuv.add(px.mul(vec2(-0.8, 2.6))), 0, 1)).w)
      .add(texture(inkTex, clamp(iuv.sub(px.mul(vec2(-0.8, 2.6))), 0, 1)).w)
      .mul(0.25)
      .mul(iin);
    const near = exp(length(css.sub(uPointer)).div(90).negate()).mul(uWet);
    // Additive: the crisp DOM line stays on top; the paper only drinks a halo around it,
    // starved where the tooth is high. If the upload fails, nothing is lost.
    const bleed = max(halo.sub(a).max(0), starved.mul(0.18)).mul(near).mul(0.6);
    color = mix(color, color.mul(INK.mul(1.6)), bleed);
  }

  const material = new NodeMaterial();
  material.fragmentNode = vec4(color, 1);
  const quad = new QuadMesh(material);

  let disposed = false;
  const info: PaperInfo = { backend, htmlInCanvas: !!inkTex, dpr };

  return {
    info,
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      uRes.value.set(w, h);
    },
    render(st: PaperState) {
      if (disposed) return;
      uScroll.value = st.scroll;
      uTransmit.value = st.transmit;
      uChainStep.value = st.chainStep;
      uChainOffset.value = st.chainOffset;
      uPointer.value.set(st.pointer[0], st.pointer[1]);
      uWet.value = st.wet;
      if (inkTex && st.inkRect) {
        uInk.value.set(...st.inkRect);
        uInkOn.value = 1;
      } else uInkOn.value = 0;
      quad.render(renderer);
    },
    dispose() {
      disposed = true;
      inkTex?.dispose();
      paperTex.dispose();
      wmTex.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

export type Paper = Awaited<ReturnType<typeof createPaper>>;
