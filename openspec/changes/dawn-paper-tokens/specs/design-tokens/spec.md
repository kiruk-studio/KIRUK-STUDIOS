# Delta: design-tokens (MODIFIED)

## ADDED Requirements

### Requirement: Dawn paper pair

`core.json` MUST declare a `color.dawn` group: two papers and the ink each one takes. Every token MUST carry its meaning in `$description`.

| token                  | value     | meaning                                                                   |
| ---------------------- | --------- | ------------------------------------------------------------------------- |
| `color.dawn.light`     | `#FADFA9` | Dawn Light, the **old paper**: where the hand drew. It carries its years. |
| `color.dawn.departs`   | `#CCFFFF` | Dawn Departs, the **new paper**: where the code draws. Crisp, no age.     |
| `color.dawn.iron-gall` | `#231A14` | Iron-gall ink, the old paper's ink. It browns as the sheet ages.          |
| `color.dawn.navy`      | `#1D1C2D` | Dawn navy, the new paper's ink. In water it runs blue, not brown.         |

The papers MUST stay tints: OKLCH lightness ≥ 0.90 and chroma ≤ 0.08. Today Dawn Light is `oklch(0.913 0.075 84.4)` and Dawn Departs is `oklch(0.965 0.052 196.3)`. A brighter or more saturated value belongs in `color.absurd.*`, not here.

Each paper MUST be used with its own ink, at a contrast of at least 7:1. Today iron-gall on Dawn Light is 13.2:1 and navy on Dawn Departs is 15.4:1.

A change between the papers MUST move paper and ink together. A surface MUST NOT show new paper under old ink, or the reverse. On the engraved plate, the change is a front that crosses the sheet: each point is one paper or the other, with no mixed middle colour.

Values mirrored outside the token build MUST cite the token they mirror. This covers GPU shader constants, which cannot read CSS. Today that is `DAWN_LIGHT_RGB` and `DAWN_DEPARTS_RGB` in `@kiruk/burin`'s `paper.ts`, and `INK_RGB` and `INK_NEW_RGB` in `renderer.ts`.

#### Scenario: Pair present with meanings

- GIVEN `core.json` is parsed
- WHEN `color.dawn` is inspected
- THEN it contains `light`, `departs`, `iron-gall` and `navy`, each with a non-empty `$description`

#### Scenario: Paper drifts saturated

- GIVEN a proposal setting `color.dawn.departs` to `#00FFFF`, which is OKLCH chroma 0.15
- WHEN it is validated
- THEN it fails, citing the chroma ≤ 0.08 limit for dawn papers

#### Scenario: Ink crosses papers

- GIVEN a surface rendering on `color.dawn.departs`
- WHEN its text resolves to `color.dawn.iron-gall`
- THEN review rejects it: new paper takes navy ink

### Requirement: Rubric is for measure

`core.json` MUST declare `color.dawn.rubric` (`#983A22`) and `color.dawn.rubric-line` (`#B5462B`). This is the rubricator's red of the old plates. `rubric` is for type: plate numbers, measure labels and figure numerals. It holds ≥ 4.5:1 on both papers (5.5:1 on Dawn Light, 6.5:1 on Dawn Departs). `rubric-line` is for rules: guides, scales, leader lines and the selected state's border. It is used for strokes, never for text.

Rubric MUST NOT be used for body copy, backgrounds or large fills. In a drawing, it marks what the hand measured, not what it drew.

#### Scenario: Rubric as body text rejected

- GIVEN a paragraph style resolving its colour to `color.dawn.rubric`
- WHEN reviewed against this spec
- THEN it is rejected: rubric is for measure and numbering, body copy takes the paper's ink

## MODIFIED Requirements

### Requirement: Absurd-color asset boundary

Saturated "absurd" colors MUST be defined in a dedicated token group (e.g. `color.absurd.*`) that is reserved for **assets and illustrations only**. They are never used for page chrome, body text, borders or UI surfaces. Semantic UI tokens MUST resolve only to the monochrome base. This keeps the interface mono (white paper and black stroke) while letting absurd-coloured objects blend the digital and the physical.

There is one scoped exception. A `color.sheet.*` semantic group MAY resolve to `color.dawn.*`, for surfaces that are drawn as paper: an engraved plate, its instrument, and sheets in the same family. Those surfaces choose old paper or new as a pair (see "Dawn paper pair"). `color.sheet.*` MUST NOT be used for general UI chrome such as app shells, forms, navigation or portal screens, which stay on the monochrome base.

#### Scenario: Absurd color used in UI chrome rejected

- GIVEN a semantic or component token whose `$value` references `color.absurd.*`
- WHEN the token build or brand-CI audits semantic/component tokens
- THEN it fails, citing that absurd colors are asset-only
- AND the fix is to resolve UI tokens to the monochrome base

#### Scenario: Absurd color on an asset allowed

- GIVEN an illustration/asset token or component referencing `color.absurd.*`
- WHEN audited
- THEN it passes, because the absurd group is scoped to assets/illustrations

#### Scenario: Sheet tokens on a plate allowed

- GIVEN the studio plate's page styles resolving paper and ink through `color.sheet.old.*` or `color.sheet.new.*`
- WHEN audited
- THEN it passes, because the plate is a surface drawn as paper

#### Scenario: Sheet tokens on app chrome rejected

- GIVEN a portal form or navigation component resolving its background to `color.sheet.new.paper`
- WHEN reviewed against this spec
- THEN it is rejected, and the fix is the monochrome base (`color.bg`, `color.fg`)
