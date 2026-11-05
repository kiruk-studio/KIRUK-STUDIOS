---
title: 03 — The modern line (conventions for the overlay layer)
status: research / kirukal — not a locked spec
date: 2026-10-20
feeds: kiruk-codex skill (pen-and-ink plate + crisp modern overlay)
related: ideas/studio-dawn/blend-roadmap.md (V1 Codex), ideas/studio-dawn/protos/blend/codex.html
---

# 03 — The modern line

The kiruk-codex figure has two layers. The **plate** is a pen-and-ink drawing in the Leonardo / old-engraving tradition. The **overlay** is a crisp modern line drawn over the same plate: selection boxes, dimension lines, callouts, type metrics, redline specs, nodes and paths. This file collects the conventions behind the overlay, taken from the people and standards that made modern explanation clear, and turns them into rules an agent can follow on every figure.

Notation: **u** is the width of one overlay line. On screen, 1 u = 1 CSS px at the figure's display size. ISO drafting standards state their sizes as multiples of line width _d_, so every number below is given in u. That lets it scale.

---

## 1. Edward Tufte

### 1.1 Data-ink and chartjunk

- **Principle.** Data-ink is the ink that carries information; it cannot be erased without losing something. Raise the share of data-ink: erase non-data-ink, erase ink that repeats itself, then revise. Chartjunk is ink that serves no information: heavy grids, moiré hatching, decorative self-display.
- **How it clarifies.** Every mark the reader has to decode should pay for itself. Removing marks that carry nothing leaves the marks that do carry something louder.
- **Example.** A bar chart with a boxed frame, grey background, full gridlines and 3-D bars becomes bars, a baseline and direct value labels. Nothing is lost, and the comparison jumps out.
- **Source.** _The Visual Display of Quantitative Information_ (1983), https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/

### 1.2 Layering and separation

- **Principle.** Put information on distinct visual strata separated by colour, value, weight and texture, so each layer can be read on its own and against the others. Grids and scaffolding belong on the quietest layer. Tufte treats confusion and clutter as failures of design, not properties of the information.
- **How it clarifies.** The eye picks a stratum by its visual signature and reads it without interference. One image then supports several readings.
- **Example.** A topographic map: contours in brown, water in blue, roads in red, the grid in pale grey. Every layer stays readable even where they overlap.
- **Source.** _Envisioning Information_ (1990), ch. "Layering and Separation", https://www.edwardtufte.com/book/envisioning-information/

### 1.3 1 + 1 = 3 (unwanted interactions)

- **Principle.** Tufte takes this from Josef Albers' essay _One Plus One Equals Three or More_. Two marks placed close together create a third element, the active space between them, that nobody drew. Two parallel black lines make a white bar. A box around a label makes a frame plus a moat.
- **How it clarifies.** Knowing about the phantom element lets you avoid double lines, boxes inside boxes and lines running parallel and close together. Each of these reads as an extra layer of meaning that isn't there.
- **Example.** Heavy table rules between rows make white stripes that compete with the numbers. Replacing them with whitespace or one hairline removes the stripes.
- **Source.** _Envisioning Information_, ch. "Layering and Separation" (as above).

### 1.4 The smallest effective difference

- **Principle.** Make visual distinctions as subtle as possible while they still work. This is Occam's razor for marks: small differences leave room for more differences, and they don't overstate the data.
- **How it clarifies.** When secondary elements whisper, the one strong element is the message. Loud distinctions everywhere flatten the hierarchy.
- **Example.** Gridlines in 20% grey rather than black, and a thin dotted connector rather than a bold arrow. The data still dominates.
- **Source.** _Visual Explanations_ (1997), ch. 4 "The Smallest Effective Difference", https://www.edwardtufte.com/book/visual-explanations-images-and-quantities-evidence-and-narrative/ (wording discussed at https://boxesandarrows.com/three-lessons-from-tufte-special-deliverable-6).

### 1.5 Small multiples

- **Principle.** Repeat the same frame at the same scale with the same encoding, and vary one thing. The constant design means the eye compares the content, not the layouts. The question underneath is always _compared to what?_
- **How it clarifies.** The reader learns the encoding once and spends the rest of their attention on the changes.
- **Example.** Twelve identical mini-maps of a city's air pollution, one per month.
- **Source.** _Envisioning Information_, ch. "Small Multiples"; _Visual Display_ (as above).

### 1.6 Micro/macro readings

- **Principle.** Rich detail can gather into larger, coherent structures, so the same display reads as an overview from across the room and as detail up close. Tufte argues that to clarify you often add detail, not remove it.
- **How it clarifies.** The reader picks the scale of inquiry. Context is never lost when they zoom into a detail.
- **Example.** The Vietnam Veterans Memorial: 58,000 names that are individually legible and together form one wall. Or a detailed old city plan, read as a single form and street by street.
- **Source.** _Envisioning Information_, ch. "Micro/Macro Readings".

### 1.7 Integrating words and images

- **Principle.** Words, numbers and images explain the same thing, so they belong together. Label directly, next to the thing named. Avoid legends and keys that send the eye on a round trip, and use the same terms in text and figure.
- **How it clarifies.** The reader never holds a code in memory. The name sits where the thing is.
- **Example.** Annotate a line chart at the end of each line ("Rent", "Wages") rather than in a colour legend box. Leonardo's notebook sheets already do this, with notes written beside the drawings.
- **Source.** _Beautiful Evidence_ (2006), ch. "Words, Numbers, Images — Together", https://www.edwardtufte.com/book/beautiful-evidence/. Tufte CSS uses sidenotes and margin captions instead of footnotes for the same reason: https://edwardtufte.github.io/tufte-css/

### 1.8 Sparklines

- **Principle.** Sparklines are small, intense, word-sized graphics with the resolution of typography. They sit inside a sentence or a table cell, about one line of type tall, with no frame. Colour is used sparingly, for example to mark the last value.
- **How it clarifies.** A graphic can be read in the flow of reading, beside the number it explains.
- **Example.** A glucose trace one line tall, set inside the sentence that reports the current reading, with the normal range as a pale band.
- **Source.** https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/

