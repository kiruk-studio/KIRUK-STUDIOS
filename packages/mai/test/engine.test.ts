/**
 * The engine's promises, as tests: deterministic, a hand (not a plotter), the anomalies
 * of the act present, time off by default, ink capacity as specified (ledger MA-8).
 */
import { describe, expect, it } from 'vitest';
import { line, spline } from '../src/core/path.ts';
import { createRng } from '../src/core/rng.ts';
import { HANDS, perform } from '../src/hand/hand.ts';
import { INKS } from '../src/ink/inks.ts';
import { inkStroke } from '../src/ink/render.ts';
import { INSTRUMENTS } from '../src/nib/instruments.ts';
import { createPaper } from '../src/paper/paper.ts';
import { createPlate } from '../src/plate/plate.ts';

const plate = (id = 't', style: 'codex' | 'architect' = 'codex') =>
  createPlate({
    id,
    title: 'test plate',
    claim: 'a plate that exists only to test the engine',
    size: [120, 90],
    style,
    eye: { motif: 'none', justification: 'a test sheet, never shown' },
    device: 'construction',
  });

describe('determinism', () => {
  it('the same plate draws the same SVG, bit for bit', () => {
    const draw = () => {
      const p = plate('same');
      p.stroke(
        spline([
          [10, 10],
          [40, 20],
          [80, 12],
        ]),
        { role: 'contour' },
      );
      for (let i = 0; i < 10; i++)
        p.stroke(line([10 + i * 2, 40], [16 + i * 2, 50]), { role: 'hatch' });
      return p.toSVG();
    };
    expect(draw()).toBe(draw());
  });

  it('adding a stroke does not re-roll the strokes before it', () => {
    const a = plate('fork');
    const m1 = a.stroke(
      spline([
        [10, 10],
        [40, 20],
        [80, 12],
      ]),
      { role: 'contour', id: 'one' },
    );
    const b = plate('fork');
    b.stroke(line([5, 80], [100, 80]), { role: 'construction', id: 'zero', guide: 'ruler' });
    const m2 = b.stroke(
      spline([
        [10, 10],
        [40, 20],
        [80, 12],
      ]),
      { role: 'contour', id: 'one' },
    );
    expect(m2[0]?.spine).toEqual(m1[0]?.spine);
  });
});

