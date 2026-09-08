# Delta: design-tokens (MODIFIED)

## ADDED Requirements

### Requirement: Breakpoint tokens

`core.json` MUST declare a `breakpoint` group with exactly five steps, each `$type: "dimension"` in absolute `px`: `xs` 480, `md` 768, `lg` 1024, `xl` 1440, `2xl` 1920. Apps MUST surface them through Tailwind's `@theme` as `--breakpoint-*` rather than relying on Tailwind's stock defaults.

`breakpoint.md` MUST equal `768px`. It is coupled to the `MOBILE_BREAKPOINT` constant in the vendored Toolcraft runtime (`src/toolcraft/ui/hooks/use-mobile.ts`), which is hash-protected and cannot be edited. Changing this token without a coordinated change to `apps/kiruk-forge/` desynchronises the app shell from the kit at exactly one pixel, so any change to it MUST be proposed together with the forge change.

#### Scenario: Breakpoint token drives Tailwind

- GIVEN a component using `md:` variants
- WHEN the app CSS is built
- THEN the `md` breakpoint resolves to the token value, not Tailwind's default

#### Scenario: md drifts from the runtime constant

- GIVEN a proposal changing `breakpoint.md` to `800px`
- WHEN it does not also change `apps/kiruk-forge/`
- THEN validation fails, citing the coupling to `MOBILE_BREAKPOINT`

### Requirement: Stroke tokens are absolute

`core.json` MUST declare a `stroke` group with `hairline` 1px, `base` 2px, `heavy` 3px, and `mark` 4px, each `$type: "dimension"`. Every value MUST be an absolute `px` length. Relative units — `em`, `rem`, `%`, `vw`, `vh` — MUST NOT be used for stroke width anywhere in the system.

A hand-drawn stroke MUST NOT scale with the element that carries it: a frame drawn at 2px stays 2px whether it borders a 60px button or a 900px card, because a real pencil does not thicken with the shape it draws. Drawn marks MUST therefore carry `vector-effect="non-scaling-stroke"`, and `transform: scale()` MUST NOT be applied to any element carrying a drawn edge.

#### Scenario: Frame is resized

- GIVEN a drawn frame at `stroke.base`
- WHEN its container grows from 60px to 900px wide
- THEN the rendered stroke measures the same number of device pixels at both sizes

#### Scenario: Relative stroke unit rejected

- GIVEN a token or component style setting stroke width in `em` or `%`
- WHEN brand-CI runs the token check
- THEN the build fails naming the offending value

### Requirement: Touch target minimum

`core.json` MUST declare `dimension.touch.min` as `44px`, `$type: "dimension"`. Every interactive control MUST present a hit area of at least this size on viewports below `breakpoint.md`, independent of its visual size — a small drawn glyph MAY look small while its target does not.

#### Scenario: Small glyph button on a phone

- GIVEN an icon button rendering a 16px drawn glyph
- WHEN viewed below `breakpoint.md`
- THEN its hit area measures at least `dimension.touch.min` in both axes

### Requirement: Drawn asset tokens

Which drawn mark a component binds to is a design decision and MUST live in the token layer. `packages/design-system/tokens/assets.json` MUST declare an `asset` group whose leaves are `$type: "asset"` and whose `$value` is a mark id such as `frame.box` or `glyph.tick`. Component tokens MAY reference them; every referenced id MUST resolve in `packages/kirukal/manifest/components.json`.

Variant **counts** MUST NOT be tokens. They are generated from the asset files present on disk, so that adding a redraw is an asset-only commit requiring no token, spec, or code change.

#### Scenario: Component binds to a mark

- GIVEN `component.button.frame` referencing `{asset.frame.box-tight}`
- WHEN the token build runs
- THEN the emitted CSS variable carries the mark id
- AND the kirukal manifest resolves that id to a built asset

#### Scenario: Unresolvable asset id

- GIVEN an `asset` token naming a mark with no entry in the kirukal manifest
- WHEN the token build runs
- THEN it fails naming the unresolved id

#### Scenario: Variant added without code change

- GIVEN a mark with three variants on disk
- WHEN a fourth `v04` file is committed
- THEN the asset build emits an updated count
- AND no token, spec, or component source changes
