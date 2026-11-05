# Measure

**Module:** `src/measure/measure.ts` (`dimension`, `valueInk`, `scaleBar`, `leader`, `ruled`, `compass`, `point`) · **Calculus:** bench 4 · **Checks:** `measure.true:<id>`, `measure.extension:<id>`, `measure.on-ink:<id>`, `measure.tier:<id>`, `measure.unit`, `measure.sourced`, `type.value-ink` · **Ledger:** MA-12, MA-17, MA-19

Measurement inside the figure: the lines that say how big a feature is. A value on a mai plate is never typed. `dimension()` takes two points on the ink, measures the distance between them at the plate's scale, and letters the result, so a label cannot disagree with the drawing. The extension lines, the dimension line, its terminators and the value follow drafting practice (research 03 §2.2, ASME and ISO 129 as cited there), and every dimension is recorded so the critic can measure it again.

The same module holds the construction instruments (`ruled`, `compass`, `point`), because a construction and a dimension are the two kinds of line that hold a drawing up. Outer measurement (overall size, chains, neatlines, angles, UI redlines) is in [`outer.md`](outer.md).

## The calculation

| Quantity        | Formula                                                                                                                     | Notes                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sheet distance  | `s = \|b − a\|`, or `\|b_x − a_x\|` with `axis: 'x'`, `\|b_y − a_y\|` with `axis: 'y'`                                      | aligned by default; a projected dimension runs along one axis, set off from the outermost of the two points                 |
| Value           | `v = s · perMm`                                                                                                             | `perMm` from the option, else `PlateSpec.scale.perMm` (default 1 mm = 1 mm); an enlargement passes its own                  |
| Label           | `formatValue(v, digits) + ' ' + unit`, or the number alone with `unit: 'none'`                                              | `digits` from the option, else the plate scale's, else 1; trailing zeros dropped                                            |
| Extension line  | from `feature + 1.5·e` to `line + 2.6·e` (e the unit vector from the feature to the dimension line)                         | `gap` 1.5 mm off the ink, `over` 2.6 mm past the line; skipped when shorter than 0.6 mm (a dimension laid on its own edges) |
| Terminators     | tick: 2.6 mm at 45°; arrow: L 2.4 mm (± 10% by hand), W = L/3; dot: r 0.32 mm                                               | tick by default, arrow on an exact overlay; length to width 3:1                                                             |
| Value position  | centred, 1.1 mm above the line as read, turned with it (kept within ±90° so it never reads upside down)                     | cap 2.5 mm (ISO 3098)                                                                                                       |
| Value too wide  | if `textWidth > s − 1.2`: moved along the line past the far end by `textWidth/2 + 2.2` mm                                   | drafting practice; MA-12 began as chain values wider than their spans                                                       |
| Redline value   | level (never turned): beside a vertical line at +1.2 mm, 1.1 mm above a horizontal one                                      | `kind: 'redline'` (see [`outer.md`](outer.md))                                                                              |
| Exact           | `isOverlay()`: the overlay layer, the ruling pen and a modern ink (`rubric` or `departs`) draws with `guide: exact` (MA-31) | otherwise the dimension is ruled by the hand (`guide: ruler`)                                                               |
| The value's ink | `valueInk = typeInk(ink)` → else `ink` if `contrast(ink, paper) ≥ 7` → else the lettering ink                               | rubric-line `#B5462B` → rubric-type `#983A22` (MA-17)                                                                       |
| Scale bar       | `sheetLen = units / perMm`; `segments` (default 4) alternate filled cells 1.4 mm high; ticks 0.6 mm below                   | numbers at 1.8 mm cap; the unit (or `label`) after the bar; records the fact `scale:<id>`                                   |
| Leader          | one run of `shoulder` (default 3.5 mm) level from the label, then one angled run to the part                                | dot r 0.3 mm (default), arrow 2.2 mm (W = L/3), or none; `precision: 0.8`                                                   |
| Ruled line      | overshoots each end by U(1.5, 4) mm                                                                                         | a straight-edge line crosses its corners                                                                                    |
| Compass circle  | the end runs U(−1.2, 2.6)/r rad past the start; the leg slips `N(0, 0.12)` mm over the last 28%                             | a full circle never quite closes; the centre is pricked unless `prick: false`                                               |

