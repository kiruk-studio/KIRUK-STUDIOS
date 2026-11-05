---
description: Measure a diagram or a UI from the outside with mai, kiruk's ink engine — overall size, chain dimensions, graduated neatlines, angles, sweeps, UI redlines and padding, line types (hidden dashed, axes as chain lines) and named point labels — with every value measured from the ink, never typed. Use when a plate, figure, specimen or UI card needs its size and place stated, when someone asks to dimension, redline, annotate or measure a drawing or an interface, or when /kiruk-mai reaches its "measure outside" step.
argument-hint: <plate module or what to measure>
---

# /kiruk-mai-measure: a figure states its own size

**Argument:** `$ARGUMENTS` = a plate module (`packages/mai/plates/<name>.ts`) or a one-line description of what to measure. If it names neither a figure nor a module, ask which and stop: measuring an invented figure is guessing.

**Visual reference:** [`packages/mai/plates/measure.ts`](../../packages/mai/plates/measure.ts), baked with `node packages/mai/scripts/specimen.ts measure` into `packages/mai/specimens/measure/`. Open its `plate.png` before you start; every step below has a panel there.

**Depth lives in the parts pages** — load the one a step names, only when you reach it: [measure](../../packages/mai/docs/parts/measure.md) (inside), [outer](../../packages/mai/docs/parts/outer.md) (outside, UI), [line types](../../packages/mai/docs/parts/line-types.md), [projection](../../packages/mai/docs/parts/projection.md), [letter](../../packages/mai/docs/parts/letter.md). Option names and defaults are there and in the code's doc comments; this skill does not repeat them.

## The one idea

A figure states its own size and place: its lines say what they are, and every value round its edge is measured from its ink. A typed number is a claim nobody checked; a value from the ink is a fact the critic can re-measure (`measure.true`, `measure.on-ink`).

## The procedure (in this order)

The order is inside-out on purpose: each tier is placed against what already stands, so a step done early cannot be crowded by a step done late.

1. **Unit and scale.** Set `PlateSpec.scale` (`{ unit, perMm, digits }`). A UI is measured in px at an explicit `perMm` (the specimen uses 4 px per mm), passed to every UI call. State the unit **once** in a note ("all values in px, at 4 px to the mm") and letter values with `unit: 'none'`.
   _Why:_ a unit on every value makes the text wider than a short span, and neighbouring chain values collide (MA-12).

2. **The figure first.** Draw and ink the subject before any measurement, and give its strokes a `part`.
   _Why:_ every value is read off the ink; there is nothing to measure until the ink exists, and `extents()` takes the part's own marks.

3. **Line types say what a line is** ([line types](../../packages/mai/docs/parts/line-types.md)).
   - Visible edges: solid.
   - What is behind a nearer surface: `line: 'dashed'` **and** `hidden: true`. _Why:_ a hidden edge drawn solid lies about depth (`line.hidden`, eval E-6).
   - A long axis: a chain line, named at both ends (A–A′). _Why:_ an axis is read by its name where it leaves the figure (`connect.axes-named`, eval E-7). For a solid, `wireSphere` in [projection](../../packages/mai/docs/parts/projection.md) dashes hidden circles and names axes for you.
   - A circle's centre: `centreLines(p, c, r)`, never two hand-placed strokes. _Why:_ it fits the pattern centred so the pair crosses on a dash, and a circle too small for the pattern gets a continuous thin line, as ISO 128 allows (MA-20, MA-29).
   - Another position of a moving part: `line: 'phantom'`.
   - An exact chain line keeps its dots as round dots; do not swap in a thin dash to "fix" a missing dot (MA-28).

4. **Inside.** `chainDims` for a run of features along one axis (it sets the overall 8 mm further out for you); `dimension` for a single feature. End every dimension on visible ink, never on a construction point or a box corner. Measure a rounded box at its tangent points, where its sides run straight.
   _Why:_ a value measured to a corner the radius rounds away is true to the box, false to the ink (MA-19, `measure.on-ink`).

