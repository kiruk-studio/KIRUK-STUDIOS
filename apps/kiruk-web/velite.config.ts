import { defineCollection, defineConfig, s } from 'velite';

// spec-link: openspec/specs/content-pipeline/spec.md — Canonical entry front-matter contract
// spec-link: openspec/specs/tech-stack/spec.md — kiruk-web public origin
const deriveSchema = s
  .object({
    ig: s.boolean().default(false),
    linkedin: s.boolean().default(false),
    x: s.boolean().default(false),
    video: s.boolean().default(false),
  })
  .default({ ig: false, linkedin: false, x: false, video: false });

const devlogs = defineCollection({
  name: 'Devlog',
  pattern: 'devlogs/**/*.mdx',
  schema: s
    .object({
      title: s.string(),
      slug: s.string(),
      date: s.isodate(),
      state: s.enum(['draft', 'ready', 'published', 'archived']).default('draft'),
      tags: s.array(s.string()).default([]),
      summary: s.string().optional(),
      'eye-motif': s.string(),
      scribble: s.string(),
      derive: deriveSchema,
      body: s.markdown(),
    })
    .transform((d) => ({
      ...d,
      eyeMotif: d['eye-motif'],
      url: `/devlog/${d.slug}`,
    })),
});

export default defineConfig({
  root: '../../content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { devlogs },
});
