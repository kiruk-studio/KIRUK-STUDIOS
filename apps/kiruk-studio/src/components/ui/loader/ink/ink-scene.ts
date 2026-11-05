/**
 * The ink opening: a hand draws the eye, then the eye wakes.
 *
 *   draw   the burin eye (@kiruk/burin/hand), laid stroke by stroke in the plate's
 *          order: I construction in chalk, II contour, III hatching, IV cross-hatching
 *          and hair, V the pupil inked round the kiruk star. About five and a half
 *          seconds; a press or a key hurries the hand.
 *   rest   the pen lifts; the ink finishes drying
 *   wake   the loading animation: the drawing closes its lids and opens them the way
 *          a waking eye does (they lift, catch, then open the rest of the way)
 *   live   it is alive: the globe follows the pointer, rests in small saccades, blinks
 *   enter  it opens if it was mid-blink, and holds still for the way in
 *
 * Four canvases, bottom to top: the chalk construction (faded by the page as the ink
 * comes), the skin (never moves), the eye (globe and upper lid, recomposed when they
 * move), and the wet ink. Runs in a worker on OffscreenCanvas (ink.worker.ts), or on
 * the main thread where there is none: it touches no DOM.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md
 */
import {
  type Ctx2D,
  createEyeMotion,
  type EyeDrawing,
  type EyeMotion,
  eyeDrawing,
  type InkColors,
  InkHand,
  LiveEye,
  type Pose,
  REST,
} from '@kiruk/burin/hand';
import type { InkFrame } from './frame';

export type InkLayerName = 'cons' | 'skin' | 'eye' | 'wet';
export type InkCanvases = Record<InkLayerName, OffscreenCanvas | HTMLCanvasElement>;

export type InkEvent =
  /** the first stroke is on the paper: the boot sheet can go */
  | { type: 'started' }
  /** the hand is on pass 1 … 5; 6 once it has lifted the pen */
  | { type: 'pass'; pass: number }
  /** the drawing is finished */
  | { type: 'drawn' }
  /** the eye has woken: it can be entered */
  | { type: 'awake' }
  /** where the iris is now, page CSS px */
  | { type: 'iris'; x: number; y: number; r: number };

export interface InkSceneOpts {
  reduce: boolean;
  /** time scale (a lab can slow the hand down) */
  speed: number;
  colors: InkColors;
  emit: (e: InkEvent) => void;
}

export interface InkScene {
  frame(nowMs: number): void;
  resize(f: InkFrame): void;
  /** the pointer, page CSS px */
  pointer(x: number, y: number): void;
  leave(): void;
  /** hurry the hand: the rest of the drawing in a moment */
  skip(): void;
  /** the way in has begun */
  enter(): void;
}

/** The loader's hand is a little quicker than the plate's own timeline (about five seconds). */
const PACE = 1.12;
/** The pen lifts and the last ink dries, then the eye wakes, s. */
const REST_S = 0.2;
/** A press hurries the hand this many times over. */
const HURRY = 9;
/** The wake: the lids fall, hold, then open like a waking eye, s. */
const WAKE = { close: 0.16, hold: 0.08, open: 1.15 } as const;
const WAKE_S = WAKE.close + WAKE.hold + WAKE.open;

/** How shut waking lids are (1 shut, 0 open), t from 0 to 1 (loader/open-eye.ts). */
function lidsAt(t: number) {
  const out = (x: number) => 1 - (1 - x) ** 3;
  const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
  if (t <= 0) return 1;
  if (t < 0.32) return 1 - 0.55 * out(t / 0.32);
  if (t < 0.44) return 0.45 - 0.03 * ((t - 0.32) / 0.12);
  if (t < 1) return 0.42 * (1 - inOut((t - 0.44) / 0.56));
  return 0;
}

/** The lids' aperture through the wake, 1 open … 0 shut. */
function wakeOpen(t: number) {
  if (t < WAKE.close) {
    const u = t / WAKE.close;
    return 1 - u * u * (3 - 2 * u);
  }
  if (t < WAKE.close + WAKE.hold) return 0;
  return 1 - lidsAt((t - WAKE.close - WAKE.hold) / WAKE.open);
}

const ctxOf = (c: OffscreenCanvas | HTMLCanvasElement) => c.getContext('2d') as Ctx2D | null;