## Driving it

- `dimension(plate, a, b, { offset, axis, digits, unit, perMm, role, kind, terminator, gap, over, cap, text, id })`. `offset` is required: signed mm from the measured edge (+ is left of a→b, or beyond the larger coordinate on a projected dimension). `kind` is `detail` (default), `overall`, `chain` or `redline`. Why: the kind tells the critic which drafting rules apply (MA-18).
- Never pass `text` to say something the ink does not. Why: `measure.true` re-measures the record and fails a typed value that lies; nothing on a plate is invented.
- Put `a` and `b` on the drawn line, not on a box round it. Measure a rounded box at its tangent points. Why: `measure.on-ink` wants both ends within 0.8 mm of a contour or hatch (research 03 R9, MA-19).
- State the unit once. When values are short and the spans are tight, use `unit: 'none'` and say "dimensions in mm" in a note. Why: a unit on every value made chain values wider than their spans, and they collided (MA-12).
- The first tier stands 10–12 mm off the feature; never closer than 6 mm. Why: `measure.tier` warns under 6 mm and fails under 4 mm, because a value close to the drawing reads as part of it.
- Letter any value with `valueInk(plate, role)`; `dimension`, `scaleBar`, the neatline and `angleDim` already do. Why: the rubric line is a stroke ink and is never type (`type.value-ink`, MA-17).
- `scaleBar(plate, at, { units, segments, height, label, cap, role, id })` states the unit on a plate with no dimension. `leader(plate, from, to, { terminator: 'dot' | 'arrow' | 'none', shoulder, role, id })`: a dot when it ends inside a body, an arrow on an edge, nothing on a line (research 03 §2.3, R4–5).
- `ruled(plate, a, b, { generates, overshoot, kind, label })`, `compass(plate, c, r, { a0, a1, prick, generates })`, `point(plate, p, { style: 'dot' | 'cross' | 'ring' | 'prick', label })`. Pass `generates` (or call `p.generated`). Why: a construction that generated nothing is ornament, and `connect.generative` fails it.
- Record every number the plate draws with `p.fact(key, value, source)`. Why: `measure.sourced` fails a fact without a source.

## What the critic reads

- `measure.true:<id>`: the label's number against the recorded value, `|label − ink| ≤ max(½·10^−digits, 0.5% of the value)`; fail.
- `measure.extension:<id>`: gap 0.8–2.5 mm and overshoot 1.5–3.6 mm (read at the first end); warn. Skipped for redlines.
- `measure.on-ink:<id>`: both measured points within 0.8 mm of a contour or hatch stroke on the ink layer; fail.
- `measure.tier:<id>`: the dimension line ≥ 6 mm from the feature passes, ≥ 4 mm warns, closer fails. Skipped for redlines.
- `measure.unit`: a dimension or a scale bar exists; fail.
- `measure.sourced`: every truth entry has a source of 3 characters or more (fail); no facts at all warns.
- `type.value-ink`: no dimension or scale value lettered in an ink that has a type twin; fail.

## Sources

- Research: `ideas/kiruk-codex/research/03-modern-line.md` §2.2 (gaps, overshoot, tiers, arrowheads), §2.3 and R4–5 (leaders), R9 (measure the ink), R14 (scale bars)
- Tokens: `packages/design-system/tokens/core.json` (`color.dawn.rubric-line`, `color.dawn.rubric`)
- Code: `src/measure/measure.ts`; tests `test/critic.test.ts` (measurement), `test/outer.test.ts` (MA-17, MA-18); specimen `specimens/measure/`
- Ledger: MA-12, MA-17, MA-19 in [`../ledger.md`](../ledger.md)
