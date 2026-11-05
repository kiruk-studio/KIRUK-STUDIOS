# Implementation Worklog

This file records product decisions and the evidence behind them. Keep it short, factual, and current. Update it after schema, renderer, timeline, layer, export, performance, or acceptance decisions.

## Status

Mode: product

BLOGISM is a white finite page for tablet ink and a Develop panel for title, collection, and kiruk.in save. PNG export is the typed artifact. Timeline and layers stay off.

## Automatic Delivery Lifecycle

Keep this worklog human-shaped. For the first product delivery, record the request, decisions, state/output mapping, reference evidence, rejected alternatives, and known risks; one bare `npm run verify:delivery` derives complete contract proof, one build, full functional acceptance, and no measured performance. For later ordinary edits, record new intent and material decisions, the exact unit/component test, and acceptance IDs passed to `npm run test:feature`; selector expansion is automatic, while explicit `--all` records why the edit could not be bounded. Do not claim or run another aggregate functional delivery.

Classifier output establishes complaint authority only and never path localization. A localized performance complaint adds the domain authority below, then one bare `npm run verify:delivery` runs one targeted iteration. If localization remains unresolved regardless of classifier result, ask one user-facing question naming visible operations and offering targeted diagnosis or a complete review; record neither `performance-iteration` intent nor canonical path authority until the answer supplies exact localization evidence. Never ask the user to choose internal path IDs. A broad or honestly unlocalizable problem may present that single choice with a recommendation for complete review, but the user still chooses. A direct complete-review request needs no further clarification. The full audit remains separate and requires an explicit operator request or accepted offer before `npm run verify:perf` may run. Protected receipts own changed files, plans, checks, reports, measurements, and pass/fail evidence.

When `canvas.renderScale` is enabled, record the renderer decision to preserve selected backing quality and map it to functional `renderScaleCoverage` for interaction and steady state, plus playback when timeline is enabled. The worklog may name the protected `canvas-render-scale-backing` recipe, but it cannot claim its evidence or turn a quality failure into performance authority.

## Performance Iteration Entry Contract

For high-confidence ordinary work, record `Performance intent: ordinary-product-work`. For unresolved localization, whether classification returned high-confidence `performance-iteration` or `needs-agent-judgment`, record the unresolved visible operation but no `Performance intent: performance-iteration` field or `Performance paths` until the user's one clarification provides exact localization. For a localized performance complaint or post-clarification targeted choice, record exactly these domain fields in the latest iteration:

```md
- Performance intent: performance-iteration
- Performance request evidence: "<verbatim exact Request quote>"
- Performance paths: ["performance-path:%5B...%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
```

The quoted evidence must be an exact nontrivial raw substring of `Request` with identical whitespace and Unicode code units. `Performance paths` must be a non-empty unique JSON array of canonical path IDs. Do not record command arguments, changed-file inventory, executed checks, reports, or measurements; the protected planner and receipt own that machine evidence. Each localized complaint or post-clarification targeted choice authorizes one bounded iteration; after it passes, return the app and wait for user evaluation. Classifier output or complaint evidence alone never supplies path localization or authorizes full certification. The separate operator command is permitted only after the user explicitly requests a complete audit or explicitly accepts the agent's offer; the user does not need to name the command.

## Decisions

### Renderer
- Decision: Use Canvas 2D for live preview and PNG export of the white page sheet.
- Reason: Tablet pressure and coalesced pointer samples need one bitmap backing; SVG would freeze the live stroke.
- Evidence: src/app/blogism-page-canvas.tsx, src/app/blogism-export.ts, src/app/app-performance.ts, and src/kiruk/raster.ts.

### View Interaction
- Decision: Use non-spatial view interaction.
- Reason: The notebook sheet is two-dimensional handwriting with no model camera.
- Evidence: appProductReadiness.viewInteraction.

### Interaction Ownership
- Decision: Panel `page-side`, `page-tool`, and `page-title` own workflow, tool, and copy; canvas `viewport-pan` and `viewport-zoom` own navigation; ink commits through runtime `controls.setValue` on `blogism.ink`.
- Reason: Design/Develop replace the panel body; the sheet stays spatial handwriting; pan/zoom belong to the viewport.
- Evidence: src/app/app-acceptance-data.ts interactionOwnership linked to renderer.side, renderer.tool, renderer.title, renderer.viewport, and renderer.viewport-zoom.

