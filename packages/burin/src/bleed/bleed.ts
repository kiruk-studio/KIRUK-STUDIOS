/**
 * Ink bleed — water and pigment moving through the paper, on the GPU.
 *
 * Intaglio prints are pulled on damp paper, and iron-gall ink re-wets: where the
 * sheet is wet, ink lifts off the lines, travels with the water along the fibres,
 * and settles as the water leaves — darkest at the edge it dried at. It is local
 * (only where the paper is wet) and it does not last: the stain fades.
 *
 * State, one texel per two CSS px (RGBA, half float):
 *   R  water w        where the sheet is wet
 *   G  pigment p      ink carried in that water
 *   B  stain s        ink the water left behind
 *   A  rim e          the darker tide line where a wet edge dried
 *
 * One step:
 *   water     nonlinear capillary diffusion — wet paper wicks, dry paper resists — scaled
 *             by the sheet's own absorbency (flocs, fibre), so fronts finger along fibres
 *   evaporate a little everywhere, faster where the film is thin
 *   pigment   picked up from dry ink lines (the eye, the printed type) under water;
 *             carried with the water; deposited as the water goes (coffee-ring rim)
 *   fade      the stain and its rim fade back into the paper (half-life ≈ 11 s)
 *
 * Sources: the wet brush (a segment from the last pointer position), the damp sheet
 * at printing (uniform dampness that dries in a few seconds).
 *
 * spec-link: ideas/studio-dawn/ink-bleed.md · skill: kiruk-burin (references/bleed.md)
 */
import {
  abs,
  clamp,
  dot,
  Fn,
  float,
  length,
  max,
  min,
  screenUV,
  select,
  smoothstep,
  texture,
  vec2,
  vec4,
} from 'three/tsl';
import type { Texture } from 'three/webgpu';

type N = any;
type U = any;

export type BleedInputs = {
  /** previous state (ping-pong: one material per direction, each with a fixed source) */
  src: Texture;
  /** sim grid size in texels */
  grid: U;
  /** viewport, CSS px */
  res: U;
  /** dt, s */
  dt: U;
  /** brush: x, y (CSS px), radius (CSS px), water per second */
  brush: U;
  /** previous brush position: x, y, active, unused */
  brushPrev: U;
  /** damp sheet: water added per second everywhere near ink */
  damp: U;
  /** ink sources */
  ink: Texture;
  plate: Texture | null;
  paper: Texture;
  noise: Texture;
  /**
   * The hand's media (hand/compose.ts): its quill ink and washes re-wet like the cut lines,
   * and a wash being laid wets the sheet under it (`wet`, water per second at full wash).
   */
  hand?: { sources: (css: N) => { ink: N; wash: N }; wet: U };
};

export const BLEED = {
  /** CSS px per sim texel */
  cell: 2,
  diffuse: 0.21,
  evaporate: 0.085,
  pickup: 3.2,
  carry: 0.22,
  deposit: 3.2,
  fade: 0.06,
} as const;

/** Distance from p to the segment a–b. */
const segDist = (p: N, a: N, b: N) => {
  const ab = b.sub(a);
  const t = clamp(dot(p.sub(a), ab).div(max(dot(ab, ab), 1e-4)), 0, 1);
  return length(p.sub(a.add(ab.mul(t))));
};

