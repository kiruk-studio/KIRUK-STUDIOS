/**
 * Plate IV — The three axes of the eye.
 *
 * The eye turns in its orbit about three axes through one centre (Fick's axes, A. Fick,
 * 1854): the vertical axis Z carries the gaze left and right, the transverse axis X lifts
 * and lowers it, and the line of sight Y rolls it. Drawn on the night sheet (the
 * nightminds of ideas/studio-dawn/dawn.md), after the founder's axis-sphere reference:
 * hidden circles dashed, axes as chain lines named at both ends, a turn arrow on each
 * axis, and a sweep round the figure.
 *
 * Fig. 1 is an axonometric view; angles there are foreshortened, so the turn of the gaze
 * is measured in Fig. 2, a plan looking down Z, where the plane of the turn is true size.
 * The turned line of sight is a phantom line: ISO 128's line for another position.
 *
 * Proof: node packages/mai/scripts/proof.ts packages/mai/plates/axes.ts <out> --commit
 */
import { arc, circle } from '../src/core/path.ts';
import { DEG, type Vec } from '../src/core/vec.ts';
import { letter, typeset } from '../src/letter/letter.ts';
import { ruled, scaleBar } from '../src/measure/measure.ts';
import { angleDim, extents, neatline, sweep } from '../src/measure/outer.ts';
import {
  camera,
  circle3d,
  project,
  runs,
  type V3,
  view,
  wireSphere,
} from '../src/measure/projection.ts';
import { createPlate, type Plate } from '../src/plate/plate.ts';

