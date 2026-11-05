# `@kiruk/blogism` — the notebook desk

An **internal** instrument: white finite sheet for tablet ink, Toolcraft
Design/Develop tabs for structure, File System Access writes into the kiruk.in
git CMS. Readers on kiruk.in see clean type plus ink SVGs.

It is **not a kiruk product**. `FOUNDER_DECISIONS.md` PR1 stays parked. No
registry entry.

## Vendored upstream — read this before touching anything

|          |                                                                                |
| -------- | ------------------------------------------------------------------------------ |
| Upstream | [`@pixel-point/toolcraft`](https://github.com/pixel-point/toolcraft)           |
| Version  | **0.0.20**                                                                     |
| Licence  | MIT (see `LICENSE.md`, `NOTICE.md` — both hash-protected, keep byte-identical) |
| Vendored | 2026-09-15                                                                     |

Admitted by
[`openspec/changes/adopt-blogism-tooling`](../../openspec/changes/adopt-blogism-tooling/proposal.md)
as a **second** scoped Toolcraft workspace beside `apps/kiruk-forge/`. Vite,
TanStack Router, TypeScript 6 and Vitest 3 **must not** leak into `kiruk-web`,
`kiruk-portal`, `kiruk-in`, or any package. The two apps **do not share**
`src/toolcraft`.

There is **no upgrade path** for a vendored copy. A newer Toolcraft is a
re-scaffold and a re-diff, never a merge.

## The signed host

`src/toolcraft/.toolcraft-manifest.json` carries file hashes, protected paths,
byte-compared package scripts and a signature, enforced by
`scripts/check-toolcraft-integrity.mjs` inside `pnpm test`.

> **The signed host is not a styling surface.**

Do not edit `src/toolcraft/**`, `src/styles.css`, `src/main.tsx`, `src/router.tsx`,
`src/routes/**`, `index.html`, `tsconfig.json`, `vite.config.ts`,
`playwright.config.ts`, hash-locked `scripts/**`, or `docs/**` (except this
product `agent-worklog.md`). Root `biome.json` and `.prettierignore` already
exclude those paths.

`index.html` still says "Kiruk Forge" because that file is hash-locked.

## Where kiruk code goes

| File                             | Role                                            |
| -------------------------------- | ----------------------------------------------- |
| `src/app/app-schema.ts`          | Design / Develop controls                       |
| `src/app/app-composition.tsx`    | page canvas, kit save, PNG export renderer      |
| `src/app/app-acceptance-data.ts` | product readiness + acceptance matrix           |
| `src/app/app-performance.ts`     | Canvas 2D performance declarations              |
| `src/kiruk/**`                   | InkDocument, tablet sampling, MDX/path contract |

`src/kiruk/**` must never import from `src/toolcraft/**`. It is typechecked
under the repo's strict base via `tsconfig.kiruk.json`.

## Commands

```bash
pnpm --filter @kiruk/blogism dev
pnpm --filter @kiruk/blogism check-types
pnpm --filter @kiruk/blogism test
pnpm --filter @kiruk/blogism verify:delivery
```

On Windows, Toolcraft `0.0.20`'s signed `app-acceptance.framework-boundary.test.ts` compares TypeScript POSIX paths to `path.join` Win32 paths. Set `NODE_OPTIONS=--require <app>/.win32-vitest-path-join.cjs` before `verify:delivery` so Vitest workers normalize `path.join`. Do not edit the signed test.
