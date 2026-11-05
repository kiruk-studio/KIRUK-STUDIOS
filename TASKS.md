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
- [x] (P1) 2026-11-05 Ink opening on `apps/kiruk-studio`: the first-visit loader draws the burin eye in ink, then it wakes — spec: ideas/studio-dawn/ink-opening.md
- [ ] (P1) Founder checkpoint on the ink opening (pace, open vs shut, corner words) and a real-GPU check of the hand-off onto the plate — spec: ideas/studio-dawn/ink-opening.md
- [x] (P1) 2026-11-05 Ink opening's eye redrawn after the founder's three engravings: the pen's vocabulary (hairline to swell, tapers, crossing for black), socket rings, held light, the face's shade fixed on the white, caruncle, brow, iris — spec: ideas/studio-dawn/ink-strokes.md
- [ ] (P2) Founder decides: port the redrawn look (rings, held light, the white's fixed shade) to the GPU plate `packages/burin/src/subjects/eye/shader.ts`, so the landing's hand-off meets the same eye — spec: ideas/studio-dawn/ink-strokes.md
- [x] (P2) 2026-11-05 Deleted the unused 1970 tube and live 3D era eye from `apps/kiruk-studio`, with `@react-three/fiber` and `postprocessing`. It was the founder's call: kiruk.in stays the eye machine's one source, and a second copy here would drift and publish the private site's structure. The files can be recovered at `5c4583c`. See CHANGELOG 2026-11-05 (Removed) — spec: ideas/private-craft-bridge/README.md
- [~] (P1) **kiruk-codex skill** (`.claude/skills/kiruk-codex/`, plan `ideas/kiruk-codex/plan.md`): drafted 2026-10-20; Plate I tested twice and fixed; marks / depth / live added (untested on a mark plate); then founder review (name, rubric vs ultramarine, "TypeScript", type trio) and keep/delete the parked blend prototypes
- [ ] (P1) Founder: drop ink-bleed + dawn references into `ideas/studio-dawn/references/` (gitignored)
- [x] (P0) 2026-11-05 **mai ink engine** (`packages/mai`) + skills `/kiruk-mai`, `/kiruk-mai-proof`, `/kiruk-mai-style` + Plate III (the eye of the volute) — spec: packages/mai/README.md
- [ ] (P1) Founder: review Plate III (four questions in `ideas/kiruk-codex/plates/plate-03-volute/NOTES.md`) and the three mai skills
- [ ] (P1) mai: a codex plate in Leonardo's manner (the eye and its light) — quill, iron-gall, left-hand hatching, notes with readable twins
- [ ] (P2) mai: phone layout for landscape plates (critic `type.phone`)
- [ ] (P2) Founder decision: red construction under a rubric overlay (critic `style.red-confusion`, research 02 C1)
- [ ] (P2) Move folio `ink/pen.ts` and burin `vector/burin.ts` onto `@kiruk/mai` once the founder approves the engine
- [ ] (P1) **Phase 4 — Stack + spec:** revise tech-stack (incl. its WebGL clause: it requires R3F + drei + postprocessing, but the studio's live WebGL is plain `three/webgpu` + TSL and no workspace uses R3F since 2026-11-05), spec dawn palette tokens, mark old sketch/grease-pencil requirements superseded, close `openspec/changes/grease-pencil-scene`
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

## Hardening (2026-11-05)

- [x] (P0) CI gates every PR on `pnpm typecheck`, `pnpm lint`, `pnpm test` and the studio build, and fails if p5.brush reaches a page chunk — `.github/workflows/ci.yml`
- [x] (P0) pnpm version clash in the doctor, openspec and tokens workflows (Validate specs was failing on main too)
- [x] (P1) `@kiruk/kirukal` typecheck error in its catalog test
- [x] (P1) mai: one rule for the exact overlay (MA-31); Plates III and IV re-proofed, calculus page republished
- [x] (P1) `@kiruk/burin` gets a vitest suite (it had none)
- [ ] (P0) Founder: approve `openspec/changes/adopt-next-studio`, then Vercel `kiruk-web` → Root Directory `apps/kiruk-studio` (until then pushes do not reach studio.kiruk.in)
- [ ] (P2) `apps/kiruk-forge` / `apps/kiruk-blogism` Toolcraft tests fail on Windows (symlinks, POSIX launchers) inside the hash-locked kit; expected to pass on Linux CI — confirm on the first CI run
- [ ] (P2) mai: `A'` is not a prime; decide whether lettering should ever infer one (an apostrophe in "eye's" must stay an apostrophe)

## mai round two — execution plan for the unfinished work (handoff 2026-11-05)

**Closed 2026-11-05** on `feat/hand-drawn-design-system` (WP-1…WP-9). Left open: WP-10 founder decisions, WP-11 polish, agent RED/GREEN runs of the four skills (`docs/evals.md`), and the founder’s diff review of the skill rewrites. Code-vs-plan disagreements found while writing the parts pages are recorded in `docs/parts/*.md` (e.g. `type.phone` computes, it does not read `phone.png`; default margins are 8%/10%, the 12–16 mm rule is the skill’s).

Branch `claude/determined-lamport-r0vfo2` (no PR opened). Everything below is a local plan: do the work packages (WP) in order, because WP-1 regenerates the files that WP-2…WP-6 describe and the calculus page reads.

### 0 · State at handoff

**Pushed** (commits `09b9ea3`, `0555569`, `9b70378`, `e7c9d5d`; working tree clean):

- **Engine v0.2** (`packages/mai/src`): line types (`plate/linetype.ts`), outer measurement (`measure/outer.ts`: `neatline`, `extents` with `clear` and tier stepping, `chainDims`, `angleDim`, `sweep` with `label`, `frame`, `redline`, `padding` to content elements, `centreLines`, `arrowhead`), projection (`measure/projection.ts`: `camera`, `project`, `circle3d`, `runs`, `wireSphere`), labels (`letter/labels.ts`: `pointMark`, `placeLabel`, `inkIn`), lettering markup and synthetic glyphs (`letter/letter.ts`: ° ′ × Ø ± · – — ’ → Δ; unknown characters recorded as `TextItem.missing`), the night sheet and style, `rubric-type` ink + `InkSpec.typeInk` + `valueInk()`, parts (`Plate.part`), traces (`PlateSpec.trace` → `Mark.trace`), curvature by chord turning (≤ 1.5 mm, MA-27), exact strokes feed steadily (MA-26), exact dots (MA-28), centred dashes (MA-20/29), letter pools capped (MA-16).
- **Critic v0.2** (`src/critic/critic.ts`, 61 check ids): new `measure.outer`, `measure.tiers-order`, `measure.tier-gap`, `measure.neatline:<id>`, `measure.angle:<id>`, `line.hidden`, `line.dashes`, `connect.axes-named`, `type.near`, `type.blots`, `type.glyphs`, `type.value-ink`, `style.starved`, `create.anatomy`; redlines skip `measure.extension`/`measure.tier`; label contrast read on a 12 px/mm raster (`src/node/proof.ts`, `contrastPxPerMm`), reported with the lowest label.
- **Plates:** Plate IV `plates/axes.ts` (night) and Plate III outer measurement `plates/volute.ts`; both accept `{ trace?: boolean }`. Proofs and NOTES in `ideas/kiruk-codex/plates/plate-0{3,4}-*/`. Specimen `plates/measure.ts` → `specimens/measure/`.
- **Calculus page:** `packages/mai/calculus/{template.html,page.ts}` + `scripts/calculus.ts` (`pnpm --filter @kiruk/mai calculus`; esbuild 0.25.12 dev dependency). Artifact (private): https://claude.ai/artifact/U2JdH8xkhcByd8NTkk4rA7.
- **Tests:** 55 passing (`test/engine.test.ts` 11, `test/critic.test.ts` 11, `test/outer.test.ts` 20, `test/evals.test.ts` 13).
- **Docs:** `docs/ledger.md` MA-1…MA-30; `docs/parts/README.md` (index of 12 parts) and six parts written: `hand.md`, `pen.md`, `paper.md`, `light.md`, `line-types.md`, `projection.md`.

**Known stale after the last commits** (fix in WP-1): the committed proofs of Plates III and IV and their NOTES predate `style.starved`, `type.value-ink` and the short-centre-line change (NOTES say 72 and 53 checks; a fresh proof gives about 74 and 55; the measure specimen about 91). The specimens predate continuous centre lines on small circles. The published calculus artifact was built from the older proofs.

### 1 · Local setup

- Node ≥ 22.18 (runs `.ts` directly; the package uses `.ts` import extensions and `erasableSyntaxOnly`: no parameter properties, enums or namespaces), pnpm 10. `pnpm install` at the root.
- Proofs need Playwright + Chromium. `src/node/raster.ts` does `createRequire(import.meta.url)('playwright')`, so either install it where Node can resolve it (`npm i -g playwright && npx playwright install chromium`, then run proofs with `NODE_PATH="$(npm root -g)"`), or add it as a dev dependency of `@kiruk/mai`. The calculus build does not need Playwright.
- Checks: `pnpm --filter @kiruk/mai check-types`, `pnpm --filter @kiruk/mai test`, `node_modules/.bin/biome check --write packages/mai` (0 errors required; about 40 warnings, mostly non-null assertions, are tolerated as in round one). Husky runs lint-staged (Biome on JS/TS/JSON, Prettier on Markdown) and commitlint (Conventional Commits) on commit.

### WP-1 · Re-proof, re-bake, rebuild (P0, first)

- [x] (P0) 2026-11-05 Re-proof the committed plates (run from the repo root):
  - `node packages/mai/scripts/proof.ts packages/mai/plates/volute.ts ideas/kiruk-codex/plates/plate-03-volute/proof --px 4 --commit`
  - `node packages/mai/scripts/proof.ts packages/mai/plates/axes.ts ideas/kiruk-codex/plates/plate-04-axes/proof --px 4 --commit`
  - Expect WARN with 0 fail and 1 warn (`type.phone`) on each. Any other WARN/FAIL: fix it, or explain it in the plate's NOTES.md.
- [x] (P0) 2026-11-05 Update the counts in `ideas/kiruk-codex/plates/plate-03-volute/NOTES.md` (front matter `status:` line and "The result is 72 checks") and `plate-04-axes/NOTES.md` ("53 checks") to the new totals from the proof output. In Plate III's "Fixed on the way", add MA-27 (the hand braked at polyline vertices; found on the calculus page) and MA-30 (`style.starved` now exists).
- [x] (P0) 2026-11-05 Re-bake the specimens: `node packages/mai/scripts/specimen.ts` (writes `specimens/anomalies/` and `specimens/measure/`; the measure specimen's small hole centre lines are now continuous, as ISO 128 allows). Look at `specimens/measure/plate.png` once.
- [x] (P0) 2026-11-05 Rebuild the calculus page: `pnpm --filter @kiruk/mai calculus` (reads the committed `plate.svg` and `report.json`, so it must follow the re-proof). Open `packages/mai/calculus/dist/index.html` locally and move every control on every bench: no console errors, no sideways scroll at 390 px, both themes.
- [x] (P1) 2026-11-05 Republish the artifact to the same URL. From a Claude Code session: read https://claude.ai/artifact/U2JdH8xkhcByd8NTkk4rA7 first (`Artifact` action `read`), then publish `packages/mai/calculus/dist/artifact.html` with that `url` (a publish without the read is refused). `calculus/dist/` is git-ignored by the root `dist/` rule; never commit it.
- Acceptance: both proofs 0 fail; NOTES counts match `report.json`; specimens regenerated; the page shows the new check totals (hero strip and the "One plate, counted" section).

### WP-2 · The six remaining parts references (P1)

Write `packages/mai/docs/parts/{measure,outer,letter,layout,anatomy,critic}.md` in the same shape as `hand.md`/`pen.md`: a header line (module · calculus bench · checks · ledger rows), what it models, **The calculation** (a table of formulas with the code's numbers), **Driving it** (API and rules, each with its why), **What the critic reads**, and **Sources**. The facts, from the code:

- [x] (P1) 2026-11-05 `measure.md` — inside measurement (`src/measure/measure.ts`):
  - `dimension(plate, a, b, { axis, offset, digits, unit, perMm, role, kind, terminator, gap, over, id })`: value = distance along the axis × the scale's `perMm`, rounded to `digits`; label "N unit", or "N" with `unit: 'none'`; `kind` detail/overall/chain/redline.
  - Extension lines start 1.5 mm off the ink and overshoot 2.5–3 mm; skipped under 0.6 mm. The value sits centred over the line; a value wider than its span is set outside, past the far end (+2.2 mm); a redline's value is level beside its line.
  - `valueInk(plate, role)`: an ink's type twin (`typeInk`: rubric-line → rubric-type #983A22) → else the role's ink if it clears 7:1 against the paper → else the lettering ink.
  - Also `scaleBar(plate, at, { units, segments, label })`, `leader(plate, from, to, { terminator: 'dot'|'arrow', shoulder })`, `ruled`, `compass`, `point`.
  - Checks: `measure.true` (|label − ink| ≤ max(½·10^−digits, 0.5% of the value); fail), `measure.extension` (gap 0.8–2.5, overshoot 1.5–3.6; warn), `measure.on-ink` (both ends within 0.8 mm of a contour or hatch on the ink layer; fail), `measure.tier` (≥ 6 mm pass, ≥ 4 warn, else fail), `measure.unit`, `measure.sourced`, `type.value-ink`. Ledger MA-12, MA-17, MA-19.
- [x] (P1) 2026-11-05 `outer.md` — outer measurement of diagrams and UI (`src/measure/outer.ts`):
  - `extents(plate, marks, { sides, tier = 12, tierGap = 8, digits, unit, perMm, clear, role, id })` → ids `<id>-<side>`, kind overall; measured between ink extremes (`inkExtremes`), never a bounding box; steps `tierGap` beyond any non-redline dimension already on that side over the same span; `clear` sets the tier outside those marks as well. Never pass break lines or construction (a broken view is not dimensioned to its break, ISO 129; MA-22).
  - `chainDims(plate, points, { axis, offset, overall = true, id, digits, unit })` → `<id>-1…n` (chain) + `<id>-overall` 8 mm further out.
  - `neatline(plate, rect, { every, major = 5, origin, gap = 1.8, role = 'dimension', numbers, numbersOn = ['top','left'], cap = 2.5, id })` → `NeatlineRecord`; major ticks `gap` long, minor `gap/2`; numbers |k·every| on major ticks, 2.5 mm (ISO 3098) since MA-17; exact when the role is an overlay ruling pen.
  - `angleDim(plate, vertex, a, b, { r, digits, id, role, cap = 2.5 })` → `AngleRecord`, text "N°" at r + 1.1·cap on the bisector. `sweep(plate, c, r, a0, a1, { arrow: 'end'|'both'|'none', label, cap, line, role, pressure, id, part })`, heads 2.6 mm (L:W 3:1), label at r + 1.3·cap. `arrowhead(plate, tip, dir, { role, len, id, part })`.
  - UI: `frame(plate, rect, { radius, role, exact, pressure, id, part })`; `redline(plate, a, b, { unit, perMm, digits = 0, role = 'overlay', id })` (the gap where two boxes face, kind redline, ticks, no extension lines); `padding(plate, outer, content: Rect | Rect[], o)` → `<id>-top|right|bottom|left`, each measured to the element that is there (MA-19); `centreLines(plate, c, r, { over = 3, role = 'dimension', id, part, pressure })`; `toSheet`.
  - Rules with whys: state the unit once (`unit: 'none'` + a note) so a 6 mm gap holds its value (MA-12); measure a rounded box at its tangent points (MA-19); the overall a tier outside the inner (MA-23); a neatline counted from a meaningful point (the eye, a hole, the centre); a UI at an explicit `perMm` (the specimen uses 4 px per mm).
  - Checks: `measure.outer` (an overall or a neatline; warn), `measure.tiers-order` (fail), `measure.tier-gap` (fail < 4 mm, warn < 6 mm), `measure.neatline:<id>` (graduated at the plate's `perMm` and unit, else fail; ink crossing the frame → warn), `measure.angle:<id>` (|label − rays| ≤ ½ of the last digit; fail); redlines keep `measure.true` and `measure.on-ink`. Ledger MA-12, MA-18, MA-19, MA-21, MA-22, MA-23.
- [x] (P1) 2026-11-05 `letter.md` — lettering and labels (`src/letter/`):
  - `letter(plate, text, at, { cap, kind, anchor, font: 'futural'|'scripts'|'timesr', slant, rotate, tracking = 0.06, exact, role, ink, instrument, layer, pressure, refers, twin, mirror, id })` draws with the hand; `typeset(…)` is SVG text (selectable; on a dark sheet default colour [0.8, 1, 1], screen blend).
  - ISO 3098 heights 1.8, 2.5, 3.5, 5, 7, 10, 14, 20 mm; notes and dimensions ≥ 2.5 mm, nothing under 1.8.
  - Markup: `_x`, `_{xy}` (subscript), `^x`, `^{xy}` (superscript), 0.68 of the cap, shifted +0.32 / −0.55 cap; an apostrophe after a letter is a prime (A' → A′). Synthetic glyphs ° ′ × Ø ± · – — ’ → Δ; anything else outside printable ASCII is recorded in `TextItem.missing` (MA-24).
  - Labels: `pointMark(plate, p, { style: 'dot'|'ring'|'ring-dot'|'cross', size, role, ink, id, part })`; `placeLabel(plate, text, anchor, { cap, font, kind, id, exact, role, ink, gap })` tries NE, SE, NW, SW, E, N, W, S at gaps 0.5, 1.1, 1.9 × cap and scores ink × 12 + clash × 4 + off-sheet 100 + rank × 0.05 + gap index × 0.12 (Imhof's preference order); `inkIn(plate, box, exclude?)`.
  - Pools on letters ≤ 0.7 × the line width (MA-16).
  - Checks: `type.size`, `type.phone` (≥ 11 px on a 390 px phone), `type.collisions`, `type.clear-ground` (≤ 18% ink under a label), `type.on-sheet`, `type.mirror-twin`, `type.keys` (≤ 7 names, letters or numerals, never mixed; counted by name, MA-13), `type.contrast` (≥ 4.5:1 on real pixels at 12 px/mm), `type.near` (≤ 8 mm, or a leader within 3.5 mm), `type.blots` (pool diameter ≤ 0.32 × cap), `type.glyphs`, `type.value-ink`. Ledger MA-3, MA-13, MA-16, MA-17, MA-24.
- [x] (P1) 2026-11-05 `layout.md`: sheet size; margins 12–16 mm (a colophon may sit in the bottom margin, as Plate III's does); the 61.8 / 38.2 split (subject zone, then notes, enlargement and scale); the subject first and largest, commentary never covering it (02 R2); at most 7 keyed parts (03 R12). Checks `layout.margins` (0 strokes in the margins), `layout.rise` (ink centroid ≤ 52% of the height), `layout.balance` (50% ± 12%), `layout.white` (30–85% of 5 mm cells empty), `type.phone` (the proof's `phone.png` at 390 px). Ledger MA-21 (a frame weighs at its own centre; Plate III's shaft stub shortened 162 → 150 mm). Open: the phone layout (founder decision).
- [x] (P1) 2026-11-05 `anatomy.md`: the order of work from `ideas/kiruk-codex/plan.md` ("size, truth, invent the object, list the parts… verify"), spelt out for mai: size → truth (`p.fact`) → the object (claim, device, views) → list the parts (`p.part`) → construct → search → ink → tone → letter → measure inside → measure outside → overlay → verify. `PartRecord { id, name, key?, finish: 'construction'|'line'|'tone', form?, measured?: string[] | { none: reason of ≥ 3 words }, generatedBy?: construction ids }`. A part's marks are those with `part`, `group` or `id` equal to its id, an id starting `<id>-` or `<id>.`, or its `form`. Issues `create.anatomy` reports: nothing drawn; not inked (line/tone); inked but declared construction; toned without a form / no tone on the form; key not on the drawing (a `kind: 'key'` text equal to the key); no note starting "<key> "; a measure id missing from dimensions and angles; unmeasured without a reason; a construction missing. No parts → warn; any incomplete → fail; the report ends with an "## Anatomy" table. Examples: Plate III's 9 parts, Plate IV's 8.
- [x] (P1) 2026-11-05 `critic.md`: `critique(plate, { pixels?, phoneWidthPx? })` → `Report { plate, title, style, verdict, checks, anatomy, counts, stats }`; statuses pass, warn, fail, human (LOOK); verdict fail if any fail, else warn if any warn. `proofPlate` bakes at `--px` (default 5; committed proofs use 4 and `--commit`, which drops `paper.png`), renders an ink-only raster and a 12 px/mm contrast raster, computes pixel facts (centroid, white, per-label contrast as departure from the paper), writes `phone.png` (390 px), crops at 20 px/mm (`hatch`, `pool`, `dimension`, `letter`), `report.json` and `report.md`; `scripts/proof.ts` exits 1 on any fail (`--strict`: on any warn). Reading order: fix every FAIL; fix or explain every WARN in NOTES.md; read the 4× crops (`/kiruk-mai-proof`'s seven questions); LOOK items go to the founder.

### WP-3 · Fix the reference pages (P1)

- [x] (P1) 2026-11-05 `packages/mai/docs/checks.md` lists 40 of the critic's 61 check ids. Add, each with target and why (copy the wording from `src/critic/critic.ts`): `connect.axes-named`, `create.anatomy`, `light.even:<form>`, `light.follows:<form>`, `light.lit-clear:<form>`, `line.dashes`, `line.hidden`, `measure.angle:<id>`, `measure.extension:<id>`, `measure.neatline:<id>`, `measure.on-ink:<id>`, `measure.outer`, `measure.tier:<id>`, `measure.tier-gap`, `measure.tiers-order`, `measure.true:<id>`, `style.starved`, `type.blots`, `type.glyphs`, `type.near`, `type.value-ink`. Add a "Line types" section, and note that label contrast is read at 12 px/mm. Remove the `plate.fact` row if it is not a check id. Change "about 55 checks" in the intro.
- [x] (P2) 2026-11-05 Mechanise the guard behind MA-29/MA-30: a test that every `` `x.y` `` check id named in `docs/checks.md` and `docs/anomalies.md` exists in `critic.ts`, and every id in `critic.ts` appears in `docs/checks.md`.
- [x] (P1) 2026-11-05 `packages/mai/docs/styles.md`: add the `night` style row (night paper `#1D1C2D`; steel + departs for contour, hatch, stipple and letter; chalk for construction, underdrawing and searching; ruling + departs for dimension, leader and overlay; one-slope −45°, gap 0.6–1.3 mm, never crossed, reach 8; right hand, tremor 0.014, pace 120; lettering 3 mm; founder decision pending) and the `dawn-new` hatch values (one-slope −45°, 0.55–1.2 mm, cross above 0.70, reach 7). Note the rubric pair: lines in `rubric` (rubric-line #B5462B), values in `rubric-type` (#983A22).
- [x] (P1) 2026-11-05 `packages/mai/README.md`: add `measure/outer.ts`, `measure/projection.ts`, `plate/linetype.ts`, `letter/labels.ts`, traces, `valueInk`; the night paper and style (seven styles now); 14 inks; the parts index (`docs/parts/README.md`); the calculus page and its command; `/kiruk-mai-measure`; Plate IV; the new laws (values in the type red; exact strokes feed steadily; a centre line crosses on a dash); `pnpm --filter @kiruk/mai calculus` under Commands; the Playwright note from section 1.

### WP-4 · Evals and the gold set (P1)

- [x] (P1) 2026-11-05 `packages/mai/docs/evals.md`: (1) the mechanised evals: a table of E-1…E-13 from `test/evals.test.ts` (id, skill, rule, check, what RED does, expected status) — E-1 typed value, E-2 orphan construction, E-3 incomplete part, E-4 crossed codex tone, E-5 tiers 2 mm apart, E-6 hidden drawn solid, E-7 unnamed axis, E-8 value in the line red, E-9 no overall size, E-10 wrong angle, E-11 missing glyph, E-12 label far from its point, E-13 hand-drawn overlay on the modern sheet; (2) the agent evals (ways-of-working decision 9): three or four realistic briefs per skill ("measure this UI card", "a codex plate of a lit eye", "add a style from this engraving", "proof this plate"), each run by a fresh subagent with the skill forbidden (RED) and then loaded (GREEN), scored by the critic (fails, warns) plus a short rubric; record scores; after any skill edit the scores must not drop.
- [x] (P1) 2026-11-05 `packages/mai/docs/examples.md`: the gold set, all **candidates pending founder approval**: Plate III (`ideas/kiruk-codex/plates/plate-03-volute/`), Plate IV (`plate-04-axes/`), the measure specimen (`packages/mai/specimens/measure/`), the anomalies specimen (`specimens/anomalies/`); one line each on what it shows best and what is still open (`type.phone`; the night sheet). Approved examples get the date and the founder's words.

### WP-5 · New skill `/kiruk-mai-measure` (P1)

- [x] (P1) 2026-11-05 Create `.claude/commands/kiruk-mai-measure.md` (skills stay in `.claude/commands/`: CLAUDE.md §7 forbids new files under `.claude/` except `commands/` and `settings.json`). Front matter `description` (key use first, under 1,536 characters): measure a diagram or a UI from the outside with mai — overall size, chains, neatlines, angles, sweeps, redlines and padding, line types, labels — every value from the ink. `argument-hint`: `<plate module or what to measure>`.
- Body: **the one idea** (the specimen's claim: "A figure states its own size and place: its lines say what they are, and every value round its edge is measured from its ink"); **the procedure**: (1) unit and scale (`PlateSpec.scale`; a UI in px at an explicit `perMm`, stated once in a note); (2) the figure first; (3) line types (visible solid; hidden dashed with `hidden: true`; axes chain, named at both ends; `centreLines` for circles; phantom for another position); (4) inside: `chainDims` with `unit: 'none'`, `dimension` for single features, visible ink only, rounded boxes at tangent points; (5) outside: `extents` over the part's own marks with `clear` for the whole drawing, never a break line, a tier beyond the inner; (6) a neatline from a meaningful origin, a round step at the plate's scale, numbers on the clear sides (`numbersOn`); (7) angles in a true-size view (`angleDim`), turns as sweeps or turn arrows; (8) UI: `frame`, `padding(card, [elements])`, `redline(a, b)`; (9) labels: `pointMark` + `placeLabel`, keys as named parts; (10) verify: proof, then read every `measure.*`, `line.*`, `type.near`, `type.value-ink` check and the `dimension` crop.
- Each rule with its why and its ledger row (MA-12, MA-17, MA-18, MA-19, MA-20, MA-22, MA-23, MA-28, MA-29); route to `docs/parts/measure.md`, `outer.md`, `line-types.md`, `projection.md`, `letter.md`; the visual reference `packages/mai/plates/measure.ts`; evals E-5…E-10; the `## Sources` block (WP-6).
- [x] (P1) 2026-11-05 `AGENTS.md` line 65: add `/kiruk-mai-measure` (measure a diagram or UI from the outside) to the list.

### WP-6 · The three skills at anatomy depth (P1)

The decided anatomy (`ideas/ways-of-working/proposal.md` §3.3) mapped onto what may be committed: `SKILL.md` → `.claude/commands/kiruk-mai*.md`; `learnings.md` → `packages/mai/docs/ledger.md`; `references/<depth>.md` → `packages/mai/docs/parts/*.md`; `references/examples.md` → `packages/mai/docs/examples.md`; `evals.md` → `packages/mai/docs/evals.md` + `test/evals.test.ts`. Writing rules: process, not output; every rule carries its why; under 500 lines, aim under 200; cut any line that does not change behaviour; link sources of truth, never restate them. Every edit to a skill file is shown to the founder as an exact diff first (§3.5).

- [x] (P1) 2026-11-05 `/kiruk-mai` (`.claude/commands/kiruk-mai.md`, 73 lines now): replace "Decide quality" + "Passes" with the ordered procedure from WP-2 `anatomy.md` (size → truth → object → **list the parts** → construct → search → ink → tone → letter → measure inside → **measure outside** → overlay → verify); keep the numbers already in its pass table; add the round-two rules with whys (values in the type red, MA-17; never dimension a break, MA-22; tiers a tier apart, MA-23; axes named at both ends; hidden is dashed; a missing glyph fails, MA-24; `PlateSpec.trace` and the calculus page to see a stroke's numbers); route each step to its `docs/parts/` page; hand outer measurement to `/kiruk-mai-measure`.
- [x] (P1) 2026-11-05 `/kiruk-mai-proof` (83 lines): the review in order (run the proof → read the verdict → every FAIL → every WARN → the anatomy table → the seven-question 4× look → LOOK items as founder questions); add the round-two checks to read, contrast at 12 px/mm, `type.blots`/`type.glyphs`, the anatomy table, and "a check that ends in a number, an exit code or a 4× crop" (the anatomy method's rule).
- [x] (P1) 2026-11-05 `/kiruk-mai-style` (60 lines): add the night style as a worked example (a dark sheet: screen blend, light ink, chalk construction, value contrast), the `typeInk` rule (a strokes-only ink names its type twin), and a step that adds the new style to `docs/styles.md` and `test/evals.test.ts`.
- [x] (P1) 2026-11-05 Every skill ends with:

  ```markdown
  ## Sources

  - Decision: ideas/kiruk-codex/plan.md (mai, the ink engine) and ideas/ways-of-working/proposal.md §3.3 (the anatomy of a skill)
  - Promise: none yet (no openspec requirement for mai)
  - Ledger: packages/mai/docs/ledger.md
  - Examples: packages/mai/docs/examples.md
  - References: packages/mai/docs/parts/README.md
  - Evals: packages/mai/docs/evals.md, packages/mai/test/evals.test.ts
  ```

### WP-7 · The founder's references (P1)

- [x] (P1) 2026-11-05 Allow `calculus-of-interfaces.vercel.app` (cloud environment → Edit → Network access → Allowed domains; or work locally), read https://calculus-of-interfaces.vercel.app/, and align the calculus page with its approach (structure, how its charts tie to the design, its formulas), citing it in the page footer and in `docs/parts/README.md`. So far the page only links it; nothing on the page claims to follow it.
- [x] (P2) 2026-11-05 The anatomy write-up https://skills.wheresryan.sh/anatomy/how-i-built-it was also unreachable (ENOTFOUND); round two used the record in `ideas/kiruk-codex/plan.md` instead. Read it once allowed and fold anything new into WP-6.

### WP-8 · Session discipline (P1)

- [x] (P1) 2026-11-05 `CHANGELOG.md` under `## [Unreleased]` → `### Added`: a dated entry "mai round two (2026-11-05)" in the round-one entry's shape: outer measurement and line types, projection, labels, the night sheet, parts, traces; critic v0.2; Plate IV and Plate III's outer measurement; the calculus page; tests 22 → 55 with 13 skill evals; ledger MA-11…MA-30; **Why** (the founder's sphere and FIG. 3 references; outer measurement of diagrams and UI; skills to anatomy depth; the calculus link); **Verified** (proof results, tests, the artifact); **Not done** (this plan's open items).
- [x] (P1) 2026-11-05 `LEARNINGS.md` (Mistake / Root cause / Fix / Guard): "2026-11-05 — Measure values lettered in the red the tokens keep for strokes": values were lettered in `color.dawn.rubric-line`, which `core.json` says is strokes only, never text, and they read 2.9–4.1:1 on Dawn Departs; root cause: the engine had one rubric ink and its own source line noted the type red without implementing it; fix: `rubric-type` + `typeInk` + `valueInk()`; guard: `type.value-ink`, eval E-8. Optionally a second: "docs promised a check (`style.starved`) and a behaviour (continuous short centre lines) the code never had" (MA-29, MA-30); guard: the WP-3 test.
- [x] (P1) 2026-11-05 `/kiruk-capture` → one line in `ideas/log.ndjson` with the decisions: values in `color.dawn.rubric`, lines in `rubric-line`; the exact overlay feeds steadily; curvature by chord turning (≤ 1.5 mm); label contrast read at 12 px/mm; outer measurement rules (a tier apart, never a break line, tangent points, units once); the calculus page bundles the real engine (esbuild dev dependency); Plate IV on the night sheet pending the founder; skills stay in `.claude/commands/` until `.claude/skills/` is allowed.
- [x] (P2) 2026-11-05 `ROADMAP.md` unchanged: the plan did not change.

### WP-9 · Verify, commit, push (P0, last)

- [x] (P0) 2026-11-05 `pnpm --filter @kiruk/mai check-types` (0 errors) · `pnpm --filter @kiruk/mai test` (55+ passing) · `node_modules/.bin/biome check --write packages/mai` (0 errors) · `node_modules/.bin/prettier --write` on the changed Markdown · re-run both proofs (0 fail).
- [x] (P0) 2026-11-05 Commit in topic groups with Conventional Commits, for example `chore(codex): re-proof plates III and IV after critic v0.2`, `docs(mai): parts references, checks, styles, evals and examples`, `feat(skills): kiruk-mai-measure and the mai skills at anatomy depth`, `docs: changelog, learnings and the idea log for mai round two`; then `git push -u origin claude/determined-lamport-r0vfo2`. Open a PR only when you want one.

### WP-10 · Founder decisions (open)

- [ ] (P0) The night sheet as a third paper (`ideas/studio-dawn/eye.md` open question 8). Plate IV, the night style and the calculus page's dark theme use it.
- [ ] (P0) A phone layout for landscape plates: `type.phone` is the one open warn on every plate. A crop per figure at phone width, or labels moved out on leaders?
- [ ] (P1) Approve or reject the gold set (WP-4).
- [ ] (P1) Plate III's open questions (its NOTES.md): the right-finished / left-constructed split; the volute's eye as a studio mark study; IM Fell notes or the hand's lettering; the phone crop. Plate IV's (its NOTES.md): chalk construction on the night sheet; one sweep or a turn arrow on each axis.
- [ ] (P2) Red construction under the rubric overlay (`style.red-confusion` warns when both appear), still open from round one.

### WP-11 · Polish noticed but not done (P2)

- [ ] (P2) Calculus page: the line-type bench's exact dots are true to size (about 0.26 mm) and under two screen pixels — add a 4× inset; the hand bench's dashed aim is hidden under the stroke — show it offset or only in the deviation chart; colour the plate-wide power-law scatter by role (contour, letter, hatch); the speed chart's κ still ripples about ±6% on a 1 mm polyline (the page now feeds 0.5 mm).
- [ ] (P2) `type.phone`: once the founder picks a phone layout, implement it in the proof (`phone.png`) and the critic.
- [ ] (P2) Specimens: a night-sheet specimen of the line types and the outer measurement, to test the dark theme the way `plates/measure.ts` tests Dawn Departs.

## The hand: p5.brush × burin (in progress, 2026-11-05)

Blend p5.brush 3.0 (the hand: chalk, wash, quill, lead white) with `@kiruk/burin` (three.js WebGPURenderer + TSL paper, bleed, engraving). Pipeline: p5.brush standalone (WebGL 2, no p5) in a Web Worker → ImageBitmap ×5 → three.js textures → TSL compose → WebGPU / WebGL 2.

**Done (pushed, not yet reviewed):**

- [x] `p5.brush@3.0.0` pinned in `packages/burin` (its `dist/brush.esm.js`, the file imported, is byte-identical to GitHub commit `d56350a`). Root `pnpm.packageExtensions` marks its `p5` peer optional, so p5 is not installed.
- [x] `packages/burin/src/hand/`: `media.ts` (pigments, old→new paper swaps), `spine.ts` (pressure spines, tremor, left-handed "hash" hatching, kirukal pen samples → spine), `brushes.ts` (k-quill, k-hatch, k-reed, k-sanguine, k-side, k-white, k-silver), `painter.ts` (one canvas, one layer per medium, `transferToImageBitmap`), `worker.ts` (`serveHand`), `index.ts` (`createHand` client with latest-wins and main-thread fallback), `compose.ts` (TSL, optical density: chalk on the peaks, wash in the valleys + paper buckle, quill starved, lead white on top and opaque to the light, dawn pigment swap).
- [x] `subjects/eye/hand.ts`: the eye recipe (sanguine globe, lids and axes; bistre socket and corner washes; carnation; blue-grey + hazel iris decal; white hatching; quill hatching). New exports: `./hand`, `./hand/worker`, `./hand/painter`, `./eye-hand`.
- [x] Renderer: `setHand()`, `handSheet()`, hand uniforms, compose order (under → engraving → quill → bleed → white → type). Paper `buckle`, `lit`, `flocs`, `fibre` outputs. Bleed: hand ink and wash re-wet, washes being laid add water. Eye ink pass `w` = palpebral opening. `eyeIrisDecal()` carries the rest-pose iris colour onto the turning eye.
- [x] Studio: `hand.worker.ts`, `hand-local.ts`, EyeEngine wiring (H on/off, I new impression, the hand's passes in Make again, hand easing, `__burin.hand/impression/handMedia/handLayers`), store `hand`, Instrument _vii. Hand_ (Engine is now _viii_), `.ins-media` CSS.
- [x] `@kiruk/burin` typechecks at the latest commit. The studio was last typechecked before the `handLayers` hook was added, so re-run it. The raw layer dumps from `__burin.handLayers()` look right.

**Done 2026-11-05 (this session):** fix 1 seen on screen (live WebGPU, then headless WebGL 2 with each medium alone: chalk, quill and iris each draw their own sheet); fix 2 re-tune (iris ×0.85, chalk ×1.1, k-hatch 185, k-sanguine 160); proof shots 1440×900 dpr 1/2 and 390×844; `next build` passes, p5.brush only in the worker + lazy fallback chunk; `hand.md`, CHANGELOG, proposal `adopt-p5-brush-hand` (validated --strict), linked from `eye.md`.

**Also done 2026-11-05:** socket wash graded in three glazes (nose blob softened); `__burin` hooks kept in production on purpose (the proof surface of `burin-check.mjs`).

**Still open:** white heightening, quill and carnation at dpr 2; a WebGPU look on hardware after the re-tune; held-to-light / new paper / wet-brush proofs; the founder questions in `hand.md`.

**Original plan (kept for the record): fix first**

1. **Root cause found, fix pushed but NOT yet seen on screen: chalk, quill and iris sampled the wash texture.** In three.js r186, `TextureNode.getUniformHash()` returns the texture's `uuid`. Per `UniformNode.getSharedNode()`, nodes with the same hash share one uniform, owned by the first node built. All hand slots started on one shared white placeholder, so after `setHand` chalk, ink (quill) and iris all sampled the first-built node's texture: the paper buckle's wash. Evidence: chalk-only looked like a tooth-speckled wash shape, ink-only showed a brown band in the socket, the iris colour was near-white, and a debug build that added an iris sample first tinted the whole region with the iris decal. Fix (`packages/burin/src/hand/compose.ts`, `createHandTextures`): one `solid()` placeholder per slot. It typechecks; it was not re-proved in a browser. **First local step:** run the dev server, then call `__burin.handMedia(m, true/false)` to show each medium alone and confirm the chalk globe, quill hatching and iris colour now show.
2. **Re-tune after fix 1.** These strengths were raised while the bug hid three of the media, so they are probably now too strong: iris density `×2.2` and chalk `×1.45` (both in `compose.ts`); brush opacities in `hand/brushes.ts` (k-sanguine 190, k-hatch 205); recipe weights in `subjects/eye/hand.ts`. The earlier "wash-shaped stain" was most likely this same bug, not the bleed. The bleed change (hand pigment lifts only where water `w > 0.12`, `bleed/bleed.ts`) stays as a design choice. Re-check for a real stain only after fix 1.
3. **The iris colour may still be faint**: the engraved iris is nearly solid ink near the limbus, so the wash shows only between the cuts. Judge it after fix 1 before changing anything.
4. **Tune the look**: the socket wash band is flat, so grade it. Then the white heightening, quill strength and the carnation blush. Check each at dpr 2.

**Run it locally**

- `git checkout claude/intelligent-einstein-0hn5e2 && pnpm install` (Node 22, pnpm 10). Then run `pnpm --filter @kiruk/studio dev`.
- To skip the opening loader: in the console, run `sessionStorage.setItem('kiruk-loading-seen','true')`, then reload.
- Keys: H hand on/off · I new impression · C make it again (includes the hand's passes) · D paper · L held to light · W construction.
- Console hooks:
  - `__burin.hand()`: state, via, ms, seed, loaded, show, make.
  - `__burin.impression(4242)`: repaint with a fixed seed, no replay.
  - `__burin.handMedia('chalk'|'wash'|'ink'|'body'|'iris', bool)`.
  - `__burin.handLayers()`: PNG data URLs of the raw p5.brush layers.
- Typecheck: `pnpm --filter @kiruk/burin check-types` and `pnpm --filter @kiruk/studio check-types`.
- Measured so far, only on SwiftShader in this container (no GPU here): the first sheet painted in about 415–423 ms, later ones in 63–127 ms. WebGPU is unproven: the container's WebGPU device was lost even on the original page.

**Then prove it**

5. Proofs at 1440×900 and 1920×1080 at dpr 2, and on a 390×844 phone. Also: new paper (D), held to the light (L), Make again (C) through the hand passes, new impression (I), and a wet brush over the hand's media. WebGPU on real hardware. No console errors, no overflow.
6. `pnpm lint` (biome), `next build`, size check (p5.brush only in the worker chunk). Keep or gate the proof hooks.

**Then document it**

7. Write `ideas/studio-dawn/hand.md` (code already spec-links it). Add a CHANGELOG _Unreleased_ entry and an OpenSpec change `adopt-p5-brush-hand` (tech-stack delta: p5.brush standalone scoped to burin's hand, no p5), then validate it `--strict`. Link from `eye.md`. Open founder questions: is the hand on by default? Should it be on the new paper? Should the founder's own kirukal strokes go through `fromSamples`?
