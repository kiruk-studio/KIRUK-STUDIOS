/**
 * Baked tiles the shaders sample instead of computing noise per pixel.
 *
 *   paper (512², seamless)  R tooth · G flocs (formation) · B fibre · A fine fibre
 *   noise (256², seamless)  R smooth · G mid · B white · A broad — jitter for lines, patina, plate tone
 *
 * Real paper as made: rag fibre, formation, tooth. Age is a separate, optional
 * layer in the paper shader, never baked in.
 */

export const PAPER_TILE = 512;
export const NOISE_TILE = 256;

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Periodic value noise: a lattice of `period` cells that wraps at the tile edge. */
function vnoise(u: number, v: number, period: number, seed: number) {
  const x = u * period;
  const y = v * period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);
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

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas2d(n: number) {
  const c: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(n, n)
      : Object.assign(document.createElement('canvas'), { width: n, height: n });
  return {
    c,
    g: c.getContext('2d', { willReadFrequently: true }) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D,
  };
}

/** Fibres drawn wrapped so they cross the tile seam cleanly. */
function fibres(
  n: number,
  count: number,
  len: [number, number],
  width: [number, number],
  seed: number,
) {
  const { g } = canvas2d(n);
  const rand = mulberry32(seed);
  g.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = rand() * n;
    const y = rand() * n;
    const a = rand() * Math.PI;
    const L = len[0] + rand() * (len[1] - len[0]);
    const bend = (rand() - 0.5) * L * 0.35;
    const light = rand() > 0.6;
    g.strokeStyle = `rgba(${light ? 255 : 0},0,0,${0.16 + rand() * 0.34})`;
    g.lineWidth = width[0] + rand() * (width[1] - width[0]);
    for (const ox of [-n, 0, n]) {
      for (const oy of [-n, 0, n]) {
        const cx = x + ox;
        const cy = y + oy;
        const dx = (Math.cos(a) * L) / 2;
        const dy = (Math.sin(a) * L) / 2;
        if (Math.max(cx - dx, cx + dx) < -4 || Math.min(cx - dx, cx + dx) > n + 4) continue;
        if (Math.max(cy - dy, cy + dy) < -4 || Math.min(cy - dy, cy + dy) > n + 4) continue;
        g.beginPath();
        g.moveTo(cx - dx, cy - dy);
        g.quadraticCurveTo(cx - Math.sin(a) * bend, cy + Math.cos(a) * bend, cx + dx, cy + dy);
        g.stroke();
      }
    }
  }
  return g.getImageData(0, 0, n, n).data;
}

export function bakePaper(): Uint8Array {
  const N = PAPER_TILE;
  const out = new Uint8Array(N * N * 4);
  const long = fibres(N, 460, [16, 64], [0.6, 1.4], 2026);
  const fine = fibres(N, 1400, [4, 14], [0.4, 0.8], 2027);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const v = y / N;
      const i = (y * N + x) * 4;
      const tooth = 0.62 * fbm(u, v, 128, 2, 11) + 0.38 * vnoise(u, v, 256, 13);
      const flocs = fbm(u, v, 6, 4, 23);
      const fa = long[i + 3]! / 255;
      const fb = fine[i + 3]! / 255;
      out[i] = Math.round(tooth * 255);
      out[i + 1] = Math.round(flocs * 255);
      out[i + 2] = Math.round((0.5 + (long[i]! > 127 ? 0.5 : -0.5) * fa) * 255);
      out[i + 3] = Math.round((0.5 + (fine[i]! > 127 ? 0.5 : -0.5) * fb) * 255);
    }
  }
  return out;
}

export function bakeNoise(): Uint8Array {
  const N = NOISE_TILE;
  const out = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const v = y / N;
      const i = (y * N + x) * 4;
      out[i] = Math.round(fbm(u, v, 8, 3, 101) * 255);
      out[i + 1] = Math.round(fbm(u, v, 32, 2, 202) * 255);
      out[i + 2] = Math.round(hash(x, y, 303) * 255);
      out[i + 3] = Math.round(fbm(u, v, 3, 3, 404) * 255);
    }
  }
  return out;
}
