/**
 * The loader's opening on 1970's tube: the eye is wired, formed pixel by
 * pixel, then it opens (docs/LOADER_OPENING_PLAN.md).
 *
 * The tube warms, and its first beam spot lights a chip where the pupil will
 * be. Current leaves the chip's pins and lays a routed circuit
 * (circuit-layout.ts): the iris fanned out of the chip, the limbus, bundles
 * along the lids, the brow, a board out to the glass's edges. From every wire
 * the phosphor pixels catch: each cell flashes as the signal reaches it and
 * settles to its share of the picture, lights first and darks last. The
 * picture is the real eye held shut (a 2 KB still of the live 1970 eye), so
 * the eye forms out of the circuit with its depth, and the wires recede
 * behind it. The chip shrinks into the terminal's cursor and waits there,
 * blinking; the visitor can type at it (1970 knows only keys). When the live
 * eye is ready the cells split finer and finer into it, the cursor settles
 * onto the eye's own, and the lids open.
 *
 * The glass is a tube's: round phosphor dots with dark between, scanlines,
 * a short afterglow behind anything that moves, bloom, a slow bright band
 * rolling down, a reflection that shifts with the pointer, few levels of
 * light per dot.
 *
 * One WebGL2 fragment shader over the screen, in a worker on an
 * OffscreenCanvas (tube.worker.ts): four small textures (the still; the
 * circuit with the time each point is laid, drawn once; when each pixel
 * catches, a texel a cell; the typed line) and a few uniforms. Nothing is
 * drawn per element per frame, so it holds its frame rate whatever the main
 * thread is doing.
 */

import { layoutCircuit } from './circuit-layout';
import type { TubeEvent, TubeFrame } from './eye-lines';
import { IRIS } from './eye-lines';

type GLCanvas = OffscreenCanvas | HTMLCanvasElement;
type Rect = { left: number; top: number; width: number; height: number };

/** Times are packed into the textures over this range, s. */
const T_MAX = 8;
/** How fast the pixels catch from a live wire, CSS px/s. */
const PIX_SPEED = 300;
/** Everything has formed by about this time (the arrival map is fitted to it), s. */
const FORMED = 4.3;
/** The chip becomes the cursor over the last moments of the formation, s before FORMED. */
const CHIP_TO_CURSOR = [0.9, 0.3] as const;
/** The pixels sharpen into the live eye over this long, then the lids may open, s. */
const RESOLVE = 1.0;
/** The chip and the cursor, mm. */
const CHIP_HALF = 1.25;
const CURSOR_HALF = [0.28, 0.46] as const;
/** The typed line: at most this many characters. */
const LINE_MAX = 26;
/** The pointer's afterglow: how many of its last places, and how long one lasts, s. */
const TRAIL = 8;
const TRAIL_LIFE = 0.45;

export interface TubeOpts {
  reduce: boolean;
  emit: (e: TubeEvent) => void;
  /** The still of the live 1970 eye, held shut (absolute URL), and where it sits on screen, CSS px. */
  imageUrl?: string;
  imageRect?: Rect;
  /** Lab: 1 shows the still, the arrival map and whether the still loaded; 2 the pixel levels. */
  debug?: number;
}

export interface TubeScene {
  frame(nowMs: number): void;
  resize(frame: TubeFrame): void;
  /** The live eye is up, held shut; `at` is its pupil (CSS px), for the cursor to settle on. */
  eyeReady(at?: { x: number; y: number; r: number } | null): void;
  skip(): void;
  leave(): void;
  pointer(x: number, y: number, down: boolean): void;
  /** A key, by KeyboardEvent.key: printable ones type at the cursor, Enter goes on. */
  key(k: string): void;
  /** The GPU's time for a frame, averaged, where the browser exposes a timer (lab). */
  gpuMs(): number | null;
}

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uTraces;
uniform sampler2D uArrival;
uniform sampler2D uText;
uniform vec2 uView;      // CSS px
uniform float uDpr;
uniform float uTime;
uniform float uCell;     // CSS px
uniform vec2 uGrid;      // cells
uniform vec4 uRect;      // the still: left, top, width, height, CSS px
uniform vec2 uPupil;     // CSS px
uniform float uOn;       // when the resolve began, or -1
uniform float uGone;     // 0..1, leaving without the hand-off
uniform vec3 uPtr;       // x, y, last seen (s)
uniform vec3 uPress;     // x, y, when (s)
uniform vec3 uTrail[${TRAIL}]; // the pointer's last places: x, y, when (s)
uniform float uHasImage;
uniform vec4 uChip;      // the chip / cursor: centre x, y, half w, half h, CSS px
uniform vec2 uChipLook;  // 0 chip outline with pins .. 1 a solid cursor; its light
uniform vec4 uTextRect;  // the typed line: left, top, width, height, CSS px
uniform float uTextA;
uniform float uReduce;
uniform float uDebug;
out vec4 outColor;

