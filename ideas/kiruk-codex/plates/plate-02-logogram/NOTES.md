---
plate: II
title: The anatomy of the logogram
size: Plate (announced before work)
skill: .claude/skills/kiruk-codex (used as written; no file in it was edited)
status: test plate — founder has not seen it
date: 2026-10-20
---

# Plate II · The anatomy of the logogram

Files: `index.html` (self-contained apart from Google Fonts; the rest state is baked in as static SVG, so it renders complete with no script), `truth.json` (embedded in the page as `#truth`, identical), this file. `shots/index/` holds the last `check.mjs` run.

## Claim (step 1)

> The kiruk logogram reads as an eye that points every way because its needles, spears and points all stand on one 15° dial around an open centre.

The verbs come from the founder's own words (`ideas/studio-dawn/plan.md`, § Logo): "the shape reads as an eye", "8 directions = giving the right direction". The mechanism is measured, not interpreted (step 2).

## Truth (step 2): what the path data says

Measured from `apps/kiruk-web/public/favicon.svg` with a node script (end points of each `M…L` needle; filled paths sampled at 60 points per cubic and scanned with point-in-polygon; spear shafts as the distance between their straight edges). Raster facts from the same path strings filled with `Path2D` on N × N canvases in Chromium. Everything is in `truth.json`; the headline findings:

- **24 positions on a 15° dial.** 16 needles stand at exactly 15°, 30°, 60° and 75° from the upright in each quarter; 4 spears at 44.5–44.7°; 4 points on the axes. That makes every 15° direction, 24 in all.
- **Set by eye.** The needle angles are exact, but their lines pass 0.2–11.4 u from the centre (the 75° needles 6.7–11.4 u). Left and right mirror within 0.3 u at 15° and 75°, but differ 7–9 u at 30° and 60°.
- **One weight.** Needles are 10 u strokes (butt caps); spear shafts 9.2–9.9 u. Needle lengths 80, 80, 160, 220 u. Inner ends all sit on one circle, r 191.7–198.8 (mean 195.0).
- **The eye.** The envelope is 960 × 560 (12 : 7). A lens of two arcs (R 551.4) through the four points holds every needle and spear tip, 2.9–24.2 u inside. The hole is r 60, a mask, ⌀ 1/8 of the width.
- **Scale (the finding that matters most).** At 16 px no pixel is solid (darkest 71 %); a pixel holding only needle reaches 14 %; the hole does **not** survive: the four centre pixels are 25–31 % inked. The hole opens at 32 px. A needle first fills a pixel at 100 px. The favicon is one SVG with no small-size adjustment.
- **Sizes and sources.** 16 px tab (Chromium `kFaviconSize = 16`), 32 px favicon.ico (Evil Martians, "How to Favicon in 2026"), 64 px on studio.kiruk.in's placeholder page (`index.astro`), 180 / 512 px apple-touch and manifest (Evil Martians; favicon-cheat-sheet). 180 and 512 are not shipped yet.
- **The light export** hides 6 shapes under the body and has 46 empty groups; the favicon cut leaves them all out.
- **No founder scribble** exists: `ideas/studio-dawn/scribble/manifest.md` has no rows.

## Step 3: how it went for a mark

The founder named the object ("the kiruk logogram as an interactive layer stack"), and `marks.md` says that when the subject is a designed mark, "the real thing is the mark". So the object step collapsed into "use the mark itself". `SKILL.md` step 3 still says "for a Plate, show the founder the three one-line candidates first", and neither file says whether that still applies to a mark.

For the record, the three I would have shown, each differing in metaphor:

1. **Layer stack**, the founder's choice: five sheets, scribble to shipped mark. Mapping: concept sheet → his four readings; form sheet → the 15° dial and the circles; line sheet → the 10 u strokes; colour sheet → one ink, two grounds, the cut hole; scale sheet → the pixels it becomes. Nothing unmapped.
2. **The mark as a dial (rota):** a 24-hour dial plate with the needles as hour lines. Maps the 15° claim well, but says nothing about colour or scale, and "hours" would be my meaning, not his.
3. **An eye in Vesalian anatomy:** lid (the lens), iris (the needle circle), pupil (the hole). It maps "reads as an eye" but invents an anatomy he never named.

