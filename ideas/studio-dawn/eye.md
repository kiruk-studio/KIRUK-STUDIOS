---
status: built 2026-11-04 — kirukal, waiting on founder checkpoint
date: 2026-11-04
scope: apps/kiruk-studio `/` (the folio moved to `/folio`); packages/burin (new engine)
skills: kiruk-burin (new) · kiruk-sheet · kiruk-codex
---

# The eye — one engraved plate, cut by our own engine

The founder asked for a landing with only an eye and what supports it, in the Da Vinci
and David Rumsey manner — old, creative, complex, iterated in ink and paper — showing
_kiruk_: to scribble, and make something. First the engine: background, ink, strokes,
the calculus UI, HTML-in-Canvas and WebGPU, a separate skill and a better flow.

References (founder, 2026-11-04): an anatomical engraved eye with lettered parts and
"Fig."; a sheet of eye-construction studies in rows; a modern engraved eye with dotted
proportion guides and a tick scale; an eye in a sunburst of rays with a star in the
pupil; Da Vinci-style butterfly, ornithopter and nautilus sheets.

## What was built

- **`@kiruk/burin`** (`packages/burin`) — the engine. Paper (rag fibre, flocs, tooth; as made / as found; platemark; held to the light with laid and chain wires and the kiruk watermark). Burin line fields on the GPU (TSL → WGSL and GLSL): `engrave`, `contour`, `stipple`, with analytic antialiasing and dot-and-flick. Vector burin strokes for SVG. An HTML-in-Canvas ink plate. Exact motion (critical springs, reflexes, blinks).
- **The engraved eye** — a rig in numbers (fissure, lids, crease, brow, iris on a turning eyeball) mirrored as line families: lid-parallel skin lines that compress into the crease, arcs on the sclera, iris spokes and rings with a wavy collarette, lashes and brow as bent tapered burin strokes, and the kiruk logogram as the pupil's catchlight. It follows the pointer, makes small saccades at rest, blinks, and its pupil closes when the page is held to the light — when the paper turns to transmitted light and a glory of rays is cut round the eye.
- **Supporting design** — the platemark, a title block (_kiruk — to scribble, and make something._), lettered parts with Latin names and a key (j skipped, as old plates do), dotted proportion guides with a scale in iris diameters, _Fig. 1._, and a strip of the engine's own passes: I construction, II contour, III hatching, IV cross-hatching — the plate is V.
- **The instrument** — the calculus of the eye set like a map legend: gaze, pupil and lid plotted with their derivatives as they move, a paper toggle, the engine's state. EB Garamond with old-style tabular figures; IM Fell display; JetBrains Mono for measures.
- **HTML-in-Canvas** — all of the page's type lives in one overlay; where the API exists it is printed into the paper by the GPU (and stays selectable); elsewhere it renders as DOM.
- **The hand** (2026-11-05) — p5.brush colours each impression in a worker (red chalk, bistre wash, iron-gall quill, lead white, the iris) and burin lays the sheets into its paper. See [hand.md](./hand.md).
- **Flow** — skill `kiruk-burin` with `burin-check.mjs` (proof: desktop, phone, crops, held to light, as found, blink) and `bake-poster.mjs` (no-JS / first-paint poster).

## The dawn — two papers (2026-11-04)

Arun means dawn ([`dawn.md`](dawn.md)). The founder named two colours from names.color.pizza:

|         | old paper                                                              | new paper                                               |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| name    | **Dawn Light** `#fadfa9`                                               | **Dawn Departs** `#ccffff`                              |
| tagline | "Soft morning glow, when darkness starts to lift and yellow seeps in." | "Morning's first pale breath, the blue before sunrise." |
| meaning | where the hand drew                                                    | where the code draws                                    |
| ink     | iron-gall `#231a14`, brown in water                                    | dawn navy `#1d1c2d`, blue in water                      |
| years   | carries its age (warm drift, foxing, a tide line)                      | none                                                    |