const float T_MAX = ${T_MAX.toFixed(1)};
const float RESOLVE = ${RESOLVE.toFixed(2)};
const vec3 P1 = vec3(0.20, 1.0, 0.40);     // the tube's phosphor
const vec3 HOT = vec3(0.80, 1.0, 0.86);

float arrivalAt(vec2 cell) {
  ivec2 c = clamp(ivec2(cell), ivec2(0), ivec2(uGrid) - 1);
  vec4 a = texelFetch(uArrival, c, 0);
  return (a.r * 65280.0 + a.g * 255.0) / 65535.0 * T_MAX;
}

// r: a wire's coverage; g: when it is laid; b: the eye's own wiring (both premultiplied by coverage)
vec3 traceAt(vec2 p) {
  vec4 t = texture(uTraces, p / uView);
  return t.r > 0.003 ? vec3(t.r, t.g / t.r * T_MAX, t.b / t.r) : vec3(0.0, 99.0, 0.0);
}

float box(vec2 p, vec2 c, vec2 h) {
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
  float t = uTime;
  if (uDebug > 0.5 && uDebug < 1.5) {
    vec2 duv = (frag - uRect.xy) / uRect.zw;
    outColor = vec4(texture(uImage, duv).r * 3.0, arrivalAt(floor(frag / uCell)) / T_MAX, uHasImage, 1.0);
    return;
  }
  // the glass bulges a little: sample a touch inward toward the edges
  vec2 c = frag / uView - 0.5;
  vec2 p = (c * (1.0 - 0.045 * dot(c, c)) + 0.5) * uView;
  float r = uOn < 0.0 ? 0.0 : clamp((t - uOn) / RESOLVE, 0.0, 1.0);
  float rs = r * r * (3.0 - 2.0 * r);

  /* the picture: the still's light, at this cell (finer and finer while resolving) */
  float size = mix(uCell, 1.0, rs);
  vec2 q = (floor(p / size) + 0.5) * size;
  vec2 iuv = (q - uRect.xy) / uRect.zw;
  float inside = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
  float L = texture(uImage, iuv).r * inside * uHasImage;
  float lifted = clamp(L * 3.2, 0.0, 1.0);
  lifted = lifted * lifted * (3.0 - 2.0 * lifted);

  /* the pixels: a cell catches when the signal reaches it, lights first and darks last */
  vec2 cell = floor(p / uCell);
  float tau = t - arrivalAt(cell) - (1.0 - lifted) * 0.35;
  if (uReduce > 0.5) tau = t * 2.0 - 0.4;
  float caught = step(0.0, tau);
  float flash = caught * exp(-max(tau, 0.0) / 0.09) * (1.0 - uReduce);
  float settle = smoothstep(0.0, 0.5, tau);
  // a tube of its time had few levels of light per dot
  float stepped = floor(lifted * 12.0 + 0.5) / 12.0;
  float picture = mix(stepped, L, rs);
  float level = caught * mix(0.95, picture, settle);
  if (uDebug > 1.5) { outColor = vec4(L * 3.0, level, caught, 1.0); return; }
  // a cell's dot: round, with dark between, merging as the cells shrink
  vec2 f = fract(p / uCell) - 0.5;
  float dotMask = mix(1.0 - smoothstep(0.30, 0.52, length(f)), 1.0, rs);
  // the beam's lines across the glass, and the phosphor breathing a little
  float scan = mix(0.80 + 0.20 * sin(frag.y * 3.14159 * 0.666), 1.0, rs);
  float flicker = 1.0 + 0.035 * sin(t * 11.0 + cell.x * 0.37 + cell.y * 0.71) * (1.0 - uReduce);
  vec3 col = P1 * level * dotMask * scan * flicker + HOT * flash * 0.7 * dotMask;
  // bloom: the picture's light spills into the dark between the dots
  float spill = textureLod(uImage, iuv, 3.0).r * inside * uHasImage;
  col += P1 * clamp(spill * 3.0, 0.0, 1.0) * 0.16 * smoothstep(0.0, 0.6, tau) * (1.0 - rs);

  /* the circuit: laid by current, glowing, a pulse running along each wire with its afterglow behind */
  vec3 tr = traceAt(p);
  // with reduced motion the circuit is simply there: no growing, no pulses
  float still = 1.0 - uReduce;
  float laid = tr.x * mix(1.0, step(tr.y, t), still);
  // (clamped: off the wires the laid time is far in the future, and exp would overflow)
  float head = laid * exp(-max(t - tr.y, 0.0) * 10.0) * still;
  float since = fract(t * 0.55 - tr.y * 1.3);
  float pulse = laid * exp(-since * 26.0) * still;
  // the wires' glow: one read of the circuit's blurred (mipmapped) copy, not a ring of reads
  vec4 bl = textureLod(uTraces, p / uView, 2.0);
  float glow = bl.r > 0.003 ? bl.r * mix(1.0, step(bl.g / bl.r * T_MAX, t), still) * 1.6 : 0.0;
  // the wires recede once the pixels under them have formed: the eye's own wiring almost entirely
  float formed = smoothstep(0.2, 1.2, tau);
  float wires = (1.0 - smoothstep(0.0, 0.7, rs)) * mix(1.0, mix(0.55, 0.12, tr.z), formed);
  col += (P1 * (laid * 0.75 + glow * 0.45) + HOT * (head * 1.2 + pulse * 0.9)) * wires;

  /* the chip, then the cursor it becomes */
  float d = box(frag, uChip.xy, uChip.zw);
  float outline = 1.0 - smoothstep(0.6, 1.6, abs(d));
  vec2 qc = abs(frag - uChip.xy) - uChip.zw;
  float pins = 0.0;
  if (qc.x > 0.0 && qc.x < 4.0 && qc.y < -1.5) pins = step(0.55, fract((frag.y - uChip.y) / 4.2 + 0.5));
  if (qc.y > 0.0 && qc.y < 4.0 && qc.x < -1.5) pins = max(pins, step(0.55, fract((frag.x - uChip.x) / 4.2 + 0.5)));
  float fill = 1.0 - smoothstep(-0.5, 0.8, d);
  float chip = mix(max(outline, pins * 0.8), fill, uChipLook.x) * uChipLook.y;
  col += (P1 * 0.9 + HOT * 0.5 * uChipLook.x) * chip;
  // the cursor's light on the glass round it
  col += P1 * exp(-max(d, 0.0) / 6.0) * 0.25 * uChipLook.x * uChipLook.y;

  /* the typed line, left of the cursor, in the tube's own bitmap */
  vec2 tuv = (frag - uTextRect.xy) / uTextRect.zw;
  if (uTextA > 0.0 && tuv.x >= 0.0 && tuv.x <= 1.0 && tuv.y >= 0.0 && tuv.y <= 1.0) {
    float ink = texture(uText, tuv).r;
    col += (P1 * 1.1 + HOT * 0.2) * ink * uTextA * scan;
  }

  /* the tube warms, and its first beam spot is the chip's */
  float warm = smoothstep(0.0, 0.6, t);
  float spot = exp(-length(frag - uPupil) / 3.0) * smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.35, 0.8, t));
  col += HOT * spot * 1.5;
  // a slow clock pulse from the chip while it waits: it is alive, not stuck
  float beat = mod(t - 4.4, 3.2);
  if (t > 4.4 && uReduce < 0.5) col += P1 * exp(-abs(length(frag - uPupil) - beat * 420.0) / 24.0) * 0.12 * caught * (1.0 - beat / 3.2) * (1.0 - rs);

  /* the hand: cells under it flare, its afterglow trails behind, a press sends a ring */
  float fresh = clamp(1.0 - (t - uPtr.z) / 1.4, 0.0, 1.0);
  float near = fresh * (1.0 - smoothstep(0.0, 140.0, length(frag - uPtr.xy)));
  float trail = 0.0;
  for (int i = 0; i < ${TRAIL}; i++) {
    float age = t - uTrail[i].z;
    if (age >= 0.0 && age < ${TRAIL_LIFE.toFixed(2)}) trail += exp(-length(frag - uTrail[i].xy) / 18.0) * (1.0 - age / ${TRAIL_LIFE.toFixed(2)});
  }
  col += (P1 * (near * 0.35 + trail * 0.35) * caught + HOT * (near * 0.12 + trail * 0.25) * laid) * (1.0 - rs);
  float ps = t - uPress.z;
  if (ps >= 0.0 && ps < 1.4) {
    float ring = exp(-abs(length(frag - uPress.xy) - ps * 900.0) / 26.0) * (1.0 - ps / 1.4);
    col += (P1 * ring * 0.55 * caught + HOT * ring * laid) * (1.0 - rs);
  }

  /* the glass: a band of brighter phosphor rolling down, a reflection that shifts with the hand, dark curved edges */
  float band = exp(-pow((frag.y / uView.y - fract(t * 0.09)) * 9.0, 2.0));
  col *= 1.0 + 0.10 * band * (1.0 - rs) * (1.0 - uReduce);
  vec2 sheenAt = vec2(0.24, 0.2) - (uPtr.xy / uView - 0.5) * 0.035 * fresh;
  float sheen = exp(-pow(length((frag / uView - sheenAt) * vec2(1.0, 1.8)) * 3.2, 2.0));
  col += vec3(0.55, 0.85, 0.65) * sheen * 0.045 * warm * (1.0 - rs);
  float vig = 1.0 - smoothstep(0.30, 0.78, length(c * vec2(1.0, 1.12)));
  col *= mix(0.5, 1.0, vig);
  vec3 room = vec3(0.010, 0.020, 0.014) * (0.6 + 0.4 * vig) * warm;
  // manuscript: the tube's light becomes ink density on paper
  vec3 lit = room + col;
  float inkAmt = clamp(dot(lit, vec3(0.25, 0.65, 0.10)) * 2.4, 0.0, 1.0);
  vec3 sheet = mix(vec3(0.957, 0.925, 0.855), vec3(0.145, 0.090, 0.055), inkAmt);
  // over the live eye: opaque until the resolve hands the screen to it
  float alpha = (1.0 - smoothstep(0.45, 1.0, r)) * (1.0 - uGone);
  outColor = vec4(sheet * alpha, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('tube shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function makeCanvas(w: number, h: number) {
  if (typeof OffscreenCanvas !== 'undefined')
    return new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
  return Object.assign(document.createElement('canvas'), {
    width: Math.max(1, w),
    height: Math.max(1, h),
  });
}
const ctx2d = (c: OffscreenCanvas | HTMLCanvasElement) =>
  c.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Returns null where WebGL2 is not available; the caller shows the eye without an opening. */
export function createTubeScene(
  canvas: GLCanvas,
  initial: TubeFrame,
  opts: TubeOpts,
): TubeScene | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;
  const glc: WebGL2RenderingContext = gl;
  const vs = compile(glc, glc.VERTEX_SHADER, VERT);
  const fs = compile(glc, glc.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = glc.createProgram();
  if (!prog) return null;
  glc.attachShader(prog, vs);
  glc.attachShader(prog, fs);
  glc.linkProgram(prog);
  if (!glc.getProgramParameter(prog, glc.LINK_STATUS)) return null;
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL useProgram, not a React hook
  glc.useProgram(prog);
  const vao = glc.createVertexArray();
  glc.bindVertexArray(vao);
  const U = (n: string) => glc.getUniformLocation(prog, n);
  const u = {
    image: U('uImage'),
    traces: U('uTraces'),
    arrival: U('uArrival'),
    text: U('uText'),
    view: U('uView'),
    dpr: U('uDpr'),
    time: U('uTime'),
    cell: U('uCell'),
    grid: U('uGrid'),
    rect: U('uRect'),
    pupil: U('uPupil'),
    on: U('uOn'),
    gone: U('uGone'),
    ptr: U('uPtr'),
    press: U('uPress'),
    trail: U('uTrail'),
    hasImage: U('uHasImage'),
    chip: U('uChip'),
    chipLook: U('uChipLook'),
    textRect: U('uTextRect'),
    textA: U('uTextA'),
    reduce: U('uReduce'),
    debug: U('uDebug'),
  };

  const tex = (filter: number) => {
    const t = glc.createTexture();
    glc.bindTexture(glc.TEXTURE_2D, t);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_WRAP_S, glc.CLAMP_TO_EDGE);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_WRAP_T, glc.CLAMP_TO_EDGE);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_MIN_FILTER, filter);
    glc.texParameteri(
      glc.TEXTURE_2D,
      glc.TEXTURE_MAG_FILTER,
      filter === glc.NEAREST ? glc.NEAREST : glc.LINEAR,
    );
    glc.texImage2D(
      glc.TEXTURE_2D,
      0,
      glc.RGBA,
      1,
      1,
      0,
      glc.RGBA,
      glc.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    return t;
  };
  // the still is mipmapped: its blurred levels are the bloom
  const imageTex = tex(glc.LINEAR_MIPMAP_LINEAR);
  // mipmapped: its blurred levels are the wires' glow
  const traceTex = tex(glc.LINEAR_MIPMAP_LINEAR);
  const arrivalTex = tex(glc.NEAREST);
  const textTex = tex(glc.NEAREST);
  let hasImage = 0;
  // the GPU's own time per frame, where the browser allows timer queries
  const timer = glc.getExtension('EXT_disjoint_timer_query_webgl2') as {
    TIME_ELAPSED_EXT: number;
    GPU_DISJOINT_EXT: number;
  } | null;
  const queries: WebGLQuery[] = [];
  let gpuSum = 0;
  let gpuCount = 0;

  let fr = initial;
  let t0 = -1;
  let ahead = 0;
  let tNow = 0;
  let ready = false;
  let pupil: { x: number; y: number; r: number } | null = null;
  let onAt = -1;
  let leaveAt = -1;
  let cell = 6;
  let cols = 0;
  let rows = 0;
  let arrival = new Float32Array(0);
  let arrivalBytes = new Uint8Array(0);
  let dirty = false;
  let lastArrive = 0;
  const ptr = { x: -1e4, y: -1e4, seen: -10 };
  const press = { x: -1e4, y: -1e4, at: -10 };
  const trail = new Float32Array(TRAIL * 3).fill(-10);
  let trailNext = 0;
  let typed = '';
  let textDirty = true;
  let typedAt = -10;
  const textRect = { left: 0, top: 0, width: 1, height: 1 };
  const sent = new Set<TubeEvent>();
  const emit = (e: TubeEvent) => {
    if (sent.has(e)) return;
    sent.add(e);
    opts.emit(e);
  };

  if (opts.imageUrl && typeof fetch !== 'undefined' && typeof createImageBitmap !== 'undefined') {
    fetch(opts.imageUrl)
      .then((r) => r.blob())
      .then((b) => createImageBitmap(b))
      .then((bmp) => {
        glc.bindTexture(glc.TEXTURE_2D, imageTex);
        glc.texImage2D(glc.TEXTURE_2D, 0, glc.RGBA, glc.RGBA, glc.UNSIGNED_BYTE, bmp);
        glc.generateMipmap(glc.TEXTURE_2D);
        hasImage = 1;
      })
      .catch((e) => console.warn('tube: the still did not load', e));
  }

  const home = () => ({ x: fr.cx + IRIS.c[0] * fr.pxPerMm, y: fr.cy - IRIS.c[1] * fr.pxPerMm });

  function build() {
    // pixel art needs no more than 1.5 device pixels to the CSS pixel; it saves the GPU on retina and phones
    const dpr = Math.min(fr.dpr, 1.5);
    canvas.width = Math.round(fr.w * dpr);
    canvas.height = Math.round(fr.h * dpr);
    const { traces, chips, vias } = layoutCircuit(fr);

    /* the circuit, drawn once: coverage in red, when each bit is laid in green, the eye's own wiring in blue */
    const W = Math.max(1, Math.round(fr.w));
    const H = Math.max(1, Math.round(fr.h));
    const tc = makeCanvas(W, H);
    const g = ctx2d(tc);
    if (g) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      let kind = 0;
      const col = (time: number) => `rgb(255,${Math.round(clamp01(time / T_MAX) * 255)},${kind})`;
      for (const tr of traces) {
        kind = tr.eye ? 255 : 0;
        g.lineWidth = Math.max(1.15, tr.width);
        // in short pieces, each coloured with the time current reaches it
        const step = 5;
        let prev = tr.pts[0];
        for (let d = step; d <= tr.len + step; d += step) {
          const dd = Math.min(d, tr.len);
          let i = 1;
          while (i < tr.cum.length - 1 && tr.cum[i] < dd) i++;
          const k = (dd - tr.cum[i - 1]) / (tr.cum[i] - tr.cum[i - 1] || 1);
          const cur: [number, number] = [
            lerp(tr.pts[i - 1][0], tr.pts[i][0], k),
            lerp(tr.pts[i - 1][1], tr.pts[i][1], k),
          ];
          g.strokeStyle = col(tr.start + dd / tr.speed);
          g.beginPath();
          g.moveTo(prev[0], prev[1]);
          g.lineTo(cur[0], cur[1]);
          g.stroke();
          prev = cur;
          if (dd >= tr.len) break;
        }
        if (tr.padEnd) {
          const [x, y] = tr.pts[tr.pts.length - 1];
          g.strokeStyle = col(tr.start + tr.len / tr.speed);
          g.lineWidth = 1;
          g.beginPath();
          g.arc(x, y, tr.eye ? 2.2 : 2.6, 0, Math.PI * 2);
          g.stroke();
        }
      }
      // the board's chips (the eye's own chip is drawn by the shader, so it can become the cursor)
      kind = 0;
      for (const ch of chips) {
        if (ch.eye) continue;
        g.strokeStyle = col(ch.start);
        g.lineWidth = 1;
        g.strokeRect(ch.x, ch.y, ch.w, ch.h);
        const inset = Math.min(ch.w, ch.h) * 0.28;
        g.strokeRect(ch.x + inset, ch.y + inset, ch.w - inset * 2, ch.h - inset * 2);
        g.beginPath();
        for (let i = 0; i < ch.pins; i++) {
          const fx = ch.x + ((i + 0.5) / ch.pins) * ch.w;
          const fy = ch.y + ((i + 0.5) / ch.pins) * ch.h;
          g.moveTo(fx, ch.y);
          g.lineTo(fx, ch.y - 3.5);
          g.moveTo(fx, ch.y + ch.h);
          g.lineTo(fx, ch.y + ch.h + 3.5);
          if (ch.h > 30) {
            g.moveTo(ch.x, fy);
            g.lineTo(ch.x - 3.5, fy);
            g.moveTo(ch.x + ch.w, fy);
            g.lineTo(ch.x + ch.w + 3.5, fy);
          }
        }
        g.stroke();
      }
      g.lineWidth = 1;
      for (const v of vias) {
        g.strokeStyle = col(v.start);
        g.beginPath();
        g.arc(v.x, v.y, 1.6, 0, Math.PI * 2);
        g.stroke();
      }
      glc.bindTexture(glc.TEXTURE_2D, traceTex);
      glc.texImage2D(
        glc.TEXTURE_2D,
        0,
        glc.RGBA,
        glc.RGBA,
        glc.UNSIGNED_BYTE,
        tc as TexImageSource,
      );
      glc.generateMipmap(glc.TEXTURE_2D);
    }

    /* when each pixel catches: from the wires outward, through the cells */
    cell = Math.max(4, Math.min(8, Math.round(Math.min(fr.w, fr.h) / 110)));
    cols = Math.ceil(fr.w / cell);
    rows = Math.ceil(fr.h / cell);
    const n = cols * rows;
    arrival = new Float32Array(n).fill(Infinity);
    const seed = (x: number, y: number, at: number) => {
      const c = Math.floor(x / cell);
      const r = Math.floor(y / cell);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const i = r * cols + c;
      if (at < arrival[i]) arrival[i] = at;
    };
    for (const tr of traces) {
      for (let d = 0; d <= tr.len; d += cell * 0.5) {
        let i = 1;
        while (i < tr.cum.length - 1 && tr.cum[i] < d) i++;
        const k = (d - tr.cum[i - 1]) / (tr.cum[i] - tr.cum[i - 1] || 1);
        seed(
          lerp(tr.pts[i - 1][0], tr.pts[i][0], k),
          lerp(tr.pts[i - 1][1], tr.pts[i][1], k),
          tr.start + d / tr.speed + 0.05,
        );
      }
    }
    const h0 = home();
    seed(h0.x, h0.y, 0.3);
    // spread through the cells; each crossing costs a little more or less, so the front is uneven
    const step = cell / PIX_SPEED;
    const cost = new Float32Array(n);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cost[r * cols + c] =
          step *
          (0.45 +
            1.6 * hash2(c * 0.37, r * 0.53) ** 2 +
            0.6 * (Math.sin(c * 0.21 + Math.sin(r * 0.13) * 3) * 0.5 + 0.5));
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          let a = arrival[i];
          if (c > 0) a = Math.min(a, arrival[i - 1] + cost[i]);
          if (r > 0) a = Math.min(a, arrival[i - cols] + cost[i]);
          if (c > 0 && r > 0) a = Math.min(a, arrival[i - cols - 1] + cost[i] * 1.41);
          if (c < cols - 1 && r > 0) a = Math.min(a, arrival[i - cols + 1] + cost[i] * 1.41);
          arrival[i] = a;
        }
      }
      for (let r = rows - 1; r >= 0; r--) {
        for (let c = cols - 1; c >= 0; c--) {
          const i = r * cols + c;
          let a = arrival[i];
          if (c < cols - 1) a = Math.min(a, arrival[i + 1] + cost[i]);
          if (r < rows - 1) a = Math.min(a, arrival[i + cols] + cost[i]);
          if (c < cols - 1 && r < rows - 1) a = Math.min(a, arrival[i + cols + 1] + cost[i] * 1.41);
          if (c > 0 && r < rows - 1) a = Math.min(a, arrival[i + cols - 1] + cost[i] * 1.41);
          arrival[i] = a;
        }
      }
    }
    // fit it to the time there is: the last pixels catch by FORMED (darks wait a little more in the shader)
    const sorted = Array.from(arrival)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? FORMED;
    const k = p99 > FORMED - 0.75 ? (FORMED - 0.75 - 0.3) / (p99 - 0.3) : 1;
    lastArrive = 0;
    for (let i = 0; i < n; i++) {
      const a = Number.isFinite(arrival[i]) ? 0.3 + (arrival[i] - 0.3) * k : FORMED - 0.75;
      arrival[i] = a;
      if (a > lastArrive) lastArrive = a;
    }
    arrivalBytes = new Uint8Array(n * 4);
    dirty = true;
    textDirty = true;
  }

  function uploadArrival() {
    for (let i = 0; i < cols * rows; i++) {
      const v = Math.round((Math.min(T_MAX, Math.max(0, arrival[i])) / T_MAX) * 65535);
      arrivalBytes[i * 4] = v >> 8;
      arrivalBytes[i * 4 + 1] = v & 255;
      arrivalBytes[i * 4 + 3] = 255;
    }
    glc.bindTexture(glc.TEXTURE_2D, arrivalTex);
    glc.texImage2D(
      glc.TEXTURE_2D,
      0,
      glc.RGBA,
      cols,
      rows,
      0,
      glc.RGBA,
      glc.UNSIGNED_BYTE,
      arrivalBytes,
    );
    dirty = false;
  }

  /** The typed line, "> " and what was typed, right-aligned against the cursor, at half resolution (a bitmap font's look). */
  function uploadText() {
    textDirty = false;
    const k = fr.pxPerMm;
    const hCss = Math.max(12, CURSOR_HALF[1] * 2 * k * 1.15);
    const scale = 0.5;
    const wCss = Math.min(fr.w * 0.45, hCss * 0.62 * (LINE_MAX + 3));
    const c = makeCanvas(Math.ceil(wCss * scale), Math.ceil(hCss * scale));
    const g = ctx2d(c);
    if (!g) return;
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.font = `bold ${Math.round(hCss * scale * 0.86)}px ui-monospace, Menlo, Consolas, monospace`;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    g.fillText(`> ${typed}`, c.width - 1, c.height / 2 + 1);
    glc.bindTexture(glc.TEXTURE_2D, textTex);
    glc.texImage2D(glc.TEXTURE_2D, 0, glc.RGBA, glc.RGBA, glc.UNSIGNED_BYTE, c as TexImageSource);
    const h = home();
    const gap = CURSOR_HALF[0] * k + k * 0.35;
    textRect.left = h.x - gap - wCss;
    textRect.top = h.y - hCss / 2;
    textRect.width = wCss;
    textRect.height = hCss;
  }

  build();

  function frame(nowMs: number) {
    if (t0 < 0) t0 = nowMs;
    const t = (nowMs - t0) / 1000 + ahead;
    tNow = t;
    emit('started');
    const formed = Math.min(FORMED, lastArrive + 0.75);
    if (ready && onAt < 0 && leaveAt < 0 && t >= formed) {
      onAt = t;
      emit('landing');
    }
    if (onAt >= 0 && t - onAt >= RESOLVE * 0.85) emit('open');
    const gone = leaveAt >= 0 ? Math.min(1, (t - leaveAt) / 0.5) : 0;
    if ((onAt >= 0 && t - onAt >= RESOLVE + 0.1) || gone >= 1) {
      glc.viewport(0, 0, canvas.width, canvas.height);
      glc.clearColor(0, 0, 0, 0);
      glc.clear(glc.COLOR_BUFFER_BIT);
      emit('done');
      return;
    }
    if (dirty) uploadArrival();
    if (textDirty) uploadText();

    /* the chip: it appears with the first beam, then shrinks into the cursor and blinks */
    const k = fr.pxPerMm;
    const h = home();
    const chipIn = smooth((t - 0.15) / 0.3);
    const toCursor = opts.reduce
      ? 1
      : smooth((t - (formed - CHIP_TO_CURSOR[0])) / (CHIP_TO_CURSOR[0] - CHIP_TO_CURSOR[1]));
    let cx = h.x;
    let cy = h.y;
    let hw = lerp(CHIP_HALF * k, CURSOR_HALF[0] * k, toCursor);
    let hh = lerp(CHIP_HALF * k, CURSOR_HALF[1] * k, toCursor);
    const blink =
      toCursor >= 1 && Math.floor((t - formed) / 0.53) % 2 === 1 && typedAt < t - 0.6 ? 0.15 : 1;
    let chipLight = chipIn * (toCursor >= 1 ? blink : 1);
    const r = onAt < 0 ? 0 : clamp01((t - onAt) / RESOLVE);
    if (onAt >= 0 && pupil) {
      // settle onto the live eye's own cursor (era-medium.ts draws it 0.4 × 0.72 of the pupil's radius, on the pupil)
      const s = smooth(r / 0.5);
      cx = lerp(cx, pupil.x, s);
      cy = lerp(cy, pupil.y, s);
      hw = lerp(hw, pupil.r * 0.2, s);
      hh = lerp(hh, pupil.r * 0.36, s);
    }
    if (onAt >= 0) chipLight = chipIn * (1 - smooth((r - 0.55) / 0.3));
    const textA =
      clamp01((toCursor - 0.6) / 0.4) *
      (onAt >= 0 ? 1 - smooth(r / 0.4) : 1) *
      (typed.length ? 1 : 0.85);

    const gl2 = glc;
    gl2.viewport(0, 0, canvas.width, canvas.height);
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL useProgram, not a React hook
    gl2.useProgram(prog);
    const bind = (unit: number, texture: WebGLTexture | null, loc: WebGLUniformLocation | null) => {
      gl2.activeTexture(gl2.TEXTURE0 + unit);
      gl2.bindTexture(gl2.TEXTURE_2D, texture);
      gl2.uniform1i(loc, unit);
    };
    bind(0, imageTex, u.image);
    bind(1, traceTex, u.traces);
    bind(2, arrivalTex, u.arrival);
    bind(3, textTex, u.text);
    gl2.uniform2f(u.view, fr.w, fr.h);
    gl2.uniform1f(u.dpr, canvas.width / Math.max(1, fr.w));
    gl2.uniform1f(u.time, t);
    gl2.uniform1f(u.cell, cell);
    gl2.uniform2f(u.grid, cols, rows);
    const R = opts.imageRect ?? { left: 0, top: 0, width: fr.w, height: fr.h };
    gl2.uniform4f(u.rect, R.left, R.top, R.width, R.height);
    gl2.uniform2f(u.pupil, h.x, h.y);
    gl2.uniform1f(u.on, onAt);
    gl2.uniform1f(u.gone, gone);
    gl2.uniform3f(u.ptr, ptr.x, ptr.y, ptr.seen);
    gl2.uniform3f(u.press, press.x, press.y, press.at);
    gl2.uniform3fv(u.trail, trail);
    gl2.uniform1f(u.hasImage, hasImage);
    gl2.uniform4f(u.chip, cx, cy, hw, hh);
    gl2.uniform2f(u.chipLook, toCursor, chipLight);
    gl2.uniform4f(u.textRect, textRect.left, textRect.top, textRect.width, textRect.height);
    gl2.uniform1f(u.textA, textA);
    gl2.uniform1f(u.reduce, opts.reduce ? 1 : 0);
    gl2.uniform1f(u.debug, opts.debug ?? 0);
    gl2.bindVertexArray(vao);
    const q = timer && queries.length < 4 ? gl2.createQuery() : null;
    if (q && timer) gl2.beginQuery(timer.TIME_ELAPSED_EXT, q);
    gl2.drawArrays(gl2.TRIANGLES, 0, 3);
    if (q && timer) {
      gl2.endQuery(timer.TIME_ELAPSED_EXT);
      queries.push(q);
    }
    // collect the queries that have finished
    while (queries.length && gl2.getQueryParameter(queries[0], gl2.QUERY_RESULT_AVAILABLE)) {
      const done = queries.shift() as WebGLQuery;
      if (timer && !gl2.getParameter(timer.GPU_DISJOINT_EXT)) {
        gpuSum += gl2.getQueryParameter(done, gl2.QUERY_RESULT) / 1e6;
        gpuCount++;
      }
      gl2.deleteQuery(done);
    }
  }

  return {
    frame,
    gpuMs: () => (gpuCount ? gpuSum / gpuCount : null),
    resize(next) {
      const changed =
        Math.abs(next.w - fr.w) > 1 || Math.abs(next.h - fr.h) > 1 || next.dpr !== fr.dpr;
      fr = next;
      if (changed) {
        build();
        // a new screen shape is already formed; no one wants to watch it twice
        for (let i = 0; i < arrival.length; i++)
          arrival[i] = Math.min(arrival[i], Math.max(0, tNow - 0.6));
      }
    },
    eyeReady(at) {
      ready = true;
      if (at) pupil = at;
    },
    skip() {
      const end = Math.min(FORMED, lastArrive + 0.75);
      if (tNow < end) ahead += end - tNow;
    },
    leave() {
      if (leaveAt < 0) leaveAt = tNow;
    },
    pointer(x, y, down) {
      ptr.x = x;
      ptr.y = y;
      ptr.seen = tNow;
      // its afterglow: a ring of its last places
      trail[trailNext * 3] = x;
      trail[trailNext * 3 + 1] = y;
      trail[trailNext * 3 + 2] = tNow;
      trailNext = (trailNext + 1) % TRAIL;
      if (down) {
        press.x = x;
        press.y = y;
        press.at = tNow;
      }
      // the hand brings the signal: pixels round it catch now
      if (tNow < 0.4) return;
      const c0 = Math.floor(x / cell);
      const r0 = Math.floor(y / cell);
      const Rc = Math.ceil(46 / cell);
      for (let r = Math.max(0, r0 - Rc); r <= Math.min(rows - 1, r0 + Rc); r++) {
        for (let c = Math.max(0, c0 - Rc); c <= Math.min(cols - 1, c0 + Rc); c++) {
          const d = Math.hypot(c - c0, r - r0) * cell;
          if (d > 46) continue;
          const i = r * cols + c;
          const at = tNow + d / (PIX_SPEED * 2) + 0.02;
          if (at < arrival[i]) {
            arrival[i] = at;
            dirty = true;
          }
        }
      }
    },
    key(k) {
      if (k === 'Enter' || k === 'Escape') {
        // go on: straight to the formed eye; it opens as soon as it is ready
        const end = Math.min(FORMED, lastArrive + 0.75);
        if (tNow < end) ahead += end - tNow;
        return;
      }
      if (k === 'Backspace') typed = typed.slice(0, -1);
      else if (k.length === 1 && typed.length < LINE_MAX) typed += k;
      else return;
      typedAt = tNow;
      textDirty = true;
    },
  };
}
