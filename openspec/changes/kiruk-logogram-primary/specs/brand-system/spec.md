# Delta: brand-system

## MODIFIED Requirements

### Requirement: Primary eye-mark

The studio MUST use the **KIRUK LOGOGRAM** (the eye-star mark) as its one primary mark.

Its canonical source MUST be the two Figma exports, kept byte-for-byte as exported, at:

- `packages/design-system/brand/logogram/kiruk-logogram-light.svg`: LIGHT, black ink on white, Figma `Kiruk-Studios` node `47:295`.
- `packages/design-system/brand/logogram/kiruk-logogram-dark.svg`: DARK, white ink on black, node `44:127`.

`packages/design-system/brand/logogram/SOURCE.md` MUST record the Figma file key, both node ids, the export date and the crop constants used by _Logogram display crop_.

The source files MUST NOT be hand-edited. A redraw is a fresh Figma export that replaces both files whole and updates `SOURCE.md` in the same commit.

The React entry point MUST be `packages/design-system/components/eye/EyeLogogram.tsx`. It displays the source asset under _Logogram display crop_ and MUST NOT re-type, simplify or recolour the path data.

Static copies MUST be generated into `packages/design-system/build/logos/` as `primary-light.svg`, `primary-dark.svg` and `favicon.svg` by the design-system build, never by hand.

Any copy of these files inside an app (for example `apps/kiruk-web/public/brand/` or `apps/kiruk-web/public/favicon.svg`) MUST be byte-identical to its package source.

The logogram is a symbol only. The custom wordmark (FOUNDER_DECISIONS B2) is a separate mark and is not part of this requirement.

#### Scenario: Studio identity resolves to the logogram

- GIVEN a surface that shows the studio identity (site nav home link, favicon, invoice header, social avatar)
- WHEN the mark it renders is traced to its source
- THEN it resolves to a file in `packages/design-system/brand/logogram/` or a byte-identical copy of one
- AND no other eye component stands in as the studio identity

#### Scenario: App copy drifts from source

- GIVEN `apps/kiruk-web/public/brand/kiruk-logogram-light.svg` whose bytes differ from `packages/design-system/brand/logogram/kiruk-logogram-light.svg`
- WHEN the brand check compares them
- THEN the check fails and names both paths
- AND the fix is to re-sync from the package source, not to edit either file

#### Scenario: Redraw replaces the source whole

- GIVEN the founder redraws the eye-star in Figma
- WHEN the new mark lands in the repo
- THEN both `kiruk-logogram-{light,dark}.svg` are replaced by fresh exports in one commit
- AND `SOURCE.md` records the new export date and any changed crop constants
- AND `build/logos/` is regenerated rather than edited

### Requirement: Secondary eye-marks

The studio MUST define ≥4 secondary eye-marks as React SVG components in `packages/design-system/components/eye/`, named `EyeCircle`, `EyeIris`, `EyeGaze`, `EyePortal` and `EyeConstellation`.

`EyeCircle` is the former `EyePrimary` placeholder (sclera, iris, pupil, highlight), kept as the manifesto's "full circle" form and as the proportion source for drawn-eye shaders.

`@kiruk/design-system` MAY keep exporting `EyePrimary` as a deprecated alias of `EyeCircle` until no spec or source file references it, and MUST then drop the alias.

A secondary mark MUST NOT be used as the studio's identity in place of the primary mark.

#### Scenario: Secondary mark catalog complete

- GIVEN the brand-system spec is marked v1-locked
- WHEN `packages/design-system/components/eye/` is listed
- THEN `EyeLogogram.tsx` exists as the primary mark
- AND ≥4 secondary component files exist (`EyeCircle` plus ≥3 of `EyeIris`, `EyeGaze`, `EyePortal`, `EyeConstellation`)

#### Scenario: Placeholder no longer stands in as the logo

- GIVEN a nav, favicon or document header rendering `EyePrimary` or `EyeCircle` as the studio identity
- WHEN reviewed against this spec
- THEN it fails
- AND the fix is to render `EyeLogogram` (or a byte-identical logogram asset) instead

### Requirement: Palette derived from tokens

The brand palette MUST be sourced from `packages/design-system/tokens/core.json` and `packages/design-system/tokens/semantic.json`. No hardcoded brand hex values are allowed outside these files, with two exceptions:

- The logogram source files in `packages/design-system/brand/logogram/` are founder artwork exported from Figma. Their colour values MUST be left as exported.
- A standalone SVG that cannot read CSS custom properties (the favicon cut) MAY carry literal ink values. Those values MUST equal the current `color.ink` and `color.paper` token values.

#### Scenario: Palette drift detection

- GIVEN a visual artifact using a brand color
- WHEN the color is audited against token build output (`packages/design-system/build/css/tokens.css`)
- THEN every color value resolves to a CSS custom property, not a raw hex
- AND the only raw values found are in the exempt logogram files

#### Scenario: Favicon ink matches tokens

