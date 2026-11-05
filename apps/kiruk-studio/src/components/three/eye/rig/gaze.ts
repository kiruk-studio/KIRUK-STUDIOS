/**
 * Where the eye looks, moment to moment: a plain state machine with no
 * three.js in it, in degrees inside and gaze units (look.ts) outside.
 *
 * The eye does three things, and never blends them:
 *  · it fixates: holds a point while drifting slowly off it, with a
 *    microsaccade (under a degree, one or two a second) pulling it back;
 *  · it saccades: jumps to the next point on the main sequence (duration
 *    2.2 ms per degree + 21 ms, minimum-jerk, so a 20° jump peaks near
 *    550°/s), landing a little short on big jumps and correcting ~130 ms on;
 *  · it pursues: tracks a moving pointer at up to 30°/s, a beat late, with a
 *    catch-up saccade whenever the pointer gets too far ahead.
 *
 * Without a pointer, each era scripts the fixations (look.ts `GazeParams`):
 * free viewing (idle, scatter), reading lines with regressions and return
 * sweeps (read), dwelling between two places (two-target), holding one
 * (lock, contact), or riding scrolling content up and jumping back (scroll).
 * Durations come from a gamma distribution, not a uniform one, so the
 * trace has the long tail real fixations have.
 *
 * Every sample lands in a short trace the lab plots like eye-tracker data.
 */

import { GAZE_DEFAULTS, type GazeParams, type GazePattern } from '../look';

const YAW_DEG = 24;
const PITCH_DEG = 10;
/** Where the eye can go, degrees: further down than up, as an orbit allows. */
const LIMIT = { x: 26, yUp: 12, yDown: -17 };

export type GazePhase = 'fixate' | 'saccade' | 'pursuit';

export interface GazeSample {
  t: number;
  x: number;
  y: number;
  phase: GazePhase;
}

/** A gamma-distributed duration (shape k), mean `mean` seconds, clamped. */
function gamma(mean: number, k = 4, lo = 0.08, hi = 3) {
  // the sum of k exponentials is gamma(k); scaled to the mean
  let s = 0;
  for (let i = 0; i < k; i++) s -= Math.log(1 - Math.random());
  return Math.min(hi, Math.max(lo, (s / k) * mean));
}

/** Minimum-jerk position along a movement, 0..1 in time → 0..1 in space. */
function minJerk(t: number) {
  const u = Math.min(1, Math.max(0, t));
  return u * u * u * (10 - 15 * u + 6 * u * u);
}

/** Main-sequence duration of a saccade, seconds, for an amplitude in degrees. */
export function saccadeDuration(deg: number) {
  return 0.0022 * deg + 0.021;
}

export class GazeRig {
  /** Output, gaze units. */
  x = 0;
  y = 0;
  phase: GazePhase = 'fixate';
  /** Reading: how many times the eye has gone back to the top of the page. */
  pagesTurned = 0;
  /** The amplitude of the last saccade to start, degrees; the stage reads and clears it. */
  lastSaccade = 0;
  /** The last few seconds, for the lab (oldest first). */
  readonly trace: GazeSample[] = [];
  /** The last 200 saccades: when, how far (degrees), how long (s), and whether micro. */
  readonly log: { t: number; amp: number; d: number; micro: boolean }[] = [];

  private pattern: GazePattern = 'idle';
  private params!: GazeParams;
  private X = 0;
  private Y = 0;
  private fixX = 0;
  private fixY = 0;
  private hold = 0.3;
  private sacc: { fx: number; fy: number; tx: number; ty: number; t: number; d: number } | null =
    null;
  private correct: { x: number; y: number; in: number } | null = null;
  private driftX = 0;
  private driftY = 0;
  private microIn = 0.6;
  private clock = 0;
  private traceDue = 0;
  // the pointer, as a target in degrees, its velocity, and the eye's pursuit velocity
  private ptr = { has: false, x: 0, y: 0, vx: 0, vy: 0 };
  private pvx = 0;
  private pvy = 0;
  // scripts
  private line = 0;
  private col = 0;
  private side: 'a' | 'b' = 'a';
  private dwell = 0;
  private scrolled = 0;

