# Tasks — Kiruk

> Rolling task board. One source of truth for "what now?"
> When in doubt, match against `ROADMAP.md` phase exit criteria.
>
> Format: `- [ ] (priority: P0/P1/P2) <task> — owner: @handle — due: <date> — spec: <path>`
>
> **Vocabulary:** kirukargals = collaborators · kirukan = co-workers · kirukism = the movement

---

## Active — Founder input (most answered 2026-05-26)

- [x] (P0) 2026-05-18 — Strategy locks ST1–ST4 (lab-led, transparency boundary, product surface, automation streams)
- [x] (P0) 2026-05-26 — **B1–B5** brand (eye-mark placeholder, custom wordmark, B&W+absurd-assets, hand+sans, light-only)
- [x] (P0) 2026-05-26 — **W1–W7** website (POV desk + 2.5D hands, desk-object nav, note-on-desk contact, just-Arun)
- [x] (P0) 2026-09-14 — Public studio origin `studio.kiruk.in` (W7 path superseded)
- [x] (P0) 2026-05-26 — **AU2** brand-CI runner = Husky + Actions
- [x] (P1) 2026-05-26 — **S1–S2** all platforms, full production · **P1–P3** client read-view, Better-Auth, full record · **M1–M2** tagline meaning + kirukargal def
- [ ] (P0) **I1–I2** — first ISM (which one + concept) — STILL OPEN, unblocks Phase 5
- [ ] (P0) **PR1–PR3** — first product (name, deploy, metric) — STILL OPEN, unblocks Phase 3.5
- [ ] (P0) **AU1** — content-pipeline runner — STILL OPEN, unblocks Phase 4.5
- [ ] (P1) I3 done (ISM ships as page on studio site)

---

## Active — Phase 2 (Monorepo Scaffold + Kirukism Identity)

- [x] (P0) `pnpm-workspace.yaml` — workspaces: apps/_, packages/_
- [x] (P0) `apps/kiruk-web/` stub — package.json + README
- [x] (P0) `apps/kiruk-portal/` stub — package.json + README
- [x] (P0) Kirukism vocabulary in CLAUDE.md, VISION-MISSION.md, CONTRIBUTING.md, TASKS.md
- [x] (P0) Full monorepo ROADMAP.md rewrite (all phases + deploy topology)
- [x] (P0) `packages/design-system/` migration — moved `design-system/` → `packages/design-system/`, all path refs updated — spec: openspec/specs/design-tokens/spec.md
- [ ] (P0) Root `turbo.json` — Turborepo build pipeline
- [ ] (P0) Update root `package.json` to use pnpm workspaces + turbo
- [ ] (P1) Smoke test: `pnpm install` from root resolves all workspaces

## Active — Phase 3 (kiruk-web) — rebuilding from scratch [~ in progress]

> 2026-10-17 founder reset. Old site snapshotted (`a201273`) and cut (`3cce46a`). Plan: [`ideas/studio-dawn/plan.md`](ideas/studio-dawn/plan.md).

