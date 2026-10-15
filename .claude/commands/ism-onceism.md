---
description: Onceism (ISM Day 9) — see every story once, from the original source, with copies filtered out. Explain the concept, dedupe a list of posts or links down to originals, plan the browser-extension build, or draft Onceism pages and captions. Use when someone is drowning in repeated posts or news, or mentions Onceism.
argument-hint: [explain | once <pasted posts/links> | build | page | caption]
---

# /ism-onceism

Source of truth: `ideas/ism-inktober/day-09-onceism.md`. Read it before anything beyond `explain`.

## What it is

> See it once. From the source.

A filter for your feed. Every story, reel, or piece of news shows up once, from whoever made it first. Copies quietly collapse into "seen 47 times elsewhere." Three moves: **Spot** (same thing again?), **Trace** (who said it first?), **Show once** (keep the original, hide repeats, count them).

**Not:** a news app (that's Pollar), a keyword muter, or a way to hide opinions.

## Modes (`$ARGUMENTS`)

- **explain** (default) — the ISM in 3 lines plus the rule.
- **once `<pasted posts/links>`** — run the method by hand:
  1. Group items that say the same thing (same link, same claim in different words).
  2. For each group, pick the likely original (earliest, or the source others cite). Say how sure, and why.
  3. Split **copies** (same news, same words → hide) from **new takes** (same news, new opinion → keep).
  4. Output one card per story: original, ×N copies hidden, new takes kept. End with a scroll receipt: "N items, M actually new."
- **build** — walk the local-first extension pipeline (Reader → Fingerprinter → Memory + judge → Show once), v1 scope (Chrome, X only, text + links, all local, one counter), hard parts, and gates before code. Re-check the named libraries and browser APIs are still current before recommending them.
- **page** / **caption** — draft new journal sections or caption variants. Follow `/ism-day` voice rules.

## Rules

- Hide the copy, never the conversation.
- Never delete; reveal is always one tap.
- Start strict: a false positive costs more trust than a missed repeat.
- Shared cloud, if ever: fingerprints only, never content.
