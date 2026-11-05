/**
 * How each era lights and records its eye. Extends the live eye's EraVisual
 * (the screen in the cornea) with the light, the lens and the one behaviour
 * that era owns. P0 only fixes the shape; P9–P11 fill it in from
 * docs/EYE_TSL_PLAN.md §7.
 */

import { Color } from 'three/webgpu';
import type { ThemeConfig } from '@/data/codex-theme';
import { type EraVisual, getEraVisual } from '@/lib/era-visuals';

/* ---- the era's palette, as the screen and the room use it -------------- */

function clampHex(h: string | undefined, fallback: string): string {
  if (!h) return fallback;
  if (h[0] !== '#') return h;
  let s = h.slice(1);
  if (s.length === 3)
    s = s
      .split('')
      .map((c) => c + c)
      .join('');
  return '#' + s.slice(0, 6);
}

/** Page ground, body text, primary panels, accent highlights, secondary chrome. */
export interface EraPalette {
  bg: string;
  ink: string;
  panel: string;
  accent: string;
  bar: string;
}

export function eraPalette(era: ThemeConfig): EraPalette {
  return {
    bg: clampHex(era.colors.background, '#050505'),
    ink: clampHex(era.colors.text, '#f5f5f5'),
    panel: clampHex(era.colors.primary, '#2438e0'),
    accent: clampHex(era.colors.accent || era.colors.secondary, '#b21e8f'),
    bar: clampHex(era.colors.secondary || era.colors.accent, '#e11d74'),
  };
}

export type PaletteColors = Record<keyof EraPalette, Color>;

/** Parsed once per era: five hex parses a frame was the live eye's garbage. */
export function paletteColors(pal: EraPalette): PaletteColors {
  return {
    bg: new Color(pal.bg),
    ink: new Color(pal.ink),
    panel: new Color(pal.panel),
    accent: new Color(pal.accent),
    bar: new Color(pal.bar),
  };
}

function lumOfHex(hex: string): number {
  const h = clampHex(hex, '#808080').slice(1);
  return (
    (0.299 * parseInt(h.slice(0, 2), 16) +
      0.587 * parseInt(h.slice(2, 4), 16) +
      0.114 * parseInt(h.slice(4, 6), 16)) /
    255
  );
}

/** How much light this era's screen throws — a white page blinds, a terminal does not. */
export function screenLuminance(pal: EraPalette): number {
  return Math.min(
    1,
    lumOfHex(pal.bg) * 0.7 + lumOfHex(pal.panel) * 0.2 + lumOfHex(pal.accent) * 0.2,
  );
}

export type GazePattern =
  | 'idle'
  | 'read'
  | 'scatter'
  | 'two-target'
  | 'lock'
  | 'scroll'
  | 'contact';
export const GAZE_PATTERNS: GazePattern[] = [
  'idle',
  'read',
  'scatter',
  'two-target',
  'lock',
  'scroll',
  'contact',
];

/**
 * How an era's person looks about (rig/gaze.ts), in gaze units: x ±1 is
 * ±24° of yaw, y ±1 is ±10° of pitch (further down is allowed, as on a phone).
 */
export interface GazeParams {
  /** Where the eye rests, and where scripts are centred. */
  rest: [number, number];
  /** How far free viewing roams from rest, each way. */
  spread: [number, number];
  /** Mean fixation, ms. */
  fixMs: number;
  /** Mean saccade, degrees, in free viewing. */
  ampMean: number;
  /** Microsaccades per second while fixating. */
  microRate: number;
  /** two-target: the two places, and the mean dwell at each, seconds. */
  a: [number, number];
  b: [number, number];
  dwellA: number;
  dwellB: number;
  /** read: lines on the page, line width and spacing (gaze units). */
  lines: number;
  width: number;
  lineStep: number;
  /** scroll: how fast the content carries the eye up, degrees per second. */
  scrollSpeed: number;
  /** How faithfully the eye follows the pointer (2026 follows best), and its pursuit gain. */
  follow: number;
  pursuitGain: number;
  /** How far the pointer may get ahead before a catch-up saccade, degrees. */
  catchUp: number;
  /** Mean seconds between blinks: reading and staring blink less, scanning more. */
  blinkEvery: number;
}
export type CorneaCursor = 'block' | 'arrow' | 'hand' | 'caret' | 'thumb' | 'none';

/** Index into the screen pass's cursor shapes (nodes/screen.ts). */
export const CURSOR_KIND: Record<CorneaCursor, number> = {
  none: 0,
  arrow: 1,
  block: 2,
  caret: 3,
  hand: 4,
  thumb: 5,
};

