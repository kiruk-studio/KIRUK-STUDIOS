import { readFileSync } from 'node:fs';

const path = process.argv[2] ?? '.deploy-invoke-args.json';
let raw = readFileSync(path, 'utf8');
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
process.stdout.write(raw);
