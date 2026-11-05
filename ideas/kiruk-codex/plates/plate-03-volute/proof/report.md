# Proof — Plate III — The eye of the volute

Plate `plate-03-volute` · style `architect` · verdict **WARN**

| Dimension   | pass | warn | fail | look |
| ----------- | ---: | ---: | ---: | ---: |
| lighting    |   10 |    0 |    0 |    0 |
| measurement |   22 |    0 |    0 |    0 |
| style       |   10 |    0 |    0 |    0 |
| connections |    3 |    0 |    0 |    0 |
| typography  |   11 |    1 |    0 |    0 |
| bleed       |    5 |    0 |    0 |    0 |
| layout      |    4 |    0 |    0 |    0 |
| creativity  |    7 |    0 |    0 |    1 |

## Lighting

- **PASS** Every tone is tied to a form under the one light — 0 of 128 hatch strokes without a form (target 0)
  - why: One light per plate, declared (research 02 §11). Tone not tied to a form cannot be proved against it.
- **PASS** Ink follows the light on “egg-1” — ρ = 0.77 (tone vs ink, 41 cells) (target ρ ≥ 0.6)
  - why: Darker target tone must carry more ink everywhere on the form; Leonardo ¶555: shadow first on the part away from the light.
- **PASS** The lit side of “egg-1” stays paper — lit 0 vs dark 0.39 ink/mm² (target lit ≤ 25% of dark)
  - why: Where the light falls the paper is the light; ink there flattens the form.
- **PASS** Ink follows the light on “egg-2” — ρ = 0.79 (tone vs ink, 41 cells) (target ρ ≥ 0.6)
  - why: Darker target tone must carry more ink everywhere on the form; Leonardo ¶555: shadow first on the part away from the light.
- **PASS** The lit side of “egg-2” stays paper — lit 0 vs dark 0.422 ink/mm² (target lit ≤ 25% of dark)
  - why: Where the light falls the paper is the light; ink there flattens the form.
- **PASS** Ink follows the light on “egg-3” — ρ = 0.78 (tone vs ink, 41 cells) (target ρ ≥ 0.6)
  - why: Darker target tone must carry more ink everywhere on the form; Leonardo ¶555: shadow first on the part away from the light.
- **PASS** The lit side of “egg-3” stays paper — lit 0 vs dark 0.402 ink/mm² (target lit ≤ 25% of dark)
  - why: Where the light falls the paper is the light; ink there flattens the form.
- **PASS** Ink follows the light on “shaft” — ρ = 0.72 (tone vs ink, 220 cells) (target ρ ≥ 0.6)
  - why: Darker target tone must carry more ink everywhere on the form; Leonardo ¶555: shadow first on the part away from the light.
- **PASS** The lit side of “shaft” stays paper — lit 0.01 vs dark 0.321 ink/mm² (target lit ≤ 25% of dark)
  - why: Where the light falls the paper is the light; ink there flattens the form.
- **PASS** Contours are heavy away from the light — shadow side 2.45× the lit side (target ≥ 1.15×)
  - why: The quill contour swells where the edge turns from the light (research 01 §1: variable weight).

## Measurement

- **PASS** Dimension dim-height says what the ink measures — label “250 mm”, ink 249.994 mm (target |Δ| ≤ 1.25)
  - why: Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed.
- **PASS** Extension lines of dim-height: gap and overshoot — gap 1.5 mm, overshoot 2.6 mm (target gap ≈ 1.5 (0.8–2.5), overshoot 2.5–3 (1.5–3.6) mm)
  - why: ISO 129-1 / ASME as cited in research 03 §2.2.
- **PASS** dim-height measures the visible ink — both ends on ink (target both ends within 0.8 mm of ink)
  - why: Measure to the visible ink or a stated datum, never to the bounding box (research 03 R9).
- **PASS** dim-height stands clear of the drawing — 43.52 mm from the feature (target ≥ 6 mm (first tier 10–12 mm))
  - why: Research 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart.
- **PASS** Dimension capital-bottom says what the ink measures — label “329 mm”, ink 328.683 mm (target |Δ| ≤ 1.643)
  - why: Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed.
- **PASS** Extension lines of capital-bottom: gap and overshoot — gap 1.5 mm, overshoot 2.6 mm (target gap ≈ 1.5 (0.8–2.5), overshoot 2.5–3 (1.5–3.6) mm)
  - why: ISO 129-1 / ASME as cited in research 03 §2.2.
- **PASS** capital-bottom measures the visible ink — both ends on ink (target both ends within 0.8 mm of ink)
  - why: Measure to the visible ink or a stated datum, never to the bounding box (research 03 R9).
- **PASS** capital-bottom stands clear of the drawing — 107.69 mm from the feature (target ≥ 6 mm (first tier 10–12 mm))
  - why: Research 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart.
