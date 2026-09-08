#!/usr/bin/env node
/**
 * doctor.mjs — single-command repo health check.
 *
 * Reports the live state of the kiruk operating system:
 *   - Node + pnpm versions vs pinned engines
 *   - OpenSpec validation (strict)
 *   - Capability registration drift (specs/ vs openspec/project.md)
 *   - Devlog cadence (build-in-public spec: ≥1 every 14 days)
 *   - Scribble manifest coverage (pen-and-paper spec)
 *   - Open OpenSpec change proposals
 *   - Idea log entries with scribble:null pending promotion
 *
 * Usage: pnpm doctor   (or)   node scripts/doctor.mjs
 *
 * Exit codes:
 *   0  — all checks pass
 *   1  — one or more checks failed
 *   2  — unexpected error
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

let failures = 0;
let warnings = 0;

const ICON = { ok: '✓', warn: '!', fail: '✗', info: '·' };

function line(status, label, detail = '') {
  const icon = ICON[status] || '·';
  const tag = status.toUpperCase().padEnd(4);
  console.log(`  ${icon} ${tag} ${label}${detail ? '  →  ' + detail : ''}`);
  if (status === 'fail') failures++;
  if (status === 'warn') warnings++;
}

function section(title) {
  console.log(`\n${title}`);
  console.log('─'.repeat(Math.max(40, title.length)));
}

function tryRead(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function tryExec(cmd) {
  try {
    return {
      ok: true,
      out: execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
    };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') + String(e.message) };
  }
}

// ──────────────────────────────────────────────────────────────
section('Toolchain');

const pkgJson = JSON.parse(tryRead(path.join(repoRoot, 'package.json')) || '{}');
const engines = pkgJson.engines || {};

const nodeV = process.versions.node;
const nodeOk = !engines.node || satisfiesMajor(nodeV, engines.node);
line(nodeOk ? 'ok' : 'fail', `Node ${nodeV}`, engines.node ? `pinned ${engines.node}` : 'no pin');

const pnpmRes = tryExec('pnpm --version');
if (pnpmRes.ok) {
  const pnpmOk = !engines.pnpm || satisfiesMajor(pnpmRes.out, engines.pnpm);
  line(
    pnpmOk ? 'ok' : 'warn',
    `pnpm ${pnpmRes.out}`,
    engines.pnpm ? `pinned ${engines.pnpm}` : 'no pin',
  );
} else {
  line('warn', 'pnpm', 'not installed in PATH (npm is OK for spec work)');
}

function satisfiesMajor(actual, range) {
  const m = String(range).match(/(\d+)/);
  if (!m) return true;
  const min = parseInt(m[1], 10);
  const cur = parseInt(String(actual).split('.')[0], 10);
  return cur >= min;
}

// ──────────────────────────────────────────────────────────────
section('OpenSpec — strict validation');

const validateRes = tryExec('npx --no-install openspec validate --all --strict');
if (validateRes.ok) {
  line('ok', 'all specs valid');
} else {
  const summary = validateRes.out.split('\n').filter(Boolean).slice(0, 6).join(' | ');
  line('fail', 'openspec validate --strict failed', summary || 'see output above');
}

// ──────────────────────────────────────────────────────────────
section('Capability registration — specs/ vs project.md');

const specsDir = path.join(repoRoot, 'openspec', 'specs');
const projectMd = tryRead(path.join(repoRoot, 'openspec', 'project.md')) || '';
const onDisk = fs.existsSync(specsDir)
  ? fs.readdirSync(specsDir).filter((d) => {
      if (d.startsWith('_')) return false; // _template etc.
      const p = path.join(specsDir, d);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'spec.md'));
    })
  : [];
const missingFromProject = onDisk.filter((cap) => !projectMd.includes('`' + cap + '`'));
if (missingFromProject.length === 0) {
  line('ok', `${onDisk.length} capabilities registered in project.md`);
} else {
  line('warn', `missing from openspec/project.md`, missingFromProject.join(', '));
}

// ──────────────────────────────────────────────────────────────
section('Devlog cadence — build-in-public spec');

const devlogsDir = path.join(repoRoot, 'content', 'devlogs');
const devlogFiles = fs.existsSync(devlogsDir)
  ? fs
      .readdirSync(devlogsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.mdx?$/.test(f))
      .sort()
  : [];
// build-in-public spec: no fixed cadence floor — publish when there's material
// progress. Report days-since as INFO only; never warn/fail/block on an interval.
if (devlogFiles.length === 0) {
  line(
    'info',
    'no devlog entries yet',
    'publish when there is material progress (no fixed cadence)',
  );
} else {
  const last = devlogFiles[devlogFiles.length - 1];
  const lastDate = new Date(last.slice(0, 10));
  const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  line('info', `last devlog: ${last}`, `${daysSince} day(s) ago`);
}

// ──────────────────────────────────────────────────────────────
section('Scribble coverage — pen-and-paper spec');

const scribbleParents = [
  path.join(repoRoot, 'kiruk-projects'),
  path.join(repoRoot, 'kiruk-ism'),
  path.join(repoRoot, 'kiruk-projects', '_products'),
];

let scribbleProblems = 0;
for (const parent of scribbleParents) {
  if (!fs.existsSync(parent)) continue;
  for (const entry of fs.readdirSync(parent)) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue;
    const sub = path.join(parent, entry);
    if (!fs.statSync(sub).isDirectory()) continue;
    const scribbleDir = path.join(sub, 'scribble');
    const hasFolder = fs.existsSync(scribbleDir);
    const hasContent =
      hasFolder &&
      fs.readdirSync(scribbleDir).some((f) => !f.startsWith('.') && f !== 'manifest.md');
    if (!hasFolder || !hasContent) {
      line('warn', `${path.relative(repoRoot, sub)}/scribble/`, hasFolder ? 'empty' : 'missing');
      scribbleProblems++;
    }
  }
}
if (scribbleProblems === 0) {
  line('ok', 'every universe/ISM/product folder has scribble content');
}

// ──────────────────────────────────────────────────────────────
section('Open OpenSpec proposals');

const changesDir = path.join(repoRoot, 'openspec', 'changes');
const openChanges = fs.existsSync(changesDir)
  ? fs.readdirSync(changesDir).filter((f) => !f.startsWith('.'))
  : [];
if (openChanges.length === 0) {
  line('ok', 'no open proposals');
} else {
  line('info', `${openChanges.length} open proposal(s)`, openChanges.join(', '));
  for (const slug of openChanges) {
    const proposalP = path.join(changesDir, slug, 'proposal.md');
    if (!fs.existsSync(proposalP)) {
      line('fail', `${slug}/proposal.md missing`);
    }
  }
}

// ──────────────────────────────────────────────────────────────
section('Idea log — promotion readiness');

const logPath = path.join(repoRoot, 'ideas', 'log.ndjson');
const logRaw = tryRead(logPath) || '';
const entries = logRaw
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
const withScribble = entries.filter((e) => e.scribble != null).length;
line('info', `${entries.length} log entries`, `${withScribble} carry a scribble reference`);

// ──────────────────────────────────────────────────────────────
section('Summary');

console.log(
  `\n  ${failures === 0 ? ICON.ok : ICON.fail} ${failures} failure(s), ${warnings} warning(s)`,
);
process.exit(failures > 0 ? 1 : 0);
