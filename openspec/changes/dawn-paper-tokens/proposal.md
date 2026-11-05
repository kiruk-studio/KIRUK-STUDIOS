# Proposal: dawn-paper-tokens

## Why

studio.kiruk.in's landing is a single engraved plate: an eye cut line by line by the burin engine, printed onto paper the engine makes too. It needs two papers, and the founder chose them by name:

- **Dawn Light** `#fadfa9`: "Soft morning glow, when darkness starts to lift and yellow seeps in." This is the **old paper**, the sheet the hand drew on. It takes iron-gall ink and it carries its years.
- **Dawn Departs** `#ccffff`: "Morning's first pale breath, the blue before sunrise." This is the **new paper**, the sheet the code draws on. It takes navy ink, crisp, with no age.

(Names and taglines are from names.color.pizza.)

Arun means dawn. The studio works in the hour between the hand and the code, so the plate offers both sheets. The eye and its lines stay the same; the paper changes, and each paper carries its own ink. When the sheet changes, the new paper comes in as a front, the way water wicks into a sheet. It is not a fade, so there is never a muddy middle colour.

The colours already exist as working values in `apps/kiruk-studio` (`eye.css`, `dawn.ts`) and as shader constants in `@kiruk/burin`. Non-negotiable #5 says no token ships without a requirement. The current `design-tokens` spec also does not have room for them:

- The base `color` group is a **monochrome** paper and ink: white `#FFFFFF`, black `#0A0A0A`, and a grey pencil ramp.
- Semantic UI tokens MUST resolve only to that base.

The dawn papers are low-chroma tints, not the saturated "absurd" asset colours. But they are surfaces, and the plate's rubric red is used for measures and numbering. Both would break the current rule if they became tokens without a spec change.

## What changes

### Modified capability: `design-tokens`

- **Added** _Dawn paper pair_. `color.dawn.*` holds two papers and two inks. Papers are limited to OKLCH chroma ≤ 0.08 and L ≥ 0.9. Each paper is used only with its own ink, at a contrast of at least 7:1. The meaning of each is recorded in `$description`.
- **Added** _Rubric is for measure_. `color.dawn.rubric` and `color.dawn.rubric-line` are the rubricator's red. They are for measures, numbering, construction lines and the selected state. They are never used for body copy or surfaces.
- **Modified** _Absurd-color asset boundary_. Semantic UI tokens still resolve to the monochrome base, with one exception: a `color.sheet.*` semantic group may resolve to the dawn pair. That group is for surfaces that are drawn as paper, such as the engraved plate and its instrument. The absurd group is unchanged and stays asset-only.

The monochrome base (`paper`, `ink`, `pencil-*`) is **not** changed. White paper and black stroke remain the default interface. The dawn pair is a scoped theme, not a new base.

### Modified code

- `packages/design-system/tokens/core.json`: add `color.dawn` with `light`, `departs`, `iron-gall`, `navy`, `rubric` and `rubric-line`.
- `packages/design-system/tokens/semantic.json`: add `color.sheet.old.{paper,ink}`, `color.sheet.new.{paper,ink}`, `color.sheet.rubric` and `color.sheet.rubric-line`.
- `apps/kiruk-studio/src/app/(site)/eye.css`: the page's dawn custom properties cite the tokens they mirror. The studio does **not** import the token CSS yet, for two reasons. First, `tokens.css` sets `--font-mono` at `:root`, which collides with the studio's next/font variable. Second, `turbo build` never runs `tokens:build`, so `build/` is missing on a fresh clone. Both need fixing first; see tasks.
- `packages/burin/src/paper/paper.ts` and `src/core/renderer.ts`: the shader constants cite the tokens. The GPU cannot read CSS, so the values are mirrored, and the requirement names the mirror.

## Impact

- **Specs touched:** `design-tokens` (2 added, 1 modified).
- **Artifacts to regenerate:** `packages/design-system/build/**` via `pnpm tokens:build`.
- **Risk:** this opens the semantic layer to a non-mono group. The opening is narrow: only `color.sheet.*`, only for paper-drawn surfaces, and only with chroma and contrast limits. The modified scenario rejects `color.sheet.*` on general UI chrome.
- **Downstream:** the studio plate and any future engraved surface, such as case-study plates and story-drop sheets, can choose old paper or new by token.

## Deltas

See `./specs/design-tokens/spec.md`.
