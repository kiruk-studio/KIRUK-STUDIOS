# Letter and labels

**Modules:** `src/letter/letter.ts` (`letter`, `typeset`, `measureText`, `tokens`, `glyph`, `ISO_3098`), `src/letter/labels.ts` (`pointMark`, `placeLabel`, `inkIn`) · **Checks:** `type.size`, `type.phone`, `type.collisions`, `type.clear-ground`, `type.on-sheet`, `type.mirror-twin`, `type.keys`, `type.contrast`, `type.near`, `type.blots`, `type.glyphs`, `type.value-ink` · **Ledger:** MA-3, MA-13, MA-16, MA-17, MA-24

Keys, numerals, dimension values and short notes. Lettering is drawn by the same hand with the same pen as the drawing (research 01 §1: one dark line carries contour, hatching and lettering), from single-stroke Hershey glyphs, so it tremors, drains and pools like every other line. Longer notes are typeset as real SVG text, which a reader can select, translate and hear. Labels are placed the way a cartographer places names: tried round the point in a fixed order of preference, kept where the paper is clear.

## The calculation

| Quantity         | Formula                                                                                                         | Notes                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Sizes            | ISO 3098 cap heights 1.8, 2.5, 3.5, 5, 7, 10, 14, 20 mm                                                         | notes and dimensions ≥ 2.5 mm; nothing under 1.8 mm                                                 |
| Glyph scale      | `k = cap / 21` (Hershey units: cap top 1, baseline 22)                                                          | `font`: `futural` (default from the style), `scripts`, `timesr`, `greek`                            |
| Width            | `Σ (advance·k·size + cap·tracking·size) − cap·tracking`                                                         | `tracking` 0.06 of the cap; `measureText` gives the width before the hand's variation               |
| The hand         | per glyph: size × (1 + N(0, 0.025)); baseline drift `noise·0.035·cap`; slant N(0, 1.2°); tracking × U(0.7, 1.3) | none of it when `exact`: the overlay letters with no hand (research 03 R3)                          |
| Sub, superscript | `_x`, `_{xy}` and `^x`, `^{xy}`: 0.68 of the cap, baseline shifted +0.32 cap (down) or −0.55 cap (up)           |                                                                                                     |
| Extra glyphs     | ° ′ × Ø ± · – — ’ → Δ, drawn in Hershey units                                                                   | anything else outside printable ASCII is blank and recorded in `TextItem.missing` (MA-24)           |
| Pools            | a pool on a letter ≤ 0.7 × the line width; no corner pools on letters                                           | MA-3, MA-16; see [`pen.md`](pen.md)                                                                 |
| Typeset box      | width ≈ `0.62·cap` per character; from `y − 1.05·cap` to `y + 0.3·cap`                                          | an estimate wide enough for IM Fell and the fallback serifs                                         |
| Typeset colour   | iron-gall `[0.137, 0.102, 0.078]`; on a dark sheet (paper RGB sum < 1.2) `[0.8, 1, 1]`, screen blend            | the night colour is Dawn Departs (TOKEN `color.dawn.departs`)                                       |
| Label places     | NE, SE, NW, SW, E, N, W, S at gaps `[0.5, 1.1, 1.9] × cap (+ gap)` from the point                               | Imhof's preference order; the label box is padded 0.3 mm (0.5 mm below)                             |
| Label score      | `ink × 12 + clash × 4 + offSheet 100 + rank × 0.05 + gapIndex × 0.12`, lowest wins                              | ink = `inkIn(box)` / box area; clash = mm² of overlap with labels already set; 0 is perfectly clear |
| Ink in a box     | `Σ segment length × max(0.15, width)` for segments whose midpoint is inside; 0.3 per single-point mark          | stylus marks are blind and do not count; `exclude` skips a group                                    |
| Point marks      | `ring-dot` (default), `ring`, `dot`, `cross`; size 0.75 mm                                                      | the ring by compass, the dot a stipple stroke that dips and stops                                   |

## Driving it

