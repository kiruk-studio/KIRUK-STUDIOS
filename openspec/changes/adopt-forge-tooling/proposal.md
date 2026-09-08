# Proposal: adopt-forge-tooling

## Why

kiruk must be hand-drawn end to end — every component and element across `kiruk-web` and `kiruk-portal`. There is no component library today: both apps hand-duplicate `--paper --ink --pencil --rule` as local CSS variables, neither depends on `@kiruk/design-system`, and the sketch look is CSS `rotate(-0.5deg)` plus doubled borders. Every new screen re-invents the language.

The studio needs an **internal instrument** — kiruk's own Figma — where Arun draws marks on a graphics tablet and exports working component code. [Toolcraft](https://toolcraft.sh/) (MIT, `@pixel-point/toolcraft`) supplies the parts we do not want to build: a canvas with pan/zoom/history, a controls panel, layers, a timeline, export, ~22 built-in controls, all on **Base UI** — the headless primitive layer kiruk has already chosen.

This is **internal tooling, not a kiruk product**. `FOUNDER_DECISIONS.md` PR1 (first product) is parked and undecided; a products-registry entry would require inventing `tier`, `deploy-target`, `audience`, and `success-metric`. The forge may graduate to a product later. For now it lives under `apps/` like any other workspace.

Toolcraft brings four tools that are outside the locked envelope — Vite 8, TanStack Router, TypeScript 6, Vitest 3 — and it is a **signed host**: `src/toolcraft/.toolcraft-manifest.json` carries 685 file hashes, 709 protected paths, 18 byte-compared package scripts, and a signature, enforced by `scripts/check-toolcraft-integrity.mjs` inside its `test` script. Vendoring it without recording these facts would silently break the tech-stack contract and, on the first commit, break the integrity gate itself.

## What changes

### Modified capability

- **`tech-stack`** — four requirements, so a vendored kit is legal, bounded, and cannot leak into the two shipping apps:
  - **Added** _Vendored tool kits are permitted, scoped and recorded_ — admits Vite 8, TanStack Router 1.170, TypeScript 6, Vitest 3, Playwright 1.51 and the kit's UI dependencies **only under `apps/kiruk-forge/`**, with an explicit no-leak clause.
  - **Added** _Vendored kit integrity is a gate_ — the integrity check MUST pass in CI, formatters MUST exclude hash-locked and protected paths, and the signed host is not a styling surface.
  - **Modified** _TypeScript strict mode everywhere_ — the kit's `tsconfig.json` is hash-protected and cannot extend `tsconfig.base.json`. First-party code is typechecked by a second config that does.
  - **Modified** _Tests = Vitest 2 + Playwright 1.49+_ — restated as floors rather than pins. Clearly the original intent; the current wording forbids a newer Vitest.
  - **Added** _Headless primitives = Base UI_ — locks `@base-ui/react` ^1.8 across all three surfaces. Note the package rename: `@base-ui-components/react` is stranded at `1.0.0-rc.0`; the maintained package is `@base-ui/react`.

### Modified docs

- **`openspec/project.md`** — no new capability; `tech-stack` already registered.
- **`CLAUDE.md`** §6 — register `apps/kiruk-forge/` in the repo orientation list.

### Modified code

- **`apps/kiruk-forge/`** — Toolcraft `0.0.20` vendored, renamed to `@kiruk/forge`, all 18 locked scripts byte-identical.
- **`biome.json`** + **`.prettierignore`** — exclude hash-locked and protected paths. Must land in the same commit as the vendor.
- **`turbo.json`** — add the missing `test` task; align the `typecheck` / `check-types` name mismatch.

## Impact

- **Specs touched:** `tech-stack` only (2 modified requirements, 3 added).
- **Code touched:** one new workspace; three root config files.
- **Risk:** the locked `test` script runs `node --test scripts/*.test.mjs`; PowerShell does not glob-expand and the script cannot be edited. Verified on day one, with Git Bash as the escape hatch.
- **Risk:** Toolcraft is `0.0.20` and moving, with no upgrade path for a vendored copy. Mitigated by recording the exact version; upgrades are a re-scaffold and re-diff, never a merge.
- **Downstream:** unblocks `add-kirukal-tokens` and the `@kiruk/kirukal` component library.

## Deltas

See `./specs/tech-stack/spec.md`.
