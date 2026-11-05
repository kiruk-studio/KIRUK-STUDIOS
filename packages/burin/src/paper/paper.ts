/**
 * The paper, per pixel.
 *
 *   as made     rag fibre (two lengths), formation flocs, tooth
 *   cockle      a hand-made sheet is never flat: slow waves the raking light finds
 *   light       a raking light whose direction the page moves (pointer, a slow drift),
 *               and a soft lamp falloff — the sheet reads as an object on a desk
 *   as found    an optional age layer: warmer tone, a few foxing spots, one faint tide line
 *   the plate   an intaglio platemark — the paper pressed into the plate's bed — with a
 *               thin film of plate tone left by the wiping, the mark every engraving carries
 *   held up     transmitted light: laid wires every ≈1 mm, chain wires every ≈28 mm,
 *               the kiruk watermark, the sheet's cloudy formation
 *
 * Two papers, one dawn (the studio's colour meaning):
 *   old  Dawn Light  #fadfa9  "soft morning glow, when darkness starts to lift and yellow
 *        seeps in" — the sheet the hand drew on: warm, iron-gall ink, it carries its years
 *   new  Dawn Departs #ccffff "morning's first pale breath, the blue before sunrise" — the
 *        sheet the code draws on: cool, crisp, navy ink, no age
 * `dawn` moves between them (0 old … 1 new) as a front, not a fade: the new sheet comes in
 * from the left the way water wicks into paper, ragged along the fibres, with a faint tide
 * line where it is arriving. Every point is one paper or the other; there is no muddy
 * middle colour, and the ink changes with the paper under it. The old sheet carries its
 * years (age ≥ 0.42); the new one carries only what `age` adds.
 */
import {
  abs,
  clamp,
  dot,
  float,
  fract,
  length,
  max,
  min,
  mix,
  normalize,
  screenUV,
  smoothstep,
  step,
  texture,
  vec2,
  vec3,
} from 'three/tsl';
import type { Texture } from 'three/webgpu';

// TSL nodes: @types/three is stricter than the runtime; the graph is checked by the shader compiler.
type N = any;
type U = any;

export type PaperInputs = {
  res: U;
  /** 0 reflected … 1 held to the light */
  light: U;
  /** 0 as made … 1 as found */
  age: U;
  /** 0 old (Dawn Light) … 1 new (Dawn Departs) */
  dawn: U;
  /** platemark rect, CSS px: x, y, w, h (w = 0: none) */
  plate: U;
  /** watermark: x, y, size (CSS px), on */
  mark: U;
  /** direction toward the raking light (screen x, y down, z out of the sheet) */
  rake: U;
  /** lamp: x, y (CSS px), reach (CSS px) */
  lamp: U;
  paper: Texture;
  noise: Texture;
  watermark: Texture;
  /**
   * Extra height in the sheet, read at any point (CSS px): the hand's washes cockle the paper
   * as they dry, so the raking light finds their edges (hand/compose.ts, handRelief).
   */
  buckle?: (css: N) => N;
};

/** Dawn Light #fadfa9 — the old paper. Dawn Departs #ccffff — the new. (names.color.pizza)
 *  Mirrors color.dawn.light / color.dawn.departs: the GPU cannot read the token CSS. */
export const DAWN_LIGHT_RGB = [0.98, 0.875, 0.663] as const;
export const DAWN_DEPARTS_RGB = [0.8, 1.0, 1.0] as const;
export const PAPER_RGB = DAWN_LIGHT_RGB;
const FOX = vec3(0.72, 0.52, 0.34);
const WINDOW_OLD = vec3(1.0, 0.86, 0.62);
const WINDOW_NEW = vec3(0.86, 0.98, 1.0);

