/**
 * The cut between eras (docs/ERA_POV_PLAN.md, "The cut between eras").
 *
 * Every change of era is the person's own blink: the outgoing era departs in
 * its own way while the lids close, the medium changes only while they are
 * shut, and the incoming era arrives in its own way as they open. Then its
 * sign appears last, so each slide builds world, light, sign.
 *
 *   LOOK   0–70 ms     the eye glances the way you are travelling
 *   CLOSE  from 50 ms  the lids fall (easeInQuad, 90 ms); `dep` runs over the era's departMs
 *   SHUT              the swap, once the lids are down, the departure has played, the
 *                     last swap is 400 ms old and the stage has the new era's light
 *   HOLD   +40 ms     (+40 a skipped era, up to +160) the arrival starts on the shut lids
 *   OPEN   240 ms     the lids rise (easeOutCubic) in the new era's medium
 *   READY             the sign fades in once the arrival has played
 *
 * A new request before the swap retargets the cut; after it, the lids close
 * again from wherever they are. Swaps are at least 400 ms apart (no more than
 * 2.5 large changes a second), so a fast sweep keeps the eyes shut while the
 * world changes over the closed lids, and they open where the hand stops.
 * Going in (the iris tapped) during a cut finishes it at once on the era
 * asked for, so the era you enter is the one you chose.
 * Scrubbing (a drag, a swipe, the ghost finger: `travel`, the unrounded era
 * position) hands the lids to the hand: they close toward each boundary and
 * open past it, the cut lands once they are nearly shut, the departure and
 * arrival follow the position both ways, and above 3 eras a second the eyes
 * stay shut until the hand slows or lets go.
 * Reduced motion: no blink, a plain cut (still no more than 2.5 a second),
 * signs held on.
 *
 * Plain TypeScript with no three.js, like rig/*.ts; EyeStage feeds it once a
 * frame and writes its numbers to `U.medium`.
 */

import type { EraMedium } from '../look';

export interface DirectorInput {
  /** The medium wanted (1..10; 0 none). */
  want: number;
  dt: number;
  reduce: boolean;
  /** Phones: everything a quarter slower. */
  calm: boolean;
  exiting: boolean;
  /** How shut the lids are right now (0..1), so a cut starts from there. */
  lid: number;
  /** The medium whose light, lens and page the stage has put up. */
  applied: number;
  /** A mouse over the iris. */
  hover: boolean;
  /** Pressed on the iris and not dragged off. */
  down: boolean;
  /** The press has become a drag or a swipe: its feedback goes at once. */
  dragged: boolean;
  /** Scrubbing: the unrounded medium position (1..10) under the hand; null when not. */
  travel?: number | null;
  /** A pointer has come near the eye (within a few iris radii): 2026 answers with a ripple. */
  near?: boolean;
  /**
   * Whether medium n can be drawn yet (its shader built). A cut to an era not
   * ready keeps the lids shut until it is: the medium never shows unbuilt.
   */
  ready?: (n: number) => boolean;
}

type Phase = 'rest' | 'cut' | 'open' | 'scrub';

const CLOSE_AT = 50;
const CLOSE_MS = 90;
const HOLD_MS = 40;
/** Going in during a cut: the lids finish closing this fast, and the hold is this short. */
const RUSH_CLOSE_MS = 60;
const RUSH_HOLD_MS = 20;
const OPEN_MS = 240;
const SWAP_GAP_MS = 400;
/** How long a cut may wait for the stage to put the new era up. */
const APPLY_WAIT_MS = 150;
/** Shut that long waiting for an era still building, the old era comes back on behind the lids, over PARK_RETURN_MS. */
const PARK_AFTER_MS = 250;
const PARK_RETURN_MS = 300;
const READY_MIN_MS = 420;
const SIGN_FADE_MS = 150;
/** How far the eye glances toward the next era (gaze units), and per extra era. */
const LOOK_AMP = 0.3;
const LOOK_STEP = 0.05;
const LOOK_MAX = 0.5;
/** Natural blinks stay away this long after a cut. */
const QUIET_MS = 600;
const SEED_FPS = 18;
/** Scrubbing: the lids close no faster than full travel in 70 ms, open no faster than in 150 ms. */
const SCRUB_CLOSE_MS = 70;
const SCRUB_OPEN_MS = 150;
/** Scrubbing: how shut the lids must be for the cut. */
const SCRUB_CUT_LID = 0.85;
/** Scrubbing faster than this (eras a second) shuts the eyes; they open again below the second. */
const RUSH_ON = 3;
const RUSH_OFF = 2;

