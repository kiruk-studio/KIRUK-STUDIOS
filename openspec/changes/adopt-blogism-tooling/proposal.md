# Proposal: adopt-blogism-tooling

## Why

BLOGISM is the internal notebook desk: white sheet for tablet ink, Toolcraft
chrome for title / collection / save. It is a second signed Toolcraft
workspace, sibling to Forge, and it writes MDX + ink into the kiruk.in git
CMS. `adopt-forge-tooling` currently names `apps/kiruk-forge/` as the only
vendored-kit exception. Without a second recorded workspace, Vite / TanStack
would either leak into shipping apps or BLOGISM would have no legal home.

This is **internal tooling, not a kiruk product**. PR1 stays parked. No
products-registry entry.

## What changes

- Modified: Requirement _Vendored tool kits are permitted, scoped and recorded_
  in tech-stack — the named exceptions are `apps/kiruk-forge/` and
  `apps/kiruk-blogism/` (both Toolcraft `0.0.20`, MIT). Same permitted kit
  stack, same no-leak clause (`kiruk-web`, `kiruk-portal`, `packages/*`).
- Modified: Requirement _Vendored kit integrity is a gate_ — formatter
  exclusions and CI integrity apply to both workspaces. The signed host is
  still not a styling surface.
- Modified: Requirement _Headless primitives = Base UI_ — include
  `kiruk-blogism` in the Base UI surface list.
- Modified: Requirement _TypeScript strict mode everywhere_ — first-party
  `tsconfig.kiruk.json` + `check-types` for `apps/kiruk-blogism/` as well.
- Modified: Requirement _Tests = Vitest 2 + Playwright 1.49+_ — Vitest 3 /
  Playwright 1.51 remain legal in both Toolcraft workspaces.

## Impact

- Specs touched: `tech-stack`
- Artifacts to regenerate: none
- Downstream: `biome.json`, `.prettierignore`, `CLAUDE.md` §6, `apps/kiruk-blogism/`
- Risk: two copies of Toolcraft `0.0.20` (no shared `src/toolcraft`). Upgrades
  remain a re-scaffold per workspace.

## Deltas

See `./specs/tech-stack/spec.md`.