### 1.9 Which of these govern an overlay laid over an illustration?

| Principle                     | Governs the overlay?       | How                                                                                                                              |
| ----------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Data-ink / chartjunk          | **Yes, strictly**          | Every overlay mark must carry a measurement, a selection, a name or a relation. No decorative overlay.                           |
| Layering and separation       | **Yes, it is the core**    | Plate and overlay are two strata. Separate them by hue (ink vs one red), by texture (hand-wobble vs ruled), and by weight (2:1). |
| Smallest effective difference | **Yes**                    | Use the thinnest overlay line that still reads (1 u). Secondary overlay marks use a tint, not a new colour.                      |
| 1 + 1 = 3                     | **Yes**                    | No overlay line runs parallel and close to an ink line. No boxed labels, no double rules.                                        |
| Integrating words and images  | **Yes**                    | Labels go next to their referents, with no legend except the title-block key. Prose and figure use the same terms.               |
| Micro/macro                   | **Yes, as hierarchy**      | The plate is the micro (rich), the overlay the macro (the claim). Each must read at its own distance.                            |
| Small multiples               | At the figure/series level | Use for states, steps and comparisons. The overlay sits in identical positions across panels.                                    |
| Sparklines                    | Occasionally               | Word-sized inline graphics inside callout text, e.g. a pressure profile beside a stroke label.                                   |

---

## 2. Technical drawing standards

### 2.1 ISO 128 — lines

- **Principle.** A small, fixed vocabulary of line types, each with a meaning, drawn in a fixed set of widths.
  - **Width series** (ratio 1:√2): 0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1, 1.4, 2 mm.
  - **Extra-wide : wide : narrow = 4 : 2 : 1.** Two adjacent widths must be unambiguously distinct. With constant-width equipment the deviation is ≤ ±0.1 d.
  - **Element lengths** (multiples of line width d): dot ≤ 0.5 d, gap 3 d, short dash 6 d, dash 12 d, long dash 24 d, space 18 d.
  - **Spacing:** the minimum space between parallel lines is 0.7 mm.
  - **Junctions:** dashed and chain lines should meet at a dash, not in a gap.
  - **Colour:** lines are black (or white on a dark ground). Other colours may be used if their meaning is explained.
  - **Meanings** (ISO 128-24 / 128-2 usage):
    - 01.2 continuous wide: visible edges and outlines.
    - 01.1 continuous narrow: dimension, extension and leader lines, reference lines, hatching.
    - 02.1 dashed narrow: hidden edges.
    - 04.1 long-dash dotted narrow (chain): centre lines, lines of symmetry, pitch circles.
    - 04.2 long-dash dotted wide: cutting planes and areas with special requirements.
    - 05.1 long-dash double-dotted narrow (phantom): adjacent parts, extreme positions of moving parts, initial outlines before forming.
- **How it clarifies.** The reader decodes the line before reading the object. Weight separates the object (wide) from its description (narrow), and the dash pattern says visible, hidden or axis.
- **Example.** A shaft: outline 0.5 mm continuous; bore hidden as 0.25 mm dashes (dash 3 mm, gap 0.75 mm); axis as a 0.25 mm chain line overshooting the outline slightly.
- **Source.**
  - ISO 128-20:1996, identical to IS 10714-20:2001 (open copy): https://law.resource.org/pub/in/bis/S01/is.10714.20.2001.pdf
  - ISO listing: https://www.iso.org/standard/1408.html
  - ISO 128-2:2020 (current; same 4:2:1 ratio and 0.7 mm spacing) preview: https://cdn.standards.iteh.ai/samples/69129/38e651842df746fd990d29679e3c2e98/ISO-128-2-2020.pdf
  - Line-group tables: BIS SP 46:2003, https://law.resource.org/pub/in/bis/S01/is.sp.46.2003.pdf

### 2.2 ISO 129-1 — dimensioning

- **Principle.** A dimension has four parts:
  - **Extension lines** carry the feature's edges out of the view, drawn perpendicular to the measured length. They extend about **8 × line width** beyond the dimension line, and are never drawn between views or parallel to hatching.
  - **The dimension line** runs parallel to the measured length.
  - **Terminators:** arrowhead closed-filled 30°, closed 30°, open 30° or open 90°; or an oblique stroke (45°); or a point for an origin.
  - **The value** sits near the middle, just above the line, not touching it.
  - Where space is tight, the arrows go outside the extension lines, reversed.
- **Spacing (ASME/ANSI practice, from drafting textbooks):**
  - Gap between the object and the extension line: about 1.5 mm (1/16 in). Some textbooks give 1.3 mm.
  - Extension line overshoot beyond the dimension line: 2.5–3 mm (1/8 in).
  - First dimension line: about 10–12 mm (1/2 in) from the object.
  - Further dimension lines: about 6–10 mm (3/8 in) apart.
  - Smaller dimensions go inside, larger outside, so lines never cross.
  - Arrowhead length : width is about 3:1.
- **Not-to-scale values** are underlined. This is long drafting practice, and CAD systems still do it by default.
- **How it clarifies.** The measured span is bounded on both sides by lines that touch the object. The number belongs to exactly one span, and nested spans never cross.
- **Example.** A 40 mm plate with a 12 mm hole at 10 mm from the edge: the 10 dimension sits nearest the part, the 40 overall further out, and both share one extension line at the datum edge.
- **Source.**
  - EN ISO 129-1:2019 (adopts ISO 129-1:2018): https://standards.iteh.ai/catalog/standards/cen/3997aae8-2f9d-497b-ad7b-340c2f9d5c26/en-iso-129-1-2019
  - Lamit, _Engineering Graphics and Design_, ch. 15: https://www.deanza.edu/dmt/documents/books/egd_lamit/EGD_Chapter_15.pdf
  - _Basic Blueprint Reading_, unit 5: https://openoregon.pressbooks.pub/blueprint/chapter/unit-5-dimensioning/

### 2.3 ISO 128-22 — leader lines and their terminators

