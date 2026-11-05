# The critic

**Modules:** `src/critic/critic.ts` (`critique`, `reportMarkdown`), `src/critic/pixels.ts` (`pixelFacts`), `src/node/proof.ts` (`proofPlate`), `scripts/proof.ts` · **Calculus:** bench 6 ("One plate, counted") · **Checks:** all of them, listed in [`../checks.md`](../checks.md) · **Ledger:** MA-9, MA-13, MA-14, MA-15, MA-17, MA-18, MA-25, MA-29, MA-30

Every plate is proved before anyone is asked to look at it. The critic reads the plate's own records (marks with their stats, texts, dimensions, angles, neatlines, constructions, forms, parts, facts) and, in a proof, the rendered pixels, and ends every check in a number, a target and a reason with its source. It hunts two families of failure on purpose: the plotter (constant width, butt ends, no tremor, even hatching, exact joins, no dip rhythm) and the costume (the look without the reasons: faux age, unreadable mirror notes, ornamental geometry, blots everywhere). Creativity cannot be computed: the critic checks its preconditions and always leaves one item open for the founder.

## The calculation

| Quantity | Rule                                                                                                                                                                                                         | Notes                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Check    | `{ id, dimension, title, status, value, target, why, fix?, where? }`                                                                                                                                         | eight dimensions: lighting, measurement, style, connections, typography, bleed, layout, creativity                                    |
| Status   | `pass`, `warn`, `fail`, `human` (printed LOOK)                                                                                                                                                               | `create.founder` is always `human`                                                                                                    |
| Verdict  | `fail` if any check fails, else `warn` if any warns, else `pass`                                                                                                                                             | a LOOK never changes the verdict                                                                                                      |
| Report   | `{ plate, title, style, verdict, checks, anatomy, counts, stats }`                                                                                                                                           | `counts[dimension][status]`; stats: marks, ink strokes, hatch fields, texts, dimensions, constructions, forms, the smallest hatch gap |
| Bake     | `plate.png` at `--px` px/mm (default 5; committed proofs use 4)                                                                                                                                              | plus an ink-only raster on a flat paper tone, for the pixel facts                                                                     |
| Contrast | a second raster at `max(px, 12)` px/mm; per label, paper = the median luminance of a 1.2 mm ring round its box, ink = the pixel 6% from the top in departure from the paper; `(L_max + 0.05)/(L_min + 0.05)` | at 12 px/mm a 0.25 mm stroke is 3 px: the ink as laid, not the screen's antialiasing (MA-17, MA-25)                                   |
| Centroid | darkness-weighted centre of the ink-only raster, darkness = departure from the paper's luminance                                                                                                             | light ink on the night sheet counts (MA-25)                                                                                           |
| White    | share of 5 mm cells inside the margins with mean departure < 0.015                                                                                                                                           | see [`layout.md`](layout.md)                                                                                                          |
| Phone    | `phone.png` at 390 px wide (rendered at 2× density)                                                                                                                                                          | `type.phone` reads the same width                                                                                                     |
| Crops    | at 20 px/mm, at most 40 × 28 mm: `hatch` (the densest hatching), `pool` (a pooled contour start), `dimension` (the first), `letter` (a drawn key or numeral)                                                 | where a plotter or a costume shows first                                                                                              |
| Exit     | `scripts/proof.ts` exits 1 on any fail; with `--strict`, on any warn too                                                                                                                                     | 2 on a usage error                                                                                                                    |

## Driving it

- In code: `critique(plate, { pixels?, phoneWidthPx? })` → `Report`. Without `pixels` it still runs: the contrast is estimated from the colour of typeset text only, the centroid comes from the marks, and `layout.white` is skipped. Why: the calculus page and the tests run without a browser; a proof is the only verdict that counts (codex KC-8: an estimate once signed off 5:1 that measured 4.04:1).
- `proofPlate(plate, dir, { pxPerMm = 5, cropPxPerMm = 20, phoneWidthPx = 390, paperFile, contrastPxPerMm = 12 })` → `{ report, dir, files }`. It writes `plate.svg`, `paper.png` (unless `paperFile: false`), `plate.png`, `phone.png`, `crops/*.png`, `report.json` and `report.md`.
- From the repo root: `node packages/mai/scripts/proof.ts <plate-module.ts> [out-dir] [--px 5] [--strict] [--commit]`. The module's default export returns a Plate. `--commit` drops `paper.png` (heavy and regenerable; the SVG carries a flat paper tone). Committed proofs: `--px 4 --commit`. Proofs need Playwright and Chromium (`src/node/raster.ts`).
- Read a report in this order:
  1. Fix every FAIL. Change the cause (geometry, instrument, ink, pressure), never the check. Why: a check bent to pass stops guarding the miss it was written for.
  2. Fix every WARN, or explain it in the plate's `NOTES.md`. Why: a warn left unexplained becomes a habit; Plates III and IV each carry one explained warn (`type.phone`).
  3. Read the 4× crops with `/kiruk-mai-proof`'s seven questions. Why: the numbers passed leaves along a canalis once (MA-5); the eye at 4× is the check the critic cannot be.
  4. Hand the LOOK items to the founder. Why: non-negotiables 1–3 (no trend-chasing, no boring work, no shallow branding) cannot be computed.
- When the critic is wrong, fix the critic and add a ledger row and a test. Why: a false fail teaches the plate to dodge the rule (MA-9, MA-13, MA-14, MA-15, MA-18); a check named in the docs but missing from the code is a promise nobody keeps (MA-29, MA-30).

## What the critic reads

Everything: the full list, with each target and why, is in [`../checks.md`](../checks.md). By part: the hand in [`hand.md`](hand.md), the pen in [`pen.md`](pen.md), tone in [`light.md`](light.md), line types in [`line-types.md`](line-types.md), measurement in [`measure.md`](measure.md) and [`outer.md`](outer.md), lettering in [`letter.md`](letter.md), the sheet in [`layout.md`](layout.md), the parts in [`anatomy.md`](anatomy.md).

## Sources

- Research: `ideas/kiruk-codex/research/01-leonardo.md` §5 (the named fakes); codex KC-8 (contrast on real pixels)
- Code: `src/critic/critic.ts`, `src/critic/pixels.ts`, `src/node/proof.ts`, `scripts/proof.ts`; tests `test/critic.test.ts`, `test/outer.test.ts`, `test/evals.test.ts`
- Skill: `/kiruk-mai-proof` (the 4× look)
- Proofs: `ideas/kiruk-codex/plates/plate-03-volute/proof/`, `plate-04-axes/proof/`
- Ledger: [`../ledger.md`](../ledger.md)