- `letter(plate, text, at, { cap, kind, anchor, font, slant, rotate, tracking = 0.06, exact, role, ink, instrument, layer, pressure, refers, twin, mirror, id })` → `{ id, marks, item }`. The baseline starts at `at` (`anchor: 'start'`, default), or is centred or ended there. `kind` defaults to `key`; `cap` to the style's lettering height. Why: drawn lettering is part of the drawing and must carry its hand.
- `typeset(plate, text, at, { cap = 2.5, anchor, kind = 'note', italic, color, rotate, refers, twin, mirror, id })` → `TextItem` for notes, captions and colophons. Why: a sentence is read, not looked at; real text stays selectable and is read aloud.
- Sizes: keys 3.5 mm, notes and values 2.5 mm, never under 1.8 mm. Why: ISO 3098 and print legibility (research 03 §2.5); `type.size` fails under 1.8 mm and warns on a note or value under 2.5 mm.
- Write ′ for a prime (`A′`), not an apostrophe. Why: the apostrophe is a printable ASCII character, so the Hershey apostrophe is drawn; `tokens()` does not turn `A'` into `A′`, although the comment above it says so.
- Write only the characters the Hershey subset and the extra glyphs have. Why: an unknown character came out as a silent space, and "41°" read "41" (MA-24); `type.glyphs` now fails it.
- Name points with `pointMark(plate, p, { style, size, role, ink, id, part })` and `placeLabel(plate, text, anchor, { cap, font, kind, gap, exact, role, ink, id })`; it returns the lettering and its score. Set the labels last, after the ink is down. Why: the score reads the ink already on the plate; a label placed first cannot avoid hatching laid after it.
- One key system: capitals A–G or numerals, never mixed, at most 7 names. A and A′ and the same key in each view count as one name. Why: research 02 R4 and 03 R12; `type.keys` counts names, not labels (MA-13).
- Mirror or script notes only with a readable twin (`twin: id`). Why: pseudo-mirror writing is the first fake research 01 §5 names.
- Values in the type ink: `valueInk(plate, role)`. Why: the rubric line is for strokes; a value in it read 2.9–4.1:1 on real pixels (MA-17).

## What the critic reads

- `type.size`: fail under 1.8 mm; warn on a note or value under 2.5 mm.
- `type.phone`: every text at least 11 px at 390 px phone width, with the font size taken as `cap / 0.7`; warn.
- `type.collisions`: no two text boxes overlap by more than 0.3 mm² (a twin and its mirror excepted); fail.
- `type.clear-ground`: ink under a label (contour, hatch and the rest; not letters, dimensions, leaders or the overlay) ≤ 18% of its box; fail.
- `type.on-sheet`: every box inside the sheet; fail.
- `type.mirror-twin`: every mirror text has a readable twin; fail.
- `type.keys`: ≤ 7 names passes, 8 warns, more fails; letters and numerals mixed fails.
- `type.contrast`: ≥ 4.5:1 for every label, read on a 12 px/mm raster in a proof (the pixel that departs most from the paper round it), or on the colour of typeset text without one; fail. It names the lowest.
- `type.near`: a key or numeral with `refers` sits within 8 mm of its point, or a leader passes within 3.5 mm of the point; warn.
- `type.blots`: a pool on a letter stroke has a diameter ≤ 0.32 × the cap; fail.
- `type.glyphs`: no drawn text has `missing` characters; fail.
- `type.value-ink`: no dimension or scale value lettered in a strokes-only ink; fail.

## Sources

- Research: `ideas/kiruk-codex/research/01-leonardo.md` §1, §5, R9; `02-plates-and-manuscripts.md` R4, R5, C2; `03-modern-line.md` §2.5, R3, R10, R12
- Code: `src/letter/letter.ts`, `src/letter/labels.ts`, `src/letter/hershey-data.ts`; tests `test/outer.test.ts` ("projection and labels", "lettering": MA-13, MA-16, MA-17, MA-24); specimen `specimens/measure/look-points.png`
- Ledger: MA-3, MA-13, MA-16, MA-17, MA-24 in [`../ledger.md`](../ledger.md)
