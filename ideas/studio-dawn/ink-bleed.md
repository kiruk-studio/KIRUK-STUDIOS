# Ink bleed

## What the founder said

- Use **TSL** (three.js shading language) to make a screen bleed — not ink just overflowing, but something that looks like ink flow or water flow.
- It may look like watercolor that gets dispersed.
- When the ink scatters it does **not** affect the overall area — only the **nearby** area.
- This is worked on completely separately, only for this. Reference images will come; the shader recreates them.
- On top of the bleed, we show what we want to show.
- Light side earlier described as ink bleed + engineering, like Da Vinci notes.

## 2026-10-18 — founder

- The bleed looks blurred and **typewritten**, like an **old book** that was written and then had a pencil-stroke sketch added over it.
- The font must be curated, not "normal": it looks bled or blurred, like ink in an old style, typewriter-like — and it must stay **readable**.
- Reference: `references/ink-bleed-inkredible.webp` — one word at four stages: crisp, rough, bleed halo, smear.
- Specimen: [`protos/type-specimen/`](./protos/type-specimen/) — five faces × four stages, static SVG filters.

## Open

- Reference images → `references/` (gitignored).
- Where a bleed starts: pointer, a revealed element, a section edge, the horizon?
- How long it lives: dries and stays, fades, or keeps flowing?
- Fallback when WebGPU/WebGL is missing or reduced motion is on — the base layer must still read (plan §1, "two layers").
- First prototype goes in `protos/ink-bleed/`.
