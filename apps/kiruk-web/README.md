# kiruk-web

> `apps/kiruk-web` — the public face of kiruk. Deploys to [studio.kiruk.in](https://studio.kiruk.in). Apex `kiruk.studio` is a later config change.

Public studio website built on **Astro 5** (island architecture, content collections, zero-JS-by-default).

## Why Astro and not Next.js

This app is **content-first** — manifesto, devlogs, case studies, ISM showcase, products gallery, about. Astro 5 ships near-zero JavaScript for static routes while still allowing React islands for heavy interactive surfaces (WebGL hero, signature transitions). On the LCP / TBT / JS-budget metrics that define Awwwards-tier craft, Astro beats Next.js for this profile.

The decision is locked in [`openspec/specs/tech-stack/spec.md`](../../openspec/specs/tech-stack/spec.md) → **"kiruk-web uses Astro 5"**. The internal portal at `apps/kiruk-portal/` still uses Next.js 15 — it is dashboard- and auth-heavy and benefits from RSC + Server Actions.

## Status

Astro 5 scaffold + sketch home are live. Public origin is **`studio.kiruk.in`** (`base: '/'`). Devlog routes pull Velite from `content/devlogs/`. Remaining studio pages (`/kirukism`, `/ism`, `/products`, `/services`, `/universes`) ship later.

## Planned routes

| Route        | Purpose                                            | JS budget |
| ------------ | -------------------------------------------------- | --------- |
| `/`          | Home — Eye motif hero, studio punch (WebGL island) | ≤ 150 KB  |
| `/kirukism`  | Manifesto, philosophy                              | 0 KB      |
| `/ism`       | ISM lab — experiment series index                  | ≤ 50 KB   |
| `/products`  | In-house product gallery                           | ≤ 50 KB   |
| `/services`  | What kiruk builds with founders                    | 0 KB      |
| `/about`     | Arun + kirukan + kirukargals                       | 0 KB      |
| `/devlog`    | Transparent process log (MDX via Velite)           | 0 KB      |
| `/universes` | Consent-gated shipped universes                    | ≤ 50 KB   |

Budgets enforced via `size-limit` + Lighthouse CI per [`tech-stack`](../../openspec/specs/tech-stack/spec.md) → "Performance budgets per route".

## Stack inside this app

| Layer             | Choice                                        | Source            |
| ----------------- | --------------------------------------------- | ----------------- |
| Framework         | Astro 5                                       | `tech-stack` spec |
| Component runtime | React 19 (island only)                        | `tech-stack` spec |
| Styling           | Tailwind v4 + `@kiruk/design-system` CSS vars | `tech-stack` spec |
| Content           | MDX 3 + Velite                                | `tech-stack` spec |
| Animation         | Motion v11 + GSAP 3                           | `tech-stack` spec |
| 3D                | Three.js r170 + R3F 9 + drei                  | `tech-stack` spec |
| Validation        | Zod 4                                         | `tech-stack` spec |
| Images            | Sharp at build + AVIF + WebP                  | `tech-stack` spec |

## Deploy target

Vercel via `@astrojs/vercel`. Domain: **studio.kiruk.in**. Optional later apex: kiruk.studio (config change + link audit).

## Related

- Design system: `../../packages/design-system/` (workspace package `@kiruk/design-system`)
- Content: `../../content/devlogs/`, `../../content/case-studies/`, `../../content/story-drops/`
- Specs: `../../openspec/specs/`
