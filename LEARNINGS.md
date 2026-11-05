# LEARNINGS — mistakes, near-misses, guards

**Append-only.** Add new **dated** sections at the **bottom**. Do not rewrite or delete past entries to hide a repeat; if the same failure class happens again, add **another** entry and **strengthen** the guard (spec scenario, script, rule, or checklist). This file is for **learning in motion**—including what did not work—so the journey stays honest, not a scoreboard of perfection. Victories and pivots that teach a guard belong here too when they are material.

## How to add an entry

Use this shape (markdown `##` heading + bullets):

```markdown
## YYYY-MM-DD — short title

- **Mistake:** what broke or almost broke.
- **Root cause:** why it happened (process, spec gap, missing check, etc.).
- **Fix:** what we did to correct it.
- **Guard:** what now stops a repeat (link to spec section, `npm run …`, `.cursor/rules/…`, PR checklist item, or habit).
```

**Material** = worth recording: anything that could hurt users, brand, security, or trust if it happened again—not every typo.

## Entries

## 2026-05-26 — Unlayered sketch CSS overrode Tailwind position utilities

- **Mistake:** The bottom `SketchNav` rendered pinned to the top of the page instead of fixed at the bottom. `position: relative` (and `bottom: 20px`) applied, but `fixed` silently lost.
- **Root cause:** Tailwind v4 puts utilities in `@layer utilities`. The ported sketch classes in `global.css` (`.sketch-border`, `.sketch-button`, etc.) are **unlayered**. Per CSS cascade-layer rules, unlayered declarations beat layered ones regardless of source order — so `.sketch-border { position: relative }` overrode the `fixed` utility on the same element.
- **Fix:** Decoupled positioning from decoration — an outer wrapper carries the Tailwind position utilities (`fixed bottom-5 left-1/2 -translate-x-1/2`), the inner element carries `.sketch-border`.
- **Guard:** Never combine a `.sketch-*` class that sets `position` with a Tailwind position/inset utility on the **same** element — wrap instead. When the sketch primitives graduate into `@kiruk/design-system`, wrap their global CSS in `@layer components { … }` so Tailwind utilities can override cleanly, and this whole class of conflict disappears.

## 2026-09-08 — Typed SVG export crashed Forge because the signed host omitted svgExportRenderer

- **Mistake:** Kiruk Forge declared a typed Export SVG action and a working `svgExportRenderer` in product composition, then the app threw on boot: "A typed SVG export action requires svgExportRenderer."
- **Root cause:** Toolcraft 0.0.20's signed `src/routes/index.tsx` lists composition fields one by one and never passes `svgExportRenderer`. `ToolcraftApp` supports the prop; the generated AppHome does not wire it.
- **Fix:** Pass `svgExportRenderer={appComposition.svgExportRenderer}` from AppHome so Export SVG can exist without crashing the shell.
- **Guard:** After adding a typed `export-svg` panel action, boot Forge and confirm the host actually forwards `appComposition.svgExportRenderer`. A composition field that the signed AppHome does not pass is a crash, not a silent no-op. Integrity will fail until Toolcraft regenerates that host; do not assume composition fields auto-wire.

## 2026-09-11 — Forge paper sat off-center at world origin

- **Mistake:** The drawing template still looked like a floating magenta crosshair on white. Right and bottom ticks vanished; the sheet had no rectangle.
- **Root cause:** Repeat of unreadable paper. `sceneBoundsProvider` used artboard-local `(0,0)` instead of Toolcraft world space (origin at the viewport center, finite artboard at `-size/2`). Half the mark sat outside the centered clip. Guides had no paper frame, and a 0.5px inset still let the 1px stroke occupy pixel `width`, which the bitmap clip eats.
- **Fix:** World-space scene bounds `{ x: -width/2, y: -height/2 }`. Live 2px paper rectangle plus strip divider, inset 2px. Playwright samples all four sheet edges, not only the top-left 24×24.
- **Guard:** `sceneBoundsProvider` returns the same centering as `getToolcraftFiniteArtboardRect`. `expectPaperSheetVisible` in `e2e/app-forge-mark-support.ts` must keep passing for `renderer.draw-stroke`.

## 2026-09-15 — Toolcraft 0.0.20 signed path test fails on Windows

- **Mistake:** First BLOGISM `verify:delivery` died in `app-acceptance.framework-boundary.test.ts` (`C:/Users/...` vs `C:\Users\...`) even though product identity, schema, and worklog were valid. Forge has the same failure.
- **Root cause:** The signed test uses `path.join` (Win32 separators) against `ts.resolveModuleName` (POSIX separators). `src/app/app-identity.ts` is also hash-locked to "Kiruk Forge"; product name lives in `app-acceptance-data`, not that file.
- **Fix:** Keep the signed host byte-identical. For Windows Vitest workers only, `NODE_OPTIONS=--require apps/kiruk-blogism/.win32-vitest-path-join.cjs` rewrites `path.join` to POSIX after `Module.syncBuiltinESMExports()`. Image resolution stays `performanceRole: "responsiveness"` so the empty workload envelope remains valid.
- **Guard:** Do not edit `src/toolcraft`, `src/app/app-identity.ts`, or signed `app-acceptance.*.test.ts`. On Windows, export the NODE_OPTIONS require before `npm run verify:delivery`. Treat a new `performanceRole: "workload"` as a full envelope dimension, not an empty `{ dimensions: [] }`.

