# docs/ — Navigation Index

> The kiruk operating system is spread across the repo root. This page is the **map**.
> Read these in order if you are new.

---

## Read first (10 minutes)

1. [`/README.md`](../README.md) — what kiruk is, in one page.
2. [`/GLOSSARY.md`](../GLOSSARY.md) — the vocabulary (kiruk, kirukism, universe, scribble, ISM, product).
3. [`/VISION-MISSION.md`](../VISION-MISSION.md) — vision, mission, 12 principles, non-negotiables.
   - Long-form companion: [`vision-and-system-plan.md`](./vision-and-system-plan.md) — full studio thesis, service model, ISM lab, and Claude Code implementation plan.
4. [`/CLAUDE.md`](../CLAUDE.md) — operating instructions for Claude Code (and humans).

## Read when you contribute

5. [`/CONTRIBUTING.md`](../CONTRIBUTING.md) — how to open issues, PRs, propose changes.
6. [`/CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) — community standards.
7. [`/GOVERNANCE.md`](../GOVERNANCE.md) — who decides what, and how that changes.
8. [`/SECURITY.md`](../SECURITY.md) — vulnerability disclosure policy.
9. [`/LICENSE`](../LICENSE) — dual license (code MIT / content CC-BY 4.0).

## Read when you author specs

10. [`/openspec/project.md`](../openspec/project.md) — domain + conventions + capability list.
11. [`/openspec/AGENTS.md`](../openspec/AGENTS.md) — lifecycle rules for OpenSpec.
12. [`/openspec/specs/_template/spec.md`](../openspec/specs/_template/spec.md) — structure for new capability specs.

## Read when you build features

13. [`/ROADMAP.md`](../ROADMAP.md) — phases, gates, deployment topology.
14. [`/TASKS.md`](../TASKS.md) — rolling task board.
15. [`/FOUNDER_DECISIONS.md`](../FOUNDER_DECISIONS.md) — what is locked, what still blocks.
16. [`/CHANGELOG.md`](../CHANGELOG.md) — what changed and why.
17. [`/LEARNINGS.md`](../LEARNINGS.md) — material mistakes + guards.

## Read when you ship content

18. [`/content/manifesto.md`](../content/manifesto.md) — the kirukism manifesto.
19. [`/openspec/specs/build-in-public/spec.md`](../openspec/specs/build-in-public/spec.md) — Open/Closed boundary, redaction, story-drops.
20. [`/openspec/specs/content-pipeline/spec.md`](../openspec/specs/content-pipeline/spec.md) — canonical → derivatives.

## Read when you onboard a client universe

21. [`/openspec/specs/client-lifecycle/spec.md`](../openspec/specs/client-lifecycle/spec.md) — state machine.
22. [`/kiruk-templates/`](../kiruk-templates/) — the seven document templates.

## Read when you start an in-house product

23. [`/openspec/specs/products/spec.md`](../openspec/specs/products/spec.md) — tiers, registry, graduation.
24. [`/openspec/specs/products/registry.md`](../openspec/specs/products/registry.md) — active + archived products.
25. [`/FOUNDER_DECISIONS.md`](../FOUNDER_DECISIONS.md) → **ST5** — when a product graduates out of this monorepo into its own `kiruk-studio` repository.

## Read when you start an ISM

26. [`/openspec/specs/ism/spec.md`](../openspec/specs/ism/spec.md) — registry, scaffolding rules.

## Read when you sketch

27. [`/openspec/specs/pen-and-paper/spec.md`](../openspec/specs/pen-and-paper/spec.md) — scribble-first ritual.
28. [`/kiruk-templates/_scribble/`](../kiruk-templates/_scribble/) — manifest + textual templates.

## Quickstart commands

```bash
pnpm install           # install workspaces
pnpm tokens:build      # generate design-system build/
pnpm spec:validate     # gate all openspec specs (strict)
pnpm doctor            # full repo health check
```

## Slash commands (Claude Code / Cursor)

| Command                      | What it does                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `/kiruk-intake`              | Structured intake for a new universe                                                          |
| `/kiruk-spec`                | Turn intake → spec + change proposal                                                          |
| `/kiruk-artifact <template>` | Render a template (portfolio / services / pitch / proposal / contract / invoice / onboarding) |
| `/kiruk-capture`             | Flush session decisions into `ideas/log.ndjson`                                               |
| `/kiruk-ism-new <name>`      | Scaffold a new ISM experiment                                                                 |

See [`/.claude/commands/`](../.claude/commands/) for the source.
