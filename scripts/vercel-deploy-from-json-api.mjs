#!/usr/bin/env node
/**
 * Deploy static files to Vercel using the REST API + VERCEL_TOKEN.
 * Usage: VERCEL_TOKEN=xxx node scripts/vercel-deploy-from-json-api.mjs .vercel-static-deploy.json
 *
 * Builds file digests via POST /v2/files, then POST /v13/deployments.
 * Requires a token from https://vercel.com/account/tokens or `vercel login`.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('Set VERCEL_TOKEN (vercel.com/account/tokens or run vercel login)');
  process.exit(1);
}

const path = process.argv[2] ?? '.vercel-static-deploy.json';
let raw = readFileSync(path, 'utf8');
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
const body = JSON.parse(raw);
const teamId = body.teamId;

async function uploadFile(entry) {
  const encoding = entry.encoding === 'base64' ? 'base64' : 'utf-8';
  const buf =
    encoding === 'base64'
      ? Buffer.from(entry.data, 'base64')
      : Buffer.from(entry.data, 'utf8');
  const digest = createHash('sha1').update(buf).digest('hex');
  const size = buf.length;
  const res = await fetch('https://api.vercel.com/v2/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'x-vercel-digest': digest,
      'x-vercel-size': String(size),
      ...(teamId ? { 'x-vercel-team-id': teamId } : {}),
    },
    body: buf,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload ${entry.file} failed ${res.status}: ${text}`);
  }
  return { file: entry.file, sha: digest, size };
}

async function main() {
  console.error(`Uploading ${body.files.length} files...`);
  const uploaded = [];
  for (const entry of body.files) {
    uploaded.push(await uploadFile(entry));
    process.stderr.write('.');
  }
  process.stderr.write('\n');

  const deploymentBody = {
    name: body.name,
    files: uploaded,
    target: body.target ?? 'production',
    projectSettings: body.projectSettings ?? {
      framework: null,
      installCommand: null,
      buildCommand: null,
      outputDirectory: null,
      rootDirectory: null,
    },
  };

  const url = new URL('https://api.vercel.com/v13/deployments');
  if (teamId) url.searchParams.set('teamId', teamId);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deploymentBody),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ id: json.id, url: json.url, readyState: json.readyState, alias: json.alias }, null, 2));
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