const easeInQuad = (t: number) => t * t;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Move toward a goal, no faster up or down than the rates given (per call). */
const approach = (v: number, goal: number, up: number, down: number) =>
  v + Math.min(up, Math.max(-down, goal - v));

export class MediumDirector {
  /** The era on screen (1..10). */
  cur = 0;
  /** Set for the one frame on which `cur` changed. */
  swap = false;
  /** Whether a cut is under way (the lids belong to the director). */
  busy = false;
  /** The lids, while the director holds them; null leaves them to the blink rig. */
  blink: number | null = null;
  /** A glance toward the next era (gaze x), while it lasts; null otherwise. */
  look: number | null = null;
  /** Whether natural blinks should hold off. */
  quiet = false;

  dep = 0;
  arr = 1;
  dir = 0;
  clock = 0;
  signA = 1;
  hover = 0;
  press = 0;
  enter = 0;
  seed = 0;
  /**
   * Seconds since the last ripple began (2026: the eye notices the pointer
   * coming near). One per approach, at most one every 4 s; large when none.
   */
  ripple = 1e3;
  private wasNear = false;
  /** Whether the hand is working the lids (scrubbing). */
  get scrubbing() {
    return this.phase === 'scrub';
  }
  /** Seconds since the era on screen arrived. */
  get since() {
    return Math.min(this.sinceArrive, 1e6) / 1000;
  }

  private phase: Phase = 'rest';
  private target = 0;
  /** ms since the cut began, and the lids' height when it began. */
  private t = 0;
  private lid0 = 0;
  /** ms since the last swap (starts large: the first cut may swap at once). */
  private sinceSwap = 1e9;
  /** ms since the current era arrived (the swap), for its arrival and sign. */
  private sinceArrive = 1e9;
  /** How many eras the cut skips past the next. */
  private skipped = 0;
  private waited = 0;
  private holdLeft = 0;
  /**
   * Shut and waiting for an era whose medium is still building (ms), and
   * whether the outgoing era has come back on behind the lids meanwhile: a
   * screen switched off for seconds reads as broken, so after a moment the
   * shut eye shows in the old era again, and departs once more when ready.
   */
  private readyWait = 0;
  private parked = false;
  private openT = 0;
  private lidAt = 0;
  private quietLeft = 0;
  private enterT = 0;
  private seedDue = 0;
  /** Going in during a cut: finish it now, on the era asked for. */
  private rush = false;
  /** Scrubbing: last position, its speed (eras/s, damped), whether too fast to look, and whether the era on screen has fully arrived. */
  private lastPos: number | null = null;
  private vel = 0;
  private rushing = false;
  private arrived = true;

  private readonly timing: (medium: number) => EraMedium;

  constructor(timing: (medium: number) => EraMedium) {
    this.timing = timing;
  }

