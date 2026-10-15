---
ism: onceism
day: 9
status: parked-kirukal
skill: /ism-onceism
scribble: journal page not yet scanned into repo
---

# Day 9 · Onceism

Part of [ISM · Inktober](./README.md).

> See it once. From the source.

## In one breath

A filter for your feed. Every story, reel, or piece of news shows up once, from whoever made it first. The copies quietly disappear.

**What it is not:** a news app (that's Pollar), a keyword muter, or a way to hide opinions you don't like.

## Final caption

> Fifty posts about one AI launch this week. Different faces, same words.
>
> "ONCEISM": see every story once, from whoever made it first. The copies quietly disappear.
>
> How much of today's scroll was actually new to you?
>
> Inktober, day 9. ISM project by Kiruk Studio.

Hashtags: `#Inktober #Onceism #ISM #KirukStudio`

## Concept

Feeds on Instagram, X, and news sites run in loops. One launch gets reposted for two weeks until the buzz fades, originality gets buried, and people go from loving a thing to being irritated by it. Onceism is a browser plugin (a micro app) that tracks repeated content and shows each piece once, from the original source.

## Journal page

**Day 9 · Onceism**
_See it once. From the source._

**The problem**
Every feed runs in loops. One launch, one headline, one reel, reposted by a hundred accounts for two weeks. The original gets buried under copies, and we end up tired of things we only needed to see once.

**The idea**
Onceism is a filter for your feed. Every story, reel, or piece of news shows up once, from the person who made it first. Every copy after that quietly disappears.

**How it works: three simple moves**

- **Spot:** notice when a new post says the same thing as something already seen.
- **Trace:** find who said it first.
- **Show once:** keep the original, hide the repeats, and say "seen 47 times elsewhere."

**What it should make you feel**
"My feed respects my time." Less noise, more new things, and credit going back to the people who made them.

**The rule**
Hide the copy, never the conversation. New opinions on old news still get through.

**Closing line**
_"Some things are worth seeing twice. Most aren't."_

**Main sketch:** a funnel. Top: a messy pile of identical posts. Bottom: one clean card with an "original" stamp. Beside it, a tally counter: "×47 hidden."

## Extra sections

**Before / After**
Before: same headline, 12 times in one scroll.
After: one card, one source, one small counter.
Doodle: two phone screens side by side, one crowded, one clean.

**Copy vs. new take**
Same news, same words = hide it.
Same news, new opinion = let it through.
Doodle: two speech bubbles, one crossed out, one with a tiny lightbulb.

**My scroll receipt**
Today I scrolled 300 posts. Maybe 40 were actually new.
Doodle: a long receipt with "repeats: 260" circled in red.

**Credit goes home**
The person who made it first deserves the views, not the 50 accounts that reposted it.
Doodle: a small crown on the original card.

**How it works, in one line**
Read the post → turn it into a code → check my memory → show it once.
Doodle: four tiny hand-drawn boxes with arrows.

**Not Pollar**
Pollar is a place you go to read news. Onceism comes to the feed you already scroll.
Doodle: a house labeled "Pollar" and a small backpack labeled "Onceism."

**Still thinking about**
Who decides what's "the original"?
What if it hides something I actually needed?
Doodle: question marks scribbled in the margin.

**Version 1**
X only. Text and links only. One counter.
Doodle: a seedling in a pot labeled "v1."

## How it helps my brain

1. **Repeats feel true, even when they aren't.** The illusory truth effect: the more often you see a claim, the more believable it feels. Seeing it once lets me judge it. _Doodle: the same headline stamped 10 times, each stamp bolder._
2. **My head has limited shelf space.** Working memory holds only a few things; repeats take slots new things could use. _Doodle: a shelf with five boxes, four labeled "same thing."_
3. **Repeats put me on autopilot.** The brain stops noticing what it's seen before; new things wake it up. _Doodle: a sleepy face on repeats, a wide-eyed face on the new post._
4. **Less loop, less stress.** The same worrying news, seen again and again, feels bigger and closer than it is. _Doodle: a spiral turning into a straight arrow._
5. **Time comes back.** Every hidden repeat returns a few seconds, which add up over a week. _Doodle: an hourglass with "+ minutes."_

Summary line: _Seeing it once keeps me thinking. Seeing it fifty times just makes me tired._

## Why I made this

1. **I was tired of my own feed.** One AI launch filled my timeline for two weeks. By day three I'd stopped learning anything. _Doodle: a tired face under a pile of identical posts._
2. **The original gets buried.** A hundred copies push the real work out of sight. _Doodle: a small card at the bottom of a tall stack, a tiny crown peeking out._
3. **I wanted to feel curious again, not irritated.** _Doodle: a heart turning into an angry scribble as copies pile up._
4. **My time is worth more than reruns.** _Doodle: a clock with "repeat" chunks cut away._
5. **I want my feed to work for me.** _Doodle: a hand holding a leash, with the phone on the other end._

## Closing piece

_We used to wait for news. Now it waits for us, again and again, until it stops meaning anything._

_I don't want to know less. I just want to see things once, with fresh eyes, the way they were first made._

_Because what matters isn't how many times something reaches you. It's whether it still makes you feel something when it does._

Short version:
_Seen once, it's news._
_Seen fifty times, it's noise._
_I want to feel the first time again._

## Technical architecture (browser extension, local-first)

Pipeline: **Your feed** → **Reader** → **Fingerprinter** → **Memory + judge** → **Show once**, with an optional **Shared cloud** (hashes only) connected to Memory later.

1. **Reader:** a content script watches the page as you scroll and pulls each post's text, image, link, author, and time. One adapter per site, since layouts differ.
2. **Fingerprinter:**
   - Text: sentence embeddings in the browser (Transformers.js with all-MiniLM-L6-v2, 384 dimensions). Run heavy inference in an offscreen document, since WebGPU isn't available in the extension service worker.
   - Images: Meta's PDQ perceptual hash (256-bit), which has a WebAssembly build for in-browser hashing.
   - Links: canonicalized URLs for instant matching.
   - Video: full video hashing (TMK+PDQF, vPDQ) is too heavy for v1; use thumbnail PDQ + caption text.
3. **Memory + judge:** store fingerprints in IndexedDB for about two weeks. Match on same link, close image hash, or high embedding similarity. Optional second check with Chrome's on-device Prompt API (Gemini Nano): "does this post add anything new?"
4. **Show once:** collapse repeats into one line ("Seen 23 times, show original"). Never delete; always allow reveal.
5. **Shared cloud (later):** users share fingerprints only, never content, so a server can find the true global first-seen original.

**Hard parts:**

- Site layouts change often and break adapters.
- Video hashing is heavy.
- Chrome's on-device AI needs significant free disk space, so the "adds anything new?" check should be optional.
- False positives hurt trust; start strict.

**Gap vs. existing tools:** current X filter extensions hide by post type (reposts, quotes, replies) or by keyword. None detect that two different posts say the same thing.

**Pollar vs. Onceism:** Pollar is a separate news app that condenses news into source-linked summaries. Onceism is a plugin that cleans the feeds you already use.

## Where to implement

- **Start:** X on desktop (text-heavy, repetitive during hype cycles, early-adopter audience).
- **Next:** LinkedIn, Reddit, Google News and news sites, YouTube home page.
- **Then:** newsletters in Gmail, RSS readers (Feedly, Inoreader), Slack and Discord.
- **Hard:** Instagram and TikTok mobile apps (extensions can't reach inside apps; Safari web extensions only work on websites).
- **Paying niches:** traders and investors, researchers and analysts, PR and brand teams.

**v1 scope:** Chrome extension, X only, text and links only, all local, with a "×47 repeats hidden today" counter.

## Open questions

- Who decides what counts as "the original"? First-seen locally vs. first-posted globally.
- What if it hides something I actually needed? (Reveal must always be one tap.)
- Note: tech picks above (Transformers.js, PDQ, Prompt API) were current as of 2026-10; re-check before building.
