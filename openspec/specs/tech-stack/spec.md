# Spec: tech-stack

## Purpose

Lock the tooling, runtimes, frameworks, and deploy targets kiruk uses across studio, lab, and product line. Choices are made for **2026 launch and beyond** with three constraints:

1. **Performance ceiling** — Awwwards-grade craft demands ≥95 Lighthouse, 60fps, JS budget caps per route.
2. **Solo-founder operability** — every layer must be maintainable by one person; vendor lock-in is the second risk after lag.
3. **Future-proof migration paths** — every choice has a stated successor when the current pick ages out (WebGPU, React Compiler, Bun, etc.).

This spec does NOT prescribe app architecture — apps and products may pick within the locked envelope. It DOES prescribe the envelope.

## Domain vocabulary

| Term                   | Meaning                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| **Locked choice**      | The current best-in-class pick for a layer. Changes require an OpenSpec proposal. |
| **Successor**          | The next likely winner. Watched but not adopted.                                  |
| **Performance budget** | Hard ceiling per metric (JS KB, LCP, FID, CLS, fps).                              |
| **Edge-ready**         | Runs on Cloudflare Workers / Vercel Edge / Deno Deploy without polyfills.         |

## Requirements

### Requirement: Runtime is Node LTS, pinned

The repo MUST run on Node 22 LTS as the canonical runtime, pinned in `.nvmrc`, `.node-version`, and `engines.node` in `package.json`. Node 20 LTS is the minimum floor; older versions MUST be rejected by `pnpm install`.

#### Scenario: Old node rejected

- GIVEN a contributor on Node 18
- WHEN they run `pnpm install`
- THEN install fails with the engines mismatch message naming the required range

### Requirement: Package manager is pnpm 10

The repo MUST use pnpm 10 via `packageManager` field; npm and yarn MUST NOT be used. Lockfile is `pnpm-lock.yaml` only.

#### Scenario: Wrong manager rejected

- GIVEN a contributor runs `npm install`
- WHEN Corepack or `packageManager` field is honored
- THEN the run errors with the required-manager hint
- AND no `package-lock.json` is created

### Requirement: Monorepo orchestrator is Turborepo 2

The repo MUST use Turborepo 2 (`turbo.json`) for task orchestration. Remote caching SHOULD be enabled in CI via `TURBO_TOKEN` / `TURBO_TEAM` (or self-hosted Turborepo Remote Cache when ready).

#### Scenario: Turbo pipeline drives builds

- GIVEN a `pnpm build` invocation
- WHEN run from the root
- THEN `turbo run build` orchestrates per-workspace builds
- AND outputs are cached locally and (when configured) remotely

### Requirement: TypeScript strict mode everywhere