Did the rule make sense here? Only half. For a mark, the metaphor question is already answered (it is the mark), so "three metaphors" turns into a search for fake alternatives. What did help was asking which _device_ carries the claim (stack vs rota vs anatomy). That question is worth keeping; the three-metaphor rule is not, once the founder has named the subject.

## Devices (step 4)

1. **Layer stack** (`devices.md` → `marks.md`): five planes, bottom to top, concept → form → line → colour → scale. They climb up and to the right (178 u right, 134 u up per plane), on a 37° rise.
2. **Scale referent and magnified view:** the strip of true-size favicons (16, 32, 64 px, kept true by counter-scaling at any window width), the 16 px raster at × 8, and an ISO detail circle of a needle end at × 8 (of the plate).

Construction (the form plane's dial) and the satellites don't count toward the two.

## Planes and their sublayers

| Plane (depth at rest) | Ink (what is drawn)                                                                                                                          | Red (what is said)                                                                                                                      | Sublayers shown                                                                                         | Sublayers left out, and why                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Concept** (4, back) | the mark at 45 % ("the idea, not yet inked"); the pen lens through the four points (F)                                                       | four leaders from parts to the founder's words: "an eye" → lens, "support" → arm, "time angles" → needle, "the right direction" → spear | the metaphor, the founder's words, "not final"                                                          | the first scribble: none on file, said on the sheet; the rejected candidates: in these notes, not drawn       |
| **Form** (3)          | the mark at 25 % under its geometry                                                                                                          | 15° arc between two rays; G leader to the r 195 circle                                                                                  | axes (every body path closes on x 1000 / y 1000), 24 rays at 15°, hole circle r 60, needle circle r 195 | grid / live area (rectangle cut: no note supported it, Tufte); overshoot (none in this mark)                  |
| **Line** (2)          | the 16 needles alone (`#lg-strokes`)                                                                                                         | detail circle on one needle end → the × 8 satellite with its 10 u ISO dimension                                                         | weight, cap (square), lengths                                                                           | joins and corner radii: single straight segments, so joins never show                                         |
| **Colour** (1)        | the mark on its two grounds: black on white (light export) and white on black (dark export), split at the centre; the hole shows each ground | 21 : 1                                                                                                                                  | palette, role, grounds, contrast                                                                        | opacity layers (primary / secondary / tertiary): the mark is one ink, so inventing a hierarchy would be false |
| **Scale** (0, front)  | the finished mark, flat, at 256 px; while a size is scrubbed, the browser's own N px raster at × 16 / × 8 / × 4 with its pixel grid          | letters A, C, D, E; × N while scrubbing                                                                                                 | size set, pixel grid, what drops out                                                                    | optical adjustments: the favicon has none, which the scale note says                                          |

Parts named (16): the hole; the upper, lower, east and west points (the east/west arms are E, "the line"); the NE, NW, SE and SW spears; the 15°, 30°, 60° and 75° needles; the needle circle; the lens; one 16 px pixel. Lettered A–H: hole, needles, spears, points, line, eye, needle circle, pixel. The key is HTML under the sheet, and each entry brings its plane forward.

## Interaction (step 11)

- **Open / close** (verb 1): drag ↕ on the sheet (mouse or pen), ↑ ↓ in quarters, Enter or Space toggles, or the Layers slider. Closing slides every plane up onto the top one; nothing ever stacks downward. Drags follow the hand with a 0.1 s exponential follow; state changes ease out over 180–320 ms. Under reduced motion every change jumps.
- **Scrub size** (verb 2): ← → or the Size slider, 256 (as drawn) → 64 → 32 → 16. The scale plane swaps the vector for the real raster at that size and its pixel grid, and the one red selection moves to that size in the strip.
- **Focus** (always on): tap or click a plane, keys 1–5, or hover / focus a key entry. The plane comes to the front of the paint order, lifts 4 px toward the light and takes the selection frame. Receded planes hide their measurements; plane names and letters stay. Esc releases, Home returns to rest.
- **Touch:** a vertical drag stays page scroll (`touch-action: pan-y`), so the phone opens and closes by its slider, and its hint says "tap a plane to bring it forward".
- **States** (`window.codexStates.names`): `rest, closed, half, focus-concept, focus-form, focus-line, focus-colour, focus-scale, size-64, size-32, size-16`. `half` was added because a mid-drag frame found a real fault the rest state could not show (see Skill feedback, check.mjs).
- **No script:** the rest state is baked into the HTML as static SVG. With JavaScript off the plate is complete, identical to rest. The builder code stays in the page and runs only when the baked markup is removed (`data-baked` off, sheet divs emptied).

Tried by hand with a Playwright script, beyond `check.mjs`:

- **Mid-drag** (264 px down, 40 ms after the last move): 53 % open, settling to 51 % under the hand.
- **Taps and keys:** a tap brought concept forward; key 2 brought form forward; Esc, ↓ (75 %), Enter (0 %, then 100 %), ← ← ← (16 px) and Home all landed. With reduced motion, the state was already final 20 ms after Enter.
- **Slider and selection:** the slider thumb follows the hand; no text is selected after a drag.
- **Touch and console:** a phone tap brought the line plane forward. No console errors.

Faults the hands-on pass found, all fixed:

- Dragging selected text.
- The slider fought the hand: every frame rewrote its value.
- On touch, the 1 px chain line swallowed taps.
- The static notes collided with moving planes in the half-open frame.

## Decisions where I bent or read a rule

- **Offset:** 178 / 134 u, not "about 28 u right and 56 u up". With opaque sheets, 28 / 56 u hides most of every lower plane, and the rest state must have every plane readable.
- **Opacity steps:** 15 %, not 20 % (100 / 85 / 70 / 55 / 40), so five planes get five distinct levels above the 40 % floor. They follow the stack position, not focus: when focus re-inked the focused plane and dimmed the others, focusing concept moved the ink weight to 48.4 % and 31.4 % in the bottom third, failing the rise check. Focus is paint order + lift + the selection frame instead.
- **Opacity scope:** it applies to each plane's drawing and contour only. Words are full contrast or hidden; the colour plane's grounds keep their true black and white.
- **Notes belong to planes:** they move with their plane and show only on clear ground (no other plane, satellite or higher note under them). This is depth.md's "a word belongs to one plane", applied to prose too.
- **Hidden edges** of lower planes are dashed on the upper plane's own paper, in the upper plane's group. depth.md says to put them in the lower plane's group, where an opaque upper sheet covers them.
- **The colour plane is split** light / dark at the centre. That is what `marks.md` asks for ("the mark on its light and dark grounds"), but founder rule 2 forbids "a light half and a dark half". I read rule 2 as being about the drawing and the line, not about a colour aspect.
- **`data-subject`** sits on the scale plane's drawing only. A wrapper around the stack would drag every sheet into the ink-only rise screenshot.
- **"The line" = the long horizontal arms (E).** This is my reading, flagged on the sheet ("read here as") and in the key. The founder's plan doesn't say which part he means.
- **Contour weight and tone fall off toward the bottom** (composition.md): quill 1.6 → 2.4 px from the bottom plane to the top (phone 1.0 → 2.4), cast shadows lighter below.

## Final `check.mjs` output (every state)

`node .claude/skills/kiruk-codex/scripts/check.mjs ideas/kiruk-codex/plates/plate-02-logogram/index.html` → **exit 0, "all checks passed"**, `console: clean` at both widths, 14 crops at 4×.

Desktop, rest, verbatim:

```
ok   layers: wash 12 · construction 20 · ink 34 · letters 12 · line 14 · notes 15
ok   subject: one [data-subject] inside the ink layer
ok   eye motif: 20 [data-eye]
     weights: construction 0.60–0.60px · line 1.00–1.00px · ink 1.60–2.40px
ok   modern line is a hairline: heaviest 1.00px (≤ 1.25)
ok   the pen carries the weight: heaviest ink 2.40px (≥ 2, twice the line)
ok   construction stays faint: heaviest 0.60px (≤ 0.8)
ok   modern line is one hue: 1 (#b5462b #983a22)
ok   line ends: 0 of 32 float
ok   notes stay off the subject: 0 run(s) over it
ok   smallest text 11.0px "drag ↕ to open the layers · ← → " (≥ 11)
ok   no mirror writing: 0 mirrored run(s)
ok   fonts loaded: IM Fell English, IM Fell English SC, JetBrains Mono, IM Fell Double Pica, Xanh Mono
ok   modern-line labels: 9 (≤ 9)
ok   no sideways scroll at 1440px (page 1440px)
ok   contrast: 0 run(s) under the floor · tightest 5.05:1 "H" on #dbd9d7
ok   rise: ink weight sits at 41.8% of the height (≤ 45%)
ok   rise: 16.0% of the ink in the bottom third (≤ 20%)
```

Phone, rest, verbatim (the lines that differ): `weights: construction 0.58 · line 1.00 · ink 0.96–2.31px`, `the pen carries the weight: 2.31px`, `line ends: 0 of 10 float`, `smallest text 11.0px`, `modern-line labels: 5`, `contrast: tightest 5.17:1 "64 px"`, `rise: 42.2%`, `16.6% in the bottom third`.

Every state (ok / fail counts include the per-viewport console line on the last state):

| sheet   | state         | ok / fail | line ends floating | line labels | smallest px | tightest contrast | ink weight | bottom third |
| ------- | ------------- | --------- | ------------------ | ----------- | ----------- | ----------------- | ---------- | ------------ |
| desktop | rest          | 17 / 0    | 0 of 32            | 9           | 11.0        | 5.05 : 1 "H"      | 41.8 %     | 16.0 %       |
| desktop | closed        | 17 / 0    | 0 of 18            | 7           | 11.0        | 5.05 : 1 "H"      | 25.6 %     | 0.0 %        |
| desktop | half          | 17 / 0    | 0 of 22            | 9           | 11.0        | 5.05 : 1 "H"      | 33.0 %     | 0.0 %        |
| desktop | focus-concept | 17 / 0    | 0 of 28            | 7           | 11.0        | 5.05 : 1 "H"      | 41.8 %     | 16.1 %       |
| desktop | focus-form    | 17 / 0    | 0 of 22            | 8           | 11.0        | 5.05 : 1 "H"      | 41.7 %     | 15.7 %       |
| desktop | focus-line    | 17 / 0    | 0 of 20            | 7           | 11.0        | 5.05 : 1 "H"      | 41.7 %     | 16.0 %       |
| desktop | focus-colour  | 17 / 0    | 0 of 20            | 8           | 11.0        | 5.05 : 1 "H"      | 41.7 %     | 16.0 %       |
| desktop | focus-scale   | 17 / 0    | 0 of 20            | 7           | 11.0        | 5.05 : 1 "H"      | 41.6 %     | 16.0 %       |
| desktop | size-64       | 17 / 0    | 0 of 24            | 8           | 11.0        | 5.05 : 1 "H"      | 40.9 %     | 15.3 %       |
| desktop | size-32       | 17 / 0    | 0 of 24            | 8           | 11.0        | 5.05 : 1 "H"      | 40.0 %     | 14.7 %       |
| desktop | size-16       | 18 / 0    | 0 of 24            | 8           | 11.0        | 5.05 : 1 "H"      | 40.6 %     | 15.2 %       |
| phone   | rest          | 17 / 0    | 0 of 10            | 5           | 11.0        | 5.17 : 1 "64 px"  | 42.2 %     | 16.6 %       |
| phone   | closed        | 17 / 0    | 0 of 4             | 4           | 11.0        | 5.17 : 1 "64 px"  | 25.6 %     | 0.0 %        |
| phone   | half          | 17 / 0    | 0 of 8             | 5           | 11.0        | 5.17 : 1 "64 px"  | 34.6 %     | 0.0 %        |
| phone   | focus-concept | 17 / 0    | 0 of 4             | 4           | 11.0        | 5.17 : 1 "64 px"  | 41.9 %     | 15.9 %       |
| phone   | focus-form    | 17 / 0    | 0 of 8             | 5           | 11.0        | 5.17 : 1 "64 px"  | 42.2 %     | 16.2 %       |
| phone   | focus-line    | 17 / 0    | 0 of 6             | 4           | 11.0        | 5.17 : 1 "64 px"  | 42.1 %     | 16.3 %       |
| phone   | focus-colour  | 17 / 0    | 0 of 6             | 4           | 11.0        | 5.17 : 1 "64 px"  | 42.2 %     | 16.8 %       |
| phone   | focus-scale   | 17 / 0    | 0 of 6             | 4           | 11.0        | 5.17 : 1 "64 px"  | 42.0 %     | 16.6 %       |
| phone   | size-64       | 17 / 0    | 0 of 10            | 5           | 11.0        | 5.13 : 1 "64 px"  | 41.7 %     | 16.1 %       |
| phone   | size-32       | 17 / 0    | 0 of 10            | 5           | 11.0        | 5.03 : 1 "C"      | 41.1 %     | 15.5 %       |
| phone   | size-16       | 18 / 0    | 0 of 10            | 5           | 11.0        | 4.98 : 1 "C"      | 41.6 %     | 16.0 %       |

The check needed 12 runs to reach this.

- **Faults it caught:** contrast of A over the raster; the rise in focus states and on the phone; scale-bar ends; detail extension lines.
- **Faults found by reading frames:** the strip's ×8 showed the wrong pixel rows (3–7 instead of 3–12); the scale note claimed the hole survives at 16 px (false); text was selected while dragging; notes collided mid-drag; the chain line ran through plane names on the phone; the pixel grid ran through C; E touched the focus frame.

## Crops read (4×, last run)

All 14 crops read clean:

- **Leaders and dimensions:** the "an eye" arrow lands on the lens; the "time angles" dot sits on a needle; the "right direction" arrow lands on the spear tip; the 15° arc ends on its two rays; G's arrow lands on the r 195 circle; the 10 u dimension has extension lines 3 u clear and 8 u past.
- **Letters:** A sits in the hole; C has a 45° leader to the NW spear tip; D sits above the upper point; E sits clear of the sheet edge.
- **The red layer** prints 1.2 px off register over the ×8 cells, which reads as a second pass, not a fault.

Also read: every state at both widths, a mid-drag frame, a tap frame 80 ms in, the scale plane at 32 and 64 px at 2×, and the no-JS renders.

## The last lens round (masters.md)

```
1  Leonardo · drawn how it works: five aspects, and the form plane shows the needles lying on the 15° rays · no fix
2  Villard/Dürer · rebuildable: 24 rays, r 60, r 195 drawn; needle lengths in the line note · no fix
3  Vesalius · same pose and scale on every plane and in every state; the chain line proves it · no fix
4  Agricola/Encyclopédie · every part a note names carries a letter; A–H all on the sheet and in the key · no fix
5  Hooke · true 16 / 32 / 64 px, × 8 raster, × 8 detail, 100 u bar · no fix
6  Byrne · no colour coding; the colour plane's black and white are the mark's real grounds · no fix
7  Rubricator · red only says things about the ink; nothing is drawn in red · no fix
8  Neurath · one claim; "a logo taken apart into layers" in 5 s, the 15° dial in about 10 · no fix
9  Tufte · nothing left to erase without losing a fact (live-area rectangle already cut) · no fix
10 Draughtsman · ink 1.6–2.4 px against a 1 px line; every number traces to truth.json; title block present · no fix
11 Müller-Brockmann · notes sit on the stack's own step (15 u right of the plane below, 28 u under their plane); margins 86 · no fix
12 Ciechanowski/Victor · two verbs plus focus; the rest state is complete, even with no script · no fix
13 Founder · rises (41.8 %, 16 % low); clear more than dreamy; eye on every plane · no fix
```

Earlier rounds produced these fixes:

- **Round 1:** a faint mark under the form plane's dial (Leonardo and Neurath: the claim's mechanism was nowhere visible in one place); letters C and D in the form note (Agricola); the live-area rectangle cut (Tufte).
- **Round 2** found nothing; later fixes came from reading frames, not from lenses.

