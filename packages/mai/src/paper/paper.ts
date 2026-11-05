/**
 * The sheet, as fields the ink can read.
 *
 *   tooth(x, y)   surface height 0..1: dry media deposit on the peaks, starved ink skips them
 *   fibre(x, y)   the local fibre direction and how present a fibre is: wet ink wicks along it
 *   absorb(x, y)  how thirsty the sheet is here (sizing, formation): how far ink feathers
 *
 * Fields are deterministic in (x, y, seed), so the vector strokes and the raster proof
 * read the same sheet. Paper is shown as made. Age is not a default: the research names
 * faux age (foxing, stains, halos, burnt edges) as the first tell of a fake
 * (ideas/kiruk-codex/research/01-leonardo.md §1, §5). `time` exists only for a plate that
 * states why it is shown as found.
 */
import { fromHex, type RGB } from '../core/color.ts';
import { clamp, fbm2, noise2, smoothstep } from '../core/noise.ts';
import { hash3 } from '../core/rng.ts';

export type PaperId =
  | 'dawn-light'
  | 'dawn-departs'
  | 'night'
  | 'rag'
  | 'blue'
  | 'prepared'
  | 'cartridge';

export interface PaperSpec {
  id: PaperId;
  name: string;
  kind: 'laid' | 'wove' | 'prepared';
  tone: RGB;
  /** 0 unsized (blotting) … 1 hard-sized: how much wet ink is allowed to wander. */
  sizing: number;
  /** 0 smooth … 1 rough: how much the surface breaks a dry or starved line. */
  tooth: number;
  /** Laid and chain wire spacing, mm (laid papers only). */
  laid?: { pitch: number; chain: number };
  source: string;
}

export const PAPERS: Record<PaperId, PaperSpec> = {
  'dawn-light': {
    id: 'dawn-light',
    name: 'Dawn Light (the old paper)',
    kind: 'laid',
    tone: fromHex('#fadfa9'),
    sizing: 0.6,
    tooth: 0.45,
    laid: { pitch: 1, chain: 28 },
    source:
      'TOKEN color.dawn.light #FADFA9; laid ≈ 1 mm, chain ≈ 28 mm as in @kiruk/burin paper.ts',
  },
  'dawn-departs': {
    id: 'dawn-departs',
    name: 'Dawn Departs (the new paper)',
    kind: 'wove',
    tone: fromHex('#ccffff'),
    sizing: 0.88,
    tooth: 0.22,
    source: 'TOKEN color.dawn.departs #CCFFFF; wove, crisp, no age',
  },
  night: {
    id: 'night',
    name: 'Night (the earth band of the dawn)',
    kind: 'wove',
    tone: fromHex('#1d1c2d'),
    sizing: 0.8,
    tooth: 0.4,
    source:
      'TOKEN color.dawn.navy #1D1C2D as a sheet: the dark before the dawn (ideas/studio-dawn/dawn.md "nightminds"; eye.md open question 8 — founder decision pending)',
  },
  rag: {
    id: 'rag',
    name: 'Rag paper',
    kind: 'laid',
    tone: [0.958, 0.934, 0.874],
    sizing: 0.55,
    tooth: 0.5,
    laid: { pitch: 1, chain: 27 },
    source: 'WORKING VALUE — hemp/linen rag, usually white (research 01 §1)',
  },
  blue: {
    id: 'blue',
    name: 'Blue paper (carta azzurra)',
    kind: 'laid',
    tone: [0.69, 0.74, 0.77],
    sizing: 0.5,
    tooth: 0.55,
    laid: { pitch: 1.1, chain: 30 },
    source: 'WORKING VALUE — "sometimes blue" (research 01 §1); takes chalk and white heightening',
  },
  prepared: {
    id: 'prepared',
    name: 'Prepared ground',
    kind: 'prepared',
    tone: [0.905, 0.87, 0.775],
    sizing: 0.95,
    tooth: 0.14,
    source: 'WORKING VALUE — bone ground, lightly tinted, for metalpoint (research 01 §1)',
  },
  cartridge: {
    id: 'cartridge',
    name: 'Drawing (cartridge) paper',
    kind: 'wove',
    tone: [0.962, 0.952, 0.918],
    sizing: 0.75,
    tooth: 0.6,
    source: 'WORKING VALUE — wove drawing paper with a pencil tooth',
  },
};

export interface Paper {
  spec: PaperSpec;
  seed: number;
  /** As-found time on the sheet, 0 as made. Plates must justify > 0. */
  time: number;
  tooth(x: number, y: number): number;
  fibre(x: number, y: number): readonly [angle: number, strength: number];
  absorb(x: number, y: number): number;
}

