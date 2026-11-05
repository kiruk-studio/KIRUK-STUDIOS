/**
 * Per-era visual DNA for the era-picker eye.
 *
 * The eye is the same in every era. What changes is the screen reflected in
 * its cornea, and how wide the pupil opens for it: a phosphor terminal in a
 * dark room opens wide, a 1-bit Xerox Star display on a bright desk stops down.
 */

export interface EraVisual {
  /* ---- the eye ---- */
  /** Pupil radius as a share of the iris. Dark screens open it wider. */
  pupil: number;
  /** Corneal reflection strength. */
  reflect: number;

  /* ---- the reflected interface ---- */
  /**
   * Which screen layout the eye is looking at. Each id is a hand-built era
   * interface in the shader, not a recoloured grid:
   * 0 terminal · 1 Xerox Star · 2 early web · 3 GeoCities · 4 frames ·
   * 5 Zen Garden · 6 Web 2.0 · 7 Aqua · 8 phone grid · 9 Material ·
   * 10 chat · 11 generative
   */
  style: number;
  /** Screens-per-second the reflected content scrolls by. Keeps it alive. */
  scroll: number;
  /** Scanlines across the reflected screen. */
  scan: number;
  /** How much of a cathode-ray tube this era's monitor is: grille, curve, roll. */
  crt: number;
  /**
   * What the panel is actually made of, which is a different question from how
   * much tube it has: 0 cathode-ray · 1 backlit TFT · 2 IPS / retina · 3 OLED.
   * It decides the black level, the subpixel structure and the backlight bleed
   * — the things that date a screen even when the layout on it does not.
   */
  tech: number;
  /** Bitmap grid of the reflected screen (0 = continuous). */
  pixel: number;
  /** Ordered dither — 1 = pure 1-bit bitmap. */
  dither: number;
  /** Colour levels of the reflected screen (0 = full colour). */
  posterize: number;
  /** Emissive lift of the reflected screen. */
  glow: number;
  /** Organic drift of the reflected UI (generative eras). */
  wobble: number;
  /** Horizontal band tearing in the reflection. */
  warp: number;

  /* ---- post-processing ---- */
  bloom: number;
  chroma: number;
  noise: number;
  vignette: number;
}

const BASE: EraVisual = {
  pupil: 0.34,
  reflect: 0.7,
  style: 2,
  scroll: 0.01,
  scan: 0,
  crt: 0,
  tech: 0,
  pixel: 0,
  dither: 0,
  posterize: 0,
  glow: 0,
  wobble: 0,
  warp: 0,
  bloom: 0.35,
  chroma: 0,
  noise: 0.02,
  vignette: 0.3,
};

const v = (o: Partial<EraVisual>): EraVisual => ({ ...BASE, ...o });

export const ERA_VISUALS: Record<string, EraVisual> = {
  // A phosphor terminal in a dark room: pupil wide open, rows of glowing text.
  '1970': v({
    pupil: 0.46,
    reflect: 0.85,
    style: 0,
    scroll: 0.055,
    crt: 1.0,
    tech: 0,
    scan: 0.85,
    pixel: 3,
    posterize: 3,
    glow: 0.5,
    bloom: 1.5,
    chroma: 0.0012,
    noise: 0.09,
    vignette: 0.55,
  }),
  // Xerox Star: a bright 1-bit office display, so the pupil closes down.
  '1981': v({
    pupil: 0.24,
    reflect: 0.8,
    style: 1,
    scroll: 0.006,
    crt: 0.85,
    tech: 0,
    pixel: 4,
    dither: 1,
    posterize: 2,
    bloom: 0.2,
    noise: 0.02,
    vignette: 0.22,
  }),
  // The first web page: one column of text, nothing else.
  '1991': v({
    pupil: 0.28,
    reflect: 0.72,
    style: 2,
    scroll: 0.03,
    crt: 0.8,
    tech: 0,
    pixel: 2.5,
    dither: 0.5,
    posterize: 3,
    bloom: 0.18,
    noise: 0.02,
    vignette: 0.2,
  }),
  // GeoCities: clashing tiles, animated junk, tearing.
  '1995': v({
    pupil: 0.36,
    reflect: 0.82,
    style: 3,
    scroll: 0.028,
    crt: 0.7,
    tech: 0,
    pixel: 3,
    posterize: 5,
    warp: 0.55,
    glow: 0.2,
    bloom: 0.7,
    chroma: 0.002,
    noise: 0.05,
    vignette: 0.28,
  }),
  // Corporate frames: rigid table layout, beveled cells.
  '1997': v({
    pupil: 0.3,
    reflect: 0.72,
    style: 4,
    scroll: 0.012,
    crt: 0.6,
    tech: 0,
    pixel: 1.5,
    posterize: 8,
    bloom: 0.22,
    noise: 0.02,
    vignette: 0.22,
  }),
  // Aqua & Flash: draggable gel windows on a desktop.
  '2000': v({
    pupil: 0.28,
    reflect: 0.7,
    style: 5,
    scroll: 0.018,
    crt: 0.45,
    tech: 0.5,
    bloom: 0.3,
    vignette: 0.26,
  }),
  // Web 2.0: big rounded gel cards.
  '2003': v({
    pupil: 0.3,
    reflect: 0.9,
    style: 6,
    scroll: 0.012,
    crt: 0.3,
    tech: 1,
    glow: 0.12,
    bloom: 0.85,
    vignette: 0.3,
  }),
  // iPhone: an app grid, bright and crisp.
  '2009': v({
    pupil: 0.27,
    reflect: 0.9,
    style: 8,
    scroll: 0.008,
    crt: 0.08,
    tech: 1.6,
    glow: 0.1,
    bloom: 0.55,
    chroma: 0.0006,
    vignette: 0.26,
  }),
  // iOS 7: flat tiles, zero ornament.
  '2013': v({
    pupil: 0.26,
    reflect: 0.88,
    style: 8,
    scroll: 0.008,
    crt: 0.04,
    tech: 2,
    bloom: 0.35,
    vignette: 0.18,
  }),
  // Generative: the interface never settles.
  '2026': v({
    pupil: 0.42,
    reflect: 0.95,
    style: 11,
    scroll: 0.05,
    crt: 0.06,
    tech: 3,
    glow: 0.4,
    wobble: 1.0,
    warp: 0.2,
    bloom: 1.35,
    chroma: 0.0026,
    noise: 0.09,
    vignette: 0.4,
  }),
};

export function getEraVisual(id: string): EraVisual {
  const key = id === 'codex' ? '1981' : id;
  return ERA_VISUALS[key] ?? BASE;
}
