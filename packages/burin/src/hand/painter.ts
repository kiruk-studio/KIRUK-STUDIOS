/// <reference path="./p5-brush.d.ts" />
/**
 * The painter: p5.brush (standalone, WebGL 2) painting the hand's layers on one canvas.
 *
 * One canvas, one WebGL 2 context. Each medium is painted alone — cleared, painted in page
 * coordinates, flushed — and taken off the canvas as an ImageBitmap (transferToImageBitmap:
 * no copy). p5.brush mixes its pigments spectrally (Kubelka–Munk) over the white sheet, so a
 * layer is "the medium on white": exactly what the GPU sheet needs to multiply in. Lead white
 * is painted on black instead, so its coverage is its lightness.
 *
 * p5.brush keeps module-level state (its brushes, scale, fill and hatch settings), so one
 * painter owns the library: in a worker that is the worker; on the main thread, the page.
 *
 * spec-link: ideas/studio-dawn/hand.md
 */
import * as brush from 'p5.brush/standalone';
import { useBrushes } from './brushes';
import { HAND_LAYERS, type HandLayer, type HandRequest, type HandSheet, type Rect } from './media';
import { type HatchOptions, hatch, type Pt, type Rng, rng, type Spine } from './spine';

export type Brush = typeof brush;

export type WashOptions = {
  /** edge bleed 0 … 1 */
  bleed?: number;
  /** granulation and reticulation 0 … 1 */
  texture?: number;
  /** the dried rim 0 … 1 */
  border?: number;
  /** the scattered sparse layers at the edge */
  scatter?: boolean;
  /** how far the paint separates into a warmer and a cooler pigment 0 … 1 */
  split?: number;
  /** 0 straight sides … 1 round */
  curvature?: number;
  dir?: 'out' | 'in';
};

/** What a recipe paints with. Coordinates are CSS px on the page. */
export type HandContext = {
  brush: Brush;
  /** the impression's hand: every choice is seeded */
  h: Rng;
  req: HandRequest;
  /** one stroke along a spine, in a brush and colour */
  draw(sp: Spine, name: string, color: string, weight?: number, curvature?: number): void;
  /** a watercolour wash over a closed outline (p5.brush fill: bleed, rim, granulation, wet-in-wet) */
  wash(poly: readonly Pt[], color: string, alpha: number, o?: WashOptions): void;
  /** a flat, quick layer of colour (p5.brush wash): no watercolour */
  flat(poly: readonly Pt[], color: string, alpha: number, curvature?: number): void;
  /** dry chalk massed into a shape (p5.brush mass) */
  mass(
    poly: readonly Pt[],
    name: string,
    color: string,
    o?: { precision?: number; strength?: number; gradient?: number },
  ): void;
  /** hash strokes: hatching cut into short strokes, clipped to a shape */
  hatch(poly: readonly Pt[], o: HatchOptions, name: string, color: string, weight?: number): void;
};

export type HandRecipe = {
  /** brush scale for this request (p5.brush weights are for a 60 px unit) */
  scale(req: HandRequest): number;
  /** paint one layer; called once per medium, and once for 'iris' if `iris` gives a rect */
  paint(ctx: HandContext, layer: HandLayer | 'iris'): void;
  /** the rest-pose rect (CSS px) the iris decal covers, or null for none */
  iris?(req: HandRequest): Rect | null;
};

export type Recipes = Record<string, HandRecipe>;

/** A seed per layer, so changing one medium's recipe does not reshuffle the others. */
const layerSeed = (seed: number, layer: string) => {
  let h = seed | 0;
  for (let i = 0; i < layer.length; i++) h = Math.imul(h ^ layer.charCodeAt(i), 0x01000193);
  return (h ^ (h >>> 13)) >>> 0;
};

function shape(poly: readonly Pt[], curvature: number, close: boolean) {
  brush.beginShape(curvature);
  for (const p of poly) brush.vertex(p[0], p[1]);
  brush.endShape(close);
}

