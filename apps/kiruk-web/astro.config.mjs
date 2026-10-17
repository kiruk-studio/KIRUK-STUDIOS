// @ts-check

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { scribbleWriter } from './integrations/scribble-writer.mjs';

// kiruk-web — Astro 5 island architecture. Stack locked in openspec/specs/tech-stack/spec.md.
export default defineConfig({
  // Public origin is studio.kiruk.in (tech-stack: "kiruk-web public origin").
  // Internal links go through src/lib/base.ts so an apex domain later is config-only.
  site: 'https://studio.kiruk.in',
  base: '/',
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    // scribbleWriter is dev-only (apply: 'serve') — backs the ScribbleDesk "Live" button.
    plugins: [tailwindcss(), scribbleWriter()],
  },
});
