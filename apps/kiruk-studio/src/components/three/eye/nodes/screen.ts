/**
 * The era's screen, in TSL — a port of ERA_UI_FRAG (era-eye-shader.ts).
 *
 * What the screen shows is the era's real home page, captured as it ships
 * (screen-pages.ts), scrolled through the screen's viewport. Until it has
 * arrived, a stand-in: the portfolio page painted by canvas 2D
 * (era-screen-texture), framed in that era's chrome — window bars, rails,
 * tiles, gel, an app grid. Either is then put through the display technology
 * of its year: scanlines, a bitmap grid, 1-bit dither, posterised colour, and
 * the panel itself (cathode-ray, backlit TFT, IPS, OLED). It renders into a
 * small mipmapped target a few times a second; everything else in the shot
 * reads it as a light and a reflection.
 *
 * The one structural change from the GLSL: the twelve layouts are a table of
 * numbers here, uploaded once, rather than an if-chain in the shader.
 */

import {
  LinearFilter,
  LinearMipmapLinearFilter,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  type Texture,
  Vector4,
  type WebGPURenderer,
} from 'three/webgpu';
import type { ScreenUniforms } from '../uniforms';
import { bayer4, hash21, type N, rbox } from './common';
import { T } from './tsl';

const {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  int,
  max,
  mix,
  mod,
  pow,
  screenCoordinate,
  select,
  sin,
  smoothstep,
  step,
  texture,
  uniformArray,
  uv,
  vec2,
  vec3,
  vec4,
} = T;

/** Resolution of the screen. It is only ever seen defocused, mirrored and shrunk. */
export const UI_W = 768;
export const UI_H = 432;
/** Frames per second for the pass. A reflection does not need 60. */
export const UI_FPS = 24;
/** The 1×1 level of the target's mip chain: the screen's average colour. */
export const SCREEN_LAST_MIP = Math.floor(Math.log2(Math.max(UI_W, UI_H)));

const AA = 1.5 * Math.max(1 / UI_W, 1 / UI_H);

/**
 * One era's chrome: where the page sits, what frames it, how round it is.
 * Index = EraVisual.style:
 * 0 terminal · 1 Xerox Star · 2 early web · 3 GeoCities · 4 frames ·
 * 5 Zen Garden · 6 Web 2.0 · 7 Aqua · 8 phone grid · 9 Material ·
 * 10 chat · 11 generative
 */
interface Chrome {
  rect: [number, number];
  size: [number, number];
  bar?: number;
  rail?: number;
  radius?: number;
  chisel?: number;
  tiles?: number;
  gloss?: number;
  grid?: number;
  paper?: number;
}

export const CHROME: readonly Chrome[] = [
  { rect: [0.5, 0.5], size: [0.48, 0.47] },
  { rect: [0.52, 0.46], size: [0.4, 0.33], bar: 0.06, chisel: 1, paper: 0.9 },
  { rect: [0.46, 0.44], size: [0.4, 0.4], bar: 0.05, paper: 0.85 },
  { rect: [0.5, 0.44], size: [0.36, 0.32], bar: 0.1, tiles: 1 },
  { rect: [0.58, 0.42], size: [0.36, 0.36], bar: 0.09, rail: 0.2, chisel: 1, paper: 0.75 },
  { rect: [0.5, 0.42], size: [0.3, 0.38], bar: 0.07, paper: 0.95 },
  { rect: [0.5, 0.44], size: [0.38, 0.34], bar: 0.08, radius: 0.045, gloss: 1, paper: 0.9 },
  {
    rect: [0.58, 0.44],
    size: [0.34, 0.38],
    bar: 0.07,
    rail: 0.18,
    radius: 0.02,
    gloss: 0.5,
    paper: 0.9,
  },
  { rect: [0.5, 0.34], size: [0.4, 0.26], bar: 0.04, radius: 0.05, grid: 1 },
  { rect: [0.5, 0.42], size: [0.4, 0.34], bar: 0.07, radius: 0.075 },
  { rect: [0.5, 0.46], size: [0.36, 0.34], bar: 0.06, radius: 0.06 },
  { rect: [0.5, 0.46], size: [0.4, 0.34], radius: 0.11 },
];

