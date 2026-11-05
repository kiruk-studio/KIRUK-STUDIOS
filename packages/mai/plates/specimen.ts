/**
 * The anomaly specimen — every anomaly the engine draws, numbered, on the old paper in the
 * codex manner (goose quill, iron-gall, left hand). The visual reference for
 * docs/anomalies.md and the kiruk-mai skills: when a plate looks wrong, find the number.
 *
 * Not a plate to curate: no claim beyond its own catalogue, so it is baked, not proofed.
 *   node packages/mai/scripts/specimen.ts
 */
import { circle, line, spline } from '../src/core/path.ts';
import type { Vec } from '../src/core/vec.ts';
import { letter, typeset } from '../src/letter/letter.ts';
import { sphere } from '../src/light/forms.ts';
import { contour, hatch } from '../src/light/hatch.ts';
import { compass, ruled } from '../src/measure/measure.ts';
import { createPlate, type Plate } from '../src/plate/plate.ts';

export default function specimen(): Plate {
  const p = createPlate({
    id: 'mai-specimen-anomalies',
    title: 'mai — the anomalies of ink',
    claim:
      'Each numbered mark is one anomaly a real pen leaves, drawn by the engine from the act that causes it.',
    size: [280, 190],
    margins: [12, 12, 12, 12],
    style: 'codex',
    seed: 11,
    eye: { motif: 'drawn', ref: 'specimen 17, a lit sphere drawn as the eye’s globe' },
    device: 'side-by-side comparison of anomalies',
    views: 1,
  });
  const label = (n: number, name: string, at: Vec) => {
    letter(p, String(n), at, { cap: 2.5, kind: 'numeral', id: `n${n}` });
    typeset(p, name, [at[0] + 7, at[1]], { cap: 2.5, kind: 'note', id: `t${n}` });
  };
  const col = [16, 108, 200];
  const row = (r: number) => 26 + r * 24;

  // 1 · pool — a fresh dip, the pen resting before it moves
  label(1, 'pool · a fresh dip rests', [col[0] as number, row(0)]);
  p.reservoir('ink', 'quill', 'iron-gall').reservoir = 0.05;
  p.stroke(
    spline([
      [col[0] as number, row(0) + 6],
      [(col[0] as number) + 20, row(0) + 4],
      [(col[0] as number) + 60, row(0) + 10],
    ]),
    { role: 'contour', start: 'dip', id: 's1' },
  );
  // 2 · taper — a fast flick leaves the paper
  label(2, 'taper · the flick leaves', [col[1] as number, row(0)]);
  for (let i = 0; i < 5; i++)
    p.stroke(
      line([(col[1] as number) + i * 6, row(0) + 13], [(col[1] as number) + 9 + i * 6, row(0) + 4]),
      { role: 'hatch', start: 'touch', end: 'taper', pace: 1.6, id: `s2-${i}` },
    );
  // 3 · hook return — a contour ends in a small return (research 01 §1)
  label(3, 'hook return · a contour ends', [col[2] as number, row(0)]);
  for (let i = 0; i < 3; i++)
    p.stroke(
      spline([
        [(col[2] as number) + i * 20, row(0) + 4],
        [(col[2] as number) + 6 + i * 20, row(0) + 9],
        [(col[2] as number) + 8 + i * 20, row(0) + 15],
      ]),
      { role: 'contour', end: 'hook', id: `s3-${i}` },
    );

  // 4 · swell — pressure and speed: width follows the hand
  label(4, 'swell · width follows pressure', [col[0] as number, row(1)]);
  p.stroke(line([col[0] as number, row(1) + 8], [(col[0] as number) + 70, row(1) + 8]), {
    role: 'contour',
    pressure: (u) => 0.25 + 0.75 * Math.sin(u * Math.PI * 3) ** 2,
    guide: 'ruler',
    id: 's4',
  });
  // 5 · starve — the reservoir runs down: the line thins, pales, breaks on the peaks
  label(5, 'starve · the pen runs dry', [col[1] as number, row(1)]);
  const st = p.reservoir('ink', 'quill', 'iron-gall');
  st.reservoir = 0.32;
  st.hold = true;
  p.stroke(line([col[1] as number, row(1) + 8], [(col[1] as number) + 76, row(1) + 8]), {
    role: 'contour',
    guide: 'ruler',
    pressure: 0.85,
    id: 's5',
  });
  st.hold = false;
  // 6 · rails — a flexed steel nib, low on ink: two tines and a starved middle
  label(6, 'rails · a split nib, flexed and dry', [col[2] as number, row(1)]);
  const sr = p.reservoir('ink', 'steel', 'iron-gall');
  sr.reservoir = 0.3;
  sr.hold = true;
  p.stroke(
    spline([
      [col[2] as number, row(1) + 10],
      [(col[2] as number) + 30, row(1) + 6],
      [(col[2] as number) + 64, row(1) + 10],
    ]),
    { role: 'contour', instrument: 'steel', pressure: 1, id: 's6' },
  );
  sr.hold = false;

  // 7 · feather — ink wicks along the fibres; dip-rhythm row beside it
  label(7, 'feather · wicking along fibres', [col[0] as number, row(2)]);
  for (let i = 0; i < 4; i++)
    p.stroke(
      line(
        [(col[0] as number) + i * 3, row(2) + 4],
        [(col[0] as number) + 40 + i * 3, row(2) + 15],
      ),
      { role: 'contour', guide: 'ruler', pressure: 0.95, pace: 0.4, id: `s7-${i}` },
    );
  // 8 · dip rhythm — dark after the dip, paler as it drains
  label(8, 'dip rhythm · dark, then paler', [col[1] as number, row(2)]);
  p.reservoir('ink', 'quill', 'iron-gall').reservoir = 0.05;
  for (let i = 0; i < 34; i++)
    p.stroke(
      line(
        [(col[1] as number) + i * 2.2, row(2) + 5],
        [(col[1] as number) + 5 + i * 2.2, row(2) + 15],
      ),
      { role: 'hatch', bow: 1, id: `s8-${i}` },
    );
  // 9 · catch — a pushed nib snags the tooth
  label(9, 'catch · pushed up, the nib snags', [col[2] as number, row(2)]);
  for (let i = 0; i < 4; i++)
    p.stroke(
      line(
        [(col[2] as number) + 6 + i * 12, row(2) + 16],
        [(col[2] as number) + 12 + i * 12, row(2) + 4],
      ),
      { role: 'contour', instrument: 'steel', pressure: 0.8, id: `s9-${i}` },
    );

  // 10 · ruler — straight, one edge crisp against the rule, the open edge feathered
  label(10, 'ruler · crisp side, open side', [col[0] as number, row(3)]);
  ruled(p, [col[0] as number, row(3) + 8], [(col[0] as number) + 70, row(3) + 8], {
    role: 'contour',
    id: 's10',
  });
  // 11 · compass — a pricked centre; a circle that never quite closes
  label(11, 'compass · pricked, not closed', [col[1] as number, row(3)]);
  compass(p, [(col[1] as number) + 16, row(3) + 12], 7, { role: 'contour', id: 's11' });
  compass(p, [(col[1] as number) + 44, row(3) + 12], 5, { id: 's11b' });
  // 12 · blind — the stylus leaves no ink, only a groove for the raking light
  label(12, 'blind · a stylus groove', [col[2] as number, row(3)]);
  for (let i = 0; i < 3; i++)
    p.stroke(
      line([col[2] as number, row(3) + 6 + i * 4], [(col[2] as number) + 64, row(3) + 6 + i * 4]),
      { role: 'construction', guide: 'ruler', id: `s12-${i}` },
    );

  // 13 · dry media — graphite, red chalk, silverpoint: grain, no pools
  label(13, 'dry media · graphite, chalk, silver', [col[0] as number, row(4)]);
  p.stroke(
    spline([
      [col[0] as number, row(4) + 6],
      [(col[0] as number) + 35, row(4) + 4],
      [(col[0] as number) + 70, row(4) + 7],
    ]),
    { role: 'underdrawing', instrument: 'graphite', ink: 'graphite', pressure: 0.6, id: 's13a' },
  );
  p.stroke(
    spline([
      [col[0] as number, row(4) + 11],
      [(col[0] as number) + 35, row(4) + 9],
      [(col[0] as number) + 70, row(4) + 12],
    ]),
    { role: 'underdrawing', pressure: 0.7, id: 's13b' },
  );
  p.stroke(
    spline([
      [col[0] as number, row(4) + 16],
      [(col[0] as number) + 35, row(4) + 14],
      [(col[0] as number) + 70, row(4) + 17],
    ]),
    {
      role: 'underdrawing',
      instrument: 'silverpoint',
      ink: 'silverpoint',
      pressure: 0.7,
      id: 's13c',
    },
  );
  // 14 · burin — enters thin, swells as it bites, leaves thin
  label(14, 'burin · thin, swell, thin', [col[1] as number, row(4)]);
  for (let i = 0; i < 4; i++)
    p.stroke(
      line(
        [col[1] as number, row(4) + 5 + i * 3.4],
        [(col[1] as number) + 70, row(4) + 5 + i * 3.4],
      ),
      {
        role: 'contour',
        instrument: 'burin',
        ink: 'carbon',
        pressure: 0.5 + i * 0.15,
        guide: 'exact',
        id: `s14-${i}`,
      },
    );
  // 15 · tremor — the same line drawn slow (it shakes) and fast (it does not)
  label(15, 'tremor · slow shakes, fast flows', [col[2] as number, row(4)]);
  p.stroke(line([col[2] as number, row(4) + 7], [(col[2] as number) + 70, row(4) + 7]), {
    role: 'contour',
    pace: 0.12,
    precision: 0.1,
    id: 's15a',
  });
  p.stroke(line([col[2] as number, row(4) + 14], [(col[2] as number) + 70, row(4) + 14]), {
    role: 'contour',
    pace: 1.8,
    id: 's15b',
  });

  // 16 · lifts — a long line drawn in reach-long pieces: a join over, a join short
  label(16, 'lifts · a long line, in pieces', [col[0] as number, row(5)]);
  p.stroke(
    spline([
      [col[0] as number, row(5) + 9],
      [(col[0] as number) + 40, row(5) + 5],
      [(col[0] as number) + 80, row(5) + 12],
      [(col[0] as number) + 160, row(5) + 7],
    ]),
    { role: 'contour', id: 's16' },
  );
  // 17 · the hand's tone: a lit sphere, left-handed hatching, contour heavy from the light
  label(17, 'tone · one light, the left hand', [col[2] as number, row(5)]);
  const g = sphere('s17', [(col[2] as number) + 22, row(5) + 15], 11);
  hatch(p, { form: g, id: 's17-tone' });
  contour(p, g.outline, { id: 's17-outline', form: 's17' });
  compass(p, [(col[2] as number) + 22, row(5) + 15], 4.2, {
    id: 's17-iris',
    generates: ['s17-outline'],
  });
  p.stroke(circle([(col[2] as number) + 22, row(5) + 15], 1.9), {
    role: 'contour',
    id: 's17-pupil',
    pressure: 0.9,
  });

  typeset(
    p,
    'mai — the anomalies of ink · goose quill, iron-gall, Dawn Light · light from the upper left',
    [col[0] as number, 184],
    { cap: 2.5, italic: true, kind: 'caption', id: 'caption' },
  );
  return p;
}
