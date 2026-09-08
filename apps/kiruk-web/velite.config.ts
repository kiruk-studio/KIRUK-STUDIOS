import { defineCollection, defineConfig, s } from 'velite';

// Devlog collection — reads content/devlogs/*.mdx (repo root), emits typed data to .velite/.
// Body is compiled to HTML (s.markdown) — the entries are plain markdown, no JSX.
const devlogs = defineCollection({
  name: 'Devlog',
  pattern: 'devlogs/**/*.mdx',
  schema: s
    .object({
      title: s.string(),
      slug: s.string(),
      date: s.isodate(),
      state: s.string().default('draft'),
      tags: s.array(s.string()).default([]),
      summary: s.string().optional(),
      body: s.markdown(),
    })
    .transform((d) => ({ ...d, url: `/devlog/${d.slug}` })),
});

export default defineConfig({
  root: '../../content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/studio/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { devlogs },
});
