---
status: decided 2026-10-18 — all open decisions answered in a two-round grilling; not yet applied
date: 2026-10-17
source: research session run alongside the studio-dawn IA work (ideas/studio-dawn/plan.md §1 "Skills" and "Ways of working")
scope: how kiruk structures agent skills, specs and docs; whether to upgrade OpenSpec
applies-to: the migration in "Decisions" below. Until it runs, nothing here is applied.
---

# Ways of working: skills, specs and docs

## Decisions — founder, 2026-10-18

Answered in two grilling rounds. Each line is final; the sections after it are the research and reasoning behind them.

**Round 1**

| #      | Decision                                                                                                                                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R      | **Decision-first replaces spec-first** (CLAUDE.md §4): kirukal → decide (`ideas/<topic>/plan.md`) → curate → skill → spec only for promises → link + capture. Non-negotiable 5 (no token without spec) stands: tokens are a promise.                                                                               |
| L + D8 | **Every kiruk skill learns** (§3.5): per-skill `learnings.md`, guard per miss, rule promoted only on a repeat. **Every `SKILL.md` edit is shown as an exact diff and applied only on approval.** Ledger rows and examples may be added directly.                                                                   |
| D1     | **Skill home = `.claude/skills/`**, committed through a `.gitignore` allowlist (`kiruk-*`, `ism-*`). Drop the `.agents/skills/` and `.cursor/skills/brand-thinking-capture` mirrors.                                                                                                                               |
| D2     | **emil pack → `~/.claude/skills/`** (user level). Delete the local `.cursor/skills/emil-*` duplicates. Local only; nothing reaches git.                                                                                                                                                                            |
| D3     | **OpenSpec: upgrade and slim.** Pin **exactly `1.14.0`** (newest release ≥ 2 weeks old on 2026-10-18), core profile, Claude target, skills delivery, kiruk checklist in `config.yaml` `rules:`, promises only. Runs after D6.                                                                                      |
| D6     | **Triage first, on 0.11:** archive `adopt-forge-tooling`; close `grease-pencil-scene` as superseded; `expand-studio-model` + `lock-tech-stack` archive-as-applied if their content is already in `openspec/specs/`, else close; keep `kiruk-logogram-primary`, `add-kirukal-tokens`, `adopt-blogism-tooling` open. |

**Round 2**

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D4  | **Promise list:** `design-tokens`, `repo-privacy`, `build-in-public`, `products`, `client-lifecycle` + the 7 `template-*`, `tech-stack`, `brand-consistency-ci`, `operational-learning`, `idea-capture`, **`content-pipeline`** (added: it governs devlog front-matter), and the studio content model once its rules are tested. `brand-system`, `pen-and-paper`, `ism` reviewed in studio-dawn Phase 4.                                                                                                                                                                               |
| D5  | **Commit OpenSpec's generated `openspec-*` skills** (allowlisted; pinned version makes them reproducible; OpenSpec is MIT).                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| D7  | **Move all 12 commands at once** to `.claude/skills/<name>/SKILL.md` + empty `learnings.md`, same names. `disable-model-invocation: true` on `kiruk-capture`, `kiruk-intake`, `kiruk-artifact`, `kiruk-ism-new`. `kiruk-spec` becomes a thin handoff to `/opsx:propose`. Brand-thinking mirrors dropped in the same move.                                                                                                                                                                                                                                                              |
| D9  | **Evals** only after a skill's first promoted rule, or once it is used often.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| D10 | **First new skill: `kiruk-curate`** — the §3.4 curation ritual. Drafted during the migration; founder sees the draft before it is committed.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| E1  | **Clean base first:** commit in-flight work in topic groups (founder sees the list first) → merge the IA branch `claude/keen-thompson-b168e2` into `feat/hand-drawn-design-system` → migrate from that tip.                                                                                                                                                                                                                                                                                                                                                                            |
| E2  | **Migration = one session, own worktree + branch, one commit per step:** (1) triage on 0.11 · (2) skills: allowlist, 12 commands moved, mirrors dropped, emil to user level, **stop to show the `kiruk-curate` draft** · (3) OpenSpec 1.14.0: back up `AGENTS.md`/`project.md` → archive move → fix `doctor` + `promote-idea` → `init` → `config.yaml` · (4) docs: CLAUDE.md §1/§4/§6/§6a/§7/§8, root `AGENTS.md`, `.cursor/rules`, `docs/README`, CHANGELOG (+ LEARNINGS if anything breaks). Done = `spec:validate`, `doctor`, web build green. No push; merge only with founder OK. |

---

## 0. The short version

- **Specs stop being the front door.** Work starts as kirukal, becomes a decision in a plan doc, and turns into a **skill** once the founder curates the result. A spec is written only when the decision is a **promise**: something code, CI, a client or the public relies on.
- **One skill per kind of task, one curated result each.** This is the shape every serious pack converged on in 2025–2026 (Emil Kowalski, Matt Pocock, Jakub Krehel, Vercel, Addy Osmani, superpowers).
- **One home for kiruk's own skills: `.claude/skills/`, committed through an allowlist.** Claude Code reads it, and Cursor reads it natively for compatibility, so the `.cursor/skills/` and `.agents/skills/` mirrors can go. Licensed packs (the emil course pack) stay out of git: the allowlist never matches them, and the cleanest move is to install them at user level instead.
- **Every kiruk skill learns.** Generalise the loop the founder already built into the user-level `turtle` skill: a ledger per skill, a guard per miss, a rule promoted only after a repeat and only through an approved diff. `LEARNINGS.md` stays the studio-wide ledger for material and cross-skill mistakes.
- **Skills, docs and specs point at each other by a fixed `## Sources` block and a `Skill:` line in each spec**, checked by `doctor`, so nothing is a loose pile of changes.
- **OpenSpec: upgrade to 1.x and slim it.** The file format is unchanged, the new workflow ("actions, not phases") fits how kiruk works, and 0.11 is a year old. Triage the seven stale changes and fix the archive path first. Use it only for promises.

