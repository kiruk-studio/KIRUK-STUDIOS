---
plate: I
title: The light before the sun
status: draft (kirukal stage, ideas/), built as a test run of the kiruk-codex skill exactly as written
date: 2026-10-20
skill: .claude/skills/kiruk-codex (SKILL.md, steps 1–12; step 13 recorded below, not written to the skill)
files: index.html (the plate, self-contained apart from Google Fonts), truth.json (every number and its source), shots/ (written by check.mjs)
---

# Plate I · The light before the sun

**Size (SKILL.md "Size it first"):** a **Plate**. Subject + construction + three satellites + notes + key + line layer, about 2–4 h. Announced here because the founder was not available for this test.

**Request:** "Explain why the sky lights up before the sun rises — dawn. Arun means dawn in Tamil, so this plate opens kiruk's writing on the studio's name. Hero Plate for studio.kiruk.in."

## 1 · Claim

> **The sky lights up before sunrise because sunlight the Earth still hides from you already reaches the air high above, and that air scatters it down to your eye.**

The verb is _reaches … and scatters down_. Two mechanisms, both needed: geometry (the high air is above the Earth's shadow) and scattering (air throws light every way, some of it down).

## 2 · Truth (summary; sources in `truth.json`)

| Fact                                                                                                                                   | Value                     | Source                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------- |
| Twilight is sunlight scattered by the upper atmosphere; civil / nautical / astronomical begin at sun-centre depressions 6° / 12° / 18° | 6, 12, 18°                | USNO, aa.usno.navy.mil/faq/RST_defs               |
| Sunrise is computed at the sun's centre 50′ below the horizon (34′ refraction + 16′ radius)                                            | 0.8333°                   | USNO                                              |
| Earth's mean radius                                                                                                                    | 6371.0 km                 | NASA Earth Fact Sheet                             |
| Bengaluru, 20 Oct 2026: astronomical 4:59, nautical 5:24, civil 5:49, sunrise 6:10 (bearing 100°), sun 92.570 million mi away          | —                         | timeanddate.com                                   |
| Height of the shadow's edge straight over the observer, h = R(sec d − 1)                                                               | 328 / 142 / 35 / 0.7 km   | derived from R                                    |
| Ground distance to where the sun stands on the horizon, R·d                                                                            | 2001 / 1334 / 667 / 93 km | derived                                           |
| Share of the air's mass below 35 km                                                                                                    | 99.5% (so 0.5% is above)  | pdas.com atmosphere mass table                    |
| Drawn top of the air (convention, not an edge)                                                                                         | 100 km                    | pdas.com                                          |
| Rayleigh scattering ∝ λ⁻⁴; visible light 380–700 nm, so (700/380)⁴                                                                     | 11.5 : 1                  | Britannica; AMS Glossary; NASA visible light      |
| Air mass at the horizon vs overhead                                                                                                    | ≈ 38 : 1                  | Kasten & Young 1989                               |
| Zenith twilight blue: about ⅔ ozone absorption, ⅓ scattering, sun on the horizon                                                       | —                         | Hulburt 1953; Lange et al. 2023                   |
| Earth's shadow: blue-grey band opposite the sun before sunrise, rose band (Belt of Venus) above it                                     | —                         | WMO Cloud Atlas                                   |
| Adult eye axial length about 22–24 mm (drawn at 24 mm)                                                                                 | 24 mm                     | Benzir et al. 2022 (PMC9536359)                   |
| Arun means dawn (founder); Sanskrit aruṇa, red, ruddy; Aruna, charioteer of the sun, the red glow of the rising sun                    | —                         | ideas/studio-dawn/dawn.md; Wikipedia; vyasaonline |

Left off because I could not source it in time: the Bay of Bengal under C (it is there by bearing and distance, but I had no sourced coastline position), crust thickness, ozone-layer heights.

## 3 · Object: three candidates (shown here instead of to the founder)

Walked masters.md lenses 1 (Leonardo: what real thing does this?), 4 (Agricola: what does this work in a trade?) and 5 (Hooke: what familiar thing has this shape?), across different domains.

**Candidate 1 — The Earth's edge in section (sky / cosmography).** A slice through the Earth and its air on the plane through the observer and the sun.

| Object part                                                   | Idea part                                          |
| ------------------------------------------------------------- | -------------------------------------------------- |
| sun below the observer's horizon                              | "the sun has not risen"                            |
| the Earth's curve                                             | what hides the sun from you                        |
| the ray that grazes the ground at one point                   | the last sunlight that clears the curve            |
| air above that ray                                            | "the air high above already in sunlight"           |
| air below that ray                                            | the Earth's shadow: still night where you stand    |
| a molecule in the lit air                                     | "scatters it down"                                 |
| the observer's eye                                            | "to your eye"                                      |
| the shadow's edge sinking over the observer as the sun climbs | "before sunrise", in stages (astronomical → civil) |

Every part maps; nothing left over. A stranger names it in three seconds ("the Earth, the sun, rays").

**Candidate 2 — A mountain peak at dawn (land / alpenglow).** The summit glows pink while the valley is dark.

| Object part                            | Idea part                                   |
| -------------------------------------- | ------------------------------------------- |
| lit summit                             | high air in sunlight                        |
| dark valley with a watcher             | you, in the Earth's shadow                  |
| shadow line sliding down the slope     | the shadow's edge sinking as the sun climbs |
| pink of the peak                       | reddened grazing light                      |
| — (rock reflects; it does not scatter) | **no part for "scatters it down"**          |

Instantly nameable and lovely, but it is an analogy for a cousin effect (alpenglow), and the key mechanism, scattering by air, has no part.

**Candidate 3 — A lantern behind a garden wall on a misty night (workshop / optics).**

| Object part                                                      | Idea part                 |
| ---------------------------------------------------------------- | ------------------------- |
| lantern behind the wall                                          | the sun below the horizon |
| the wall                                                         | the Earth's curve         |
| mist above the wall, glowing                                     | the high air, lit         |
| the wall's shadow in the mist                                    | the Earth's shadow        |
| a person in front of the wall who sees the glow but not the lamp | you at dawn               |
| raising the lantern                                              | the sun climbing          |

Every part maps and it is nameable, but it is a stand-in for the sky, and the sky is kiruk's own object here (dawn, Arun).

**Pick: Candidate 1, the Earth's edge in section.** It is the real thing doing the claim (masters.md's own example row for this claim says "literal: draw the real optics"), every part maps one to one, its numbers can be true rather than illustrative, and it is kiruk's own object: the dawn, and an eye at the observer.

