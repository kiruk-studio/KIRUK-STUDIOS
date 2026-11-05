#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'apps/kiruk-web/dist');
const prefix = 'apps/kiruk-web/';

const vercelJson = {
  version: 2,
  buildCommand: '',
  installCommand: '',
  framework: null,
  outputDirectory: '.',
};

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const rels = outIdx === -1 ? argv : argv.slice(0, outIdx);
if (rels.length === 0) {
  console.error('Usage: node scripts/build-cumulative-deploy.mjs <rel-path> [...] [--out path]');
  process.exit(1);
}

const BINARY = new Set(['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);

const files = rels.map((rel) => {
  if (rel === 'vercel.json') {
    return { file: `${prefix}vercel.json`, data: JSON.stringify(vercelJson, null, 2) };
  }
  const abs = join(dist, rel);
  const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
  if (BINARY.has(ext)) {
    return {
      file: `${prefix}${rel.replace(/\\/g, '/')}`,
      data: readFileSync(abs).toString('base64'),
      encoding: 'base64',
    };
  }
  return { file: `${prefix}${rel.replace(/\\/g, '/')}`, data: readFileSync(abs, 'utf8') };
});

const body = {
  target: 'production',
  name: 'kiruk-web',
  teamId: 'team_nGFSAbgN5NUv6u0BklsfTx8A',
  projectSettings: {
    framework: null,
    installCommand: null,
    buildCommand: null,
    outputDirectory: null,
    rootDirectory: null,
  },
  files,
};

const out = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : join(root, '.deploy-cumulative.json');

writeFileSync(out, JSON.stringify(body));
const bytes = Buffer.byteLength(JSON.stringify(body));
console.log(JSON.stringify({ out, bytes, files: files.map((f) => f.file) }, null, 2));
