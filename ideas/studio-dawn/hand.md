---
status: built 2026-11-05 — kirukal, waiting on founder checkpoint
date: 2026-11-05
scope: packages/burin (`./hand`, `./hand/painter`, `./hand/worker`, `./eye-hand`); apps/kiruk-studio eye
proposal: openspec/changes/adopt-p5-brush-hand
---

# The hand — each impression coloured, differently

An engraving left the press as black lines on paper, and then a hand went over it. Red chalk under the cut, bistre washed into the socket, a little colour in the iris, lead white on the lights. No two impressions came out the same. The burin eye had the press and none of the hand. This adds the hand.

## The pipeline

```
p5.brush (standalone, WebGL 2, no p5) in a Web Worker
  → one sheet per medium: chalk · wash · quill · lead white · iris
  → ImageBitmap ×5
  → three.js textures
  → TSL compose inside burin's paper
  → WebGPU, or WebGL 2
```

The page bundle never imports p5.brush. If the worker has no WebGL 2, the same painter loads lazily on the page (`hand-local.ts`). If neither has it, the hand reports `none` and the engraved eye stands alone.

## How each medium sits in the paper (`compose.ts`)

- **chalk:** dry, so it sits on the tooth's peaks. Where the hand was light the valleys stay bare.
- **wash:** wet, so it settles into the valleys and buckles the paper a little.
- **quill:** iron-gall laid over the engraving, starved on the tooth the way the cut lines are.
- **lead white:** on top, opaque to the light behind the sheet.
- **iris:** a wash on the turning eye, carried from the rest pose by `eyeIrisDecal()` and shown under the live lids.
- On the new paper (Dawn Departs) each pigment swaps to its `DAWN_SWAP` twin. Water from the bleed re-wets hand ink and wash.

Compose order: under (chalk, washes, iris) → engraving → quill → bleed → white → type.

## The bug that hid three media

All five slots started on one shared white placeholder texture. In three.js r186, `TextureNode.getUniformHash()` returns the texture's `uuid`, and `UniformNode.getSharedNode()` gives nodes with the same hash one uniform, owned by the first node built. So once the real sheets arrived, chalk, quill and iris all kept sampling the wash. The chalk was invisible, the iris near-white, and a "brown stain" read as a bleed fault. The fix is one placeholder per slot (`createHandTextures`).

Seen on screen on 2026-11-05: live WebGPU in the app pane, then headless WebGL 2 at 1440×900 (dpr 1 and 2) and 390×844 (dpr 3) with each medium shown alone. Chalk, quill and the iris now each draw their own sheet.

## Strengths after the fix

They had been raised while the bug hid them, and came back too strong (the iris was an opaque teal disc over the cuts):

| what                                | before | now   |
| ----------------------------------- | ------ | ----- |
| iris density (`compose.ts`)         | ×2.2   | ×0.85 |
| chalk weight (`compose.ts`)         | ×1.45  | ×1.1  |
| `k-hatch` opacity (`brushes.ts`)    | 205    | 185   |
| `k-sanguine` opacity (`brushes.ts`) | 190    | 160   |

The bleed change stays as a design choice: hand pigment lifts only where the water `w > 0.12`.

## The socket wash, graded

The hollow under the brow was one bistre band at opacity 58, flat from end to end, and the blob that deepens it toward the nose dried with a hard rim and a dark pool. Now the hollow is three glazes at 30, each shorter toward the nose (ending at x = 0.95, 0.35, −0.35), so one glaze lies at the outer end and three at the inner. The nose blob dropped to 32 with a softer border (0.45 → 0.2), so it runs into the glazes instead of sitting on them. Checked on the raw wash layer (`__burin.handLayers().wash`) and in the composite at dpr 2.

## The `__burin` hooks stay in production

The proof script `.claude/skills/kiruk-burin/scripts/burin-check.mjs` drives any URL, production included, through `window.__burin`. The hooks expose no data and change only what is drawn, so they stay.

## Running it

- `pnpm --filter @kiruk/studio dev`; skip the opening loader with `sessionStorage.setItem('kiruk-loading-seen','true')` and reload.
- Keys: H hand on/off · I new impression · C make it again (with the hand's passes).
- Console: `__burin.hand()`, `__burin.impression(4242)`, `__burin.handMedia('chalk'|'wash'|'ink'|'body'|'iris', on)`, `__burin.handLayers()`.
- Paint time on a real GPU in dev: about 3.3 s for the first sheet (worker cold start), then 160 ms; headless WebGL 2: about 40 ms.

## Open

1. Founder: is the hand on by default? On the new paper too? Should the founder's own kirukal strokes go through `spine.fromSamples`?
2. The socket wash is graded; judge it. Then the white heightening, the quill's strength and the carnation blush, each at dpr 2.
3. A WebGPU look check on real hardware after the re-tune.
