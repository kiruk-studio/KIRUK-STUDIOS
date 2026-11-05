/**
 * Bake a plate to files: the paper raster, the ink SVG (referencing the paper), and a
 * PNG proof of the whole sheet. Node only.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { light2d } from '../light/light.ts';
import { rasterPaper } from '../paper/paper.ts';
import type { Plate } from '../plate/plate.ts';
import { encodePNG } from './png.ts';
import { rasterSVG } from './raster.ts';

export interface BakeResult {
  dir: string;
  svg: string;
  paperPng: Uint8Array;
  proofPng: Uint8Array;
  inkPng: Uint8Array;
  pxPerMm: number;
  width: number;
  height: number;
}

export async function bakePlate(
  plate: Plate,
  dir: string,
  o: {
    pxPerMm?: number;
    paperPxPerMm?: number;
    write?: boolean /** write paper.png and reference it (false: flat paper tone in the SVG, for committed proofs) */;
    paperFile?: boolean;
  } = {},
): Promise<BakeResult> {
  const px = o.pxPerMm ?? 5;
  const ppx = o.paperPxPerMm ?? Math.min(px, 6);
  const [W, H] = plate.size;
  const paper = rasterPaper(plate.paper, W, H, ppx, light2d(plate.light));
  const paperPng = encodePNG(paper.width, paper.height, paper.data);
  const width = Math.round(W * px);
  const height = Math.round(H * px);
  const dataUri = `data:image/png;base64,${Buffer.from(paperPng).toString('base64')}`;
  const proofSvg = plate.toSVG({ paperHref: dataUri, pxPerMm: px });
  const proofPng = await rasterSVG(proofSvg, width, height);
  const inkPng = await rasterSVG(plate.toSVG({ inkOnly: true, pxPerMm: px }), width, height);
  const paperFile = o.paperFile !== false;
  const svg = plate.toSVG(paperFile ? { paperHref: 'paper.png', pxPerMm: px } : { pxPerMm: px });
  if (o.write !== false) {
    mkdirSync(dir, { recursive: true });
    if (paperFile) writeFileSync(join(dir, 'paper.png'), paperPng);
    writeFileSync(join(dir, 'plate.svg'), svg);
    writeFileSync(join(dir, 'plate.png'), proofPng);
  }
  return { dir, svg, paperPng, proofPng, inkPng, pxPerMm: px, width, height };
}

/** Render a crop of the plate (mm rectangle) at a high scale, for the 4× review crops. */
export async function cropPlate(
  plate: Plate,
  paperPng: Uint8Array,
  rect: readonly [number, number, number, number],
  pxPerMm: number,
): Promise<Uint8Array> {
  const [x, y, w, h] = rect;
  const dataUri = `data:image/png;base64,${Buffer.from(paperPng).toString('base64')}`;
  const full = plate.toSVG({ paperHref: dataUri, pxPerMm });
  const width = Math.max(1, Math.round(w * pxPerMm));
  const height = Math.max(1, Math.round(h * pxPerMm));
  const svg = full.replace(
    /^<svg([^>]*?) viewBox="[^"]*" width="\d+" height="\d+"/,
    `<svg$1 viewBox="${x} ${y} ${w} ${h}" width="${width}" height="${height}"`,
  );
  return rasterSVG(svg, width, height);
}
