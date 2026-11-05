/**
 * Bake the anomaly specimen into packages/mai/specimens/anomalies/ (plate.png, plate.svg
 * with a flat paper tone, and four close looks at 12 px/mm).
 *   node packages/mai/scripts/specimen.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import specimen from '../plates/specimen.ts';
import { bakePlate, cropPlate } from '../src/node/bake.ts';
import { closeBrowser } from '../src/node/raster.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'specimens', 'anomalies');
mkdirSync(out, { recursive: true });
const p = specimen();
const baked = await bakePlate(p, out, { pxPerMm: 4, paperFile: false });
// one close look per column of the first rows, at 12 px/mm (where a fake shows first)
const looks: [string, [number, number, number, number]][] = [
  ['pool-taper-hook', [12, 20, 40, 22]],
  ['starve', [104, 44, 40, 22]],
  ['dip-rhythm', [104, 68, 40, 22]],
  ['dry-media', [12, 116, 40, 22]],
];
for (const [name, rect] of looks)
  writeFileSync(join(out, `look-${name}.png`), await cropPlate(p, baked.paperPng, rect, 12));
await closeBrowser();
console.log(`specimen: ${p.marks.length} marks → ${out}`);