## For the founder

- Does it read as "the anatomy of my logogram" at a glance?
- Which part is "the line = support"? I read it as the long horizontal arms (E).
- A sketch of the mark for the concept plane, if one exists.
- The 16 px finding (no solid pixel, the hole shuts) may matter for "a better mark may come later".

## Would-be learnings rows

Not written, because the skill folder is read-only for this test.

- **KC-?:** In the half-open state, notes collided with moving planes and passed `check.mjs` (a multi-line SVG `<text>` is measured as one run). Became: notes belong to planes; add a mid-point state for every continuous verb.
- **KC-?:** The scale note claimed the hole carries the mark at 16 px. The raster says it shuts. Became: measure the raster before writing a scale note.

## Skill feedback

Ordered by weight within each file.

**`references/marks.md`**

1. **The offset can't keep every plane readable.** "Each plane shifted about 28 u right and 56 u up" together with "the rest state is the stack opened, every plane readable" can't both hold with opaque sheets: at 28 / 56 u on a 256 u plane, about 80 % of each lower plane is covered. _Would help:_ give the offset as a fraction of the plane (I needed about 0.7 S right, 0.52 S up), and say whether sheets are opaque or vellum.
2. **Scale is both a plane and a satellite.** It is the fifth plane ("same mark, same scale and position") and also "a satellite… the same mark at each true size in a rising row". A row of sizes can't sit on a same-scale plane. _Would help:_ say the plane shows the mark's pixel grid or raster at the scrubbed size, and the strip shows the true sizes.
3. **The colour plane rules conflict.** "A mark with one colour has no colour plane" conflicts with rule 2 ("pieces are shown by the colour plane's primary, secondary, tertiary opacities"), with the founder's request for a colour aspect, and with founder rule 2 ("never a light half and a dark half"), while its own table asks for "light and dark grounds". _Would help:_ one explicit line on what a one-colour mark's colour plane shows: grounds, the cut hole, contrast, no invented hierarchy.
4. **Step 3 for a mark is undefined.** marks.md opens "at step 3" but never says whether the three-candidates rule survives when the subject is the mark. _Would help:_ "for a mark, step 3 is naming the mark; offer three device candidates (stack, rota, anatomy) only if the founder hasn't named one."
5. **No scribble on file.** The concept plane says "the founder's scribble or the kirukal sketch". With neither on file, the skill gives no rule between "ask first" (step 6) and "build now". _Would help:_ "say on the plane that no sketch is on file; never draw one in his place."
6. **No rasterising method.** Rasterising the real paths (canvas + `Path2D` at N × N) gave the plate's strongest fact: the hole shuts at 16 px. marks.md only says "the smallest on its pixel grid". _Would help:_ prescribe the method.
7. **Unit name clash.** The mark's own unit (1/1000 of the square) and line.md's u (one line width) share a name. _Would help:_ name the mark's unit.

