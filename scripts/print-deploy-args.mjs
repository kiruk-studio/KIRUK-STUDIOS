#!/usr/bin/env node
/** Print deploy args JSON for MCP handoff (stdout, UTF-8). */
import { readFileSync } from 'node:fs';

const path =
  process.argv[2] ??
  new URL('../.deploy-invoke-args.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

let raw = readFileSync(path, 'utf8');
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
process.stdout.write(raw);
