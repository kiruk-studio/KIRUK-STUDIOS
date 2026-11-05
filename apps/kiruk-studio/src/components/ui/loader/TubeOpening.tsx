'use client';

/**
 * The loader's opening: 1970's tube wires the eye and forms it pixel by
 * pixel (tube/tube-scene.ts), then hands the screen to the live eye.
 *
 * A canvas over the live eye. The tube is drawn in a worker, so it keeps its
 * pace while the main thread builds the eye; where there is no
 * OffscreenCanvas it is drawn here instead. The live eye comes up under it,
 * held shut; when both are ready the tube's pixels sharpen into the eye and
 * `onOpen` tells the caller to open the real lids.
 *
 * While it runs, the visitor's pointer brings the signal and printable keys
 * type at the cursor (1970 knows only keys); Enter goes on.
 */

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { MM_PER_UNIT } from '@/components/three/eye/anatomy';
import { eyeShot } from '@/components/three/eye/framing';
import { posterPlacement, posterVariantFor } from '@/components/three/eye/posters';
import { clearTubeBoot } from './tube/boot';
import type { TubeEvent, TubeFrame } from './tube/eye-lines';
import type { PupilAt, TubeMessage, TubeStats } from './tube/tube.worker';
import { createTubeScene } from './tube/tube-scene';

const ROOM = '#040507';
/** A still of the live 1970 eye held shut, by screen shape: what the pixels form into (2 KB). */
const STILL = (variant: 'wide' | 'tall') => `/eye/posters/1970-shut-${variant}.webp`;

function frameNow(): TubeFrame {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const s = eyeShot(w, h);
  return {
    w,
    h,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    cx: s.cx,
    cy: s.cy,
    pxPerMm: h / (s.span * MM_PER_UNIT),
  };
}

interface TubeOpeningProps {
  /** The live eye is up under the tube, held shut. */
  ready: boolean;
  /** Its pupil, CSS px, once known: the tube's cursor settles onto the eye's own. */
  pupil?: PupilAt | null;
  /** No hand-off after all (the eye is late, or cannot start): the tube just fades. */
  late: boolean;
  /** Straight to the formed eye (a key the tube does not type). */
  skip: boolean;
  reduce: boolean;
  /** Lab: time scale, the main-thread path, and debug views. */
  speed?: number;
  mainThread?: boolean;
  debug?: number;
  /** Lab: filled with a function that reads the tube's frame times. */
  stats?: React.MutableRefObject<(() => Promise<TubeStats | null>) | null>;
  /** The tube has begun to hand over: the live eye under it is about to be seen, so it should draw every frame again. */
  onLanding?: () => void;
  /** The tube's pixels are becoming the live eye: open the real lids now. */
  onOpen: () => void;
  /** The opening is over and can be unmounted. */
  onGone: () => void;
}