- **PASS** Dimension capital-right says what the ink measures — label “281 mm”, ink 280.578 mm (target |Δ| ≤ 1.403)
  - why: Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed.
- **PASS** Extension lines of capital-right: gap and overshoot — gap 1.5 mm, overshoot 2.6 mm (target gap ≈ 1.5 (0.8–2.5), overshoot 2.5–3 (1.5–3.6) mm)
  - why: ISO 129-1 / ASME as cited in research 03 §2.2.
- **PASS** capital-right measures the visible ink — both ends on ink (target both ends within 0.8 mm of ink)
  - why: Measure to the visible ink or a stated datum, never to the bounding box (research 03 R9).
- **PASS** capital-right stands clear of the drawing — 13.4 mm from the feature (target ≥ 6 mm (first tier 10–12 mm))
  - why: Research 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart.
- **PASS** Dimension dim-eye says what the ink measures — label “32 mm”, ink 32 mm (target |Δ| ≤ 0.5)
  - why: Nothing on a plate is invented (codex step 2); a value is measured from the drawing, never typed.
- **PASS** Extension lines of dim-eye: gap and overshoot — gap 1.5 mm, overshoot 2.6 mm (target gap ≈ 1.5 (0.8–2.5), overshoot 2.5–3 (1.5–3.6) mm)
  - why: ISO 129-1 / ASME as cited in research 03 §2.2.
- **PASS** dim-eye measures the visible ink — both ends on ink (target both ends within 0.8 mm of ink)
  - why: Measure to the visible ink or a stated datum, never to the bounding box (research 03 R9).
- **PASS** dim-eye stands clear of the drawing — 27.5 mm from the feature (target ≥ 6 mm (first tier 10–12 mm))
  - why: Research 03 §2.2: first dimension line 10–12 mm out, tiers 6–10 mm apart.
- **PASS** The plate states a unit or module — unit mm (target a scale bar or a dimension)
  - why: Every plate states a unit or module, or shows a familiar object at scale (research 01 R13, 02 R13).
- **PASS** Every fact on the plate has a source — 5 facts, 0 without a source (target all sourced)
  - why: If it is not in the truth table it is not on the sheet (codex step 2).
- **PASS** The figure states its overall size — 2 overall dimensions, 1 graduated neatlines (target overall extents in the outer tier, or a graduated neatline)
  - why: A reader must be able to measure the whole, not only its parts (ISO 129; research 03 §2.2, R14).
- **PASS** Smaller dimensions inside, the overall outside — 2 overall dimensions outermost (target every overall dimension in the outermost tier on its side)
  - why: ISO 129 / research 03 §2.2: smaller dimensions inside, larger outside, so lines do not cross.
- **PASS** Parallel tiers stand a tier apart — every overlapping pair ≥ 6 mm apart (target ≥ 6 mm between overlapping parallel dimension lines (fail under 4 mm))
  - why: Research 03 §2.2: tiers 6–10 mm apart. Closer, the values of two tiers sit side by side and read as one (plate III: 281 mm against 250 mm, 2 mm apart).
- **PASS** Neatline fig1-neat is graduated true and frames its figure — 20 mm per step at 4 mm/mm; 0 ink strokes cross it (target the plate scale; no ink across the frame)
  - why: A graduated frame is a ruler laid round the figure: its steps must be the plate’s unit at the plate’s scale.

## Style

- **PASS** Line width breathes (not a plotter, not chaos) — median width CV 0.22 over 160 strokes (target 0.12–0.7 (architect))
  - why: Taper and variable weight are the defining marks of the hand (research 01 §1); constant width is the plotter tell.
- **PASS** The hand trembles a little, where it is slow — median tremor 0.009 mm (target 0.003–0.045 mm)
  - why: Physiological tremor (8–12 Hz) shows on slow strokes; none at all is a plotter, too much is a costume wobble.
- **PASS** Strokes enter and leave like a pen — 100% tapered or pooled (target ≥ 70%)
  - why: A quill lands on its weight, tapers or hooks as it leaves (research 01 §1); butt ends read as plotted.
- **PASS** Each surface keeps its own direction — 5 hatch fields, one direction each (target one family per surface)
  - why: A different angle for each adjacent part, regular within it (research 02 §11, R9).
- **PASS** Hatching is laid by hand, not by machine — 6 hatch fields, none mechanical (target gap CV ≥ 0.06 or length CV ≥ 0.12)
  - why: Equal gaps and equal lengths are the screen of a plotter.
- **PASS** Few colours: ink, construction, overlay — 1 hue families (neutral) (target ≤ 3)
  - why: Monochrome ink on a light ground plus at most one accent (research 01 R12); many colours or effects is a named fake (01 §5).
