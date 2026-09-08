# Delta: brand-consistency-ci (MODIFIED)

## MODIFIED Requirements

### Requirement: Eye-motif coverage check (gate)

Every committed React component file under `apps/*/src/**/*.tsx`, `packages/design-system/components/**/*.tsx`, `packages/kirukal/src/**/*.tsx`, or `kiruk-projects/_products/**/*.tsx` that renders visual output MUST satisfy the eye-motif rule by ONE of: (a) importing at least one component whose name starts with `Eye` from `@kiruk/design-system` **or** `@kiruk/kirukal`; (b) including a top-of-file comment `// eye-motif: none — justified: <reason>` referencing a sibling `spec.md` paragraph; or (c) **drawing** the eye directly (shader / canvas / inline SVG) and declaring it with a top-of-file comment `// eye-motif: drawn — <ref>`.

The check matches the import **source**, so re-exporting an `Eye*` component through a different package does not satisfy it; both specifiers are accepted explicitly.

While the primary eye-mark is an unfinalized placeholder (FOUNDER*DECISIONS B1), the check enforces eye-motif **presence** as a gate but treats the \_specific mark identity* (which `Eye*` component) as **advisory** — so drawn/placeholder eyes pass until the final mark + custom wordmark (B1/B2) land.

#### Scenario: Component with a drawn eye passes

- GIVEN `apps/kiruk-web/src/components/InkHero.tsx` that renders an eye via a shader/SVG and carries `// eye-motif: drawn — sketch hero reveals the eye`
- WHEN the brand-CI runs
- THEN the gate passes on eye-motif presence

#### Scenario: Drawn component imports the mark from kirukal

- GIVEN `packages/kirukal/src/primitives/dialog/Dialog.tsx` importing `EyeMark` from `@kiruk/kirukal`
- WHEN the brand-CI runs
- THEN the gate passes

#### Scenario: New component without eye motif fails CI

- GIVEN a new file `apps/kiruk-web/src/components/Hero.tsx` rendering JSX with no `Eye*` import, no drawn-eye declaration, and no justification comment
- WHEN the brand-CI runs
- THEN the gate fails
- AND the report cites the file path and missing requirement

#### Scenario: Placeholder mark identity is advisory

- GIVEN B1 is still a placeholder
- WHEN a component satisfies eye-motif presence via a drawn or placeholder eye rather than the final mark
- THEN the identity check emits an advisory note (not a failure) to swap in the finalized mark once B1 is resolved