**`references/depth.md`**

1. **The translate formula runs the wrong way.** `translate(calc(var(--z)*28px), calc(var(--z)*-56px))` with `--z` = depth (0 = front) moves the _deepest_ plane up and right, the opposite of marks.md (the top plane is up and right of the one under it).
2. **Five planes don't fit the opacity steps.** "Each step back loses 20 %, never below 40 %" gives 100 / 80 / 60 / 40 / 40, so two depths share a level, breaking "one step = one level". (I used 15 %.)
3. **Focus breaks rise.** "Interaction changes `--z` and nothing else" plus opacity-by-depth means focusing a low plane dims the top planes; that failed the rise check (48.4 %, 31.4 % low). _Would help:_ say whether focus re-inks, and warn about rise.
4. **"Dims" contradicts "never faded".** "A word… moves, dims and hides with it" against "a word is never faded".
5. **"Steps back" is ambiguous.** "When a plane steps back, its labels hide" against marks.md and live.md's rest state with every label shown: in the open rest state four planes are already "back". _Would help:_ define "steps back" as "loses focus", not "has depth > 0".
6. **Hidden edges can't sit in the lower group.** "Hidden edges… in the lower plane's group" is impossible with opaque sheets painted back to front: the upper sheet covers them. They belong in the upper plane's group.
7. **Notes are unaddressed.** depth.md covers labels but not notes (prose). Static notes collided with moving planes. _Would help:_ "notes belong to a plane and show only on clear ground."
8. **Opacity vs true colour.** Opacity steps conflict with true colour on a colour plane (an 85 % black mark is not the shipped ink).

