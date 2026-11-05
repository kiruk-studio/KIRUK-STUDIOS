'use client';

/**
 * A fingertip that shows a phone how the loader works, without a word.
 *
 * It presses just under the eye, drags the era along and back (the eye really
 * travels with it), then glides up and taps the iris, which ripples: the same
 * tap that goes in. The loader plays it once the eye is up and again after a
 * long idle, and stops it at the visitor's first touch.
 *
 * It is only a picture: aria-hidden, no pointer events. All it reports is how
 * far it has dragged, in eras (unrounded), so the loader can move the real
 * one and the eye blinks once per era, as under a real thumb.
 */

import { type AnimationPlaybackControls, animate, motion, useMotionValue } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

/** The fingertip's diameter, CSS px: about a thumb's contact patch. */
const TIP = 44;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/**
 * The drag: two eras along, a pause, and back, each way gentle enough (a
 * sine, peaking near 2.6 eras a second) that the eye blinks at each era
 * instead of shutting against the rush.
 */
const EASE_SINE = [0.37, 0, 0.63, 1] as const;
const DRAG_S = 1.2;
const DRAG_PAUSE_MS = 380;

interface GhostFingerProps {
  /** Playing; false stops it and fades it out. */
  run: boolean;
  /** A new number plays it again from the start. */
  play: number;
  /** The visitor has already swiped: show only the tap. */
  tapOnly: boolean;
  reduce: boolean;
  /** Where the iris is now, CSS px, and its radius. */
  eye: () => { x: number; y: number; r: number };
  /** Points of drag that move one era (the loader's own swipe pitch). */
  pitch: number;
  /** Eras dragged across since this play's drag began, signed and unrounded; null when the drag ends. */
  onScrub: (eras: number | null) => void;
  onDone: () => void;
}

export default function GhostFinger({
  run,
  play,
  tapOnly,
  reduce,
  eye,
  pitch,
  onScrub,
  onDone,
}: GhostFingerProps) {
  const x = useMotionValue(-TIP);
  const y = useMotionValue(-TIP);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);
  const ringX = useMotionValue(0);
  const ringY = useMotionValue(0);
  const ringD = useMotionValue(0);
  const ringM = useMotionValue(0);
  const ringScale = useMotionValue(1);
  const ringOpacity = useMotionValue(0);
  // the callbacks change every render; the sequence reads the latest
  const cb = useRef({ eye, onScrub, onDone });
  cb.current = { eye, onScrub, onDone };

  useEffect(() => {
    if (!run) {
      const a = animate(opacity, 0, { duration: 0.15 });
      const b = animate(ringOpacity, 0, { duration: 0.15 });
      return () => {
        a.stop();
        b.stop();
      };
    }

    let live = true;
    // everything this play has running, so a touch can stop all of it at once
    const running = new Set<AnimationPlaybackControls>();
    let unsub = () => {};
    let scrubbing = false;
    const endScrub = () => {
      unsub();
      unsub = () => {};
      if (scrubbing) cb.current.onScrub(null);
      scrubbing = false;
    };
    const to = (
      mv: typeof x,
      value: number,
      duration: number,
      ease: readonly number[] = EASE_OUT,
    ) => {
      if (!live) return Promise.resolve();
      const a = animate(mv, value, {
        duration: reduce ? 0 : duration,
        ease: [...ease] as [number, number, number, number],
      });
      running.add(a);
      return a.finished.then(() => {
        running.delete(a);
      });
    };
    const both = (...steps: Promise<void>[]) => Promise.all(steps).then(() => undefined);
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const sequence = async () => {
      const { x: cx, y: cy, r } = cb.current.eye();
      // the drag runs just under the lower lid, centred on the eye; on a
      // phone held sideways there is no room under it, so it rides the lid
      const dragY = Math.min(cy + r * 2.1, window.innerHeight - TIP);
      const x0 = cx - pitch;
      if (!tapOnly && !reduce) {
        x.set(x0);
        y.set(dragY);
        scale.set(1.15);
        await both(to(opacity, 1, 0.35), to(scale, 1, 0.35));
        await to(scale, 0.84, 0.14);
        // two eras along, and back: the eye travels with the finger, and
        // its lids with it
        scrubbing = true;
        unsub = x.on('change', (v) => {
          if (live) cb.current.onScrub((v - x0) / pitch);
        });
        await to(x, x0 + pitch * 2, DRAG_S, EASE_SINE);
        await wait(DRAG_PAUSE_MS);
        await to(x, x0, DRAG_S, EASE_SINE);
        endScrub();
        await to(scale, 1, 0.16);
        await wait(260);
        if (!live) return;
        // up to the iris
        await both(to(x, cx, 0.6, EASE_IN_OUT), to(y, cy, 0.6, EASE_IN_OUT));
      } else {
        x.set(cx);
        y.set(cy);
        scale.set(1.15);
        await both(to(opacity, 1, 0.35), to(scale, 1, 0.35));
      }
      if (!live) return;
      // the tap: a press, and the iris answers with a ring
      ringX.set(cx);
      ringY.set(cy);
      ringD.set(r * 2);
      ringM.set(-r);
      ringScale.set(1);
      ringOpacity.set(0.7);
      await to(scale, 0.8, 0.12);
      void to(ringScale, 1.7, 0.8);
      void to(ringOpacity, 0, 0.8);
      await to(scale, 1, 0.2);
      await wait(520);
      await to(opacity, 0, 0.4);
      if (live) cb.current.onDone();
    };
    void sequence();

    return () => {
      live = false;
      endScrub();
      for (const a of running) a.stop();
    };
    // a new play restarts it; the motion values are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, play, tapOnly, reduce, pitch]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <motion.span
        className="absolute left-0 top-0 block rounded-full"
        style={{
          x: ringX,
          y: ringY,
          width: ringD,
          height: ringD,
          marginLeft: ringM,
          marginTop: ringM,
          scale: ringScale,
          opacity: ringOpacity,
          border: '2px solid rgba(152,58,34,0.85)',
          boxShadow: '0 0 0 1px rgba(26,18,14,0.2)',
        }}
      />
      <motion.span
        className="absolute left-0 top-0 block rounded-full"
        style={{
          x,
          y,
          width: TIP,
          height: TIP,
          marginLeft: -TIP / 2,
          marginTop: -TIP / 2,
          scale,
          opacity,
          // light on a dark era, still seen on a white one
          background:
            'radial-gradient(circle at 50% 45%, rgba(244,236,223,0.2), rgba(26,18,14,0.18) 70%)',
          border: '2px solid rgba(26,18,14,0.72)',
          boxShadow: '0 6px 18px rgba(26,18,14,0.18)',
          backdropFilter: 'blur(2px)',
        }}
      />
    </div>
  );
}
