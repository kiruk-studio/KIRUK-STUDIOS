# Tasks — dawn-paper-tokens

## Spec

- [x] Author delta `specs/design-tokens/spec.md` (2 added, 1 modified)
- [x] `npx openspec validate dawn-paper-tokens --strict` passes
- [ ] Founder review: the scoped `color.sheet.*` exception to the mono semantic layer

## Tokens

- [x] `core.json`: `color.dawn` (light, departs, iron-gall, navy, rubric, rubric-line), each with its meaning
- [x] `semantic.json`: `color.sheet.old.{paper,ink}`, `color.sheet.new.{paper,ink}`, `color.sheet.rubric`, `color.sheet.rubric-line`
- [x] `pnpm tokens:build` regenerates cleanly

## Consumers

- [x] `apps/kiruk-studio` `eye.css`: the dawn custom properties cite the tokens they mirror
- [ ] Studio imports `@kiruk/design-system/tokens/css` directly. This is blocked until `--font-mono` in `tokens.css` stops colliding with next/font and `tokens:build` runs before app builds in turbo.
- [x] `@kiruk/burin` `paper.ts` and `renderer.ts`: the mirrored shader constants cite the tokens
- [x] `apps/kiruk-studio` `dawn.ts`: names, taglines and meanings beside the hex values

## Verify

- [x] Iron-gall on Dawn Light ≥ 7:1 (13.2), navy on Dawn Departs ≥ 7:1 (15.4)
- [x] Rubric ≥ 4.5:1 on both papers (5.5, 6.5)
- [x] Papers within OKLCH L ≥ 0.90, C ≤ 0.08
- [x] The crossing moves paper and ink together: a front, no mixed middle colour (burin proof, GPU)
- [ ] Archive to `openspec/archive/dawn-paper-tokens/` after founder sign-off