**`references/live.md`**

1. **No-script rest vs DOM-built ink.** "The rest state is complete… with no script" conflicts with pen.md's "paste the helpers into the figure's script": `quill()` and `hatch()` need `getTotalLength`, so without a bake step the no-JS page is blank. No file mentions baking. _Would help:_ a bake step (or author-time generation) in live.md or verify.md, and a no-JS screenshot in check.mjs.
2. **Drag ↕ vs touch scroll.** "Drag vertically on the stack" fights page scroll on phones. _Would help:_ a touch rule (tap plus slider; keep `touch-action: pan-y`).
3. **Hover focus churns.** Hover-focus on planes reorders the stack as the pointer sweeps across it. _Would help:_ "bring forward on tap / click / key; hover only highlights."
4. **Sliders.** Nothing warns that syncing a slider from state every frame pulls the thumb from under the hand. A one-liner would save a bug.
5. **Midpoint states.** The states contract gives no advice on continuous verbs. The `half` state is where the real faults were. _Would help:_ "list a mid-point state for every continuous verb."
6. **Verb example reads as a ban.** "A plate about the sun's angle scrubs the angle; it does not also open layers" reads as if open plus scrub is wrong, while marks.md prescribes open + scrub + focus.

**`scripts/check.mjs` / `check.js`**

