/**
 * Plate III — The eye of the volute.
 *
 * An Ionic volute is struck from twelve centres inside its eye (the oculus): the
 * architectural eye, kiruk's motif found inside a historic design. The right half of the
 * capital is finished in iron-gall on Dawn Light; the left half is left in construction,
 * so the sheet shows how it was made (selective finish, research 01 §5; process on
 * display, CLAUDE.md §2). An enlargement of the eye numbers the centres in the order they
 * are struck.
 *
 * Anatomy drawn: abacus; the volute's outer line and fillet running across the capital as
 * the canalis and winding into the scroll; the echinus with egg-and-dart under it; the
 * astragal; the fluted shaft behind the scroll (occluded where the scroll stands in front).
 *
 * Truth: every dimension is computed from the drawn geometry at 1:4; the construction is
 * this plate's own (twelve centres stepping inward 12:11:…:1), not a claim about any
 * treatise. Proof: node packages/mai/scripts/proof.ts packages/mai/plates/volute.ts <out>
 */
import {
  arc,
  circle,
  distToPath,
  ellipse,
  line,
  lineInsidePolygon,
  pointInPolygon,
  spline,
} from '../src/core/path.ts';
import { DEG, type MVec, type Vec, type Vec3 } from '../src/core/vec.ts';
import { letter, typeset } from '../src/letter/letter.ts';
import { customForm, cylinder, plane } from '../src/light/forms.ts';
import { contour, hatch } from '../src/light/hatch.ts';
import { toneOf } from '../src/light/light.ts';
import { bandLine, drawVoluteConstruction, voluteGeometry } from '../src/measure/constructions.ts';
import { compass, dimension, leader, point, ruled, scaleBar } from '../src/measure/measure.ts';
import { createPlate, type Plate } from '../src/plate/plate.ts';
import { restyle, STYLES } from '../src/styles/styles.ts';

/** Parts of the vertical line x = const, between y0 and y1, that lie outside a polygon. */
function outsideV(x: number, y0: number, y1: number, poly: MVec[]): [number, number][] {
  const inside = lineInsidePolygon([x, 0], [0, 1], poly)
    .map(([a, b]) => [Math.max(y0, a), Math.min(y1, b)] as [number, number])
    .filter(([a, b]) => b > a);
  const out: [number, number][] = [];
  let y = y0;
  for (const [a, b] of inside.sort((p, q) => p[0] - q[0])) {
    if (a > y + 0.3) out.push([y, a - 0.4]);
    y = Math.max(y, b + 0.4);
  }
  if (y1 > y + 0.3) out.push([y, y1]);
  return out;
}

/** Parts of the horizontal line y = const, between x0 and x1, that lie outside a polygon. */
function outsideH(y: number, x0: number, x1: number, poly: MVec[]): [number, number][] {
  const inside = lineInsidePolygon([0, y], [1, 0], poly)
    .map(([a, b]) => [Math.max(x0, a), Math.min(x1, b)] as [number, number])
    .filter(([a, b]) => b > a);
  const out: [number, number][] = [];
  let x = x0;
  for (const [a, b] of inside.sort((p, q) => p[0] - q[0])) {
    if (a > x + 0.3) out.push([x, a - 0.4]);
    x = Math.max(x, b + 0.4);
  }
  if (x1 > x + 0.3) out.push([x, x1]);
  return out;
}