Every workspace MUST use TypeScript 5.7 or later with `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, and `verbatimModuleSyntax: true`. A root `tsconfig.base.json` MUST define these and be extended by all workspaces.

#### Scenario: Workspace without strict rejected

- GIVEN a workspace `tsconfig.json` missing `extends: "../../tsconfig.base.json"` or overriding strict flags to false
- WHEN brand-CI runs the type-config check
- THEN the build fails

### Requirement: Lint + format = Biome 2 for code, Prettier for markdown

JS/TS/JSON files MUST be linted and formatted by Biome 2. Markdown files MUST be formatted by Prettier 3 (Biome lacks MDX/MD support). ESLint and Stylelint MUST NOT be added unless a future rule cannot be expressed in Biome.

#### Scenario: Single tool per surface

- GIVEN a `.ts` file change
- WHEN `pnpm format` runs
- THEN Biome handles it
- AND a `.md` change is handled by Prettier
- AND no overlap exists

### Requirement: Pre-commit hygiene is enforced locally

Husky 9 + lint-staged 16 + commitlint 19 MUST gate every commit. Conventional Commits MUST be enforced (`feat:`, `fix:`, `spec:`, `token:`, `chore:`, `docs:`, `perf:`, `refactor:`, `test:`, `build:`, `ci:`).

#### Scenario: Bad commit rejected

- GIVEN a contributor commits with message `update stuff`
- WHEN the commit-msg hook runs
- THEN commitlint rejects with the Conventional Commits link

### Requirement: kiruk-web uses Astro 5

The public studio website at `apps/kiruk-web/` MUST be built on Astro 5 with island architecture, MDX content collections, and zero-JS-by-default. Heavy interactive surfaces (WebGL hero, animated transitions) MUST be islands hydrated only when in viewport.

**Rationale:** kiruk-web is content-first (manifesto, devlogs, case studies, ISM showcases, products gallery). Astro 5 ships ~0 JS for static routes, beating Next.js on LCP, TBT, and JS budget for this profile. Awwwards-tier studios moved to Astro for the marketing surface during 2024–2025.

**Successor watch:** Next.js with PPR + RSC narrowing the gap. Re-evaluate at Year 2.

#### Scenario: Static route ships zero JS

- GIVEN the `/manifesto` route
- WHEN built and inspected
- THEN the HTML contains no `<script>` tags except inline JSON-LD and analytics
- AND the JS budget for that route is 0 KB (excluding analytics)

### Requirement: kiruk-portal uses Next.js 15 with React 19

The internal portal at `apps/kiruk-portal/` MUST run Next.js 15 (App Router, Turbopack) with React 19 (Server Components, Server Actions, Partial Prerendering). The portal is dashboard-heavy with auth — Next.js's RSC + Server Actions are the right fit.

#### Scenario: Portal uses RSC by default

- GIVEN a new route in `apps/kiruk-portal/app/`
- WHEN authored without explicit `'use client'`
- THEN it renders as an RSC

### Requirement: Styling = Tailwind v4 + design-token CSS variables

All apps and products MUST use Tailwind v4 with the Oxide engine. Tailwind config MUST consume `@kiruk/design-system` CSS variables; raw hex colors MUST NOT appear in app code (enforced by `brand-consistency-ci`).

#### Scenario: Tailwind config imports tokens

- GIVEN an app `tailwind.config.ts`
- WHEN inspected
- THEN it references `@kiruk/design-system/build/css/tokens.css` or the tailwind preset emitted by Style Dictionary

### Requirement: Animation = Motion v11 + GSAP 3

React-component motion MUST use Motion v11 (motion.dev — formerly Framer Motion). Complex timeline-based or signature interactions MUST use GSAP 3 (with appropriate license — kiruk's MIT use of GSAP requires the free Standard License or Club GreenSock for commercial bonus plugins).

**Rationale:** Motion is React-native and integrates with RSC. GSAP delivers the cinematic timeline craft that distinguishes Awwwards-tier work. Using both is standard for top-tier studios.

#### Scenario: Component-driven motion uses Motion

- GIVEN a hover/tap animation on a React component
- WHEN authored
- THEN it uses `motion/react` not GSAP
- AND GSAP is reserved for scroll-triggered or multi-element choreography

### Requirement: 3D / WebGL = Three.js r170+ + React Three Fiber 9 + TSL

WebGL surfaces MUST use Three.js r170 or later via React Three Fiber 9 + drei + postprocessing. Custom shaders MUST be authored in TSL (Three.js Shading Language) where possible, not raw GLSL strings, for portability and WebGPU readiness.

**Successor:** Three.js `WebGPURenderer` becomes default when browser support crosses 90% (tracked). Until then, default is WebGL2 with WebGPU opt-in for capable devices.

#### Scenario: New shader written in TSL

- GIVEN a new shader requirement
- WHEN authored
- THEN it uses TSL nodes (e.g. `Fn`, `uniform`, `attribute`) not raw GLSL strings
- UNLESS a TSL equivalent does not exist and the GLSL fallback is documented in the component's spec

### Requirement: Content authoring = MDX 3 + Velite

Devlogs, case studies, story drops, and manifestos MUST be authored in MDX 3 and processed by Velite for type-safe schema validation. Contentlayer is forbidden — it is unmaintained.

#### Scenario: Content schema validated at build

- GIVEN a new devlog MDX file
- WHEN `velite build` runs
- THEN the front-matter is validated against the schema defined in `velite.config.ts`
- AND missing or malformed fields fail the build

### Requirement: Images = AVIF primary, WebP fallback, Sharp at build

All raster images MUST be served as AVIF with WebP fallback. Build pipelines MUST use Sharp for transformations. Original assets live in `content/scribbles/` and `apps/*/public/`; the build emits optimized variants.

#### Scenario: Image optimized at build

- GIVEN a `sketch-01.png` in a scribble folder
- WHEN the kiruk-web build runs
- THEN AVIF + WebP variants are emitted
- AND HTML serves AVIF first with WebP and the original as fallbacks

### Requirement: Database = Postgres on Neon, ORM = Drizzle

When persistent data is needed (portal, products with users), the database MUST be Postgres hosted on Neon (serverless, branch-per-PR). The ORM MUST be Drizzle. Raw SQL is acceptable; Prisma is forbidden for new code (heavy, edge-hostile).

#### Scenario: New persistent feature uses Drizzle

- GIVEN a new feature requiring data persistence
- WHEN the data layer is authored
- THEN the schema lives in `*/db/schema.ts` using Drizzle's syntax
- AND a Neon branch is provisioned in CI for PR previews

### Requirement: Auth = Better-Auth

When authentication is required, kiruk products and the portal MUST use Better-Auth. NextAuth/Auth.js is forbidden for new code; Clerk is acceptable only for prototype phases where Better-Auth's social-provider list is insufficient.

#### Scenario: Portal auth uses Better-Auth

- GIVEN the portal needs login
- WHEN the auth layer is wired
- THEN it imports from `better-auth`
- AND the chosen providers + session config are recorded in `apps/kiruk-portal/auth.ts`

### Requirement: Backend = Server Actions + Hono on Workers

Server-side logic MUST default to Next.js Server Actions (portal) or Astro Actions (web). Standalone edge APIs MUST be authored with Hono on Cloudflare Workers. Spring Boot or other JVM backends MUST NOT be added unless a specific Java-only workload (e.g. JVM-based AI model serving) is demonstrably required.

#### Scenario: New mutation uses Server Action

- GIVEN a portal form submission
- WHEN the mutation is implemented
- THEN it is a Server Action, not a custom API route
- UNLESS the endpoint is consumed by a third party (then Hono on Workers)

### Requirement: Validation = Zod 4

All input/output boundaries (forms, API params, env vars, MDX front-matter) MUST be validated with Zod 4 schemas. `z.infer<typeof schema>` is the canonical type source.

#### Scenario: Server Action validates input

- GIVEN a Server Action accepting user input
- WHEN invoked
- THEN it parses the input through a Zod schema before any logic
- AND validation errors return a typed error to the caller

### Requirement: State = Zustand 5 client + RSC server

Cross-component client state MUST use Zustand 5. Redux, Jotai, Recoil MUST NOT be added. Server-derived state lives in RSC and is passed down; no client-side fetching for data already owned by the server.

#### Scenario: Component state choice

- GIVEN a need to share state across non-parent-child components
- WHEN implemented
- THEN it uses a Zustand store, not Context-only or a heavier library

### Requirement: Tests = Vitest 2 + Playwright 1.49+

Unit + component tests MUST use Vitest 2. E2E tests MUST use Playwright 1.49+. Jest and Cypress MUST NOT be added.

#### Scenario: New unit test

- GIVEN a new utility function
- WHEN tested
- THEN the test file imports from `vitest`
- AND runs via `pnpm test`

### Requirement: Performance budgets enforced per route

Every app route MUST declare a JS budget via `size-limit` configuration. Hard ceilings (defaults; overrides require spec amendment):

| Surface                 | LCP                      | FID      | CLS      | JS shipped          |
| ----------------------- | ------------------------ | -------- | -------- | ------------------- |
| kiruk-web static routes | ≤ 1.5s                   | ≤ 100ms  | < 0.05   | ≤ 50 KB             |
| kiruk-web islands       | ≤ 2.0s                   | ≤ 100ms  | < 0.1    | ≤ 150 KB total page |
| kiruk-portal            | ≤ 2.5s                   | ≤ 200ms  | < 0.1    | ≤ 250 KB            |
| Product (per type)      | declared in product spec | declared | declared | declared            |

Lighthouse CI MUST run on every PR and fail on regressions > 5 points.

#### Scenario: Budget regression blocks merge

- GIVEN a PR adding 80 KB of JS to a static kiruk-web route
- WHEN size-limit + Lighthouse CI run
- THEN the PR is blocked with the budget overage cited
- AND the contributor must reduce or open a budget-amendment proposal

### Requirement: Observability = Sentry + Speed Insights

Production deploys MUST wire Sentry for error tracking and Vercel Speed Insights (or equivalent open-source RUM) for Core Web Vitals. PII in error reports MUST be scrubbed per `repo-privacy`.

#### Scenario: Production error surfaces

- GIVEN an uncaught error in a production deploy
- WHEN it fires
- THEN Sentry captures it with stack + breadcrumbs minus PII
- AND it reaches the founder within minutes via configured channel

### Requirement: Deploy = Vercel + Cloudflare hybrid

- `kiruk-web` MUST deploy to Vercel (Astro adapter for Vercel) for tight Next.js-portal parity and edge CDN.
- `kiruk-portal` MUST deploy to Vercel.
- Browser extensions deploy to Chrome Web Store / Firefox Add-ons.
- Edge APIs and standalone products MAY deploy to Cloudflare Pages/Workers when egress cost or global edge presence dominates.
- Static asset hosting MAY use Cloudflare R2 (S3-compat, zero egress fee) when bandwidth is a concern.

#### Scenario: Product picks deploy target per tier

- GIVEN a new product entry in `openspec/specs/products/registry.md`
- WHEN the founder picks a deploy target
- THEN it is one of: Vercel, Cloudflare Pages, Cloudflare Workers, Chrome Web Store, Firefox Add-ons, R2 + static host, or a documented justified exception

### Requirement: kiruk-web public origin

`kiruk-web` MUST ship at `https://studio.kiruk.in` with Astro `site: 'https://studio.kiruk.in'` and `base: '/'`. Internal links, asset URLs, and route definitions MUST go through the base-path helper so a later apex domain (`kiruk.studio`) is a single config change plus a link audit. The personal portfolio at `https://kiruk.in` is a separate app and MUST NOT host the public studio. The path `kiruk.in/studio` MUST NOT be the public studio origin (it MAY remain the personal site’s private authoring UI).

