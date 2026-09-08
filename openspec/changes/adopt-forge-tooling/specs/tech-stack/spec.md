# Delta: tech-stack (MODIFIED)

## ADDED Requirements

### Requirement: Vendored tool kits are permitted, scoped and recorded

A third-party starter kit whose stack falls outside the locked envelope MUST be vendored into a single named workspace, and that exception MUST be recorded here. `apps/kiruk-forge/` (Toolcraft `0.0.20`, MIT) is the only such workspace.

Within `apps/kiruk-forge/` the following are permitted: Vite 8, `@vitejs/plugin-react` 6, TanStack Router 1.170, TypeScript 6, Vitest 3, Playwright 1.51, `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `sonner`, `lucide-react`, `@phosphor-icons/react`, `@dnd-kit/*`, and `react-resizable-panels`.

These MUST NOT appear in `apps/kiruk-web`, `apps/kiruk-portal`, or any `packages/*` workspace. The vendored kit's exact upstream version MUST be recorded in the workspace `README.md` alongside its licence and source URL.

#### Scenario: Kit dependency leaks into a shipping app

- GIVEN a contributor adds `@tanstack/react-router` to `apps/kiruk-portal/package.json`
- WHEN brand-CI runs the vendored-scope check
- THEN the build fails naming the dependency and the permitted workspace

#### Scenario: Vendored version is recorded

- GIVEN `apps/kiruk-forge/` exists
- WHEN its `README.md` is read
- THEN it names the upstream package, the exact vendored version, the licence, and the vendor date

### Requirement: Vendored kit integrity is a gate

A vendored kit that ships its own integrity manifest MUST have that check pass in CI. Formatters MUST be configured to skip every hash-locked and protected path, because reformatting a protected file breaks the manifest as surely as editing it.

The signed host is not a styling surface. Product code MUST NOT edit protected kit files, target kit host attributes from CSS, inject global styles, or restyle public kit components. Kiruk's visual language reaches the forge through the surfaces the kit designates as product-owned.

#### Scenario: Formatter rewrites a protected file

- GIVEN `pnpm format:fix` runs across the repo
- WHEN it completes
- THEN `git status --porcelain apps/kiruk-forge` reports no changes
- AND the kit's integrity check still passes

#### Scenario: Integrity check runs in CI

- GIVEN a pull request touching `apps/kiruk-forge/`
- WHEN CI runs
- THEN the kit's own integrity and docs checks run and must pass

### Requirement: Headless primitives = Base UI

Interactive component behaviour, state, and accessibility MUST come from `@base-ui/react` 1.8 or later across `kiruk-web`, `kiruk-portal`, and `kiruk-forge`. Kiruk supplies the visual surface; Base UI supplies structure, keyboard behaviour, focus management, and ARIA. Radix, Headless UI, MUI, and shadcn/ui MUST NOT be added.

The maintained package is `@base-ui/react`. The older `@base-ui-components/react` is stranded at `1.0.0-rc.0` and MUST NOT be used.

#### Scenario: A new interactive component

- GIVEN a new Checkbox in `@kiruk/kirukal`
- WHEN authored
- THEN it composes `@base-ui/react/checkbox` parts
- AND supplies only the drawn surface, never re-implementing keyboard or focus behaviour

#### Scenario: Wrong primitive library rejected

- GIVEN a contributor adds `@radix-ui/react-dialog`
- WHEN brand-CI runs the dependency check
- THEN the build fails naming Base UI as the required primitive layer

## MODIFIED Requirements

### Requirement: TypeScript strict mode everywhere

Every workspace MUST use TypeScript 5.7 or later with `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, and `verbatimModuleSyntax: true`. A root `tsconfig.base.json` MUST define these and be extended by all workspaces.

A vendored kit whose `tsconfig.json` is hash-protected and therefore cannot be edited is exempt from the extends requirement **for that file only**, provided the workspace also carries a second config that does extend `tsconfig.base.json`, covers all first-party source in that workspace, and is wired to a `check-types` script. The exempt path MUST be enumerated in the vendored-kit requirement above.

#### Scenario: Workspace without strict rejected

- GIVEN a workspace `tsconfig.json` missing `extends: "../../tsconfig.base.json"` or overriding strict flags to false
- WHEN brand-CI runs the type-config check
- THEN the build fails

#### Scenario: Vendored kit typechecks first-party code

- GIVEN `apps/kiruk-forge/tsconfig.json` is hash-protected and cannot extend the base
- WHEN `pnpm --filter @kiruk/forge run check-types` runs
- THEN it uses `tsconfig.kiruk.json`, which extends `tsconfig.base.json`
- AND that config includes every first-party path in the workspace

### Requirement: Tests = Vitest 2 + Playwright 1.49+

Unit and component tests MUST use Vitest 2 or later. E2E tests MUST use Playwright 1.49 or later. These are version floors, not pins: a workspace MAY use a newer major where its toolchain requires it. Jest and Cypress MUST NOT be added.

#### Scenario: New unit test

- GIVEN a new utility function
- WHEN tested
- THEN the test file imports from `vitest`
- AND runs via `pnpm test`

#### Scenario: Workspace on a newer major

- GIVEN `apps/kiruk-forge` resolves Vitest 3 and Playwright 1.51
- WHEN the version check runs
- THEN it passes, because both exceed the stated floors
