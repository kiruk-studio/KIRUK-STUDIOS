/**
 * Inks and dry media — what the line is made of.
 *
 * Colours marked TOKEN mirror `packages/design-system/tokens/core.json` (`color.dawn.*`);
 * the engine cannot read token CSS on the server, so it carries the same hex and cites it.
 * Every other colour is a WORKING VALUE: a physical model of a pigment, used only inside
 * plates. Promoting one to the brand palette is a design-tokens proposal (non-negotiable 5).
 */
import { fromHex, type RGB } from '../core/color.ts';

export type InkId =
  | 'iron-gall'
  | 'navy'
  | 'bistre'
  | 'sepia'
  | 'carbon'
  | 'rubric'
  | 'rubric-type'
  | 'sanguine'
  | 'blueprint'
  | 'graphite'
  | 'silverpoint'
  | 'white'
  | 'departs'
  | 'chalk';

export interface InkSpec {
  id: InkId;
  name: string;
  /** Mass tone: a full, dried deposit seen on white. */
  color: RGB;
  /** Colour of the pale ring that migrates past the edge (oxidation / carrier), if any. */
  halo: RGB;
  /** Optical density of one full layer, 0..1 (the fill opacity of a loaded stroke). */
  density: number;
  /** Wicking along fibres, 0..1; multiplied by the paper's absorbency. */
  bleed: number;
  /** Strength of the halo ring, 0..1. */
  haloStrength: number;
  /** How large and dark a resting pen's pool becomes, 0..1. */
  pool: number;
  /** Tide-line darkening at a drying edge (coffee ring), 0..1. */
  rim: number;
  /** Drain rate of the reservoir, relative (1 = iron-gall in a quill). */
  flow: number;
  /** Dry medium: no pools, no bleed; the paper's tooth breaks the line. */
  dry: boolean;
  /** Blend onto the sheet: pigments multiply; white heightening lies on top; light ink on a dark sheet screens. */
  blend: 'multiply' | 'normal' | 'screen';
  /** Where the colour comes from. */
  source: string;
  /**
   * The ink this ink's values are lettered in, when this one is for strokes only (the token
   * rule: rubric-line rules, guides and leaders; rubric for type that measures).
   */
  typeInk?: InkId;
}

const W = (s: string) => fromHex(s);