## 2026-09-16 — setPointerCapture can be refused silently, and the stroke hangs open forever

- **Mistake:** Moving the scribble desk into a 3D stage made drawing stop working completely. Pointerdown fired and the live stroke painted a dot, then nothing: no move, no up, no committed stroke. The next drag did nothing at all.
- **Root cause:** The desk called `element.setPointerCapture(e.pointerId)` on pointerdown, as it had since it was written. Capture is granted asynchronously and a browser may decline it — and when it declines, the element simply stops receiving `pointermove` and `pointerup`. No exception, no console warning, no `gotpointercapture`. Because `pointerup` never arrived, the `drawing` ref was never cleared, and the guard `if (drawing.current) return` at the top of pointerdown then blocked every subsequent stroke. One refused capture bricks the tool until reload. The old flat sheet had the same call and was one browser quirk away from the same failure.
- **Fix:** Dropped pointer capture. A gesture now registers `pointermove` / `pointerup` / `pointercancel` on `window` for its lifetime and tears them down on end. Same benefit capture was for — a stroke that runs off the edge of the layer keeps recording — with no silent-failure mode. Coordinates were already measured against the active layer's own box, so nothing about the mapping changed.
- **Guard:** In this repo, drag gestures track on `window` for the life of the gesture; `setPointerCapture` is not the mechanism. If it is ever reintroduced it must be treated as advisory — wrapped in try/catch, with the gesture still tracked on `window`, and the in-progress ref cleared on `lostpointercapture` as well as on up. Diagnosis habit worth keeping: when a pointer gesture dies after `down`, log `down`/`move`/`up`/`gotpointercapture` on the target before touching anything else — the absence of `gotpointercapture` names the cause in one step.

## 2026-10-16 — Overwrote untracked ISM day notes from a truncated listing

- **Mistake:** While extending `ideas/ism-inktober/`, three existing day notes (Vibeism, Inviteism, Onceism) were rewritten without being read first. Nothing was lost — the rewrite was a superset — but only because the earlier session's transcript still held the old text.
- **Root cause:** A directory listing piped through `head -40` cut off before the day files, so they looked absent. They were also untracked, so git could not restore them.
- **Fix:** Pulled the previous versions out of the earlier session transcript, diffed line by line, restored the one dropped detail (back-link to the series README).
- **Guard:** Never decide a file is missing from a truncated listing; list the exact folder before writing. Untracked notes in `ideas/` have no git safety net — read before overwrite, and commit `ideas/` notes in the same session they are filed.

## 2026-11-05 — A page under an overlay still answered the visitor's hand

- **Mistake:** While the first-visit loader covered the studio landing, the landing kept reacting to the visitor's pointer, on a page nobody could see.
  - Every move over the loader turned the hidden plate's eye and re-cut its ink pass.
  - A press on the loader's eye made the hidden eye blink.
  - A drag would have started its wet-paper simulation, which runs for 40 s.
- **Root cause:** `EyeEngine` listens on `window` (pointermove, pointerdown, pointerup). `inert` and `visibility: hidden` on the page's wrapper stop focus and hit-testing inside it. They do not stop listeners on `window`, so the loader's own events bubbled through to them. The tube loader before it had the same leak.
- **Fix:** The ink loader's pointer handlers call `stopPropagation()`. React's handlers run at the document root, so the native event never reaches `window`.
  - Measured on the production build: 15 ink passes over 2.5 s of sweeping the loader, which is the hidden eye's idle saccades only.
- **Guard:** An overlay that owns the screen stops its pointer events from bubbling. Before shipping a new overlay over the landing, sweep the pointer over it and compare `window.__burin.debug().ink` before and after.

## 2026-11-05 — The cloud container cannot prove a WebGL hand-off

- **Mistake (near-miss):** Hours went into a stall that appeared only after the loader's way in. Bisecting found it was the landing's WebGL blocking the main thread in native code under SwiftShader, not the loader.
  - Along the way, a production server left running on the test port served stale chunks against a fresh build, and one run read as a regression.
- **Root cause:** The container has no GPU. WebGL runs in SwiftShader and the headless shell composites in software.
  - The visible landing costs about 300 ms a frame there, and some reveal and teardown sequences block for minutes.
  - The original tube loader never reached its own eye in that container at all.
- **Fix:**
  - Loader logic was verified with `--disable-3d-apis` (the landing falls back to its poster) and on routes without the plate.
  - Timing was verified with WebGL on, up to the way in.
  - The hand-off onto the live plate is left for a hardware check.
- **Guard:**
  - In the cloud container, test overlay and loader logic with `--disable-3d-apis`.
  - Treat a stall that appears only with WebGL as unproven until it is seen on hardware (the founder's `burin-check`).
  - Before trusting a result from a local server, confirm which process owns the port: check `NEXT_DIST_DIR` in `/proc/<pid>/environ`, and restart it after every build.
