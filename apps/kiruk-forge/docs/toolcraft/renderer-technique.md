# Renderer Technique

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is the focused renderer-selection reference.

Choose renderer technology from product output semantics, reference behavior, fidelity requirements, and the assessed render plan. Names, keywords, control types, source formats, and visual richness do not select a renderer.

## Normative Sequence

Use the same producer order for every custom renderer:

1. Inventory reachable controls, runtime-state inputs, and external inputs.
2. Model workload dimensions with schema or product-enforced boundaries.
3. Declare each candidate pass's cost, frequency, lifecycle, execution location, quality, cache keys, and exact interaction invalidation.
4. Run `assessToolcraftRenderPlan`; resolve errors and run protected `npm run verify:kernel` only when the assessment requires candidate evidence.
5. Derive canonical paths and compile combined fixtures through their adapters.
6. Implement the selected renderer and run targeted checks for the paths being developed.
7. Run lifecycle-appropriate proof: full functional acceptance with no measured performance for first product delivery, feature-focused tests only for later ordinary edits, or one targeted iteration for a performance complaint. Full certification is a separate operator/CI command.

Do not write renderer code before the envelope, `rendererTechnique`, pipeline, and assessment exist.

## Selection Principles

- Preserve the reference renderer in reference-runtime-clone mode unless a concrete blocker, replacement reason, and acceptance mapping are recorded.
- Keep semantic output in a representation that preserves its required fidelity, editing behavior, accessibility, and export meaning.
- Select execution location and renderer API from assessed pass cost and update frequency. Do not infer them from a product category or target name.
- Preview and export may use different renderers when `previewExportDifferenceReason` explains the boundary and tests prove equivalent product semantics.
- Prefer retained resources and stable cache keys. Source-bound resources live outside React render, survive unrelated interactions according to pass lifecycle, and release during cleanup.
- Separate layers when they have different semantics, invalidation, lifecycle, interaction, or export treatment. A costly layer does not force unrelated output into the same renderer.
- Preserve selected quality, product boundaries, backing resolution, and source fidelity. A renderer is not accepted by silently reducing them.
- In both finite and infinite modes, custom Canvas 2D, WebGL, and WebGPU previews use `useToolcraftProductSceneFrame()` as their canonical product rect, backing, and coordinate frame. `sceneBoundsProvider` supplies that rect to live output and product export in both modes; the finite artboard remains only the centered clip/output boundary. A mode toggle preserves renderer identity and live backing. Only a provider-less finite scene may fall back to the artboard rect. Do not derive another bounds wrapper, infer image scene geometry from source pixels, or measure DOM geometry.
- A preview-only environment that must stay fixed to the complete Infinity
  viewport uses `infiniteCanvasContent`, not the bounded product renderer. Keep
  that layer pointer-transparent and exclude it from scene bounds and export.

When assessment requires a benchmark, declare `kernelBenchmarkDecisions`, implement only the named executable candidates in `e2e/app-kernel-benchmarks.ts`, and let protected `npm run verify:kernel` measure them at the exact combined workload vector. Candidate outputs must be deterministic and equal at full quality. Do not author timing values or add speculative benchmark metadata when generic assessment resolves the choice.

## GPU Backend And Provider Decision

Every GPU pass declares `stage` (`render` or `compute`), `resources`, `state` (`stateless` or `feedback`), and `surfaces` before product shader code. Those pass semantics create backend pressure; backend/provider is selected separately for each `rendererTechnique.gpu` preview/export surface. Compute, storage-resource, and feedback passes create WebGPU pressure. A newly authored custom WebGPU renderer uses provider `vgpu` with capability `shader-webgpu-vgpu` and version policy `toolcraft-pinned`.

| Situation | Typed decision | Required evidence |
| --- | --- | --- |
| Newly authored custom WebGPU | `backend: "webgpu"`, `provider: "vgpu"`, `capability: "shader-webgpu-vgpu"`, `versionPolicy: "toolcraft-pinned"` | Toolcraft provider activation and its exact pin |
| Compatibility-first custom WebGL | `backend: "webgl"`, `provider: "native"`, exception `browser-compatibility` | The browser/device constraint that rejects the primary WebGPU path |
| Reference-owned WebGL | `backend: "webgl"`, `provider: "reference-runtime"`, exception `reference-parity` | Inspected reference behavior and matching acceptance |
| Three.js WebGL presentation | `backend: "webgl"`, `provider: "three"` | The declared Three.js presentation owner |
| Native WebGPU API gap | `backend: "webgpu"`, `provider: "native"`, exception `vgpu-api-gap` | The exact unsupported VGPU API and the native implementation that needs it |
| Reference-owned WebGPU | `backend: "webgpu"`, `provider: "reference-runtime"`, exception `reference-parity` | Inspected reference behavior and matching acceptance |
| Runtime-owned WebGPU | `backend: "webgpu"`, `provider: "toolcraft-runtime"`, plus `owner` | The concrete Toolcraft runtime subsystem that owns the provider |