---

## 1. Findings

### 1.1 What kiruk has today (audit of this checkout, 2026-10-17)

| Area                    | What is there                                                                                                                                                                                                                                                                                                                                                                     | What it tells us                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| OpenSpec                | `@fission-ai/openspec` 0.11.0 installed. `openspec validate --all --strict` passes 28/28.                                                                                                                                                                                                                                                                                         | The gate works. Format is healthy.                                                                                                     |
| Open changes            | `openspec list` shows 7 open: `expand-studio-model` 0/22 tasks and `lock-tech-stack` 0/26 (both open since 2026-05-18), `kiruk-logogram-primary` 3/30, `grease-pencil-scene` 10/15 (its direction was cut on 2026-10-17), `add-kirukal-tokens` 11/14, `adopt-blogism-tooling` 9/10, `adopt-forge-tooling` complete but never archived.                                            | Changes pile up instead of closing. This is the "pile of changes" the founder named.                                                   |
| Spec lag                | `FOUNDER_DECISIONS.md` records a looser devlog cadence (2026-05-26), but `build-in-public` still mandates one every 14 days and `doctor` still warns on it, waiting for a proposal.                                                                                                                                                                                               | When the spec has to come first, real decisions get ahead of it and the spec goes stale.                                               |
| Archive path            | Applied changes live in `openspec/archive/<slug>/`. OpenSpec's own archive is `openspec/changes/archive/YYYY-MM-DD-<slug>/`.                                                                                                                                                                                                                                                      | The CLI's `archive`, `list --archived` and `validate --archived` cannot see kiruk's history.                                           |
| Doc drift               | `openspec/AGENTS.md` and `scripts/promote-idea.mjs` describe a `deltas/` folder; every real change uses `specs/`. `openspec/project.md` says "Nothing ships without a spec", which contradicts CLAUDE.md §2.                                                                                                                                                                      | Process docs drifted from practice.                                                                                                    |
| Skills ↔ specs          | No spec mentions a skill. Only `/kiruk-spec` links to OpenSpec. The ISM commands do name a "Source of truth" doc (`ideas/ism-inktober/...`), which is the right instinct.                                                                                                                                                                                                         | No correlation layer exists yet.                                                                                                       |
| Where skills live       | `.gitignore` ignores `.claude/*` except `commands/` and `settings.json`, and ignores `.cursor/skills/emil-*/` ("aiforui.dev licensed course skills"). The 2026-10-16 CHANGELOG says the ISM skills went into `.claude/commands/` "because that is the only committed `.claude/` path".                                                                                            | CLAUDE.md §7 matches `.gitignore` and protects the licensed pack, but it also forces kiruk's own skills into the older command format. |
| Copies                  | `brand-thinking-capture` exists three times (`.claude/commands/kiruk-brand-thinking.md`, `.agents/skills/`, `.cursor/skills/`), and the copies already disagree on which files to read.                                                                                                                                                                                           | Mirrors drift. One source is needed.                                                                                                   |
| Learning                | `LEARNINGS.md` (Mistake / Root cause / Fix / Guard, append-only) plus the `operational-learning` spec. 7 good entries.                                                                                                                                                                                                                                                            | Strong, and close to Every's `docs/solutions/` pattern. It is not wired into skills yet.                                               |
| Founder's own precedent | The user-level `turtle` skill (`~/.claude/skills/turtle/`) has a ledger (`references/learnings.md`: numbered rows, miss classes, a guard per row), promotion to a hard rule on the second row with the same class and root cause, SKILL.md edits only as an approved diff, RED/GREEN evals in `references/evals.md`, and `scripts/sync_core.py --check` for drift between copies. | The self-improving pattern kiruk needs already exists in the founder's hands. It only needs generalising.                              |

### 1.2 The skill format is now a cross-tool standard

