/**
 * The pupil, as a muscle with a reflex, not a number.
 *
 *  · Light. Steady-state size follows Moon & Spencer (1944): diameter
 *    D = 4.9 − 3·tanh(0.4·(log₁₀L + 1)) mm, L in millilamberts — about 7.5 mm
 *    in the dark, 2.4 mm in daylight. The screen's luminance stands in for L.
 *  · The reflex (after Pamplona et al. 2009, simplified): the light reaches the
 *    muscle ~0.22 s late; the pupil constricts fast (τ ≈ 0.18 s) and reopens
 *    slowly (τ ≈ 0.9 s); a step up in light overshoots, then "escapes" partway
 *    back as the transient fades over a second or two.
 *  · Near reflex: refocusing close constricts it a little — the pointer
 *    coming in toward the eye. It answers the approach, not the distance, so
 *    a pointer that has arrived and stays lets interest take over.
 *  · Arousal: interest dilates it, half a second after it starts and over a
 *    second or so (the pointer resting on the iris).
 *  · Hippus: it is never still; a slow, irregular unrest under a millimetre.
 *  · A flash: a light on the camera's axis lights the fundus red through the
 *    pupil for an instant (red-eye), and then, a reflex-latency later, the
 *    pupil clamps down on it.
 *
 * Works in millimetres; reports the radius as a share of the iris, which is
 * what the shaders read.
 */

const IRIS_DIAMETER = 12;
const D_MIN = 1.6;
const D_MAX = 8.2;
/** How long the light takes to reach the muscle. */
const LATENCY = 0.22;
/** Constriction and re-dilation rates, per second. */
const CONSTRICT = 5.5;
const DILATE = 1.1;
/** How fast the escape transient fades, per second. */
const ESCAPE = 0.6;

/** A screen's luminance (0..1) as log₁₀ millilamberts: a dark terminal to a white page. */
export function screenLogL(lum: number) {
  return -1.6 + 3.2 * lum;
}

/** Moon & Spencer: steady pupil diameter (mm) for log₁₀ L (mL). */
export function moonSpencer(logL: number) {
  return 4.9 - 3 * Math.tanh(0.4 * (logL + 1));
}

/** The resting pupil for a screen, as a share of the iris radius (for the iris bake). */
export function restingPupil(lum: number, personScale = 1) {
  const d = Math.min(D_MAX, Math.max(D_MIN, moonSpencer(screenLogL(lum)) * personScale));
  return d / IRIS_DIAMETER;
}

export interface PupilInput {
  /** The screen's luminance, 0..1. */
  lum: number;
  /** 0..1: how close the pointer has come in toward the eye. */
  near: number;
  /** The pointer is resting on the iris. */
  hover: boolean;
  exiting: boolean;
  reduce: boolean;
  /** Lab: hold the pupil at this share of the iris. */
  hold: number | null;
  /** Lab: extra log₁₀ L on top of the screen (a light step). */
  extraLogL: number;
  /** Lab: leave out the hippus, to read the reflex's own timing. */
  still?: boolean;
  /** The person's own pupil, against the average one. */
  personScale: number;
}

export class PupilRig {
  /** Current diameter, mm. */
  d = 4;
  /** Seconds since start. */
  private t = 0;
  /** The light as it was over the last half second, to read it back late. */
  private history: { t: number; logL: number }[] = [];
  /** A slow follower of the delayed light; the transient is how far ahead of it the light is. */
  private slowLogL: number | null = null;
  private arousal = 0;
  private hoverFor = 0;
  private nearNow = 0;
  private nearSlow = 0;
  /** The flash: seconds since it fired, and how bright the fundus glowed. */
  private flashAge = 99;
  private flashRed = 0;
  /** What the shaders read: radius as a share of the iris, and the red reflex. */
  share = 4 / IRIS_DIAMETER;
  red = 0;

  /** A light on the camera's axis, now. */
  flash() {
    this.flashAge = 0;
    // red-eye is brightest through the widest pupil
    this.flashRed = Math.min(1, (this.d / 6) ** 2);
  }

  update(dt: number, inp: PupilInput) {
    this.t += dt;
    this.flashAge += dt;

    // the light that reached the retina, with a flash on top for a frame or two
    const flashLight = this.flashAge < 0.06 ? 3.2 : 0;
    const logLNow = screenLogL(inp.lum) + inp.extraLogL + flashLight;
    this.history.push({ t: this.t, logL: logLNow });
    while (this.history.length > 2 && this.history[1].t < this.t - LATENCY) this.history.shift();
    const delayed = inp.reduce ? logLNow : (this.history[0]?.logL ?? logLNow);

    // the escape: a step up overshoots, then relaxes back as the follower catches up
    if (this.slowLogL === null) this.slowLogL = delayed;
    this.slowLogL += (delayed - this.slowLogL) * (1 - Math.exp(-ESCAPE * dt));
    const transient = Math.max(0, delayed - this.slowLogL);

    let target = moonSpencer(delayed) * inp.personScale;
    if (!inp.reduce) target -= 1.1 * Math.tanh(transient * 0.8);

    // near reflex and arousal
    this.nearNow += (inp.near - this.nearNow) * (1 - Math.exp(-4 * dt));
    this.nearSlow += (this.nearNow - this.nearSlow) * (1 - Math.exp(-0.7 * dt));
    const approach = Math.max(0, this.nearNow - this.nearSlow);
    this.hoverFor = inp.hover ? this.hoverFor + dt : 0;
    const interested = this.hoverFor > 0.45 ? 1 : 0;
    this.arousal += (interested - this.arousal) * (1 - Math.exp(-1.2 * dt));
    target += -0.9 * approach + 0.9 * this.arousal;

    // hippus: slow, irregular, under a millimetre
    if (!inp.reduce && !inp.still) {
      const t = this.t;
      target +=
        0.16 * Math.sin(2 * Math.PI * 0.31 * t) +
        0.09 * Math.sin(2 * Math.PI * 0.83 * t + 1.3) +
        0.05 * Math.sin(2 * Math.PI * 1.7 * t + 0.4) +
        0.06 * Math.sin(2 * Math.PI * 0.11 * t + 2.2);
    }
    target = Math.min(D_MAX, Math.max(D_MIN, target));

    if (inp.reduce) this.d = target;
    else {
      const rate = target < this.d ? CONSTRICT : DILATE;
      this.d += (target - this.d) * (1 - Math.exp(-rate * dt));
    }

    // the red reflex lasts as long as the flash
    this.red = inp.reduce ? 0 : this.flashRed * Math.exp(-this.flashAge / 0.05);

    let share = this.d / IRIS_DIAMETER;
    if (inp.hold !== null) share = inp.hold;
    // going in: the pupil opens to take the whole iris
    if (inp.exiting)
      share = Math.max(
        share,
        Math.min(0.98, this.share + (0.98 - this.share) * (1 - Math.exp(-5 * dt))),
      );
    this.share = share;
    return share;
  }
}
