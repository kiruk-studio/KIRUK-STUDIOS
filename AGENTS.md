# AGENTS.md — Operational Map for AI Agents

Terse navigation for any AI coding agent (Claude Code, Cursor, etc.) working in this repo.

## Entry points

1. Read `CLAUDE.md` first — contains master prompt, non-negotiables, forbidden actions.
2. Read `VISION-MISSION.md` to understand the studio's direction.
3. Read `ROADMAP.md` + `TASKS.md` for current priorities.
4. Read `openspec/project.md` for domain vocabulary and conventions.
5. Read `openspec/AGENTS.md` for OpenSpec lifecycle rules.
6. Read `openspec/specs/repo-privacy/spec.md` for **secrets, private data, and review** expectations (pair with [CONTRIBUTING.md](CONTRIBUTING.md) and [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)).
7. Read [LEARNINGS.md](LEARNINGS.md) and `openspec/specs/operational-learning/spec.md` for **recorded mistakes and guards** so you do not repeat known failure modes.
8. For **brand-strategy thinking** (17 Day Brand pass, not locked vision): [ideas/brand-thinking/README.md](ideas/brand-thinking/README.md). Dump via `/kiruk-brand-thinking`. Do not treat that folder as `VISION-MISSION.md`.
9. For **the eye, eras, loader, and pen**: read them from the private sibling repo `kiruk-in` (skills and reference UI). Write public results here. Method: [ideas/private-craft-bridge/README.md](ideas/private-craft-bridge/README.md).

## Cursor & Composer

- **Project rules:** [`.cursor/rules/`](.cursor/rules/) (`.mdc` files) supplies the same baseline defaults in Cursor **Chat** and **Composer** as `CLAUDE.md` does in Claude Code: always-on studio OS plus a **glob-scoped** rule for `openspec/**` and `ideas/**`. Ensure project rules are enabled in Cursor (Rules for AI) so they attach to new conversations.
- **Kiruk workflows in Cursor:** There is no built-in `/kiruk-*` menu. Use the same procedures as Claude Code: open the matching file under [`.claude/commands/`](.claude/commands/) (e.g. [`.claude/commands/kiruk-capture.md`](.claude/commands/kiruk-capture.md)) or @-mention it, or type the slash name in chat; the model follows that Markdown spec.
- **NPM scripts (repo root):** `npm run spec:validate` — OpenSpec gate; `npm run tokens:build` — regenerate `packages/design-system/build/`; `npm run spec:list` — list changes; `npm run idea:promote` — promote an idea; `npm run session:capture` — run the session capture script manually (Claude `SessionEnd` and optional Cursor `sessionEnd` also invoke [`scripts/capture-session.mjs`](scripts/capture-session.mjs), which expects a Claude-style transcript when present, so **entries may be sparse in Cursor** unless you also run the **`/kiruk-capture` procedure** after substantive work).
- **Thick context:** @-mention [`CLAUDE.md`](CLAUDE.md) or `openspec/project.md` in Composer/Chat for full voice and constraints in one shot.
- **Hooks:** [`.cursor/hooks.json`](.cursor/hooks.json) may register `sessionEnd` → `node scripts/capture-session.mjs`. For **decision-quality** `ideas/log.ndjson` lines, follow [`.claude/commands/kiruk-capture.md`](.claude/commands/kiruk-capture.md) (or ask the agent to), not only the automatic session hook.

## Creative rhythm (read with rules)

**Rules and skills are not a substitute for imagination**—they are guardrails, memory, and safety (privacy, review, learnings). Encourage messy, expressive work in `ideas/inbox.md` and early exploration; only **tighten** into `openspec/` when the user is ready to treat an idea as durable or shippable. See [CLAUDE.md](CLAUDE.md) §2–§4.

## Core invariant

**Spec-first for durable truth.** No **shipped or canonical** artifact without a matching `openspec/specs/<capability>/spec.md` requirement. Every edit to a spec goes through `openspec/changes/<slug>/` (propose → validate → apply → archive). Exploratory kirukal in the inbox is **not** under that gate until promoted.

## Change protocol

1. Branch-of-thought → `ideas/inbox.md` OR `/kiruk-capture`.
2. Promote-ready idea → `scripts/promote-idea.mjs <slug>` → creates `openspec/changes/<slug>/proposal.md`.
3. Fill proposal.md (why + what-changes + impact) and the delta spec file.
4. Run `npx openspec validate`.
5. Apply with `/kiruk-artifact` or manual edits referencing the proposal.
6. Move proposal folder to `openspec/archive/<slug>/`.
7. Append entry to `CHANGELOG.md`.

## Capability registry

- `brand-system` — eye-motif identity + rules
- `design-tokens` — DTCG JSON, Style Dictionary outputs
- `idea-capture` — inbox → log → promoted pipeline
- `repo-privacy` — no secrets in git, private client/API data boundaries, PR checklist, [CONTRIBUTING.md](CONTRIBUTING.md)
- `operational-learning` — append-only [LEARNINGS.md](LEARNINGS.md), concrete **Guard** per entry, strengthen on repeat
- `ism` — ISM lab (names-only for now; no subproject specs until `/kiruk-ism-new` is run)
- `template-{portfolio,services,pitch,proposal,contract,invoice,onboarding}` — 7 client docs

## Forbidden paths

- `packages/design-system/build/**` — generated, regenerate via `npm run tokens:build`
- Any file outside `.claude/commands/` and `.claude/settings.json` inside `.claude/` — local state
- Tracked files containing **live** API keys, tokens, or private client credentials — use env + `.env.example` only; see `repo-privacy` spec

## Tool allowlist

- `npx openspec validate` / `npm run spec:validate` — spec gate
- `npm run tokens:build` — regenerate packages/design-system/build/
- `npm run session:capture` — manual `capture-session.mjs` (optional; see Cursor & Composer)
- `/kiruk-intake`, `/kiruk-spec`, `/kiruk-artifact`, `/kiruk-capture`, `/kiruk-brand-thinking`, `/kiruk-ism-new` — in Claude Code as slash commands; in Cursor, use the same definitions under `.claude/commands/`
- `/kiruk-mai` (draw a plate with the ink engine), `/kiruk-mai-proof` (curate it: numbers, 4× look, verdict), `/kiruk-mai-style` (a reference into a measured style) — engine `packages/mai`; proof with `node packages/mai/scripts/proof.ts <plate.ts> <out> --commit`
