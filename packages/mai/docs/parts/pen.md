# The pen

**Modules:** `src/nib/instruments.ts` (`footprint`), `src/ink/inks.ts`, `src/ink/render.ts` (`inkStroke`) · **Calculus:** bench 2 · **Checks:** `style.width`, `style.dip-pools`, `style.starved`, `bleed.*`, `type.blots`, `style.overlay-crisp` · **Ledger:** MA-1, MA-3, MA-4, MA-6, MA-7, MA-8, MA-16, MA-26

The pen turns a performed stroke into ink on paper: a width from the nib, a load from the reservoir, and the anomalies of the act (pools, rims, starve, rails, feathers, catches, spatter). Each anomaly, its cause, its knob and the range that reads as a hand are in [`../anomalies.md`](../anomalies.md). This page holds the calculation behind them.

## The calculation

| Quantity      | Formula                                                                     | Notes                                                                                    |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --- | ------------------------------------------------------- |
| Footprint     | `w = w0 + (w1 − w0)·p^γ`                                                    | pressure p from the hand; γ per instrument                                               |
| Broad edge    | `w ← w·(1 − e + e·(0.12 + 0.88·                                             | sin(θ − φ)                                                                               | ))` | full width across the edge angle φ, a hairline along it |
| Speed spread  | `w ← w·(1 + spread·(clamp((60/v)^0.25, 0.6, 1.6) − 1))`                     | a slow pen spreads                                                                       |
| Lift to point | `w ← w·smoothstep(p / 0.14)`                                                | a lifting pen goes to a point, whatever the nib's rest width                             |
| Reservoir     | `R ← R − (f/C)·(w/0.4)·Δs`                                                  | C: mm of a 0.4 mm line per dip; f: the ink's flow (MA-8: divided by 0.4 once, not twice) |
| Load          | `λ = R^0.55·(1 + 0.22·slow) − 0.1·fast`                                     | slow = clamp((45 − v)/45), fast = clamp((v − 160)/160)                                   |
| Width by load | `w ← w·(0.84 + 0.24·λ)`                                                     | a loaded pen lays a fuller line                                                          |
| Density       | `D = D_ink·(0.6 + 0.4·λ̄^0.8)·layer`                                         | the dip rhythm: dark after a dip, paler as the pen drains                                |
| Dip           | dip when `R < r`, r ∈ [0.10, 0.26], or when the stroke would end below 0.04 | then `R ∈ [0.9, 1]`                                                                      |
| Dip pool      | `r = (w/2)·(1.05 + 1.15·P·√(rest/0.12))·(0.75 + 0.35·λ)`                    | about half of dips rest; capped at 0.95 mm, and at 0.7 × the line on a letter (MA-16)    |
| Stop pool     | `r = (w/2)·(1.0 + 0.9·P·√(dwell/0.12))·(0.7 + 0.4·λ)`                       | capped at 0.85 mm (0.7 × the line on a letter)                                           |
| Exact         | `λ = 1`, no dip, no thinning, the reservoir untouched                       | the overlay's technical pen feeds steadily (MA-26)                                       |

## The instruments

| Instrument  | Kind   | Width (mm) | Capacity (mm of a 0.4 mm line per dip) |
| ----------- | ------ | ---------- | -------------------------------------- |
| quill       | pen    | 0.10–0.72  | 240                                    |
| reed        | pen    | 0.32–1.25  | 170                                    |
| steel       | pen    | 0.07–1.05  | 150                                    |
| broad       | pen    | 0.10–0.95  | 170                                    |
| brush       | brush  | 0.15–3.00  | 900                                    |
| ruling      | ruling | 0.20–0.30  | 320 (an exact line feeds steadily)     |
| graphite    | dry    | 0.15–0.50  | —                                      |
| chalk       | dry    | 0.45–1.50  | —                                      |
| silverpoint | dry    | 0.11–0.20  | —                                      |
| stylus      | stylus | 0.12–0.24  | — (blind: a groove seen by its walls)  |
| burin       | burin  | 0.02–0.60  | — (swells and tapers by depth)         |

## The inks

| Ink                                               | Colour    | Density | Flow | Blend    | Source                                                            |
| ------------------------------------------------- | --------- | ------- | ---- | -------- | ----------------------------------------------------------------- |
| iron-gall                                         | `#231A14` | 0.93    | 1.00 | multiply | TOKEN `color.dawn.iron-gall`, the old sheet's ink                 |
| navy                                              | `#1D1C2D` | 0.94    | 0.95 | multiply | TOKEN `color.dawn.navy`, the new sheet's ink                      |
| rubric                                            | `#B5462B` | 0.90    | 0.90 | multiply | TOKEN `color.dawn.rubric-line`: rules only; `typeInk` rubric-type |
| rubric-type                                       | `#983A22` | 0.94    | 0.90 | multiply | TOKEN `color.dawn.rubric`: type that measures and numbers         |
| departs                                           | `#CCFFFF` | 0.90    | 1.00 | screen   | TOKEN `color.dawn.departs` as ink, on the night sheet             |
| sepia, bistre, carbon, white                      |           |         |      |          | WORKING VALUE (promotion needs a design-tokens proposal)          |
| sanguine, blueprint, graphite, silverpoint, chalk |           |         |      | dry      | WORKING VALUE                                                     |

## Driving it

- Pick the instrument and ink through the style's kit (`restyle(STYLES.x, { ink, paper })`); override per stroke only with a reason.
- Never hand-tune an anomaly to taste. Change the cause: instrument, ink, paper, pressure, pace. A faked anomaly breaks the critic's reading of it.
- A value is type: letter it with `valueInk(plate, role)`, which takes the ink's type twin (`typeInk`). The rubric line is never text (`type.value-ink`, MA-17).

## What the critic reads

`style.width` (width CV), `style.dip-pools` (10–80% of dipped strokes pool), `style.starved` (≤ 22% of the ink starved in the codex style), `bleed.feather`, `bleed.local`, `bleed.varies`, `bleed.dry-media`, `bleed.pools`, `type.blots` (a blot on a letter ≤ 0.32 × its cap), `style.overlay-crisp` (the overlay drawn exact).

## Sources

- Research: `ideas/kiruk-codex/research/01-leonardo.md` §1–§3, `ideas/studio-dawn/ink-bleed.md`
- Tokens: `packages/design-system/tokens/core.json` (`color.dawn.*`)
- Code: `src/nib/instruments.ts`, `src/ink/inks.ts`, `src/ink/render.ts`; tests `test/engine.test.ts`, `test/outer.test.ts` (MA-16, MA-17, MA-26)