/** Returns null where a 2D canvas is not to be had (the page then shows the eye as a still). */
export function createInkScene(
  canvases: InkCanvases,
  frame0: InkFrame,
  o: InkSceneOpts,
): InkScene | null {
  const g = {
    cons: ctxOf(canvases.cons),
    skin: ctxOf(canvases.skin),
    eye: ctxOf(canvases.eye),
    wet: ctxOf(canvases.wet),
  };
  if (!g.cons || !g.skin || !g.eye || !g.wet) return null;
  const L = { cons: g.cons, skin: g.skin, eye: g.eye, wet: g.wet };

  type Phase = 'draw' | 'rest' | 'wake' | 'live' | 'enter';
  let f = frame0;
  let d!: EyeDrawing;
  let hand!: InkHand;
  let live: LiveEye | null = null;
  let motion: EyeMotion | null = null;
  let phase: Phase = 'draw';
  let clock = 0;
  let speed = o.speed;
  let last = -1;
  let now = 0;
  let phaseAt = 0;
  let pass = 0;
  let started = false;
  let pointerAt: [number, number] | null = null;
  let pose: Pose = { ...REST };
  let irisKey = '';

  /** Size the canvases to the frame and give every layer the eye's transform. */
  const size = () => {
    const pw = Math.max(1, Math.round(f.cw * f.dpr));
    const ph = Math.max(1, Math.round(f.ch * f.dpr));
    for (const k of ['cons', 'skin', 'eye', 'wet'] as const) {
      const c = canvases[k];
      // setting the size clears the canvas and its state, the transform included
      c.width = pw;
      c.height = ph;
      L[k].setTransform(f.dpr, 0, 0, f.dpr, (f.cx - f.x) * f.dpr, (f.cy - f.y) * f.dpr);
      L[k].lineJoin = 'round';
    }
  };

  const build = () => {
    size();
    d = eyeDrawing({ S: f.S });
    hand = new InkHand(d, L, o.colors);
  };

  const emitIris = () => {
    if (!live) return;
    const ir = live.irisAt(pose);
    const x = f.cx + ir.x;
    const y = f.cy + ir.y;
    const key = `${Math.round(x)},${Math.round(y)},${Math.round(ir.r)}`;
    if (key === irisKey) return;
    irisKey = key;
    o.emit({ type: 'iris', x, y, r: ir.r });
  };

  const setPass = (p: number) => {
    if (p === pass) return;
    pass = p;
    o.emit({ type: 'pass', pass: p });
  };

  /** The drawing is done: the live eye takes it over, open, looking straight out. */
  const goLive = () => {
    live = new LiveEye(d, L.eye, o.colors);
    live.render(pose);
    emitIris();
  };

  const toPhase = (p: Phase) => {
    phase = p;
    phaseAt = now;
  };

  build();
  if (o.reduce) {
    // Under reduced motion the drawing is simply there, and it stays still.
    hand.finish();
    setPass(6);
    goLive();
    toPhase('live');
  }

  return {
    frame(nowMs) {
      const t = nowMs / 1000;
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, t - last));
      last = t;
      now += dt;
      if (!started) {
        started = true;
        o.emit({ type: 'started' });
        if (o.reduce) {
          o.emit({ type: 'drawn' });
          o.emit({ type: 'awake' });
        }
      }
      switch (phase) {
        case 'draw': {
          clock += dt * speed * PACE;
          hand.drawTo(clock, true);
          setPass(hand.pass);
          if (hand.done) {
            o.emit({ type: 'drawn' });
            toPhase('rest');
          }
          break;
        }
        case 'rest':
          if (now - phaseAt >= REST_S / Math.min(speed, 3)) {
            goLive();
            toPhase('wake');
          }
          break;
        case 'wake': {
          const u = now - phaseAt;
          pose = { ...REST, open: wakeOpen(u) };
          live?.render(pose);
          if (u >= WAKE_S) {
            pose = { ...REST };
            live?.render(pose);
            motion = createEyeMotion({ reduced: o.reduce });
            if (pointerAt) motion.pointer(...pointerAt);
            toPhase('live');
            o.emit({ type: 'awake' });
          }
          break;
        }
        case 'live': {
          if (!motion || !live) break;
          const m = motion.step(dt);
          pose = m.pose;
          if (live.render(pose)) emitIris();
          break;
        }
        case 'enter':
          // The drawing holds still while it settles onto the plate: nothing more is drawn.
          break;
      }
    },
    resize(next) {
      f = next;
      build();
      if (phase === 'draw') {
        // Catch the new sheet up to where the hand had got to, dry.
        hand.drawTo(clock, false);
      } else {
        hand.finish();
        goLive();
      }
    },
    pointer(x, y) {
      pointerAt = [(x - f.cx) / f.S, (y - f.cy) / f.S];
      if (phase === 'live') motion?.pointer(...pointerAt);
    },
    leave() {
      pointerAt = null;
      motion?.leave();
    },
    skip() {
      if (phase === 'draw' || phase === 'rest') speed = Math.max(speed, HURRY);
    },
    enter() {
      if (phase === 'draw' || phase === 'rest') {
        hand.finish();
        setPass(6);
        goLive();
      }
      // Open, if it was caught mid-blink, then hold still for the way in.
      if (live && pose.open < 1) {
        pose = { ...pose, open: 1 };
        live.render(pose);
      }
      toPhase('enter');
    },
  };
}
