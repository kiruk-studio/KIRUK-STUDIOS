---
status: draft — kirukal, not a locked spec
date: 2026-10-17
source: grilling session with Arun, rounds 1–3 (all decisions below were answered by the founder)
scope: apps/kiruk-web (studio.kiruk.in) only — kiruk.in personal site, portal, forge, blogism untouched
promotes-to: openspec change(s) once the base layer and ideation earn it (see Phase 4)
---

# Studio Dawn — rebuild plan

kiruk studio is being rebuilt from scratch. The old site (3D grease-pencil scene, sketch CSS, hand fonts) is cut. What replaces it is built in order: information architecture first, then a clean base layer, then the ideas that make it kiruk — the dawn, the ink bleed, the hand-sketch layer, the eye.

The north star, in the founder's words: **Arun means dawn.** The calm before sunrise, the thin layer of rays before the sun shows. Art and code together. Rebel, out of this world, but never so complicated that people can't read it.

---

## 1. Settled decisions

### Scope

- Only `apps/kiruk-web` → studio.kiruk.in. Nothing on the personal site.

### The cut

- Remove **all** existing design from `apps/kiruk-web`: every component, all of `global.css`, all 5 fonts (Left Hand, Magnetic Drawing, Bridges Not Walls, Kirukal, Kirukulam), the landing page, the `scribble-writer` integration, `src/scribbles/`, and every visual dependency (`three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`, `gsap`, `motion`, `perfect-freehand`, React + `@astrojs/react`).
- Keep: logo SVGs (`public/brand/*`) + favicon, docs, the Velite content config, `vercel.json`, `lib/base.ts` + `lib/site.ts`, and a **bare Astro shell with one plain-text placeholder page** so studio.kiruk.in stays up.
- Kirukal / Kirukulam are the studio's own faces — they still live in the kiruk-in source and in git history after the cut.
- `packages/*`, forge, portal stay untouched (`@kiruk/design-system` is consumed by forge and portal).
- Old specs that describe the old design stay as documentation and get marked superseded when the new direction is specced.

### Logo

- Use the current logogram as-is. Needles = time angles (timeless design); 8 directions = giving the right direction; the shape reads as an eye (the vision behind everything); the line = support. Not final — a better mark may come later.

### Two layers (the core idea)

Not two halves of the page. Two **layers**:

1. **Base layer** — clean, readable, generated or illustrated: normal type, wireframes, diagrams, prototypes, the idea of what the design is trying to show. Built first.
2. **Sketch layer** — the founder's own hand (graphic tablet), pencil stroke or other stroke types, drawn **on top** of the base. "Portraying our idea on top of our imagination."

Rules:

- The base layer stands alone: fully readable and usable without the sketch layer (screen readers, small screens, slow devices). The sketch layer only adds.
- The sketch layer is vector, pinned to base elements so it scales with the layout at every size. Visible by default.
- Whether a visitor can hide/reveal the sketch layer is decided in ideation.

### Dawn — the picture

- Vertical, like a real dawn landscape: **sky on top is lighter**, **earth below is darker** (mountain, landscape, building — any part of earth). They mingle the way dawn comes before sunrise. Light colliding with dark makes the shade.
- The **ray** is not always there. It arrives "when something is going to happen" — that is where work is shown.
- Dawn is a **loop** (sun rises, sun sets): night shows the "nightminds", the rise shows the idea, daylight shows the clear idea. Dawn is the main moment. Details parked for ideation (§3).

### Ink bleed

- Its own separate workstream. A **TSL (three.js shading language)** screen effect that reads like ink or watercolor dispersing — **local to where it starts**, not flooding the whole page.
- Founder will supply reference images; the shader recreates them. What the page shows sits on top of it.

### Pages

| Route        | Purpose                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------ |
| `/`          | Landing                                                                                    |
| `/work`      | Projects: in-house, client, and ISM pieces that got built                                  |
| `/ism`       | ISM ideas and how kiruk ideates                                                            |
| `/framework` | Kiruk Framework — "researching, wait a moment"                                             |
| `/writing`   | Deep, researched articles: studio, design, engineering, craft, ISM process, collaborations |
| `/contact`   | Contact                                                                                    |

