/**
 * Proof a plate module.
 *
 *   node packages/mai/scripts/proof.ts <plate-module.ts> [out-dir] [--px 5] [--strict] [--commit]
 *
 * The module's default export is a function returning a Plate (or a Promise of one).
 * Writes plate.svg, paper.png, plate.png, phone.png, crops/*.png, report.md, report.json.
 * --commit: no paper.png (regenerable, heavy); the SVG carries a flat paper tone instead.
 * Exit code: 0 pass or warn, 1 fail (with --strict, warn fails too).
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { proofPlate } from '../src/node/proof.ts';
import { closeBrowser } from '../src/node/raster.ts';
import type { Plate } from '../src/plate/plate.ts';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const pos = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] === '--px'));
const modPath = pos[0];
if (!modPath) {
  console.error(
    'usage: node packages/mai/scripts/proof.ts <plate-module.ts> [out-dir] [--px 5] [--strict]',
  );
  process.exit(2);
}
const pxIdx = args.indexOf('--px');
const px = pxIdx >= 0 ? Number(args[pxIdx + 1]) : 5;
const mod = (await import(pathToFileURL(resolve(modPath)).href)) as {
  default: () => Plate | Promise<Plate>;
};
const plate = await mod.default();
const out = resolve(pos[1] ?? resolve(modPath, '..', 'proof'));
const t0 = performance.now();
const { report, files } = await proofPlate(plate, out, {
  pxPerMm: px,
  paperFile: !flags.has('--commit'),
});
await closeBrowser();
const ms = Math.round(performance.now() - t0);
const fails = report.checks.filter((c) => c.status === 'fail');
const warns = report.checks.filter((c) => c.status === 'warn');
console.log(
  `${report.title} — ${report.verdict.toUpperCase()} (${report.checks.length} checks, ${fails.length} fail, ${warns.length} warn) in ${ms} ms`,
);
for (const c of [...fails, ...warns])
  console.log(
    `  ${c.status.toUpperCase()}  ${c.dimension}  ${c.title}: ${c.value} (target ${c.target})`,
  );
console.log(`  wrote ${files.length} files to ${out}`);
process.exit(fails.length || (flags.has('--strict') && warns.length) ? 1 : 0);
