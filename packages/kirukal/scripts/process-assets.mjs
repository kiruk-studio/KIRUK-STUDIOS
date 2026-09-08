#!/usr/bin/env node
/**
 * process-assets.mjs — turn drawn SVGs into shippable assets.
 *
 * Reads assets/source/<family>/<id>.vNN.svg, strips guides, normalizes,
 * optimizes, validates, and emits assets/build/ + src/skin/frames.css.
 *
 * Variant counts are DATA, not code: whatever vNN files exist on disk become the
 * count. Adding a redraw is an asset-only commit — no token, spec or component
 * change, which is what keeps the 110-file target from being a blocker.
 *
 * Usage: node scripts/process-assets.mjs [--strict]
 * spec-link: packages/kirukal/README.md#the-loop
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest/marks.json'), 'utf8'));

const MAX_URI_BYTES = 4096;
const MAX_CSS_BYTES = 60 * 1024;

const problems = [];
const warnings = [];

/**
 * SVGO config. `removeUnknownsAndDefaults` strips `vector-effect` by default,
 * which would silently break the non-scaling-stroke guarantee that keeps a drawn
 * edge the same weight at every size — so it is explicitly preserved.
 */
const svgoConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // removeViewBox is disabled below as its own entry — in SVGO 4 it is
          // not a preset-default override and configuring it here is ignored.
          convertPathData: { floatPrecision: 2 },
          cleanupNumericValues: { floatPrecision: 2 },
          removeUnknownsAndDefaults: { keepDataAttrs: false, keepAriaAttrs: true },
        },
      },
    },
    { name: 'removeViewBox', active: false },
    { name: 'removeDimensions' },
  ],
};