/**
 * The visitor's own pointer, as it shows on the screen the eye is looking at
 * and so in its cornea (docs/EYE_TSL_PLAN.md §7). A touch screen has no
 * cursor, only the thumb over the glass; 2026 has no screen at all.
 */
const ERA_CURSOR: Record<string, CorneaCursor> = {
  '1970': 'block',
  '1981': 'arrow',
  '1991': 'arrow',
  '1995': 'hand',
  '1997': 'arrow',
  '2000': 'caret',
  '2003': 'hand',
  '2009': 'thumb',
  '2013': 'thumb',
  '2026': 'none',
};

/**
 * The screen as the eye sees it: a lit rectangle in front of the face.
 *
 * `key` is the direction its light comes from, for shading. The mirror
 * image comes from the rectangle itself (`pos` its centre, `normal` facing
 * the eye, `size` its width and height, all mm, eye at the origin, +z toward
 * the camera). It is far bigger and closer than a real monitor on purpose: a
 * cornea is a 7.8 mm convex mirror, and only a screen that fills most of the
 * view leaves a page in it that can still be read. These numbers are the
 * live eye's, measured off its shader (SCREEN_C / SCREEN_H / SCREEN_D).
 */
export interface ScreenLight {
  device: 'crt' | 'crt-mono' | 'lcd' | 'phone' | 'window' | 'none';
  key: [number, number, number];
  pos: [number, number, number];
  normal: [number, number, number];
  size: [number, number];
  /** A second light in the room, if the era has one. */
  fill?: FillLight;
}

/**
 * A second light in the era's room: office fluorescents overhead, a desk
 * lamp to the side. It lights the face from its own direction and shows in
 * the cornea as its own small reflection (a rectangle, or a disc when
 * `round` is 1), facing the eye from `pos` (mm).
 */
export interface FillLight {
  dir: [number, number, number];
  color: string;
  strength: number;
  pos: [number, number, number];
  size: [number, number];
  round: number;
}

const LIVE_SCREEN: ScreenLight = {
  device: 'lcd',
  key: [-0.42, 0.48, 0.77],
  pos: [-84, 99, 300],
  normal: [0, 0, -1],
  size: [1914, 1164],
};

/**
 * Each era's screen as a light (docs/EYE_TSL_PLAN.md §7, "Light"). The
 * rectangles are larger than life on purpose, as the live eye's are, so the
 * page stays legible in the cornea.
 */
const ERA_LIGHT: Record<string, ScreenLight> = {
  // a P1 green-phosphor terminal, curved and 4:3, a little below the eyes; nothing else lit
  '1970': {
    device: 'crt-mono',
    key: [0.04, -0.24, 0.97],
    pos: [-10, -70, 300],
    normal: [0, 0, -1],
    size: [1520, 1140],
  },
  // a paper-white CRT up and to the left, office fluorescents overhead
  '1981': {
    device: 'crt',
    key: [-0.4, 0.45, 0.8],
    pos: [-84, 99, 300],
    normal: [0, 0, -1],
    size: [1700, 1280],
    fill: {
      dir: [0.05, 0.92, 0.38],
      color: '#e9f1ff',
      strength: 0.32,
      pos: [40, 560, 420],
      size: [1100, 70],
      round: 0.15,
    },
  },
  // a greyscale workstation in a black bezel, a warm desk lamp low to the left
  '1991': {
    device: 'crt',
    key: [-0.12, 0.28, 0.95],
    pos: [-20, 60, 300],
    normal: [0, 0, -1],
    size: [1560, 1170],
    fill: {
      dir: [-0.78, 0.12, 0.62],
      color: '#ffc985',
      strength: 0.38,
      pos: [-430, 40, 250],
      size: [150, 150],
      round: 1,
    },
  },
  // a beige 14" CRT at home at night, centred and a little low: the page's
  // navy and neon are the only light in the room
  '1995': {
    device: 'crt',
    key: [0.05, -0.12, 0.99],
    pos: [0, -40, 300],
    normal: [0, 0, -1],
    size: [1480, 1110],
  },
  // a selfie: an iPhone 5s held a little high at arm's length, its bright
  // screen above the eyes and a white tabletop throwing light up from below
  '2013': {
    device: 'phone',
    key: [0, 0.3, 0.95],
    pos: [0, 110, 290],
    normal: [0, 0, -1],
    size: [1000, 1640],
    fill: {
      dir: [0, -0.7, 0.7],
      color: '#ffffff',
      strength: 0.35,
      pos: [0, -500, 320],
      size: [1600, 500],
      round: 0.3,
    },
  },
  // no screen: the interface is the eye, and it is daylight; a window to the
  // left, the page itself still in the cornea
  '2026': {
    device: 'window',
    key: [0, 0.1, 0.99],
    pos: [0, 40, 320],
    normal: [0, 0, -1],
    size: [2200, 1400],
    fill: {
      dir: [-0.7, 0.35, 0.6],
      color: '#f5f3ee',
      strength: 0.35,
      pos: [-600, 200, 300],
      size: [500, 700],
      round: 0.05,
    },
  },
};

