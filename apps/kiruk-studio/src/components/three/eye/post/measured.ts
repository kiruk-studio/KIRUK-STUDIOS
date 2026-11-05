/**
 * 2026, measured (docs/ERA_2026_MEASURED_PLAN.md). The interface no longer
 * sees a face: it sees landmarks, a gaze, a pupil's diameter, a dwell, and it
 * measures the visitor back.
 *
 * A clean black-and-white plate under instruments drawn the way a technical
 * illustration is drawn: hairlines in three weights, a few bright nodes,
 * numerals in Geist Mono (the loader has no words), callouts on elbow
 * leaders, front halves solid and back halves dashed. Nothing moves for
 * decoration: a line moves because what it measures moved.
 *
 *   L0 plate         the whole face, crisp, the darks lifted, a fine grain
 *   L1 registration  axes through the pupil as millimetre rulers, the
 *                    opening's box, crop marks and the frame's own readouts
 *                    (time, the eye's turn and pupil, a pupil trace, counts)
 *   L2 geometry      pupil and limbus fits, a protractor, and the gimbal: the
 *                    globe's three great circles, turning with the gaze
 *   L3 landmarks     twelve points acquired as a scan ring passes them,
 *                    called out as n + x - y
 *   L4 you           reticle, gaze line, scanpath, your attention as contours
 *   L5 sign          lock-on brackets round the iris
 *
 * Press captures the eye into blocks (ref 4); going in, they run out past the
 * frame and it floods to the home's white.
 */

import { type N, T } from '../nodes/tsl';
import {
  almond,
  cellPx,
  cornea,
  develop,
  easeInCubic,
  easeInOutSine,
  easeInQuad,
  easeOutCubic,
  hair,
  hash,
  hex,
  lc,
  luma,
  type MediumFrame,
  px,
} from './medium-kit';
import {
  after,
  brackets,
  dashes,
  degrees,
  dialText,
  digits,
  discAt,
  G,
  glyphAtlas,
  glyphRow,
  readout,
  readoutW,
  ringAt,
  segment,
  stroke,
  within,
} from './readout';

const {
  If,
  abs,
  atan,
  clamp,
  cos,
  cross,
  dot,
  exp,
  float,
  floor,
  fract,
  int,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  pow,
  radians,
  select,
  sin,
  smoothstep,
  sqrt,
  step,
  texture,
  vec2,
  vec3,
} = T;

export interface MeasuredScene {
  F: MediumFrame;
  /** The medium's uniforms (uniforms.ts `medium`). */
  M: N;
  /** The finished frame at a UV, display-referred. */
  at: (q: N) => N;
  uv: N;
  /** The sign's presence (0 during a cut). */
  sign: N;
}

