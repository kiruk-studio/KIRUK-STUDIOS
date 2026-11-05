/**
 * Where the hand meets the sheet — TSL, in the burin renderer's compose pass.
 *
 * p5.brush paints each medium on white (lead white on black). Here every medium is turned into
 * optical density, D = −ln T per channel (Beer–Lambert: density adds where transmittance
 * multiplies), and the paper decides what happens to it:
 *
 *   chalk  dry: it sits on the tooth's peaks. Where the hand was light the valleys stay bare,
 *          where it pressed they fill (the deposit model: a' = a·g − v·(1 − a)).
 *   wash   wet: the pigment settles into the valleys and gathers on the fibres, most where the
 *          wash is thin (granulation); the formation mottles it; it cockles the sheet as it
 *          dries, so the raking light finds its edges (`handRelief`, read by the paper).
 *   iris   a wash too, mapped from the rest pose onto the turning eye, under the live lids.
 *   ink    the quill: starved on the tooth exactly as the cut lines are, a little fuller on
 *          the fibres.
 *   body   lead white: laid on top, catching the peaks, lit like the sheet; held to the light
 *          it is opaque and goes dark.
 *
 * Each paper takes its own ink: a medium's density is projected onto its old-paper pigment and
 * rebuilt on its new-paper one (sanguine → blueprint, bistre → navy wash, iron-gall → navy),
 * keeping what differed from the pigment (the hand's own variation) — so the new sheet coming
 * in as a front re-inks the hand with it, point by point, as it does the engraving.
 *
 * Making it again, the hand works in three fronts across the eye (inner corner to temple):
 * chalk first, then the washes, then white and the quill.
 *
 * spec-link: ideas/studio-dawn/hand.md
 */
import { clamp, dot, exp, float, log, max, mix, smoothstep, step, texture, vec3 } from 'three/tsl';
import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  NoColorSpace,
  RGBAFormat,
  type Texture,
} from 'three/webgpu';
import { DAWN_SWAP, type HandLayer, PIGMENTS, type RGB } from './media';

// TSL nodes: @types/three is stricter than the runtime; the graph is checked by the shader compiler.
type N = any;
type U = any;

export type HandSlot = HandLayer | 'iris';

