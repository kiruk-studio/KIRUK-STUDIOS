---
status: built 2026-11-05 — kirukal, waiting on founder checkpoint
date: 2026-11-05
scope: packages/burin `./hand` (pen.ts, live.ts) and subjects/eye/strokes.ts; drawn by apps/kiruk-studio's first-visit loader
skills: kiruk-burin · kiruk-stroke (this note is the repo's copy of the stroke method; the local skill files are not in git)
---

# The ink strokes — how the hand lays a line

The first drawn eye ([ink-opening.md](./ink-opening.md)) worked, but it read as a halftone. Light tones were dashes. The socket ended in an oval vignette with seams at the corners. The darks were flat, the brow was short and chaotic, the lower lashes made a comb, and the iris crypts looked like rivets.

The founder put it next to three engravings and asked for more art in every part: the shadow strokes, the light strokes, the outer part. They also asked for a better skill for strokes in general. This note is that skill: the pen's vocabulary in `hand/pen.ts`, and how the eye uses it. Any subject drawn by hand can start here, not only the eye.

## What the references teach

| Reference                                | What it does                                                                                     | What the hand does now                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| An anatomical plate of the eye's region  | Contour lines wrap the orbit; the brow is long, feathery hair                                    | The socket is one family of rings round the eye; the brow is long tapered hairs over a light ground   |
| Fornasetti's eye                         | Bold black and white; a dark limbal ring; straight radial iris lines; a window in the pupil      | A five-ring limbal band, straight fibres, the window's four panes, whites left as paper               |
| A vintage cross-hatched eye on parchment | Curved cross-hatching only in the deep shadows (under the brow, by the nose); every flick tapers | Spiral families cross the rings only where the form turns from the light; every run tapers in and out |

## The pen's vocabulary (`hand/pen.ts`)

1. **Cut.** A line's width is its tone.
   - In the light it is a continuous hairline (0.21 px half-width), never a dash.
   - In the shade it swells, up to 0.47 of the gap to its neighbour.
   - It breaks into long, uneven flicks only below tone 0.1. Below 0.018 it is paper.
2. **Black is crossed, not flooded.** One family never merges into solid black: a sliver of paper always stays between its lines. Black comes from a second family crossing the first, and the paper shows through as tiny diamonds. The socket's tone is capped at 0.94 for the same reason.
3. **Taper.** Every inked run enters and leaves thin, as the burin bites and lifts: 7 px for hatching, 6 for the white's shade, 4 for iris fibres. A line never ends in a clipped edge.
4. **Swell.** Pressure changes slowly along each line (±12%), and each line has a weight of its own (±12%), so no two cuts are alike.
5. **Chalk.** The construction skips on the paper's tooth, so it reads as underdrawing, not ruling.
6. **Hair.** A flick: a bite at the root, then a long taper to a hairline tip (brow, lashes, the star's needles).
7. **Stipple.** Dots laid as one stroke, in a scattered order (`Hand.dots`), the way a hand stipples: all over at once, not row by row.
8. **Drop lines that crowd.** Where a family converges, into a corner or under a closing lid, only every second, fourth or eighth line is cut. That is what an engraver does with converging hatches.

## Families follow form

- **Lines follow what they describe.** Rings go round the socket. The lid band is copies of the lid. The white has arcs round the cornea. The iris has radial fibres. Hair follows its flow.
- **Rings relax with distance.** The socket's rings are nested between two curves:
  - the loop where the lids fold in (the crease above, the lower lid's fold below, closed round both corners)
  - the orbit's rim, an egg.

  The first rings hug the loop. Each ring further out rounds the corners a little more, by a gaussian over the angle that widens with distance, until the last rings are the smooth egg. So the rings wrap the corners with no seam and no kink.

- **Cross-hatching goes only where the form turns from the light.** Only the stretch of each spiral that reaches the shade is cut.

## Light

- **One light, from the upper left.** It is the plate's resting light.
- **The socket is a height field.** It has a bowl from the lids' fold to its rim, with the brow ridge as the rim above and the forehead beyond it a lit plane. It also has the nose's wall and the cheekbone.
  - Shade follows the slope against the light.
  - It is held to a mid tone (at most 0.48), so the form reads in line weight, not in black.
- **Designed darks sit on top of it:**
  - the fold under the crease
  - the hollow at the inner corner, under the brow's head, against the nose
  - the outer corner's fold
  - the tear trough under the inner half of the lower lid
  - the brow's cast shadow
- **Inside the brow, the rings thin to near-hairlines.** There the hair carries the tone, and the shadow starts under the brow.
- **The drawing frays out past the orbit's rim,** sooner below the eye than above it. The fray is spent before ±1.72 across and 1.56 above, so a frame cut round the drawing never cuts a line. The loader's box is ±1.78, -1.62 … 1.22.

## Moving parts

- **The globe turns.** The white's arcs, the iris and the veins move with the gaze, as one cached layer. Their tone is held light, so whatever part of the white the gaze brings into view arrives as clean as the rest.
- **The shade the face lays on the white stays put.**
  - That shade is the upper lid's band, its lashes' soft strands of shadow, the corners, the lower lid's contact, and the globe's far side.
  - It is its own family of lines that follow the lids. It lives on the lid's layer, is redrawn with the lid as it blinks, and crosses the globe's arcs, so the shade reads as cross-hatching.
  - Before this, the shade was baked into the globe and slid across the white at the far ends of the gaze.
- **The white is cut at the plica.**
  - The caruncle, the plica and the corner's stipple sit in front of the globe, fixed to the face.
  - The window the white shows through stops at the plica (`windowOutline`), so the turning white never slides over them.

## The parts

- **Brow.** Two layers, the way an engraver builds one: a sparse underlayer of fine long hairs, then the body, densest along its lower edge.
  - The head's hairs are short and rising. The body lies toward the temple, its lower hairs rising and its upper ones falling to meet on the spine. The tail turns down and thins.
  - There is paper between the hairs, so the brow reads as hair, never as a band.
- **Upper lashes.** Two rows, 74 and 54. They are short at the inner corner and longest past the middle. They lean toward the temple, curl up and out, and their tips gather in clumps of four or five.
- **Lower lashes.** 40 short flicks, about one in seven skipped.
- **Upper lid.**
  - Band lines copy the lid and compress into the crease.
  - It is lit as it rolls over the globe, and dark under the fold and at the corners.
  - Slanting strokes cross it where the fold shades it.
- **Lower lid.** The pillow's lines are crossed where it turns into its fold. The fold has its own contour.
- **Iris.**
  - A dark limbal band of five rings.
  - Fibres run from the limbus in to the collarette. They are nearly straight, each with a slight bend of its own, and are cut clockwise from twelve.
  - The collarette is a ragged zig-zag, never regular. Finer fibres fill the pupillary zone, with 22 crypts among them.
  - The pupil has a crenellated ruff.
- **Pupil and mark.**
  - The pupil is inked in a spiral round the kiruk star.
  - The star is scratched clear. Its needles are never finer than 2.2 hairlines: it is the mark, and it has to read.
  - The cornea's window is four panes cut clear.
- **White.** Light arcs about the cornea, carried by the globe, crossed by the face's shade lines, which stay fixed. Veins wander in from the corners but keep their heading: no curls.
- **Inner corner.**
  - The caruncle is a wet mound: its outline is heavier underneath, seven curved hatch arcs sit on its shaded side, and its lit shoulder stays paper.
  - The plica is drawn fine. The corner's flesh is stipple.

## How to check a drawing

1. **The tone field alone.** Render the tone the drawing asks for at each point, with contours at 0.5, 0.8 and 1.0. Fix the light here first: seams, black pools and a shadow in the wrong place all show at a glance.
2. **The strokes at rest.** Look at the whole drawing and at crops (brow, both corners, iris, under the eye), next to the references.
3. **The live eye.** Turn the gaze to the four ends and the corners, then check a half-blink and a closed lid.
4. **The frame.** Outline the loader's box over the drawing.
5. **The cost.** Measure generation per family, a blink frame, the pen's frame, and the whole drawing rastered at once.

## Numbers

These are for the desktop size (S 227, 1440 × 900), compared with the first drawing.

| What                                                     | Before         | Now              |
| -------------------------------------------------------- | -------------- | ---------------- |
| Strokes / samples                                        | 1,581 / 135k   | 1,785 / 153k     |
| Generation, warm                                         | 0.18 s         | 0.18 s           |
| The pen, per frame (software raster, in its worker)      | 3.3 ms, max 14 | 3.1 ms, max 15   |
| The whole drawing rastered at once (reduced motion)      | 1.2 s          | 0.8 s            |
| A blink frame, lid re-cut and rastered (software, S 260) | ≈ 53 ms        | ≈ 55 ms          |
| The drawing's chunk                                      | 28 kB          | 36 kB (15 kB gz) |

On real hardware the canvas rasters on the GPU, and the raster numbers fall a long way.

## Not done, and open

- **The GPU plate still cuts the older eye.** `shader.ts` still has the vignette, the dashed light tones and the seam at the outer corner. On the landing, the redrawn eye settles onto that older plate on the way in. Porting the rings, the held light and the fixed white shade to the shader would make the two meet.
- **Lines are dropped only in the white's shade.** The lid band still thins its converging lines instead of dropping them.
- **For the founder:** is the shadow under the brow too heavy? Should the brow be bolder, as on the vintage eye, or more feathery, as on the anatomical plate?