export function paperNode(o: PaperInputs) {
  const css = screenUV.mul(o.res);
  const L: N = normalize(o.rake);
  const tuv = css.div(512);
  const s = texture(o.paper, tuv);
  const sx = texture(o.paper, tuv.add(vec2(1 / 512, 0))).x;
  const sy = texture(o.paper, tuv.add(vec2(0, 1 / 512))).x;
  const flocs = s.y.sub(0.5);
  const fibre = s.z.sub(0.5).add(s.w.sub(0.5).mul(0.6));

  // Cockle: slow waves in the sheet, read by the raking light.
  // Broad waves only: a cockled sheet, not a crumpled one (BR-6).
  const H = (p: N) => {
    const sheet = texture(o.noise, p.div(1400)).w;
    return o.buckle ? sheet.add(o.buckle(p)) : sheet;
  };
  const e = 9;
  const hx = H(css.add(vec2(e, 0))).sub(H(css.sub(vec2(e, 0))));
  const hy = H(css.add(vec2(0, e))).sub(H(css.sub(vec2(0, e))));
  const nC = normalize(vec3(hx.mul(-4.5), hy.mul(-4.5), 1));
  // Tooth: the fine relief, same light.
  const nT = normalize(vec3(s.x.sub(sx).mul(3.2), s.x.sub(sy).mul(3.2), 1));
  const lit = dot(nC, L).mul(0.5).add(dot(nT, L).mul(0.5));
  const flat = L.z;
  const relief = lit.sub(flat).mul(0.5);

  // The lamp: a broad pool, brighter near it, never a vignette at the edges.
  const lampD = length(css.sub(o.lamp.xy)).div(max(o.lamp.z, 1));
  const pool = float(0.5)
    .sub(smoothstep(0, 1, lampD))
    .mul(0.05);

  // The mould's wires.
  const laid = float(3.78);
  const dl = abs(fract(css.y.div(laid)).sub(0.5)).mul(laid);
  const laidW = float(1).sub(smoothstep(0.3, 1.0, dl));
  const chain = float(105.8);
  const dc = abs(fract(css.x.div(chain).add(0.37)).sub(0.5)).mul(chain);
  const chainW = float(1).sub(smoothstep(0.5, 1.5, dc));
  const bank = smoothstep(1.5, 3, dc).mul(float(1).sub(smoothstep(3, 10, dc)));

  // The watermark, a countermark low in the sheet.
  const wl = css.sub(o.mark.xy).div(max(o.mark.z, 1)).add(0.5);
  const wIn = step(0, wl.x).mul(step(wl.x, 1)).mul(step(0, wl.y)).mul(step(wl.y, 1)).mul(o.mark.w);
  const wm = texture(o.watermark, clamp(wl, 0, 1)).a.mul(wIn);

  const thickness = float(1)
    .add(flocs.mul(0.42))
    .sub(fibre.mul(0.08))
    .sub(laidW.mul(0.1))
    .sub(chainW.mul(0.09))
    .add(bank.mul(0.05))
    .sub(wm.mul(0.34));

  // The dawn front: left to right (from the hand to the code), leaning a little from the
  // foot of the sheet, ragged by the formation and the fibres. Margins keep 0 and 1 exact.
  const along = css.x
    .div(o.res.x)
    .mul(0.84)
    .add(float(1).sub(css.y.div(o.res.y)).mul(0.16));
  const rag = texture(o.noise, css.div(240))
    .b.sub(0.5)
    .mul(0.15)
    .add(fibre.mul(0.06))
    .add(flocs.mul(0.05));
  const SOFT = 0.045;
  const M = 0.2;
  const front = o.dawn.mul(1 + 2 * M).sub(M);
  const dawnHere: N = float(1).sub(smoothstep(front.sub(SOFT), front.add(SOFT), along.add(rag)));
  const arriving = dawnHere.mul(float(1).sub(dawnHere)).mul(4);

  // Age: a broad warm drift, sparse foxing, one tide line. The old sheet always has its years.
  const age = max(o.age, float(1).sub(dawnHere).mul(0.42));
  const broad = texture(o.noise, css.div(1700)).a;
  const foxN = texture(o.noise, css.div(1300)).g;
  const tide = texture(o.noise, css.div(2300)).a;
  const sheet = mix(vec3(...DAWN_LIGHT_RGB), vec3(...DAWN_DEPARTS_RGB), dawnHere);
  const aged = sheet.mul(vec3(0.925, 0.875, 0.8));
  const base = mix(sheet, aged, age.mul(broad.mul(0.55).add(0.45)));
  const fox = smoothstep(0.83, 0.87, foxN).mul(age).mul(0.42);
  const tideLine = float(1)
    .sub(smoothstep(0, 0.007, abs(tide.sub(0.61))))
    .mul(age)
    .mul(0.06);

  // The platemark: a shallow bed; its walls lit by the same raking light.
  const pl = o.plate;
  const on = step(1, pl.z);
  const dxl = css.x.sub(pl.x);
  const dxr = pl.x.add(pl.z).sub(css.x);
  const dyt = css.y.sub(pl.y);
  const dyb = pl.y.add(pl.w).sub(css.y);
  const inside = step(0, min(min(dxl, dxr), min(dyt, dyb))).mul(on);
  const wall = (d: N) =>
    float(1)
      .sub(smoothstep(0, 3.2, d))
      .mul(step(0, d));
  // A wall's normal points into the bed; it is lit when it faces the light.
  const bevel = wall(dyt)
    .mul(L.y.mul(0.11))
    .add(wall(dxl).mul(L.x.mul(0.11)))
    .sub(wall(dyb).mul(L.y.mul(0.09)))
    .sub(wall(dxr).mul(L.x.mul(0.09)))
    .mul(inside);
  const outerLip = (d: N) => float(1).sub(smoothstep(0, 1.8, abs(d)));
  const lip = max(
    max(outerLip(dxl), outerLip(dxr))
      .mul(step(pl.y, css.y))
      .mul(step(css.y, pl.y.add(pl.w))),
    max(outerLip(dyt), outerLip(dyb))
      .mul(step(pl.x, css.x))
      .mul(step(css.x, pl.x.add(pl.z))),
  )
    .mul(on)
    .mul(0.04);
  const wipe = texture(o.noise, vec2(css.x.div(900), css.y.div(140))).r;
  const plateTone = inside.mul(wipe.mul(0.4).add(0.6)).mul(0.03);

  const reflected = base
    .mul(float(0.97).add(relief).add(pool))
    .mul(float(1).add(flocs.mul(0.035)).add(fibre.mul(0.05)))
    .sub(vec3(laidW.mul(0.005).add(chainW.mul(0.008))))
    .mul(mix(vec3(1), FOX, fox))
    .mul(float(1).sub(tideLine))
    .mul(float(1).sub(plateTone))
    .mul(float(1).add(bevel).sub(lip))
    .mul(float(1).sub(arriving.mul(0.06)));

  const transmitted = mix(WINDOW_OLD, WINDOW_NEW, dawnHere)
    .mul(clamp(float(0.62).add(float(1).sub(thickness).mul(1.85)), 0.08, 1.25))
    .mul(float(1).sub(plateTone.mul(3)));
  const color = mix(reflected, transmitted, o.light);
  // How the sheet is lit here (relief and lamp), for whatever is laid on top of it.
  const shine = float(0.97).add(relief).add(pool);
  return { color, tooth: s.x, L, inside, dawn: dawnHere, flocs: s.y, fibre, lit: shine };
}