### Timeline
- Decision: Do not enable timeline.
- Reason: The page is a still sheet; PNG is the only requested artifact.
- Evidence: appTransferMode.animationIntent.mode is none and appSchema.panels.timeline is omitted.

### Layers
- Decision: Do not enable layers.
- Reason: One composed page is the product entity.
- Evidence: appSchema.panels.layers is omitted.

### Controls
- Decision: Use built-in tabs, segmented, switch, text, code, select, actions, and sticky panelActions.
- Reason: Design versus Develop replaces the panel body; ink tools and copy map to existing Toolcraft components; Save/Publish/Export PNG are sticky delivery.
- Evidence: src/app/app-schema.ts and appControlSectionInventory.

### Export
- Decision: Supply deterministic Canvas 2D pixels through one runtime-owned Export PNG action, plus Save/Publish File System Access writes into kiruk.in.
- Reason: Runtime owns scene crop, encoding, and download; the kit owns MDX and ink SVG/JSON beside the CMS.
- Evidence: appComposition.exportRenderer, src/app/blogism-kit.ts, and sceneBoundsProvider.

### Performance
- Decision: Declare the Canvas 2D sheet-paint pipeline and ordinary-product-work coverage without running measured performance.
- Reason: First delivery proves functional ink, copy, and PNG; measured performance remains separately authorized. Only exact request authority may create a measured targeted performance iteration.
- Evidence: src/app/app-performance.ts and derived path scenarios.

## Decision Trail

### Delivery 1 — BLOGISM white sheet and kiruk.in kit

- Request: Build BLOGISM as a Toolcraft app beside kiruk-forge: white canvas for tablet design, schema panels for developer structure, then restyle kiruk.in/blog to clean type plus ink SVGs.
- Task type: First product delivery, schema, Canvas 2D renderer, File System Access kit, acceptance, and worklog.
- User-visible result: Design draws on a white finite page with pen-only ink; Develop edits title, excerpt, collection, draft, and body; Save/Publish write kiruk.in MDX and ink files or copy them; PNG export uses the page scene.
- Source/reference checked: apps/kiruk-forge product canvas/kit, kiruk.in ink-save contract, Toolcraft 0.0.20 schema-reference, setup-export, and acceptance-testing.
- Reference inputs: None.
- Docs/contracts read: workflow.md, schema-reference.md, setup-export.md, acceptance-testing.md, renderer-technique.md, and core/runtime-boundary.md.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, infinity-canvas-scene-bounds, interaction-surface-ownership, controls-product-coverage, output-export-required, controls-section-inventory-required, renderer-technique-inventory, renderer-view-interaction, acceptance-product-observable, persistence-policy-explicit, and workflow-required.
- View interaction intent: non-spatial; the sheet has no 3D camera.
- Interaction ownership: Panel owns Design/Develop, tool, and title; canvas owns pan/zoom; ink is a runtime setValue, not a canvas-handle.
- Decision: Vendor a second Toolcraft 0.0.20 workspace, keep the signed host unstyled, and publish through File System Access instead of Next APIs.
- Alternatives rejected: Restyling src/toolcraft to a black shell, importing Toolcraft into kiruk.in, SketchInk UI on /blog, Calligraphr, tldraw, Infinity as the default page wall, and registering BLOGISM as PR1.
- State/output mapping: blogism.side swaps panel controls; blogism.ink plus title/body paint the page through useToolcraftProductSceneFrame; Save writes content/<collection>/<slug>.mdx and public ink JSON/SVG; Export PNG uses the same paint in scene coordinates.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: File System Access is Chromium-only; clipboard is the fallback. Touch is always ignored so a tablet palm cannot steal the stroke.

## Evidence

- Source reviewed: schema, composition, kit, page canvas, kiruk InkDocument, and product acceptance rows.
- Contract applied: product readiness mode product, image toolcraft-default, SVG/video not-requested, localStorage persistence, and no measured performance.

## Verification

- One bare `npm run verify:delivery` will derive and run the protected proof.
- Later feature work uses only focused unit and browser checks for the edited behavior.
- A complete performance review runs `npm run verify:perf` only when explicitly requested.

## Risks

- Risk: showDirectoryPicker is unavailable outside Chromium and falls back to clipboard.
- Risk: Playwright must dispatch pointerType pen because Pen only defaults to true.
