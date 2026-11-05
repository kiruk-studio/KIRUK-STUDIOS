/**
 * The spine: seeded hands, arc-length sampling, tremor, hatching clipped to a shape.
 * spec-link: ideas/studio-dawn/hand.md
 */
import { describe, expect, it } from 'vitest';
import {
  curve,
  fromSamples,
  hatch,
  inside,
  length,
  PRESSURE,
  type Pt,
  resample,
  rng,
  spine,
  tremor,
} from '../src/hand/spine';

const draw = (seed: number, n = 64) => {
  const h = rng(seed);
  return Array.from({ length: n }, (_, i) => (i % 2 ? h.G(1, 2) : h.R(-3, 5)));
};

const circle = (cx: number, cy: number, r: number, n = 48): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });

const grow = (poly: readonly Pt[], k: number): Pt[] => {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return poly.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k] as const);
};

describe('rng', () => {
  it('is an impression: the same seed draws the same sequence', () => {
    expect(draw(42)).toEqual(draw(42));
  });

  it('different seeds draw different sequences', () => {
    expect(draw(42)).not.toEqual(draw(43));
  });

  it('R stays in its range, with one argument and with two', () => {
    const h = rng(7);
    for (let i = 0; i < 2000; i++) {
      const a = h.R();
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
      const b = h.R(5);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(5);
      const c = h.R(-2, 3);
      expect(c).toBeGreaterThanOrEqual(-2);
      expect(c).toBeLessThan(3);
    }
  });

  it('G has roughly the asked mean and deviation', () => {
    const h = rng(11);
    const n = 20000;
    const xs = Array.from({ length: n }, () => h.G(3, 0.5));
    const mean = xs.reduce((s, x) => s + x, 0) / n;
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
    expect(mean).toBeCloseTo(3, 1);
    expect(sd).toBeCloseTo(0.5, 1);
    expect(xs.every(Number.isFinite)).toBe(true);
  });

  it('pick only returns members, and chance(0) / chance(1) are certain', () => {
    const h = rng(3);
    const xs = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 300; i++) {
      expect(xs).toContain(h.pick(xs));
      expect(h.chance(0)).toBe(false);
      expect(h.chance(1)).toBe(true);
    }
  });
});

