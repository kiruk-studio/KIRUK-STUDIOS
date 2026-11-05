/**
 * Opening the live eye's lids from shut, the way a waking eye does: they lift,
 * catch for a moment, then open the rest of the way. Shared by the loader and
 * its lab (/lab/opening).
 */

import type { EyeStageControl } from '@/components/three/eye/EyeStage';

const LIDS_MS = 1300;

/** How shut the lids are (1 shut, 0 open), t from 0 to 1. */
export function lidsAt(t: number) {
  const out = (x: number) => 1 - (1 - x) ** 3;
  const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
  if (t <= 0) return 1;
  if (t < 0.32) return 1 - 0.55 * out(t / 0.32);
  if (t < 0.44) return 0.45 - 0.03 * ((t - 0.32) / 0.12);
  if (t < 1) return 0.42 * (1 - inOut((t - 0.44) / 0.56));
  return 0;
}

/** Hold the eye shut and looking straight out, until it is opened. */
export function holdShut(c: EyeStageControl) {
  c.holdBlink(1);
  c.holdGaze({ x: 0, y: 0 });
}

/** Hold the eye open and looking straight out (the circuit draws an open eye; a blink would break the match). */
export function holdLook(c: EyeStageControl) {
  c.holdBlink(0);
  c.holdGaze({ x: 0, y: 0 });
}

/** Open the lids and hand the eye back to itself. Returns a cancel. */
export function openLids(c: EyeStageControl, reduce: boolean, onDone?: () => void): () => void {
  const release = () => {
    c.holdBlink(null);
    c.holdGaze(null);
    onDone?.();
  };
  if (reduce) {
    release();
    return () => {};
  }
  let raf = 0;
  const t0 = performance.now();
  const tick = (now: number) => {
    const t = (now - t0) / LIDS_MS;
    if (t >= 1) {
      release();
      return;
    }
    c.holdBlink(lidsAt(t));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
