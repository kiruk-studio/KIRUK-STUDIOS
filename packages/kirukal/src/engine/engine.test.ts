/**
 * These tests exist to stop the laws being "optimized" away later. Each one
 * fails loudly if someone normalizes deviation, randomizes a seed, or scales a
 * stroke — the three changes that quietly make a hand-drawn system look fake.
 */
import { describe, expect, it } from 'vitest';
import { resampleEdge } from './resample';
import { createRandom, hashSeed, pickTake } from './seed';
import { synthesizeFrame } from './synthesize';
import type { Sample, StrokeRecipe } from './types';

/** A wobbly horizontal edge: 4px of deviation at its midpoint. */
const WOBBLY_EDGE: Sample[] = [
  [0, 0, 0.5, 0, 0],
  [25, -4, 0.7, 0, 0],
  [50, 0, 0.9, 0, 0],
  [75, 4, 0.7, 0, 0],
  [100, 0, 0.5, 0, 0],
];

/** Largest perpendicular distance from the straight line joining the endpoints. */
function peakDeviation(samples: readonly Sample[]): number {
  const a = samples[0]!;
  const b = samples[samples.length - 1]!;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  let peak = 0;
  for (const [x, y] of samples) {
    const d = Math.abs((x - a[0]) * (dy / len) - (y - a[1]) * (dx / len));
    if (d > peak) peak = d;
  }
  return peak;
}

describe('resampleEdge — deviation is absolute (law 3)', () => {
  it('keeps wander at the same px amplitude when an edge gets 8x longer', () => {
    const short = resampleEdge(WOBBLY_EDGE, [0, 0], [100, 0]);
    const long = resampleEdge(WOBBLY_EDGE, [0, 0], [800, 0]);

    // Excalidraw scaled roughness with size and users said the hand-drawn feel
    // vanished (excalidraw#7239). A longer edge must wander the same in absolute
    // px — NOT proportionally more, and NOT proportionally less.
    //
    // Tolerance is 0.5px rather than exact: peak deviation is measured at
    // discrete samples, and the two runs land on slightly different parametric
    // positions. The assertion that matters is the ratio — a scaling
    // implementation would put `long` at ~32px, not ~4px.
    expect(Math.abs(peakDeviation(long) - peakDeviation(short))).toBeLessThan(0.5);
    expect(peakDeviation(long)).toBeGreaterThan(3.5);
    expect(peakDeviation(long)).toBeLessThan(4.5);

    // The regression this guards against, stated directly.
    const ratio = peakDeviation(long) / peakDeviation(short);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('spans exactly the requested edge, whatever its length', () => {
    const out = resampleEdge(WOBBLY_EDGE, [10, 5], [410, 5]);
    expect(out[0]![0]).toBeCloseTo(10, 1);
    expect(out[out.length - 1]![0]).toBeCloseTo(410, 1);
  });

  it('re-applies deviation in the target edge frame, so a vertical edge wobbles in x', () => {
    const vertical = resampleEdge(WOBBLY_EDGE, [0, 0], [0, 200]);
    const xs = vertical.map((s) => s[0]);
    expect(Math.max(...xs.map(Math.abs))).toBeGreaterThan(1);
  });

  it('carries pressure through the resample — it is the half rough.js cannot fake', () => {
    const out = resampleEdge(WOBBLY_EDGE, [0, 0], [400, 0]);
    const pressures = out.map((s) => s[2]);
    expect(Math.max(...pressures)).toBeGreaterThan(Math.min(...pressures));
  });

  it('returns nothing for a degenerate edge rather than dividing by zero', () => {
    expect(resampleEdge(WOBBLY_EDGE, [5, 5], [5, 5])).toEqual([]);
    expect(resampleEdge([[0, 0, 1, 0, 0]], [0, 0], [10, 0])).toEqual([]);
  });
});

describe('seed — determinism (law 5)', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRandom(1234);
    const b = createRandom(1234);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('derives a stable seed from identity, so a re-render redraws the same line', () => {
    expect(hashSeed('button:submit')).toBe(hashSeed('button:submit'));
    expect(hashSeed('button:submit')).not.toBe(hashSeed('button:cancel'));
  });

  it('picks a take within range and rejects an empty set', () => {
    expect(pickTake(hashSeed('x'), 3)).toBeLessThan(3);
    expect(() => pickTake(1, 0)).toThrow();
  });
});

const FRAME: StrokeRecipe = {
  id: 'frame.box',
  version: 1,
  capturedAt: '2026-09-08',
  device: { pointerType: 'pen', hasTilt: true },
  referenceBox: [100, 100],
  tier: 'B',
  takes: [
    {
      seed: 0,
      strokes: [
        { role: 'edge-top', samples: WOBBLY_EDGE },
        { role: 'edge-right', samples: WOBBLY_EDGE },
        { role: 'edge-bottom', samples: WOBBLY_EDGE },
        { role: 'edge-left', samples: WOBBLY_EDGE },
      ],
    },
  ],
};

describe('synthesizeFrame', () => {
  it('emits one path per stroke', () => {
    expect(
      synthesizeFrame(FRAME, { width: 200, height: 80, seed: 7, strokeWidth: 2 }),
    ).toHaveLength(4);
  });

  it('is deterministic for a given seed', () => {
    const o = { width: 300, height: 120, seed: 42, strokeWidth: 2 };
    expect(synthesizeFrame(FRAME, o)).toEqual(synthesizeFrame(FRAME, o));
  });

  it('re-draws rather than stretching: a wider box is not a scaled path', () => {
    const narrow = synthesizeFrame(FRAME, { width: 100, height: 100, seed: 1, strokeWidth: 2 });
    const wide = synthesizeFrame(FRAME, { width: 900, height: 100, seed: 1, strokeWidth: 2 });
    expect(wide[0]).not.toBe(narrow[0]);
    // 9-slice would repeat one band; re-synthesis produces a genuinely longer run.
    expect(wide[0]!.length).toBeGreaterThan(narrow[0]!.length);
  });
});
