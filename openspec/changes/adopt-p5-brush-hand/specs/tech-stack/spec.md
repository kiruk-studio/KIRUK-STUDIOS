# Delta: tech-stack (MODIFIED)

## ADDED Requirements

### Requirement: The hand = p5.brush standalone, scoped to burin's hand

The burin engine's hand (chalk, wash, quill and lead white laid over an engraved impression) MUST be painted with `p5.brush` at an exact pinned version (`3.0.0`), using its standalone WebGL 2 build without `p5`. `p5.brush` MUST only be imported from `packages/burin/src/hand/painter.ts` and `packages/burin/src/hand/brushes.ts`. It MUST run in a Web Worker on an `OffscreenCanvas`, or be loaded lazily on the main thread only when the worker has no WebGL 2. `p5` MUST NOT be installed; its peer dependency MUST be marked optional in the root `pnpm.packageExtensions`. A page's first-load JavaScript MUST NOT include `p5.brush`.

#### Scenario: p5.brush stays out of the first load

- GIVEN `pnpm --filter @kiruk/studio build` has run
- WHEN the home route's first-load chunks are searched for the p5.brush library code
- THEN none contains it
- AND it is found only in the worker chunk and a lazily loaded fallback chunk

#### Scenario: p5.brush imported elsewhere

- GIVEN a contributor imports `p5.brush` from a file outside `packages/burin/src/hand/`
- WHEN the change is reviewed against this requirement
- THEN it is rejected, or this requirement is amended first by an OpenSpec proposal

#### Scenario: No WebGL 2 anywhere

- GIVEN a browser whose worker and page both lack WebGL 2
- WHEN the eye loads
- THEN the hand reports state `none`
- AND the engraved eye renders without it
