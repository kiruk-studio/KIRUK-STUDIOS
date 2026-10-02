# Founder Decisions — Kiruk

> Everything here is BLOCKED until you give direction.
> Fill in the `→ Your answer:` fields as ideas crystallize.
> Status: `[ ]` needs input · `[~]` rough thoughts written · `[x]` locked, build can proceed.
>
> **Rule:** No Phase starts without all its `[x]` boxes. Rough is fine. "I'll know it when I see it" is not enough — write at least a direction.

---

## How to use this

1. Read a section. Write your raw thought in `→ Your answer:` — messy is fine.
2. Change `[ ]` → `[~]` when you have rough thoughts.
3. Change `[~]` → `[x]` when you're confident enough to build against it.
4. Locked decisions move to the relevant spec when they're strong enough.

---

## STRATEGY — locked 2026-05-18 (governs all downstream phases)

### ST1 — Studio model

`[x]` **Lab-led, services follow.** ISM + in-house products are the front door. Client services chase the work, not the other way around. Encoded in VISION-MISSION + `openspec/specs/products/spec.md`.

### ST2 — Transparency

`[x]` **Process + decisions public; numbers + client internals private.** Devlogs, sketches, dead ends, code, specs all open. Revenue, MRR, contracts, customer data closed. Story drops (quarterly, qualitative) are the only public revenue surface. Encoded in `openspec/specs/build-in-public/spec.md`.

### ST3 — In-house product types (allowed surface)

`[x]` Creative tools for makers · consumer micro-apps / toys · AI-augmented creative SaaS · browser extensions · any digital surface. Each product picks one tier at creation: `tool` | `micro-app` | `extension` | `saas` | `toy`. Encoded in `openspec/specs/products/spec.md`.

### ST4 — Automation focus (all four streams active)

`[x]` Content pipeline (devlog → social), client lifecycle (intake → invoice), idea capture + promotion, brand consistency CI. All four governed by their own specs. Implementation choice pending (see AU1, AU2 below).

### ST5 — Hybrid repository strategy
`[x]` **Locked 2026-08-20.** `KIRUK-STUDIOS` remains the core monorepo under the `kiruk-studio` GitHub organization. Shared apps, packages, design system, specifications, content, studio automation, early ISM experiments, and incubating products stay in this monorepo. Mature products may graduate into independent repositories under `kiruk-studio`. Extraction should happen when **at least two** of the following apply: customers, billing, authentication, or user data; independent secrets or permissions; independent deployments or releases; substantially different technology stack; external collaborators; large assets or Git history; distinct product identity and roadmap. Suggested future names: `product-<slug>`, `extension-<slug>`, `experiment-<slug>`, `creative-os`. Do **not** create empty product repositories prematurely. ISM→product graduation inside the monorepo remains governed by `openspec/specs/products/spec.md`; this decision covers GitHub-repo extraction only.

---

## BRAND — blocks Phase 3 + all visual work

### B1 — Primary eye mark: final design?

`[~]`
EyePrimary SVG exists as a geometric placeholder (circle + iris + pupil). Is that the actual kiruk logo, or is the real logo still undesigned?

- If placeholder → what does the real one feel like? (rough sketch, reference, or description)
- If real → confirm it's locked.

→ **Your answer (2026-05-26):** Real logo **still undesigned**. Keep a placeholder for now; decide later. Do **not** block visual work on it.

---

### B2 — Wordmark: does "kiruk" have a custom text treatment?

`[~]`
Options: (a) just the Inter/Playfair type from tokens, (b) custom letterform, (c) all-lowercase vs mixed, (d) symbol only (no text wordmark).

→ **Your answer (2026-05-26):** (b) **Custom letterform** — a bespoke, hand-inked one-off "kiruk", not a font. The current Bridges Not Walls render is a placeholder until the custom mark is drawn. (Needs a scribble/asset.)

---

### B3 — Palette: do the current token colors feel right?

`[x]`
Current:
| Token | Hex | Role |
|---|---|---|
| `void` | `#0a0a0b` | background |
| `scribble-ink` | `#f2f0eb` | foreground |
| `iris-core` | `#ff4d2e` | primary accent |
| `portal-glow` | `#7b2fff` | secondary accent |
| `halo-warm` | `#ffb84d` | tertiary warm |
| `paper` | `#1a1a1f` | surface |
| `kohl` | `#2a2a35` | elevated surface |
| `gaze-dim` | `#6b6b80` | muted text |

Do these feel like kiruk? What's missing or off?

→ **Your answer (2026-05-26):** Drop the dark "void" palette. **Base = white paper background + black pen/pencil stroke.** Plus **absurd, bold color reserved for ASSETS** (illustrations / scattered objects) — the color is what "blends the digital and the paper." So: monochrome line-work world, punctuated by absurd-colored objects. Status `[x]` for direction (token spec update pending).