## 4 · Devices (devices.md decision tree)

- _What must the reader understand that looking won't show?_ → **what is inside it, one plane explains it → SECTION**: the slice through Earth and air on the plane through the observer and the sun.
- _The claim's verb is "lights up **before** the sun rises"_ → **how it changes, in steps or over time → SEQUENCE** (satellite H: 18°, 12°, 6°, sunrise; pose, scale and line positions fixed; ordinals 1st–4th).
- Construction (the contract's layer) and the magnified details (G, F) are satellites, not counted as devices; see Skill feedback for why this was a judgement call.

Drawing decision forced by the truth: at true scale the lit layer over F is 35 km against a 6371 km Earth, so nothing reads and nothing rises. The section is drawn as a **geologist's section**: heights stretched ×6.5 against distances (desktop; ×7.2 phone, ×2.7 in H). An affine stretch keeps rays straight and keeps the ray tangent at C, but makes drawn angles steeper, so the 6° value is underlined and the sheet says so in words, with two scale bars.

## 5 · Parts list (subject ≥ 12) and key

Subject (the slice): 1 sun (A), 2 parallel sunbeams (the thin layer of rays), 3 grazing ray (B), 4 touching point C (sun on the horizon there, 667 km east), 5 day-side ground east of C, 6 the Earth's surface arc, 7 the crust's cut face (45° hatching in three thinning passes), 8 the observer's eye F, 9 F's horizon (construction), 10 F's zenith (construction), 11 the lit air D, 12 the Earth's shadow E, 13 the drawn top of the air at 100 km (construction arc), 14 scattering bursts in the lit air, 15 scattered light down to F, 16 the slice's two cut radials, 17 light past the top of the air (soft ink: goes on unseen), 18 the line from F to the sun (construction).

Satellites (15–25% of the subject): **H** one dawn in four states (top band, rising row); **G** one molecule of air with a 380 nm and a 700 nm wave at true ratio, the long wave passing on, 11 short wavelets and 1 long one thrown out, tally 11½ : 1 (molecule not to scale); **F** the eye at F in section (cornea, lens, iris, optic nerve, shaded crescent), scattered rays focused on the retina, 10 mm bar from the 24 mm axial length.

Key: A the sun · B the grazing ray · C where it touches the ground · D the lit air · E the Earth's shadow · F the eye (observer) · G a molecule of air · H the same dawn in four states. On the phone sheet G is not drawn, so its key entry is hidden there and its note is unlettered.

Line layer (rubric, 1 px, shifted 1.2/−0.8): one selection (LIT AIR, 35–100 km), the 35 km dimension, the 6° angle (underlined), the 667 km arc dimension, leaders to B, C, E, F, the two wavelength dimensions and the tally on G, the 10 mm bar on F, the shadow-height ticks in every H panel, two scale bars, register crosses.

## 6–9 · Composition, ink, line, words (what I did)

- Sheet 1440 × 900; rising axis = the grazing ray at 34° (true 6°, ×6.5). Phone recomposed at 390 × 720: subject + H only, the claim set as words under the drawing in the SVG, notes and key as HTML at 16 px.
- Colour: ink is the thing; rubric is everything said about it; the dawn wash is the prepared ground, plus warm glow over the lit air, a rose edge along the grazing ray (lowest rays are reddest), and the one wash inside the subject (lavender night) over light left-handed hatching.
- No blooms: pen.md says ask the founder for a reference first, and he was not available.
- Type: IM Fell English / SC / Double Pica for notes, title, letters; Xanh Mono for the claim; JetBrains Mono for line labels and colophon.
- Not built: live behaviour (step 11, not asked).

## 12 · Verification

### Final `check.mjs` output (exit 0)

```
desktop · 1440×900 · reduced motion
ok   layers: wash 2 · construction 2 · ink 2 · letters 2 · line 2 · notes 5
ok   subject: one [data-subject] inside the ink layer
ok   eye motif: 2 [data-eye]
     weights: construction 0.50–0.50px · ink 0.90–2.30px · line 1.00–1.00px
ok   modern line is a hairline: heaviest 1.00px (≤ 1.25)
ok   the pen carries the weight: heaviest ink 2.30px (≥ 2, twice the line)
ok   construction stays faint: heaviest 0.50px (≤ 0.8)
ok   modern line is one hue: 1 (#b5462b #983a22)
ok   line ends: 0 of 108 float
ok   notes stay off the subject: 0 run(s) over it
ok   smallest text 11.5px "0" (≥ 11)
ok   no mirror writing: 0 mirrored run(s)
ok   fonts loaded: IM Fell English, JetBrains Mono, IM Fell English SC, IM Fell Double Pica, Xanh Mono
ok   modern-line labels: 9 (≤ 9)
ok   no sideways scroll at 1440px (page 1440px)
ok   contrast: 0 run(s) under the floor · tightest 4.81:1 "B" on #e6d2b7
ok   rise: ink weight sits at 48% of the height (≤ 50%)
ok   rise: 8% of the ink in the bottom third (≤ 25%)
ok   console: clean

phone · 375×812 · reduced motion
ok   layers: wash 2 · construction 2 · ink 2 · letters 2 · line 2 · notes 5
ok   subject: one [data-subject] inside the ink layer
ok   eye motif: 2 [data-eye]
     weights: construction 0.48–0.48px · ink 0.87–2.21px · line 1.00–1.00px
ok   modern line is a hairline: heaviest 1.00px (≤ 1.25)
ok   the pen carries the weight: heaviest ink 2.21px (≥ 2, twice the line)
ok   construction stays faint: heaviest 0.48px (≤ 0.8)
ok   modern line is one hue: 1 (#b5462b #983a22)
ok   line ends: 0 of 34 float
ok   notes stay off the subject: 0 run(s) over it
ok   smallest text 11.1px "heights ×7.2 · east is left" (≥ 11)
ok   no mirror writing: 0 mirrored run(s)
ok   fonts loaded: IM Fell English, JetBrains Mono, IM Fell English SC, IM Fell Double Pica, Xanh Mono
ok   modern-line labels: 4 (≤ 9)
ok   no sideways scroll at 375px (page 375px)
ok   contrast: 0 run(s) under the floor · tightest 5.19:1 "C" on #e8dbc9
ok   rise: ink weight sits at 46% of the height (≤ 50%)
ok   rise: 5% of the ink in the bottom third (≤ 25%)
ok   console: clean

crops: 11 at 4x · shots in ideas\kiruk-codex\plates\plate-01-dawn\shots\index

all checks passed
```

Exact rise (same method, my own run, because check.mjs rounds): desktop 48.4% / 7.5% bottom third; phone 46.5% / 4.7%.

**How honest is "line ends: 0 float"?** Not very: I put a line ending in empty paper into a copy of this plate and the check still said 0 floats, because the full-sheet paper rect in the wash layer counts as a landing (see Skill feedback 1). Every leader and dimension end was therefore checked by eye in 4× crops instead.

### Crops read

- The 11 crops check.mjs writes: all ten "end" crops are the small rubric ticks in the H panels (the first ten line ends in DOM order), the eleventh is the subject's box centre. Read: ticks sit on their rays within the ~1–2 px the off-register shift plus pen displacement allow; the sunrise panel's tick sits at F as intended.
- Because those crops never reach the important marks, I rendered extra 4× crops (scratch script, not part of the plate) of: the B, C, E, F leaders and their terminators, the 35 km dimension, the 6° label, the LIT AIR selection and tag, G, F's eye, the sun, the crust's cut end, the H row, and the phone sheet's middle. Fixed from them: selection box crossed by B (box now stops 7 px above B at its right corner, desktop and phone), a burst sitting on a selection handle, the eye's cornea bulging inward, the eye's hatching under the lens, the G tally crowding its label, the G note running into the eye's rays, E and F letters on hatching (moved out, with leaders), E/F leaders crowding on phone.

### Critic's round — last round (round 4; rounds 1–3 had fixes, listed below)

```
1 Leonardo · aspects: section shows the working; F (eye in section) and G (molecule) show receiver and mechanism; notes sit beside their parts → no fix
2 Villard/Dürer · rebuildable: F's horizon, zenith, line to the sun, top-of-air arc, both cut radials, two scale bars, heights ×6.5 stated → no fix
3 Vesalius · H holds pose, view and scale; only the sun's depression changes; ordinals 1st–4th; rubric tick in the same place in each → no fix
4 Agricola/Encyclopédie · every part the notes name carries a letter A–H, every letter is in the key; "O" no longer used anywhere on the sheet → no fix
5 Hooke · scale: section has 500 km and 20 km bars; H says heights ×2.7; G has 380/700 nm dimensions and says the molecule is not to scale; F has a 10 mm bar → no fix
6 Byrne · colour names nothing on its own: lit/night are also hatching vs none and letters D/E → no fix
7 Rubricator · red only says things about the black; ink finished before the line → no fix
8 Neurath · one claim: title + D note + the glow above the hatched night over the eye; counts are tally ticks → no fix
9 Tufte · nothing left to erase without losing a fact; the duplicate "heights ×6.5" in the colophon was cut in round 3 → no fix
10 Draughtsman · ink 2.3 px vs line 1 px; arrows on outlines, dots inside surfaces; every number traces to truth.json; title block present → no fix
11 Müller-Brockmann · notes on column guides at x 104, 452, 1114; scale bar now on the 1114 column → no fix
12 Ciechanowski/Victor · the one parameter is the sun's depression, already shown as H; the still plate is complete → no fix
13 Founder · rises: 48.4% / 7.5% (phone 46.5% / 4.7%) · dreamy yet clear: dawn wash, rose edge on the grazing ray, tightest contrast 4.81:1 · reads as "dawn" at a glance: yes, a thin layer of rays lighting the air over a dark eye · no costume, no split, no smoke → no fix
```

Earlier rounds' fixes: round 1 — F got a sourced 10 mm bar (Hooke), the D note now says the light past the air goes on unseen (Tufte: the soft rays stated no fact), scale bar moved onto the column (Müller-Brockmann); round 2 — H got its exaggeration (Hooke), the sheet now says what an underline means (draughtsman); round 3 — duplicate exaggeration removed from the colophon (Tufte). Before round 1: "O" in the notes named a point with no mark on the sheet (Agricola), so every note now says F.

### Not done (the skill's Done list)

- The founder has not seen the plate and has not answered "does it read as _dawn_ at a glance?" (test condition: founder unavailable).
- Nothing written to `learnings.md` (test condition: the skill folder is read-only). The rows I would have added are below.

## 13 · Learnings that would be rows in learnings.md (not written)

| Would-be ID | What happened                                                                                              | Kind      | Root cause                                                                                                                                                                   | Would become                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| KC-9        | First build: 48 line ends "floated" and the console showed `"280.70.5"` coordinates.                       | miss      | Half-pixel snapping written as `f(v) + 0.5` where `f` returns a string, so `+` concatenated.                                                                                 | A note in line.md: snap with a numeric helper.                                                                                |
| KC-10       | Rise failed three times (53%, 51%, then just over 50%) with the subject centred low and a long ray bundle. | miss      | A section's tangent point lies as far below the observer as the lit layer is above it, so a true section sinks; rays drawn across the whole sheet put half their weight low. | Composition guidance for curved/sectioned subjects: start rays at the section's cut, lift the observer, keep the crust light. |
| KC-11       | Letters E and F failed contrast (4.34–4.49:1) on the hatched night wash.                                   | miss      | Letters placed on hatching, against devices.md's own rule.                                                                                                                   | Already a rule; the check caught it.                                                                                          |
| KC-12       | The line-end check passed a line deliberately ending in empty paper.                                       | check gap | The full-sheet wash rect counts as a landing.                                                                                                                                | Fix check.js (see feedback 1).                                                                                                |

## Skill feedback

Ordered by how much each cost or risked. File, then what would have helped.

1. **`scripts/check.js` — the line-end check cannot fail on a normal plate.** `document.elementsFromPoint` returns the full-sheet paper rect in the wash layer, which is "a shape in a data-layer", so every end lands. Proven: a 100 px rubric line ending in empty paper (in a scratch copy) still gave "0 of 110 float". pen.md requires that paper rect, so the check gives false confidence on every plate. _Helps:_ exclude `wash` (and probably `construction` and `notes` boxes) from landings, or require the hit shape to be within 2.5 px of its painted stroke/edge rather than inside a fill.
2. **`scripts/check.mjs` — the 4× crops miss the marks that matter, and old crops are never cleared.** It crops the first ten line ends in DOM order; on this plate all ten were the tiny ticks in satellite H, and none touched a leader, dimension, selection or letter. The "subject" crop is the subject's bounding-box centre, which landed on empty hatching because the subject includes long rays. Stale `crop-NN-FLOAT.png` files from earlier runs stayed beside new ones. _Helps:_ crop every `[data-end]` terminator and every letter (or let the author mark `data-crop`), crop selections, and empty `shots/<name>/` at the start of each run. I had to write my own crop script to do step 12 honestly.
3. **No guidance for exaggerated scale or curved subjects (`composition.md`, `pen.md`, `line.md`).** Anything about the Earth, the atmosphere, geology or orbits needs a stretched axis; at true scale this plate is a hairline. Then three rules collide: "the ground is a band no taller than 12%" (a curved section's ground is a dome; the tangent point sits as far below the observer as the lit layer sits above it, so the rule cannot hold literally), "construction lines are true arcs drawn with ruler and compass" (a stretched circle is an ellipse), and angle values become false on the drawing. _Helps:_ a short section on exaggeration: state ×N on the sheet, give two scale bars, underline angles, keep the stretch affine so straight stays straight and tangents stay tangents; and say what "ground band" means for a curved ground.
4. **`masters.md` — the example row for this exact claim leans the wrong way.** "The sky lights before the sun shows because light **bends** and scatters through air." Refraction lifts the sun only about 34′ (USNO); the cause is that the high air sits above the Earth's shadow and scatters. An agent following the example would build the plate around bending. _Helps:_ "because the high air is still in sunlight and scatters it down".
5. **`SKILL.md` Files table — `examples/` does not exist.** "Before step 6: open the closest finished plate and copy its structure" could not be done; I had to invent the structure (folder, NOTES, truth embedding). _Helps:_ one finished example plate, or remove the row.
6. **No plate folder contract (`SKILL.md`, `verify.md`).** Where truth.json lives, what NOTES.md holds, how a self-contained page "reads from truth.json" when `file://` blocks fetching it. I embedded a verbatim copy and kept it in sync with a script. _Helps:_ "embed truth.json as `<script type="application/json" id="truth">`; verify they match".
7. **`devices.md` "at most two devices" vs `SKILL.md` step 5 and `masters.md` lens 5.** A Plate requires 2–4 satellites "a detail, a section, a state, a variant", and Hooke requires magnified views; with a section and a sequence, any detail satellite is a third device, and the contract's mandatory construction layer is itself a listed device. _Helps:_ say satellites, magnified details and the construction layer do not count, or count them.
8. **`line.md` selection handles vs the one-hue check.** "Paper fill, 1 u rubric stroke" fails `modern line is one hue` (paper is a second hue) unless the handle carries `data-knockout`, which `verify.md` describes only for label backings. _Helps:_ say handles carry `data-knockout`.
9. **`line.md` off-register shift vs `verify.md` crop list.** Shifting the line layer up to 1.5 px plus the pen filter's ±0.9 px displacement makes ticks and arrowheads miss their ink by 2–3 px at 4×, which the crop checklist calls a fault ("a dot or tick misaligned with what it measures"). _Helps:_ state the tolerance (for example ≤ 2.5 px is the intended break; beyond is a fault).
10. **`pen.md` hatching for large regions.** "Each hatch is a short tapered mark, 8–28 px long" reads as rain or a printed pattern over a 300 × 300 px shadow; I used 64 px strokes. _Helps:_ a rule for large fields (longer strokes, wider spacing, or a wash with hatching only where form turns).
11. **`pen.md` "light comes from the upper left on every kiruk plate"** conflicts with a subject whose light source is part of the claim (here the sun is lower left, below the horizon). _Helps:_ say the convention is for form shading of objects, not the subject's own light.
12. **`pen.md` attributes the dawn palette to `ideas/studio-dawn/both-sides.md`.** It is in `dawn.md`.
13. **`composition.md` plate card: "Bottom left: the claim as a one-line caption."** A true claim in the step-1 form is 120–160 characters; it does not fit one line on the sheet beside a subject. I put it in the figcaption (desktop) and set it as words under the drawing on the phone sheet. _Helps:_ allow the claim under the sheet, or set a length limit for the claim.
14. **`composition.md` margins: "≥ 6% of the width clear on every side"** — 86 px top and bottom on a 900 px sheet (19% of the height). Unclear whether vertical margins are 6% of width or height, and how that squares with "corners and margins carry the frame". I kept drawing inside and frame items in the margins.
15. **Phone rule vs key rule (`composition.md` vs `devices.md`).** Dropping a satellite on the phone ("or are dropped") leaves a key entry with no letter on the sheet ("no key entry without a letter"). I hid G's key entry on phone. _Helps:_ say which wins.
16. **`scripts/check.mjs` prints rise rounded to whole percent.** During the build it printed "FAIL rise: … 50% (≤ 50%)" once (just over 0.5) and later "ok … 50%" at 49.95%. _Helps:_ one decimal.
17. **Text-dependent geometry needs fonts first.** Knockout rects sized with `getBBox()` before Google Fonts load are the wrong size; the skill never says to build them after `document.fonts.ready`.
18. **`SKILL.md` step 13 "a failed check becomes a row in learnings.md before anything else is done"** — while building, checks fail many times by design; learnings.md's own header says "a failed check at Close". _Helps:_ say "at Close" in SKILL.md too.
19. **`composition.md` target "subject's visual centre at 38–45% of the height"** is not checked; only the ≤ 50% ink centre is. This plate passes at 48.4%, which still reads centred rather than rising. _Helps:_ check the subject's centre too, or tighten the ink target.
20. **Plate number style.** composition.md shows `PLATE IV` in capitals and "small caps"; type.md sets it in IM Fell English SC. Writing "Plate I" in the SC face gives small caps; writing "PLATE I" gives full caps. Minor; say which.

---

# Second look (2026-10-20, under the updated skill)

The skill was revised from the first look's feedback. I re-read `SKILL.md`, `pen.md`, `line.md`, `composition.md`, `verify.md`, `type.md`, the new `check.js` / `check.mjs` and the new ledger rows (KC-9 to KC-14), then redrew the plate. Truth is unchanged; only drawing scales moved (`truth.json` → `drawing`).

## What changed in the skill that this plate had to meet

- **Drawn, not plotted** (`pen.md`, KC-13): every contour is a `quill()` outline whose width follows the light; shadows use the new `hatch()` (strokes land in the core and lift raggedly toward the light, a second darker pass at 55°); no constant-width contours, no SVG patterns.
- **Satellites never boxed**; a sequence shares one baseline (`composition.md`).
- **Rise ≤ 45% / ≤ 20%** in the bottom third, one decimal; subject-as-ground guidance; exaggerated-scale section; margins 6% of width and of height; the claim under the sheet; a dropped phone satellite takes its key entry.
- **Line ends** (`check.js`): the wash and full-sheet backgrounds no longer count as landings; `data-ext` for extension lines; leaders may stop 4 px from a word; terminators and ticks carry `data-end`; `data-quill`, `data-crop`.

The first-look plate failed the new check: 32 of 108 line ends floated (unmarked extension lines and ticks, the 380 nm dimension floating above its wave) and rise was 48.4%.

## What I changed on the plate

- **Ink rebuilt with the pen.md helpers, pasted verbatim.** The ground is one quill stroke lit by the sun's true direction, so it is thin on the day side and heavy into the night. The rays, the sun, the small eye at F, all three satellites and the crust's cut ends are quill strokes too. The night (E) is a lavender wash carrying the flat tone, plus two hatch passes (45°, then 55° in the core) that gather in the far west and lift toward the edge of the sunlight. The crust's cut face is hatched once at 45°, landing at the surface and thinning downward. Closed rings (sun, atoms, lens) are carried 30° past their start so the lifted ends overlap instead of gapping.
- **Recomposed for the rise.** Heights are drawn ×7.5 (was 6.5), the slice is narrower (2.5 km/px) and its working point is lifted (F at y 434, was 525). Rays start at the slice's east cut and, once past the air, run on for a short way in faint ink before the pen lifts. That last part is a true statement, now in the D note: nothing up there scatters the light. Desktop rise is **42.1%** (was 48.4%), with 8.8% of the ink in the bottom third.
- **Satellites unboxed and moved into the voids.**
  - **H** is now four studies on one baseline (F's horizon), top right, ordinals 1st–4th, heights ×2.9. The rubric mark is an arrow from F up to the shadow's edge. Where that edge is under 8 px above F at this scale (5:49 and sunrise), a ring round F marks it instead.
  - **F** (the eye in section) sits in the gap under the rising arm, straight below F. It looks east toward the glow, with its 24 mm axial length dimensioned.
  - **G** heads the right column.
- **Line layer re-laid.**
  - Every dimension has `data-ext` extension lines down to what it measures: 35 km, 667 km, 380 nm and 700 nm to the wave crest and trough they span, and 24 mm.
  - The H ticks became arrowheads, and the tally marks became filled 1 px marks.
  - B, C, E and F letters were re-placed. E's dot is computed onto a real hatch stroke. C sits at the foot of its own extension line, so no leader doubles the dimension. F sits in clear space beside the small eye.
  - Knockouts are sized only after the fonts load.
- **Phone recomposed the same way**: subject + H, the claim set under the drawing in the SVG, G's key entry and letter dropped on phone. Phone rise 44.1%.

### Final `check.mjs` output (exit 0)

```
desktop · 1440×900 · reduced motion
ok   layers: wash 2 · construction 2 · ink 2 · letters 2 · line 2 · notes 5
ok   subject: one [data-subject] inside the ink layer
ok   eye motif: 2 [data-eye]
     weights: construction 0.50–0.50px · line 1.00–1.00px · ink 0.90–2.60px
ok   modern line is a hairline: heaviest 1.00px (≤ 1.25)
ok   the pen carries the weight: heaviest ink 2.60px (≥ 2, twice the line)
ok   construction stays faint: heaviest 0.50px (≤ 0.8)
ok   modern line is one hue: 1 (#b5462b #983a22)
ok   line ends: 0 of 40 float
ok   notes stay off the subject: 0 run(s) over it
ok   smallest text 11.5px "0" (≥ 11)
ok   no mirror writing: 0 mirrored run(s)
ok   fonts loaded: IM Fell English, JetBrains Mono, IM Fell English SC, IM Fell Double Pica, Xanh Mono
ok   modern-line labels: 9 (≤ 9)
ok   no sideways scroll at 1440px (page 1440px)
ok   contrast: 0 run(s) under the floor · tightest 4.70:1 "F" on #ddd0c6
ok   rise: ink weight sits at 42.1% of the height (≤ 45%)
ok   rise: 8.8% of the ink in the bottom third (≤ 20%)
ok   console: clean

phone · 375×812 · reduced motion
ok   layers: wash 2 · construction 2 · ink 2 · letters 2 · line 2 · notes 5
ok   subject: one [data-subject] inside the ink layer
ok   eye motif: 2 [data-eye]
     weights: construction 0.48–0.48px · line 1.00–1.00px · ink 0.77–2.31px
ok   modern line is a hairline: heaviest 1.00px (≤ 1.25)
ok   the pen carries the weight: heaviest ink 2.31px (≥ 2, twice the line)
ok   construction stays faint: heaviest 0.48px (≤ 0.8)
ok   modern line is one hue: 1 (#b5462b #983a22)
ok   line ends: 0 of 26 float
ok   notes stay off the subject: 0 run(s) over it
ok   smallest text 11.1px "heights ×7.2 · east is left" (≥ 11)
ok   no mirror writing: 0 mirrored run(s)
ok   fonts loaded: IM Fell English, JetBrains Mono, IM Fell English SC, IM Fell Double Pica, Xanh Mono
ok   modern-line labels: 4 (≤ 9)
ok   no sideways scroll at 375px (page 375px)
ok   contrast: 0 run(s) under the floor · tightest 5.33:1 "A" on #ecddc9
ok   rise: ink weight sits at 44.1% of the height (≤ 45%)
ok   rise: 3.6% of the ink in the bottom third (≤ 20%)
ok   console: clean

crops: 14 at 4x · shots in ideas\kiruk-codex\plates\plate-01-dawn\shots\index

all checks passed
```

**Crops read** (all 14 from this run, plus my own 4× crops of the night, the lit air, the eye, G, H, the sun and the phone sheet):

- Every leader ends on its ink: B's arrow on B, E's dot on a drawn hatch stroke, F's letter beside the small eye.
- Extension lines stand clear of what they measure.
- No hatch spills, and no contour breaks: the sun's ring, which gapped where the quill lifted, now overlaps.
- Knockouts sit under every label that crosses rays or wash.

Fixed from the crops along the way:

- the "LIT AIR" tag sat 3 px from the 35 km extension line, so I moved it beside the box;
- a scatter burst sat under the tag;
- C's leader and the 667 km extension were drawn on the same line;
- F's leader ran 5 px alongside that extension;
- the 5:49 study's mark had shrunk to nothing;
- the phone's E dot crowded the 35 km label;
- the circles vanished (an SVG arc whose end equals its start draws nothing).

### Critic's round — last round (third of the second look; earlier rounds fixed the right-column grid, E's letter crowding G, the 5:49 mark, an empty stretch of lit air)

```
1 Leonardo · aspects: section shows the working; the eye section (receiver), the molecule (mechanism) and four states each show what the main view cannot; notes beside their parts → no fix
2 Villard/Dürer · rebuildable: F's horizon, zenith, line to the sun, top-of-air arc (an ellipse, declared), both cut radials, H's shared baseline; two scale bars and ×7.5 → no fix
3 Vesalius · H unboxed on one baseline, pose and scale fixed, only the depression changes, ordinals 1st–4th; the rubric mark sits at F in every study (arrow, or ring where the edge is within 8 px) → no fix
4 Agricola/Encyclopédie · every part the notes name carries a letter A–H, every letter keyed; phone drops G with its key entry → no fix
5 Hooke · section 500 km and 20 km bars + ×7.5; H ×2.9; G's waves at true ratio with 380/700 nm and "not to scale" for the molecule; F's 24 mm → no fix
6 Byrne · no colour names a part; lit and night are also hatching vs none and letters D/E → no fix
7 Rubricator · red only says things about the black; the rose edge on the grazing ray is wash, not rubric → no fix
8 Neurath · one claim: title + D note + the glowing band of rays over an eye still in night; counts are repeated marks → no fix
9 Tufte · nothing erasable without losing a fact; the seven scattered lines converging on F are the claim's last clause → no fix
10 Draughtsman · quill contours to 2.6 px against a 1 px line; arrows on edges, dots inside surfaces; every dimension has extension lines; every number traced to truth.json → no fix
11 Müller-Brockmann · left column on x 104, right column on x 1050 (H row, H note, G, G note, E note), F's note on its own guide beside its study → no fix
12 Ciechanowski/Victor · the parameter is the sun's depression, already H; the still plate is complete → no fix
13 Founder · rises 42.1% / 8.8% (phone 44.1% / 3.6%); dreamy yet clear, tightest contrast 4.70:1; reads as "dawn" at a glance; drawn, not plotted: no constant-width contour, no box, no even hatching → no fix
```

Still not done: the founder has not seen it, and nothing was written to `learnings.md` (skill folder read-only for this test).

## Skill feedback (second look)

1. **`scripts/check.js` — "within N px" samples only the centre and a ring at exactly N px.** `near()` checks the end point and 12 points on a circle of radius r, never the inside of the disk. Three consequences on this plate:
   - An extension line overshooting its dimension line by 7.5 px (line.md's "8 u") was missed by the r = 10 ring.
   - A 6° arc starting 0.55 px off a 0.5 px construction line was missed by the r = 3 ring.
   - An extension starting 3 u below a 0.8 px tilted ground was missed by the r = 6 ring.

   To pass I had to start extension lines about 6 px from the ink (not 3 u), overshoot by 8.7 or 10 px (not 8 u), place every hairline target exactly, and undo the register shift (`translate(1.2 -0.8)`) on ends that sit on thin ink. _Helps:_ sample the disk (radii 0…r) or measure distance to the shapes' geometry; then line.md's 3 u / 8 u and the 2.5 px off-register allowance hold as written.

2. **`scripts/check.js` — `data-end` ticks are still end-tested.** The loop excludes `[data-end]` only as landings; an open tick path with `data-end` must itself land at both ends. Tally ticks and end ticks therefore float, although line.md says ticks are terminators the check ignores. I replaced ticks with arrowheads and the tally with filled 1 px marks. _Helps:_ skip `[data-end]` in the line-end loop (closed arrowheads are already skipped), or say in line.md that ticks must touch ink at both ends.
3. **`pen.md` `quill()` gaps closed shapes.** It lifts both ends of every path, so a closed contour (sun, atom, lens) shows a gap where it starts — the fault the same page forbids ("never falls short and leaves a gap"). I drew rings 30° past their start. Separately, a one-arc circle path whose end equals its start renders nothing, and my circles vanished. _Helps:_ a `closed: true` option (no lift, wrap the samples), and a `ring()` helper beside it.
4. **`pen.md` `hatch()` on irregular regions.** Strokes start on the circle round the region's bounding box, so for a wedge like the night the inked heads land outside the clip and tone gathers at the region's far edge, not its core. Here that happens to be true (the far west is darkest), but a region whose core is central would come out empty. _Helps:_ say "pass a box round the core, not the whole region", or let `hatch()` take the clip polygon and start strokes on its edge.
5. **`line.md` selection tag "centred 6 u under the box" vs a dimension using that edge.** Under the LIT AIR box runs the 35 km extension line that measures the same thing; the tag sat 3 px from it. I set the tag beside the box. _Helps:_ "under, or beside when a dimension uses that edge".
6. **Half-pixel snapping vs measured ends.** `hp()` moved an extension 0.9 px off the wave crest it measures, and with the ring sampling that failed. _Helps:_ in line.md, snap the dimension line but place extension lines on the exact feature, or snap the ink too.
7. **`SKILL.md` step 7 "every region of the subject has something true to find at 4×"** is hard to meet for a large field of air. I added scatter bursts there, which is true but a little schematic. _Helps:_ one sentence on how to finish a large unbroken region truthfully (density marks that obey a stated law, repeated small studies, or leave it to the wash and say so).