The eye and its lines stay the same; only the paper changes, and each paper takes its own
ink. Together the plate shows where an idea comes from and where it goes: the hour between
the hand and the code.

- **The crossing is a front, not a fade.** Pressing _new_ (or D) brings the blue sheet in
  from the left, ragged along the fibres, with a faint tide line where it is arriving. It
  takes about 1.5 s on a critically damped spring, ω = 3.5. Each point is one paper or the
  other, so there is never a muddy middle colour. A per-pixel blend of yellow and cyan went
  khaki.
- **One number drives everything.** The spring writes `--dawn`. CSS mixes the page ink and
  the instrument's paper from it, and the GPU paper, ink, wash and stain follow the paper
  under them.
- **Chosen in two places.** In the title block, as two paper samples tipped in (and the
  only control on a phone). In the instrument (_iv. Dawn_), with the hex, the tagline and
  the meaning. The choice is remembered (`localStorage`).
- **Tokens:** `color.dawn.*` and `color.sheet.*`, proposed in
  [`openspec/changes/dawn-paper-tokens`](../../openspec/changes/dawn-paper-tokens/proposal.md).
  It validates; the founder still needs to review it.

## The bleed (2026-11-04)

Drag across the plate and the sheet gets wet. Ink lifts off the lines and the type,
travels with the water along the fibres, and dries darkest at its edge. The stain fades
with a half-life of about 11 s. On load the sheet is only damp: it darkens for a moment but
lifts no ink. The instrument's _v. Ink_ plots how wet the sheet is and how fast it dries.
Model and rates: skill `kiruk-burin`, `references/bleed.md`.

## Light, construction, measure, notes (2026-11-04)

The founder asked for realistic light and shadow, the construction and wireframe
finished, detailed interactive measurement, and a cluttered but curated layout: notes
scattered over the diagram the way old drawn-and-measured pages were, with the ideas
connected. They also asked for a stronger, clearer engine and better performance.

