'use client';

/**
 * First visit: a hand draws an eye in ink, then the eye opens.
 *
 * The preloader is the drawing. The burin eye (@kiruk/burin/hand: the same rig,
 * line families and tones as the engraved plate on the landing) is laid stroke by
 * stroke on the visitor's paper, in the plate's own order: the construction in
 * chalk, the contours, the hatching, the cross-hatching and the hair, and last the
 * pupil, inked round the kiruk star. Fresh ink goes down blue-black and browns as
 * it dries. The corner names the pass being drawn, as the landing's strip of
 * studies does.
 *
 * Then the loading animation: the drawing wakes. Its lids close and open the way a
 * waking eye does, and it starts to look about and follow the pointer, while the
 * page under it finishes loading (on the landing, until the engine has printed
 * the plate). Once the page is ready the other corner says how in: click or tap
 * the eye, or press Enter. On the landing the drawn eye then settles onto the
 * plate's own eye as the sheet lifts away.
 *
 * The pen runs in a worker (loader/ink/ink.worker.ts), so the page booting under
 * it never stalls a stroke; where there is no OffscreenCanvas it runs here.
 * A press, a wheel or a key while it draws hurries the hand. Reduced motion
 * shows the finished drawing, still. No WebGL is needed for any of it.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md
 */

import { lowerLid, upperLid } from '@kiruk/burin/rig';
import { useReducedMotion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import GhostFinger from '@/components/ui/ghost-finger';
import { clearInkBoot } from '@/components/ui/loader/ink/boot';
import { type InkFrame, inkFrame } from '@/components/ui/loader/ink/frame';
import type { InkMessage, InkReply } from '@/components/ui/loader/ink/ink.worker';
import type { InkEvent, InkLayerName, InkScene } from '@/components/ui/loader/ink/ink-scene';
import { type Dawn, readDawn, SHEETS, sheetStyle } from '@/components/ui/loader/ink/paper';

const LAYERS: readonly InkLayerName[] = ['cons', 'skin', 'eye', 'wet'];
/** The passes, as the landing's strip of studies names them; the plate is the fifth. */
const PASSES = ['', 'construction', 'contour', 'hatching', 'cross-hatching', 'the plate'];
const ROMAN = ['', 'i', 'ii', 'iii', 'iv', 'v'];
/** The chalk gives way to the ink, pass by pass, down to the plate's faint construction (0.3). */
const CHALK = [1, 1, 1, 0.74, 0.52, 0.36, 0.3];
/** After the eye has woken, the page under it is waited for this long at most, ms. */
const READY_AFTER_AWAKE_MS = 6000;
/** And never longer than this from the start, ms. */
const READY_MAX_MS = 16000;
/** The way in: the drawing settles onto the plate, then the sheet lifts and it dissolves, ms. */
const EXIT_MS = 1100;
const EXIT_PLAIN_MS = 600;
/** A press shorter and stiller than this is a tap. */
const TAP_SLOP = 10;
/** Smallest the way in is ever allowed to be, in points; a finger gets a wider target. */
const IRIS_TAP_MIN = 56;
const IRIS_TAP_COARSE = 1.3;
/** A key that hurried the hand does not also go in. */
const KEY_GUARD_MS = 450;
/** The ghost fingertip (phones): this long after the eye is ready, again after an idle, so often. */
const DEMO_AFTER_MS = 900;
const DEMO_IDLE_MS = 8000;
const DEMO_PLAYS = 3;

type Phase = 'draw' | 'wake' | 'awake' | 'exit';

/**
 * The page keeps a scrollbar gutter, and nothing fixed can paint into it. While the
 * loader is up the page under it neither scrolls nor needs one. Returns the undo.
 */
function dropPageGutter() {
  const st = document.documentElement.style;
  const was = { gutter: st.scrollbarGutter, overflow: st.overflow };
  st.scrollbarGutter = 'auto';
  st.overflow = 'hidden';
  return () => {
    st.scrollbarGutter = was.gutter;
    st.overflow = was.overflow;
  };
}

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = globalThis.matchMedia('(pointer: coarse)');
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return coarse;
}

