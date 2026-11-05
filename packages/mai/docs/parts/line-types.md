# Line types

**Module:** `src/plate/linetype.ts` (`dashes`, `PATTERNS`), used by `Plate.stroke({ line })` · **Calculus:** bench 5 · **Checks:** `line.hidden`, `line.dashes`, `connect.axes-named` · **Ledger:** MA-14, MA-20, MA-28, MA-29

A line's pattern says what the line is (ISO 128, research 03 §2.1). A reader who sees a dashed line knows it is behind something; a chain line is an axis or a centre. Getting the pattern wrong lies about the object.

| Type    | Means                                              | Pattern (in line widths d)              |
| ------- | -------------------------------------------------- | --------------------------------------- |
| solid   | a visible edge or outline                          | —                                       |
| dashed  | a hidden edge: what is behind a nearer surface     | dash 12d, gap 3d                        |
| chain   | a centre line or an axis                           | long dash 24d, gap 3d, dot 0.5d, gap 3d |
| phantom | another position of a part, an adjacent part       | long dash 24d, then two dots            |
| dotted  | construction a hand runs quickly, a path of motion | dot 0.5d, gap 3d                        |

## The calculation

| Quantity    | Formula                                           | Notes                                                                                                      |
| ----------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| d           | `max(0.12, w0 + 0.4·(w1 − w0))` of the instrument | the pattern scales with the line: a 0.46 mm steel line has 11 mm long dashes, a 0.24 mm ruling line 5.8 mm |
| Period      | `P = Σ pattern · d`                               | chain: 30.5 d                                                                                              |
| Periods     | `n = round((L − first)/P)`; **even** when centred | an even count is symmetric, so a dash lies on the middle: centre lines cross on dashes                     |
| Stretch     | `k = (L − first)/(n·P)`                           | every element stretched alike, so the line starts and ends on a dash, never on a gap                       |
| Short lines | centred and `n = 0` ⇒ one continuous line         | ISO 128 allows continuous thin centre lines on small circles (MA-29)                                       |
| Hand        | dash × (1 + N(0, 0.16)), gap × (1 + N(0, 0.28))   | a hand lifts between dashes; its gaps wander more than its dashes                                          |
| Exact dots  | a filled round dot about the line's width across  | a 0.5 d dash drawn by the overlay pen never reached its width (MA-28)                                      |

## Driving it

- `p.stroke(path, { line: 'chain', centred: true })`; a dashed stroke is many strokes, one per dash, sharing a group.
- `hidden: true` on anything behind a nearer surface; the critic fails a hidden stroke drawn solid.
- `centreLines(p, c, r, { over })` draws a circle's two centre lines, exact on an overlay layer, ruled under the hand, running `over` mm past the circle.
- A long axis (over 30 mm) is named where it leaves the figure: A at one end, A′ at the other.

## What the critic reads

- `line.hidden`: 0 hidden strokes drawn solid.
- `line.dashes`: on lines with at least 7 dashes, judged on the dashes between the ends: a hand's dash CV ≥ 0.05 (even dashes are a plotter's), an exact line's ≤ 0.08 (MA-14).
- `connect.axes-named`: a label within 6 mm of an end of every chain line over 30 mm.

## Sources

- Standard: ISO 128-20 (2002), lengths of line elements; research `ideas/kiruk-codex/research/03-modern-line.md` §2.1, R3
- Code: `src/plate/linetype.ts`, `src/plate/plate.ts` (`stroke`), `src/measure/outer.ts` (`centreLines`)
- Tests: `test/outer.test.ts` (MA-14, MA-20, MA-28), `test/evals.test.ts` (E-6, E-7)
