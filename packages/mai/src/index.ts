/**
 * @kiruk/mai — kiruk's ink engine.
 *
 * மை (mai) is Tamil for ink, and for the kohl that lines an eye: the studio's motif, in
 * the name of the engine that draws it. It turns intended geometry into a performed,
 * inked, measured, lettered plate that looks generated and reads as a hand, then proves it.
 *
 *   core      seeded randomness, noise, paths, mm geometry, SVG numbers
 *   paper     the sheet as fields: tooth, fibre, absorbency (as made; age only with a reason)
 *   hand      the motor model: power-law speed, tremor, drift, hooks, tails, lifts, landings
 *   nib       instruments: quill, reed, steel, broad edge, brush, graphite, chalk, silverpoint,
 *             stylus, burin, ruling pen
 *   ink       inks and the anomalies of the act: pools, rims, swell, starve, rails, feathers,
 *             catches, spatter, the dip rhythm, the ruler's crisp side, blind lines
 *   light     one declared light, forms, tone-calibrated hatching that follows the form
 *   measure   ruled construction, compass, points, dimensions computed from the ink, scale
 *             bars, leaders, the golden rectangle and the Ionic volute
 *   letter    single-stroke lettering by the same hand (ISO 3098 sizes), typeset notes
 *   plate     the sheet, its layers, its truth table, SVG out
 *   styles    historic manners as numbers: codex, construction, cosmograph, architect,
 *             engraver, dawn-new
 *   critic    eight dimensions of proof: lighting, measurement, style, connections,
 *             typography, bleed, layout, creativity (plus `/node` to bake and proof)
 *
 * Skills: .claude/commands/kiruk-mai.md (draw), kiruk-mai-proof.md (curate),
 * kiruk-mai-style.md (a reference into a measured style). References: packages/mai/docs/.
 * spec-link: ideas/kiruk-codex/research/ (01–03), ideas/studio-dawn/ink-bleed.md
 */
export * from './core/color.ts';
export * from './core/noise.ts';
export * from './core/path.ts';
export * from './core/rng.ts';
export * from './core/vec.ts';
export { type Check, critique, DIMENSIONS, type Report, reportMarkdown } from './critic/critic.ts';
export { pixelFacts } from './critic/pixels.ts';
export * from './hand/hand.ts';
export * from './ink/inks.ts';
export {
  describe,
  freshInk,
  type InkState,
  inkStroke,
  type MarkPart,
  type StrokeStats,
} from './ink/render.ts';
export { glyph, ISO_3098, type Lettered, letter, measureText, typeset } from './letter/letter.ts';
export * from './light/forms.ts';
export { contour, type HatchOptions, hatch } from './light/hatch.ts';
export * from './light/light.ts';
export * from './measure/constructions.ts';
export * from './measure/measure.ts';
export * from './nib/instruments.ts';
export * from './paper/paper.ts';
export * from './plate/plate.ts';
export * from './styles/styles.ts';