describe('length and resample', () => {
  const path: Pt[] = [
    [0, 0],
    [30, 0],
    [30, 40],
    [30, 40], // a repeated point must not break the walk
    [0, 40],
  ];

  it('length is the polyline arc length', () => {
    expect(length(path)).toBeCloseTo(100, 9);
    expect(length([])).toBe(0);
    expect(length([[1, 1]])).toBe(0);
  });

  it('places points every step of arc length, keeping both ends', () => {
    const step = 7;
    const out = resample(path, step);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([0, 40]);
    // Arc position of each point along the original path.
    const arc = (p: [number, number]) => {
      if (p[1] === 0) return p[0];
      if (p[0] === 30) return 30 + p[1];
      return 70 + (30 - p[0]);
    };
    for (let i = 1; i < out.length - 1; i++) {
      expect(arc(out[i]!) - arc(out[i - 1]!)).toBeCloseTo(step, 9);
    }
    // 100 / 7: the start, 14 steps, then the end.
    expect(out.length).toBe(Math.floor(100 / step) + 2);
  });

  it('does not duplicate the end when it falls on a step', () => {
    const out = resample(
      [
        [0, 0],
        [10, 0],
      ],
      2,
    );
    expect(out.map((p) => p[0])).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('handles empty and single-point input', () => {
    expect(resample([], 1)).toEqual([]);
    expect(resample([[2, 3]], 1)).toEqual([[2, 3]]);
  });
});

describe('curve', () => {
  it('samples n + 1 points from t0 to t1 inclusive', () => {
    const pts = curve((t) => [t, t * t], 0, 2, 4);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[2]).toEqual([1, 1]);
    expect(pts[4]).toEqual([2, 4]);
  });
});

describe('tremor', () => {
  const line = curve((t) => [t * 200, 0], 0, 1, 100);

  it('never drifts more than amp, and only sideways', () => {
    const out = tremor(line, 1.5, rng(5));
    expect(out).toHaveLength(line.length);
    out.forEach((p, i) => {
      expect(p[0]).toBeCloseTo(line[i]![0], 9); // a horizontal line drifts only in y
      expect(Math.abs(p[1])).toBeLessThanOrEqual(1.5 + 1e-9);
    });
    expect(Math.max(...out.map((p) => Math.abs(p[1])))).toBeGreaterThan(0.3);
  });

  it('is still where the pen is placed and lifted', () => {
    const out = tremor(line, 3, rng(9));
    expect(out[0]![1]).toBeCloseTo(0, 6);
    expect(out[out.length - 1]![1]).toBeCloseTo(0, 6);
  });

  it('is seeded, and a zero amplitude or a tiny stroke is left alone', () => {
    expect(tremor(line, 2, rng(1))).toEqual(tremor(line, 2, rng(1)));
    expect(tremor(line, 0, rng(1))).toEqual(line);
    const two: Pt[] = [
      [0, 0],
      [1, 1],
    ];
    expect(tremor(two, 5, rng(1))).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });
});

describe('pressure and spine', () => {
  it('every profile stays in 0 … 1.5 over the stroke', () => {
    for (const [name, p] of Object.entries(PRESSURE)) {
      for (let i = 0; i <= 200; i++) {
        const v = p(i / 200);
        expect(v, `${name}(${i / 200})`).toBeGreaterThanOrEqual(0);
        expect(v, `${name}(${i / 200})`).toBeLessThanOrEqual(1.5);
      }
    }
  });

  it('swell enters thin, bites in the middle, leaves thin', () => {
    expect(PRESSURE.swell(0.5)).toBeGreaterThan(PRESSURE.swell(0) * 3);
    expect(PRESSURE.swell(0)).toBeCloseTo(PRESSURE.swell(1), 6);
  });

  it('spine attaches pressure by arc length, never below the floor', () => {
    const pts: Pt[] = [
      [0, 0],
      [1, 0],
      [10, 0],
    ];
    const s = spine(pts, (t) => t);
    expect(s.map((p) => p[2])).toEqual([0.05, 0.1, 1]);
    expect(s.map((p) => [p[0], p[1]])).toEqual(pts);
  });
});

describe('inside', () => {
  const square: Pt[] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  it('ray-casts a polygon', () => {
    expect(inside(5, 5, square)).toBe(true);
    expect(inside(-1, 5, square)).toBe(false);
    expect(inside(5, 11, square)).toBe(false);
  });
});

describe('hatch', () => {
  it('stays inside its region (no overshoot, no bow)', () => {
    const poly = circle(50, 40, 30);
    const out = hatch(poly, { spacing: 3, stroke: 8, overshoot: 0, bow: 0 }, rng(21));
    expect(out.length).toBeGreaterThan(50);
    const loose = grow(poly, 1.01);
    for (const sp of out) {
      expect(sp.length).toBeGreaterThanOrEqual(3);
      for (const [x, y, p] of sp) {
        expect(inside(x, y, loose)).toBe(true);
        expect(p).toBeGreaterThanOrEqual(0.05);
      }
    }
  });

  it('never fills the notch of a concave shape', () => {
    // An L: the square (10…20, 0…10) is the notch.
    const L: Pt[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [20, 10],
      [20, 20],
      [0, 20],
    ];
    const out = hatch(L, { spacing: 1.5, stroke: 0, overshoot: 0, bow: 0 }, rng(4));
    expect(out.length).toBeGreaterThan(5);
    for (const sp of out)
      for (const [x, y] of sp) expect(x > 10.05 && x < 20 && y > 0 && y < 9.95).toBe(false);
  });

  it('runs at the asked angle', () => {
    const angle = Math.PI / 4;
    const out = hatch(circle(0, 0, 40), { angle, spacing: 4, stroke: 0, bow: 0 }, rng(2));
    expect(out.length).toBeGreaterThan(5);
    for (const sp of out) {
      const a = sp[0]!;
      const b = sp[sp.length - 1]!;
      const dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
      expect(Math.abs(Math.sin(dir - angle))).toBeLessThan(1e-6);
    }
  });

  it('a density of 0 lays nothing; the same seed lays the same strokes', () => {
    const poly = circle(0, 0, 20);
    expect(hatch(poly, { spacing: 2, density: () => 0 }, rng(1))).toEqual([]);
    expect(hatch(poly, { spacing: 2, stroke: 6 }, rng(8))).toEqual(
      hatch(poly, { spacing: 2, stroke: 6 }, rng(8)),
    );
  });
});

describe('fromSamples', () => {
  it('maps pen samples to the page and lifts pressure, with a floor', () => {
    const s = fromSamples(
      [
        [1, 2, 0.5, 0.1, 0.2],
        [3, 4, 0],
      ],
      (x, y) => [x * 10, y + 100],
    );
    expect(s[0]![0]).toBe(10);
    expect(s[0]![1]).toBe(102);
    expect(s[0]![2]).toBeCloseTo(0.6, 9);
    expect(s[1]).toEqual([30, 104, 0.05]);
  });
});
