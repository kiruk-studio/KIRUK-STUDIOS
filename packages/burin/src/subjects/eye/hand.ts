/**
 * The eye, coloured by hand — the recipe the hand (p5.brush) follows for each impression.
 *
 * The burin's plate prints the same every time. A colourist's hand does not: every
 * impression coloured by hand is its own. So the seed is the impression, and each one
 * differs in the way a hand differs — where the chalk searched, how far a wash ran.
 *
 *   chalk  the underdrawing in red chalk, before a line is cut (note i): the whole globe,
 *          loose, two or three times round; the lids, overshooting the corners; the crease,
 *          the brow; the canthus line and the axis; the orbit; the hollow massed on its side
 *   wash   bistre in the shade: the hollow under the brow (deepest toward the nose), the
 *          corners, the fold of the crease, a breath under the lower lid; carnation where
 *          the eye is flesh: the caruncle, the lower lid's margin, the lid
 *   iris   the colour of the eye, at rest: indigo with verdigris, a hazel collarette; the
 *          rim the wash leaves as it dries is the limbal ring
 *   body   lead white where the light falls (from above, from the left): the brow ridge,
 *          hatched in white as on tinted paper; the lid's roll; the pillow of the lower
 *          lid; the side of the nose; the cheekbone; the wet caruncle
 *   ink    iron-gall from a quill: left-handed hatching (\) in the deepest shade — the inner
 *          hollow, the outer corner, the cheek — crossed once where it is darkest
 *
 * Eye units: x from the inner corner (−1) to the outer (+1), y down, the rig's curves.
 * spec-link: ideas/studio-dawn/hand.md
 */

import { type HandRequest, PIGMENTS, type Rect } from '../../hand/media';
import type { HandRecipe } from '../../hand/painter';
import { curve, PRESSURE, type Pt, spine, tremor } from '../../hand/spine';
import { brow, crease, EYE, GLOBE, lowerLid, upperLid } from './rig';

const TAU = Math.PI * 2;
const mid = (x: number) => EYE.canthus.inY + ((EYE.canthus.outY - EYE.canthus.inY) * (x + 1)) / 2;

/** The eye's centre and scale (CSS px per eye unit) from the request. */
function frame(req: HandRequest) {
  const [cx, cy, S] = req.params.eye as number[];
  const P = (x: number, y: number): Pt => [cx! + x * S!, cy! + y * S!];
  return { cx: cx!, cy: cy!, S: S!, P };
}

/** A band between two curves of x (eye units), as a closed outline in CSS px. */
function band(
  P: (x: number, y: number) => Pt,
  x0: number,
  x1: number,
  top: (x: number) => number,
  bottom: (x: number) => number,
  n = 18,
): Pt[] {
  const a: Pt[] = [];
  const b: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    a.push(P(x, top(x)));
    b.push(P(x, bottom(x)));
  }
  return a.concat(b.reverse());
}

/** An ellipse outline with a hand's irregularity. */
function blob(
  P: (x: number, y: number) => Pt,
  x: number,
  y: number,
  rx: number,
  ry: number,
  wobble: (i: number) => number,
  n = 14,
): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU;
    const k = 1 + wobble(i);
    return P(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k);
  });
}

