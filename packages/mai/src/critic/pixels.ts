/**
 * Facts read off rendered pixels: where the ink's weight sits, how much paper is left,
 * and how each label reads against the paper round it (contrast on real pixels, not on
 * colour estimates — codex KC-8: an estimate once signed off 5:1 that measured 4.04:1).
 */
import type { Plate } from '../plate/plate.ts';
import type { PixelFacts } from './critic.ts';

export interface Raster {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

const lum = (r: number, g: number, b: number) => {
  const ch = (x: number) => {
    const v = x / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};

/**
 * `o.contrast`: a raster of the whole sheet (paper included) to read label contrast from,
 * rendered where the lettering strokes resolve (the proof uses 12 px/mm); default `proof`.
 */
export function pixelFacts(
  plate: Plate,
  proof: Raster,
  inkOnly: Raster,
  o: { contrast?: Raster } = {},
): PixelFacts {
  const [W, H] = plate.size;
  // ink is whatever departs from the sheet: dark on a light sheet, light on the night sheet
  const tone = plate.paper.spec.tone;
  const lp = lum(tone[0] * 255, tone[1] * 255, tone[2] * 255);
  const span = Math.max(lp, 1 - lp);
  const away = (r: number, g: number, b: number) => Math.abs(lum(r, g, b) - lp) / span;
  const k = inkOnly.width / W;
  // darkness-weighted centroid of the ink alone (paper excluded)
  let sx = 0;
  let sy = 0;
  let sw = 0;
  const d = inkOnly.data;
  for (let y = 0; y < inkOnly.height; y += 2)
    for (let x = 0; x < inkOnly.width; x += 2) {
      const i = (y * inkOnly.width + x) * 4;
      const dark = away(d[i] as number, d[i + 1] as number, d[i + 2] as number);
      if (dark < 0.03) continue;
      sx += x * dark;
      sy += y * dark;
      sw += dark;
    }
  const centroid: [number, number] = sw
    ? [sx / sw / inkOnly.width, sy / sw / inkOnly.height]
    : [0.5, 0.5];
  // white: 5 mm cells inside the margins with (almost) no ink
  const [mt, mr, mb, ml] = plate.margins;
  const cell = 5;
  let cells = 0;
  let empty = 0;
  for (let y = mt; y + cell <= H - mb; y += cell)
    for (let x = ml; x + cell <= W - mr; x += cell) {
      cells++;
      let dark = 0;
      let n = 0;
      for (let py = Math.round(y * k); py < Math.round((y + cell) * k); py += 2)
        for (let px = Math.round(x * k); px < Math.round((x + cell) * k); px += 2) {
          const i = (py * inkOnly.width + px) * 4;
          dark += away(d[i] as number, d[i + 1] as number, d[i + 2] as number);
          n++;
        }
      if (n && dark / n < 0.015) empty++;
    }
  // contrast of each label on the proof (paper included)
  const textContrast: Record<string, number> = {};
  const cr = o.contrast ?? proof;
  const kp = cr.width / W;
  const pd = cr.data;
  for (const t of plate.texts) {
    if (t.mirror) continue;
    const [x0, y0, x1, y1] = t.box;
    const inside: number[] = [];
    for (let y = Math.floor(y0 * kp); y <= Math.ceil(y1 * kp); y++)
      for (let x = Math.floor(x0 * kp); x <= Math.ceil(x1 * kp); x++) {
        if (x < 0 || y < 0 || x >= cr.width || y >= cr.height) continue;
        const i = (y * cr.width + x) * 4;
        inside.push(lum(pd[i] as number, pd[i + 1] as number, pd[i + 2] as number));
      }
    const ring: number[] = [];
    const pad = 1.2;
    for (let y = Math.floor((y0 - pad) * kp); y <= Math.ceil((y1 + pad) * kp); y++)
      for (let x = Math.floor((x0 - pad) * kp); x <= Math.ceil((x1 + pad) * kp); x++) {
        if (x < 0 || y < 0 || x >= cr.width || y >= cr.height) continue;
        const inBox = x >= x0 * kp && x <= x1 * kp && y >= y0 * kp && y <= y1 * kp;
        if (inBox) continue;
        const i = (y * cr.width + x) * 4;
        ring.push(lum(pd[i] as number, pd[i + 1] as number, pd[i + 2] as number));
      }
    if (inside.length < 4 || ring.length < 4) continue;
    ring.sort((a, b) => a - b);
    const paper = ring[Math.floor(ring.length * 0.5)] as number;
    // the ink is the pixel that departs most from the paper (dark ink, or light on the night sheet)
    inside.sort((a, b) => Math.abs(b - paper) - Math.abs(a - paper));
    const ink = inside[Math.floor(inside.length * 0.06)] as number;
    textContrast[t.id] = (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05);
  }
  return { centroid, textContrast, white: cells ? empty / cells : 0 };
}
