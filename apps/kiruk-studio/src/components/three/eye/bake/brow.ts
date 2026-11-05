/**
 * The brow and the skin's fine hair, drawn once by canvas 2D and laid on the
 * skin by the lid shader (lid-mesh.ts) in face space, mm.
 *
 * A brow is hairs lying almost flat on the skin, so it is drawn on the skin
 * rather than built: it follows every fold the lid mesh makes, costs a
 * texture read, and runs the same on WebGL2. Each hair is a tapered, slightly
 * bent stroke; its direction goes into red and green (for the shader's sheen
 * along it) and its coverage into alpha.
 *
 * The flow is a real brow's: the head's hairs stand up, the body's lower
 * hairs run up and out while its upper ones run out and down, so the two meet
 * along a ridge (the herringbone), and the tail's run out and down. The edges
 * are feathered: hairs thin out toward them rather than stopping on a line.
 *
 * The fine hair (vellus) is a small tile of faint, short hairs, mostly
 * running down and out, repeated across the face.
 */

import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
} from 'three/webgpu';

/** Where the brow's map sits on the face, mm (x lateral +, y up). */
export const BROW_BOUNDS = { x0: -15.5, y0: 5.4, w: 38, h: 10.5 } as const;
/** The fine hair's tile, mm on a side. */
export const VELLUS_TILE_MM = 6;

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The brow's curve, shared with the move-net (nodes/brow-net.ts). u runs
 * 0 at the head to 1 at the tail. The hairs are drawn on this curve; the net
 * moves the same curve, so the two cannot drift apart.
 */
export const BROW_SHAPE = {
  x0: -13.6,
  span: 31.4,
  lower0: 8.2,
  rise: 1.1,
  riseEnd: 0.66,
  fall: 2.6,
  fallPow: 1.5,
  depth0: 3.2,
  depth1: 2.7,
  depthAt: 0.45,
  tail0: 1,
  tail1: 0.32,
  tailAt0: 0.6,
  tailAt1: 1,
} as const;

/** The brow along u (0 head … 1 tail): x, its lower edge, and how deep it is, mm. */
function browAt(u: number) {
  const S = BROW_SHAPE;
  const x = S.x0 + S.span * u;
  const rise = S.rise * Math.sin((Math.PI / 2) * Math.min(u / S.riseEnd, 1));
  const fu = u > S.riseEnd ? (u - S.riseEnd) / (1 - S.riseEnd) : 0;
  const fall = S.fall * fu ** S.fallPow;
  const lower = S.lower0 + rise - fall;
  const depth =
    mixN(S.depth0, S.depth1, smooth(0, S.depthAt, u)) *
    mixN(S.tail0, S.tail1, smooth(S.tailAt0, S.tailAt1, u));
  return { x, lower, depth };
}

/** The flow: which way a hair at (u, v across, 0 lower edge … 1 upper) runs, radians from lateral. */
function flowAt(u: number, v: number) {
  const head = mixN(1.35, 0.95, u / 0.16);
  const lower = mixN(0.62, 0.3, u);
  const upper = mixN(-0.02, -0.32, u);
  const body = mixN(lower, upper, smooth(0.42, 0.68, v));
  const tail = -0.32 - 0.35 * smooth(0.72, 1, u);
  return mixN(mixN(head, body, smooth(0.08, 0.2, u)), tail, smooth(0.66, 0.84, u));
}

