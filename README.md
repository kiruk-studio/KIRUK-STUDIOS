# kiruk

> *Kirukal* — Tamil for scribble. The fingerprint of every idea before tools sand it off.

[![License: dual](https://img.shields.io/badge/license-MIT_%2B_CC--BY_4.0-iris)](./LICENSE)
[![OpenSpec: strict](https://img.shields.io/badge/openspec-strict-portal)](./openspec/)
[![Build in public](https://img.shields.io/badge/build-in--public-halo)](./openspec/specs/build-in-public/spec.md)
[![Lab-led studio](https://img.shields.io/badge/model-lab--led-void)](./VISION-MISSION.md)
[![Pen and paper first](https://img.shields.io/badge/scribble-required-kohl)](./openspec/specs/pen-and-paper/spec.md)
[![Code of Conduct](https://img.shields.io/badge/CoC-Contributor_Covenant_2.1-paper)](./CODE_OF_CONDUCT.md)

---

**kiruk** is a creative studio out of Bangalore, India. It is also a movement — **kirukism** — and an open-source operating system. The studio is lab-led: ISM experiments and in-house digital products are the front door; client work follows the reputation, not the other way around. The OS is the spine that lets one founder sustain studio, lab, and product line at once.

This monorepo holds everything: ideology, brand, design tokens, capability specs, websites, client universes, ISM experiments, in-house products, scripts, content, and the automation surface that ties it together. Every artifact begins on paper. Every promise lives in a spec. Every change tells you *why*.

It is **open for learning and scrutiny**. Process, sketches, dead ends, and wins stay visible. Revenue and client internals stay private. The boundary is enumerated, not improvised — see [`build-in-public`](./openspec/specs/build-in-public/spec.md).

---

## Read first

- [`GLOSSARY.md`](./GLOSSARY.md) — the vocabulary (kiruk · kirukism · kirukargal · kirukan · scribble · universe · ISM · product).
- [`VISION-MISSION.md`](./VISION-MISSION.md) — north star, principles, non-negotiables.
- [`docs/README.md`](./docs/README.md) — full navigation index by role and intent.

## Repo at a glance

```
                ┌──────── strategy ────────┐
                │  VISION   ROADMAP   TASKS │
                │  FOUNDER_DECISIONS        │
                └──────────────┬───────────┘
                               │
                ┌──────── source of truth ────────┐
                │  openspec/specs/  (capabilities) │
                │  openspec/changes/ (in-flight)   │
                │  openspec/archive/ (history)     │
                └──────────────┬──────────────────┘
                               │
   ┌──────────────────────┬────┴────┬──────────────────────┐
   ▼                      ▼         ▼                      ▼
 apps/              packages/    kiruk-ism/         kiruk-projects/
 ├ kiruk-web        └ design-    └ <ism>/            ├ <universe>/
 └ kiruk-portal       system/                        └ _products/<product>/
                       ↑
                       │  every component imports
                       │  Eye/* and token vars
                       │
           ┌───────── content ─────────┐
           │ devlogs · case-studies    │
           │ story-drops · social      │
           │ scribbles · manifesto     │
           └────────────┬──────────────┘
                        │
                        ▼
                   automation surface
              (scripts/ · .github/workflows/
               .claude/commands/ · brand-CI)
```

## The five things kiruk does

1. **Run the ISM Lab** — self-initiated micro-worlds; the discovery engine.
2. **Ship in-house digital products** — tools, micro-apps, browser extensions, AI-augmented SaaS, web toys.
3. **Worldbuild with founders** — client universes that pass the non-negotiables.
4. **Build brand systems and experimental web** — eye-first, Awwwards-grade.
5. **Design creative OS** — package what we learn so other weird studios can fork it.

## Non-negotiables

- No trend-chasing. No boring work. No shallow branding.
- Every visual passes the **eye-motif test** or justifies absence in spec.
- No design token without a matching spec requirement.
- **No work without a scribble.** Pen-and-paper before code — see [`pen-and-paper`](./openspec/specs/pen-and-paper/spec.md).
- No revenue figures in public artifacts. Story drops only.
- Lab-led, not services-led — when prioritising, lab + product work comes first.

## Quickstart

```bash
pnpm install              # install workspaces
pnpm tokens:build         # generate packages/design-system/build/
pnpm spec:validate        # gate all openspec specs (strict)
pnpm doctor               # full repo health check
```

Then read [`docs/README.md`](./docs/README.md) for the full path through the OS.

## Where to look

| Want to… | Read |
|---|---|
| Understand kiruk + kirukism | [VISION-MISSION.md](./VISION-MISSION.md) · [GLOSSARY.md](./GLOSSARY.md) |
| Know current priorities | [ROADMAP.md](./ROADMAP.md) · [TASKS.md](./TASKS.md) |
| Give input to unblock next phases | [FOUNDER_DECISIONS.md](./FOUNDER_DECISIONS.md) |
| See what changed | [CHANGELOG.md](./CHANGELOG.md) |
| AI setup (Claude Code, Cursor) | [CLAUDE.md](./CLAUDE.md) · [AGENTS.md](./AGENTS.md) · [`.cursor/rules/`](./.cursor/rules/) |
| Navigate specs | [openspec/project.md](./openspec/project.md) · [openspec/specs/_template/spec.md](./openspec/specs/_template/spec.md) |
| Dump a raw idea | [ideas/inbox.md](./ideas/inbox.md) |
| Read the manifesto | [content/manifesto.md](./content/manifesto.md) |
| Contribute as a kirukargal | [CONTRIBUTING.md](./CONTRIBUTING.md) · [GOVERNANCE.md](./GOVERNANCE.md) |
| Report a security issue | [SECURITY.md](./SECURITY.md) |
| Website app | [apps/kiruk-web/](./apps/kiruk-web/) |
| Client portal app | [apps/kiruk-portal/](./apps/kiruk-portal/) |
| Keep secrets and client data safe | [openspec/specs/repo-privacy/spec.md](./openspec/specs/repo-privacy/spec.md) |
| Learn from past mistakes (guards) | [LEARNINGS.md](./LEARNINGS.md) · [operational-learning spec](./openspec/specs/operational-learning/spec.md) |
| Hybrid monorepo vs product repos | [FOUNDER_DECISIONS.md](./FOUNDER_DECISIONS.md) → ST5 |

## Spec-first flow

```
idea → ideas/inbox.md
     → /kiruk-capture            (logs decisions to ideas/log.ndjson with scribble ref)
     → promote-idea.mjs          (graduates to openspec/changes/<slug>/ — requires scribble)
     → openspec validate         (gate)
     → apply (deltas merged into openspec/specs/<cap>/spec.md)
     → /kiruk-artifact           (generates template output)
     → openspec/archive/<slug>/  (history)
     → CHANGELOG.md              (why it mattered)
```

## Slash commands

- `/kiruk-intake` — structured intake for new universe
- `/kiruk-spec` — turn intake into spec + change proposal
- `/kiruk-artifact <template>` — render template against active universe
- `/kiruk-capture` — flush session decisions into `ideas/log.ndjson`
- `/kiruk-ism-new <name>` — scaffold a new ISM experiment

## License

This repo is dual-licensed.

- **Source code, scripts, configuration** → [MIT](./LICENSE-CODE).
- **Manifesto, devlogs, capability specs (prose), sketches, templates** → [CC-BY 4.0](./LICENSE-CONTENT).

See [`LICENSE`](./LICENSE) for the routing rule. The names *kiruk*, *kirukism*, *kirukargal*, *kirukan*, and the eye-motif identity system are the studio's voice — neither license grants permission to operate under that brand. See [`GOVERNANCE.md`](./GOVERNANCE.md) → Forking.

## Founder

Arun Kumaar Srinivasan · [@kirukism](https://instagram.com/kirukism) · Bangalore.

> "Worlds start as scribbles. Specs catch up to imagination, not the other way around."
