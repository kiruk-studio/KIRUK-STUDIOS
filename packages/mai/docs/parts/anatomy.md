# Anatomy

**Modules:** `src/plate/plate.ts` (`Plate.part`, `PartRecord`, `Plate.fact`), `src/critic/critic.ts` (`create.anatomy`, `Report.anatomy`) · **Checks:** `create.anatomy` · **Ledger:** MA-15

The subject listed part by part before it is drawn, and each part checked on its own after. A plate that passes as a whole can still have a part nobody inked, a key with no note, or a dimension that was planned and never drawn. The anatomy table turns the order of work into something the critic can read: every part says how far it is finished, what made it, what measures it and which note names it.

## The order of work

From `ideas/kiruk-codex/plan.md` ("size, truth, invent the object, list the parts… verify"), spelt out for mai:

| #   | Step            | mai                                                                            |
| --- | --------------- | ------------------------------------------------------------------------------ |
| 1   | Size            | `PlateSpec.size`, `margins`, `scale` (see [`layout.md`](layout.md))            |
| 2   | Truth           | `p.fact(key, value, source)` for every number the plate will draw              |
| 3   | The object      | `claim`, `device`, `views`, `eye` in the spec                                  |
| 4   | List the parts  | `p.part({ … })` for each part, before any path                                 |
| 5   | Construct       | `ruled`, `compass`, `point`, with `generates`                                  |
| 6   | Search          | `role: 'searching'` and `'underdrawing'`                                       |
| 7   | Ink             | `contour(…)`, finished outlines                                                |
| 8   | Tone            | `hatch(p, { form })` on the parts declared `tone` (see [`light.md`](light.md)) |
| 9   | Letter          | keys, notes (see [`letter.md`](letter.md))                                     |
| 10  | Measure inside  | `dimension`, `scaleBar` (see [`measure.md`](measure.md))                       |
| 11  | Measure outside | `extents`, `chainDims`, `neatline`, `angleDim` (see [`outer.md`](outer.md))    |
| 12  | Overlay         | the exact layer: rubric rules, leaders                                         |
| 13  | Verify          | `scripts/proof.ts` and the 4× crops (see [`critic.md`](critic.md))             |

## The calculation

| Quantity       | Rule                                                                                                                                                                   | Notes                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Record         | `PartRecord { id, name, key?, finish: 'construction' \| 'line' \| 'tone', form?, measured?: string[] \| { none: reason }, generatedBy?: string[] }`                    | `measured` lists dimension or angle ids; `generatedBy` construction ids |
| A part's marks | marks whose `part`, `group` or `id` equals the part id, whose id starts `<id>-` or `<id>.`, or whose `form` is the part's `form`                                       | name strokes and groups after their part, or pass `part`                |
| Inked          | any of its marks on the `ink` or `letter` layer                                                                                                                        |                                                                         |
| Issues         | nothing drawn · not inked (`line`, `tone`) · inked, but declared construction · toned without a form · no tone laid on the form (no hatch or stipple with that `form`) |                                                                         |
|                | key not on the drawing (no `kind: 'key'` text equal to the key) · no note for the key (no note or caption starting "`<key> `")                                         |                                                                         |
|                | measure `<id>` missing (in neither `plate.dimensions` nor `plate.angles`; MA-15) · unmeasured without a reason (`none` of fewer than 3 words) · construction missing   |                                                                         |
| Verdict        | no parts → warn; any part with an issue → fail; else pass                                                                                                              | the report ends with an "## Anatomy" table, one row per part            |

## Driving it

- Call `p.part({ id, name, key, finish, form, measured, generatedBy })` for every part before drawing it. Why: listing the parts first decides how far each will be finished; finishing selectively (some parts left at line or construction) is a codex rule, and the table makes it a declaration the critic holds the plate to.
- Give every stroke of a part an id or group that starts with the part's id, or pass `part: id`. Why: a part whose marks the critic cannot find reports "nothing drawn".
- A `tone` part names its `form`, and the hatching is laid on that form. Why: tone is computed from one light over a form (see [`light.md`](light.md)); a toned part without a form has nothing to shade.
- A keyed part needs its key lettered (`kind: 'key'`) and a note that starts with the key and a space ("A the eye…"). Why: a key is a promise of an explanation; a key with no note explains nothing.
- Measure a part, or say in at least three words why it is not measured: `measured: { none: 'broken, and a broken shaft is not dimensioned to its break (ISO 129)' }`. Why: an unmeasured part is a choice the reader deserves to see, and a one-word excuse is not a reason.
- List the constructions that generated a part in `generatedBy`, by their construction ids. Why: geometry that generated nothing is ornament (`connect.generative`), and a part that claims a construction must point at one that exists.
- At most 7 keyed parts. Why: research 03 R12; `type.keys` counts the names.

## Examples

- Plate III (the volute, `plates/volute.ts`): 9 parts. The abacus, the scroll and the eye are `line`; the canalis, the echinus and the shaft are `tone`; the cathetus stays `construction`. Keys A–D name the eye, the cathetus, the fillet and the egg and dart. The shaft is unmeasured with its reason: it is broken.
- Plate IV (the axes, `plates/axes.ts`): 8 parts: the globe, the cornea, the planes, the three axes, the sweep and the plan.

## What the critic reads

- `create.anatomy`: every part drawn, keyed and noted, finished and measured as declared. The value names the first issue of up to four incomplete parts; the fix is `plate.part({ … })` for each part.
- `Report.anatomy`: one `AnatomyRow { id, name, finish, ok, issues }` per part, printed in `report.md` as the "Anatomy" table.

## Sources

- Plan: `ideas/kiruk-codex/plan.md` (the anatomy method: size, truth, the object, its parts, verify)
- Research: `ideas/kiruk-codex/research/01-leonardo.md` §5 (ornamental geometry), `03-modern-line.md` R12
- Code: `src/plate/plate.ts` (`PartRecord`, `part`), `src/critic/critic.ts` (`create.anatomy`); plates `plates/volute.ts` §9, `plates/axes.ts`; tests `test/outer.test.ts` (MA-15)
- Ledger: MA-15 in [`../ledger.md`](../ledger.md)
