# What the critic checks

`critique(plate, { pixels })` runs about 55 checks in eight dimensions. Each check ends in a value, a target and a reason with its source.

**Statuses:**

- **PASS**: the check holds.
- **WARN**: look, and decide.
- **FAIL**: fix before anyone looks.
- **LOOK**: only a person can judge it.

**Verdicts:** a plate is FAIL if any check fails, WARN if any check warns, and PASS otherwise. LOOK items are always open, so a PASS never means "approved". It means "ready for the founder's eye".

Source of truth: `src/critic/critic.ts`.

## Lighting

| Check                    | Target                                        | Why                                                                                                |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `light.tied`             | Every hatch stroke has a form                 | One light per plate, declared (02 §11)                                                             |
| `light.follows:<form>`   | Spearman ρ(tone, ink) ≥ 0.6 (warn ≥ 0.4)      | A darker target carries more ink everywhere (¶555). Cells are sized to the form; tone is averaged. |
| `light.even:<form>`      | ≥ 50% of the cells carry ink                  | A flat tone (a cast shadow, a cut face) has no gradient; it must still cover its region            |
| `light.lit-clear:<form>` | Lit quartile ≤ 25% of the dark quartile's ink | Where the light falls, the paper is the light                                                      |
| `light.contour-weight`   | Shadow side ≥ 1.15× the lit side              | The quill swells where the edge turns from the light (01 §1)                                       |

## Measurement

| Check                     | Target                                                              | Why                                                     |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `measure.true:<dim>`      | The label equals the ink's measure, within ½ the last digit or 0.5% | Nothing on a plate is invented                          |
| `measure.extension:<dim>` | Gap 0.8–2.5 mm (≈ 1.5); overshoot 1.5–3.6 mm (2.5–3)                | ISO 129-1 / ASME (03 §2.2)                              |
| `measure.on-ink:<dim>`    | Both ends within 0.8 mm of an ink line                              | Measure the visible ink, never the bounding box (03 R9) |
| `measure.tier:<dim>`      | ≥ 6 mm from the feature (first tier 10–12)                          | 03 §2.2                                                 |
| `measure.unit`            | A scale bar or a dimension                                          | Every plate states a unit or module (01 R13)            |
| `measure.sourced`         | Every `plate.fact` has a source                                     | The truth table is the plate's memory                   |

## Style

| Check                 | Target                                                                  | Why                                                              |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `style.width`         | Median width CV inside the style's envelope                             | Constant width is the plotter's first tell                       |
| `style.tremor`        | Median tremor RMS inside the envelope                                   | None is a plotter; too much is a wobble costume                  |
| `style.ends`          | ≥ 70% of free ink strokes tapered or pooled                             | Butt ends read as plotted (01 §1)                                |
| `style.slope`         | `one-slope`: ≤ 10% off the slope; `per-form`: one direction per surface | Leonardo's left hand (01 §1); a different angle per part (02 R9) |
| `style.no-cross`      | One family per form when the style forbids crossing                     | Cross-hatching everywhere is a named fake (01 R10)               |
| `style.uneven`        | No hatch field with gap CV < 0.06 and length CV < 0.12                  | Equal gaps and lengths are a machine's screen                    |
| `style.palette`       | Hue families ≤ the envelope (3 in the codex)                            | Many colours or effects (01 §5)                                  |
| `style.red-confusion` | WARN when sanguine construction sits under a rubric overlay             | Red-letter vs red-part (02 C1); open founder question            |
| `style.overlay-crisp` | 0 hand-drawn rubric overlay marks                                       | The modern line is exact (03 R1, R3)                             |
| `style.hierarchy`     | Outline > interior > construction by width × density                    | 02 R14                                                           |
| `style.dip-pools`     | 10–80% of dipped contours pool                                          | The dip rhythm is the clock of a pen drawing                     |

## Connections