- [x] ~~2026-05-26 → 2026-09-16 sketch site: hand fonts, sketch CSS, eye cursor, sketch nav, grease-pencil scene, `/about`, `/devlog`~~ — cut 2026-10-17 (the stroke-feel, landing-scene, Blender-photo, W1-reconcile, POV-desk, primitive-promotion and note-on-desk tasks went with it)
- [x] (P0) 2026-10-17 Snapshot + cut to a bare Astro shell; `build` + `check-types` pass
- [x] (P0) Vercel deploy on studio.kiruk.in
- [ ] (P0) Commit `pnpm-lock.yaml` together with the in-flight forge work (the lockfile carries both)
- [ ] (P0) **Phase 1 — IA:** Velite pieces + articles collections, listing rules as tested functions, six routes + piece pages + `/writing/rss.xml` as plain HTML
- [ ] (P0) **Phase 2 — Base layer:** clean, readable design (type, layout, diagrams); must stand alone without the sketch layer
- [ ] (P1) **Phase 3 — Ideation** in `ideas/studio-dawn/`: dawn loop, ink-bleed TSL prototype, sketch layer, eye link
- [~] (P1) **kiruk-codex skill** (`.claude/skills/kiruk-codex/`, plan `ideas/kiruk-codex/plan.md`): drafted 2026-10-20; Plate I tested twice and fixed; marks / depth / live added (untested on a mark plate); then founder review (name, rubric vs ultramarine, "TypeScript", type trio) and keep/delete the parked blend prototypes
- [ ] (P1) Founder: drop ink-bleed + dawn references into `ideas/studio-dawn/references/` (gitignored)
- [x] (P0) 2026-11-05 **mai ink engine** (`packages/mai`) + skills `/kiruk-mai`, `/kiruk-mai-proof`, `/kiruk-mai-style` + Plate III (the eye of the volute) — spec: packages/mai/README.md
- [ ] (P1) Founder: review Plate III (four questions in `ideas/kiruk-codex/plates/plate-03-volute/NOTES.md`) and the three mai skills
- [ ] (P1) mai: a codex plate in Leonardo's manner (the eye and its light) — quill, iron-gall, left-hand hatching, notes with readable twins
- [ ] (P2) mai: phone layout for landscape plates (critic `type.phone`)
- [ ] (P2) Founder decision: red construction under a rubric overlay (critic `style.red-confusion`, research 02 C1)
- [ ] (P2) Move folio `ink/pen.ts` and burin `vector/burin.ts` onto `@kiruk/mai` once the founder approves the engine
- [ ] (P1) **Phase 4 — Stack + spec:** revise tech-stack, spec dawn palette tokens, mark old sketch/grease-pencil requirements superseded, close `openspec/changes/grease-pencil-scene`
- [ ] (P2) **Phase 5 —** founder sketch layer + a curated skill per curated thing
- [ ] (P1) Review the ways-of-working proposal (`ideas/ways-of-working/proposal.md`, from the research session)
- [ ] (P2) Prags on `/work` only after Prakathiswar's written consent

## Active — Phase 4 (kiruk-portal: scribble → handoff) [~ in progress]

- [x] (P0) Next.js 15 + Tailwind v4 scaffold, B&W sketch design
- [x] (P0) `/proposals/new` scribble-proposal canvas (pen draw, undo, clear, export)
- [x] (P0) `/onboard` client onboarding — detail → archetype quiz → vibe sliders → scribble → product vision → summary
- [ ] (P0) **Slice 2:** universe dashboard + lifecycle state machine; server actions write onboarding → `intake.md`/`state.md`, scribbles → universe `scribble/`
- [ ] (P0) **Slice 3 [needs architecture lock]:** Better-Auth + Neon/Drizzle; client read-only view; replace localStorage/file persistence with DB
- [ ] (P1) **Slice 4:** real-time collaborative scribble (client marks back) + collaborative-call hook + Vercel deploy
- [ ] (P1) OpenSpec: redefine `proposal` artifact (client-lifecycle / template-proposal) prose-doc → scribble-canvas
- [ ] (P2) Font-license clearance before portal goes public (shared with kiruk-web)

## Later — Phase 4.5+ (automation, ISM, kirukargals)

See `ROADMAP.md` Phases 4.5–7.

---

## Active — Spec apply work (post-validation, pre-archive)

- [x] (P0) 2026-05-18 — `expand-studio-model` proposal validated (`npx openspec validate expand-studio-model --strict` passes)
- [x] (P0) 2026-05-18 — `lock-tech-stack` proposal authored + validated — `tech-stack` capability spec locks 2026 envelope
- [ ] (P0) Apply `expand-studio-model`: full specs already authored at `openspec/specs/<cap>/spec.md`; move proposal folder to `openspec/archive/expand-studio-model/` once founder reviews — spec: openspec/changes/expand-studio-model/
- [ ] (P0) Apply `lock-tech-stack`: move proposal folder to `openspec/archive/lock-tech-stack/` once founder reviews — spec: openspec/changes/lock-tech-stack/
- [ ] (P1) `wire-husky` proposal — `pnpm install` + bootstrap Husky hooks (after Node 22 + pnpm 10 are local)
- [ ] (P1) `wire-biome` proposal — install Biome + run initial `biome format --write .`
- [ ] (P1) `wire-lighthouse-ci` proposal — real Lighthouse budgets per app route once apps build
- [ ] (P1) Author `pick-first-product` proposal once PR1 is answered — spec: openspec/specs/products/spec.md
- [ ] (P1) Author `wire-content-pipeline` proposal once AU1 is answered — spec: openspec/specs/content-pipeline/spec.md
- [ ] (P1) Author `wire-brand-ci` proposal once AU2 is answered — spec: openspec/specs/brand-consistency-ci/spec.md
- [ ] (P2) Author `wire-client-lifecycle` proposal — `/kiruk-archive` slash command + state.md template — spec: openspec/specs/client-lifecycle/spec.md
- [ ] (P2) Update `scripts/capture-session.mjs` + `scripts/promote-idea.mjs` to write/require `scribble` field — spec: openspec/specs/idea-capture/spec.md