  constructor(pattern: GazePattern = 'idle', rest: [number, number] = [0, 0], params?: GazeParams) {
    this.setPlan(pattern, rest, params ?? GAZE_DEFAULTS);
  }

  /** A new era's way of looking. The eye finishes what it is doing, then starts. */
  setPlan(pattern: GazePattern, rest: [number, number], params: GazeParams) {
    this.pattern = pattern;
    this.params = { ...params, rest };
    this.line = 0;
    this.col = 0;
    this.side = 'a';
    this.dwell = 0;
    this.scrolled = 0;
    this.hold = Math.min(this.hold, 0.12);
  }

  get busy() {
    return this.phase !== 'fixate';
  }

  /**
   * @param pointer where something asks the eye to look (gaze units), or null
   *                to let the era's script run
   * @param reduce  reduced motion: the eye goes straight where it should be
   */
  update(dt: number, pointer: { x: number; y: number } | null, reduce: boolean) {
    this.clock += dt;
    const P = this.params;
    if (reduce) {
      const tx = pointer ? pointer.x * YAW_DEG : P.rest[0] * YAW_DEG;
      const ty = pointer ? pointer.y * PITCH_DEG : P.rest[1] * PITCH_DEG;
      this.X = this.fixX = tx;
      this.Y = this.fixY = ty;
      this.sacc = null;
      this.phase = 'fixate';
      return this.out();
    }

    // ---- the pointer as a target ------------------------------------------
    if (pointer) {
      const px = pointer.x * YAW_DEG * P.follow;
      const py = pointer.y * PITCH_DEG * P.follow + P.rest[1] * PITCH_DEG * (1 - P.follow);
      if (!this.ptr.has) {
        this.ptr = { has: true, x: px, y: py, vx: 0, vy: 0 };
      } else {
        const k = 1 - Math.exp(-dt / 0.08);
        this.ptr.vx += ((px - this.ptr.x) / Math.max(dt, 1e-3) - this.ptr.vx) * k;
        this.ptr.vy += ((py - this.ptr.y) / Math.max(dt, 1e-3) - this.ptr.vy) * k;
        this.ptr.x = px;
        this.ptr.y = py;
      }
    } else if (this.ptr.has) {
      this.ptr.has = false;
      this.hold = gamma(0.35);
    }

    // ---- a saccade in flight ----------------------------------------------
    if (this.sacc) {
      const s = this.sacc;
      s.t += dt;
      const f = minJerk(s.t / s.d);
      this.X = s.fx + (s.tx - s.fx) * f;
      this.Y = s.fy + (s.ty - s.fy) * f;
      if (s.t >= s.d) {
        this.sacc = null;
        this.phase = this.ptr.has ? 'pursuit' : 'fixate';
        this.driftX = this.driftY = 0;
        this.microIn = 0.3 + Math.random() * 0.5;
      }
      return this.out();
    }

    // ---- following the pointer --------------------------------------------
    if (this.ptr.has) {
      this.phase = 'pursuit';
      const ex = this.ptr.x - this.X;
      const ey = this.ptr.y - this.Y;
      if (Math.hypot(ex, ey) > P.catchUp) {
        // catch up to where the pointer will be when the jump lands; the
        // prediction trusts only pursuit-like speeds, not a jump's spike
        const a = Math.hypot(ex, ey);
        const lead = saccadeDuration(a) + 0.05;
        const v = Math.hypot(this.ptr.vx, this.ptr.vy);
        const trust = v > 0 ? Math.min(1, 30 / v) : 0;
        this.saccadeTo(
          this.ptr.x + this.ptr.vx * trust * lead,
          this.ptr.y + this.ptr.vy * trust * lead,
          false,
        );
        return this.out();
      }
      // pursuit: velocity a beat behind the pointer's, never past 30°/s, nudged onto it
      const k = 1 - Math.exp(-dt / 0.1);
      this.pvx += (this.ptr.vx * P.pursuitGain + ex * 3 - this.pvx) * k;
      this.pvy += (this.ptr.vy * P.pursuitGain + ey * 3 - this.pvy) * k;
      const sp = Math.hypot(this.pvx, this.pvy);
      if (sp > 30) {
        this.pvx *= 30 / sp;
        this.pvy *= 30 / sp;
      }
      this.X += this.pvx * dt;
      this.Y += this.pvy * dt;
      this.fixX = this.X;
      this.fixY = this.Y;
      return this.out();
    }
    this.pvx = this.pvy = 0;

    // ---- a fixation: drift, microsaccades, then the script's next point ----
    this.phase = 'fixate';
    if (this.correct) {
      this.correct.in -= dt;
      if (this.correct.in <= 0) {
        const c = this.correct;
        this.correct = null;
        this.saccadeTo(c.x, c.y, false);
        return this.out();
      }
    }
    // drift: a slow random walk that leans back toward the point
    const n = Math.sqrt(dt);
    this.driftX += -this.driftX * 1.5 * dt + (Math.random() - 0.5) * 0.45 * n;
    this.driftY += -this.driftY * 1.5 * dt + (Math.random() - 0.5) * 0.45 * n;
    this.X += this.driftX * dt + (this.fixX - this.X) * 0.4 * dt;
    this.Y += this.driftY * dt + (this.fixY - this.Y) * 0.4 * dt;
    // the scroll era's content carries the eye up while it reads
    if (this.pattern === 'scroll') {
      this.Y += P.scrollSpeed * dt;
      this.fixY += P.scrollSpeed * dt;
      this.scrolled += P.scrollSpeed * dt;
    }

    this.microIn -= dt;
    if (this.microIn <= 0) {
      this.microIn = gamma(1 / P.microRate, 2, 0.25, 3);
      // a microsaccade: mostly back toward the point, a little anywhere
      const back = Math.atan2(this.fixY - this.Y, this.fixX - this.X);
      const off = Math.hypot(this.fixY - this.Y, this.fixX - this.X);
      const ang = off > 0.15 ? back + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2;
      const amp = Math.min(0.6, 0.1 + Math.random() * 0.25 + off * 0.5);
      this.saccadeTo(this.X + Math.cos(ang) * amp, this.Y + Math.sin(ang) * amp, false, true);
      return this.out();
    }

    this.hold -= dt;
    this.dwell -= dt;
    if (this.hold <= 0) this.next();
    return this.out();
  }

