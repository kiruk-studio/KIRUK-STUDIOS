---
description: Draw an illustration plate with mai, kiruk's ink engine. The plate must look generated and read as a hand, with true lighting, measured dimensions, connected lines, clear lettering and honest ink anomalies. Use for any studio plate, codex figure, construction study, measured drawing or engraving-style illustration, or when someone asks for human-like strokes, ink bleed, hatching, or a Leonardo, architectural or engraved look.
argument-hint: <what the plate explains, in one sentence> [style: codex | construction | cosmograph | architect | engraver | dawn-new | night]
---

# /kiruk-mai: draw a plate

**Engine:** `packages/mai`. Read [`packages/mai/README.md`](../../packages/mai/README.md) first. Depth is in the parts pages ([index](../../packages/mai/docs/parts/README.md)); each step below names the one to load, and you load it only when you reach that step. Numbers cite `ideas/kiruk-codex/research/01–03` (01 §n / 02 Rn / 03 Rn). If the local `kiruk-codex`, `kiruk-sheet`, `kiruk-rule` or `kiruk-stroke` skills are present, their founder rules win on composition; this skill wins on how mai is driven.

**Argument:** `$ARGUMENTS` = the claim and, optionally, a style. If there is no claim, ask for one sentence and stop. Never invent the subject.

## The one idea

The geometry is generated, a hand performs it, a pen inks it on a sheet, one light shades it, the measurements come from the ink, the critic proves it, and the founder judges it. Every visible quirk must be caused by an act: a hand, a pen, ink, paper, or light. A quirk with no cause is costume. A missing quirk is plotter.

## The procedure (in this order; 01 R15, 02 R3)

The order is the anatomy of the work ([anatomy](../../packages/mai/docs/parts/anatomy.md)). Each step only reads what the steps before it made, so skipping ahead means measuring ink that is not there yet or toning a part nobody listed.

### Decide (write these down before any stroke)

1. **Size.** Sheet in mm, margins 12–16 mm, split 61.8 / 38.2 (subject zone, then notes, enlargement and scale). The subject goes in first and largest; commentary never covers it (02 R2). → [layout](../../packages/mai/docs/parts/layout.md)
   _Why:_ `layout.margins`, `layout.rise` (centroid ≤ 52% of the height) and `layout.balance` are read off the finished sheet; a size decided late means moving finished ink (MA-21).
2. **Truth.** One claim of at least 6 words in `PlateSpec.claim`. Every number on the sheet gets `p.fact(key, value, source, unit)`; a value you cannot source is left off, with `[TBD]` in the notes.
   _Why:_ the plate explains; an unsourced number is the one thing that makes it lie.
3. **The object.**
   - **Device** (01 R4): interior → section · joints → exploded view · build → build-up · motion → phase series · difference → side-by-side at one scale · forces → thread diagram · a method → construction. Never "one pretty 3/4 view with arrows" (01 §5).
   - **Views:** at least 2 (01 R3); a labelled enlargement counts (02 R13).
   - **Style:** pick from [`docs/styles.md`](../../packages/mai/docs/styles.md) and say why in one line. On Dawn Light the ink is iron-gall (`restyle(STYLES.x, { ink: 'iron-gall', paper: 'dawn-light' })`); on Dawn Departs it is navy (`dawn-new`); `night` is light ink on the navy sheet (founder decision pending — say so in NOTES).
   - **Eye motif** (non-negotiable 4): `eye: { motif: 'drawn', ref }` with a real reference, or `{ motif: 'none', justification }`.
   - **Light:** one, default `UPPER_LEFT` (45°, 02 §11). Never two. → [light](../../packages/mai/docs/parts/light.md)
4. **List the parts.** One `p.part({ id, name, key?, finish, form?, measured?, generatedBy? })` per part of the subject, at most 7 keyed (03 R12). Decide each part's finish now (`construction`, `line` or `tone`) and leave some at line or construction.
   _Why:_ `create.anatomy` checks every listed part is drawn, inked, toned, keyed, noted and measured as declared (eval E-3); a part not listed is a part nobody checks. Selective finish is how a plate shows its process.