describe('the hand', () => {
  it('slows into a bend (two-thirds power law)', () => {
    const perf = perform(
      {
        path: spline([
          [0, 0],
          [30, 0],
          [32, 2],
          [32, 30],
        ]),
        role: 'contour',
        start: 'touch',
        end: 'lift',
      },
      HANDS.right,
      createRng(4),
    );
    const straight = perf.samples.filter((s) => s.x > 8 && s.x < 22 && Math.abs(s.y) < 0.6);
    const bend = perf.samples.filter((s) => s.x > 30 && s.y > 0.4 && s.y < 2.2);
    const v = (xs: typeof straight) => xs.reduce((a, s) => a + s.v, 0) / xs.length;
    expect(v(bend)).toBeLessThan(v(straight) * 0.85);
  });

  it('trembles a little on a free stroke, almost not at all against a ruler, never when exact', () => {
    const free = perform(
      { path: line([0, 0], [60, 0]), role: 'contour', pace: 0.3 },
      HANDS.left,
      createRng(1),
    );
    const ruled = perform(
      { path: line([0, 0], [60, 0]), role: 'contour', guide: 'ruler', pace: 0.3 },
      HANDS.left,
      createRng(1),
    );
    const exact = perform(
      { path: line([0, 0], [60, 0]), role: 'overlay', guide: 'exact' },
      HANDS.left,
      createRng(1),
    );
    expect(free.tremorRms).toBeGreaterThan(0.004);
    expect(free.tremorRms).toBeLessThan(0.06);
    expect(ruled.tremorRms).toBeLessThan(free.tremorRms * 0.5);
    expect(exact.tremorRms).toBe(0);
    expect(exact.deviation.max).toBeLessThan(1e-9);
  });

  it('a long free contour is drawn in pieces at the hand’s reach', () => {
    const p = plate('lifts');
    const marks = p.stroke(line([5, 40], [115, 40], 0.5), { role: 'contour' });
    expect(marks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ink on paper', () => {
  const paper = createPaper('dawn-light', 2);
  const quill = INSTRUMENTS.quill;
  const ig = INKS['iron-gall'];

  it('a quill draws about its capacity of a 0.4 mm line per dip (MA-8)', () => {
    const state = { reservoir: 1, redipAt: 0, dips: 0, strokesSinceDip: 0, hold: true };
    let drawn = 0;
    const rng = createRng(9);
    for (let i = 0; i < 40 && state.reservoir > 0.02; i++) {
      const perf = perform(
        {
          path: line([0, 0], [20, 0]),
          role: 'contour',
          pressure: 0.5,
          start: 'carry',
          end: 'lift',
        },
        HANDS.left,
        rng,
      );
      const st = inkStroke(perf, quill, ig, paper, state, rng, {
        time: 0,
        layerDensity: 1,
        light: [-1, -1],
      });
      drawn += perf.length * (st.stats.wMean / 0.4);
    }
    // capacity is 240 mm of a 0.4 mm line; allow the pressure-to-width model ±35%
    expect(drawn).toBeGreaterThan(240 * 0.65);
    expect(drawn).toBeLessThan(240 * 1.35);
  });

  it('a pen held dry starves: the line breaks on the paper’s peaks', () => {
    const p = plate('starve');
    const st = p.reservoir('ink', 'quill', 'iron-gall');
    st.reservoir = 0.25;
    st.hold = true;
    const [m] = p.stroke(line([5, 20], [115, 20]), {
      role: 'contour',
      guide: 'ruler',
      pressure: 0.9,
    });
    expect(m?.stats.starved ?? 0).toBeGreaterThan(0.2);
    expect(m?.parts.some((q) => q.grain === 'light')).toBe(true);
  });

  it('dry media never pool or feather', () => {
    const p = plate('dry');
    for (let i = 0; i < 12; i++)
      p.stroke(
        spline([
          [5, 10 + i * 6],
          [60, 8 + i * 6],
          [115, 12 + i * 6],
        ]),
        { role: 'underdrawing', pressure: 0.8, start: 'dip', end: 'stop' },
      );
    for (const m of p.marks) {
      expect(m.stats.pools).toBe(0);
      expect(m.stats.feathers).toBe(0);
    }
  });

  it('width breathes along a free stroke (not a plotter)', () => {
    const p = plate('swell');
    const [m] = p.stroke(
      spline([
        [5, 40],
        [40, 30],
        [80, 50],
        [115, 40],
      ]),
      { role: 'contour' },
    );
    expect(m?.stats.wCv ?? 0).toBeGreaterThan(0.1);
  });

  it('time is off by default: no halo, and a plate cannot age without a reason', () => {
    const p = plate('time');
    for (let i = 0; i < 20; i++)
      p.stroke(line([5, 5 + i * 4], [100, 5 + i * 4]), { role: 'contour' });
    expect(p.marks.some((m) => m.parts.some((q) => q.kind === 'halo'))).toBe(false);
    expect(() =>
      createPlate({
        id: 'aged',
        title: 'aged',
        claim: 'an aged plate without a reason must not build',
        size: [50, 50],
        style: 'codex',
        time: 0.6,
        eye: { motif: 'none', justification: 'a test sheet only' },
        device: 'construction',
      }),
    ).toThrow(/timeReason/);
  });

  it('the overlay is exact: no tremor, no pools, no feathers', () => {
    const p = plate('overlay');
    const [m] = p.stroke(line([5, 5], [100, 5]), { role: 'overlay', guide: 'exact' });
    expect(m?.stats.tremorRms).toBe(0);
    expect(m?.stats.pools).toBe(0);
    expect(m?.stats.feathers).toBe(0);
  });
});
