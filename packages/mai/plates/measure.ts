/**
 * The measure specimen — how mai measures a figure from the outside, on the new paper
 * (Dawn Departs, navy, the rubric overlay). The visual reference for /kiruk-mai-measure.
 *
 *   I    line types: solid, dashed (hidden), chain (axis), phantom, dotted — by hand and exact
 *   II   a part measured from outside: chain dimensions, overall extents from the ink,
 *        a graduated neatline counted from the part's own hole
 *   III  an angle and a sweep
 *   IV   a UI card: padding and gaps as redlines, in px
 *   V    named points, labels placed into clear paper
 *   VI   a sphere and its axes: hidden circles dashed, axes named at both ends, turn arrows
 *
 *   node packages/mai/scripts/specimen.ts measure
 */
import { arc, circle, spline } from '../src/core/path.ts';
import type { MVec, Vec } from '../src/core/vec.ts';
import { placeLabel, pointMark } from '../src/letter/labels.ts';
import { letter, typeset } from '../src/letter/letter.ts';
import { compass, dimension, ruled } from '../src/measure/measure.ts';
import {
  angleDim,
  centreLines,
  chainDims,
  extents,
  frame,
  neatline,
  padding,
  redline,
  sweep,
} from '../src/measure/outer.ts';
import { camera, wireSphere } from '../src/measure/projection.ts';
import type { LineType } from '../src/plate/linetype.ts';
import { createPlate, type Plate } from '../src/plate/plate.ts';