/** One hair as a filled, tapered, bent stroke. */
function hair(
  ctx: CanvasRenderingContext2D,
  toPx: (x: number, y: number) => [number, number],
  x: number,
  y: number,
  angle: number,
  len: number,
  width: number,
  bend: number,
  alpha: number,
) {
  const n = 8;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  let px = x;
  let py = y;
  let a = angle;
  const step = len / n;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const w = (width / 2) * (1 - t) ** 0.6 + 0.004;
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    left.push(toPx(px + nx * w, py + ny * w));
    right.push(toPx(px - nx * w, py - ny * w));
    px += Math.cos(a) * step;
    py += Math.sin(a) * step;
    a += bend / n;
  }
  // direction into red and green, coverage into alpha
  const r = Math.round((Math.cos(angle + bend / 2) * 0.5 + 0.5) * 255);
  const g = Math.round((Math.sin(angle + bend / 2) * 0.5 + 0.5) * 255);
  ctx.fillStyle = `rgba(${r},${g},128,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(...left[0]);
  for (const p of left.slice(1)) ctx.lineTo(...p);
  for (const p of right.reverse()) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fill();
}

export interface BrowBake {
  brow: CanvasTexture;
  vellus: CanvasTexture;
  dispose: () => void;
}

/**
 * @param hairs how many brow hairs (the tier's budget)
 * @param res the brow map's width, px (its height follows the bounds)
 */
export function bakeBrow(hairs: number, res: number, seed = 0xb20f): BrowBake {
  const rand = rng(seed);
  const B = BROW_BOUNDS;
  const W = res;
  const H = Math.round((res * B.h) / B.w);
  const pxPerMm = W / B.w;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  // canvas y runs down; the texture is uploaded flipped, so draw y up
  const toPx = (x: number, y: number): [number, number] => [
    (x - B.x0) * pxPerMm,
    H - (y - B.y0) * pxPerMm,
  ];

  let placed = 0;
  for (let tries = 0; placed < hairs && tries < hairs * 8; tries++) {
    // more hairs where the brow is deeper, and fewer at its feathered edges
    const u = rand();
    const v = rand();
    const at = browAt(u);
    const keep =
      (at.depth / 4.3) *
      smooth(0, 0.07, u) *
      (1 - smooth(0.93, 1, u)) *
      (0.25 + 0.75 * smooth(0, 0.14, v)) *
      (0.2 + 0.8 * (1 - smooth(0.8, 1, v)));
    if (rand() > keep) continue;
    placed++;
    const x = at.x + (rand() - 0.5) * 0.5;
    const y = at.lower + v * at.depth + (rand() - 0.5) * 0.3;
    const angle = flowAt(u, v) + (rand() - 0.5) * 0.36;
    const len =
      mixN(mixN(2.4, 4.6, smooth(0, 0.3, u)), 3.8, smooth(0.7, 1, u)) * (0.75 + rand() * 0.4);
    // hairs bend toward the brow's middle line, a little
    const bend = (v < 0.5 ? -1 : 1) * (0.1 + rand() * 0.2) * Math.sign(Math.cos(angle) + 0.01);
    const width = 0.06 + rand() * 0.035;
    // the feathered edges are the finest, palest hairs
    const edge = Math.min(v, 1 - v, u * 3, (1 - u) * 4);
    hair(
      ctx,
      toPx,
      x,
      y,
      angle,
      len,
      width * (0.7 + 0.3 * smooth(0, 0.25, edge)),
      bend,
      0.55 + 0.45 * smooth(0, 0.3, edge),
    );
  }

  const brow = new CanvasTexture(canvas);
  brow.minFilter = LinearMipmapLinearFilter;
  brow.magFilter = LinearFilter;
  brow.generateMipmaps = true;
  brow.anisotropy = 4;

  // the fine hair: a small tile, faint, short, mostly down and out
  const V = 512;
  const vc = document.createElement('canvas');
  vc.width = V;
  vc.height = V;
  const vctx = vc.getContext('2d')!;
  const vPx = V / VELLUS_TILE_MM;
  for (let i = 0; i < 900; i++) {
    const x = rand() * VELLUS_TILE_MM;
    const y = rand() * VELLUS_TILE_MM;
    const angle = -1.15 + (rand() - 0.5) * 0.9;
    const len = 0.35 + rand() * 0.9;
    const bend = (rand() - 0.5) * 0.4;
    const alpha = 0.5 + rand() * 0.5;
    // drawn again a tile over, so a hair crossing the tile's edge wraps
    for (const [ox, oy] of [
      [0, 0],
      [-VELLUS_TILE_MM, 0],
      [0, VELLUS_TILE_MM],
      [-VELLUS_TILE_MM, VELLUS_TILE_MM],
    ]) {
      hair(
        vctx,
        (hx, hy) => [(hx + ox) * vPx, V - (hy + oy) * vPx],
        x,
        y,
        angle,
        len,
        0.022,
        bend,
        alpha,
      );
    }
  }
  const vellus = new CanvasTexture(vc);
  vellus.wrapS = RepeatWrapping;
  vellus.wrapT = RepeatWrapping;
  vellus.minFilter = LinearMipmapLinearFilter;
  vellus.magFilter = LinearFilter;
  vellus.generateMipmaps = true;

  return {
    brow,
    vellus,
    dispose() {
      brow.dispose();
      vellus.dispose();
    },
  };
}
