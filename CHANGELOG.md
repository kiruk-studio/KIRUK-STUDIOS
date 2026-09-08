# Changelog — Kiruk

All notable changes, decisions, and plan shifts. Every entry answers **why** — not just what.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/) with an added **Why** line per entry.

---

## [Unreleased]

### Added

- **Hand-drawn design system — architecture locked, repo unblocked.** Two OpenSpec proposals filed for the pass that makes kiruk hand-drawn end to end: [`adopt-forge-tooling`](openspec/changes/adopt-forge-tooling/proposal.md) admits Toolcraft as an **internal instrument** (kiruk's own Figma — not a product; PR1 is still parked) scoped to `apps/kiruk-forge/`, and [`add-kirukal-tokens`](openspec/changes/add-kirukal-tokens/proposal.md) adds the breakpoint / stroke / touch / drawn-asset token groups plus widens the eye-motif gate to `@kiruk/kirukal`.
  - **The research that shaped it:** `feTurbulence` maxes CPU cores and re-runs on every transform, so grain goes on **one** document-level paper ground, never per component. Excalidraw scaled roughness with element size and users reported the hand-drawn feel disappeared ([#7239](https://github.com/excalidraw/excalidraw/issues/7239)) — so deviation amplitude stays **absolute**, never normalized. Displacement-map units are absolute too, so wobble lives in **geometry**, not filters. Every existing sketchy-UI library fakes it with a randomizer; captured pen pressure and taper are the half that cannot be faked, and that is the whole reason the forge exists.
  - **Toolcraft is a signed host** — 685 file hashes, 709 protected paths, 18 byte-compared scripts. It cannot be re-skinned, and that is recorded rather than fought: the instrument is Toolcraft, everything it produces is 100% kiruk. Its shipped light theme matches founder decision B5.
  - **Why:** neither app had a component library and both duplicated the palette locally, so every new screen re-invented the language.

- **Design system is finally wired to the apps.** `kiruk-web` and `kiruk-portal` now depend on `@kiruk/design-system` and import `tokens/css`; their local `--paper/--ink/--pencil/--rule` are now **aliases onto semantic tokens** (`--color-bg`, `--color-fg`, the pencil ramp) rather than duplicated literals. Dropped `--seal: #c8402a`, a saturated hex in app source barred by the absurd-colour boundary and unused anyway. Aliases point at the _semantic_ layer specifically to avoid a `--color-paper` cycle with Tailwind's `@theme`.
  - **Why:** `tech-stack` already required apps to consume the emitted tokens; nothing did.

### Fixed

- **Five eye components were failing `design-tokens` R4 in silence.** `EyeIris`, `EyeGaze`, `EyePortal`, `EyeConstellation` and `Scribble` referenced CSS variables the token build no longer emits (`--color-iris-core`, `--color-void`, `--color-portal-glow`, `--color-halo-warm`, `--color-kohl`) with **saturated hex fallbacks** (`#FF4D2E`, `#7C4DFF`, `#FFD166`) — so they rendered off-brand colour, violating both R4 and the monochrome rule. Remapped to `--color-ink` / `--color-paper` / the pencil ramp, following `EyePrimary`'s iris-dark/pupil-light convention.

- **Repo gates that had never actually run.** `turbo.json` declared `check-types` while root ran `turbo run typecheck`, and `turbo run test` matched no task at all — so repo-wide typecheck was silently a no-op. Aligned the names, added `test` / `test:browser` tasks, and gave `packages/design-system` the `tsconfig.json`, `check-types` script and missing `"."` export it needed to be visible to turbo at all. **All three workspaces now typecheck for the first time.** `pnpm lint` was also failing outright on a stale worktree's nested `biome.json`; `.claude/` local state is now ignored by both Biome and git, and the two real lint errors it was masking are fixed.

- **`velite` was an unused dependency.** Config was missing from the working tree, nothing imported it, and `astro build` never invoked it — so the devlog pipeline `tech-stack` requires did not exist. Restored `velite.config.ts`, wired `velite build` into `kiruk-web`'s build, and gitignored the generated `.velite/`.

- **Brand-thinking knowledge base (17 Day Brand pass through Unique Edge).** [ideas/brand-thinking/](ideas/brand-thinking/README.md) is the dump home for this pass: skill, rule, `/kiruk-brand-thinking`, chapters 01–03 and 05–07 filed (Balance 04 skipped). Working name **kiruk**; money as doctor-trust and start-small (figures off-git); studio before company; people snapshot **Sanxia** (persona, not a live universe); three edges — express don’t coat, **Kiruk Framework**, a pack not only a studio. Why: thinking captured without locking `VISION-MISSION.md`. Next spoken block: Brand (08).

- **`kiruk-portal` — onboarding rebuilt as immersive interactions, in the sketch style.** The prior tests read like an old-style form. Rebuilt every step as a scene you act on, not a question list — personality = a **drag-compass** (drag the `me` token toward whichever of the 5 archetypes pulls you; nearest = live read, ink-trail follows — one gesture replaces the whole quiz); vibe = **chunky pointer-drag gauges** (poles scale with value); embedded scribble; scene-per-step nav with a circle → button + progress dots.
  - **Correction:** a first pass wrongly adopted the founder's **Absurdly** Figma as the _design system_ (brutalist grotesque + graph grid). Absurdly is the reference for **interaction patterns only** — the look stays kiruk's **hand-drawn pencil/sketch** system. Re-skinned: faint notebook ruling, hand display headings, hand-font tiles, outline marks. (Also caught a `.invert` collision with Tailwind's invert filter utility → `.ink-block`.)
  - **Why:** immersive, conceptual interaction is the brand — but it must wear kiruk's sketch skin, not a borrowed brutalist one.

- **`kiruk-portal` — client onboarding flow (before the scribble).** Added `/onboard` ([OnboardingWizard.tsx](apps/kiruk-portal/src/components/OnboardingWizard.tsx)): a 7-step intake — client detail → **kirukal archetype quiz** (scored: Maker/Dreamer/Rebel/Builder/Wanderer) → **company vibe sliders** (safe↔weird, fast↔considered, solo↔collab, minimal↔maximal, quiet↔loud) → **scribble-the-energy** (embedded canvas) → product vision → a "the read" summary with book-a-call + start-scribble CTAs. Hybrid test (quiz + sliders + scribble + open text). `ScribbleCanvas` made embeddable (`heightClass` + `onCapture` props). Verified the full flow in-browser (archetype scores live, sliders, embedded canvas, summary); `tsc` clean; zero console errors.
  - **No DB (founder call 2026-05-27):** state is localStorage-only; persistence (intake.md / Neon) lands with the auth+DB slice. Recorded in ROADMAP Phase 4 (sliced 1–4) + TASKS so it isn't forgotten.
  - **Why:** a proposal should start from understanding the human + company, not a form. The archetype/vibe read + a first scribble set up the collaborative pen-paper proposal and the kickoff call.

- **`kiruk-portal` slice 1 — the scribble-proposal canvas + devlog #1.** Reframes the client proposal: a proposal is **scribbled, not written**. Scaffolded the portal on Next.js 15 (App Router, Turbopack) + Tailwind v4 in the B&W sketch language — a scribble-desk landing with the client lifecycle map (lead → handoff), and `/proposals/new` ([ScribbleCanvas.tsx](apps/kiruk-portal/src/components/ScribbleCanvas.tsx)): a pen-and-paper 2D canvas (pointer drawing, pressure-driven width, undo, clear, export PNG) reading ink/paper from the design tokens. Verified in-browser (strokes draw + count, graphite on white); `tsc` clean. Fixed a `setPointerCapture` throw that aborted `pointerdown` on synthetic pointers; added a ResizeObserver for crisp backing size.
  - **Phased (full-stack target, founder choice):** slice 2 = universe dashboard + save scribbles into `kiruk-projects/<universe>/` + lifecycle state machine; slice 3 = Better-Auth + Neon/Drizzle + client read-view (P1/P2/P3); slice 4 = real-time client mark-back + deploy.
  - **Spec impact:** redefining the `proposal` artifact (client-lifecycle / template-proposal) from a prose generator-doc to a collaborative scribble canvas needs an OpenSpec change (explore-now, spec-after).
  - **Devlog #1:** [content/devlogs/2026-05-27-scribble-becomes-the-interface.mdx](content/devlogs/2026-05-27-scribble-becomes-the-interface.mdx) (state: draft) — the sketch direction, smoke→pencil, spec-driven apply.
  - **Why:** lab-led studio with no client-facing tool and no public process trail. The scribble proposal is a kirukal way to pitch (pen-and-paper, collaborative); the devlog turns the build-in-public engine on.

- **Founder-decisions session (2026-05-26) + `adopt-sketch-direction` OpenSpec proposal.** Walked all open `FOUNDER_DECISIONS.md` questions (B1–B5, W1–W7, I1–I3, S1–S2, P1–P3, M1–M2, PR1–PR3, AU1–AU2) as a guided interview; recorded every answer inline + a locked-decisions log + a "Spec impacts to action" section.
  - **Headline decisions:** identity unchanged (creative studio); palette = white paper + black stroke with **absurd color reserved for assets** (blend digital↔paper); type = hand faces for display/voice + clean sans body; light-only; homepage = **POV product-designer's desk with 2.5D interactive hands** (left/right hands react to side + activity); desk objects = nav; "leave a note on the desk" = contact; ship under `kiruk.in/studio`; portal = Arun + client read-view on Better-Auth; brand-CI = Husky + Actions; devlog cadence = "publish when real."
  - **Spec realignment APPLIED + archived:** `adopt-sketch-direction` ([openspec/archive/adopt-sketch-direction/](openspec/archive/adopt-sketch-direction/)) — deltas merged into `design-tokens` (mono base + absurd-asset boundary + hand/sans fonts), `brand-system` (hand+sans type pairing, placeholder eye-mark, light-only), `build-in-public` (dropped the 14-day devlog floor), `tech-stack` (kiruk.in/studio base path), `brand-consistency-ci` (drawn-eye + placeholder tolerance). **Validates strict** (23/23) and `pnpm doctor` green.
    - **Applied to code:** rewrote `packages/design-system/tokens/{core,semantic,components,type}.json` to the B&W paper/ink/pencil-ramp base + `color.absurd.*` asset group + hand & body-sans font families; regenerated `build/` via `pnpm tokens:build`; updated `EyePrimary.tsx` to mono token vars; `apps/kiruk-web` now ships under `/studio` base (`astro.config.mjs` + `src/lib/base.ts` href helper + base-aware nav/CTA/favicon); `scripts/doctor.mjs` devlog cadence relaxed to informational; refactored `CustomCursor.tsx` SVG fills + `favicon.svg` to mono. Verified in-browser at `/studio` — renders, eye cursor, base-prefixed links, zero console errors.
  - **Founder feedback captured:** the cross-hatch hero reads like **smoke, not pencil** — to be reworked into stamped pencil strokes and folded into the desk/hands concept (build phase, post-spec).
  - **Why:** the founder changed the visual direction; per CLAUDE.md §4 + non-neg #5 durable palette/brand/cadence changes must go through OpenSpec, not quiet edits. This realigns the specs so the upcoming UI rework is legitimate.

- **Sketch design-language foundation for `kiruk-web` (UI rework, slice 1 of "entire UI rework").** Adopted the hand-drawn "sketch studio" language from the existing kiruk.in site (reference at `C:\Users\arunk\Downloads\kiruk-in`) into the studio web app, black & white only.
  - **Fonts:** ported Bridges Not Walls (KIRUK wordmark), Left Hand (handwriting body/nav), Magnetic Drawing (display) into [apps/kiruk-web/src/assets/fonts](apps/kiruk-web/src/assets/fonts), wired via `@font-face` + CSS vars (`--font-wordmark` / `--font-hand` / `--font-display`); studio-own Kirukal + Kirukulam copied for later use. **LICENSE GATE:** the three third-party faces need web-embedding license confirmation before this repo ships publicly (noted in [global.css](apps/kiruk-web/src/styles/global.css)).
  - **Sketch CSS system:** curated monochrome port into [global.css](apps/kiruk-web/src/styles/global.css) — `sketch-border`, `sketch-button`, `paper-texture`, `notebook-bg`, `wireframe-bg`, `scribbled-*` type voices, `torn-paper`, `jitter`/`wobble`/`draw` keyframes, reduced-motion guard.
  - **Sketch primitives:** [SketchNav.astro](apps/kiruk-web/src/components/sketch/SketchNav.astro) (bottom hand-drawn nav), [SketchButton.astro](apps/kiruk-web/src/components/sketch/SketchButton.astro), and the signature [CustomCursor.tsx](apps/kiruk-web/src/components/sketch/CustomCursor.tsx) eye cursor (trailing body, pupil leads motion, blink on click, fine-pointer only). Staged for promotion into `@kiruk/design-system`.
  - **Home reskin:** KIRUK wordmark + handwritten eyebrow/tagline + sketch CTA + bottom sketch nav, over the existing pencil cross-hatch field. Verified in-browser (fonts load, eye cursor, nav, zero console errors); `tsc --noEmit` clean. See [LEARNINGS.md](LEARNINGS.md) 2026-05-26 for the cascade-layer fix uncovered during verification.
  - **Governance (explore-now, spec-after — founder choice):** the B&W palette, fonts, and sketch primitives are app-local for now; promotion into `@kiruk/design-system` tokens + the `design-tokens` / `brand-system` specs requires an OpenSpec proposal (non-neg #5) before ship, plus the font-license clearance above.
  - **Why:** the founder wants the whole studio UI to match kiruk.in's hand-drawn world, end-to-end. Building the foundation (fonts + sketch system + core primitives) and proving it on the home page first de-risks the larger rework and gives a concrete base to extend route-by-route.

- **`kiruk-web` landing-page hero — cursor-sketch field, black & white (iteration 1).** Scaffolded the Astro 5 app shell ([astro.config.mjs](apps/kiruk-web/astro.config.mjs), [tsconfig.json](apps/kiruk-web/tsconfig.json), [Base.astro](apps/kiruk-web/src/layouts/Base.astro), [index.astro](apps/kiruk-web/src/pages/index.astro), Tailwind v4 via `@tailwindcss/vite`). Built a GPU sketch field as a client-only React island: raw Three.js r170 ping-pong render targets; the cursor lays down a density field (minimal flow, so marks behave like drawn lines), rendered as **graphite pencil cross-hatch + paper tooth** ([InkField.ts](apps/kiruk-web/src/components/ink/InkField.ts), [shaders.ts](apps/kiruk-web/src/components/ink/shaders.ts), [InkHero.tsx](apps/kiruk-web/src/components/InkHero.tsx)). Visitor sketches with the cursor; sketching **reveals the eye motif** beneath as line-art (contour + iris ring + pupil, geometry mirrors `EyePrimary`). Palette: **monochrome only** — near-white paper + graphite ink, no accent (the founder adds colour by hand where needed; `--seal` retained for that). Verified in-browser (sketches, cross-hatch reads as pencil, reveals eye, zero console errors); `tsc --noEmit` clean; `prefers-reduced-motion` renders a static frame.
  - **Reference, not copy:** loosely inspired by [inkField](https://github.com/ileivoivm/inkField), whose engine is closed-source and runs on p5.js (off the locked stack). The studio direction is **sketch, not ink** — reimplemented from scratch on the locked Three.js/GLSL stack as pencil hatching.
  - **Governance flags (must clear before this ships):** (1) hero palette differs from the current B3 design tokens (light paper vs. dark void) — kept as app-local CSS vars in [global.css](apps/kiruk-web/src/styles/global.css) to honor non-negotiable #5 (no design token without a spec); promote only after a B3/B5 OpenSpec proposal. (2) `FOUNDER_DECISIONS.md` brand locks B1–B5 and website locks W1–W7 are still `[ ]` — this iteration is exploration toward those answers, not a locked surface.
  - **Iteration 2 (deferred):** hand-jittered hatch lines (organic wobble), autonomous scribble→eye morph on load, route shell (`/kirukism`, `/ism`, …), Velite content collections, Vercel adapter, size-limit/Lighthouse budget wiring.
  - **Why:** the founder chose to start the public site from its most expressive surface — a black-and-white sketch hero that embodies "scribbles into worlds" (kiruk = scribble). Building the real interaction early de-risks the hardest craft (the WebGL feel) and turns the open W1/W3 founder questions into something concrete to react to.

- **Repo tidy + package-manager correction.** Removed the committed npm `package-lock.json` (the `tech-stack` spec explicitly forbids it; the repo is pnpm-only) so `pnpm-lock.yaml` is the sole lockfile; gitignored generated `.astro/` and `.vercel/`; fixed a CLAUDE.md §6 contradiction (kiruk-web mislabeled "Next.js 15" → **Astro 5**, portal tagged Next.js 15); moved the stray root file `Kiruk Studio Vision, System, and Claude Code Implementation Plan.md` → [docs/vision-and-system-plan.md](docs/vision-and-system-plan.md) and linked it in the docs index.
  - **Why:** two lockfiles from two package managers is a reproducibility hazard and a direct spec violation; the framework contradiction would mislead any contributor; a space-laden root filename sat outside the navigation map. No folder restructure — the spec-governed architecture is sound and structural change is gated behind OpenSpec proposals.

- **`tech-stack` capability + `lock-tech-stack` proposal** — full 2026 best-in-class envelope locked across runtime, package manager, monorepo orchestrator, lint, frameworks per app surface, styling, animation, 3D, content, database, auth, backend, validation, state, testing, performance budgets, observability, deploy targets. Spec at [openspec/specs/tech-stack/spec.md](openspec/specs/tech-stack/spec.md); proposal at [openspec/changes/lock-tech-stack/](openspec/changes/lock-tech-stack/). Validates strict.
  - **Headline picks (researched, Jan 2026):** Node 22 LTS · pnpm 10 · Turborepo 2 · TypeScript 5.7 strict · **Biome 2** for code (25× faster than ESLint+Prettier) + Prettier 3 for MD · Husky 9 + lint-staged 16 + commitlint 19 (Conventional Commits) · **Astro 5** for `kiruk-web` (content-first, islands, zero-JS-by-default — beats Next.js on LCP/TBT for this profile) · **Next.js 15 + React 19 + RSC + Server Actions + PPR** for `kiruk-portal` · **Tailwind v4** (Oxide engine) · **Motion v11 + GSAP 3** · **Three.js r170+ + R3F 9 + drei + TSL** shaders (WebGPU-ready) · **MDX 3 + Velite** (Contentlayer is unmaintained) · AVIF + WebP + Sharp · **Postgres on Neon + Drizzle ORM** (Prisma forbidden new code) · **Better-Auth** (NextAuth forbidden new code) · **Server Actions + Hono on Cloudflare Workers** for backend (Spring Boot forbidden unless JVM-only workload demanded) · **Zod 4** for validation · **Zustand 5** for client state · **Vitest 2 + Playwright 1.49+** for tests · **size-limit + Lighthouse CI** with per-route JS + Core Web Vitals budgets · **Sentry + Speed Insights** for observability · **Vercel + Cloudflare hybrid** deploy.
  - **Successor watch list** maintained inside the spec for annual year-end re-evaluation (Node 24, Bun, WebGPU, React Compiler).
  - **Concrete config files added:** [tsconfig.base.json](tsconfig.base.json) (strict + `noUncheckedIndexedAccess`), [biome.json](biome.json), [commitlint.config.mjs](commitlint.config.mjs), [.husky/pre-commit](.husky/pre-commit) + [.husky/commit-msg](.husky/commit-msg), [.size-limit.cjs](.size-limit.cjs), [.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml) placeholder.
  - **Root package.json bumped:** `engines.node` → `>=22`, `packageManager` → `pnpm@10.0.0`, new scripts (`lint` / `lint:fix` / `format` / `format:fix` / `typecheck` / `test` / `size` / `prepare`), new devDeps (Biome, commitlint, Husky, lint-staged, Prettier, size-limit, TypeScript 5.7).
  - **App stubs updated:** `apps/kiruk-web/package.json` switched to Astro 5 + R3F 9 + Motion + GSAP + Velite + Sharp + Tailwind v4 + Zod 4 with rationale captured in `apps/kiruk-web/README.md` ("Why Astro and not Next.js"). `apps/kiruk-portal/package.json` pinned to React 19 + Tailwind v4 + Motion + Zod + Zustand + Drizzle + Better-Auth + Hono.
  - **`.nvmrc` + `.node-version`** bumped to `22`.
  - **Why:** kiruk launches as a public creative OS where craft is the signal. Every layer needs the best 2026 pick, with stated rationale and successor watch, so contributors and future kirukan inherit a stack that won't lag or break. Without locking, drift would be inevitable. The performance-budget table makes "world-class" measurable, not aspirational.

- **Foundation hardening for open-source launch** — config infrastructure, OSS compliance docs, dual license, CI gates, knowledge-layer files, README rewrite. Brings the repo to a state a stranger can land on, recognise as serious, and contribute to.
  - **Hygiene infra**: `.editorconfig`, `.nvmrc`, `.node-version`, `.gitattributes` (LF normalization for Windows-origin repo), `.prettierrc.json` + `.prettierignore`, `.markdownlint.jsonc`; expanded `.gitignore` for `.turbo/`, `.brand-ci/`, `scribble/.raw/`, dist/coverage caches.
  - **OSS compliance**: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) (Contributor Covenant 2.1, kirukism-flavored), [`SECURITY.md`](SECURITY.md) (private disclosure, scope, timelines, safe harbor), [`GOVERNANCE.md`](GOVERNANCE.md) (founder-led with documented graduation path), [`CITATION.cff`](CITATION.cff), [`.github/FUNDING.yml`](.github/FUNDING.yml), [`.github/CODEOWNERS`](.github/CODEOWNERS), issue templates: [bug](.github/ISSUE_TEMPLATE/bug.yml) / [idea](.github/ISSUE_TEMPLATE/idea.yml) / [proposal](.github/ISSUE_TEMPLATE/proposal.yml) + [config](.github/ISSUE_TEMPLATE/config.yml).
  - **License split** — [`LICENSE`](LICENSE) becomes a router; code is MIT in [`LICENSE-CODE`](LICENSE-CODE), content (manifesto, devlogs, specs as prose, scribbles, templates) is CC-BY 4.0 in [`LICENSE-CONTENT`](LICENSE-CONTENT). Trademark note: kiruk/kirukism/eye-motif identity are not licensed for brand reuse.
  - **CI gates**: [`.github/workflows/openspec.yml`](.github/workflows/openspec.yml) runs `pnpm spec:validate` on every PR and push; [`.github/workflows/tokens.yml`](.github/workflows/tokens.yml) builds + verifies design tokens on tokens-touching changes; [`.github/workflows/doctor.yml`](.github/workflows/doctor.yml) weekly health probe.
  - **`pnpm doctor`** — [`scripts/doctor.mjs`](scripts/doctor.mjs) reports toolchain, openspec validation, capability registration drift, devlog cadence (14-day floor), scribble coverage, open proposals, idea-log promotion readiness.
  - **Knowledge layer**: [`GLOSSARY.md`](GLOSSARY.md) (single source for vocabulary), [`docs/README.md`](docs/README.md) (navigation index by role), [`openspec/specs/_template/spec.md`](openspec/specs/_template/spec.md) (spec authoring template).
  - **Pen-and-paper wired into scripts**: `scripts/capture-session.mjs` writes `scribble` field (null OK for exploration); `scripts/promote-idea.mjs` blocks promotion without a scribble reference (front-matter line or `--scribble=` flag); [`kiruk-templates/_scribble/`](kiruk-templates/_scribble/) holds manifest + textual templates.
  - **README rewrite** — badges, repo-at-a-glance diagram, role-based navigation, license clarity, slash-command index.
  - **package.json hardening** — `homepage`, `repository`, `bugs`, `keywords`, `license: SEE LICENSE IN LICENSE`, new scripts `doctor` / `format` / `format:fix`.
  - **Why:** kiruk launches as a public, transparent creative OS. A repo visitor's first ten clicks need to load: license clarity, governance, security path, code of conduct, navigation, validation proof. These are the "world-class OSS" table stakes. Without them, the brand says "indie experiment"; with them, it says "this team takes its own work seriously."

- **`expand-studio-model` proposal** — 6 new capability specs (`products`, `build-in-public`, `content-pipeline`, `client-lifecycle`, `pen-and-paper`, `brand-consistency-ci`) + 2 modified (`idea-capture` adds `scribble` field; `ism` cross-links to `products`). Proposal at [openspec/changes/expand-studio-model/proposal.md](openspec/changes/expand-studio-model/proposal.md); validates with `npx openspec validate expand-studio-model --strict`.
  - **Why:** founder locked four strategic decisions (2026-05-18): lab-led model (ISM + products front door, services follow), process+decisions transparent but numbers private, full digital product surface (tools/micro-apps/extensions/SaaS/toys), and all four automation streams active. The old OS only modeled services + ISM placeholder; this proposal closes the gap so the studio has spec language for products, transparency boundary, content pipeline, lifecycle, scribble-first ritual, and brand-CI gates.
- **Pen-and-paper-first ritual** as a non-negotiable across CLAUDE.md, VISION-MISSION.md, and the new `pen-and-paper` spec. Every universe / ISM / product begins with a sketch (image or `scribble/textual.md` with `reason:`). Idea promotion blocked without it.
  - **Why:** kiruk means scribble. The studio refuses to let digital tools sand off the raw fingerprint of where work came from. Making the rule a spec is the only way to keep it under solo-founder time pressure.
- **Open/Closed transparency boundary** enumerated in `build-in-public` spec. Devlogs, sketches, code, specs are open; revenue, contracts, client identities, customer data are closed. Story drops (quarterly, qualitative) are the only public revenue surface.
  - **Why:** "build in public" without a boundary leaks. Encoding the boundary in a spec means contributors and agents share the same line — and changes to it require an OpenSpec proposal, not a quiet edit.
- **Product registry** — `openspec/specs/products/registry.md` initialized empty. New in-house products land here only via an OpenSpec change proposal.
- **`kiruk-projects/_products/`** folder placeholder for in-house digital product universes.
- **`content/devlogs/`, `content/case-studies/`, `content/story-drops/`, `content/social/`, `content/scribbles/`** subfolders scaffolded with `.gitkeep`.
- **ROADMAP** — new Phase 3.5 (Product Track v0) + Phase 4.5 (Automation Spine).
- **FOUNDER_DECISIONS.md** — STRATEGY section with four locked decisions (2026-05-18); new PRODUCTS (PR1–PR3) + AUTOMATION (AU1–AU2) question blocks.

### Added

- **Monorepo scaffold** — `pnpm-workspace.yaml` (workspaces: `apps/*`, `packages/*`), `apps/kiruk-web/` stub (Next.js 15, kiruk.studio target), `apps/kiruk-portal/` stub (internal client management). Design system stays at root until `packages/design-system` migration (Phase 2 next).
  - **Why:** kiruk holds everything — website, client portal, ISM experiments, design system — in one repo, deployed independently. Monorepo is the foundation for that.
- **Kirukism vocabulary** — `kirukism` (the movement/cult/philosophy), `kirukargals` (external collaborators), `kirukan` (studio co-workers) now encoded in [CLAUDE.md](CLAUDE.md) §1 and §3, [VISION-MISSION.md](VISION-MISSION.md) (new Kirukism section + People table), [CONTRIBUTING.md](CONTRIBUTING.md) (kirukargal framing), [TASKS.md](TASKS.md), and [ROADMAP.md](ROADMAP.md).
  - **Why:** the studio isn't just a business — it's a movement. kirukism drives why people collaborate, not just what they build. Language encodes intent.
- **Full monorepo ROADMAP** — [ROADMAP.md](ROADMAP.md) rewritten: 7 phases (OS bootstrap, brand spine, monorepo, website, portal, ISM lab, kirukargal network, open OS) + deployment topology table + continuous tracks.
  - **Why:** old 4-phase roadmap didn't cover the website, client portal, social pipeline, or kirukargal collaboration model. The studio needs a real plan to see where it's going.

### Changed

- **Creative OS docs** — [CLAUDE.md](CLAUDE.md) new §2 _Creative journey_; spec workflow renumbered and clarified as for **durable** work; exploration in inbox stays out of the OpenSpec gate until promotion. [VISION-MISSION.md](VISION-MISSION.md) principle 9, [AGENTS](AGENTS.md) _Creative rhythm_, [README](README.md), [LEARNINGS.md](LEARNINGS.md), [openspec/project.md](openspec/project.md) vocabulary, [kiruk-studio](.cursor/rules/kiruk-studio.mdc) and [lessons-learned](.cursor/rules/lessons-learned.mdc) rules aligned: **imagination and iteration are first-class; rules are scaffolding, not the ceiling.**
  - **Why:** match the studio’s real process—multiple iterations, fail/succeed, ongoing—and avoid reading specs as a demand for day-one finality.
- **Section renumbering** in `CLAUDE.md` (Founder → §3 … Session → §8); cross-refs updated in [brand-system](openspec/specs/brand-system/spec.md), [template-portfolio](openspec/specs/template-portfolio/spec.md), generators, [kiruk-intake](.claude/commands/kiruk-intake.md), [kiruk-artifact](.claude/commands/kiruk-artifact.md), [TASKS](TASKS.md), [CHANGELOG](CHANGELOG.md) founder line.

### Added

- **`operational-learning` capability** — [LEARNINGS.md](LEARNINGS.md) (append-only mistake log with **Mistake / Root cause / Fix / Guard**), [openspec/specs/operational-learning/spec.md](openspec/specs/operational-learning/spec.md), and always-on Cursor rule [`.cursor/rules/lessons-learned.mdc`](.cursor/rules/lessons-learned.mdc). Strengthen prevention on repeat; never rewrite old entries to hide a repeat. Proposal: [openspec/archive/add-operational-learning/proposal.md](openspec/archive/add-operational-learning/proposal.md).
  - **Why:** make “learn from the mistake, don’t repeat it” a first-class studio practice for humans and AI.
- **`repo-privacy` capability** — OpenSpec spec for keeping API keys and private client data out of git, optional `kiruk-projects/.../.local-only/` pattern, and code-review expectations. Supporting files: [CONTRIBUTING.md](CONTRIBUTING.md), [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md), [`.env.example`](.env.example), stricter [`.gitignore`](.gitignore), Cursor rules [`.cursor/rules/privacy-secrets.mdc`](.cursor/rules/privacy-secrets.mdc) and [`.cursor/rules/code-review.mdc`](.cursor/rules/code-review.mdc).
  - **Why:** ship an open, transparent process without leaking credentials or other people’s confidential material; give humans and agents the same clear rules and PR checklist.

### Changed

- **OpenSpec** — `add-repo-privacy-spec` moved from `openspec/changes/` to `openspec/archive/add-repo-privacy-spec/` after apply.
  - **Why:** match the documented propose → validate → apply → archive lifecycle.
- **Removed Pencil MCP** from entire studio OS. Design system is now code-only.
  - **Why**: founder explicit decision. All visual primitives live as React SVG in `packages/design-system/components/`.
- **packages/design-system/components/** added — 6 React SVG components: `EyePrimary`, `EyeIris`, `EyeGaze`, `EyePortal`, `EyeConstellation`, `Scribble`. Colors via CSS custom properties; no hardcoded hex.
- **Token pipeline live** — `npm run tokens:build` emits CSS/Tailwind/TS. Fixed DTCG `usesDtcg: true` + Windows glob.
- **Token files** — fixed circular `color.paper` alias, removed top-level `$description` collision, restructured motion/components with proper namespacing.
- **Updated specs**: `brand-system` + `design-tokens` now reference code components, not Pencil files.
  - **Why**: spec claims must match actual implementation.

### Added

- **Studio OS bootstrap** — scaffolded repo structure, root docs, openspec skeleton, planning docs (`VISION-MISSION.md`, `ROADMAP.md`, `TASKS.md`, this file).
  - **Why**: establish spec-first, idea-capturing foundation before any brand/ISM work begins. Vision doc §6 mandates Claude Code as in-house creative engineer with OpenSpec workflow.
- **Scope refinement** — ISM lab starts as `openspec/specs/ism/spec.md` only; no heroism/kirukism/colorism/nomadism subfolders yet. Founder will spawn them via `/kiruk-ism-new` when ready.
  - **Why**: avoid premature commitment to ISM branches before brand spine is locked.
- **Founder context** — CLAUDE.md §3 encodes Arun's voice, stack, motifs, recurring themes from `kiruk-in`.
  - **Why**: keeps voice-sensitive artifacts (manifestos, case studies) aligned without re-briefing per session.

### Changed

- _none_

### Removed

- _none_

### Decisions

- **Design system from scratch** — not importing from `GraviaAI` or `kiruk-in`.
  - **Why**: founder explicit preference; ensures brand spine is purposeful, not inherited.
- **Explicit planning layer** — `VISION-MISSION.md` + `ROADMAP.md` + `TASKS.md` + `CHANGELOG.md` as top-level readable state.
  - **Why**: founder wants visibility into "what's happening" and ability to change plans without archaeology.
- **Pen file deferred save** — Pencil MCP cannot create a new file at a target path from API; Save-As is UI-only. Components scaffolded in the session buffer; founder to Save-As to `packages/design-system/pen-files/kiruk-design.pen`.
  - **Why**: Pencil MCP limitation. Documented in `packages/design-system/pen-files/README.md`.

---

## How to write an entry

1. New change? Add under `## [Unreleased]` → one of `Added` / `Changed` / `Removed` / `Fixed` / `Decisions`.
2. Each bullet: what changed + **Why**: line explaining intent.
3. On release (brand v1, phase completion, etc.): rename `Unreleased` → `[vX.Y] — YYYY-MM-DD`, start a fresh `[Unreleased]` on top.
4. Plan shifts (roadmap edits, scope drops) MUST land here, not in the roadmap diff alone.
