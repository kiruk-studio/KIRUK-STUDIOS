# What the critic checks

`critique(plate, { pixels })` runs 64 checks in eight dimensions. Ten of them run once per form, dimension, neatline or angle (their ids end in `:<form>` or `:<id>`), so a real plate reports more rows than that: Plate III reports 72, Plate IV 53. Each check ends in a value, a target and a reason with its source.

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

Inside measurement (`src/measure/measure.ts`):

| Check                    | Target                                                                    | Why                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `measure.true:<id>`      | The label equals the ink's measure, within ½ the last digit or 0.5%       | Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed                           |
| `measure.extension:<id>` | Gap 0.8–2.5 mm (≈ 1.5); overshoot 1.5–3.6 mm (2.5–3); warn                | ISO 129-1 / ASME (03 §2.2). A redline has no extension lines and skips it                                                  |
| `measure.on-ink:<id>`    | Both ends within 0.8 mm of a contour or hatch on the ink layer            | Measure to the visible ink or a stated datum, never to the bounding box (03 R9)                                            |
| `measure.tier:<id>`      | ≥ 6 mm from the feature (warn ≥ 4; first tier 10–12)                      | 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart. A redline skips it                                        |
| `measure.unit`           | A scale bar or a dimension                                                | Every plate states a unit or module, or shows a familiar object at scale (01 R13, 02 R13)                                  |
| `measure.sourced`        | Every fact in the truth table has a source (warn when there are no facts) | If it is not in the truth table it is not on the sheet (codex step 2). Facts are entered with `p.fact(key, value, source)` |

Outer measurement (`src/measure/outer.ts`):

| Check                   | Target                                                                                   | Why                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `measure.outer`         | Overall extents in the outer tier, or a graduated neatline; warn                         | A reader must be able to measure the whole, not only its parts (ISO 129; 03 §2.2, R14)                                                               |
| `measure.tiers-order`   | Every overall dimension in the outermost tier on its side                                | ISO 129 / 03 §2.2: smaller dimensions inside, larger outside, so lines do not cross                                                                  |
| `measure.tier-gap`      | ≥ 6 mm between overlapping parallel dimension lines (fail under 4 mm)                    | 03 §2.2: tiers 6–10 mm apart. Closer, the values of two tiers sit side by side and read as one (Plate III: 281 mm against 250 mm, 2 mm apart; MA-23) |
| `measure.neatline:<id>` | Graduated at the plate's scale and unit (else fail); no ink across the frame (else warn) | A graduated frame is a ruler laid round the figure: its steps must be the plate's unit at the plate's scale                                          |
| `measure.angle:<id>`    | The label equals the rays' angle within half the last digit                              | Nothing on a plate is invented; an angle is measured from its rays                                                                                   |

Redlines (`kind: 'redline'`) keep `measure.true` and `measure.on-ink` but skip the extension and tier checks: a redline sits in the gap it measures, ticked at the edges, with no extension lines.

## Style

| Check                 | Target                                                                                              | Why                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `style.width`         | Median width CV inside the style's envelope                                                         | Constant width is the plotter's first tell                                                                                         |
| `style.tremor`        | Median tremor RMS inside the envelope                                                               | None is a plotter; too much is a wobble costume                                                                                    |
| `style.ends`          | ≥ 70% of free ink strokes tapered or pooled                                                         | Butt ends read as plotted (01 §1)                                                                                                  |
| `style.slope`         | `one-slope`: ≤ 10% off the slope; `per-form`: one direction per surface                             | Leonardo's left hand (01 §1); a different angle per part (02 R9)                                                                   |
| `style.no-cross`      | One family per form when the style forbids crossing                                                 | Cross-hatching everywhere is a named fake (01 R10)                                                                                 |
| `style.uneven`        | No hatch field with gap CV < 0.06 and length CV < 0.12                                              | Equal gaps and lengths are a machine's screen                                                                                      |
| `style.palette`       | Hue families ≤ the envelope (3 in the codex)                                                        | Many colours or effects (01 §5)                                                                                                    |
| `style.red-confusion` | WARN when sanguine construction sits under a rubric overlay                                         | Red-letter vs red-part (02 C1); open founder question                                                                              |
| `style.overlay-crisp` | 0 hand-drawn rubric overlay marks                                                                   | The modern line is exact (03 R1, R3)                                                                                               |
| `style.hierarchy`     | Outline > interior > construction by width × density                                                | 02 R14                                                                                                                             |
| `style.dip-pools`     | 10–80% of dipped contours pool                                                                      | The dip rhythm is the clock of a pen drawing                                                                                       |
| `style.starved`       | The share of wet pen ink that runs starved inside the style's envelope (0–20% in every style); warn | A starved line breaks on the paper's peaks; a few passages show the dip rhythm, a plate of them shows a dry pen (anomaly 5, 01 §1) |

## Line types

What a line's pattern says (`src/plate/linetype.ts`, after ISO 128 and research 03 §2.1):

