/**
 * Round two's promises, as tests: outer measurement, line types, projection, labels, the
 * calculation traces, and the critic checks that read them. Each test names the ledger row
 * it guards (packages/mai/docs/ledger.md).
 */
import { describe, expect, it } from 'vitest';
import { circle, line } from '../src/core/path.ts';
import { createRng } from '../src/core/rng.ts';
import type { MVec, Vec } from '../src/core/vec.ts';
import { critique } from '../src/critic/critic.ts';
import { HANDS, perform } from '../src/hand/hand.ts';
import { INKS } from '../src/ink/inks.ts';
import { placeLabel } from '../src/letter/labels.ts';
import { letter } from '../src/letter/letter.ts';
import { dimension, valueInk } from '../src/measure/measure.ts';
import {
  angleDim,
  centreLines,
  chainDims,
  extents,
  frame,
  neatline,
  padding,
  redline,
} from '../src/measure/outer.ts';
import { camera, wireSphere } from '../src/measure/projection.ts';
import { dashes } from '../src/plate/linetype.ts';
import { createPlate, type Plate } from '../src/plate/plate.ts';

const sheet = (
  id: string,
  style: 'dawn-new' | 'night' | 'architect' = 'dawn-new',
  trace = false,
): Plate =>
  createPlate({
    id,
    title: 'outer test plate',
    claim: 'a plate that exists only to test outer measurement',
    size: [200, 150],
    style,
    eye: { motif: 'none', justification: 'a test sheet, never shown' },
    device: 'construction',
    views: 2,
    trace,
  });
const status = (r: ReturnType<typeof critique>, id: string) =>
  r.checks.find((c) => c.id === id)?.status;
const rng = () => createRng(7);

describe('the hand reads curves, not vertices', () => {
  it('a circle handed over as 1 mm chords reads κ ≈ 1/R (MA-27)', () => {
    const pts: MVec[] = [];
    const n = 50;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 1.6;
      pts.push([60 + 10 * Math.cos(a), 60 + 10 * Math.sin(a)]);
    }
    const perf = perform(
      { path: pts, role: 'contour', guide: 'free', pressure: 0.6 },
      HANDS.right,
      rng(),
    );
    const ks = perf.samples.map((q) => q.k).filter((k) => k > 0);
    const mid = ks.slice(Math.floor(ks.length * 0.2), Math.floor(ks.length * 0.8));
    const mean = mid.reduce((a, b) => a + b, 0) / mid.length;
    const sd = Math.sqrt(mid.reduce((a, b) => a + (b - mean) ** 2, 0) / mid.length);
    expect(mean).toBeGreaterThan(0.097);
    expect(mean).toBeLessThan(0.103);
    expect(sd / mean).toBeLessThan(0.1);
  });

  it('where the bend binds, speed is K·κ^(−1/3) exactly, and the trace says so', () => {
    const p = sheet('trace', 'dawn-new', true);
    const pts: MVec[] = [];
    for (let x = 10; x <= 50; x += 0.5)
      pts.push([x, 40 + 8 * Math.sin(((x - 10) / 30) * Math.PI * 2)]);
    const [m] = p.stroke(pts, { role: 'contour', pressure: 0.6, id: 'wave' });
    const tr = m?.trace;
    expect(tr).toBeDefined();
    if (!tr) return;
    for (const key of ['t', 'x', 'y', 'v', 'k', 'p', 'w', 'load'] as const)
      expect(tr[key].length).toBe(tr.s.length);
    expect(tr.K).toBeGreaterThan(0);
    let bound = 0;
    for (let i = 0; i < tr.s.length; i++) {
      const k = tr.k[i] as number;
      if (!(k > 1e-3)) continue;
      const law = tr.K * k ** (-1 / 3);
      if (Math.abs((tr.v[i] as number) - law) / law < 1e-6) bound++;
      expect(tr.v[i] as number).toBeLessThanOrEqual(law * (1 + 1e-9));
    }
    expect(bound).toBeGreaterThan(20);
  });
});

