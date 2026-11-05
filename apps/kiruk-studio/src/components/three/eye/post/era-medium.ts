/**
 * Ten ways of seeing (docs/ERA_POV_PLAN.md): the finished frame shown through
 * each era's own screen and picture technology. You stand where that era's
 * screen stood and look back at the one person using it, so the era is told
 * by the picture itself and no words are needed.
 *
 * Every era fills the whole frame: no page, inset, border or box round the
 * eye (only 1970's tube has an edge, because the glass is the medium). Each
 * has its own sign, in or on the iris, that says "this opens", and answers
 * the visitor's hand in its own grammar: over the iris, pressing it, going in.
 *
 *   1970 a green phosphor terminal: scanlines, glow, curved glass; the
 *        prompt's block cursor waits in the pupil
 *   1981 a Xerox Star's 1-bit bitmap, as an etching: strokes of ink where the
 *        face has edges, the Star's dither where it has tone; the arrow rests
 *        on the pupil, and a press selects the iris by inverting it
 *   1991 a NeXT's four greys: the first web page's machine; the iris is the
 *        page's one link, underlined on the lower lid
 *   1995 216 web-safe colours on a home CRT at night: navy shadows, a few
 *        still stars, the shadow mask; the catchlight is an animated GIF
 *   1997 16-bit colour bands and JPEG blocks
 *   2000 the eye through a laptop panel; the search box's caret waits in the pupil
 *   2003 candy colour
 *   2009 a phone photo of its time: a warm faded filter
 *   2013 the system: her face drawn by a UI kit, each tone a component (dots,
 *        radios, sliders, switches, buttons), painted by a theme's tokens;
 *        her pupil is a round primary button
 *   2026 measured: the interface tracks everything. The whole face as a clean
 *        black-and-white plate under white instrument lines (landmarks with
 *        live coordinates, the eye's geometry, its turn and pupil in numbers)
 *        and the visitor measured back: a reticle, a gaze line, a scanpath.
 *        Lock-on brackets frame the iris; a press captures it into blocks
 *
 * The cut between eras is the person's blink (post/medium-director.ts):
 * `dep` plays the outgoing era's departure as the lids close, the era number
 * changes while they are shut, and `arr` plays the incoming era's arrival as
 * they open. So `cur` is the same for every pixel and only one era's branch
 * runs. Every texture read inside a branch names its level.
 */

import { smoothstepDown } from '../nodes/common';
import { type N, T } from '../nodes/tsl';
import type { EyeUniforms } from '../uniforms';
import { measured } from './measured';
import {
  almond,
  bayer4,
  bayer8,
  cellPx,
  cornea,
  develop,
  dissolve,
  easeInCubic,
  easeInOutSine,
  easeInQuad,
  easeOutCubic,
  hash,
  hex,
  LUMA,
  lc,
  lin,
  luma,
  type MediumFrame,
  px,
} from './medium-kit';
import { system } from './system';

const {
  Fn,
  If,
  abs,
  clamp,
  dot,
  exp,
  float,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  mod,
  pow,
  screenSize,
  screenUV,
  select,
  smoothstep,
  step,
  vec2,
  vec3,
  vec4,
} = T;

/** Era ids in order; a medium's number is its index + 1 (0 is none). */
export const ERA_MEDIA = [
  '1970',
  '1981',
  '1991',
  '1995',
  '1997',
  '2000',
  '2003',
  '2009',
  '2013',
  '2026',
] as const;
/**
 * The studio shows one look, `codex`. It uses the 1981 etching branch
 * (ink where the face has an edge) and does not add a shader.
 */
const MEDIA_ALIAS: Record<string, (typeof ERA_MEDIA)[number]> = { codex: '1981' };
export const mediumOf = (eraId: string) =>
  ERA_MEDIA.indexOf(MEDIA_ALIAS[eraId] ?? (eraId as (typeof ERA_MEDIA)[number])) + 1;

