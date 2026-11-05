/**
 * Styles — a historic manner written as numbers: which instrument and ink each role
 * takes, how the hand moves, how hatching is laid, and the envelope the critic holds the
 * plate to. A style is a starting point measured from sources, never a costume: the
 * critic fails a plate that uses a style's look without its reasons.
 *
 * Sources: ideas/kiruk-codex/research/01-leonardo.md, 02-plates-and-manuscripts.md,
 * 03-modern-line.md (cited per field as 01 §n / 02 Rn / 03 Rn). Values not in the
 * research are WORKING VALUES and say so.
 */
import type { HandSpec, Role } from '../hand/hand.ts';
import { HANDS } from '../hand/hand.ts';
import type { InkId } from '../ink/inks.ts';
import type { InstrumentId } from '../nib/instruments.ts';
import type { PaperId } from '../paper/paper.ts';

export type StyleId =
  | 'codex'
  | 'construction'
  | 'cosmograph'
  | 'architect'
  | 'engraver'
  | 'dawn-new'
  | 'night';

export type LayerId =
  | 'stylus'
  | 'construction'
  | 'underdrawing'
  | 'wash'
  | 'ink'
  | 'heightening'
  | 'overlay'
  | 'letter';

export interface RoleKit {
  instrument: InstrumentId;
  ink: InkId;
  layer: LayerId;
  /** Layer weight (construction and searching sit lighter). */
  density: number;
}

export interface HatchManner {
  /**
   * 'one-slope': one hand, one slope everywhere (Leonardo: travel varies, slope stays, 01 §1).
   * 'per-form': the direction turns with each surface, one family per surface (engraving,
   * architectural rendering: a different angle for each adjacent part, 02 §11 R9).
   */
  rule: 'one-slope' | 'per-form';
  /** Slope of the main family, degrees on the page (y down): 45 = top-left → bottom-right "\". */
  slope: number;
  /** Allowed spread of slopes around it (critic), degrees. */
  slopeTolerance: number;
  /** Line gap range, mm. ISO minimum between parallels: 0.7 mm (research 03 §2.1). */
  gap: readonly [number, number];
  /** Cross-hatching: allowed at all, and above which tone. */
  cross: boolean;
  crossAt: number;
  crossAngle: number;
  /** Strokes bow on the wrist (+1/−1) or not (0). */
  bow: number;
  /** Max stroke length before the hand lifts, mm. */
  reach: number;
}

export interface StyleEnvelope {
  /** Width variation along ink strokes (coefficient of variation): below = plotted, above = chaotic. */
  wCv: readonly [number, number];
  /** Tremor RMS on free ink strokes, mm. */
  tremor: readonly [number, number];
  /** Share of dipped strokes that show a start pool. */
  poolRate: readonly [number, number];
  /** Share of ink length that runs starved. */
  starved: readonly [number, number];
  /** Maximum distinct hues on the plate (ink + construction + overlay). */
  hues: number;
}

export interface StyleSpec {
  id: StyleId;
  name: string;
  summary: string;
  paper: PaperId;
  hand: HandSpec;
  roles: Partial<Record<Role, RoleKit>> & { contour: RoleKit };
  hatch: HatchManner;
  envelope: StyleEnvelope;
  /** Lettering for keys, numerals and dimension values: single-stroke Hershey families. */
  letter: { font: 'futural' | 'scripts' | 'timesr'; height: number; mirror: false };
  sources: string[];
}

const kit = (instrument: InstrumentId, ink: InkId, layer: LayerId, density = 1): RoleKit => ({
  instrument,
  ink,
  layer,
  density,
});

