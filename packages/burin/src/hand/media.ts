/**
 * The hand's media: what each one is, its pigment on each paper, and how it meets the sheet.
 * Shared by the painter (p5.brush, in a worker) and the compose (TSL, on the GPU).
 *
 *   medium  painted as                      meets the paper                       held to the light
 *   chalk   red chalk, the underdrawing     catches the tooth's peaks, skips      a little darker
 *                                           the valleys where the hand was light
 *   wash    bistre, watercolour             sinks: pools in the valleys           darker (it is in
 *                                           (granulates), mottles with the        the sheet)
 *                                           formation, cockles the sheet as it
 *                                           dries; re-wets under water
 *   ink     iron-gall from a quill          starved on the tooth like the cut     darker
 *                                           lines; re-wets and bleeds
 *   body    lead white, heightening         laid on top, catches the peaks,       opaque: it goes
 *                                           lit like the sheet                    dark
 *   iris    a colour wash on the iris       as the wash, mapped onto the turning  as the wash
 *                                           eye so it follows the gaze
 *
 * Each paper takes its own ink (dawn-paper-tokens). The pigments below are the hand's on the
 * old paper (Dawn Light); on the new paper (Dawn Departs) the compose swaps each one for its
 * new-paper pigment in optical density, so the hand's own variation survives the swap.
 *
 * spec-link: ideas/studio-dawn/hand.md
 */

export type Rect = [number, number, number, number];
export type RGB = readonly [number, number, number];

/** The four sheets the hand paints, one medium each, every one painted on white (or black, for body). */
export const HAND_LAYERS = ['chalk', 'wash', 'ink', 'body'] as const;
export type HandLayer = (typeof HAND_LAYERS)[number];

const rgb = (hex: string): RGB => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** A pigment: the hex the hand paints with, and its sRGB triple for the GPU. */
export type Pigment = { hex: string; rgb: RGB };
const pigment = (hex: string): Pigment => ({ hex, rgb: rgb(hex) });

/**
 * The hand's palette. Old-paper pigments are what p5.brush paints with; new-paper pigments are
 * what the compose turns them into where Dawn Departs lies.
 * Iron-gall and navy mirror color.dawn.iron-gall / color.dawn.navy (dawn-paper-tokens).
 */
export const PIGMENTS = {
  /** red chalk: haematite in clay, the draughtsman's underdrawing */
  sanguine: pigment('#a34a32'),
  /** the code's blueprint: the underdrawing on the new paper */
  blueprint: pigment('#5273c7'),
  /** iron-gall ink, brown-black, from a quill */
  ironGall: pigment('#231a14'),
  /** dawn navy, the new paper's ink */
  navy: pigment('#1d1c2d'),
  /** bistre: soot boiled down to a brown wash */
  bistre: pigment('#6f4b2c'),
  /** the navy, let down with water */
  navyWash: pigment('#45597a'),
  /** carnation: the colourist's flesh, for the caruncle and the lid's margin */
  carnation: pigment('#c8645a'),
  /** the iris: indigo with a little verdigris; on the warm sheet it reads hazel-green */
  iris: pigment('#4f6f7a'),
  /** the iris's warm collarette */
  hazel: pigment('#8c6a2e'),
  /** lead white, for heightening */
  leadWhite: pigment('#f7f2e6'),
} as const;

/** Which pigment each medium is painted in, and what it becomes on the new paper. */
export const DAWN_SWAP: Record<Exclude<HandLayer, 'body'>, { old: Pigment; new: Pigment }> = {
  chalk: { old: PIGMENTS.sanguine, new: PIGMENTS.blueprint },
  wash: { old: PIGMENTS.bistre, new: PIGMENTS.navyWash },
  ink: { old: PIGMENTS.ironGall, new: PIGMENTS.navy },
};

/** What the hand is asked to paint. Coordinates are CSS px on the page. */
export type HandRequest = {
  /** a registered recipe, e.g. 'eye' */
  subject: string;
  /** the impression: the same seed paints the same hand */
  seed: number;
  /** the page rect the layers cover, CSS px */
  region: Rect;
  /** canvas px per CSS px for the layers (1 … 2) */
  density: number;
  /** recipe-specific numbers, e.g. the eye's centre and scale */
  params: Record<string, number | number[]>;
};

/** What comes back: one bitmap per medium over the region, and the iris decal. */
export type HandSheet = {
  subject: string;
  seed: number;
  region: Rect;
  density: number;
  layers: Record<HandLayer, ImageBitmap>;
  /** the iris colour, painted at the rest pose; rect in CSS px */
  iris: { bitmap: ImageBitmap; rect: Rect } | null;
  /** time spent painting, ms */
  ms: number;
  via: 'worker' | 'main';
};
