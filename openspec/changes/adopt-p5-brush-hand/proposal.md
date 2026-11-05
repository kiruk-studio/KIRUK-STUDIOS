# Proposal: adopt-p5-brush-hand

## Why

The burin eye on `studio.kiruk.in` is cut line by line into a paper the engine makes. An engraving was rarely left alone: a hand coloured each impression afterwards — red chalk under the cut, bistre washes in the socket, a little colour in the iris, lead white on the lights. Each impression came out different. That hand is what the eye lacks.

[p5.brush](https://github.com/acamposuribe/p5.brush) 3.0 already paints those media (chalk, wash, quill, white) with pressure, grain and bleed. Its standalone build runs on WebGL 2 without p5, so it can paint in a Web Worker on an `OffscreenCanvas` and hand back `ImageBitmap`s. `@kiruk/burin` then lays them into its own TSL paper: chalk on the tooth's peaks, washes in the valleys, the quill starved like the cut lines, white on top.

The tech-stack spec does not name a 2D paint library. Adding one silently would break "no silent stack change". This proposal records it and fences it.

## What changes

### Modified capability

- **`tech-stack`** — one added requirement:
  - **Added** _The hand = p5.brush standalone, scoped to burin's hand_ — `p5.brush` `3.0.0` (exact pin) MAY be used only by `packages/burin/src/hand/painter.ts` and `brushes.ts`, loaded in a Web Worker (or lazily on the main thread when workers lack WebGL 2). `p5` itself MUST NOT be installed (its peer is marked optional via root `pnpm.packageExtensions`). p5.brush MUST NOT appear in a page's first-load chunk.

### Modified code (already on `feat/hand-drawn-design-system`)

- `packages/burin/src/hand/` — `media.ts`, `spine.ts`, `brushes.ts`, `painter.ts`, `worker.ts`, `compose.ts`, and the `createHand` client in `index.ts`.
- `packages/burin/src/subjects/eye/hand.ts` — the eye's recipe.
- `apps/kiruk-studio/src/components/eye/` — `hand.worker.ts`, `hand-local.ts`, EyeEngine wiring, the Instrument's _vii. Hand_ section.

## Impact

- **Specs touched:** `tech-stack` only (1 added requirement).
- **Bundle:** p5.brush ships in the worker chunk and a lazy fallback chunk (about 111 KB); the home page's first-load JS is 158 kB with the hand wired in (`next build`, 2026-11-05).
- **Risk:** p5.brush is a single-maintainer library. Mitigated by the exact pin and the byte check of `dist/brush.esm.js` against upstream commit `d56350a`; the hand degrades to "no hand" (state `none`) if neither the worker nor the page has WebGL 2.
- **Open founder questions:** is the hand on by default? Should it run on the new (Dawn Departs) paper? Should the founder's own kirukal strokes go through `spine.fromSamples`?

## Design note

`ideas/studio-dawn/hand.md`.

## Deltas

See `./specs/tech-stack/spec.md`.