/** The frame as 2026 measures it, display-referred. */
export function measured({ F, M, at, uv, sign }: MeasuredScene): N {
  const { p, size, H, kc, e, pc, R, pupilR } = F;
  const glyphs = texture(glyphAtlas());
  /** Lab: whether layer k draws (the exploded view); 1 normally. */
  const layer = (k: number) => mod(floor(M.layers.div(2 ** k)), 2);
  /** 1 when things may move, 0 under reduced motion. */
  const live = float(1).sub(M.steady);

  // ---- L0 the plate ---------------------------------------------------------
  // the whole face, crisp (an unsharp mask a pixel out), the darks lifted so
  // the dark skin keeps every pore and hair, a gentle S so the blacks have
  // weight, the reflected page held in the middle greys, a fine grain
  const o1 = vec2(max(kc.mul(1.2), 1)).div(size);
  const lAt = (q: N) => luma(at(q));
  const l0 = lAt(uv);
  const m = lAt(uv.add(vec2(o1.x, 0)))
    .add(lAt(uv.sub(vec2(o1.x, 0))))
    .add(lAt(uv.add(vec2(0, o1.y))))
    .add(lAt(uv.sub(vec2(0, o1.y))))
    .mul(0.25);
  const lf = pow(clamp(lc(l0, m, 0.75), 0, 1), 0.74).toVar();
  lf.assign(mix(lf, lf.mul(lf).mul(float(3).sub(lf.mul(2))), 0.3));
  const L = mix(lf, develop(l0, 1, 0.45, float(1), 0.1, 0.8), cornea(F, p)).toVar();
  // arriving, the camera's exposure settles out of white
  L.assign(mix(float(1), L, easeOutCubic(M.arr)));
  L.addAssign(
    hash(floor(p).add(M.seed.mul(97.31)))
      .sub(0.5)
      .mul(0.065),
  );
  const vu = uv.sub(0.5).mul(vec2(size.x.div(H), 1));
  L.mulAssign(float(1).sub(dot(vu, vu).mul(0.18)));
  const plate = mix(
    hex('#1c1c1c'),
    mix(hex('#0f0f0f'), hex('#eeede9'), clamp(L, 0, 1)),
    layer(0),
  ).toVar();

  // ---- the instruments ------------------------------------------------------
  // They build themselves after the cut, as the lids open (all at once under
  // reduced motion), and fold away as the lids close.
  const t = max(M.since, M.steady.mul(100));
  const gone = float(1)
    .sub(easeInQuad(M.dep))
    .mul(smoothstep(0.3, 0.9, M.arr));
  const w = hair(F, 1);
  const th = max(kc.mul(20), H.mul(0.0155));
  /** Pixels a millimetre: the iris is 12 mm across. */
  const mm = R.div(6);
  const ov = float(0).toVar();
  const glow = float(0).toVar();
  let only: N = layer(1);
  const lay = (a: N, k: N | number) => ov.assign(max(ov, a.mul(k).mul(only)));
  /** A primary node: a bright dot with a soft halo (ref 2). */
  const node = (c: N, r: N, k: N | number) => {
    const dd = length(p.sub(c));
    lay(clamp(r.add(0.5).sub(dd), 0, 1), k);
    glow.assign(
      max(
        glow,
        exp(dd.mul(dd).div(r.mul(r).mul(-8)))
          .mul(k)
          .mul(only),
      ),
    );
  };
  const d = p.sub(pc);
  const r = length(d);
  // the angle from twelve o'clock, clockwise, 0..1 (rings sweep round it)
  const turn = fract(atan(d.x, d.y.negate()).div(Math.PI * 2));
  const sweep = (a0: number) => step(turn, easeInOutSine(after(t, a0, 0.75)));
  const dash = px(F, 5);
  const awM = M.apX.x.mul(H);
  const awL = M.apX.y.mul(H);
  const upY = M.apY.x.mul(H);
  const loY = M.apY.y.mul(H);
  // (in a blink the tracker loses the eye: its fits and readings drop out)
  const lock = smoothstep(R.mul(0.4), R.mul(1.1), upY.add(loY));
  const k1080 = float(1080).div(H);
  const sgn = (x: N) => select(x.lessThan(0), float(-1), float(1));

  // ---- L1 registration --------------------------------------------------------
  // Dashed axes through the pupil, edge to edge, leaving the iris clear. Each
  // is a millimetre ruler: a tick a millimetre, longer every five, numbered
  // every five from the pupil's centre.
  const reach = easeOutCubic(after(t, 0, 0.45))
    .mul(size.x)
    .mul(gone);
  const axis = (along: N, across: N) => {
    lay(
      stroke(across, w)
        .mul(dashes(along, dash.mul(2)))
        .mul(within(along, R.mul(1.06), reach)),
      0.5,
    );
    const u = along.div(mm);
    const n = floor(u.add(0.5));
    const major = step(mod(n, 5), 0.5);
    const len = mix(px(F, 3), px(F, 7), major);
    const tick = stroke(u.sub(n).mul(mm), w)
      .mul(step(0, across))
      .mul(step(across, len))
      .mul(within(along, R.mul(1.1), reach));
    lay(tick, mix(float(0.32), float(0.6), major));
  };
  axis(abs(d.x), d.y);
  axis(abs(d.y), d.x);
  {
    const n2 = readoutW(th, 2);
    const nx = floor(abs(d.x).div(mm.mul(5)).add(0.5)).mul(5);
    const cx = pc.x.add(sgn(d.x).mul(nx).mul(mm));
    const okx = step(R.mul(1.1), nx.mul(mm)).mul(step(nx.mul(mm), reach));
    lay(
      readout(p, vec2(cx.sub(n2.mul(0.5)), pc.y.add(px(F, 6))), th, digits(nx, 2), glyphs),
      okx.mul(0.6),
    );
    const ny = floor(abs(d.y).div(mm.mul(5)).add(0.5)).mul(5);
    const cy = pc.y.add(sgn(d.y).mul(ny).mul(mm));
    const oky = step(R.mul(1.1), ny.mul(mm)).mul(step(ny.mul(mm), reach));
    lay(
      readout(p, vec2(pc.x.add(px(F, 9)), cy.sub(th.mul(0.5))), th, digits(ny, 2), glyphs),
      oky.mul(0.6),
    );
  }
  // the opening's dashed box, canthus to canthus and apex to apex: it
  // breathes with the lids and folds flat in a blink
  {
    const bpad = R.mul(0.12);
    const bLo = vec2(e.x.sub(awM).sub(bpad), e.y.sub(upY).sub(bpad));
    const bHi = vec2(e.x.add(awL).add(bpad), e.y.add(loY).add(bpad));
    const bq = abs(p.sub(bLo.add(bHi).mul(0.5))).sub(bHi.sub(bLo).mul(0.5));
    const box = length(max(bq, 0)).add(min(max(bq.x, bq.y), 0));
    lay(stroke(box, w).mul(dashes(p.x.add(p.y), dash)), after(t, 0.35, 0.3).mul(0.32).mul(gone));
  }
  // The frame itself: crop marks in the corners, a column of dots under each
  // side's mark on the axis's rows (ref 2), and the frame's readouts.
  const cm = px(F, 22);
  const arm = px(F, 12);
  // (the bottom corners sit higher: the loader's corner plates live below them)
  const lift = max(max(px(F, 30), H.mul(0.045)), M.foot.sub(cm));
  const hud = after(t, 0.2, 0.3).mul(gone);
  {
    // pressed, the crop marks leave the frame's corners and close on the eye's
    // opening, as a camera frames what it captures
    const cap = easeOutCubic(M.press).mul(float(1).sub(M.enter));
    const bpad = R.mul(0.3);
    const lo = mix(vec2(cm), vec2(e.x.sub(awM).sub(bpad), e.y.sub(upY).sub(bpad)), cap);
    const hi = mix(
      size.sub(vec2(cm, cm.add(lift))),
      vec2(e.x.add(awL).add(bpad), e.y.add(loY).add(bpad)),
      cap,
    );
    const mid = lo.add(hi).mul(0.5);
    // folded onto the nearest corner of the box lo..hi
    const qc = vec2(
      select(p.x.lessThan(mid.x), p.x.sub(lo.x), hi.x.sub(p.x)),
      select(p.y.lessThan(mid.y), p.y.sub(lo.y), hi.y.sub(p.y)),
    );
    const arm2 = arm.mul(float(1).add(cap.mul(1.5)));
    lay(
      max(
        stroke(qc.y, w.mul(float(1).add(cap))).mul(within(qc.x, 0, arm2)),
        stroke(qc.x, w.mul(float(1).add(cap))).mul(within(qc.y, 0, arm2)),
      ),
      hud.mul(mix(float(0.75), float(1), cap)),
    );
    const rowY = pc.y.add(floor(d.y.div(R.mul(1.1)).add(0.5)).mul(R.mul(1.1)));
    const inner = step(cm.add(arm).add(px(F, 30)), min(rowY, size.y.sub(rowY).sub(lift)));
    lay(
      max(
        discAt(p, vec2(cm, rowY), px(F, 1.5)),
        discAt(p, vec2(size.x.sub(cm), rowY), px(F, 1.5)),
      ).mul(inner),
      hud.mul(0.7),
    );
  }
  const top = cm.add(arm).add(px(F, 8));
  const foot = top.add(lift);
  const lineH = th.mul(0.95);
  const adv = readoutW(th, 1);
  // top left: how long the eye has been measured, m:ss.t
  {
    const ds = floor(M.since.mul(10));
    const secs = mod(floor(ds.div(10)), 60);
    const mins = mod(floor(ds.div(600)), 100);
    const tenth = mod(ds, 10).mul(live);
    lay(
      readout(
        p,
        vec2(cm, top),
        th,
        [...digits(mins, 2), G.colon, ...digits(secs, 2), G.dot, tenth],
        glyphs,
      ),
      hud.mul(0.8),
    );
  }
  // top right: the eye's turn (yaw, pitch) and its pupil, each with a mark
  {
    const rowW = adv.mul(7);
    const x0 = size.x.sub(cm).sub(rowW);
    const icon = x0.add(adv.mul(0.5));
    const meas = hud.mul(lock).mul(0.85);
    const pmm = floor(M.pupilMm.mul(100).add(0.5));
    const [m2, m1, m0] = digits(min(pmm, 999), 3);
    const rows: (N | number)[][] = [
      degrees(M.gazeDeg.x),
      degrees(M.gazeDeg.y),
      [G.blank, G.blank, m2, G.dot, m1, m0],
    ];
    rows.forEach((chars, j) => {
      const y = top.add(lineH.mul(j));
      lay(readout(p, vec2(x0.add(adv), y), th, chars, glyphs), meas);
      const ym = y.add(th.mul(0.5));
      const hw = th.mul(0.18);
      const ic = vec2(icon, ym);
      const mark =
        j === 0
          ? max(
              stroke(p.y.sub(ym), w).mul(within(abs(p.x.sub(icon)), 0, hw)),
              stroke(abs(p.x.sub(icon)).sub(hw), w).mul(within(abs(p.y.sub(ym)), 0, hw.mul(0.5))),
            )
          : j === 1
            ? max(
                stroke(p.x.sub(icon), w).mul(within(abs(p.y.sub(ym)), 0, hw)),
                stroke(abs(p.y.sub(ym)).sub(hw), w).mul(within(abs(p.x.sub(icon)), 0, hw.mul(0.5))),
              )
            : max(ringAt(p, ic, hw, w), discAt(p, ic, hw.mul(0.35)));
      lay(mark, meas);
    });
  }
  // bottom right: how many places you have rested, and how many blinks
  {
    const rowW = adv.mul(5);
    const x0 = size.x.sub(cm).sub(rowW);
    const y1 = size.y.sub(foot).sub(th);
    const y0 = y1.sub(lineH);
    const hw = th.mul(0.18);
    lay(
      readout(p, vec2(x0.add(adv.mul(2)), y0), th, digits(min(M.fixTotal, 999), 3), glyphs),
      hud.mul(0.8),
    );
    lay(
      readout(p, vec2(x0.add(adv.mul(2)), y1), th, digits(min(M.blinks, 999), 3), glyphs),
      hud.mul(0.8),
    );
    const c0 = vec2(x0.add(adv.mul(0.5)), y0.add(th.mul(0.5)));
    lay(max(ringAt(p, c0, hw, w), discAt(p, c0, px(F, 1))), hud.mul(0.8));
    // a shut eye: the lower lid's arc and three lashes
    const c1 = vec2(x0.add(adv.mul(0.5)), y1.add(th.mul(0.42)));
    const q1 = p.sub(c1);
    const lashes = stroke(q1.x, w)
      .mul(within(q1.y, hw.mul(1.05), hw.mul(1.5)))
      .add(stroke(abs(q1.x).sub(hw.mul(0.75)), w).mul(within(q1.y, hw.mul(0.75), hw.mul(1.2))));
    lay(max(ringAt(p, c1, hw, w).mul(step(0, q1.y)), min(lashes, 1)), hud.mul(0.8));
  }
  // bottom left: the pupil over the last six seconds, a tick a second, and its value now
  {
    const sbW = th.mul(7);
    const sbH = th.mul(1.3);
    const so = vec2(cm, size.y.sub(foot).sub(sbH));
    const sq = p.sub(so);
    const yAt = (j: N) =>
      sbH.mul(float(1).sub(clamp(M.pupilHist.element(int(j)).sub(2).div(4), 0, 1)));
    const ptAt = (j: N) => vec2(j.mul(sbW.div(31)), yAt(j));
    const spark = float(0).toVar();
    If(
      sq.x
        .greaterThan(-3)
        .and(sq.x.lessThan(sbW.add(3)))
        .and(sq.y.greaterThan(-3))
        .and(sq.y.lessThan(sbH.add(3))),
      () => {
        const k = clamp(floor(sq.x.div(sbW.div(31))), 0, 30);
        let dmin: N = float(1e4);
        for (const o of [-1, 0, 1]) {
          const j = clamp(k.add(o), 0, 30);
          dmin = min(dmin, segment(sq, ptAt(j), ptAt(j.add(1))).d);
        }
        spark.assign(stroke(dmin, w));
      },
    );
    lay(spark, hud.mul(0.85));
    lay(stroke(sq.y.sub(sbH.add(px(F, 4))), w).mul(within(sq.x, 0, sbW)), hud.mul(0.35));
    const sec = abs(fract(sq.x.div(sbW.div(6)).add(0.5)).sub(0.5)).mul(sbW.div(6));
    lay(
      stroke(sec, w)
        .mul(within(sq.y, sbH.add(px(F, 4)), sbH.add(px(F, 8))))
        .mul(within(sq.x, -1, sbW.add(1))),
      hud.mul(0.45),
    );
    node(so.add(ptAt(float(31))), px(F, 1.8), hud);
    const pmm = floor(M.pupilMm.mul(100).add(0.5));
    const [m2, m1, m0] = digits(min(pmm, 999), 3);
    lay(
      readout(
        p,
        vec2(so.x.add(sbW).add(px(F, 10)), so.y.add(sbH.mul(0.5)).sub(th.mul(0.5))),
        th,
        [m2, G.dot, m1, m0],
        glyphs,
      ),
      hud.mul(0.8),
    );
  }

  // ---- L2 geometry --------------------------------------------------------------
  only = layer(2);
  // the pupil's fit, and the limbus's (the primary instrument, heavier): a
  // double ring, a tick every 10°, longer every 90°; the pupil's centre a
  // bright node
  lay(ringAt(p, pc, pupilR, w), sweep(0.15).mul(0.75).mul(gone).mul(lock));
  const tickOut = (n: number, r0: N, len: N) =>
    stroke(
      abs(fract(turn.mul(n).add(0.5)).sub(0.5))
        .mul((Math.PI * 2) / n)
        .mul(r),
      w,
    ).mul(within(r, r0, r0.add(len)));
  lay(
    max(max(ringAt(p, pc, R, w.mul(1.6)), tickOut(36, R, R.mul(0.05))), tickOut(4, R, R.mul(0.13))),
    sweep(0.2).mul(0.8).mul(gone).mul(lock),
  );
  lay(ringAt(p, pc, R.add(px(F, 3.5)), w), sweep(0.22).mul(0.28).mul(gone).mul(lock));
  node(pc, px(F, 2), after(t, 0.3, 0.2).mul(gone).mul(lock));
  // a protractor at 1.45R: ticks inward every 5°, longer every 15°, the
  // angle set round it every 30°, read clockwise from twelve (ref 1)
  const RP = R.mul(1.45);
  lay(
    max(
      max(ringAt(p, pc, RP, w), tickOut(72, RP.sub(R.mul(0.03)), R.mul(0.03))),
      tickOut(24, RP.sub(R.mul(0.07)), R.mul(0.07)),
    ),
    sweep(0.3).mul(0.45).mul(gone),
  );
  lay(dialText(p, pc, RP.add(px(F, 3)), th, 30, 3, glyphs), sweep(0.35).mul(0.6).mul(gone));
  node(pc.sub(vec2(0, RP)), px(F, 2.4), after(t, 0.6, 0.2).mul(gone));
  // The gimbal: the globe (24 mm across, round its centre) drawn as three
  // great circles that turn with the gaze in three dimensions: the equator
  // the iris sits in, and two rings crossing the gaze axis, each tipped 28°
  // toward us so they read as ellipses even while she looks straight out.
  // Front halves solid, back halves dashed. Arriving they swing into place;
  // over the iris they turn about the gaze axis, scanning it.
  {
    const RG = R.mul(2);
    const yaw = radians(M.gazeDeg.x);
    const pitch = radians(M.gazeDeg.y);
    // (screen space: x right, y down, z toward the viewer)
    const g = vec3(sin(yaw).mul(cos(pitch)), sin(pitch).negate(), cos(yaw).mul(cos(pitch)));
    const b0 = vec3(cos(yaw), 0, sin(yaw).negate());
    const c0 = normalize(cross(g, b0));
    const a = M.spin.add(
      float(1)
        .sub(easeOutCubic(after(t, 0.45, 1.5)))
        .mul(2.4),
    );
    const tip = (v: N) => normalize(v.mul(Math.cos(0.49)).add(g.mul(Math.sin(0.49))));
    const nB = tip(b0.mul(cos(a)).add(c0.mul(sin(a))));
    const nC = tip(c0.mul(cos(a)).sub(b0.mul(sin(a))));
    const great = (n: N, k: N) => {
      const kk = length(n.xy);
      const mdir = select(kk.greaterThan(1e-4), n.xy.div(max(kk, 1e-4)), vec2(0, 1));
      const q = p.sub(e);
      const fx = dot(q, vec2(mdir.y.negate(), mdir.x)).div(RG);
      const bb = max(RG.mul(abs(n.z)), 0.75);
      const fy = dot(q, mdir).div(bb);
      const f = fx.mul(fx).add(fy.mul(fy)).sub(1);
      const gr = length(vec2(fx.div(RG), fy.div(bb))).mul(2);
      const dist = f.div(max(gr, 1e-5));
      // the point's depth, a share of the radius: which half faces us
      const z = fy.mul(kk).mul(sgn(n.z).negate());
      const front = smoothstep(-0.05, 0.05, z);
      const solid = mix(dashes(atan(fy, fx).mul(RG), dash.mul(1.2)).mul(0.45), float(1), front);
      lay(stroke(dist, w).mul(solid), k);
    };
    const on = after(t, 0.4, 0.4).mul(gone);
    great(g, on.mul(0.42));
    great(nB, on.mul(0.36));
    great(nC, on.mul(0.36));
    // the gaze axis, from the globe's centre to its front pole
    const pole = e.add(g.xy.mul(RG));
    lay(stroke(segment(p, e, pole).d, w), on.mul(0.55).mul(lock));
    node(pole, px(F, 2.6), on.mul(lock));
  }

  // ---- L3 landmarks ---------------------------------------------------------------
  only = layer(3);
  // the re-measure: still for 1.5 s, one dashed line sweeps down the frame,
  // then again every 6 s; what it passes is measured again
  const ph = mod(max(M.idle.sub(1.5), 0), 6);
  const sy = ph.div(1.6).mul(H);
  const sweeping = step(1.5, M.idle).mul(step(ph, 1.6)).mul(live).mul(gone);
  lay(stroke(p.y.sub(sy), w).mul(dashes(p.x, dash.mul(2))), sweeping.mul(0.5));
  // the trackers are sure when nothing moves, and less sure the more it does
  const doubt = float(1)
    .add(M.listen.mul(1.6))
    .mul(mix(float(1), float(0.75), smoothstep(1.5, 3, M.idle)));
  // the scan that acquires them: a ring running out from the pupil after the cut
  const scanR = after(t, 0.35, 1).mul(R.mul(3.4));
  lay(
    ringAt(p, pc, scanR, w.mul(1.5)),
    step(0.001, scanR)
      .mul(float(1).sub(after(t, 1.05, 0.3)))
      .mul(0.85)
      .mul(gone),
  );
  // Twelve points, each built from the lid opening as the lids stand this
  // frame, so they ride every blink and saccade. Each is acquired as the scan
  // passes it (a square closes on it), keeps a faint circle of confidence,
  // and is called out on an elbow leader: n + x - y, in pixels of a
  // 1080-high frame, its digits running until they lock.
  const lid = (fx: number, upper: boolean) => {
    const sx = Math.max(1 - fx * fx, 0) ** 0.75;
    const x = e.x.add((fx < 0 ? awM : awL).mul(fx));
    return vec2(x, upper ? e.y.sub(upY.mul(sx)) : e.y.add(loY.mul(sx)));
  };
  const fixed = (x: number, y: number) => e.add(vec2(R.mul(x), R.mul(y)));
  // (position, confidence radius in R, a minor point whose callout shows only
  // where the eye is big enough for callouts not to collide, its leader's way)
  const marks: [N, number, boolean, number, number][] = [
    [lid(-1, true), 0.5, false, -1, -1],
    [lid(1, true), 0.42, false, 1, -1],
    [lid(-0.5, true), 0.3, true, -1, -1],
    [lid(0, true), 0.36, false, 1, -1],
    [lid(0.5, true), 0.28, true, 1, -1],
    [lid(-0.4, false), 0.34, true, -1, 1],
    [lid(0.45, false), 0.4, true, 1, 1],
    [fixed(0.1, -1.05), 0.55, true, -1, -1],
    [fixed(-1.3, -1.72), 0.62, true, -1, 1],
    [fixed(0.3, -1.86), 0.7, false, 1, 1],
    [fixed(1.9, -1.64), 0.58, true, 1, 1],
    [fixed(-0.2, 1.3), 0.66, false, 1, 1],
  ];
  const roomy = smoothstep(5.5, 7, R.div(th));
  const L1 = max(R.mul(0.24), px(F, 12));
  const lw = readoutW(th, 16);
  const tick24 = floor(t.mul(24));
  const pp = M.ptr.mul(size);
  marks.forEach(([q, rc, minor, sx, sy2], i) => {
    const ti = float(0.35).add(length(q.sub(pc)).div(R.mul(3.4)));
    const on = after(t, ti, 0.12).mul(gone);
    // pointed at, a point is inspected: acquired again, its circle tight,
    // its callout shown and bright
    const near = float(1)
      .sub(smoothstep(R.mul(0.12), R.mul(0.4), length(pp.sub(q))))
      .mul(M.track)
      .mul(float(1).sub(M.hover));
    const sq = mix(mix(px(F, 14), px(F, 4), easeOutCubic(after(t, ti, 0.3))), px(F, 6), near);
    lay(
      brackets(p, q, sq, sq.mul(0.5), w),
      max(after(t, ti, 0.05).mul(float(1).sub(after(t, ti.add(0.45), 0.3))), near)
        .mul(0.9)
        .mul(gone),
    );
    const flash = float(1)
      .sub(smoothstep(0, R.mul(0.25), abs(q.y.sub(sy))))
      .mul(sweeping);
    lay(
      ringAt(
        p,
        q,
        R.mul(rc)
          .mul(easeOutCubic(after(t, ti, 0.4)))
          .mul(doubt)
          .mul(float(1).sub(flash.mul(0.3)).sub(near.mul(0.55))),
        w,
      ),
      on.mul(float(0.16).add(flash.mul(0.5)).add(near.mul(0.6))),
    );
    lay(discAt(p, q, px(F, 1.8)), on);
    const vis = max(minor ? roomy : float(1), near);
    // (a callout that would leave the frame turns back in)
    const run0 = L1.mul(0.7071).add(lw).add(px(F, 12));
    const hx = select(
      q.x
        .add(run0.mul(sx))
        .lessThan(cm)
        .or(q.x.add(run0.mul(sx)).greaterThan(size.x.sub(cm))),
      float(-sx),
      float(sx),
    );
    const reachY = q.y.add(L1.mul(0.7071).add(th).mul(sy2));
    const vy = select(
      reachY.lessThan(cm).or(reachY.greaterThan(size.y.sub(cm))),
      float(-sy2),
      float(sy2),
    );
    const e1 = q.add(vec2(hx, vy).mul(L1.mul(0.7071)));
    const e2 = e1.add(vec2(lw.add(px(F, 8)).mul(hx), 0));
    const drawn = easeOutCubic(after(t, ti.add(0.08), 0.3)).mul(2);
    const s1 = segment(p, q, e1);
    const s2 = segment(p, e1, e2);
    const bright = float(0.5).add(near.mul(0.5));
    lay(stroke(s1.d, w).mul(step(s1.t, drawn)), on.mul(bright).mul(vis));
    lay(stroke(s2.d, w).mul(step(s2.t, drawn.sub(1))), on.mul(bright).mul(vis));
    const o = vec2(min(e1.x, e2.x).add(px(F, 4)), e1.y.sub(th.mul(0.8)));
    const running = live.mul(step(t, ti.add(0.6)));
    const run = (v: N, n: number, salt: number) =>
      digits(v, n).map((dg, j) =>
        select(running.greaterThan(0.5), floor(hash(vec2(i * 13 + salt + j, tick24)).mul(10)), dg),
      );
    const lbl = [
      ...digits(float(i + 1), 2),
      G.blank,
      G.plus,
      G.blank,
      ...run(floor(q.x.mul(k1080)), 4, 0),
      G.blank,
      G.minus,
      G.blank,
      ...run(floor(q.y.mul(k1080)), 4, 5),
    ];
    lay(
      readout(p, o, th, lbl, glyphs),
      after(t, ti.add(0.2), 0.12)
        .mul(float(0.85).add(near.mul(0.15)))
        .mul(gone)
        .mul(vis),
    );
  });

  // ---- L4 you ----------------------------------------------------------------------
  // A reticle on your pointer or finger, a little behind it (the tracker's
  // lag), with your x - y; the dashed line from her pupil to it; and your
  // scanpath: where you rested, numbered, with how long, joined in order
  // (eye tracking's own notation, turned on you), over your attention drawn
  // as a contour map.
  only = layer(4);
  const you = M.track.mul(after(t, 0.6, 0.3)).mul(gone);
  const free = float(1).sub(M.hover);
  {
    const rr0 = px(F, 10);
    const rd = p.sub(pp);
    const cross4 = max(
      stroke(rd.x, w).mul(within(abs(rd.y), rr0.mul(1.4), rr0.mul(2.1))),
      stroke(rd.y, w).mul(within(abs(rd.x), rr0.mul(1.4), rr0.mul(2.1))),
    );
    lay(max(ringAt(p, pp, rr0, w), cross4), you.mul(free).mul(0.9));
    node(pp, px(F, 1.6), you.mul(free));
    lay(
      readout(
        p,
        pp.add(vec2(rr0.mul(2.3), rr0.mul(0.4))),
        th,
        [
          ...digits(floor(pp.x.mul(k1080)), 4),
          G.blank,
          G.minus,
          G.blank,
          ...digits(floor(pp.y.mul(k1080)), 4),
        ],
        glyphs,
      ),
      you.mul(free).mul(0.85),
    );
    const sg = segment(p, pc, pp);
    const gl = length(pp.sub(pc));
    const along = sg.t.mul(gl);
    const span = within(along, R.mul(1.06), gl.sub(rr0.mul(2.2)));
    lay(
      stroke(sg.d, w)
        .mul(dashes(along, dash.mul(1.2)))
        .mul(span),
      you.mul(free).mul(0.55),
    );
    // how far your pointer is from her pupil, mm, set along the line
    // (turned so it always reads left to right), at the middle of its free part
    const dir0 = pp.sub(pc).div(max(gl, 1));
    const dir = dir0.mul(sgn(dir0.x));
    const nrm = vec2(dir.y, dir.x.negate());
    const dmm = floor(gl.div(mm).mul(10).add(0.5));
    const [g3, g2, g1, g0] = digits(min(dmm, 9999), 4);
    const chars = [select(dmm.lessThan(1000), float(G.blank), g3), g2, g1, G.dot, g0];
    const tw = readoutW(th, 5);
    const midp = pc.add(
      dir0.mul(
        R.mul(1.06)
          .add(gl.sub(rr0.mul(2.2)))
          .mul(0.5),
      ),
    );
    const o = midp.sub(dir.mul(tw.mul(0.5))).add(nrm.mul(th.mul(0.85)));
    const lq = vec2(dot(p.sub(o), dir), dot(p.sub(o), nrm.negate()));
    lay(
      glyphRow(lq, th, chars, glyphs),
      you
        .mul(free)
        .mul(step(R.mul(2.4).add(tw), gl))
        .mul(0.8),
    );
  }
  {
    const heat = float(0).toVar();
    const hg = vec2(0).toVar();
    for (let i = 0; i < 6; i++) {
      const f = M.fix.element(i);
      const fp = f.xy.mul(size);
      const fa = f.w.mul(you);
      const s2 = R.mul(float(0.32).add(min(f.z, 4).mul(0.22)));
      const dq = p.sub(fp);
      const gi = exp(dot(dq, dq).div(s2.mul(s2)).negate())
        .mul(fa)
        .mul(float(0.5).add(min(f.z.mul(0.5), 1).mul(0.5)));
      heat.addAssign(gi);
      hg.addAssign(dq.mul(gi).mul(float(-2).div(s2.mul(s2))));
      lay(ringAt(p, fp, px(F, 5), w), fa.mul(0.8));
      lay(discAt(p, fp, px(F, 1.6)), fa);
      const ds = floor(min(f.z, 9.99).mul(100));
      const [d2, d1, d0] = digits(ds, 3);
      lay(
        readout(
          p,
          fp.add(vec2(px(F, 9), th.mul(-1.05))),
          th,
          [...digits(M.fixN.element(i), 2), G.blank, d2, G.dot, d1, d0],
          glyphs,
        ),
        fa.mul(0.85),
      );
      if (i > 0) {
        const gp = M.fix.element(i - 1);
        lay(stroke(segment(p, gp.xy.mul(size), fp).d, w), min(fa, gp.w.mul(you)).mul(0.45));
      }
    }
    // contours every 0.22 of attention, a pixel wide wherever the slope is,
    // dotted (a map's texture, so your attention never reads as an instrument)
    const lev = 0.22;
    const dl = abs(fract(heat.div(lev).add(0.5)).sub(0.5))
      .mul(lev)
      .div(max(length(hg), 1e-6));
    const dots = step(fract(p.x.add(p.y).div(px(F, 4))), 0.5);
    lay(stroke(dl, w).mul(dots), smoothstep(0.11, 0.2, heat).mul(0.4));
  }

  // ---- L5 the sign ------------------------------------------------------------------
  // Four corner brackets frame the iris, breathing slowly. Over it they lock
  // on, in to the limbus, and the pupil's reading appears at their corner;
  // pressed, they close on the pupil.
  only = layer(5);
  {
    const breath = sin(M.clock.mul(1.3)).mul(0.02).mul(live);
    const ba = R.mul(mix(mix(float(1.2).add(breath), float(1.06), M.hover), float(0.9), M.press));
    lay(
      brackets(p, pc, ba, R.mul(0.2), w.mul(mix(float(1.2), float(2), M.hover))).mul(
        almond(F, p, 2.2),
      ),
      sign.mul(0.95).mul(gone),
    );
    const big = th.mul(1.7);
    const pmm = floor(M.pupilMm.mul(100).add(0.5));
    const [m2, m1, m0] = digits(min(pmm, 999), 3);
    lay(
      readout(
        p,
        pc.add(vec2(ba.add(px(F, 6)), ba.negate().sub(big.mul(0.75)))),
        big,
        [m2, G.dot, m1, m0],
        glyphs,
      ),
      M.hover.mul(sign).mul(lock).mul(gone),
    );
  }

  // the instruments in white, turning near-black where they cross the white
  // of the eye or the reflected page, so they read everywhere; the bright
  // nodes glow a little over the dark
  const pl = luma(plate);
  const darkInk = smoothstep(0.6, 0.82, pl);
  const c = mix(plate, mix(hex('#f4f4f2'), hex('#141414'), darkInk), clamp(ov, 0, 1))
    .add(glow.mul(0.16).mul(float(1).sub(darkInk)))
    .toVar();

  // ---- press: capture (ref 4) -------------------------------------------------------
  // The eye breaks into rows of glassy blocks pushed out sideways from the
  // iris's edge, lit along their tops, a thin spectral edge on each: the one
  // moment of colour in 2026. Going in, the blocks run out past the frame,
  // then it floods to the home's white.
  If(M.press.add(M.enter).greaterThan(0.001), () => {
    const ent = easeInCubic(M.enter);
    // (still under reduced motion: a captured frame, not a flicker)
    const tl = M.clock.mul(live);
    const pr = max(easeOutCubic(M.press), ent);
    const bs = cellPx(F, 13);
    const row = floor(d.y.div(bs));
    const yc = row.add(0.5).mul(bs);
    const rh = hash(vec2(row, 3.7));
    const band = step(abs(yc), mix(R.mul(0.98), H, ent));
    const edge = sqrt(max(R.mul(R).sub(yc.mul(yc)), 0));
    const len = rh.mul(0.9).add(0.2).mul(R.mul(1.7)).mul(pr).add(size.x.mul(ent));
    const xo = abs(d.x).sub(edge);
    const streak = band.mul(step(0, xo)).mul(step(xo, len)).mul(step(0.001, pr));
    const bi = floor(xo.div(bs));
    const bx = fract(xo.div(bs)).mul(bs);
    const by = fract(d.y.div(bs)).mul(bs);
    const face = within(bx, 0.5, bs.sub(1)).mul(within(by, 0.5, bs.sub(1)));
    // each block carries the colour at the iris's edge on its row, lighter
    // (glass), dimming as it runs out; a few catch the light
    const src = luma(
      at(vec2(pc.x.add(sgn(d.x).mul(max(edge.sub(bs.mul(0.5)), 0))), pc.y.add(yc)).div(size)),
    );
    const bh = hash(vec2(bi, row));
    const bl = mix(pow(src, 0.72), float(1), float(0.3).add(bh.mul(0.35)))
      .mul(float(1).sub(bi.mul(bs).div(max(len, 1)).mul(0.5)))
      .toVar();
    bl.assign(max(bl, step(0.95, hash(vec2(bi.add(floor(tl.mul(4))), row))).mul(0.95)));
    const lit = stroke(by.sub(1), 1).mul(face);
    const hue = fract(bi.mul(0.13).add(row.mul(0.071)).add(tl.mul(0.15)));
    const spec = vec3(0.5).add(
      vec3(0.5).mul(cos(vec3(hue, hue.add(0.33), hue.add(0.67)).mul(Math.PI * 2))),
    );
    const fringe = stroke(bx.sub(bs.sub(1.5)), 1.5).mul(face);
    c.assign(
      mix(
        c,
        mix(vec3(bl), vec3(1), lit.mul(0.7)).add(spec.sub(0.5).mul(fringe).mul(0.35)),
        streak.mul(face),
      ),
    );
    // inside the iris the eye itself is captured into the same blocks
    const inI = step(r, R.mul(0.98)).mul(pr);
    const bc = floor(p.div(bs)).add(0.5).mul(bs);
    const vx = mix(
      vec3(pow(luma(at(bc.div(size))), 0.72)),
      vec3(1),
      stroke(fract(p.y.div(bs)).mul(bs).sub(1), 1).mul(0.45),
    );
    c.assign(mix(c, vx, inI.mul(within(fract(p.x.div(bs)).mul(bs), 0.5, bs.sub(1)))));
    // the shutter: one soft flash as the press lands
    c.assign(mix(c, vec3(1), M.press.mul(float(1).sub(M.press)).mul(0.5).mul(live)));
    c.assign(mix(c, hex('#fafafa'), smoothstep(0.55, 1, M.enter)));
  });
  return c;
}