export const eyeHand: HandRecipe = {
  scale: (req) => Math.max(0.6, (req.params.eye as number[])[2]! / 60),

  iris(req): Rect {
    const { cx, cy, S } = frame(req);
    const r = EYE.iris.R * S * 1.14;
    const y = cy + EYE.iris.cy * S;
    return [cx - r, y - r, 2 * r, 2 * r];
  },

  paint(ctx, layer) {
    const { h, req } = ctx;
    const { S, P } = frame(req);
    const px = (u: number) => u * S;
    const line = (pts: Pt[], pressure = PRESSURE.search, shake = 0.006) =>
      spine(tremor(pts, px(shake), h), pressure, h);

    if (layer === 'chalk') {
      const red = PIGMENTS.sanguine.hex;
      // The globe, loose: two or three turns, each a little off the last.
      const turns = h.R() < 0.5 ? 2 : 3;
      for (let k = 0; k < turns; k++) {
        const gx = GLOBE.cx + h.G(0, 0.014);
        const gy = GLOBE.cy + h.G(0, 0.014);
        const r = GLOBE.R * (1 + h.G(0, 0.018));
        const a0 = h.R(TAU);
        const sweep = TAU * h.R(0.82, 1.12);
        const ph = h.R(TAU);
        const pts = curve(
          (t) => {
            const a = a0 + sweep * t;
            const rr = r * (1 + 0.022 * Math.sin(3 * a + ph));
            return P(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr);
          },
          0,
          1,
          72,
        );
        ctx.draw(line(pts, PRESSURE.search, 0.008), 'k-sanguine', red, 0.95 - k * 0.18);
      }
      // The lids, overshooting the corners as a sketch does; the crease; the brow.
      const lid = (f: (x: number) => number, x0: number, x1: number, dy: number, w: number) =>
        ctx.draw(line(curve((x) => P(x, f(x) + dy), x0, x1, 40)), 'k-sanguine', red, w);
      lid((x) => upperLid(x), -1.2 + h.G(0, 0.03), 1.16 + h.G(0, 0.03), h.G(0, 0.008), 0.85);
      lid((x) => upperLid(x), -1.05, 0.9 + h.G(0, 0.05), h.G(-0.012, 0.006), 0.55);
      lid((x) => lowerLid(x), -1.14 + h.G(0, 0.03), 1.14, h.G(0, 0.008), 0.8);
      lid((x) => crease(x), -0.98, 1.06 + h.G(0, 0.04), h.G(0, 0.01), 0.55);
      lid((x) => brow(x) + 0.05, -1.18, 1.32, h.G(0, 0.012), 0.5);
      // The canthus line and the axis, struck once each, and a cross at each corner.
      ctx.draw(
        line([P(-1.58, mid(-1.58)), P(1.58, mid(1.58))], PRESSURE.drag, 0.003),
        'k-sanguine',
        red,
        0.45,
      );
      ctx.draw(
        line([P(GLOBE.cx, -1.02), P(GLOBE.cx, 0.98)], PRESSURE.drag, 0.003),
        'k-sanguine',
        red,
        0.4,
      );
      for (const [x, y] of [
        [-1, EYE.canthus.inY],
        [1, EYE.canthus.outY],
      ] as const) {
        const d = 0.07;
        ctx.draw(
          spine([P(x - d, y - d * 0.4), P(x + d, y + d * 0.4)], PRESSURE.flick),
          'k-sanguine',
          red,
          0.5,
        );
        ctx.draw(
          spine([P(x + d * 0.3, y - d), P(x - d * 0.3, y + d)], PRESSURE.flick),
          'k-sanguine',
          red,
          0.5,
        );
      }
      // The orbit, in broken arcs: above the brow, and the cheekbone below.
      const orbit = (a0: number, a1: number) =>
        curve(
          (t) => {
            const a = a0 + (a1 - a0) * t;
            return P(0.05 + Math.cos(a) * 1.46, -0.22 + Math.sin(a) * 1.1);
          },
          0,
          1,
          28,
        );
      for (const [a0, a1] of [
        [3.45, 4.15],
        [4.3, 5.05],
        [5.2, 5.95],
        [0.55, 1.35],
        [1.5, 2.45],
      ] as const)
        if (h.R() < 0.85)
          ctx.draw(
            line(orbit(a0 + h.G(0, 0.04), a1 + h.G(0, 0.04)), PRESSURE.drag),
            'k-sanguine',
            red,
            0.4,
          );
      // The hollow under the brow, hatched in the chalk the way the red-chalk studies were:
      // long parallel strokes, left-handed, thinning toward the light.
      const [hx0] = P(-1.25, 0);
      ctx.hatch(
        band(
          P,
          -1.25,
          0.45,
          (x) => brow(x) + 0.22,
          (x) => crease(x) - 0.08,
        ),
        {
          angle: Math.PI / 4 + h.G(0, 0.05),
          spacing: px(0.045),
          stroke: px(0.3),
          gap: px(0.06),
          overshoot: px(0.02),
          bow: 0.06,
          pressure: PRESSURE.drag,
          density: (x) => 0.9 - 0.7 * Math.min(1, Math.max(0, (x - hx0) / px(1.7))),
        },
        'k-sanguine',
        red,
        0.8,
      );
      return;
    }

    if (layer === 'wash') {
      const bistre = PIGMENTS.bistre.hex;
      const flesh = PIGMENTS.carnation.hex;
      const w = (i: number) => 0.06 * Math.sin(i * 1.7 + h.R(TAU));
      // The hollow under the brow, then deeper toward the nose: the second wash runs into the first.
      ctx.wash(
        band(
          P,
          -1.32,
          0.95,
          (x) => brow(x) + 0.3,
          (x) => crease(x) - 0.03,
        ),
        bistre,
        58,
        { bleed: 0.16, texture: 0.4, border: 0.55, split: 0.22, curvature: 0.6 },
      );
      ctx.wash(blob(P, -1.12, -0.36, 0.25, 0.36, w), bistre, 44, {
        bleed: 0.22,
        texture: 0.45,
        border: 0.45,
      });
      // The fold of the crease: a narrow, darker band where the lid tucks in.
      ctx.wash(
        band(
          P,
          -0.86,
          0.92,
          (x) => crease(x) - 0.05,
          (x) => crease(x) + 0.035,
        ),
        bistre,
        48,
        { bleed: 0.08, texture: 0.3, border: 0.65, curvature: 0.6 },
      );
      // The corners.
      ctx.wash(blob(P, 1.2, -0.12, 0.18, 0.24, w), bistre, 40, { bleed: 0.2, border: 0.4 });
      ctx.wash(blob(P, -1.24, 0.12, 0.14, 0.2, w), bistre, 38, { bleed: 0.2, border: 0.4 });
      // A breath of shade under the lower lid, soft-edged.
      ctx.wash(
        band(
          P,
          -0.74,
          0.98,
          (x) => lowerLid(x) + 0.07,
          (x) => lowerLid(x) + 0.2 + 0.05 * Math.sin(x * 2),
        ),
        bistre,
        32,
        { bleed: 0.28, texture: 0.35, border: 0.3, curvature: 0.7 },
      );
      // Carnation: the caruncle, the lower lid's margin, a blush on the lid.
      ctx.wash(blob(P, -0.94, 0.05, 0.055, 0.038, w, 10), flesh, 150, {
        bleed: 0.08,
        texture: 0.3,
        border: 0.35,
      });
      ctx.wash(
        band(
          P,
          -0.86,
          0.66,
          (x) => lowerLid(x) + 0.004,
          (x) => lowerLid(x) + 0.032,
        ),
        flesh,
        58,
        { bleed: 0.06, texture: 0.2, border: 0.4, curvature: 0.7 },
      );
      ctx.wash(
        band(
          P,
          -0.72,
          0.78,
          (x) => crease(x) + 0.07,
          (x) => upperLid(x) - 0.035,
        ),
        flesh,
        12,
        { bleed: 0.34, texture: 0.25, border: 0.15, split: 0.05, curvature: 0.7 },
      );
      return;
    }

    if (layer === 'iris') {
      const R = EYE.iris.R;
      const cy = EYE.iris.cy;
      const ring = (r: number, n: number, irr: number) => {
        const ph = h.R(TAU);
        return Array.from({ length: n }, (_, i) => {
          const a = (i / n) * TAU;
          const k = 1 + irr * Math.sin(a * 3 + ph) + h.G(0, irr * 0.4);
          return P(Math.cos(a) * r * k, cy + Math.sin(a) * r * k);
        });
      };
      // The ground: a little past the limbus, as a colourist's brush goes. Its dried rim is the ring.
      ctx.wash(ring(R * 1.05, 26, 0.02), PIGMENTS.iris.hex, 175, {
        bleed: 0.06,
        texture: 0.7,
        border: 0.85,
        split: 0.3,
        curvature: 0.8,
      });
      // The collarette, warm, dropped in while the ground is wet: it creeps.
      ctx.wash(ring(R * 0.58, 18, 0.05), PIGMENTS.hazel.hex, 115, {
        bleed: 0.24,
        texture: 0.4,
        border: 0.25,
        curvature: 0.8,
      });
      // Fibres of pigment, drawn out from the collarette.
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + h.G(0, 0.08);
        const r0 = R * h.R(0.5, 0.6);
        const r1 = R * h.R(0.84, 0.97);
        const pts = curve(
          (t) => {
            const r = r0 + (r1 - r0) * t;
            const b = a + 0.06 * Math.sin(t * Math.PI);
            return P(Math.cos(b) * r, cy + Math.sin(b) * r);
          },
          0,
          1,
          8,
        );
        ctx.draw(spine(pts, PRESSURE.swell, h), 'k-silver', PIGMENTS.iris.hex, 1.3);
      }
      return;
    }

    if (layer === 'body') {
      const white = PIGMENTS.leadWhite.hex;
      // Lead white is laid as hatching, never as a line: short strokes where the light falls
      // (from above and from the left), fewer toward the shade — as on tinted paper.
      const lights = (poly: Pt[], x0: number, x1: number, w: number, angle = Math.PI / 4) => {
        const [a] = P(x0, 0);
        const [b] = P(x1, 0);
        ctx.hatch(
          poly,
          {
            angle: angle + h.G(0, 0.05),
            spacing: px(0.03),
            stroke: px(0.085),
            gap: px(0.05),
            overshoot: px(0.006),
            bow: 0.05,
            density: (x) => 0.85 - 0.75 * Math.min(1, Math.max(0, (x - a) / (b - a || 1))),
          },
          'k-white',
          white,
          w,
        );
      };
      // The brow ridge faces the light.
      lights(
        band(
          P,
          -0.95,
          0.42,
          (x) => brow(x) + 0.15,
          (x) => brow(x) + 0.29,
        ),
        -0.95,
        0.42,
        0.75,
      );
      // The lid's roll, between the lashes and the crease, toward the nose.
      lights(
        band(
          P,
          -0.55,
          0.15,
          (x) => crease(x) + 0.12,
          (x) => upperLid(x) - 0.08,
        ),
        -0.55,
        0.3,
        0.55,
      );
      // The pillow of the lower lid, and the cheekbone below it.
      lights(
        band(
          P,
          -0.6,
          0.25,
          (x) => lowerLid(x) + 0.05,
          (x) => lowerLid(x) + 0.11,
        ),
        -0.6,
        0.4,
        0.55,
      );
      lights(
        band(
          P,
          -0.25,
          0.75,
          (x) => 0.58 + 0.05 * (x - 0.25) ** 2,
          (x) => 0.7 + 0.05 * (x - 0.25) ** 2,
        ),
        -0.25,
        0.9,
        0.5,
      );
      // The side of the nose, toward the light: hatched across, not drawn down.
      lights(
        band(
          P,
          -1.5,
          -1.36,
          () => -0.78,
          () => -0.08,
        ),
        -1.5,
        -1.2,
        0.55,
        -Math.PI / 6,
      );
      // The wet caruncle: a point of light.
      ctx.draw(spine([P(-0.935, 0.032), P(-0.925, 0.03)], PRESSURE.even), 'k-white', white, 0.9);
      return;
    }

    if (layer === 'ink') {
      const ink = PIGMENTS.ironGall.hex;
      const hatchIn = (
        poly: Pt[],
        fade: (x: number, y: number) => number,
        angle = Math.PI / 4,
        w = 1,
      ) =>
        ctx.hatch(
          poly,
          {
            angle: angle + h.G(0, 0.04),
            spacing: px(0.034),
            stroke: px(0.16),
            overshoot: px(0.014),
            bow: 0.05,
            density: fade,
          },
          'k-hatch',
          ink,
          w,
        );
      // Left-handed hatching (\) in the deepest shade, thinning toward the light.
      const [ix] = P(-1.36, 0);
      hatchIn(
        band(
          P,
          -1.36,
          -0.5,
          (x) => brow(x) + 0.34,
          (x) => Math.min(crease(x) + 0.02, -0.25 - 0.4 * (x + 1.36)),
        ),
        (x) => 1 - Math.min(0.85, Math.max(0, (x - ix) / px(0.86))),
      );
      hatchIn(
        blob(P, 1.22, -0.1, 0.16, 0.26, () => 0, 12),
        () => 0.75,
      );
      hatchIn(
        band(
          P,
          0.12,
          1.0,
          (x) => lowerLid(x) + 0.17,
          (x) => lowerLid(x) + 0.36,
        ),
        (x) => 0.35 + 0.5 * Math.max(0, (x - P(0.12, 0)[0]) / px(0.88)),
      );
      // Crossed once where the shade is deepest, beside the nose.
      hatchIn(
        blob(P, -1.18, -0.3, 0.13, 0.2, () => 0, 12),
        () => 0.8,
        -Math.PI / 7,
        0.8,
      );
      return;
    }
  },
};
