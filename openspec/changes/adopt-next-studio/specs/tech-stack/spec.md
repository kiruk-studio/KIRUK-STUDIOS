# Delta: tech-stack (MODIFIED)

## ADDED Requirements

### Requirement: The public studio is apps/kiruk-studio on Next.js 15

The public studio at `https://studio.kiruk.in` MUST be `apps/kiruk-studio`, built on Next.js 15 (App Router) with React 19. Its deploy MUST come from Git: the Vercel project serving `studio.kiruk.in` MUST build `apps/kiruk-studio`, so a pull request gets a preview of the studio and `main` deploys it. Hand deploys MAY be used only to recover an outage, and MUST be followed by a commit that matches what was deployed. The personal portfolio at `https://kiruk.in` is a separate app and MUST NOT host the public studio, and `kiruk.in/studio` MUST NOT be the public studio origin.

#### Scenario: A pull request previews the studio

- GIVEN a pull request that changes `apps/kiruk-studio`
- WHEN Vercel builds its preview
- THEN the preview serves the Next studio, not the Astro placeholder

#### Scenario: Person and studio stay on separate hosts

- GIVEN a visitor opens the studio origin
- WHEN the page loads
- THEN the host is `studio.kiruk.in`
- AND `kiruk.in` remains the personal portfolio

## REMOVED Requirements

### Requirement: kiruk-web public origin

**Reason:** `apps/kiruk-web` no longer serves `studio.kiruk.in`; the host rules move into "The public studio is apps/kiruk-studio on Next.js 15".

**Migration:** none in code. Set the Vercel project's Root Directory to `apps/kiruk-studio`.

## MODIFIED Requirements

### Requirement: kiruk-web uses Astro 5

`apps/kiruk-web/` MUST stay on Astro 5 while it exists. It is a retired placeholder: it is not the public studio and MUST NOT be deployed to `studio.kiruk.in`. A future content-first surface (manifesto, devlogs, case studies) MAY return to it, with islands and zero-JS-by-default, through its own OpenSpec change.

#### Scenario: The placeholder is not deployed to the studio host

- GIVEN the Vercel project serving `studio.kiruk.in`
- WHEN its build settings are read
- THEN its Root Directory is not `apps/kiruk-web`

### Requirement: 3D / WebGL = Three.js r170+ + React Three Fiber 9 + TSL

WebGL and WebGPU surfaces MUST use Three.js r170 or later. Custom shaders MUST be authored in TSL (Three.js Shading Language) where possible, not raw GLSL strings, for portability and WebGPU readiness. Scene-graph React surfaces SHOULD use React Three Fiber 9 + drei + postprocessing. Engine surfaces that own their render loop (the burin engine) MAY use `three/webgpu` and `three/tsl` directly, without R3F.

**Successor:** Three.js `WebGPURenderer` becomes default when browser support crosses 90% (tracked). Until then, default is WebGL2 with WebGPU opt-in for capable devices.

#### Scenario: New shader written in TSL

- GIVEN a new shader requirement
- WHEN authored
- THEN it uses TSL nodes (e.g. `Fn`, `uniform`, `attribute`) not raw GLSL strings
- UNLESS a TSL equivalent does not exist and the GLSL fallback is documented in the component's spec

#### Scenario: An engine owns its render loop

- GIVEN `@kiruk/burin` renders the studio eye
- WHEN its dependencies are read
- THEN it uses `three/webgpu` and TSL
- AND it does not need React Three Fiber
