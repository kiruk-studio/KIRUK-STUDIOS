/**
 * The two papers of the dawn — kiruk's colour meaning.
 *
 * Arun means dawn. The studio works in the hour between the hand and the code:
 *   old  Dawn Light   the glow when yellow seeps in — the sheet the hand drew on,
 *                     iron-gall ink, it carries its years
 *   new  Dawn Departs the blue before sunrise — the sheet the code draws on,
 *                     navy ink, crisp, no age
 * Same eye, same lines, two papers: the plate shows where an idea comes from and
 * where it goes. Names and taglines: names.color.pizza.
 *
 * Tokens: color.dawn.{light,departs,iron-gall,navy} and color.sheet.{old,new}.{paper,ink}
 * (packages/design-system/tokens; requirement: design-tokens "Dawn paper pair").
 * spec-link: ideas/studio-dawn/eye.md — the dawn
 */
export const DAWN = {
  old: {
    key: 'old',
    name: 'Dawn Light',
    hex: '#fadfa9',
    ink: '#231a14',
    tagline: 'Soft morning glow, when darkness starts to lift and yellow seeps in.',
    meaning: 'The old paper: where the hand drew. Iron-gall ink, and the years on the sheet.',
  },
  new: {
    key: 'new',
    name: 'Dawn Departs',
    hex: '#ccffff',
    ink: '#1d1c2d',
    tagline: 'Morning’s first pale breath, the blue before sunrise.',
    meaning: 'The new paper: where the code draws. Navy ink, crisp, no age.',
  },
} as const;
