# Textual Scribble — grease pencil

> Governed by [`openspec/specs/pen-and-paper/spec.md`](../../../openspec/specs/pen-and-paper/spec.md).

reason: accessibility

## What the scribble would have been

It is not hypothetical — it exists on paper. Two photographs of one hand-drawn page:
the whole Blender 4.1 layout in pen, menu strip and tool column and properties panel
and timeline, with a Snoopy-ish character standing in the viewport.

In the first frame the character stands on a single flat line. In the second the
camera has been turned: that line has opened into a receding X across the floor,
a scribbled contact shadow has appeared under the feet, the little axis cross in
the corner has tumbled — and the character is still face-on, and every drawn panel
around the viewport is exactly where it was.

Three rules fall out of that, and they are the whole of `scene.ts`: a drawing
pinned to a plane turns with the world, a drawing that faces the camera keeps
facing it at its own depth, and interface is interface and never orbits.

## Why no physical sketch

The sketch is physical. The photographs were shared into a working session rather
than committed as files, and the agent that read them could see them but not write
them to disk. This file stands in until the two images land beside it.

## Next iteration

Drop the two photographs here as `sketch-01.jpg` and `sketch-02.jpg` (≤ 2 MB each;
originals in `.raw/`), then draw the landing scene itself — `chrome`, `backdrop`,
`ground-marks`, `subject`, `foreground` — with `pnpm dev` → "scribble".
