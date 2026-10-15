# ISM · Inktober series

> Status: **parked kirukal** (filed 2026-10-12, extended 2026-10-16). Notes, not specs. Nothing here is locked.
> Lives in `ideas/` on purpose: `kiruk-ism/` subfolders only spawn via `/kiruk-ism-new`, and products need a registry proposal. Promote from here when one earns it.

Source content for the ISM project. Reference for building pages, posts, or a site for the series.

## About the project

- **ISM** is a daily concept series from kiruk, run as part of **Inktober**.
- Each day introduces one new idea named "\_\_\_\_ism", sketched and journaled on a page, then posted to Instagram (story-sized captions).
- Each journal page is built **section by section**, with hand-drawn sketches and scribbles beside the text, so it reads like a real journal, not a block of text.

## Voice and caption rules

- Very few words. Captions must fit an Instagram story.
- No emoji.
- Human, first-person touch. Interesting, but never over-exaggerated.
- Don't repeat the same idea twice in one caption.
- Don't open every day the same way. Vary the structure from day to day.
- Each caption carries: a relatable hook, the ISM idea in one line, one question to the audience, and the series tag line.
- Concept names are written in caps inside quotes, e.g. "VIBEISM".
- Readable short lines. Casual, the author's own way of talking ("guys", "just", "honestly"), never corporate. (Source notes name this voice as Praveen's.)
- Every line must carry meaning. Slogan-only lines feel empty; ground them in a real moment.
- Hashtags: `#Inktober #<Name>ism #ISM #KirukStudio`.

## Journal page rules

- Built section by section. Each section is short: a small heading, 1 to 3 lines, and a doodle note.
- Short, simple, creative. Long paragraphs feel like "just a bunch of text."
- Personal voice ("I", real moments), not report language.
- Visual ideas welcome: comic-strip storyboards, sticker sheets, diagrams that can be redrawn by hand.
- Standard flow: idea → problem → why it happens → solution → how it works → impact → closing line.

## Concepts so far

| Day   | ISM       | One-line idea                                                                                     | Note                                               | Skill                  |
| ----- | --------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------- |
| —     | Rentism   | People can rent me for free, and I help if I really love the job or want to spend time with them. | [rentism.md](./rentism.md)                         | not yet (needs detail) |
| —     | Habitism  | Created as part of the series. Details to be added.                                               | [habitism.md](./habitism.md)                       | not yet (needs detail) |
| 7     | Vibeism   | A mirror for your values next to a company's values, so people find places where they'll stay.    | [day-07-vibeism.md](./day-07-vibeism.md)           | `/ism-vibeism`         |
| 8     | Inviteism | Turn a pitch into an invitation made for one specific person.                                     | [day-08-inviteism.md](./day-08-inviteism.md)       | `/ism-inviteism`       |
| 9     | Onceism   | See every story once, from the original source, with copies filtered out.                         | [day-09-onceism.md](./day-09-onceism.md)           | `/ism-onceism`         |
| 10–11 | Turtleism | Slow at the start, fast at the end: Askism, Answerism, Dissectism, Intersectism before building.  | [day-10-11-turtleism.md](./day-10-11-turtleism.md) | `/ism-turtleism`       |
| 12    | Edibilism | Food that isn't toxic: judge food before tasting, rate it honestly after eating.                  | [day-12-edibilism.md](./day-12-edibilism.md)       | `/ism-edibilism`       |
| 13–14 | Break     | Missed two days; returning with more thought per idea.                                            | [day-13-14-break.md](./day-13-14-break.md)         | —                      |

Series-wide skill: **`/ism-day`** drafts a new day (caption + journal page) under the rules above.

### Sub-isms

Turtleism carries four of its own: **Askism**, **Answerism**, **Dissectism**, **Intersectism** (the four parts of the shell). They live inside the Turtleism note, not as separate days.

## Skills

Each concept has a slash command in [`.claude/commands/`](../../.claude/commands/) (`ism-<name>.md`). A skill does three things:

1. **Explain** the ISM in one breath (what it is, what it is not).
2. **Apply** it as a method to whatever you hand it (a job offer, a pitch, a feed, a plan, a recipe).
3. **Draft** journal sections or caption variants in the series voice.

The day notes here are the source of truth. Skills read them; they never overrule them. Update the note first, then the skill if its summary drifted.

## Build later (when time opens up)

Not committed. Rough order by how buildable each one is today:

1. **Onceism** — clearest v1: Chrome extension, X only, text + links, all local, "×47 repeats hidden today" counter. Architecture sketched in the Day 9 note.
2. **Edibilism** — v1 is small and fun: virtual kitchen shelf, rules engine, edibility scale with a sarcastic line. No backend needed.
3. **Inviteism** — could start as a kiruk workflow (one-person invite page) before it is a tool. Overlaps with client outreach; keep it lab-led.
4. **Turtleism** — already lives as the `turtle` AI skill. The open question is whether it becomes a public artifact (page, template, tool) at all.
5. **Vibeism** — biggest scope (two-sided app, employee reality checks, retention data). Needs proof before code.

Before any of these turns into code:

- Scribble first (`scribble/` sketch or `scribble/textual.md` with a `reason:`) — pen-and-paper spec. The hand-drawn journal pages count once scanned into the repo.
- Decide the home: ISM lab (`/kiruk-ism-new <name>`, needs the name registered in `openspec/specs/ism/spec.md`) or product (`openspec/specs/products/registry.md` via proposal + founder approval).
- Eye-motif check on any visual surface.
