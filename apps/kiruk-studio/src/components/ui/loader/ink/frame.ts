/**
 * Where the loader draws its eye: centred in the room above the corner words,
 * as large as the screen allows (one eye unit is half the fissure, so the eye
 * and its brow need about 3.3 units across and 2.75 down), never larger than a
 * plate needs. The canvases cover only the drawing's own box, and their pixel
 * density is held so no layer passes ~3.4 megapixels.
 *
 * Shared by the page (hit tests, the hand-off) and the scene (drawing).
 */

/** The drawing's box in eye units: the brow's hairs to the cheek's last line. */
export const INK_BOX = { x0: -1.78, x1: 1.78, y0: -1.62, y1: 1.22 } as const;

export interface InkFrame {
  /** The window, CSS px. */
  w: number;
  h: number;
  dpr: number;
  /** The eye's centre and its scale (CSS px per eye unit). */
  cx: number;
  cy: number;
  S: number;
  /** The canvases' box, CSS px. */
  x: number;
  y: number;
  cw: number;
  ch: number;
}

export function inkFrame(w: number, h: number, devicePixelRatio = 1): InkFrame {
  const margin = w < 600 ? 0.04 : 0.1;
  const top = 0.1;
  const bottom = 0.16;
  const room = h * (1 - top - bottom);
  const S = Math.max(40, Math.min((w * (1 - 2 * margin)) / 3.3, room / 2.75, 340));
  const cx = w / 2;
  // The box's middle sits 0.2 units above the eye's centre: centre the box, not the eye.
  const cy = h * top + room / 2 + ((INK_BOX.y0 + INK_BOX.y1) / -2) * S;
  const x = cx + INK_BOX.x0 * S;
  const y = cy + INK_BOX.y0 * S;
  const cw = (INK_BOX.x1 - INK_BOX.x0) * S;
  const ch = (INK_BOX.y1 - INK_BOX.y0) * S;
  const dpr = Math.max(1, Math.min(devicePixelRatio || 1, 2, Math.sqrt(3.4e6 / (cw * ch))));
  return { w, h, dpr, cx, cy, S, x, y, cw, ch };
}