export default function axesPlate(o: { trace?: boolean } = {}): Plate {
  const R_MM = 34; // the globe's radius on the sheet
  const EYE_MM = 24; // adult eyeball, mm across (standard anatomy texts)
  const perMm = EYE_MM / (2 * R_MM);
  const p = createPlate({
    id: 'plate-04-axes',
    trace: o.trace,
    title: 'Plate IV — The three axes of the eye',
    claim:
      'The eye turns about three axes through one centre: the vertical axis carries the gaze left and right, the transverse axis lifts and lowers it, and the line of sight rolls it.',
    size: [280, 200],
    margins: [14, 14, 14, 14],
    style: 'night',
    seed: 4,
    eye: {
      motif: 'drawn',
      ref: 'the globe of the eye itself, with its cornea and pupil, turning on its three axes',
    },
    device: 'construction in axonometric view, with the turned gaze as a phase in plan (two views)',
    views: 2,
    scale: { unit: 'mm', perMm, digits: 0 },
  });
  p.fact(
    'eye.diameter',
    EYE_MM,
    'adult eyeball ≈ 24 mm across (standard anatomy texts, e.g. Gray’s Anatomy)',
    'mm',
  );
  p.fact(
    'axes',
    'X transverse · Y line of sight · Z vertical',
    'Fick’s axes (A. Fick, 1854), the standard frame for eye rotation',
  );
  p.fact('turn', 30, 'this plate’s chosen gaze turn about Z, drawn true in plan', '°');

  // ── Fig. 1: the globe in axonometric view ──
  const centre: Vec = [98, 104];
  const cam = camera({ center: centre, scale: R_MM, yaw: -34, pitch: 20 });
  // world: x = X (transverse), y = Z (vertical), z = Y (line of sight, toward the viewer)
  const globe = wireSphere(p, {
    id: 'globe',
    cam,
    radius: 1,
    circles: [
      { id: 'equator', n: [0, 1, 0], part: 'planes' },
      { id: 'sagittal', n: [1, 0, 0], part: 'planes' },
      { id: 'frontal', n: [0, 0, 1], part: 'planes' },
    ],
    axes: [
      { id: 'axis-z', dir: [0, 1, 0], labels: ['Z', 'Z′'], extend: 0.72, turn: 1, part: 'axis-z' },
      { id: 'axis-x', dir: [1, 0, 0], labels: ['X', 'X′'], extend: 0.85, turn: -1, part: 'axis-x' },
      { id: 'axis-y', dir: [0, 0, 1], labels: ['Y', 'Y′'], extend: 1.25, turn: 1, part: 'axis-y' },
    ],
    cap: 3.4,
  });
  // the cornea's rim (limbus) and the pupil, on the line of sight: what makes the globe an eye
  const limbusR = 0.48;
  const limbusZ = Math.sqrt(1 - limbusR * limbusR);
  const zc = project(cam, [0, 0, 0]).z;
  for (const [id, r, z, pressure] of [
    ['limbus', limbusR, limbusZ, 0.62],
    ['pupil', 0.18, limbusZ + 0.02, 0.8],
  ] as const) {
    const pts = circle3d(cam, [0, 0, z], [0, 0, 1], r, 160);
    for (const [i, rn] of runs(pts, (q) => q.z - zc >= -0.05).entries())
      p.stroke(rn.pts, {
        role: 'contour',
        id: `${id}-${i}`,
        group: id,
        pressure,
        line: rn.visible ? 'solid' : 'dashed',
        hidden: !rn.visible,
        part: 'cornea',
        start: 'touch',
        end: 'lift',
      });
  }
  // the sweep: a wide arc round the figure, over the top, the way a turn is shown round a
  // whole construction (the founder's reference); its angle is measured true in Fig. 2
  sweep(p, centre, R_MM * 1.72, 168 * DEG, 372 * DEG, {
    arrow: 'end',
    id: 'sweep',
    part: 'sweep',
    pressure: 0.5,
  });
  // construction: each great circle's ellipse is built on its major and minor axes (chalk)
  for (const [gc, n] of [
    ['equator', [0, 1, 0]],
    ['sagittal', [1, 0, 0]],
    ['frontal', [0, 0, 1]],
  ] as const) {
    const nv = view(cam, n as V3);
    const len = Math.hypot(nv[0], nv[1]);
    // the major axis lies across the projected normal, at full radius; the minor along it, shortened by |n·z|
    const ux = len > 1e-6 ? -nv[1] / len : 1;
    const uy = len > 1e-6 ? -nv[0] / len : 0;
    const minor = Math.abs(nv[2]) * R_MM;
    const maj = ruled(
      p,
      [centre[0] - ux * R_MM, centre[1] - uy * R_MM],
      [centre[0] + ux * R_MM, centre[1] + uy * R_MM],
      { id: `${gc}-major`, overshoot: [2, 2], generates: [] },
    );
    const mi = ruled(
      p,
      [centre[0] + uy * minor, centre[1] - ux * minor],
      [centre[0] - uy * minor, centre[1] + ux * minor],
      { id: `${gc}-minor`, overshoot: [2, 2], generates: [] },
    );
    const made = p.marks.filter((m) => m.group === gc).map((m) => m.id);
    p.generated(maj.id, ...made);
    p.generated(mi.id, ...made);
  }

  // outer measurement of Fig. 1: the globe's diameter from its ink, a graduated frame in mm
  const outline = p.marks.filter((m) => m.id.startsWith('globe-outline'));
  extents(p, outline, { sides: ['bottom'], tier: 13, id: 'globe-extent', digits: 0 });
  neatline(p, [30, 40, 166, 178], {
    every: 2,
    major: 5,
    origin: centre,
    id: 'fig1-neat',
    gap: 1.8,
  });
  letter(p, 'Fig. 1', [30, 186], { cap: 3.4, kind: 'caption', id: 'fig1-label' });

  // ── Fig. 2: the plan, looking down Z — the turn of the gaze in true size ──
  const pc: Vec = [222, 82];
  const pr = 22;
  p.stroke(circle(pc, pr, -1.1, 0.3), {
    role: 'contour',
    id: 'plan-globe',
    anchored: true,
    pressure: 0.6,
    part: 'plan',
  });
  // the line of sight now (Y, toward the viewer = down the sheet in plan) and turned 30° about Z
  const look = (deg: number): Vec => [
    pc[0] + Math.sin(deg * DEG) * (pr + 16),
    pc[1] + Math.cos(deg * DEG) * (pr + 16),
  ];
  const y0 = look(0);
  const y30 = look(30);
  p.stroke([pc, y0], {
    role: 'contour',
    guide: 'ruler',
    line: 'chain',
    id: 'plan-sight',
    pressure: 0.42,
    part: 'plan',
  });
  p.stroke([pc, y30], {
    role: 'contour',
    guide: 'ruler',
    line: 'phantom',
    id: 'plan-sight-turned',
    pressure: 0.42,
    part: 'plan',
  });
  // the cornea's bulge on each line of sight, in plan
  for (const [deg, id, line] of [
    [0, 'plan-cornea', 'solid'],
    [30, 'plan-cornea-turned', 'phantom'],
  ] as const) {
    const a = (90 - deg) * DEG;
    p.stroke(
      arc(
        [pc[0] + Math.cos(a) * pr * 0.42, pc[1] + Math.sin(a) * pr * 0.42],
        pr * 0.62,
        a - 0.62,
        a + 0.62,
        0.25,
      ),
      { role: 'contour', id, line, pressure: 0.55, part: 'plan', start: 'touch', end: 'lift' },
    );
  }
  p.stroke(
    [
      [pc[0] - pr - 9, pc[1]],
      [pc[0] + pr + 9, pc[1]],
    ],
    { role: 'contour', guide: 'ruler', line: 'chain', id: 'plan-x', pressure: 0.4, part: 'plan' },
  );
  letter(p, 'X', [pc[0] - pr - 13, pc[1] + 1.4], {
    cap: 2.8,
    anchor: 'middle',
    kind: 'key',
    id: 'plan-x-a',
    refers: [pc[0] - pr - 9, pc[1]],
  });
  letter(p, 'X′', [pc[0] + pr + 13.5, pc[1] + 1.4], {
    cap: 2.8,
    anchor: 'middle',
    kind: 'key',
    id: 'plan-x-b',
    refers: [pc[0] + pr + 9, pc[1]],
  });
  letter(p, 'Y', [y0[0], y0[1] + 4.6], {
    cap: 2.8,
    anchor: 'middle',
    kind: 'key',
    id: 'plan-y',
    refers: y0,
  });
  angleDim(p, pc, y0, y30, { r: pr + 7, id: 'gaze-turn', digits: 0 });
  // the centre Z is seen end-on: a point in plan
  p.stroke(
    [
      [pc[0] - 0.05, pc[1]],
      [pc[0] + 0.05, pc[1] + 0.03],
    ],
    { role: 'stipple', end: 'stop', start: 'dip', id: 'plan-z', pressure: 0.95, part: 'plan' },
  );
  letter(p, 'Z', [pc[0] + 2, pc[1] - 2.2], {
    cap: 2.8,
    kind: 'key',
    id: 'plan-z-label',
    refers: pc,
  });
  letter(p, 'Fig. 2', [pc[0] - pr - 12, pc[1] - pr - 8], {
    cap: 3.4,
    kind: 'caption',
    id: 'fig2-label',
  });

  // ── words ──
  typeset(p, 'Plate IV — The three axes of the eye', [14, 22], {
    cap: 5.2,
    kind: 'title',
    id: 'title',
  });
  typeset(
    p,
    'The eye turns about three axes through one centre: Z carries the gaze left and right, X lifts and lowers it, Y rolls it.',
    [14, 29],
    { cap: 2.5, italic: true, kind: 'caption', id: 'claim' },
  );
  const notes = [
    'Z — the vertical axis: turning on it carries the gaze',
    '      left and right.',
    'X — the transverse axis: turning on it lifts and',
    '      lowers the gaze.',
    'Y — the line of sight: turning on it rolls the eye',
    '      (torsion); the cornea and pupil sit on it.',
    'Fig. 2 — the gaze turned 30° about Z, seen in plan,',
    'where the turn is true. Fig. 1 foreshortens it.',
    'Axes after A. Fick (1854). Hidden lines dashed.',
  ];
  for (const [i, t] of notes.entries())
    typeset(p, t.trim(), [t.startsWith(' ') ? 185 : 180, 128 + i * 4.4 + (i >= 6 ? 2.2 : 0)], {
      cap: 2.5,
      kind: 'note',
      id: `note-${i + 1}`,
    });
  scaleBar(p, [180, 174], { units: 10, segments: 5, label: 'mm', id: 'scale' });
  typeset(p, 'kiruk · drawn by mai · the night sheet', [180, 190], {
    cap: 2.5,
    italic: true,
    kind: 'caption',
    id: 'colophon',
  });

  // ── the anatomy: every part, checked on its own ──
  p.part({ id: 'globe', name: 'the globe', finish: 'line', measured: ['globe-extent-bottom'] });
  p.part({
    id: 'cornea',
    name: 'cornea rim and pupil',
    finish: 'line',
    measured: { none: 'the plate measures the globe, not the cornea' },
  });
  p.part({
    id: 'planes',
    name: 'equator, sagittal and frontal circles',
    finish: 'line',
    measured: { none: 'great circles of the measured globe' },
  });
  p.part({
    id: 'axis-z',
    name: 'vertical axis',
    key: 'Z',
    finish: 'line',
    measured: { none: 'an axis has direction, not length' },
  });
  p.part({
    id: 'axis-x',
    name: 'transverse axis',
    key: 'X',
    finish: 'line',
    measured: { none: 'an axis has direction, not length' },
  });
  p.part({
    id: 'axis-y',
    name: 'line of sight',
    key: 'Y',
    finish: 'line',
    measured: { none: 'an axis has direction, not length' },
  });
  p.part({
    id: 'sweep',
    name: 'the gaze carried round Z',
    finish: 'line',
    measured: { none: 'its angle is measured true in Fig. 2' },
  });
  p.part({ id: 'plan', name: 'Fig. 2, the plan', finish: 'line', measured: ['gaze-turn'] });
  void globe;
  return p;
}
