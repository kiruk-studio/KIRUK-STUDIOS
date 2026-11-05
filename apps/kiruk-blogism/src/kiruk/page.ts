import type { BlogismCollection } from './types';
import { COLLECTIONS } from './types';

export function isCollection(value: unknown): value is BlogismCollection {
  return typeof value === 'string' && (COLLECTIONS as readonly string[]).includes(value);
}

export function isSafeSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function todayStamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function needsQuote(value: string): boolean {
  return /[:#[\]"']/.test(value) || /^\s|\s$/.test(value) || value === '';
}

function scalar(value: unknown): string {
  if (typeof value === 'string') {
    return needsQuote(value) ? JSON.stringify(value) : value;
  }
  return String(value);
}

export function serializeFrontmatter(fm: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value ? 'true' : 'false'}`);
      continue;
    }
    lines.push(`${key}: ${scalar(value)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

export function nextInkId(fileNames: readonly string[]): string {
  const nums = fileNames
    .map((name) => name.match(/^ink-(\d+)\.(json|svg)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value));
  const n = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `ink-${String(n).padStart(2, '0')}`;
}

export function contentPath(collection: BlogismCollection, slug: string): string {
  return `content/${collection}/${slug}.mdx`;
}

export function inkPublicDir(collection: BlogismCollection, slug: string): string {
  return `public/${collection}/${slug}`;
}

export function inkPublicSrc(collection: BlogismCollection, slug: string, inkId: string): string {
  return `/${collection}/${slug}/${inkId}.svg`;
}
