---
description: Draw an illustration plate with mai, kiruk's ink engine. The plate must look generated and read as a hand, with true lighting, measured dimensions, connected lines, clear lettering and honest ink anomalies. Use for any studio plate, codex figure, construction study, measured drawing or engraving-style illustration, or when someone asks for human-like strokes, ink bleed, hatching, or a Leonardo, architectural or engraved look.
argument-hint: <what the plate explains, in one sentence> [style: codex | construction | cosmograph | architect | engraver | dawn-new]
---

# /kiruk-mai: draw a plate

**Engine:** `packages/mai`. Read [`packages/mai/README.md`](../../packages/mai/README.md) first, then [`docs/anomalies.md`](../../packages/mai/docs/anomalies.md) and [`docs/styles.md`](../../packages/mai/docs/styles.md). Numbers below come from `ideas/kiruk-codex/research/01–03` (cited as 01 §n / 02 Rn / 03 Rn). If the local `kiruk-codex`, `kiruk-sheet`, `kiruk-rule` or `kiruk-stroke` skills are present, their founder rules win on composition. This skill wins on how mai is driven.

**Argument:** `$ARGUMENTS` = the claim and, optionally, a style. If there is no claim, ask for one sentence and stop. Never invent the subject.

## The one idea

The geometry is generated, a hand performs it, a pen inks it on a sheet, one light shades it, the measurements come from the ink, the critic proves it, and the founder judges it. Every visible quirk must be caused by an act: a hand, a pen, ink, paper, or light. A quirk with no cause is costume. A missing quirk is plotter.

## Decide quality before drawing (write these down first)

1. **Claim:** one true sentence of at least 6 words, which goes into `PlateSpec.claim`. The drawing shows what it is; the line shows why it works.
2. **Truth:** every number on the sheet gets `p.fact(key, value, source, unit)`. A value you cannot source is left off, not guessed. Use `[TBD]` in notes.
3. **Device** (01 R4):
   - interior → section
   - joints → exploded view
   - build → build-up
   - motion → phase series
   - difference → side-by-side at the same scale
   - forces → thread diagram
   - a method → construction

   Never "one pretty 3/4 view with arrows" (01 §5).

4. **Views:** at least 2 (01 R3). An enlargement counts, if it is labelled (02 R13).
5. **Style:** pick from `docs/styles.md` and say why in one line. On Dawn Light the ink is iron-gall (`restyle(STYLES.x, { ink: 'iron-gall', paper: 'dawn-light' })`). On Dawn Departs it is navy (`dawn-new`).
6. **Eye motif** (non-negotiable 4): `eye: { motif: 'drawn', ref }` with a real reference (Plate III found the eye inside the volute), or `{ motif: 'none', justification }`.
7. **Sheet:**
   - Size in mm and margins of 12–16 mm.
   - Split 61.8 / 38.2: the subject zone, then the zone for notes, enlargement and scale.
   - The subject goes in first and largest; commentary frames it and never covers it (02 R2).
   - At most 7 keyed parts (03 R12).
8. **Light:** one. The default is `UPPER_LEFT` (upper left, 45°; 02 §11). Never two.

## Passes, in this order (01 R15, 02 R3)