/** The frame's luminance, display-referred, stretched off the dark room. */
const tone = (d: N, gamma: N | number) => pow(clamp(dot(d, LUMA).sub(0.02).div(0.78), 0, 1), gamma);

/** 1 inside a rectangle with rounded corners (all in pixels), anti-aliased. */
function rounded(p: N, size: N, inset: N, r: N): N {
  const q = max(abs(p.sub(size.mul(0.5))).sub(size.mul(0.5).sub(inset).sub(r)), 0);
  return float(1).sub(smoothstep(r.sub(1.5), r.add(1.5), length(q)));
}

/** The 1981 arrow pointer, in bitmap cells from its tip: 1 inside. */
function arrowAt(q: N): N {
  const head = step(0, q.y)
    .mul(step(q.y, 10))
    .mul(step(0, q.x))
    .mul(step(q.x, q.y.mul(0.6)));
  const s = q.y.sub(8).mul(0.45);
  const tail = step(8, q.y)
    .mul(step(q.y, 15))
    .mul(step(s.add(1.5), q.x))
    .mul(step(q.x, s.add(3.5)));
  return max(head, tail);
}

/**
 * 1995's catchlight, an animated GIF in cells from its centre: a dot, a
 * plus, a four-point star, the plus again (`f` is the frame, 0..3).
 */
function sparkleAt(q: N, f: N): N {
  const ax = abs(q.x);
  const ay = abs(q.y);
  const dot1 = step(ax, 0.5).mul(step(ay, 0.5));
  const plus = max(step(ax, 0.5).mul(step(ay, 1.5)), step(ay, 0.5).mul(step(ax, 1.5)));
  const star = max(step(ax, 0.5).mul(step(ay, 4.5)), step(ay, 0.5).mul(step(ax, 4.5))).max(
    step(ax, 1.5)
      .mul(step(ay, 1.5))
      .mul(step(ax.add(ay), 2.5)),
  );
  return select(
    f.lessThan(0.5),
    dot1,
    select(f.lessThan(1.5), plus, select(f.lessThan(2.5), star, plus)),
  );
}

/**
 * @param tex the finished frame, display-encoded (≈ sRGB, 8 bits), as a texture
 * @param only build just this era's branch (1..10; 0 none, the frame as it is),
 *   a small shader that compiles fast (post/pipeline.ts keeps one per era);
 *   without it every era is built, chosen by `M.cur`
 * @returns the frame in the era's medium, linear
 */
