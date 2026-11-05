/**
 * A critically damped spring, solved exactly.
 *
 *   x(t) = T + (A + B t) e^(−ωt),   A = x₀ − T,  B = v₀ + ωA
 *   v(t) = (v₀ − ω B t) e^(−ωt)
 *
 * No overshoot, no bounce (codex live.md: nothing bounces), and because x and
 * v are closed-form the margin can plot the motion and its derivative while
 * it happens, not an approximation of it.
 */

export type Sample = { t: number; x: number; v: number };

export class Spring {
  x: number;
  v = 0;
  target: number;
  readonly omega: number;
  history: Sample[] = [];
  private clock = 0;

  /** ω in rad/s. ω = 18 settles 99% in ≈ 0.37 s. */
  constructor(x = 0, omega = 18) {
    this.x = x;
    this.target = x;
    this.omega = omega;
  }

  set(target: number) {
    if (target === this.target) return;
    this.target = target;
    this.history = [{ t: 0, x: this.x, v: this.v }];
    this.clock = 0;
  }

  /** Jump straight to the target (reduced motion). */
  snap(target: number) {
    this.target = target;
    this.x = target;
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
    this.clock += dt;
    if (this.history.length < 240) this.history.push({ t: this.clock, x: this.x, v: this.v });
    return this.x;
  }
}

/** σ(x) — the softened step the margin draws. */
export const sigma = (x: number) => 1 / (1 + Math.exp(-x));