---

### B4 — Typography: Inter + Playfair locked?

`[x]`
Current pairing:

- Rational (UI/body): **Inter**
- Expressive (headings/manifesto): **Playfair Display**
- Mono: JetBrains Mono

Does this feel right? Or are you circling other options (e.g. different expressive face, variable font, something weirder)?

→ **Your answer (2026-05-26):** **Hybrid.** Hand fonts for wordmark / display / accents (Bridges Not Walls, Magnetic Drawing, Left Hand — ported from kiruk.in), but a **clean legible sans for long body text** (manifesto, devlogs, case-study prose) so readability survives. Playfair dropped; Inter (or similar) = the clean body face.

---

### B5 — Brand application: dark only, light, or adaptive?

`[x]`
Web + all brand artifacts — do they default dark? Support light mode? Or is kiruk always dark?

→ **Your answer (2026-05-26):** **Light only.** Always white paper + black stroke. No dark mode.

---

## WEBSITE (kiruk-web) — blocks Phase 3

### W1 — Homepage feeling

`[~]`
Not layout yet — the _feeling_. What happens when someone lands on kiruk.studio?

→ **Your answer (2026-05-26):** **A product designer's desk + drawing table, POV, realistic and interactive.** The visitor sits where Arun sits — first-person. The cursor drives **2.5D POV hands**: a hand that follows the mouse, articulated finger → hand → elbow → arm (extending up toward the top). **Two hands on the desk** — the **left hand** moves/acts when you operate on the left side, the **right hand** when on the right; both animate based on the activity (drawing, picking up an object, etc.). Goal: it feels like you ARE the designer at the desk, sketching. This replaces the abstract "ink/scribble field" hero.

> Build note: the prior cross-hatch field read like **smoke**, not pencil — to be reworked into real **stamped pencil strokes** along the pen path, and folded into this desk/hands concept. Big creative-technologist build; phase it.

---

### W2 — Navigation: final routes?

`[~]`
Current plan: `/` · `/kirukism` · `/ism` · `/services` · `/about` · `/devlog`

Add, remove, rename — what should someone be able to navigate to?

→ **Your answer (2026-05-26):** **Desk objects ARE the nav** — spatial, not a bar. Objects on the desk map to destinations (e.g. sketchbook → work/case-studies, jar/box → products, sticky note → about, etc.). Destination set ≈ current studio routes (home · kirukism · ism · products · services · about · devlog); exact object↔route mapping TBD.

---

### W3 — Homepage hero: what's in it?

`[~]`
After you answer W1, describe what's actually on screen above the fold:

→ **Your answer (2026-05-26):** **Cluttered designer desk** (maximal). On screen: sketchbook, pens, coffee ring, sticky notes, scattered sketches, the eye — and the POV hands (W1). Objects double as navigation (W2). Copy/CTA woven into the scene (e.g. manifesto link, "leave a note" contact per W5) rather than a clean headline block.

---

### W4 — Devlog format

`[~]`

- Text only (MDX markdown)
- Short video + transcript
- Both
- Something else entirely

And cadence: every 2 weeks was the plan. Still right?

→ **Your answer (2026-05-26):** **Looser cadence** — publish when there's something real, no fixed 14-day rule. Format not locked (default text + sketch scans). ⚠️ **Conflict:** `build-in-public` spec mandates ≥1 devlog/14 days and `scripts/doctor.mjs` warns/fails on it — both must be relaxed via an OpenSpec proposal to match this.

---

### W5 — "Work with kiruk" CTA flow

`[x]`
Someone wants to hire kiruk. What happens?

→ **Your answer (2026-05-26):** **Leave a note on the desk.** Visitor writes / drops a sticky note onto the desk; that note becomes the contact message → routes to Arun's inbox. On-brand with the desk metaphor. (Backend: note → email/store, built later.)

---

### W6 — About page: who's on it?

`[x]`
Options:

- Just Arun
- Arun + kirukan (when they join)
- Arun + kirukargals credited by project
- Studio story + people

→ **Your answer (2026-05-26):** **Just Arun** for now. Add kirukan / kirukargals when they actually join.

---

### W7 — Domain / deploy timing

`[x]`
Do you own kiruk.studio already? Or still need to register?
When does the site need to be live? (No pressure — just helps prioritize.)

→ **Your answer (2026-05-26):** Ship under **`kiruk.in/studio`** (a path on the existing kiruk.in domain) for now; buy a dedicated domain later. Build note: Astro needs `site: 'https://kiruk.in'` + `base: '/studio'` config, and all internal links must respect the base path.

---

## ISM LAB — blocks Phase 5

### I1 — Which ISM experiment first?

