# Implementation Worklog

## Status

Mode: product

Kiruk Forge is a named component stage: catalog tiles show human names plus restyled kirukal template vectors, the finite canvas hosts live Base UI Button/Frame (or a construction outline) with textless anatomy hotspots and in-place pen, and sticky Publish / Edit write append-only `vNN` source. Runtime Setup keeps Export Settings, Import Settings, and Infinity canvas. Finite 384×440 is the default stage. Persistence key `toolcraft:kiruk/forge:state:v4` so the old Infinity-on silhouette desk does not restore.

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

- Decision: DOM hosts the live component or construction outline; a Canvas 2D overlay captures the active hotspot stroke.
- Reason: Empty recipes must stay Base UI construction chrome, not fake ink, while tablet pressure still needs coalesced samples.
- Evidence: `src/app/forge-stage.tsx`, `src/app/app-performance.ts`.

### View Interaction

- Decision: non-spatial view interaction.
- Reason: The stage is a 2D component page with pen capture and has no visible three-dimensional scene or orbit camera.
- Evidence: `appProductReadiness.viewInteraction`.

### Interaction Ownership

- Decision: Panel owns named catalog selection, take-slot edits, and Publish/Edit. Canvas owns textless anatomy hotspots. Pen capture stays on the active hotspot overlay.
- Reason: Identification needs visible names; the place that can change is on the live component; kit ingest is a delivery command.
- Evidence: `appProductReadiness.interactionOwnership`.

### Timeline

- Decision: Do not enable timeline.
- Reason: Takes are discrete append-only versions, not a playback or keyframe transport.
- Evidence: `appSchema.panels.timeline` is omitted.

### Layers

- Decision: Do not enable layers.
- Reason: One selected component is on the stage; shared marks surface as status, not a layer stack.
- Evidence: `appSchema.panels.layers` is omitted.

### Controls

- Decision: One Component section with a custom named catalog, take-progress anatomy, and Clear. Sticky Publish and Edit are panelActions. Runtime Setup is unmodified.
- Reason: Built-in imagePicker never shows captions; Setup Import/Export Settings are workspace JSON, not kit save; Infinity stays for a later multi-component page.
- Evidence: `src/app/app-schema.ts`, `src/app/forge-catalog-control.tsx`, `docs/toolcraft/core/setup-export.md`.

### Export

- Decision: Remove image/SVG/video export. Publish writes kirukal source SVG through File System Access.
- Reason: The product job is append-only kit ingest, not a PNG of the stage.
- Evidence: `appProductReadiness.exportIntent.image.mode` is `user-removed`; sticky actions are Publish and Edit.

### Performance

- Decision: Use lifecycle-aware protected delivery verification with ordinary product work.
- Reason: First delivery needs functional proof; measured performance is not requested.
- Evidence: `npm run verify:delivery` protected receipt.

## Decision Trail

### Iteration 1 — Named component stage

- Request: Make Forge a named component stage rather than a drawing-tool save dialog, with real template vectors, live Base UI on the page, textless hotspots, and Publish/Edit of append-only takes, while leaving Setup Import/Export Settings and Infinity in place.
- Task type: Schema, custom catalog, DOM/canvas stage, kit ingest, acceptance, and first product delivery.
- User-visible result: Catalog tiles show Button, Switch, Dialog and the rest with restyled template vectors. Selecting Button puts a live Base UI Button on the finite 384×440 stage. Hotspots select Tight box or Arrow. Publish writes the next `vNN`; Edit loads a published take for republish. Infinity off is the default; turning it off restores the stage.
- Source/reference checked: kirukal inverted catalog and templates, Toolcraft Setup/Infinity contract, current Forge silhouette desk, and the attached component-stage plan.
- Reference inputs: None. This product has no motion reference.
- Docs/contracts read: `workflow.md`, `core/control-selection.md`, `core/setup-export.md`, `core/runtime-boundary.md`, `custom-controls.md`, `custom-control-visuals.md`, `acceptance-testing.md`, and `renderer-technique.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `interaction-surface-ownership`, `canvas-handle-placement`, `controls-section-inventory-required`, `output-export-required`, `renderer-view-interaction`, `persistence-policy-explicit`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: non-spatial; the product has no visible three-dimensional scene or model.
- Interaction ownership: Panel catalog selects the named component. Canvas hotspots select the anatomy piece. Panel take dots edit the take slot. Sticky Publish/Edit own kit ingest.
- Decision: Use model B, the live component stage. Keep Setup controls. Default finite mode. Custom catalog because imagePicker cannot show names. Persistence v4 so the Infinity-on silhouette workspace does not restore. Shared marks remain one write, shown as Also skins status. Infinity stays available as a later page of several components, not the drawing mode.
- Alternatives rejected: Named paper that keeps magenta templates as the product; removing Import/Export Settings or Infinity; overwriting `v01`; a CMS of many components in this pass; fake sketched strokes for empty recipes.
- State/output mapping: `forge.component` chooses the stage. `forge.anatomy` plus `mark.id` / `mark.take` name the active piece. `mark.ink` stores samples. `mark.published` records last `vNN`. `sceneBoundsProvider` returns the finite stage rect. Kit writes `packages/kirukal/assets/source/<family>/<id>.vNN.svg`.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: File System Access still needs a folder grant on first Publish; without it the SVG copies to the clipboard. Infinity still hides the product paper fill by contract, so the default stays finite.

## Evidence

- Source reviewed: `packages/kirukal/assets/templates/`, `packages/kirukal/src/catalog.ts`, `src/app/forge-stage.tsx`, `src/app/forge-catalog-control.tsx`, `src/app/forge-kit.ts`, and runtime Setup in `docs/toolcraft/core/setup-export.md`.
- Contract applied: `interaction-surface-ownership`, `output-export-required` with image user-removed, `controls-section-inventory-required`, and `infinity-canvas-scene-bounds` for mode restore.

## Verification

Protected receipts own changed files, the derived plan, commands, selectors, reports, measurements, and pass/fail evidence. Decision Trail iterations record only one bare `npm run verify:delivery` narrative.

## Risks

- Risk: First Publish still asks for `packages/kirukal/assets/source`; aborting copies SVG to the clipboard instead of writing a file.
- Risk: Infinity on still suppresses the stage paper fill; the usable desk is finite mode.
- None: Shared-mark compatibility is status-only in this pass, not a multi-component CMS.
