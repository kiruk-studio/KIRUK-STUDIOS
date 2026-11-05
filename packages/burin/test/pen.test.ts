/**
 * The pen's vocabulary: widths, tapers, and how a line is laid as strokes.
 * spec-link: ideas/studio-dawn/ink-strokes.md
 */
import { describe, expect, it } from 'vitest';
import {
  byX,
  chalkWidth,
  cutWidth,
  HAIRLINE,
  Hand,
  hairWidth,
  type Meta,
  parseAbsPath,
  taperRuns,
} from '../src/hand/pen';

const meta: Meta = { ink: 'ink', layer: 'skin', pass: 3, group: 'test', pen: 'hatch' };

describe('cutWidth', () => {
  it('is paper at and below the faintest tone, and for NaN', () => {
    expect(cutWidth(0, 4, 1, 10)).toBe(0);
    expect(cutWidth(0.018, 4, 1, 10)).toBe(0);
    expect(cutWidth(-1, 4, 1, 10)).toBe(0);
    expect(cutWidth(Number.NaN, 4, 1, 10)).toBe(0);
  });

  it('breaks into flicks of hairline in the faintest tones', () => {
    for (let idx = 0; idx < 20; idx++) {
      let gaps = 0;
      for (let s = 0; s < 300; s += 0.5) {
        const w = cutWidth(0.05, 4, idx, s);
        expect(w).toBeGreaterThanOrEqual(0);
        expect(w).toBeLessThanOrEqual(HAIRLINE * 1.12 + 1e-9);
        if (w === 0) gaps++;
      }
      expect(gaps).toBeGreaterThan(0);
    }
  });

  it('is continuous from hairline to full in the body of the tones, never broken', () => {
    for (let idx = 0; idx < 20; idx++)
      for (let s = 0; s < 300; s += 3) {
        const w = cutWidth(0.11, 4, idx, s);
        expect(w).toBeGreaterThanOrEqual(HAIRLINE * 0.88 * 0.88 - 1e-9);
      }
  });

  it('grows with tone for one line at one place (tone by width)', () => {
    for (let idx = 0; idx < 10; idx++)
      for (let s = 0; s < 200; s += 17) {
        let prev = 0;
        for (let t = 0.1; t <= 1.2; t += 0.01) {
          const w = cutWidth(t, 4, idx, s);
          expect(w).toBeGreaterThanOrEqual(prev - 1e-12);
          prev = w;
        }
      }
  });

  it('at full tone the line fills about its pitch, never twice it', () => {
    const pitch = 4;
    let sum = 0;
    let n = 0;
    for (let idx = 0; idx < 200; idx++)
      for (let s = 0; s < 400; s += 3) {
        const w = cutWidth(1, pitch, idx, s);
        expect(2 * w).toBeLessThan(pitch * 1.2);
        sum += 2 * w;
        n++;
      }
    // On average a sliver of paper shows between neighbours.
    expect(sum / n).toBeLessThan(pitch);
    expect(sum / n).toBeGreaterThan(pitch * 0.8);
  });
});

describe('chalkWidth', () => {
  it('skips on the tooth and stays near its base where it lies', () => {
    const base = 0.5;
    let gaps = 0;
    let n = 0;
    for (let idx = 0; idx < 10; idx++)
      for (let s = 0; s < 400; s += 0.5) {
        const w = chalkWidth(base, s, idx);
        n++;
        if (w === 0) {
          gaps++;
          continue;
        }
        expect(w).toBeGreaterThanOrEqual(base * 0.71 * 0.8);
        expect(w).toBeLessThanOrEqual(base * 1.15 * 1.25);
      }
    expect(gaps).toBeGreaterThan(0);
    expect(gaps / n).toBeLessThan(0.5); // crumbly, not dotted
  });
});

describe('hairWidth', () => {
  it('is heavy at the root, a hairline toward the tip, nothing at the tip', () => {
    const root = 1.4;
    expect(hairWidth(0.1, root)).toBeGreaterThan(hairWidth(0.9, root));
    expect(hairWidth(0.9, root)).toBeGreaterThanOrEqual(HAIRLINE * 0.7);
    expect(hairWidth(1, root)).toBe(0);
    let prev = Number.POSITIVE_INFINITY;
    for (let u = 0.08; u <= 1; u += 0.01) {
      const w = hairWidth(u, root);
      expect(w).toBeLessThanOrEqual(prev + 1e-12);
      expect(w).toBeLessThanOrEqual(root);
      prev = w;
    }
  });

  it('clamps u outside 0 … 1', () => {
    expect(hairWidth(-1, 1)).toBe(hairWidth(0, 1));
    expect(hairWidth(2, 1)).toBe(0);
  });
});