  /** The script's next fixation, by era. */
  private next() {
    const P = this.params;
    const rx = P.rest[0] * YAW_DEG;
    const ry = P.rest[1] * PITCH_DEG;
    const sx = P.spread[0] * YAW_DEG;
    const sy = P.spread[1] * PITCH_DEG;
    const fix = () => gamma(P.fixMs / 1000, 4, 0.1, 2.5);
    switch (this.pattern) {
      case 'lock':
      case 'contact': {
        // hold the point; drift and microsaccades are all the motion there is
        this.fixX = rx;
        this.fixY = ry;
        this.hold = gamma(2, 3);
        return;
      }
      case 'read': {
        // fixations along a line ~2° apart, now and then a step back, a
        // return sweep at the line's end to the start of the next
        const left = rx - (P.width * YAW_DEG) / 2;
        const right = rx + (P.width * YAW_DEG) / 2;
        const lineY = ry - this.line * P.lineStep * PITCH_DEG;
        if (this.col === 0) {
          this.col = 1;
          this.saccadeTo(left + Math.random() * 1.5, lineY, true);
        } else if (Math.random() < 0.12 && this.X > left + 3) {
          this.saccadeTo(this.X - (1 + Math.random() * 2), lineY, false);
        } else if (this.X + 2 > right) {
          this.col = 0;
          this.line = (this.line + 1) % Math.max(1, P.lines);
          if (this.line === 0) this.pagesTurned++;
          const nextY = ry - this.line * P.lineStep * PITCH_DEG;
          this.saccadeTo(left + Math.random() * 1.5, nextY, true);
        } else {
          this.saccadeTo(
            this.X + 1.6 + Math.random() * 1.4,
            lineY + (Math.random() - 0.5) * 0.2,
            false,
          );
        }
        this.hold = gamma(P.fixMs / 1000, 5, 0.15, 1);
        return;
      }
      case 'two-target': {
        // dwell at one place, looking about inside it, then cross to the other
        if (this.dwell <= 0) {
          this.side = this.side === 'a' ? 'b' : 'a';
          this.dwell = gamma(this.side === 'a' ? P.dwellA : P.dwellB, 3, 0.3, 8);
          const p = this.side === 'a' ? P.a : P.b;
          this.saccadeTo(p[0] * YAW_DEG, p[1] * PITCH_DEG, true);
        } else {
          const p = this.side === 'a' ? P.a : P.b;
          const r = this.side === 'a' ? 1.5 : 3.5;
          this.saccadeTo(
            p[0] * YAW_DEG + (Math.random() - 0.5) * 2 * r,
            p[1] * PITCH_DEG + (Math.random() - 0.5) * r,
            true,
          );
        }
        this.hold = fix();
        return;
      }
      case 'scroll': {
        // read down the phone a little, ride the content up, jump back down
        if (this.scrolled > 2.5 + Math.random() * 2) {
          this.scrolled = 0;
          this.saccadeTo(rx + (Math.random() - 0.5) * 3, ry - 1 - Math.random() * 1.5, true);
        } else {
          this.saccadeTo(this.X + (Math.random() - 0.5) * 3, this.Y - Math.random() * 0.8, false);
        }
        this.hold = fix();
        return;
      }
      default: {
        // free viewing: mostly short jumps, sometimes a long one, inside the scene
        const amp = Math.min(Math.max(sx, sy) * 1.6, gamma(P.ampMean, 2, 0.5, 30));
        const ang = Math.random() * Math.PI * 2;
        let tx = this.X + Math.cos(ang) * amp;
        let ty = this.Y + Math.sin(ang) * amp * 0.7;
        // stay in the scene: reflect back in when a jump would leave it
        if (Math.abs(tx - rx) > sx)
          tx = rx + Math.sign(tx - rx) * sx - (tx - rx - Math.sign(tx - rx) * sx) * 0.5;
        if (Math.abs(ty - ry) > sy)
          ty = ry + Math.sign(ty - ry) * sy - (ty - ry - Math.sign(ty - ry) * sy) * 0.5;
        this.saccadeTo(tx, ty, true);
        this.hold = fix();
      }
    }
  }

