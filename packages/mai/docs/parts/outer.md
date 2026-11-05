# Outer measurement

**Module:** `src/measure/outer.ts` (`extents`, `chainDims`, `neatline`, `angleDim`, `sweep`, `arrowhead`, `frame`, `redline`, `padding`, `centreLines`, `toSheet`) · **Calculus:** bench 4 · **Checks:** `measure.outer`, `measure.tiers-order`, `measure.tier-gap`, `measure.neatline:<id>`, `measure.angle:<id>`, and for redlines `measure.true:<id>`, `measure.on-ink:<id>` · **Ledger:** MA-12, MA-18, MA-19, MA-21, MA-22, MA-23

What a figure says about its own size and place, round its edge: the overall width and height, chains of consecutive dimensions, a graduated frame that turns the whole sheet into a ruler, angles, turns and paths of motion, and the redlines and padding of an interface. Every value is still computed from geometry by `dimension()` (see [`measure.md`](measure.md)) and recorded, so the critic can measure it again. The order on the paper is ISO 129's: smaller dimensions inside, larger ones outside, so no lines cross.

## The calculation

| Quantity         | Formula                                                                                                                                   | Notes                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Extremes         | `inkExtremes(marks)`: the leftmost, rightmost, topmost and bottommost spine points                                                        | the ink, never a bounding box (research 03 R9)                                                              |
| Overall tier     | `base = far edge of (marks + clear) ± tier`, tier 12 mm                                                                                   | `clear` sets the tier outside marks that are not measured                                                   |
| Step beyond      | for each non-redline dimension on that side, parallel, overlapping the span, and not more than `tier` inside the base: `at = c ± tierGap` | tierGap 8 mm (research 03 §2.2: tiers 6–10 mm apart; MA-23)                                                 |
| Chain            | `<id>-1…n` between sorted points on one line; `<id>-overall` 8 mm further out                                                             | the overall only with 3 or more points and `overall` not false                                              |
| Neatline         | an inner line, an outer line `gap` (1.8 mm) beyond it; ticks every `every / perMm` mm counted from `origin`                               | major ticks every `major` (5) steps, `gap` long; minor ticks `gap/2`                                        |
| Neatline numbers | `\|k · every\|` on the major ticks, 1.2 mm past the outer line, cap 2.5 mm                                                                | top and left by default; 2.5 mm since MA-17 (ISO 3098), in `valueInk`                                       |
| Angle            | `θ = \|short sweep from ray a to ray b\|`; arc at r (14 mm), arrowheads 2 mm                                                              | label "N°" (digits 0) on the bisector at `r + 1.1·cap`                                                      |
| Sweep            | an arc from a0 to a1 (radians), heads 2.6 mm at the end, or both ends                                                                     | label at `r + 1.3·cap` at the middle of the sweep, `kind: 'key'`; role `contour` by default                 |
| Arrowhead        | a filled head: tip, two barbs at ±L/6, a notch 0.18·L back; L 2.2 mm by default                                                           | length to width 3:1; a hair of skew (N(0, 0.05)) unless exact                                               |
| Exact            | a role whose kit is the overlay layer and the ruling pen, in any ink                                                                      | neatline, angle and centre lines go exact; `dimension()` also asks for the `rubric` ink (see below)         |
| Redline          | the facing edges of two boxes, at the middle of their overlap; `dimension(…, { kind: 'redline', terminator: 'tick', gap: 0, over: ≈0 })`  | no extension lines, digits 0, role `overlay`; the value sits level beside the line                          |
| Padding          | four redlines `<id>-top`, `-right`, `-bottom`, `-left`, each from the outer box to the content element that is there                      | topmost element for the top, rightmost for the right…, at the middle of that element's edge (MA-19)         |
| Centre lines     | two chain lines through c, `r + over` (3 mm) each way, `centred: true`                                                                    | they cross on a dash; too small for the pattern, continuous (ISO 128; see [`line-types.md`](line-types.md)) |
| UI scale         | `value = sheet mm × perMm`; `toSheet(plate, v) = v / plate.scale.perMm`                                                                   | the measure specimen draws its UI at 4 px to the mm                                                         |

Exact has two tests today. `outer.ts` draws exact when the role's kit is the overlay layer and the ruling pen; `measure.ts` (`dimension`, `scaleBar`, `leader`) also requires the `rubric` ink. In the architect (sepia), engraver (carbon) and night (departs) styles a neatline, an angle and centre lines are exact while the dimensions beside them are ruled by the hand, with ticks.

