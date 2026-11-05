/**
 * The eye, alive: where it looks, when it blinks, how wide the pupil opens.
 *
 *   gaze    follows the pointer on a critically damped spring; when the pointer
 *           rests, small fixational saccades every few seconds
 *   blink   every 4–9 s, or when the plate is pressed; profile in motion/dynamics
 *   pupil   constricts when the page is held to the light (≈0.14 s), recovers
 *           slowly (≈0.6 s); on first sight it is wide and settles, as eyes do
 *
 * Reduced motion: no saccades, no idle blinks, every change jumps.
 */
import { BLINK_LENGTH, blinkAt, Critical, History, Reflex } from '../../motion/dynamics';
import { EYE, type Pose } from './rig';

export type EyeMotion = ReturnType<typeof createEyeMotion>;

export function createEyeMotion(opts: { reduced: boolean; seed?: number }) {
  let seed = opts.seed ?? 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const gx = new Critical(0, 11);
  const gy = new Critical(0, 11);
  const pupil = new Reflex(opts.reduced ? EYE.pupil.rest : EYE.pupil.dark, 0.14, 0.6);
  pupil.set(EYE.pupil.rest);
  const light = new Critical(0, 9);
  const age = new Critical(0, 6);
  let blinkT = -1;
  let nextBlink = 2.2;
  let nextSaccade = 2.5;
  let pointerIdle = 0;
  let clock = 0;
  let lastOpen = 1;
  const hist = { gaze: new History(3), pupil: new History(3), lid: new History(3) };

  const look = (nx: number, ny: number) => {
    // A soft limit: the eye turns less the further you go, like a real one.
    const tx = Math.tanh(nx * 1.15);
    const ty = Math.tanh(ny * 1.25) * 0.85;
    if (opts.reduced) {
      gx.snap(tx);
      gy.snap(ty);
    } else {
      gx.set(tx);
      gy.set(ty);
    }
    pointerIdle = 0;
  };

  return {
    hist,
    /** Pointer in eye units (x right, y down, 1 = half the fissure). */
    pointer(px: number, py: number) {
      look(px / 2.2, py / 1.8);
    },
    leave() {
      gx.set(0);
      gy.set(0);
    },
    blink() {
      if (blinkT < 0 || blinkT > BLINK_LENGTH) blinkT = 0;
    },
    hold(on: boolean) {
      light.set(on ? 1 : 0);
      pupil.set(on ? EYE.pupil.light : EYE.pupil.rest);
      if (opts.reduced) {
        light.snap(on ? 1 : 0);
        pupil.x = pupil.target;
      }
    },
    setAge(v: number) {
      if (opts.reduced) age.snap(v);
      else age.set(v);
    },
    /** Advance; returns the pose, the light and the age, and whether anything still moves. */
    step(dt: number) {
      clock += dt;
      pointerIdle += dt;
      if (!opts.reduced) {
        nextBlink -= dt;
        if (nextBlink <= 0) {
          this.blink();
          nextBlink = 4 + rand() * 5;
        }
        nextSaccade -= dt;
        if (pointerIdle > 2.4 && nextSaccade <= 0) {
          gx.omega = 26;
          gy.omega = 26;
          gx.set(Math.max(-0.5, Math.min(0.5, gx.target + (rand() - 0.5) * 0.22)));
          gy.set(Math.max(-0.35, Math.min(0.35, gy.target + (rand() - 0.5) * 0.14)));
          nextSaccade = 1.6 + rand() * 2.6;
        } else if (pointerIdle < 0.1) {
          gx.omega = 11;
          gy.omega = 11;
        }
      }
      gx.step(dt);
      gy.step(dt);
      pupil.step(dt);
      light.step(dt);
      age.step(dt);
      let open = 1;
      let dOpen = 0;
      if (blinkT >= 0) {
        blinkT += dt;
        const b = blinkAt(blinkT);
        open = b.a;
        dOpen = b.da;
        if (blinkT > BLINK_LENGTH) blinkT = -1;
      }
      hist.gaze.push(clock, gx.x, gx.v);
      hist.pupil.push(clock, pupil.x, pupil.v);
      hist.lid.push(clock, open, dOpen);
      const moving =
        !gx.done ||
        !gy.done ||
        !pupil.done ||
        !light.done ||
        !age.done ||
        blinkT >= 0 ||
        open !== lastOpen;
      lastOpen = open;
      const pose: Pose = { gx: gx.x, gy: gy.x, open, pupil: pupil.x };
      return { pose, light: light.x, age: age.x, moving, clock, gazeV: Math.hypot(gx.v, gy.v) };
    },
  };
}