function solid(v: number) {
  const t = new DataTexture(new Uint8Array([v, v, v, 255]), 1, 1, RGBAFormat);
  t.colorSpace = NoColorSpace;
  t.magFilter = t.minFilter = LinearFilter;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/**
 * The hand's textures on the GPU. Every texture node made for a slot is kept, so a new sheet
 * (a new impression, a resize) swaps them all without rebuilding a shader.
 */
export function createHandTextures() {
  // One placeholder per slot, never shared. three.js gives texture nodes whose textures share a
  // uuid one sampler, owned by the first node built (TextureNode.getUniformHash is the texture's
  // uuid; UniformNode.getSharedNode). Slots built on one shared placeholder would all go on
  // sampling whichever slot was built first, whatever `.value` they are given later.
  const empty: Record<HandSlot, Texture> = {
    chalk: solid(255),
    wash: solid(255),
    ink: solid(255),
    body: solid(0),
    iris: solid(255),
  };
  const current = { ...empty };
  const nodes: Record<HandSlot, N[]> = { chalk: [], wash: [], ink: [], body: [], iris: [] };
  return {
    sample(slot: HandSlot, uv: N): N {
      const n = texture(current[slot], uv);
      nodes[slot].push(n);
      return n;
    },
    set(slot: HandSlot, tex: Texture | null) {
      current[slot] = tex ?? empty[slot];
      for (const n of nodes[slot]) n.value = current[slot];
    },
    get: (slot: HandSlot) => current[slot],
    isEmpty: (slot: HandSlot) => current[slot] === empty[slot],
    dispose() {
      for (const t of Object.values(empty)) t.dispose();
    },
  };
}
export type HandTextures = ReturnType<typeof createHandTextures>;

const LUM = vec3(0.2126, 0.7152, 0.0722);
const third = vec3(1 / 3, 1 / 3, 1 / 3);
const density = (T: N) => log(max(T, vec3(1 / 255, 1 / 255, 1 / 255))).negate();
const cover = (D: N) => float(1).sub(exp(dot(D, third).negate()));

/** Rebuild a density painted in `from` on the pigment `to`, by how much new paper lies under it. */
function swapped(D: N, from: RGB, to: RGB, dawn: N, keep: number) {
  const d0 = from.map((v) => -Math.log(v)) as [number, number, number];
  const d1 = to.map((v) => -Math.log(v)) as [number, number, number];
  const dd = d0[0] * d0[0] + d0[1] * d0[1] + d0[2] * d0[2];
  const s = dot(D, vec3(...d0)).div(dd);
  const rest = D.sub(vec3(...d0).mul(s));
  const Dn = vec3(...d1)
    .mul(s)
    .add(rest.mul(keep));
  return mix(D, max(Dn, vec3(0, 0, 0)), dawn);
}

export type HandComposeInputs = {
  /** the pixel, CSS px */
  css: N;
  /** the rect the medium layers cover, CSS px */
  region: U;
  tex: HandTextures;
  paper: { tooth: N; flocs: N; fibre: N; dawn: N; lit: N };
  /** held to the light, 0 … 1 */
  light: U;
  /** chalk, wash, ink, body: how much of each to show (0 … 1) */
  media: U;
  /** the iris decal: where to sample it, and how much of it this pixel shows (lids, pupil) */
  iris: { uv: N; show: N } | null;
  /** the reveal while it is made again, 0 … 3 (3: all of it) */
  make: U;
  /** eye-space x of the pixel (−1 inner corner … +1 outer), for the fronts */
  along: N;
  /** the knock-out round the printed type, 0 … 1 */
  knock: N;
  noise: Texture;
};

/**
 * The hand on the sheet. Returns the transmittance laid under the engraving (chalk, washes,
 * iris), over it (the quill), and lead white to be laid on top.
 */
export function handCompose(o: HandComposeInputs) {
  const uv = o.css.sub(o.region.xy).div(o.region.zw);
  const inside = step(0, uv.x).mul(step(uv.x, 1)).mul(step(0, uv.y)).mul(step(uv.y, 1));
  const { tooth, flocs, fibre, dawn } = o.paper;

  // The fronts: inner corner to temple, ragged like the engraving's passes.
  const rag = texture(o.noise, o.css.div(173)).b.sub(0.5).mul(0.24);
  const front = (k: number) => {
    const t = clamp(o.make.sub(k), 0, 1);
    const xf = t.mul(3.9).sub(1.95);
    return float(1).sub(smoothstep(xf.sub(0.1), xf.add(0.1), o.along.add(rag)));
  };
  const fChalk = front(0);
  const fWash = front(1);
  const fTop = front(2);

  // Where the hand's tooth is the paper's: valleys (low tooth) and peaks.
  const valley = smoothstep(0.36, 0.72, float(1).sub(tooth));
  // Wet media settle in the valleys and on the fibres; the formation mottles them.
  const settle = float(0.5)
    .sub(tooth)
    .mul(1.3)
    .add(float(0.5).sub(flocs).mul(0.55))
    .add(fibre.mul(0.3));

  // ── chalk: on the peaks ──
  const sw = DAWN_SWAP;
  let Dc: N = swapped(
    density(o.tex.sample('chalk', uv).rgb),
    sw.chalk.old.rgb,
    sw.chalk.new.rgb,
    dawn,
    0.5,
  );
  const ac = cover(Dc);
  const ac2 = clamp(ac.mul(1.32).sub(valley.mul(0.62).mul(float(1).sub(ac))), 0, 1);
  // Red chalk is a strong colour where it lies: the deposit, then the pigment's full weight.
  Dc = Dc.mul(ac2.div(max(ac, 1e-3)))
    .mul(1.1)
    .mul(o.media.x.mul(fChalk).mul(inside));

  // ── wash: in the valleys ──
  let Dw: N = swapped(
    density(o.tex.sample('wash', uv).rgb),
    sw.wash.old.rgb,
    sw.wash.new.rgb,
    dawn,
    0.62,
  );
  const aw = cover(Dw);
  Dw = Dw.mul(max(float(1).add(settle.mul(float(1.25).sub(aw)).mul(0.9)), 0)).mul(
    o.media.y.mul(fWash).mul(inside),
  );

  // ── the iris: a wash on the turning eye (its colour is the eye's, not the paper's ink) ──
  let Di: N = vec3(0, 0, 0);
  if (o.iris) {
    const iu = o.iris.uv;
    const inI = step(0, iu.x).mul(step(iu.x, 1)).mul(step(0, iu.y)).mul(step(iu.y, 1));
    const Ti = mix(vec3(1, 1, 1), o.tex.sample('iris', iu).rgb, inI);
    // Laid on an engraved iris, the colour lives in the paper between the cuts: a full wash.
    Di = density(Ti).mul(0.85);
    const ai = cover(Di);
    Di = Di.mul(max(float(1).add(settle.mul(float(1.2).sub(ai)).mul(1.1)), 0)).mul(
      o.iris.show.mul(fWash),
    );
  }

  // ── the quill: starved on the tooth, as the cut lines are ──
  let Dq: N = swapped(
    density(o.tex.sample('ink', uv).rgb),
    sw.ink.old.rgb,
    sw.ink.new.rgb,
    dawn,
    0.5,
  );
  const aq = cover(Dq);
  const starve = float(1).sub(
    float(1)
      .sub(aq)
      .mul(0.42)
      .mul(smoothstep(0.42, 0.8, tooth)),
  );
  Dq = Dq.mul(starve)
    .mul(float(1).add(fibre.mul(0.6).mul(aq).mul(float(1).sub(aq))))
    .mul(o.media.z.mul(fTop).mul(inside).mul(float(1).sub(o.knock)));

  // ── lead white: on top, on the peaks, lit like the sheet; opaque to the window ──
  const B = o.tex.sample('body', uv).rgb;
  const ab0 = dot(B, LUM);
  const ab = clamp(ab0.mul(1.1).sub(valley.mul(0.7).mul(float(1).sub(ab0))), 0, 1).mul(
    o.media.w.mul(fTop).mul(inside).mul(float(1).sub(o.knock)).mul(0.85),
  );
  const leadWhite = mix(vec3(...PIGMENTS.leadWhite.rgb), vec3(0.97, 0.985, 0.99), dawn);
  const bodyLit = mix(
    leadWhite.mul(o.paper.lit).mul(mix(float(0.95), float(1.03), tooth)),
    vec3(0.2, 0.18, 0.16),
    o.light,
  );

  return {
    /** chalk, washes, the iris: multiplied in before the engraving */
    under: exp(Dc.add(Dw).add(Di).negate()),
    /** the quill: multiplied in after the engraving */
    over: exp(Dq.negate()),
    /** lead white: mix(color, body.rgb, body.a) */
    body: { rgb: bodyLit, a: ab },
    /** how much hand ink and wash lie here (for the bleed and for proofs) */
    inkCover: cover(Dq),
    washCover: aw.mul(inside),
  };
}

/**
 * The washes cockle the sheet as they dry: a height for the paper's raking light, read at any
 * point (the paper takes differences of it). 0 outside the region or where there is no wash.
 */
export function handRelief(o: { region: U; tex: HandTextures; media: U; make: U }) {
  return (css: N): N => {
    const uv = css.sub(o.region.xy).div(o.region.zw);
    const inside = step(0, uv.x).mul(step(uv.x, 1)).mul(step(0, uv.y)).mul(step(uv.y, 1));
    const T = o.tex.sample('wash', uv).rgb;
    return float(1)
      .sub(dot(T, third))
      .mul(0.05)
      .mul(inside)
      .mul(o.media.y)
      .mul(clamp(o.make.sub(1), 0, 1));
  };
}

/**
 * The hand's ink and wash for the bleed: where water lifts pigment. `uv` is the sim's screen
 * uv; `css` its CSS px.
 */
export function handSources(o: { region: U; tex: HandTextures; media: U }, css: N) {
  const uv = css.sub(o.region.xy).div(o.region.zw);
  const inside = step(0, uv.x).mul(step(uv.x, 1)).mul(step(0, uv.y)).mul(step(uv.y, 1));
  const ink = float(1)
    .sub(dot(o.tex.sample('ink', uv).rgb, LUM))
    .mul(o.media.z);
  const wash = float(1)
    .sub(dot(o.tex.sample('wash', uv).rgb, LUM))
    .mul(o.media.y);
  return { ink: ink.mul(inside), wash: wash.mul(inside) };
}