export function bleedStep(o: BleedInputs) {
  return Fn(() => {
    const uv = screenUV;
    const tx = vec2(1, 1).div(o.grid);
    const css = uv.mul(o.res);
    const at = (dx: number, dy: number) => texture(o.src, uv.add(tx.mul(vec2(dx, dy))));
    const c = texture(o.src, uv);
    const nb = [at(1, 0), at(-1, 0), at(0, 1), at(0, -1)];
    const dg = [at(1, 1), at(-1, 1), at(1, -1), at(-1, -1)];

    // The sheet's absorbency: thin, open places wick faster; fibres carry the front.
    const pt = texture(o.paper, css.div(512));
    const fib = texture(o.paper, css.div(512).add(vec2(0.37, 0.11))).z;
    const absorb = float(0.55)
      .add(float(0.5).sub(pt.y).mul(1.1))
      .add(fib.sub(0.5).mul(0.9))
      .add(texture(o.noise, css.div(97)).b.sub(0.5).mul(0.5));
    const k = clamp(absorb, 0.08, 1.25);

    const w = c.x;
    const flow = (q: N, weight: number) => {
      const both = max(q.x, w);
      const open = smoothstep(0.004, 0.09, both);
      return q.x.sub(w).mul(open).mul(weight);
    };
    let lap = float(0) as N;
    for (const q of nb) lap = lap.add(flow(q, 1));
    for (const q of dg) lap = lap.add(flow(q, 0.5));
    const dt = o.dt;

    // Ink under the water: the engraved lines and the printed type; and the hand's quill and
    // washes, which lift only under real water (a brush, a wash being laid), never the damp of
    // a fresh print: the colourist works on a dry sheet.
    const inkHere: N = max(texture(o.ink, uv).x, o.plate ? texture(o.plate, uv).w : float(0));
    let handInk: N = float(0);
    let washWet: N = float(0);
    if (o.hand) {
      const h = o.hand.sources(css);
      handInk = max(h.ink.mul(0.85), h.wash.mul(0.32));
      washWet = smoothstep(0.03, 0.3, h.wash).mul(o.hand.wet);
    }

    // Sources: the brush stroke and the damp sheet.
    const b = o.brush;
    const d = segDist(css, b.xy, select(o.brushPrev.z.greaterThan(0.5), o.brushPrev.xy, b.xy));
    const brushW = float(1)
      .sub(smoothstep(b.z.mul(0.35), b.z, d))
      .mul(b.w);
    const near = smoothstep(0.02, 0.6, inkHere);
    const dampW = o.damp.mul(float(0.25).add(near.mul(0.75)));

    const evap = float(BLEED.evaporate).mul(
      float(1).add(
        float(1)
          .sub(smoothstep(0, 0.2, w))
          .mul(1.4),
      ),
    );
    const w1 = clamp(
      w
        .add(lap.mul(BLEED.diffuse).mul(k))
        .add(brushW.add(dampW).add(washWet).mul(dt))
        .sub(evap.mul(dt)),
      0,
      1.4,
    );

    // Pigment: carried where both cells are wet, lifted from dry ink, left behind as water goes.
    const p = c.y;
    let plap = float(0) as N;
    for (const q of [...nb, ...dg]) {
      const wetBoth = min(q.x, w);
      plap = plap.add(q.y.sub(p).mul(smoothstep(0.01, 0.12, wetBoth)));
    }
    const lifts = max(inkHere, handInk.mul(smoothstep(0.12, 0.4, w)));
    const pickup = lifts
      .mul(smoothstep(0.02, 0.3, w))
      .mul(BLEED.pickup)
      .mul(dt)
      .mul(float(1).sub(smoothstep(0.4, 1.2, p)));
    const goes = float(1).sub(smoothstep(0.0, 0.22, w1));
    const dep = p.mul(goes).mul(BLEED.deposit).mul(dt).add(p.mul(0.15).mul(dt));
    const p1 = clamp(p.add(plap.mul(BLEED.carry).mul(k)).add(pickup).sub(dep), 0, 2);

    // Stain and rim: what the water left, fading back into the paper.
    const edge = clamp(
      abs(nb[0]!.x.sub(nb[1]!.x))
        .add(abs(nb[2]!.x.sub(nb[3]!.x)))
        .mul(4),
      0,
      1,
    );
    const fade = float(1).sub(float(BLEED.fade).mul(dt));
    const s1 = clamp(c.z.mul(fade).add(dep.mul(0.9)), 0, 1.5);
    const e1 = clamp(c.w.mul(fade).add(dep.mul(edge).mul(2.2)), 0, 1.5);
    return vec4(w1 as N, p1 as N, s1 as N, e1 as N);
  })();
}

/** How the bleed reads on the sheet: wet paper darker, pigment a warm wash, stain and rim in ink. */
export function bleedLook(state: N) {
  const wet = smoothstep(0.0, 0.45, state.x);
  const wash = clamp(state.y.mul(1.15), 0, 1);
  const stain = clamp(state.z.mul(1.0), 0, 1);
  const rim = clamp(state.w.mul(1.25), 0, 1);
  return { wet, wash, stain, rim };
}