- **Principle.** Leaders are continuous narrow lines.
  - **Angle:** drawn at an angle to the feature and the sheet frame, never parallel to adjacent lines such as hatching, and at **≥ 15°** to the lines they meet.
  - **Shape:** they may have sharp kinks, and several may join, but they must not cross each other, reference lines or values.
  - **The terminator depends on where the leader ends:**
    - On an outline or edge: a **closed or closed-filled arrowhead** (narrow, about 15° included angle).
    - Inside the outline of an object: a **dot, diameter 5 × line width**.
    - On another line, such as a dimension line or axis: **no terminator**.
  - **Reference line (shoulder):** optional. Either fixed at **20 × line width**, or as long as the text, and drawn in a reading direction.
  - **Text:** set above the reference line, at **2 × line width** from it, never touching it.
- **How it clarifies.** The terminator itself tells you what is being pointed at: an arrow means "this edge", a dot means "this surface or body", nothing means "this other annotation".
- **Example.** An arrow onto the rim of a cup ("glazed edge"); a dot inside its wall ("stoneware, 6 mm"); a bare leader ending on the height dimension ("max.").
- **Source.** ISO 128-22:1999 preview: https://cdn.standards.iteh.ai/samples/29094/8ae3632c00ce42db8913a415df21f24b/ISO-128-22-1999.pdf (these rules carry into ISO 128-2:2020).

### 2.4 Callout balloons — ISO 6433 part references

- **Principle.** Part references are preferably numerals, at most 3 characters, and all the same height and type on a drawing.
  - **Marking:** either encircled, with all circles the same diameter in continuous narrow line, or set at about twice the dimension text height.
  - **Placement:** outside the outline of the part, joined by a leader that obeys ISO 128-22 and is aimed at the centre of the circle. Leaders never intersect, are kept short, and are drawn at an angle.
  - **Layout:** arranged in horizontal rows and vertical columns, and numbered in a logical sequence (assembly order, or importance).
  - **Shared leaders:** related parts may share one leader.
- **Contrast.** USPTO patent drawings forbid encircled reference characters. Their numerals must be at least 0.32 cm (1/8 in) high, follow the object's profile, not cross lines, and not sit on hatching. Lead lines must be as short as possible and must not cross. A freestanding arrow on a lead line means "this whole section".
- **How it clarifies.** The balloon is a pointer into a list; rows and columns turn the scatter into a readable index.
- **Example.** An exploded watch movement with balloons 1–12 aligned in a column at right, each leader ending in a dot on its part.
- **Source.**
  - ISO 6433:2012 preview: https://cdn.standards.iteh.ai/samples/51527/d4eaa720fb0448bea2952817ce24d508/ISO-6433-2012.pdf
  - 37 CFR 1.84(p)–(r): https://www.law.cornell.edu/cfr/text/37/1.84
  - MPEP 608.02: https://www.uspto.gov/web/offices/pac/mpep/s608.html

### 2.5 Title blocks and scale

- **Title block (ISO 7200:2004).** Sits at the bottom right. Total width **180 mm**, so the same block fits an A4 sheet and every larger size.
  - **Mandatory fields:** legal owner, identification number, date of issue, sheet number, title, approval person, creator, document type.
  - **Optional fields:** revision, status, language, and others.
  - **Kept outside it:** scale, projection symbol and general tolerances are placed outside the title block, and only when used.
  - Avoid the letters I and O in revision indices.
- **Scale (ISO 5455).**
  - Written as a ratio: SCALE 1:1, 2:1 (enlargement), 1:2 (reduction).
  - Preferred steps: 1:2, 1:5, 1:10 and their ×10 multiples, plus 2:1, 5:1, 10:1, 20:1, 50:1.
  - **USPTO 1.84(k) does not permit "actual size" or "scale ½",** because a ratio loses its meaning once the drawing is reproduced at another size.
- **Lettering (ISO 3098).**
  - Nominal heights 1.8, 2.5, 3.5, 5, 7, 10, 14, 20 mm (√2 series).
  - Stroke width is h/10 (type B) or h/14 (type A).
  - Typical drawings use 2.5–3.5 mm for notes and dimensions.
- **How it clarifies.** The reader always knows what the sheet is, who made it, its units and its scale, and always in the same place.
- **Example.** A plate whose bottom-right block reads: _Escapement, plate 03 · 2026-10-20 · kiruk · dimensions in mm · scale bar_.
- **Source.**
  - ISO 7200:2004 preview: https://cdn.standards.iteh.ai/samples/35446/d3b0887cb4fa47f49f8718807d3b8903/ISO-7200-2004.pdf
  - ISO 3098-1:2015: https://standards.iteh.ai/catalog/standards/sist/7f2b6cbe-74c0-4a6f-baa8-ffb42419820d/sist-en-iso-3098-1-2015
  - Scales and lettering in BIS SP 46 (above).
  - 37 CFR 1.84(k) (above).

---

## 3. Design handoff redlines, selection, and the rubric

### 3.1 What a redline is

- **Principle.** A redline (or spec sheet) is a copy of a finished design with a second, differently coloured layer that states the values a builder needs:
  - spacing and padding between objects;
  - sizes (W × H) and corner radii;
  - type specs: family, weight, size/leading such as 16/24, tracking;
  - colours as tokens or hex values;
  - alignment and keylines.
- **Colour.** The layer is red, orange-red or magenta because those hues are rare in interface chrome and photographs. They can't be mistaken for the design, and they read as a correction, not as content.
- **Today.** Tools such as Figma Dev Mode, Zeplin and Adobe XD specs generate this layer. Hand-made redlines survive wherever intent or an exception has to be stated.
- **How it clarifies.** Content stays untouched. The measurements are visibly _about_ the content, not part of it.
- **Example.** A card mock-up with red dimension lines showing 24 between title and body and 16 padding, a pink 15%-tint block filling the gap, and a red label "Title — Inter 600 20/28".
- **Source.** https://uxtweak.com/ux-glossary/redlining · https://blog.zeplin.io/design-handoff-101-how-to-handoff-designs-to-developers

