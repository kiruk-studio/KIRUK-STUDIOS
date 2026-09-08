#!/usr/bin/env node
/**
 * capture-session.mjs — SessionEnd hook target + manual runner.
 *
 * Reads the Claude Code transcript pointed to by $CLAUDE_TRANSCRIPT_PATH
 * (set by the SessionEnd hook payload on stdin, per Claude Code docs) and
 * appends a single condensed JSON line to ideas/log.ndjson.
 *
 * Input: hook payload on stdin OR env:
 *   { "session_id": "...", "transcript_path": "...", "cwd": "..." }
 *
 * Spec: openspec/specs/idea-capture/spec.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const logPath = path.join(repoRoot, 'ideas/log.ndjson');

function readStdinSync() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function redact(s) {
  if (!s) return s;
  return s
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[REDACTED_API_KEY]')
    .replace(/ghp_[A-Za-z0-9]{20,}/g, '[REDACTED_GH_TOKEN]')
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED_AWS_KEY]')
    .replace(/("?(password|secret|api[_-]?key|token)"?\s*[:=]\s*)"[^"]+"/gi, '$1"[REDACTED]"');
}

function parseTranscript(tp) {
  if (!tp || !fs.existsSync(tp)) return { assistantTurns: [], userTurns: [] };
  const raw = fs.readFileSync(tp, 'utf8');
  const assistantTurns = [];
  const userTurns = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const role = obj?.message?.role ?? obj?.role;
      const content = obj?.message?.content ?? obj?.content;
      const text = Array.isArray(content)
        ? content
            .filter((c) => c?.type === 'text')
            .map((c) => c.text)
            .join('\n')
        : typeof content === 'string'
          ? content
          : '';
      if (role === 'assistant' && text) assistantTurns.push(text);
      if (role === 'user' && text) userTurns.push(text);
    } catch {
      /* skip non-JSON lines */
    }
  }
  return { assistantTurns, userTurns };
}

function condense(turns, maxLen = 400) {
  if (!turns.length) return '';
  const tail = turns.slice(-3).join(' · ');
  const clean = redact(tail).replace(/\s+/g, ' ').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen - 1) + '…' : clean;
}

function extractDecisions(assistantTurns) {
  const out = [];
  const pat =
    /(?:^|\n)\s*(?:decision|chose|picked|locked in|going with)\s*[:-]?\s*([^\n.]{5,140})/gi;
  for (const t of assistantTurns) {
    let m = pat.exec(t);
    while (m !== null) {
      out.push(redact(m[1].trim()));
      m = pat.exec(t);
    }
    if (out.length > 8) break;
  }
  return out.slice(0, 8);
}

function main() {
  const stdin = readStdinSync().trim();
  let payload = {};
  if (stdin) {
    try {
      payload = JSON.parse(stdin);
    } catch {
      /* stdin wasn't JSON */
    }
  }
  const tp = payload.transcript_path || process.env.CLAUDE_TRANSCRIPT_PATH || '';
  const sid = payload.session_id || process.env.CLAUDE_SESSION_ID || 'unknown';
  const source = process.argv.includes('--manual') ? 'manual' : 'session-end';

  const { assistantTurns, userTurns } = parseTranscript(tp);
  const scribbleArg = process.argv.find((a) => a.startsWith('--scribble='));
  const scribble = scribbleArg ? scribbleArg.split('=')[1] : null;

  const entry = {
    ts: new Date().toISOString(),
    source,
    session_id: sid,
    summary: condense(assistantTurns),
    user_intent: condense(userTurns, 200),
    decisions: extractDecisions(assistantTurns),
    files_touched: [],
    scribble,
    transcript_path: tp || null,
  };

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  console.log('[capture-session] appended', source, 'entry to ideas/log.ndjson');
  if (scribble === null) {
    console.log(
      '[capture-session] note: scribble:null → fine for exploration, required before promotion (pen-and-paper spec).',
    );
  }
}

main();