export function createPaper(id: PaperId | PaperSpec, seed = 1, time = 0): Paper {
  const spec = typeof id === 'string' ? PAPERS[id] : id;
  const s = seed * 7 + 3;
  const tooth = (x: number, y: number) => {
    const fine = noise2(x * 7.3, y * 7.3, s + 1);
    const mid = noise2(x * 2.15, y * 2.15, s + 2);
    const flocs = fbm2(x * 0.32, y * 0.32, s + 3, 3);
    let h = 0.5 * fine + 0.33 * mid + 0.2 * flocs;
    if (spec.laid) h = h * 0.94 + 0.07 * Math.cos((2 * Math.PI * y) / spec.laid.pitch);
    return clamp(0.5 + h * (0.42 + 0.75 * spec.tooth));
  };
  const fibre = (x: number, y: number) => {
    const angle = Math.PI * (1 + noise2(x * 0.16, y * 0.16, s + 4));
    const strength = smoothstep(0.15, 0.8, 0.5 + 0.5 * noise2(x * 1.4, y * 1.4, s + 5));
    return [angle, strength] as const;
  };
  const absorb = (x: number, y: number) => {
    const flocs = 0.5 + 0.5 * fbm2(x * 0.32, y * 0.32, s + 3, 3);
    return clamp((1 - spec.sizing) * (0.7 + 0.6 * (1 - flocs)) + 0.04, 0.02, 1);
  };
  return { spec, seed, time, tooth, fibre, absorb };
}

export interface PaperRaster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Bake the sheet to pixels under a raking light (the light the plate declares).
 * `light` points toward the light on screen (x right, y down), e.g. [−1, −1] = upper left.
 */
export function rasterPaper(
  paper: Paper,
  widthMm: number,
  heightMm: number,
  pxPerMm: number,
  light: readonly [number, number] = [-1, -1],
): PaperRaster {
  const W = Math.max(1, Math.round(widthMm * pxPerMm));
  const H = Math.max(1, Math.round(heightMm * pxPerMm));
  const h = new Float32Array(W * H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++)
      h[j * W + i] = paper.tooth((i + 0.5) / pxPerMm, (j + 0.5) / pxPerMm);
  const ll = Math.hypot(light[0], light[1]) || 1;
  const lx = light[0] / ll;
  const ly = light[1] / ll;
  const data = new Uint8ClampedArray(W * H * 4);
  const [r0, g0, b0] = paper.spec.tone;
  const s = paper.seed * 7 + 3;
  const relief = 0.035 + 0.05 * paper.spec.tooth;
  const dark = r0 + g0 + b0 < 1.2;
  const time = paper.time;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      const x = (i + 0.5) / pxPerMm;
      const y = (j + 0.5) / pxPerMm;
      const hx =
        (h[j * W + Math.min(W - 1, i + 1)] as number) - (h[j * W + Math.max(0, i - 1)] as number);
      const hy =
        (h[Math.min(H - 1, j + 1) * W + i] as number) - (h[Math.max(0, j - 1) * W + i] as number);
      // A face tilted toward the light is brighter: the surface rises toward the light.
      const lit = -(hx * lx + hy * ly) * 2.2;
      const flocs = fbm2(x * 0.32, y * 0.32, s + 3, 3);
      let shade = 1 + lit * relief + flocs * 0.012;
      if (paper.spec.laid) {
        const dc = Math.abs(((x / paper.spec.laid.chain + 0.37) % 1) - 0.5) * paper.spec.laid.chain;
        shade -= (1 - smoothstep(0.25, 0.9, dc)) * 0.008;
      }
      let r = r0 * shade;
      let g = g0 * shade;
      let b = b0 * shade;
      if (dark) {
        // a dark sheet shows its grain as light flecks, not as relief
        const fleck = (hash3(i, j, s + 31) - 0.5) * 0.045 + flocs * 0.012;
        r += fleck;
        g += fleck;
        b += fleck * 1.1;
      }
      if (time > 0) {
        // As found (only when a plate says why): a broad warm drift and rare foxing.
        const broad = 0.5 + 0.5 * fbm2(x * 0.012, y * 0.012, s + 9, 3);
        const warm = time * (0.35 + 0.65 * broad) * 0.09;
        r *= 1 - warm * 0.25;
        g *= 1 - warm * 0.7;
        b *= 1 - warm * 1.3;
        const fox =
          smoothstep(0.7, 0.76, 0.5 + 0.5 * noise2(x * 0.09, y * 0.09, s + 11)) * time * 0.18;
        r *= 1 - fox * 0.18;
        g *= 1 - fox * 0.42;
        b *= 1 - fox * 0.62;
      }
      data[k * 4] = Math.round(clamp(r) * 255);
      data[k * 4 + 1] = Math.round(clamp(g) * 255);
      data[k * 4 + 2] = Math.round(clamp(b) * 255);
      data[k * 4 + 3] = 255;
    }
  }
  return { width: W, height: H, data };
}