WebGL compatibility/reference parity, native WebGPU API gaps, reference runtimes, and runtime-owned providers are closed evidence-bearing exceptions. Each preview/export surface has exactly one primary provider. An unavailable primary path reports unsupported explicitly; do not invent a fallback. Any future fallback requires a typed primary/fallback contract before implementation.

## Opt-In VGPU Setup

The neutral starter contains the protected provider catalog and dormant adapter
source, but no installed VGPU dependency and no VGPU artwork. Enable the provider
only after declared compute, feedback, or storage-resource passes create WebGPU
pressure and `rendererTechnique.gpu` selects the Toolcraft-pinned VGPU capability
for one or both affected surfaces. Preview and export remain independent typed
provider decisions.

Run these commands in order from the generated application:

```bash
npm run toolcraft:renderer -- enable vgpu
npm install
```

The catalog-pinned two-role tuple is the `vgpu` runtime role plus the
`@vgpu/wgsl` WGSL-tooling role at the exact versions and integrities declared by
the provider catalog. The enable command applies that tuple idempotently; do not
install a range, `latest`, one role by itself, or a second provider. Product code
imports only the public Toolcraft VGPU integration entry.

### VGPU Preview Surface

When `rendererTechnique.gpu.preview` selects VGPU, the preview adapter keeps
runtime sizing and time authoritative:

- its public preview presentation is exactly `canvas-surface` or `target-readback`;
  runtime/browser evidence proves the declared public presentation instead of
  assuming one from the provider;
- a direct `canvas-surface` uses `autoResize: false`; the runtime scene frame owns
  CSS dimensions, and backing applies devicePixelRatio × canvas.renderScale exactly once;
- with `target-readback`, an offscreen VGPU target presents committed pixels
  through Canvas2D, so the final preview renderer/layer is `canvas-2d` while
  `rendererTechnique.gpu.preview` stays WebGPU/VGPU. A declared `canvas-surface`
  remains the public GPU canvas instead;
- a timeline app consumes Toolcraft evaluated time and never starts an independent
  `frameLoop`; viewport work coalesces before GPU submission without changing play state.

Preview unavailability publishes the typed accessible unsupported state for that
surface and never switches silently to WebGL. A preview-only VGPU selection does
not require `rendererTechnique.gpu.export` to select VGPU, a VGPU export target,
or VGPU export unsupported proof.

### VGPU Export Surface

When `rendererTechnique.gpu.export` selects VGPU, the canonical export adapter
renders the requested artifact state into a fixed offscreen VGPU target-readback,
reads RGBA pixels, and paints every call into the runtime-supplied
CanvasRenderingContext2D. The final export renderer is Canvas2D while
`rendererTechnique.gpu.export` still names WebGPU/VGPU for its offscreen work. It
never encodes, downloads, resizes from DOM geometry, or reuses a destination
paint. Export unavailability rejects with its typed VGPU error and does not
switch silently to WebGL.

An export-only VGPU selection does not require `rendererTechnique.gpu.preview`
to select VGPU, a VGPU preview presentation, or VGPU preview unsupported proof.

### Feedback And Retained Lifecycle Profile

Only an app that declares feedback/storage and asynchronous retained-resource
lifecycle semantics uses the physical renderer profile for its selected VGPU
surfaces. A stateless VGPU renderer does not invent its surface passes, FIFO,
epochs, settlement counters, `retainedAccesses`, or `preparationInvalidates`.

For this profile, keep the executable pipeline surface-truthful. One retained
`resources` pass owns the provider and storage. A VGPU preview adds `resources →
preview-simulate → preview-present`; a VGPU export adds `resources →
export-simulate → export-present`. The pipeline has the exact physical five-pass
shape only when both surfaces select VGPU. Simulation passes mutate only their
declared surface state, and uncached present passes own render, readback, and the
destination paint. A failure-recovering FIFO serializes each complete
simulate-plus-present operation so another call cannot mutate retained feedback
between simulation and readback.

