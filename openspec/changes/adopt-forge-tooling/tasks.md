# Tasks — adopt-forge-tooling

## Spec

- [x] Author delta `openspec/changes/adopt-forge-tooling/specs/tech-stack/spec.md`
- [x] `npx openspec validate adopt-forge-tooling --strict` passes

## Repo hygiene (blocking — already broken on main)

- [x] `packages/design-system/components/` — remap 5 components off dead vars with saturated hex fallbacks (`--color-iris-core`, `--color-void`, `--color-kohl`, `--color-portal-glow`, `--color-halo-warm`)
- [x] `packages/design-system/tsconfig.json` — add, extending `../../tsconfig.base.json`
- [x] `packages/design-system/package.json` — add `check-types` script and the missing `"."` export
- [x] Both apps depend on `@kiruk/design-system`; delete duplicated palettes incl. `--seal: #c8402a`
- [x] `turbo.json` — add `test` task; align `typecheck` / `check-types` mismatch
- [x] `apps/kiruk-web/velite.config.ts` — restore (missing from working tree while `velite` is a dependency)

## Vendor the kit

- [x] Scaffold `@pixel-point/toolcraft@0.0.20` outside the repo
- [x] Read the generated `.toolcraft-manifest.json`; record `files` / `protectedFiles` / `packageScripts` counts in the PR
- [x] Copy into `apps/kiruk-forge/`, excluding `node_modules`, `.git`, `package-lock.json`, build output
- [x] `package.json` — rename to `@kiruk/forge`, add workspace deps, **leave all 18 locked scripts byte-identical**, add `check-types`
- [x] `tsconfig.kiruk.json` — extends the base, covers first-party paths
- [x] `biome.json` + `.prettierignore` — exclusions, **same commit as the vendor**
- [x] `apps/kiruk-forge/README.md` — upstream version, licence, source URL, vendor date, signed-host rule

## Verify

- [~] `pnpm --filter @kiruk/forge run test` — docs + integrity pass; the glob risk is cleared (Node 22 expands it). The upstream `node --test` suite fails 30 tests on Windows and does not terminate: it builds symlink fixtures, and unprivileged Windows cannot create symlinks. Files are hash-protected and unpatchable. Fix is Developer Mode, or Linux CI as the authority — see apps/kiruk-forge/README.md.
- [x] `pnpm format:fix` leaves `git status --porcelain apps/kiruk-forge` empty; integrity still passes
- [x] `pnpm --filter @kiruk/forge exec tsc --version` reports 6.x; `@kiruk/web` reports 5.7.x
- [x] `pnpm --filter @kiruk/forge run check-types` passes
