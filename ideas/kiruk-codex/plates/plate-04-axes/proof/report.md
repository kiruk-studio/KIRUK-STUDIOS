# Proof — Plate IV — The three axes of the eye

Plate `plate-04-axes` · style `night` · verdict **WARN**

| Dimension   | pass | warn | fail | look |
| ----------- | ---: | ---: | ---: | ---: |
| lighting    |    1 |    0 |    0 |    0 |
| measurement |   10 |    0 |    0 |    0 |
| style       |   11 |    0 |    0 |    0 |
| connections |    4 |    0 |    0 |    0 |
| typography  |   11 |    1 |    0 |    0 |
| bleed       |    5 |    0 |    0 |    0 |
| layout      |    4 |    0 |    0 |    0 |
| creativity  |    7 |    0 |    0 |    1 |

## Lighting

- **PASS** Every tone is tied to a form under the one light — 0 of 0 hatch strokes without a form (target 0)
  - why: One light per plate, declared (research 02 §11). Tone not tied to a form cannot be proved against it.

## Measurement

- **PASS** Dimension globe-extent-bottom says what the ink measures — label “24 mm”, ink 23.99 mm (target |Δ| ≤ 0.5)
  - why: Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed.
- **PASS** Extension lines of globe-extent-bottom: gap and overshoot — gap 1.5 mm, overshoot 2.6 mm (target gap ≈ 1.5 (0.8–2.5), overshoot 2.5–3 (1.5–3.6) mm)
  - why: ISO 129-1 / ASME as cited in research 03 §2.2.
- **PASS** globe-extent-bottom measures the visible ink — both ends on ink (target both ends within 0.8 mm of ink)
  - why: Measure to the visible ink or a stated datum, never to the bounding box (research 03 R9).
- **PASS** globe-extent-bottom stands clear of the drawing — 47.35 mm from the feature (target ≥ 6 mm (first tier 10–12 mm))
  - why: Research 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart.
- **PASS** The plate states a unit or module — unit mm (target a scale bar or a dimension)
  - why: Every plate states a unit or module, or shows a familiar object at scale (research 01 R13, 02 R13).
- **PASS** Every fact on the plate has a source — 4 facts, 0 without a source (target all sourced)
  - why: If it is not in the truth table it is not on the sheet (codex step 2).
- **PASS** The figure states its overall size — 1 overall dimensions, 1 graduated neatlines (target overall extents in the outer tier, or a graduated neatline)
  - why: A reader must be able to measure the whole, not only its parts (ISO 129; research 03 §2.2, R14).
- **PASS** Smaller dimensions inside, the overall outside — 1 overall dimensions outermost (target every overall dimension in the outermost tier on its side)
  - why: ISO 129 / research 03 §2.2: smaller dimensions inside, larger outside, so lines do not cross.
- **PASS** Neatline fig1-neat is graduated true and frames its figure — 2 mm per step at 0.353 mm/mm; 0 ink strokes cross it (target the plate scale; no ink across the frame)
  - why: A graduated frame is a ruler laid round the figure: its steps must be the plate’s unit at the plate’s scale.
- **PASS** Angle gaze-turn says what the rays make — label “30°”, rays 30° (target |Δ| ≤ half the last digit)
  - why: Nothing on a plate is invented; an angle is measured from its rays.

## Style

- **PASS** Line width breathes (not a plotter, not chaos) — median width CV 0.22 over 91 strokes (target 0.1–0.7 (night))
  - why: Taper and variable weight are the defining marks of the hand (research 01 §1); constant width is the plotter tell.
- **PASS** The hand trembles a little, where it is slow — median tremor 0.006 mm (target 0.002–0.04 mm)
  - why: Physiological tremor (8–12 Hz) shows on slow strokes; none at all is a plotter, too much is a costume wobble.
- **PASS** Strokes enter and leave like a pen — 100% tapered or pooled (target ≥ 70%)
  - why: A quill lands on its weight, tapers or hooks as it leaves (research 01 §1); butt ends read as plotted.
- **PASS** No cross-hatching where the style forbids it — one family per form (target one slope family)
  - why: Cross-hatching everywhere is a named fake (research 01 R10, §5).
- **PASS** Hatching is laid by hand, not by machine — 0 hatch fields, none mechanical (target gap CV ≥ 0.06 or length CV ≥ 0.12)
  - why: Equal gaps and equal lengths are the screen of a plotter.
- **PASS** Few colours: ink, construction, overlay — 2 hue families (blue, neutral) (target ≤ 2)
  - why: Monochrome ink on a light ground plus at most one accent (research 01 R12); many colours or effects is a named fake (01 §5).
- **PASS** The modern line is exact — 0 overlay marks drawn by hand (target 0)
  - why: Overlay: one hue, true segments and arcs, no jitter, texture or filter (research 03 R1, R3). The drawing keeps the hand; the line keeps its precision.
