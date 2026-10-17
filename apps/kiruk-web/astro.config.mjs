// @ts-check

import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// kiruk-web — bare Astro shell while the studio is rebuilt (ideas/studio-dawn/plan.md).
// The stack is re-chosen in Phase 4; this config is a placeholder, not a lock.
export default defineConfig({
  // Public origin is studio.kiruk.in. Internal links go through src/lib/base.ts
  // so an apex domain later is config-only.
  site: 'https://studio.kiruk.in',
  base: '/',
  output: 'static',
  adapter: vercel(),
});
