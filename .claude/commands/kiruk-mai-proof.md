---
description: Curate a mai plate before anyone sees it. Run the critic over lighting, measurement, style, connections, typography, ink bleed, layout and creativity; read the numbers; look at the 4× crops for plotter and costume tells; and give a verdict with concrete fixes. Use after drawing with /kiruk-mai, when reviewing any illustration made with packages/mai, or when asked whether a plate is ready, looks hand-made, or is correct.
argument-hint: <path to plate module, e.g. packages/mai/plates/volute.ts> [out-dir]
---

# /kiruk-mai-proof: curate a plate

The studio serves creative people, so a plate is checked in every element before anyone is asked to look. The review runs in a fixed order and skips no step: numbers first, because the eye is easily charmed; the eye second, because the numbers miss shape (MA-5); the founder last.

**Argument:** `$ARGUMENTS` = the plate module, and optionally an output folder. The default output is `<module folder>/proof`; for a committed plate it is `ideas/kiruk-codex/plates/plate-NN-<name>/proof`.

**The rule of evidence:** every finding you report ends in a number, an exit code or a 4× crop. _Why:_ "looks fine" cannot be re-checked by the next reader; a check id with its value, or a named crop, can. How the critic computes each check, and how to read the report, is in [critic](../../packages/mai/docs/parts/critic.md); every check's target and why is in [`checks.md`](../../packages/mai/docs/checks.md). Do not restate them — cite the id.

## The review (in this order)

### 1 · Run the proof

Run it yourself, even when the drawer already reports a verdict. _Why:_ a review that accepts the builder’s numbers reviews nothing; the anatomy method has reviewers rebuild and re-audit, and repeat rounds until one finds nothing.

```bash
node packages/mai/scripts/proof.ts $ARGUMENTS --commit
```

Proofs need Playwright + Chromium resolvable from Node (see `TASKS.md` §1 or the package README). The proof writes `report.md`, `report.json`, `plate.png`, `phone.png` (390 px), `plate.svg` and four crops at 20 px/mm in `crops/`: `hatch`, `pool`, `dimension`, `letter`. `report.md` lists each check by title, value and target, grouped by dimension; the check ids are in `report.json`. The exit code is 1 on any FAIL (`--strict`: on any WARN too). Record the exit code.

### 2 · Read the verdict

The first lines of `report.md`: verdict, check count, fails, warns. The verdict is FAIL if any check fails, else WARN if any warns. Write the counts down now; they go into the verdict line and the NOTES.

### 3 · Every FAIL

A FAIL means the plate cannot be shown. Fix the cause in the plate, or in the engine if the engine is wrong — never in the critic. _Why:_ moving the target hides the miss. If the critic itself is wrong (MA-9, MA-10, MA-13, MA-15, MA-18 were), fix the critic, add a ledger row and a test, and say so in your reply.

### 4 · Every WARN

Fix it, or write one line in `NOTES.md` saying why it stands. _Why:_ an unexplained WARN becomes invisible on the next proof. Example: `type.phone` on a landscape plate is resolved by a phone layout, not by shrinking the plate.

Read these by name even when they pass — they are the round-two checks, and the easiest to miss:

- **Measurement:** `measure.outer`, `measure.tiers-order`, `measure.tier-gap`, `measure.neatline:<id>`, `measure.angle:<id>`, plus `measure.true` / `measure.on-ink` on every redline. Rules: `/kiruk-mai-measure`.
- **Line types:** `line.hidden`, `line.dashes`, `connect.axes-named`.
- **Type:** `type.contrast` is read on a **12 px/mm** raster (a stroke is 3 px there), and names the lowest label — read that label's ratio, not only the status. _Why:_ at 4 px/mm a 0.2 mm stroke is one antialiased pixel and the reading lied (MA-17). `type.value-ink` (values in the type red), `type.near` (≤ 8 mm or a leader), `type.blots` (pool ≤ 0.32 × cap; MA-16), `type.glyphs` (any missing glyph fails; MA-24).
- **Style:** `style.starved` (MA-30).

Typical causes and the fix that removes them:

