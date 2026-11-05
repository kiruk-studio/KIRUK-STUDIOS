'use client';

/**
 * First-visit era picker.
 *
 * The whole screen is one eye, and the eye is the control: sweep left or right
 * across it to travel through ten eras, and the interface reflected in its
 * cornea changes with you — a phosphor terminal at the left end, generative
 * surfaces at the right.
 *
 * There is no button. You sweep to travel and you tap the iris to go in —
 * through the pupil, which is the same opening the exit transition dilates.
 * There are no words either. Each era is told by the eye itself, seen through
 * that era's own screen (three/eye/post/era-medium.ts): a phosphor terminal, a
 * 1-bit bitmap, a grey GIF still loading on a white page, and so on to the
 * halftone of 2026. Travelling sweeps the next era in over the last. For a
 * screen reader, the slider's value names the era.
 *
 * Before any of that, while the eye compiles behind it held shut, 1970's tube
 * wires the eye and forms it pixel by pixel (loader/TubeOpening.tsx); the
 * pixels then sharpen into the live eye and its lids open on 1970, so the
 * wait is the story and never a still that looks stuck.
 *
 * A phone shows the whole eye, turned down (EyeStage `calm`). A visitor there
 * has no cursor to discover the sweep with, so once the eye is open a ghost
 * fingertip shows it (ui/ghost-finger.tsx): it drags the era along and back,
 * then taps the iris. Any touch stops it; it comes back after a long idle.
 *
 * A drag, a swipe and the ghost fingertip all send the eye the unrounded era
 * position (EyeStageControl.travel), so the hand works the eyelid: it closes
 * toward each boundary, the era changes behind it, and it opens past it.
 */

import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ANATOMY } from '@/components/three/eye/anatomy';
import EyePoster from '@/components/three/eye/EyePoster';
import type { EyeStageControl } from '@/components/three/eye/EyeStage';
import { eyeShot } from '@/components/three/eye/framing';
import { getEraMedium } from '@/components/three/eye/look';
import GhostFinger from '@/components/ui/ghost-finger';
import { holdShut, openLids } from '@/components/ui/loader/open-eye';
import TubeOpening from '@/components/ui/loader/TubeOpening';
import { CODEX_THEME, type ThemeConfig } from '@/data/codex-theme';
import { eyeFrame } from '@/lib/era-eye-frame';

/** The old GLSL eye: only if the live eye cannot start. */
const EraEyeCanvas = dynamic(() => import('@/components/three/EraEyeCanvas'), {
  ssr: false,
});
/** The live eye (docs/EYE_TSL_PLAN.md): WebGPU, or WebGL2 where there is none. */
const EyeStage = dynamic(() => import('@/components/three/eye/EyeStage'), {
  ssr: false,
});

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const ERA_PICKER_ATTR = 'data-era-picker-active';
/** The old GLSL eye's height as a share of viewport height; on any landscape
 *  screen it is fit by width instead. The live eye frames itself (framing.ts). */
const EYE_HEIGHT = 1;
/** The room the eye sits in — dark in every era, whatever the era's page is. */
const ROOM = '#f4ecdf';
/** Dead zone at each side of the sweep, so both ends are easy to reach. */
const SWEEP_INSET = 0.08;
/** A press shorter and stiller than this is a tap, not a sweep. */
const TAP_SLOP = 8;
const TAP_MS = 520;
/**
 * A touch drag scrubs by distance, not by where it landed. Mapping ten
 * eras across 375 points of phone would put under forty points between years
 * and hide the one you wanted under your own thumb; a swipe that moves this
 * many points per year can be thrown, repeated and reversed. A swipe across
 * a phone's width moves about seven years, so a casual flick lands near where
 * it was aimed rather than at the far end.
 */