### Draw

| #   | Step            | mai calls                                                                                                           | Rules with numbers                                                                                                                                                                                                                                                                                                               | Part page                                                                                              |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 5   | Construct       | `ruled(p, a, b)`, `compass(p, c, r)`, `point(p, q, { style: 'prick', label })`, `voluteGeometry`, `goldenRectangle` | Lightest weight; crosses its corners by 1.5–4 mm. Every construction says what it generated, `p.generated(id, ...markIds)`; an orphan fails `connect.generative` (E-2). Golden spirals only when they generate something (01 §5).                                                                                                | [hand](../../packages/mai/docs/parts/hand.md)                                                          |
| 6   | Search          | `p.stroke(path, { role: 'searching' })`, `'underdrawing'`                                                           | Faint (pressure 0.2–0.35). The hand finds the form before it commits.                                                                                                                                                                                                                                                            | [hand](../../packages/mai/docs/parts/hand.md)                                                          |
| 7   | Ink             | `contour(p, outline, { id: '<part>-outline', form, min, max })`                                                     | Heaviest line, swelling away from the light (min 0.55–0.75, max 1.1–1.5). Closed shapes anchored. Long lines lift at the hand's reach on their own. An id starting `<part>-` ties the mark to its part. An edge behind a nearer form: `p.stroke(path, { role: 'contour', hidden: true, line: 'dashed', part })` (`line.hidden`). | [pen](../../packages/mai/docs/parts/pen.md), [line types](../../packages/mai/docs/parts/line-types.md) |
| 8   | Tone            | `hatch(p, { form, ... })` per form                                                                                  | General shadow first, then deepen (thresholds 0.2 / 0.5 / 0.74). Codex: one slope, "\\" 45° ± 16°, never crossed (E-4). Architect and engraver: one direction per surface, a different one per adjacent part. Gap ≥ 0.55 mm in pen (ISO 0.7 for cut sections).                                                                   | [light](../../packages/mai/docs/parts/light.md)                                                        |
| 9   | Letter          | `letter(p, 'A', at, { cap: 3.5, kind: 'key', refers })`, `leader(...)`, `typeset(p, text, at, { cap: 2.5 })`        | Keys capitals A–G or numerals, never mixed. Letters on clear paper, never on hatching (02 R5). Notes readable, true, specific (01 R9); ≥ 2.5 mm. Leaders never cross: one angled run plus a shoulder, a dot inside a body, an arrow on an edge.                                                                                  | [letter](../../packages/mai/docs/parts/letter.md)                                                      |
| 10  | Measure inside  | `dimension(p, a, b, { offset, axis })`, `scaleBar(p, at, { units })`                                                | Never type a value (E-1). Extension line 1.5 mm off the ink, overshoot 2.5–3 mm. First tier 10–12 mm out. Measure the visible ink, never a bounding box (03 R9). Unit in `PlateSpec.scale`.                                                                                                                                      | [measure](../../packages/mai/docs/parts/measure.md)                                                    |
| 11  | Measure outside | hand over to **`/kiruk-mai-measure`**                                                                               | Overall size, chains, neatline, angles, sweeps, axes. That skill owns the rules.                                                                                                                                                                                                                                                 | [outer](../../packages/mai/docs/parts/outer.md)                                                        |
| 12  | Overlay         | roles `dimension` / `leader` / `overlay` in the rubric kit                                                          | Exact: one hue, true lines, no jitter (03 R1, R3). The drawing keeps the hand; the line keeps its precision (`style.overlay-crisp`, E-13).                                                                                                                                                                                       | [pen](../../packages/mai/docs/parts/pen.md)                                                            |
| 13  | Verify          | `/kiruk-mai-proof`                                                                                                  | 0 FAIL; every WARN fixed or explained in NOTES.md; the 4× crops read by you.                                                                                                                                                                                                                                                     | [critic](../../packages/mai/docs/parts/critic.md)                                                      |

## Rules that came from misses (each row is in [`ledger.md`](../../packages/mai/docs/ledger.md))