const LUMA = vec3(0.299, 0.587, 0.114);

/**
 * Cursors are drawn a little over life size: the screen reaches the viewer
 * only as a reflection a few millimetres across, and a 16 px arrow in it would
 * be a speck.
 */
const CURSOR_SCALE = 1.7;

/**
 * The visitor's pointer, drawn on the screen the eye is looking at — so it
 * turns up in the cornea, mirrored, in that era's own cursor. Shapes are
 * measured in screen pixels from the hot spot, y up.
 *   1 arrow · 2 block (blinking) · 3 text caret (blinking) · 4 hand · 5 a thumb over the glass
 */
function drawCursor(S: N, c: N, vUv: N): N {
  const px = vUv.sub(S.cursorPos).mul(vec2(UI_W, UI_H)).div(CURSOR_SCALE).toVar();
  const kind = S.cursorKind;
  const is = (k: number) => step(abs(kind.sub(k)), 0.5).mul(S.cursorAlpha);
  const blinkOn = step(0.5, fract(S.time.mul(1.9)));
  const out = vec3(c).toVar();

  // the arrow: a right triangle off the hot spot and a short tail, white-edged
  const arrow = (e: number) =>
    step(-e, px.x)
      .mul(step(px.y, e))
      .mul(step(px.x, px.y.negate().mul(0.72).add(e)))
      .mul(step(px.y.negate(), 16 + e))
      .add(
        step(3.6 - e, px.x)
          .mul(step(px.x, 7.4 + e))
          .mul(step(-19.5 - e, px.y))
          .mul(step(px.y, -9 + e)),
      )
      .clamp(0, 1);
  out.assign(mix(out, vec3(1), arrow(1.1).mul(is(1))));
  out.assign(mix(out, vec3(0.02), arrow(-0.2).mul(is(1))));

  // the hand: a palm and one raised finger
  const hand = (e: number) =>
    max(
      rbox(px, vec2(6, -17), vec2(7 + e, 7 + e), 3, 0.6),
      rbox(px, vec2(4, -6), vec2(2 + e, 6.5 + e), 2, 0.6),
    );
  out.assign(mix(out, vec3(1), hand(1.1).mul(is(4))));
  out.assign(mix(out, vec3(0.02), hand(-0.2).mul(is(4))));

  // the terminal's block and the search box's caret, in the page's own ink
  const block = rbox(px, vec2(5, -8), vec2(5, 8), 0, 0.5);
  const caret = rbox(px, vec2(1, -9), vec2(1, 9), 0, 0.5);
  out.assign(mix(out, S.ink, block.mul(blinkOn).mul(is(2))));
  out.assign(mix(out, S.ink, caret.mul(blinkOn).mul(is(3))));

  // a thumb resting on the glass: a soft, warm, dark pad
  const pad = smoothstep(0.55, 1, px.sub(vec2(4, -26)).div(vec2(30, 44)).length());
  const thumb = float(1).sub(pad).mul(is(5));
  out.assign(mix(out, out.mul(vec3(0.32, 0.24, 0.22)), thumb.mul(0.8)));
  return out;
}

/** Chiselled GUI border: light on one diagonal, dark on the other. */
function bevel(c: N, q: N, ctr: N, h: N, t: number, amt: number): N {
  const d = abs(q.sub(ctr)).sub(h);
  const edge = float(1).sub(smoothstep(0, t, max(d.x, d.y).add(t)));
  const dirn = q.y.sub(ctr.y).sub(q.x.sub(ctr.x));
  return mix(c, vec3(step(0, dirn)), edge.mul(amt * 0.3));
}

/** The two page slots (screen-pages.ts): texture nodes whose value is swapped. */
export interface PageSlots {
  a: N;
  b: N;
}