- **PASS** The modern line is exact — 0 overlay marks drawn by hand (target 0)
  - why: Overlay: one hue, true segments and arcs, no jitter, texture or filter (research 03 R1, R3). The drawing keeps the hand; the line keeps its precision.
- **PASS** Outline > interior > construction — contour 0.288 · hatch 0.201 · construction 0.061 (width × density) (target decreasing)
  - why: Line weight hierarchy (research 02 R14).
- **PASS** The pen runs low sometimes, not all the time — 1% of 3.03 m of pen ink runs starved (target 0%–20% (architect))
  - why: A starved line breaks on the paper’s peaks; a few passages show the dip rhythm, a plate of them shows a dry pen (anomaly 5, research 01 §1).
- **PASS** A fresh dip shows, sometimes — 70% of dipped strokes pool (target 10%–80%)
  - why: The dip rhythm is the clock of a pen drawing: dark after the dip, paler as it drains.

## Connections

- **PASS** Contours land where they are meant to (near, not on) — median miss 0.068 mm, worst 0.67 mm (target median 0.02–0.35, worst ≤ 1.2 mm)
  - why: A hand lands a joined line a hair short or a hair past; exactly on is a plotter, far off is a broken drawing.
- **PASS** Every construction generated something — 0 of 43 generate nothing (target 0 orphans)
  - why: Construction appears only if it generated the drawing (research 01 R11); ornamental circles and spirals are a named fake (01 §5).
- **PASS** Leaders never cross — 2 leader strokes, no crossings (target 0 crossings)
  - why: ISO 128-22 / research 03 R4–5: no free ends, no crossings.

## Typography

- **PASS** Lettering meets ISO 3098 sizes — 0 under 1.8 mm, 0 notes/dimensions under 2.5 mm (target notes and dimensions ≥ 2.5 mm; nothing under 1.8 mm)
  - why: ISO 3098 heights; print ≥ 2.5 mm (research 03 §2.5, §8).
- **WARN** Lettering holds 11 px on a 390 px phone — 46 of 46 fall under 11 px (sheet shown at 1.39 px/mm) (target 0, or a phone layout that moves them out)
  - why: Anything under ~11 px at phone width goes outside on a leader, per breakpoint (research 02 C2).
- **PASS** No two labels touch — 46 labels, none overlapping (target 0)
  - why: Each letter in clear space (research 02 R5).
- **PASS** Letters sit on clear paper, never on hatching — all clear (target ink under a label ≤ 18%)
  - why: Letters sit in clear space, never on hatching or lines; otherwise outside on a leader (research 02 R5).
- **PASS** Every label is on the sheet — 0 off the sheet (target 0)
  - why: A label off the sheet is lost.
- **PASS** Mirror script always has a readable twin — 0 mirror texts, 0 without a readable twin (target 0)
  - why: Notes are readable, non-mirrored, true (research 01 R9); pseudo-mirror writing is a named fake (01 §5).
- **PASS** One key system, few labelled parts — 4 named parts (4 letters, 0 numerals) on 4 key labels (target ≤ 7, letters or numerals, never mixed)
  - why: Capitals for up to ~8 parts, numerals beyond, never mixed (research 02 R4); at most 7 labelled items (03 R12).
- **PASS** Lettering reads against the paper — 0 under 4.5:1 on real pixels (lowest 7.89:1, fig2-c3-label) (target ≥ 4.5:1)
  - why: WCAG 1.4.3, read on the rendered pixels when a proof is run (codex KC-8: estimates lied once), at 12 px/mm where a lettering stroke is three pixels wide, so the reading is the ink as laid and not the screen’s antialiasing.