Each renderer generation and disable transition in this profile advances a lifecycle epoch.
Queued work must match that epoch before destination work, again before paint, and
before ready/snapshot publication; stale cleanup cannot clear a newer generation.
Retirement uses its own ordered failure-recovering FIFO. The visible
`operation-started`/`operation-settled` and
`retirement-started`/`retirement-settled` generations are authoritative: capture
a baseline only after both pairs are exactly equal.

Its pipeline metadata must describe that work, not approximate it. Use
`retainedAccesses` for a retained-resource lookup that may produce only a cache
hit. Use `preparationInvalidates` only for passes allowed to advance during
prepare-and-settle before a phase baseline; it never authorizes measured action
work. Each selected surface declares its own pixel/replay dimensions, limits,
simulate pass, and present pass even when both share one provider and FIFO.

Keep verification bounded to the changed behavior:

```bash
npm exec -- vgpu check --require-validation <changed-wgsl-files>
```

Use `vgpu/mock` for bindings and lifecycle, a small `vgpu/node` pixel test only
when shader math/output changes, and focused browser acceptance for each selected
VGPU surface under change. Preview proof owns provider, presentation, backing,
pixels, and preview unsupported behavior; export proof owns offscreen destination
pixels and typed export rejection. An unselected surface adds no VGPU proof. The
first product delivery still uses its one functional delivery gate. Later ordinary
VGPU edits use focused checks, and ordinary VGPU edits do not authorize measured
performance.

### VGPU Provider Version Authority

Provider discovery and publication belong to the Toolcraft monorepo, not to a
generated application. From the monorepo root, run the read-only check first:

```bash
npm run renderer:versions:check
```

The check may report registry latest and current approved metadata, but it never mutates
the catalog or any repository file. A report is not update authority.
Promote only one explicitly chosen exact version with:

```bash
npm run renderer:version:promote -- vgpu <exact-version>
```

Promotion accepts an exact version only. It validates the closed, aligned VGPU
runtime/WGSL-tooling tuple. It runs the compatibility gate before atomic tuple publication
against an isolated generated application.
A failed candidate leaves the current approved dependency tuple and catalog bytes unchanged.
Provider compatibility promotion is functional proof; measured performance is not part of provider compatibility promotion.

Never use version ranges (`^` or `~`), the `latest` tag. Do not use `npm update vgpu`,
direct catalog edits, or a handwritten `approvedRelease` record. The promotion command
creates the candidate bytes and approval record; do not reconstruct either by
hand.

If a candidate needs an API migration, leave the approved catalog tuple unchanged,
edit the real protected adapter source, schema, and focused tests, then rerun the
same exact promotion command. Its ephemeral overlay is never an editing surface;
it exists only to run isolated compatibility against the candidate bytes.

A generated app must never auto-update its renderer provider and adopts a new
release only through an explicit Toolcraft tuple migration. An old app receives
both promoted dependency pins, the provider catalog, matching adapter source,
Vite loader, `approvedRelease` record, and any schema migration as one coherent
migration. It never reads registry latest or copies only one new version string.
Automatic migration tooling is outside this contract.

## Required Inventory

Custom renderer specs and `src/app/app-performance.ts` mirror:

- `sourceRepresentation`;
- `productRepresentation`;
- `previewRenderer`;
- `exportRenderer`;
- `rendererStrategy`;
- `whyNotAlternativeStrategies`;
- `fidelityRisks`;
- `performanceRisks`.

Workload pressure and renderer candidates are derived from envelope dimensions and assessed renderer-pass cost/lifecycle. Do not author a parallel coarse workload category or separate renderer-comparison metadata. `kernelBenchmarkDecisions` records product intent; only its protected current-source receipt is measurement evidence.

If output is intentionally rasterized, include `intentionalRasterizationReason`. If preview and export renderers differ, include `previewExportDifferenceReason`. If a reference runtime renderer changes, include `referenceRendererChangeReason`.

`rendererTechnique` records the selected technology. `rendererPipeline` records why and when its passes execute. Both must agree with the implementation.