export default function volutePlate(): Plate {
  const style = restyle(STYLES.architect, {
    ink: 'iron-gall',
    paper: 'dawn-light',
    name: 'Architectural rendering on the old paper',
  });
  const p = createPlate({
    id: 'plate-03-volute',
    title: 'Plate III — The eye of the volute',
    claim:
      'A volute is twelve quarter-circles struck from twelve centres inside its eye; each centre lies on the last arc’s end radius, so the scroll turns without a corner.',
    size: [280, 200],
    margins: [14, 14, 14, 14],
    style,
    seed: 3,
    eye: {
      motif: 'drawn',
      ref: 'the oculus of the Ionic volute — the eye from which the scroll is struck',
    },
    device: 'construction and build-up, with an enlargement of the eye (×6)',
    views: 2,
    scale: { unit: 'mm', perMm: 4, digits: 0 },
    typeface: "'IM Fell English', 'EB Garamond', Georgia, serif",
  });

  // ── the module ──
  const axisX = 66;
  const eye: Vec = [112, 88];
  const eyeR = 4;
  const R0 = 33.52; // height = 2·R0 − δ₀ = 62.5 mm on the sheet = 250 mm at 1:4
  const v = voluteGeometry(eye, eyeR, R0, { hand: 1 });
  const top = v.outer[0] as MVec;
  const top2 = v.inner[0] as MVec;
  const bottom = v.outer.reduce((b, q) => (q[1] > b[1] ? q : b), top);
  const right = v.outer.reduce((b, q) => (q[0] > b[0] ? q : b), top);
  p.fact(
    'volute.height',
    ((bottom[1] - top[1]) * 4).toFixed(1),
    'measured from the drawn spiral at 1:4',
    'mm',
  );
  p.fact('volute.eye', (eyeR * 2 * 4).toFixed(1), 'eye radius 4 mm on the sheet at 1:4', 'mm');
  p.fact('volute.centres', 12, 'this plate’s construction: steps 12:11:…:1 on shrinking squares');
  let worst = 0;
  for (let k = 0; k + 1 < v.arcs.length; k++) {
    const a = v.arcs[k] as MVec[];
    const b = v.arcs[k + 1] as MVec[];
    const ta = Math.atan2(
      (a[a.length - 1] as MVec)[1] - (a[a.length - 2] as MVec)[1],
      (a[a.length - 1] as MVec)[0] - (a[a.length - 2] as MVec)[0],
    );
    const tb = Math.atan2(
      (b[1] as MVec)[1] - (b[0] as MVec)[1],
      (b[1] as MVec)[0] - (b[0] as MVec)[0],
    );
    let d = Math.abs(ta - tb) % (2 * Math.PI);
    if (d > Math.PI) d = 2 * Math.PI - d;
    worst = Math.max(worst, d / DEG);
  }
  p.fact(
    'volute.kink',
    worst.toFixed(2),
    'largest change of direction at a join, measured from the arcs',
    '°',
  );

  // the scroll stands in front of the shaft: its first full turn is the occluder
  const disc: MVec[] = [...v.arcs.slice(0, 4).flat(), [top[0], top[1]]];
  // the canalis runs across the capital and winds into the scroll
  const outerPath: MVec[] = [[axisX, top[1]], ...v.outer];
  const innerPath: MVec[] = [[axisX, top2[1]], ...v.inner];

  const abTop = top[1] - 7.5;
  const abBot = top[1] - 1.8;
  const shaftR = 38;
  const shaftTop = eye[1] + 9;
  const shaftBot = 162;
  const echY = top2[1] + 4.6; // the echinus' centre line, under the fillet
  const echEnd = Math.min(
    ...lineInsidePolygon([0, echY], [1, 0], disc).map(([a]) => a),
    eye[0] - 18,
  );

  // ── 1 · construction (graphite, the lightest, first) ──
  const axis = ruled(p, [axisX, 32], [axisX, 186], {
    id: 'axis',
    kind: 'axis',
    label: 'axis of the column',
    overshoot: [0, 0],
  });
  const vc = drawVoluteConstruction(p, v, { id: 'volute' });
  // the mirrored half, left in construction: its eye, cathetus, abacus, canalis, shaft edge, flutes
  const mEye: Vec = [2 * axisX - eye[0], eye[1]];
  const mEyeC = compass(p, mEye, eyeR, { id: 'mirror-eye' });
  const mCath = ruled(p, [mEye[0], abBot + 2], [mEye[0], eye[1] + 26], {
    id: 'mirror-cathetus',
    kind: 'axis',
  });
  const mAbacus = ruled(p, [16, abBot], [axisX, abBot], { id: 'mirror-abacus' });
  const mAbacusTop = ruled(p, [16, abTop], [axisX, abTop], { id: 'mirror-abacus-top' });
  const mCanalis = ruled(p, [mEye[0] - 4, top[1]], [axisX, top[1]], { id: 'mirror-canalis' });
  const mShaft = ruled(p, [axisX - shaftR, shaftTop], [axisX - shaftR, shaftBot], {
    id: 'mirror-shaft',
  });
  const fluteIds: string[] = [];
  for (let k = 1; k < 6; k++) {
    const x = axisX - shaftR * Math.sin(k * 15 * DEG);
    fluteIds.push(
      ruled(p, [x, shaftTop + 4], [x, shaftBot], { id: `mirror-flute-${k}`, overshoot: [0.5, 0] })
        .id,
    );
  }
  // searching lines under the ink: the hand finds the scroll before it commits
  p.stroke(spline(v.outer.filter((_, i) => i % 9 === 0)), {
    role: 'searching',
    id: 'volute-search',
    pressure: 0.25,
  });

  // ── 2 · forms under the one light ──
  const L = p.light;
  const cyl = cylinder('shaft-solid', [axisX, shaftTop], [axisX, shaftBot], shaftR, 0);
  const fluteAt = (x: number) => {
    const s = Math.max(-1, Math.min(1, (x - axisX) / shaftR));
    const th = Math.asin(s) / DEG;
    return ((((th + 90) / 15) % 1) + 1) % 1;
  };
  const shaftOutline: MVec[] = [
    [axisX, shaftTop + 3.2],
    [axisX + shaftR, shaftTop + 3.2],
    [axisX + shaftR, shaftBot],
    [axisX, shaftBot],
  ];
  const shaft = customForm(
    'shaft',
    shaftOutline,
    (q) => {
      if (pointInPolygon(q, disc)) return null; // behind the scroll
      const n = cyl.normal(q);
      if (!n) return null;
      // a hollow flute: its left wall turns right, its right wall left
      const b = (0.5 - fluteAt(q[0])) * 1.5;
      const c = Math.cos(b);
      const s = Math.sin(b);
      const out: Vec3 = [n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c];
      return out;
    },
    () => [0, 1],
  );
  // the canalis: the hollow channel between the outer line and the fillet
  const band: MVec[] = [...outerPath, ...innerPath.slice().reverse()];
  const xs = band.map((q) => q[0]);
  const ys = band.map((q) => q[1]);
  const [bx0, by0, bx1, by1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const cell = 0.5;
  const gw = Math.ceil((bx1 - bx0) / cell) + 1;
  const gh = Math.ceil((by1 - by0) / cell) + 1;
  const grid = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const q: Vec = [bx0 + i * cell, by0 + j * cell];
      if (!pointInPolygon(q, band)) continue;
      const dO = distToPath(q, outerPath);
      const dI = distToPath(q, innerPath);
      const s = dO / Math.max(1e-6, dO + dI);
      // across the channel the surface turns from facing the scroll's centre to facing out
      let rx = q[0] - eye[0];
      let ry = q[1] - eye[1];
      if (q[0] < top[0]) {
        rx = 0;
        ry = -1; // the straight run under the abacus: its outer wall faces up
      }
      const rl = Math.hypot(rx, ry) || 1;
      const k = (2 * s - 1) * 0.95;
      grid[j * gw + i] = toneOf([(rx / rl) * k, (ry / rl) * k, 0.5], L);
    }
  const canalisTone = (q: Vec) => {
    const i = Math.round((q[0] - bx0) / cell);
    const j = Math.round((q[1] - by0) / cell);
    if (i < 0 || j < 0 || i >= gw || j >= gh) return 0;
    return grid[j * gw + i] as number;
  };
  p.addForm({ id: 'canalis', kind: 'custom', outline: band, tone: canalisTone });
  // the abacus casts a narrow shadow down and to the right
  const shadowStrip: MVec[] = [
    [axisX, abBot],
    [right[0] + 5, abBot],
    [right[0] + 6.4, abBot + 1.7],
    [axisX + 1.4, abBot + 1.7],
  ];
  const abacusShadow = plane('abacus-shadow', shadowStrip, [0.6, 0.6, 0.35], [1, 0]);

  // ── 3 · ink: the heaviest line, outlines first ──
  contour(p, outerPath, {
    closed: false,
    id: 'volute-outer',
    form: 'canalis',
    min: 0.75,
    max: 1.45,
    anchored: false,
  });
  contour(p, innerPath, {
    closed: false,
    id: 'volute-fillet',
    form: 'canalis',
    min: 0.55,
    max: 1.05,
    anchored: false,
  });
  contour(p, circle(eye, eyeR, -1.2, 0.2), { id: 'volute-eye', min: 0.7, max: 1.25 });
  p.stroke(line([axisX, abTop], [right[0] + 5, abTop], 0.5), {
    role: 'contour',
    guide: 'ruler',
    id: 'abacus-top',
    start: 'touch',
    end: 'lift',
  });
  p.stroke(line([axisX, abBot], [right[0] + 5, abBot], 0.5), {
    role: 'contour',
    guide: 'ruler',
    id: 'abacus-bottom',
    start: 'touch',
    end: 'lift',
  });
  p.stroke(line([right[0] + 5, abTop], [right[0] + 5, abBot], 0.3), {
    role: 'contour',
    guide: 'ruler',
    id: 'abacus-end',
    start: 'touch',
    end: 'lift',
  });
  // the echinus: its lower edge, and egg-and-dart along it
  const echBot = echY + 5.2;
  p.stroke(line([axisX, echBot], [echEnd - 0.6, echBot], 0.4), {
    role: 'contour',
    guide: 'ruler',
    id: 'echinus-edge',
    start: 'touch',
    end: 'lift',
    pressure: 0.5,
  });
  const eggW = 6.3;
  const nEggs = Math.max(2, Math.floor((echEnd - axisX - 1) / (eggW + 1.5)));
  for (let i = 0; i < nEggs; i++) {
    const cx = axisX + 1.2 + eggW / 2 + i * (eggW + 1.5);
    const cy = echY + 0.4;
    // the egg: a tall oval; its shell: a U open to the canalis above
    const shellPts = ellipse([cx, cy - 0.6], eggW / 2 + 0.5, 4.3, 0, -0.12, Math.PI + 0.12, 0.25);
    const eggPts = ellipse([cx, cy + 0.3], eggW / 2 - 0.55, 3.35, 0, 0, Math.PI * 2, 0.25);
    const eggForm = customForm(`egg-${i + 1}`, eggPts, (q) => {
      const dx = (q[0] - cx) / (eggW / 2 - 0.55);
      const dy = (q[1] - cy - 0.3) / 3.35;
      const d2 = dx * dx + dy * dy;
      return d2 > 1 ? null : [dx, dy, Math.sqrt(Math.max(0, 1 - d2))];
    });
    contour(p, shellPts, {
      closed: false,
      id: `shell-${i + 1}`,
      min: 0.45,
      max: 0.85,
      pressure: 0.42,
    });
    contour(p, eggPts, {
      id: `egg-${i + 1}`,
      form: `egg-${i + 1}`,
      min: 0.5,
      max: 1.15,
      pressure: 0.5,
    });
    hatch(p, {
      form: eggForm,
      threshold: 0.36,
      gap: 0.85,
      slope: 0,
      cross: false,
      id: `egg-${i + 1}-tone`,
      pressure: 0.4,
      minSpan: 1,
    });
    if (i < nEggs - 1) {
      // the dart between two eggs
      const dx = cx + eggW / 2 + 0.75;
      p.stroke(
        spline([
          [dx, echY - 2.8],
          [dx - 0.25, echY + 0.8],
          [dx, echY + 4.4],
        ]),
        { role: 'contour', id: `dart-${i + 1}`, pressure: 0.45, start: 'touch', end: 'taper' },
      );
    }
  }
  // the astragal under the capital, and the shaft behind the scroll
  for (const [y, id] of [
    [shaftTop, 'astragal-top'],
    [shaftTop + 3.2, 'astragal-bottom'],
  ] as const)
    for (const [i, [a, b]] of outsideH(y, axisX, axisX + shaftR + 1.2, disc).entries())
      p.stroke(line([a, y], [b, y], 0.4), {
        role: 'contour',
        guide: 'ruler',
        id: `${id}-${i}`,
        start: 'touch',
        end: 'lift',
      });
  const fillets: string[] = [];
  outsideV(axisX + shaftR, shaftTop + 3.2, shaftBot, disc).forEach(([a, b], i) => {
    const m = p.stroke(line([axisX + shaftR, a], [axisX + shaftR, b], 0.5), {
      role: 'contour',
      guide: 'ruler',
      id: `shaft-edge-${i}`,
      start: 'touch',
      end: 'lift',
    });
    fillets.push(...m.map((q) => q.id));
  });
  for (let k = 1; k < 6; k++) {
    const x = axisX + shaftR * Math.sin(k * 15 * DEG);
    outsideV(x, shaftTop + 4, shaftBot, disc).forEach(([a, b], i) => {
      const m = p.stroke(line([x, a], [x, b], 0.5), {
        role: 'contour',
        guide: 'ruler',
        id: `flute-${k}-${i}`,
        start: 'touch',
        end: 'lift',
        pressure: 0.42,
      });
      fillets.push(...m.map((q) => q.id));
    });
  }
  p.stroke(
    spline([
      [axisX - 4, shaftBot],
      [axisX + 10, shaftBot - 1.4],
      [axisX + 22, shaftBot + 0.8],
      [axisX + shaftR + 3, shaftBot - 0.6],
    ]),
    { role: 'contour', id: 'shaft-break', pressure: 0.4 },
  );

  // ── 4 · tone: the shadow first on what turns from the light (¶555), then deepen ──
  hatch(p, {
    form: shaft,
    threshold: 0.34,
    id: 'shaft-tone',
    gap: 1.45,
    cross: false,
    pressure: 0.44,
  });
  // the canalis: channel lines that follow the scroll, laid only where the channel is dark
  const channel: string[] = [];
  for (const [s, at] of [
    [0.3, 0.42],
    [0.55, 0.5],
    [0.8, 0.6],
  ] as const) {
    const pathS: MVec[] = [[axisX, top[1] * (1 - s) + top2[1] * s], ...bandLine(v, s)];
    let run: MVec[] = [];
    const flush = () => {
      if (run.length > 14) {
        const tones = run.map(canalisTone);
        const meanT = tones.reduce((x, y) => x + y, 0) / tones.length;
        const m = p.stroke(run, {
          role: 'hatch',
          form: 'canalis',
          tone: meanT,
          group: 'canalis-lines',
          pressure: (u) =>
            0.32 +
            0.5 * (tones[Math.min(tones.length - 1, Math.round(u * (tones.length - 1)))] as number),
          start: 'touch',
          end: 'taper',
        });
        channel.push(...m.map((q) => q.id));
      }
      run = [];
    };
    // hysteresis: a channel line starts where the tone passes `at` and runs until it falls
    // well below it, so the hand lays one line, not a dashed one
    let on = false;
    for (const q of pathS) {
      const t = canalisTone(q);
      if (!on && t > at) on = true;
      else if (on && t < at - 0.08) on = false;
      if (on) run.push(q);
      else flush();
    }
    flush();
  }
  hatch(p, {
    form: abacusShadow,
    tone: () => 0.62,
    threshold: 0.3,
    id: 'abacus-shadow-tone',
    gap: 0.7,
    slope: 0,
    cross: false,
  });

  // what each construction generated
  p.generated(axis.id, ...fillets, 'echinus-edge');
  p.generated(vc.cathetus, 'volute-outer');
  p.generated(vc.horizontal, 'volute-outer');
  p.generated(vc.eye, 'volute-eye', 'volute-fillet');
  for (const c of vc.centres) p.generated(c, 'volute-outer', 'volute-fillet');
  p.generated(mEyeC.id, 'mirror-cathetus');
  p.generated(mCath.id, 'mirror-eye');
  p.generated(mAbacus.id, 'abacus-bottom');
  p.generated(mAbacusTop.id, 'abacus-top');
  p.generated(mCanalis.id, 'volute-outer');
  p.generated(mShaft.id, ...fillets);
  for (const f of fluteIds) p.generated(f, ...fillets);

  // ── 5 · keys on the drawing ──
  letter(p, 'A', [eye[0] - 12.5, eye[1] - 11], { cap: 3.5, kind: 'key', refers: eye, id: 'key-A' });
  leader(p, [eye[0] - 9, eye[1] - 12], [eye[0] - eyeR * 0.6, eye[1] - eyeR * 0.6], {
    terminator: 'none',
    shoulder: 1.5,
    id: 'lead-A',
  });
  letter(p, 'B', [eye[0] + 2, eye[1] - 21], {
    cap: 3.5,
    kind: 'key',
    refers: [eye[0], eye[1] - 20],
    id: 'key-B',
  });
  const fil = v.inner[Math.floor(v.inner.length * 0.12)] as MVec;
  letter(p, 'C', [fil[0] + 7, fil[1] - 3], { cap: 3.5, kind: 'key', refers: fil, id: 'key-C' });
  leader(p, [fil[0] + 6.5, fil[1] - 4], fil, { terminator: 'dot', shoulder: 0.1, id: 'lead-C' });
  letter(p, 'D', [axisX + 4, echBot + 6.5], {
    cap: 3.5,
    kind: 'key',
    refers: [axisX + 6, echY],
    id: 'key-D',
  });

  // ── 6 · dimension, measured from the ink at 1:4 ──
  dimension(p, top, [bottom[0], bottom[1]], {
    axis: 'y',
    offset: right[0] - Math.max(top[0], bottom[0]) + 12,
    id: 'dim-height',
    digits: 0,
  });

  // ── 7 · Fig. 2: the eye enlarged ×6 ──
  const k6 = 6;
  const ic: Vec = [221, 79];
  const fr = 38;
  const frame = compass(p, ic, fr, { id: 'fig2-frame', role: 'contour', prick: false });
  p.generated(frame.id, 'fig2-eye');
  const big = (q: Vec): MVec => [ic[0] + (q[0] - eye[0]) * k6, ic[1] + (q[1] - eye[1]) * k6];
  contour(p, circle(ic, eyeR * k6, -1.2, 0.3), { id: 'fig2-eye', min: 0.6, max: 1.2 });
  const icath = ruled(p, [ic[0], ic[1] - eyeR * k6 - 4], [ic[0], ic[1] + eyeR * k6 + 4], {
    id: 'fig2-cathetus',
    kind: 'axis',
  });
  const ihor = ruled(p, [ic[0] - eyeR * k6 - 4, ic[1]], [ic[0] + eyeR * k6 + 4, ic[1]], {
    id: 'fig2-horizontal',
    kind: 'axis',
  });
  const sq = v.centres.map(big);
  p.stroke(sq, {
    role: 'construction',
    guide: 'ruler',
    id: 'fig2-centres-path',
    start: 'touch',
    end: 'lift',
  });
  p.addConstruction({ id: 'fig2-centres', kind: 'grid', path: sq, generates: [] });
  sq.forEach((c, k) => {
    const out: Vec = [c[0] - ic[0], c[1] - ic[1]];
    const ol = Math.hypot(out[0], out[1]) || 1;
    const ox = (out[0] / ol) * 2.6 + (k % 2 ? 0.6 : -0.6);
    const oy = (out[1] / ol) * 2.6 + 1.2;
    point(p, c, {
      id: `fig2-c${k + 1}`,
      style: 'prick',
      label: String(k + 1),
      cap: 2.5,
      offset: [ox - (k + 1 > 9 ? 1.6 : 0.8), oy],
      generates: ['fig2-arcs'],
    });
  });
  // the last arcs, closing on the eye at ×6 (kept inside the enlargement's frame)
  const fig2Arcs: string[] = [];
  for (let k = 9; k < 12; k++) {
    const c = sq[k] as MVec;
    const r = (v.radii[k] as number) * k6;
    const a0 = v.starts[k] as number;
    const pts = arc(c, r, a0, a0 + Math.PI / 2, 0.3).filter(
      (q) => Math.hypot(q[0] - ic[0], q[1] - ic[1]) < fr - 1.2,
    );
    if (pts.length < 4) continue;
    const m = p.stroke(pts, { role: 'contour', id: `fig2-arc-${k + 1}`, pressure: 0.5 });
    fig2Arcs.push(...m.map((q) => q.id));
  }
  p.generated(icath.id, 'fig2-eye');
  p.generated(ihor.id, 'fig2-eye');
  p.generated('fig2-centres', ...fig2Arcs);
  letter(p, 'Fig. 2', [ic[0] - fr - 2, ic[1] + fr + 1], {
    cap: 3.5,
    kind: 'caption',
    id: 'fig2-label',
  });
  // the eye's diameter, where it is large enough to read (×6, so 4/6 mm per sheet mm)
  dimension(p, [ic[0] - eyeR * k6, ic[1]], [ic[0] + eyeR * k6, ic[1]], {
    axis: 'x',
    offset: -(eyeR * k6 + 3.5),
    id: 'dim-eye',
    digits: 0,
    perMm: 4 / k6,
  });

  // ── 8 · words: title, claim, notes, scale ──
  typeset(p, 'Plate III — The eye of the volute', [14, 22], {
    cap: 5.2,
    kind: 'title',
    id: 'title',
  });
  typeset(
    p,
    'A volute is twelve quarter-circles struck from twelve centres inside its eye; each centre lies on the last arc’s end radius.',
    [14, 29],
    {
      cap: 2.5,
      kind: 'caption',
      italic: true,
      id: 'claim',
    },
  );
  const notes = [
    'A — The eye (oculus), Ø 32 mm at 1:4.',
    '      Twelve centres are pricked inside it.',
    'B — The cathetus, the plumb line through the eye;',
    '      every arc ends on it or on the level line.',
    'C — The fillet, struck from the same centres drawn',
    '      toward the eye: it narrows to nothing.',
    'D — The echinus, egg and dart, under the canalis.',
    'Fig. 2 — The eye ×6. The centres step inward on',
    'shrinking squares, 1 to 12; each lies on the last',
    'arc’s end radius, so no join turns a corner.',
  ];
  for (const [i, t] of notes.entries())
    typeset(p, t.trim(), [t.startsWith(' ') ? 181 : 176, 127 + i * 4.4 + (i >= 7 ? 2.2 : 0)], {
      cap: 2.5,
      kind: 'note',
      id: `note-${i + 1}`,
    });
  scaleBar(p, [176, 174], { units: 200, segments: 4, label: 'mm · 1:4', id: 'scale' });
  typeset(p, 'kiruk · drawn by mai · one light, upper left, 45°', [14, 192], {
    cap: 2.5,
    kind: 'caption',
    italic: true,
    id: 'colophon',
  });
  return p;
}