describe('taperRuns', () => {
  it('enters thin and leaves thin on every run, leaving gaps and the middle alone', () => {
    const w = new Float32Array(60).fill(1);
    for (let i = 25; i < 30; i++) w[i] = 0;
    taperRuns(w, 1, 6);
    expect(w[0]).toBe(0);
    expect(w[24]).toBe(0);
    expect(w[30]).toBe(0);
    expect(w[59]).toBe(0);
    for (let i = 25; i < 30; i++) expect(w[i]).toBe(0);
    expect(w[12]).toBe(1);
    expect(w[45]).toBe(1);
    for (let i = 1; i < 7; i++) expect(w[i]).toBeGreaterThan(w[i - 1]!);
    for (const v of w) expect(v).toBeLessThanOrEqual(1);
  });

  it('never tapers past the middle of a short run, and skips the tiniest', () => {
    const w = new Float32Array(9).fill(1);
    taperRuns(w, 1, 20);
    expect(w[4]).toBeCloseTo(1, 6);
    const dot = new Float32Array([0, 1, 0]);
    taperRuns(dot, 1, 5);
    expect(Array.from(dot)).toEqual([0, 1, 0]);
  });
});

describe('Hand.lay', () => {
  it('lays an inked line as one stroke sampled a step apart, in px', () => {
    const S = 100;
    const h = new Hand(S);
    h.lay(
      byX(-0.5, 0.5, S, () => 0.1),
      () => 1,
      meta,
    );
    expect(h.out).toHaveLength(1);
    const st = h.out[0]!;
    const k = st.w.length;
    expect(k).toBeGreaterThanOrEqual(100);
    expect(st.p.length).toBe(2 * k);
    expect(st.n.length).toBe(2 * k);
    expect(st.from).toBe(0);
    expect(st.to).toBe(k - 1);
    expect(st.p[0]).toBeCloseTo(-50, 4);
    expect(st.p[1]).toBeCloseTo(10, 4);
    for (let i = 1; i < k; i++) expect(st.p[2 * i]! - st.p[2 * i - 2]!).toBeCloseTo(1, 3);
    for (let i = 0; i < k; i++)
      expect(Math.hypot(st.n[2 * i]!, st.n[2 * i + 1]!)).toBeCloseTo(1, 5);
    expect(st).toMatchObject(meta);
  });

  it('splits where the pen would travel far lifted, and keeps short gaps in one stroke', () => {
    const S = 100;
    const long = new Hand(S);
    long.lay(
      byX(0, 1, S, () => 0),
      (x) => (x > 0.3 && x < 0.6 ? 0 : 1),
      meta,
    );
    expect(long.out).toHaveLength(2);
    const short = new Hand(S);
    short.lay(
      byX(0, 1, S, () => 0),
      (x) => (x > 0.45 && x < 0.5 ? 0 : 1),
      meta,
    );
    expect(short.out).toHaveLength(1);
    expect(Array.from(short.out[0]!.w).some((v) => v === 0)).toBe(true);
  });

  it('drops pen-up ends and lays nothing for an empty line', () => {
    const h = new Hand(100);
    h.lay(
      byX(0, 1, 100, () => 0),
      (x) => (x > 0.2 && x < 0.8 ? 1 : 0),
      meta,
    );
    const st = h.out[0]!;
    expect(st.w[0]).toBeGreaterThan(0);
    expect(st.w[st.w.length - 1]).toBeGreaterThan(0);
    h.lay(
      byX(0, 1, 100, () => 0),
      () => 0,
      meta,
    );
    h.lay([], () => 1, meta);
    expect(h.out).toHaveLength(1);
  });

  it('records which samples the resting subject shows', () => {
    const h = new Hand(100);
    h.lay(
      byX(0, 1, 100, () => 0),
      () => 1,
      meta,
      { shown: (x) => x >= 0.5 },
    );
    const st = h.out[0]!;
    expect(st.vis).toBeDefined();
    expect(st.p[2 * st.from]).toBeGreaterThanOrEqual(50 - 1e-3);
    expect(st.p[2 * (st.from - 1)]).toBeLessThan(50);
    expect(st.to).toBe(st.w.length - 1);
    const hidden = new Hand(100);
    hidden.lay(
      byX(0, 1, 100, () => 0),
      () => 1,
      meta,
      { shown: () => false },
    );
    expect(hidden.out[0]!.to).toBeLessThan(hidden.out[0]!.from); // the hand skips it
  });
});

describe('parseAbsPath', () => {
  it('reads M/L/H/V/Z into polygons', () => {
    expect(parseAbsPath('M0 0 L10 0 V5 H0 Z M1 1 L2 2')).toEqual([
      [0, 0, 10, 0, 10, 5, 0, 5],
      [1, 1, 2, 2],
    ]);
  });

  it('flattens a cubic into 8 points ending on its end point', () => {
    const [poly] = parseAbsPath('M0 0 C0 10 10 10 10 0');
    expect(poly).toHaveLength(2 + 16);
    expect(poly!.slice(-2)).toEqual([10, 0]);
  });
});
