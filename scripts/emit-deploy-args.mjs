#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/emit-deploy-args.mjs <deploy-args.json> [out.json]');
  process.exit(1);
}
let raw = readFileSync(src, 'utf8');
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
const args = JSON.parse(raw);
const out = process.argv[3] ?? src;
writeFileSync(out, JSON.stringify(args));
console.log(JSON.stringify({ out, files: args.files?.length ?? 0, bytes: Buffer.byteLength(JSON.stringify(args)) }));