| Check                | Target                                   | Why                                 |
| -------------------- | ---------------------------------------- | ----------------------------------- |
| `connect.landing`    | Median miss 0.02–0.35 mm; worst ≤ 1.2 mm | Near, not on                        |
| `connect.generative` | 0 constructions that generate nothing    | 01 R11; ornamental geometry (01 §5) |
| `connect.leaders`    | 0 crossings                              | ISO 128-22; 03 R4–5                 |

## Typography

| Check               | Target                                                         | Why                                                  |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| `type.size`         | Notes and dimensions ≥ 2.5 mm cap height; nothing under 1.8 mm | ISO 3098 (03 §2.5, §8)                               |
| `type.phone`        | ≥ 11 px at 390 px phone width                                  | Per breakpoint, labels go outside on leaders (02 C2) |
| `type.collisions`   | No two label boxes overlap                                     | 02 R5                                                |
| `type.clear-ground` | ≤ 18% ink under a label                                        | Never on hatching (02 R5)                            |
| `type.on-sheet`     | Every box on the sheet                                         | —                                                    |
| `type.mirror-twin`  | Every mirror text has a readable twin                          | 01 R9, §5                                            |
| `type.keys`         | ≤ 7 keys, letters or numerals, never mixed                     | 02 R4, 03 R12                                        |
| `type.contrast`     | ≥ 4.5:1 on real pixels                                         | WCAG 1.4.3; estimates lied once (KC-8)               |

## Bleed

| Check             | Target                                                | Why                                          |
| ----------------- | ----------------------------------------------------- | -------------------------------------------- |
| `bleed.feather`   | ≤ 30 per 100 mm on sized paper; median wisp ≤ 0.35 mm | Fibres and sizing decide                     |
| `bleed.local`     | No mean wisp over 0.6 mm                              | Only the nearby area (founder, ink-bleed.md) |
| `bleed.varies`    | Spread CV ≥ 0.15                                      | Uniform bleed is a filter look               |
| `bleed.dry-media` | 0 pools or feathers in graphite, chalk or metal       | Dry media have no liquid                     |
| `bleed.pools`     | 1–40% of wet strokes                                  | Blots are events, not decoration             |
| `bleed.time`      | LOOK whenever `time > 0`                              | Faux age (01 §1, R14)                        |

## Layout

| Check            | Target                                        | Why                                           |
| ---------------- | --------------------------------------------- | --------------------------------------------- |
| `layout.margins` | 0 ink strokes in the margins                  | Rule the sheet first (02 R1)                  |
| `layout.rise`    | Ink centroid ≤ 52% of the height (warn ≤ 58%) | The codex rise: weight at or above the middle |
| `layout.balance` | Centroid 50% ± 12% of the width               | The subject centred and largest (02 R2)       |
| `layout.white`   | 30–85% of the sheet left as paper             | White space reserved on purpose (01 §2, R8)   |

## Creativity (its preconditions, and one open item)

| Check              | Target                                                                                                | Why                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `create.claim`     | One true sentence, ≥ 6 words, not the title                                                           | Claim first                                      |
| `create.eye`       | A reference or a justification, ≥ 3 words                                                             | Non-negotiable 4                                 |
| `create.device`    | Section · exploded · build-up · phase · side-by-side · thread · construction                          | 01 R4; the pretty 3/4 view is a fake (01 §5)     |
| `create.selective` | Some forms untoned, or ≥ 20% of the construction bare                                                 | Even finish is a fake (01 §5); the process shows |
| `create.views`     | ≥ 2                                                                                                   | 01 R3                                            |
| `create.costume`   | None of: faux age, unreadable mirror, ornamental construction, codex cross-hatching, blots everywhere | 01 §5                                            |
| `create.founder`   | LOOK, always                                                                                          | Non-negotiables 1–3 cannot be computed           |

A passing critic is necessary, not sufficient. The volute's leaf-shaped canalis hatching passed every number and failed the eye at 4× (ledger MA-5). The 4× look in `/kiruk-mai-proof` is not optional.