  /**
   * Starts a saccade. Big ones land ~8 % short and correct themselves; a
   * microsaccade never counts toward a blink.
   */
  private saccadeTo(tx: number, ty: number, undershoot: boolean, micro = false) {
    tx = Math.min(LIMIT.x, Math.max(-LIMIT.x, tx));
    ty = Math.min(LIMIT.yUp, Math.max(LIMIT.yDown, ty));
    const dx = tx - this.X;
    const dy = ty - this.Y;
    const amp = Math.hypot(dx, dy);
    if (amp < 0.05) return;
    let lx = tx;
    let ly = ty;
    if (undershoot && amp > 8) {
      const f = 0.9 + Math.random() * 0.04;
      lx = this.X + dx * f;
      ly = this.Y + dy * f;
      this.correct = { x: tx, y: ty, in: 0.11 + Math.random() * 0.06 };
    }
    if (!micro) {
      this.fixX = tx;
      this.fixY = ty;
      this.lastSaccade = Math.max(this.lastSaccade, amp);
    }
    const land = Math.hypot(lx - this.X, ly - this.Y);
    this.sacc = { fx: this.X, fy: this.Y, tx: lx, ty: ly, t: 0, d: saccadeDuration(land) };
    this.phase = 'saccade';
    this.log.push({ t: this.clock, amp: land, d: this.sacc.d, micro });
    if (this.log.length > 200) this.log.shift();
  }

  private out() {
    this.x = this.X / YAW_DEG;
    this.y = this.Y / PITCH_DEG;
    // the trace: ~120 Hz is plenty for the lab, 6 s of it
    if (this.clock >= this.traceDue) {
      this.traceDue = this.clock + 1 / 120;
      this.trace.push({ t: this.clock, x: this.X, y: this.Y, phase: this.phase });
      while (this.trace.length > 0 && this.clock - this.trace[0].t > 6) this.trace.shift();
    }
    return { x: this.x, y: this.y };
  }
}
