---
status: built 2026-10-26 — founder confirmed the revised road; sheet I passes check.mjs; founder has not yet looked at the sheet
date: 2026-10-26
turtle: boulder · ideate
tier-signals: new skill contract; crosses kiruk.in and this repo; three new skills plus one sheet
---

# Road map — the studio sheet

> Turtle road map. Tier: boulder. Status: revised after the founder held the first road. Nothing is installed. No skill file exists yet.
> Re-read the next unchecked step before each build step.

## Context

The founder asked for a curated base, taken from a long list of outside design skills, so Kiruk Studio can show its work the way a measured manuscript does: stroke, ink, paper, grids, and the lines that hold a design up. kiruk.in keeps the computing eras. This repo keeps the sheet that comes before an interface. Client worlds are curated on that sheet, one grammar evolved from the last.

On 2026-10-26 the founder held the first draft (it kept measurement, stroke, and proportion as single borrowed sentences) and answered three thickenings:

- Measurement is a real pass: dimensional drawing, grids, and proportion.
- Stroke is a skill now, in this repo, not a pointer that stops at private `sketch-ink`.
- Golden ratio and geometric construction are visible rules.

The name is `kiruk-sheet`. The first made thing, after the skills, is a construction sheet of the studio home: the mark, the word _kiruk_, the claim. That sheet records the live page. It does not restyle `apps/kiruk-studio`.

## What changed from the first draft

| First draft                                       | This revision                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| One router, satellites later                      | Three skills now: `kiruk-sheet`, `kiruk-rule`, `kiruk-stroke`, then the home sheet                                      |
| φ mentioned only when a subject already uses it   | φ is the layout module. Every sheet names its steps.                                                                    |
| Stroke parked behind `sketch-ink`                 | `kiruk-stroke` states the studio's instruments. `sketch-ink` stays the private notebook engine and is read, not copied. |
| Dimensional drawing reduced to "[TBD] and a code" | The code system, the tables, the ruling, and "read the source before a number" are the measure pass                     |

## Questions & answers

| #   | Lens       | Question                          | Answer                                                                                                                             | Label                                                                                               |
| --- | ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Why        | What is true when this is done?   | An agent can build a studio sheet with a named grid, a named stroke, and red dimensions taken from a real file.                    | inferred founder message; thickenings answered 2026-10-26                                           |
| 2   | Who        | Who uses it?                      | Founder and agents, before a studio plate or a client world. Visitors see the sheet later.                                         | inferred `ideas/private-craft-bridge/README.md`                                                     |
| 3   | Where      | Where do the files live?          | Plan here. Skills in `.claude/skills/kiruk-sheet/`, `kiruk-rule/`, `kiruk-stroke/`. The home sheet in `ideas/kiruk-sheet/sheets/`. | verified ways-of-working D1; name answered 2026-10-26                                               |
| 4   | Today      | What already covers figures?      | `kiruk-codex`: construction, quill, rubric line, `truth.json`, `check.mjs`.                                                        | verified `.claude/skills/kiruk-codex/SKILL.md`                                                      |
| 5   | Today      | What is the studio home?          | Mark 72px, word, claim, on paper `#f4ecdf`, ink `#1a120e`, rubric `#983a22`.                                                       | verified `apps/kiruk-studio/src/app/(site)/page.tsx`, `globals.css` `:root` and `.sheet-*`          |
| 6   | Constraint | Install the outside repos?        | No. Rules are rewritten in kiruk's words, source named.                                                                            | verified ways-of-working D1, D2                                                                     |
| 7   | Constraint | May this restyle the live CSS?    | No. The home sheet measures it and marks where a value leaves the φ module. A CSS change is a later decision.                      | inferred from "sheet of the home" plus brand-system light-only; hypothesis until the sheet is drawn |
| 8   | Constraint | Copy `sketch-ink` into this repo? | No. The stroke skill states instruments and points at the private docs for the notebook engine.                                    | verified bridge README lines 46–48; founder asked for a studio stroke skill, not a second engine    |
| 9   | Name       | Hub name?                         | `kiruk-sheet`.                                                                                                                     | answered 2026-10-26                                                                                 |
| 10  | Next       | First artifact?                   | Hub, rule, stroke, then the home construction sheet.                                                                               | answered 2026-10-26, thickened the same day                                                         |

## Layer stack

