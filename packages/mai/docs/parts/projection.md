# Projection

**Module:** `src/measure/projection.ts` (`camera`, `project`, `circle3d`, `runs`, `wireSphere`) · **Checks:** `line.hidden`, `connect.axes-named`, `type.near` · **Plate:** IV (the three axes of the eye)

Solids drawn orthographically on the sheet, with the conventions that make space readable on paper: what is behind is dashed, axes are chain lines named at both ends, a small circular arrow says which way an axis turns, and a dot marks where an axis pierces the surface.

## The calculation

| Quantity   | Formula                                                                     | Notes                                                                                  |
| ---------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| World      | x right, y up, z toward the viewer (right-handed)                           |                                                                                        |
| Camera     | `R = Rz(roll)·Rx(pitch)·Ry(yaw)`, degrees                                   | `camera({ center, scale, yaw, pitch, roll })`; scale is sheet mm per world unit        |
| Project    | `q = R·p`; sheet `(cx + qx·s, cy − qy·s)`; depth `qz`                       | orthographic: the silhouette of a sphere is a circle of radius R·s                     |
| Circle     | `c + r·(cos t·u + sin t·v)`, u ⟂ n, v = n × u                               | `circle3d(cam, c, n, r)` samples a circle in space with its depth                      |
| Visibility | a sample is in front when `z − z_centre ≥ 0`                                | `runs(pts, visible)` splits a curve into runs of one visibility, sharing the end point |
| Axis       | from `−(R + ext)` to `R + ext` along the direction                          | inside: a fine solid line; outside: chain, dashed where the globe hides it             |
| Labels     | `A` and `A′` one cap height past each end, along the axis                   | where the axis leaves the figure                                                       |
| Turn       | a circle of 0.16 R round the axis at `R + 0.55·ext`, 84% drawn, with a head | `turn: 1` or `−1` says which way                                                       |

## Driving it

- `wireSphere(p, { id, cam, radius, circles: [{ id, n }], axes: [{ id, dir, labels, extend, turn }] })`; every great circle comes out front solid, back dashed and `hidden`.
- Run an axis far enough that its labels clear the globe (Plate IV's B axis needed `extend` 2.2 before its labels left the sphere).
- An angle in a foreshortened view is not readable: measure it in a view where its plane is true size (Plate IV measures the 30° turn in plan).
- Construct the ellipses: an ellipse of a great circle is built on its major and minor axes, recorded with `p.generated(axisId, ...markIds)`.

## Sources

- Reference: the founder's axis-sphere image (white on black, axes A–A′, B–B′, C–C′); not committed (another artist's work)
- Code: `src/measure/projection.ts`; `plates/axes.ts`; tests `test/outer.test.ts` (a wire sphere dashes what is behind and names its axes outside the globe)
