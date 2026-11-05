/**
 * Motion solved exactly: the critical spring, the pupil's reflex, the blink, the history.
 */
import { describe, expect, it } from 'vitest';
import { BLINK, BLINK_LENGTH, blinkAt, Critical, History, Reflex } from '../src/motion/dynamics';

describe('Critical', () => {
  it('converges to its target without overshoot', () => {
    const c = new Critical(0, 12);
    c.set(1);
    let prev = c.x;
    for (let i = 0; i < 240; i++) {
      const x = c.step(1 / 60);
      expect(x).toBeLessThanOrEqual(1);
      expect(x).toBeGreaterThanOrEqual(prev); // monotone from rest
      prev = x;
    }
    expect(c.x).toBe(1);
    expect(c.v).toBe(0);
    expect(c.done).toBe(true);
  });

  it('is exact: one big step lands where many small ones do', () => {
    const a = new Critical(0, 9);
    const b = new Critical(0, 9);
    a.set(-2);
    b.set(-2);
    a.step(0.2);
    for (let i = 0; i < 20; i++) b.step(0.01);
    expect(a.x).toBeCloseTo(b.x, 9);
    expect(a.v).toBeCloseTo(b.v, 9);
  });

  it('matches x(t) = T + (A + Bt)e^(−ωt) from rest', () => {
    const w = 12;
    const c = new Critical(0, w);
    c.set(1);
    const t = 0.1;
    c.step(t);
    const A = -1;
    const B = w * A;
    expect(c.x).toBeCloseTo(1 + (A + B * t) * Math.exp(-w * t), 12);
  });

  it('does not overshoot even when launched toward the target', () => {
    const c = new Critical(0, 10);
    c.v = 5; // moving toward the target already
    c.set(1);
    for (let i = 0; i < 300; i++) expect(c.step(1 / 120)).toBeLessThanOrEqual(1 + 1e-9);
  });

  it('snap jumps and rests', () => {
    const c = new Critical(0);
    c.v = 3;
    c.snap(4);
    expect([c.x, c.v, c.target, c.done]).toEqual([4, 0, 4, true]);
  });
});

describe('Reflex', () => {
  it('closes faster than it opens', () => {
    const close = new Reflex(1, 0.14, 0.6);
    const open = new Reflex(0, 0.14, 0.6);
    close.set(0);
    open.set(1);
    close.step(0.1);
    open.step(0.1);
    expect(1 - close.x).toBeGreaterThan(open.x);
    expect(close.v).toBeLessThan(0);
    expect(open.v).toBeGreaterThan(0);
  });

  it('is exact per step and settles on the target', () => {
    const r = new Reflex(1, 0.2, 0.2);
    r.set(0);
    r.step(0.2);
    expect(r.x).toBeCloseTo(Math.exp(-1), 12);
    for (let i = 0; i < 200; i++) r.step(0.05);
    expect(r.x).toBe(0);
    expect(r.v).toBe(0);
    expect(r.done).toBe(true);
  });
});

describe('blinkAt', () => {
  it('lasts close + hold + open', () => {
    expect(BLINK_LENGTH).toBeCloseTo(BLINK.close + BLINK.hold + BLINK.open, 12);
    expect(BLINK.close).toBeLessThan(BLINK.open); // a blink closes faster than it opens
  });

  it('is open at both ends and shut through the hold', () => {
    expect(blinkAt(-1)).toEqual({ a: 1, da: 0 });
    expect(blinkAt(0)).toEqual({ a: 1, da: 0 });
    expect(blinkAt(BLINK.close).a).toBe(0);
    expect(blinkAt(BLINK.close + BLINK.hold / 2)).toEqual({ a: 0, da: 0 });
    expect(blinkAt(BLINK_LENGTH).a).toBeCloseTo(1, 9);
    expect(blinkAt(BLINK_LENGTH + 1)).toEqual({ a: 1, da: 0 });
  });

  it('is continuous, stays in 0 … 1, closes then opens', () => {
    let prev = 1;
    const dt = 0.0005;
    for (let t = 0; t <= BLINK_LENGTH + 0.05; t += dt) {
      const { a, da } = blinkAt(t);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
      expect(Math.abs(a - prev)).toBeLessThan(0.03);
      if (t > 0 && t < BLINK.close) expect(da).toBeLessThan(0);
      if (t > BLINK.close + BLINK.hold && t < BLINK_LENGTH) expect(da).toBeGreaterThan(0);
      prev = a;
    }
  });

  it('da is the derivative of a', () => {
    const h = 1e-6;
    for (const t of [0.03, 0.07, 0.15, 0.25, 0.3]) {
      const num = (blinkAt(t + h).a - blinkAt(t - h).a) / (2 * h);
      expect(blinkAt(t).da).toBeCloseTo(num, 3);
    }
  });
});

describe('History', () => {
  it('keeps only the last span seconds, in step', () => {
    const h = new History(1);
    for (let i = 0; i <= 30; i++) h.push(i * 0.1, i, -i);
    expect(h.t[0]).toBeCloseTo(2, 9);
    expect(h.t.length).toBe(h.x.length);
    expect(h.x.length).toBe(h.v.length);
    expect(h.x[h.x.length - 1]).toBe(30);
    expect(h.t[h.t.length - 1]! - h.t[0]!).toBeLessThanOrEqual(1 + 1e-9);
  });
});