/** Drop the guides layer so Arun never has to hide or delete it himself. */
function stripGuides(svg) {
  return svg
    .replace(/<g[^>]*data-kirukal="guide"[\s\S]*?<\/g>/g, '')
    .replace(/<g[^>]*id="guides"[\s\S]*?<\/g>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Colour and stroke normalization, so tokens drive appearance. */
function normalize(svg) {
  return svg
    .replace(/(fill|stroke)="#0{3,6}"/gi, '$1="currentColor"')
    .replace(/(fill|stroke)="black"/gi, '$1="currentColor"')
    .replace(
      /<(path|line|polyline|circle|ellipse|rect)\b(?![^>]*vector-effect)/g,
      '<$1 vector-effect="non-scaling-stroke"',
    );
}

/**
 * Snap the output viewBox to the family's declared drawing box.
 *
 * Templates render taller than the mark: a brush-calibration swatch sits below
 * the frame. Keeping that strip would pad every mark with empty space and throw
 * off centring, so the asset is cropped back to the box it was drawn in.
 */
function snapViewBox(svg, spec) {
  const [w, h] = spec.viewBox;
  return svg.replace(/viewBox="[^"]*"/, `viewBox="0 0 ${w} ${h}"`);
}

function parseViewBox(svg) {
  const m = svg.match(/viewBox="([\d.\-\s]+)"/);
  if (!m) return null;
  const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}

/**
 * Tileability: a 9-slice edge must exit the middle band at the same offset on
 * both ends, or the tiled edge visibly steps when stretched. This is the single
 * most common way a drawn frame goes wrong, so it fails loudly with the delta.
 */
function checkTileability(id, svg, spec) {
  if (!spec.nineSlice && !spec.tileable) return;
  const vb = parseViewBox(svg);
  if (!vb) {
    problems.push(`${id}: no viewBox after processing`);
    return;
  }
  const ds = [...svg.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
  if (ds.length === 0) {
    problems.push(`${id}: no path data found — is the artwork inside <g id="artwork">?`);
    return;
  }
  const nums = ds.join(' ').match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) return;
  const ys = [];
  for (let i = 1; i < nums.length; i += 2) ys.push(Number(nums[i]));
  const delta = Math.abs(ys[0] - ys[ys.length - 1]);
  if (delta > 2) {
    const msg = `${id}: edge ends differ by ${delta.toFixed(1)} units — the tiled edge will step. Redraw so the line exits the middle band at the same height on both ends.`;
    (STRICT ? problems : warnings).push(msg);
  }
}

function encodeDataUri(svg) {
  // Percent-encoding costs ~10% vs base64's ~33%.
  const compact = svg.replace(/\s+/g, ' ').trim();
  const encoded = compact
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/"/g, "'");
  return `url("data:image/svg+xml,${encoded}")`;
}

async function listVariants(family, id) {
  const dir = path.join(root, 'assets/source', family);
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  return entries
    .filter((f) => f.startsWith(`${id}.v`) && f.endsWith('.svg'))
    .sort()
    .map((f) => path.join(dir, f));
}

const cssLines = [];
const counts = {};
let processed = 0;
let missing = 0;

for (const [id, entry] of Object.entries(manifest.marks)) {
  const family = id.split('.')[0];
  const spec = manifest.families[family];
  const variants = await listVariants(family, id);

  if (variants.length === 0) {
    missing++;
    continue;
  }

  const outDir = path.join(root, 'assets/build', family);
  await fs.mkdir(outDir, { recursive: true });

  let n = 0;
  for (const file of variants) {
    const raw = await fs.readFile(file, 'utf8');
    const cleaned = normalize(stripGuides(raw));
    const { data: optimized } = optimize(cleaned, { ...svgoConfig, path: file });
    const data = snapViewBox(optimized, spec);

    checkTileability(id, data, spec);

    n++;
    const outFile = path.join(outDir, `${id}.v${String(n).padStart(2, '0')}.svg`);
    await fs.writeFile(outFile, data, 'utf8');

    const uri = encodeDataUri(data);
    if (Buffer.byteLength(uri, 'utf8') > MAX_URI_BYTES) {
      problems.push(
        `${id} v${n}: ${Buffer.byteLength(uri, 'utf8')} bytes exceeds the ${MAX_URI_BYTES}-byte budget. Simplify the path.`,
      );
    }
    cssLines.push(`  --kirukal-${id.replace('.', '-')}-${n}: ${uri};`);
    processed++;
  }

  counts[id] = n;
  cssLines.push(`  --kirukal-${id.replace('.', '-')}-count: ${n};`);

  if (n < entry.takes) {
    warnings.push(`${id}: ${n} of ${entry.takes} takes drawn`);
  }
}

// Emit the generated skin, even when empty, so the import in index.css resolves.
const css = `/**
 * GENERATED by scripts/process-assets.mjs — do not edit.
 * Marks drawn: ${processed} file${processed === 1 ? '' : 's'} across ${Object.keys(counts).length} mark${Object.keys(counts).length === 1 ? '' : 's'}.
 */
:root {
${cssLines.join('\n')}
}
`;
await fs.mkdir(path.join(root, 'src/skin'), { recursive: true });
await fs.writeFile(path.join(root, 'src/skin/marks.css'), css, 'utf8');

if (Buffer.byteLength(css, 'utf8') > MAX_CSS_BYTES) {
  problems.push(
    `marks.css is ${(Buffer.byteLength(css, 'utf8') / 1024).toFixed(1)} KB, over the ${MAX_CSS_BYTES / 1024} KB budget. Split core from variants.`,
  );
}

await fs.writeFile(
  path.join(root, 'manifest/counts.json'),
  `${JSON.stringify({ $comment: 'GENERATED by process-assets.mjs — variant counts are data, not tokens.', counts }, null, 2)}\n`,
  'utf8',
);

const total = Object.keys(manifest.marks).length;
console.log(
  `[kirukal] ${processed} file(s) processed · ${total - missing}/${total} marks drawn · ${missing} still to draw`,
);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const p of problems) console.error(`  FAIL  ${p}`);
if (problems.length > 0) process.exit(1);
