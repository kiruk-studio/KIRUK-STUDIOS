# `@kiruk/forge` — the kiruk instrument

kiruk's own Figma. An **internal** tool where Arun draws marks on a graphics
tablet and exports working component code into `@kiruk/kirukal`.

It is **not a kiruk product**. `FOUNDER_DECISIONS.md` PR1 (first product) is
parked, so there is no registry entry and none is implied. It may graduate later.

## Vendored upstream — read this before touching anything

|          |                                                                                |
| -------- | ------------------------------------------------------------------------------ |
| Upstream | [`@pixel-point/toolcraft`](https://github.com/pixel-point/toolcraft)           |
| Version  | **0.0.20**                                                                     |
| Licence  | MIT (see `LICENSE.md`, `NOTICE.md` — both hash-protected, keep byte-identical) |
| Vendored | 2026-09-08                                                                     |

Admitted to the locked stack by
[`openspec/changes/adopt-forge-tooling`](../../openspec/changes/adopt-forge-tooling/proposal.md),
scoped to this workspace only. Vite, TanStack Router, TypeScript 6 and Vitest 3
**must not** leak into `kiruk-web`, `kiruk-portal`, or any package.

There is **no upgrade path** for a vendored copy. A newer Toolcraft is a
re-scaffold and a re-diff, never a merge.

## The signed host

`src/toolcraft/.toolcraft-manifest.json` carries **685 file hashes, 709
protected paths, 17 byte-compared package scripts and a signature**, enforced by
`scripts/check-toolcraft-integrity.mjs` inside `pnpm test`.

> **The signed host is not a styling surface.**

Concretely, all of this fails the gate:

- editing anything under `src/toolcraft/**`, or **reformatting it** — a formatter
  breaks the manifest exactly as an edit does
- editing `src/styles.css`, `src/main.tsx`, `src/router.tsx`, `src/routes/**`,
  `index.html`, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`,
  `scripts/**`, `docs/**`, `e2e/**`, `AGENTS.md`, `NOTICE.md`, `LICENSE.md`
- changing any of the 17 locked `package.json` scripts, or adding a `pre*`/`post*`
  wrapper around one
- CSS that targets Toolcraft host attributes, global `<style>` injection, or
  restyling public kit components (AST-enforced by
  `scripts/toolcraft-product-style-boundary.mjs`)
- importing or rendering `ToolcraftRoot`, `CanvasShell`, `ControlsPanel`,
  `LayersPanel`, `TimelinePanel`, `ToolbarPanel`, or the 22 built-in controls
  directly — compose through the schema instead

Root `biome.json` and `.prettierignore` already exclude every locked path.
**Do not remove those exclusions.**

## Where kiruk code goes

The product surface is exactly five files, plus anything we add beside them:

| File                             | Role                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `src/app/app-schema.ts`          | controls, sections, panels                                 |
| `src/app/app-composition.tsx`    | canvas content, custom control renderers, export renderers |
| `src/app/app-acceptance-data.ts` | acceptance declarations                                    |
| `src/app/app-performance.ts`     | performance declarations                                   |
| `src/app/app-schema.test.ts`     | schema tests                                               |
| `src/kiruk/**`                   | **all first-party logic** — see `src/kiruk/README.md`      |

`src/kiruk/**` must never import from `src/toolcraft/**`. It is typechecked
under the repo's strict base via `tsconfig.kiruk.json`; the vendored kit does not
satisfy `noUncheckedIndexedAccess` and cannot be fixed. `src/app/*` is the thin
adapter that bridges the two.

## The division that makes this work

> **The instrument is Toolcraft. Everything it produces is 100% kiruk.**

Panel chrome, toolbar, sliders, layers and timeline stay Toolcraft's — this is a
private tool. The canvas, the custom control geometry and every export are ours
and fully hand-drawn. Toolcraft ships a first-class light theme
(`appearance.theme.v1`), which matches founder decision **B5, light only**.

## Commands

```bash
pnpm --filter @kiruk/forge dev
pnpm --filter @kiruk/forge check-types   # first-party, strict base
pnpm --filter @kiruk/forge test          # docs + integrity + node --test + vitest
```

### Known Windows limitation — `pnpm test` does not pass locally

The two gates that prove the vendoring is intact **do** pass here:

```
Toolcraft local docs check passed.
Toolcraft integrity check passed (685 files).
```

The third stage does not. `pnpm test` also runs the upstream
`node --test scripts/*.test.mjs` suite, which produced **30 failures** on this
machine, and the run did not terminate — it stalled with ~65 orphaned node
processes still alive.

The root cause is environmental, not ours: a third of the failures name symbolic
links directly, and the suite builds symlink fixtures throughout. Creating a
symlink on Windows requires Developer Mode or an elevated shell; without it Node
returns `EPERM`. Every one of those test files is hash-protected, so they cannot
be patched, skipped, or worked around in this repo.

**Locally on Windows, run the gates individually:**

```bash
node scripts/check-toolcraft-docs.mjs
node scripts/check-toolcraft-integrity.mjs
pnpm exec vitest run src --passWithNoTests
```

Two ways to get the full `pnpm test` green: enable Windows Developer Mode
(Settings → System → For developers), or run it in CI on Linux, where symlink
creation is unprivileged. CI is the load-bearing one — treat Linux CI as the
authority for this suite, not a local Windows run.
