---
description: Curate a mai plate before anyone sees it. Run the critic over lighting, measurement, style, connections, typography, ink bleed, layout and creativity; read the numbers; look at the 4× crops for plotter and costume tells; and give a verdict with concrete fixes. Use after drawing with /kiruk-mai, when reviewing any illustration made with packages/mai, or when asked whether a plate is ready, looks hand-made, or is correct.
argument-hint: <path to plate module, e.g. packages/mai/plates/volute.ts> [out-dir]
---

# /kiruk-mai-proof: curate a plate

The studio serves creative people, so a plate is checked in every element before anyone is asked to look. This skill has three parts in a fixed order: the **numbers**, then the **eye**, then the **verdict**. Skip none.

**Argument:** `$ARGUMENTS` = the plate module, and optionally an output folder. The default output is `<module folder>/proof`; for a committed plate it is `ideas/kiruk-codex/plates/plate-NN-<name>/proof`.

## 1 · The numbers

```bash
node packages/mai/scripts/proof.ts $ARGUMENTS --commit
```

The proof writes `report.md`, `report.json`, `plate.png`, `phone.png`, `plate.svg` and four crops: `hatch`, `pool`, `dimension` and `letter`. Read `report.md` top to bottom. Every check has a value, a target and a source (see [`packages/mai/docs/checks.md`](../../packages/mai/docs/checks.md)).

- **FAIL means the plate cannot be shown.** Fix the cause in the plate (or in the engine, if the engine is wrong), never in the critic. If the critic itself is wrong, as MA-9 and MA-10 were, fix the critic, add a ledger row, and say so in your reply.
- **For each WARN**, either fix it or write one line in `NOTES.md` saying why it stands. For example, `type.phone` on a landscape plate is resolved by a phone layout, not by shrinking the plate.
- **LOOK items** (`create.founder`, `bleed.time`) go to the founder as questions.

Typical causes and the fix that removes them:

| Failing check                      | Usual cause                                         | Fix                                                                                               |
| ---------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `light.follows` low ρ              | Tone hand-placed, or spans dropped in a narrow form | Lay tone with `hatch({ form })`; set `minSpan` in narrow forms, or use lines that follow the form |
| `light.lit-clear`                  | A threshold set too low                             | Raise `threshold` (0.2 → 0.3)                                                                     |
| `measure.true`                     | A typed label                                       | Remove `text:` and let `dimension()` measure                                                      |
| `measure.on-ink`                   | Measuring a bounding box or a construction point    | Measure from points on drawn ink                                                                  |
| `style.width` (below the envelope) | Ruled or exact guide used for the drawing           | `guide: 'free'` for drawing roles; keep `ruler` for construction and straight edges               |
| `style.ends`                       | `end: 'lift'` everywhere                            | Hatch ends `taper`; contours end `hook`                                                           |
| `style.slope` (codex)              | The style's slope overridden                        | Remove `slope:`. Codex hatching is the left hand's "\\"                                           |
| `style.uneven`                     | A gap jitter of 0                                   | Never pass a fixed spacing; the hand varies it                                                    |
| `connect.generative`               | Decorative circles or spirals                       | `p.generated(id, ...)` if it truly generated something, else delete it                            |
| `type.clear-ground`                | A key placed on hatching                            | Move it to clear paper with a leader (02 R5)                                                      |
| `bleed.pools` > 40%                | Every stroke starting with `dip`                    | Let the scribe dip (`start` default); hatches start with `touch`                                  |
| `layout.rise` > 52%                | Heavy tone low on the sheet                         | Raise the figure, shorten the base, or lighten low tone                                           |

## 2 · The eye (mandatory, in this order)

1. **The four crops at 4×.** Use [`docs/anomalies.md`](../../packages/mai/docs/anomalies.md) under "Reading a fake at 4×" and answer each question in writing:
   - **Ends:** land on weight, taper or hook? Square ends are a plotter.
   - **Joins:** gaps and slight overlaps? Eye-shaped lenses are a machine (MA-6).
   - **Edges:** a slight wander and fine wisps? Thorns are a costume (MA-1); a vector edge is a plotter.
   - **Rhythm:** dark after a dip, paler as it drains?
   - **Short strokes:** ticks, or leaves, commas, tadpoles (MA-5)?
   - **Blots:** events, or at every start (MA-4)?
   - **Dry media:** grain on a pale tone, or a barcode (MA-7)?
2. **The phone view** (`phone.png`). Can the subject be read in one glance? Which labels need a phone layout?
3. **The whole sheet**, against the eight dimensions:
   - **Lighting.** Does every shadow fall away from one light? Is the core shadow on the terminator, with reflected light at the far rim? Does a cast shadow touch its object?
   - **Measurement.** Does every number match its line? Is the unit stated? Is the scale bar sane for the subject?
   - **Design style.** One manner throughout? No cross-hatching in a codex? Does the overlay alone stay exact?
   - **Connections.** Do lines meet near, not on? Are hidden parts hidden behind nearer forms? Do no leaders cross? Do no lines float?
   - **Typography.** At most 7 keys, one system? Notes readable and true? Nothing on hatching? 2.5 mm minimum?
   - **Ink bleed.** Only near its line? More on absorbent paper, less on sized? Never in dry media? No faux age without a reason?
   - **Layout.** Subject largest and first? Margins kept? White space reserved? Weight at or above the middle?
   - **Creativity.** Is it a real explanation with its own discovery, not a reskin (non-negotiables 1–3)? Is the process on display? Is the finish selective?

## 3 · The verdict

Reply in this shape:

```
Verdict: SHOW / REVISE / REJECT   (critic: N checks, F fail, W warn)
Findings (most severe first):
  1. [check id or crop] what is wrong → the fix (plate line or engine knob)
  …
Open for the founder:
  - LOOK items and judgement calls, as questions
```

- **SHOW** only with 0 FAIL, every WARN fixed or explained, and the 4× look clean.
- **REVISE** when a fix is known.
- **REJECT** when the claim, the truth or the device is wrong. Return to `/kiruk-mai` step 1.

## Learning

- When the critic passed something your eye failed, add a row to [`packages/mai/docs/ledger.md`](../../packages/mai/docs/ledger.md) with the mistake, root cause, fix and guard.
- When a second row has the same class and cause, propose a new critic check or skill rule as an exact diff for the founder to approve. Never edit a skill silently.
- A material mistake (a wrong number shown, a privacy slip) also goes into `LEARNINGS.md`.