- **PASS** The pen runs low sometimes, not all the time — 1% of 1.34 m of pen ink runs starved (target 0%–20% (night))
  - why: A starved line breaks on the paper’s peaks; a few passages show the dip rhythm, a plate of them shows a dry pen (anomaly 5, research 01 §1).
- **PASS** A fresh dip shows, sometimes — 73% of dipped strokes pool (target 10%–85%)
  - why: The dip rhythm is the clock of a pen drawing: dark after the dip, paler as it drains.
- **PASS** What is behind is dashed — 0 of 39 hidden strokes drawn solid (target 0)
  - why: ISO 128: a dashed narrow line is a hidden edge (research 03 §2.1); a hidden edge drawn solid lies about depth.
- **PASS** A hand’s dashes vary; an exact line’s do not — 10 dashed lines; 0 drawn ones even, 0 exact ones uneven (target hand dash CV ≥ 0.05; exact dash CV ≤ 0.08)
  - why: Equal dashes by hand are a plotter’s; uneven dashes on the overlay break its precision (research 03 R3).

## Connections

- **PASS** Contours land where they are meant to (near, not on) — median miss 0.011 mm, worst 0.51 mm (target median 0.02–0.35, worst ≤ 1.2 mm)
  - why: A hand lands a joined line a hair short or a hair past; exactly on is a plotter, far off is a broken drawing.
- **PASS** Every construction generated something — 0 of 6 generate nothing (target 0 orphans)
  - why: Construction appears only if it generated the drawing (research 01 R11); ornamental circles and spirals are a named fake (01 §5).
- **PASS** Leaders never cross — 0 leader strokes, no crossings (target 0 crossings)
  - why: ISO 128-22 / research 03 R4–5: no free ends, no crossings.
- **PASS** A long axis is named where it leaves the figure — every long chain line named at an end (target a label within 6 mm of an end of every chain line over 30 mm)
  - why: An axis is read by its name (A–A′); the reader finds it where it runs out of the drawing.

## Typography

- **PASS** Lettering meets ISO 3098 sizes — 0 under 1.8 mm, 0 notes/dimensions under 2.5 mm (target notes and dimensions ≥ 2.5 mm; nothing under 1.8 mm)
  - why: ISO 3098 heights; print ≥ 2.5 mm (research 03 §2.5, §8).
- **WARN** Lettering holds 11 px on a 390 px phone — 43 of 43 fall under 11 px (sheet shown at 1.39 px/mm) (target 0, or a phone layout that moves them out)
  - why: Anything under ~11 px at phone width goes outside on a leader, per breakpoint (research 02 C2).
- **PASS** No two labels touch — 43 labels, none overlapping (target 0)
  - why: Each letter in clear space (research 02 R5).
- **PASS** Letters sit on clear paper, never on hatching — all clear (target ink under a label ≤ 18%)
  - why: Letters sit in clear space, never on hatching or lines; otherwise outside on a leader (research 02 R5).
- **PASS** Every label is on the sheet — 0 off the sheet (target 0)
  - why: A label off the sheet is lost.
- **PASS** Mirror script always has a readable twin — 0 mirror texts, 0 without a readable twin (target 0)
  - why: Notes are readable, non-mirrored, true (research 01 R9); pseudo-mirror writing is a named fake (01 §5).
- **PASS** One key system, few labelled parts — 3 named parts (3 letters, 0 numerals) on 10 key labels (target ≤ 7, letters or numerals, never mixed)
  - why: Capitals for up to ~8 parts, numerals beyond, never mixed (research 02 R4); at most 7 labelled items (03 R12).
- **PASS** Lettering reads against the paper — 0 under 4.5:1 on real pixels (lowest 9.08:1, fig1-label) (target ≥ 4.5:1)
  - why: WCAG 1.4.3, read on the rendered pixels when a proof is run (codex KC-8: estimates lied once), at 12 px/mm where a lettering stroke is three pixels wide, so the reading is the ink as laid and not the screen’s antialiasing.