- GIVEN `packages/design-system/brand/logogram/favicon.svg` with literal light-scheme and dark-scheme ink values
- WHEN they are compared with `color.ink` (`#0A0A0A`) and `color.paper` (`#FFFFFF`) in `tokens/core.json`
- THEN they are equal, ignoring case
- AND a token change that moves either value requires the favicon to move with it

### Requirement: Eye-motif test

Every visual artifact produced by the studio MUST contain a visible eye motif OR justify absence in its front-matter `eye-motif-absent-because:` field.

The KIRUK LOGOGRAM is an eye-star: its horizontal lobes close into an almond eye around a pupil, with lashes. Any artifact that shows the logogram at a size where the pupil is visible MUST be treated as containing the eye motif, favicon size included.

#### Scenario: Artifact passes eye-motif test

- GIVEN any rendered visual artifact under `kiruk-templates/*/output/` or `content/`
- WHEN reviewed
- THEN an eye motif is visually present
- OR the artifact front-matter includes a `eye-motif-absent-because:` justification

#### Scenario: Logogram alone satisfies the test

- GIVEN a surface whose only eye motif is the KIRUK LOGOGRAM (for example the browser tab favicon, or the nav home link)
- WHEN it is reviewed for the eye-motif test
- THEN it passes without an `eye-motif-absent-because:` field

### Requirement: Light-only application

All brand surfaces (web + artifacts) MUST default to light: white paper and black stroke. A dark-mode token set is NOT required and MUST NOT be assumed by components.

The logogram's DARK variant and the favicon's dark-scheme ink MAY be used only where kiruk does not own the background: browser tab and window chrome, OS or social surfaces with a dark backdrop, and third-party dark placements. Using them MUST NOT introduce a dark theme, a dark token set or a theme toggle on any studio surface.

#### Scenario: No dark-mode dependency

- GIVEN any brand surface or component
- WHEN rendered without a theme toggle
- THEN it presents on white paper with black stroke
- AND it does not depend on a dark-theme token set to be legible

#### Scenario: Dark variant on a background kiruk does not own

- GIVEN a browser whose chrome uses a dark colour scheme
- WHEN the kiruk favicon renders in the tab
- THEN its ink is white so the mark stays legible
- AND the studio page itself still renders light

## ADDED Requirements

### Requirement: Logogram display crop

Any component that displays the logogram (`EyeLogogram.tsx`, `apps/kiruk-web/src/components/sketch/Logogram.astro`, and any later wrapper) MUST show the mark by cropping the 2000×2000 source frame to a window centred on the mark. The window MUST be 48% of the frame's width and 28% of its height, the mark's bounds as recorded in `SOURCE.md`.

The crop MUST be done in the display layer (overflow window, `viewBox`, or CSS). The source file MUST NOT be re-exported or edited to remove the paper around the mark.

Wrappers MUST take the visible mark width as their size input and MUST be `aria-hidden` when an adjacent text label (such as the home link name) already names the studio. Otherwise they MUST carry an accessible label.

#### Scenario: Nav mark shows only the mark

- GIVEN `SketchNav` rendering the logogram at a visible width of 44px
- WHEN the rendered box is measured
- THEN it is 44px wide and about 26px tall (44 × 28 / 48)
- AND none of the empty paper around the mark is visible

#### Scenario: Crop constants follow a redraw

- GIVEN a new Figma export whose mark bounds differ from 48% × 28%
- WHEN it replaces the source
- THEN `SOURCE.md` and every wrapper's crop constants change in the same commit

### Requirement: Favicon cut

The studio favicon MUST be a square cut of the logogram at `packages/design-system/brand/logogram/favicon.svg`, built under these rules:

- **Paths:** path data copied unchanged from the DARK export. Only the frame changes.
- **Frame:** `viewBox="500 500 1000 1000"`, a square centred on the mark.
- **Background:** none. No full-frame `rect` and no paper fill, so the tab colour shows through.
- **Centre hole:** the pupil ring that the export paints in background colour MUST be a `mask` that cuts through the ink, so it stays transparent on any tab colour.
- **Ink:** `color.ink` by default. Under `@media (prefers-color-scheme: dark)` it MUST switch to `color.paper`.
- **Provenance:** a top-of-file comment MUST name the Figma node it was cut from and cite this spec.

Apps MUST serve a byte-identical copy as their `favicon.svg`.

#### Scenario: Favicon on a light tab

- GIVEN a browser in light colour scheme
- WHEN the favicon renders
- THEN the eye-star shows in black ink with a transparent background and a transparent centre hole

#### Scenario: Favicon on a dark tab

- GIVEN a browser in dark colour scheme
- WHEN the favicon renders
- THEN the eye-star shows in white ink with a transparent background and a transparent centre hole
- AND no separate dark favicon file is needed

#### Scenario: Favicon with a painted background is rejected

- GIVEN a favicon cut that keeps the export's full-frame `rect`, or paints the centre hole in a solid colour
- WHEN reviewed against this spec
- THEN it fails
