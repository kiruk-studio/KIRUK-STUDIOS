# The paper

**Module:** `src/paper/paper.ts` (`createPaper`, `rasterPaper`) · **Checks:** `bleed.feather` (sizing), `bleed.time`, `type.contrast` · **Ledger:** MA-7, MA-25

The sheet is three fields over the plate: **tooth** (the relief a dry medium or a starving pen breaks on), **fibre** (the direction wet ink wicks along) and **absorbency** (how far it wicks). The paper is drawn as made; age appears only with `time` and a `timeReason`.

## The sheets

| Paper                          | Tone      | Tooth | Sizing | Source                                                                                                                                     |
| ------------------------------ | --------- | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| dawn-light                     | `#FADFA9` | 0.45  | 0.60   | TOKEN `color.dawn.light`: the old sheet, where the hand drew; laid ≈ 1 mm, chain ≈ 28 mm                                                   |
| dawn-departs                   | `#CCFFFF` | 0.22  | 0.88   | TOKEN `color.dawn.departs`: the new sheet, where the code draws; wove, crisp, no age                                                       |
| night                          | `#1D1C2D` | 0.40  | 0.80   | TOKEN `color.dawn.navy` as a sheet: the nightminds of `ideas/studio-dawn/dawn.md`; **founder decision pending** (`eye.md` open question 8) |
| rag, blue, prepared, cartridge |           |       |        | WORKING VALUE: historic grounds for the codex, cosmograph and construction manners                                                         |

The tokens' own rule: the dawn papers are for **paper-drawn surfaces only** (plates and their instruments), never app chrome. A page that shows a plate sets the plate on its sheet and keeps its own chrome on `color.bg`.

## The calculation

- **Tooth:** fractal noise at ≈ 0.15 mm, thresholded into peaks; one `feTurbulence` per sheet, never a filter per stroke (MA-7). A starved pen (load < 0.34) and every dry medium break on it.
- **Feathers:** `bleed × absorb × λ × fibre alignment`; on sized paper (sizing ≥ 0.6) at most 30 wisps per 100 mm, each ≤ 0.35 mm (median).
- **Dark sheets:** light ink screens onto the night sheet; the ink-only raster uses a flat paper tone, and ink is measured as departure from the paper's luminance, so the critic reads light-on-dark as ink (MA-25).
- **Time:** `time = 0` as made. Any age (halo, foxing, browning) needs `time > 0` and a `timeReason`; the plate refuses to build without one, and `bleed.time` opens a LOOK item.

## Sources

- Tokens: `color.dawn.light`, `color.dawn.departs`, `color.dawn.navy` (`packages/design-system/tokens/core.json`, `semantic.json`)
- Research: `ideas/studio-dawn/ink-bleed.md`, `ideas/studio-dawn/dawn.md`
- Code: `src/paper/paper.ts`; `src/critic/pixels.ts` (departure from the paper)