- **Narrow forms follow the form (MA-5).** In a band narrower than about 4 mm, never lay short hatch strokes: they read as leaves. Use `bandLine` or `hatch({ manner: 'contour' })`, with runs of about 4 mm and pressure set by tone. _Why:_ the critic measured tone, not stroke shape, and passed the leaves.
- **Behind is hidden, and hidden is dashed.** Clip what stands behind a nearer form (the `outsideV` / `outsideH` helpers in `plates/volute.ts`, or `null` from the far form's normal inside the near outline), and draw an edge that must still show as `hidden: true, line: 'dashed'`. _Why:_ a solid hidden edge lies about depth (`line.hidden`).
- **Flat horizontal bands hatch horizontally, vertical shafts vertically.** _Why:_ a vertical slope across a 2 mm band makes a comb.
- **Values are lettered in the type red, never the line red (MA-17).** Leave the value's ink to `dimension()` (`valueInk()` picks the ink's `typeInk`). _Why:_ the tokens keep `rubric-line` for strokes; values in it read 2.9–4.1:1 on Dawn Departs (`type.value-ink`, E-8).
- **Never dimension a break (MA-22).** _Why:_ a broken view is not dimensioned to its break (ISO 129); the value would be true to the ink and wrong in meaning.
- **Tiers stand a tier apart (MA-23).** ≥ 6 mm between an inner value and the overall. _Why:_ 2 mm apart, two values read as one (`measure.tier-gap`, E-5).
- **Axes are named at both ends.** A long chain-line axis carries A … A′ where it leaves the figure. _Why:_ an axis is read by its name (`connect.axes-named`, E-7).
- **A missing glyph fails (MA-24).** Synthetic ° ′ × Ø ± · – — ’ → Δ exist; anything else is recorded as missing. _Why:_ "41°" once came out "41" in silence (`type.glyphs`, E-11).
- **Never set `time`** unless the plate says why it is shown as found. _Why:_ the constructor refuses otherwise, and decay is not manner (01 R14).
- **No script or mirror notes** without a readable twin (`twin: id`). _Why:_ pseudo-mirror writing is the first fake the research names (01 §5).
- **Do not hand-tune anomalies.** Change the instrument, ink, paper, pressure or pace. _Why:_ a faked anomaly breaks the critic's reading of its cause.
- **To see why a stroke looks the way it does,** set `PlateSpec.trace: true` (each mark keeps speed, curvature, pressure, width and load per sample in `Mark.trace`) or move the controls on the calculus page (`pnpm --filter @kiruk/mai calculus`). _Why:_ MA-27 was found on that page, not in the proof; tune the cause with its numbers in view, not by eye.

## Where things go

- **Plate source:** `packages/mai/plates/<name>.ts`, `export default` a function returning the `Plate`. The header comment states the claim, the anatomy drawn, the truth policy and the proof command.
- **Proof and notes:** `ideas/kiruk-codex/plates/plate-NN-<name>/`, with `proof/` from `--commit` and a `NOTES.md`: claim, what was drawn, critic result, what is not claimed, questions for the founder.
- **Never commit** a reference image by another artist (`.gitignore` covers `ideas/studio-dawn/references/`). Write down measurements and a citation only.

## Finish

1. `/kiruk-mai-proof` until 0 FAIL, every WARN fixed or explained in `NOTES.md`.
2. Read the 4× crops yourself before showing anyone. _Why:_ a passing critic is necessary, not sufficient (MA-5).
3. A dated CHANGELOG entry under `## Unreleased` (what, why, verified, not done); a ledger row for every miss; then `/kiruk-capture`.
4. Show the founder the sheet, the phone view and the crops, with LOOK items as questions. Never call it final: the founder's eye is the last check.

## Sources

- Decision: ideas/kiruk-codex/plan.md (mai, the ink engine) and ideas/ways-of-working/proposal.md §3.3 (the anatomy of a skill)
- Promise: none yet (no openspec requirement for mai)
- Ledger: packages/mai/docs/ledger.md
- Examples: packages/mai/docs/examples.md
- References: packages/mai/docs/parts/README.md
- Evals: packages/mai/docs/evals.md, packages/mai/test/evals.test.ts
