# frame.box-tight

> Drawn separately from frame.box — a shrunk box reads wrong at button scale.

|              |                                                           |
| ------------ | --------------------------------------------------------- |
| Family       | `frame`                                                   |
| Canvas       | 384 × 384 units (1 unit = 1px at 1×)                      |
| Brush        | **4.5 units** — the swatch under the frame is this weight |
| Safe area    | 24 units inset                                            |
| Takes wanted | **4**                                                     |
| Render tier  | A                                                         |
| Used by      | Button, Badge, Tabs                                       |

## Draw 4 takes

Not 4 attempts at one perfect line — 4 honest draws of the
same mark. The variation between them is the material: it is what lets the system
synthesize a living line instead of stamping one copy everywhere.

Save as `frame.box-tight.v01.svg`, `frame.box-tight.v02.svg`, … in
`packages/kirukal/assets/source/frame/`. **Append only** — a redraw is a new
`vNN`, never an overwrite, so the trail of how the mark evolved survives.

## The one rule that breaks frames

**The line must leave the middle band at the same height on both ends.** If the
left end of the top edge exits at y=40 and the right end exits at y=52, the tiled
edge will visibly step when the frame is stretched. `assets:build` checks this
and fails with the exact pixel delta.

## Before you start

- Pure black on transparent. Import rewrites to `currentColor` so tokens drive the colour.
- Draw with the tablet, not a mouse — pressure and tilt are the whole point, and a
  mouse-drawn mark records a flat 0.5 pressure throughout.
- Stay inside the safe area unless the mark is deliberately meant to bleed.
- Do not hide or delete the guides layer. It is stripped automatically.

## Check it reads at the small end

Appears in: Button, Badge, Tabs.
Squint at it around 16px. If the character disappears at that size, simplify the
mark rather than thickening the line — the stroke weight is a fixed token and
will not thicken to rescue a busy shape.
