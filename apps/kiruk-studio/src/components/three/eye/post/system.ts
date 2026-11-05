/**
 * 2013, the system (docs/ERA_2013_SYSTEM_PLAN.md). 2013 is the year
 * interfaces became systems of components and colour came back: iOS 7,
 * Bootstrap 3, Flat UI, Metro, Atomic Design, the UI kit. So 2013 sees her
 * the way a design system sees everything: as components, every kit of the
 * year blended into one, and nothing else. No photograph is left.
 *
 * Layout by Atomic Design: the face is laid out like a page, and how much
 * detail a region holds decides how small its parts are. Where she is
 * smooth (cheek, forehead) the page holds templates: a login form, a
 * settings group, a search page. Where she has more, organisms: a search
 * bar, a nav bar, a form row, an alert, a list cell. Then molecules (an
 * input group, a labelled switch, a segmented control, a checkbox with its
 * label), and where she is finest (lashes, lid margins, brows) atoms:
 * dots, radios, checkboxes, sliders, switches, steppers, badges, buttons,
 * tiles. A quadtree of 2:1 cells, each split while the face's tone varies
 * across it.
 *
 * The iris is a dial: rings of components set radially round the pupil,
 * switches at the collarette, sliders for the fibres (each knob where the
 * fibre's tone puts it), segments at the limbus. The pupil is a keyboard
 * (iOS 7's), many keys.
 *
 * Every part is coloured from one palette blended from the year's systems,
 * solid and vivid, light to dark: white, iOS 7's yellow, amber, orange,
 * pink, magenta, Flat UI's amethyst, violet, indigo, navy, ink. Details sit
 * on it in white or ink, whichever reads.
 *
 * Depth: the scene's depth (the medium texture's alpha) lifts every part off
 * the page; higher parts cast longer shadows and move further against the
 * pointer.
 *
 * Life, every change a component changing state:
 *   arriving  atoms first, then molecules, organisms, templates (the order
 *             of Atomic Design), out from the eye; skeuomorphic gloss
 *             flattening as each lands (iOS 6 to 7)
 *   idle      parts demonstrate themselves now and then; stripes run;
 *             carets blink; at rest a focus runs round the limbus (the sign)
 *   pointer   parts near it lift, take the focus ring and switch on
 *   hover     the iris's sliders sweep round like an activity indicator and
 *             keys light up as if typed
 *   press     the iris and keyboard go active, a wave of active parts runs
 *             out over the face
 *   going in  the wave switches everything on, then the page is left
 */

import { type N, T } from '../nodes/tsl';
import {
  almond,
  easeInQuad,
  easeOutCubic,
  hair,
  hash,
  hex,
  luma,
  type MediumFrame,
} from './medium-kit';
import { after, stroke } from './readout';

const {
  Fn,
  If,
  abs,
  atan,
  clamp,
  cos,
  float,
  floor,
  fract,
  length,
  log2,
  max,
  min,
  mix,
  pow,
  select,
  sin,
  smoothstep,
  step,
  vec2,
  vec3,
  vec4,
} = T;

export interface SystemScene {
  F: MediumFrame;
  /** The medium's uniforms (uniforms.ts `medium`). */
  M: N;
  /** The finished frame, display-referred, its depth in alpha, as a mipmapped texture. */
  tex: N;
  uv: N;
  /** The sign's presence (0 during a cut). */
  sign: N;
}

/** The year's palette, every system blended, light to dark (relative luminance falls at every step). */
const RAMP = [
  '#ffffff',
  '#ffe45c',
  '#ffb300',
  '#ff7a1a',
  '#ff375f',
  '#e5157a',
  '#b23bdb',
  '#6b4cf0',
  '#3d3fd6',
  '#1b2266',
  '#0a0b1a',
];
/** iOS 7's blue (active, focus) and the light blue of its focus glow. */
const BLUE = '#007aff';
const GLOW = '#5ac8fa';

// The helpers and the components below are WGSL functions (Fn with a
// layout), each emitted once and called wherever it is used: inlined, the
// fifteen components and their palette lookups made the shader several
// hundred kilobytes and its compile many seconds.
const layout = (name: string, type: string, inputs: [string, string][]) => ({
  name,
  type,
  inputs: inputs.map(([n, t]) => ({ name: n, type: t })),
});

const rampFn = Fn(([d]: N[]) => {
  const x = clamp(d, 0, 1).mul(RAMP.length - 1);
  let c: N = hex(RAMP[RAMP.length - 1]);
  for (let i = RAMP.length - 2; i >= 0; i--)
    c = select(x.lessThan(i + 1), mix(hex(RAMP[i]), hex(RAMP[i + 1]), clamp(x.sub(i), 0, 1)), c);
  return c;
}).setLayout(layout('sys13Ramp', 'vec3', [['d', 'float']]));
/** The palette's colour for a darkness d (0 light, 1 dark). */
const ramp = (d: N | number) => rampFn(float(d));
const onColorFn = Fn(([c]: N[]) => mix(vec3(1), hex('#16163a'), step(0.62, luma(c)))).setLayout(
  layout('sys13On', 'vec3', [['c', 'vec3']]),
);
/** White on a dark fill, ink on a light one. */
const onColor = (c: N) => onColorFn(c);
const sdBoxFn = Fn(([q, b, r]: N[]) => {
  const d = abs(q).sub(b).add(r);
  return length(max(d, 0))
    .add(min(max(d.x, d.y), 0))
    .sub(r);
}).setLayout(
  layout('sys13Box', 'float', [
    ['q', 'vec2'],
    ['b', 'vec2'],
    ['r', 'float'],
  ]),
);
/** A rounded box's signed distance: q from its centre, half-size b, corner radius r. */
const sdBox = (q: N, b: N, r: N | number) => sdBoxFn(q, b, float(r));
const sdSegFn = Fn(([q, a, b]: N[]) => {
  const pa = q.sub(a);
  const ba = b.sub(a);
  const h = clamp(pa.dot(ba).div(max(ba.dot(ba), 1e-4)), 0, 1);
  return length(pa.sub(ba.mul(h)));
}).setLayout(
  layout('sys13Seg', 'float', [
    ['q', 'vec2'],
    ['a', 'vec2'],
    ['b', 'vec2'],
  ]),
);
/** The distance from q to the segment a–b. */
const sdSeg = (q: N, a: N, b: N) => sdSegFn(q, a, b);
/** Coverage inside a signed distance, anti-aliased over a pixel. */
const inside = (sd: N) => clamp(float(0.5).sub(sd), 0, 1);

