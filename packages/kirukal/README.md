# `@kiruk/kirukal`

kiruk's hand-drawn component layer. **Base UI** supplies structure, keyboard
behaviour, focus and ARIA; kiruk supplies the surface, replayed from pen strokes
Arun captured on a tablet in the forge.

## Why this is not another sketchy-UI library

rough.js, Wired Elements, Sketchbook UI and every similar library fake the hand
with a randomizer: offset each point, bow the line between the 50% and 75% marks,
draw it twice. It reads _sketchy_ — a recognisable, generic effect.

**Pressure and taper are the half a randomizer cannot fake**, because they are
not geometry. They are the record of a hand slowing down, leaning, and lifting.
Capturing them is the entire reason the forge exists, and it is the difference
between "a sketchy theme" and Arun's actual hand at scale.

## The six laws

Every design decision here follows from these. They are enforced by tests in
`src/engine/engine.test.ts`, not just documented.

1. **Wobble lives in geometry, never in filters.** `feDisplacementMap`'s scale is
   in absolute units, not relative to line width, so a filter that looks right on
   a button distorts a thin rule and under-bends a thick one — and it costs a
   repaint.
2. **Grain lives on the paper, not on the stroke.** Exactly one `feTurbulence`
   per document, on a rect that never moves. `feTurbulence` can max out CPU
   cores, and an element that both filters and transforms recomputes the whole
   filter every frame instead of compositing a cached layer. It is also the more
   faithful choice: a texture _behind_ the line reads as paper tooth, which is
   where real graphite grain comes from.
3. **Deviation amplitude is absolute.** A 900px card wanders more than a 60px
   button in absolute pixels, because a real hand does. Excalidraw scaled
   roughness with element size and users reported the hand-drawn feel had
   disappeared ([#7239](https://github.com/excalidraw/excalidraw/issues/7239)).
   Never divide deviation by size.
4. **Stroke width never scales.** Absolute px tokens (`--stroke-*`),
   `vector-effect="non-scaling-stroke"`, and no `transform: scale()` on anything
   carrying a drawn edge — scaling multiplies stroke width, which is the fastest
   way to make this look like a zoomed image.
5. **Seeds are deterministic, derived from component identity.** A random seed
   re-rolls every render and the interface visibly crawls. It also breaks Astro
   island and Next RSC hydration, where server and client must agree.
6. **Bake by default; synthesize only when the size is genuinely unknown.**

## Three render tiers

| Tier                | How                                                  | Cost                     | For                                                               |
| ------------------- | ---------------------------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| **A — baked**       | build-time synthesis at a fixed seed and size ladder | **zero JS**              | the default; all of `kiruk-web`'s static routes                   |
| **B — synthesized** | `resample()` at the measured box                     | ~4 KB + a path recompute | containers wrapping arbitrary content: Card, Dialog, Sheet, Frame |
| **C — live**        | full capture and preview                             | the whole engine         | the forge only                                                    |

A Button has perhaps five real sizes — bake five paths and ship no JavaScript.
Tier B exists for a short list, and that is what keeps `kiruk-web` inside its
0 KB static-route budget.

## Why frames are re-synthesized, not stretched

A hand-drawn rectangle cannot be stretched. 9-slice repeats the middle band, so a
wide card shows one short run of pencil tiled eight times and the eye catches it
immediately.

Instead a frame recipe stores four edges and four corners. At render, corners are
placed **unscaled** — they carry the most character, and a stretched corner is
the single most legible tell that a "hand-drawn" UI is generated — and each edge
is re-drawn at the length it actually needs, carrying its perpendicular deviation
over in absolute px (law 3).

## The loop

```bash
pnpm --filter @kiruk/kirukal outline frame.box   # template SVG + spec sheet
#   → Arun draws in the forge, on the tablet
pnpm --filter @kiruk/kirukal assets:build        # normalize, optimize, validate, emit
```

`assets/source/` is **append-only**: a redraw is `v02`, never an overwrite of
`v01`, so the trail of how a mark evolved survives.

**Variant counts are data, not code.** `process-assets.mjs` counts whatever
`vNN` files exist and emits `--kirukal-<mark>-count`. Adding a fourth take months
later needs no token, spec, or component change.

## What Arun draws

**44 marks → 110 files at full depth → 21 components.** The unit is a _mark_, not
a component; that is the leverage. See `manifest/marks.json` for the full list
with per-mark take counts and consumers.

Frames get four takes because they appear 20+ times per screen. A wordmark gets
one, because a logo must be stable.

## Eye-motif

`EyeMark`, empty states (`eye.watermark`), the busy indicator (`eye.iris`) and
the wordmark lockup carry the motif. Components where an eye genuinely does not
belong — Slider, Separator, ScrollArea — declare
`// eye-motif: none — justified: <reason>` at the top of the file, per
`openspec/specs/brand-consistency-ci/spec.md`.

`eye.primary` and `wordmark.kiruk` ship **placeholder-labelled**: FOUNDER_DECISIONS
B1 and B2 are still open, and B1's note says keep a placeholder rather than block.
