# protos

Throwaway experiments for the studio rebuild. One folder per prototype (e.g. `ink-bleed/`), each a standalone `index.html` that opens on its own.

- No imports from `apps/` or `packages/` — a prototype must not lock the stack (plan Phase 4 picks it).
- Pin every CDN dependency to an exact version.
- Add a short `NOTES.md` per prototype: what it tried, what worked, what didn't. Failed prototypes stay — honest iteration.