/**
 * The group elements (post/system.ts), as functions of the colour so far,
 * the pixel in the element's frame, its half size and darkness (x, y, z),
 * its state (near the pointer, active, seed, demonstrating), the card under
 * it and the line widths (hairline, one pixel). Each returns the new colour.
 */
function elementKit(M: N) {
  const inputs: [string, string][] = [
    ['c', 'vec3'],
    ['q', 'vec2'],
    ['x', 'vec3'],
    ['s', 'vec4'],
    ['k', 'vec3'],
    ['h', 'vec2'],
  ];
  type Body = (a: {
    c: N;
    q: N;
    ex: N;
    ey: N;
    ed: N;
    near: N;
    act: N;
    uid: N;
    demo: N;
    card: N;
    w: N;
    one: N;
    live: N;
  }) => void;
  const mk = (name: string, body: Body) =>
    Fn(([c0, q, x, s, k, h]: N[]) => {
      const c = vec3(c0).toVar();
      body({
        c,
        q,
        ex: x.x,
        ey: x.y,
        ed: x.z,
        near: s.x,
        act: s.y,
        uid: s.z,
        demo: s.w,
        card: k,
        w: h.x,
        one: h.y,
        live: float(1).sub(M.steady),
      });
      return c;
    }).setLayout(layout(name, 'vec3', inputs));
  return {
    /** A line of text (no words: the bar it would fill), in the colour that reads on the card. */
    textBar: mk('sys13Text', ({ c, q, ex, ey, card }) => {
      c.assign(mix(c, mix(onColor(card), card, 0.2), inside(sdBox(q, vec2(ex, ey), ey))));
    }),
    /** A text field: its fill, a placeholder line, its caret. */
    field: mk('sys13Field', ({ c, q, ex, ey, ed, near, uid, w, one }) => {
      const f = ramp(ed);
      const fr = min(ey.mul(0.4), one.mul(3));
      c.assign(mix(c, f, inside(sdBox(q, vec2(ex, ey), fr))));
      c.assign(mix(c, ramp(min(ed.add(0.25), 1)), stroke(sdBox(q, vec2(ex, ey), fr), w)));
      const len = ex.mul(hash(vec2(uid, ex)).mul(0.7).add(0.3));
      const lx = ex.negate().add(ey.mul(0.6));
      c.assign(
        mix(
          c,
          mix(onColor(f), f, 0.55),
          inside(
            sdBox(
              q.sub(vec2(lx.add(len.mul(0.5)), 0)),
              vec2(len.mul(0.5), ey.mul(0.22)),
              ey.mul(0.22),
            ),
          ),
        ),
      );
      const blink = max(step(0.5, fract(M.clock.mul(1.1).add(uid))), M.steady);
      const cx = lx.add(len).add(ey.mul(0.25));
      c.assign(
        mix(
          c,
          mix(onColor(f), hex(BLUE), near),
          stroke(q.x.sub(cx), one)
            .mul(step(abs(q.y), ey.mul(0.55)))
            .mul(blink),
        ),
      );
    }),
    /** A button: a deeper fill (iOS 7's blue when active) and its label. */
    button: mk('sys13Button', ({ c, q, ex, ey, ed, near, act }) => {
      const f = select(near.add(act).greaterThan(0.5), hex(BLUE), ramp(min(ed.add(0.22), 1)));
      c.assign(mix(c, f, inside(sdBox(q, vec2(ex, ey), ey.mul(0.5)))));
      c.assign(
        mix(
          c,
          onColor(f),
          inside(
            sdBox(q, vec2(min(ex.mul(0.55), ex.sub(ey.mul(0.6))), ey.mul(0.26)), ey.mul(0.26)),
          ),
        ),
      );
    }),
    /** A search bar: a pill, the magnifier, a placeholder line. */
    search: mk('sys13Search', ({ c, q, ex, ey, ed, uid, one }) => {
      const f = ramp(max(ed.sub(0.12), 0));
      c.assign(mix(c, f, inside(sdBox(q, vec2(ex, ey), ey))));
      const ink = mix(onColor(f), f, 0.3);
      const mc = vec2(ex.negate().add(ey.mul(1.05)), ey.mul(-0.08));
      const mr = ey.mul(0.36);
      c.assign(
        mix(
          c,
          ink,
          max(
            stroke(length(q.sub(mc)).sub(mr), max(ey.mul(0.13), one)),
            stroke(
              sdSeg(q, mc.add(vec2(mr.mul(0.7))), mc.add(vec2(mr.mul(1.35)))),
              max(ey.mul(0.15), one),
            ),
          ),
        ),
      );
      const len = ex.mul(hash(vec2(uid, 2.2)).mul(0.5).add(0.35));
      const lx = mc.x.add(mr.mul(2.2));
      c.assign(
        mix(
          c,
          mix(ink, f, 0.35),
          inside(
            sdBox(
              q.sub(vec2(lx.add(len.mul(0.5)), 0)),
              vec2(len.mul(0.5), ey.mul(0.2)),
              ey.mul(0.2),
            ),
          ),
        ),
      );
    }),
    /** A switch: on where its tone is dark (or near the pointer), the knob crossing. */
    toggle: mk('sys13Toggle', ({ c, q, ex, ey, ed, near, act, demo, one }) => {
      const sOn = clamp(step(0.45, ed).add(near).add(act).add(demo), 0, 1);
      const trackOn = mix(ramp(min(ed.add(0.2), 1)), hex('#4cd964'), step(0.5, near.add(act)));
      c.assign(
        mix(c, mix(ramp(max(ed.sub(0.3), 0)), trackOn, sOn), inside(sdBox(q, vec2(ex, ey), ey))),
      );
      const kx = mix(ex.negate().add(ey), ex.sub(ey), sOn);
      c.assign(
        mix(c, vec3(1), inside(length(q.sub(vec2(kx, 0))).sub(ey.sub(max(one, ey.mul(0.12)))))),
      );
    }),
    /** A checkbox, ticked where its tone is dark. */
    check: mk('sys13Check', ({ c, q, ex, ey, ed, near, act, w }) => {
      const sz = min(ex, ey);
      const on2 = clamp(step(0.45, ed).add(near).add(act), 0, 1);
      const f = mix(vec3(1), ramp(min(ed.add(0.2), 1)), on2);
      c.assign(mix(c, f, inside(sdBox(q, vec2(sz), sz.mul(0.25)))));
      c.assign(
        mix(
          c,
          ramp(min(ed.add(0.3), 1)),
          stroke(sdBox(q, vec2(sz), sz.mul(0.25)), w).mul(float(1).sub(on2)),
        ),
      );
      const tick = min(
        sdSeg(q, vec2(sz.mul(-0.5), 0), vec2(sz.mul(-0.1), sz.mul(0.4))),
        sdSeg(q, vec2(sz.mul(-0.1), sz.mul(0.4)), vec2(sz.mul(0.55), sz.mul(-0.45))),
      );
      c.assign(mix(c, vec3(1), stroke(tick, max(sz.mul(0.25), 1)).mul(on2)));
    }),
    /** An avatar: a circle, a head and shoulders. */
    avatar: mk('sys13Avatar', ({ c, q, ex, ey, ed, one }) => {
      const sz = min(ex, ey);
      const f = ramp(ed);
      c.assign(mix(c, f, inside(length(q).sub(sz))));
      const ink = mix(onColor(f), f, 0.35);
      c.assign(
        mix(
          c,
          ink,
          inside(length(q.add(vec2(0, sz.mul(0.22)))).sub(sz.mul(0.32))).mul(
            inside(length(q).sub(sz)),
          ),
        ),
      );
      c.assign(
        mix(
          c,
          ink,
          inside(length(q.sub(vec2(0, sz.mul(0.85)))).sub(sz.mul(0.55))).mul(
            inside(length(q).sub(sz.sub(one))),
          ),
        ),
      );
    }),
    /** A back chevron. */
    chevron: mk('sys13Chevron', ({ c, q, ex, ey, card, one }) => {
      const sz = min(ex, ey);
      const v = min(
        sdSeg(q, vec2(sz.mul(0.35), sz.negate()), vec2(sz.mul(-0.35), 0)),
        sdSeg(q, vec2(sz.mul(-0.35), 0), vec2(sz.mul(0.35), sz)),
      );
      c.assign(mix(c, onColor(card), stroke(v, max(sz.mul(0.22), one))));
    }),
    /** A segmented control of three, its selection where the tone puts it. */
    segmented: mk('sys13Segmented', ({ c, q, ex, ey, ed, w }) => {
      const f = ramp(ed);
      const sel = clamp(floor(ed.mul(3)), 0, 2).sub(1);
      const sw = ex.div(3);
      c.assign(mix(c, ramp(max(ed.sub(0.25), 0)), inside(sdBox(q, vec2(ex, ey), ey.mul(0.35)))));
      c.assign(
        mix(c, f, inside(sdBox(q.sub(vec2(sel.mul(sw.mul(2)), 0)), vec2(sw, ey), ey.mul(0.35)))),
      );
      c.assign(
        mix(c, f, stroke(min(abs(q.x.sub(sw)), abs(q.x.add(sw))), w).mul(step(abs(q.y), ey))),
      );
      c.assign(mix(c, f, stroke(sdBox(q, vec2(ex, ey), ey.mul(0.35)), w)));
    }),
    /** A progress bar, filled to the tone, its stripes running. */
    progress: mk('sys13Progress', ({ c, q, ex, ey, ed, near, one, live }) => {
      const fillTo = ex.negate().add(ex.mul(2).mul(clamp(ed.add(near.mul(0.4)), 0.08, 1)));
      const bar = inside(sdBox(q, vec2(ex, ey), ey));
      c.assign(mix(c, ramp(max(ed.sub(0.3), 0)), bar));
      c.assign(mix(c, ramp(min(ed.add(0.15), 1)), bar.mul(step(q.x, fillTo))));
      const stripe = step(
        fract(
          q.x
            .add(q.y)
            .add(M.clock.mul(one.mul(14)).mul(live))
            .div(ey.mul(3)),
        ),
        0.5,
      );
      c.assign(mix(c, vec3(1), bar.mul(step(q.x, fillTo)).mul(stripe).mul(0.25)));
    }),
  };
}