## Backlog / Ideas (not yet triaged)

- [x] Social media pipeline spec → graduated to `content-pipeline` capability 2026-05-18
- [x] `content/social/` output folder → scaffolded 2026-05-18
- [ ] `/kiruk-collab-intake` slash command for kirukargal proposals
- [ ] First ISM experiment: which name from registry? (heroism / kirukism-series / colorism / nomadism)
- [ ] Case study rewrite: HP Print AI AX work
- [ ] Devlog template + first entry (use `content-pipeline` front-matter contract)
- [ ] First product scribble — physical sketch before any code (per pen-and-paper)
- [ ] Notion workspace sync script (if needed alongside portal)
- [ ] `kiruk-creative-os/` package extraction (Year 2)

---

## Done (most recent first)

- [x] 2026-05-26 `adopt-sketch-direction` OpenSpec change applied + archived — mono tokens (paper/ink/pencil + absurd assets), hand+sans fonts, light-only, drawn-eye/placeholder CI tolerance, dropped 14-day devlog floor. Validates 23/23
- [x] 2026-09-14 `studio-kiruk-in-origin` — public studio is `studio.kiruk.in` (`base: '/'`); kiruk.in stays the person
- [x] 2026-05-26 Founder-decisions session — all B/W/S/P/M + AU2 answered, recorded in FOUNDER_DECISIONS.md
- [x] 2026-05-26 kiruk-web sketch foundation — Astro 5, ported kiruk.in hand fonts, sketch CSS system + primitives, pencil cursor field hero, eye cursor, bottom nav, /studio base
- [x] 2026-05-26 Repo tidy — removed npm package-lock (pnpm-only), gitignore .astro/.vercel/\*.tsbuildinfo, fixed CLAUDE.md Astro/Next, moved vision plan into docs/
- [x] 2026-05-18 Foundation hardening for OSS launch — config infra, OSS compliance docs (CoC, Security, Governance, CITATION.cff, FUNDING, CODEOWNERS, issue templates), dual license split (MIT code + CC-BY 4.0 content), CI workflows (openspec/tokens/doctor), knowledge layer (GLOSSARY, docs/, spec template), pen-and-paper wired into scripts, README rewrite with badges + nav diagram
- [x] 2026-05-18 Strategy locks ST1–ST4: lab-led, transparency boundary, full product surface, all 4 automation streams active
- [x] 2026-05-18 OpenSpec proposal `expand-studio-model` authored + validated — 6 new capabilities (products, build-in-public, content-pipeline, client-lifecycle, pen-and-paper, brand-consistency-ci), 2 modified (idea-capture, ism)
- [x] 2026-05-18 VISION-MISSION.md restated as lab-led with product line + transparency principles + 12 principles
- [x] 2026-05-18 CLAUDE.md vocab, non-negotiables, repo orientation, automation surface section updated
- [x] 2026-05-18 ROADMAP.md Phase 3.5 (Product Track) + Phase 4.5 (Automation Spine) inserted
- [x] 2026-05-18 FOUNDER_DECISIONS.md STRATEGY section + PR1–PR3 + AU1–AU2 question blocks added
- [x] 2026-04-26 Kirukism vocabulary — ROADMAP, CLAUDE.md, VISION-MISSION.md, CONTRIBUTING.md
- [x] 2026-04-26 Monorepo scaffold — pnpm-workspace.yaml, apps/kiruk-web, apps/kiruk-portal stubs
- [x] 2026-04-XX Phase 1 brand spine — manifesto v1, Eye SVG components, token pipeline
- [x] 2026-04-XX Code-first design system — removed Pencil, React SVG Eye/\* + Scribble, Style Dictionary
- [x] 2026-04-XX Phase 0 OS Bootstrap — all root docs, OpenSpec, specs, templates, scripts, slash commands

