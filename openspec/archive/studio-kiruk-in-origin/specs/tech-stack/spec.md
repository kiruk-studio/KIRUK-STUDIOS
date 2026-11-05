# Delta: tech-stack

## MODIFIED Requirements

### Requirement: kiruk-web public origin

`kiruk-web` MUST ship at `https://studio.kiruk.in` with Astro `site: 'https://studio.kiruk.in'` and `base: '/'`. Internal links, asset URLs, and route definitions MUST go through the base-path helper so a later apex domain (`kiruk.studio`) is a single config change plus a link audit. The personal portfolio at `https://kiruk.in` is a separate app and MUST NOT host the public studio. The path `kiruk.in/studio` MUST NOT be the public studio origin (it MAY remain the personal site’s private authoring UI).

#### Scenario: Internal link is origin-root

- GIVEN the home page links to the process-log route
- WHEN the site is built with `base: '/'`
- THEN the emitted href is `/devlog`, not `/studio/devlog`

#### Scenario: Base path is config-localized

- GIVEN a future move to an apex domain
- WHEN `site`/`base` are updated in `astro.config.mjs`
- THEN no hardcoded `/studio` prefixes remain scattered in component source

#### Scenario: Person and studio stay on separate hosts

- GIVEN kiruk-web is the public studio
- WHEN a visitor opens the studio origin
- THEN the host is `studio.kiruk.in`
- AND `kiruk.in` remains the personal portfolio
