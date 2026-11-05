# Proposal: grease-pencil-scene

## Why

W1 locked the homepage feeling as **2.5D, first-person, interactive** — you sit where Arun sits. What it never fixed was the _mechanism_. "2.5D" was a description of a feeling, not a thing the repo knew how to build, so the landing page shipped as a flat sheet of ink and the scribble desk could only ever produce one.

The founder's reference (two photographs, `content/scribbles/grease-pencil/`) names the mechanism: **Blender's grease pencil**. The same hand-drawn character, twice. In the first frame the ground under it is a single horizon line. In the second the camera has turned and that line has opened into a receding X — while the character stays face-on and the drawn interface around the viewport has not moved at all. Three behaviours, one gesture:

- a drawing pinned to a plane turns with the world,
- a drawing that faces the camera stays face-on at its own depth,
- interface is interface and never orbits.

That is a model, not a mood. It gives the studio a way to show 2D and 3D in the same frame without either one pretending to be the other — the ink keeps its pressure, taper and paper tooth, and gains a place to stand.

## What changes

- Added: Requirement "Grease-pencil scene" in `pen-and-paper/spec.md` — scribble sheets become scenes of layers with a facing, a depth and a plane; v1 flat sheets remain valid and lift into a single layer.
- Added: Requirement "Scene motion answers to the reader" in `pen-and-paper/spec.md` — the camera moves on direct input only.
- Modified: _(none — the existing pen-and-paper requirements are untouched; a scene is a superset of a sheet.)_
- Removed: _(none)_

**Not in this change, and deliberately:**

- **Oblique drawing.** Picking a plane snaps the camera square to it before ink goes down, exactly as Blender's numpad views do, so sheet units map 1:1 to the pointer and no stroke is ever laid through an inverse projection. Drawing onto a plane you are looking at edge-on is a later slice.
- **Mesh layers.** `LayerKind` exists and layers sort by depth rather than document order precisely so a WebGL layer can slot into the stack later. Nothing renders through Three.js today.
- **Founder artwork.** The rig ships; the drawing does not. See below.

## Why CSS 3D and not Three.js

The stack already carries Three.js r170 and R3F 9, and this is the obvious place to reach for them. It is the wrong reach.

What makes a kiruk stroke read as graphite is the perfect-freehand outline plus the paper-tooth SVG filter. Both survive a `matrix3d` untouched — a transformed SVG path is still a resolution-independent path. Rasterising the same stroke into a WebGL ribbon throws away the exact thing the brand is made of, and then asks a shader to imitate it back.

The practical margins point the same way. Layer transforms are strings built from two CSS custom properties, so orbiting costs one style write per frame and the compositor does the rest; a reader with JavaScript off still gets the whole scene at its rest pose, because the rest pose is baked into the markup. The landing route stays at ~8 KB gzipped against ~150 KB for a WebGL runtime that has nothing to draw yet.

Three.js becomes the right answer when the scene needs something CSS cannot express — true mesh occlusion, a shadow catcher, depth of field. The depth-sorted layer stack is the seam where that arrives.

## The rig ships; the drawing does not

Non-negotiables 6 and 7 hold. The floor grid and axis gizmo are generated from the same stroke engine with a seeded wobble — they are _furniture_, drawn by code the way `@kiruk/kirukal` draws frame edges, and they are labelled as such in source. Everything with a point of view — subject, backdrop, ground marks, the drawn interface — ships as a **named, empty layer** waiting for the founder's pen.

So the landing page after this change is a viewport with a hand-drawn floor and nothing standing on it. That is the honest state: the rig is finished, the scene is not.

## Impact

- Specs touched: `pen-and-paper`
- Artifacts: `apps/kiruk-web/src/components/scribble/scene.ts` (new), `ScribbleSheet.astro`, `ScribbleDesk.tsx`, `integrations/scribble-writer.mjs`, `src/scribbles/landing.json`, `src/pages/index.astro`, `src/layouts/Base.astro`
- Downstream: any page may host a scene; `kiruk-portal`'s proposal canvas is unchanged and may adopt the model later
- Risk: `z` depth is expressed in px and does not scale with the viewport, so parallax reads stronger on a phone than on a wide desktop. Acceptable — a Blender viewport behaves the same — and tunable per breakpoint if it grates.

## Open question for the founder

The reference reframes W1. "POV designer's desk with 2.5D articulated hands" and "hand-drawn Blender viewport you can orbit" are both first-person and both 2.5D, but they are not the same homepage. This change builds the second and does not delete the first: the desk, if it comes, is a set of layers in this same scene. **W1 needs a line added, not overwritten** — that is a founder decision, not an agent one, so `FOUNDER_DECISIONS.md` is untouched here.

## Deltas

See ./specs/pen-and-paper/spec.md