Renderer technology does not decide camera ownership. Before renderer code,
product readiness separately declares `viewInteraction`: editable spatial scenes
default to `orbit`; fixed or timeline-owned cameras require explicit
user/reference evidence. WebGL/Three.js alone does not imply orbit, and a fixed
camera chosen by the implementation is not evidence for omitting it.

## Layer Inventory

Declare each meaningful product, overlay, and export layer in `rendererTechnique.layers`. Give visible product and editing layers a stable `uiSelector` for browser proof. For every layer, record content semantics, renderer, primitive magnitude, and export mode.

Editing handles remain interaction overlays, stay out of exported product output, and write through runtime state. Tests verify visible layers and export inclusion independently.

## Three-Dimensional Model Interaction

Standard model apps use `modelPresentation: { mode: "runtime" }` and the runtime's lazy Three binding/canvas layer. It renders canonical geometry plus the supported authored material/texture/vertex-color appearance, or the exact Blender-compatible fallback when appearance is absent. Product `canvasContent` must not import format loaders, enumerate repository records, create a second Three cache, reconstruct materials, or render a duplicate model over the runtime layer. `renderDefaultCanvasMedia={false}` affects generic image/file preview only and never disables model presentation.

Custom model output is an explicit presentation mode, not a loader escape hatch. Declare unique consumers in `modelPresentation: { mode: "custom", consumers }`, mount `useToolcraftModelPresentationConsumer(declaration)`, then acquire and release the supplied presentation lease. Runtime suppresses its standard layer only for those declared source targets and reports retryable feedback when the checked consumer is missing or acquisition fails.

```tsx
const declaration = {
  id: "product-model",
  sourceTarget: "source.model",
  orientationTarget: "view.orbit",
} as const;

function ProductModel({ activeDocumentRef }: { activeDocumentRef: string }) {
  const presentation = useToolcraftModelPresentationConsumer(declaration);

  React.useEffect(() => {
    const controller = new AbortController();
    let release: (() => void) | undefined;

    void presentation
      .acquirePresentation(activeDocumentRef, {
        purpose: "preview",
        signal: controller.signal,
      })
      .then((lease) => {
        if (controller.signal.aborted) return lease.release();
        release = lease.release;
        mountProductSceneRoot(lease.root, lease.document, lease.bounds);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) handleProductPresentationError(error);
      });

    return () => {
      controller.abort();
      unmountProductSceneRoot();
      release?.();
    };
  }, [activeDocumentRef, presentation]);

  return <canvas data-toolcraft-product-output />;
}
```

The `mount*` and error functions above stand for product renderer integration only. The consumer receives the ready canonical root and metadata; it does not import GLTF/OBJ/FBX loaders or rebuild materials.

The presentation lease is keyed by canonical document reference and shares immutable geometry/material/texture GPU resources across preview and export while cloning only scene roots. Replacement, delete/reset, failed creation, release, and provider unmount dispose ownership deterministically. The original uploaded folder/ZIP remains immutable durable source; display fit and camera pose live outside the leased root.

The runtime presents structurally valid analyzing or repairing geometry at `0.4` opacity and committed clean/fixed geometry at `1`. Export is always `1`. Runtime image/video export composites visible committed model layers before awaiting the product's shared `ToolcraftAppComposition.exportRenderer` frame. Models are not silently traced for SVG; explicit SVG delivery requires product-authored editable vector content through `svgExportRenderer`. Runtime owns presentation binding, pose, scene frame, dimensions, pixel ratio, validation/encoding, and download; product code does not call model compositors or construct a parallel export host.

When `viewInteraction.mode` is `orbit`, schema `orientationGizmo`, direct model drag, preview rendering, hit testing, reset/history, and export share every declared orientation pose target. The product renderer supplies geometry-aware `hitTest`; Toolcraft owns gesture scheduling and history through `useToolcraftModelOrbitInteraction`.

Pointer ownership is selected on pointer-down. A visible-model hit rotates; a miss is left untouched so `CanvasShell` pans. Target-scoped runtime ownership serializes gizmo drag, snap, and direct orbit, and cancels stale work on a newer gesture or external state write. Do not infer model geometry in runtime, keep a second local camera/Euler state, or let orientation invalidate passes that do not consume the pose. Measure the orientation target's canonical live interaction path at the declared workload without reducing preview quality.

Layer boundaries follow semantics and invalidation, not a fixed list of product domains. Their workload proof comes from derived paths and combined fixtures.
