/**
 * 2026's instruments (docs/ERA_2026_MEASURED_PLAN.md): hairlines and numeric
 * readouts drawn in the medium pass, in device pixels.
 *
 * Every primitive returns a coverage, 0..1, anti-aliased over one pixel, so
 * the caller can lay many of them over the plate with max() and one mix().
 * Numbers come from a glyph atlas: a canvas drawn once in Geist Mono (the
 * 2026 home's label face) with the ten digits and a few signs, mipmapped and
 * sampled at an explicit level (a label is drawn inside an If on its box, so
 * a pixel outside every label pays nothing). The loader has no words, so the
 * atlas holds none.
 */

import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter } from 'three/webgpu';
import { MONO_FAMILY_2026 } from '@/components/era-shell/archetypes/prompt-ui/fonts';
import { type N, T } from '../nodes/tsl';

const {
  If,
  abs,
  atan,
  clamp,
  dot,
  float,
  floor,
  fract,
  length,
  log2,
  max,
  min,
  mod,
  select,
  vec2,
} = T;

/** The atlas's glyphs, in order: a glyph's code is its index. */
const GLYPHS = '0123456789+-.°: ';
export const G = { plus: 10, minus: 11, dot: 12, deg: 13, colon: 14, blank: 15 } as const;
const CELL_W = 96;
const CELL_H = 128;
/** The share of a cell's width one character advances (the glyph's own width plus a little air). */
const ADV = 56 / CELL_H;
const ATLAS_W = CELL_W * GLYPHS.length;

let atlas: CanvasTexture | null = null;

/**
 * The glyph atlas, white on black (sampled from its red channel), drawn the
 * first time it is asked for and again when Geist Mono has loaded.
 */
export function glyphAtlas(): CanvasTexture {
  if (atlas) return atlas;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = CELL_H;
  const tex = new CanvasTexture(canvas);
  tex.flipY = false;
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  const fallback =
    "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', Consolas, 'Roboto Mono', monospace";
  const draw = (family: string) => {
    const g = canvas.getContext('2d');
    if (!g) return;
    g.fillStyle = '#000';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.font = `400 80px ${family}`;
    // the digits' height (about 0.71 em) centred in the cell
    for (let i = 0; i < GLYPHS.length; i++) g.fillText(GLYPHS[i], i * CELL_W + CELL_W / 2, 92);
    tex.needsUpdate = true;
  };
  draw(fallback);
  document.fonts
    ?.load(`80px ${MONO_FAMILY_2026}`)
    .then(() => draw(`${MONO_FAMILY_2026}, ${fallback}`))
    .catch(() => {});
  atlas = tex;
  return tex;
}

/** The coverage of a line `w` px wide at a distance `d` px from its centre line. */
export const stroke = (d: N, w: N | number) => clamp(float(w).mul(0.5).add(0.5).sub(abs(d)), 0, 1);
/** A ring of radius r round c. */
export const ringAt = (p: N, c: N, r: N, w: N) => stroke(length(p.sub(c)).sub(r), w);
/** A filled disc of radius r round c. */
export const discAt = (p: N, c: N, r: N) => clamp(r.add(0.5).sub(length(p.sub(c))), 0, 1);
/** The distance from p to the segment a–b, and where along it p falls (0..1). */
export function segment(p: N, a: N, b: N): { d: N; t: N } {
  const pa = p.sub(a);
  const ba = b.sub(a);
  const t = clamp(dot(pa, ba).div(max(dot(ba, ba), 1e-4)), 0, 1);
  return { d: length(pa.sub(ba.mul(t))), t };
}
/** Dashes along a path, at `s` px along it: on for `duty` of each `period`, with soft ends. */
export function dashes(s: N, period: N, duty = 0.5): N {
  const f = fract(s.div(period));
  return clamp(min(f, float(duty).sub(f)).mul(period).add(0.5), 0, 1);
}
/**
 * Four corner brackets round c: a square of half-side `a`, arms `l` long,
 * strokes `w` wide.
 */