| Failing check                      | Usual cause                                          | Fix                                                                                               |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `light.follows` low ρ              | Tone hand-placed, or spans dropped in a narrow form  | Lay tone with `hatch({ form })`; set `minSpan` in narrow forms, or use lines that follow the form |
| `light.lit-clear`                  | A threshold set too low                              | Raise `threshold` (0.2 → 0.3)                                                                     |
| `measure.true`                     | A typed label                                        | Remove `text:` and let `dimension()` measure                                                      |
| `measure.on-ink`                   | A bounding box, a construction point, a round corner | Measure from drawn ink; a rounded box at its tangent points (MA-19)                               |
| `measure.tier-gap`                 | Overall set by hand next to an inner value           | `extents()` (steps 8 mm beyond what stands on that side; MA-23)                                   |
| `measure.outer`                    | No overall size                                      | `extents()` or `neatline()` (`/kiruk-mai-measure` steps 5–6)                                      |
| `line.hidden`                      | An edge behind a form drawn solid                    | `line: 'dashed'` with `hidden: true`                                                              |
| `connect.axes-named`               | A chain-line axis with no label at an end            | Name it at both ends (A … A′)                                                                     |
| `type.value-ink`                   | A value's ink set by hand to the line red            | Drop the ink override; `valueInk()` picks the type twin (MA-17)                                   |
| `type.glyphs`                      | A character the font lacks                           | Use a synthetic glyph (° ′ × Ø ± · – — ’ → Δ) or reword                                           |
| `type.blots`                       | Pool caps raised, or lettering on a dipping pen      | Leave the letter pool cap (0.7 × line width) alone; change the pen, not the pool                  |
| `style.width` (below the envelope) | Ruled or exact guide used for the drawing            | `guide: 'free'` for drawing roles; keep `ruler` for construction and straight edges               |
| `style.ends`                       | `end: 'lift'` everywhere                             | Hatch ends `taper`; contours end `hook`                                                           |
| `style.slope` (codex)              | The style's slope overridden                         | Remove `slope:`. Codex hatching is the left hand's "\\"                                           |
| `style.uneven`                     | A gap jitter of 0                                    | Never pass a fixed spacing; the hand varies it                                                    |
| `connect.generative`               | Decorative circles or spirals                        | `p.generated(id, ...)` if it truly generated something, else delete it                            |
| `type.clear-ground`                | A key placed on hatching                             | Move it to clear paper with a leader (02 R5)                                                      |
| `bleed.pools` > 40%                | Every stroke starting with `dip`                     | Let the scribe dip (`start` default); hatches start with `touch`                                  |
| `layout.rise` > 52%                | Heavy tone low on the sheet                          | Raise the figure, shorten the base, or lighten low tone                                           |

### 5 · The anatomy table

`report.md` ends with `## Anatomy`, one row per `p.part`. A complete part says `complete`; an incomplete one lists its issues in the Status column (not drawn, not inked, no tone on its form, key missing from the drawing, no note starting with the key, a measure id that does not exist, unmeasured without a reason, a construction missing). _Why:_ `create.anatomy` fails the plate on any incomplete part, but only the table says which part and which issue — fix that, not the check. No parts at all is a WARN: go back to `/kiruk-mai` step 4. The fields are in [anatomy](../../packages/mai/docs/parts/anatomy.md).

### 6 · The eye: the four crops at 4×

Use [`docs/anomalies.md`](../../packages/mai/docs/anomalies.md) under "Reading a fake at 4×" and answer each question in writing, naming the crop:

- **Ends:** land on weight, taper or hook? Square ends are a plotter.
- **Joins:** gaps and slight overlaps? Eye-shaped lenses are a machine (MA-6).
- **Edges:** a slight wander and fine wisps? Thorns are a costume (MA-1); a vector edge is a plotter.
- **Rhythm:** dark after a dip, paler as it drains?
- **Short strokes:** ticks, or leaves, commas, tadpoles (MA-5)?
- **Blots:** events, or at every start (MA-4)? None filling a letter (MA-16)?
- **Dry media:** grain on a pale tone, or a barcode (MA-7)?

Then `phone.png`: can the subject be read in one glance, and which labels need a phone layout? Then the whole sheet against the eight dimensions — lighting, measurement, design style, connections, typography, ink bleed, layout, creativity (a real explanation with its own discovery, not a reskin; non-negotiables 1–3). _Why:_ every miss in the costume and plotter classes of the ledger was passed by the critic and caught here.

### 7 · LOOK items become founder questions

`create.founder`, `bleed.time` and every judgement call go to the founder as questions, not as findings. _Why:_ the critic cannot judge them, and you should not decide them alone.

## The verdict

Reply in this shape:

```
Verdict: SHOW / REVISE / REJECT   (critic: N checks, F fail, W warn; exit code E)
Findings (most severe first):
  1. [check id = value, or crop name] what is wrong → the fix (plate line or engine knob)
  …
Anatomy: P parts, all complete / incomplete: <part — issue>
Open for the founder:
  - LOOK items and judgement calls, as questions
```

- **SHOW** only with 0 FAIL, every WARN fixed or explained, the anatomy complete and the 4× look clean.
- **REVISE** when a fix is known.
- **REJECT** when the claim, the truth or the device is wrong. Return to `/kiruk-mai` step 2.

## Learning

- When the critic passed something your eye failed, add a row to [`ledger.md`](../../packages/mai/docs/ledger.md) with mistake, root cause, fix and guard. Keep the fault’s own words in the rule (“the canalis hatched as leaves”), not only the abstract rule. _Why:_ a rule that names the fault it came from is followed more reliably than a bare rule (the anatomy write-up).
- When a second row has the same class and cause, propose a critic check or skill rule as an exact diff for the founder to approve (MA-16 and MA-24 were promoted this way). Never edit a skill silently.
- A material mistake (a wrong number shown, a privacy slip) also goes into `LEARNINGS.md`.

## Sources

- Decision: ideas/kiruk-codex/plan.md (mai, the ink engine) and ideas/ways-of-working/proposal.md §3.3 (the anatomy of a skill)
- Promise: none yet (no openspec requirement for mai)
- Ledger: packages/mai/docs/ledger.md
- Examples: packages/mai/docs/examples.md
- References: packages/mai/docs/parts/README.md
- Evals: packages/mai/docs/evals.md, packages/mai/test/evals.test.ts
