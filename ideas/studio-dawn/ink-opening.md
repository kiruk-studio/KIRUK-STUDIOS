---
status: built 2026-11-05 — kirukal, waiting on founder checkpoint
date: 2026-11-05
scope: apps/kiruk-studio first-visit loader (every route); packages/burin (`./hand`)
skills: kiruk-burin · kiruk-codex (read, not changed)
---

# The ink opening — a hand draws the eye, then it opens

The founder asked for a loading page with a complex, medieval-style eye, built from the eye work the studio already has. The preloader should draw the eye as if in ink, and then the loading animation should start.

The loader's own screen-reader line already said what it was for: _"A pen draws an eye on paper, then the eye opens."_ What actually ran was something else. 1970's tube formed a dithered eye on black. Then the live 3D eye came up in the 1981 one-bit look. Neither is a manuscript.

## What was built

- **The eye as strokes.** `packages/burin/src/subjects/eye/strokes.ts` is the third writing of the same eye. rig.ts has it in numbers. shader.ts cuts it as line fields on the GPU. This file lays it as strokes, in the order a hand makes them.
  - It uses the same curves as the plate, with tones decided per sample along each line instead of per pixel.
  - Redrawn the same day, after the founder's three reference engravings. A line is now a continuous hairline in the light and swells in the shade. The socket is one family of rings, the white's shade stays fixed to the face, and the caruncle sits at the inner corner. The pen's vocabulary and how each part is drawn: [ink-strokes.md](./ink-strokes.md).
  - At a desktop size (S 227) that is 1,785 strokes and about 153k samples, generated in about 0.2 s.
- **The pen.** `packages/burin/src/hand/ink.ts` lays the strokes on a 2D canvas at the hand's pace.
  - Chalk and contours go down steadily. Hatching is quick and eases off. Hair is flicked away.
  - Each frame lays only what the pen covered since the last one.
  - Fresh iron-gall ink goes down blue-black and a little swollen, then browns as it dries, because it oxidises. That is why old drawings are brown.
  - Every ribbon winds the same way round, so crossing lines never punch holes in each other.
- **The drawn eye, alive.** `packages/burin/src/hand/live.ts` lets the drawing move.
  - The white and the iris sit in one cache that reaches under the lids. The gaze moves it, and the lids clip it.
  - The upper lid's band, margin and lashes are cut again for each aperture while it blinks.
  - The skin never moves.
- **The loader.** It lives in `apps/kiruk-studio/src/components/ui/ink-loading-page.tsx` and `loader/ink/`.
  - The pen runs in a worker on OffscreenCanvas. The page booting underneath (on the landing, the burin engine compiling its shaders) can stall the main thread, but never a stroke.
  - Where OffscreenCanvas is missing, the same scene runs on the main thread, loaded only then.
  - A boot sheet painted before the app loads (`loader/ink/boot.ts`) is the same paper. The pen's first stroke lands on paper that was already there.

## The sequence

These times are for a desktop production build in the cloud container, measured from navigation.

| Time     | On the paper                                                                                                                                                                                                     | In the corner                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 0.2 s    | The visitor's sheet: Dawn Light, or Dawn Departs if they chose it on the landing.                                                                                                                                | —                                                                 |
| 1.5 s    | **I** The construction, in sanguine, in the plate's own order (① – ⑧): the axis and corners, the globe swung by compass with its parallels and meridians, the iris, the lids, the crease, the brow, the orbit.   | _i · construction_                                                |
| 2.9 s    | **II** The contours: the lash line, the lower lid, the crease, the limbus, the pupil. The chalk starts to give way.                                                                                              | _ii · contour_                                                    |
| 3.9 s    | **III** The hatching: the lid's band, the lower lid's pillow, the socket's rings, arcs on the white. The iris fibres sweep round like a clock hand.                                                              | _iii · hatching_                                                  |
| 4.8 s    | **IV** Cross-hatching where the form turns from the light, the face's shade on the white, the iris's limbal ring and collarette, vessels, the caruncle, then the lashes and the brow, flicked from head to tail. | _iv · cross-hatching_                                             |
| 5.7 s    | **V** The pupil, inked in a spiral round the kiruk star, which is scratched clear needle by needle. The cornea's window is cut last.                                                                             | _v · the plate_                                                   |
| 7.0 s    | **The loading animation.** The drawing wakes: its lids fall, then lift, catch and open like a waking eye.                                                                                                        | _v · the eye opens_ · then the way in, once ready                 |
| 8.8 s    | Awake. It follows the pointer, makes small saccades, and blinks.                                                                                                                                                 | _Click the eye · enter_ (phones: _Tap_, and a fingertip shows it) |
| on enter | On the landing, the drawing settles onto the plate's own eye, then the sheet lifts and it dissolves into the engraving. On other pages it simply fades.                                                          | —                                                                 |

