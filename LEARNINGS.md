# LEARNINGS — mistakes, near-misses, guards

**Append-only.** Add new **dated** sections at the **bottom**. Do not rewrite or delete past entries to hide a repeat; if the same failure class happens again, add **another** entry and **strengthen** the guard (spec scenario, script, rule, or checklist). This file is for **learning in motion**—including what did not work—so the journey stays honest, not a scoreboard of perfection. Victories and pivots that teach a guard belong here too when they are material.

## How to add an entry

Use this shape (markdown `##` heading + bullets):

```markdown
## YYYY-MM-DD — short title

- **Mistake:** what broke or almost broke.
- **Root cause:** why it happened (process, spec gap, missing check, etc.).
- **Fix:** what we did to correct it.
- **Guard:** what now stops a repeat (link to spec section, `npm run …`, `.cursor/rules/…`, PR checklist item, or habit).
```

**Material** = worth recording: anything that could hurt users, brand, security, or trust if it happened again—not every typo.

## Entries

## 2026-05-26 — Unlayered sketch CSS overrode Tailwind position utilities

- **Mistake:** The bottom `SketchNav` rendered pinned to the top of the page instead of fixed at the bottom. `position: relative` (and `bottom: 20px`) applied, but `fixed` silently lost.
- **Root cause:** Tailwind v4 puts utilities in `@layer utilities`. The ported sketch classes in `global.css` (`.sketch-border`, `.sketch-button`, etc.) are **unlayered**. Per CSS cascade-layer rules, unlayered declarations beat layered ones regardless of source order — so `.sketch-border { position: relative }` overrode the `fixed` utility on the same element.
- **Fix:** Decoupled positioning from decoration — an outer wrapper carries the Tailwind position utilities (`fixed bottom-5 left-1/2 -translate-x-1/2`), the inner element carries `.sketch-border`.
- **Guard:** Never combine a `.sketch-*` class that sets `position` with a Tailwind position/inset utility on the **same** element — wrap instead. When the sketch primitives graduate into `@kiruk/design-system`, wrap their global CSS in `@layer components { … }` so Tailwind utilities can override cleanly, and this whole class of conflict disappears.

## 2026-10-16 — Overwrote untracked ISM day notes from a truncated listing

- **Mistake:** While extending `ideas/ism-inktober/`, three existing day notes (Vibeism, Inviteism, Onceism) were rewritten without being read first. Nothing was lost — the rewrite was a superset — but only because the earlier session's transcript still held the old text.
- **Root cause:** A directory listing piped through `head -40` cut off before the day files, so they looked absent. They were also untracked, so git could not restore them.
- **Fix:** Pulled the previous versions out of the earlier session transcript, diffed line by line, restored the one dropped detail (back-link to the series README).
- **Guard:** Never decide a file is missing from a truncated listing; list the exact folder before writing. Untracked notes in `ideas/` have no git safety net — read before overwrite, and commit `ideas/` notes in the same session they are filed.