- **Nav:** logo (home) · Work · ISM · Writing · Contact. Framework is reached from the landing teaser and the footer.

### Landing — content order (no visuals decided yet)

1. Who kiruk is — art + code studio
2. Featured work — Desirable
3. A look at ISM
4. Framework teaser — "researching"
5. Latest writing
6. Contact

### Project kinds

- **In-house** — curated or experimental projects kiruk wants to try. Flagship: **Desirable** (customised products people desire; buyer configures, craftsmen bid, buyer picks). Ideas phase. Case study: <https://www.behance.net/gallery/238164813/Desirable>. Local repo: `~/KIRUKULAM/Desirable` (3D furniture configurator). No product registry entry until the founder decides (registry needs a proposal).
- **Client** — e.g. **Prags**: interactive music portfolio for Prakathiswar (Tamil cinema + independent music). Own repo, still in branding. **Noted only.** Shown on `/work` only after his written consent (build-in-public consent gate).
- **ISM** — curated by the founder. Each ISM takes one path: **micro app**, **collaboration**, or **progress / open process**.

### ISM flow

- Built ISMs (micro app, collaboration) **also** appear under `/work`.
- Every collaboration and every unbuilt idea gets a deep article on `/writing`, so people can understand it and use it if they want (with credit).

### Content model — one entry per piece, cross-linked

**Piece**

| Field      | Values / notes                                                |
| ---------- | ------------------------------------------------------------- |
| `title`    | string                                                        |
| `slug`     | string                                                        |
| `kind`     | `in-house` · `client` · `ism`                                 |
| `state`    | `idea` · `in-progress` · `shipped`                            |
| `path`     | ISM only: `micro-app` · `collab` · `open-process`             |
| `consent`  | client only, default `false` — hidden everywhere until `true` |
| `summary`  | one or two lines                                              |
| `links`    | external (Behance, GitHub, live URL)                          |
| `articles` | slugs of related writing                                      |

**Article** — the existing devlog contract (title, slug, date, state, tags, summary, eye-motif, scribble, derive) plus `pieces` (back-links) and an optional `label` (e.g. `earlier-direction`).

Rules:

- `/work` lists `kind ∈ {in-house, client (consent: true)}` **plus** `kind = ism` with `path ∈ {micro-app, collab}`.
- `/ism` lists every `kind = ism`.
- `collab` and `open-process` ISMs must link at least one article.
- No duplicate pages: a piece exists once and is listed wherever its kind/path says.
- The old devlog "scribble becomes the interface" stays published, labelled **earlier direction** (CLAUDE.md §2 — detours belong in the open).

### Framework page

- Status line: "researching, wait a moment".
- One line on what it is: it unlocks the other person's idea like a child would, frames it many ways, and brings it to life as a story.
- "Follow the research" → writing + GitHub.

### Contact

- Email: arunkumaar.srinivasan@gmail.com (a professional address may replace it later)
- GitHub: <https://github.com/kiruk-studio/KIRUK-STUDIOS> — the open-source creative studio repo; an open company where the process is transparent
- Instagram: <https://instagram.com/kirukism>
- No form in v1.

### Skills

- A curated kiruk skill is added **each time something gets curated**, after ideation — never ahead of the decision it records. Note: the emil skills in `.claude/skills/` + `.cursor/skills/` are **licensed, local-only, gitignored** — they are a pattern to learn from, not a place to commit. Where kiruk's own committed skills live is part of the ways-of-working proposal (`.agents/skills/` already holds `brand-thinking-capture`).

### Stack

- Not chosen yet. Order: IA → base layer → ideation → stack chosen from real needs (TSL for ink bleed is the one known requirement) → make it better.
- The bare Astro shell is a placeholder only and may be replaced.

### Ways of working (parallel research)