export default function TubeOpening({
  ready,
  pupil = null,
  late,
  skip,
  reduce,
  speed = 1,
  mainThread = false,
  debug = 0,
  stats,
  onLanding,
  onOpen,
  onGone,
}: TubeOpeningProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const post = useRef<(m: TubeMessage, transfer?: Transferable[]) => void>(() => {});
  /** The tube paints the room itself once it has started; this cover is for the moment before. */
  const [painting, setPainting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // callbacks change identity; the worker's messages read the latest ones
  const handlers = useRef({ onLanding, onOpen, onGone });
  handlers.current = { onLanding, onOpen, onGone };

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    // made here, not in JSX: a canvas hands its control to a worker only once, and a
    // remount (React's dev double-mount, a replay) needs a fresh one
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    host.appendChild(canvas);
    const onEvent = (ev: TubeEvent) => {
      if (ev === 'started') {
        // the tube paints its own first frame now: the boot frame (painted before the app loaded) can go
        setPainting(true);
        clearTubeBoot();
      } else if (ev === 'landing') {
        setLeaving(true);
        handlers.current.onLanding?.();
      } else if (ev === 'open') handlers.current.onOpen();
      else if (ev === 'done') handlers.current.onGone();
    };
    const frame = frameNow();
    const variant = posterVariantFor(frame.w, frame.h);
    const imageUrl = new URL(STILL(variant), window.location.href).href;
    const imageRect = posterPlacement(frame.w, frame.h, variant);
    let cleanup = () => {};

    if (
      !mainThread &&
      typeof canvas.transferControlToOffscreen === 'function' &&
      typeof Worker !== 'undefined'
    ) {
      const worker = new Worker(new URL('./tube/tube.worker.ts', import.meta.url), {
        type: 'module',
      });
      let statsWait: ((s: TubeStats | null) => void) | null = null;
      worker.onmessage = (e: MessageEvent<{ type: TubeEvent | 'stats'; stats?: TubeStats }>) => {
        if (e.data.type === 'stats') {
          statsWait?.(e.data.stats ?? null);
          statsWait = null;
        } else onEvent(e.data.type);
      };
      if (stats) {
        stats.current = () =>
          new Promise((resolve) => {
            statsWait = resolve;
            worker.postMessage({ type: 'stats' });
          });
      }
      post.current = (m, transfer) => worker.postMessage(m, transfer ?? []);
      const off = canvas.transferControlToOffscreen();
      post.current(
        { type: 'init', canvas: off, frame, reduce, speed, imageUrl, imageRect, debug },
        [off],
      );
      cleanup = () => {
        worker.terminate();
        canvas.remove();
      };
    } else {
      // no OffscreenCanvas: the same tube on this thread (it can stall while the eye builds)
      const scene = createTubeScene(canvas, frame, {
        reduce,
        emit: onEvent,
        imageUrl,
        imageRect,
        debug,
      });
      if (!scene) {
        onEvent('done');
        return () => canvas.remove();
      }
      const started = performance.now();
      let raf = 0;
      let running = true;
      const loop = () => {
        if (!running) return;
        scene.frame(started + (performance.now() - started) * speed);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      post.current = (m) => {
        if (m.type === 'resize') scene.resize(m.frame);
        else if (m.type === 'ready') scene.eyeReady(m.pupil);
        else if (m.type === 'skip') scene.skip();
        else if (m.type === 'leave') scene.leave();
        else if (m.type === 'pointer') scene.pointer(m.x, m.y, m.down);
        else if (m.type === 'key') scene.key(m.key);
      };
      cleanup = () => {
        running = false;
        cancelAnimationFrame(raf);
        canvas.remove();
      };
    }

    const onResize = () => post.current({ type: 'resize', frame: frameNow() });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cleanup();
      clearTubeBoot();
    };
    // the tube is made once; later changes arrive as messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) post.current({ type: 'ready', pupil });
  }, [ready, pupil]);
  useEffect(() => {
    if (skip) post.current({ type: 'skip' });
  }, [skip]);
  useEffect(() => {
    if (!late) return;
    post.current({ type: 'leave' });
    setLeaving(true);
  }, [late]);

  // 1970 knows only keys: printable keys type at the cursor; Enter goes on. Held until the
  // tube has gone, hand-off included, so a visitor still typing never reaches the loader's own keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      post.current({ type: 'key', key: e.key });
    };
    // capture, so the loader's own keys (travel, go in) wait until the eye is open
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ pointerEvents: leaving ? 'none' : 'auto', touchAction: 'none' }}
      onPointerDown={
        leaving
          ? undefined
          : (e) => post.current({ type: 'pointer', x: e.clientX, y: e.clientY, down: true })
      }
      onPointerMove={
        leaving
          ? undefined
          : (e) => post.current({ type: 'pointer', x: e.clientX, y: e.clientY, down: false })
      }
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={{ background: ROOM, opacity: painting ? 0 : 1 }} />
      <div ref={box} className="absolute inset-0" />
    </div>
  );
}