/**
 * How each era's picture leaves, arrives and lets you in (post/era-medium.ts,
 * post/medium-director.ts). A cut between eras is the person's blink: the
 * outgoing era departs as the lids close (`departMs`), the incoming one
 * arrives as they open (`arriveMs`), and its sign comes last. `enterMs` is
 * how long its way in plays when the iris is tapped, ending on `flood`.
 * `cssCursor` is the loader's cursor over the iris: the era's own way of
 * saying "this opens".
 */
export interface EraMedium {
  departMs: number;
  arriveMs: number;
  enterMs: number;
  flood: string;
  cssCursor: string;
}

/** The Xerox Star's arrow, 16×16: solid ink with a paper halo, hotspot at the tip. */
const STAR_ARROW =
  'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEUAAADx7+gUExJtmyHTAAAAAXRSTlMAQObYZgAAADtJREFUeNodyjERwDAMwEAtIVE0hmAQXmI0WcIgS4uypyw/6EQApJRMaWMvOfLKF9A7YdrKMSUe78uAH8OEC1JcYgpZAAAAAElFTkSuQmCC") 0 0, default';

const ERA_MEDIUM: Record<string, EraMedium> = {
  // the raster collapses to a line, then a dot; it warms up from dark
  '1970': { departMs: 200, arriveMs: 420, enterMs: 400, flood: '#000000', cssCursor: 'default' },
  // one field clears the bitmap; two interlaced fields paint it
  '1981': { departMs: 130, arriveMs: 300, enterMs: 300, flood: '#f1efe8', cssCursor: STAR_ARROW },
  // four greys drop to two; the refresh sweeps a still into detail
  '1991': { departMs: 120, arriveMs: 440, enterMs: 360, flood: '#ffffff', cssCursor: 'default' },
  // 216 colours drop to 27; the interlaced GIF's four passes fill down
  '1995': { departMs: 120, arriveMs: 360, enterMs: 380, flood: '#000033', cssCursor: 'pointer' },
  '1997': { departMs: 130, arriveMs: 330, enterMs: 400, flood: '#6e1f2f', cssCursor: 'default' },
  '2000': { departMs: 100, arriveMs: 600, enterMs: 300, flood: '#ffffff', cssCursor: 'text' },
  '2003': { departMs: 120, arriveMs: 500, enterMs: 380, flood: '#6a98cb', cssCursor: 'pointer' },
  '2009': { departMs: 120, arriveMs: 380, enterMs: 380, flood: '#2b1d12', cssCursor: 'pointer' },
  '2013': { departMs: 130, arriveMs: 420, enterMs: 420, flood: '#efeff4', cssCursor: 'default' },
  '2026': { departMs: 130, arriveMs: 640, enterMs: 400, flood: '#fafafa', cssCursor: 'default' },
};

export function getEraMedium(eraId: string): EraMedium {
  const id = eraId === 'codex' ? '1981' : eraId;
  const medium = ERA_MEDIUM[id] ?? {
    departMs: 120,
    arriveMs: 360,
    enterMs: 380,
    flood: '#000000',
    cssCursor: 'default',
  };
  if (eraId === 'codex') return { ...medium, flood: '#f4ecdf', cssCursor: 'default' };
  return medium;
}

/** The era's one capture artefact (post/era-lens.ts draws each). */
export type LensArtefact =
  | 'none'
  | 'film'
  | 'comet'
  | 'webcam'
  | 'interlace'
  | 'ccd'
  | 'flash'
  | 'flare';
export const LENS_ARTEFACTS: LensArtefact[] = [
  'none',
  'film',
  'comet',
  'webcam',
  'interlace',
  'ccd',
  'flash',
  'flare',
];

/**
 * How the era recorded faces (post/era-lens.ts). Amounts are 0..1 unless
 * noted; a clean photograph is grain 0, halation 0, chroma 0, lift 0,
 * gamma 1, gain 1, sat 1, wb 0, split 0, sharpen 0, artefact "none".
 */