export const INKS: Record<InkId, InkSpec> = {
  'iron-gall': {
    id: 'iron-gall',
    name: 'Iron-gall ink',
    color: W('#231a14'),
    halo: [0.64, 0.47, 0.3],
    density: 0.93,
    bleed: 0.55,
    haloStrength: 0.55,
    pool: 0.85,
    rim: 0.6,
    flow: 1,
    dry: false,
    blend: 'multiply',
    source:
      'TOKEN color.dawn.iron-gall #231A14 (aged mass tone); halo WORKING VALUE — oxidised iron migrating past the stroke',
  },
  navy: {
    id: 'navy',
    name: 'Dawn navy',
    color: W('#1d1c2d'),
    halo: [0.42, 0.5, 0.62],
    density: 0.94,
    bleed: 0.35,
    haloStrength: 0.22,
    pool: 0.65,
    rim: 0.4,
    flow: 0.95,
    dry: false,
    blend: 'multiply',
    source: 'TOKEN color.dawn.navy #1D1C2D; halo WORKING VALUE (burin WASH_NEW_RGB)',
  },
  bistre: {
    id: 'bistre',
    name: 'Bistre',
    color: [0.33, 0.23, 0.14],
    halo: [0.7, 0.58, 0.42],
    density: 0.82,
    bleed: 0.5,
    haloStrength: 0.12,
    pool: 0.7,
    rim: 0.75,
    flow: 1.1,
    dry: false,
    blend: 'multiply',
    source: 'WORKING VALUE — wood-soot brown, warm, transparent, strong drying rims',
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    color: [0.27, 0.18, 0.12],
    halo: [0.62, 0.5, 0.38],
    density: 0.86,
    bleed: 0.45,
    haloStrength: 0.15,
    pool: 0.75,
    rim: 0.55,
    flow: 1.05,
    dry: false,
    blend: 'multiply',
    source: 'WORKING VALUE — cuttlefish brown, the architectural renderer’s ink',
  },
  carbon: {
    id: 'carbon',
    name: 'Carbon (lamp black)',
    color: [0.075, 0.072, 0.07],
    halo: [0.5, 0.5, 0.5],
    density: 0.96,
    bleed: 0.25,
    haloStrength: 0,
    pool: 0.6,
    rim: 0.3,
    flow: 0.9,
    dry: false,
    blend: 'multiply',
    source: 'WORKING VALUE — neutral, stable, sits on the surface; no halo',
  },
  rubric: {
    id: 'rubric',
    name: 'Rubric red',
    color: W('#b5462b'),
    halo: [0.85, 0.62, 0.5],
    density: 0.9,
    bleed: 0.3,
    haloStrength: 0.08,
    pool: 0.5,
    rim: 0.35,
    flow: 0.9,
    dry: false,
    blend: 'multiply',
    source:
      'TOKEN color.dawn.rubric-line #B5462B (rules, guides, leaders); type uses color.dawn.rubric #983A22',
    typeInk: 'rubric-type',
  },
  'rubric-type': {
    id: 'rubric-type',
    name: 'Rubric red, for type',
    color: W('#983a22'),
    halo: [0.85, 0.62, 0.5],
    density: 0.94,
    bleed: 0.3,
    haloStrength: 0.08,
    pool: 0.5,
    rim: 0.35,
    flow: 0.9,
    dry: false,
    blend: 'multiply',
    source:
      'TOKEN color.dawn.rubric #983A22: type that measures and numbers (measure labels, plate numbers), ≥ 4.5:1 on both papers; never body copy or fills',
  },
  sanguine: {
    id: 'sanguine',
    name: 'Red chalk (sanguine)',
    color: [0.72, 0.4, 0.3],
    halo: [0.72, 0.4, 0.3],
    density: 0.62,
    bleed: 0,
    haloStrength: 0,
    pool: 0,
    rim: 0,
    flow: 0,
    dry: true,
    blend: 'multiply',
    source: 'WORKING VALUE — burin SANGUINE_RGB: the hand’s underdrawing on the old paper',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint blue pencil',
    color: [0.32, 0.45, 0.78],
    halo: [0.32, 0.45, 0.78],
    density: 0.55,
    bleed: 0,
    haloStrength: 0,
    pool: 0,
    rim: 0,
    flow: 0,
    dry: true,
    blend: 'multiply',
    source: 'WORKING VALUE — burin BLUEPRINT_RGB: the code’s construction on the new paper',
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite',
    color: [0.27, 0.27, 0.29],
    halo: [0.27, 0.27, 0.29],
    density: 0.78,
    bleed: 0,
    haloStrength: 0,
    pool: 0,
    rim: 0,
    flow: 0,
    dry: true,
    blend: 'multiply',
    source: 'WORKING VALUE — HB–2B lead; never reaches ink black',
  },
  silverpoint: {
    id: 'silverpoint',
    name: 'Silverpoint',
    color: [0.47, 0.45, 0.41],
    halo: [0.47, 0.45, 0.41],
    density: 0.42,
    bleed: 0,
    haloStrength: 0,
    pool: 0,
    rim: 0,
    flow: 0,
    dry: true,
    blend: 'multiply',
    source: 'WORKING VALUE — tarnished silver on a prepared ground: fine, even, grey-brown',
  },
  white: {
    id: 'white',
    name: 'White heightening',
    color: [0.985, 0.975, 0.94],
    halo: [0.985, 0.975, 0.94],
    density: 0.78,
    bleed: 0.05,
    haloStrength: 0,
    pool: 0.3,
    rim: 0.2,
    flow: 1.2,
    dry: false,
    blend: 'normal',
    source: 'WORKING VALUE — lead white / body colour laid on a toned sheet',
  },
  departs: {
    id: 'departs',
    name: 'Dawn Departs (light ink, for the night sheet)',
    color: W('#ccffff'),
    halo: W('#ccffff'),
    density: 0.9,
    bleed: 0.18,
    haloStrength: 0,
    pool: 0.45,
    rim: 0.2,
    flow: 1,
    dry: false,
    blend: 'screen',
    source:
      'TOKEN color.dawn.departs #CCFFFF, used as a light line on the night sheet (navy): the blue before sunrise drawn on the dark',
  },
  chalk: {
    id: 'chalk',
    name: 'White chalk',
    color: [0.92, 0.92, 0.89],
    halo: [0.92, 0.92, 0.89],
    density: 0.55,
    bleed: 0,
    haloStrength: 0,
    pool: 0,
    rim: 0,
    flow: 0,
    dry: true,
    blend: 'screen',
    source: 'WORKING VALUE — white chalk on a dark ground (construction on the night sheet)',
  },
};

export const ink = (id: InkId): InkSpec => INKS[id];