| #   | Pass                     | mai calls                                                                                                           | Rules with numbers                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Construction             | `ruled(p, a, b)`, `compass(p, c, r)`, `point(p, q, { style: 'prick', label })`, `voluteGeometry`, `goldenRectangle` | Lightest weight. It crosses its corners by 1.5–4 mm. Every construction says what it generated, with `p.generated(id, ...markIds)`; an orphan fails `connect.generative`. Golden spirals are only allowed when they generate something (01 §5).                                                                           |
| 2   | Searching / underdrawing | `p.stroke(path, { role: 'searching' })` and `'underdrawing'`                                                        | Faint (pressure 0.2–0.35). The hand finds the form before it commits.                                                                                                                                                                                                                                                     |
| 3   | Outlines                 | `contour(p, outline, { id, form, min, max })`                                                                       | Heaviest line, swelling away from the light (min 0.55–0.75, max 1.1–1.5). Closed shapes are anchored. Long lines lift at the hand's reach automatically.                                                                                                                                                                  |
| 4   | Tone                     | `hatch(p, { form, ... })` per form                                                                                  | General shadow first, then deepen (thresholds 0.2 / 0.5 / 0.74). Codex: one slope, "\\" 45° ± 16°, no crossing. Architect and engraver: one direction per surface, a different one for each adjacent part. Gap ≥ 0.55 mm in pen (ISO 0.7 for cut sections). Finish selectively: leave some parts at line or construction. |
| 5   | Keys and notes           | `letter(p, 'A', at, { cap: 3.5, kind: 'key', refers })`, `leader(...)`, `typeset(p, text, at, { cap: 2.5 })`        | Keys are capitals A–G, or numerals, never mixed. Letters sit on clear paper, never on hatching (02 R5). Notes are typeset, readable, true and specific (01 R9). Leaders never cross: one angled run plus a shoulder, a dot inside a body, an arrow on an edge.                                                            |
| 6   | Measure                  | `dimension(p, a, b, { offset, axis })`, `scaleBar(p, at, { units })`                                                | Never type a value: `dimension()` measures it. The extension line starts 1.5 mm off the ink and overshoots 2.5–3 mm. The first tier is 10–12 mm out. Measure the visible ink, never a bounding box (03 R9). State the unit (`PlateSpec.scale`).                                                                           |
| 7   | Overlay                  | Roles `dimension` / `leader` / `overlay` in the rubric kit                                                          | Exact: one hue, true lines, no jitter (03 R1, R3). The drawing keeps the hand; the line keeps its precision.                                                                                                                                                                                                              |

## Rules that came from misses (ledger `packages/mai/docs/ledger.md`)

- **Narrow forms follow the form (MA-5).** In a band narrower than about 4 mm, never lay short hatch strokes: they read as leaves. Use lines that follow the band (`bandLine`, or `hatch({ manner: 'contour' })`), with hysteresis, minimum runs of about 4 mm, and pressure set by tone.
- **Behind is hidden.** Clip what stands behind a nearer form: `outsideV` and `outsideH` for lines, or return `null` from the far form's normal inside the near form's outline, so hatching stops there too.
- **Flat horizontal bands are hatched horizontally, and vertical shafts vertically.** A vertical slope across a 2 mm band makes a comb.
- **Never set `time`** unless the plate says why it is shown as found. The constructor refuses otherwise, and the critic opens a LOOK item.
- **No script or mirror notes** without a readable twin (`twin: id`). Pseudo-mirror writing is the first fake the research names (01 §5).
- **Do not hand-tune the anomalies to taste.** Change the instrument, ink, paper, pressure or pace, which cause them. Faking an anomaly directly breaks the critic's reading of it.

## Where things go

- **Plate source:** `packages/mai/plates/<name>.ts`, which `export default`s a function returning the `Plate`. The header comment states the claim, the anatomy drawn, the truth policy and the proof command.
- **Proof and notes:** `ideas/kiruk-codex/plates/plate-NN-<name>/`, with `proof/` from `--commit` (no `paper.png`) and a `NOTES.md` covering the claim, what was drawn, the critic result, what is not claimed, and questions for the founder.
- **Never commit** a reference image by another artist (`.gitignore` covers `ideas/studio-dawn/references/`). Write down measurements and a citation only.

## Finish

1. Run `/kiruk-mai-proof` on the plate. Iterate until it shows 0 FAIL, and either fix every WARN or explain it in `NOTES.md`.
2. Read the 4× crops yourself before showing anyone. A passing critic is necessary, not sufficient (MA-5).
3. Add a dated CHANGELOG entry under `## Unreleased` (what, why, verified, not done). Add a ledger row for every miss you found. Then run `/kiruk-capture`.
4. Show the founder the sheet, the phone view and the crops, with the open LOOK items as questions. Do not call it final; the founder's eye is the last check.
