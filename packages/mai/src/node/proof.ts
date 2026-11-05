/**
 * Proof a plate: bake it, read its pixels, run the critic, and write what a reviewer
 * needs — the sheet, a phone-width view, 4× crops of the places a fake shows first, and
 * the report in numbers. Node only.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { critique, type Report, reportMarkdown } from '../critic/critic.ts';
import { pixelFacts } from '../critic/pixels.ts';
import type { Mark, Plate } from '../plate/plate.ts';
import { bakePlate, cropPlate } from './bake.ts';
import { decodePNG, rasterSVG } from './raster.ts';

export interface ProofResult {
  report: Report;
  dir: string;
  files: string[];
}

function boxAround(m: Mark, pad: number): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of m.spine) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
}

/** Pick the crops a reviewer must see at 4×: where a fake shows first. */
function cropsFor(plate: Plate): { name: string; rect: [number, number, number, number] }[] {
  const out: { name: string; rect: [number, number, number, number] }[] = [];
  const [W, H] = plate.size;
  const clampRect = (r: [number, number, number, number]): [number, number, number, number] => {
    // a crop is a close look, never a second copy of the sheet: at most 40 × 28 mm
    const w = Math.min(r[2], W, 40);
    const h = Math.min(r[3], H, 28);
    return [Math.max(0, Math.min(W - w, r[0])), Math.max(0, Math.min(H - h, r[1])), w, h];
  };
  const square = (cx: number, cy: number, s: number) =>
    clampRect([cx - s / 2, cy - s / 2, s, s * 0.66]);
  // the densest hatching (where a plotter shows as a screen)
  const hatches = plate.marks.filter((m) => m.role === 'hatch' && m.spine.length);
  if (hatches.length) {
    let best = hatches[0] as Mark;
    let bestN = -1;
    for (const m of hatches.filter((_, i) => i % 7 === 0)) {
      const c = m.spine[0] as [number, number];
      const n = hatches.filter((q) => {
        const d = q.spine[0] as [number, number];
        return Math.abs(d[0] - c[0]) < 6 && Math.abs(d[1] - c[1]) < 6;
      }).length;
      if (n > bestN) {
        bestN = n;
        best = m;
      }
    }
    const c = best.spine[0] as [number, number];
    out.push({ name: 'hatch', rect: square(c[0], c[1], 24) });
  }
  // a pooled start (where a costume shows as a blot)
  const pooled = plate.marks.find((m) => m.stats.pools > 0 && m.role === 'contour');
  if (pooled) {
    const c = pooled.spine[0] as [number, number];
    out.push({ name: 'pool', rect: square(c[0], c[1], 14) });
  }
  // the first dimension (where measurement shows its craft)
  const dim = plate.dimensions[0];
  if (dim) {
    const r = boxAround({ spine: [dim.line[0], dim.line[1], dim.a, dim.b] } as unknown as Mark, 4);
    out.push({ name: 'dimension', rect: clampRect(r) });
  }
  // a drawn label
  const label = plate.texts.find((t) => t.drawn && (t.kind === 'key' || t.kind === 'numeral'));
  if (label) {
    const [x0, y0, x1, y1] = label.box;
    out.push({
      name: 'letter',
      rect: square((x0 + x1) / 2, (y0 + y1) / 2, Math.max(10, (x1 - x0) * 2.2)),
    });
  }
  return out;
}

export async function proofPlate(
  plate: Plate,
  dir: string,
  o: {
    pxPerMm?: number;
    cropPxPerMm?: number;
    phoneWidthPx?: number;
    paperFile?: boolean;
    /** Resolution the label contrast is read at (default 12 px/mm: a 0.25 mm stroke is 3 px). */
    contrastPxPerMm?: number;
  } = {},
): Promise<ProofResult> {
  mkdirSync(join(dir, 'crops'), { recursive: true });
  const px = o.pxPerMm ?? 5;
  const baked = await bakePlate(plate, dir, { pxPerMm: px, paperFile: o.paperFile });
  const files =
    o.paperFile === false ? ['plate.svg', 'plate.png'] : ['plate.svg', 'paper.png', 'plate.png'];
  const proof = await decodePNG(baked.proofPng);
  const inkOnly = await decodePNG(baked.inkPng);
  // label contrast is read where the strokes resolve: at 4 px/mm a 0.25 mm stroke is one
  // antialiased pixel and the reading hangs on a few junctions; at 12 px/mm it is the ink as
  // laid (density, starve, the paper's tooth). Small screens are type.phone's question.
  const cpx = Math.max(px, o.contrastPxPerMm ?? 12);
  let contrast = proof;
  if (cpx > px) {
    const uri = `data:image/png;base64,${Buffer.from(baked.paperPng).toString('base64')}`;
    const hi = await rasterSVG(
      plate.toSVG({ paperHref: uri, pxPerMm: cpx }),
      Math.round(plate.size[0] * cpx),
      Math.round(plate.size[1] * cpx),
    );
    contrast = await decodePNG(hi);
  }
  const pixels = pixelFacts(plate, proof, inkOnly, { contrast });
  const report = critique(plate, { pixels, phoneWidthPx: o.phoneWidthPx ?? 390 });
  // phone-width view: the whole sheet as a phone shows it
  const phoneW = o.phoneWidthPx ?? 390;
  const phonePx = phoneW / plate.size[0];
  const dataUri = `data:image/png;base64,${Buffer.from(baked.paperPng).toString('base64')}`;
  const phoneSvg = plate.toSVG({ paperHref: dataUri, pxPerMm: phonePx });
  const phone = await rasterSVG(
    phoneSvg,
    Math.round(plate.size[0] * phonePx),
    Math.round(plate.size[1] * phonePx),
    2,
  );
  writeFileSync(join(dir, 'phone.png'), phone);
  files.push('phone.png');
  for (const c of cropsFor(plate)) {
    const png = await cropPlate(plate, baked.paperPng, c.rect, o.cropPxPerMm ?? 20);
    writeFileSync(join(dir, 'crops', `${c.name}.png`), png);
    files.push(`crops/${c.name}.png`);
  }
  writeFileSync(join(dir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(dir, 'report.md'), reportMarkdown(report));
  files.push('report.json', 'report.md');
  return { report, dir, files };
}