1. **Crops only from desktop rest.** No 4× crops in any other state or on the phone; every size-state and focus-state defect here was found by my own zooms.
2. **Multi-line text averages away.** Contrast treats a multi-line SVG `<text>` as one run, averaging the background over its whole box. A note half over a black plane passed. _Would help:_ measure per `tspan` line.
3. **One subject only.** "Notes stay off the subject" checks one `[data-subject]`. In a layer stack, notes over the other four planes go unchecked, and a wrapper can't be the subject because ink-only isolation would then make every nested sheet ink.
4. **No text-crossed-by-line check.** line.md's "text never crosses a line" isn't checked. The chain line cut "Line" and "Colour" on the phone, and the pixel grid cut C.
5. **Silent background exclusion.** `background()` silently drops any element ≥ 95 % of the sheet. A `<use>` of the whole needle group at × 8 counted as background, so its extension lines "floated" with no hint why. _Would help:_ print "nearest hit was treated as background".
6. **Visibility isn't respected for SVG text.** Hidden SVG text is only skipped when it has a zero box (`display: none`); `visibility: hidden` or `opacity: 0` text would be measured. The skill should say "hide with display: none".
7. **Slow.** 11 states × 2 widths takes a few minutes per run, and I ran it 12 times. A `--state` / `--width` filter would speed iteration.
8. **No no-JS render** (see live.md 1).