---

## Hygiene rules

- Every task maps to a spec path OR is tagged `(no-spec)` with justification.
- Move completed items to `## Done` with date.
- Dropped tasks → delete; log the "why" in `CHANGELOG.md`.
- Priority: **P0** = blocks phase exit · **P1** = phase scope · **P2** = nice-to-have.

## mai round two — unfinished (2026-11-05, branch `claude/determined-lamport-r0vfo2`)

Done and pushed: engine v0.2 (outer measurement, line types, projection, labels, night sheet, parts, traces), critic v0.2 (+ `style.starved`, `type.value-ink`), Plate IV and Plate III's outer measurement, the calculus page (`pnpm --filter @kiruk/mai calculus`; artifact https://claude.ai/artifact/U2JdH8xkhcByd8NTkk4rA7), 55 tests (13 skill evals), ledger MA-11 to MA-30, parts docs hand/pen/paper/light/line-types/projection.

Still to do:

- [ ] **Skills to anatomy depth.** Restructure `.claude/commands/kiruk-mai.md`, `kiruk-mai-proof.md`, `kiruk-mai-style.md` as ordered procedures (size → truth → object → list the parts → construct → search → ink → tone → letter → measure inside → measure outside → overlay → verify), each rule with its why, routing to `packages/mai/docs/parts/`, and a `## Sources` block (ways-of-working §3.3). Add the night style and `valueInk` rule to `/kiruk-mai-style`.
- [ ] **New skill `/kiruk-mai-measure`** (`.claude/commands/kiruk-mai-measure.md`): outer measurement of diagrams and UI — neatlines, `extents` (with `clear`, tier stepping), `chainDims`, `angleDim`, `sweep`, `frame`/`redline`/`padding`, `centreLines`, line types, units stated once, never dimension a break line, rounded boxes at tangent points, values in the type red. Add it to the AGENTS.md tool allowlist line.
- [ ] **Remaining parts docs:** `docs/parts/measure.md`, `outer.md`, `letter.md`, `layout.md`, `anatomy.md`, `critic.md` (already linked from `docs/parts/README.md`).
- [ ] **`docs/evals.md`** (E-1…E-13 from `test/evals.test.ts`, plus the agent-eval protocol: fresh subagents with the skill forbidden vs loaded, scored by the critic) and **`docs/examples.md`** (gold set candidates: Plate III, Plate IV, the measure and anomalies specimens — pending founder approval).
- [ ] **Update `docs/checks.md`** (new checks: measure.outer, tiers-order, tier-gap, neatline, angle, line.hidden, line.dashes, connect.axes-named, type.near, type.blots, type.glyphs, type.value-ink, style.starved, create.anatomy; contrast read at 12 px/mm), **`docs/styles.md`** (night), **README** (new modules, the calculus page, the parts index).
- [ ] **Re-proof and re-bake** after the last engine/critic changes: `node packages/mai/scripts/proof.ts packages/mai/plates/volute.ts ideas/kiruk-codex/plates/plate-03-volute/proof --px 4 --commit` (and `axes.ts` → plate-04-axes), `node packages/mai/scripts/specimen.ts` (short centred centre lines are now continuous), update both NOTES.md check counts (now 74 and 55), then `node packages/mai/scripts/calculus.ts` and republish the artifact.
- [ ] **Calculus of Interfaces:** the founder's reference https://calculus-of-interfaces.vercel.app/ is denied by this environment's network policy (allow it under Network access → Allowed domains). Read it, then align the calculus page with its approach and cite it properly; it is only linked so far.
- [ ] **Session discipline:** CHANGELOG entry under `## Unreleased`; LEARNINGS entry (values were lettered in rubric-line, which the tokens reserve for strokes — a spec miss; guard `type.value-ink`); `ideas/log.ndjson` line via `/kiruk-capture`.
- [ ] **Founder decisions:** the night sheet as a third paper (`eye.md` Q8); a phone layout for landscape plates (`type.phone` is the one open warn on every plate); approve or reject the gold set.