#### Scenario: Internal link is origin-root

- GIVEN the home page links to the process-log route
- WHEN the site is built with `base: '/'`
- THEN the emitted href is `/devlog`, not `/studio/devlog`

#### Scenario: Base path is config-localized

- GIVEN a future move to an apex domain
- WHEN `site`/`base` are updated in `astro.config.mjs`
- THEN no hardcoded `/studio` prefixes remain scattered in component source

#### Scenario: Person and studio stay on separate hosts

- GIVEN kiruk-web is the public studio
- WHEN a visitor opens the studio origin
- THEN the host is `studio.kiruk.in`
- AND `kiruk.in` remains the personal portfolio

### Requirement: Successor watch list maintained

This spec MUST maintain a successor watch list (below). A re-evaluation pass MUST run at the end of each calendar year. Moving an item from watch to locked requires an OpenSpec proposal.

| Locked                     | Successor watched             | Trigger to switch                                 |
| -------------------------- | ----------------------------- | ------------------------------------------------- |
| Node 22                    | Node 24 LTS                   | When Node 24 reaches active LTS (Oct 2026)        |
| Tailwind v4                | n/a — Tailwind v5 if released | Major version release with migration path         |
| Three.js r170 WebGL        | Three.js WebGPURenderer       | Browser support > 90% globally                    |
| pnpm 10                    | Bun runtime + Bun install     | When Bun's workspace + Next.js parity is verified |
| Framer Motion / Motion v11 | n/a                           | —                                                 |
| GSAP 3                     | n/a                           | —                                                 |
| React 19                   | React with Compiler (stable)  | When React Compiler exits experimental            |
| Velite                     | n/a                           | If maintainer stops shipping                      |
| Drizzle                    | n/a                           | If schema-as-code paradigm shifts                 |
| Better-Auth                | n/a                           | If feature parity drops                           |

