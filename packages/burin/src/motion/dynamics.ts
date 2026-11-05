/**
 * Motion, solved exactly where it can be, so the instrument can plot a quantity
 * and its derivative while it moves — not an approximation of it.
 *
 *   Critical   x(t) = T + (A + Bt)e^(−ωt)   no overshoot; gaze, light, age
 *   Reflex     first order, faster one way than the other; the pupil closes
 *              in light quicker than it opens in the dark
 *   Blink      lid aperture over a blink: a fast close, a short hold, a slower open
 *   History    the last few seconds of a value and its rate
 */

export class Critical {
  x: number;
  v = 0;
  target: number;
  constructor(
    x = 0,
    public omega = 12,
  ) {
    this.x = x;
    this.target = x;
  }
  set(t: number) {
    this.target = t;
  }
  snap(t: number) {
    this.target = t;
    this.x = t;
    this.v = 0;
  }
  get done() {
    return Math.abs(this.x - this.target) < 1e-4 && Math.abs(this.v) < 1e-3;
  }
  step(dt: number) {
    const w = this.omega;
    const A = this.x - this.target;
    const B = this.v + w * A;
    const e = Math.exp(-w * dt);
    this.x = this.target + (A + B * dt) * e;
    this.v = (this.v - w * B * dt) * e;
    if (this.done) {
      this.x = this.target;
      this.v = 0;
    }
    return this.x;
  }
}

/** dx/dt = (T − x) / τ, with τ chosen by direction. Exact per step: x ← T + (x − T)e^(−dt/τ). */
export class Reflex {
  x: number;
  v = 0;
  target: number;
  constructor(
    x: number,
    public tauDown: number,
    public tauUp: number,
  ) {
    this.x = x;
    this.target = x;
  }
  set(t: number) {
    this.target = t;
  }
  get done() {
    return Math.abs(this.x - this.target) < 1e-4;
  }
  step(dt: number) {
    const tau = this.target < this.x ? this.tauDown : this.tauUp;
    const x0 = this.x;
    this.x = this.target + (x0 - this.target) * Math.exp(-dt / tau);
    this.v = dt > 0 ? (this.x - x0) / dt : 0;
    if (this.done) {
      this.x = this.target;
      this.v = 0;
    }
    return this.x;
  }
}

/**
 * A blink, in seconds: close 0.09, hold 0.04, open 0.19 — the closing phase of
 * a human blink is the faster one. Returns aperture 1 → 0 → 1 and its rate.
 */
export const BLINK = { close: 0.09, hold: 0.04, open: 0.19 } as const;
export function blinkAt(t: number): { a: number; da: number } {
  const { close, hold, open } = BLINK;
  if (t <= 0) return { a: 1, da: 0 };
  if (t < close) {
    const u = t / close;
    return { a: 1 - u * u, da: (-2 * u) / close };
  }
  if (t < close + hold) return { a: 0, da: 0 };
  const u = (t - close - hold) / open;
  if (u < 1) {
    const e = 1 - (1 - u) * (1 - u);
    return { a: e, da: (2 * (1 - u)) / open };
  }
  return { a: 1, da: 0 };
}
export const BLINK_LENGTH = BLINK.close + BLINK.hold + BLINK.open;

export class History {
  t: number[] = [];
  x: number[] = [];
  v: number[] = [];
  constructor(public span = 3) {}
  push(t: number, x: number, v: number) {
    this.t.push(t);
    this.x.push(x);
    this.v.push(v);
    while (this.t.length && t - this.t[0]! > this.span) {
      this.t.shift();
      this.x.shift();
      this.v.shift();
    }
  }
}
