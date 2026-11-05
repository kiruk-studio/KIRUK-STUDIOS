/**
 * Build the calculus page: mai's own numbers, charted while the engine draws.
 *
 *   node packages/mai/scripts/calculus.ts
 *
 * 1. Bundles calculus/page.ts with the engine (esbuild, one IIFE): the specimens on the page
 *    are drawn in the browser by the same code and seeds as the plates.
 * 2. Draws Plate III and Plate IV again with `trace: true` and computes their numbers: counts,
 *    the main pen's dip rhythm, and every free sample against the two-thirds power law.
 * 3. Reads each plate's committed proof (plate.svg, report.json) for the sheet and the checks.
 * 4. Writes calculus/dist/index.html (open it in a browser) and calculus/dist/artifact.html
 *    (the same page without a document shell, for publishing as an artifact).
 *
 * spec-link: packages/mai/README.md (the calculus); founder's reference
 * https://calculus-of-interfaces.vercel.app/
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import axesPlate from '../plates/axes.ts';
import volutePlate from '../plates/volute.ts';
import type { Plate } from '../src/plate/plate.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repo = resolve(root, '../..');
const out = resolve(root, 'calculus/dist');

interface Report {
  verdict: string;
  checks: { id: string; dimension: string; status: string; title: string; value: string }[];
}

/** Keep every k-th item so a series stays under `max` points. */
const thin = <T>(xs: T[], max: number) => {
  const k = Math.max(1, Math.ceil(xs.length / max));
  return xs.filter((_, i) => i % k === 0);
};
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

function plateData(p: Plate, name: string, proofDir: string) {
  const marks = p.marks;
  const counts = {
    marks: marks.length,
    samples: 0,
    inkMm: 0,
    seconds: 0,
    dips: 0,
    pools: 0,
    feathers: 0,
    catches: 0,
    spatter: 0,
    texts: p.texts.length,
    dimensions: p.dimensions.length + p.angles.length,
    constructions: p.constructions.length,
    parts: p.parts.length,
  };
  for (const m of marks) {
    counts.samples += m.trace?.s.length ?? 0;
    counts.inkMm += m.stats.length;
    counts.seconds += m.stats.duration;
    counts.dips += m.stats.dip ? 1 : 0;
    counts.pools += m.stats.pools;
    counts.feathers += m.stats.feathers;
    counts.catches += m.stats.catches;
    counts.spatter += m.stats.spatter;
  }
  // the dip rhythm of the main pen: the contour kit's instrument and ink, on the ink layer
  const kit = p.kit('contour');
  const pen = marks.filter(
    (m) => m.layer === 'ink' && m.instrument === kit.instrument && m.ink === kit.ink && m.trace,
  );
  const dx: number[] = [];
  const dl: number[] = [];
  const dips: number[] = [];
  let laid = 0;
  for (const m of pen) {
    const tr = m.trace;
    if (!tr) continue;
    if (m.stats.dip) dips.push(r4(laid / 1000));
    const n = tr.s.length;
    const step = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += step) {
      dx.push(r4((laid + (tr.s[i] as number)) / 1000));
      dl.push(r4(tr.load[i] as number));
    }
    dx.push(r4((laid + (tr.s[n - 1] as number)) / 1000));
    dl.push(r4(tr.load[n - 1] as number));
    dx.push(Number.NaN);
    dl.push(Number.NaN);
    laid += tr.s[n - 1] as number;
  }
  // the power law over every free sample: log κ against log(v / K), bound or held by the envelope
  const pts: [number, number, number][] = [];
  const roles: Record<string, [number, number]> = {};
  let n = 0;
  let bound = 0;
  for (const m of marks) {
    const tr = m.trace;
    if (!tr || !(tr.K > 0)) continue;
    for (let i = 0; i < tr.s.length; i++) {
      const k = tr.k[i] as number;
      const v = tr.v[i] as number;
      // a bend the eye can see: κ ≥ 0.001/mm; flatter is a straight run
      if (!(k >= 1e-3)) continue;
      const law = tr.K * k ** (-1 / 3);
      const b = v > 2.0001 && Math.abs(v - law) / law < 1e-6 ? 1 : 0;
      n++;
      bound += b;
      const r = roles[m.role] ?? [0, 0];
      r[0]++;
      r[1] += b;
      roles[m.role] = r;
      pts.push([r4(Math.log10(k)), r4(Math.log10(v / tr.K)), b]);
    }
  }
  const sample = thin(pts, 3600);
  const report = JSON.parse(readFileSync(resolve(proofDir, 'report.json'), 'utf8')) as Report;
  const svg = readFileSync(resolve(proofDir, 'plate.svg'), 'utf8');
  return {
    id: p.spec.id,
    name,
    svg,
    counts: {
      ...counts,
      inkMm: Math.round(counts.inkMm),
      seconds: Math.round(counts.seconds * 10) / 10,
    },
    dip: { x: dx, load: dl, dips },
    law: {
      x: sample.map((q) => q[0]),
      y: sample.map((q) => q[1]),
      bound: sample.map((q) => q[2]),
      roles,
      share: n ? bound / n : 0,
    },
    checks: report.checks.map((c) => ({
      id: c.id,
      dimension: c.dimension,
      status: c.status,
      title: c.title,
      value: c.value,
    })),
    verdict: report.verdict,
    source: `${relative(repo, resolve(root, 'plates', name === 'Plate III' ? 'volute.ts' : 'axes.ts'))} · proof ${relative(repo, proofDir)}`,
  };
}

const t0 = performance.now();
const plates = [
  plateData(
    volutePlate({ trace: true }),
    'Plate III',
    resolve(repo, 'ideas/kiruk-codex/plates/plate-03-volute/proof'),
  ),
  plateData(
    axesPlate({ trace: true }),
    'Plate IV',
    resolve(repo, 'ideas/kiruk-codex/plates/plate-04-axes/proof'),
  ),
];
const bundle = await build({
  entryPoints: [resolve(root, 'calculus/page.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  write: false,
  legalComments: 'none',
});
const js = (bundle.outputFiles[0]?.text ?? '').replace(/<\/script/gi, '<\\/script');
const data = JSON.stringify({ plates }).replace(/</g, '\\u003c');
const template = readFileSync(resolve(root, 'calculus/template.html'), 'utf8');
const body = template.split('/*__DATA__*/null').join(data).split('/*__SCRIPT__*/').join(js);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'artifact.html'), body);
writeFileSync(
  resolve(out, 'index.html'),
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
);
const kb = (s: string) => `${Math.round(Buffer.byteLength(s) / 1024)} KB`;
console.log(
  `calculus: ${plates.map((p) => `${p.name} ${p.counts.marks} strokes, ${p.counts.samples} samples`).join('; ')} · script ${kb(js)} · data ${kb(data)} · page ${kb(body)} · ${Math.round(performance.now() - t0)} ms`,
);
console.log(
  `  wrote ${relative(repo, resolve(out, 'index.html'))} and ${relative(repo, resolve(out, 'artifact.html'))}`,
);