const SWIPE_PITCH_MIN = 44;
const SWIPE_PITCH_MAX = 64;
const SWIPES_PER_WIDTH = 7;
/** Smallest the "go in" target is ever allowed to be, in points. */
const IRIS_TAP_MIN = 56;
/** A finger deserves a wider target than a cursor. */
const IRIS_TAP_COARSE = 1.3;
/**
 * Wheel and trackpad travel. The first real delta of a scroll is one year.
 *
 * Chrome stops delivering wheel events when nothing under the pointer can
 * pan, and only resumes after the pointer moves or the gesture times out.
 * Waiting for later deltas, or holding a lock across the smooth-scroll tail,
 * made a year arrive only after that move or that pause. The first delta
 * steps. A second report of the same detent, a frame later, does not. The
 * next detent does, even while a fading tail is still arriving. A trackpad
 * flick still spends itself on one year; a new shove after it has faded
 * spends the next.
 */
/** One event at least this big is a mouse detent, not a trackpad frame. */
const WHEEL_NOTCH = 50;
/** Anything smaller than this is noise, not a scroll. */
const WHEEL_NOISE = 1;
/** The second report of one detent arrives inside this. */
const WHEEL_ECHO_MS = 80;
/** Events closer than this are one coast. A gap ends it. */
const WHEEL_COAST_MS = 200;

/** The axis the visitor actually moved, and whether this event is a detent. */
function readWheel(e: WheelEvent): { d: number; notch: boolean } {
  const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  // A line or a page is already one detent. Pixel mode has to earn it.
  if (e.deltaMode === 1 || e.deltaMode === 2) {
    return { d: Math.sign(raw), notch: raw !== 0 };
  }
  return { d: raw, notch: Math.abs(raw) >= WHEEL_NOTCH };
}

/**
 * The longest the opening waits for the live eye; after this it fades onto the
 * poster. Generous: the formed tube keeps ticking (its cursor, its clock pulse)
 * and answers the hand and keys, where the poster is a still; a slow GPU's
 * first visit builds the eye's shaders for ~10 s.
 */
const EYE_WAIT_MS = 20000;
/** The eye's held gaze settles this long before its pupil is read for the tube's cursor. */
const PUPIL_SETTLE_MS = 350;
/** The ghost fingertip (phones): this long after the eye opens, again after an idle, and only so often. */
const DEMO_AFTER_MS = 900;
const DEMO_IDLE_MS = 8000;
const DEMO_PLAYS = 3;
/** Going in: the era's own way in plays this long before the room fades, and the home arrives after. */
const ENTER_FADE_DELAY = 0.42;
const ENTER_DONE_MS = 950;

/**
 * The page keeps a scrollbar gutter (`scrollbar-gutter: stable`), and nothing
 * fixed can paint into it, 100vw included: it showed as a dark strip down the
 * right of the eye. While the picker is up the page under it neither scrolls
 * nor needs the gutter, so both go. Returns the undo.
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

/**
 * One corner instruction: a small glyph that acts out the gesture, the verb,
 * then what it does. No box: a feathered pool of dark, frosted at its centre
 * and fading to nothing, sits behind the words, so they read on every era
 * (1970's black, 1991's dither, 2013's dense colour) without looking like a
 * control. The words are the instruction; the eye itself is the button.
 */
