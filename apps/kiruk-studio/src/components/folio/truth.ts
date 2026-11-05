/**
 * truth — every number and claim the folio's plates draw, with its source.
 * Nothing on a plate is invented: if it is not here, it is not on the sheet
 * (codex step 2). Values that do not exist yet are left off, not guessed.
 *
 * spec-link: .claude/skills/kiruk-codex/SKILL.md — Steps 1–2 (claim, truth)
 * spec-link: ideas/studio-dawn/folio.md
 */

export const STUDIO = {
  name: 'kiruk',
  line: 'An art + code studio.',
  email: 'arunkumaar.srinivasan@gmail.com', // ideas/studio-dawn/plan.md §1 Contact
  github: 'https://github.com/kiruk-studio/KIRUK-STUDIOS',
  instagram: 'https://instagram.com/kirukism',
  year: 2026,
} as const;

/** Plate I — the five passes of a kiruk sheet. Source: .claude/skills/kiruk-sheet/SKILL.md "Five passes". */
export const PASSES = [
  {
    key: 'A',
    letter: 'k',
    name: 'Scribble',
    note: 'The hand looks for the letter before it knows it. Faint, fast, a little wrong.',
  },
  {
    key: 'B',
    letter: 'i',
    name: 'Rule',
    note: 'Ruler and compass fix where it stands: baseline, x-height, the stem’s two edges. The eye dots the i.',
  },
  {
    key: 'C',
    letter: 'r',
    name: 'Ink',
    note: 'One quill. The stroke swells on the side away from the light, which comes from the upper left.',
  },
  {
    key: 'D',
    letter: 'u',
    name: 'Rubric',
    note: 'A second hand, in red, says what was measured. It never edits the ink.',
  },
  {
    key: 'E',
    letter: 'k',
    name: 'Live',
    note: 'On screen the last letter answers back. Hover it, or hold the page to the light.',
  },
] as const;

/**
 * Plate II — Desirable's parametric table.
 * Source: ~/KIRUKULAM/Desirable — packages/store/src/furniture-store.ts (TEMPLATE_DEFAULTS.table,
 * DIMENSION_LIMITS, OPTION_DEFAULTS.table, OPTION_LIMITS), packages/logic/src/blueprint.ts
 * (leg inset = legSize / 2 + 2, legHeight = height − topThickness),
 * packages/logic/src/validation.ts (glass-width-limit: glass and width > 200 → error).
 * Case study: https://www.behance.net/gallery/238164813/Desirable
 */
export const DESIRABLE = {
  url: 'https://www.behance.net/gallery/238164813/Desirable',
  unit: 'cm',
  width: { value: 120, min: 30, max: 300 },
  depth: 80,
  height: 75,
  top: 3, // tableTopThickness
  leg: 5, // legThickness
  insetFormula: 'S = L/2 + 2',
  inset: (leg: number) => leg / 2 + 2,
  legHeight: (height: number, top: number) => height - top,
  materials: ['oak', 'walnut', 'glass', 'metal', 'fabric'] as const,
  glassLimit: 200, // glass-width-limit
  human: 170, // HumanReference: 1.7 m figure for scale
} as const;

/**
 * Plate III — the Inktober ISM series. Source: ideas/ism-inktober/README.md "Concepts so far".
 * Posted daily to Instagram (@kirukism) in October 2026.
 */
export const ISMS = [
  {
    day: '7',
    cap: 'V',
    name: 'Vibeism',
    idea: 'A mirror for your values next to a company’s values, so people find places where they’ll stay.',
  },
  {
    day: '8',
    cap: 'I',
    name: 'Inviteism',
    idea: 'Turn a pitch into an invitation made for one specific person.',
  },
  {
    day: '9',
    cap: 'O',
    name: 'Onceism',
    idea: 'See every story once, from the original source, with copies filtered out.',
  },
  {
    day: '10–11',
    cap: 'T',
    name: 'Turtleism',
    idea: 'Slow at the start, fast at the end: ask, answer, dissect and intersect before building.',
  },
  {
    day: '12',
    cap: 'E',
    name: 'Edibilism',
    idea: 'Food that isn’t toxic: judge it before tasting, rate it honestly after eating.',
  },
] as const;

/**
 * Pacioli, De divina proportione (Venice, 1509): each Roman capital is built in a
 * square; the thick stroke is one ninth of the letter's height. Leonardo drew the
 * book's solids. Thin strokes are taken as a third of the thick (a working value,
 * stated on the plate as such).
 */
export const PACIOLI = { stemOfHeight: 1 / 9, thinOfStem: 1 / 3 } as const;

/** Plate IV — the framework line. Source: ideas/studio-dawn/plan.md §1 "Framework page". */
export const FRAMEWORK = {
  status: 'Researching, wait a moment.',
  line: 'It unlocks the other person’s idea the way a child would, frames it many ways, and brings it to life as a story.',
} as const;

/**
 * Plate V — laid paper. Hand moulds of Leonardo's time carried close-set laid wires and
 * wide chain wires; pulp settles thinner over every wire, which is why the lines show
 * against the light, and a wire figure sewn on the mould leaves the maker's watermark.
 * On this page: chain wires follow the layout's columns, laid wires run every 4 CSS px
 * (≈ 1 mm at 96 dpi), and the watermark is the kiruk logogram.
 */
export const PAPER = {
  laidPx: 4,
  laidNote: '≈ 1 mm at 96 dpi',
  watermark: 'the kiruk eye',
} as const;
