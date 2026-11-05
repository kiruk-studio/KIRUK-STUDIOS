# Scribble Manifest — grease pencil

> Append-only index of every scribble in this folder. Governed by
> [`openspec/specs/pen-and-paper/spec.md`](../../../openspec/specs/pen-and-paper/spec.md).
> Referenced by [`openspec/changes/grease-pencil-scene/proposal.md`](../../../openspec/changes/grease-pencil-scene/proposal.md).

| Date (ISO) | Filename      | Source  | Caption                                                                                                                        |
| ---------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-16 | sketch-01.jpg | paper   | Blender 4.1 layout drawn by hand — character on a flat ground line, camera at rest                                             |
| 2026-09-16 | sketch-02.jpg | paper   | Same drawing, camera turned: the ground line opens into a receding X, the character stays face-on, the interface has not moved |
| 2026-09-16 | textual.md    | textual | Placeholder standing in for the two photographs above until the image files are committed                                      |

## Rules

- Append-only. Do not edit prior rows.
- New iterations get a new filename (`sketch-03.jpg`, …).
- Image files must be ≤ 2 MB; high-res scans go in `.raw/` (gitignored).
- If you used `textual.md` instead of an image, record source = `textual` and caption the reason.