describe('ink', () => {
  it('the exact overlay keeps one density: no dip rhythm (MA-26)', () => {
    const p = sheet('steady');
    const ms = [];
    for (let i = 0; i < 30; i++)
      ms.push(
        ...p.stroke(line([10, 5 + i * 4], [190, 5 + i * 4]), { role: 'overlay', guide: 'exact' }),
      );
    const d = ms.map((m) => m.stats.density);
    expect(Math.max(...d) - Math.min(...d)).toBeLessThan(1e-9);
    expect(ms.some((m) => m.stats.dip)).toBe(false);
  });

  it('a fresh dip blots a letter no wider than a third of its cap (MA-16)', () => {
    const p = sheet('blots', 'architect');
    for (let i = 0; i < 24; i++)
      letter(p, '345 mm', [10, 10 + i * 5], { cap: 2.5, kind: 'dimension', id: `v${i}` });
    const letters = p.marks.filter((m) => m.role === 'letter');
    expect(letters.length).toBeGreaterThan(50);
    for (const m of letters) expect(2 * m.stats.poolMax).toBeLessThanOrEqual(0.32 * 2.5);
    expect(status(critique(p), 'type.blots')).toBe('pass');
  });

  it('values letter in the type red, never the line red (MA-17)', () => {
    const p = sheet('value-ink');
    expect(INKS.rubric.typeInk).toBe('rubric-type');
    expect(valueInk(p, 'dimension')).toBe('rubric-type');
    dimension(p, [20, 40], [80, 40], { axis: 'x', offset: -10, id: 'd' });
    p.stroke(line([20, 40], [80, 40]), { role: 'contour', id: 'edge' });
    const r = critique(p);
    expect(status(r, 'type.value-ink')).toBe('pass');
    expect(p.marks.filter((m) => m.group === 'd-value').every((m) => m.ink === 'rubric-type')).toBe(
      true,
    );
  });
});

describe('line types', () => {
  it('a centred chain line crosses on a dash, at any length (MA-20)', () => {
    for (let L = 30; L <= 150; L += 7) {
      const ds = dashes(line([0, 0], [L, 0]), 'chain', {
        d: 0.25,
        hand: false,
        rng: rng(),
        centred: true,
      });
      const onDash = ds.some(
        (q) =>
          !q.dot &&
          (q.pts[0] as MVec)[0] <= L / 2 + 1e-6 &&
          (q.pts[q.pts.length - 1] as MVec)[0] >= L / 2 - 1e-6,
      );
      expect(onDash, `L = ${L}`).toBe(true);
    }
    // too short for two periods: one continuous line, as ISO 128 allows for small circles
    const short = dashes(line([0, 0], [10, 0]), 'chain', {
      d: 0.25,
      hand: false,
      rng: rng(),
      centred: true,
    });
    expect(short.length).toBe(1);
  });

  it('an exact chain line keeps its dots (MA-28)', () => {
    const p = sheet('dots');
    const ms = p.stroke(line([10, 20], [130, 20]), {
      role: 'overlay',
      guide: 'exact',
      line: 'chain',
      id: 'axis',
    });
    const dots = ms.filter((m) => m.spine.length === 1);
    const longs = ms.filter((m) => m.spine.length > 1);
    expect(dots.length).toBeGreaterThan(5);
    expect(Math.abs(dots.length - longs.length)).toBeLessThanOrEqual(1);
    for (const d of dots) expect(d.parts[0]?.kind).toBe('body');
  });

  it('a hidden edge drawn solid fails; dashed passes', () => {
    const red = sheet('hidden-red');
    red.stroke(line([10, 10], [90, 10]), { role: 'contour', hidden: true, id: 'behind' });
    expect(status(critique(red), 'line.hidden')).toBe('fail');
    const green = sheet('hidden-green');
    green.stroke(line([10, 10], [90, 10]), {
      role: 'contour',
      hidden: true,
      line: 'dashed',
      id: 'behind',
    });
    expect(status(critique(green), 'line.hidden')).toBe('pass');
  });

  it('dashes are judged only on lines long enough to judge (MA-14)', () => {
    const p = sheet('dash-judge');
    p.stroke(line([10, 10], [30, 10]), {
      role: 'contour',
      guide: 'ruler',
      line: 'dashed',
      id: 'short',
    });
    p.stroke(line([10, 30], [190, 30]), {
      role: 'contour',
      guide: 'ruler',
      line: 'dashed',
      id: 'long',
    });
    p.stroke(line([10, 50], [190, 50]), {
      role: 'overlay',
      guide: 'exact',
      line: 'dashed',
      id: 'exact',
    });
    expect(status(critique(p), 'line.dashes')).toBe('pass');
  });
});

