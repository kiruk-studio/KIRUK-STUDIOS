---
Status: parked 2026-10-20 — founder set the four variations aside to first build the kiruk-codex skill (ideas/kiruk-codex/plan.md). Files kept, nothing deleted.
date: 2026-10-18
turtle: stone · ideate → build
---

# Blend — old pen, new line

## The brief (founder, 2026-10-18)

- The design **rises**. No downward emphasis.
- The illustration looks medieval / Da Vinci / ancient: pen and ink, structured.
- A **modern line laid over the same drawing** makes the intent clear. Art and code blended, not split.
- Type links old and new: set as **typescript** (read as "typewritten manuscript", not the language — confirm), old style meeting new.
- "Slightly broken in both directions": neither layer is pristine — the ink wobbles, the code drifts.
- Polished, dreamy yet clear, with real contrast. Several prototypes, each evaluated.
- Habit-tracking is an **example subject** for an article illustration only. Nothing is built for it.

## What changed from the dawn hero

- Dropped: the heavy dark wireframe below the horizon (pulled the eye down). The ground is now a thin band that only anchors.
- The modern layer moved **onto** the drawing: rubric red (the scribe's annotation colour, which is also a design tool's selection colour) or ultramarine.
- Type rebuilt: IM Fell (17th-c. Fell types, scanned with their ink spread), Cormorant Garamond, Xanh Mono (a mono with old-style bones — the "typescript" bridge), JetBrains Mono for overlay labels. Courier Prime is gone.

## The four (each differs in metaphor, not in a setting — TL-17, TL-21)

|                   | Metaphor                                     | Old layer                                                       | New layer                                                                                            | Type                            |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| **V1 Codex**      | a manuscript folio                           | ruled page, illuminated initial, sun-eye over the earth's curve | red selection box, handles, dimensions, 8 direction dots                                             | IM Fell English + SC            |
| **V2 Ascension**  | the eye rising across the sky in four states | scribble → pen line → hatched ink                               | the sun's path as a red timeline; the last state is the real mark, selected                          | Cormorant Garamond + Xanh Mono  |
| **V3 Two plates** | a press sheet printed out of register        | sepia plate, hatched                                            | ultramarine plate with nodes, drifted Δx 9 Δy −6 θ −0.7°; the title's own metrics measured and drawn | IM Fell DW Pica + Xanh Mono     |
| **V4 Folio**      | a writing page (habit example)               | three gears rising like a sun, Da Vinci mechanism               | rotation arrows, measured radius, friction callout, a week of streak marks                           | IM Fell Double Pica + Xanh Mono |

## Scores (1–5, against the brief)

| Criterion                | V1 Codex                      | V2 Ascension                             | V3 Plates                                            | V4 Folio                           |
| ------------------------ | ----------------------------- | ---------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| Rises, no downward pull  | 4                             | **5** — a diagonal climb, horizon to sky | 3 — big, centred, static                             | 4 — gears come up like a sun       |
| Old-world illustration   | **5**                         | 4                                        | 4                                                    | **5**                              |
| Overlay clarifies intent | 4                             | **5** — the path _is_ the method         | 4                                                    | **5**                              |
| Type links old + new     | **5** — best type of the four | 4                                        | 4 — metrics overlay is the most "design engineering" | 4                                  |
| Blended, not split       | 5                             | 5                                        | 5                                                    | 5                                  |
| Dreamy yet clear         | 4                             | **5**                                    | 4                                                    | 4                                  |
| Extends to articles      | 3                             | 3                                        | 4                                                    | **5** — it is the article template |
| Phone                    | 3 — drawing below the fold    | 3 — small                                | 4                                                    | 4                                  |
| **Total / 40**           | 33                            | 34                                       | 32                                                   | **36**                             |

Checks run on all four: no console errors; 375 px wide with no horizontal scroll; text contrast ≥ 5:1 (rubric text `#983a22` on cream ≈ 6:1).

> **Correction 2026-10-20:** the contrast figure above was computed against the flat cream colour, not the wash and hatching actually behind the text. Measured on real pixels with `.claude/skills/kiruk-codex/scripts/check.mjs`, V4 Folio reaches only 4.04:1 on desktop and 3.84:1 on phone, and its phone labels render at 5.3 px. Recorded as KC-8 in the skill's `learnings.md`.

## Recommendation

Not one variation — a small system, each part doing one job:

1. **Landing = V2 Ascension**, set in **V1's type** (IM Fell instead of Cormorant): the strongest rise, and it tells kiruk's method (scribble → line → ink → code) without a word.
2. **Writing pages = V4 Folio**: a pen-and-ink figure per article, with a red overlay that explains it.
3. **Type system**: IM Fell (titles + text, the old hand) · Xanh Mono (typescript, the bridge) · JetBrains Mono (overlay labels, already a token).
4. **Park V3** as a whole page; keep its type-metrics overlay as an accent (a brand or colophon page).

## Open (founder)

- Pick, or overturn the recommendation.
- "TypeScript" = typescript (typewritten)? Or did you mean something else?
- Rubric red vs ultramarine as the one modern line colour.

## Drift log

- V4: drawing group shared the id `pen` with the pen filter, so gears rendered into the filter; renamed `drawing`. Caught on first screenshot.

Retro: no miss (build bugs caught by the step's own screenshot check; no founder correction yet).
