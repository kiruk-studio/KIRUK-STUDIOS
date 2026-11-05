# Proposal: adopt-next-studio

## Why

`studio.kiruk.in` already serves `apps/kiruk-studio`, a Next.js 15 + React 19 app, and it got there by hand deploys to the Vercel project `kiruk-web`. The locked stack still says the public studio is `apps/kiruk-web` on Astro 5, and that project's Git build still builds the Astro placeholder. So every push builds the wrong app, and the live site only changes when someone deploys by hand.

The studio moved for a reason, but no OpenSpec change recorded it:

- **2026-10-17:** `apps/kiruk-web` was cut to a one-page Astro placeholder for the studio-dawn rebuild (`ideas/studio-dawn/plan.md`, "may be replaced").
- **2026-10-26:** `apps/kiruk-studio` started as a Next app so it could reuse the eye and the opening from kiruk.in, which is Next (`ideas/private-craft-bridge/README.md` asked for "a Next surface later, after an OpenSpec change").
- **2026-11-05:** the burin engine, the engraved eye, the ink opening and the hand were built there; R3F and postprocessing left the studio (`claude/dazzling-fermi-ljfylh`).

The studio is no longer content-first. It is one live instrument (an engraving engine, a worker-painted hand, a loader that draws), and the eye it shares with kiruk.in is React. Astro's zero-JS advantage does not apply to a page whose point is the running engine.

## What changes

### Modified capability: `tech-stack`

- **Added** _The public studio is apps/kiruk-studio on Next.js 15_.
- **Removed** _kiruk-web public origin_ (its host rules move into the added requirement).
- **Modified** _kiruk-web uses Astro 5_: `apps/kiruk-web` stays Astro but is a retired placeholder, not the public studio.
- **Modified** _3D / WebGL = Three.js r170+ + React Three Fiber 9 + TSL_: engine surfaces MAY use `three/webgpu` + TSL directly, without R3F.

### Modified docs (on apply)

- `CLAUDE.md` §3 headline stack and §6 repo orientation.
- `ideas/private-craft-bridge/README.md` line "apps/kiruk-web for now".

### Operations (founder, outside the repo)

- Vercel project `kiruk-web` → Root Directory `apps/kiruk-studio`, Framework Next.js. Then pushes build studio previews and `main` deploys studio.kiruk.in.

## Impact

- **Specs touched:** `tech-stack` (1 added, 1 removed, 2 modified).
- **Code:** none; `apps/kiruk-studio/vercel.json` already exists.
- **Risk:** the Vercel switch replaces the Astro placeholder at the same project; roll back by setting the Root Directory back to `apps/kiruk-web`.
- **Perf:** the home route's first-load JS is 158 kB (`next build`, 2026-11-05). The performance-budget requirement applies to it as to any route.

## Deltas

See `./specs/tech-stack/spec.md`.