### 3.2 How design tools draw selection and measurement

- **Selection.**
  - A one-pixel bounding box in the tool's accent colour (blue in Figma), drawn on the object's bounds.
  - Eight square handles: four corners plus four edge midpoints. They are white-filled with an accent stroke and sized in screen pixels, so they don't scale with zoom.
  - A W × H size tag in a small pill below the box.
- **Measurement (Figma).** Select one object, then hold **Alt/Option** and hover another. Figma draws a **red line** between them with horizontal and vertical distances. **Cmd+Opt / Ctrl+Alt** reaches into nested layers. The line's colour and weight are fixed, a deliberate single convention. Distances are measured to each object's **bounding box**, not to the visible ink, so strokes, text boxes and odd polygons can mislead.
- **Paths.** In vector edit mode, anchor points are drawn as small vertices, the selected one filled. Bézier control handles are thin lines ending in small round knobs. In Illustrator, anchors are squares and handle ends are round.
- **How it clarifies.** Selection says "this one". Measurement says "this far, between these two". Node display exposes how a shape is constructed.
- **Example.** Selecting a logo's eye shape shows its box and handles. Alt-hovering the wordmark shows a red 32 between them.
- **Source.** Figma, "Measure distances between layers": https://help.figma.com/hc/en-us/articles/360039956974

### 3.3 The bridge: rubric and redline are the same act

- **Rubrics.** _Rubrica_ is Latin for red ochre. In medieval manuscripts the scribe wrote the black text first. A **rubricator** then made a second pass in red to add:
  - headings and initials;
  - paragraph marks;
  - corrections;
  - instructions.
- **Black and red.** The liturgical maxim tells the celebrant to say the black and do the red. Black is content; red is instruction about the content.
- **Later redlines.** Editors' red pencil, drawing checkers marking changes in red on prints (in common shop practice, yellow means checked-OK), lawyers' redlined drafts, and designers' redline specs all repeat the act:
  - a second pass;
  - one distinct colour;
  - laid over finished content without altering it;
  - saying what matters and what to do.
- **Consequence for the skill.** The figure is made in **two passes by two "hands"**: draw the plate, then rubricate it. The overlay never edits the plate.
- **Source.**
  - Orientation: https://en.wikipedia.org/wiki/Rubric
  - Rubricator: https://hmmlschool.org/lexicon/14705/ (after Michelle Brown, _Understanding Illuminated Manuscripts_, British Library/Getty).

---

## 4. Otto Neurath and Gerd Arntz — Isotype

- **Principle.** Isotype (Vienna Method of Pictorial Statistics, from 1924) is a language-like system with consistent graphic elements:
  - **Pictograms** are simplified, repeatable units.
  - **Quantity by repetition:** a larger quantity is shown by **more symbols of the same size, never a bigger symbol**, because areas can't be compared but units can be counted.
  - **Rounding:** each symbol stands for a fixed, rounded quantity, and fractions are cut symbols.
  - **Layout:** symbols are arranged in rows for counting, with almost no perspective, and colour is limited and used consistently.
- **The transformer.** Marie Neurath (née Reidemeister) was the principal transformer. Between the expert's data and the artist's drawing, she decided what to show and sketched the chart. Gerd Arntz gave the pictograms their style: linocut, "figurative constructivism".
- **The slogan.** The Vienna museum's motto: "to remember simplified pictures is better than to forget accurate figures."
- **How it clarifies.** Counting replaces estimating. A fixed vocabulary means each new chart costs less to read. The transformer step forces one clear claim per chart.
- **Example.** Car ownership by country: each car icon is 1 million cars; the USA gets a long row and Austria a fraction of one icon.
- **For the overlay.**
  - Show counts and repeats as repeated identical overlay marks (tally ticks), never as scaled marks.
  - Keep one overlay glyph vocabulary across every kiruk figure.
  - The agent runs a **transformer step**: write the single claim before drawing any overlay.
- **Source.**
  - Isotype Revisited (University of Reading), V&A gallery guide: https://isotyperevisited.org/Isotype%20V%26A%20gallery%20guide.pdf and https://isotyperevisited.org/
  - Orientation: https://en.wikipedia.org/wiki/Isotype_(picture_language)
  - Gerd Arntz Web Archive: https://gerdarntz.org/
  - Further reading: Marie Neurath and Robin Kinross, _The Transformer: Principles of Making Isotype Charts_ (Hyphen Press, 2009).

---

## 5. Harry Beck — the Underground diagram

- **Principle.** Beck was an Underground draughtsman who had drawn electrical circuits. In 1931 he redrew the network as a circuit, not a map, and after a trial run in 1932 it was published in 1933.
  - Lines run only **horizontal, vertical or 45°**, joined by tight curves.
  - Stations are **roughly evenly spaced**.
  - The **dense centre is enlarged** and the outer reaches compressed.
  - Ordinary stations are short ticks; interchanges get a distinct symbol.
  - Geography is sacrificed where it doesn't help the task (which line, which order, where to change).
- **How it clarifies.** Abstraction removes the variables the rider doesn't need. Fixed angles make every route a set of straight, comparable segments.
- **Example.** In real space Bank and Monument are almost touching; on the diagram they get room for their names and connection.
- **For the overlay.** Leaders and connector paths are **octilinear**: segments at 0°, 45° and 90°, with one horizontal shoulder. Organic shapes belong to the plate; the overlay is a circuit diagram laid over it. Even spacing applies to stacked labels and dimension tiers.
- **Source.**
  - London Museum: https://www.londonmuseum.org.uk/collections/london-stories/harry-beck-revolutionised-tube-map/
  - London Transport Museum: https://www.ltmuseum.co.uk/collections/stories/design/transforming-tube-map-harry-becks-iconic-design

---

## 6. Explorable explanations

### 6.1 Bret Victor

