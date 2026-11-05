# The light

**Modules:** `src/light/light.ts` (`lightFrom`, `toneOf`), `src/light/forms.ts`, `src/light/hatch.ts` (`hatch`, `contour`) · **Calculus:** bench 3 · **Checks:** `light.tied`, `light.follows:<form>`, `light.lit-clear:<form>`, `light.even:<form>`, `light.contour-weight`, `style.slope`, `style.no-cross`, `style.uneven` · **Ledger:** MA-5, MA-6, MA-9, MA-10

A plate declares one light. Every tone on it is computed from a form's surface normal under that light, and hatching is laid to give that tone: never painted, never guessed. The critic then proves the ink follows the tone.

## The calculation

| Quantity       | Formula                                                                             | Notes                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Light          | `l = (cos az·cos el, sin az·cos el, sin el)`                                        | azimuth on the page (0 from the right, 90 from below, 180 from the left); the default `UPPER_LEFT` is 225°, 45° (research 02 §11) |
| Tone           | `tone = 1 − [a + (1 − a)·max(0, n·l) + b·max(0, n·l_b)·(diffuse < 0.05 ? 1 : 0.3)]` | ambient a = 0.18; bounce b = 0.14 from about the opposite side, so the shadow's core sits at the terminator, not the rim          |
| Passes         | hatch where tone > 0.20; deepen at > 0.50 and > 0.74                                | the general shadow first, then deeper passes between its lines (Leonardo's order, research 01)                                    |
| Gap            | inside the manner's range; ISO minimum 0.7 mm between parallels                     | codex 0.55–1.25 mm, architect 0.5–1.1, engraver 0.4–0.9                                                                           |
| Contour weight | `contour(p, outline, { min, max })`: pressure × the light's weight on each tangent  | the shadow side heavier: `light.contour-weight` wants ≥ 1.15×                                                                     |
| Proof          | `ρ = Spearman(tone, ink per cell) ≥ 0.6`, cells sized to the form's area            | flat tones are judged as even tones instead (MA-9)                                                                                |

## The manners

| Style        | Rule      | Slope    | Gap (mm)  | Cross           | Reach (mm) |
| ------------ | --------- | -------- | --------- | --------------- | ---------- |
| codex        | one-slope | 45° (\\) | 0.55–1.25 | never           | 6          |
| construction | one-slope | −50°     | 0.7–1.6   | above tone 0.60 | 9          |
| cosmograph   | per-form  | 40°      | 0.6–1.2   | above tone 0.55 | 6          |
| architect    | per-form  | 90°      | 0.5–1.1   | above tone 0.72 | 30         |
| engraver     | per-form  | 30°      | 0.4–0.9   | above tone 0.60 | 40         |
| dawn-new     | one-slope | −45°     | 0.55–1.2  | above tone 0.70 | 7          |
| night        | one-slope | −45°     | 0.6–1.3   | never           | 8          |

`one-slope`: one hand, one slope everywhere; travel varies, the slope stays (01 §1). `per-form`: the direction turns with each surface, a different angle for each adjacent part (02 R9). The critic reads the rule from the style (MA-10).

## Driving it

- One light per plate: `createPlate({ light })`; never two. Say where it comes from in the colophon.
- Tone forms, not regions: `sphere`, `cylinder`, `plane`, `castShadow`, `customForm` give normals; `hatch(p, { form })` lays tone from them; `contour(p, form.outline, { form })` weights the outline by the light.
- Narrow bands (under about 4 mm) are shaded with lines that follow the band, never short hatch strokes, which read as leaves (MA-5). Hatch pieces on one line leave a gap, never an overlap (MA-6).
- Leave parts at line or construction: finish selectively (`create.selective`).

## What the numbers say on a sphere

On the calculus page's sphere, lit from 225° at 45°, tone climbs from 0 near the lit limb to about 0.73 just past the terminator and eases back toward the far limb, where the bounce lifts it; the ink laid along the same diameter follows it, and the critic reads ρ ≈ 0.95.

## Sources

- Research: `ideas/kiruk-codex/research/01-leonardo.md` (the order of tone), `02-plates-and-manuscripts.md` §11 (one light; per-surface direction R9), `03-modern-line.md` §2.1 (0.7 mm between parallels)
- Code: `src/light/`; tests `test/critic.test.ts` (lighting), `test/evals.test.ts` (E-4)