  update(i: DirectorInput): void {
    const ms = i.dt * 1000;
    const slow = i.calm ? 1.25 : 1;
    this.swap = false;
    this.clock += i.dt;
    if (!i.reduce) {
      this.seedDue -= i.dt;
      if (this.seedDue <= 0) {
        this.seedDue = 1 / SEED_FPS;
        this.seed = (this.seed + 1) % 997;
      }
    }
    this.sinceSwap += ms;
    this.sinceArrive += ms;
    this.quietLeft = Math.max(0, this.quietLeft - ms);

    // the visitor's hand over the iris, on it, going in
    const k = (lambda: number) => 1 - Math.exp(-lambda * i.dt);
    this.hover += ((i.hover ? 1 : 0) - this.hover) * (i.reduce ? 1 : k(10));
    this.press = i.down
      ? 1
      : i.dragged
        ? 0
        : this.press + (0 - this.press) * (i.reduce ? 1 : k(14));
    this.ripple = Math.min(this.ripple + i.dt, 1e3);
    if (i.near && !this.wasNear && this.ripple > 4 && !i.reduce) this.ripple = 0;
    this.wasNear = !!i.near;
    if (i.exiting) {
      // (a cut still finishing holds the way in until the era asked for is up)
      if (!(this.phase === 'cut' && this.target !== this.cur)) this.enterT += ms;
      this.enter = clamp01(this.enterT / Math.max(this.timing(this.cur).enterMs, 1));
    } else {
      this.enterT = 0;
      this.enter = 0;
    }

    // the first era, or none: no cut, nothing to arrive from
    if (this.cur === 0 || i.want === 0) {
      if (i.want !== this.cur) {
        this.cur = i.want;
        this.target = i.want;
        this.swap = true;
      }
      this.rest();
      return;
    }

    // reduced motion: a plain cut, no blink, and no more than 2.5 a second
    // (a held arrow key would otherwise flip the whole frame every frame)
    if (i.reduce) {
      if (
        i.want !== this.cur &&
        (this.sinceSwap >= SWAP_GAP_MS || i.exiting) &&
        (i.ready?.(i.want) ?? true)
      ) {
        this.cur = this.target = i.want;
        this.swap = true;
        this.sinceSwap = 0;
        this.sinceArrive = 0;
      }
      this.phase = 'rest';
      this.dep = 0;
      this.arr = 1;
      this.blink = null;
      this.look = null;
      this.busy = false;
      this.quiet = false;
      this.signA = 1;
      return;
    }
    // scrubbing: the hand works the lids until it lets go
    const travel = i.travel ?? null;
    if (travel !== null && !i.exiting) {
      if (this.phase !== 'scrub') this.beginScrub(i.lid);
      this.stepScrub(i, travel, ms, slow);
      this.signA = Math.max(0, this.signA - ms / 80);
      this.quiet = true;
      return;
    }
    if (this.phase === 'scrub') this.endScrub(i, slow);

    if (i.exiting) {
      // going in: the era entered is the one asked for. A cut under way (or
      // one that has to happen now) finishes at once; otherwise nothing changes.
      if (i.want !== this.target || (i.want !== this.cur && this.phase !== 'cut')) {
        this.target = i.want;
        this.dir = Math.sign(this.target - this.cur) || this.dir;
        if (this.phase !== 'cut') this.beginCut(i.lid);
      }
      if (this.phase === 'cut' && !this.rush) {
        this.rush = true;
        this.t = Math.max(this.t, CLOSE_AT * slow);
      }
    } else if (i.want !== this.target) {
      this.target = i.want;
      if (this.phase === 'rest') this.beginCut(i.lid);
      else if (this.phase === 'open') this.beginCut(i.lid);
      // (during a cut that has not swapped yet, the new target simply replaces the old)
      this.dir = Math.sign(this.target - this.cur) || this.dir;
      this.skipped = Math.max(0, Math.abs(this.target - this.cur) - 1);
    }

    if (this.phase === 'cut') this.stepCut(i, ms, slow);
    else if (this.phase === 'open') this.stepOpen(ms, slow);
    else this.rest();

    // the arrival and the sign, from the swap; the sign eases toward its
    // goal (an abandoned cut does not pop it back), and going in holds it on
    const tm = this.timing(this.cur);
    this.arr = clamp01(this.sinceArrive / (tm.arriveMs * slow));
    const ready = Math.max(tm.arriveMs, READY_MIN_MS) * slow;
    const signGoal = i.exiting ? 1 : clamp01((this.sinceArrive - ready) / SIGN_FADE_MS);
    this.signA =
      this.phase === 'cut'
        ? Math.max(0, this.signA - ms / 80)
        : Math.min(signGoal, this.signA + ms / SIGN_FADE_MS);
    this.quiet = this.busy || this.quietLeft > 0;
  }

  private rest() {
    this.phase = 'rest';
    this.rush = false;
    this.busy = false;
    this.blink = null;
    this.look = null;
    this.dep = 0;
  }

  private beginCut(lid: number) {
    this.phase = 'cut';
    this.busy = true;
    this.t = 0;
    this.lid0 = lid;
    this.lidAt = lid;
    this.waited = 0;
    this.holdLeft = 0;
    this.dep = 0;
    this.readyWait = 0;
    this.parked = false;
  }

  private beginOpen(lid: number) {
    this.phase = 'open';
    this.openT = 0;
    this.lidAt = lid;
    this.lid0 = lid;
  }