- **Explorable Explanations (2011).** Text becomes an environment to think in. Victor describes three forms:
  - **reactive documents**, where the reader changes an assumption and the conclusions update;
  - **explorable examples**, where the reader varies a parameter and sees the behaviour;
  - **contextual information**, brought in when needed.
    The interaction is woven into the author's argument. The reader can read straight through and dig in by choice. A bare sandbox with no guidance explains nothing.
- **Up and Down the Ladder of Abstraction.** Start concrete with one instance, step up by abstracting over time and then over parameters to see patterns, and step down again to explain anomalies. Linked views, where selecting a point in the abstraction highlights the instance, let the reader move between rungs.
- **Example.** In the ladder essay a car steers along a road. One trajectory becomes all trajectories over time, then a bundle over turn rates, with a click on any point dropping back to that single run.
- **Source.** http://worrydream.com/ExplorableExplanations/ · http://worrydream.com/LadderOfAbstraction/

### 6.2 Bartosz Ciechanowski

- **Structure.**
  - Each essay assembles a mechanism one subsystem per section.
  - Each of dozens of figures isolates **one idea**.
  - The order is a short setup sentence, the figure, an interpretation paragraph, then often an invitation to try a control.
- **Controls.** Sliders scrub time or a single parameter, drag rotates 3-D parts, and toggles switch discrete states.
- **Labels.** Part names are bolded in the prose and coloured to match the part in the figure, so there is no legend. On-figure marks are minimal: motion arrows, rotation dots, a cutaway.
- **Example.** In _Mechanical Watch_ a figure shows only the click and ratchet; one slider winds and lets go, so the reader sees the click stop the spring unwinding.
- **Source.** https://ciechanow.ski/mechanical-watch/ · https://ciechanow.ski/

### 6.3 Nicky Case

- **Principle.**
  - Hook with a question the reader comes to care about.
  - Start with a concrete, hands-on experience, then add one idea at a time, linking steps with "but… therefore…" so they read as a story.
  - Step back to the concrete when needed.
  - Raise the reader's understanding; don't dumb the idea down.
  - Put the open sandbox at the end, after the guided path.
- **Example.** _Parable of the Polygons_: drag shapes yourself, then watch a small bias produce segregation, then explore freely.
- **Source.** https://blog.ncase.me/how-i-make-an-explorable-explanation/ · https://explorabl.es/

### 6.4 What interaction should and should not do in an explanatory figure

- **Should**
  - Scrub the **one parameter the prose is discussing**.
  - Give immediate feedback.
  - Let the reader test a claim.
  - Link a term in the text to its part in the figure (hover or focus highlights both).
  - Reveal an optional layer, such as "show measurements", on request.
- **Should not**
  - Hide the main claim behind interaction.
  - Depend on hover (touch devices have none).
  - Autoplay a loop that can't be paused.
  - Move for decoration, or hijack scrolling.
  - Open on a sandbox.
  - Make the static frame meaningless. The figure has to work printed, as a thumbnail, and under `prefers-reduced-motion`.

---

## 7. Josef Müller-Brockmann — the grid

- **Principle.** A grid divides the page into fields separated by gutters, and ties type sizes and leading to it, so text, images and white space take positions and proportions from one system. Müller-Brockmann saw the grid as a tool for order, objectivity and legibility. He also held that a grid is an aid, not a guarantee: it enables good work but doesn't produce it.
- **How it clarifies.**
  - Alignment across the page signals relation.
  - Consistent intervals make the structure itself readable.
  - The reader learns where things will be.
- **Example.** His Zürich Tonhalle _musica viva_ concert posters: rotated type and geometric fields placed exactly on a modular grid, so the structure itself becomes the image.
- **For the overlay.** The plate may be free, but every overlay label, balloon column, dimension tier and title block sits on the figure's grid: column edges plus a baseline unit. The overlay may _show_ the grid as faint construction lines. That echoes the manuscript scribe's pricked-and-ruled lines, which are still visible in the margins of medieval books.
- **Source.** J. Müller-Brockmann, _Grid Systems in Graphic Design_ (Niggli, 1981; ISBN 978-3-7212-0145-1); listing: https://draw-down.com/products/grid-systems-in-graphic-design

---

## 8. Typography of annotation

- **Monospace vs serif.**
  - Monospace (Xanh Mono, JetBrains Mono in the blend prototypes) is the voice of _measurement and machine_. Every digit is the same width, so values align and don't jitter while a slider changes them. It is plainly unlike the plate's serif, which supports layering.
  - Serif (IM Fell in the plate) is the voice of the _old hand_: titles, captions, commentary.
- **Sizes that stay legible.**
  - Print: ISO 3098 minimum 1.8 mm; 2.5 mm for notes and 3.5 mm for dimensions on typical sheets. USPTO requires ≥ 3.2 mm characters.
  - Screen (kiruk working number, not a standard): overlay labels **11–13 CSS px**, never below 11 px at display size.
  - Use non-scaling text, or a minimum size, so labels don't shrink when the figure is scaled down.
  - ISO 3098 type B sets stroke width at h/10. With a cap height of about 9–10 px that gives a stem near **1 px**: the same "pen" as the overlay line.
- **Tabular figures.** OpenType `tnum` swaps proportional digits for uniform-width ones, so columns align. Use it, or mono, for every overlay number. Proportional figures are for running prose (Butterick).
- **Italic for notes.** This is convention, not a standard:
  - editors set interpolations and stage directions in italic;
  - cartographers put water names in italic;
  - math sets variables in italic.
    In the overlay, italic serif is reserved for **commentary**, the "why". Roman mono states **fact**, the "what" and "how much".
- **Measured type metrics.** When the subject is type, draw horizontal overlay guides across the word and label them in mono at the right end with values: baseline, x-height, cap height, ascender, descender. Spacing pairs and sidebearings are dimensioned like any span. Type specs use print shorthand: _family weight size/leading tracking_, e.g. "IM Fell 21/28 +0.5".
- **Text never crosses a line.** USPTO 1.84(p)(3) says characters must not cross or mingle with lines, and hatching may be broken where a character sits. In the overlay a label knocks out a paper halo around itself. Lines stop short of text; text never sits on top of ink.
- **Source.**
  - https://practicaltypography.com/alternate-figures.html
  - https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-tnum
  - ISO 3098-1 and 37 CFR 1.84 (above)
  - kiruk prototypes: ideas/studio-dawn/protos/blend/codex.html (overlay red `#b5462b` at 1 px, ink `#3b2f2a`)