The way-in hint waits until the page underneath is ready: loaded, its type set, and on the landing, its plate printed by the engine (or the engine given up for the poster). It waits at most 6 s after the eye wakes. While it waits, the corner reads _the ink dries_.

## Decisions taken (overturn at the checkpoint)

1. **The preloader is the drawing.** The loading animation is the eye waking and living until the page under it is ready.
2. **The eye is drawn open, not shut.** The spokes radiating round the pupil are the drawing's best moment, and the wake blinks it alive afterwards.
3. **A 2D canvas in a worker, not the GPU.** Nothing has to compile, it works without WebGL, and the shader compile underneath cannot interrupt it.
4. **The loader draws on the visitor's paper.** The inks follow the dawn: iron-gall and sanguine on Dawn Light, navy and blueprint on Dawn Departs.
5. **Colours are working values.** They are the dawn papers and inks (color.dawn.\*) and the engine's own sanguine and blueprint, as they look multiplied into the paper. They are not tokens, the same as the engine's constants.
6. **The construction fades as the ink comes.** It goes from full to the plate's faint 0.3, the way the plate's own construction leads and then gives way.
7. **About five seconds of drawing.** That is the plate's timeline at 1.12×. A press, a wheel, Enter or Space hurries the hand about nine times over. Enter, Space, a click or a tap on the eye goes in once it is awake. Reduced motion shows the finished drawing, still.
8. **The tube and the live 3D era eye are no longer used by the studio's loader.** Their files stay in the tree, unimported, until the founder decides.
9. **The loader keeps the visitor's hand to itself.** Its pointer events stop at the loader. The page underneath no longer turns its eye, blinks or wets its paper under a hand it cannot see (LEARNINGS, 2026-11-05).
10. **Black is crossed, not flooded.** One family of lines never merges into solid black. The darks come from a second family crossing it ([ink-strokes.md](./ink-strokes.md)).
11. **The white's shade belongs to the face.** The lids' shadow, the corners and the globe's far side are lines fixed to the face, crossing the globe's arcs. They do not travel with the gaze. The white is cut at the plica, so the caruncle stays in front of it.

## Verified

- `@kiruk/burin` and `@kiruk/studio` typecheck. `next build` passes.
  - The shared layout chunk went from 30.3 kB to 21.2 kB. Route sizes are unchanged.
  - The worker is its own 10 kB chunk, and it fetches the drawing chunk itself (28 kB at first, 36 kB redrawn).
- Production build, headless Chromium, no console errors in any of these:
  - The phases in order, with WebGL on.
  - A phone with touch: tap to enter.
  - Reduced motion.
  - A click that hurries the hand, then Enter to go in.
  - The new paper.
  - A resize mid-drawing.
  - `/work`.
  - A same-session refresh skips the loader.
- **Pen cost.** About 3 ms a frame on average in software raster, 15 ms at the brow and lashes' peak. That is in the worker, not on the page's thread. It was the same before and after the redrawing.
- **The redrawn eye in the loader** (production build): first stroke 1.5 s, wake 7.0 s, awake 8.8 s with WebGL on. A click and a tap go in, a same-session refresh skips the loader, reduced motion shows the still drawing, and the new paper with a hurried hand and Enter works. There are no console errors.
- **The hidden plate's ink passes** while the pointer swept the loader for 2.5 s: 15, which is idle saccades only.

## Not verified, and known

- **The hand-off onto the live GPU plate.** This container has no GPU. WebGL runs in SwiftShader, and once the loader leaves, the landing's WebGL stalls the page in native code. The original loader never reached its eye in this container at all. The way in was verified with 3D off (the landing shows its poster) and on routes without the plate. It needs a look on real hardware.
- **The hidden plate keeps rendering under the loader.** This was already true before this change. The landing's engine draws while hidden. It could pause until revealed, if the readiness check reads `__burin.ready` instead of the first printed frame.
- **The landing's plate is the older eye.** The redrawn eye settles onto a GPU plate that still has the vignette, the dashed light tones and the seam at the outer corner. The drawn eye no longer has the seam, because its rings wrap the corner.
- **The far ends of the gaze.** The white's shade no longer travels with the globe. Only the globe's own light does, and it is held light. The range is held to ±0.5 across and ±0.36 down.

## Open — founder

1. Is the pace right? It is about five seconds of drawing, then about two of waking.
2. Should the eye be drawn shut, with opening it as the loading animation, instead of drawn open and blinking awake?
3. The corner names the pass being drawn. Keep the words, or let the drawing speak alone?
4. Should the unused tube and 3D era eye be deleted from `apps/kiruk-studio`?
5. A returning visitor in a new session sees the whole drawing again. Should they get a shorter one?
6. Port the redrawn look (rings, held light, the face's shade on the white) to the GPU plate, so the landing's hand-off meets the same eye?
7. Is the shadow under the brow too heavy? Should the brow be bolder (the vintage eye) or more feathery (the anatomical plate)?
