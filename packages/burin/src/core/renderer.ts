/**
 * The burin engine's renderer — three passes on three.js WebGPURenderer
 * (WebGPU where the browser has it, its WebGL 2 backend where it does not):
 *
 *   1 ink      the engraved subject → an ink target (coverage, construction, rays).
 *              Only when the subject moves.
 *   2 bleed    water and pigment through the paper, ping-pong at one texel per 2 CSS px.
 *              Only while something is wet or still fading.
 *   3 compose  paper (cockle, raking light, lamp, platemark, held to the light)
 *              + raised intaglio ink + the bleed + the printed type → the screen.
 *
 * Ink meets the paper one way everywhere: multiplied in, starved on the tooth, and
 * standing a hair proud of the sheet, so the raking light finds every line's edge.
 * The caller owns the loop and says which passes a frame needs.
 */
import {
  clamp,
  dot,
  float,
  max,
  mix,
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
  type Camera,
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  NoBlending,
  NoColorSpace,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  RepeatWrapping,
  RGBAFormat,
  type Texture,
  UnsignedByteType,
  WebGPURenderer,
} from 'three/webgpu';
import { BLEED, bleedLook, bleedStep } from '../bleed/bleed';
import { rasterLogogram } from '../logogram';
import { paperNode } from '../paper/paper';
import type { Pose } from '../subjects/eye/rig';
import { eyeGlory, eyeInk } from '../subjects/eye/shader';
import { bakeNoise, bakePaper, NOISE_TILE, PAPER_TILE } from './textures';

/**
 * Inks, one per paper. Old (Dawn Light): iron-gall black #231a14, brown in water.
 * New (Dawn Departs): dawn navy #1d1c2d (the earth band of the dawn palette), blue in water.
 * Mirrors color.dawn.iron-gall / color.dawn.navy (design-tokens "Dawn paper pair").
 */
export const INK_RGB = [0.137, 0.102, 0.078] as const;
export const INK_NEW_RGB = [0.114, 0.11, 0.176] as const;
const WASH_RGB = [0.56, 0.43, 0.33] as const;
const WASH_NEW_RGB = [0.42, 0.5, 0.62] as const;
const STAIN_RGB = [0.45, 0.33, 0.25] as const;
const STAIN_NEW_RGB = [0.33, 0.4, 0.52] as const;
const CONS_RGB = [0.42, 0.37, 0.39] as const;
/**
 * The construction under the engraving. Old paper: sanguine, the red chalk of the hand's
 * underdrawing. New paper: the code's blueprint blue. Same lines, the dawn decides the colour.
 */
const SANGUINE_RGB = [0.72, 0.4, 0.3] as const;
const BLUEPRINT_RGB = [0.32, 0.45, 0.78] as const;

export type Rect = [number, number, number, number];

export type EyeFrame = {
  /** eye centre (CSS px) and S, CSS px per eye unit */
  eye: [number, number, number];
  pose: Pose;
  strip: Rect;
  plate: Rect;
  /** watermark x, y, size, on */
  mark: [number, number, number, number];
  light: number;
  age: number;
  /** 0 old paper (Dawn Light) … 1 new paper (Dawn Departs) */
  dawn: number;
  /** toward the raking light: x, y (screen), z (out of the sheet) */
  rake: [number, number, number];
  /** lamp x, y, reach (CSS px) */
  lamp: [number, number, number];
  /** toward the light that shades the eye (the rake without its drift), unit */
  sun: [number, number, number];
  /** construction over the plate, 0…1 */
  wire: number;
  /** the plate's passes, 1 … 5 (5 = finished); fractional while it is being made again */
  make: number;
};

export type Passes = {
  ink: boolean;
  /** bleed steps to run this frame (0 = none) */
  bleed: number;
  /** seconds per bleed step */
  dt: number;
  /** brush: x, y, radius (CSS px), water/s; prev: x, y, on */
  brush: [number, number, number, number];
  brushPrev: [number, number, number];
  /** damp sheet, water/s near ink */
  damp: number;
};

export type EngineInfo = { backend: 'webgpu' | 'webgl2'; dpr: number; plate: boolean };

function dataTex(data: Uint8Array, n: number) {
  const t = new DataTexture(data, n, n, RGBAFormat);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = t.minFilter = LinearFilter;
  t.colorSpace = NoColorSpace;
  t.needsUpdate = true;
  return t;
}

