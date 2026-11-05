/**
 * The engraved eye, as burin line fields on the GPU.
 *
 * Every region of the eye is a family of engraved lines laid the way a plate
 * engraver would cut them, and every line's width is the tone:
 *
 *   skin above the lid   copies of the lid's own curve, compressing into the crease
 *   skin below the lid   copies of the lower lid, falling away down the cheek
 *   deep shade           a second, diagonal family cut across the first
 *   sclera               arcs around the iris, the eyeball's curvature
 *   iris                 spokes converging on the pupil, rings in the dark, a wavy collarette
 *   contours             the lid margins, the crease, the limbus, the pupil
 *   hair                 lashes and brow, each hair a tapered, bent burin stroke
 *   catchlight           the kiruk logogram, unchanged, reflected in the pupil
 *   glory                held to the light, rays cut round the eye (eyeGlory, drawn in compose)
 *
 * Light. One light for the paper and the eye (sun: toward the light, x right, y down,
 * z out of the sheet), moved by the reader's pointer. Each region has a form — the globe,
 * the upper lid rolling over it, the hollow under the brow, the brow ridge, the pillow of
 * the lower lid — and the tone of its lines follows N·L against the flat sheet. Cast
 * shadows are traced one step toward the light: the upper lid onto the globe, the lashes
 * as a broken band, the brow onto the hollow above the crease. The corneal window sits
 * where the half-vector meets the cornea, so it moves with the light too.
 *
 * Construction (wire, z channel, drawn in sanguine): the whole globe behind the lids, its
 * parallels and meridians about the optic axis (they turn with the gaze), the axis itself,
 * the orbit, and the centre lines — visible lines solid, hidden ones dashed.
 *
 * Passes (the strip of studies shows them, the plate is the fifth):
 *   1 construction · 2 contour · 3 hatch · 4 cross-hatch, iris, hair · 5 finished.
 *
 * Line widths are measured against each family's true gradient (slope included),
 * so lines stay one pitch apart where a curve turns steep. Hair is evaluated only
 * inside its own band.
 *
 * Curves mirror ./rig.ts. spec-link: ideas/studio-dawn/eye.md
 */
