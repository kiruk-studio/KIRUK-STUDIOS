---
status: drawn 2026-11-05 by mai — critic WARN (0 fail, 2 warn); founder has not reviewed
plate: III
engine: packages/mai (style architect, restyled to iron-gall on Dawn Light)
source: packages/mai/plates/volute.ts
eye-motif: drawn — the oculus of the Ionic volute, the eye the scroll is struck from
---

# Plate III — The eye of the volute

![Plate III](proof/plate.png)

**Claim.** A volute is twelve quarter-circles struck from twelve centres inside its eye. Each centre lies on the last arc's end radius, so the scroll turns without a corner.

**Why this subject.** The founder shared a Corinthian column, Leonardo's eye studies and three construction sheets, and asked for an engine that handles historic design in every detail. Architecture already has an eye: the Ionic volute is struck from its oculus. This plate puts kiruk's motif inside a historic construction instead of on top of one.

## What is drawn

- **Fig. 1, the capital at 1:4, in two halves.**
  - **The right half is finished** in iron-gall on Dawn Light:
    - the abacus and its narrow cast shadow;
    - the canalis, running across the capital and winding into the scroll, shaded with lines that follow the channel;
    - the fillet, struck from the same centres pulled toward the eye, so it narrows to nothing;
    - the echinus with egg-and-dart;
    - the astragal, and the fluted shaft behind the scroll, hidden where the scroll stands in front.
  - **The left half is construction only**, so the process shows: the axis, the mirrored eye and cathetus, the abacus, the canalis and the flutes.
- **Fig. 2, the eye at ×6.** The twelve centres are pricked and numbered in the order they are struck, on their shrinking squares, with the last arcs closing on the eye.
- **Measures:**
  - the volute height, **250 mm** at 1:4, measured from the drawn spiral;
  - the eye, **Ø 32 mm**, measured in Fig. 2 at its own scale;
  - a scale bar from 0 to 200 mm at 1:4.

## Truth (from `proof/report.json` and the plate's facts)

| Fact          | Value                                    | Source                                                           |
| ------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Volute height | 250 mm at 1:4                            | Measured from the drawn spiral                                   |
| Eye           | Ø 32 mm at 1:4                           | Eye radius 4 mm on the sheet                                     |
| Centres       | 12, steps 12:11:…:1 on shrinking squares | This plate's own construction                                    |
| Largest kink  | ≈ 0° at every join                       | Measured from the arcs (each centre lies on the last end radius) |

**Not claimed.** These proportions are this plate's construction, not Vitruvius', Vignola's or Palladio's. The research files hold no treatise numbers for the volute, so none are quoted. A treatise construction can replace this one once its numbers are read from the source.

## Critic (2026-11-05)

`node packages/mai/scripts/proof.ts packages/mai/plates/volute.ts ideas/kiruk-codex/plates/plate-03-volute/proof --px 4 --commit`

The result is 56 checks, **0 fail, 2 warn, 1 look**. The full report is in [`proof/report.md`](proof/report.md).

- **WARN `type.phone`:** the plate is shown at 1.39 px/mm on a 390 px phone, so every label falls under 11 px. A landscape plate needs a phone layout (labels outside on leaders, or a crop per figure). This is open.
- **WARN `layout.rise`:** the ink centroid sits at 53% of the height, against a 52% target. The shaft carries weight low. It is kept, because the column must stand on the sheet; lightening the shaft tone further flattened it.
- **LOOK `create.founder`:** below.

Fixed on the way, recorded in `packages/mai/docs/ledger.md`:

- MA-5: the canalis was first hatched with short strokes that read as leaves, and the critic passed it.
- MA-6: the shaft's joined hatch pieces read as bamboo.
- MA-8: pens ran dry 2.5× too fast.
- MA-9 and MA-10: the critic's own false fails.

## Questions for the founder

1. Does the right-finished, left-constructed split read as the process, or as unfinished?
2. Should the eye of the volute become a studio mark study, next to the logogram?
3. Should plate notes stay in IM Fell (typeset, selectable), or be drawn by the hand (mai lettering, with a selectable twin)?
4. Phone: crop to the volute alone at phone widths, or keep the sheet and move the labels out?
