#!/usr/bin/env node
/**
 * Bridge: read deploy args JSON from disk and call Vercel MCP deploy_to_vercel
 * via Streamable HTTP transport. Requires Cursor/Vercel MCP OAuth (same as plugin).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const argsPath =
  process.argv[2] ??
  new URL('../.deploy-invoke-args.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

let raw = readFileSync(argsPath, 'utf8');
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
const deployArgs = JSON.parse(raw);

const cursorAppRoot = 'C:/Program Files/cursor/resources/app';
const require = createRequire(pathToFileURL(`${cursorAppRoot}/package.json`));
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const {
  StreamableHTTPClientTransport,
} = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL('https://mcp.vercel.com'));
  const client = new Client({ name: 'kiruk-deploy-bridge', version: '1.0.0' });
  await client.connect(transport);
  const result = await client.callTool({
    name: 'deploy_to_vercel',
    arguments: deployArgs,
  });
  process.stdout.write(JSON.stringify(result, null, 2));
  await client.close();
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
