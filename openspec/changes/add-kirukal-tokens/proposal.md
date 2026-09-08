# Proposal: add-kirukal-tokens

## Why

`@kiruk/kirukal` is the hand-drawn component library: Base UI supplies structure and accessibility, kiruk supplies a surface drawn on a graphics tablet and replayed from captured pen data. It needs tokens the repo does not have, and non-negotiable #5 says no token ships without a matching requirement.

Four groups are missing, and each exists to enforce a rendering law that the research made non-negotiable:

- **Breakpoints.** There are no breakpoint tokens anywhere, and only 11 `md:` usages repo-wide. `md` must be **pinned to 768px** because Toolcraft's `useIsMobile()` hardcodes `MOBILE_BREAKPOINT = 768`; if the token and the runtime disagree, the shell and the kit will disagree about what "mobile" means at the same pixel.
- **Stroke.** Stroke width must be **absolute px**, never relative units. A hand-drawn frame at 2× is not a 2×-thick pencil line — it is the same pencil over a longer distance. Relative units are the single fastest way to make a drawn system look like a zoomed image.
- **Touch target.** Toolcraft is desktop-first; the forge must be usable with a stylus on a tablet.
- **Asset ids.** Which drawn mark a component binds to is a design decision and belongs in the spec-governed token layer. Variant _counts_ remain generated data, so adding a redraw is an asset-only commit.

The `brand-consistency-ci` eye-motif gate also needs widening: it greps for an `Eye*` import whose source is `@kiruk/design-system`, and it scans a fixed set of globs that excludes `packages/kirukal/**`. Both would make every new drawn component fail the gate. Because the check matches the import **source**, re-exporting through the old package would not satisfy it.

## What changes

### Modified capability — `design-tokens`

- **Added** _Breakpoint tokens_ — five steps, `md` pinned to 768px with a stated coupling to the forge.
- **Added** _Stroke tokens are absolute_ — `stroke.*` in px; relative units rejected.
- **Added** _Touch target minimum_ — `dimension.touch.min` = 44px.
- **Added** _Drawn asset tokens_ — `tokens/assets.json`, `$type: "asset"`, values are mark ids that must resolve in the kirukal manifest.

### Modified capability — `brand-consistency-ci`

- **Modified** _Eye-motif coverage check_ — accept `@kiruk/kirukal` alongside `@kiruk/design-system`, and add `packages/kirukal/**/*.tsx` to the scanned globs.

### Modified code

- `packages/design-system/tokens/core.json` — `breakpoint`, `stroke`, `dimension.touch` groups.
- `packages/design-system/tokens/assets.json` — new file.
- `packages/design-system/style-dictionary.config.cjs` — register the `asset` type.

## Impact

- **Specs touched:** `design-tokens` (4 added), `brand-consistency-ci` (1 modified).
- **Artifacts to regenerate:** `packages/design-system/build/**` via `pnpm tokens:build`.
- **Risk:** pinning `md` to 768 couples a token to a vendored constant. Recorded in the requirement so a future change to either side is a coordinated one.
- **Downstream:** unblocks `@kiruk/kirukal` and the responsive forge shell.

## Deltas

See `./specs/design-tokens/spec.md` and `./specs/brand-consistency-ci/spec.md`.
