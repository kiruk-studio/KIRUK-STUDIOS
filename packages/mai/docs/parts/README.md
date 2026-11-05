# The parts of mai

One reference per part of the engine, in the order a stroke passes through them. Each says what the part models, the calculation (with the numbers the code uses), how to drive it, what the critic reads, and the misses that shaped it. The skills route here; load a part only when the plate needs it.

The [calculus page](../../calculus/template.html) runs five of these parts live: change a control and the engine redraws its specimen while charting its own per-sample numbers. Build it with `pnpm --filter @kiruk/mai calculus`. The page follows the method of the founder’s reference, [the Calculus of Interfaces](https://calculus-of-interfaces.vercel.app/): the plate read as one function of its spec and seed, its decisions shown as steps, its limits stated.

| #   | Part                           | Module                             | What it decides                                                     | Calculus bench |
| --- | ------------------------------ | ---------------------------------- | ------------------------------------------------------------------- | -------------- |
| 1   | [The hand](hand.md)            | `src/hand/hand.ts`                 | speed, tremor, drift, landing, lifts, pressure                      | 1              |
| 2   | [The pen](pen.md)              | `src/nib/`, `src/ink/`             | width, the reservoir and dip rhythm, pools, starve, feathers        | 2              |
| 3   | [The paper](paper.md)          | `src/paper/paper.ts`               | tooth, sizing, fibre, the three studio sheets, time                 |                |
| 4   | [The light](light.md)          | `src/light/`                       | tone from one light, hatching passes, contour weight                | 3              |
| 5   | [Line types](line-types.md)    | `src/plate/linetype.ts`            | what a line's pattern says; fitted dashes; hidden lines             | 5              |
| 6   | [Projection](projection.md)    | `src/measure/projection.ts`        | solids on the sheet; hidden circles; axes named at both ends        |                |
| 7   | [Measure](measure.md)          | `src/measure/measure.ts`           | values from the ink; extension lines; tiers; the value's ink        | 4              |
| 8   | [Outer measurement](outer.md)  | `src/measure/outer.ts`             | overall size, chains, neatlines, angles, sweeps, UI redlines        | 4              |
| 9   | [Letter and labels](letter.md) | `src/letter/`                      | ISO 3098 lettering, glyphs, markup, labels in clear paper, contrast |                |
| 10  | [Layout](layout.md)            | `src/plate/plate.ts`, the critic   | margins, the split, the weight, white, the phone                    |                |
| 11  | [Anatomy](anatomy.md)          | `Plate.part`, `create.anatomy`     | the subject listed part by part, each checked on its own            |                |
| 12  | [The critic](critic.md)        | `src/critic/`, `src/node/proof.ts` | how a plate is proved in numbers, and how to read the report        | 6              |

The full check list is in [`../checks.md`](../checks.md); every miss and its guard is in [`../ledger.md`](../ledger.md).