/** Where the bands of darkness change atom (lightest first). */
const EDGES = [0.08, 0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9];

/** The frame as 2013's design system draws it, display-referred. */
export function system({ F, M, tex, uv, sign }: SystemScene): N {
  const { p, size, H, e, pc, R, pupilR } = F;
  const live = float(1).sub(M.steady);
  const t = max(M.since, M.steady.mul(100));
  // (every value used in more than one branch below is a variable built
  // before them: a value first built inside one branch is unset in the others)
  const one = max(hair(F, 1), 1).toVar();
  const w = max(hair(F, 1), 0.8).toVar();
  const smp = (q: N, lod: N) => tex.sample(q.div(size)).level(lod);
  const stretch = (l: N) => pow(clamp(log2(max(l, 1e-4)).add(5.06).div(4.64), 0, 1), 1.05);
  // (the finished frame is darkened toward its edges, a dark room round the
  // face (pipeline.ts); the tone is read with that undone, so the skin is
  // one skin from the eye to the frame's edge)
  const room = (q: N) =>
    mix(
      float(0.38),
      float(1),
      float(1).sub(smoothstep(0.22, 0.8, length(q.div(size).sub(0.5).mul(vec2(1.22, 1))))),
    );
  const lumAt = (q: N, s: N) => luma(s.rgb).div(room(q));
  // (a function: every element of a group reads its own tone)
  const toneFn = Fn(([q, lod]: N[]) => stretch(lumAt(q, smp(q, lod)))).setLayout(
    layout('sys13Tone', 'float', [
      ['q', 'vec2'],
      ['lod', 'float'],
    ]),
  );
  const toneAt = (q: N, lod: N) => toneFn(q, lod);
  const pp = M.ptr.mul(size);
  const d = p.sub(pc);
  const r = length(d).toVar();

  // ---- what part this pixel belongs to ----------------------------------------
  // `uc` its centre, `q` the pixel in its frame (x along its length), `hw`
  // and `hh` its half size, `tn` its tone, `lv` what it is (0..3 the
  // quadtree's atom, molecule, organism, template; 10 the iris's dial; 11 a
  // key), `uid` its seed, `dz` its depth
  const uc = vec2(0).toVar();
  const q = vec2(0).toVar();
  const hw = float(1).toVar();
  const hh = float(1).toVar();
  const tn = float(0.5).toVar();
  const lv = float(0).toVar();
  const uid = float(0).toVar();
  const dz = float(0.5).toVar();
  const ring = float(0).toVar();
  const spoke = float(0).toVar();
  const spokes = float(12).toVar();

  // the atom's height, and the layout's cells (2:1), anchored on the globe's
  // centre so a saccade never drags them
  const u = max(floor(max(R.div(40), H.mul(0.0062)).add(0.5)), 5).toVar();
  const pad = max(u.mul(0.1), 1).toVar();

  // the iris's dial: five rings from the pupil to the limbus, each cut into
  // radial cells about twice as long as they are wide
  const r0 = pupilR.mul(1.04).toVar();
  const ringW = max(R.mul(0.985).sub(r0), 4).div(7).toVar();
  const ri = clamp(floor(r.sub(r0).div(ringW)), 0, 6);
  const rmid = r0.add(ri.add(0.5).mul(ringW));
  const nA = max(floor(rmid.mul(Math.PI * 2).div(max(ringW.mul(0.5), u.mul(0.9)))), 12);
  const a01 = fract(atan(d.y, d.x).div(Math.PI * 2));
  const ai = floor(a01.mul(nA));
  const am = ai
    .add(0.5)
    .div(nA)
    .mul(Math.PI * 2);
  const er = vec2(cos(am), sin(am));
  const irisCell = pc.add(er.mul(rmid));
  // (cut by the lids as the lids stand, pixel by pixel, as every era's eye is,
  // never cell by cell: the dial sits in the eye, not on it)
  const inIris = step(r0, r)
    .mul(step(r, R.mul(0.985)))
    .mul(step(0.5, almond(F, p)))
    .toVar();
  // the pupil's keyboard
  const ks = max(r0.mul(0.36), u.mul(1.1)).toVar();
  const kcell = floor(d.div(ks));
  const keyC = pc.add(kcell.add(0.5).mul(ks));
  const inPupil = step(r, r0)
    .mul(step(0.5, almond(F, p)))
    .toVar();

  If(inIris.greaterThan(0.5), () => {
    const et = vec2(er.y.negate(), er.x);
    uc.assign(irisCell);
    q.assign(vec2(dot2(d, er).sub(rmid), dot2(d, et)));
    hw.assign(ringW.mul(0.5).sub(pad));
    hh.assign(rmid.mul(Math.PI).div(nA).sub(pad));
    const s = smp(irisCell, log2(max(ringW.mul(0.5), 1)));
    tn.assign(stretch(lumAt(irisCell, s)));
    dz.assign(s.a);
    lv.assign(10);
    ring.assign(ri);
    spoke.assign(ai);
    spokes.assign(nA);
    uid.assign(hash(vec2(ai, ri.add(41))));
  })
    .ElseIf(inPupil.greaterThan(0.5), () => {
      uc.assign(keyC);
      q.assign(p.sub(keyC));
      hw.assign(ks.mul(0.5).sub(pad));
      hh.assign(ks.mul(0.5).sub(pad));
      const s = smp(keyC, log2(ks));
      tn.assign(stretch(lumAt(keyC, s)));
      dz.assign(s.a);
      lv.assign(11);
      uid.assign(hash(kcell.add(73.1)));
    })
    .Else(() => {
      // the quadtree: a template's cell, split into four while the tone
      // varies across it; the eye's opening is never coarser than molecules
      const base = vec2(u.mul(16), u.mul(8));
      const lo = e.add(floor(p.sub(e).div(base)).mul(base)).toVar();
      const sz = base.toVar();
      const level = float(3).toVar();
      const done = float(0).toVar();
      [0.035, 0.055, 0.08].forEach((thr, k) => {
        If(done.lessThan(0.5), () => {
          const half = sz.mul(0.5);
          const lod = log2(half.y).add(0.5);
          const s = [
            [0.5, 0.5],
            [1.5, 0.5],
            [0.5, 1.5],
            [1.5, 1.5],
          ].map(([a, b]) => lo.add(half.mul(vec2(a, b))));
          const sa = s.map((c0) => smp(c0, lod));
          const tq = s.map((c0, i) => stretch(lumAt(c0, sa[i])));
          const spread = max(max(tq[0], tq[1]), max(tq[2], tq[3])).sub(
            min(min(tq[0], tq[1]), min(tq[2], tq[3])),
          );
          const force = k < 2 ? step(0.5, almond(F, lo.add(half), 1.35)) : float(0);
          If(spread.greaterThan(thr).or(force.greaterThan(0.5)), () => {
            lo.addAssign(step(half, p.sub(lo)).mul(half));
            sz.assign(half);
            level.subAssign(1);
          }).Else(() => {
            done.assign(1);
            tn.assign(tq[0].add(tq[1]).add(tq[2]).add(tq[3]).mul(0.25));
            dz.assign(sa[0].a.add(sa[1].a).add(sa[2].a).add(sa[3].a).mul(0.25));
          });
        });
      });
      If(done.lessThan(0.5), () => {
        const s = smp(lo.add(sz.mul(0.5)), log2(sz.y).add(0.5));
        tn.assign(stretch(lumAt(lo.add(sz.mul(0.5)), s)));
        dz.assign(s.a);
      });
      uc.assign(lo.add(sz.mul(0.5)));
      q.assign(p.sub(lo.add(sz.mul(0.5))));
      hw.assign(sz.x.mul(0.5).sub(pad));
      hh.assign(sz.y.mul(0.5).sub(pad));
      lv.assign(level);
      uid.assign(hash(floor(lo.div(u)).add(level.mul(7.7))));
    });

  // ---- its state over time -------------------------------------------------------
  // arriving: the dial and the keys first, then atoms, molecules, organisms,
  // templates, each a little later the further from the pupil; a dot grows
  // into the part, the part takes its value (its colour, its state), and
  // its skeuomorphic gloss flattens away; leaving, back to dots
  const dist = length(uc.sub(pc)).toVar();
  const order = select(lv.greaterThan(9.5), float(0), lv.mul(0.12).add(0.12));
  const ta = t.sub(order).sub(dist.div(R).mul(0.05));
  const grow = easeOutCubic(after(ta, 0, 0.3))
    .mul(float(1).sub(M.dep.mul(0.7)))
    .toVar();
  const value = easeOutCubic(after(ta, 0.15, 0.35))
    .mul(float(1).sub(easeInQuad(M.dep)))
    .toVar();
  const gloss = float(1)
    .sub(after(ta, 0.4, 0.55))
    .mul(live)
    .toVar();
  // pressing sends the active state out in a wave; going in, it runs over everything
  const front = float(1)
    .sub(smoothstep(0, R.mul(0.9), abs(dist.sub(M.press.mul(R.mul(3))))))
    .mul(step(0.01, M.press))
    .mul(live)
    .toVar();
  const allOn = step(dist, M.enter.mul(length(size)).mul(1.15))
    .mul(step(0.001, M.enter))
    .toVar();
  // the pointer lifts what is near it, rings it in focus and switches it on
  const near = float(1)
    .sub(smoothstep(u.mul(2), u.mul(9), length(uc.sub(pp))))
    .mul(M.track)
    .mul(float(1).sub(M.hover))
    .toVar();
  // now and then (each part every ~30 s, for half a second) a part demonstrates itself
  const ph = fract(M.clock.mul(0.03).add(hash(vec2(uid, 5.3))));
  const demo = sin(clamp(ph.div(0.015), 0, 1).mul(Math.PI))
    .mul(step(ph, 0.015))
    .mul(live)
    .toVar();

  // its colours: the palette at its darkness, a deeper and a lighter step, the
  // detail colour that reads on it, the card under a group's parts
  // (the iris is dark brown and the pupil black: the page reflected over
  // them is held back, so the eye reads as an eye)
  const eyeDark = select(
    lv.greaterThan(10.5),
    float(0.72),
    select(lv.greaterThan(9.5), float(0.5), float(0)),
  );
  // the skin spans little of the scale (its darkness 0.34..0.46), so it is
  // stretched about its middle, and each part pushed away from the mean of
  // its neighbourhood (brow, crease, under-eye, cheek), so the face carries
  // across the whole palette
  const dk0 = clamp(float(1).sub(tn), 0, 1);
  const around = clamp(float(1).sub(toneAt(uc, log2(R.mul(1.2)))), 0, 1);
  const face = clamp(dk0.sub(0.38).mul(1.25).add(0.4).add(dk0.sub(around).mul(2.2)), 0, 0.97);
  const dk = mix(select(lv.lessThan(9.5), face, dk0), float(1), eyeDark)
    .mul(value)
    .toVar();
  const base = ramp(dk).toVar();
  const deep = ramp(min(dk.add(0.2), 1)).toVar();
  const lite = ramp(max(dk.sub(0.18), 0)).toVar();
  const on = onColor(base).toVar();
  const card = base.mul(0.8).toVar();
  // how high it stands: the scene's depth, lifted by the pointer and the wave
  const elev = clamp(
    dz.mul(1.4).sub(0.2).add(near.mul(0.6)).add(allOn.mul(0.5)).add(front.mul(0.3)),
    0,
    1.5,
  ).toVar();
  // parallax by its height (the dial and keys turn with the eye, so not them)
  const par = vec2(0.5)
    .sub(M.ptr)
    .mul(one.mul(5))
    .mul(elev)
    .mul(M.track)
    .mul(live)
    .mul(step(lv, 9.5));
  q.subAssign(par.div(float(1).add(near.mul(0.08))));
  q.divAssign(float(1).add(near.mul(0.08)));

  // ---- the page and the part's shadow ---------------------------------------------
  const gutter = base.mul(0.5).toVar();
  const so = vec2(0.6, 1)
    .mul(one)
    .mul(float(1).add(elev.mul(2.5)));
  const blur = one.mul(float(1).add(elev.mul(2)));
  const c = gutter
    .mul(
      float(1).sub(
        float(1)
          .sub(smoothstep(blur.negate(), blur, sdBox(q.sub(so), vec2(hw, hh), min(hh, u).mul(0.4))))
          .mul(0.4),
      ),
    )
    .toVar();
  // the part's tile: the palette's colour at its darkness (a group's card a step deeper)
  const rad = min(hh, u).mul(0.4).toVar();
  c.assign(
    mix(
      c,
      select(lv.greaterThan(0.5).and(lv.lessThan(9.5)), card, base),
      inside(sdBox(q, vec2(hw, hh), rad)),
    ),
  );

  /** A group's element, in the group's frame (x0..x1, y0..y1 shares of its half size): its tone is sampled at its own centre. */
  const K = elementKit(M);
  const state = vec4(near, front.add(allOn), uid, demo).toVar();
  const lines = vec2(w, one).toVar();
  const elem = (x0: number, y0: number, x1: number, y1: number, draw: N) => {
    const elo = vec2(hw.mul(x0), hh.mul(y0));
    const ehi = vec2(hw.mul(x1), hh.mul(y1));
    If(
      q.x
        .greaterThan(elo.x.sub(1))
        .and(q.x.lessThan(ehi.x.add(1)))
        .and(q.y.greaterThan(elo.y.sub(1)))
        .and(q.y.lessThan(ehi.y.add(1))),
      () => {
        const ec = elo.add(ehi).mul(0.5);
        const eh = ehi.sub(elo).mul(0.5);
        const ed = clamp(
          float(1).sub(toneAt(uc.add(ec), log2(max(min(eh.x, eh.y).mul(2), 1)))),
          0,
          1,
        ).mul(value);
        c.assign(draw(c, q.sub(ec), vec3(eh.x, eh.y, ed), state, card, lines));
      },
    );
  };
  const { textBar, field, button, search, toggle, check, avatar, chevron, segmented, progress } = K;

  // ---- the part --------------------------------------------------------------------
  const pick = uid;
  If(lv.lessThan(0.5), () => {
    // an atom: the component of its tone's band, its state following the tone
    let k: N = float(0);
    for (const edge of EDGES) k = k.add(step(edge, dk));
    const band = k;
    const loE = [0, ...EDGES];
    const hiE = [...EDGES, 1];
    let lo: N = float(loE[8]);
    let hi: N = float(hiE[8]);
    for (let i = 7; i >= 0; i--) {
      lo = select(band.lessThan(i + 0.5), float(loE[i]), lo);
      hi = select(band.lessThan(i + 0.5), float(hiE[i]), hi);
    }
    const u0 = clamp(dk.sub(lo).div(hi.sub(lo)), 0, 1);
    const us = clamp(
      mix(u0, float(1).sub(u0), demo).add(near.mul(0.5)).add(front.mul(0.6)).add(allOn),
      0,
      1,
    );
    const alt = step(0.5, pick);
    const det = mix(on, base, 0.2);
    If(band.lessThan(1.5), () => {
      // page dots, the current one filled
      const qx = q.x.sub(clamp(floor(q.x.div(hh.mul(1.6)).add(0.5)), -1, 1).mul(hh.mul(1.6)));
      const dr = max(hh.mul(0.28), 0.8);
      const mid = step(abs(q.x), hh.mul(0.8));
      c.assign(
        mix(
          c,
          det,
          max(
            stroke(length(vec2(qx, q.y)).sub(dr), w),
            inside(length(vec2(qx, q.y)).sub(dr)).mul(mid.mul(step(0.4, us)).add(alt.mul(0.4))),
          ),
        ),
      );
    })
      .ElseIf(band.lessThan(2.5), () => {
        // a pair of radio buttons, the second filling
        const rr = hh.mul(0.75);
        const qa = q.add(vec2(hw.mul(0.5), 0));
        const qb = q.sub(vec2(hw.mul(0.5), 0));
        c.assign(mix(c, det, max(stroke(length(qa).sub(rr), w), stroke(length(qb).sub(rr), w))));
        c.assign(mix(c, deep, inside(length(qb).sub(rr.mul(0.6).mul(us)))));
      })
      .ElseIf(band.lessThan(3.5), () => {
        // a pair of checkboxes, ticked one and then both
        const rr = hh.mul(0.75);
        for (const [o, at] of [
          [-0.5, 0.3],
          [0.5, 0.75],
        ]) {
          const qq = q.sub(vec2(hw.mul(o), 0));
          const sd = sdBox(qq, vec2(rr), rr.mul(0.3));
          const ok = step(at, us);
          c.assign(mix(c, det, stroke(sd, w)));
          c.assign(mix(c, deep, inside(sd).mul(ok)));
          const tick = min(
            sdSeg(qq, vec2(rr.mul(-0.5), 0), vec2(rr.mul(-0.1), rr.mul(0.4))),
            sdSeg(qq, vec2(rr.mul(-0.1), rr.mul(0.4)), vec2(rr.mul(0.55), rr.mul(-0.45))),
          );
          c.assign(mix(c, vec3(1), stroke(tick, max(rr.mul(0.25), 1)).mul(ok)));
        }
      })
      .ElseIf(band.lessThan(4.5), () => {
        // a slider: track, fill to the knob, the knob
        const kr = hh.mul(0.8);
        const kx = mix(hw.negate().add(kr), hw.sub(kr), us);
        const th = max(hh.mul(0.22), 0.75);
        c.assign(
          mix(c, mix(det, deep, step(q.x, kx)), inside(sdBox(q, vec2(hw.sub(one), th), th))),
        );
        c.assign(mix(c, vec3(1), inside(length(q.sub(vec2(kx, 0))).sub(kr))));
      })
      .ElseIf(band.lessThan(5.5), () => {
        If(alt.lessThan(0.5), () => {
          // a switch
          const kx = mix(hw.negate().add(hh), hw.sub(hh), us);
          c.assign(mix(c, mix(lite, deep, step(q.x, kx)), inside(sdBox(q, vec2(hw, hh), hh))));
          c.assign(
            mix(c, vec3(1), inside(length(q.sub(vec2(kx, 0))).sub(hh.sub(max(one, hh.mul(0.15)))))),
          );
        }).Else(() => {
          // a stepper, − and +
          const plusOn = step(0.5, us).mul(step(0, q.x));
          c.assign(mix(c, deep, inside(sdBox(q, vec2(hw, hh), one.mul(2))).mul(plusOn)));
          c.assign(mix(c, det, stroke(q.x, w).mul(step(abs(q.y), hh))));
          const g = hh.mul(0.45);
          const ql = q.add(vec2(hw.mul(0.5), 0));
          const qr = q.sub(vec2(hw.mul(0.5), 0));
          c.assign(mix(c, det, stroke(ql.y, one).mul(step(abs(ql.x), g))));
          c.assign(
            mix(
              c,
              mix(det, vec3(1), plusOn),
              max(
                stroke(qr.y, one).mul(step(abs(qr.x), g)),
                stroke(qr.x, one).mul(step(abs(qr.y), g)),
              ),
            ),
          );
        });
      })
      .ElseIf(band.lessThan(6.5), () => {
        If(alt.lessThan(0.5), () => {
          // a segmented control of three
          const sw = hw.div(3);
          const sel = clamp(floor(us.mul(3)), 0, 2).sub(1);
          c.assign(
            mix(
              c,
              deep,
              inside(sdBox(q.sub(vec2(sel.mul(sw.mul(2)), 0)), vec2(sw, hh), hh.mul(0.35))),
            ),
          );
          c.assign(
            mix(c, det, stroke(min(abs(q.x.sub(sw)), abs(q.x.add(sw))), w).mul(step(abs(q.y), hh))),
          );
        }).Else(() => {
          // a badge: its pill and the red notification dot
          c.assign(mix(c, deep, inside(sdBox(q, vec2(hw, hh), hh))));
          const dq = q.sub(vec2(hw.sub(hh.mul(0.3)), hh.mul(-0.4)));
          c.assign(mix(c, vec3(1), inside(length(dq).sub(hh.mul(0.5)).sub(one))));
          c.assign(
            mix(c, hex('#ff3b30'), inside(length(dq).sub(hh.mul(0.5).mul(us.mul(0.5).add(0.5))))),
          );
        });
      })
      .ElseIf(band.lessThan(7.5), () => {
        // a button with its chevron, or a Metro tile with its glyph
        const s = hh.mul(0.45);
        If(alt.lessThan(0.5), () => {
          c.assign(mix(c, mix(base, deep, us), inside(sdBox(q, vec2(hw, hh), hh.mul(0.45)))));
          c.assign(
            mix(
              c,
              det,
              stroke(
                min(
                  sdSeg(q, vec2(s.mul(-0.4), s.negate()), vec2(s.mul(0.4), 0)),
                  sdSeg(q, vec2(s.mul(0.4), 0), vec2(s.mul(-0.4), s)),
                ),
                one,
              ),
            ),
          );
        }).Else(() => {
          c.assign(mix(c, mix(base, deep, us), inside(sdBox(q, vec2(hw, hh), float(0)))));
          c.assign(
            mix(
              c,
              det,
              inside(
                sdBox(
                  q.sub(vec2(hw.negate().add(hh.mul(0.55)), hh.mul(-0.4))),
                  vec2(hh.mul(0.22)),
                  float(0),
                ),
              ),
            ),
          );
        });
      })
      .Else(() => {
        // the darkest: a key of the keyboard
        c.assign(
          mix(
            c,
            deep,
            inside(
              sdBox(q.add(vec2(0, one.mul(0.5))), vec2(hw.sub(one), hh.sub(one)), hh.mul(0.3)),
            ),
          ),
        );
      });
  })
    .ElseIf(lv.lessThan(1.5), () => {
      // a molecule
      const v = floor(pick.mul(4));
      If(v.lessThan(0.5), () => {
        // an input group: a field and its button
        elem(-1, -0.72, 0.38, 0.72, field);
        elem(0.48, -0.72, 1, 0.72, button);
      })
        .ElseIf(v.lessThan(1.5), () => {
          // a labelled switch
          elem(-0.92, -0.26, -0.02, 0.26, textBar);
          elem(0.2, -0.66, 0.96, 0.66, toggle);
        })
        .ElseIf(v.lessThan(2.5), () => {
          // a segmented control
          elem(-0.96, -0.66, 0.96, 0.66, segmented);
        })
        .Else(() => {
          // a checkbox and its label
          elem(-0.96, -0.62, -0.5, 0.62, check);
          elem(-0.36, -0.24, 0.9, 0.24, textBar);
        });
    })
    .ElseIf(lv.lessThan(2.5), () => {
      // an organism
      const v = floor(pick.mul(5));
      If(v.lessThan(0.5), () => {
        // a search bar and its button
        elem(-0.97, -0.62, 0.56, 0.62, search);
        elem(0.64, -0.62, 0.97, 0.62, button);
      })
        .ElseIf(v.lessThan(1.5), () => {
          // a nav bar: back, title, an action
          elem(-0.97, -0.5, -0.78, 0.5, chevron);
          elem(-0.4, -0.2, 0.4, 0.2, textBar);
          elem(0.66, -0.5, 0.96, 0.5, button);
        })
        .ElseIf(v.lessThan(2.5), () => {
          // a form row: its label over its field
          elem(-0.95, -0.86, -0.25, -0.56, textBar);
          elem(-0.96, -0.28, 0.96, 0.86, field);
        })
        .ElseIf(v.lessThan(3.5), () => {
          // an alert: title, message, two buttons
          elem(-0.5, -0.82, 0.5, -0.56, textBar);
          elem(-0.82, -0.38, 0.82, -0.18, textBar);
          elem(-0.94, 0.14, -0.05, 0.86, button);
          elem(0.05, 0.14, 0.94, 0.86, button);
        })
        .Else(() => {
          // a list cell: avatar, two lines, a progress
          elem(-0.97, -0.84, -0.6, 0.84, avatar);
          elem(-0.48, -0.66, 0.5, -0.32, textBar);
          elem(-0.48, -0.06, 0.18, 0.2, textBar);
          elem(-0.48, 0.48, 0.94, 0.76, progress);
        });
    })
    .ElseIf(lv.lessThan(3.5), () => {
      // a template
      const v = floor(pick.mul(3));
      If(v.lessThan(0.5), () => {
        // a login form: heading, two fields, remember me, sign in
        elem(-0.9, -0.88, -0.1, -0.7, textBar);
        elem(-0.92, -0.54, 0.92, -0.16, field);
        elem(-0.92, -0.02, 0.92, 0.36, field);
        elem(-0.92, 0.54, -0.8, 0.84, check);
        elem(-0.72, 0.62, -0.2, 0.76, textBar);
        elem(0.32, 0.5, 0.92, 0.88, button);
      })
        .ElseIf(v.lessThan(1.5), () => {
          // a settings group: three rows, a label and a switch each
          for (let i = 0; i < 3; i++) {
            const y0 = -0.9 + i * 0.62;
            elem(-0.9, y0 + 0.18, -0.15 + i * 0.12, y0 + 0.34, textBar);
            elem(0.5, y0 + 0.04, 0.9, y0 + 0.48, toggle);
          }
          c.assign(
            mix(
              c,
              card.mul(0.85),
              stroke(abs(abs(q.y).sub(hh.mul(0.31))), w).mul(step(abs(q.x), hw.mul(0.92))),
            ),
          );
        })
        .Else(() => {
          // a search page: the bar, two results
          elem(-0.94, -0.9, 0.94, -0.46, search);
          for (let i = 0; i < 2; i++) {
            const y0 = -0.28 + i * 0.62;
            elem(-0.94, y0, -0.68, y0 + 0.5, avatar);
            elem(-0.58, y0 + 0.06, 0.6, y0 + 0.2, textBar);
            elem(-0.58, y0 + 0.3, 0.2, y0 + 0.42, textBar);
          }
        });
    })
    .ElseIf(lv.lessThan(10.5), () => {
      // the iris's dial: switches at the collarette, sliders for the fibres,
      // segments at the limbus (x runs outward)
      const us = clamp(dk.add(near.mul(0.3)).add(front.mul(0.6)).add(allOn), 0, 1);
      // hover: the sliders sweep round like an activity indicator
      const sweep = fract(spoke.div(spokes).sub(M.clock.mul(0.6)));
      const ux = mix(us, float(1).sub(sweep), M.hover.mul(live));
      const det = mix(on, base, 0.2);
      If(ring.lessThan(0.5), () => {
        const kx = mix(hw.negate().add(hh), hw.sub(hh), step(0.5, ux));
        c.assign(mix(c, mix(lite, deep, step(q.x, kx)), inside(sdBox(q, vec2(hw, hh), hh))));
        c.assign(mix(c, lite, inside(length(q.sub(vec2(kx, 0))).sub(hh.mul(0.8)))));
      })
        .ElseIf(ring.lessThan(5.5), () => {
          const kr = hh.mul(0.85);
          const kx = mix(hw.negate().add(kr), hw.sub(kr), ux);
          const th = max(hh.mul(0.28), 0.75);
          // (an iris's fibres: the knobs a lighter step of the fibre's own
          // colour, not white, so the dial reads as one iris)
          c.assign(
            mix(
              c,
              mix(mix(det, base, 0.6), deep, step(q.x, kx)),
              inside(sdBox(q, vec2(hw.sub(one), th), th)),
            ),
          );
          c.assign(
            mix(
              c,
              mix(lite, vec3(1), M.hover.mul(0.6)),
              inside(length(q.sub(vec2(kx, 0))).sub(kr)),
            ),
          );
        })
        .Else(() => {
          // the limbus: segments; at rest a focus runs round them (the sign)
          const runner = fract(M.clock.mul(0.12));
          const lead = fract(spoke.div(spokes).sub(runner));
          const lit = smoothstep(0.08, 0, lead).mul(sign).mul(live).add(M.hover.mul(0.6));
          c.assign(
            mix(
              c,
              mix(deep, hex(BLUE), clamp(lit.add(front).add(allOn), 0, 1)),
              inside(sdBox(q, vec2(hw, hh), hh.mul(0.4))),
            ),
          );
        });
    })
    .Else(() => {
      // a key of the pupil's keyboard; hover types, press holds them all down
      const typed = step(0.82, hash(vec2(uid, floor(M.clock.mul(7)))))
        .mul(M.hover)
        .mul(live);
      const down = clamp(typed.add(M.press).add(front).add(allOn), 0, 1);
      const kq = q.sub(vec2(0, down.mul(one)));
      const f = mix(base, hex(BLUE), down);
      c.assign(
        mix(
          c,
          deep.mul(0.6),
          inside(sdBox(q.add(vec2(0, one.negate())), vec2(hw, hh), hh.mul(0.25))),
        ),
      );
      c.assign(mix(c, f, inside(sdBox(kq, vec2(hw, hh.sub(one)), hh.mul(0.25)))));
      c.assign(mix(c, mix(onColor(f), f, 0.4), inside(length(kq).sub(hh.mul(0.18)))));
    });

  // ---- the face's own detail, through every part ------------------------------------
  // As every era keeps the whole face, so does this one: each part is lit by
  // the face under it (the pixel's light against the part's own mean), so
  // the brow's hairs, the lashes, the lid's folds, the skin's texture, the
  // page in the cornea and the catchlight all show through the components.
  {
    const lumPix = luma(tex.sample(uv).level(0).rgb).div(room(p));
    // (against a neighbourhood a little larger than the iris, so a big panel
    // carries the lid's shading as well as the hairs on it)
    const lumRef = luma(smp(p, log2(max(R.mul(0.35), 1))).rgb).div(room(p));
    const relief = clamp(pow(lumPix.add(0.03).div(lumRef.add(0.03)), 0.85), 0.2, 2.6);
    const k = value.mul(select(lv.greaterThan(10.5), float(0.55), float(0.9)));
    c.assign(mix(c, c.mul(min(relief, 1)), k));
    c.assign(mix(c, vec3(1), smoothstep(1, 2.2, relief).mul(0.7).mul(k)));
  }

  // ---- finish ----------------------------------------------------------------------
  // skeuomorphic gloss, flattening away as each part arrives (iOS 6 to 7)
  {
    const foot = inside(sdBox(q, vec2(hw, hh), rad));
    c.assign(
      mix(
        c,
        vec3(1),
        foot
          .mul(gloss)
          .mul(0.4)
          .mul(float(1).sub(smoothstep(hh.negate(), 0, q.y))),
      ),
    );
    c.assign(
      c.mul(
        float(1).sub(
          foot
            .mul(gloss)
            .mul(0.25)
            .mul(smoothstep(0, hh, q.y)),
        ),
      ),
    );
  }
  // the focus ring round what the pointer is near
  {
    const fo = max(u.mul(0.14), 1.5);
    c.assign(
      mix(
        c,
        hex(BLUE),
        stroke(sdBox(q, vec2(hw.add(fo), hh.add(fo)), rad.add(fo)), w.mul(1.5))
          .mul(near)
          .mul(0.9),
      ),
    );
  }
  // over the iris, its focus glows round the limbus (hover)
  c.assign(
    mix(
      c,
      hex(GLOW),
      float(1)
        .sub(smoothstep(0, R.mul(0.06), abs(r.sub(R.mul(1.01)))))
        .mul(M.hover)
        .mul(sign)
        .mul(step(0.5, almond(F, p)))
        .mul(0.8),
    ),
  );
  // arriving, a part is first only its dot
  const dot = mix(
    hex('#f2f2f7'),
    ramp(0.6),
    inside(length(p.sub(uc)).sub(max(u.mul(0.12), 0.8))).mul(after(ta, -0.1, 0.15)),
  );
  c.assign(mix(dot, c, grow));
  // going in, the page is all that is left
  c.assign(mix(c, hex('#fcfcfe'), smoothstep(0.6, 1, M.enter)));
  return c;
}

/** The dot product of two 2-vectors (kept local: medium-kit's imports stay lean). */
function dot2(a: N, b: N): N {
  return a.x.mul(b.x).add(a.y.mul(b.y));
}