---

## Rules

Strict constraints for the overlay. _u_ = one overlay line width, 1 CSS px at display size. In SVG, use `vector-effect: non-scaling-stroke` so u holds when the figure scales.

1. **One pen.** All overlay lines are 1 u, solid, in one hue (the kiruk rubric red). Use at most two values: 100% for primary marks and about 55% tint for secondary or construction marks. A second hue needs a line in the title-block key.
   _Why:_ ISO 128 permits colour only with a stated meaning. The smallest effective difference is a tint, not a new colour. The rubric was one red.

2. **2:1 weight hierarchy.** Plate outlines and visible edges are ≥ 2 u, and emphasis up to 4 u (ISO 4:2:1). Hatching and texture may be finer than 2 u, but only in the ink hue and never in the overlay hue.
   _Why:_ weight and hue together keep the strata separate. A fine ink hatch can't pass for an overlay line because its colour differs.

3. **Ruled, not drawn.** Overlay strokes are geometrically exact: straight segments, true arcs, butt or square caps. They get no texture, no jitter, and no filter or opacity noise. Snap 1 u strokes to half-pixels. The plate keeps its hand.
   _Why:_ the overlay should differ in kind from the plate, hand against machine. That is layering and separation, and it avoids 1 + 1 = 3 confusion between strata.

4. **Every overlay line terminates on its referent.** End with a filled arrowhead (length 6–8 u, included angle 20–30°) on an outline or edge; a dot (Ø 5 u) inside a surface; nothing when the line ends on another overlay line. A line with a free end is forbidden.
   _Why:_ ISO 128-22 makes the terminator name the kind of referent, which removes ambiguity.

5. **Leaders are octilinear, short, and uncrossed.**
   - One 45° or 90° segment, then a horizontal shoulder 12–20 u long.
   - At ≥ 15° to any line they touch, and never parallel to hatching.
   - Never closer than 4 u, in parallel, to any ink line.
   - They never cross each other or a value.
     _Why:_ ISO 128-22, ISO 6433, USPTO 1.84(q) and Beck's angles. Parallel lines that are too close make a phantom third line (Albers/Tufte; ISO minimum spacing 0.7 mm).

6. **Dimensions are ISO-shaped.**
   - Extension lines start 3 u clear of the ink and overshoot the dimension line by 8 u.
   - The first dimension tier is ≥ 24 u from the subject, later tiers 16 u apart, smaller spans nearer the subject.
   - The value is centred, 3–4 u above the line, and always horizontal.
   - A value that is not to scale is underlined; the whole figure is marked NTS if abstracted.
     _Why:_ ISO 129-1 and ASME practice let spans nest without crossing, and keep every number bound to one span.

7. **Line type carries meaning, never decoration.**
   - Solid: measured or selected fact.
   - Dashed (12 u dash, 3 u gap): hidden or inferred.
   - Chain (24 u / 3 u / dot / 3 u): axis, centre, rotation.
   - Phantom (24 u / 3 u / dot / 3 u / dot / 3 u): alternate position or path of motion.
     _Why:_ readers of technical drawings already know the ISO 128 vocabulary, so no key is needed.

8. **Selection means one thing.**
   - The box is offset 4–8 u outside the ink's true extremity, never touching ink.
   - It has 4 corner handles (7 u squares, paper fill, 1 u stroke). Add the 4 mid-edge handles only when the figure is about size.
   - The W × H tag is mono, centred, 6 u below the box.
   - At most one primary selection per figure, or per panel in small multiples.
     _Why:_ the design-tool convention reads instantly as "this one". One selection keeps one idea per figure (Ciechanowski).

9. **Measure the ink, not the box.** Distances run to the visible outer edge of the drawn stroke (or to a stated datum), not to an invisible bounding box. Gap fields may be filled with a 10–15% tint of the overlay hue.
   _Why:_ Figma's bounding-box measuring misleads on strokes and odd shapes. A hand-drawn plate has no honest box.

10. **Name it beside it.**
    - Every label sits within one leader length of its referent and outside the subject's silhouette where possible (ISO 6433).
    - The term matches the prose exactly, and in the prose it is set in the overlay hue.
    - No legend box. The only key is the title block.
      _Why:_ Tufte's integration of words and images and Ciechanowski's colour-matched terms spare the reader any round trips to a legend.

11. **Overlay type is mono, tabular, one size.**
    - Labels and values are 11–13 px mono (in print ≥ 2.5 mm), in one size with one plate-title size above it.
    - Caps only for tags of three words or fewer, tracked +5–10%.
    - Italic serif only for commentary.
    - Text never crosses a line: it knocks out a 2 u paper halo.
      _Why:_ ISO 3098 stroke ≈ h/10 ≈ 1 u ties type to the line. `tnum` stops values jittering. USPTO 1.84(p)(3) keeps text off lines.

12. **Every mark answers the caption.** Before drawing, write the figure's one claim (the transformer step). Every overlay mark must support that claim; delete any whose removal loses no fact. Budget: ≤ 7 labelled items per figure. Beyond that, split into small multiples with identical overlay positions.
    _Why:_ data-ink applied to the overlay, plus Neurath's transformer and Victor's and Ciechanowski's one-idea figures.

13. **Three glances.**
    - Glance 1: the plate (macro, the whole subject).
    - Glance 2: the single primary overlay element (the claim).
    - Glance 3: secondary values and notes at tint.
      If a fourth look reveals something the caption doesn't mention, remove it or caption it.
      _Why:_ Tufte's micro/macro reading and Isotype's reading hierarchy. The smallest effective difference sets the order.

