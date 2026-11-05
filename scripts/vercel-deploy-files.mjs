/**
 * Collect monorepo source files for Vercel MCP deploy_to_vercel.
 * Excludes node_modules, build artifacts, and gitignored generated dirs.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.astro',
  'dist',
  '.velite',
  'build',
  '.next',
  '.vercel',
]);

const INCLUDE_PREFIXES = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json',
  '.nvmrc',
  '.node-version',
  'scripts/build-tokens.mjs',
  'packages/design-system/',
  'apps/kiruk-web/',
  'content/',
];

const SKIP_FILES = [/\.tsbuildinfo$/];

function shouldInclude(relPath) {
  if (SKIP_FILES.some((re) => re.test(relPath))) return false;
  return INCLUDE_PREFIXES.some((prefix) => relPath === prefix || relPath.startsWith(prefix));
}

const BINARY_EXT = new Set(['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);

function readFileEntry(absPath, relPath) {
  const ext = relPath.slice(relPath.lastIndexOf('.')).toLowerCase();
  if (BINARY_EXT.has(ext)) {
    return {
      file: relPath,
      data: readFileSync(absPath).toString('base64'),
      encoding: 'base64',
    };
  }
  return { file: relPath, data: readFileSync(absPath, 'utf8') };
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.nvmrc' && entry.name !== '.node-version') {
      if (entry.isDirectory()) continue;
    }
    const abs = join(dir, entry.name);
    const rel = relative(ROOT, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(abs, files);
      continue;
    }
    if (shouldInclude(rel)) files.push(readFileEntry(abs, rel));
  }
  return files;
}

const files = walk(ROOT).sort();
const payload = files;

import { writeFileSync } from 'node:fs';
const outPath = process.argv[2];
const result = { count: payload.length, files: payload };
if (outPath) {
  writeFileSync(outPath, JSON.stringify(result));
  console.log(`Wrote ${payload.length} files to ${outPath}`);
} else {
  process.stdout.write(JSON.stringify(result));
}