export interface EraLens {
  grain: number;
  /** Grain size in device pixels. */
  grainSize: number;
  /** Red glow around the brightest things (film's red layer, a tube's bloom). */
  halation: number;
  /** Lateral colour fringing toward the frame's edge. */
  chroma: number;
  vignette: number;
  lift: number;
  gamma: number;
  gain: number;
  sat: number;
  /** White balance: −1 cool … +1 warm. */
  wb: number;
  /** Warm highlights against cool shadows (a slide film's split). */
  split: number;
  /** −1 soft … +1 over-sharpened, with the halos. */
  sharpen: number;
  artefact: LensArtefact;
  /** How strongly the artefact shows. */
  amount: number;
  /** Depth of field, × the macro default (0 is everything sharp). */
  aperture: number;
  /** Bloom on what emits (the reflection), × default. */
  bloom: number;
  /**
   * Keep the colour of what emits (the reflection) while `sat` takes the rest:
   * at 1 the reflected page is the only colour in the frame (1970).
   */
  isolate: number;
  /** The monochrome leans green, as a phosphor screen does (1970). 0 is neutral grey. */
  phosphor: number;
}

export interface EraLook extends EraVisual {
  light: ScreenLight;
  restGaze: [number, number];
  gazePattern: GazePattern;
  gaze: GazeParams;
  /** The least the lids squint here, whatever the glare (1981's signature). */
  squintRest: number;
  /** The page scrolls only as the eye finishes reading it (1991's signature). */
  stepScroll: boolean;
  lens: EraLens;
  cursor: CorneaCursor;
  signature: string;
}

export const CLEAN_LENS: EraLens = {
  // every photograph has some grain, the dark room behind the face included
  grain: 0.04,
  grainSize: 1.4,
  halation: 0,
  chroma: 0,
  vignette: 0.3,
  lift: 0,
  gamma: 1,
  gain: 1,
  sat: 1,
  wb: 0,
  split: 0,
  sharpen: 0,
  artefact: 'none',
  amount: 0,
  aperture: 1,
  bloom: 1,
  isolate: 0,
  phosphor: 0,
};

/**
 * Each era's camera (docs/EYE_TSL_PLAN.md §7, "Lens"): one strong cue each,
 * the rest kept quiet. A first pass; P11 tunes them era by era.
 */
const ERA_LENS: Record<string, Partial<EraLens>> = {
  // 16 mm film: heavy grain, red halation round the phosphor, a little gate
  // weave; black and white but for the green rows in the cornea
  '1970': {
    grain: 0.075,
    grainSize: 1.9,
    halation: 0.65,
    vignette: 0.5,
    sat: 0.04,
    isolate: 1,
    phosphor: 1,
    lift: 0.015,
    artefact: 'film',
    amount: 1,
    bloom: 1.4,
  },
  // a broadcast tube camera: soft, a little bloom, highlights smearing into a
  // comet tail on moves (no grain: the medium's dither is the grain)
  '1981': {
    grain: 0,
    halation: 0.22,
    sharpen: -0.5,
    wb: -0.1,
    artefact: 'comet',
    amount: 1,
    bloom: 1.35,
  },
  // 35 mm slide film, editorial: clean and fine, a warm and cool split, a touch of contrast
  '1991': { grain: 0, grainSize: 1.2, split: 0.6, sat: 1.1, gamma: 0.96, wb: 0.08 },
  // a little smeared colour; the medium's web-safe cells are the low-res
  // picture (a webcam's blocks and exposure pumping under them only beat)
  '1995': { grain: 0, chroma: 0.35, sat: 1 },
  // a CCD camcorder: interlace combing on fast moves, sharpening halos, a
  // little cool; opened up, since its 16-bit bands crushed it to near black
  '1997': {
    grain: 0,
    wb: -0.12,
    gain: 1.15,
    gamma: 0.92,
    sharpen: 0.35,
    artefact: 'interlace',
    amount: 0.6,
  },
  // a cold laptop panel at night: a little lateral colour, cool white (the
  // CCD's smear and shadow blocks went with the box that used to crop them:
  // full frame, they read as ghosts)
  '2000': { grain: 0.03, chroma: 0.35, wb: -0.3 },
  // a compact with an on-camera flash: flat front light, a hard catchlight
  '2003': { grain: 0.04, vignette: 0.15, lift: 0.02, artefact: 'flash', amount: 1 },
  // an early 3 MP phone: soft, warm, noisy shadows, lens flare
  // (the flare's ghosts at half: full frame, at full strength they read as rings on the brow)
  '2009': {
    grain: 0.07,
    grainSize: 1.4,
    wb: 0.45,
    sharpen: -0.35,
    artefact: 'flare',
    amount: 0.45,
  },
  // the filter era: lifted blacks, a warm fade, a vignette
  // bright and clean (the medium's frosted glass does the softening)
  '2013': { grain: 0.02, lift: 0.03, wb: 0.1, sat: 0.95, vignette: 0, gain: 1 },
  // computational: clean, a little too sharp, monochrome
  '2026': { grain: 0, sharpen: 0.4, sat: 0, aperture: 0.8 },
};

