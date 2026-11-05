#!/usr/bin/env node
/**
 * Prints deploy_to_vercel arguments as compact JSON on stdout.
 * The assistant reads this output into CallDynamicTool.
 */
import { readFileSync } from 'node:fs';

const request = JSON.parse(readFileSync('.vercel-deploy-request.json', 'utf8'));
process.stdout.write(JSON.stringify(request));