| #   | Layer         | Known                                                                                                                                                 | Unknown                                                               | Depends on                         |
| --- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| 1   | Literal ask   | Curate the listed skills into a studio method of stroke, ink, paper, grids, and visible measure.                                                      | —                                                                     | —                                  |
| 2   | Outcome       | Three skills and one measured sheet of the home.                                                                                                      | Confirm this revised road                                             | user, before step 1                |
| 3   | User & moment | Agent at the start of a studio drawing.                                                                                                               | —                                                                     | 2                                  |
| 4   | Problem       | The first draft was too thin on the three things the founder named. Codex already draws plates. The home page has no construction on it.              | —                                                                     | 5                                  |
| 5   | Current state | Codex, pen-and-paper, light paper, private sketch-ink, private eye hub, home CSS cited below.                                                         | —                                                                     | —                                  |
| 6   | Vocabulary    | Sheet, plate, scribble, rule, ink, rubric, live, module.                                                                                              | —                                                                     | this file                          |
| 7   | Material      | Live CSS numbers, φ table, codex instrument sizes, stroke instruments.                                                                                | The home sheet's `truth.json` is written at step 4 from these sources | 5                                  |
| 8   | Flow          | Read source → declare module → rule the sheet → ink with one instrument → rubric the codes → check.                                                   | —                                                                     | 9                                  |
| 9   | Structure     | Hub routes. `kiruk-rule` owns grid, measure, φ. `kiruk-stroke` owns instruments. Codex owns plates and the checker.                                   | —                                                                     | 10                                 |
| 10  | Contract      | Numbers in `truth.json`. Layout steps are φ or marked off-module. Instrument sizes stay the codex table. No new design token in this pass.            | —                                                                     | 7                                  |
| 11  | Lifecycle     | Pending confirm. Then four filesets, one at a time. Outside repos never vendored.                                                                     | —                                                                     | 2                                  |
| 12  | Failure       | A third spacing scale. A 22-style costume menu. A red line deleted to satisfy a monochrome pack. A φ restyle of the live site snuck into the sheet.   | Hub forbids those by name                                             | 9                                  |
| 13  | Constraints   | Bridge, eye on the figure, scribble before a universe, light paper, no token without a spec.                                                          | —                                                                     | brand-system, pen-and-paper, codex |
| 14  | Operations    | Delete the three skill folders to roll back. Codex and the app stay.                                                                                  | —                                                                     | 11                                 |
| 15  | **Core idea** | A Kiruk Studio sheet is ruled on a golden-ratio module, drawn with one named stroke, and dimensioned in red from values that were read, not invented. |                                                                       |                                    |

## Vocabulary

| Word                | Means                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| **Sheet**           | One studio page: ruling, ink, rubric, together                                                       |
| **Plate**           | One codex figure. A sheet may hold a plate.                                                          |
| **Module**          | The φ spacing and type steps. Base `lg = 16px`.                                                      |
| **Off-module**      | A live value that is not a module step and not an instrument size. Drawn, labelled, left as it is.   |
| **Instrument size** | A drafting size from codex (`line.md`, `pen.md`): hairline, arrow, extension gap. Not a layout step. |
| **Rule**            | The construction layer: horizontal ruling, axes, circles, φ rectangles. Straight. Never wobbled.     |
| **Code**            | A dimension name (`S1`, `R1`, `H1`) whose value is in the table and in `truth.json`.                 |
| **Instrument**      | Which stroke is in the hand: quill, pen, or hand.                                                    |

## Five passes

1. **Scribble.** `openspec/specs/pen-and-paper/spec.md` when the work is a universe, ISM, or product. A study sheet in `ideas/` may start from this plan.
2. **Rule.** `kiruk-rule`. Horizontal lines, the module, the codes.
3. **Ink.** `kiruk-stroke`. One instrument for the subject.
4. **Rubric.** Codex `references/line.md`. Red. Every code on the drawing is in the table. Every value was read or is `[TBD]`.
5. **Live.** Codex `references/live.md` when the sheet is on screen. The rest state already explains.

## The module (proportion)