function canvasTex(c: OffscreenCanvas | HTMLCanvasElement): Texture {
  const t = new CanvasTexture(c as HTMLCanvasElement);
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.colorSpace = NoColorSpace;
  t.flipY = false;
  t.generateMipmaps = false;
  t.magFilter = t.minFilter = LinearFilter;
  return t;
}

function target(w: number, h: number, half: boolean) {
  const rt = new RenderTarget(w, h, {
    type: half ? HalfFloatType : UnsignedByteType,
    depthBuffer: false,
  });
  const t = rt.texture;
  t.magFilter = t.minFilter = LinearFilter;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.colorSpace = NoColorSpace;
  return rt;
}

export async function createEyeEngine(
  canvas: HTMLCanvasElement,
  opts: {
    dprCap?: number;
    plate?: HTMLCanvasElement | null /** the first layout, so the ink target is compiled at its real size */;
    frame?: Pick<EyeFrame, 'eye' | 'strip'>;
  } = {},
) {
  const renderer = new WebGPURenderer({ canvas, antialias: false, alpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, opts.dprCap ?? 2);
  renderer.setPixelRatio(dpr);
  let W = window.innerWidth;
  let H = window.innerHeight;
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = LinearSRGBColorSpace;
  await renderer.init();
  const backend: EngineInfo['backend'] = (renderer.backend as { isWebGPUBackend?: boolean })
    .isWebGPUBackend
    ? 'webgpu'
    : 'webgl2';

  const paperTex = dataTex(bakePaper(), PAPER_TILE);
  const noiseTex = dataTex(bakeNoise(), NOISE_TILE);
  const starTex = canvasTex(rasterLogogram(512));
  const markTex = canvasTex(rasterLogogram(256, 1.6));
  const plateTex = opts.plate ? canvasTex(opts.plate) : null;

  const simSize = () =>
    [Math.max(1, Math.ceil(W / BLEED.cell)), Math.max(1, Math.ceil(H / BLEED.cell))] as const;
  // The ink pass covers only the eye and its strip of studies (CSS px), not the whole page.
  let region: Rect = [0, 0, 1, 1];
  const rtInk = target(64, 64, false);
  const regionOf = (f: EyeFrame): Rect => {
    const [cx, cy, S] = f.eye;
    let x0 = cx - 1.72 * S;
    let y0 = cy - 1.58 * S;
    let x1 = cx + 1.72 * S;
    let y1 = cy + 1.22 * S;
    const [sx, sy, sw, sh] = f.strip;
    if (sw > 1) {
      x0 = Math.min(x0, sx);
      y0 = Math.min(y0, sy);
      x1 = Math.max(x1, sx + sw);
      y1 = Math.max(y1, sy + sh);
    }
    x0 = Math.max(0, Math.floor(x0));
    y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(W, Math.ceil(x1));
    y1 = Math.min(H, Math.ceil(y1));
    return [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
  };
  const sizeInk = (r: Rect) => {
    region = r;
    rtInk.setSize(Math.max(1, Math.round(r[2] * dpr)), Math.max(1, Math.round(r[3] * dpr)));
  };
  const [sw, sh] = simSize();
  const rtA = target(sw, sh, true);
  const rtB = target(sw, sh, true);

  const u = {
    res: uniform(vec2(W, H)),
    dpr: uniform(dpr),
    eye: uniform(vec4(0, 0, 300, 0)),
    pose: uniform(vec4(0, 0, 1, 0.36)),
    strip: uniform(vec4(0, 0, 0, 0)),
    plate: uniform(vec4(0, 0, 0, 0)),
    mark: uniform(vec4(0, 0, 0, 0)),
    light: uniform(0),
    age: uniform(0),
    dawn: uniform(0),
    rake: uniform(vec3(-0.55, -0.6, 0.6)),
    lamp: uniform(vec3(0, 0, 1600)),
    grid: uniform(vec2(sw, sh)),
    dt: uniform(1 / 120),
    brush: uniform(vec4(0, 0, 40, 0)),
    brushPrev: uniform(vec4(0, 0, 0, 0)),
    damp: uniform(0),
    region: uniform(vec4(0, 0, 1, 1)),
    sun: uniform(vec3(-0.56, -0.61, 0.56)),
    wire: uniform(0),
    make: uniform(5),
  };

  // ── 1 · the ink pass ──
  const eye = eyeInk({
    region: u.region,
    dpr: u.dpr,
    eye: u.eye,
    pose: u.pose,
    strip: u.strip,
    light: u.light,
    sun: u.sun,
    wire: u.wire,
    make: u.make,
    noise: noiseTex,
    star: starTex,
  });
  // Data passes: every channel is data, so no blending (BR-7: the rim in alpha zeroed every write).
  const dataMat = () =>
    Object.assign(new NodeMaterial(), {
      blending: NoBlending,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    });
  const inkMat = dataMat();
  inkMat.fragmentNode = vec4(eye.x, eye.y, eye.z, 1);
  const inkQuad = new QuadMesh(inkMat);

  // ── 2 · the bleed, ping-pong ──
  const simIn = {
    grid: u.grid,
    res: u.res,
    dt: u.dt,
    brush: u.brush,
    brushPrev: u.brushPrev,
    damp: u.damp,
    ink: rtInk.texture,
    plate: plateTex,
    paper: paperTex,
    noise: noiseTex,
  };
  const simAB = dataMat();
  simAB.fragmentNode = bleedStep({ ...simIn, src: rtA.texture });
  const simBA = dataMat();
  simBA.fragmentNode = bleedStep({ ...simIn, src: rtB.texture });
  const simQuadAB = new QuadMesh(simAB);
  const simQuadBA = new QuadMesh(simBA);
  let current: RenderTarget = rtA;

  // ── 3 · compose ──
  const paper = paperNode({
    res: u.res,
    light: u.light,
    age: u.age,
    dawn: u.dawn,
    plate: u.plate,
    mark: u.mark,
    rake: u.rake,
    lamp: u.lamp,
    paper: paperTex,
    noise: noiseTex,
    watermark: markTex,
  });
  const L = paper.L;
  const px = vec2(1, 1).div(u.res);
  // The ink target covers only its region: read it there, and nothing outside.
  const inkUV = screenUV.mul(u.res).sub(u.region.xy).div(u.region.zw);
  const inRegion = step(0, inkUV.x)
    .mul(step(inkUV.x, 1))
    .mul(step(0, inkUV.y))
    .mul(step(inkUV.y, 1));
  const inkAt = (dx: number, dy: number) =>
    texture(rtInk.texture, inkUV.add(vec2(dx, dy).div(u.region.zw))).mul(inRegion);
  const ink = inkAt(0, 0);
  const rays = eyeGlory({ res: u.res, dpr: u.dpr, eye: u.eye, light: u.light });
  const state = texture(rtA.texture, screenUV);
  const starve = (cov: any) =>
    cov.mul(
      float(1).sub(
        float(1)
          .sub(cov)
          .mul(0.42)
          .mul(smoothstep(0.42, 0.8, paper.tooth)),
      ),
    );
  // The ink follows the paper under it: iron-gall on the old sheet, navy on the new.
  const INK = mix(vec3(...INK_RGB), vec3(...INK_NEW_RGB), paper.dawn);
  const WASH = mix(vec3(...WASH_RGB), vec3(...WASH_NEW_RGB), paper.dawn);
  const STAIN = mix(vec3(...STAIN_RGB), vec3(...STAIN_NEW_RGB), paper.dawn);

  // The printed type: spread a little, starved on the tooth; a knock-out round it in the engraving.
  let typeA: any = float(0);
  let typeRGB: any = vec3(...INK_RGB);
  let knock: any = float(0);
  if (plateTex) {
    const pAt = (dx: number, dy: number) => texture(plateTex, screenUV.add(px.mul(vec2(dx, dy))));
    const p0 = pAt(0, 0);
    const spread = max(
      p0.w,
      pAt(0.7, 0.7).w.add(pAt(-0.7, -0.7).w).add(pAt(0.7, -0.7).w).add(pAt(-0.7, 0.7).w).mul(0.27),
    );
    const nn = texture(noiseTex, screenUV.mul(u.res).div(3.1)).z.sub(0.5).mul(0.34);
    typeA = smoothstep(float(0.22).add(nn), float(0.7).add(nn), spread);
    typeRGB = p0.xyz;
    let halo: any = float(0);
    for (const [dx, dy] of [
      [3, 0],
      [-3, 0],
      [0, 3],
      [0, -3],
      [2.2, 2.2],
      [-2.2, 2.2],
      [2.2, -2.2],
      [-2.2, -2.2],
    ] as const) {
      // Knock out round ink-coloured type only; red rules may sit on the drawing.
      const q = pAt(dx, dy);
      halo = max(halo, q.w.mul(float(1).sub(clamp(q.x.sub(q.y).mul(3), 0, 1))));
    }
    knock = smoothstep(0.05, 0.4, halo).mul(0.94);
  }

  // Raised ink: the coverage is a height; the raking light lifts one edge, shades the other.
  const hx = inkAt(1, 0).x.sub(inkAt(-1, 0).x);
  const hy = inkAt(0, 1).x.sub(inkAt(0, -1).x);
  const lift = float(1).add(hx.mul(L.x).add(hy.mul(L.y)).mul(-0.2));

  const look = bleedLook(state);
  const eyeInkC = starve(ink.x).mul(float(1).sub(knock));
  let color: any = paper.color.mul(lift);
  color = color.mul(mix(vec3(1), vec3(...CONS_RGB), ink.y.mul(0.62).mul(float(1).sub(knock))));
  color = color.mul(mix(vec3(1), INK, eyeInkC));
  color = color.mul(mix(vec3(1), INK, starve(rays).mul(0.92)));
  // The construction, under the ink: sanguine on the old sheet, blueprint on the new.
  const WIRE = mix(vec3(...SANGUINE_RGB), vec3(...BLUEPRINT_RGB), paper.dawn);
  color = color.mul(mix(vec3(1), WIRE, ink.z.mul(0.9).mul(float(1).sub(knock))));
  // The bleed: wet paper is darker; carried ink a warm wash; what dried, a stain with a darker rim.
  color = color.mul(float(1).sub(look.wet.mul(0.07)));
  color = color.mul(mix(vec3(1), WASH, look.wash));
  color = color.mul(mix(vec3(1), STAIN, look.stain));
  color = color.mul(mix(vec3(1), INK, look.rim.mul(0.75)));
  if (plateTex) {
    // Dark type is ink: it multiplies into the sheet and starves on the tooth. Light colour
    // (a paper sample, a selection wash) is body colour laid on top, lit like the sheet,
    // so a Dawn Light chip stays Dawn Light on the new paper instead of turning green.
    const lum = dot(typeRGB, vec3(0.2126, 0.7152, 0.0722));
    const body = smoothstep(0.5, 0.72, lum);
    const chip = typeRGB.mul(lift).mul(mix(float(0.965), float(1.02), paper.tooth));
    const printed = mix(color.mul(typeRGB).mul(1.06), chip, body);
    color = mix(color, printed, mix(starve(typeA), typeA, body));
  }
  const composeMat = dataMat();
  composeMat.fragmentNode = vec4(clamp(color, 0, 1.4) as any, 1);
  const composeQuad = new QuadMesh(composeMat);

  // Counters, and the slowest CPU time each pass has taken (ms): a pass that recompiles shows here.
  const debug = {
    sim: 0,
    ink: 0,
    compose: 0,
    resize: 0,
    clear: 0,
    inkMs: 0,
    simMs: 0,
    composeMs: 0,
    compileMs: 0,
  };
  const clearSim = () => {
    debug.clear++;
    renderer.setClearColor(0x000000, 0);
    for (const rt of [rtA, rtB]) {
      renderer.setRenderTarget(rt);
      renderer.clear();
    }
    renderer.setRenderTarget(null);
    current = rtA;
    state.value = rtA.texture;
  };
  clearSim();

  // WebGPU: build every pipeline before the first frame, asynchronously. Not on WebGL 2:
  // ANGLE (D3D11) compiles the pixel shader at the first draw anyway, so an early compile
  // there only adds its time in front (measured: +3.2 s cold, first draw unchanged).
  if (opts.frame) sizeInk(regionOf(opts.frame as EyeFrame));
  const quads: [QuadMesh, RenderTarget | null][] = [
    [inkQuad, rtInk],
    [simQuadAB, rtB],
    [simQuadBA, rtA],
    [composeQuad, null],
  ];
  const tCompile = performance.now();
  for (const [q, rt] of backend === 'webgpu' ? quads : []) {
    try {
      renderer.setRenderTarget(rt);
      await renderer.compileAsync(q, (q as unknown as { camera: Camera }).camera);
    } catch {
      // The first render compiles it instead.
    }
  }
  renderer.setRenderTarget(null);
  debug.compileMs = Math.round(performance.now() - tCompile);

  const info: EngineInfo = { backend, dpr, plate: !!plateTex };
  let disposed = false;

  return {
    info,
    debug,
    resize(w: number, h: number) {
      debug.resize++;
      W = w;
      H = h;
      renderer.setSize(W, H, false);
      u.res.value.set(W, H);
      region = [0, 0, 1, 1];
      const [nw, nh] = simSize();
      rtA.setSize(nw, nh);
      rtB.setSize(nw, nh);
      u.grid.value.set(nw, nh);
      clearSim();
    },
    plateChanged() {
      if (plateTex) plateTex.needsUpdate = true;
    },
    clearBleed: clearSim,
    /** Read the bleed state under a CSS point: water, pigment, stain, rim. For proofs, not for frames. */
    async probe(x: number, y: number) {
      const gx = Math.max(0, Math.floor(x / BLEED.cell));
      // WebGL reads rows from the bottom; WebGPU from the top.
      const gyTop = Math.max(0, Math.floor(y / BLEED.cell));
      const gy = backend === 'webgl2' ? Math.max(0, current.height - 1 - gyTop) : gyTop;
      const buf = (await (renderer as any).readRenderTargetPixelsAsync(
        current,
        gx,
        gy,
        1,
        1,
      )) as ArrayLike<number>;
      return Array.from(buf).map((v) => (v > 1.5 ? v : Math.round(v * 1000) / 1000));
    },
    /** One frame: the passes the caller asks for. Returns CPU ms to record and submit. */
    render(f: EyeFrame, p: Passes) {
      if (disposed) return 0;
      const t0 = performance.now();
      u.eye.value.set(f.eye[0], f.eye[1], f.eye[2], 0);
      u.pose.value.set(f.pose.gx, f.pose.gy, f.pose.open, f.pose.pupil);
      u.strip.value.set(...f.strip);
      u.plate.value.set(...f.plate);
      u.mark.value.set(...f.mark);
      u.light.value = f.light;
      u.age.value = f.age;
      u.dawn.value = f.dawn;
      u.rake.value.set(...f.rake);
      u.lamp.value.set(...f.lamp);
      u.sun.value.set(...f.sun);
      u.wire.value = f.wire;
      u.make.value = f.make;
      const r = regionOf(f);
      const moved =
        r[0] !== region[0] || r[1] !== region[1] || r[2] !== region[2] || r[3] !== region[3];
      if (moved) sizeInk(r);
      u.region.value.set(...region);
      if (p.ink || moved) {
        debug.ink++;
        const ti = performance.now();
        renderer.setRenderTarget(rtInk);
        inkQuad.render(renderer);
        debug.inkMs = Math.max(debug.inkMs, Math.round(performance.now() - ti));
      }
      if (p.bleed > 0) {
        u.dt.value = p.dt;
        u.brush.value.set(...p.brush);
        u.brushPrev.value.set(p.brushPrev[0], p.brushPrev[1], p.brushPrev[2], 0);
        u.damp.value = p.damp;
        debug.sim += p.bleed;
        const ts = performance.now();
        for (let i = 0; i < p.bleed; i++) {
          const fromA = current === rtA;
          renderer.setRenderTarget(fromA ? rtB : rtA);
          (fromA ? simQuadAB : simQuadBA).render(renderer);
          current = fromA ? rtB : rtA;
          // The brush paints its segment once per frame, not once per step.
          u.brushPrev.value.z = 0;
          u.brush.value.w = p.brush[3] * 0.5;
        }
        state.value = current.texture;
        debug.simMs = Math.max(debug.simMs, Math.round(performance.now() - ts));
      }
      renderer.setRenderTarget(null);
      const tc = performance.now();
      composeQuad.render(renderer);
      debug.composeMs = Math.max(debug.composeMs, Math.round(performance.now() - tc));
      return performance.now() - t0;
    },
    dispose() {
      disposed = true;
      for (const t of [paperTex, noiseTex, starTex, markTex, plateTex]) t?.dispose();
      for (const rt of [rtInk, rtA, rtB]) rt.dispose();
      for (const m of [inkMat, simAB, simBA, composeMat]) m.dispose();
      renderer.dispose();
    },
  };
}

export type EyeEngine = Awaited<ReturnType<typeof createEyeEngine>>;
