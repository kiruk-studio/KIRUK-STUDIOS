/**
 * Where the visitor's pointer rests (2026: the interface measures you back).
 *
 * Fixations are found as eye trackers find them, by dispersion (I-DT): the
 * pointer held within `radius` (a share of the screen's height) for
 * `minDwell` seconds starts one, and it grows while the pointer stays. The
 * last `keep` are kept, each numbered in order and fading `fadeFrom`..`fadeTo`
 * seconds after it ends. Pure arithmetic, no DOM.
 */

export interface Fixation {
  /** The centre, top-left UV. */
  x: number;
  y: number;
  /** How long the pointer rested there, s. */
  dwell: number;
  /** Seconds since it ended (0 while it lasts). */
  age: number;
  /** Its number in the visit, from 1. */
  n: number;
}

export class Attention {
  readonly fixes: Fixation[] = [];
  radius = 0.035;
  minDwell = 0.12;
  keep = 6;
  fadeFrom = 8;
  fadeTo = 12;
  private count = 0;
  private cur: Fixation | null = null;
  private cand: { x: number; y: number; t: number } | null = null;

  /**
   * @param x the pointer, top-left UV
   * @param y the pointer, top-left UV
   * @param aspect the screen's width over its height
   * @param on whether the pointer is here
   */
  update(dt: number, x: number, y: number, aspect: number, on: boolean) {
    const far = (a: { x: number; y: number }) =>
      Math.hypot((x - a.x) * aspect, y - a.y) > this.radius;
    if (!on) {
      this.cur = null;
      this.cand = null;
    } else if (this.cur && !far(this.cur)) {
      const f = this.cur;
      f.dwell += dt;
      // the centre is the mean of where it rested
      const k = dt / Math.max(f.dwell, dt);
      f.x += (x - f.x) * k;
      f.y += (y - f.y) * k;
    } else {
      this.cur = null;
      if (!this.cand || far(this.cand)) this.cand = { x, y, t: 0 };
      else this.cand.t += dt;
      if (this.cand.t >= this.minDwell) {
        this.cur = { x: this.cand.x, y: this.cand.y, dwell: this.cand.t, age: 0, n: ++this.count };
        this.cand = null;
        this.fixes.push(this.cur);
        if (this.fixes.length > this.keep) this.fixes.shift();
      }
    }
    for (const f of this.fixes) if (f !== this.cur) f.age += dt;
    while (this.fixes.length && this.fixes[0].age > this.fadeTo) this.fixes.shift();
  }

  /** How many fixations this visit has made. */
  get total() {
    return this.count;
  }

  /** How much of a fixation still shows, 1..0. */
  alpha(f: Fixation) {
    const t = Math.min(Math.max((f.age - this.fadeFrom) / (this.fadeTo - this.fadeFrom), 0), 1);
    return 1 - t * t * (3 - 2 * t);
  }
}
