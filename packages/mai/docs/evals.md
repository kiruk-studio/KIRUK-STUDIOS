# Evals: does a skill change what an agent does?

A skill earns its place only if an agent draws a better plate with it than without it. mai tests that two ways. The mechanised evals run on every commit and prove that each rule has a check with teeth. The agent evals run by hand after a skill changes and prove that the skill moves an agent.

Source of truth for the mechanised evals: [`test/evals.test.ts`](../test/evals.test.ts). This page explains it.

## 1. The mechanised evals

Each scenario takes one rule from a skill and builds two plates. The RED plate breaks the rule the way an agent would. The GREEN plate follows it. The critic check named in the row must return the expected status on RED and `pass` on GREEN. If a check stops catching its RED plate, the rule has no teeth, and the test fails.

Run them with `pnpm --filter @kiruk/mai test`.

| Id   | Skill                | Rule                                                                                                | Check                 | What RED does                                                         | RED is |
| ---- | -------------------- | --------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------- | ------ |
| E-1  | `/kiruk-mai`         | Never type a value: `dimension()` measures it from the ink.                                         | `measure.true:d`      | Types "120 mm" over a 100 mm edge                                     | fail   |
| E-2  | `/kiruk-mai`         | Every construction says what it generated.                                                          | `connect.generative`  | Rules an orphan construction line that generates nothing              | fail   |
| E-3  | `/kiruk-mai`         | List the parts; every part is drawn, keyed, noted and measured as declared.                         | `create.anatomy`      | Declares a part keyed A and measured by a dimension that is not there | fail   |
| E-4  | `/kiruk-mai`         | Codex tone is one slope, never crossed.                                                             | `style.no-cross`      | Lays a second hatch family across the first on a codex sphere         | fail   |
| E-5  | `/kiruk-mai-measure` | The overall stands outside, a tier (≥ 6 mm) beyond the inner dimensions.                            | `measure.tier-gap`    | Sets the overall 2 mm beyond the inner dimension                      | fail   |
| E-6  | `/kiruk-mai-measure` | What is behind is dashed.                                                                           | `line.hidden`         | Draws a hidden edge solid                                             | fail   |
| E-7  | `/kiruk-mai-measure` | A long axis is a chain line, named where it leaves the figure.                                      | `connect.axes-named`  | Draws a 140 mm chain axis with no name at either end                  | warn   |
| E-8  | `/kiruk-mai-measure` | A value is type: letter it in the type ink (rubric #983A22), never the line red.                    | `type.value-ink`      | Letters a value in `rubric`, the line red                             | fail   |
| E-9  | `/kiruk-mai-measure` | The figure states its overall size: an overall dimension or a graduated frame.                      | `measure.outer`       | Dimensions a part of the edge, never the whole                        | warn   |
| E-10 | `/kiruk-mai-measure` | An angle is measured from its rays.                                                                 | `measure.angle:ang`   | Types "45°" over rays that make about 29°                             | fail   |
| E-11 | `/kiruk-mai-proof`   | A character with no glyph is a fail, never a silent blank.                                          | `type.glyphs`         | Letters "Σ = 12"; the subset has no Σ                                 | fail   |
| E-12 | `/kiruk-mai-proof`   | A label sits within 8 mm of its point, or a leader joins them.                                      | `type.near`           | Sets key B over 30 mm from its point, with no leader                  | warn   |
| E-13 | `/kiruk-mai-style`   | On the modern sheet the overlay is exact: the drawing keeps the hand, the line keeps its precision. | `style.overlay-crisp` | Rules an overlay line by hand (`guide: 'ruler'`) instead of `exact`   | fail   |

Every eval runs on the `dawn-new` sheet except E-4, which runs on `codex`. To add one, add a scenario to `test/evals.test.ts` and a row here; a new style also adds a row (see `/kiruk-mai-style`).

## 2. The agent evals

The mechanised evals prove the critic can tell a broken rule from a kept one. They do not prove that a skill makes an agent keep it. The agent evals do (ways-of-working decision 9).

**Briefs.** Three or four realistic briefs per skill, written the way the founder would ask:

| Skill                | Briefs                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/kiruk-mai`         | "A codex plate of a lit eye." · "Draw the volute's construction, with its parts keyed." · "A plate of the eye's three axes on Dawn Light." |
| `/kiruk-mai-measure` | "Measure this UI card." · "Give Plate IV its outer measurement." · "Dimension the sphere specimen: overall, angles and axes."              |
| `/kiruk-mai-style`   | "Add a style from this engraving." · "Turn the founder's graphite wheel into a style." · "Put the architect on the night sheet."           |
| `/kiruk-mai-proof`   | "Proof this plate." · "Is Plate III ready for the founder?" · "Read the anomalies specimen at 4× and say what is fake."                    |

**Procedure.**

1. **RED.** A fresh subagent gets the brief with the skill forbidden (it may read the code, not the skill or its `docs/parts/` pages). It draws or reviews, and the plate is proofed.
2. **GREEN.** Another fresh subagent gets the same brief with the skill loaded.
3. **Score** both:
   - the critic: the count of fails and warns in `report.json`;
   - a short rubric, one point each: the claim is true and specific; every part is listed and complete; nothing is measured off the ink; the review names the crop it read; the open questions go to the founder rather than being decided.
4. **Record** the scores in the table below with the date, the skill's commit and the brief.

**The rule.** After any edit to a skill, run its briefs again. The GREEN scores must not drop. A drop means the edit took out a rule that was working; put it back or explain the trade in the ledger.

### Scores

| Date | Skill | Commit | Brief | RED (fails · warns · rubric) | GREEN (fails · warns · rubric) |
| ---- | ----- | ------ | ----- | ---------------------------- | ------------------------------ |
|      |       |        |       |                              |                                |

No agent eval has been run yet.