export function brackets(p: N, c: N, a: N, l: N, w: N): N {
  const q = abs(p.sub(c));
  const span = (x: N) =>
    clamp(x.sub(a.sub(l)).add(0.5), 0, 1).mul(clamp(a.add(w.mul(0.5)).sub(x).add(0.5), 0, 1));
  return max(stroke(q.y.sub(a), w).mul(span(q.x)), stroke(q.x.sub(a), w).mul(span(q.y)));
}

/** The n digits of v (v ≥ 0), most significant first, zero-padded. */
export function digits(v: N, n: number): N[] {
  const out: N[] = [];
  for (let k = n - 1; k >= 0; k--) out.push(mod(floor(v.div(10 ** k)), 10));
  return out;
}
/** v (signed) with one decimal and a degree sign, e.g. "+12.4°", always 6 characters. */
export function degrees(v: N): N[] {
  const a = floor(abs(v).mul(10).add(0.5));
  const [d2, d1, d0] = digits(min(a, 999), 3);
  return [
    select(v.lessThan(0), G.minus, G.plus),
    select(a.lessThan(100), G.blank, d2),
    d1,
    G.dot,
    d0,
    G.deg,
  ];
}

/**
 * A row of glyphs (codes, numbers or nodes) with its top-left at `o` and
 * cells `h` px high (the digits are about 0.45 h tall): its coverage at p.
 */
export function readout(p: N, o: N, h: N, chars: (N | number)[], glyphs: N): N {
  return glyphRow(p.sub(o), h, chars, glyphs);
}

/**
 * Numerals set round a circle like a dial's: one every `stepDeg` degrees from
 * twelve o'clock, the angle itself in n digits, read clockwise with the
 * glyphs' tops outward, in a band from radius r to r + h round c.
 */
export function dialText(p: N, c: N, r: N, h: N, stepDeg: number, n: number, glyphs: N): N {
  const d = p.sub(c);
  const ang = fract(atan(d.x, d.y.negate()).div(Math.PI * 2)).mul(360);
  const k = floor(ang.div(stepDeg).add(0.5));
  const s = ang
    .sub(k.mul(stepDeg))
    .mul(Math.PI / 180)
    .mul(r);
  const q = vec2(s.add(readoutW(h, n).mul(0.5)), r.add(h).sub(length(d)));
  return glyphRow(q, h, digits(mod(k.mul(stepDeg), 360), n), glyphs);
}

/** A row of glyphs in its own frame: q from its top-left, x along it, y down it. */
export function glyphRow(q: N, h: N, chars: (N | number)[], glyphs: N): N {
  const n = chars.length;
  const adv = h.mul(ADV);
  const cov = float(0).toVar();
  If(
    q.x
      .greaterThanEqual(0)
      .and(q.x.lessThan(adv.mul(n)))
      .and(q.y.greaterThanEqual(0))
      .and(q.y.lessThan(h)),
    () => {
      const i = floor(q.x.div(adv));
      let code: N = float(chars[0]);
      for (let k = 1; k < n; k++) code = select(i.equal(float(k)), float(chars[k]), code);
      const f = fract(q.x.div(adv));
      // the cell's middle, as wide as one advance, so mips never reach the neighbours
      const pad = (CELL_W - ADV * CELL_H) / 2;
      const u = code
        .mul(CELL_W)
        .add(pad)
        .add(f.mul(ADV * CELL_H))
        .div(ATLAS_W);
      const lod = log2(max(float(CELL_H).div(h), 1));
      cov.assign(glyphs.sample(vec2(u, q.y.div(h))).level(lod).r);
    },
  );
  return cov;
}

/** How wide a readout of n characters is, px. */
export const readoutW = (h: N, n: number) => h.mul(ADV * n);

/** 1 inside [lo, hi], with soft edges a pixel wide (for gating a sweep or a span). */
export const within = (x: N, lo: N, hi: N) =>
  clamp(x.sub(lo).add(0.5), 0, 1).mul(clamp(hi.sub(x).add(0.5), 0, 1));

/** A step from 0 to 1 as t passes a, over d. */
export const after = (t: N, a: N | number, d: number) => clamp(t.sub(a).div(d), 0, 1);
