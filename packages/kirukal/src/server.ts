/**
 * RSC-safe / zero-JS surface.
 *
 * Everything exported here renders without client JavaScript, which is what lets
 * kiruk-web use it inside `.astro` files on static routes that must ship 0 KB JS
 * (see the per-route budgets in openspec/specs/tech-stack/spec.md).
 *
 * Anything needing Base UI state, a portal, or a ref belongs in ./index.ts
 * instead, where the files carry 'use client'.
 */

export type { GrainDefsProps } from './grain/GrainDefs';
export { GrainDefs, KIRUKAL_PAPER_FILTER_ID, PaperGround } from './grain/GrainDefs';
