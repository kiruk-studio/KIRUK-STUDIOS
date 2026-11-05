# Delta: template-invoice

## MODIFIED Requirements

### Requirement: Eye-brand mark

The invoice MUST render the studio's primary mark, `EyeLogogram` from `@kiruk/design-system` (the KIRUK LOGOGRAM, LIGHT variant), in the header. It MUST NOT render a secondary eye-mark such as `EyeCircle` (formerly `EyePrimary`) in its place.

#### Scenario: Eye mark present in header

- GIVEN a rendered invoice
- WHEN the header is inspected
- THEN an `EyeLogogram` render (or its referenced asset path under `packages/design-system/brand/logogram/` or `build/logos/primary-light.svg`) is present
- AND it is not an `EyePrimary` or `EyeCircle` render
