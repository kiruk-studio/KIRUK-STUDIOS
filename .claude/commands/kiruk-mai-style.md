---
description: Turn a reference image (a historic page, an engraving, a construction study, a founder's sketch) into a measured mai style. Measure the instruments, inks, paper, line widths, hatching, construction, lettering, layout, light and anomaly rates, then encode them as a StyleSpec, test it on a specimen plate, and set the critic's envelope. Use when the founder shares references and asks for that look, or when a plate needs a manner the seven built-in styles do not cover.
argument-hint: <reference (path or description)> <style id to create or extend>
---

# /kiruk-mai-style: a reference becomes a measured style

A style is a manner written as numbers with their sources, never a mood board. If you cannot measure it, it is not in the style yet. _Why:_ the critic holds every plate to its style's envelope; an unmeasured value becomes a target nobody can defend.

**Argument:** `$ARGUMENTS` = the reference and the style id. Check the seven built-in styles in [`docs/styles.md`](../../packages/mai/docs/styles.md) first. Extending one with `restyle()`, or changing a few fields, beats a new style. _Why:_ every new style is one more envelope, specimen and eval to keep true.

How each part a style sets behaves is in the parts pages: [hand](../../packages/mai/docs/parts/hand.md), [pen](../../packages/mai/docs/parts/pen.md), [paper](../../packages/mai/docs/parts/paper.md), [light](../../packages/mai/docs/parts/light.md), [letter](../../packages/mai/docs/parts/letter.md). Load the one a field touches.

## Never

- **Commit the reference image.** References by other artists stay local (`.gitignore`: `ideas/studio-dawn/references/*`). Write down the measurements and a citation (title, artist, collection or URL, which part you measured).
- **Copy a living artist's specific work.** Measure the manner (instrument, slope, density, construction habit), never their composition or subject.
- **Encode decay as style.** Stains, foxing, burns and halos are time, not manner (01 §1, R14). Only `time` with a reason may add them, plate by plate.
- **Make a new ink or paper a design token.** It goes into `src/ink/inks.ts` or `src/paper/paper.ts` with a `source`; promoting one needs a design-tokens OpenSpec proposal (non-negotiable 5).

## The procedure (in this order)

### 1 · Measure (with the image open)

Record each item with its method: "counted 20 hatch lines across 14 mm", "the line at its widest is 1/180 of the sheet width". If the physical size is unknown, measure as fractions of a known feature and say so. _Why:_ a number without its method cannot be re-measured when the specimen disagrees with the reference.

| Field           | What to measure                                                                                                                                                                     | Becomes                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Medium per role | Contour, hatch, construction and lettering: pen (quill, reed, steel), brush, graphite, chalk, metalpoint, burin, stylus?                                                            | `roles[role].instrument`                                                         |
| Ink and colour  | Mass tone of a full stroke and of a starved one; any accent; how many hues                                                                                                          | `roles[role].ink` (existing inks first); `envelope.hues`                         |
| Paper           | Tone (light or dark?), laid or wove, tooth (does dry media break?), sizing (do strokes feather?)                                                                                    | `paper` (or a new `PaperSpec` with `source`)                                     |
| Width           | Thinnest and widest ink line; the contour/hatch/construction ratio                                                                                                                  | Instrument `w0/w1`; check the 02 R14 hierarchy                                   |
| Width variation | Does one stroke swell? Estimate the CV over 10 strokes                                                                                                                              | `envelope.wCv`                                                                   |
| Hatching        | Rule (one slope everywhere, or one per surface); slope in degrees (y down); gap range (count lines per mm); stroke length; crossing (where, at what angle); bow; direction of taper | `hatch.rule, slope, slopeTolerance, gap, reach, cross, crossAt, crossAngle, bow` |
| Hand            | Left or right (slope, hook side); confident (smooth) or searching (repeated)?                                                                                                       | `hand` (from `HANDS`) and `tremor`, `pace`                                       |
| Construction    | Ruled, compass or stylus? Numbered points? Overshoot length? Density relative to the ink?                                                                                           | `roles.construction`, `roles.underdrawing`                                       |
| Anomalies       | Which specimen numbers appear, and how often (pools per 100 strokes, starved runs, feathering)?                                                                                     | `envelope.poolRate`, `envelope.starved`, instrument and ink knobs                |
| Lettering       | Script, roman or technical; cap height relative to the sheet; mirror?                                                                                                               | `letter.font`, `letter.height`                                                   |
| Light           | Where the shadows fall                                                                                                                                                              | The plate's `light` (styles do not own the light)                                |
| Layout          | Margins, columns, how text sits by the figure, white space                                                                                                                          | Notes for `/kiruk-mai` step 1, not the style                                     |

### 2 · Encode

1. Add the style to `packages/mai/src/styles/styles.ts`: a new `StyleId` and a `STYLES` entry. The `summary` is one sentence on the manner's logic, not its look. Each `sources` line cites a research section or `reference: <citation> — <what was measured>`. Mark every unmeasured value `WORKING VALUE`.
2. Envelope: the critic bounds are the measured value ± a tolerance (width CV ± 30%, tremor ± 50%, slope tolerance 2σ of the measured slopes), and `starved` is read by `style.starved` (MA-30). _Why:_ an envelope copied from another style passes plates that do not look like the reference.
3. **An ink for strokes only names its type twin.** If an ink the style uses for `dimension`, `leader` or `overlay` is reserved for strokes (as `rubric` is: rubric-line #B5462B, never text), give it `typeInk: '<the ink for type>'`. _Why:_ `valueInk()` letters every measured value in the twin; without one, values fall back by contrast, and values in the line red read 2.9–4.1:1 on Dawn Departs (MA-17, `type.value-ink`).

### 3 · Worked example: the `night` style

The night style shows what changes when the sheet is dark. Read its entry in `styles.ts` beside these notes.

- **Paper:** `night` (token `color.dawn.navy` #1D1C2D as a sheet). No new token: paper and ink reuse existing ones.
- **Blend:** the light inks (`departs` #CCFFFF, `chalk`) have `blend: 'screen'`. _Why:_ pigments multiply onto a light sheet, but light ink multiplied onto navy would vanish; on a dark ground a light line adds light.
- **Roles:** steel pen + `departs` for contour, hatch, stipple and letter; `chalk` (a dry medium) for construction, underdrawing and searching, at density 0.35–0.45; ruling pen + `departs` for dimension, leader and overlay. _Why:_ construction must read as a lesser layer; on a dark sheet that means a paler, broken dry line, not a thinner pen.
- **Value contrast:** contrast is read as departure from the paper's luminance, not darkness (MA-25). _Why:_ the pixel facts first read light ink on dark paper as paper. Check `type.contrast` and `layout.white` on the specimen; a dark-sheet style that passes them only by luck is not done.
- **Hatching:** one slope −45°, gap 0.6–1.3 mm, never crossed, reach 8. **Hand:** right, tremor 0.014, pace 120. **Lettering:** futural, 3 mm.
- **Status:** a founder decision is pending (eye.md open question 8); a new style is the same — proposed, not adopted, until the founder says so.

### 4 · Test (side by side)

1. Write `packages/mai/plates/style-<id>.ts`, a small specimen in the new style: a sphere and a cylinder under the one light, a ruled construction with overshoot, two dimensions, three keys and a note.
2. Proof it with `/kiruk-mai-proof`: 0 FAIL against an envelope built from the reference itself.
3. Compare its 4× crops with the reference at the same printed scale: line ends, joins, gaps, slope, density, anomaly rates. Write three differences, and fix the two largest by changing knobs, not by faking marks. _Why:_ a faked mark breaks the critic's reading of its cause.

### 5 · Record it where it will be checked

1. **`docs/styles.md`:** the table row, and the reference's row in "The founder's references, mapped". Name any ink pair (line ink and its `typeInk`). _Why:_ `/kiruk-mai` picks styles from this page; a style missing from it is never chosen on purpose.
2. **`packages/mai/test/evals.test.ts`:** add a scenario for the rule that makes this style itself (its hatch rule, its overlay, its dark-sheet contrast): a RED plate that breaks the rule in the new style, a GREEN plate that follows it, and the check that tells them apart; `skill: '/kiruk-mai-style'`. Add its row to [`docs/evals.md`](../../packages/mai/docs/evals.md). Run `pnpm --filter @kiruk/mai test`. _Why:_ an eval is how the next skill edit proves it did not break this style (E-13 is the pattern).
3. **Show the founder** the specimen beside the reference (described or held locally, not committed) before any real plate uses the style.

## Done means

- The style typechecks (`pnpm --filter @kiruk/mai check-types`) and the specimen shows 0 FAIL.
- Every field has a source or `WORKING VALUE`; every strokes-only ink names its `typeInk`.
- `docs/styles.md` and `test/evals.test.ts` carry the style; the tests pass.
- No reference image is in git.
- A CHANGELOG line, and a ledger row for anything that surprised you.

## Sources

- Decision: ideas/kiruk-codex/plan.md (mai, the ink engine) and ideas/ways-of-working/proposal.md §3.3 (the anatomy of a skill)
- Promise: none yet (no openspec requirement for mai)
- Ledger: packages/mai/docs/ledger.md
- Examples: packages/mai/docs/examples.md
- References: packages/mai/docs/parts/README.md
- Evals: packages/mai/docs/evals.md, packages/mai/test/evals.test.ts
