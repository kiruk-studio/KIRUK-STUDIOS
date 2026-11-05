import { contentPath, inkPublicSrc, serializeFrontmatter, slugify, todayStamp } from './page';
import type { BlogismCollection } from './types';

export function resolvePostSlug(title: string, fallback = 'untitled'): string {
  return slugify(title) || fallback;
}

export function buildPostMdx(input: {
  body: string;
  collection: BlogismCollection;
  draft: boolean;
  excerpt: string;
  inkSrc?: string;
  slug: string;
  title: string;
}): string {
  const frontmatter = serializeFrontmatter({
    title: input.title.trim() || input.slug,
    excerpt: input.excerpt.trim(),
    date: todayStamp(),
    draft: input.draft,
    slug: input.slug,
  });
  const parts = [input.body.trim()];
  if (input.inkSrc) {
    parts.push(`<InkPage src="${input.inkSrc}" alt="Handwritten page" />`);
  }
  return `${frontmatter}\n\n${parts.filter(Boolean).join('\n\n')}\n`;
}

export function describeWritePlan(input: {
  collection: BlogismCollection;
  inkId?: string;
  slug: string;
}): { mdx: string; json?: string; svg?: string } {
  const mdx = contentPath(input.collection, input.slug);
  if (!input.inkId) return { mdx };
  const src = inkPublicSrc(input.collection, input.slug, input.inkId);
  return {
    json: `public${src.replace(/\.svg$/, '.json')}`,
    mdx,
    svg: `public${src}`,
  };
}