Source: [BFondue/claude-design-skill-golden-ratio](https://github.com/BFondue/claude-design-skill-golden-ratio) `docs/design/golden-ratio-system.md`, LiftKit's φ = 1.618033988749895, base 16px. Rewritten here. The Excalidraw commands, the OKLCH palette, dark mode, glass, and rubber are not part of the studio.

### Spacing steps

| Token | Rounded | From φ       |
| ----- | ------- | ------------ |
| `2xs` | 2px     | φ⁻⁴          |
| `xs`  | 4px     | φ⁻³          |
| `sm`  | 6px     | φ⁻²          |
| `md`  | 10px    | φ⁻¹          |
| `lg`  | 16px    | φ⁰, the base |
| `xl`  | 26px    | φ¹           |
| `2xl` | 42px    | φ²           |
| `3xl` | 68px    | φ³           |
| `4xl` | 110px   | φ⁴           |

Related items sit one step apart. A group sits two or more steps from the next group. Nested padding: the outer step is larger, the inner is one or two steps down.

### Type

Body anchor 16px. Line-height is `1` on display, `1.272` (√φ) on titles, `1.618` on body. A heading step divides by φ. Measure: 45–75 characters, aim 66. Codex floors still hold on a plate: 16px body, 11px minimum.

### The split and the rectangle

A two-column sheet is 61.8 / 38.2. A φ rectangle is drawn, not implied: the long side over the short side is φ, and `truth.json` names which edges. Geometric-design's rule stands: a declared relation is not the same as a φ guess after the fact. If the relation was not drawn, it is not claimed.

### Optical corrections (visible, proposed on the rubric)

Taken from the same golden-ratio note and from logo-design, and already kin to codex marks:

- A circle that must match a square is drawn at 1.08 of the square's side.
- Inner radius = outer radius − the gap. If the gap is larger than the outer radius, the inner corner is square. (Dimensional-drawing writes this as `R2 = R1 − B − S6`.)
- Visual centre sits about 2% above geometric centre. Codex rise still governs the whole sheet: weight at or above the middle.
- Optical overshoot of a round or a point is about 1–3%, written as a code, and stays a proposal until the founder accepts it (geometric-design).

### What the module does not do

- It does not replace ink `#1a120e`, paper `#f4ecdf`, or rubric `#983a22`.
- It does not introduce a dark theme.
- It does not generate a SaaS page, a palette, or an Excalidraw file.
- It does not erase codex instrument sizes. Those stay in the instrument table. A layout gap is a module step or it is labelled off-module.

## The ruling and the measure (`kiruk-rule`)

This is the pass the first draft thinned too far. It is its own skill.

### Horizontal support

The founder asked for the lines that hold the design, including the horizontal ones. On every sheet:

- A ruling of horizontal lines runs under the subject, in the construction weight (codex: 0.4–0.6px at 40% ink, straight, extended 6–12 units past the corner they serve).
- The line the word or the object sits on is the baseline. It is named in `truth.json`.
- Further horizontals are module steps, or baselines of notes, or centre lines. A horizontal with no job is deleted.
- Verticals are axes, margins, and the φ split. Same rule: no job, no line.

Sketchbook-style says "no ruler lines" inside a fast sketch. That sentence applies to the ink, which may overshoot. The rule layer is ruled on purpose. Both are visible, and they are different layers.

### Codes

From [enesozturk/dimensional-drawing](https://github.com/enesozturk/dimensional-drawing) `skills/dimensional-drawing/SKILL.md`, adapted to the rubric (their sheet is monochrome; ours keeps red for the measure).

| Prefix | Means                                 |
| ------ | ------------------------------------- |
| `S#`   | spacing, padding, gap                 |
| `H#`   | height                                |
| `W`    | width, fixed or a range               |
| `R#`   | radius                                |
| `B`    | border or stroke width of the subject |
| `T#`   | type size or line-height              |

Every code on the drawing appears in a table: code, name, value, formula if it is derived. A derived value shows the formula and the result (`R2 = R1 − B − S6`). A value that was not in the source is `[TBD]` and is not drawn as a fake precision. Slots, not real sentences, when the subject is a UI component's structure. The home sheet is allowed to letter the real word _kiruk_ and the real claim, because those words are the subject.

Read the source before writing a number. For the home sheet the source is `apps/kiruk-studio/src/app/globals.css` and `(site)/page.tsx`. For a later component, the box tree. Survey siblings before treating one instance as the system.

### The home page, already read (16px root)

These are the values step 4 must use. They are not a redesign.

| What           | Source         | At 16px                                | On the module?                              |
| -------------- | -------------- | -------------------------------------- | ------------------------------------------- |
| Paper          | `--paper`      | `#f4ecdf`                              | colour, not a step                          |
| Ink            | `--ink`        | `#1a120e`                              | colour                                      |
| Rubric         | `--rubric`     | `#983a22`                              | colour; codex text rubric                   |
| Mark           | `.sheet-mark`  | 4.5rem = 72px                          | off-module (nearest 68)                     |
| Mark gap below | margin-bottom  | 1.25rem = 20px                         | off-module (nearest 16 or 26)               |
| Word           | `.sheet-word`  | clamp(3.4rem, 8vw, 5.5rem) = 54.4–88px | off-module; display, line-height 0.95       |
| Word tracking  | letter-spacing | −0.02em                                | the display tightening from the φ type note |
| Claim gap      | margin-top     | 1.1rem = 17.6px                        | off-module (nearest 16)                     |
| Claim size     | font-size      | 1.15rem = 18.4px                       | off-module (nearest 16)                     |
| Claim leading  | line-height    | 1.45                                   | off-module (body module is 1.618)           |
| Claim measure  | max-width      | 36ch                                   | short of the 45–75 aim                      |

The sheet draws these codes in red, and writes `off-module` on the ones that leave the table. Changing any of them in CSS is out of this pass.

### Sheet furniture

One sheet. Notes and the code table on the paper, not in a UI card. Identity line: subject, unit (px), scale, source file, date. Codex colophon and the eye stay. Detail at a larger scale for the mark (plate II already studies the logogram; this sheet measures the page the mark sits on, and points at plate II rather than redrawing the mark's anatomy).

## The stroke (`kiruk-stroke`)

A skill in this repo. It does not copy `kiruk-in` `behavior.ts`. Before tuning handwritten words, read `kiruk-in/.cursor/skills/sketch-ink` and `kiruk-in/docs/SKETCH_INK_STYLE.md`.

Three instruments. A sheet names one for the subject. Mixing two instruments on the same contour is a miss.

| Instrument | Draws                                               | Weight                                                                                                              | Behaviour                                                                                                                                                |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quill**  | The subject of a plate                              | 0.7–2.6px along one stroke, widest ≥ 2, from codex `pen.md`                                                         | Pressure. Hatching ramps and stops short of the light. Wobble 1–2.5px on ink only.                                                                       |
| **Pen**    | A study, a note, a construction sketch of a product | Firm. Sketchbook `pen`: about a 0.8mm felt tip. On a 1024px box their measured typical stroke is ~0.49% of the box. | Overshoot 1–3px at a corner. Edges may be traced twice. Most of the paper stays empty.                                                                   |
| **Hand**   | Words that are handwriting                          | One face per hand                                                                                                   | Word-level angle, cold / settle / fatigue / rush. Never a font change mid-word. Notes on a plate stay the codex old hand unless the sheet is a notebook. |

Construction and the rubric are not instruments. They are not wobbled. Sketchbook's `contrast` rule is taken as a sentence: thick where the form is calm and large, fine where it is busy. That matches codex "finish only the part the claim is about."

### Taken from sketchbook-style

[Keith-CY/sketchbook-style](https://github.com/Keith-CY/sketchbook-style). The picture is thinking on paper: black ink, empty paper, hatching, a few solid accents, construction lines past the object, short notes. Sub-style B (construction study) is the studio's study sheet. Variant `pen` is the explanation drawing.

### Left from sketchbook-style

Image-model prompts, Qwen, FLUX, and the post-process scripts. Variant `marker` as a default (invented gadgets). Variant `ink` as a default (half the object solid black). "No colour" does not remove the rubric. "No ruler lines" does not remove the rule layer. Pure `#000` on `#fff` does not replace kiruk paper and warm ink.

### Left from hand-drawn-styles

[threerocks/hand-drawn-styles](https://github.com/threerocks/hand-drawn-styles) is 22 image-prompt recipes (crayon, ink-wash, pixel, shadow puppet, and others). Taken: name the instrument before drawing, do not mix recipes, and do not call the sheet finished before its check. The 22 recipes are not a menu.

## Seams

| Seam                                      | Conflict                                                | Resolution                                                                                                                                            | Owner                        |
| ----------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| φ module × live home CSS                  | 20px, 72px, 18.4px, leading 1.45 are off the module     | The sheet labels them off-module. CSS stays.                                                                                                          | step 4                       |
| φ module × codex instrument sizes         | Arrow 7px, extension gaps, 1px hairline are not φ steps | Instrument table, separate from layout steps                                                                                                          | `kiruk-rule`                 |
| Sketchbook "no ruler" × horizontal ruling | One wants a fast sketch, the other a draught            | Ink may overshoot. Rule layer is straight and visible.                                                                                                | `kiruk-stroke`, `kiruk-rule` |
| Monochrome packs × rubric red             | Dimensional-drawing and sketchbook forbid accent colour | Ink is the thing. Red is the measure. Codex colour rule stands.                                                                                       | `kiruk-codex` `line.md`      |
| `sketch-ink` × `kiruk-stroke`             | Two hands                                               | Studio sheets use the three instruments. The notebook engine stays in kiruk-in.                                                                       | bridge + `kiruk-stroke`      |
| Golden-ratio dark/glass × brand           | That doc specifies dark mode and glass                  | Light paper. No glass, no rubber, no new palette.                                                                                                     | `brand-system`               |
| Logo library × eye                        | A generic mark                                          | Tests only (16px, junctions, black first, three concepts then stop). Eye still required.                                                              | codex `marks.md`             |
| Teardown × truth                          | Teardown allows invented dimensions                     | Evidence class is kept (supplied / seen / hidden / concept). A missing number is `[TBD]`.                                                             | `kiruk-rule`                 |
| This pass × ways-of-working §3.4          | Skills were to wait for a curated output                | The founder asked for these three skills as the base, then the home sheet as the first output. The sheet is the example that will correct the skills. | this plan                    |

## Keep / drop (unchanged in spirit, thicker where asked)

Still not installed. Jakub Krehel's repo has `teardown`, not `technical-drawing`.

| Source                                                                                                                                   | In the skills                                                                                                  | Out                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| dimensional-drawing                                                                                                                      | Codes, formulas, tables, slots, `[TBD]`, read-the-source, one sheet, detail views                              | Monochrome ban, their HTML kit, their motion skill                                      |
| teardown                                                                                                                                 | Evidence row per feature group; smallest view set                                                              | Mesh pipeline, invented numbers, copying their viewer                                   |
| geometric-design                                                                                                                         | Declared vs inferred; optical correction waits for the founder; size ladder 8/16/24/32/64/128 on a mark        | Their CLI, closed SVG subset                                                            |
| logo-design                                                                                                                              | Black first, three concepts then stop, junction and 16px tests                                                 | The 1,400-logo library, the kit scripts                                                 |
| golden-ratio system                                                                                                                      | The module, the split, the four optical corrections above                                                      | Excalidraw, OKLCH generator, dark mode, glass, rubber                                   |
| sketchbook-style                                                                                                                         | Pen instrument, contrast sentence, empty paper, construction lines past the object, measured stroke as a check | Image models, marker-as-default, poster-ink default                                     |
| hand-drawn-styles                                                                                                                        | Name the instrument, do not mix, check before done                                                             | The 22 recipes                                                                          |
| anatomy                                                                                                                                  | Already in codex                                                                                               | Isometric kit                                                                           |
| design-engineer, superdesign, Jakub better-\*                                                                                            | —                                                                                                              | Emil at user level already does this job                                                |
| diagram-design, colorfigures, anatomy-reveal, 3d assembly, Specimen, ai-design-skills, the big collections, Vercel web-design-guidelines | —                                                                                                              | Other products or later audits. A flow is a mechanism on the sheet, or it is not drawn. |

## Direction

- **Core idea:** A Kiruk Studio sheet is ruled on a golden-ratio module, drawn with one named stroke, and dimensioned in red from values that were read, not invented.
- **Chosen:** Write `kiruk-sheet`, `kiruk-rule`, and `kiruk-stroke`, then one construction sheet of the studio home that measures the live CSS and labels off-module values. Install nothing. Leave `kiruk-codex` as the plate skill and the checker.
- **Rejected:**
  - The first draft's thin borrow — the founder held it.
  - Installing the packs — two methods, and a public copy of other people's skills.
  - Restyling `globals.css` onto φ inside this pass — the sheet is how we see the page, not a silent retune.
  - Do nothing — the home stays a word with no ruling.
- **Non-goals:** No era shell. No copy of the sketch-ink engine. No token spec. No OpenSpec change. No edit to codex `SKILL.md` unless a check on the home sheet proves a rule belongs there, and then only as a diff the founder sees. No client universe sheet until this home sheet has been looked at.

## Done-criteria

- [x] Founder confirms this revised road — check: reply — evidence: confirmed 2026-10-26, option build
- [x] `.claude/skills/kiruk-sheet/SKILL.md` routes to rule, stroke, and codex, and names the parked packs — check: read the router — evidence: the "Which skill" tree and `references/sources.md`
- [x] `.claude/skills/kiruk-rule/SKILL.md` contains the module table, the code prefixes, the horizontal-ruling rule, and the off-module rule — check: those four are present — evidence: sections The module, The ruling, The codes
- [x] `.claude/skills/kiruk-stroke/SKILL.md` names quill, pen, and hand, and says the 22 recipes are not a menu — check: read the instrument table — evidence: "Three instruments" and "What it is not"
- [x] `ideas/kiruk-sheet/sheets/sheet-01-home/` has `index.html`, `truth.json`, and codes for the mark, the word, and the claim taken from `globals.css` — check: each code's value matches the table in this plan — evidence: `truth.json` codes Z1 72, S1 20, H1 54.4–88, S2 17.6, T1 18.4, L1 1.45
- [x] Off-module labels are on the 20px gap, the 72px mark, the claim size, and the 1.45 leading — check: visible on the sheet — evidence: desktop shot labels `S1 20 off`, `Z1 72 off`, `T1 18.4 · L1 1.45 off`
- [x] `node .claude/skills/kiruk-codex/scripts/check.mjs` passes on that sheet — check: command — evidence: exit 0, desktop and phone, 2026-10-26
- [x] No new folders from `npx skills add` — check: skill dir listing — evidence: only `kiruk-sheet`, `kiruk-rule`, `kiruk-stroke` were added beside the existing `kiruk-codex`
- [x] `apps/kiruk-studio` CSS is unchanged — check: this pass did not edit `globals.css` — evidence: no write to `apps/kiruk-studio`
- [x] Bridge README has one row for `kiruk-sheet` — check: the skills table — evidence: `ideas/private-craft-bridge/README.md` skills table, three new rows

## Build order

- [x] 0. Confirm this revision. Check: founder reply. Evidence: 2026-10-26, build
- [x] 1. `kiruk-sheet` router + empty `learnings.md` + `references/sources.md` pointing here. Check: done-criteria row 2. Evidence: files written
- [x] 2. `kiruk-rule` with `references/module.md`, `references/measure.md`, `references/ruling.md`. Check: done-criteria row 3. Evidence: files written
- [x] 3. `kiruk-stroke` with the instrument table and a pointer to sketch-ink. Check: done-criteria row 4. Evidence: files written
- [x] 4. Home construction sheet. Subject: the studio home as printed in CSS. Claim: the page is a mark, a word, and a sentence, held on a baseline, and the red line says which distances sit on the module. Check: `check.mjs` and the four off-module labels. Evidence: exit 0
- [x] 5. One row in `ideas/private-craft-bridge/README.md`. Check: the skills table. Evidence: three rows added

## Checkpoints

- Before step 1: confirm this revision.
- The home sheet is shown once, as one frame, before any CSS is proposed.
- A client universe sheet waits until this one has been accepted or corrected.
- Any edit to `kiruk-codex/SKILL.md` is shown as a diff first.

## Watch list

- Off-module labels on the home sheet will read as criticism of the live page. They are a record. Status: open until the founder sees the sheet.
- φ as the only layout module may fight a later client whose grid is a square or a column measure. The skill allows another declared construction; φ remains the default module for studio sheets. Status: open.
- `kiruk-stroke` hand instrument vs codex "notes in the old hand" — plates keep IM Fell; the hand instrument is for notebook words. Status: written into the instrument table; confirm on the home sheet (the home word is Fell, so the instrument is quill-or-pen for the mark and Fell for the word, not SketchInk). Hypothesis: the home sheet uses pen for nothing and Fell for type, with the mark inked as the logogram paths, unfiltered.

## Drift log

| Date       | What changed                                                                                                                   | Why                                                                                      | Approved by       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------- |
| 2026-10-26 | Jakub skill is `teardown`, not `technical-drawing`.                                                                            | Repo listing                                                                             | research          |
| 2026-10-26 | First road held. Measurement, stroke, and φ thickened into real skills. Name `kiruk-sheet`. First sheet is the studio home.    | Founder answers                                                                          | founder           |
| 2026-10-26 | Sheet I draws the mark at 220px and marks the sheet NTS. The live mark is 72px, which would put the logogram stroke under 2px. | The codex weight check needs an ink stroke of at least 2px. The red label still says 72. | build, reversible |

## Close & retro

- Done-criteria: all ticked. The founder has not yet said whether Sheet I reads as the sheet he meant. That look is still open.
- Retro: no miss on the build. The first road was held before any skill existed, and the thickenings were written into the plan before the files.
