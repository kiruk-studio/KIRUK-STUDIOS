---
status: kirukal — working method, not a locked spec
date: 2026-10-25
source: founder, after deciding kiruk.in stays a private repo and Kiruk Studio stays the open monorepo
---

# Private craft, public studio

kiruk.in stays private. Kiruk Studio stays open. The eye, the era shells, the pen, and the skills that know how to make them live in the private repo, because that is where they run. This repo uses them by reading them, then writes only the public piece here.

One Cursor window has both folders. That is the bridge. No submodule, no copy of the personal site, no second design.

## How a session works

1. Both roots are open: this repo, and the sibling `kiruk-in`.
2. Name the job (a studio page, a codex figure, an era, a stroke, the loader eye).
3. Read the matching skill in the private repo before drawing or coding. The skill is the method. Follow it.
4. Open the matching UI in the private repo and treat it as the reference build. The layout, the eye, and the components already exist there.
5. Write the public result in this repo: a proto under `ideas/`, a studio page, or later a package. Personal routes, notebook posts, life pages, contact, and Supabase stay unread as source material.

If the private folder is not in the workspace, stop and ask for it. Guessing a new eye or a new era shell from memory forks the design.

## Skills to read

Read these in `kiruk-in`. Leave the files there. They stay the source while the eye still changes every week.

| Job                                                     | Skill                                                             | Where                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Any loader-eye work, which skill next                   | `eye-loader-system`                                               | `kiruk-in/.claude/skills/eye-loader-system`   |
| Invent an era's point of view                           | `eye-ideation`                                                    | `kiruk-in/.claude/skills/eye-ideation`        |
| The body of the eye                                     | `eye-anatomy`, `eye-iris-pupil`, `eye-light-optics`, `eye-motion` | `kiruk-in/.claude/skills/`                    |
| How an era's screen paints the eye                      | `eye-era-media`, `eye-era-cut`                                    | `kiruk-in/.claude/skills/`                    |
| Shaders                                                 | `eye-tsl-craft`                                                   | `kiruk-in/.claude/skills/eye-tsl-craft`       |
| Opening, blink, tube                                    | `eye-opening`                                                     | `kiruk-in/.claude/skills/eye-opening`         |
| Pointer, gaze, tap-through                              | `eye-interaction`                                                 | `kiruk-in/.claude/skills/eye-interaction`     |
| Check a built era                                       | `eye-verification`                                                | `kiruk-in/.claude/skills/eye-verification`    |
| Handwriting, sketchnote ink                             | `sketch-ink`                                                      | `kiruk-in/.cursor/skills/sketch-ink`          |
| Speed without stripping the eye, loader, cursor, or era | `kiruk-perf-identity`                                             | `kiruk-in/.cursor/skills/kiruk-perf-identity` |

Already in this repo, for studio figures:

| Job                                                        | Skill                         |
| ---------------------------------------------------------- | ----------------------------- |
| Pen-and-ink plate with one modern line on the same drawing | `.claude/skills/kiruk-codex`  |
| A studio sheet: which pass, which skill                    | `.claude/skills/kiruk-sheet`  |
| Ruling, the golden-ratio module, dimension codes           | `.claude/skills/kiruk-rule`   |
| Quill, pen, or hand on that sheet                          | `.claude/skills/kiruk-stroke` |

`kiruk-notebook-voice` stays on the private site. It is the notebook's voice, not a studio surface.

A skill moves into this repo only when the founder says that method is ready to be public, and only into a path this repo already allows (`.cursor/skills/` or `.claude/commands/`). Copying it earlier makes two copies, and the private one will keep changing.

## UI to read

Reference builds. Study them. Rebuild the public slice. Importing these trees into `apps/` publishes the personal site's structure into the open repo.

| Craft                        | Private path                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| The eye                      | `kiruk-in/src/components/three/eye`                                                              |
| Era shells (1970–2026)       | `kiruk-in/src/components/era-shell`                                                              |
| Which era is which archetype | `kiruk-in/src/data/era-archetypes.ts`                                                            |
| Loader and opening           | `kiruk-in/src/components/ui/loader`, `kiruk-in/src/components/ui/immersive-era-loading-page.tsx` |
| Pen and sketchnote type      | `kiruk-in/src/components/sketch-ink`, `kiruk-in/docs/SKETCH_INK_*.md`                            |
| Era looks                    | `kiruk-in/src/lib/era-visuals.ts`, `kiruk-in/src/components/three/eye/look.ts`                   |

The studio's own picture language is the codex: a manuscript pen layer and one measured line on the same drawing. Prototypes already sit in `ideas/studio-dawn/protos/blend`. The next era archetype (`codex`) is designed with `eye-ideation` and drawn with `kiruk-codex`, using the eye and the stroke tools above as the parts. It is explored on the studio surface. The private site keeps the computing eras.

## What stays in the private repo

- Routes and pages under `kiruk-in/src/app` (about, work, notebook, life, contact, desk)
- Posts, drafts, and personal copy
- Supabase, Notion, visitor, and contact code
- `.env` and anything in Vercel env for kiruk.in
- Broken or in-progress pages. Fix the path that is on screen in that repo. A full repair is not a gate for using the eye here.

## Where public work is written

| Kind of work                                                                                    | Home in this repo                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Scribble, open questions, dawn and codex notes                                                  | `ideas/studio-dawn/`, `ideas/kiruk-codex/`                               |
| This bridge                                                                                     | `ideas/private-craft-bridge/`                                            |
| A figure or a single page experiment                                                            | `ideas/kiruk-codex/plates/` or `ideas/studio-dawn/protos/`               |
| The studio site, when a page is real enough to ship                                             | `apps/kiruk-web` for now; a Next surface later, after an OpenSpec change |
| A craft package, only after the same piece is used by the studio and still imported by kiruk.in | `packages/`                                                              |

Two Vercel projects stay two projects. kiruk.in builds the private repo. The studio domain builds this repo. Shared look comes from following the same skills and the same reference UI, then from a package once a piece is calm.

## When a piece is allowed to cross

A component or a skill crosses into this repo when all of these are true:

1. It has been calm for a stretch of real use on kiruk.in.
2. A public page needs that exact piece.
3. The files contain no personal copy, no client material, no keys, no notebook drafts.
4. The private app can depend on the public package afterwards, so there is still one source.

Until then, the private folder is the source and this repo is the reader.

## Studio front door (2026-10-26)

`apps/kiruk-studio` is the first public use of the private eye. It copies the eye machine and the opening, shows one manuscript look, and reveals one sheet after the iris. Era homepages and personal copy stay in kiruk.in. `apps/kiruk-web` is still the Astro placeholder until this page is the one on the studio domain.

Since 2026-11-05 the studio's opening is its own: the ink opening draws the burin eye stroke by stroke and then wakes it ([`ideas/studio-dawn/ink-opening.md`](../studio-dawn/ink-opening.md)). The copied tube and live era eye are no longer imported by the studio's loader. Their files stay in the tree until the founder decides whether to keep them.

## Order of work

1. Keep building the eye and the pen in kiruk.in. Use the skills there.
2. For studio work in this repo, read those skills and that UI, and produce public pages and plates here.
3. Lift one calm piece into `packages/` when the studio page and the private site both need it.
4. Point kiruk.in at that package. The personal site becomes a customer of the open craft.
