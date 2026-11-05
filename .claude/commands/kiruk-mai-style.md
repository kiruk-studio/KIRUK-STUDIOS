---
description: Turn a reference image (a historic page, an engraving, a construction study, a founder's sketch) into a measured mai style. Measure the instruments, inks, paper, line widths, hatching, construction, lettering, layout, light and anomaly rates, then encode them as a StyleSpec, test it on a specimen plate, and set the critic's envelope. Use when the founder shares references and asks for that look, or when a plate needs a manner the six built-in styles do not cover.
argument-hint: <reference (path or description)> <style id to create or extend>
---

# /kiruk-mai-style: a reference becomes a measured style

A style is a manner written as numbers with its sources, never a mood board. If you cannot measure it, it is not in the style yet.

**Argument:** `$ARGUMENTS` = the reference and the style id. Check the six built-in styles in [`packages/mai/docs/styles.md`](../../packages/mai/docs/styles.md) first. Extending one with `restyle()`, or adding a few fields, beats a new style.

## Never

- **Commit the reference image.** References by other artists stay local (`.gitignore`: `ideas/studio-dawn/references/*`). Write down the measurements and a citation (title, artist, collection or URL, and which part you measured).
- **Copy a living artist's specific work.** Measure the manner (instrument, slope, density, construction habit), never their composition or subject.
- **Encode decay as style.** Stains, foxing, burns and halos are time, not manner (01 §1, R14). Only `time` with a reason may add them, plate by plate.

## Measure (with the image open)

Record each item with its method: "counted 20 hatch lines across 14 mm", "the line at its widest is 1/180 of the sheet width". If the physical size is unknown, measure as fractions of a known feature and say so.

| Field           | What to measure                                                                                                                                                                     | Becomes                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Medium per role | Contour, hatch, construction and lettering: pen (quill, reed, steel), brush, graphite, chalk, metalpoint, burin, stylus?                                                            | `roles[role].instrument`                                                         |
| Ink and colour  | Mass tone of a full stroke and of a starved one; any accent; how many hues                                                                                                          | `roles[role].ink` (existing inks first); `envelope.hues`                         |
| Paper           | Tone, laid or wove, tooth (does dry media break?), sizing (do strokes feather?)                                                                                                     | `paper` (or a new `PaperSpec` with `source`)                                     |
| Width           | Thinnest and widest ink line; the contour/hatch/construction ratio                                                                                                                  | Instrument `w0/w1`; check the 02 R14 hierarchy                                   |
| Width variation | Does one stroke swell? Estimate the CV over 10 strokes                                                                                                                              | `envelope.wCv`                                                                   |
| Hatching        | Rule (one slope everywhere, or one per surface); slope in degrees (y down); gap range (count lines per mm); stroke length; crossing (where, at what angle); bow; direction of taper | `hatch.rule, slope, slopeTolerance, gap, reach, cross, crossAt, crossAngle, bow` |
| Hand            | Left or right (slope, hook side); confident (smooth) or searching (repeated)?                                                                                                       | `hand` (from `HANDS`) and `tremor`, `pace`                                       |
| Construction    | Ruled, compass or stylus? Numbered points? Overshoot length? Density relative to the ink?                                                                                           | `roles.construction`, `roles.underdrawing`                                       |
| Anomalies       | Which specimen numbers appear, and how often (pools per 100 strokes, starved runs, feathering)?                                                                                     | `envelope.poolRate`, `envelope.starved`, instrument and ink knobs                |
| Lettering       | Script, roman or technical; cap height relative to the sheet; mirror?                                                                                                               | `letter.font`, `letter.height`                                                   |
| Light           | Where the shadows fall                                                                                                                                                              | The plate's `light` (styles do not own the light)                                |
| Layout          | Margins, columns, how text sits by the figure, white space                                                                                                                          | Notes for `/kiruk-mai` step 7, not the style                                     |

## Encode

1. Add the style to `packages/mai/src/styles/styles.ts`:
   - Give it a new `StyleId` and a `STYLES` entry.
   - The `summary` is one sentence on the manner's logic, not its look.
   - In `sources`, each line cites a research section or `reference: <citation> — <what was measured>`.
   - Mark every unmeasured value `WORKING VALUE`.
2. Envelope: set the critic bounds to the measured value ± a tolerance (width CV ± 30%, tremor ±50%, slope tolerance 2σ of the measured slopes).
3. A new ink or paper goes into `src/ink/inks.ts` or `src/paper/paper.ts` with a `source`. It is never a design token; promoting one needs a design-tokens OpenSpec proposal (non-negotiable 5).

## Test (side by side)

1. Write `packages/mai/plates/style-<id>.ts`, a small specimen in the new style: a sphere and a cylinder under the one light, a ruled construction with overshoot, two dimensions, three keys and a note.
2. Proof it with `/kiruk-mai-proof`. It must have 0 FAIL, against an envelope built from the reference itself.
3. Compare its 4× crops with the reference at the same printed scale: line ends, joins, gaps, slope, density, and the anomaly rates. Write three differences, and fix the two largest by changing knobs, not by faking marks.
4. Add `docs/styles.md` rows: the table line and the reference's row in "The founder's references, mapped".
5. Show the founder the specimen beside the reference (described or held locally, not committed) before any real plate uses the style.

## Done means

- The style typechecks and the specimen shows 0 FAIL.
- Every field has a source or `WORKING VALUE`.
- No reference image is in git.
- There is a CHANGELOG line, and a ledger row for anything that surprised you.