5. **Outside.** `extents(p, partMarks, { clear: allMarks })` for the overall size: measure the part's own marks and let `clear` set the tier outside the whole drawing. **Never pass a break line or construction** to `extents`.
   _Why:_ a broken view is not dimensioned to its break (ISO 129). Plate III's width once ran to the tail of the shaft's break line — true to the ink, wrong in meaning (MA-22).
   The overall stands a tier (≥ 6 mm; `extents` steps 8 mm) beyond any dimension already on that side.
   _Why:_ two tiers 2 mm apart read as one value (MA-23; `measure.tier-gap` fails under 4 mm, warns under 6; eval E-5).
   Every figure states its overall size by an overall dimension or a graduated frame (`measure.outer`, eval E-9).

6. **Neatline.** `neatline(p, rect, { every, origin, numbersOn })` when a graduated frame says more than a pair of overalls. Count from a meaningful origin (the eye, a hole, the centre), pick a round step at the plate's scale, and put numbers on the sides the drawing leaves clear.
   _Why:_ a frame counted from the sheet corner tells the reader nothing about the figure; a frame not graduated at the plate's `perMm` and unit fails `measure.neatline:<id>`.

7. **Angles and turns.** `angleDim(p, vertex, a, b)` only in a view where the angle is true size; a turn is a `sweep` (or the turn arrows `wireSphere` draws).
   _Why:_ an angle read in a foreshortened view is a different number than the ink's rays (`measure.angle:<id>`, eval E-10).

8. **UI.** `frame` for boxes, `padding(card, [elements])` with the content elements (not one content box), `redline(a, b)` for the gap where two boxes face.
   _Why:_ `padding` measures each side to the element that is actually there (MA-19); a redline sits in the gap it measures, the design-review convention, so the drafting rules for extension lines and tiers do not apply to it — `measure.true` and `measure.on-ink` still do (MA-18).

9. **Values and labels** ([letter](../../packages/mai/docs/parts/letter.md)).
   - Never set a value's ink by hand: `dimension()` letters it with `valueInk()`, the type twin of the line's ink (rubric-line → rubric-type #983A22).
     _Why:_ the tokens keep the line red for strokes only; values lettered in it read 2.9–4.1:1 on Dawn Departs (MA-17, `type.value-ink`, eval E-8).
   - Name points with `pointMark` + `placeLabel`, which tries eight positions and picks clear paper. A label sits within 8 mm of its point or gets a leader (`type.near`).
   - Keys are named parts (`p.part({ key })`), at most 7, letters or numerals, never mixed.
   - Use the synthetic glyphs (° ′ × Ø ± · – —) freely; anything else unknown fails `type.glyphs` (MA-24) — check the report, not your memory of the font.

10. **Verify.** Run `/kiruk-mai-proof` on the module. Then read, by name, every `measure.*`, `line.*`, `type.near` and `type.value-ink` row of `report.md`, and look at the `dimension` crop at 4×: arrowheads land on the extension lines, values sit centred and clear, no value crosses ink.
    _Why:_ the critic re-measures every value from the ink, but only your eye sees a value that is true and still unreadable.

## Never

- Type a value (`text:`). _Why:_ it is the one way a number on the sheet can be wrong (`measure.true`, eval E-1).
- Measure a bounding box. _Why:_ research 03 R9; ink extremes are what the reader sees (`inkExtremes`).
- Measure construction or break lines as if they were the object (MA-22).
- Draw a hidden edge solid, or an axis without names (E-6, E-7).

## Finish

- Mark the part measured: `p.part({ ..., measured: [<dimension ids>] })`, or `{ none: '<reason of three words or more>' }`. _Why:_ `create.anatomy` checks each declared measure id exists.
- A miss the critic passed → a row in [`ledger.md`](../../packages/mai/docs/ledger.md). The mechanised evals for this skill are E-5…E-10 in `packages/mai/test/evals.test.ts`; run `pnpm --filter @kiruk/mai test` after changing a measure rule.

## Sources

- Decision: ideas/kiruk-codex/plan.md (mai, the ink engine) and ideas/ways-of-working/proposal.md §3.3 (the anatomy of a skill)
- Promise: none yet (no openspec requirement for mai)
- Ledger: packages/mai/docs/ledger.md
- Examples: packages/mai/docs/examples.md
- References: packages/mai/docs/parts/README.md
- Evals: packages/mai/docs/evals.md, packages/mai/test/evals.test.ts