**`SKILL.md`**

1. **Marks needed earlier.** For a mark, the claim (step 1) and truth (step 2) depend on marks.md's aspect model, but marks.md is listed "at step 3". Open it at step 1 when the subject is a mark.
2. **Contract silent on generated geometry.** The figure contract ("self-contained apart from fonts") says nothing about where generated geometry lives (bake vs runtime).
3. **Founder rule 2 vs marks.md colour plane** (above).
4. **Time estimate predates live.** "Plate 2–4 h" predates live.md: states, motion, a phone recomposition and a bake add a large share. This plate ran well past it, mostly in steps 11–12.

**`references/masters.md` and `references/devices.md`**

1. **Wrong needle count.** Both describe the logogram as "the eight-needle compass" / "a rota: 8 needles, 8 directions". The path data has 16 needles, 4 spears and 4 points on 24 positions at 15°. The founder said "8 directions", not 8 needles. This is KC-14's lesson again: examples need their own truth step.

**`references/pen.md`**

1. **hatch() suits bodies, not strips.** `hatch()` is built for shadows on bodies; depth.md's cast shadow is a 3–6 u strip. I called `hatch()` on 14 u sub-boxes. A strip mode or a note would help.

**`references/composition.md`**

1. **Phone rise needed more than "recompose".** The phone sheet (390 × 720) failed the rise check by a hair with five planes; it passed only after shortening it to 660 and lightening the lower planes. "Contour weight falls off toward the bottom" is the right lever; say it is the first lever for stacks.

## How to rebuild

The page builds itself when the baked SVGs are removed: drop `data-baked` from `<html>` and empty `.sheet.desk` and `.sheet.phone`. To re-bake, load the unbaked page at 1440 × 900 and at 375 × 812, call `codexStates.set('rest')`, and write each visible sheet's `outerHTML` back into its div. Then rerun `check.mjs`.