function context(req: HandRequest, h: Rng): HandContext {
  return {
    brush,
    h,
    req,
    draw(sp, name, color, weight = 1, curvature = 0.5) {
      if (sp.length < 2) return;
      brush.noFill();
      brush.noHatch();
      brush.set(name, color, weight);
      brush.spline(sp, curvature);
      brush.noStroke();
    },
    wash(poly, color, alpha, o = {}) {
      if (poly.length < 3) return;
      brush.noStroke();
      brush.noHatch();
      brush.fill(color, alpha);
      brush.fillBleed(o.bleed ?? 0.15, o.dir ?? 'out');
      brush.fillTexture(o.texture ?? 0.35, o.border ?? 0.45, o.scatter ?? true, o.split ?? 0.15);
      shape(poly, o.curvature ?? 0.5, true);
      brush.noFill();
    },
    flat(poly, color, alpha, curvature = 0.5) {
      if (poly.length < 3) return;
      brush.noStroke();
      brush.noFill();
      brush.noHatch();
      brush.wash(color, alpha);
      shape(poly, curvature, true);
      brush.noWash();
    },
    mass(poly, name, color, o = {}) {
      if (poly.length < 3) return;
      brush.noStroke();
      brush.noFill();
      brush.noHatch();
      brush.mass(name, color, { precision: 0.5, strength: 0.6, ...o });
      shape(poly, 0.4, true);
      brush.noMass();
    },
    hatch(poly, o, name, color, weight = 1) {
      for (const sp of hatch(poly, o, h)) this.draw(sp, name, color, weight, 0.5);
    },
  };
}

/** The canvas the painter draws on, sized to the request. */
function fit(canvas: OffscreenCanvas | HTMLCanvasElement, req: HandRequest) {
  const k = req.density;
  const W = Math.max(1, Math.round(req.region[2] * k));
  const H = Math.max(1, Math.round(req.region[3] * k));
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  // brush.load re-reads the canvas size, so a resized canvas is a resized target.
  brush.load(canvas);
  return [W, H] as const;
}

function begin(req: HandRequest, W: number, H: number, ground: string) {
  brush.clear(ground);
  brush.push();
  // The context's origin is the canvas centre: move it to the region's corner, in CSS px.
  brush.translate(-W / 2, -H / 2);
  brush.scale(req.density);
  brush.translate(-req.region[0], -req.region[1]);
}

function take(canvas: OffscreenCanvas | HTMLCanvasElement): Promise<ImageBitmap> | ImageBitmap {
  if ('transferToImageBitmap' in canvas) return canvas.transferToImageBitmap();
  return createImageBitmap(canvas);
}

/**
 * Paint a sheet: the four media over the region, then the iris decal.
 * Returns bitmaps the caller owns (transfer them, then close them when replaced).
 */
export async function paintSheet(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  req: HandRequest,
  recipes: Recipes,
): Promise<Omit<HandSheet, 'via'>> {
  const t0 = performance.now();
  const recipe = recipes[req.subject];
  if (!recipe) throw new Error(`hand: no recipe for "${req.subject}"`);
  const [W, H] = fit(canvas, req);
  brush.angleMode(brush.RADIANS);
  useBrushes(recipe.scale(req));

  const layers = {} as Record<HandLayer, ImageBitmap>;
  for (const layer of HAND_LAYERS) {
    const s = layerSeed(req.seed, layer);
    brush.seed(s);
    brush.noiseSeed(s);
    begin(req, W, H, layer === 'body' ? '#000000' : '#ffffff');
    try {
      recipe.paint(context(req, rng(s)), layer);
    } finally {
      brush.pop();
      brush.render();
    }
    layers[layer] = await take(canvas);
  }

  let iris: HandSheet['iris'] = null;
  const rect = recipe.iris?.(req) ?? null;
  if (rect) {
    const s = layerSeed(req.seed, 'iris');
    brush.seed(s);
    brush.noiseSeed(s);
    begin(req, W, H, '#ffffff');
    try {
      recipe.paint(context(req, rng(s)), 'iris');
    } finally {
      brush.pop();
      brush.render();
    }
    const k = req.density;
    const sx = Math.max(0, Math.floor((rect[0] - req.region[0]) * k));
    const sy = Math.max(0, Math.floor((rect[1] - req.region[1]) * k));
    const sw = Math.max(1, Math.min(W - sx, Math.ceil(rect[2] * k)));
    const sh = Math.max(1, Math.min(H - sy, Math.ceil(rect[3] * k)));
    const bitmap = await createImageBitmap(canvas, sx, sy, sw, sh);
    iris = {
      bitmap,
      rect: [req.region[0] + sx / k, req.region[1] + sy / k, sw / k, sh / k],
    };
  }

  return {
    subject: req.subject,
    seed: req.seed,
    region: req.region,
    density: req.density,
    layers,
    iris,
    ms: Math.round(performance.now() - t0),
  };
}

/**
 * A canvas the painter can use, or null where there is no WebGL 2. The probe asks for the
 * same context attributes p5.brush will, so the context it makes is the one p5.brush gets.
 */
export function paintingCanvas(): OffscreenCanvas | HTMLCanvasElement | null {
  try {
    const c: OffscreenCanvas | HTMLCanvasElement =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(1, 1)
        : Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
    const gl = (c as OffscreenCanvas).getContext('webgl2', {
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });
    return gl ? c : null;
  } catch {
    return null;
  }
}
