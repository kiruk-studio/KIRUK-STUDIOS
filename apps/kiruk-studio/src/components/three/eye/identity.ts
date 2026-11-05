/**
 * Who each era's eye belongs to. Anatomy that differs from person to person
 * lives here as data, never as constants in a shader. P0 only fixes the shape
 * of the record; the iris, lid and skin phases read it, and the era passes
 * (P11) fill in the casting from docs/EYE_TSL_PLAN.md §7.
 */

export type LidType = 'double' | 'mono' | 'hooded' | 'deepset' | 'epicanthic';
export type MonkTone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface EyeIdentity {
  seed: number;
  iris: {
    /** sRGB hex, the pupillary zone inside the collarette. */
    inner: string;
    /** sRGB hex, the ciliary zone outside it. */
    outer: string;
    melanin: number;
    scatter: number;
    /** Share of the iris radius, measured out from the pupil. */
    collaretteR: number;
    crypts: number;
    furrows: number;
    fibreWave: number;
    freckles: number;
    limbal: number;
    arcus: number;
  };
  sclera: { tint: string; vessels: number; age: number };
  pupil: { rest: number; reactivity: number; decentre: [number, number] };
  lids: { type: LidType; tilt: number; aperture: number };
  /**
   * Density of the upper and lower rows (share of the tier's count), length
   * (× 10 mm upper, × 7 mm lower), curl, how much they clump, mascara (black,
   * thicker, clumpier, glossier), and their colour at the root and the tip.
   */
  lashes: {
    upper: number;
    lower: number;
    length: number;
    curl: number;
    clump: number;
    mascara: number;
    root: string;
    tip: string;
  };
  /** …and freckles, 0..1, mostly on the lids and the cheek. */
  skin: {
    monk: MonkTone;
    undertone: number;
    translucency: number;
    pores: number;
    lines: number;
    freckles: number;
  };
}

/**
 * The person whose eye it is: the same in every era, as the old eye was. A
 * South Indian face: deep brown skin (Monk 9), a dark brown iris, black
 * lashes and brow, a white that is warm rather than white. What changes from
 * era to era is the screen they look at, its light and the camera
 * (look.ts), not who they are. The lab can still try other faces.
 */
export const DEFAULT_IDENTITY: EyeIdentity = {
  seed: 0x5e11a,
  iris: {
    inner: '#5e3c22',
    outer: '#4a2e1a',
    melanin: 0.85,
    scatter: 0.08,
    collaretteR: 0.34,
    crypts: 0.4,
    furrows: 0.5,
    fibreWave: 0.5,
    freckles: 0.1,
    limbal: 0.8,
    arcus: 0.3,
  },
  sclera: { tint: '#e4dccb', vessels: 0.5, age: 0.4 },
  pupil: { rest: 0.34, reactivity: 1, decentre: [-0.02, -0.01] },
  lids: { type: 'hooded', tilt: 2, aperture: 1 },
  lashes: {
    upper: 1,
    lower: 1,
    length: 1,
    curl: 0.35,
    clump: 0.45,
    mascara: 0,
    root: '#0c0908',
    tip: '#16110d',
  },
  skin: { monk: 9, undertone: 0.45, translucency: 0.45, pores: 0.6, lines: 0.4, freckles: 0 },
};

/**
 * The Monk Skin Tone scale's ten swatches (Monk, 2019; Google, 2022), as sRGB.
 * The skin shader takes the swatch as the tone and lets the screen's light do
 * the rest.
 */
export const MONK_TONES: Record<MonkTone, string> = {
  1: '#f6ede4',
  2: '#f3e7db',
  3: '#f7ead0',
  4: '#eadaba',
  5: '#d7bd96',
  6: '#a07e56',
  7: '#825c43',
  8: '#604134',
  9: '#3a312a',
  10: '#292420',
};

/**
 * Lid shapes as numbers for the lid mesh: the crease's height above the
 * margin and its depth (mm), how much skin hoods over it, how far an
 * epicanthic fold reaches over the inner corner.
 */
export const LID_SHAPES: Record<
  LidType,
  { creaseD: number; creaseDepth: number; hood: number; epicanthus: number }
> = {
  // (creaseD is the fold as it shows, where the skin above overhangs the lid:
  // 2.5–5 mm over the lashes, not the deeper anatomical crease. Kept low
  // enough that the pushed-in shot shows it between the lashes.)
  double: { creaseD: 3.5, creaseDepth: 0.55, hood: 0, epicanthus: 0 },
  mono: { creaseD: 2.6, creaseDepth: 0, hood: 0.2, epicanthus: 0.1 },
  hooded: { creaseD: 2.5, creaseDepth: 0.4, hood: 0.65, epicanthus: 0 },
  deepset: { creaseD: 4.8, creaseDepth: 0.9, hood: 0, epicanthus: 0 },
  epicanthic: { creaseD: 2.9, creaseDepth: 0.25, hood: 0.25, epicanthus: 0.6 },
};

/** The eye's person: the same in every era (the era is kept for the call sites that pass it). */
export function getEyeIdentity(eraId: string): EyeIdentity {
  void eraId;
  return {
    ...DEFAULT_IDENTITY,
    iris: { ...DEFAULT_IDENTITY.iris },
    skin: { ...DEFAULT_IDENTITY.skin },
    lids: { ...DEFAULT_IDENTITY.lids },
    lashes: { ...DEFAULT_IDENTITY.lashes },
    sclera: { ...DEFAULT_IDENTITY.sclera },
  };
}