const frameNow = () =>
  inkFrame(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);

/** A message for the worker, delivered to a scene on this thread instead. */
function toScene(scene: InkScene, m: InkMessage) {
  if (m.type === 'resize') scene.resize(m.frame);
  else if (m.type === 'pointer') scene.pointer(m.x, m.y);
  else if (m.type === 'leave') scene.leave();
  else if (m.type === 'skip') scene.skip();
  else if (m.type === 'enter') scene.enter();
}

/** The resting iris for a frame, page px. */
const restIris = (f: InkFrame) => ({ x: f.cx, y: f.cy + 0.02 * f.S, r: 0.36 * f.S });

/**
 * Is the page under the loader ready to be seen? Loaded, its type set, and, on the
 * landing, its plate printed by the engine (or the engine given up for the poster).
 */
function pageReady() {
  if (document.readyState !== 'complete') return false;
  const plate = document.querySelector('.eye-page');
  if (plate && !plate.classList.contains('gpu-ready') && !plate.classList.contains('gpu-failed'))
    return false;
  return true;
}

/** A pupil that widens while the pointer is on the eye: the way in, ready. */
function PupilGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="block"
    >
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.1" />
      <circle
        cx="7"
        cy="7"
        r={open ? 3.6 : 1.9}
        fill="currentColor"
        style={{ transition: 'r 300ms cubic-bezier(0.23, 1, 0.32, 1)' }}
      />
    </svg>
  );
}

/** A nib, writing: the pass being drawn. */
function NibGlyph({ writing }: { writing: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="block"
    >
      <g
        style={{
          transformOrigin: '3px 11px',
          animation: writing ? 'ink-nib 0.9s ease-in-out infinite' : undefined,
        }}
      >
        <path d="M12.6 1.4 4.2 9.8 3 12.2l2.4-1.2 8.4-8.4Z" fill="currentColor" />
        <path d="M4.2 9.8 5.4 11" stroke="currentColor" strokeWidth="0.9" />
      </g>
    </svg>
  );
}

interface InkLoadingPageProps {
  /** The way in has begun: the page under the loader may be shown now. */
  onReveal: () => void;
  /** The loader is gone and can be unmounted. */
  onComplete: () => void;
}