describe('outer measurement', () => {
  const bracket = (p: Plate) =>
    p.stroke(
      [
        [40, 50],
        [120, 50],
        [120, 70],
        [70, 70],
        [70, 100],
        [40, 100],
        [40, 50],
      ],
      { role: 'contour', guide: 'ruler', anchored: true, id: 'part' },
    );

  it('a chain sums to its overall, and the overall stands outside it', () => {
    const p = sheet('chain');
    bracket(p);
    chainDims(
      p,
      [
        [40, 50],
        [55, 50],
        [80, 50],
        [120, 50],
      ],
      { axis: 'x', offset: -8, id: 'c', unit: 'none' },
    );
    const parts = p.dimensions.filter((d) => d.kind === 'chain').reduce((a, d) => a + d.value, 0);
    const overall = p.dimensions.find((d) => d.id === 'c-overall');
    expect(Math.abs(parts - (overall?.value ?? 0))).toBeLessThan(1e-9);
    const r = critique(p);
    expect(status(r, 'measure.tiers-order')).toBe('pass');
    expect(status(r, 'measure.tier-gap')).toBe('pass');
  });

  it('two tiers 2 mm apart fail; extents() steps a tier beyond what stands there (MA-23)', () => {
    const red = sheet('tiers-red');
    const body = bracket(red);
    dimension(red, [120, 50], [120, 70], { axis: 'y', offset: 10, id: 'inner' });
    dimension(red, [120, 50], [70, 100], { axis: 'y', offset: 12, id: 'outer', kind: 'overall' });
    expect(status(critique(red), 'measure.tier-gap')).toBe('fail');
    const green = sheet('tiers-green');
    const body2 = bracket(green);
    dimension(green, [120, 50], [120, 70], { axis: 'y', offset: 10, id: 'inner' });
    extents(green, body2, { sides: ['right'], tier: 9, id: 'ext' });
    expect(status(critique(green), 'measure.tier-gap')).toBe('pass');
    void body;
  });

  it('extents measure the part and clear the whole drawing (MA-22)', () => {
    const p = sheet('clear');
    const part = bracket(p);
    const below = p.stroke(line([40, 120], [120, 120]), { role: 'contour', id: 'shaft-break' });
    const { extremes } = extents(p, part, {
      sides: ['bottom'],
      tier: 8,
      id: 'cap',
      clear: [...part, ...below],
    });
    const d = p.dimensions.find((x) => x.id === 'cap-bottom');
    expect(d).toBeDefined();
    expect(Math.abs((d?.value ?? 0) - (extremes.right[0] - extremes.left[0]))).toBeLessThan(1e-9);
    expect(d?.line[0][1] ?? 0).toBeGreaterThan(120 + 6);
  });

  it('a neatline is graduated at the plate’s scale and counted from its origin', () => {
    const p = sheet('neat');
    bracket(p);
    neatline(p, [30, 30, 140, 110], { every: 10, major: 2, origin: [40, 50], id: 'n' });
    const r = critique(p);
    expect(status(r, 'measure.neatline:n')).toBe('pass');
    expect(status(r, 'measure.outer')).toBe('pass');
    expect(p.texts.some((t) => t.id.startsWith('n-nx') && t.text === '0')).toBe(true);
  });

  it('an angle says what its rays make, and a part measured by it is complete (MA-15)', () => {
    const p = sheet('angle');
    const v: Vec = [60, 80];
    p.stroke(line(v, [110, 80]), { role: 'contour', guide: 'ruler', id: 'ray-a' });
    p.stroke(line(v, [60 + 40 * Math.cos(-0.6), 80 + 40 * Math.sin(-0.6)]), {
      role: 'contour',
      guide: 'ruler',
      id: 'ray-b',
    });
    angleDim(p, v, [110, 80], [60 + 40 * Math.cos(-0.6), 80 + 40 * Math.sin(-0.6)], {
      r: 18,
      id: 'ang',
    });
    p.part({ id: 'ray', name: 'the two rays', finish: 'line', measured: ['ang'] });
    const r = critique(p);
    expect(status(r, 'measure.angle:ang')).toBe('pass');
    expect(p.angles[0]?.text).toBe('34°');
    expect(r.anatomy.find((a) => a.id === 'ray')?.ok).toBe(true);
  });

  it('redlines sit in their gap: the drafting tier rules skip them, truth still applies (MA-18)', () => {
    const p = sheet('redline');
    const card: [number, number, number, number] = [20, 20, 100, 80];
    const a: [number, number, number, number] = [26, 26, 94, 34];
    const b: [number, number, number, number] = [26, 40, 94, 60];
    const c: [number, number, number, number] = [26, 66, 56, 74];
    for (const [i, q] of [card, a, b, c].entries())
      frame(p, q, { id: `f${i}`, radius: i === 0 ? 3 : 0 });
    padding(p, card, [a, b, c], { unit: 'px', perMm: 4, id: 'pad' });
    redline(p, a, b, { unit: 'px', perMm: 4, id: 'gap' });
    const r = critique(p);
    expect(
      r.checks.some((x) => x.id === 'measure.tier:gap' || x.id === 'measure.extension:gap'),
    ).toBe(false);
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(status(r, `measure.true:pad-${side}`)).toBe('pass');
      expect(status(r, `measure.on-ink:pad-${side}`), side).toBe('pass');
    }
  });

  it('centre lines cross on a dash and run past the circle', () => {
    const p = sheet('centre');
    p.stroke(circle([60, 60], 8, -1, 0.15), { role: 'contour', guide: 'compass', id: 'hole' });
    const { marks } = centreLines(p, [60, 60], 8, { over: 3, id: 'cl' });
    const xs = marks.flatMap((m) => m.spine.map((q) => q[0]));
    expect(Math.min(...xs)).toBeLessThan(60 - 8 - 2);
    expect(
      marks.some(
        (m) =>
          m.spine.length > 1 &&
          m.spine.some((q) => Math.abs(q[0] - 60) < 0.3 && Math.abs(q[1] - 60) < 0.3),
      ),
    ).toBe(true);
  });
});

