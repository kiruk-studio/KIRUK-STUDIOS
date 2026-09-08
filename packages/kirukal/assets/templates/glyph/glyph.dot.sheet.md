# glyph.dot

|              |                                                         |
| ------------ | ------------------------------------------------------- |
| Family       | `glyph`                                                 |
| Canvas       | 512 × 512 units (1 unit = 1px at 1×)                    |
| Brush        | **6 units** — the swatch under the frame is this weight |
| Safe area    | 64 units inset                                          |
| Takes wanted | **3**                                                   |
| Render tier  | A                                                       |
| Used by      | Radio, Menu                                             |

## Draw 3 takes

Not 3 attempts at one perfect line — 3 honest draws of the
same mark. The variation between them is the material: it is what lets the system
synthesize a living line instead of stamping one copy everywhere.

Save as `glyph.dot.v01.svg`, `glyph.dot.v02.svg`, … in
`packages/kirukal/assets/source/glyph/`. **Append only** — a redraw is a new
`vNN`, never an overwrite, so the trail of how the mark evolved survives.

## Before you start

- Pure black on transparent. Import rewrites to `currentColor` so tokens drive the colour.
- Draw with the tablet, not a mouse — pressure and tilt are the whole point, and a
  mouse-drawn mark records a flat 0.5 pressure throughout.
- Stay inside the safe area unless the mark is deliberately meant to bleed.
- Do not hide or delete the guides layer. It is stripped automatically.

## Check it reads at the small end

Appears in: Radio, Menu.
Squint at it around 16px. If the character disappears at that size, simplify the
mark rather than thickening the line — the stroke weight is a fixed token and
will not thicken to rescue a busy shape.