`[ ]`
Registry: **heroism · kirukism-series · colorism · nomadism**

Which one is calling you? Or is it none of these — a new name?

→ **Your answer (2026-05-26):** **Undecided** — more ideas than the listed four, none locked yet. Park until chosen.

---

### I2 — ISM #1 concept

`[ ]`
Once you pick the name — what's the actual concept/world?

- What's the medium? (web experience, physical object, video, interactive, mixed)
- What's the idea in one sentence?
- What makes it kirukal (weird/not-before-seen)?

→ **Your answer (2026-05-26):** Pending — depends on I1 (name not chosen).

---

### I3 — ISM publishing format

`[x]`
When ISM #1 ships, what does "shipped" look like?

- Standalone URL?
- Page on kiruk.studio/ism/name?
- GitHub repo + live demo?
- Something else?

→ **Your answer (2026-05-26):** **Page on the studio site** — `kiruk.in/studio/ism/<name>`. Each shipped ISM lives inside the studio site as its own experience.

---

## SOCIAL — blocks Phase 5

### S1 — Which platforms are active?

`[x]`
Where is @kirukism active or wants to be?

→ **Your answer (2026-05-26):** **All of them** — Instagram, LinkedIn, Twitter/X, YouTube (+ Threads etc.).

---

### S2 — Content format per platform

`[~]`
Devlog exists as text in the repo. How does it translate to social?

→ **Your answer (2026-05-26):** **Full production** — polished, designed posts per platform. ⚠️ Tension: high gloss × all-platforms × solo founder is heavy; the `content-pipeline` (devlog → derivatives) becomes a drafting aid, not the final output. Sustainability to watch.

---

## CLIENT PORTAL — blocks Phase 4

### P1 — Who uses the portal?

`[x]`

- Arun only
- Arun + kirukan (team access)
- Clients get a read-only view of their universe?
- Other

→ **Your answer (2026-05-26):** **Arun manages + clients get a read-only view** of their own universe (status, docs, shipped links). kirukan/team access added later.

---

### P2 — Auth approach

`[x]`

- No auth (local dev only, never deployed publicly)
- Magic link (simple, email-based)
- Clerk (fast, full-featured)
- NextAuth with GitHub
- Other

→ **Your answer (2026-05-26):** **Better-Auth** (the locked-stack pick; NextAuth is forbidden in new code). Supports magic-link / OAuth for the client read-view.

---

### P3 — "Universe done" — what does it look like?

`[x]`
In the portal, when a client universe is complete, what does the record show?

- Which docs were generated (proposal, invoice, etc.)
- Spec link
- Shipped URL / artifact
- Archive state

How does this differ from an active vs archived universe?

→ **Your answer (2026-05-26):** **Full record** — generated docs (proposal / contract / invoice), spec link, shipped URL/artifact, archive state, with active vs archived clearly flagged.

---

## META — how kiruk talks about itself

### M1 — Kirukism tagline / one-liner

`[x]`
If someone asks "what is kiruk?" in one sentence — what's the answer?
(Not the long vision. The punchy line that goes on the website, bio, cold intro.)

→ **Your answer (2026-05-26):** **The core meaning (founder, Tamil):** "kiruk" means **scribble** AND **crazy** in Tamil. So kiruk = _I back crazy ideas and start everything from a scribble._ That dual meaning IS the reason kiruk exists. Punchy line to be drawn from this (e.g. "kiruk — Tamil for scribble & crazy: we back crazy ideas, starting from a scribble").

---

### M2 — Kirukargal definition (public-facing)

`[x]`
How does kiruk publicly describe what a kirukargal is?
The current internal def: "external collaborators who believe in kirukism."
What's the public language — inviting, specific, weird enough to filter?

→ **Your answer (2026-05-26):** **"The rebellious, weird, polymath minds who co-create kiruk universes."** Filters for the right people.

---

## PRODUCTS — blocks Phase 3.5

### PR1 — First product: name, tier, what it does

`[ ]`
The studio is lab-led; a first product launch is part of the front-door story. Pick ONE to start. Tier choices: `tool` (creative tool for makers) · `micro-app` (consumer utility) · `extension` (browser extension) · `saas` (subscription) · `toy` (delight-first interactive).

Rough thoughts welcome — slug, name, one-line concept, tier, target audience.

→ **Your answer (2026-05-26):** **Undecided** — ideas brewing, none locked. Park PR1/PR2/PR3 until chosen. (The desk/hands tech itself could later graduate into a `toy`/`tool` product.)

---

### PR2 — Deploy target for first product

`[ ]`
Once PR1 is named — where does it live?

- Standalone web: Vercel / Netlify / Cloudflare Pages
- Browser extension: Chrome Web Store / Firefox Add-ons
- Mobile: iOS / Android / web-app-with-install
- CLI / npm package
- Other

