/**
 * The paper, baked once on the CPU into a 512 px tile (seamless):
 *   R tooth  — fine surface relief the raking light catches
 *   G flocs  — formation clouds, how unevenly the pulp settled (shows against the light)
 *   B fibre  — rag fibres lying in the sheet
 * Real paper as made: no foxing, no stains, no burnt edges (codex pen.md "Never").
 *
 * spec-link: ideas/studio-dawn/folio.md — the one idea
 */
import { LOGOGRAM_FILLS, LOGOGRAM_NEEDLES, LOGOGRAM_VIEW } from '../ink/logogram';
import { mulberry32 } from '../ink/pen';

export const TILE = 512;

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise on a lattice of `period` cells that wraps at the tile edge. */
function vnoise(u: number, v: number, period: number, seed: number) {
  const x = u * period;
  const y = v * period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const w = (i: number) => ((i % period) + period) % period;
  const a = hash(w(xi), w(yi), seed);
  const b = hash(w(xi + 1), w(yi), seed);
  const c = hash(w(xi), w(yi + 1), seed);
  const d = hash(w(xi + 1), w(yi + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(u: number, v: number, base: number, oct: number, seed: number) {
  let s = 0;
  let amp = 0.5;
  let p = base;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    s += amp * vnoise(u, v, p, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return s / norm;
}

export function bakePaper(): ImageData {
  const N = TILE;
  const img = new ImageData(N, N);
  const d = img.data;
  // Fibres first, drawn wrapped into a canvas so they cross the tile seam cleanly.
  const fc = new OffscreenCanvas(N, N);
  const fx = fc.getContext('2d')!;
  const rand = mulberry32(2026);
  fx.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    const x = rand() * N;
    const y = rand() * N;
    const a = rand() * Math.PI;
    const len = 14 + rand() * 46;
    const bend = (rand() - 0.5) * 14;
    const tone = rand();
    fx.strokeStyle = `rgba(${tone > 0.62 ? 255 : 0},0,0,${0.18 + rand() * 0.3})`;
    fx.lineWidth = 0.6 + rand() * 0.8;
    for (const ox of [-N, 0, N]) {
      for (const oy of [-N, 0, N]) {
        const x0 = x + ox - (Math.cos(a) * len) / 2;
        const y0 = y + oy - (Math.sin(a) * len) / 2;
        const x1 = x + ox + (Math.cos(a) * len) / 2;
        const y1 = y + oy + (Math.sin(a) * len) / 2;
        if (
          Math.max(x0, x1) < -4 ||
          Math.min(x0, x1) > N + 4 ||
          Math.max(y0, y1) < -4 ||
          Math.min(y0, y1) > N + 4
        )
          continue;
        fx.beginPath();
        fx.moveTo(x0, y0);
        fx.quadraticCurveTo(x + ox - Math.sin(a) * bend, y + oy + Math.cos(a) * bend, x1, y1);
        fx.stroke();
      }
    }
  }
  const fib = fx.getImageData(0, 0, N, N).data;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const v = y / N;
      const tooth = fbm(u, v, 128, 3, 11);
      const flocs = fbm(u, v, 6, 4, 23);
      const i = (y * N + x) * 4;
      // Fibre channel: 0.5 neutral, light fibres up, dark fibres down.
      const fa = fib[i + 3]! / 255;
      const fibre = 0.5 + (fib[i]! > 127 ? 0.5 : -0.5) * fa;
      d[i] = Math.round(tooth * 255);
      d[i + 1] = Math.round(flocs * 255);
      d[i + 2] = Math.round(fibre * 255);
      d[i + 3] = 255;
    }
  }
  return img;
}

/** The watermark: the kiruk logogram, paths unchanged, softened the way pulp softens a wire figure. */
export function bakeWatermark(size = 256): OffscreenCanvas {
  const c = new OffscreenCanvas(size, size);
  const g = c.getContext('2d')!;
  const v = LOGOGRAM_VIEW;
  g.filter = 'blur(1.6px)';
  g.setTransform(
    size / v.size,
    0,
    0,
    size / v.size,
    (-v.x * size) / v.size,
    (-v.y * size) / v.size,
  );
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineWidth = v.stroke * 1.4;
  for (const p of LOGOGRAM_NEEDLES) g.stroke(new Path2D(p));
  for (const p of LOGOGRAM_FILLS) g.fill(new Path2D(p));
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.arc(v.cx, v.cy, v.hole, 0, Math.PI * 2);
  g.fill();
  return c;
}