- A skill is a folder with `SKILL.md` (frontmatter `name` + `description`) plus optional `scripts/`, `references/`, `assets/`. `name` must match the folder. Body under 500 lines; reference files load only when needed. <https://agentskills.io/specification>
- Anthropic released the format as an open standard (note added 2025-12-18 to the engineering post). The post's own advice: start from where the agent struggles, have Claude write what worked and the common mistakes back into the skill, and treat name + description as the trigger. <https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills>
- Claude Code: project skills live in `.claude/skills/<name>/SKILL.md`, also discovered in parent directories up to the repo root. **Custom commands have been merged into skills**: `.claude/commands/x.md` and `.claude/skills/x/SKILL.md` both make `/x`, and new work should prefer skills because they can carry supporting files. Useful fields: `disable-model-invocation`, `paths` (glob scoping), `context: fork`, `hooks`. Combined description text is capped at 1,536 characters in the listing. <https://code.claude.com/docs/en/skills>
- The same page describes a self-recording `/verify` skill: Claude writes the working recipe into `.claude/skills/verify/SKILL.md` and "edits the recorded file only when it steered a run wrong", so the file can be committed without per-session churn. That is the right edit discipline for any learning skill. <https://code.claude.com/docs/en/skills>
- **Cursor** reads `.agents/skills/` and `.cursor/skills/`, and "for compatibility" also `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, `~/.codex/skills/`. It supports `paths` and `disable-model-invocation` too. <https://cursor.com/docs/skills> (verified this session)
- Codex and Gemini CLI read `.agents/skills/`; GitHub Copilot reads `.github/skills`, `.claude/skills` or `.agents/skills`. Claude Code's docs do not list `.agents/skills`. <https://learn.chatgpt.com/docs/build-skills> · <https://geminicli.com/docs/cli/skills/> · <https://docs.github.com/en/copilot/concepts/agents/about-agent-skills>
- Conclusion for kiruk: `.claude/skills/` is the one folder both of the founder's tools read.

### 1.3 One skill per kind of task

- **Emil Kowalski** publishes one skill per job (animate, review animations, prototype, and so on) and describes the method: write down why each taste decision was made, turn it into strict rules with tables and decision flowcharts, one file per area of the interface, review by asking the agent to critique against the rules. <https://github.com/emilkowalski/skills> · <https://emilkowal.ski/ui/agents-with-taste>. The larger `emil-*` pack on this machine is a licensed course pack, per the `.gitignore` comment, and is not public.
- **Matt Pocock** splits skills by who calls them. User-called skills run the work (`grill-me`, `to-spec`, `implement`, `retro`); model-called skills hold reusable discipline (`grilling`, `tdd`, `diagnosing-bugs`). User-called skills may call model-called ones, never each other. His README argues for small composable skills over Spec-Kit and BMAD, which take the process away from you, and keeps a shared glossary and ADRs updated inline. <https://github.com/mattpocock/skills>
- **Jakub Krehel**: a `better-*` family (typography, colors, accessibility) plus one `better-interface` skill that runs them as a single review. <https://github.com/jakubkrehel/skills>
- **Vercel** `agent-skills` (`web-design-guidelines`, `react-best-practices`, `composition-patterns`) use the `SKILL.md` + `scripts/` + `references/` layout; `npx skills` / skills.sh became the common installer. <https://github.com/vercel-labs/agent-skills> · <https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem>
- **shadcn**'s official skill treats its CLI as the source of truth instead of copying docs into the skill. <https://ui.shadcn.com/docs/skills>
- **Paul Bakaus, Impeccable**: two context files, `PRODUCT.md` (stable facts) and `DESIGN.md` (generated from code), plus deterministic detector rules that can run as a hook after UI edits. <https://github.com/pbakaus/impeccable>
- **Addy Osmani** groups 25 skills by lifecycle stage (define, plan, build, verify, review, ship) with shared reference checklists. <https://github.com/addyosmani/agent-skills>
- **Jesse Vincent, superpowers**: process skills in a fixed chain (brainstorming → writing-plans → subagent-driven-development → requesting-code-review), verb-first names. <https://github.com/obra/superpowers>
- Not found: public skill packs from Rauno Freiberg, Paco Coursey, Benji Taylor, Linear or Raycast. <https://www.ui-skills.com>

The shared shape: a skill is named for one job, encodes a **process** (not a description of the output), carries the **why** for each rule, stays short, and points at the source of truth instead of copying it.

### 1.4 Skills that improve themselves

- **superpowers `writing-skills`** treats a skill like test-driven code: run a pressure scenario on a subagent without the skill and record its excuses (red), write the smallest skill that fixes them (green), close loopholes and retest (refactor). Descriptions say only when to use the skill. <https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md> · <https://blog.fsck.com/2025/10/09/superpowers/>
- **Anthropic skill-creator** runs `evals/evals.json` with and without the skill, grades the runs, benchmarks pass rate, time and tokens, and has a human review each numbered iteration. It also tunes the description against about 20 should-fire / should-not-fire queries. <https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md>
- **Every, compound engineering**: plan → work → review → compound, so "each unit of engineering work should make subsequent units easier". `/ce-compound` writes the lesson to `docs/solutions/`, and the next plan reads it. <https://every.to/source-code/compound-engineering-how-every-codes-with-agents> · <https://github.com/EveryInc/compound-engineering-plugin>
- **Matt Pocock `retro`** only proposes; the human applies. Rules that can be checked mechanically become lint rules, hooks or CI jobs, not more prose. <https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md>
- **Addy Osmani**: after each loop a fresh agent adds learnings to AGENTS.md; prune and archive notes against bloat; changes arrive as PRs. <https://addyosmani.com/blog/self-improving-agents/>
- **Claude Code** keeps CLAUDE.md under ~200 lines, writes its own auto-memory index, and recommends moving any rule that must always hold into a hook. <https://code.claude.com/docs/en/memory>
- **The founder's `turtle` skill** (see 1.1) already combines the best of these: classified ledger, guard per miss, promotion only on repeat, approval-gated rule edits, prune limit, evals that must not regress, drift check across copies.

Common guardrails across all of them: the agent may **record**, the human **decides** rule changes; a lesson must name a concrete guard; checkable rules move into code; files are pruned on a size budget.

### 1.5 How skills, docs and specs point at each other

- **AGENTS.md** is now stewarded by the Agentic AI Foundation (Linux Foundation); the nearest file in the tree wins. Claude Code reads AGENTS.md only when there is no CLAUDE.md, and suggests `@AGENTS.md` inside CLAUDE.md as the bridge. <https://agents.md> · <https://code.claude.com/docs/en/memory>
- **DESIGN.md** (Google Labs, alpha): tokens in YAML frontmatter, reasoning in fixed prose sections, with `lint` (including contrast), `diff` and export to Tailwind `@theme` or DTCG. <https://github.com/google-labs-code/design.md>
- **Anthropic, context engineering**: aim for the smallest set of high-signal tokens; load context just in time from file references. <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents>
- **Birgitta Böckeler** sorts spec tools into spec-first, spec-anchored and spec-as-source; found Kiro turned a small bug into 4 user stories with 16 acceptance criteria and Spec-Kit produced markdown that was tedious to review and that agents ignored; separates a "memory bank" (rules) from task specs. Her follow-up maps who loads what: skills by the model, slash commands by the human, hooks by the software. <https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html> · <https://www.martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html>
- There is **no standard link format** between skills and specs. Working conventions: name other skills instead of force-loading them, point at the file or CLI that holds the truth, update shared glossary/ADR files inline.

### 1.6 Where spec-driven development landed

The design-engineer packs (Emil, Pocock, Krehel) ship small task skills and no spec framework. The spec tools themselves moved toward fluidity: OpenSpec 1.0 says outright that "work isn't linear" and replaced phase gates with actions. Third-party comparisons: <https://ssojet.com/blog/best-spec-driven-development-tools> · <https://alexcloudstar.com/blog/spec-driven-development-2026/> (opinion pieces). Alternatives in the field: GitHub Spec Kit <https://github.com/github/spec-kit>, Kiro <https://kiro.dev>, BMAD <https://github.com/bmad-code-org/BMAD-METHOD>, Tessl (now an agent-skills registry with evals) <https://tessl.io>.

Reading for kiruk: keep specs for the few things that must hold (spec-anchored), and let skills carry craft.

### 1.7 OpenSpec 0.11 → 1.x

- npm `latest` is **1.14.3**, published 2026-10-17 (the day of this research). 0.11.0 shipped 2025-10-13; the 0.x line went on to 0.23.0. **1.0.0 "The OPSX Release"** shipped 2026-01-26, then 14 minors in about nine months. <https://registry.npmjs.org/@fission-ai/openspec> · <https://github.com/Fission-AI/OpenSpec/releases/tag/v1.0.0>
- **Unchanged:** `openspec/specs/`, `openspec/changes/<id>/` with `proposal.md`, `tasks.md`, optional `design.md`, `specs/` deltas using ADDED / MODIFIED / REMOVED / RENAMED Requirements; archive at `openspec/changes/archive/`. `validate --strict`, `list`, `show`, `view` remain. <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/migration-guide.md> (verified this session)
- **Changed:** the `/openspec:*` commands are gone; core profile is `/opsx:propose`, `explore`, `apply`, `update`, `sync`, `archive` (expanded profile adds `new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`). Artifacts form a dependency graph (proposal → specs + design → tasks) that can be edited in any order. OpenSpec no longer writes `AGENTS.md`/`project.md` or CLAUDE.md marker blocks. Settings live in `openspec/config.yaml` (`schema:`, `context:` injected into every planning request, max 50KB, and `rules:` per artifact). Custom workflow schemas can be forked (`openspec schema fork spec-driven <name>`). Same source.
- **Generated skills:** Claude Code gets `.claude/skills/openspec-*/SKILL.md` (plus optional `.claude/commands/opsx/`); Cursor `.cursor/skills/openspec-*`; the generic `agents` target `.agents/skills/`. Delivery can be `skills`, `commands` or `both`. <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/supported-tools.md> · <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/cli.md>
- **Migration path:** upgrade the CLI, run `openspec init` or `openspec update`, restart the IDE. It keeps specs, changes and the archive; strips marker blocks; **deletes `openspec/AGENTS.md`**; leaves `project.md` for you to move into `config.yaml` by hand. Running `init` and declining the prompt is a dry run. Migration guide, above.
- **Known issues (all closed):** cleanup finds `openspec/AGENTS.md` by name and deletes it even when customised; 1.14.0 only added a warning (<https://github.com/Fission-AI/OpenSpec/issues/1819>). A bug deleting user files in `.claude/commands/openspec/` was fixed in 1.13.1 (<https://github.com/Fission-AI/OpenSpec/issues/1873>). Windows `archive` EPERM fixed and CRLF preserved in 1.13.2. From 1.13.1 only `[x]`/`[X]` count as done tasks. <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/CHANGELOG.md>
- Node: 1.14.3 needs Node ≥ 20.19.0; kiruk's Node 22 LTS lock meets it.
- Unverified: whether `openspec init` can run with no tool integration at all; whether 1.x has any awareness of a non-standard `openspec/archive/` folder (most likely not).

---

## 2. Keep / change / drop

### Keep

| What                                                                                        | Why                                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `LEARNINGS.md` format, append-only rule, "a guard must be concrete"                         | Already the compound-engineering pattern. It becomes the studio-wide ledger in §3.5. |
| `operational-learning` spec                                                                 | Still the right promise; gains one requirement about skill ledgers (§3.5).           |
| Non-negotiables, privacy rules, scribble-first, no revenue figures                          | Unchanged. Skills inherit them; they do not restate them.                            |
| OpenSpec spec format and `spec:validate` in CI                                              | Healthy (28/28). Format survives the 1.x upgrade untouched.                          |
| Plan docs in `ideas/<topic>/` with settled / parked / open sections (the studio-dawn shape) | This is the decision record a skill points back to.                                  |
| `/kiruk-capture` and `ideas/log.ndjson`                                                     | Session memory. Unchanged.                                                           |
| `grilling` and `turtle` at user level                                                       | Model-called disciplines every kiruk skill can lean on.                              |
| `.claude/commands/` files                                                                   | They keep working; nothing breaks while they move (decision 7).                      |
| Always-on Cursor rules for privacy, code review and lessons                                 | Guardrails that must load every time belong in rules, not skills.                    |

### Change

| What                                          | To what                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLAUDE.md §4 "Spec-First Workflow"            | "Decision-first": kirukal → decision doc → curated skill; a spec only for promises (§5 of this doc).                                                                                       |
| CLAUDE.md §7 `.claude/` rule and `.gitignore` | Allowlist kiruk's own skill folders (`kiruk-*`, `ism-*`, and `openspec-*` if decision 5 says commit); every other folder under `.claude/skills/`, including licensed packs, stays ignored. |
| CLAUDE.md §8                                  | Add a skill retro line after any task that used a kiruk skill.                                                                                                                             |
| Where kiruk skills live                       | `.claude/skills/<name>/` (Claude Code + Cursor both read it).                                                                                                                              |
| The 12 `.claude/commands/` files              | Become `.claude/skills/<name>/SKILL.md` with empty `learnings.md`, same names, so `/ism-day` etc. keep working.                                                                            |
| `openspec/project.md`                         | Short `openspec/config.yaml` `context:`; vocabulary goes to the existing `GLOSSARY.md`; the capability list is read from `openspec/specs/`.                                                |
| `openspec/AGENTS.md`                          | Its checklist moves into `config.yaml` `rules:` (1.x deletes this file).                                                                                                                   |
| Archive location                              | `openspec/archive/<slug>/` → `openspec/changes/archive/<date>-<slug>/`.                                                                                                                    |
| `scripts/doctor.mjs`                          | Skip `changes/archive/` when counting open proposals; stop reading `project.md`; add the link check from §3.6.                                                                             |
| `scripts/promote-idea.mjs`                    | `specs/` instead of `deltas/`, new archive path; promotion can target a skill as well as a spec.                                                                                           |
| `.cursor/rules/kiruk-studio.mdc`              | Drop the "open the procedure file" slash table (Cursor now sees the skills); keep it a short pointer to CLAUDE.md.                                                                         |
| `operational-learning` spec                   | Add the skill-ledger requirement (§3.5).                                                                                                                                                   |

### Drop

| What                                                                                                | Why                                                                                                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/skills/brand-thinking-capture` and `.cursor/skills/brand-thinking-capture`                 | Mirrors of one skill that already drift; Cursor reads `.claude/skills/`. Drop once `.claude/skills/kiruk-brand-thinking/` exists.           |
| `.agents/skills/` as a folder                                                                       | No tool the founder uses needs it (`.codex/` and `.gemini/` are gitignored). Easy to re-add with a sync script if Codex joins.              |
| "Nothing ships without a spec" (`project.md`) and "Spec-first for durable truth" (root `AGENTS.md`) | They contradict CLAUDE.md §2 and are how the backlog of open changes formed.                                                                |
| Stale open changes                                                                                  | `grease-pencil-scene` closes as superseded by studio-dawn; `adopt-forge-tooling` archives as done; the rest per decision 6.                 |
| Local duplicate `.cursor/skills/emil-*` copies                                                      | Cursor already reads the `.claude/skills/` (or user-level) copy; two copies likely show twice (unverified). Local-only, the founder's call. |

