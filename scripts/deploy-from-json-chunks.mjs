#!/usr/bin/env node
/**
 * Split a deploy JSON into per-file chunk files for incremental MCP deploy calls.
 * Usage: node scripts/deploy-from-json-chunks.mjs .deploy-pass1-fresh.json .deploy-chunks-out
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [src, outDir = '.deploy-chunks-out'] = process.argv.slice(2);
if (!src) {
  console.error('Usage: node scripts/deploy-from-json-chunks.mjs <deploy.json> [outDir]');
  process.exit(1);
}

const base = JSON.parse(readFileSync(src, 'utf8'));
mkdirSync(outDir, { recursive: true });

const meta = {
  target: base.target,
  name: base.name,
  teamId: base.teamId,
  projectSettings: base.projectSettings,
};

writeFileSync(join(outDir, 'meta.json'), JSON.stringify(meta));

const cumulative = [];
for (let i = 0; i < base.files.length; i++) {
  cumulative.push(base.files[i]);
  const payload = { ...meta, files: [...cumulative] };
  const out = join(outDir, `step-${String(i).padStart(2, '0')}.json`);
  writeFileSync(out, JSON.stringify(payload));
  console.log(JSON.stringify({ step: i, file: base.files[i].file, bytes: Buffer.byteLength(JSON.stringify(payload)), out }));
}