export function eraMedium(Ux: EyeUniforms, tex: N, only?: number): N {
  const U: N = Ux;
  const M = U.medium;
  return Fn(() => {
    const uv = screenUV;
    const size = screenSize;
    const H = size.y;
    const p = uv.mul(size).toVar();
    // shared by several branches, so each is built once out here (a value
    // first built inside one branch is left unset in the others)
    const s = H.div(900).toVar();
    const kc = max(M.irisR.mul(H).div(245), 0.2).toVar();
    const F: MediumFrame = {
      p,
      size,
      H,
      kc,
      e: M.eye.mul(size).toVar(),
      pc: M.pupil.mul(size).toVar(),
      R: M.irisR.mul(H).toVar(),
      pupilR: M.pupilR.mul(H).toVar(),
      apX: M.apX,
      apY: M.apY,
    };
    const { e, pc, R, pupilR } = F;
    /** The finished frame at a UV, display-referred. */
    const at = (q: N) => tex.sample(q).level(0).rgb;
    const sign = M.signA.toVar();
    const out = lin(at(uv)).toVar();

    // each era's branch, registered here and built below: just one, or all
    // of them chained on the era number
    const bodies: Record<number, () => void> = {};
    const on = (n: number, body: () => void) => {
      bodies[n] = body;
    };

    // ---- 1970: a green phosphor terminal -----------------------------------
    on(1, () => {
      // leaving: the raster collapses onto the eye's line (then a line, then a dot)
      const dq = clamp(M.dep.div(0.55), 0, 1);
      const squash = float(1).sub(easeInQuad(dq).mul(0.97));
      const yS = e.y.add(p.y.sub(e.y).div(squash));
      const uvc = vec2(uv.x, yS.div(H));
      // arriving: the tube warms up, the picture rising into lit scanlines
      const wu = easeOutCubic(M.arr);
      const gam = mix(float(2.2), float(0.85), wu);
      const u = uvc.sub(0.5).mul(2);
      const su = u.mul(dot(u, u).mul(0.07).add(1)).mul(0.5).add(0.5);
      const l = tone(at(su), gam);
      // the phosphor's bloom: a ring of eight taps round the beam
      const r = vec2(H.mul(0.006).mul(mix(float(1.6), float(1), wu))).div(size);
      let g: N = float(0);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [0.7, 0.7],
        [-0.7, 0.7],
        [0.7, -0.7],
        [-0.7, -0.7],
      ]) {
        g = g.add(tone(at(su.add(r.mul(vec2(dx, dy)))), gam));
      }
      g = g.mul(1 / 8);
      // the same 260 rows on any desktop; never finer than a desktop's pitch
      // (3.46 device px), where a phone's rows would alias into moiré
      const rows = H.div(max(kc.mul(3.46), 3.46));
      const row = abs(fract(su.y.mul(rows)).sub(0.5)).mul(2);
      const lv = l.mul(float(1).sub(row.mul(row).mul(0.62)));
      const c = vec3(pow(lv, 2.4).mul(0.55), lv.mul(1.05), pow(lv, 2.4).mul(0.32))
        .add(vec3(0.08, 0.5, 0.1).mul(g).mul(0.35))
        .toVar();
      // the prompt waits in the pupil: it blinks, holds lit while the pointer is
      // over the iris (the line has focus), and a press strikes the key
      const blinkOn = step(0.5, fract(M.clock.mul(1.05)));
      const on = max(max(blinkOn, M.steady), max(step(0.5, M.hover), step(0.001, M.enter))).mul(
        sign,
      );
      // (the lids close over it, like everything else on the eye)
      const block = step(abs(p.x.sub(pc.x)), pupilR.mul(0.2)).mul(
        step(abs(p.y.sub(pc.y)), pupilR.mul(0.36)),
      );
      const disc = step(length(p.sub(pc)), pupilR);
      const struck = step(0.5, M.press);
      const cur = mix(block, disc, struck).mul(on).mul(almond(F, p));
      // the struck key is drawn by the beam: the phosphor's top, in its scanlines, glowing harder
      const key = mix(
        vec3(0.5, 1, 0.42),
        hex('#9eff85').mul(float(1).sub(row.mul(row).mul(0.62))),
        struck,
      );
      c.assign(mix(c, key, cur).add(vec3(0.08, 0.5, 0.1).mul(g).mul(0.1).mul(struck).mul(cur)));
      const vig = float(1).sub(pow(dot(u, u).mul(0.5), 1.3).mul(0.55));
      const inside = step(0, su.x).mul(step(su.x, 1)).mul(step(0, su.y)).mul(step(su.y, 1));
      const lit = c
        .mul(vig)
        .mul(inside)
        .mul(rounded(p, size, H.mul(0.028), H.mul(0.075)))
        .mul(float(1).sub(step(0.55, M.dep)));
      // ...a bright line on the eye's line shrinking to a dot, and the dot fading
      const lineT = clamp(M.dep.sub(0.55).div(0.25), 0, 1);
      const dotT = clamp(M.dep.sub(0.8).div(0.2), 0, 1);
      const halfW = mix(size.x.mul(0.5), px(F, 2), easeInQuad(lineT));
      const line = step(abs(p.y.sub(e.y)), px(F, 1))
        .mul(step(abs(p.x.sub(pc.x)), halfW))
        .mul(step(0.55, M.dep))
        .mul(exp(dotT.mul(-5)));
      out.assign(lin(lit.add(vec3(0.5, 1, 0.42).mul(1.5).mul(line))));
    });
    // ---- 1981: a Xerox Star's 1-bit bitmap, as an etching ------------------
    on(2, () => {
      const cell = cellPx(F, 3.4);
      const ci = floor(p.div(cell));
      const cc = ci.add(0.5).mul(cell);
      const c0 = cornea(F, cc);
      // the lid opening, snapped to the bitmap's cells (no grey edge in a 1-bit picture)
      const open = step(0.5, almond(F, cc));
      const dev = (o: N) => {
        const q = ci.add(o).add(0.5).mul(cell);
        return develop(luma(at(q.div(size))), 1.7, 0.45, c0);
      };
      const L = dev(vec2(0, 0));
      const m = dev(vec2(2, 0))
        .add(dev(vec2(-2, 0)))
        .add(dev(vec2(0, 2)))
        .add(dev(vec2(0, -2)))
        .mul(0.25);
      // (the page in the cornea gets more: its windows and icons are small)
      const L2 = lc(L, m, mix(float(0.8), float(1.8), c0));
      // a 1-bit digitised photograph: the shadows fall to ink and the face
      // is told by its lights; edges are strokes of ink (lashes, the lid
      // line, the limbus, brow hairs) and tone is the Star's dither
      const ink = step(L2.sub(m), -0.12);
      // (the page in the cornea tops out at about two thirds paper, so it reads
      // as a lit screen with the iris round it, not a white disc)
      const t = smoothstep(0.1, 0.86, L2).mul(
        mix(float(1), float(0.68), c0.mul(smoothstep(0.3, 0.6, L))),
      );
      // (a threshold of 0 would leave one cell in 64 lit in the blackest ink)
      const paper = step(bayer8(ci).add(1 / 128), t)
        .mul(float(1).sub(ink))
        .toVar();
      // the arrow pointer rests on the pupil while the visitor's own is away:
      // solid ink with a paper halo, as the Star drew it, so it reads on the
      // lit page as well as on the dark pupil; it appears cell by cell
      const big = select(kc.lessThan(0.7), float(2), float(1));
      const q = floor(
        ci
          .sub(floor(pc.div(cell)))
          .sub(vec2(5, 3))
          .div(big),
      );
      const show = dissolve(float(1).sub(M.ptrOn).mul(sign), ci, 8).mul(open);
      const inA = arrowAt(q).mul(show);
      const ring = max(
        max(arrowAt(q.add(vec2(1, 0))), arrowAt(q.sub(vec2(1, 0)))),
        max(arrowAt(q.add(vec2(0, 1))), arrowAt(q.sub(vec2(0, 1)))),
      ).mul(show);
      paper.assign(mix(mix(paper, float(1), ring), float(0), inA));
      // a press selects the iris: the Star inverted what you selected; going in,
      // the selection opens out over everything, the icon becoming its window
      const d = length(ci.add(0.5).mul(cell).sub(pc));
      const pressed = step(d, R).mul(step(0.5, M.press)).mul(open);
      const opened = step(d, mix(R, length(size), easeInCubic(M.enter))).mul(step(0.001, M.enter));
      paper.assign(mix(paper, float(1).sub(paper), max(pressed, opened)));
      // arriving: two interlaced fields paint down onto ink; leaving, one
      // field clears it to ink, so the cut stays dark. The write head is a
      // one-cell band of the Star's checker, on both fields.
      const rowY = ci.y.mul(cell).div(H);
      const even = float(1).sub(mod(ci.y, 2));
      const front = select(even.greaterThan(0.5), M.arr.mul(2), M.arr.mul(2).sub(1));
      const painted = step(rowY, front);
      const frontD = M.dep.sub(0.4).div(0.6);
      const cleared = step(rowY, frontD).mul(step(0.4, M.dep));
      const band = cell.div(H);
      const headA = step(abs(rowY.sub(front)), band)
        .mul(step(0.001, M.arr))
        .mul(step(M.arr, 0.999));
      const headD = step(abs(rowY.sub(frontD)), band)
        .mul(step(0.4, M.dep))
        .mul(step(M.dep, 0.999));
      const head = max(headA, headD).mul(mod(ci.x.add(ci.y), 2));
      const shown = painted.mul(float(1).sub(cleared));
      const v = max(paper.mul(shown), head);
      const flood = dissolve(smoothstep(0.85, 1, M.enter), ci, 8);
      out.assign(lin(mix(mix(hex('#101012'), hex('#f1efe8'), v), hex('#f1efe8'), flood)));
    });
    // ---- 1991: a NeXT's four greys -----------------------------------------
    on(3, () => {
      // arriving: the refresh sweeps down; below it, a coarse still still coming in
      const sweep = H.mul(easeInOutSine(M.arr));
      const cell = select(p.y.lessThan(sweep), cellPx(F, 2), cellPx(F, 8));
      const ci = floor(p.div(cell));
      const q = ci.add(0.5).mul(cell);
      const c0 = cornea(F, q);
      const dev = (o: number) =>
        develop(luma(at(q.add(vec2(cell.mul(o), 0)).div(size))), 1.7, 0.5, c0);
      const L = dev(0);
      const m = dev(2).add(dev(-2)).mul(0.5);
      const L2 = clamp(lc(L, m, mix(float(0.5), float(1.4), c0)), 0, 1);
      // exactly four greys, dithered; the dark room stays black; leaving, two
      const four = clamp(floor(L2.mul(3).add(bayer4(ci).mul(0.98))).div(3), 0, 1);
      const v = select(
        M.dep.greaterThan(0.3),
        step(0.5, L2),
        select(L.lessThan(0.04), float(0), four),
      ).toVar();
      // the iris is the page's one link: its underline lies on the lower
      // lid's wet rim, white, and draws itself on once, left to right, when
      // the era is ready (so it reads as the page's, not the face's)
      const dx = p.x.sub(e.x);
      const aw = select(dx.lessThan(0), F.apX.x, F.apX.y).mul(H);
      const lidY = e.y.add(
        F.apY.y
          .mul(H)
          .mul(0.84)
          .mul(pow(max(float(1).sub(dx.div(aw).mul(dx.div(aw))), 0), 0.6)),
      );
      const thick = select(M.hover.greaterThan(0.5), cellPx(F, 4), cellPx(F, 2));
      const wipe = floor(pc.x.sub(R).add(R.mul(2).mul(sign)).div(cell)).mul(cell);
      const under = step(abs(p.y.sub(lidY)), thick.mul(0.5))
        .mul(step(abs(p.x.sub(pc.x)), R))
        .mul(step(p.x, wipe))
        .mul(step(0.001, sign));
      v.assign(mix(v, float(1), under));
      // over it, NeXT's grey selection: the iris's blacks lift to dark grey
      // in a half pattern, the page in it untouched; pressed, it inverts
      const inIris = step(length(p.sub(pc)), R).mul(step(0.5, almond(F, p)));
      v.assign(mix(v, max(v, float(1 / 3)), inIris.mul(dissolve(M.hover.mul(0.5), ci))));
      v.assign(mix(v, float(1).sub(v), inIris.mul(step(0.5, M.press))));
      // going in: a new window draws down, white
      v.assign(
        mix(v, float(1), step(p.y, H.mul(easeInOutSine(M.enter))).mul(step(0.001, M.enter))),
      );
      out.assign(lin(vec3(v)));
    });
    // ---- 1995: 216 web-safe colours on a home CRT, at night -----------------
    on(4, () => {
      const cell = cellPx(F, 3);
      const ci0 = floor(p.div(cell));
      // arriving: the interlaced GIF's four passes, each row filled down from its pass's row
      const pass = floor(clamp(M.arr, 0, 0.999).mul(4));
      const stride = select(
        pass.lessThan(0.5),
        float(8),
        select(pass.lessThan(1.5), float(4), select(pass.lessThan(2.5), float(2), float(1))),
      );
      const ci = vec2(ci0.x, ci0.y.sub(mod(ci0.y, stride)));
      const q = ci.add(0.5).mul(cell);
      const d0 = at(q.div(size));
      const l0 = luma(d0);
      const L = develop(l0, 1.5, 0.55, cornea(F, q));
      const d = d0.mul(L.div(max(l0, 1e-3))).toVar();
      // a little more colour and contrast, and the shadows go to navy
      d.assign(
        mix(vec3(luma(d)), d, 1.35)
          .sub(0.5)
          .mul(1.15)
          .add(0.5),
      );
      d.assign(mix(d, hex('#000033'), smoothstepDown(0.22, 0, L)));
      // ordered dither onto 00/33/66/99/CC/FF a channel; leaving, three levels
      const lv = select(M.dep.greaterThan(0.001), float(2), float(5));
      const t = bayer4(ci0).sub(0.5).div(lv);
      const qd = floor(clamp(d.add(t), 0, 1).mul(lv).add(0.5))
        .div(lv)
        .toVar();
      const black = step(dot(qd, vec3(1)), 0.001);
      qd.assign(mix(qd, hex('#000033'), black));
      // the shadow mask, where the picture is bright: R | G | B stripes, offset on alternate rows
      // (each stripe at least a device pixel: a phone's 2-px cells still show all three)
      const sw = max(cell.div(3), 1);
      const k = mod(floor(p.x.div(sw).add(mod(ci0.y, 2).mul(1.5))), 3);
      const mask = vec3(step(k, 0.5), step(0.5, k).mul(step(k, 1.5)), step(1.5, k));
      qd.assign(mix(qd, qd.mul(mask.mul(0.14).add(0.86)).mul(1.12), step(0.5, luma(qd))));
      // a few still stars in the night, far from the face, never twinkling
      const vr = length(uv.sub(0.5).mul(vec2(1.22, 1)));
      const far = step(F.apX.y.mul(H).mul(1.6), length(p.sub(e))).mul(step(0.62, vr));
      const star = black.mul(far).mul(step(0.9967, hash(ci0)));
      qd.assign(mix(qd, select(hash(ci0.add(17)).greaterThan(0.5), vec3(1), hex('#ccccff')), star));
      // the catchlight is an animated GIF: four frames at 2 fps, held on the
      // star when still; drawn in its own coarser cells so it reads as a
      // sprite, not a stuck pixel, and appearing cell by cell
      const fr = select(M.steady.greaterThan(0.5), float(2), mod(floor(M.clock.mul(2)), 4));
      const sbig = select(kc.lessThan(0.7), float(2), float(1.5));
      const sc = floor(pc.add(vec2(R.mul(-0.4), R.mul(-0.42))).div(cell));
      const spark = sparkleAt(floor(ci0.sub(sc).add(0.5).div(sbig)), fr)
        .mul(dissolve(sign, ci0))
        .mul(step(0.5, almond(F, p)));
      qd.assign(mix(qd, vec3(1), spark));
      // the iris is a link: blue round it under the pointer, red pressed, visited going in
      const ring = step(abs(length(ci0.add(0.5).mul(cell).sub(pc)).sub(R)), cell).mul(
        step(0.5, almond(F, p)),
      );
      const linkC = select(
        M.enter.greaterThan(0.001),
        hex('#663399'),
        select(M.press.greaterThan(0.5), hex('#ff0000'), hex('#0000ff')),
      );
      qd.assign(
        mix(
          qd,
          linkC,
          ring.mul(max(step(0.5, M.hover), max(step(0.5, M.press), step(0.001, M.enter)))),
        ),
      );
      qd.assign(mix(qd, hex('#000033'), smoothstep(0.7, 1, M.enter)));
      out.assign(lin(qd));
    });
    // ---- 1997: 16-bit colour, JPEG blocks in the darks ---------------------
    on(5, () => {
      const pix = s.mul(2);
      const fine = at(floor(p.div(pix)).add(0.5).mul(pix).div(size));
      const block = at(
        floor(p.div(pix.mul(8)))
          .add(0.5)
          .mul(pix.mul(8))
          .div(size),
      );
      const d = mix(fine, block, smoothstepDown(0.3, 0.08, luma(fine)).mul(0.55));
      const c = vec3(
        floor(d.x.mul(31)).div(31),
        floor(d.y.mul(63)).div(63),
        floor(d.z.mul(31)).div(31),
      );
      out.assign(lin(c));
    });
    // ---- 2000: through a laptop panel; the search box's caret in the pupil --
    on(6, () => {
      const d = at(uv);
      // a TN panel's black is never black
      const floorC = hex('#15171c');
      const c = floorC.add(float(1).sub(floorC).mul(d)).toVar();
      // the caret blinks for five seconds after anything happens, then holds
      const blinkOn = select(M.since.lessThan(5), step(0.5, fract(M.clock.div(1.06))), float(1));
      const on = max(blinkOn, M.steady).mul(sign);
      const caret = step(abs(p.x.sub(pc.x)), px(F, 2).mul(mix(float(0.5), float(0.75), M.press)))
        .mul(step(abs(p.y.sub(pc.y)), pupilR.mul(0.8)))
        .mul(on)
        .mul(almond(F, p));
      c.assign(mix(c, float(1).sub(c), caret));
      out.assign(lin(c));
    });
    // ---- 2003: candy colour ------------------------------------------------
    on(7, () => {
      const d0 = at(uv);
      const c = mix(vec3(luma(d0)), d0, 1.3)
        .sub(0.45)
        .mul(1.12)
        .add(0.45)
        .toVar();
      c.addAssign(hex('#0a0500').mul(smoothstep(0.6, 1, luma(d0))));
      c.assign(mix(c, hex('#6c9bd2'), smoothstepDown(0.35, 0, luma(d0)).mul(0.12)));
      out.assign(lin(c));
    });
    // ---- 2009: a phone photo of its time: a warm faded filter --------------
    on(8, () => {
      const d0 = at(uv);
      const l = luma(d0);
      // faded blacks, warm highlights, teal shadows
      const d = mix(d0, vec3(l), 0.18)
        .mul(0.82)
        .add(vec3(0.1, 0.075, 0.04))
        .add(vec3(0.07, 0.035, -0.06).mul(smoothstep(0.35, 0.95, l)))
        .add(vec3(-0.03, 0.025, 0.05).mul(smoothstepDown(0.45, 0.02, l)))
        .toVar();
      // the lens's falloff, round the middle, and walnut in the shadows
      const u = uv
        .sub(0.5)
        .mul(2)
        .mul(vec2(size.x.div(H), 1).div(max(size.x.div(H), 1)));
      d.mulAssign(float(1).sub(smoothstep(0.25, 1, dot(u, u)).mul(0.38)));
      d.assign(mix(d, hex('#2b2118'), smoothstepDown(0.25, 0, l).mul(0.4)));
      out.assign(lin(d));
    });
    // ---- 2013: the system: her face drawn by a UI kit (post/system.ts) -----
    on(9, () => {
      out.assign(lin(system({ F, M, tex, uv, sign })));
    });
    // ---- 2026: measured: the interface tracks everything (post/measured.ts)
    on(10, () => {
      out.assign(lin(measured({ F, M, at, uv, sign })));
    });

    if (only !== undefined) bodies[only]?.();
    else {
      let chain: N = If(M.cur.equal(1), bodies[1]);
      for (let n = 2; n <= ERA_MEDIA.length; n++) chain = chain.ElseIf(M.cur.equal(n), bodies[n]);
    }

    return vec4(min(out, vec3(4)), 1);
  })();
}