export default function measureSpecimen(): Plate {
  const p = createPlate({
    id: 'mai-specimen-measure',
    title: 'mai — measuring from the outside',
    claim:
      'A figure states its own size and place: its lines say what they are, and every value round its edge is measured from its ink.',
    size: [280, 190],
    margins: [12, 12, 12, 12],
    style: 'dawn-new',
    seed: 21,
    eye: { motif: 'drawn', ref: 'panel VI, the globe with its three axes of rotation' },
    device: 'side-by-side comparison of measuring conventions',
    views: 6,
    scale: { unit: 'mm', perMm: 1, digits: 0 },
  });
  p.fact(
    'iso128.elements',
    'dot ≤ 0.5d, gap 3d, dash 12d, long dash 24d',
    'ISO 128-20 (2002), lengths of line elements in multiples of the line width d',
    '',
  );
  p.fact('ui.scale', 4, 'this specimen: the UI card is drawn at 4 px to the mm', 'px/mm');
  const head = (n: string, t: string, at: Vec) =>
    typeset(p, `${n} · ${t}`, at, { cap: 2.6, kind: 'caption', italic: true, id: `h-${n}` });

  // I · line types
  head('I', 'line types: drawn and exact', [14, 20]);
  const types: LineType[] = ['solid', 'dashed', 'chain', 'phantom', 'dotted'];
  types.forEach((t, i) => {
    const y = 28 + i * 7;
    letter(p, t, [14, y + 1], { cap: 2.5, kind: 'note', id: `lt-${t}` });
    p.stroke(
      [
        [34, y],
        [62, y],
      ],
      { role: 'contour', guide: 'ruler', line: t, pressure: 0.5, id: `lt-hand-${t}` },
    );
    p.stroke(
      [
        [66, y],
        [94, y],
      ],
      { role: 'overlay', guide: 'exact', line: t, id: `lt-exact-${t}` },
    );
  });
  typeset(p, 'hand', [42, 66], { cap: 2.5, kind: 'note', id: 'lt-hand' });
  typeset(p, 'exact', [74, 66], { cap: 2.5, kind: 'note', id: 'lt-exact' });

  // II · a part measured from outside
  head('II', 'a part, measured from outside', [112, 20]);
  const ox = 124;
  const oy = 50;
  const outline: MVec[] = [
    [ox, oy],
    [ox + 60, oy],
    [ox + 60, oy + 14],
    [ox + 26, oy + 14],
    [ox + 26, oy + 36],
    [ox, oy + 36],
    [ox, oy],
  ];
  const body = p.stroke(outline, {
    role: 'contour',
    guide: 'ruler',
    id: 'part-outline',
    anchored: true,
    pressure: 0.62,
    part: 'bracket',
  });
  const holes: Vec[] = [
    [ox + 13, oy + 7],
    [ox + 40, oy + 7],
    [ox + 52, oy + 7],
  ];
  holes.forEach((h, i) => {
    p.stroke(circle(h, 3, -1, 0.15), {
      role: 'contour',
      guide: 'compass',
      id: `hole-${i + 1}`,
      pressure: 0.5,
      part: 'bracket',
    });
    // centre lines are thin chain lines of the measuring layer (ISO 128), not construction
    centreLines(p, h, 3, { over: 2.5, id: `hole-${i + 1}-c` });
  });
  p.addConstruction({
    id: 'part-centres',
    kind: 'axis',
    path: holes.map((h) => [h[0], h[1]] as MVec),
    generates: ['hole-1', 'hole-2', 'hole-3'],
  });
  // chain from the left edge through the hole centres, overall one tier further out
  chainDims(
    p,
    [
      [ox, oy],
      [holes[0]![0], oy],
      [holes[1]![0], oy],
      [holes[2]![0], oy],
      [ox + 60, oy],
    ],
    { axis: 'x', offset: -8, id: 'part-chain', digits: 0, unit: 'none' },
  );
  extents(p, body, { sides: ['right'], tier: 9, id: 'part-extent', unit: 'none' });
  neatline(p, [ox - 8, oy - 22, ox + 76, oy + 42], {
    every: 5,
    major: 2,
    origin: holes[0] as Vec,
    id: 'part-neat',
    numbers: true,
  });
  typeset(p, 'all values in mm, counted from the first hole', [ox - 8, oy + 49], {
    cap: 2.5,
    kind: 'note',
    italic: true,
    id: 'part-unit',
  });
  p.part({
    id: 'bracket',
    name: 'L bracket',
    finish: 'line',
    measured: ['part-chain-overall', 'part-extent-right'],
  });

  // III · angle and sweep
  head('III', 'an angle and a sweep', [214, 20]);
  const v: Vec = [222, 64];
  const a: Vec = [262, 64];
  const b: Vec = [222 + 36 * Math.cos(-0.72), 64 + 36 * Math.sin(-0.72)];
  p.stroke([v, a], { role: 'contour', guide: 'ruler', id: 'ray-a', pressure: 0.55 });
  p.stroke([v, b], { role: 'contour', guide: 'ruler', id: 'ray-b', pressure: 0.55 });
  angleDim(p, v, a, b, { r: 16, id: 'angle-1' });
  compass(p, [250, 48], 5, {
    id: 'turn-centre',
    role: 'contour',
    prick: true,
    generates: ['turn'],
  });
  sweep(p, [250, 48], 9.5, -2.6, 1.4, { arrow: 'end', id: 'turn' });

  // IV · a UI card, its padding and gaps in px (the drawing is at 4 px per mm)
  head('IV', 'a UI card: padding and gaps, in px', [14, 104]);
  const card: [number, number, number, number] = [16, 114, 96, 168];
  const titleBox: [number, number, number, number] = [22, 120, 90, 128];
  const textBox: [number, number, number, number] = [22, 132, 90, 150];
  const button: [number, number, number, number] = [22, 154, 52, 162];
  frame(p, card, { radius: 3, id: 'ui-card', part: 'card' });
  frame(p, titleBox, { id: 'ui-title', pressure: 0.35, part: 'card' });
  frame(p, textBox, { id: 'ui-text', pressure: 0.35, part: 'card' });
  frame(p, button, { radius: 2, id: 'ui-button', part: 'card' });
  // padding is measured to the content that is there, each side to its nearest element
  // the unit is stated once (the heading and the note), so a 6 mm gap holds its value
  padding(p, card, [titleBox, textBox, button], { unit: 'none', perMm: 4, id: 'ui-pad' });
  redline(p, titleBox, textBox, { unit: 'none', perMm: 4, id: 'ui-gap-1' });
  redline(p, textBox, button, { unit: 'none', perMm: 4, id: 'ui-gap-2' });
  // the card's corners are round: measure its width where the sides run straight (at the
  // tangent points), so the extension lines continue the sides and both ends land on ink
  dimension(p, [card[0], card[3] - 3], [card[2], card[3] - 3], {
    axis: 'x',
    offset: 3 + 7,
    unit: 'none',
    perMm: 4,
    digits: 0,
    id: 'ui-width',
    kind: 'overall',
  });
  typeset(p, 'all values in px, at 4 px to the mm', [16, 182.5], {
    cap: 2.5,
    kind: 'note',
    italic: true,
    id: 'ui-unit',
  });

  // V · named points, labels placed into clear paper
  head('V', 'named points, labels in clear paper', [112, 104]);
  const c1: Vec = [138, 142];
  const c2: Vec = [160, 146];
  const k1 = compass(p, c1, 13, { id: 'circle-c1', role: 'contour' });
  const k2 = compass(p, c2, 9, { id: 'circle-c2', role: 'contour' });
  p.stroke(circle(c1, 21, 0.4, 0.3), {
    role: 'construction',
    line: 'dashed',
    id: 'circle-c3',
    pressure: 0.4,
  });
  const t1: Vec = [118, 128];
  const t2: Vec = [182, 160];
  p.stroke([t1, t2], { role: 'contour', guide: 'ruler', id: 'secant', pressure: 0.48 });
  ruled(p, [114, 142], [186, 142], { id: 'x-axis', kind: 'axis', generates: ['circle-c1'] });
  p.generated(k1.id, 'secant');
  p.generated(k2.id, 'secant');
  const named: [string, Vec][] = [
    ['O', c1],
    ['A', c2],
    ['M_{1}', [c1[0] + 13, 142]],
    ['T′', t1],
    ['P', [150, 133.2]],
  ];
  named.forEach(([name, q], i) => {
    pointMark(p, q, { style: 'ring-dot', id: `pt-${i}` });
    placeLabel(p, name, q, { cap: 2.6, id: `pt-label-${i}` });
  });
  typeset(p, 'FIG. 3', [150, 178], { cap: 2.5, anchor: 'middle', kind: 'caption', id: 'fig3' });

  // VI · a sphere and its axes
  head('VI', 'a sphere, its axes and turns', [206, 104]);
  const cam = camera({ center: [238, 146], scale: 15, yaw: -28, pitch: 16 });
  wireSphere(p, {
    id: 'globe',
    cam,
    radius: 1,
    circles: [
      { id: 'equator', n: [0, 1, 0] },
      { id: 'meridian', n: [1, 0, 0] },
      { id: 'frontal', n: [0, 0, 1] },
    ],
    axes: [
      { id: 'axis-c', dir: [0, 1, 0], labels: ['C', 'C′'], extend: 0.9, turn: 1 },
      { id: 'axis-a', dir: [1, 0, 0], labels: ['A', 'A′'], extend: 0.8, turn: -1 },
      { id: 'axis-b', dir: [0, 0, 1], labels: ['B', 'B′'], extend: 2.2 },
    ],
    cap: 2.6,
  });

  typeset(
    p,
    'mai — measuring from the outside · Dawn Departs, dawn navy, the rubric line',
    [14, 188],
    { cap: 2.5, italic: true, kind: 'caption', id: 'colophon' },
  );
  void arc;
  void spline;
  return p;
}
