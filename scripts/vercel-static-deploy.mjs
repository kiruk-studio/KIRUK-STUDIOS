/**
 * Pack Astro dist into a Vercel static deploy request and optionally
 * write chunked file lists for MCP upload.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../apps/kiruk-web/dist', import.meta.url));
const BINARY_EXT = new Set(['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    const rel = relative(DIST, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(abs, files);
      continue;
    }
    const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
    if (BINARY_EXT.has(ext)) {
      files.push({ file: rel, data: readFileSync(abs).toString('base64'), encoding: 'base64' });
    } else {
      files.push({ file: rel, data: readFileSync(abs, 'utf8') });
    }
  }
  return files;
}

const files = walk(DIST);
const body = {
  target: 'production',
  name: 'kiruk-web',
  teamId: 'team_nGFSAbgN5NUv6u0BklsfTx8A',
  files,
  projectSettings: {
    framework: null,
    installCommand: null,
    buildCommand: null,
    outputDirectory: null,
    rootDirectory: null,
  },
};

const out = process.argv[2] ?? '.vercel-static-deploy.json';
writeFileSync(out, JSON.stringify(body));
console.log(JSON.stringify({ count: files.length, bytes: Buffer.byteLength(JSON.stringify(body)), files: files.map((f) => f.file) }, null, 2));