- **PASS** Values are lettered in a type ink, not a line ink — every value in an ink meant for type (target 0 values in rubric-line or another strokes-only ink)
  - why: The tokens keep the rubric line (#B5462B) for rules, guides and leaders and give measure type its own red (#983A22); values lettered in the line red read 2.9–4.1:1 on Dawn Departs (ledger MA-17).
- **PASS** Every character is drawn — every drawn character has a glyph (target 0 blank characters)
  - why: A character with no glyph comes out as a space: “41°” read “41” before the degree sign was drawn. A silent blank changes what a value says.
- **PASS** A blot never fills a letter — 68 letter strokes, every pool under a third of its cap (target pool diameter ≤ 0.32 × cap height)
  - why: A fresh dip may blot the first letter, but a blot that fills a counter turns a 4 into a 9: a value nobody can trust (plate III, the 345 mm).
- **PASS** A label sits near its point, or a leader joins them — all within 8 mm or led (target ≤ 8 mm, or a leader)
  - why: Labels sit within one leader length of their referent (research 03 R10).

## Bleed

- **PASS** Ink wicks into the sheet as much as this paper allows — 3.91 feathers per 100 mm, median 0.027 mm (sizing 0.8) (target ≤ 30 per 100 mm on sized paper; length ≤ 0.35 mm)
  - why: Feathering follows fibres and sizing; it stays local (founder, ideas/studio-dawn/ink-bleed.md: only the nearby area).
- **PASS** Bleed stays near its line — longest mean wisp 0.129 mm (target ≤ 0.6 mm)
  - why: When ink scatters it does not affect the overall area, only the nearby (founder).
- **PASS** Bleed varies with the sheet (not a filter) — spread CV 0.25 (target ≥ 0.15)
  - why: Uniform bleed is a filter look; real bleed follows absorbency, load and fibre.
- **PASS** Chalk, graphite and metalpoint never pool or feather — 0 dry marks with pools or feathers (target 0)
  - why: Dry media sit on the tooth; they have no liquid to move.
- **PASS** Blots are events, not decoration — 16% of wet strokes pool (target 1%–40%)
  - why: Blots everywhere are costume; none at all is a plotter.

## Layout

- **PASS** The drawing keeps its margins — 0 ink strokes in the margins (target 0)
  - why: Rule the sheet first: margins, subject zone, key and notes zones (research 02 R1).
- **PASS** The weight of the ink sits at or above the middle — ink centroid at 51% of the height (target ≤ 52%)
  - why: The codex “rise”: the sheet carries its weight high (kiruk-codex check.mjs; KC rows). Measured here as the ink-weighted centroid.
- **PASS** The sheet is balanced left to right — ink centroid at 52% of the width (target 50% ± 12%)
  - why: The subject is centred and largest; commentary frames it (research 02 R2).
- **PASS** White space is reserved on purpose — 61% of the sheet is paper (target 30%–85%)
  - why: Main figure first, details around it, white space reserved (research 01 §2, R8); collage density is a named fake (01 §5).

## Creativity

- **PASS** The plate says what it explains — “The eye turns about three axes through one centre: the vertical axis carries the gaze left and right, the transverse axis lifts and lowers it, and the line of sight rolls it.” (target one true sentence, ≥ 6 words)
  - why: Claim first (codex): the drawing shows what it is; the line shows why it works.
- **PASS** The eye motif is drawn, or its absence justified — drawn: the globe of the eye itself, with its cornea and pupil, turning on its three axes (target a reference or a reason)
  - why: Non-negotiable 4 (CLAUDE.md §5).
- **PASS** An explanatory device, not a pretty view — construction in axonometric view, with the turned gaze as a phase in plan (two views) (target section · exploded · build-up · phase · side-by-side · thread · construction)
  - why: Choose the device by what must be explained (research 01 R4); one pretty 3/4 view with arrows is a named fake (01 §5).
- **PASS** Finish is selective; the process shows — 0 of 0 forms toned; 0% of the construction stands bare (target some parts left at line or construction; construction visible)
  - why: Everything finished to the same degree is a named fake (research 01 §5, ¶579); kiruk shows its process (CLAUDE.md §2).
- **PASS** More than one view of the subject — 2 views (target ≥ 2)
  - why: Leonardo asked for three or four views (research 01 R3, ¶798).
- **PASS** No costume: the look comes with its reasons — none found (target none)
  - why: Research 01 §5: faux age, pseudo-mirror writing, ornamental geometry, all-over cross-hatching, many effects.
- **LOOK** Founder’s eye: a hand, not a plotter, not a costume — and new — open (target founder’s verdict)
  - why: Non-negotiables 1–3 (no trend-chasing, no boring work, no shallow branding) cannot be computed. Look at the 4× crops first, then the whole sheet at phone width.
- **PASS** The subject is listed part by part, and every part is complete — 8 parts, 0 incomplete (target every part drawn, keyed and noted, finished and measured as declared)
  - why: List the parts before drawing; check each on its own (the anatomy method: size, truth, the object, its parts, verify).

## Anatomy

| Part   | Name                                  | Finish | Status   |
| ------ | ------------------------------------- | ------ | -------- |
| globe  | the globe                             | line   | complete |
| cornea | cornea rim and pupil                  | line   | complete |
| planes | equator, sagittal and frontal circles | line   | complete |
| axis-z | vertical axis                         | line   | complete |
| axis-x | transverse axis                       | line   | complete |
| axis-y | line of sight                         | line   | complete |
| sweep  | the gaze carried round Z              | line   | complete |
| plan   | Fig. 2, the plan                      | line   | complete |

## Stats

- marks: 350
- inkStrokes: 91
- hatchFields: 0
- texts: 43
- dimensions: 1
- constructions: 6
- forms: 0
- minHatchGap: 0
