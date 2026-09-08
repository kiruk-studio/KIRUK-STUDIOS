# Tasks — add-kirukal-tokens

## Spec

- [ ] Author delta `specs/design-tokens/spec.md` (4 added requirements)
- [ ] Author delta `specs/brand-consistency-ci/spec.md` (eye-motif gate widened)
- [ ] `npx openspec validate add-kirukal-tokens --strict` passes

## Tokens

- [ ] `core.json` — `breakpoint` group (xs 480, md **768 pinned**, lg 1024, xl 1440, 2xl 1920)
- [ ] `core.json` — `stroke` group (hairline 1, base 2, heavy 3, mark 4 — absolute px)
- [ ] `core.json` — `dimension.touch.min` = 44px
- [ ] `tokens/assets.json` — new file, `$type: "asset"`, mark ids
- [ ] `style-dictionary.config.cjs` — register the `asset` type
- [ ] `pnpm tokens:build` regenerates cleanly

## Consumers

- [ ] `apps/kiruk-web` + `apps/kiruk-portal` — surface `--breakpoint-*` via `@theme`
- [ ] Confirm `md:` variants resolve to the token, not Tailwind's default

## Verify

- [ ] Frame at 60px and 900px measures the same stroke in device pixels
- [ ] Icon button hit area ≥ 44px below `md`
- [ ] Adding a `v04` asset changes the emitted count with no code change
