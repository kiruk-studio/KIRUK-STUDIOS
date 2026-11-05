# Tasks — adopt-blogism-tooling

## Spec

- [x] Author delta `openspec/changes/adopt-blogism-tooling/specs/tech-stack/spec.md`
- [x] `npx openspec validate adopt-blogism-tooling --strict` passes

## Vendor the second workspace

- [x] Copy signed Toolcraft `0.0.20` host from `apps/kiruk-forge/` into `apps/kiruk-blogism/`, excluding `node_modules`, `.toolcraft`, build output
- [x] `package.json` — rename to `@kiruk/blogism`; leave locked scripts byte-identical; add `check-types`
- [x] `tsconfig.kiruk.json` — first-party `src/kiruk/**` under the repo base
- [x] `biome.json` + `.prettierignore` — same exclusions as Forge, for `apps/kiruk-blogism/`
- [x] `apps/kiruk-blogism/README.md` — upstream version, licence, source URL, vendor date, signed-host rule, no-leak

## Product surface

- [x] Replace Forge `src/app` product files + `src/kiruk` with BLOGISM Design/Develop + ink kit
- [x] `appProductReadiness.mode: "product"`
- [ ] One `npm run verify:delivery` after the app is real
