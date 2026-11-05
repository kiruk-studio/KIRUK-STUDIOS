# type-specimen — notes

**Tried:** five light-side faces (Courier Prime, IBM Plex Mono, Special Elite, Cutive Mono, Varela Round) at four ink stages — crisp, rough, bleed, smear — after the founder's INKREDIBLE reference; body paragraphs crisp vs rough; a thin dawn horizon; two dark-side monos (JetBrains Mono, Geist Mono) on a hairline wireframe grid.

**How the bleed works here:** static SVG filters (`feTurbulence` → `feDisplacementMap` for rough edges, plus a blurred halo for bleed, plus an anisotropic blur for smear). No JS. Display type only — body stays crisp for reading. The live, spreading bleed is the separate TSL workstream (`../../ink-bleed.md`).

**Colours:** sampled from the founder's dawn references (`../../references/`, gitignored). Exploration values, not tokens — they need a `design-tokens` spec before ship.

**Caveat:** fonts load from Google Fonts, which can't be version-pinned. Fine for a throwaway proto; the real site self-hosts.

**Worked / didn't:** _founder's verdict goes here._
