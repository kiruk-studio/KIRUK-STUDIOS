# `@kiruk/mai`, kiruk's ink engine

**மை (mai)** is Tamil for ink, and for the kohl that lines an eye. That's the studio's motif in the name of the engine that draws it.

mai turns intended geometry into a plate that looks generated and reads as a hand. A hand performs every line, a pen inks it on a sheet of paper, one declared light shades it, and its measurements are computed from the ink. Then mai proves the plate in numbers before anyone is asked to look at it.

- **Skills:**
  - [`/kiruk-mai`](../../.claude/commands/kiruk-mai.md) draws a plate.
  - [`/kiruk-mai-proof`](../../.claude/commands/kiruk-mai-proof.md) curates and checks one.
  - [`/kiruk-mai-style`](../../.claude/commands/kiruk-mai-style.md) turns a reference into a measured style.
- **References:**
  - [`docs/anomalies.md`](docs/anomalies.md) is the 17 anomalies and how to read a fake at 4×.
  - [`docs/styles.md`](docs/styles.md) is the six manners as numbers.
  - [`docs/checks.md`](docs/checks.md) is what the critic checks and why.
  - [`docs/ledger.md`](docs/ledger.md) records misses and their guards.
- **Specimen:** [`specimens/anomalies/plate.png`](specimens/anomalies/plate.png). **First plate:** [`ideas/kiruk-codex/plates/plate-03-volute/`](../../ideas/kiruk-codex/plates/plate-03-volute/NOTES.md).

## Why another engine

`@kiruk/kirukal` replays the founder's captured pen strokes for UI marks. `@kiruk/burin` engraves the eye on the GPU. Neither can draw an illustration: a construction study, a measured capital, a lit form hatched by a left hand, with labels that tell the truth. mai is the vector engine for those plates. It runs on the server, it is deterministic, and it has no dependencies. It speaks the same studio language: Dawn Light and Dawn Departs, iron-gall and navy, sanguine and blueprint, and the rubric line.

## The pipeline

```
path (what the line means, mm)
  → hand.perform    power-law speed, tremor in time, drift, landing hook, tail, lifts at reach
  → nib.footprint   width from pressure, direction (broad edge) and speed
  → ink.inkStroke   reservoir and dip rhythm; pools and rims; starve and rails; feathers along
                    fibres; catches and spatter; the ruler's crisp side; blind grooves
  → plate           layers, light, forms, truth table, constructions, texts → SVG (mm)
  → critic          lighting · measurement · style · connections · typography · bleed · layout · creativity
  → node/proof      Chromium raster, pixel facts, phone view, 4× crops, report.md
```

| Module     | Holds                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `core/`    | Seeded rng with forks per mark, gradient noise, mm paths, SVG numbers, colour                                            |
| `paper/`   | Tooth, fibre and absorbency fields; six papers (Dawn Light and Dawn Departs are tokens); a raster under a raking light   |
| `hand/`    | The motor model, roles and hands (left for the codex)                                                                    |
| `nib/`     | 11 instruments: quill, reed, steel, broad edge, brush, graphite, chalk, silverpoint, stylus, burin, ruling pen           |
| `ink/`     | 11 inks (iron-gall, navy and rubric are tokens; the rest are working values) and the anomaly renderer                    |
| `light/`   | One light (upper left, 45°), forms (sphere, cylinder, plane, cast shadow, custom), `hatch()`, `contour()`                |
| `measure/` | `ruled`, `compass`, `point`, `dimension` (measured, never typed), `scaleBar`, `leader`, the volute, the golden rectangle |
| `letter/`  | Single-stroke lettering by the same hand (Hershey subset, ISO 3098 sizes) and typeset notes (selectable)                 |
| `styles/`  | `codex`, `construction`, `cosmograph`, `architect`, `engraver`, `dawn-new`, plus `restyle()`                             |
| `critic/`  | `critique()`, `pixelFacts()`, `reportMarkdown()`                                                                         |
| `node/`    | `bakePlate`, `cropPlate`, `proofPlate`, the PNG encoder, Chromium rasterising (Node only)                                |

## Quick start

```ts
import {
  createPlate,
  sphere,
  hatch,
  contour,
  dimension,
  scaleBar,
  letter,
  typeset,
} from '@kiruk/mai';

const p = createPlate({
  id: 'plate-04-globe',
  title: 'Plate IV — The lit globe',
  claim:
    'A globe lit from the upper left keeps its darkest tone on the terminator, not on the rim.',
  size: [200, 150],
  style: 'codex',
  eye: { motif: 'drawn', ref: 'the globe of the eye, lit as an eye is lit' },
  device: 'side-by-side comparison of the lit globe and its section',
  views: 2,
  scale: { unit: 'mm', perMm: 1 },
});
const g = sphere('globe', [70, 75], 30);
hatch(p, { form: g }); // tone from the one light; left-hand slope
contour(p, g.outline, { id: 'globe-outline', form: 'globe' }); // heavy away from the light
dimension(p, [40, 75], [100, 75], { offset: -38 }); // the value is measured: "60 mm"
scaleBar(p, [20, 135], { units: 50 });
```

To proof it:

```bash
node packages/mai/scripts/proof.ts packages/mai/plates/globe.ts ideas/kiruk-codex/plates/plate-04-globe/proof --commit
```

## Laws

These are enforced in code, by the critic, or by tests.

1. **Deterministic.** Every mark draws from its own rng, forked from the plate seed by its id. Adding a stroke never re-rolls its neighbours (kirukal law 5).
2. **Millimetres on the sheet.** Widths, tremor and bleed are physical. The sheet scales as one object, the way a scan does (kirukal laws 3–4).
3. **The act, not time.** The anomalies of drawing are always on. Age needs `time` and a `timeReason`, or the plate refuses to build.
4. **One light, declared.** Tone is computed, never painted. The critic proves ρ(tone, ink).
5. **Measured, never typed.** `dimension()` computes its value from the ink at the plate's scale. The critic re-measures anything you override.
6. **Construction must generate.** `plate.generated(constructionId, ...ids)`. An orphan is ornament, and the critic fails it.
7. **The overlay is exact.** The rubric line never wobbles (research 03 R3). The drawing keeps the hand.
8. **One feTurbulence per sheet.** Grain lives in the paper's tooth, never in a filter per stroke (kirukal law 2).
9. **No token without a spec.** Ink and paper colours that are tokens cite `color.dawn.*`. Everything else is marked WORKING VALUE, and promoting one needs a design-tokens proposal.

## Commands

From the repo root:

- `node packages/mai/scripts/proof.ts <plate.ts> [out] [--px 5] [--strict] [--commit]`
- `node packages/mai/scripts/specimen.ts`
- `pnpm --filter @kiruk/mai test`
- `pnpm --filter @kiruk/mai check-types`

Proofs need Chromium with Playwright. A kiruk cloud session has it preinstalled; elsewhere, run `npm i -g playwright && npx playwright install chromium`.

## Credits

Single-stroke lettering uses a subset of the Hershey fonts. The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the U. S. National Bureau of Standards. The format of the font data was originally created by James Hurt, Cognition, Inc. The JSON conversion is hersheytext (MIT, © 2014 James T). See `src/letter/hershey-data.ts`.