#### Scenario: Annual re-evaluation

- GIVEN the end of a calendar year
- WHEN the founder runs the stack-review ritual
- THEN each locked choice is checked against the watch list
- AND any switch is proposed via OpenSpec

## Acceptance Artifacts

- `package.json` root with engines + packageManager pinned
- `tsconfig.base.json` at repo root with strict flags
- `biome.json` at repo root
- `.husky/` folder with pre-commit + commit-msg hooks
- `commitlint.config.mjs` at repo root
- `.size-limit.cjs` at repo root (or per-app)
- `apps/kiruk-web/` — Astro 5 scaffold (replaces current Next.js stub)
- `apps/kiruk-portal/` — Next.js 15 scaffold (already stubbed)
- `velite.config.ts` per content-consuming app
- `lighthouse-ci.yml` workflow

## Cross-references

- [`/openspec/specs/brand-consistency-ci/spec.md`](../brand-consistency-ci/spec.md) — enforces token-only colors, eye-motif, scribble.
- [`/openspec/specs/design-tokens/spec.md`](../design-tokens/spec.md) — token pipeline that feeds Tailwind v4.
- [`/openspec/specs/products/spec.md`](../products/spec.md) — products pick deploy target within this envelope.
- [`/openspec/specs/repo-privacy/spec.md`](../repo-privacy/spec.md) — PII scrubbing in observability.