export const STYLES: Record<StyleId, StyleSpec> = {
  codex: {
    id: 'codex',
    name: 'Codex (Leonardo’s notebook)',
    summary:
      'One dark line carries contour, hatching and lettering; left-handed hatching runs top-left to bottom-right and follows the form; construction is a lighter under-layer that generated the drawing.',
    paper: 'dawn-light',
    hand: { ...HANDS.left },
    roles: {
      contour: kit('quill', 'iron-gall', 'ink'),
      hatch: kit('quill', 'iron-gall', 'ink'),
      stipple: kit('quill', 'iron-gall', 'ink'),
      letter: kit('quill', 'iron-gall', 'letter'),
      construction: kit('stylus', 'iron-gall', 'stylus'),
      underdrawing: kit('chalk', 'sanguine', 'underdrawing', 0.55),
      searching: kit('chalk', 'sanguine', 'underdrawing', 0.45),
      dimension: kit('ruling', 'rubric', 'overlay'),
      leader: kit('ruling', 'rubric', 'overlay'),
      overlay: kit('ruling', 'rubric', 'overlay'),
      wash: kit('brush', 'iron-gall', 'wash', 0.22),
    },
    hatch: {
      rule: 'one-slope',
      slope: 45,
      slopeTolerance: 16,
      gap: [0.55, 1.25],
      cross: false,
      crossAt: 0.82,
      crossAngle: 50,
      bow: 1,
      reach: 6,
    },
    envelope: {
      wCv: [0.16, 0.75],
      tremor: [0.004, 0.05],
      poolRate: [0.15, 0.85],
      starved: [0, 0.22],
      hues: 3,
    },
    letter: { font: 'futural', height: 2.5, mirror: false },
    sources: [
      '01 §1: iron-gall; quill taper, variable weight, hook returns; slope "\\" for the left hand; hatching follows the form, only where needed; no cross-hatching everywhere (R10)',
      '01 R11: construction only if it generated the drawing, as a lighter under-layer (stylus, metalpoint, chalk)',
      '02 §11: light from the upper left at 45°',
    ],
  },
  construction: {
    id: 'construction',
    name: 'Construction study (graphite)',
    summary:
      'Graphite on drawing paper: ruled construction crossing its corners, numbered points, searching lines that find a curve by repeating it, measures in a drafting hand.',
    paper: 'cartridge',
    hand: { ...HANDS.right, tremor: 0.02, pace: 160 },
    roles: {
      contour: kit('graphite', 'graphite', 'ink'),
      hatch: kit('graphite', 'graphite', 'ink'),
      stipple: kit('graphite', 'graphite', 'ink'),
      letter: kit('graphite', 'graphite', 'letter'),
      construction: kit('graphite', 'graphite', 'construction', 0.5),
      underdrawing: kit('graphite', 'graphite', 'underdrawing', 0.4),
      searching: kit('graphite', 'graphite', 'underdrawing', 0.45),
      dimension: kit('graphite', 'graphite', 'overlay', 0.7),
      leader: kit('graphite', 'graphite', 'overlay', 0.7),
      overlay: kit('ruling', 'rubric', 'overlay'),
    },
    hatch: {
      rule: 'one-slope',
      slope: -50,
      slopeTolerance: 25,
      gap: [0.7, 1.6],
      cross: true,
      crossAt: 0.6,
      crossAngle: 70,
      bow: -1,
      reach: 9,
    },
    envelope: {
      wCv: [0.08, 0.6],
      tremor: [0.003, 0.05],
      poolRate: [0, 0],
      starved: [0, 1],
      hues: 2,
    },
    letter: { font: 'futural', height: 2.5, mirror: false },
    sources: [
      '03 §2.1: ISO 128 line types — construction narrow, outline wide',
      'WORKING VALUE: graphite slope and gaps from the construction-study reference (measured, not committed)',
    ],
  },
  cosmograph: {
    id: 'cosmograph',
    name: 'Cosmograph (compass and graphite)',
    summary:
      'A wheel of circles drawn with the compass: every centre pricked, every ring a kind, every sector a group, tone laid in graphite where a body turns from the light.',
    paper: 'cartridge',
    hand: { ...HANDS.right, tremor: 0.018 },
    roles: {
      contour: kit('graphite', 'graphite', 'ink'),
      hatch: kit('graphite', 'graphite', 'ink'),
      stipple: kit('graphite', 'graphite', 'ink'),
      letter: kit('graphite', 'graphite', 'letter'),
      construction: kit('graphite', 'graphite', 'construction', 0.45),
      underdrawing: kit('graphite', 'graphite', 'underdrawing', 0.4),
      searching: kit('graphite', 'graphite', 'underdrawing', 0.4),
      dimension: kit('ruling', 'rubric', 'overlay'),
      leader: kit('ruling', 'rubric', 'overlay'),
      overlay: kit('ruling', 'rubric', 'overlay'),
    },
    hatch: {
      rule: 'per-form',
      slope: 40,
      slopeTolerance: 30,
      gap: [0.6, 1.2],
      cross: true,
      crossAt: 0.55,
      crossAngle: 60,
      bow: 1,
      reach: 6,
    },
    envelope: {
      wCv: [0.08, 0.6],
      tremor: [0.002, 0.05],
      poolRate: [0, 0],
      starved: [0, 1],
      hues: 2,
    },
    letter: { font: 'futural', height: 2.5, mirror: false },
    sources: ['02 §1.6: rota — a ring is a kind, a sector a group, opposites across the centre'],
  },
  architect: {
    id: 'architect',
    name: 'Architectural rendering (sepia)',
    summary:
      'Sepia ink over ruled construction: orders measured in modules, cylinders shaded with lines that run along the form, dimension lines that measure the ink.',
    paper: 'rag',
    hand: { ...HANDS.right, tremor: 0.02, drift: 0.004 },
    roles: {
      contour: kit('steel', 'sepia', 'ink'),
      hatch: kit('steel', 'sepia', 'ink'),
      stipple: kit('steel', 'sepia', 'ink'),
      letter: kit('steel', 'sepia', 'letter'),
      construction: kit('graphite', 'graphite', 'construction', 0.45),
      underdrawing: kit('graphite', 'graphite', 'underdrawing', 0.35),
      searching: kit('graphite', 'graphite', 'underdrawing', 0.35),
      dimension: kit('ruling', 'sepia', 'overlay', 0.85),
      leader: kit('ruling', 'sepia', 'overlay', 0.85),
      overlay: kit('ruling', 'rubric', 'overlay'),
      wash: kit('brush', 'sepia', 'wash', 0.2),
    },
    hatch: {
      rule: 'per-form',
      slope: 90,
      slopeTolerance: 12,
      gap: [0.5, 1.1],
      cross: true,
      crossAt: 0.72,
      crossAngle: 90,
      bow: 0,
      reach: 30,
    },
    envelope: {
      wCv: [0.12, 0.7],
      tremor: [0.003, 0.045],
      poolRate: [0.1, 0.8],
      starved: [0, 0.2],
      hues: 3,
    },
    letter: { font: 'futural', height: 2.5, mirror: false },
    sources: [
      '02 R14: line weight outline > interior > construction; fine black lines for shading',
      '03 §2.2: dimensions — extension gap ≈ 1.5 mm, overshoot 2.5–3 mm, first tier 10–12 mm out',
    ],
  },
  engraver: {
    id: 'engraver',
    name: 'Engraved plate (burin)',
    summary:
      'Lines cut with the burin: each enters thin, swells as the tool bites and leaves thin; tone is the width of the line, never a grey.',
    paper: 'rag',
    hand: { ...HANDS.right, tremor: 0.006, drift: 0.002, pace: 60 },
    roles: {
      contour: kit('burin', 'carbon', 'ink'),
      hatch: kit('burin', 'carbon', 'ink'),
      stipple: kit('burin', 'carbon', 'ink'),
      letter: kit('burin', 'carbon', 'letter'),
      construction: kit('stylus', 'carbon', 'stylus'),
      underdrawing: kit('stylus', 'carbon', 'stylus'),
      searching: kit('stylus', 'carbon', 'stylus'),
      dimension: kit('ruling', 'carbon', 'overlay', 0.8),
      leader: kit('ruling', 'carbon', 'overlay', 0.8),
      overlay: kit('ruling', 'rubric', 'overlay'),
    },
    hatch: {
      rule: 'per-form',
      slope: 30,
      slopeTolerance: 40,
      gap: [0.4, 0.9],
      cross: true,
      crossAt: 0.6,
      crossAngle: 60,
      bow: 0,
      reach: 40,
    },
    envelope: {
      wCv: [0.25, 1.1],
      tremor: [0, 0.02],
      poolRate: [0, 0],
      starved: [0, 0],
      hues: 2,
    },
    letter: { font: 'timesr', height: 2.5, mirror: false },
    sources: [
      '@kiruk/burin: width is the tone; enters thin, swells, leaves thin (vector/burin.ts)',
    ],
  },
  'dawn-new': {
    id: 'dawn-new',
    name: 'Dawn Departs (the code’s paper)',
    summary:
      'The new paper: dawn navy in a steel pen, blueprint-blue construction, no age ever. The same hand, the hour after the dawn.',
    paper: 'dawn-departs',
    hand: { ...HANDS.right, tremor: 0.016 },
    roles: {
      contour: kit('steel', 'navy', 'ink'),
      hatch: kit('steel', 'navy', 'ink'),
      stipple: kit('steel', 'navy', 'ink'),
      letter: kit('steel', 'navy', 'letter'),
      construction: kit('graphite', 'blueprint', 'construction', 0.6),
      underdrawing: kit('graphite', 'blueprint', 'underdrawing', 0.45),
      searching: kit('graphite', 'blueprint', 'underdrawing', 0.4),
      dimension: kit('ruling', 'rubric', 'overlay'),
      leader: kit('ruling', 'rubric', 'overlay'),
      overlay: kit('ruling', 'rubric', 'overlay'),
      wash: kit('brush', 'navy', 'wash', 0.18),
    },
    hatch: {
      rule: 'one-slope',
      slope: -45,
      slopeTolerance: 18,
      gap: [0.55, 1.2],
      cross: true,
      crossAt: 0.7,
      crossAngle: 90,
      bow: -1,
      reach: 7,
    },
    envelope: {
      wCv: [0.12, 0.75],
      tremor: [0.003, 0.045],
      poolRate: [0.1, 0.85],
      starved: [0, 0.2],
      hues: 3,
    },
    letter: { font: 'futural', height: 2.5, mirror: false },
    sources: [
      'design-tokens: Dawn paper pair — Dawn Departs takes dawn navy; construction in blueprint (burin)',
    ],
  },
  night: {
    id: 'night',
    name: 'Night (light lines on the dark sheet)',
    summary:
      'The nightminds: light lines on the earth band of the dawn. A careful technical hand in Dawn Departs; hidden lines dashed, axes as chain lines named at both ends, construction in white chalk.',
    paper: 'night',
    hand: { ...HANDS.right, tremor: 0.014, drift: 0.004, pace: 120 },
    roles: {
      contour: kit('steel', 'departs', 'ink'),
      hatch: kit('steel', 'departs', 'ink'),
      stipple: kit('steel', 'departs', 'ink'),
      letter: kit('steel', 'departs', 'letter'),
      construction: kit('chalk', 'chalk', 'construction', 0.45),
      underdrawing: kit('chalk', 'chalk', 'underdrawing', 0.4),
      searching: kit('chalk', 'chalk', 'underdrawing', 0.35),
      dimension: kit('ruling', 'departs', 'overlay', 0.9),
      leader: kit('ruling', 'departs', 'overlay', 0.9),
      overlay: kit('ruling', 'departs', 'overlay', 0.9),
    },
    hatch: {
      rule: 'one-slope',
      slope: -45,
      slopeTolerance: 18,
      gap: [0.6, 1.3],
      cross: false,
      crossAt: 0.8,
      crossAngle: 90,
      bow: -1,
      reach: 8,
    },
    envelope: {
      wCv: [0.1, 0.7],
      tremor: [0.002, 0.04],
      poolRate: [0.1, 0.85],
      starved: [0, 0.2],
      hues: 2,
    },
    letter: { font: 'futural', height: 3, mirror: false },
    sources: [
      'ideas/studio-dawn/dawn.md: night shows the nightminds; eye.md open question 8 (a night paper) — founder decision pending',
      'founder reference 2026-11-05: an axis sphere in white on black (hidden circles dashed, axes named at both ends, turn arrows)',
      'TOKENS: paper color.dawn.navy, ink color.dawn.departs — no new token',
    ],
  },
};

export const style = (id: StyleId): StyleSpec => STYLES[id];

/**
 * The same manner on another sheet or in another ink: e.g. the architect's rendering on
 * the old paper takes iron-gall (design-tokens: Dawn Light takes iron-gall ink). Only the
 * drawing roles change ink; construction and the rubric overlay keep theirs.
 */
export function restyle(
  s: StyleSpec,
  o: { ink?: InkId; paper?: PaperId; name?: string },
): StyleSpec {
  const roles: Record<string, RoleKit> = {};
  for (const [role, k] of Object.entries(s.roles)) {
    if (!k) continue;
    const drawing =
      k.layer === 'ink' ||
      k.layer === 'letter' ||
      k.layer === 'wash' ||
      (k.layer === 'overlay' && k.ink !== 'rubric');
    roles[role] = o.ink && drawing ? { ...k, ink: o.ink } : k;
  }
  return {
    ...s,
    name: o.name ?? s.name,
    paper: o.paper ?? s.paper,
    roles: roles as StyleSpec['roles'],
  };
}
