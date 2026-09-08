# Tasks — adopt-forge-tooling

## Spec

- [ ] Author delta `openspec/changes/adopt-forge-tooling/specs/tech-stack/spec.md`
- [ ] `npx openspec validate adopt-forge-tooling --strict` passes

## Repo hygiene (blocking — already broken on main)

- [ ] `packages/design-system/components/` — remap 5 components off dead vars with saturated hex fallbacks (`--color-iris-core`, `--color-void`, `--color-kohl`, `--color-portal-glow`, `--color-halo-warm`)
- [ ] `packages/design-system/tsconfig.json` — add, extending `../../tsconfig.base.json`
- [ ] `packages/design-system/package.json` — add `check-types` script and the missing `"."` export
- [ ] Both apps depend on `@kiruk/design-system`; delete duplicated palettes incl. `--seal: #c8402a`
- [ ] `turbo.json` — add `test` task; align `typecheck` / `check-types` mismatch
- [ ] `apps/kiruk-web/velite.config.ts` — restore (missing from working tree while `velite` is a dependency)

## Vendor the kit

- [ ] Scaffold `@pixel-point/toolcraft@0.0.20` outside the repo
- [ ] Read the generated `.toolcraft-manifest.json`; record `files` / `protectedFiles` / `packageScripts` counts in the PR
- [ ] Copy into `apps/kiruk-forge/`, excluding `node_modules`, `.git`, `package-lock.json`, build output
- [ ] `package.json` — rename to `@kiruk/forge`, add workspace deps, **leave all 18 locked scripts byte-identical**, add `check-types`
- [ ] `tsconfig.kiruk.json` — extends the base, covers first-party paths
- [ ] `biome.json` + `.prettierignore` — exclusions, **same commit as the vendor**
- [ ] `apps/kiruk-forge/README.md` — upstream version, licence, source URL, vendor date, signed-host rule

## Verify

- [ ] `pnpm --filter @kiruk/forge run test` passes (clears the Windows `node --test scripts/*.test.mjs` glob risk)
- [ ] `pnpm format:fix` leaves `git status --porcelain apps/kiruk-forge` empty; integrity still passes
- [ ] `pnpm --filter @kiruk/forge exec tsc --version` reports 6.x; `@kiruk/web` reports 5.7.x
- [ ] `pnpm --filter @kiruk/forge run check-types` passes