export default function InkLoadingPage({ onReveal, onComplete }: InkLoadingPageProps) {
  const reduce = useReducedMotion() ?? false;
  const coarse = useCoarsePointer();
  const [dawn, setDawn] = useState<Dawn>('old');
  const [phase, setPhase] = useState<Phase>('draw');
  const [pass, setPass] = useState(0);
  const [ready, setReady] = useState(false);
  const [overEye, setOverEye] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Where the drawing goes on the way in: onto the plate's own eye, or just away. */
  const [flip, setFlip] = useState<{ transform: string; origin: string } | null>(null);
  const [frame, setFrame] = useState<InkFrame | null>(null);

  const host = useRef<HTMLDivElement | null>(null);
  const post = useRef<(m: InkMessage) => void>(() => {});
  const frameRef = useRef<InkFrame | null>(null);
  const iris = useRef({ x: 0, y: 0, r: 0 });
  const phaseRef = useRef<Phase>('draw');
  const awakeAt = useRef(0);
  const hurriedAt = useRef(-1e9);
  const press = useRef({ x: 0, y: 0, t: 0, hurried: false });
  const exitTimer = useRef(0);

  const toPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ---- the pen: four canvases, a worker (or this thread), and its events ---- */

  // biome-ignore lint/correctness/useExhaustiveDependencies: the pen is made once, on mount; later changes reach it as messages
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const d = readDawn();
    setDawn(d);
    const sheet = SHEETS[d];
    const colors = { ink: sheet.ink, chalk: sheet.chalk, wet: sheet.wet };
    let f = frameNow();
    frameRef.current = f;
    setFrame(f);
    iris.current = restIris(f);

    // Made here, not in JSX: a canvas hands its control to a worker only once, and a
    // remount (React's dev double-mount) needs fresh ones.
    const made = {} as Record<InkLayerName, HTMLCanvasElement>;
    for (const k of LAYERS) {
      const c = document.createElement('canvas');
      c.dataset.layer = k;
      c.style.position = 'absolute';
      c.style.transition = 'opacity 900ms ease-out';
      el.appendChild(c);
      made[k] = c;
    }
    const place = (fr: InkFrame) => {
      for (const k of LAYERS) {
        const s = made[k].style;
        s.left = `${fr.x}px`;
        s.top = `${fr.y}px`;
        s.width = `${fr.cw}px`;
        s.height = `${fr.ch}px`;
      }
    };
    place(f);

    const onEvent = (ev: InkEvent | { type: 'failed' }) => {
      switch (ev.type) {
        case 'started':
          clearInkBoot();
          break;
        case 'pass':
          setPass(ev.pass);
          made.cons.style.opacity = String(CHALK[Math.min(ev.pass, 6)] ?? 0.3);
          break;
        case 'drawn':
          if (phaseRef.current === 'draw') toPhase('wake');
          break;
        case 'awake':
          if (phaseRef.current !== 'exit') {
            awakeAt.current = performance.now();
            toPhase('awake');
          }
          break;
        case 'iris':
          iris.current = { x: ev.x, y: ev.y, r: ev.r };
          break;
        case 'failed':
          clearInkBoot();
          setFailed(true);
          awakeAt.current = performance.now();
          toPhase('awake');
          break;
      }
    };

    let cleanup = () => {};
    const useWorker =
      typeof made.cons.transferControlToOffscreen === 'function' && typeof Worker !== 'undefined';
    if (useWorker) {
      const worker = new Worker(new URL('./loader/ink/ink.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (e: MessageEvent<InkReply>) => onEvent(e.data);
      worker.onerror = () => onEvent({ type: 'failed' });
      post.current = (m) => worker.postMessage(m);
      const off = {} as Record<InkLayerName, OffscreenCanvas>;
      for (const k of LAYERS) off[k] = made[k].transferControlToOffscreen();
      worker.postMessage(
        { type: 'init', canvases: off, frame: f, reduce, speed: 1, colors } satisfies InkMessage,
        LAYERS.map((k) => off[k]),
      );
      cleanup = () => worker.terminate();
    } else {
      // No OffscreenCanvas: the same pen on this thread (it can stall while the page boots).
      // Fetched only here, so the bundle every page loads does not carry the drawing.
      let scene: InkScene | null = null;
      let raf = 0;
      let alive = true;
      const queued: InkMessage[] = [];
      post.current = (m) => {
        if (scene) toScene(scene, m);
        else queued.push(m);
      };
      import('@/components/ui/loader/ink/ink-scene')
        .then(({ createInkScene }) => {
          if (!alive) return;
          scene = createInkScene(made, f, { reduce, speed: 1, colors, emit: onEvent });
          if (!scene) {
            onEvent({ type: 'failed' });
            return;
          }
          for (const m of queued.splice(0)) toScene(scene, m);
          const loop = (now: number) => {
            scene?.frame(now);
            raf = requestAnimationFrame(loop);
          };
          raf = requestAnimationFrame(loop);
        })
        .catch((err) => {
          console.warn('[ink] the opening cannot draw here:', err);
          if (alive) onEvent({ type: 'failed' });
        });
      cleanup = () => {
        alive = false;
        cancelAnimationFrame(raf);
        scene = null;
      };
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (phaseRef.current === 'exit') return;
        f = frameNow();
        frameRef.current = f;
        setFrame(f);
        iris.current = restIris(f);
        place(f);
        post.current({ type: 'resize', frame: f });
      }, 140);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      cleanup();
      for (const k of LAYERS) made[k].remove();
      clearInkBoot();
    };
  }, []);

  /* ---- the page under the loader ---- */

  useEffect(() => {
    if (phase === 'exit') return;
    return dropPageGutter();
  }, [phase]);

  useEffect(() => {
    if (ready) return;
    const t0 = performance.now();
    let fonts = typeof document.fonts === 'undefined';
    document.fonts?.ready.then(() => {
      fonts = true;
    });
    const id = window.setInterval(() => {
      const now = performance.now();
      const waitedAwake = awakeAt.current > 0 && now - awakeAt.current > READY_AFTER_AWAKE_MS;
      if ((fonts && pageReady()) || waitedAwake || now - t0 > READY_MAX_MS) {
        setReady(true);
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [ready]);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  /* ---- going in ---- */

  const enter = useCallback(() => {
    if (phaseRef.current === 'exit') return;
    toPhase('exit');
    post.current({ type: 'enter' });
    const f = frameRef.current;
    // On the landing the drawing settles onto the plate's own eye (EyeEngine reads the same box).
    const box = document.querySelector('.eye-page .eye-box')?.getBoundingClientRect();
    let ms = reduce ? 220 : EXIT_PLAIN_MS;
    if (!reduce && f && box && box.width > 2) {
      const S2 = box.width / 3.2;
      const cx2 = box.left + 1.6 * S2;
      const cy2 = box.top + 1.45 * S2;
      setFlip({
        origin: `${f.cx}px ${f.cy}px`,
        transform: `translate(${cx2 - f.cx}px, ${cy2 - f.cy}px) scale(${S2 / f.S})`,
      });
      ms = EXIT_MS;
    }
    onReveal();
    exitTimer.current = window.setTimeout(onComplete, ms);
  }, [onComplete, onReveal, reduce, toPhase]);

  /** Hurry the hand. */
  const hurry = useCallback(() => {
    hurriedAt.current = performance.now();
    post.current({ type: 'skip' });
  }, []);

  /** Inside the drawn eye: on the iris (with a generous ring), or anywhere between the lids. */
  const onEye = useCallback(
    (x: number, y: number) => {
      const f = frameRef.current;
      if (!f) return false;
      const ir = iris.current;
      const r = Math.max(IRIS_TAP_MIN, ir.r * (coarse ? IRIS_TAP_COARSE : 1.08));
      if (Math.hypot(x - ir.x, y - ir.y) < r) return true;
      const ex = (x - f.cx) / f.S;
      const ey = (y - f.cy) / f.S;
      return Math.abs(ex) <= 1 && ey >= upperLid(ex) && ey <= lowerLid(ex);
    },
    [coarse],
  );

  const awake = phase === 'awake' || phase === 'wake';

  /* ---- the hand on the paper ---- */

  /* The page booting under the loader listens to the window (the landing's engine turns
     its eye to the pointer, blinks at a press, wets its paper under a drag). Its hand is
     not on that page yet: the loader's pointer events stop here, so the hidden plate is
     not re-cut on every move while the pen draws, and the press that goes in does not
     also land on it. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (phaseRef.current === 'exit') return;
      const drawing = phaseRef.current === 'draw';
      press.current = { x: e.clientX, y: e.clientY, t: performance.now(), hurried: drawing };
      if (drawing) hurry();
    },
    [hurry],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (phaseRef.current === 'exit') return;
      post.current({ type: 'pointer', x: e.clientX, y: e.clientY });
      if (e.pointerType === 'mouse') setOverEye(onEye(e.clientX, e.clientY));
    },
    [onEye],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const p = press.current;
      press.current = { x: 0, y: 0, t: 0, hurried: false };
      if (!p.t || p.hurried || phaseRef.current === 'exit' || phaseRef.current === 'draw') return;
      const still = Math.hypot(e.clientX - p.x, e.clientY - p.y) < TAP_SLOP;
      if (still && onEye(e.clientX, e.clientY)) enter();
    },
    [enter, onEye],
  );

  // The loader owns the whole screen, so it owns the keyboard: Enter or Space hurries
  // the hand while it draws, and goes in once the eye is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (e.repeat) return;
      const p = phaseRef.current;
      if (p === 'exit') return;
      if (p === 'draw') {
        hurry();
        return;
      }
      if (performance.now() - hurriedAt.current < KEY_GUARD_MS) return;
      enter();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [enter, hurry]);

  // A wheel while it draws hurries the hand; the page under it never scrolls.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (phaseRef.current === 'draw' && Math.abs(e.deltaX) + Math.abs(e.deltaY) > 1) hurry();
    };
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, [hurry]);

  // The way in is a real button too, for the keyboard and for screen readers.
  const button = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    button.current?.focus({ preventScroll: true });
  }, []);

  /* ---- the ghost fingertip (phones): how to go in, shown ---- */

  const demoOn = coarse && phase === 'awake' && ready && !failed;
  const [demo, setDemo] = useState({ run: false, play: 0 });
  const demoState = useRef({ plays: 0, timer: 0 });
  const queueDemo = useCallback(
    (ms: number) => {
      const d = demoState.current;
      window.clearTimeout(d.timer);
      if (!demoOn || d.plays >= DEMO_PLAYS) return;
      d.timer = window.setTimeout(() => {
        d.plays += 1;
        setDemo({ run: true, play: d.plays });
      }, ms);
    },
    [demoOn],
  );
  useEffect(() => {
    const d = demoState.current;
    if (!demoOn) {
      window.clearTimeout(d.timer);
      setDemo((s) => (s.run ? { ...s, run: false } : s));
      return;
    }
    if (d.plays === 0) queueDemo(DEMO_AFTER_MS);
    return () => window.clearTimeout(d.timer);
  }, [demoOn, queueDemo]);
  const onDemoDone = useCallback(() => {
    setDemo((s) => ({ ...s, run: false }));
    queueDemo(DEMO_IDLE_MS);
  }, [queueDemo]);
  const demoEye = useCallback(() => iris.current, []);

  /* ---- the page ---- */

  const sheet = SHEETS[dawn];
  const exiting = phase === 'exit';
  const settle = flip !== null;
  const hintIn = awake && ready && !exiting;
  const captionIn = !exiting && !hintIn && pass > 0;
  // The pass being drawn, numbered in rubric as the landing's strip numbers its studies;
  // then the eye opening; then, while the page under it finishes, the ink drying.
  const caption =
    phase === 'draw'
      ? { n: ROMAN[Math.min(pass, 5)], words: PASSES[Math.min(pass, 5)] }
      : phase === 'wake'
        ? { n: 'v', words: 'the eye opens' }
        : { n: '', words: 'the ink dries' };
  const restAt = frame ? restIris(frame) : null;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Enter kiruk"
      aria-describedby="ink-intro-words"
      data-ink-phase={phase}
      data-ink-pass={pass}
      data-ink-ready={ready ? '' : undefined}
      style={{
        color: sheet.text,
        touchAction: 'none',
        overscrollBehavior: 'none',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: exiting ? 'none' : 'auto',
      }}
    >
      <style>{`@keyframes ink-nib{0%,100%{transform:rotate(0deg) translate(0,0)}50%{transform:rotate(-9deg) translate(1px,-1px)}}`}</style>
      <p id="ink-intro-words" className="sr-only">
        A hand draws an eye in ink on paper, then the eye opens. Press Enter, or tap the eye, to go
        in.
      </p>

      {/* the sheet: the visitor's paper, as the landing will print on it */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          ...sheetStyle(dawn),
          opacity: exiting ? 0 : 1,
          transition: reduce
            ? 'opacity 200ms ease-out'
            : // Settling onto the plate, the sheet stays until the drawing is nearly there.
              `opacity 520ms cubic-bezier(0.4, 0, 0.2, 1) ${settle ? 460 : 0}ms`,
        }}
      />

      {/* the drawing: four canvases, placed by the frame (the pen draws into them) */}
      <div
        ref={host}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          transformOrigin: flip?.origin,
          transform: flip ? flip.transform : exiting && !reduce ? 'scale(0.985)' : 'none',
          opacity: exiting ? 0 : 1,
          transition: reduce
            ? 'opacity 200ms ease-out'
            : settle
              ? 'transform 950ms cubic-bezier(0.65, 0, 0.35, 1), opacity 320ms ease-in 760ms'
              : 'transform 560ms cubic-bezier(0.4, 0, 0.2, 1), opacity 520ms ease-out',
        }}
      >
        {failed && frame && (
          // No 2D canvas to draw on: the printed plate stands in for the drawing.
          <div
            className="absolute"
            style={{
              left: frame.cx - 1.6 * frame.S,
              top: frame.cy - 1.45 * frame.S,
              width: 3.2 * frame.S,
              height: 2.55 * frame.S,
              background: 'url("/eye/engraved-eye.jpg") center / 100% 100% no-repeat',
              mixBlendMode: 'multiply',
            }}
          />
        )}
      </div>

      {/* the paper is the control: a press hurries the hand, a tap on the eye goes in */}
      <div
        className="absolute inset-0"
        style={{ cursor: awake && overEye && !exiting ? 'pointer' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => {
          e.stopPropagation();
          press.current = { x: 0, y: 0, t: 0, hurried: false };
        }}
        onPointerLeave={() => {
          post.current({ type: 'leave' });
          setOverEye(false);
        }}
      />

      {/* the keyboard's way in: a real button on the iris */}
      {restAt && (
        <button
          ref={button}
          type="button"
          aria-label="Enter kiruk"
          tabIndex={exiting ? -1 : 0}
          className={`ink-enter absolute rounded-full outline-none ${hintIn ? 'focus-visible:ring-2 focus-visible:ring-offset-2' : ''}`}
          style={
            {
              left: restAt.x - restAt.r,
              top: restAt.y - restAt.r,
              width: restAt.r * 2,
              height: restAt.r * 2,
              background: 'transparent',
              border: 0,
              pointerEvents: 'none',
              '--tw-ring-color': sheet.rubric,
              '--tw-ring-offset-color': 'transparent',
            } as React.CSSProperties
          }
          onClick={() => {
            if (phaseRef.current === 'draw') hurry();
            else enter();
          }}
        />
      )}

      {/* the corners: the pass being drawn; then how to go in */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 sm:px-6"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          fontFamily: 'var(--font-fell), "IM Fell English", Palatino, serif',
        }}
      >
        <span
          className="inline-flex items-center gap-2 text-[15px] italic leading-none sm:text-base"
          style={{
            opacity: captionIn ? 1 : 0,
            transition: reduce ? 'none' : 'opacity 400ms ease-out',
          }}
        >
          <span style={{ color: sheet.text }}>
            <NibGlyph writing={phase === 'draw' && !reduce} />
          </span>
          <span>
            {caption.n ? <span style={{ color: sheet.rubric }}>{caption.n} · </span> : null}
            {caption.words}
          </span>
        </span>
        <span
          className="inline-flex flex-row-reverse items-center gap-2 text-[15px] italic leading-none sm:text-base"
          style={{
            opacity: hintIn ? 1 : 0,
            transform: hintIn ? 'none' : 'translateY(4px)',
            transition: reduce
              ? 'none'
              : 'opacity 500ms ease-out 200ms, transform 500ms cubic-bezier(0.23, 1, 0.32, 1) 200ms',
          }}
        >
          <span style={{ color: sheet.text }}>
            <PupilGlyph open={overEye} />
          </span>
          <span>
            {coarse ? 'Tap the eye' : 'Click the eye'}
            <span style={{ color: sheet.rubric }}> · enter</span>
          </span>
        </span>
      </div>

      {coarse && (
        <GhostFinger
          run={demo.run}
          play={demo.play}
          tapOnly
          reduce={reduce}
          eye={demoEye}
          pitch={48}
          onScrub={() => {}}
          onDone={onDemoDone}
        />
      )}
    </div>
  );
}