→ **Your answer (2026-05-26):** Pending — depends on PR1.

---

### PR3 — Success metric for first product

`[ ]`
One measurable thing that tells you the product is working. Examples: "100 weekly active users in 90 days", "10 paid subscribers in 6 months", "1000 downloads", "qualitative: 5 strangers reach out unprompted". One sentence is enough.

→ **Your answer (2026-05-26):** Pending — depends on PR1.

---

## AUTOMATION — blocks Phase 4.5

### AU1 — Content pipeline implementation

`[ ]`
Spec is locked (`openspec/specs/content-pipeline/spec.md`). Pick the runner:

- Custom Node script in `scripts/generate-derivatives.mjs` (most control, you maintain it)
- n8n self-hosted (visual workflow, more flexible, more setup)
- GitHub Actions workflow (free CI, less interactive)
- Other / hybrid

→ **Your answer (2026-05-26):** **Park it** — not building content automation yet. Revisit after the site.

---

### AU2 — Brand-CI runner

`[x]`
Spec is locked (`openspec/specs/brand-consistency-ci/spec.md`). Pick the runner:

- GitHub Actions (runs on every PR, blocks merge)
- Husky pre-commit hooks (runs locally before each commit)
- Custom node script run manually + by CI
- Both Husky (local) + Actions (PR gate)

→ **Your answer (2026-05-26):** **Both** — Husky pre-commit (local) + GitHub Actions (PR gate). Catch early, block merge.

---

## Locked decisions (archive)

| Date       | Section  | Decision                                                                                                    |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-05-18 | ST1      | Lab-led, services follow                                                                                    |
| 2026-05-18 | ST2      | Process + decisions transparent; numbers + client internals private                                         |
| 2026-05-18 | ST3      | Product surface: tools, micro-apps, extensions, SaaS, toys (5 tiers)                                        |
| 2026-05-18 | ST4      | All four automation streams active                                                                          |
| 2026-05-26 | core     | Identity unchanged — creative studio (scribbles → worlds), lab-led                                          |
| 2026-05-26 | B3       | White paper + black stroke; absurd color reserved for assets (blend digital ↔ paper)                        |
| 2026-05-26 | B4       | Hand fonts for display/accents + clean sans for body (Playfair dropped)                                     |
| 2026-05-26 | B5       | Light only (no dark mode)                                                                                   |
| 2026-05-26 | W1/W3    | Homepage = POV product-designer's desk, 2.5D interactive hands (L/R react to side+activity); cluttered desk |
| 2026-05-26 | W2       | Desk objects are the nav (spatial)                                                                          |
| 2026-05-26 | W5       | "Leave a note on the desk" → contact                                                                        |
| 2026-05-26 | W6       | About = just Arun for now                                                                                   |
| 2026-05-26 | W7       | Ship under kiruk.in/studio; dedicated domain later                                                          |
| 2026-05-26 | I3       | ISMs ship as pages on the studio site (/studio/ism/<name>)                                                  |
| 2026-05-26 | S1/S2    | Active on all platforms; full-production content                                                            |
| 2026-05-26 | P1/P2/P3 | Portal: Arun + client read-view · Better-Auth · full done-record                                            |
| 2026-05-26 | M1/M2    | Core = Tamil scribble+crazy; kirukargal = rebellious weird polymath minds                                   |
| 2026-05-26 | AU2      | Brand-CI: Husky (local) + GitHub Actions (PR gate)                                                          |

---

## Spec impacts to action (from 2026-05-26 answers)

These answers conflict with or change locked specs — route via OpenSpec proposals (explore-now, spec-after):

1. **Palette/brand (B3, B4, B5):** `design-tokens` + `brand-system` specs still describe the dark "void" palette + Inter/Playfair. Propose: white-paper/black-stroke mono base, absurd-color assets, hand+sans type, light-only.
2. **Devlog cadence (W4):** `build-in-public` spec mandates ≥1 devlog/14 days and `scripts/doctor.mjs` enforces it. Propose: relax to "publish when real."
3. **Deploy path (W7):** Astro config needs `site: 'https://kiruk.in'` + `base: '/studio'`; the `tech-stack`/deploy notes assume kiruk.studio root.
4. **Eye-motif (B1 undesigned):** brand-consistency-ci's eye-motif gate must tolerate a placeholder mark until the real logo + custom wordmark (B2) are drawn.

## Reminder prompts

**Still open `[ ]`:** I1+I2 (which ISM, concept), PR1–PR3 (first product), AU1 (content-pipeline runner).
**Conceptual `[~]` needing design:** B1 (eye mark), B2 (custom wordmark asset), W1/W2/W3 (desk/hands build), W4 (devlog format), M1 (final punchy line wording).
