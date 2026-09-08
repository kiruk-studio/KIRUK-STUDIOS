/**
 * Stroke recipes — the durable artifact of the kiruk hand-drawn system.
 *
 * We store the *pen stream*, not the artwork. Exporting SVG or PNG discards
 * pressure, tilt and azimuth, and forces frames to be stretched (9-slice repeats
 * the middle band, so a wide card shows the same short run of pencil tiled over
 * and over). Keeping the samples lets a 60px button and a 900px card each get an
 * honestly re-drawn edge from the same hand.
 *
 * spec-link: openspec/specs/design-tokens/spec.md#requirement-drawn-asset-tokens
 */

/** One pen sample: [x, y, pressure 0..1, tiltX deg, tiltY deg]. */
export type Sample = readonly [
  x: number,
  y: number,
  pressure: number,
  tiltX: number,
  tiltY: number,
];

/**
 * What a stroke is *for* inside its mark. Frames resample their edges to the
 * required length but place corners unscaled — corners carry the most character,
 * and stretching one is instantly legible as fake.
 */
export type StrokeRole =
  | 'edge-top'
  | 'edge-right'
  | 'edge-bottom'
  | 'edge-left'
  | 'corner-tl'
  | 'corner-tr'
  | 'corner-br'
  | 'corner-bl'
  | 'body';

export interface Stroke {
  readonly role: StrokeRole;
  readonly samples: readonly Sample[];
}

/** One honest take. Three per mark gives the synthesizer enough hand-variance. */
export interface Take {
  readonly seed: number;
  readonly strokes: readonly Stroke[];
}

/**
 * Which renderer a mark uses.
 *
 * - `A` baked at build time — zero runtime cost, zero JS. The default, and what
 *   keeps kiruk-web's static routes inside their 0 KB budget.
 * - `B` synthesized at the measured box — only for containers whose size is
 *   genuinely unknown (card, dialog, sheet, frame around arbitrary content).
 * - `C` live capture — the forge only.
 */
export type RenderTier = 'A' | 'B' | 'C';

export interface DeviceInfo {
  readonly pointerType: 'pen' | 'mouse' | 'touch';
  readonly hasTilt: boolean;
}

export interface StrokeRecipe {
  readonly id: string;
  readonly version: number;
  readonly capturedAt: string;
  readonly device: DeviceInfo;
  /** Box the mark was drawn at, in user units. */
  readonly referenceBox: readonly [width: number, height: number];
  readonly tier: RenderTier;
  readonly takes: readonly Take[];
}

export interface SynthesizeOptions {
  /** Target box in CSS px. */
  readonly width: number;
  readonly height: number;
  /**
   * Deterministic seed derived from component identity. Never random: a fresh
   * seed on every React render makes the whole UI visibly crawl.
   */
  readonly seed: number;
  /** Rendered stroke width in px. Absolute — never scaled by the box. */
  readonly strokeWidth: number;
}
