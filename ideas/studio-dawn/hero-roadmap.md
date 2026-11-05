---
Status: built — waiting on founder checkpoint (done-criterion 1)
date: 2026-10-18
turtle: retro TL-21 → ideate
---

# Dawn hero — road map

## Core idea

The landing opens on **one image**: the kiruk eye rising at dawn. Above the horizon it is a Da Vinci notebook study (sepia ink, construction circles, hatching, typewritten notes) drawn on a blurred dawn sky with ink splashed into it: **the design side**. Below the horizon the same eye goes on as a precise, futuristic wireframe in the dark earth: **the engineering side**. One object in two languages, with the horizon (the logo's support line) between them.

## Why this road

- Founder, 2026-10-18: dawn light colours with blur, ink splashed in the sky, dreamy, two things shown at once; light = old book (typewriter, ink, pencil, diagrams), dark = futuristic product wireframe. `verified` conversation.
- Earlier: the eye comes first; the needles are time angles, 8 directions, eye shape = vision, line = support; sky light above, earth dark below. `verified` plan.md §1, dawn.md, eye-link.md.
- References: three dawn photos, INKREDIBLE ink stages, three Da Vinci notebook pages. `verified` references/.

## Roads

| Road                       | Reading                                                                              | Verdict                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **A. Rising eye** (chosen) | The eye straddles the horizon like a half-risen sun: sketched above, wireframe below | Tells dawn, eye, design/engineering and support line in one glance                 |
| B. Reflection              | Full sketched eye in the sky; its mirrored wireframe reflection in the dark earth    | Kept as a toggle in the proto: a different metaphor, not a parameter (TL-17 guard) |
| C. Two sheets              | A notebook page next to a blueprint page                                             | Rejected: founder said "not a split"                                               |
| Do nothing                 | Keep the specimen                                                                    | Rejected: founder called it sloppy                                                 |

## Non-goals

No motion yet (the live TSL bleed and the rising ray are their own workstream). No site integration yet. Not a logo redraw: the eye study is construction geometry, and the founder's logogram stays the mark in the nav.

## Taste defaults taken (overturn at checkpoint)

- Light-side type Courier Prime (typewriter, readable); dark-side JetBrains Mono (already a token).
- Ink: sepia `#3B2F2A` for the study, deep ink `#242327` for the blooms; earth lines `#D3D9DE` at low alpha.
- Every colour comes from the sampled references (dawn.md).

## Done when

1. [ ] At a glance it reads as **dawn**, **dreamy**, **ink splashed in the sky**, **Da Vinci notebook above**, **futuristic wireframe below** — checkpoint question to the founder.
2. [x] Desktop 1440×900 and mobile 375×812: the mark fully in frame, hero text legible, no horizontal scroll — screenshots in session; mobile `scrollWidth 375 = clientWidth 375`.
3. [x] No console errors; renders without JS (the variant toggle is the only script) — console read: no messages.
4. [x] Text contrast ≥ 4.5:1 — computed: title 10.9, intro 9.8, fig 9.0, notes on rose 5.1, nav 9.6, earth caption 5.2, status 6.1.

## Build order

1. Sky: layered blurred dawn gradients + sun glow + grain.
2. Earth: dark gradient + perspective ground grid converging at the sun.
3. Horizon: the thin line of rays.
4. Ink blooms in the sky (watercolour SVG filter).
5. The eye study geometry, drawn twice: sketch (clipped above) and wireframe (clipped below), plus hatching above and nodes/dimensions below.
6. Type: nav, hero title with ink bleed, notes with leader lines, mono labels below.
7. Variant B toggle; responsive pass; checks.

## Drift log

- Step 5: the study uses the founder's **actual logogram paths** (unchanged, from `favicon.svg`) instead of a generic vesica eye — the mark already has an upper and lower half, a centre line, and needles 15° apart. · Why: tighter to "the eye first" and the logo's meaning. · Approved: taste default, at checkpoint.
- Step 4: three-strike fired on the sky ink (grey smudge → cutout cloud → smoke). Proved: neutral ink on a pale sky goes grey or sooty; one shape with one edge reads as a cutout; high-contrast noise reads as smoke. Landed as layered translucent indigo/violet washes — a **still stand-in**; the real ink is the TSL workstream. Hidden on phones (no free sky beside the name). · Ledger TL-22.
- Step 7: the "line beneath holds it" note moved out of the drawing group so it stays on the horizon in reading B.