14. **Grid and title block.** Overlay text, balloon columns and dimension tiers snap to the figure's column grid and baseline unit. The title block sits bottom-right and holds title, figure id, date, maker, units (stated once), the overlay key, and a **graphic scale bar** (3–5 ticks). Use a ratio such as 1:2 only on fixed-size print plates.
    _Why:_ Müller-Brockmann's grid, ISO 7200 and ISO 5455. USPTO 1.84(k) shows that a ratio fails once the figure is reproduced at another size.

15. **Static first; interaction reveals one parameter.** The figure must be complete with no hover, script or motion, and every overlay element visible. Interaction may only scrub the one parameter the prose names, toggle an optional layer, or link term ↔ part. Respect `prefers-reduced-motion`, and don't autoplay loops.
    _Why:_ Victor (the interaction is woven into the argument), Case (guided before sandbox), and print and thumbnail survival.

---

## Vocabulary

- **data-ink** — ink that carries information; erasing it loses something.
- **non-data-ink** — frames, fills, redundant marks; candidates for erasure.
- **chartjunk** — ink that serves no information (decoration, moiré, heavy grids).
- **layering and separation** — putting information on visually distinct strata (hue, value, weight, texture).
- **1 + 1 = 3** — the unintended element created between two nearby marks (Albers via Tufte).
- **smallest effective difference** — the subtlest distinction that still works.
- **micro/macro reading** — a display that works as an overview and as detail.
- **small multiples** — repeated identical frames that vary one thing.
- **sparkline** — a word-sized, frameless, typographic-resolution graphic.
- **plate** — the pen-and-ink drawing layer (old hand).
- **overlay** — the crisp modern annotation layer (second hand).
- **u** — one overlay line width; the unit for all overlay sizes.
- **rubric** — text or marks in red that structure or instruct; from Latin _rubrica_, red ochre.
- **rubricator** — the person who adds the red pass after the scribe.
- **redline** — a second-colour markup of finished work stating specs or changes.
- **spec sheet** — a redline that lists values (spacing, sizes, type, colour) for a builder.
- **bounding box** — the axis-aligned rectangle enclosing an object's bounds.
- **handles** — small squares on a selection box (corners, mid-edges) that signal it can be manipulated.
- **anchor / node** — a vertex on a vector path.
- **control handle** — a Bézier tangent line ending in a knob.
- **extension line** — a narrow line that carries a feature's edge out of the view for dimensioning.
- **dimension line** — the line, parallel to the measured span, that carries terminators and value.
- **terminator** — the end mark of a dimension or leader: arrowhead, oblique stroke, dot, or none.
- **leader line** — a narrow line from a note or label to its referent.
- **reference line / shoulder** — the short horizontal segment at a leader's text end.
- **part reference / balloon** — the item number (often encircled) that keys a part to a list.
- **datum** — the reference feature that measurements start from.
- **centre line (chain line)** — long-dash dotted narrow line marking an axis or symmetry.
- **hidden line** — dashed narrow line for edges not visible.
- **phantom line** — long-dash double-dotted line for adjacent parts or alternate positions.
- **hatching** — regularly spaced parallel lines indicating a cut surface or tone.
- **line group** — the paired widths (narrow, wide, extra-wide in 1:2:4) used on one drawing.
- **title block** — the bottom-right field holding identity, maker, date and units.
- **scale bar** — a graphic ruler that survives resizing; **scale ratio** (1:2) does not.
- **NTS** — not to scale; out-of-scale values are underlined.
- **keyline** — an alignment line in a layout or spec.
- **grid field / gutter** — a cell of a layout grid and the space between cells.
- **baseline grid** — the vertical rhythm unit that text lines sit on.
- **construction line** — a faint line showing how a figure was set out (the modern echo of manuscript ruling).
- **knock-out / halo** — a paper-coloured clearance around text so no line touches it.
- **tabular figures (`tnum`)** — digits of uniform width that align in columns.
- **lining / oldstyle figures** — digits at cap height, or with ascenders and descenders.
- **size/leading** — type spec shorthand, e.g. 16/24.
- **pictogram / Isotype** — a simplified repeatable symbol / the system that counts with them.
- **transformer** — the Isotype role that decides what a chart must say before it is drawn.
- **octilinear** — restricted to 0°, 45°, 90° (Beck).
- **explorable explanation** — text and figures the reader can manipulate to test ideas.
- **reactive document** — prose whose conclusions update when assumptions change.
- **ladder of abstraction** — moving between a concrete instance and abstractions over time or parameters.
- **scrubbing** — dragging a control through a continuous parameter or time.
- **linked highlighting** — hovering or focusing a term highlights its referent, and vice versa.

---

## Conflicts

1. **Tufte's minimalism vs the ornate old plate.**
   - **Resolution:** the overlay obeys data-ink strictly; the plate may be rich.
   - Tufte himself praises dense, finely engraved images (micro/macro; adding detail to clarify). His target is ink that carries nothing, not detail.
   - Hatching that describes form, light and material _is_ information about the subject. Ornament that competes with the overlay, such as borders, flourishes or cartouches, sits outside the overlay's working zone or drops in contrast.
   - The test: if an ornament and an overlay mark compete for the same glance, the ornament gives way.

2. **Loud red vs Tufte's quiet colour.**
   - Tufte, after the cartographer Eduard Imhof, warns that strong colours are unbearable over large areas but work in small amounts against muted grounds. This is exactly the rubric's situation: thin red lines on warm paper and brown ink.
   - **Resolution:** red only as 1 u lines, small dots and small type. Fills are capped at a 10–15% tint and never cover large areas.

3. **USPTO vs the two-layer idea.**
   - Patent rules want lead lines drawn like the drawing's own lines, all in black, with no encircled numerals.
   - Patents are single-layer documents meant to survive photocopying. kiruk figures are deliberately two-layer.
   - **Resolution:** keep USPTO's legibility rules (≥ 3.2 mm characters, no line through text, short uncrossed leads, scale-free notation), and drop its single-pen rule. No balloons by default; name parts in words (Tufte), and use balloons only when a numbered parts list exists.

4. **ISO says black lines; we use red.** ISO 128 allows other colours if their meaning is explained. The title-block key ("red = measurement and intent, kiruk overlay") does that explaining.