export const GAZE_DEFAULTS: GazeParams = {
  rest: [0, 0],
  spread: [0.45, 0.4],
  fixMs: 700,
  ampMean: 4,
  microRate: 0.6,
  a: [0, 0],
  b: [0, 0],
  dwellA: 1,
  dwellB: 1,
  lines: 6,
  width: 0.7,
  lineStep: 0.12,
  scrollSpeed: 2.5,
  follow: 1,
  pursuitGain: 0.85,
  catchUp: 1.6,
  blinkEvery: 3.6,
};

/** Each era's way of looking (docs/EYE_TSL_PLAN.md §7, "Gaze"). */
const ERA_GAZE: Record<string, { pattern: GazePattern; gaze: Partial<GazeParams> }> = {
  // slightly down at the terminal, reading along the lines
  '1970': {
    pattern: 'read',
    gaze: { rest: [0, -0.12], lines: 5, width: 0.65, lineStep: 0.12, fixMs: 420, blinkEvery: 5.5 },
  },
  // straight ahead, short hops between icons
  '1981': {
    pattern: 'scatter',
    gaze: { spread: [0.35, 0.3], fixMs: 900, ampMean: 3.5, blinkEvery: 3.6 },
  },
  // reading the first web page, line by line
  '1991': {
    pattern: 'read',
    gaze: { rest: [0, 0.15], lines: 7, width: 0.8, lineStep: 0.11, fixMs: 400, blinkEvery: 6 },
  },
  // scattered: many short fixations, jumping between whatever blinks
  '1995': {
    pattern: 'scatter',
    gaze: { spread: [0.7, 0.55], fixMs: 450, ampMean: 7, blinkEvery: 3 },
  },
  // the nav frame and the content frame, in turn
  '1997': {
    pattern: 'two-target',
    gaze: { a: [-0.62, 0.15], b: [0.22, 0], dwellA: 1.4, dwellB: 3.5, fixMs: 650, blinkEvery: 3.6 },
  },
  // locked on the search box: drift and microsaccades only
  '2000': {
    pattern: 'lock',
    gaze: { rest: [0, 0.05], microRate: 0.7, follow: 0.6, blinkEvery: 6.5 },
  },
  // the default: free viewing
  '2003': { pattern: 'idle', gaze: {} },
  // ~15° down at the phone, riding the scroll and jumping back
  '2009': {
    pattern: 'scroll',
    gaze: { rest: [0, -1.5], fixMs: 700, scrollSpeed: 1.6, blinkEvery: 4.5 },
  },
  // a selfie: up into the front camera's lens, then down a little to the
  // screen to see how it looks, and back
  '2013': {
    pattern: 'two-target',
    gaze: {
      rest: [0, 0.3],
      a: [0, 0.45],
      b: [0.04, 0.25],
      dwellA: 1.2,
      dwellB: 4,
      fixMs: 750,
      blinkEvery: 4,
    },
  },
  // eye contact: straight into the camera, following the pointer best of all
  '2026': {
    pattern: 'contact',
    gaze: { microRate: 0.6, pursuitGain: 0.97, catchUp: 1, blinkEvery: 4.2 },
  },
};

export function getEraLook(eraId: string): EraLook {
  const id = eraId === 'codex' ? '1981' : eraId;
  const g = ERA_GAZE[id] ?? { pattern: 'idle' as GazePattern, gaze: {} };
  const gaze: GazeParams = { ...GAZE_DEFAULTS, ...g.gaze };
  const light = ERA_LIGHT[id] ?? LIVE_SCREEN;
  return {
    ...getEraVisual(eraId),
    light:
      eraId === 'codex'
        ? {
            ...light,
            fill: {
              dir: [-0.35, 0.62, 0.7],
              color: '#f6e4c4',
              strength: 0.42,
              pos: [-180, 320, 380],
              size: [980, 520],
              round: 0.45,
            },
          }
        : light,
    // The etching branch squints; the studio face stays open.
    squintRest: eraId === 'codex' ? 0 : id === '1981' ? 0.35 : 0,
    stepScroll: eraId === '1991',
    restGaze: gaze.rest,
    gazePattern: g.pattern,
    gaze,
    lens: { ...CLEAN_LENS, ...ERA_LENS[eraId] },
    cursor: ERA_CURSOR[eraId] ?? 'arrow',
    signature: '',
  };
}
