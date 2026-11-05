/**
 * Blinks, as a plain state machine with no three.js in it (the gaze has its
 * own, rig/gaze.ts).
 *
 * A blink snaps shut, holds, and opens more slowly (~300 ms in all); about one
 * in five comes as a quick double. The time between blinks is drawn around
 * the era's mean: reading and staring blink less, scanning more, about 15–20
 * a minute on average.
 */

export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

const BLINK_CLOSE = 0.07;
const BLINK_HOLD = 0.04;
const BLINK_OPEN = 0.19;
export const BLINK_TOTAL = BLINK_CLOSE + BLINK_HOLD + BLINK_OPEN;

export function blinkCurve(t: number): number {
  let v: number;
  if (t < BLINK_CLOSE) v = t / BLINK_CLOSE;
  else if (t < BLINK_CLOSE + BLINK_HOLD) v = 1;
  else if (t < BLINK_TOTAL) v = 1 - (t - BLINK_CLOSE - BLINK_HOLD) / BLINK_OPEN;
  else return 0;
  v = Math.min(1, Math.max(0, v));
  return v * v * (3 - 2 * v);
}

export class BlinkRig {
  private t = 99;
  private next = 2.5;
  /** Mean seconds between blinks. */
  every = 3.6;

  /** Starts a blink now. The lab's "blink" button and, later, era arrivals. */
  trigger() {
    this.t = 0;
  }

  /** Whether a blink is under way. */
  get active() {
    return this.t < BLINK_TOTAL;
  }

  update(dt: number, reduce: boolean, paused: boolean): number {
    if (reduce) return 0;
    if (!paused) {
      this.next -= dt;
      if (this.next <= 0) {
        this.t = 0;
        this.next =
          Math.random() < 0.18
            ? BLINK_TOTAL + 0.11
            : Math.min(
                12,
                Math.max(0.8, -Math.log(1 - Math.random()) * this.every * 0.7 + this.every * 0.3),
              );
      }
    }
    this.t += dt;
    return blinkCurve(this.t);
  }
}