  private stepCut(i: DirectorInput, ms: number, slow: number) {
    this.t += ms;
    const outgoing = this.timing(this.cur);
    // waiting, shut, for an era still building: the old one comes back on
    // after a moment, and departs again (from where it is) once the new is ready
    const waiting = this.target !== this.cur && !(i.ready?.(this.target) ?? true);
    if (waiting) this.readyWait += ms;
    else {
      this.readyWait = 0;
      if (this.parked) {
        this.parked = false;
        this.t = (CLOSE_AT + this.dep * outgoing.departMs) * slow;
      }
    }
    if (this.readyWait > PARK_AFTER_MS && this.lidAt >= 0.999) this.parked = true;
    const t = this.t / slow;
    // the glance toward the next era (LOOK): it starts the cut and is held
    // until the eye opens; the gaze rig turns it into a saccade
    this.look = this.dir * Math.min(LOOK_MAX, LOOK_AMP + LOOK_STEP * this.skipped);

    // the lids fall from wherever they were (fast when going in)
    const close = clamp01((t - CLOSE_AT) / (this.rush ? RUSH_CLOSE_MS : CLOSE_MS));
    this.lidAt = Math.max(this.lidAt, this.lid0 + (1 - this.lid0) * easeInQuad(close));
    this.blink = this.lidAt;

    // the outgoing era departs as they close (from wherever a scrub left it)
    if (this.parked) this.dep = Math.max(0, this.dep - ms / PARK_RETURN_MS);
    else if (this.target !== this.cur)
      this.dep = Math.max(this.dep, clamp01((t - CLOSE_AT) / outgoing.departMs));

    // back where we started before anything changed: open again
    if (this.target === this.cur && this.holdLeft === 0) {
      this.dep = Math.max(0, this.dep - ms / 120);
      this.beginOpen(this.lidAt);
      return;
    }

    const shut = this.lidAt >= 0.999;
    const departed = this.dep >= 1 || this.target === this.cur || this.rush;
    if (this.holdLeft === 0 && shut && departed && this.target !== this.cur) {
      if ((this.sinceSwap >= SWAP_GAP_MS || this.rush) && (i.ready?.(this.target) ?? true)) {
        this.cur = this.target;
        this.swap = true;
        this.sinceSwap = 0;
        this.sinceArrive = 0;
        this.dep = 0;
        this.waited = 0;
        this.holdLeft = this.rush
          ? RUSH_HOLD_MS
          : (HOLD_MS + Math.min(160, 40 * this.skipped)) * slow;
        // going in: the new era's way in plays on the opening lids
        if (this.rush) this.enterT = 0;
      }
      return;
    }
    if (this.holdLeft > 0) {
      this.dep = 0;
      // wait (a little) for the stage to put the new era's light and page up
      if (i.applied !== this.cur && this.waited < APPLY_WAIT_MS && !this.rush) {
        this.waited += ms;
        return;
      }
      this.holdLeft = Math.max(0, this.holdLeft - ms);
      if (this.holdLeft === 0) {
        if (this.target !== this.cur) {
          // asked for somewhere else while shut: cut again, the lids already
          // down, so the era on screen departs in full behind them
          this.beginCut(1);
          this.t = CLOSE_AT * slow;
          this.skipped = Math.max(0, Math.abs(this.target - this.cur) - 1);
          this.dir = Math.sign(this.target - this.cur) || this.dir;
        } else {
          this.beginOpen(1);
          this.rush = false;
        }
      }
    }
  }

  private beginScrub(lid: number) {
    this.phase = 'scrub';
    this.busy = true;
    this.rush = false;
    this.look = null;
    this.holdLeft = 0;
    this.lidAt = lid;
    this.lastPos = null;
    this.vel = 0;
    this.rushing = false;
    this.arrived = this.arr >= 0.999;
  }

