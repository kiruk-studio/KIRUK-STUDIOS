# Tasks — adopt-p5-brush-hand

## Spec

- [x] Author delta `openspec/changes/adopt-p5-brush-hand/specs/tech-stack/spec.md`
- [x] `npx openspec validate adopt-p5-brush-hand --strict` passes

## Code (on `feat/hand-drawn-design-system`)

- [x] `p5.brush@3.0.0` pinned in `packages/burin`; `p5` peer optional in root `pnpm.packageExtensions`
- [x] `packages/burin/src/hand/` media, spine, brushes, painter, worker, compose, `createHand`
- [x] One placeholder texture per hand slot (three.js shares a sampler between nodes with the same texture uuid)
- [x] Strengths re-tuned after that fix (iris ×2.2 → ×0.85, chalk ×1.45 → ×1.1, k-hatch 205 → 185, k-sanguine 190 → 160)
- [x] `next build` passes; p5.brush only in the worker chunk and a lazy fallback chunk

## Open

- [ ] Founder: hand on by default? on the new paper? kirukal strokes through `fromSamples`?
- [ ] Grade the flat socket wash band; tune white heightening, quill and carnation at dpr 2
- [ ] WebGPU look check on real hardware after the re-tune (proofs so far: WebGPU live in the app pane before the re-tune, WebGL 2 headless after)
- [ ] Archive after founder approval
