# Tasks — kiruk-logogram-primary

## Spec

- [x] Author delta `specs/brand-system/spec.md` (5 modified, 2 added)
- [x] Author delta `specs/template-invoice/spec.md` (eye-brand mark follows the primary)
- [x] `npx openspec validate kiruk-logogram-primary --strict` passes
- [ ] Founder answers the three decisions in `proposal.md` (final vs for-now, demote vs retire, CI identity gate)

## Source

- [ ] `packages/design-system/brand/logogram/` created
- [ ] Move `kiruk-logogram-{light,dark}.svg` from `apps/kiruk-web/public/brand/`, bytes unchanged (verify with a hash before and after)
- [ ] Move the favicon cut from `apps/kiruk-web/public/favicon.svg` to `brand/logogram/favicon.svg`
- [ ] `SOURCE.md`: Figma file key `9mquJbxlhtJEpCVXP5vdjc`, LIGHT `47:295`, DARK `44:127`, export date 2026-10-17, crop 48% × 28% centred, favicon `viewBox 500 500 1000 1000`
- [ ] `package.json`: add the `./brand/*` export

## Components

- [ ] `components/eye/EyeLogogram.tsx`: crop wrapper (width in, `tone: 'light' | 'dark'`, `aria-hidden` or label), `// eye-motif: drawn — KIRUK LOGOGRAM eye-star`
- [ ] Rename `EyePrimary.tsx` → `EyeCircle.tsx`, update its spec-link to _Secondary eye-marks_
- [ ] `components/index.ts`: export `EyeLogogram` and `EyeCircle`, keep `EyePrimary` as a deprecated alias
- [ ] `apps/kiruk-web/src/components/sketch/Logogram.astro`: spec-link to `#requirement-logogram-display-crop`

## Build + sync

- [ ] `scripts/build-tokens.mjs`: copy source → `build/logos/primary-light.svg`, `primary-dark.svg`, `favicon.svg`
- [ ] Sync step that copies the package source into `apps/kiruk-web/public/brand/` and `public/favicon.svg`
- [ ] Byte-identical check (package source vs app copies) wired into `scripts/doctor.mjs` or brand-CI
- [ ] `pnpm tokens:build` regenerates `build/logos/` cleanly; nothing in `build/` hand-edited

## Consumers + references

- [ ] `content/manifesto.md`: the "full circle (`EyePrimary`)" line reads `EyeCircle`, and the logogram is named as the primary mark
- [ ] `packages/design-system/pen-files/README.md`: eye list updated
- [ ] `apps/kiruk-web/src/components/ink/shaders.ts`: comment reads `EyeCircle` proportions
- [ ] `kiruk-templates/invoice/`: header uses `EyeLogogram` (LIGHT)
- [ ] Drop the `EyePrimary` alias once nothing references it

## Archive

- [ ] `FOUNDER_DECISIONS.md` B1 → `[x]` KIRUK LOGOGRAM (or stays `[~]` per decision 1); B2 untouched
- [ ] `brand-system/spec.md` _Acceptance Artifacts_ hand-updated (`brand/logogram/*`, `EyeLogogram.tsx`, `EyeCircle.tsx`, `build/logos/primary-{light,dark}.svg` + `favicon.svg`)
- [ ] Optional: the paper sketch of the eye-star (if one exists) into `content/scribbles/` to keep the kirukal origin
- [ ] Move to `openspec/archive/kiruk-logogram-primary/`, log in `CHANGELOG.md`

## Verify

- [ ] Favicon in a light and a dark browser tab: ink flips, background and centre hole transparent
- [ ] Nav mark at 44px measures 44 × ~26 with no paper visible
- [ ] Hash of each app copy equals the package source
- [ ] Brand-CI eye-motif gate passes on `EyeLogogram.tsx`