describe('projection and labels', () => {
  it('a wire sphere dashes what is behind and names its axes outside the globe', () => {
    const p = sheet('sphere', 'night');
    const cam = camera({ center: [100, 75], scale: 30, yaw: -30, pitch: 20 });
    const g = wireSphere(p, {
      id: 'globe',
      cam,
      radius: 1,
      circles: [{ id: 'eq', n: [0, 1, 0] }],
      axes: [{ id: 'ax', dir: [0, 1, 0], labels: ['Z', 'Z′'], extend: 0.8, turn: 1 }],
    });
    const hidden = p.marks.filter((m) => m.hidden);
    expect(hidden.length).toBeGreaterThan(0);
    for (const m of hidden) expect(m.lineType).not.toBe('solid');
    for (const id of ['ax-label-a', 'ax-label-b']) {
      const t = p.texts.find((x) => x.id === id);
      expect(t).toBeDefined();
      const cx = ((t?.box[0] ?? 0) + (t?.box[2] ?? 0)) / 2;
      const cy = ((t?.box[1] ?? 0) + (t?.box[3] ?? 0)) / 2;
      expect(Math.hypot(cx - g.centre[0], cy - g.centre[1])).toBeGreaterThan(g.radiusMm);
    }
    const r = critique(p);
    expect(status(r, 'line.hidden')).toBe('pass');
    expect(status(r, 'connect.axes-named')).toBe('pass');
  });

  it('a label is set into clear paper, not across the ink', () => {
    const p = sheet('label');
    // ink to the upper right of the point, where a label would go first
    for (let i = 0; i < 6; i++)
      p.stroke(line([61, 52 - i], [72, 52 - i]), {
        role: 'contour',
        guide: 'ruler',
        id: `ink-${i}`,
      });
    const t = placeLabel(p, 'P', [60, 55], { cap: 2.6, id: 'p' });
    const box = p.texts.find((x) => x.id === 'p')?.box;
    expect(box).toBeDefined();
    const crossing = p.marks
      .filter((m) => m.id.startsWith('ink-'))
      .some((m) =>
        m.spine.some(
          (q) => box && q[0] > box[0] && q[0] < box[2] && q[1] > box[1] && q[1] < box[3],
        ),
      );
    expect(crossing).toBe(false);
    expect(t.score).toBeLessThan(100);
  });

  it('keys are counted by name, not by label (MA-13)', () => {
    const p = sheet('keys');
    for (const [i, k] of ['A', 'A′', 'B', 'B′', 'C', 'C′', 'A'].entries())
      letter(p, k, [20 + i * 12, 40], { cap: 3, kind: 'key', id: `k${i}` });
    const ck = critique(p).checks.find((c) => c.id === 'type.keys');
    expect(ck?.status).toBe('pass');
    expect(ck?.value).toMatch(/3 named parts/);
  });
});

describe('lettering', () => {
  it('a character with no glyph is recorded, never drawn as a blank (MA-24)', () => {
    const p = sheet('glyphs');
    letter(p, 'mm · 1:4 → Δ 41°', [10, 20], { cap: 2.5, kind: 'scale', id: 'drawn' });
    expect(p.texts.find((t) => t.id === 'drawn')?.missing).toBeUndefined();
    letter(p, 'Σ 3', [10, 40], { cap: 2.5, kind: 'note', id: 'sum' });
    expect(p.texts.find((t) => t.id === 'sum')?.missing).toBe('Σ');
    expect(status(critique(p), 'type.glyphs')).toBe('fail');
  });
});
