# Proposal: kiruk-logogram-primary

## Why

`brand-system` names `EyePrimary.tsx` as the studio's primary mark, but that component has only ever been a placeholder: a geometric circle, iris and pupil drawn in code while FOUNDER_DECISIONS B1 stayed open ("real logo still undesigned", 2026-05-26). The spec bends around that gap. The primary-mark requirement carries a "placeholder permitted while B1 open" clause, and `brand-consistency-ci` only checks mark identity as an advisory. The static export it promises, `packages/design-system/build/logos/primary.svg`, was never generated. The folder is empty.

The founder has now drawn the mark. The **KIRUK LOGOGRAM** is an eye-star: a four-point star whose long horizontal lobes close into an almond eye around a pupil, with lashes and four diagonal rays. It sits in Figma (file `Kiruk-Studios`, key `9mquJbxlhtJEpCVXP5vdjc`) as two 2000×2000 frames:

- **LIGHT**, node `47:295`: black ink on white paper.
- **DARK**, node `44:127`: white ink on black.

On 2026-10-17 the founder said to use it as the logo now, and it already ships in `apps/kiruk-web`. The untouched exports are in `public/brand/`, `favicon.svg` is a square cut of the same paths, `Logogram.astro` crops the frame down to the mark, and `SketchNav` uses it as the home link (see CHANGELOG, Unreleased). That is a change to the public brand contract that the spec does not yet describe. This proposal makes it durable truth: one canonical source in `@kiruk/design-system`, clear rules for the favicon cut and the dark variant, and a defined place for the old placeholder.

## What changes

### Modified capability: `brand-system`

- **Modified** _Primary eye-mark_. The primary mark is the KIRUK LOGOGRAM. The canonical source is the two verbatim Figma exports in `packages/design-system/brand/logogram/`, with provenance in `SOURCE.md`. A React wrapper, `EyeLogogram.tsx`, crops the frame and never re-types path data. Static copies in `build/logos/` are generated. App copies must be byte-identical to the source. The placeholder clause is removed. The logogram is a symbol only, so B2 (the custom wordmark) stays open and separate.
- **Modified** _Secondary eye-marks_. `EyePrimary` is demoted, not deleted. It is renamed `EyeCircle` and joins `EyeIris`, `EyeGaze`, `EyePortal` and `EyeConstellation` as a secondary mark. A deprecated `EyePrimary` alias stays exported until its last consumer moves. No secondary mark may stand in as the studio's identity.
- **Modified** _Palette derived from tokens_. The logogram artwork and the favicon are exempt from the no-hex rule, because standalone SVG files cannot read CSS custom properties. The favicon's literal ink values must equal `color.ink` and `color.paper`.
- **Modified** _Eye-motif test_. The logogram counts as a visible eye motif wherever it appears, including at favicon size.
- **Modified** _Light-only application_. Studio surfaces stay light-only. The DARK variant and the favicon's dark ink are allowed only where kiruk does not own the background: browser chrome, OS or social surfaces with a dark backdrop, and third-party dark placements. Neither adds a dark theme to any surface.
- **Added** _Logogram display crop_. Displays show the mark by cropping the frame around it (centred, 48% of the frame's width and 28% of its height). They never edit or re-export the source.
- **Added** _Favicon cut_. A square crop (`viewBox="500 500 1000 1000"`) of the DARK path data, copied unchanged. No background. The centre hole is a mask, not a painted fill. Ink follows `prefers-color-scheme`.

### Modified capability: `template-invoice`

- **Modified** _Eye-brand mark_. The invoice header renders the primary mark, `EyeLogogram`, not `EyePrimary`. The requirement already names the primary mark in spirit, so it follows the primary-mark change.

### Modified code (on apply)

- `packages/design-system/brand/logogram/`: new folder holding `kiruk-logogram-light.svg`, `kiruk-logogram-dark.svg` (moved from `apps/kiruk-web/public/brand/`, bytes unchanged), `favicon.svg` (the existing cut) and `SOURCE.md`.
- `packages/design-system/components/eye/EyeLogogram.tsx`: new crop wrapper, declared `// eye-motif: drawn`.
- `packages/design-system/components/eye/EyePrimary.tsx` → `EyeCircle.tsx`, plus a deprecated `EyePrimary` alias in `components/index.ts`.
- `packages/design-system/package.json`: `./brand/*` export.
- `scripts/build-tokens.mjs`: copy the logogram source into `build/logos/` (`primary-light.svg`, `primary-dark.svg`, `favicon.svg`).
- `apps/kiruk-web`: `public/brand/*` and `public/favicon.svg` become synced copies of the package source. `Logogram.astro` keeps its crop maths but cites the new requirement.

## Decisions for the founder

These are the recommended defaults the delta is written against. Flip any of them before apply and the delta changes with it.

1. **Is the logogram final, or "for now"?** This proposal resolves B1 and removes the placeholder clause. If the logogram is a working mark that may still be redrawn, keep B1 `[~]` and keep the clause, with the logogram as the documented derivative. The source layout and the favicon rules hold either way.
2. **EyePrimary: demote or retire?** The recommendation is to demote and rename it `EyeCircle`. It is the manifesto's "full circle" form, and the ink-hero shader takes its proportions from it. Retiring it would also mean rewriting the manifesto paragraph that lists five eye forms.
3. **Brand-CI identity check.** Once B1 closes, `brand-consistency-ci`'s "placeholder identity is advisory" clause no longer applies. Should a surface showing the studio identity be gated on `EyeLogogram`? This proposal leaves that to a follow-up change, so CI behaviour does not move inside a brand change.

## Impact

- **Specs touched:** `brand-system` (5 modified, 2 added) and `template-invoice` (1 modified).
- **Artifacts to regenerate:** `packages/design-system/build/logos/*` from the new source, by the build script. Nothing in `build/` is hand-edited.
- **On archive:** `brand-system`'s _Acceptance Artifacts_ list must name `brand/logogram/*`, `EyeLogogram.tsx`, `EyeCircle.tsx` and `build/logos/primary-{light,dark}.svg` + `favicon.svg`. Deltas cover requirements only, so this list is edited by hand.
- **Founder decisions:** B1 moves to `[x]` with the logogram (subject to decision 1). B2 is unaffected.
- **Risk:** two copies of the same SVG (package and `apps/kiruk-web/public/`) can drift. The byte-identical requirement plus a sync step closes that, and a mismatch fails the check instead of shipping silently.
- **Risk:** the crop ratios (48% × 28%) are measured off the current Figma frame. A redraw that changes the mark's bounds needs `SOURCE.md` and the crop constants updated together. The requirement records the coupling.
- **Not in scope:** the wordmark (B2), any colour or token change, and portal adoption of the mark. The portal picks it up through `EyeLogogram` when it next touches its header.

## Deltas

See `./specs/brand-system/spec.md` and `./specs/template-invoice/spec.md`.