| Type    | Means                                                 | Pattern (d = the line's width)                |
| ------- | ----------------------------------------------------- | --------------------------------------------- |
| solid   | a visible edge or outline                             | —                                             |
| dashed  | a hidden edge: what is behind                         | dash 12 d, gap 3 d                            |
| chain   | a centre line or an axis                              | long dash 24 d, gap 3 d, dot ≤ 0.5 d, gap 3 d |
| phantom | another position, or an adjacent part                 | long dash, two dots                           |
| dotted  | construction a hand runs quickly, or a path of motion | dot, gap 3 d                                  |

A line is fitted to start and end on a dash, never a gap; `centred: true` lines (centre lines) cross on a dash (MA-20), and a centre line too short for two periods is drawn continuous (ISO 128, small circles). A hand's dashes are separate strokes that vary; an exact line's do not. The critic files these two checks under style:

| Check         | Target                                                                                                         | Why                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `line.hidden` | 0 strokes marked `hidden` drawn solid                                                                          | ISO 128: a dashed narrow line is a hidden edge (03 §2.1); a hidden edge drawn solid lies about depth |
| `line.dashes` | A hand's dash CV ≥ 0.05 (else warn); an exact line's dash CV ≤ 0.08 (else fail); judged on lines of ≥ 7 dashes | Equal dashes by hand are a plotter's; uneven dashes on the overlay break its precision (03 R3)       |

## Connections

| Check                | Target                                                             | Why                                                                                      |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `connect.landing`    | Median miss 0.02–0.35 mm; worst ≤ 1.2 mm                           | Near, not on                                                                             |
| `connect.generative` | 0 constructions that generate nothing                              | 01 R11; ornamental geometry (01 §5)                                                      |
| `connect.leaders`    | 0 crossings                                                        | ISO 128-22; 03 R4–5                                                                      |
| `connect.axes-named` | A label within 6 mm of an end of every chain line over 30 mm; warn | An axis is read by its name (A–A′); the reader finds it where it runs out of the drawing |

## Typography

| Check               | Target                                                                                  | Why                                                                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type.size`         | Notes and dimensions ≥ 2.5 mm cap height; nothing under 1.8 mm                          | ISO 3098 (03 §2.5, §8)                                                                                                                                                                                                        |
| `type.phone`        | ≥ 11 px at 390 px phone width                                                           | Per breakpoint, labels go outside on leaders (02 C2)                                                                                                                                                                          |
| `type.collisions`   | No two label boxes overlap                                                              | 02 R5                                                                                                                                                                                                                         |
| `type.clear-ground` | ≤ 18% ink under a label                                                                 | Never on hatching (02 R5)                                                                                                                                                                                                     |
| `type.on-sheet`     | Every box on the sheet                                                                  | —                                                                                                                                                                                                                             |
| `type.mirror-twin`  | Every mirror text has a readable twin                                                   | 01 R9, §5                                                                                                                                                                                                                     |
| `type.keys`         | ≤ 7 keys, letters or numerals, never mixed                                              | 02 R4, 03 R12                                                                                                                                                                                                                 |
| `type.contrast`     | ≥ 4.5:1 on real pixels, read at 12 px/mm                                                | WCAG 1.4.3; estimates lied once (KC-8). The proof reads label contrast on its own 12 px/mm raster, where a lettering stroke is three pixels wide, so the reading is the ink as laid and not the screen's antialiasing (MA-17) |
| `type.value-ink`    | 0 values in rubric-line or another strokes-only ink                                     | The tokens keep the rubric line (#B5462B) for rules, guides and leaders and give measure type its own red (#983A22); values lettered in the line red read 2.9–4.1:1 on Dawn Departs (MA-17)                                   |
| `type.glyphs`       | 0 blank characters                                                                      | A character with no glyph comes out as a space: "41°" read "41" before the degree sign was drawn. A silent blank changes what a value says (MA-24)                                                                            |
| `type.blots`        | Pool diameter ≤ 0.32 × cap height on every letter stroke                                | A fresh dip may blot the first letter, but a blot that fills a counter turns a 4 into a 9: a value nobody can trust (Plate III, the 345 mm; MA-16)                                                                            |
| `type.near`         | A key or numeral within 8 mm of its point, or a leader within 3.5 mm of the point; warn | Labels sit within one leader length of their referent (03 R10)                                                                                                                                                                |

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

| Check              | Target                                                                                                | Why                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `create.claim`     | One true sentence, ≥ 6 words, not the title                                                           | Claim first                                                                                                           |
| `create.eye`       | A reference or a justification, ≥ 3 words                                                             | Non-negotiable 4                                                                                                      |
| `create.device`    | Section · exploded · build-up · phase · side-by-side · thread · construction                          | 01 R4; the pretty 3/4 view is a fake (01 §5)                                                                          |
| `create.selective` | Some forms untoned, or ≥ 20% of the construction bare                                                 | Even finish is a fake (01 §5); the process shows                                                                      |
| `create.views`     | ≥ 2                                                                                                   | 01 R3                                                                                                                 |
| `create.costume`   | None of: faux age, unreadable mirror, ornamental construction, codex cross-hatching, blots everywhere | 01 §5                                                                                                                 |
| `create.anatomy`   | Every part drawn, keyed and noted, finished and measured as declared (fail); no parts table (warn)    | List the parts before drawing; check each on its own (the anatomy method: size, truth, the object, its parts, verify) |
| `create.founder`   | LOOK, always                                                                                          | Non-negotiables 1–3 cannot be computed                                                                                |

A passing critic is necessary, not sufficient. The volute's leaf-shaped canalis hatching passed every number and failed the eye at 4× (ledger MA-5). The 4× look in `/kiruk-mai-proof` is not optional.