5. **Beck's distortion vs measured truth.** The plate may abstract, enlarging the important part as Beck enlarged central London. Overlay numbers must stay true: mark the figure NTS, and underline any value that doesn't match the drawn length.

6. **Isotype's "simplified pictures" vs Leonardo's richness.** They are complementary, not competing. The rich plate is the memory hook; the overlay is the simplified, countable statement. The Isotype rule (repeat, don't enlarge) applies to overlay marks, not to the plate.

7. **Interaction vs the plate tradition.** Old plates are static, and explorables are live. Static-first (Rule 15) settles it: the plate plus overlay is the complete figure, and interaction is an optional layer that never carries the only copy of the claim.

8. **ISO arrow angle (15° for leaders) vs 1 u on screen.** A 15° arrowhead at 1 u is a sliver that antialiasing smears. Use 20–30° filled heads, which ISO 129-1 allows for dimensions and which match ASME's 3:1. Keep the terminator _type_ rules exactly.

9. **Open question for kiruk (not resolved here).** The eye-motif test (CLAUDE.md §5.4) is presumably a plate-layer concern. Whether the overlay may ever _carry_ the eye (e.g. a selection on the eye mark itself) is a founder decision.

---

## Sources

**Tufte**

- https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/
- https://www.edwardtufte.com/book/envisioning-information/
- https://www.edwardtufte.com/book/visual-explanations-images-and-quantities-evidence-and-narrative/
- https://www.edwardtufte.com/book/beautiful-evidence/
- https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/
- https://edwardtufte.github.io/tufte-css/
- https://boxesandarrows.com/three-lessons-from-tufte-special-deliverable-6 (secondary, smallest-effective-difference wording)

**Drafting standards**

- ISO 128-20:1996 via IS 10714-20:2001 (identical, open): https://law.resource.org/pub/in/bis/S01/is.10714.20.2001.pdf
- ISO 128-20 listing: https://www.iso.org/standard/1408.html
- ISO 128-2:2020 preview: https://cdn.standards.iteh.ai/samples/69129/38e651842df746fd990d29679e3c2e98/ISO-128-2-2020.pdf
- ISO 128-22:1999 preview: https://cdn.standards.iteh.ai/samples/29094/8ae3632c00ce42db8913a415df21f24b/ISO-128-22-1999.pdf
- EN ISO 129-1:2019: https://standards.iteh.ai/catalog/standards/cen/3997aae8-2f9d-497b-ad7b-340c2f9d5c26/en-iso-129-1-2019
- ISO 6433:2012 preview: https://cdn.standards.iteh.ai/samples/51527/d4eaa720fb0448bea2952817ce24d508/ISO-6433-2012.pdf
- ISO 7200:2004 preview: https://cdn.standards.iteh.ai/samples/35446/d3b0887cb4fa47f49f8718807d3b8903/ISO-7200-2004.pdf
- ISO 3098-1:2015: https://standards.iteh.ai/catalog/standards/sist/7f2b6cbe-74c0-4a6f-baa8-ffb42419820d/sist-en-iso-3098-1-2015
- BIS SP 46:2003 (ISO 128 parts, scales, lettering): https://law.resource.org/pub/in/bis/S01/is.sp.46.2003.pdf

**Drafting textbooks**

- Lamit, ch. 15: https://www.deanza.edu/dmt/documents/books/egd_lamit/EGD_Chapter_15.pdf
- https://openoregon.pressbooks.pub/blueprint/chapter/unit-5-dimensioning/

**USPTO**

- 37 CFR 1.84: https://www.law.cornell.edu/cfr/text/37/1.84
- MPEP 608.02: https://www.uspto.gov/web/offices/pac/mpep/s608.html

**Redlines, selection and the rubric**

- Figma: https://help.figma.com/hc/en-us/articles/360039956974
- Redlining: https://uxtweak.com/ux-glossary/redlining
- Zeplin: https://blog.zeplin.io/design-handoff-101-how-to-handoff-designs-to-developers
- Rubric: https://en.wikipedia.org/wiki/Rubric (orientation)
- Rubricator: https://hmmlschool.org/lexicon/14705/

**Isotype**

- https://isotyperevisited.org/
- https://isotyperevisited.org/Isotype%20V%26A%20gallery%20guide.pdf
- https://en.wikipedia.org/wiki/Isotype_(picture_language) (orientation)
- https://gerdarntz.org/

**Beck**

- https://www.londonmuseum.org.uk/collections/london-stories/harry-beck-revolutionised-tube-map/
- https://www.ltmuseum.co.uk/collections/stories/design/transforming-tube-map-harry-becks-iconic-design

**Explorables**

- http://worrydream.com/ExplorableExplanations/
- http://worrydream.com/LadderOfAbstraction/
- https://ciechanow.ski/mechanical-watch/
- https://ciechanow.ski/
- https://blog.ncase.me/how-i-make-an-explorable-explanation/
- https://explorabl.es/

**Grid**

- Müller-Brockmann, _Grid Systems in Graphic Design_, Niggli, ISBN 978-3-7212-0145-1; https://draw-down.com/products/grid-systems-in-graphic-design

**Typography**

- https://practicaltypography.com/alternate-figures.html
- https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-tnum

**kiruk internal**

- ideas/studio-dawn/blend-roadmap.md
- ideas/studio-dawn/protos/blend/codex.html

**Verification notes**

- Fetched directly: the ISO 128-20/22, ISO 6433 and ISO 7200 numbers (standard texts or previews), and 37 CFR 1.84.
- From search excerpts only, not the full texts:
  - ISO 129-1's 8 × overshoot and terminator list;
  - the ASME spacing and gap numbers;
  - the 3:1 arrowhead ratio.
- The ISO 5455 scale steps are given from drafting practice and should be checked against the standard before the skill is locked.
- The "not-to-scale is underlined" rule is long drafting practice, and current ISO 129-1 wording on it was not verified.
- The screen-pixel translations (u values, 11–13 px) are kiruk working numbers derived from the standards, not standards themselves.
