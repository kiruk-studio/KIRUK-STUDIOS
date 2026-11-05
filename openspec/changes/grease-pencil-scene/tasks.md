# Tasks: grease-pencil-scene

- [x] Scene model + projection + v1→v2 lift — `apps/kiruk-web/src/components/scribble/scene.ts`
- [x] Code-drawn viewport rig (floor grid on a real plane, axis gizmo) from the stroke engine
- [x] `ScribbleSheet.astro` renders layers in depth; world layers take the camera, `screen` layers do not
- [x] Reader-side orbit: pointer drag + arrow keys, no idle motion, rest pose static
- [x] Desk: layer strip (select / depth / facing / hide / delete), drawing planes (1 · 3 · 7), align (0), onion skin
- [x] Desk gestures tracked on the window rather than via `setPointerCapture` (capture can be refused silently, which hangs the stroke open)
- [x] Dev writer accepts and persists v2; v1 bodies migrate on save
- [x] `landing.json` becomes a named, empty scene; `index.astro` hosts the stage
- [x] Preload the hand faces in `Base.astro` (they are body text, not decoration)
- [x] Verified in a browser: orbit, plane snap, draw, save round-trip, static build
- [ ] Founder: add the two reference photos to `content/scribbles/grease-pencil/` (see `manifest.md`)
- [ ] Founder: draw the landing scene — `chrome`, `backdrop`, `ground-marks`, `subject`, `foreground`
- [ ] Founder: decide how this sits against W1 in `FOUNDER_DECISIONS.md` (added to, not replaced)
- [ ] `npx openspec validate grease-pencil-scene --strict`
- [ ] Merge delta into `openspec/specs/pen-and-paper/spec.md` and archive