import {
  abs,
  acos,
  atan,
  clamp,
  cos,
  dot,
  exp,
  Fn,
  float,
  floor,
  fract,
  If,
  Loop,
  length,
  max,
  min,
  mix,
  normalize,
  pow,
  screenUV,
  select,
  sign,
  smoothstep,
  sqrt,
  step,
  texture,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { Texture } from 'three/webgpu';
import { between, contour, engrave, hash1, stipple } from '../../gpu/lines';
import { EYE, GLOBE } from './rig';

// TSL nodes: @types/three is stricter than the runtime; the graph is checked by the shader compiler.
type N = any;
type U = any;

/** TSL Loop with a named counter (nested loops must not both be `i`); the runtime takes `name`, @types/three does not list it. */
const loop = Loop as unknown as (
  p: { start: number; end: number; name: string },
  body: (v: Record<string, N>) => void,
) => void;

export type EyeInputs = {
  /** the ink target's region of the page: x, y, w, h (CSS px) */
  region: U;
  dpr: U;
  /** main eye: cx, cy, S (CSS px per eye unit), unused */
  eye: U;
  /** main pose: gx, gy, open, pupil */
  pose: U;
  /** studies strip: x, y, w, h (CSS px); w = 0 hides it */
  strip: U;
  /** held to the light, 0…1 */
  light: U;
  /** toward the light, unit: x right, y down, z out of the sheet */
  sun: U;
  /** construction drawn over the plate, 0…1 (the strip's first study always has it) */
  wire: U;
  /**
   * The plate's passes, 1 … 5 (5 = finished). Between whole numbers the next pass is
   * being cut: a front crosses the eye from the inner corner to the temple.
   */
  make: U;
  noise: Texture;
  star: Texture;
};

const TAU = Math.PI * 2;

/** 1 at m, 0 at ±1; past the corners it keeps falling gently (lines wrap the socket, never dive). */
const bump = (xx: N, m: number, e: number) => {
  const w = select(xx.lessThan(m), float(1 + m), float(1 - m));
  const u = xx.sub(m).div(w);
  const inside = float(1).sub(u.mul(u));
  const s = select(abs(u).lessThan(1), inside, float(1).sub(abs(u)).mul(0.9));
  return sign(s).mul(pow(abs(s), e));
};

const gauss = (dx: N, dy: N, sx: number, sy: number) =>
  exp(dx.mul(dx).div(sx).add(dy.mul(dy).div(sy)).negate());

/** Held to the light: a glory of rays cut round the eye, long and short. Drawn in compose. */
export function eyeGlory(o: { res: U; dpr: U; eye: U; light: U }) {
  return Fn(() => {
    const out = float(0).toVar();
    If(o.light.greaterThan(0.002), () => {
      const css = screenUV.mul(o.res);
      const S = o.eye.z;
      const aa = float(0.62).div(o.dpr);
      const rc = css.sub(o.eye.xy).div(S).sub(vec2(0, -0.2));
      const rr = length(rc.mul(vec2(1, 1.1)));
      const rth = atan(rc.y, rc.x);
      const NR = 216;
      const rPhi = rth.div(TAU).mul(NR);
      const rIdx = floor(rPhi.add(0.5));
      const odd = fract(rIdx.mul(0.5)).mul(2);
      const rLen = mix(float(2.05), float(1.5), odd).add(hash1(rIdx).mul(0.3));
      const taper = float(1).sub(smoothstep(1.0, rLen, rr));
      const rTone = smoothstep(0.98, 1.1, rr)
        .mul(pow(taper, 1.5).mul(0.5).add(0.08))
        .mul(float(1).sub(smoothstep(rLen.sub(0.08), rLen, rr)))
        .mul(o.light);
      out.assign(
        engrave(
          rPhi,
          float(NR).div(float(TAU).mul(max(rr.mul(S), 1))),
          rTone,
          rr.mul(S).div(9),
          aa,
        ),
      );
    });
    return out;
  })();
}

/**
 * The iris colour the hand painted at rest, carried onto the turning eye: where this pixel's
 * point of the iris lies in the decal (painted at the rest pose), and how much of it shows —
 * under the live lids (`opening`, from the ink pass), and never over the pupil, so the
 * catchlight stays clean. Mirrors the iris mapping in eyeInk.
 */
export function eyeIrisDecal(o: { css: N; eye: U; pose: U; rect: U; opening: N }) {
  const p = o.css.sub(o.eye.xy).div(o.eye.z);
  const gx = o.pose.x;
  const gy = o.pose.y;
  const ic = vec2(gx.mul(EYE.iris.gx), gy.mul(EYE.iris.gy).add(EYE.iris.cy));
  const rxy = vec2(pow(cos(gx.mul(0.61)), 0.9), cos(gy.mul(0.44))).mul(EYE.iris.R);
  const q = p.sub(ic).div(rxy);
  const rest = vec2(0, EYE.iris.cy).add(q.mul(EYE.iris.R));
  const uv = o.eye.xy.add(rest.mul(o.eye.z)).sub(o.rect.xy).div(o.rect.zw);
  const show = o.opening.mul(smoothstep(o.pose.w.sub(0.01), o.pose.w.add(0.05), length(q)));
  return { uv, show, along: p.x };
}

/** Returns vec4(ink, construction, wire, opening): w is 1 inside the palpebral opening. */
export function eyeInk(o: EyeInputs) {
  return Fn(() => {
    const css = o.region.xy.add(screenUV.mul(o.region.zw));
    const out = vec4(0, 0, 0, 0).toVar();
    const aa = float(0.62).div(o.dpr);

    // ── which eye: a study in the strip, or the plate ──
    const st = o.strip;
    const cellW = st.z.div(4);
    const inStrip = st.z
      .greaterThan(1)
      .and(css.x.greaterThan(st.x))
      .and(css.x.lessThan(st.x.add(st.z)))
      .and(css.y.greaterThan(st.y))
      .and(css.y.lessThan(st.y.add(st.w)));
    const cell = clamp(floor(css.x.sub(st.x).div(max(cellW, 1))), 0, 3);
    const cellC = vec2(st.x.add(cell.add(0.5).mul(cellW)), st.y.add(st.w.mul(0.56)));
    const cellS = min(cellW.mul(0.3), st.w.mul(0.38));
    const centre = select(inStrip, cellC, o.eye.xy);
    const S = select(inStrip, cellS, o.eye.z);
    const pass = select(inStrip, cell.add(1), float(5));
    const gx = select(inStrip, float(0), o.pose.x);
    const gy = select(inStrip, float(0), o.pose.y);
    const open = select(inStrip, float(1), o.pose.z);
    const pupilK = select(inStrip, float(EYE.pupil.rest), o.pose.w);
    const P = select(inStrip, float(2.7), float(3.55)); // line pitch, CSS px

    const p = css.sub(centre).div(S);
    const x = p.x;
    const y = p.y;

    const inBox = x
      .greaterThan(-1.66)
      .and(x.lessThan(1.66))
      .and(y.greaterThan(-1.52))
      .and(y.lessThan(1.16));
    If(inBox, () => {
      const nz = (uv: N) => texture(o.noise, uv).level(float(0));
      const n0 = nz(p.mul(0.37).add(0.5));

      // ── passes: the strip shows one per study; the plate is cut pass by pass when made again ──
      // Pass k on the plate is on behind a front that crosses the eye as make goes k−1 → k.
      const sweep = (k: number) => {
        const t = clamp(o.make.sub(k - 1), 0, 1);
        const xf = t.mul(3.8).sub(1.9);
        return float(1).sub(smoothstep(xf.sub(0.05), xf.add(0.05), x.add(n0.b.sub(0.5).mul(0.14))));
      };
      const gate = (k: number) => select(inStrip, step(k - 0.5, pass), sweep(k));
      const contourOn = gate(2);
      const hatchOn = gate(3);
      const detailOn = gate(4);

      // ── the construction: same curves as rig.ts, and their slopes ──
      const c = EYE.crease;
      const curves = (xx: N) => {
        const t01 = xx.add(1).mul(0.5);
        const mid = mix(float(EYE.canthus.inY), float(EYE.canthus.outY), t01);
        const yL = mid.add(
          gy
            .mul(0.035)
            .add(EYE.lower.h)
            .mul(bump(xx, EYE.lower.m, EYE.lower.e)),
        );
        const yUo = mid.sub(
          float(EYE.upper.h)
            .sub(gy.mul(0.06))
            .mul(bump(xx, EYE.upper.m, EYE.upper.e)),
        );
        const yU = mix(yL.sub(0.008), yUo, open);
        const yC = mix(float(c.inY), float(c.outY), t01).sub(
          float(c.h)
            .sub(gy.mul(0.04))
            .mul(bump(xx.mul(c.k), c.m, c.e)),
        );
        return { mid, yL, yU, yC };
      };
      const C = curves(x);
      const Ca = curves(x.add(0.012));
      const Cb = curves(x.sub(0.012));
      const slope = (a: N, b: N) => sqrt(a.sub(b).div(0.024).pow(2).add(1));
      const kU = slope(Ca.yU, Cb.yU);
      const kL = slope(Ca.yL, Cb.yL);
      const kC = slope(Ca.yC, Cb.yC);
      const { mid, yL, yU, yC } = C;
      const b = EYE.brow;
      const browC = (xx: N) =>
        float(b.y).sub(float(b.h).mul(bump(xx.sub(0.1).mul(0.78), b.m, b.e)));
      const yB = browC(x);

      const dU = y.sub(yU); // > 0 below the upper lid
      const dL = yL.sub(y); // > 0 above the lower lid
      const inOpen = step(0, dU)
        .mul(step(0, dL))
        .mul(step(abs(x), 1));
      const up = step(y, mid);

      // ── light: one sun for the paper and the eye ──
      const L = o.sun;
      const litOn = hatchOn;
      // Tone change of a surface tilted to (nx, ny), against the flat sheet: < 0 lit, > 0 in shade.
      const shade = (nx: N, ny: N) => L.z.sub(dot(normalize(vec3(nx, ny, 1)), L)).mul(litOn);
      const lz = max(L.z, 0.25);
      // Cast shadows: step toward the light by the occluder's height; in shadow if that point is inside it.
      const kLid = float(0.075).div(lz);
      const castLid = smoothstep(
        -0.014,
        0.014,
        curves(x.add(L.x.mul(kLid))).yU.sub(y.add(L.y.mul(kLid))),
      ).mul(litOn);
      const kLash = float(0.17).div(lz);
      const qLx = x.add(L.x.mul(kLash));
      const qLy = y.add(L.y.mul(kLash));
      const yUl = curves(qLx).yU;
      const lashSh = step(yUl.sub(0.15), qLy)
        .mul(step(qLy, yUl.sub(0.006)))
        .mul(step(0.42, hash1(floor(qLx.mul(48)))))
        .mul(step(abs(qLx), 0.95))
        .mul(litOn);
      const kBrow = float(0.13).div(lz);
      const qBx = x.add(L.x.mul(kBrow));
      const qBy = y.add(L.y.mul(kBrow));
      const halfAt = (xx: N) =>
        mix(float(b.w0), float(b.w1), pow(clamp(xx.sub(b.x0).div(b.x1 - b.x0), 0, 1), 0.85));
      const browCast = float(1)
        .sub(smoothstep(halfAt(qBx).mul(0.6), halfAt(qBx).mul(1.4), abs(qBy.sub(browC(qBx)))))
        .mul(smoothstep(b.x0 - 0.05, b.x0 + 0.12, qBx))
        .mul(float(1).sub(smoothstep(b.x1 - 0.2, b.x1 + 0.05, qBx)))
        .mul(step(yB, y))
        .mul(litOn);
      // The globe under the lids, a little flattened so it spans the opening.
      const gd = p.sub(vec2(0, 0.02)).div(vec2(1.12, 0.92));
      const gz = sqrt(max(float(1).sub(dot(gd, gd)), 0.03));
      const shadeGlobe = L.z.sub(dot(normalize(vec3(gd.x, gd.y, gz)), L)).mul(litOn);
      // The half-vector: where the wet cornea mirrors the light.
      const Hv = normalize(L.add(vec3(0, 0, 1)));

      // ── iris and pupil on the turning eyeball ──
      const ic = vec2(gx.mul(EYE.iris.gx), gy.mul(EYE.iris.gy).add(EYE.iris.cy));
      const rxy = vec2(pow(cos(gx.mul(0.61)), 0.9), cos(gy.mul(0.44))).mul(EYE.iris.R);
      const q = p.sub(ic).div(rxy);
      const r = length(q);
      const th = atan(q.y, q.x);
      const RS = S.mul(EYE.iris.R);
      const inIris = inOpen.mul(step(r, 1));
      const inPupil = inIris.mul(step(r, pupilK));

      // ── sclera: arcs about the iris; shade under the lid and in the corners ──
      const sv = p.sub(ic).mul(vec2(1, 1.08));
      const sr = length(sv);
      const Ts = float(-0.04)
        // Contact shade right under the lid; then the lid's cast shadow, and the lashes' broken one.
        .add(
          float(1)
            .sub(smoothstep(0, 0.045, dU))
            .mul(0.3),
        )
        .add(castLid.mul(0.5))
        .add(lashSh.mul(0.22))
        .add(smoothstep(0.5, 1.0, abs(x)).mul(0.3))
        .add(smoothstep(0.45, 1.0, length(sv.mul(vec2(0.8, 1.25)))).mul(0.18))
        .add(shadeGlobe.mul(0.75))
        .add(n0.g.sub(0.5).mul(0.08));
      const sclera = engrave(
        sr.mul(S).div(P),
        float(1.04).div(P),
        Ts,
        atan(sv.y, sv.x).mul(sr).mul(S).div(7),
        aa,
      ).mul(hatchOn);
      // A few vessels, fine and wandering, only toward the corners; none reach the iris.
      const vk = atan(sv.y, sv.x)
        .mul(9 / Math.PI)
        .add(n0.r.sub(0.5).mul(3.2))
        .add(sr.mul(17).sin().mul(0.16));
      const vIdx = floor(vk.add(0.5));
      const vessel = contour(
        vk
          .sub(vIdx)
          .mul(sr)
          .mul(S)
          .mul(Math.PI / 9),
        float(0.32),
        aa,
      )
        .mul(step(0.58, hash1(vIdx.add(41))))
        .mul(smoothstep(0.62, 0.95, abs(x)))
        .mul(smoothstep(0.42, 0.62, sr))
        .mul(detailOn);

      // ── iris: spokes converging on the pupil, rings in the dark ──
      const NSP = max(floor(RS.mul(TAU * 0.72).div(P)), 24);
      const streak = nz(vec2(th.div(TAU).mul(5), r.mul(0.35))).r;
      // Crypts of Fuchs: lens-shaped hollows just outside the collarette.
      const cu = th.div(TAU).mul(26);
      const ci = floor(cu);
      const rc = float(0.66).add(hash1(ci.add(11.1)).mul(0.14));
      const crypt = float(1)
        .sub(
          smoothstep(
            0.7,
            1.0,
            length(
              vec2(
                fract(cu).sub(0.5).div(0.36),
                r.sub(rc).div(float(0.06).add(hash1(ci.add(3.3)).mul(0.04))),
              ),
            ),
          ),
        )
        .mul(step(0.38, hash1(ci.add(5.5))));
      const Ti = float(0.4)
        .add(step(r, 0.54).mul(0.16))
        .add(streak.sub(0.5).mul(0.42))
        .add(crypt.mul(0.42))
        .add(smoothstep(0.8, 0.99, r).mul(0.5))
        .add(
          float(1)
            .sub(smoothstep(0, 0.06, dU))
            .mul(0.2),
        )
        .add(castLid.mul(0.36))
        // Light passes the cornea and lands on the far side of the iris: that side is lighter,
        // the side toward the light darker (the limbal glow).
        .add(
          dot(q, L.xy.div(max(length(L.xy), 0.001)))
            .mul(0.11)
            .mul(litOn),
        );
      const spokes = engrave(
        th.div(TAU).mul(NSP),
        NSP.div(float(TAU).mul(max(r.mul(RS), 1))),
        Ti,
        r.mul(RS).div(5),
        aa,
      ).mul(hatchOn);
      const rings = engrave(
        r.mul(RS).div(P.mul(0.82)),
        float(1).div(P.mul(0.82)),
        Ti.sub(0.5).mul(1.6),
        th.mul(r).mul(RS).div(6),
        aa,
      ).mul(detailOn);
      const collar = contour(
        r.sub(float(0.54).add(th.mul(13).sin().mul(0.035))).mul(RS),
        float(0.95),
        aa,
      ).mul(detailOn);
      // Contraction furrows: broken rings near the iris root.
      const furrow = (rr: number, seed: number) =>
        contour(r.sub(rr).mul(RS), float(0.5), aa).mul(
          step(0.42, fract(th.mul(2.3 / Math.PI).add(hash1(float(seed))))),
        );
      const furrows = max(furrow(0.86, 7), furrow(0.925, 13)).mul(detailOn);
      // The pupillary ruff: the iris pigment folding over the pupil edge, dark and crenellated.
      const ruffR = pupilK
        .add(0.045)
        .add(th.mul(42).sin().mul(0.012))
        .add(hash1(floor(th.div(TAU).mul(42))).mul(0.012));
      const ruff = step(r, ruffR).mul(step(pupilK, r)).mul(detailOn);
      // The cornea holds the room's window: cut as clear paper, its glazing bars left in ink.
      const wq = q.sub(Hv.xy.mul(1.12));
      const pane = float(1)
        .sub(smoothstep(0.15, 0.17, abs(wq.x)))
        .mul(float(1).sub(smoothstep(0.11, 0.13, abs(wq.y))));
      const bars = max(
        float(1).sub(smoothstep(0.01, 0.02, abs(wq.x))),
        float(1).sub(smoothstep(0.01, 0.02, abs(wq.y))),
      );
      const glaze = pane.mul(float(1).sub(bars)).mul(detailOn).mul(0.92);
      const limbus = contour(r.sub(1).mul(RS), float(1.05), aa).mul(contourOn);
      const pupilEdge = contour(r.sub(pupilK).mul(RS), float(0.9), aa).mul(contourOn);

      // The catchlight: the kiruk logogram, paths unchanged, reflected in the pupil.
      const starC = ic.add(vec2(-0.16, -0.18).mul(rxy).mul(pupilK));
      const starD = rxy.y.mul(pupilK).mul(2.1);
      const suv = p.sub(starC).div(starD).add(0.5);
      const starIn = step(0, suv.x).mul(step(suv.x, 1)).mul(step(0, suv.y)).mul(step(suv.y, 1));
      const star = texture(o.star, clamp(suv, 0, 1))
        .level(float(0))
        .a.mul(starIn)
        .mul(detailOn);
      const pupil = inPupil.mul(float(1).sub(star)).mul(contourOn);

      const irisInk = max(max(max(spokes, rings), max(collar, limbus)), max(furrows, ruff));
      const scleraIn = inOpen.sub(inIris).max(0);
      // Inner corner: the plica, a soft crescent fold beside the caruncle.
      const xp = float(-0.8).add(y.sub(0.07).div(0.14).pow(2).mul(0.06));
      const plicaZone = step(abs(y.sub(0.07)), 0.13).mul(inOpen);
      const plica = max(
        contour(x.sub(xp).mul(S), float(0.55), aa),
        stipple(css, float(2.6), float(0.26), aa).mul(step(x, xp)).mul(step(-0.97, x)),
      )
        .mul(plicaZone)
        .mul(detailOn);
      // The lower lid's tear meniscus: a wet line of light along the margin.
      const meniscus = step(yL.sub(0.016), y)
        .mul(step(y, yL))
        .mul(step(abs(x), 0.9))
        .mul(detailOn);
      const meniscusTop = contour(y.sub(yL.sub(0.016)).mul(S), float(0.3), aa)
        .mul(step(abs(x), 0.88))
        .mul(inOpen)
        .mul(detailOn);
      const openInk = max(
        max(
          max(sclera, vessel.mul(0.85)).mul(scleraIn),
          irisInk.mul(inIris).mul(float(1).sub(inPupil)),
        ),
        max(max(pupil, pupilEdge.mul(inIris)), max(plica, meniscusTop)),
      )
        .mul(float(1).sub(glaze.mul(inIris)))
        .mul(float(1).sub(meniscus));

      // The upper lid has a thickness: the lash line in front, the edge that meets the eye behind,
      // a pale margin between. Lashes grow from the front edge.
      const taperU0 = float(1).sub(smoothstep(0.86, 1.03, abs(x)));
      const marg = taperU0.mul(0.02).add(0.002);
      const marginBand = step(yU.sub(marg), y)
        .mul(step(y, yU))
        .mul(step(abs(x), 1));

      // ── skin: line families that wrap the socket ──
      const band = max(yU.sub(yC), 0.03);
      const nBand = floor(S.mul(0.39).div(P).add(0.5));
      const aboveC = step(y, yC);
      const phiUp = select(
        aboveC.greaterThan(0.5),
        nBand.add(yC.sub(y).mul(S).div(P)),
        yU.sub(y).div(band).mul(nBand),
      );
      const gUp = select(aboveC.greaterThan(0.5), kC.div(P), nBand.mul(kU).div(band.mul(S)));
      const phiLo = y.sub(yL).mul(S).div(P);
      const phiSkin = select(up.greaterThan(0.5), phiUp, phiLo);
      const gSkin = select(up.greaterThan(0.5), gUp, kL.div(P));
      const wob = n0.r.sub(0.5).mul(0.55);

      // The brow's mass: skin under the hair is in half shade.
      const browHalf = mix(
        float(b.w0),
        float(b.w1),
        pow(clamp(x.sub(b.x0).div(b.x1 - b.x0), 0, 1), 0.85),
      );
      const browMass = exp(y.sub(yB).div(browHalf.mul(1.25)).pow(2).negate())
        .mul(smoothstep(b.x0 - 0.05, b.x0 + 0.15, x))
        .mul(float(1).sub(smoothstep(b.x1 - 0.25, b.x1 + 0.05, x)));

      const tl = clamp(yU.sub(y).div(band), 0, 1);
      // The lid skin: lit from above, shaded under the lashes and under the fold of the crease.
      // The lid rolls over the globe: near the lashes it turns down, under the fold it turns up;
      // the fold's shadow reaches further down the lid the higher the light.
      const lidShade = shade(x.mul(0.45), mix(float(0.55), float(-0.22), smoothstep(0, 0.85, tl)));
      const foldReach = clamp(L.y.negate().div(lz), 0.3, 1.6).mul(0.3);
      const TlidBand = float(0.07)
        .add(smoothstep(-0.35, 1.05, x).mul(0.12))
        .add(
          float(1)
            .sub(smoothstep(0, 0.16, tl))
            .mul(0.26),
        )
        .add(tl.mul(0.08))
        .add(smoothstep(float(1).sub(foldReach), 1.0, tl).mul(0.28))
        .add(lidShade.mul(0.6));
      const dC = max(yC.sub(y), 0);
      // Above the crease: the hollow under the brow faces down, the brow ridge faces the light.
      const sB = clamp(yC.sub(y).div(max(yC.sub(yB), 0.2)), 0, 1);
      const hollow = shade(x.mul(0.35), mix(float(0.5), float(-0.45), smoothstep(0.15, 0.85, sB)));
      const Tabove = exp(dC.div(0.1).negate())
        .mul(0.46)
        .add(
          smoothstep(0.1, 1.15, x)
            .mul(exp(dC.div(0.32).negate()))
            .mul(0.12),
        )
        .add(hollow.mul(0.55))
        .add(browCast.mul(0.3));
      const dLo = max(y.sub(yL), 0);
      // Below: the pillow of the lower lid faces up, the fold under it down, the cheek up again.
      const lowNy = select(
        dLo.lessThan(0.165),
        mix(float(-0.45), float(0.35), dLo.div(0.165)),
        mix(float(0.35), float(-0.25), smoothstep(0.165, 0.45, dLo)),
      );
      const lowShade = shade(x.mul(0.35), lowNy);
      const Tlow = exp(dLo.div(0.045).negate())
        .mul(0.42)
        .add(exp(dLo.sub(0.17).mul(dLo.sub(0.17)).div(0.004).negate()).mul(0.2))
        .add(
          smoothstep(0.25, 1.1, x)
            .mul(exp(dLo.div(0.3).negate()))
            .mul(0.08),
        )
        .add(lowShade.mul(0.5));
      const corners = gauss(x.add(1.07), y.add(0.22), 0.05, 0.22)
        .mul(0.38)
        .add(gauss(x.sub(1.08), y.add(0.03), 0.04, 0.07).mul(0.3));
      const rho = length(vec2(x.sub(0.06).div(1.52), y.add(0.22).div(1.18))).add(
        n0.a.sub(0.5).mul(0.16),
      );
      const fade = float(1).sub(smoothstep(0.8, 1.0, rho));
      const Tskin = select(
        up.greaterThan(0.5),
        select(aboveC.greaterThan(0.5), Tabove, TlidBand),
        Tlow,
      )
        .add(corners)
        .add(browMass.mul(0.3))
        .mul(max(fade, browMass.mul(0.9)));

      const clearMargin = float(1).sub(marginBand);
      const skin1 = engrave(phiSkin.add(wob), gSkin, Tskin, x.mul(S).div(7), aa)
        .mul(hatchOn)
        .mul(clearMargin);
      const Tx = Tskin.sub(0.44).div(0.56);
      const phi2 = x.mul(0.5).add(y.mul(0.866)).mul(S).div(P.mul(1.2)).add(wob.mul(0.6));
      const g2 = float(1).div(P.mul(1.2));
      const skin2 = engrave(phi2, g2, Tx, x.mul(0.866).sub(y.mul(0.5)).mul(S).div(7), aa)
        .mul(detailOn)
        .mul(clearMargin);
      // Dot and lozenge in the diamonds between the two families, where the shade is deepest.
      const lozenges = between(phiSkin.add(wob), gSkin, phi2, g2, Tx.mul(0.9), aa)
        .mul(detailOn)
        .mul(clearMargin);
      // The lower lid's fold, a fine line under the pillow of the lid.
      const lowerFold = contour(
        y.sub(yL.add(0.165)).mul(S),
        float(0.5).mul(float(1).sub(smoothstep(0.5, 0.88, abs(x.sub(0.08))))),
        aa,
      ).mul(detailOn);
      // Crow's feet at the outer corner, each a tapered, slightly bent cut.
      let crow = float(0) as N;
      for (const [ang, len, bend] of [
        [-0.62, 0.3, 0.6],
        [-0.3, 0.38, 0.4],
        [0.04, 0.34, -0.2],
        [0.34, 0.26, -0.5],
      ] as const) {
        const dd = p.sub(vec2(1.03, -0.02));
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const a = dd.x.mul(ca).add(dd.y.mul(sa));
        const perp = dd.x.mul(sa).sub(dd.y.mul(ca)).sub(a.mul(a).mul(bend));
        const hw = pow(clamp(float(1).sub(a.div(len)), 0, 1), 0.7).mul(0.6);
        crow = max(
          crow,
          float(1)
            .sub(smoothstep(hw.sub(aa), hw.add(aa), abs(perp).mul(S)))
            .mul(step(0.06, a))
            .mul(step(a, len)),
        );
      }
      const crows = crow.mul(detailOn).mul(fade);

      // ── contours ──
      const taperU = float(1).sub(smoothstep(0.86, 1.03, abs(x)));
      const lashLine = contour(
        y.sub(yU.sub(marg)).mul(S).div(kU),
        float(1.3)
          .add(float(1).sub(x.mul(x)).mul(1.25))
          .mul(taperU)
          .add(0.15),
        aa,
      ).mul(step(abs(x), 1.04));
      const backEdge = contour(dU.mul(S).div(kU), float(0.42).mul(taperU).add(0.05), aa).mul(
        step(abs(x), 1.0),
      );
      const lidU = max(lashLine, backEdge);
      // The lacrimal punctum: a tiny opening on the lower lid margin near the inner corner.
      const punctum = contour(
        length(p.sub(vec2(-0.8, 0.171)))
          .mul(S)
          .sub(1.8),
        float(0.5),
        aa,
      ).mul(detailOn);
      const taperL = float(1).sub(smoothstep(0.84, 1.03, abs(x)));
      const lidL = max(
        contour(y.sub(yL).mul(S).div(kL), float(0.7).mul(taperL).add(0.1), aa),
        contour(y.sub(yL).sub(0.03).mul(S).div(kL), float(0.95).mul(taperL).add(0.1), aa).mul(0.85),
      ).mul(step(abs(x), 1.04));
      const taperC = float(1).sub(smoothstep(0.9, 1.16, abs(x)));
      const creaseLine = contour(
        y.sub(yC).mul(S).div(kC),
        float(0.6)
          .add(
            float(1)
              .sub(smoothstep(-0.6, 0.6, x))
              .mul(0.8),
          )
          .mul(taperC),
        aa,
      );
      const car = gauss(x.add(0.935), y.sub(0.045), 0.0042, 0.0024);
      const caruncle = max(
        stipple(css, float(2.4), car.mul(0.85), aa),
        contour(car.sub(0.42).mul(4), float(0.12), float(0.05)).mul(0.6),
      ).mul(detailOn);
      const contours = max(max(lidU, lidL), max(creaseLine, punctum)).mul(contourOn);

      // ── hair: lashes and brow, each a tapered, bent burin stroke ──
      const lashes = float(0).toVar();
      If(
        detailOn
          .greaterThan(0.5)
          .and(y.greaterThan(yU.sub(0.3)))
          .and(y.lessThan(yL.add(0.14)))
          .and(abs(x).lessThan(1.12)),
        () => {
          const acc = float(0).toVar();
          const NL = 92;
          const lx0 = -0.9;
          const ldx = 1.9 / NL;
          const v = yU.sub(marg).sub(y); // height above the lash line
          const slantAt = (xx: N) => xx.mul(0.55).add(0.18);
          const est = x.sub(slantAt(x).mul(v).mul(1.3));
          // Two rows of upper lashes, three candidates each: GPU loops, not unrolled copies.
          loop({ start: 0, end: 2, name: 'row' }, ({ row }) => {
            const rf = float(row);
            const i0 = floor(est.sub(lx0).div(ldx).sub(rf.mul(0.5)));
            loop({ start: -1, end: 2, name: 'lk' }, ({ lk }) => {
              const i = i0.add(float(lk));
              const h = hash1(i.add(rf.mul(101)));
              const xr = float(lx0).add(
                i.add(0.5).add(rf.mul(0.5)).add(h.sub(0.5).mul(0.6)).mul(ldx),
              );
              const lenB = max(bump(xr, 0.28, 1.0), 0);
              const len = float(0.07)
                .add(lenB.mul(0.115))
                .add(hash1(i.add(rf.mul(31).add(57))).mul(0.045))
                .mul(mix(float(1), float(0.72), rf));
              const sl = slantAt(xr).add(
                hash1(i.add(rf.mul(13).add(9)))
                  .sub(0.5)
                  .mul(0.28),
              );
              const curl = float(3.4).add(hash1(i.add(rf.mul(7).add(23))).mul(1.4));
              // Lashes clump: the tips of four or five lean together.
              const cc = float(lx0).add(floor(i.div(4)).mul(4).add(2).mul(ldx));
              const pull = cc
                .sub(xr)
                .mul(0.38)
                .mul(clamp(v.div(len), 0, 1).pow(2));
              const uc = xr.add(sl.mul(v)).add(sl.mul(v).mul(v).mul(curl)).add(pull);
              const dir = sl.add(sl.mul(v).mul(curl).mul(2));
              const dist = abs(x.sub(uc))
                .mul(S)
                .div(sqrt(dir.mul(dir).add(1)));
              const tw = clamp(float(1).sub(v.div(len)), 0, 1);
              const hw = pow(tw, 0.62).mul(mix(float(1.2), float(0.9), rf));
              const cov = float(1)
                .sub(smoothstep(hw.sub(aa), hw.add(aa), dist))
                .mul(step(0, v))
                .mul(step(v, len))
                .mul(step(-0.92, xr))
                .mul(step(xr, 1.0));
              acc.assign(max(acc, cov));
            });
          });
          {
            const NL = 48;
            const x0 = -0.66;
            const dx = 1.62 / NL;
            const v = y.sub(yL).sub(0.03);
            const est = x.sub(x.mul(0.35).add(0.1).mul(v));
            const i0 = floor(est.sub(x0).div(dx));
            for (const k of [-1, 0, 1]) {
              const i = i0.add(k);
              const xr = float(x0).add(
                i
                  .add(0.5)
                  .add(hash1(i.add(311)).sub(0.5).mul(0.7))
                  .mul(dx),
              );
              const len = float(0.024)
                .add(max(bump(xr, 0.3, 1), 0).mul(0.045))
                .add(hash1(i.add(377)).mul(0.035));
              const sl = xr
                .mul(0.35)
                .add(0.1)
                .add(hash1(i.add(401)).sub(0.5).mul(0.5));
              const uc = xr.add(sl.mul(v));
              const dist = abs(x.sub(uc))
                .mul(S)
                .div(sqrt(sl.mul(sl).add(1)));
              const hw = pow(clamp(float(1).sub(v.div(len)), 0, 1), 0.7).mul(0.85);
              const cov = float(1)
                .sub(smoothstep(hw.sub(aa), hw.add(aa), dist))
                .mul(step(0, v))
                .mul(step(v, len))
                .mul(step(x0, xr))
                .mul(step(xr, 0.97));
              acc.assign(max(acc, cov));
            }
          }
          lashes.assign(acc);
        },
      );

      const brow = float(0).toVar();
      If(
        detailOn
          .greaterThan(0.5)
          .and(abs(y.sub(yB)).lessThan(0.36))
          .and(x.greaterThan(b.x0 - 0.2))
          .and(x.lessThan(b.x1 + 0.2)),
        () => {
          const span = b.x1 - b.x0;
          const NH = 96;
          const ang = (s: N) =>
            mix(
              mix(float(-1.15), float(-0.26), smoothstep(0, 0.3, s)),
              float(0.2),
              smoothstep(0.62, 1, s),
            );
          const sP = x.sub(b.x0).div(span);
          const aP = ang(sP);
          const Lp = mix(float(0.19), float(0.12), smoothstep(0.3, 1, sP));
          const back = x.sub(cos(aP).mul(Lp).mul(0.5));
          const acc = float(0).toVar();
          // Four layers of hair, five candidates each: GPU loops, not twenty unrolled copies.
          loop({ start: 0, end: 4, name: 'layer' }, ({ layer }) => {
            const lf = float(layer);
            const off = lf.div(4);
            const j0 = floor(back.sub(b.x0).div(span).mul(NH).sub(off));
            loop({ start: -2, end: 3, name: 'bk' }, ({ bk }) => {
              const j = j0.add(float(bk));
              const hs = hash1(j.add(lf.mul(211)));
              const s = j.add(off).add(hs.sub(0.5).mul(0.5)).div(NH);
              const xr = float(b.x0).add(s.mul(span));
              const half = mix(float(b.w0), float(b.w1), pow(clamp(s, 0, 1), 0.85));
              const qr = hash1(j.add(lf.mul(97).add(13)))
                .mul(1.7)
                .sub(0.95);
              const root = vec2(xr, browC(xr).add(qr.mul(half)));
              const a0 = ang(s).add(
                hash1(j.add(lf.mul(53).add(7)))
                  .sub(0.5)
                  .mul(0.32),
              );
              const dir = vec2(cos(a0), a0.sin());
              const L = mix(float(0.19), float(0.12), smoothstep(0.3, 1, s)).mul(
                hash1(j.add(lf.mul(29)))
                  .mul(0.4)
                  .add(0.78),
              );
              const bend = hash1(j.add(lf.mul(31).add(3)))
                .sub(0.35)
                .mul(2.4);
              const d = p.sub(root);
              const a = d.x.mul(dir.x).add(d.y.mul(dir.y));
              const perp = d.x.mul(dir.y).sub(d.y.mul(dir.x)).sub(bend.mul(a).mul(a));
              const hw = pow(clamp(float(1).sub(a.div(L)), 0, 1), 0.55).mul(
                float(1.05).add(float(1).sub(s).mul(0.25)),
              );
              const cov = float(1)
                .sub(smoothstep(hw.sub(aa), hw.add(aa), abs(perp).mul(S)))
                .mul(step(0, a))
                .mul(step(a, L))
                .mul(step(0.0, s))
                .mul(step(s, 1.0));
              acc.assign(max(acc, cov));
            });
          });
          brow.assign(acc);
        },
      );
      const hair = max(lashes.mul(float(1).sub(inOpen)), brow);

      const skinInk = max(
        max(max(skin1, skin2), max(hair, caruncle)),
        max(max(lozenges, lowerFold), crows),
      ).mul(float(1).sub(inOpen));
      const ink = max(max(openInk.mul(inOpen), skinInk), contours);

      // ── construction (the studies' first passes) ──
      const hl = float(0.45);
      const near = (d: N) => contour(d.mul(S), hl, aa);
      const boxX = max(near(x.sub(1)), near(x.add(1)))
        .mul(step(-0.45, y))
        .mul(step(y, 0.45));
      const cons = max(
        max(max(near(y.sub(yU)), near(y.sub(yL))), max(near(y.sub(yC)), near(y.sub(yB)))).mul(
          step(abs(x), 1.25),
        ),
        max(
          max(near(r.sub(1).mul(EYE.iris.R)), near(r.sub(pupilK).mul(EYE.iris.R))),
          max(boxX, near(y.sub(mid)).mul(step(abs(x), 1.3))),
        ),
      );
      const consK = select(
        inStrip,
        select(
          pass.lessThan(1.5),
          float(1),
          select(
            pass.lessThan(2.5),
            float(0.55),
            select(
              pass.lessThan(3.5),
              float(0.25),
              select(pass.lessThan(4.5), float(0.1), float(0)),
            ),
          ),
        ),
        // While the plate is made again, its construction leads and then gives way to the cut lines.
        float(1).sub(smoothstep(1.5, 4.8, o.make)),
      );

      // ── construction in sanguine: the whole globe, its axis, the orbit, the centre lines ──
      const wireK = select(
        inStrip,
        select(pass.lessThan(1.5), float(1), float(0)),
        max(o.wire, float(1).sub(smoothstep(2.6, 4.9, o.make))),
      );
      const wireOut = float(0).toVar();
      If(wireK.greaterThan(0.01), () => {
        const RG = GLOBE.R;
        const yaw = gx.mul(GLOBE.yaw);
        const pitch = gy.mul(GLOBE.pitch);
        const cyw = cos(yaw);
        const syw = yaw.sin();
        const cp = cos(pitch);
        const sp = pitch.sin();
        const gc = vec2(GLOBE.cx, GLOBE.cy);
        // Spherical coordinates about the optic axis: θ from the pole (the iris centre), φ around it.
        const sph = (pp: N) => {
          const d = pp.sub(gc).div(RG);
          const z = sqrt(max(float(1).sub(dot(d, d)), 0));
          const x1 = d.x.mul(cyw).sub(z.mul(syw));
          const z1 = d.x.mul(syw).add(z.mul(cyw));
          const y2 = d.y.mul(cp).sub(z1.mul(sp));
          const z2 = d.y.mul(sp).add(z1.mul(cp));
          return vec2(acos(clamp(z2, -1, 1)), atan(y2, x1));
        };
        const one = float(1).div(S);
        const s0 = sph(p);
        const sx = sph(p.add(vec2(one, 0)));
        const sy = sph(p.add(vec2(0, one)));
        const STEP_T = Math.PI / 12;
        const STEP_P = Math.PI / 6;
        // Distance to the nearest grid line in CSS px, from the field and its one-pixel differences.
        const ft = s0.x.div(STEP_T);
        const dT = abs(fract(ft.add(0.5)).sub(0.5)).div(
          max(length(vec2(sx.x.div(STEP_T).sub(ft), sy.x.div(STEP_T).sub(ft))), 1e-4),
        );
        // φ wraps at ±π: unwrap its differences first.
        const wrap = (dv: N) => dv.sub(floor(dv.div(12).add(0.5)).mul(12));
        const fp = s0.y.div(STEP_P);
        const dP = abs(fract(fp.add(0.5)).sub(0.5)).div(
          max(length(vec2(wrap(sx.y.div(STEP_P).sub(fp)), wrap(sy.y.div(STEP_P).sub(fp)))), 1e-4),
        );
        const gr = length(p.sub(gc)).div(RG);
        const onGlobe = step(gr, 1);
        const hair = (dpx: N) =>
          float(1).sub(smoothstep(float(0.5).sub(aa), float(0.5).add(aa), dpx));
        // Hidden lines dashed (6 on, 4 off); visible ones solid and lighter, kept off the cornea.
        const dash = (arc: N) => step(fract(arc.div(10)), 0.6);
        const shown = inOpen.mul(float(1).sub(inIris));
        const hidden = float(1).sub(inOpen);
        const lines = (dpx: N, arc: N) => hair(dpx).mul(shown.mul(0.5).add(hidden.mul(dash(arc))));
        const par = lines(dT, s0.y.mul(RG).mul(S).mul(s0.x.sin()))
          .mul(step(0.5, ft))
          .mul(step(ft, 5.5));
        const mer = lines(dP, s0.x.mul(RG).mul(S))
          .mul(step(0.2, s0.x))
          .mul(step(s0.x, Math.PI / 2));
        const sil = hair(abs(gr.sub(1)).mul(RG).mul(S)).mul(
          dash(atan(p.y.sub(GLOBE.cy), p.x.sub(GLOBE.cx)).mul(RG).mul(S)),
        );
        // The optic axis, as a centre line (long, short) from the pole outward; a cross on the pole.
        const cl = (arc: N) => {
          const f = fract(arc.div(22));
          return step(f, 0.55).add(step(0.68, f).mul(step(f, 0.78)));
        };
        const A = vec2(syw.mul(cp), sp);
        const dl = p.sub(gc.add(A.mul(RG)));
        const cross = max(
          hair(abs(dl.x).mul(S)).mul(step(abs(dl.y), 0.07)),
          hair(abs(dl.y).mul(S)).mul(step(abs(dl.x), 0.07)),
        );
        const aLen = length(A);
        const aDir = A.div(max(aLen, 1e-3));
        const along = dot(dl, aDir);
        const perp = abs(dl.x.mul(aDir.y).sub(dl.y.mul(aDir.x)));
        const axis = hair(perp.mul(S))
          .mul(step(0, along))
          .mul(step(along, aLen.mul(2.6).add(0.05)))
          .mul(cl(along.mul(S)))
          .mul(smoothstep(0.04, 0.1, aLen));
        // The orbit: the bony rim of the socket, dashed.
        const oc = p.sub(vec2(0.05, -0.22)).div(vec2(1.46, 1.1));
        const oe = length(oc);
        const og = length(oc.div(vec2(1.46, 1.1))).div(max(oe, 1e-3));
        const orbit = hair(abs(oe.sub(1)).div(max(og, 1e-3)).mul(S)).mul(
          dash(atan(oc.y, oc.x).mul(S)),
        );
        // Centre lines through the globe, long and short.
        const hLine = hair(abs(p.y.sub(GLOBE.cy)).mul(S))
          .mul(cl(p.x.mul(S)))
          .mul(step(abs(p.x), 1.5));
        const vLine = hair(abs(p.x.sub(GLOBE.cx)).mul(S))
          .mul(cl(p.y.mul(S)))
          .mul(step(p.y, 1.0))
          .mul(step(-1.38, p.y));
        const globe = max(max(par, mer).mul(onGlobe), sil);
        wireOut.assign(
          max(max(globe, max(cross, axis)), max(orbit.mul(0.85), max(hLine, vLine).mul(0.6))).mul(
            wireK,
          ),
        );
      });

      out.x.assign(clamp(ink, 0, 1));
      out.y.assign(cons.mul(consK));
      out.z.assign(clamp(wireOut, 0, 1));
      // The opening, for what is laid on the eye later (the hand's iris colour): under the lids, none.
      out.w.assign(inOpen);
    });
    return out;
  })();
}
