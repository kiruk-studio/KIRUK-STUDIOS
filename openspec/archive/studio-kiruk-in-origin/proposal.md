# Proposal: studio-kiruk-in-origin

## Why

W7 shipped the public studio under `kiruk.in/studio` so it could live on the existing domain. That path collides with the personal site’s private notebook authoring UI (`kiruk.in/studio`) and makes one host do two jobs. The founder locked a split: `kiruk.in` stays the person; `studio.kiruk.in` is kiruk the studio. Two apps, two voices, no repo merge.

## What changes

- Modified: Requirement "kiruk-web interim base path" in `tech-stack/spec.md` → "kiruk-web public origin" (`https://studio.kiruk.in`, `base: '/'`)
- Removed: _(none)_

## Impact

- Specs touched: `tech-stack`
- Artifacts to regenerate: `apps/kiruk-web/astro.config.mjs` (`site` + `base`); docs that still say `kiruk.in/studio` (FOUNDER_DECISIONS W7 note, ROADMAP, TASKS, kiruk-web README)
- Downstream: kiruk-in stays a sibling repo; public studio links use `studio.kiruk.in`; `kiruk.in/studio` remains the personal authoring path (gated)
- Out of scope: merging Next and Astro; remaining studio routes (`/ism`, `/products`, `/services`, `/universes`); `kiruk.studio` apex (later config change)

## Deltas

See ./specs/tech-stack/spec.md