export function screenNode(uniforms: ScreenUniforms, codeTexture: Texture, pages?: PageSlots) {
  const S: N = uniforms;

  /**
   * One viewport of a real page, scrolled. The page runs down to its foot and
   * back up again, easing at either end, rather than jumping from its foot to
   * its head; a page one viewport tall stands still.
   */
  const pageAt = (node: N, view: N, q: N): N => {
    // (at half the stand-in's pace: a whole page moves more than a column)
    const t = fract(S.scroll.mul(0.5));
    const tri = float(1).sub(abs(t.mul(2).sub(1)));
    const ease = tri.mul(tri).mul(float(3).sub(tri.mul(2)));
    const top = max(float(1).sub(view), 0).mul(ease);
    // from the page's head, 0..1 (the image's top is at v = 1)
    const y = top.add(float(1).sub(q.y).mul(view));
    return node.sample(vec2(q.x, float(1).sub(y))).rgb;
  };
  // three floats-of-four per layout: geometry, frame, finish
  const chromeA = uniformArray(
    CHROME.map((k) => new Vector4(k.rect[0], k.rect[1], k.size[0], k.size[1])),
    'vec4',
  );
  const chromeB = uniformArray(
    CHROME.map((k) => new Vector4(k.bar ?? 0, k.rail ?? 0, k.radius ?? 0, k.chisel ?? 0)),
    'vec4',
  );
  const chromeC = uniformArray(
    CHROME.map((k) => new Vector4(k.tiles ?? 0, k.gloss ?? 0, k.grid ?? 0, k.paper ?? 0)),
    'vec4',
  );

  const drawScreen = (style: N, q: N): N => {
    const idx = int(clamp(floor(style.add(0.5)), 0, CHROME.length - 1));
    const A = chromeA.element(idx).toVar();
    const B = chromeB.element(idx).toVar();
    const C = chromeC.element(idx).toVar();
    const rect = A.xy;
    const size = A.zw;
    const bar = B.x;
    const rail = B.y;
    const radius = B.z;
    const chisel = B.w;
    const paper = C.w;

    const ground = mix(S.bg, vec3(0.94, 0.935, 0.925), paper.mul(0.85)).toVar();
    const c = vec3(ground).toVar();

    // wallpaper
    If(C.x.greaterThan(0), () => {
      const tile = step(0.5, fract(q.x.mul(16))).mul(step(0.5, fract(q.y.mul(16))));
      c.assign(mix(c, mix(ground, S.accent, 0.4), tile.mul(0.45)));
    });

    // top chrome and its three window buttons
    If(bar.greaterThan(0), () => {
      const barY = float(1).sub(bar.mul(0.5));
      c.assign(mix(c, S.bar, rbox(q, vec2(0.5, barY), vec2(0.5, bar.mul(0.5)), 0, AA).mul(0.92)));
      const round = select(radius.greaterThan(0), float(0.014), float(0));
      Loop(3, ({ i }: { i: N }) => {
        const at = vec2(float(i).mul(0.045).add(0.05), barY);
        c.assign(mix(c, mix(S.accent, vec3(1), 0.2), rbox(q, at, vec2(0.014), round, AA)));
      });
    });

    // left rail and its five nav rows
    If(rail.greaterThan(0), () => {
      const rc = vec2(rail.mul(0.5), float(0.5).sub(bar.mul(0.5))).toVar();
      c.assign(mix(c, mix(S.panel, ground, 0.55), rbox(q, rc, rc, 0, AA)));
      Loop(5, ({ i }: { i: N }) => {
        const row = rbox(
          q,
          vec2(rail.mul(0.5), float(0.74).sub(float(i).mul(0.1))),
          vec2(rail.mul(0.3), 0.01),
          0,
          AA,
        );
        c.assign(mix(c, S.ink, row.mul(0.6)));
      });
      If(chisel.greaterThan(0), () => {
        c.assign(bevel(c, q, rc, rc, 0.006, 1));
      });
    });

    // app grid (phone eras) sits above the page
    If(C.z.greaterThan(0), () => {
      Loop(8, ({ i }: { i: N }) => {
        const fi = float(i);
        const gc = vec2(mod(fi, 4).mul(0.2).add(0.2), float(0.84).sub(floor(fi.div(4)).mul(0.16)));
        const h = hash21(vec2(fi, 4)).toVar();
        const tileCol = mix(mix(S.panel, S.accent, h), S.bar, step(0.72, h));
        c.assign(mix(c, tileCol, rbox(q, gc, vec2(0.058), 0.022, AA)));
      });
    });

    // the content surface
    const terminal = style.lessThan(0.5);
    const pane = rbox(q, rect, size, radius, AA).toVar();
    const paneCol = mix(S.bg, vec3(0.99), paper);
    c.assign(mix(c, paneCol, pane.mul(select(terminal, float(0), float(0.96)))));
    If(chisel.greaterThan(0), () => {
      c.assign(bevel(c, q, rect, size, 0.006, 1));
    });

    // the page itself, scrolling: the full width of the painted column and a
    // slice of its height, so the type stays readable inside a reflection
    const codeUv = q.sub(rect).div(size).mul(vec2(0.5, 0.115)).add(0.5);
    const code = texture(codeTexture, vec2(codeUv.x, codeUv.y.sub(S.scroll))).rgb;
    c.assign(mix(c, code, pane.mul(select(terminal, float(1), float(0.92)))));

    // gel highlight over the pane
    If(C.y.greaterThan(0), () => {
      const top = smoothstep(rect.y, rect.y.add(size.y), q.y);
      c.assign(mix(c, vec3(1), pane.mul(top).mul(0.18).mul(C.y)));
    });

    // caret
    const caret = rbox(
      q,
      vec2(rect.x.sub(size.x.mul(0.55)), rect.y.sub(size.y.mul(0.62))),
      vec2(0.004, 0.013),
      0,
      AA,
    );
    c.assign(mix(c, S.accent, caret.mul(step(0.5, fract(S.time.mul(1.4))))));
    return c;
  };

  return Fn(() => {
    // QuadMesh UVs start top-left; the GLSL measured from the bottom
    const vUv = vec2(uv().x, float(1).sub(uv().y)).toVar();
    // the same, for gl_FragCoord: dither and subpixel phase match the GLSL's
    const frag = vec2(screenCoordinate.x, float(UI_H).sub(screenCoordinate.y)).toVar();
    const t = S.time;

    const q = vec2(vUv).toVar();
    If(S.wobble.greaterThan(0), () => {
      q.addAssign(
        vec2(sin(q.y.mul(9).add(t.mul(0.9))), cos(q.x.mul(7).sub(t.mul(0.7)))).mul(
          S.wobble.mul(0.012),
        ),
      );
    });
    If(S.warp.greaterThan(0), () => {
      const band = floor(q.y.mul(30));
      const seed = floor(t.mul(7));
      const hit = step(0.9, hash21(vec2(band.mul(1.7), seed)));
      const shift = hash21(vec2(band, seed)).sub(0.5).mul(S.warp).mul(0.3).mul(hit);
      q.assign(vec2(q.x.add(shift), q.y));
    });
    If(S.pixel.greaterThan(0.5), () => {
      const g = S.pixel.div(340);
      q.assign(floor(q.div(g)).add(0.5).mul(g));
    });

    // The stand-in, only while the real page is not fully up. Layouts cannot
    // be interpolated: draw the one that is up, and only while a crossfade
    // runs, draw the other one too.
    const c = vec3(0).toVar();
    If(S.pageOn.lessThan(0.999), () => {
      const first = select(S.styleMix.greaterThanEqual(0.999), S.styleB, S.styleA);
      c.assign(drawScreen(first, q));
      If(S.styleMix.greaterThan(0.001).and(S.styleMix.lessThan(0.999)), () => {
        c.assign(mix(c, drawScreen(S.styleB, q), S.styleMix));
      });
    });
    // the era's real page over it, crossfading from the last one
    if (pages) {
      If(S.pageOn.greaterThan(0.001), () => {
        const page = mix(
          pageAt(pages.a, S.pageViewA, q),
          pageAt(pages.b, S.pageViewB, q),
          S.pageMix,
        );
        c.assign(mix(c, page, S.pageOn));
      });
    }

    c.assign(drawCursor(S, c, vUv));

    If(S.posterize.greaterThan(1.5), () => {
      c.assign(floor(c.mul(S.posterize).add(0.5)).div(S.posterize));
    });
    If(S.dither.greaterThan(0), () => {
      const l = dot(c, LUMA);
      const th = bayer4(frag.div(max(S.pixel, 1)));
      const lighterBg = dot(S.bg, LUMA).greaterThanEqual(dot(S.ink, LUMA));
      const paperCol = select(lighterBg, vec3(S.bg), vec3(S.ink));
      const inkCol = select(lighterBg, vec3(S.ink), vec3(S.bg));
      // (a real page keeps more of itself: it already is that era's
      // greyscale, and 1-bit dither would turn its greys to checkerboard)
      c.assign(
        mix(
          c,
          mix(inkCol, paperCol, float(1).sub(step(l, th))),
          S.dither.mul(mix(float(1), float(0.4), S.pageOn)),
        ),
      );
    });
    If(S.scan.greaterThan(0), () => {
      const scan = step(0.5, fract(vUv.y.mul(210)));
      c.mulAssign(float(1).sub(S.scan.mul(0.42).mul(scan)));
    });
    c.addAssign(c.mul(S.glow));

    // ---- the panel this year was actually made of -----------------------
    // 0 cathode-ray · 1 backlit TFT · 2 IPS/retina · 3 OLED. A 2003 TFT can
    // never reach black, and a 2023 OLED can never do anything else.
    const wTft = max(0, float(1).sub(abs(S.tech.sub(1))));
    const wIps = max(0, float(1).sub(abs(S.tech.sub(2))));
    const wOled = max(0, float(1).sub(abs(S.tech.sub(3))));
    If(wTft.greaterThan(0.001), () => {
      const sub = mod(frag.x, 3);
      const stripe = vec3(step(sub, 1), step(1, sub).mul(step(sub, 2)), step(2, sub));
      c.mulAssign(mix(vec3(1), stripe.mul(0.36).add(0.8), wTft.mul(0.3)));
      c.addAssign(vec3(0.042, 0.047, 0.06).mul(wTft)); // the backlight, always on
      const edge = abs(vUv.sub(0.5)).mul(2);
      c.addAssign(
        vec3(0.05, 0.055, 0.072)
          .mul(wTft)
          .mul(pow(max(edge.x, edge.y), 6)),
      ); // and leaking
    });
    If(wIps.greaterThan(0.001), () => {
      // below the resolution of a reflection; only the black level gives it away
      c.addAssign(vec3(0.014, 0.015, 0.019).mul(wIps));
    });
    If(wOled.greaterThan(0.001), () => {
      const l = dot(c, LUMA);
      c.assign(mix(c, mix(vec3(l), c, 1.2).mul(smoothstep(0, 0.055, l)), wOled));
    });

    return vec4(c, 1);
  })();
}

