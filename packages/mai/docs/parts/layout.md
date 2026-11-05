# Layout

**Modules:** `src/plate/plate.ts` (`PlateSpec.size`, `PlateSpec.margins`), `src/critic/critic.ts` and `src/critic/pixels.ts` (the layout checks) · **Checks:** `layout.margins`, `layout.rise`, `layout.balance`, `layout.white`, `type.phone` · **Ledger:** MA-21

The sheet before the drawing: its size, its margins, where the subject stands and where the commentary goes. Rule the sheet first (research 02 R1). The subject goes in first and largest; notes, an enlargement and the scale frame it and never cover it (02 R2). The critic cannot judge a composition, but it can measure the facts a composition rests on: what crosses the margins, where the ink's weight sits, how much paper is left.

## The calculation

| Quantity      | Formula                                                                               | Notes                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sheet         | `PlateSpec.size` in mm                                                                | Plates III and IV are 280 × 200; the measure specimen 280 × 190                                                             |
| Margins       | `PlateSpec.margins` (top, right, bottom, left), 12–16 mm by rule                      | unset, the code takes `[0.08·H, 0.08·W, 0.10·H, 0.08·W]` (16, 22.4, 20, 22.4 mm on 280 × 200): set them                     |
| Split         | 61.8 / 38.2: the subject zone, then the zone for notes, enlargement and scale         | a rule of the `/kiruk-mai` skill; the critic does not measure it                                                            |
| In the margin | an ink-layer stroke with any spine point more than 0.5 mm into a margin               | the letter layer and typeset text are not counted, so a colophon may sit in the bottom margin (Plate III's does)            |
| Rise          | `ȳ = Σ y·w / Σ w / H`, `w = segment length × width × density` (all but stylus marks)  | in a proof, the darkness-weighted centroid of the ink-only raster: darkness as departure from the paper's luminance (MA-25) |
| Balance       | `x̄` the same way, as a fraction of W                                                  |                                                                                                                             |
| White         | share of 5 mm cells inside the margins whose mean departure from the paper is < 0.015 | read on the ink-only raster; only in a proof                                                                                |
| Phone         | `px = (cap / 0.7) · 390 / W`; a text under 11 px fails the floor                      | on a 280 mm sheet a cap must be ≥ 5.5 mm to hold 11 px; every 2.5 mm value falls under (about 5 px)                         |

## Driving it

- Set `size` and `margins` in the spec: margins 12–16 mm. Why: the default margins are a fraction of the sheet and come out wider than any plate uses; `layout.margins` reads whichever margins the plate has.
- Lay out the zones before the first stroke: the subject zone on the larger side of a 61.8 / 38.2 split, then notes, the enlargement and the scale bar. Why: research 02 R1–R2: the subject first and largest, commentary framing it, never covering it.
- At most 7 keyed parts. Why: research 03 R12; the anatomy table and `type.keys` both read it (see [`anatomy.md`](anatomy.md), [`letter.md`](letter.md)).
- Keep the weight high. Lay the heavy tone in the upper part of the subject zone and keep frames and lower tiers light; check `layout.rise` after adding a neatline or an outer tier. Why: a frame weighs at its own centre, and Plate III's centroid fell to 54% once the frame and the bottom tier went in; the shaft stub was shortened 162 → 150 mm and the frame fitted to it, back to 51% (MA-21).
- A colophon or credit line may be typeset in the bottom margin. Why: typeset text is not ink-layer stroke, and the codex sheets carry their colophon there.
- The phone layout is open. Today `type.phone` warns on every plate (Plate III and IV both carry one warn), because a 2.5 mm value on a 280 mm sheet is about 5 px wide at 390 px. Moving labels out on leaders at phone width (research 02 C2) is a founder decision.

## What the critic reads

- `layout.margins`: 0 ink strokes in the margins passes, 1–3 warn, more fail.
- `layout.rise`: the ink centroid at ≤ 52% of the height passes, ≤ 58% warns, lower fails (the codex "rise").
- `layout.balance`: the ink centroid at 50% ± 12% of the width passes, ± 20% warns, further fails.
- `layout.white`: 30–85% of the 5 mm cells inside the margins are paper; outside warns. Only in a proof.
- `type.phone`: every text holds 11 px at 390 px phone width; warn. The proof's `phone.png` shows the sheet at that width.

## Sources

- Research: `ideas/kiruk-codex/research/01-leonardo.md` §2, R8 (white space); `02-plates-and-manuscripts.md` R1, R2, C2; `03-modern-line.md` R12
- Code: `src/plate/plate.ts` (`margins`), `src/critic/critic.ts` (layout), `src/critic/pixels.ts` (centroid, white); plates `plates/volute.ts`, `plates/axes.ts`
- Skill: `/kiruk-mai` (sheet: margins, the split, the subject first)
- Ledger: MA-21 (and MA-25 for the pixel facts on a dark sheet) in [`../ledger.md`](../ledger.md)