  /**
   * One frame of the hand on the lids. `d` runs from 0 at an era's centre to
   * 0.5 at a boundary; the lids follow smoothstep(0.22, 0.45, d), rate-limited,
   * and stay shut while the hand is past the boundary and the cut has not
   * landed yet (it lands once they are 85% shut and 400 ms after the last).
   */
  private stepScrub(i: DirectorInput, pos: number, ms: number, slow: number) {
    this.busy = true;
    this.blink = this.lidAt;
    this.look = null;
    // how fast the hand is going, damped
    const prev = this.lastPos ?? pos;
    this.lastPos = pos;
    const raw = Math.abs(pos - prev) / Math.max(i.dt, 1e-3);
    this.vel += (raw - this.vel) * (1 - Math.exp(-10 * i.dt));
    if (this.vel > RUSH_ON) this.rushing = true;
    else if (this.vel < RUSH_OFF) this.rushing = false;

    const p = Math.min(10, Math.max(1, pos));
    const near = Math.round(p);
    const d = Math.abs(p - near);
    this.target = near;
    if (near !== this.cur) this.dir = Math.sign(near - this.cur);
    else if (pos !== prev) this.dir = Math.sign(pos - prev);

    let goal = smoothstep(0.22, 0.45, d);
    if (this.rushing || near !== this.cur) goal = 1;
    // (the stage gets a moment, behind the lids, to put the new era's light and page up)
    if (i.applied !== this.cur && this.waited < APPLY_WAIT_MS) {
      this.waited += ms;
      goal = Math.max(goal, this.lidAt);
    }
    this.lidAt = clamp01(
      approach(this.lidAt, goal, ms / (SCRUB_CLOSE_MS * slow), ms / (SCRUB_OPEN_MS * slow)),
    );
    this.blink = this.lidAt;

    // the cut, once the lids are nearly shut
    if (
      near !== this.cur &&
      this.lidAt >= SCRUB_CUT_LID &&
      this.sinceSwap >= SWAP_GAP_MS &&
      (i.ready?.(near) ?? true)
    ) {
      this.cur = near;
      this.swap = true;
      this.sinceSwap = 0;
      this.sinceArrive = 0;
      this.waited = 0;
      this.dep = 0;
      this.arr = 0;
      this.arrived = false;
    }

    // departure and arrival follow the hand, both ways: the era on screen
    // arrives as the hand carries it in from the boundary, and once it has
    // arrived, departs as the hand carries it out toward the next
    const tm = this.timing(this.cur);
    const away = near !== this.cur;
    const arrGoal = this.arrived ? 1 : away ? 0 : 1 - smoothstep(0.05, 0.45, d);
    const depGoal = away ? 1 : this.arrived ? smoothstep(0.2, 0.45, d) : 0;
    this.arr = clamp01(approach(this.arr, arrGoal, ms / (tm.arriveMs * slow), ms / 120));
    this.dep = clamp01(approach(this.dep, depGoal, ms / (tm.departMs * slow), ms / 120));
    // (the hand reaching the era's centre counts as arrived: carried on past
    // it, the era departs instead of its arrival un-playing)
    if (this.arr >= 0.999 || (!away && d < 0.05)) this.arrived = true;
  }

  /** The hand let go: the lids open where it stopped, or the cut it asked for finishes first. */
  private endScrub(i: DirectorInput, slow: number) {
    this.lastPos = null;
    this.rushing = false;
    this.vel = 0;
    const want = i.want;
    if (want !== 0 && want !== this.cur) {
      const dep = this.dep;
      this.target = want;
      this.dir = Math.sign(want - this.cur) || this.dir;
      this.skipped = Math.max(0, Math.abs(want - this.cur) - 1);
      this.beginCut(this.lidAt);
      this.dep = dep;
      this.t = CLOSE_AT * slow;
      return;
    }
    this.target = this.cur;
    // the rest of the arrival plays as the lids open
    const tm = this.timing(this.cur);
    if (!this.arrived) this.sinceArrive = this.arr * tm.arriveMs * slow;
    this.beginOpen(this.lidAt);
    // (240 ms, from wherever the hand left them)
  }

  private stepOpen(ms: number, slow: number) {
    this.openT += ms;
    const o = clamp01(this.openT / (OPEN_MS * slow));
    this.blink = this.lid0 * (1 - easeOutCubic(o));
    this.busy = true;
    this.dep = Math.max(0, this.dep - ms / 120);
    // the glance relaxes as the eye opens on the new era
    this.look = o < 0.5 ? this.look : null;
    if (o >= 1) {
      this.phase = 'rest';
      this.rush = false;
      this.busy = false;
      this.blink = null;
      this.look = null;
      this.quietLeft = QUIET_MS;
    }
  }
}
