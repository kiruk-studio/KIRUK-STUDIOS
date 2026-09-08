# `src/kiruk/` — first-party forge code

Everything kiruk authors inside the forge lives here.

**Hard rule: nothing in this folder may import from `src/toolcraft/**`.\*\*

`tsconfig.kiruk.json` checks this folder under the repo's strict base
(`noUncheckedIndexedAccess` and friends). The vendored kit does not satisfy those
flags and its files are hash-locked, so any import would surface errors that
cannot be fixed.

`src/app/app-composition.tsx` is the adapter that bridges the two: it may import
the kit, and it is typechecked by the kit's own locked `typecheck` script.

Keeping the real logic here — pure, kit-free — is also what lets the drawing
engine move into `@kiruk/kirukal` and ship to `kiruk-web` and `kiruk-portal`
unchanged.
