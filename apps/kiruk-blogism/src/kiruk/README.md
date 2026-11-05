# `src/kiruk/` — first-party BLOGISM code

Everything kiruk authors inside BLOGISM lives here: InkDocument, tablet sampling,
SVG export, and the kiruk.in MDX/path contract.

**Hard rule: nothing in this folder may import from `src/toolcraft/**`.\*\*

`tsconfig.kiruk.json` checks this folder under the repo's strict base.
`src/app/*` is the thin adapter that may import the Toolcraft kit.