---

## 3. Proposed structure

### 3.1 Four kinds of file, one job each

| Kind       | Job                                                             | Lives in                                                                                        | Who writes it                                 | Changes when                                             |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| **Doc**    | What we decided and why; the world                              | `ideas/<topic>/` plan docs, `docs/`, `VISION-MISSION.md`, `FOUNDER_DECISIONS.md`, `GLOSSARY.md` | Founder + agent in grilling/turtle rounds     | Every decision round                                     |
| **Skill**  | How to make one kind of thing again, to the bar the founder set | `.claude/skills/<name>/`                                                                        | Agent drafts after curation; founder approves | A miss is logged, or the founder curates a better output |
| **Spec**   | What must hold: contracts other people, CI or code rely on      | `openspec/specs/<cap>/spec.md`                                                                  | Through an OpenSpec change                    | A promise changes                                        |
| **Ledger** | What went wrong, and the guard that stops a repeat              | `<skill>/learnings.md`, `LEARNINGS.md`                                                          | Agent records, founder confirms rule changes  | Every miss                                               |

A **promise** is anything the studio would be embarrassed to break silently: design tokens (non-negotiable 5), repo privacy, the build-in-public open/closed boundary (non-negotiable 9), the product registry, client lifecycle states and client templates, content-model rules the site's code tests (for example the studio-dawn listing rules), the tech-stack envelope, CI gates, and operational learning. Everything else (how to draft an ISM day, file a brand-thinking dump, pin a sketch stroke, write in the studio voice) is craft, and craft lives in skills and docs. Final list: decision 4.

