/**
 * The era's screen, as numbers. Everything the screen pass reads is damped
 * here, once, into a plain state object: the TSL stage copies it into its
 * uniform nodes, and the lab's GLSL reference copies the same state into the
 * live shader's uniforms, so the two can be compared frame for frame.
 *
 * Ported from EraEyeCanvas, behaviour for behaviour: palettes lerp, every
 * effect amount damps, layouts that cannot be interpolated crossfade A into B,
 * and the page scrolls by the era's own rate.
 */

import { Color } from 'three/webgpu';
import type { EraVisual } from '@/lib/era-visuals';
import type { PaletteColors } from '../look';
import { damp } from './motion';

export interface ScreenState {
  time: number;
  bg: Color;
  ink: Color;
  panel: Color;
  accent: Color;
  bar: Color;
  styleA: number;
  styleB: number;
  styleMix: number;
  scroll: number;
  scan: number;
  pixel: number;
  dither: number;
  posterize: number;
  glow: number;
  wobble: number;
  warp: number;
  tech: number;
  /** How much of a cathode-ray tube the era's monitor is. The room reads it. */
  crt: number;
}

/** Damping rate for every era parameter, per second. */
const L = 4.5;

export class ScreenDriver {
  readonly state: ScreenState = {
    time: 0,
    bg: new Color('#050505'),
    ink: new Color('#ffffff'),
    panel: new Color('#2438e0'),
    accent: new Color('#b21e8f'),
    bar: new Color('#e11d74'),
    styleA: 2,
    styleB: 2,
    styleMix: 1,
    scroll: 0,
    scan: 0,
    pixel: 0,
    dither: 0,
    posterize: 0,
    glow: 0,
    wobble: 0,
    warp: 0,
    tech: 0,
    crt: 0,
  };

  private started = false;
  /** Scroll still to come from kicks, as a share of the page. */
  private owed = 0;

  /** Scroll the page by this share of itself, eased in over half a second. */
  kick(amount: number) {
    this.owed += amount;
  }

  /** A layout crossfade is running; the pass must render every frame until it lands. */
  get crossfading() {
    return this.state.styleMix < 1;
  }

  /**
   * @param stepScroll the page moves only by kicks (a reading eye turning
   *                   pages), not at the era's steady rate
   */
  /**
   * @param snap land every change at once (the lids are shut on a cut between
   *             eras, so the new screen should be whole when they open)
   */
  update(
    dt: number,
    visual: EraVisual,
    pal: PaletteColors,
    reduce: boolean,
    stepScroll = false,
    rate = 1,
    snap = false,
  ) {
    const s = this.state;
    if (!reduce) s.time += dt;

    const k = reduce || snap ? 1 : 1 - Math.exp(-5 * dt);
    s.bg.lerp(pal.bg, k);
    s.ink.lerp(pal.ink, k);
    s.panel.lerp(pal.panel, k);
    s.accent.lerp(pal.accent, k);
    s.bar.lerp(pal.bar, k);

    if (!reduce && !stepScroll) s.scroll = (s.scroll + visual.scroll * rate * dt) % 1;
    if (this.owed > 1e-4) {
      const step = reduce ? this.owed : this.owed * (1 - Math.exp(-6 * dt));
      s.scroll = (s.scroll + step) % 1;
      this.owed -= step;
    }

    // Layouts cannot be interpolated, so a change crossfades A into B.
    if (!this.started) {
      this.started = true;
      s.styleA = visual.style;
      s.styleB = visual.style;
      s.styleMix = 1;
    }
    if (visual.style !== s.styleB) {
      s.styleA = s.styleB;
      s.styleB = visual.style;
      s.styleMix = 0;
    }
    s.styleMix = snap ? 1 : Math.min(1, s.styleMix + dt * (reduce ? 8 : 2.6));

    const Lk = snap ? 1e6 : L;
    s.scan = damp(s.scan, visual.scan, Lk, dt);
    s.pixel = damp(s.pixel, visual.pixel, Lk, dt);
    s.dither = damp(s.dither, visual.dither, Lk, dt);
    s.posterize = damp(s.posterize, visual.posterize, Lk, dt);
    s.glow = damp(s.glow, visual.glow, Lk, dt);
    s.wobble = damp(s.wobble, reduce ? 0 : visual.wobble, Lk, dt);
    s.warp = damp(s.warp, reduce ? 0 : visual.warp, Lk, dt);
    // a scrub through the ring walks from a cathode-ray tube to an OLED without a cut
    s.tech = damp(s.tech, visual.tech, Lk, dt);
    s.crt = damp(s.crt, visual.crt, Lk, dt);
  }
}
