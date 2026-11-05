---
status: built 2026-11-04 — kirukal, waiting on founder checkpoint ("does it read as a Da Vinci studio sheet at a glance?")
date: 2026-11-04
scope: apps/kiruk-studio home (the page behind the iris). Subpages untouched.
skills: kiruk-sheet → kiruk-rule, kiruk-stroke, kiruk-codex; dimensional-drawing (Plate II); calculus-of-interfaces (the margin)
---

# The folio — a studio sheet made on a wireframe

The founder asked for a landing as rich as kiruk.in: medieval, Da Vinci notebook, ink and paper, strokes drawn with care, a calculus margin that shows precise movement, real paper, HTML-in-Canvas on WebGPU/WebGL, and the dimensional-drawing method tuned to the codex.

## The one idea

> **Every kiruk sheet is made on a wireframe.**

Renaissance paper was formed on a mould: a wooden frame strung with close laid wires and wide chain wires, with the maker's mark sewn on in wire. Pulp settles thinner over the wires, so a sheet held to the light shows the wireframe it was made on. Leonardo's paper carried these marks.

kiruk's landing is one such sheet, drawn by the GPU. Its chain wires are the page's own layout columns, its laid wires the baseline rhythm, its watermark the kiruk eye. The wireframe (engineering) is _in_ the paper; the ink (design) is _on_ it; the rubric red (intent) is _over_ it. Hold the page to the light and the wireframe shows through. That is the founder's two layers — a base layer and a hand layer — made literal in the material.

Sources: the cosmos board _Kiruk / Sketch Strokes_ (constructed letterforms with compass, ruler and red measure; gestural ink and graphite), the are.na channel names _kiruk studio_ and _wireframe_ (the channels are private, not read), the Leonardo and INKREDIBLE references in `references/`, `protos/blend/` (V2 Ascension, V1 type), and the codex/sheet skills.

## Plates (top to bottom)

| Plate             | Section (plan §1 order)      | Subject                                                                                                                          | Device                                 | Live verb                                                     |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| I · kiruk         | who kiruk is                 | the word _kiruk_, its five letters drawn as the sheet's five passes: scribble, rule, ink, rubric, live                           | sequence inside one word; construction | focus; the live _k_ answers the pointer                       |
| II · Desirable    | featured work                | the parametric table from `~/KIRUKULAM/Desirable` (defaults W 120 · D 80 · H 75 cm) as a dimensional drawing in quill and rubric | dimensional drawing (codes + formulas) | scrub W 30–300; step oak ↔ glass                              |
| III · ISM         | a look at ISM                | the Inktober isms (days 7–12) as constructed Roman capitals in Pacioli's manner, climbing a rising baseline                      | sequence; construction                 | step day ← →                                                  |
| IV · Framework    | framework teaser             | the draughtsman's window, in construction only — the ink pass has not happened ("researching, wait a moment")                    | construction                           | none (a Note)                                                 |
| V · On this paper | writing + contact (colophon) | the papermaker's mould and its watermark                                                                                         | section; mechanism                     | **hold to light** — the whole page turns to transmitted light |

The margin (right, sticky ≥ 1180 px; inline below on smaller screens) writes the page as a function, `UI = f(W, s)`, after Shu Ding's _Calculus of Interfaces_: breakpoints on a ruler (jumps and bends), the page's own wireframe redrawn at any width from `f`, the softened step `σ(a / sτ)` that animates layout changes without a written tween, a critically damped spring plotted with its derivative while things move, and interval-arithmetic proofs of three layout rules for every width at once.

## Rules kept (and why)

- **Real paper, not aged paper.** The paper is modelled as it was the day it was made: rag fibre, formation clouds, tooth, laid and chain lines, a watermark. No foxing, burns, coffee rings or sepia (codex `pen.md`: aged paper imitates damage). The founder asked for "real paper like the Da Vinci notes" — the reading taken is _real material_. Overturn at the checkpoint if he meant patina.
- **No mirror writing, no invented script.** Every note is true and readable (codex rule 8).
- **The logogram is rigged, never redrawn.** Paths copied unchanged from `favicon.svg`; it dots the _i_, sits at the framework's sighting point and is the paper's watermark.
- **The hand layer stays the founder's.** Plate I's scribble pass is a faint underdrawing with a `data-sketch-slot` where his tablet stroke will replace it.
- **Truth file.** Every number on the plates comes from `apps/kiruk-studio/src/components/folio/truth.ts`, each with its source.

## HTML-in-Canvas

Feature-detected (Chrome origin trial 148–150, or `chrome://flags/#canvas-draw-element`). When present, Plate I's DOM is drawn into the paper's GPU texture through three.js `HTMLTexture`, so the shader inks real, selectable text into the paper (tooth-starved edges, a fibre-wicked halo local to the pointer) — the INKREDIBLE stages on live DOM. Everywhere else the same plate is plain DOM over the GPU paper with multiply blending. The paper runs on `WebGPURenderer` (WebGPU, else WebGL2), and on plain CSS when neither exists.

## Open — founder

1. Does the folio read as a Da Vinci studio sheet at a glance? (checkpoint)
2. Real paper as made, or with patina?
3. Desirable and the Inktober isms are public (Behance, Instagram) — keep them on the landing?
4. The five passes in the five letters of _kiruk_ — keep, or set the name plain?
5. Colours here are the sheet's working values (`--paper #f4ecdf`, `--ink #1a120e`, rubric `#983a22` / `#b5462b`); they become tokens through a design-tokens proposal before this ships.
6. are.na channels are private — share them, or make them public, to fold their images in.
