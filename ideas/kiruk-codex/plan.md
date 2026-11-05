---
status: draft — skill written, tested twice on Plate I, extended for marks / depth / live; founder has not reviewed it yet
date: 2026-10-20
skill: .claude/skills/kiruk-codex/ (local; .claude/skills/ is not committed until the ways-of-working allowlist lands, decision D1)
---

# kiruk-codex — the skill for kiruk's figures

## Why this exists (founder, 2026-10-20)

> "Previously, we used only paper, where we imposed things very clearly and then designed with more thoughts and by showcasing very clearly… currently the world lacks detail and artistry."

> "KIRUK Studio doesn't just make design. We want to make timeless and experimental design for the audience… that just sustains over decades and centuries."

The founder set the four blend variations aside (`ideas/studio-dawn/blend-roadmap.md`, parked) and asked for one detailed, specific skill first: a medieval / Leonardo way of drawing, blended with today's design-engineering line, studied from the masters, built the way skills.wheresryan.sh/anatomy was built, and curated with the emil skills.

## What was taken from Anatomy, and what was not

The founder asked to replicate two things, not everything.

1. **Rules that come from the founder's own notes, and an order of work where quality is decided before drawing.** Anatomy turned every note Ryan said after looking at a figure into a rule that names the fault, then fixed a ten-step order (size, truth, invent the object, list the parts… verify). kiruk-codex does the same: `learnings.md` holds the founder's notes (KC-1…), `SKILL.md` turns them into nine founder rules, and steps 1–4 (claim, truth, object, devices) happen before any path is drawn.
2. **Checks Claude can read.** Anatomy ends every check in a number, an exit code or a 4× crop. kiruk-codex ships `scripts/check.mjs`: line weights, one hue, every line end landing, notes off the subject, text size, mirror writing, fonts, contrast against the real pixels, and the founder's "rise" measured as where the ink's weight sits.

Not taken: the isometric camera and solids kit, WebGL, 3D turning, the React package, and Anatomy's "no words inside the drawing" rule. kiruk inverts that last one: Leonardo's pages are notes beside drawings, so kiruk keeps notes, but beside the subject, keyed by letters, and checked to stay off it.

## How emil was used

`emil-writing-skills` set the shape (process not output, every rule with its why, strict numbers, every line earns its place, test by running). `emil-unslop-design`, `emil-typography` and `emil-design-foundations` informed the failure modes, the type floors and the illustration rules. The emil pack is licensed and local: nothing from it is copied into the skill.

## Research (this folder)

- `research/01-leonardo.md` — materials, left-handed hatching, page composition, devices with Royal Collection folio numbers, his own method in Richter's translation, what pastiche gets wrong.
- `research/02-plates-and-manuscripts.md` — ruling and rubrication, glosses, Villard, volvelles and flap sheets, Vesalius, Agricola, Ramelli, Dürer, Hooke, the Encyclopédie, Byrne, patent rules.
- `research/03-modern-line.md` — Tufte, ISO 128 / 129 / 6433 / 7200, redlines and Figma selection, Neurath, Beck, explorable explanations, grids, annotation type.

## Decisions taken inside the skill (each reversible; flagged for the founder)

| Decision                           | Default taken                                                                     | Why                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Name                               | `kiruk-codex`                                                                     | Leonardo's notebooks are codices; "plate" is the unit of work                    |
| Colour rule                        | the ink is the thing; red (rubric `#b5462b`) is everything said about it          | the medieval "say the black, do the red" and the modern redline are the same act |
| Line colour                        | rubric red, not ultramarine                                                       | open question from the blend round; red has the tradition behind it              |
| Type                               | IM Fell (old hand) · Xanh Mono (typescript bridge) · JetBrains Mono (line labels) | carried from the blend round; "TypeScript" read as typescript until confirmed    |
| "Slightly broken" on the line side | whole line layer ≤ 1.5 px off register, never rotated, plus register crosses      | a rotated layer would stop line ends landing on what they explain                |
| Ink                                | warm near-black on clean paper; never aged                                        | the ink was black when new; age is damage                                        |

## Open (founder)

- Review the skill (start with `SKILL.md`, then the test plate).
- Confirm or change: name, rubric vs ultramarine, "TypeScript" meaning, the type trio.
- Delete or keep the parked blend prototypes.

## Test

A fresh agent with only the skill builds `plates/plate-01-dawn/` (why the sky lights before sunrise; Arun = dawn), runs the checks, and reports where the skill was unclear. Its feedback goes into the skill before the founder sees it.

## Test results (2026-10-20)

| Round | Plate I state                                                                                  | What it taught the skill                                                                                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | passed every check; "a careful textbook diagram with nice colour washes, not a Leonardo sheet" | the line-end check could not fail (paper background counted); constant-width lines and even hatching read as plotted; boxed studies read as UI; the rise limit of 50% let a centred sheet pass; no guidance for exaggerated scale |
| 2     | passes at rise 42%; "clearly a hand, not a textbook… short of the founder's quality bar"       | ring vs disk sampling; terminators tested as lines; `quill()` gaps on closed shapes; `hatch()` core option                                                                                                                        |

What still holds Plate I below the bar (from the builder's own judgement): ruled parallel rays read stiff, the scattering bursts look like asterisks, the molecule like a sea urchin, the lower sheet is empty. The honest next step up is the founder's own pen over it, or a hand reference for the bursts and the air.

## Founder direction, 2026-10-20 (second note)

> "When we look at the incident icon, or any icon, there are several aspects to consider: scaling, concept (idea), color, line weight/style, shape/form… Since we are working digitally, we need an interactive, intuitive presentation rather than a static print. If text appears on a top layer with elements beneath, we must convey depth and opacity."

Became founder rule 10 and three references: `marks.md`, `depth.md`, `live.md`; the layer-stack device; `check.mjs` checks every interactive state. Not yet tested on a real mark plate.

## Plate II test (2026-10-20)

Logogram anatomy as a live layer stack: passes check.mjs in 11 states at both widths; "a precise instrument with a light hand, not yet a hand". Found: the 16 needles, 4 spears and 4 points all sit on one 15° dial; at 16 px no pixel is solid and the hole shuts (opens at 32 px). ~30 skill-feedback points in its NOTES.md; ledger rows KC-19, KC-20 record the fixes still pending. Founder questions: which part is "the line = support"? Is there a sketch of the mark?