function LoaderHint({
  glyph,
  verb,
  action,
  align,
}: {
  glyph: React.ReactNode;
  verb: string;
  action: string;
  align: 'start' | 'end';
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center gap-2 ${align === 'end' ? 'flex-row-reverse' : ''}`}
    >
      <span className="relative" style={{ color: '#1a120e' }}>
        {glyph}
      </span>
      <span
        className="relative font-mono text-[12px] leading-none tracking-[0.03em] sm:text-[13px]"
        style={{ textAlign: align === 'end' ? 'right' : 'left', color: '#1a120e' }}
      >
        <span>{verb}</span>
        <span style={{ color: '#983a22' }}> · </span>
        <span className="tabular-nums" style={{ color: '#983a22' }}>
          {action}
        </span>
      </span>
    </span>
  );
}

/** An eye that blinks each time the era changes: the scroll's real effect. */
function BlinkGlyph({ beat, reduce }: { beat: number; reduce: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      className="block"
    >
      <motion.g
        key={beat}
        style={{ originY: '50%' }}
        initial={false}
        animate={reduce || beat === 0 ? { scaleY: 1 } : { scaleY: [1, 0.06, 1] }}
        transition={{ duration: 0.42, times: [0, 0.3, 1], ease: 'easeInOut' }}
      >
        <path
          d="M1 6 C4 1.4 14 1.4 17 6 C14 10.6 4 10.6 1 6 Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <circle cx="9" cy="6" r="2.4" fill="currentColor" />
      </motion.g>
    </svg>
  );
}

/** A pupil that widens while the pointer is on the iris: the way in, ready. */
function PupilGlyph({ open, reduce }: { open: boolean; reduce: boolean }) {
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
      <motion.circle
        cx="7"
        cy="7"
        fill="currentColor"
        initial={false}
        animate={{ r: open ? 3.6 : 1.9 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.2 }}
      />
    </svg>
  );
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

function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ctx =
        canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl');
      setOk(Boolean(ctx));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

interface ImmersiveEraLoadingPageProps {
  onComplete: () => void;
}

export default function ImmersiveEraLoadingPage({ onComplete }: ImmersiveEraLoadingPageProps) {
  const reduce = useReducedMotion() ?? false;
  const isCoarse = useCoarsePointer();
  const webgl = useWebGL();
  const themes = useMemo(() => [CODEX_THEME], []);
  const last = themes.length - 1;

  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  /** The live eye has faded in over its poster. */
  const [eyeReady, setEyeReady] = useState(false);
  const onEyeReady = useCallback(() => setEyeReady(true), []);
  /** The live eye, unless it fails to start; then the old GLSL eye. */
  const [stage, setStage] = useState<'glsl' | 'tsl'>('tsl');
  /** Ten ways of seeing (docs/LOADER_WORDS_PLAN.md): each era's own screen over the whole frame. */
  const [see, setSee] = useState(true);
  /** Whether the cursor is over the iris, so it can offer itself as a way in. */
  const [overIris, setOverIris] = useState(false);
  const exitTimer = useRef(0);
  /** The live eye: where its iris really is, for the tap that goes in. */
  const eyeControl = useRef<EyeStageControl | null>(null);
  const dragging = useRef(false);
  const wheel = useRef({
    at: 0,
    stepped: -1e9,
    dir: 0,
    /** Abs of the latest delta, so a new shove can stand out from a fading tail. */
    tail: 0,
    /** Largest delta since the last step. */
    peak: 0,
    spent: false,
  });
  /** Where a touch drag started, and which era it started on. */
  const swipe = useRef({ x: 0, from: 0 });
  const surface = useRef<HTMLDivElement | null>(null);
  /** Where and when the press started — a still, short press is a tap. */
  const press = useRef({ x: 0, y: 0, t: 0, moved: false });
  /** Repeated input can outpace a render, so steps come off a ref. */
  const idxRef = useRef(0);

  /** Waited long enough for the eye: the tube fades onto the poster instead. */
  const [eyeLate, setEyeLate] = useState(false);
  /** The eye has been opened (or the tube has gone without it); travel can begin. */
  const [opened, setOpened] = useState(false);
  /** The tube has gone and can unmount. */
  const [introGone, setIntroGone] = useState(false);
  const openedRef = useRef(false);
  /** When the eye opened: Enter and Space wait a moment after, so typing at the tube never goes straight in. */
  const openedAt = useRef(0);
  /** When a letter was last typed (the tube's prompt invites it): Space and Enter wait while someone is mid-word. */
  const typedAt = useRef(0);
  /** The live pupil, once the eye is up and held still: the tube's cursor settles onto the eye's own there. */
  const [pupil, setPupil] = useState<{ x: number; y: number; r: number } | null>(null);
  /** A wheel during the opening moves it on to the formed eye. */
  const [tubeSkip, setTubeSkip] = useState(false);
  /** The tube has begun to hand over: until then it covers the live eye, which draws only now and then under it. */
  const [tubeLanded, setTubeLanded] = useState(false);

  const focused = themes[index] ?? themes[0];

  useEffect(() => {
    idxRef.current = index;
  }, [index]);

  // dev comparisons: ?eye=glsl is the old eye, ?see=0 the live eye without its era's screen
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('eye') === 'glsl') setStage('glsl');
    if (q.get('see') === '0') setSee(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(ERA_PICKER_ATTR, '');
    return () => {
      document.documentElement.removeAttribute(ERA_PICKER_ATTR);
      window.clearTimeout(exitTimer.current);
    };
  }, []);

  // The gutter comes back as the way in begins, while the room is still
  // opaque, so the home's reflow happens out of sight; the strip it leaves
  // is the home's own background, which the room is about to fade to.
  useEffect(() => {
    if (exiting) return;
    return dropPageGutter();
  }, [exiting]);

  /* ---- the opening: the tube forms the eye while it compiles, then the eye opens ---- */

  useEffect(() => {
    const id = window.setTimeout(() => setEyeLate(true), EYE_WAIT_MS);
    return () => window.clearTimeout(id);
  }, []);

  // The live eye is up under the tube: hold it shut, looking straight out, and
  // read its pupil once the held gaze has settled. (The old GLSL eye has no
  // control: the tube just fades onto it.)
  useEffect(() => {
    if (!eyeReady || openedRef.current) return;
    const c = eyeControl.current;
    if (!c) {
      setPupil({ x: -1, y: -1, r: 0 });
      return;
    }
    holdShut(c);
    const id = window.setTimeout(() => {
      const iris = c.irisAt();
      setPupil({ x: iris.x, y: iris.y, r: (iris.r * c.pupilMm()) / 2 / ANATOMY.irisRadius });
    }, PUPIL_SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [eyeReady]);

  const cancelLids = useRef<() => void>(() => {});
  useEffect(() => () => cancelLids.current(), []);

  const onTubeLanding = useCallback(() => setTubeLanded(true), []);

  /** The tube's pixels are becoming the live eye: open the real lids, and travel can begin. */
  const onTubeOpen = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    openedAt.current = performance.now();
    setOpened(true);
    const c = eyeControl.current;
    if (c) cancelLids.current = openLids(c, reduce);
  }, [reduce]);

  /** The tube has gone (handed over, faded on a late eye, or never started). */
  const onTubeGone = useCallback(() => {
    setIntroGone(true);
    if (openedRef.current) return;
    openedRef.current = true;
    openedAt.current = performance.now();
    setOpened(true);
    // a late or failed hand-off: let the eye go, if it is up
    const c = eyeControl.current;
    if (c) {
      c.holdBlink(null);
      c.holdGaze(null);
    }
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(last, Math.max(0, next));
      if (clamped === idxRef.current) return;
      idxRef.current = clamped;
      setIndex(clamped);
    },
    [last],
  );

  const step = useCallback((delta: number) => goTo(idxRef.current + delta), [goTo]);

  const confirmEra = useCallback(
    (theme: ThemeConfig) => {
      if (exiting) return;
      setExiting(true);
      eyeControl.current?.travel(null);
      exitTimer.current = window.setTimeout(() => onComplete(), reduce ? 200 : ENTER_DONE_MS);
    },
    [exiting, onComplete, reduce],
  );

  /** Sweep across the eye: the left edge is 1970, the right edge is 2026 (unrounded, for the eyelid). */
  const posFromX = useCallback(
    (clientX: number) => {
      const w = Math.max(window.visualViewport?.width ?? window.innerWidth, 1);
      const t = (clientX / w - SWEEP_INSET) / (1 - SWEEP_INSET * 2);
      return Math.min(1, Math.max(0, t)) * last;
    },
    [last],
  );
  const indexFromX = useCallback((clientX: number) => Math.round(posFromX(clientX)), [posFromX]);

  /** The hand on the eyelid: the unrounded position goes to the eye, the era it rounds to to the picker. */
  const travelTo = useCallback(
    (pos: number) => {
      const p = Math.min(last, Math.max(0, pos));
      eyeControl.current?.travel(p);
      goTo(Math.round(p));
    },
    [goTo, last],
  );
  const letGo = useCallback(() => eyeControl.current?.travel(null), []);

  /**
   * The iris, in viewport points, from the same framing the eye is drawn with
   * (the live eye's, or the old GLSL eye's), so the target is under the iris
   * at any shape of screen. The live eye's own report is preferred.
   */
  const irisFromFrame = useCallback(() => {
    const vv = window.visualViewport;
    const w = vv?.width ?? window.innerWidth;
    const h = vv?.height ?? window.innerHeight;
    const f = stage === 'tsl' ? eyeShot(w, h) : eyeFrame(w, h, EYE_HEIGHT);
    return { x: f.cx, y: f.cy, r: f.irisPx };
  }, [stage]);

  const overIrisAt = useCallback(
    (clientX: number, clientY: number) => {
      // the live eye knows where its iris is; the shared framing is the fallback
      const iris = eyeControl.current?.irisAt() ?? irisFromFrame();
      const r = Math.max(IRIS_TAP_MIN, iris.r * (isCoarse ? IRIS_TAP_COARSE : 1));
      return Math.hypot(clientX - iris.x, clientY - iris.y) < r;
    },
    [isCoarse, irisFromFrame],
  );

  /** Points of drag that move one year, on a touch screen. */
  const swipePitch = useCallback(() => {
    const w = Math.max(window.innerWidth, 1);
    return Math.min(SWIPE_PITCH_MAX, Math.max(SWIPE_PITCH_MIN, w / SWIPES_PER_WIDTH));
  }, []);

  /* ---- the ghost fingertip (phones): how to travel and go in, shown ---- */

  const demoOn = isCoarse && webgl === true && introGone && !exiting;
  const [demo, setDemo] = useState({ run: false, play: 0, tapOnly: false });
  /** Plays so far, whether the visitor has swiped yet, and the era a play's drag starts from. */
  const demoState = useRef({ plays: 0, swiped: false, timer: 0, from: 0, scrubbing: false });

  const queueDemo = useCallback(
    (ms: number) => {
      const d = demoState.current;
      window.clearTimeout(d.timer);
      if (!demoOn || d.plays >= DEMO_PLAYS) return;
      d.timer = window.setTimeout(() => {
        d.plays += 1;
        d.from = idxRef.current;
        // a visitor who has swiped already knows that part: show only the tap
        setDemo({ run: true, play: d.plays, tapOnly: true });
      }, ms);
    },
    [demoOn],
  );

  /** The visitor did something: the demo stops, and comes back only after a long idle. */
  const stopDemo = useCallback(() => {
    window.clearTimeout(demoState.current.timer);
    // (a demo stopped mid-drag lets go of the eyelid; a visitor's own drag is left alone)
    if (demoState.current.scrubbing) {
      demoState.current.scrubbing = false;
      eyeControl.current?.travel(null);
    }
    setDemo((d) => (d.run ? { ...d, run: false } : d));
  }, []);

  useEffect(() => {
    const d = demoState.current;
    if (!demoOn) {
      stopDemo();
      return;
    }
    if (d.plays === 0) queueDemo(DEMO_AFTER_MS);
    return () => window.clearTimeout(d.timer);
  }, [demoOn, queueDemo, stopDemo]);

  const onDemoScrub = useCallback(
    (eras: number | null) => {
      const d = demoState.current;
      if (eras === null) {
        if (d.scrubbing) letGo();
        d.scrubbing = false;
        return;
      }
      d.scrubbing = true;
      travelTo(d.from + eras);
    },
    [letGo, travelTo],
  );
  const onDemoDone = useCallback(() => {
    setDemo((d) => ({ ...d, run: false }));
    queueDemo(DEMO_IDLE_MS);
  }, [queueDemo]);
  const demoEye = useCallback(
    () => eyeControl.current?.eyeCentre() ?? irisFromFrame(),
    [irisFromFrame],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (exiting) return;
      stopDemo();
      // Capture is a nicety, not a requirement — never let it drop the sweep.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* no active pointer with this id */
      }
      // Travel does not begin on the press: a press that never moves is a tap,
      // and a tap on the iris means "take me in", not "take me to this year".
      dragging.current = false;
      press.current = {
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        moved: false,
      };
      swipe.current = { x: e.clientX, from: idxRef.current };
    },
    [exiting, stopDemo],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (exiting) return;
      if (e.pointerType === 'mouse' && !dragging.current) {
        setOverIris(overIrisAt(e.clientX, e.clientY));
      }
      if (!press.current.t) return;
      if (!dragging.current) {
        const far = Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > TAP_SLOP;
        if (!far) return;
        dragging.current = true;
        press.current.moved = true;
      }
    },
    [exiting, overIrisAt],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* already released */
      }
      const p = press.current;
      const wasTap = p.t > 0 && !p.moved && performance.now() - p.t < TAP_MS && !exiting;
      if (dragging.current) letGo();
      dragging.current = false;
      press.current = { x: 0, y: 0, t: 0, moved: false };
      queueDemo(DEMO_IDLE_MS);
      if (!wasTap) return;
      // Tap the eye to go in. A click off the eye lands on the year under the
      // cursor; a tap off it does nothing, because on a phone half the taps
      // that miss the iris are a thumb finding the screen, not a request to
      // jump sixty years.
      if (overIrisAt(e.clientX, e.clientY)) confirmEra(themes[0]);
    },
    [confirmEra, exiting, letGo, overIrisAt, queueDemo, themes],
  );

  const cancelDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* already released */
      }
      if (dragging.current) letGo();
      dragging.current = false;
      press.current = { x: 0, y: 0, t: 0, moved: false };
      queueDemo(DEMO_IDLE_MS);
    },
    [letGo, queueDemo],
  );

  /**
   * The picker owns the whole screen, so it owns the whole keyboard. Bound to
   * the window rather than to the slider, because nobody tabs to a full-screen
   * dialog before pressing an arrow key — they press the arrow key.
   */
  useEffect(() => {
    if (exiting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // until the eye is open, keys are the tube's (its prompt; Enter goes on)
      if (!openedRef.current) return;
      stopDemo();
      queueDemo(DEMO_IDLE_MS);
      if (e.key.length === 1 && e.key !== ' ') typedAt.current = performance.now();
      const el = e.target as HTMLElement | null;
      // never eat a key someone is typing into something
      if (el?.isContentEditable) return;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (
          performance.now() - openedAt.current < 900 ||
          performance.now() - typedAt.current < 1500
        )
          return;
        confirmEra(themes[0]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmEra, exiting, goTo, last, queueDemo, step, stopDemo, themes]);

  // Focus the control on mount, so a screen reader announces the year it is on
  // and the focus ring has somewhere to land.
  useEffect(() => {
    surface.current?.focus({ preventScroll: true });
  }, []);

  /**
   * Wheel and trackpad travel. Capture, and not passive: Chrome only keeps
   * sending a stationary wheel when the first event is cancelled on the way
   * down. One scroll is one year.
   */
  useEffect(() => {
    if (exiting) return;
    const onWheel = (e: WheelEvent) => {
      const { d } = readWheel(e);
      if (Math.abs(d) < WHEEL_NOISE) return;
      e.preventDefault();
      if (surface.current) surface.current.scrollTop = 0;
      if (!openedRef.current) setTubeSkip(true);
    };
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, [exiting, queueDemo, step, stopDemo]);

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[200] flex h-dvh w-full flex-col overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{
        duration: reduce ? 0.18 : 0.55,
        delay: exiting && !reduce ? ENTER_FADE_DELAY : 0,
        ease: EASE_OUT,
      }}
      style={{
        background: ROOM,
        touchAction: isCoarse ? 'none' : 'pan-y',
        overscrollBehavior: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Enter kiruk"
      aria-describedby="era-intro-words"
    >
      <p id="era-intro-words" className="sr-only">
        A pen draws an eye on paper, then the eye opens. Press Enter, or tap the iris, to go in.
      </p>

      {/* --- the eye ------------------------------------------------------- */}
      {/* The tube covers the eye while it compiles; the still of the eye is only
          the fallback when the eye is late or the tube has gone without it, so
          it is not fetched on the first frame. */}
      <div className="pointer-events-none absolute inset-0">
        {(eyeLate || introGone) && <EyePoster eraId={focused.id} hidden={eyeReady} />}
        {webgl === true && (
          <div
            className="absolute inset-0"
            style={{
              opacity: eyeReady ? 1 : 0,
              // under the tube there is nothing to fade from
              transition:
                reduce || !opened ? 'none' : 'opacity 450ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {stage === 'tsl' ? (
              <EyeStage
                era={focused}
                exiting={exiting}
                reduce={reduce}
                interactive
                control={eyeControl}
                media={see}
                calm={isCoarse}
                covered={!introGone && !tubeLanded}
                onReady={onEyeReady}
                onFail={() => setStage('glsl')}
              />
            ) : (
              <EraEyeCanvas
                era={focused}
                eyeHeight={EYE_HEIGHT}
                exiting={exiting}
                reduce={reduce}
                interactive
                onReady={onEyeReady}
              />
            )}
          </div>
        )}
      </div>

      {/* --- the eye is the control: sweep across it to travel ------------- */}
      <div
        role="slider"
        tabIndex={exiting ? -1 : 0}
        aria-label="Enter kiruk"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={focused.name}
        className="absolute inset-0 z-10 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
        // over the iris, the era's own "this opens" (a Star arrow, a hand, a
        // text caret); inline, because the picker's global rule sets every
        // other cursor to the plain arrow.
        // A finger still can't pan the page. A mouse wheel can: Chrome drops
        // a stationary wheel when the target has touch-action none and nothing
        // to scroll, and only sends it again after the pointer moves or a pause.
        // The extra pixel is never shown; the handler takes the wheel for the year.
        style={{
          cursor: !exiting && overIris ? getEraMedium(focused.id).cssCursor : 'default',
          touchAction: isCoarse ? 'none' : 'pan-y',
          overflowY: isCoarse ? 'hidden' : 'scroll',
          scrollbarWidth: 'none',
          overscrollBehavior: 'none',
        }}
        ref={surface}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      >
        {isCoarse ? null : <div aria-hidden className="h-[calc(100%+1px)] w-px" />}
      </div>

      {/* --- the opening: the tube forms the eye while it gets ready ------- */}
      {!introGone && (
        <TubeOpening
          ready={eyeReady && pupil !== null}
          pupil={pupil && pupil.r > 0 ? pupil : null}
          late={eyeLate && !eyeReady}
          skip={tubeSkip}
          reduce={reduce}
          onLanding={onTubeLanding}
          onOpen={onTubeOpen}
          onGone={onTubeGone}
        />
      )}

      {/* --- the only words on the loader: how to travel, and how to go in ---
          One line in each bottom corner, once the eye has opened. Left: an
          eye glyph that blinks with every era change, as the real eye does.
          Right: a pupil that widens while the pointer is on the iris, and the
          era a click would enter, so a scroll visibly changes something. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 px-4 sm:px-6"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          opacity: opened && !exiting ? 1 : 0,
          transform: opened && !exiting ? 'none' : 'translateY(4px)',
          transition: reduce
            ? 'none'
            : `opacity 500ms ease-out ${opened && !exiting ? 900 : 0}ms, transform 500ms cubic-bezier(0.23, 1, 0.32, 1) ${opened && !exiting ? 900 : 0}ms`,
        }}
      >
        <span />
        <LoaderHint
          align="end"
          glyph={<PupilGlyph open={overIris} reduce={reduce} />}
          verb={isCoarse ? 'Tap the eye' : 'Click the eye'}
          action="enter"
        />
      </div>

      {/* --- phones: a fingertip shows the sweep and the tap, then leaves ---- */}
      {isCoarse && webgl === true && (
        <GhostFinger
          run={demo.run}
          play={demo.play}
          tapOnly={demo.tapOnly}
          reduce={reduce}
          eye={demoEye}
          pitch={swipePitch()}
          onScrub={onDemoScrub}
          onDone={onDemoDone}
        />
      )}

      {webgl === false && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center px-8 text-center"
          style={{ color: '#ffffff' }}
        >
          <p className="max-w-xs text-xs leading-relaxed opacity-45">
            The eye needs WebGL. Sweep left or right anyway, then press Enter.
          </p>
        </div>
      )}
    </motion.div>
  );
}
