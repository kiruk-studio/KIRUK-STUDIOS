# Styles: historic manners as numbers

A style is a starting point measured from sources, never a costume. The critic fails a plate that uses a style's look without its reasons.

The source of truth is `src/styles/styles.ts`; this page explains it. To add a style, use [`/kiruk-mai-style`](../../../.claude/commands/kiruk-mai-style.md).

| Style          | Paper             | Ink line (role → instrument, ink)                | Construction                                  | Hatch rule · slope · gap · reach · cross                    | Hand                                       | Envelope (width CV · tremor) |
| -------------- | ----------------- | ------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ | ---------------------------- |
| `codex`        | Dawn Light        | quill, iron-gall                                 | stylus (blind); sanguine underdrawing         | one-slope · 45° "\\" ±16° · 0.55–1.25 mm · 6 mm · no        | left, tremor 0.024                         | 0.16–0.75 · 0.004–0.05       |
| `construction` | cartridge         | graphite                                         | graphite, lighter                             | one-slope · −50° ±25° · 0.7–1.6 · 9 · yes at 0.6 (70°)      | right, pace 160                            | 0.08–0.6 · 0.003–0.05        |
| `cosmograph`   | cartridge         | graphite                                         | graphite compass                              | per-form · 40° · 0.6–1.2 · 6 · yes at 0.55                  | right                                      | 0.08–0.6 · 0.002–0.05        |
| `architect`    | rag               | steel, sepia                                     | graphite                                      | per-form · 90° · 0.5–1.1 · 30 · yes at 0.72                 | right, drift 0.004                         | 0.12–0.7 · 0.003–0.045       |
| `engraver`     | rag               | burin, carbon                                    | stylus                                        | per-form · 30° · 0.4–0.9 · 40 · yes at 0.6                  | right, tremor 0.006                        | 0.25–1.1 · 0–0.02            |
| `dawn-new`     | Dawn Departs      | steel, navy                                      | blueprint pencil                              | one-slope · −45° ±18° · 0.55–1.2 · 7 · yes above 0.70 (90°) | right, tremor 0.016                        | 0.12–0.75 · 0.003–0.045      |
| `night`        | Night (`#1D1C2D`) | steel, departs (contour, hatch, stipple, letter) | chalk (construction, underdrawing, searching) | one-slope · −45° ±18° · 0.6–1.3 · 8 · never                 | right, tremor 0.014, drift 0.004, pace 120 | 0.1–0.7 · 0.002–0.04         |

Every style puts dimensions, leaders and the overlay in the **rubric ruling pen**, crisp, except `architect` and `construction`, which rule their dimensions by hand in the drawing's own ink, and `night`, which rules them crisp in the ruling pen with departs ink. Lettering is 2.5 mm in every style but `night`, which letters at 3 mm.

**The rubric pair.** The red is two inks, after the tokens: lines in `rubric` (color.dawn.rubric-line `#B5462B`: rules, guides, leaders, never text) and values in `rubric-type` (color.dawn.rubric `#983A22`: type that measures and numbers). `rubric` names `rubric-type` as its `typeInk`, so `valueInk(plate, role)` letters a value in the type twin; `type.value-ink` fails a value lettered in the line red (ledger MA-17). `restyle(style, { ink, paper })` moves a manner to another sheet: the drawing roles change ink, and construction and the rubric overlay keep theirs. Plate III puts `architect` on Dawn Light with iron-gall, because Dawn Light takes iron-gall (design-tokens: Dawn paper pair).

## Where the numbers come from

- **codex.**
  - Iron-gall and the quill's taper, variable weight and hook returns (research 01 §1).
  - The left hand's "\\" slope, with hatching only where the form needs it and no cross-hatching everywhere (01 §1, R10).
  - Construction only as a lighter layer that generated the drawing (01 R11).
  - The light from the upper left at 45° (02 §11).
  - The 45° slope and the 0.55–1.25 mm gaps are WORKING VALUES; the research gives no degree for Leonardo's slope.
- **construction.** ISO 128 line types: construction narrow, outline wide (03 §2.1). Slope and gaps are WORKING VALUES, measured from the founder's perspective-study reference, which is not committed.
- **cosmograph.** The rota: a ring is a kind, a sector a group, and opposites sit across the centre (02 §1.6).
- **architect.**
  - Line weight runs outline > interior > construction (02 R14).
  - A different hatch angle for each adjacent part (02 §11 R9).
  - Dimensions: extension line gap ≈ 1.5 mm, overshoot 2.5–3 mm, first tier 10–12 mm out (03 §2.2).
- **engraver.** Width is the tone; a line enters thin, swells and leaves thin (`@kiruk/burin`, vector/burin.ts).
- **dawn-new.** Dawn Departs takes dawn navy; construction is in blueprint (design-tokens: Dawn paper pair; burin). Hatching is one slope at −45° (±18°), gaps 0.55–1.2 mm, a reach of 7 mm, crossed at 90° only where the tone runs above 0.70.
- **night.** The nightminds: light lines on the earth band of the dawn (`ideas/studio-dawn/dawn.md`). The sheet is color.dawn.navy `#1D1C2D` as paper and the ink is color.dawn.departs `#CCFFFF`, so no new token. A careful technical hand: hidden lines dashed, axes as chain lines named at both ends, construction in white chalk, hatching never crossed. Drawn from the founder's reference of 2026-11-05 (an axis sphere in white on black); Plate IV uses it. **Founder decision pending:** whether the studio has a night paper at all (`eye.md` open question 8).

## The founder's five references (shared 2026-11-05), mapped

| Reference                                              | Nearest style                   | What it adds                                                       | What stays out                                                                                                  |
| ------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Leonardo's codex page: the eye and light rays, red ink | `codex`                         | Optics diagrams, notes in columns beside small figures             | Mirror script without a readable twin (01 R9)                                                                   |
| Perspective construction of an eye ("INTENTO")         | `construction`                  | Numbered points, vanishing points, searching ellipses, scale ticks | —                                                                                                               |
| Cosmographic wheel in graphite                         | `cosmograph`                    | Nested compass circles, tonal graphite, an inscription             | —                                                                                                               |
| Vitruvian collage with a golden spiral                 | none (a collage)                | φ constructions, an axis split                                     | The golden spiral as a badge: the critic fails ornamental geometry (01 §5). Photos and collage density (01 §5). |
| Corinthian column on stained paper                     | `architect` (+ `engraver` tone) | Dimensioned orders, hatching that follows the form, modules        | The stains, unless a plate states why it is shown as found                                                      |
