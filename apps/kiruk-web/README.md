# kiruk-web

> `apps/kiruk-web` — the public face of kiruk. Deploys to [studio.kiruk.in](https://studio.kiruk.in).

## Status — rebuilding from scratch (2026-10-17)

The previous site (3D grease-pencil landing, sketch CSS, hand fonts, sketch nav) was cut. It is preserved in git at commit `a201273` (`chore(web): snapshot before studio reset`).

What is here now is a **bare Astro shell**: one plain-text placeholder page, the logogram, analytics, and the Velite content config. It keeps studio.kiruk.in up while the new site is built. The stack is re-chosen in Phase 4 of the plan, so this shell is a placeholder, not a lock.

**The plan:** [`ideas/studio-dawn/plan.md`](../../ideas/studio-dawn/plan.md) — decisions, content model, phases, and what is still parked for ideation.

## Planned routes

| Route        | Purpose                                                |
| ------------ | ------------------------------------------------------ |
| `/`          | Landing                                                |
| `/work`      | In-house, client (consent-gated), and built ISM pieces |
| `/ism`       | ISM ideas and how kiruk ideates                        |
| `/framework` | Kiruk Framework — researching                          |
| `/writing`   | Deep, researched articles (feed at `/writing/rss.xml`) |
| `/contact`   | Email, GitHub, Instagram                               |

Piece pages: `/work/<slug>` and `/ism/<slug>`.

## Kept from before

- `public/brand/` — logogram exports (Figma), `public/favicon.svg` — cropped logogram
- `src/lib/base.ts`, `src/lib/site.ts` — base-path + origin helpers
- `velite.config.ts` — devlog content contract (`content/devlogs/`)
- `vercel.json` — monorepo build on Vercel

## Deploy target

Vercel via `@astrojs/vercel`. Domain: **studio.kiruk.in**.

## Related

- Plan: `../../ideas/studio-dawn/plan.md`
- Content: `../../content/devlogs/`, `../../content/case-studies/`
- Specs: `../../openspec/specs/`