## Driving it

- `extents(plate, marks, { sides = ['bottom', 'right'], tier = 12, tierGap = 8, digits, unit, perMm, clear, role, id })` → `{ id, dims, extremes }`, dims `<id>-<side>`, kind `overall`. Pass only the subject's finished marks: never a break line or a construction. Why: a broken view is not dimensioned to its break (ISO 129); Plate III's overall once ran to the tail of the shaft's break line (MA-22). Measure the part and pass the whole drawing as `clear`.
- Draw the inner dimensions first, then `extents()`. Why: it steps 8 mm beyond what already stands on its side, so the overall lands a tier outside the inner (MA-23); drawn first, it has nothing to clear.
- `chainDims(plate, points, { axis, offset, overall = true, digits, unit, role, id })` → `<id>-1…n` (chain) and `<id>-overall`. Use `unit: 'none'` and state the unit once. Why: a unit on every link made the values wider than their spans (MA-12).
- `neatline(plate, rect, { every, origin, major = 5, gap = 1.8, numbers, numbersOn = ['top', 'left'], cap = 2.5, role = 'dimension', id })` → `{ id, marks }`, and a `NeatlineRecord` on `plate.neatlines`. Count it from a point that means something: the eye, a hole, an axis, the centre. Why: a frame counted from its own corner tells the reader nothing about the figure.
- `angleDim(plate, vertex, a, b, { r = 14, digits = 0, cap = 2.5, role, id })` → `{ id, marks, degrees }`, and an `AngleRecord` on `plate.angles`. A part can list an angle id in `measured` (MA-15).
- `sweep(plate, c, r, a0, a1, { arrow: 'end' | 'both' | 'none', label, cap, line, role, pressure, id, part })` → `{ id, marks, path }`, for a turn or a path of motion. `arrowhead(plate, tip, dir, { role, len, id, part })` for any other head.
- UI: `frame(plate, rect, { radius, role, exact, pressure, id, part })` draws the box (rounded corners as quarter arcs). `redline(plate, a, b, { unit, perMm, digits = 0, role = 'overlay', id })` measures the gap where two boxes face. `padding(plate, outer, content, o)` takes one box or the list of content elements. Why: measured to a content box, a padding ended where nothing was drawn (MA-19); measured to the element, both ends land on ink.
- Draw a UI at an explicit `perMm` (`perMm: 4` for 4 px to the mm, with `unit: 'none'` and a note "px"). Why: the plate's own scale is mm; a redline without its own scale states mm.
- `centreLines(plate, c, r, { over = 3, role = 'dimension', pressure, id, part })` for every hole or round part that is measured or turns.
- Check the frame's weight. Why: a frame weighs at its own centre and pulled Plate III's ink centroid to 54% of the height (MA-21; `layout.rise`).

## What the critic reads

- `measure.outer`: at least one `overall` dimension or one neatline; warn otherwise.
- `measure.tiers-order`: no smaller dimension on the same side, parallel and overlapping, stands more than 0.3 mm outside an overall; fail.
- `measure.tier-gap`: every pair of parallel, overlapping, non-collinear, non-redline dimension lines at least 6 mm apart; under 4 mm fails, 4–6 mm warns.
- `measure.neatline:<id>`: recorded at the plate's `perMm` and unit, else fail; an ink stroke that crosses the frame warns.
- `measure.angle:<id>`: `|label − rays| ≤ ½` of the last digit; fail.
- Redlines skip `measure.extension` and `measure.tier` (they sit in the gap they measure; MA-18) and keep `measure.true` and `measure.on-ink`.

## Sources

- Research: `ideas/kiruk-codex/research/03-modern-line.md` §2.2 (tiers, gaps, arrowheads), R9 (measure the ink), R14 (state the whole)
- Standards as cited there: ISO 129 (dimension order, broken views), ISO 128 (centre lines), ISO 3098 (lettering heights)
- Code: `src/measure/outer.ts`; tests `test/outer.test.ts` ("outer measurement": chains, tiers, MA-15, MA-18, MA-22, MA-23); specimen `specimens/measure/` (`look-ui-redlines.png`, `look-part.png`); skill `/kiruk-mai-measure`
- Ledger: MA-12, MA-18, MA-19, MA-21, MA-22, MA-23 in [`../ledger.md`](../ledger.md)