- **PASS** Values are lettered in a type ink, not a line ink — every value in an ink meant for type (target 0 values in rubric-line or another strokes-only ink)
  - why: The tokens keep the rubric line (#B5462B) for rules, guides and leaders and give measure type its own red (#983A22); values lettered in the line red read 2.9–4.1:1 on Dawn Departs (ledger MA-17).
- **PASS** Every character is drawn — every drawn character has a glyph (target 0 blank characters)
  - why: A character with no glyph comes out as a space: “41°” read “41” before the degree sign was drawn. A silent blank changes what a value says.
- **PASS** A blot never fills a letter — 110 letter strokes, every pool under a third of its cap (target pool diameter ≤ 0.32 × cap height)
  - why: A fresh dip may blot the first letter, but a blot that fills a counter turns a 4 into a 9: a value nobody can trust (plate III, the 345 mm).
- **PASS** A label sits near its point, or a leader joins them — all within 8 mm or led (target ≤ 8 mm, or a leader)
  - why: Labels sit within one leader length of their referent (research 03 R10).

## Bleed

- **PASS** Ink wicks into the sheet as much as this paper allows — 20.71 feathers per 100 mm, median 0.076 mm (sizing 0.6) (target ≤ 30 per 100 mm on sized paper; length ≤ 0.35 mm)
  - why: Feathering follows fibres and sizing; it stays local (founder, ideas/studio-dawn/ink-bleed.md: only the nearby area).
- **PASS** Bleed stays near its line — longest mean wisp 0.279 mm (target ≤ 0.6 mm)
  - why: When ink scatters it does not affect the overall area, only the nearby (founder).
- **PASS** Bleed varies with the sheet (not a filter) — spread CV 0.22 (target ≥ 0.15)
  - why: Uniform bleed is a filter look; real bleed follows absorbency, load and fibre.
- **PASS** Chalk, graphite and metalpoint never pool or feather — 0 dry marks with pools or feathers (target 0)
  - why: Dry media sit on the tooth; they have no liquid to move.
- **PASS** Blots are events, not decoration — 8% of wet strokes pool (target 1%–40%)
  - why: Blots everywhere are costume; none at all is a plotter.

## Layout

- **PASS** The drawing keeps its margins — 0 ink strokes in the margins (target 0)
  - why: Rule the sheet first: margins, subject zone, key and notes zones (research 02 R1).
- **PASS** The weight of the ink sits at or above the middle — ink centroid at 52% of the height (target ≤ 52%)
  - why: The codex “rise”: the sheet carries its weight high (kiruk-codex check.mjs; KC rows). Measured here as the ink-weighted centroid.
- **PASS** The sheet is balanced left to right — ink centroid at 49% of the width (target 50% ± 12%)
  - why: The subject is centred and largest; commentary frames it (research 02 R2).
- **PASS** White space is reserved on purpose — 43% of the sheet is paper (target 30%–85%)
  - why: Main figure first, details around it, white space reserved (research 01 §2, R8); collage density is a named fake (01 §5).

## Creativity

- **PASS** The plate says what it explains — “A volute is twelve quarter-circles struck from twelve centres inside its eye; each centre lies on the last arc’s end radius, so the scroll turns without a corner.” (target one true sentence, ≥ 6 words)
  - why: Claim first (codex): the drawing shows what it is; the line shows why it works.
- **PASS** The eye motif is drawn, or its absence justified — drawn: the oculus of the Ionic volute — the eye from which the scroll is struck (target a reference or a reason)
  - why: Non-negotiable 4 (CLAUDE.md §5).
- **PASS** An explanatory device, not a pretty view — construction and build-up, with an enlargement of the eye (×6) (target section · exploded · build-up · phase · side-by-side · thread · construction)
  - why: Choose the device by what must be explained (research 01 R4); one pretty 3/4 view with arrows is a named fake (01 §5).
- **PASS** Finish is selective; the process shows — 6 of 6 forms toned; 54% of the construction stands bare (target some parts left at line or construction; construction visible)
  - why: Everything finished to the same degree is a named fake (research 01 §5, ¶579); kiruk shows its process (CLAUDE.md §2).
- **PASS** More than one view of the subject — 2 views (target ≥ 2)
  - why: Leonardo asked for three or four views (research 01 R3, ¶798).
- **PASS** No costume: the look comes with its reasons — none found (target none)
  - why: Research 01 §5: faux age, pseudo-mirror writing, ornamental geometry, all-over cross-hatching, many effects.
- **LOOK** Founder’s eye: a hand, not a plotter, not a costume — and new — open (target founder’s verdict)
  - why: Non-negotiables 1–3 (no trend-chasing, no boring work, no shallow branding) cannot be computed. Look at the 4× crops first, then the whole sheet at phone width.
- **PASS** The subject is listed part by part, and every part is complete — 9 parts, 0 incomplete (target every part drawn, keyed and noted, finished and measured as declared)
  - why: List the parts before drawing; check each on its own (the anatomy method: size, truth, the object, its parts, verify).

## Anatomy

| Part            | Name                       | Finish       | Status   |
| --------------- | -------------------------- | ------------ | -------- |
| abacus          | abacus                     | line         | complete |
| volute-outer    | the scroll and the canalis | line         | complete |
| canalis         | the canalis, shaded        | tone         | complete |
| volute-eye      | the eye (oculus)           | line         | complete |
| volute-cathetus | the cathetus               | construction | complete |
| volute-fillet   | the fillet                 | line         | complete |
| egg             | echinus, egg and dart      | tone         | complete |
| shaft           | the fluted shaft           | tone         | complete |
| fig2            | Fig. 2, the eye ×6         | line         | complete |

## Stats

- marks: 500
- inkStrokes: 160
- hatchFields: 6
- texts: 46
- dimensions: 4
- constructions: 43
- forms: 6
- minHatchGap: 0.179