- **Light.** One light for the paper and the eye, moved by the pointer. Each part of the
  eye has a form (the globe, the lid rolling over it, the hollow under the brow, the brow
  ridge, the lower lid's pillow), and its lines widen in shade and thin in light. The lid
  casts its shadow onto the white, the lashes cast a broken one, and the brow shades the
  hollow. The corneal window sits where the light is mirrored, so it moves too.
- **Construction.** The whole globe is drawn behind the lids in red chalk (sanguine),
  with meridians and parallels that turn with the gaze. Also drawn: the optic axis, the
  orbit, and the centre lines. Hidden lines are dashed. On the new paper it is drawn in
  blueprint blue. It can be faint (default), full, or hidden (W, or the instrument).
- **Measure.** Live dimensions over the plate:
  - W, the opening, 2.78 d, tilted 3.1°.
  - A, the aperture, which closes through a blink.
  - p, the pupil, which follows the light reflex.
  - A 10 mm bar, with the scale the figure is drawn at ("Fig. 1 at 3.87 : 1" at
    1440×900). That scale changes as the page is resized; lengths in d and mm do not.

  Four units (U): d, mm, px and Paris lines. Calipers (M): drag between any two points,
  and the ends snap to the anatomy.

- **Notes.** Seven notes, i to vi plus a mirror line, read as one chain: scribble,
  measure, light, paper, water, make. Pretext lays them out into whatever room the
  current layout leaves: between the title and the key, flowing into the curve under the
  eye, sideways up the margin, along the foot, and over the brow in mirror script. A
  rubric leader ties each one to the part it names. A note that does not fit is left
  out (5 of 7 at 1440×900; all 7 at 1920×1080; none on a phone).
- **Performance.**
  - The type prints within about 20 ms of load, without waiting for the engine.
  - The ink pass renders only the eye and its studies, and the hair is real GPU loops.
  - Cold start to the lit plate went from 7.0 s to about 2.8 s; warm, about 0.5 s.
  - At rest the page redraws about 9 times a second, and the eye is re-cut only when it
    or its light moves.

## The old pages, read again (2026-11-04)

The founder shared eight more pages. Each teaches one thing; the plate takes what fits:

| page                                    | what it teaches                                                 | on the plate                                                                             |
| --------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| a letter Q, constructed and annotated   | the notes are written along the construction itself             | text on the globe's arc and up the orbit                                                 |
| Balzac's corrected proof                | correction is part of the page                                  | the notes keep revisions: the struck word, the new one above, a δ in the margin          |
| circles struck in order, 1–8            | the order of drawing, and the compass swing                     | steps ① – ⑧, and a dashed radius with its arrow                                          |
| Cesariano's cathedral                   | geometry under the drawing, lettered scales, a graduated border | the neatline, graduated from the eye's own axes in the reader's unit                     |
| the dark plate of physics               | light lines on black                                            | **not yet**: a night paper, see open questions                                           |
| the blueprint cabinet; _Tab. Astronomy_ | a plate of many numbered figures                                | the construction in blueprint on the new paper. Later: Work and ISM as plates of figures |
| Viète's propositions                    | numbered propositions, the mess kept                            | the revisions above                                                                      |

And one thing all of them do: the page shows its making. **Make it again** (C) replays
the plate. The construction comes first; then each pass (contour, hatching,
cross-hatching and hair) is cut across the eye from the inner corner to the temple,
while the strip underlines the study being cut.

## Decisions taken (overturn at the checkpoint)

1. ~~Paper defaults to as made; as found is a toggle.~~ Superseded by the dawn. The old paper always carries its years and the new paper none. The instrument's paper toggle became _iv. Dawn_.
2. The kiruk logogram is the catchlight in the pupil, white on black, paths unchanged.
3. The folio landing is kept at `/folio`, unlinked.
4. ~~Colours stay working values until a design-tokens proposal.~~ The papers are now Dawn Light and Dawn Departs, proposed as `color.dawn.*` (2026-11-04). The studio mirrors the hex values until it can import the token CSS (see the proposal's tasks).
5. The default is the **old paper** (Dawn Light): the hand comes first.
6. Type: IM Fell Double Pica for the name; IM Fell English for the plate's letterpress (title, key, letters); IM Fell English SC for the plate number; EB Garamond for the instrument (old-style tabular figures); Xanh Mono for measures.
7. On a phone the key shows the plain names only; below 800 px tall it is left out and the figure letters stand alone.
8. The construction is faint by default (0.3): the hand’s underdrawing shows through, as it does on old plates.
9. Live measures are not printed into the paper: their numbers move, and every printed change re-uploads the whole type layer.
10. The note texts are the studio’s voice; the founder may rewrite any of them (`NOTES` in `Notes.tsx`).
11. The figure is drawn a little smaller on wide screens (0.338 of the height, was 0.355), so the notes keep their margins. The plate is a notebook page, not a poster.
12. Making it again is opt-in (C, or the instrument). It does not play on load.

## Open — founder

1. Does the plate read as a Rumsey / Da Vinci engraving at a glance?
2. Which paper first: old (as built) or new?
3. Should the founder's own scribble replace study I (construction)?
4. Next subjects for the engine (the butterfly, the ornithopter, the nautilus sheets)?
5. The `color.sheet.*` exception to the monochrome semantic layer: accept it as scoped in `dawn-paper-tokens`?
6. The notes: is the voice right, and should the founder’s own handwriting (a scanned scribble) replace the italic type?
7. Should the construction default to faint, or start hidden and arrive on the first W?
8. A night paper: light lines on a dark sheet, for the nightminds (`dawn.md`). Would it be a third paper in the dawn loop (night, then Dawn Light, then Dawn Departs)? It changes the dawn concept and the tokens proposal.
9. Should the other pages become plates in the same system? Work as a table of numbered figures, Writing as corrected proofs, ISM as a blueprint cabinet.
