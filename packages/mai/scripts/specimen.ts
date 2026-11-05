/**
 * Bake the specimens into packages/mai/specimens/<name>/ (plate.png, plate.svg with a flat
 * paper tone, and close looks).
 *   node packages/mai/scripts/specimen.ts [anomalies | measure | all]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import measureSpecimen from '../plates/measure.ts';
import specimen from '../plates/specimen.ts';
import { bakePlate, cropPlate } from '../src/node/bake.ts';
import { closeBrowser } from '../src/node/raster.ts';

const here = dirname(fileURLToPath(import.meta.url));
const which = process.argv[2] ?? 'all';

if (which === 'all' || which === 'anomalies') {
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
  console.log(`anomalies: ${p.marks.length} marks → ${out}`);
}
if (which === 'all' || which === 'measure') {
  const out = join(here, '..', 'specimens', 'measure');
  mkdirSync(out, { recursive: true });
  const p = measureSpecimen();
  const baked = await bakePlate(p, out, { pxPerMm: 4, paperFile: false });
  const looks: [string, [number, number, number, number]][] = [
    ['line-types', [12, 22, 86, 46]],
    ['part', [104, 2, 96, 84]],
    ['ui-redlines', [10, 106, 92, 74]],
    ['points', [108, 106, 84, 80]],
    ['sphere', [200, 106, 76, 80]],
  ];
  for (const [name, rect] of looks)
    writeFileSync(join(out, `look-${name}.png`), await cropPlate(p, baked.paperPng, rect, 8));
  console.log(`measure: ${p.marks.length} marks → ${out}`);
}
await closeBrowser();