export interface ScreenPass {
  target: RenderTarget;
  quad: QuadMesh;
  render: (renderer: WebGPURenderer) => void;
  dispose: () => void;
}

export function createScreenPass(
  S: ScreenUniforms,
  codeTexture: Texture,
  pages?: PageSlots,
): ScreenPass {
  const target = new RenderTarget(UI_W, UI_H, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  target.texture.name = 'EraScreen';
  const material = new NodeMaterial();
  material.name = 'EraScreen';
  material.fragmentNode = screenNode(S, codeTexture, pages);
  material.depthTest = false;
  material.depthWrite = false;
  const quad = new QuadMesh(material);

  return {
    target,
    quad,
    render(renderer) {
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      quad.render(renderer);
      renderer.setRenderTarget(prev);
    },
    dispose() {
      target.dispose();
      material.dispose();
    },
  };
}

/**
 * The screen, sampled in the GLSL's coordinates (y up), blurred by a mip
 * bias. Render targets start top-left in three's node world.
 */
export function sampleScreen(target: RenderTarget, uvUp: N, bias: N | number): N {
  return texture(target.texture, vec2(uvUp.x, float(1).sub(uvUp.y))).bias(bias).rgb;
}

/** The screen's average colour: the key light, with no readback. */
export function screenLight(target: RenderTarget): N {
  return texture(target.texture, vec2(0.5)).level(SCREEN_LAST_MIP).rgb;
}