### 3.2 Where skills live

```
.claude/skills/
├── kiruk-<task>/        committed   kiruk's own studio skills
├── ism-<name>/          committed   one per ISM method (today's /ism-* commands)
├── openspec-*/          committed or local (decision 5)   generated by OpenSpec 1.x, pinned version
└── <anything else>/     ignored     licensed or third-party installs (emil-*, future packs)
~/.claude/skills/        user level  grilling, turtle, and (recommended) licensed packs
```

- **Claude Code** reads `.claude/skills/` from the session folder up to the repo root, and `~/.claude/skills/`.
- **Cursor** reads `.claude/skills/` and `~/.claude/skills/` for compatibility (verified, <https://cursor.com/docs/skills>). No mirror needed.
- **Licensed packs never reach git** because the ignore rule is an allowlist: only named prefixes are un-ignored, so a new pack dropped into `.claude/skills/` is ignored by default. Safer still (decision 2): install licensed packs at user level (`~/.claude/skills/`), where both tools still read them and the public repo never holds a copy. That also frees the per-repo skill listing budget.
- Proposed `.gitignore` shape (not applied):

```gitignore
# Claude Code local state. Committed: commands/, settings.json, kiruk's own skills (CLAUDE.md §7)
.claude/*
!.claude/commands/
!.claude/settings.json
!.claude/skills/
.claude/skills/*
!.claude/skills/kiruk-*/
!.claude/skills/ism-*/
# !.claude/skills/openspec-*/   ← only if decision 5 = commit
```

- **Invocation** (Pocock's split, using the real frontmatter fields): workflow skills with side effects (`kiruk-capture`, `kiruk-intake`, `kiruk-artifact`, `kiruk-ism-new`) get `disable-model-invocation: true`, so only the founder starts them. Discipline skills (voice, a curated visual method) stay model-invoked and use `paths:` so they load only near the files they govern. A workflow skill may call a discipline skill; workflow skills do not call each other.
- **Naming:** `kiruk-<noun-or-verb>` for studio skills, `ism-<name>` for ISM methods; folder name = `name` field (required by both the standard and Cursor).

### 3.3 Anatomy of a kiruk skill

```
.claude/skills/kiruk-<task>/
├── SKILL.md              process, not output; every rule carries its why; ≤ 500 lines, aim ≤ 200
├── learnings.md          this skill's ledger (format in §3.5); starts empty
├── references/
│   ├── examples.md       founder-approved outputs, or links to them: the gold set
│   └── <depth>.md        tables, decision trees, probes: loaded only when needed
└── evals.md              optional (decision 9): scenarios + RED/GREEN scores
```

`SKILL.md` carries a fixed block so links can be checked:

```markdown
## Sources

- Decision: ideas/<topic>/plan.md §<section> why it is this way
- Promise: openspec/specs/<cap>/spec.md → Requirement: <name> only if one exists
- Ledger: ./learnings.md
- Examples: ./references/examples.md
```

Writing rules, from the packs in 1.3: name it for one job; `description` says when to use it, key use case first, inside the 1,536-character listing cap; encode a decision procedure; give each rule its why; cut any line that does not change behaviour; point at the source of truth instead of copying it (non-negotiables, tokens and specs are linked, never restated).

### 3.4 Adding a skill each time something is curated

This replaces "promote to OpenSpec" as the default graduation. It runs only after ideation, never ahead of a decision (plan §1 "Skills").

1. **Curated moment.** The founder approves an output as "this is the way" (a dawn palette pass, a sketch-layer pinning method, a writing format). That approval is the trigger; nothing earlier is.
2. **Record the decision** in its plan doc (settled section) if it is not already there.
3. **Draft the skill** from the process that produced the approved output, not from the output alone: the questions asked, the order of moves, the thresholds, what was rejected and why. The approved output goes into `references/examples.md`.
4. **Show it** to the founder as a draft; nothing is committed until approved.
5. **Link both ways.** The skill's `## Sources` names the plan doc; the plan doc gets a line `Curated into: .claude/skills/kiruk-<task>/`.
6. **Promise check.** If the decision is also a promise (§3.1), open an OpenSpec change; the spec's Acceptance Artifacts gain `Skill: .claude/skills/kiruk-<task>/`.
7. **Log** a CHANGELOG line with the why, and `/kiruk-capture`.

Example of the shape only (not a decision): when studio-dawn settles how sketch strokes pin to base elements, that method becomes one skill pointing at `ideas/studio-dawn/plan.md`; the rule "the base layer must stand alone" becomes a spec requirement only if the site's code tests it.

### 3.5 Self-improvement loop, tied to `LEARNINGS.md`

This is the `turtle` loop with the domain removed.

**Triggers** (any one): the founder corrects a result ("not what I meant", "you missed X"); work done with the skill has to be redone; a check fails; the founder approves an output as better than the current examples.

**Loop**

1. **Match.** Search the skill's `learnings.md` for the symptom. A match that already has a guard means the guard failed: start from it.
2. **Classify.** Each skill keeps a short class list in its ledger header (e.g. `missed-question`, `wrong-default`, `off-voice`, `over-ceremony`, `false-alarm`). Two misses in one correction are two rows.
3. **Guard.** The smallest durable change that would have caught it: a probe in `references/`, a row in a decision table, a new example, or a check.
4. **Record.** Append a row: ID (skill prefix + number, never reused) · date · symptom · class · root cause · guard (file + what changed) · evidence.
5. **Promote.** A second row with the same class and the same root cause → propose a hard rule in `SKILL.md`, with a `Why:` citing both IDs. **Every edit to `SKILL.md` (rules, description, tables) is shown to the founder as an exact diff and applied only on approval.** Ledger rows, examples and reference probes the agent may add directly. This mirrors Claude Code's own `/verify` discipline: the core file changes only when it steered a run wrong.
6. **Mechanise.** A guard that code can check moves into code: `scripts/doctor.mjs`, the brand-consistency CI gates, a lint rule, or a skill `hooks:` entry. Prose is the last resort (Pocock `retro`; Claude Code memory docs).
7. **Prune.** Merge duplicate guards; keep `SKILL.md` under the line budget; move detail to `references/`.
8. **Learn from success too.** An approved output that beats the current examples is added to `references/examples.md` with one line on what made it better.

**Which ledger**

| The miss is…                                                                        | Goes to                                                                                               |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| About this skill's output or process (taste, order of moves, a missed question)     | `<skill>/learnings.md`                                                                                |
| Material: a break, data loss, privacy slip, spec violation, wrong shipped behaviour | `LEARNINGS.md` (Mistake / Root cause / Fix / Guard), with a row in the skill ledger that points to it |
| Across skills or not tied to any skill                                              | `LEARNINGS.md`                                                                                        |

`LEARNINGS.md` entries whose guard is a skill rule name the skill file in **Guard**. The `operational-learning` spec would gain one requirement: a kiruk skill MUST keep a `learnings.md` ledger, and a material miss found through a skill MUST also land in `LEARNINGS.md`.

**Retro moment.** Session discipline (§8) gains one line: after a task that used a kiruk skill, write `Retro: no miss` or a ledger row. This is turtle's mandatory close retro.

**Evals** (decision 9). A skill earns an `evals.md` once it is used repeatedly or after its first promoted rule: a few realistic scenarios, run by fresh subagents with the skill forbidden (RED) and loaded (GREEN), scored; after any rule change the scores must not drop. When a skill fails to trigger, use skill-creator's description tuning.

**Shared cores.** If a kiruk skill ever needs copies elsewhere (another repo, a client universe), use turtle's pattern: a marked core block plus a sync script with `--check` for drift.

### 3.6 Cross-references: spec ↔ skill ↔ doc

| From                  | To                                               | Where the link lives                                              |
| --------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Skill                 | Decision doc, spec requirement, ledger, examples | `## Sources` block in `SKILL.md`                                  |
| Spec                  | Skill(s) that produce its artifacts              | `Skill:` line under the spec's existing **Acceptance Artifacts**  |
| Decision doc          | Skill it was curated into                        | `Curated into:` line in the settled section                       |
| `LEARNINGS.md` entry  | Skill rule or spec scenario that is the guard    | **Guard** field                                                   |
| CLAUDE.md / AGENTS.md | Nothing per skill                                | They describe the system once; skills are discovered by the tools |

A `doctor` section (proposed) walks all three directions and fails on a dead path or a one-way link. That keeps the system correlated by check, not by memory.

### 3.7 The flow

```
kirukal ─ ideas/inbox.md, ideas/<topic>/         loose; any mess; no gate
   │  grilling / turtle rounds
   ▼
decision doc ─ ideas/<topic>/plan.md             settled · parked · open
   │  founder curates an output
   ├────────────► skill ─ .claude/skills/kiruk-<task>/        how to make it again
   │                 ├─ learnings.md        ← misses, corrections
   │                 └─ references/examples.md ← approved outputs
   │
   └─ only if it is a promise ─► OpenSpec change ─► openspec/specs/<cap>/spec.md
                                                    Acceptance: Skill: kiruk-<task>
LEARNINGS.md ← material and cross-skill misses; Guard points at a skill rule, spec scenario or check
```

---

## 4. OpenSpec recommendation

### Recommendation: upgrade to 1.x, and slim what it governs

- **Why upgrade:** the spec and change format is unchanged, so the move is cheap. 1.x's stance ("work isn't linear", actions not phases, `explore` before committing) matches CLAUDE.md §2 better than 0.11's phase gates. 0.11 is a year old and its command and `AGENTS.md` approach is what upstream removed for reliability. `status`, `show --diff`, `list --archived` and `validate --report findings` are useful, and the Windows archive bug is fixed.
- **Why not replace it:** the gate works today (28/28) and CI already runs it. A home-made validator would rebuild the same thing.
- **Why not stay on 0.11:** frozen tooling with obsolete docs, no upstream fixes, and generated guidance that no longer matches what the project documents.
- **Slim means:** OpenSpec governs promises only (decision 4). Core profile only, delivery `skills` only, tool target `claude` only (Cursor reads `.claude/skills/`). `config.yaml` `context:` stays short and points to CLAUDE.md instead of repeating it. Kiruk's checklist (scenario per requirement, GIVEN/WHEN/THEN, token changes paired with a `design-tokens` delta, eye-motif or justified absence, scribble link in the proposal) moves into `rules:`. A custom `kiruk` schema (forked from `spec-driven`) is possible later; not on day one.

### Steps (none done; each its own commit; on a branch)

1. **Triage the 7 open changes** while still on 0.11: archive what is done (`adopt-forge-tooling`), close `grease-pencil-scene` as superseded by studio-dawn, and decide the rest (decision 6).
2. **Back up** `openspec/AGENTS.md` and `openspec/project.md` content into the change folder for this migration (1.x deletes the first by name).
3. **Move the archive**: `openspec/archive/<slug>/` → `openspec/changes/archive/<YYYY-MM-DD>-<slug>/` (date from the commit that archived it). Update links: 15 tracked files outside the archive reference `openspec/archive/`, and about 25 reference it, `openspec/AGENTS.md` or `openspec/project.md` (CLAUDE.md, root AGENTS.md, README.md, CONTRIBUTING.md, docs/README.md, GLOSSARY.md, FOUNDER_DECISIONS.md, ROADMAP.md, TASKS.md, CHANGELOG.md, `.cursor/rules/*`, `.github/ISSUE_TEMPLATE/proposal.yml`, `/kiruk-intake`, `/kiruk-spec`, the two scripts, and open change folders). `ideas/log.ndjson` is append-only: old lines stay as written.
4. **Fix scripts**: `doctor.mjs` (skip `changes/archive/`; capability list from `openspec/specs/`), `promote-idea.mjs` (`specs/`, new archive path).
5. **`.gitignore` allowlist** from §3.2.
6. **Pin an exact version**: `"@fission-ai/openspec": "1.14.x"` with no caret, choosing the newest 1.14 patch that is at least two weeks old on upgrade day (1.14.3 was published the same day as this research). Install, `pnpm spec:validate`.
7. **Dry run**: `openspec init`, decline cleanup, read what it would remove. Then run it for real with the Claude target, core profile, skills delivery.
8. **Write `openspec/config.yaml`**; move vocabulary to `GLOSSARY.md`; delete `project.md`.
9. **Verify**: `pnpm spec:validate`, `openspec list --archived` shows the moved history, `pnpm doctor` green, CI `openspec.yml` green (it pins pnpm 9 while the repo uses pnpm 10; worth aligning).
10. **Docs**: CLAUDE.md (§5 of this doc), root `AGENTS.md`, `.cursor/rules/openspec.mdc` and `kiruk-studio.mdc`, `docs/README.md`. CHANGELOG entry with the why; a LEARNINGS entry if anything breaks.

### Risks

| Risk                                                                                                                                                          | Mitigation                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openspec/AGENTS.md` deleted even though it is customised (issue #1819)                                                                                       | Step 2 backup; its rules move into `config.yaml`.                                                                                    |
| Generated `openspec-*` skills land in an ignored folder and are invisible to git and to fresh clones                                                          | Decision 5: allowlist and commit (pinned version makes them reproducible), or document `openspec update` after clone.                |
| History invisible to 1.x until the archive moves                                                                                                              | Step 3 before step 7.                                                                                                                |
| `doctor.mjs` counts `changes/archive/` as an open change and reads `project.md`                                                                               | Step 4 before the move lands.                                                                                                        |
| Skill listing budget: 28 emil skills + OpenSpec skills + kiruk skills + user skills crowd the listing; descriptions get truncated and the model misses skills | Licensed packs to user level or `name-only` via `skillOverrides`; `disable-model-invocation` on workflow skills; short descriptions. |
| Fast release cadence (14 minors in ~9 months)                                                                                                                 | Exact pin; upgrade deliberately, read the CHANGELOG first.                                                                           |
| From 1.13.1 only `[x]`/`[X]` count as done                                                                                                                    | Check task lists in open changes during step 1.                                                                                      |
| Unverified: running `init` with no tool integration                                                                                                           | Not needed if the Claude target is used.                                                                                             |
| New command names (`/opsx:*`) next to `/kiruk-spec`                                                                                                           | `kiruk-spec` becomes a thin skill that hands off to `/opsx:propose` with kiruk's rules.                                              |

---

## 5. CLAUDE.md edits this would need

Proposed text only. Not applied; CLAUDE.md is being edited in another session.

**§1, last sentences.** Replace "You work in an OpenSpec-style: clarify and formalize when something is ready to become durable truth" with:

> You work decision-first: ideas stay loose until the founder decides; a curated result becomes a skill; only a promise becomes a spec.

**§4, replace the whole section** with "Decision-first workflow":

> 1. **Kirukal** — `ideas/inbox.md` or `ideas/<topic>/`. No gate.
> 2. **Decide** — grilling / turtle rounds; record settled · parked · open in `ideas/<topic>/plan.md`.
> 3. **Curate → skill** — when the founder approves an output, draft one skill at `.claude/skills/kiruk-<task>/` (process, sources, empty ledger, approved example). Founder approves the draft. Never write a skill ahead of the decision it records.
> 4. **Promise → spec** — only if the decision is a promise (tokens, privacy, build-in-public boundary, product registry, client lifecycle and templates, tested content rules, tech stack, CI gates, operational learning): OpenSpec change → `npm run spec:validate` → apply → archive to `openspec/changes/archive/`.
> 5. **Link** — skill `## Sources` ↔ spec `Skill:` line ↔ plan doc `Curated into:`. `npm run doctor` checks them.
> 6. **Capture** — `/kiruk-capture`.

**§6, add one line:**

> - `.claude/skills/` — kiruk's own skills (`kiruk-*`, `ism-*`), committed; read by Claude Code and Cursor. Licensed or third-party skills are local-only (user level `~/.claude/skills/` or ignored folders) and never committed.

**§6a, add:**

> - **Skill learning** (`operational-learning` spec): each kiruk skill keeps a `learnings.md` ledger; a repeated miss proposes a rule as a diff for founder approval; checkable guards move into `doctor` / CI.

**§7, replace the `.claude/` bullet** with:

> - Do NOT add files under `.claude/` except `commands/`, `settings.json`, and kiruk's own skill folders `.claude/skills/kiruk-*/` and `.claude/skills/ism-*/`. Never commit licensed or third-party skills (e.g. the `emil-*` course pack); they stay local.

and add:

> - Do NOT edit a kiruk skill's `SKILL.md` rules or description without showing the founder the exact diff first. Ledger rows, examples and reference probes may be added directly.

**§8, add:**

> - After a task that used a kiruk skill → write `Retro: no miss` or a row in that skill's `learnings.md`; material misses also go to `LEARNINGS.md`.
> - When the founder curates an output → offer to draft its skill (§4 step 3).

Matching edits elsewhere: root `AGENTS.md` "Core invariant" and "Forbidden paths"; `openspec/project.md` (replaced by `config.yaml`); `.cursor/rules/kiruk-studio.mdc` (pipeline list and slash table); `.cursor/rules/openspec.mdc`; `docs/README.md` reading list.

---

## 6. Open decisions for the founder

**All answered 2026-10-18 — see "Decisions" at the top.** Kept below as asked.

1. **Skill home.** `.claude/skills/` committed through an allowlist, read by both Claude Code and Cursor. Alternative: `.agents/skills/` as the canonical folder plus a sync script into `.claude/skills/` (only worth it if Codex or Gemini join). **Recommended: `.claude/skills/`.**
2. **Licensed packs.** Move the emil course pack to user level (`~/.claude/skills/`; both tools read it, the repo never holds it), or keep it in the ignored repo folders. **Recommended: user level**, and delete the local `.cursor/skills/emil-*` duplicates.
3. **OpenSpec.** Upgrade to a pinned 1.14.x and slim it to promises / stay frozen on 0.11 / replace with plain markdown specs. **Recommended: upgrade and slim**, after the triage in step 1.
4. **The promise list.** Which capabilities stay under OpenSpec. **Recommended:** design-tokens, repo-privacy, build-in-public, products, client-lifecycle + the seven templates, tech-stack, brand-consistency-ci, operational-learning, idea-capture, and the studio content model once studio-dawn Phase 1 tests it. `brand-system`, `pen-and-paper` and `ism` to be reviewed when studio-dawn Phase 4 marks the old direction superseded.
5. **Generated `openspec-*` skills.** Commit them (pinned, reproducible, visible to Cursor on a fresh clone) or keep them local and regenerate. **Recommended: commit.**
6. **The seven open changes.** Archive `adopt-forge-tooling`; close `grease-pencil-scene` as superseded; for `expand-studio-model` and `lock-tech-stack` (specs already written, 0 tasks ticked) either archive as applied or close; finish or close `add-kirukal-tokens`, `adopt-blogism-tooling`, `kiruk-logogram-primary`. **Recommended: one triage session before any upgrade.**
7. **Moving the 12 existing commands.** All at once (one §7 change, one home, each gets an empty ledger) or one by one when next touched. These are already curated, so moving them is not "adding skills ahead of a decision". **Recommended: all at once**, `brand-thinking` mirrors dropped in the same move.
8. **Who edits `SKILL.md`.** Approved diff only, always; or let the agent apply small wording fixes directly. **Recommended: approved diff only** (the founder's taste stays the founder's; it is also what `turtle` does).
9. **Evals.** Never / after a skill's first promoted rule / for every skill. **Recommended: after the first promoted rule, or once a skill is used often.**
10. **First new skill.** Wait for studio-dawn's first curated piece, or start with the curation ritual itself (§3.4) as a `kiruk-*` skill so every later skill is drafted the same way. **Recommended: founder's call**; the ritual is the one skill whose decision this proposal would record, if accepted.