- The old flow was spec-driven (OpenSpec) with progress layered on top. The founder wants the newer design-engineer way: skills, docs and specs correlated; one skill per kind of task; skills that improve themselves over time.
- A separate session researches how top design engineers, creative technologists and native designer-developers structure this, compares it with OpenSpec 1.x (repo is on **0.11.0**, latest **1.14.3**), and returns a proposal for kiruk's way of working — including whether/how to upgrade OpenSpec. Runs alongside the IA work.

---

## 2. Phases

### Phase 0 — Snapshot + cut

**Done 2026-10-17.**

- Snapshot `a201273` — includes the previously untracked logo SVGs + `Logogram.astro`, and the about/devlog pages that were only ever staged.
- Cut `3cce46a` — cut list in §1 applied. Placeholder page: plain text, logogram (favicon cut), contact links.
- Verified: `pnpm --filter @kiruk/web build` and `check-types` pass (1 page, no React/three). `pnpm-lock.yaml` is updated on disk but **not committed** — it also carries unrelated in-flight forge changes; commit it with that work.

### Phase 1 — Information architecture

- Implement this doc's content model as Velite collections (pieces + articles), with the listing rules as tested functions.
- Stub the six routes as plain, unstyled HTML that renders real content: Desirable, the old devlog (earlier direction), framework status, contact.
- Done when every route renders, cross-links resolve, and the rules in §1 hold.

### Phase 2 — Base layer

- Design the clean layer: type, layout, grid, spacing, wireframe/diagram language. Generated or illustrated assets allowed here.
- Must stand alone (accessibility, mobile, reduced motion).
- Done when the site is complete and readable with no sketch layer and no ink bleed.

### Phase 3 — Ideation (in `ideas/studio-dawn/`)

- Dawn loop (night → dawn → day), the ray as reveal, palette.
- Ink bleed TSL prototype from founder references (`protos/`).
- Sketch layer: how strokes pin to base elements and scale; reveal/hide.
- How the eye links to everything.
- The parked two-zone idea (below).

### Phase 4 — Stack + spec

- Pick the stack from Phase 3 needs; revise `openspec/specs/tech-stack/spec.md`.
- Spec the dawn palette (design-tokens — no token without spec), brand-system changes, and mark the old sketch/grease-pencil requirements superseded.

### Phase 5 — Sketch layer + curated skills

- Founder's hand strokes land on the base layer.
- Each curated piece gets its skill.

---

## 3. Parked for ideation (not decided)

- **Both sides at once.** Not a toggle, scroll or split. Seed: ink bleed may leave two zones on one page — _light with dark ink_ (engineering, Da Vinci-style notes) and _dark with light stroke_ (design, pencil) — both present together, showing the engineering and design sides differently.
- **Dawn loop.** Seed: the loop may mirror the studio's own process — night = kirukal (raw scribble), dawn = possibility, day = something real (CLAUDE.md §2).
- **Eye link.** How the eye connects to the dawn, the layers, and the work.
- **Sketch layer reveal.** Always on, or visitor-controlled.

---

## 4. Round 4 — answered 2026-10-17 (all yes)

1. Snapshot first — done: `a201273` (snapshot), `3cce46a` (cut).
2. One page per piece — `/ism/<slug>` for ISM pieces, `/work/<slug>` for the rest. A built ISM is listed on `/work` but keeps its `/ism/` page.
3. RSS feed for writing at `/writing/rss.xml`.
4. New direction logged in `FOUNDER_DECISIONS.md` as superseding B3, B5, W1/W3.

---

## 5. Guards

- **Public repo.** `kiruk-studio/KIRUK-STUDIOS` is public: no other artists' reference images in git (`ideas/studio-dawn/references/` is gitignored), no private client material, Prags hidden until consent.
- No revenue figures in any public artifact (build-in-public).
- Eye-motif rule: the logogram carries the eye on every page until the eye language is redesigned.
- Licensed skills (emil, aiforui.dev) stay local — never commit them to this public repo.
- Stale repo text to fix once the direction is specced: CLAUDE.md §3 stack line and §6 `kiruk-web` description. (`apps/kiruk-web/README.md` was updated in the cut.)
