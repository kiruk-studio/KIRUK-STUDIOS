#!/usr/bin/env node
/**
 * new-outline.mjs — emit a drawing template + spec sheet for one mark.
 *
 * This is the "outline" half of the loop: Claude generates the frame, Arun draws
 * inside it, and process-assets.mjs turns the result into a component.
 *
 * Usage:
 *   node scripts/new-outline.mjs frame.box
 *   node scripts/new-outline.mjs --all
 *
 * spec-link: packages/kirukal/README.md#the-loop
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest/marks.json'), 'utf8'));

/** Guides are magenta so they are unmistakable against graphite, and stripped on import. */
const GUIDE = '#FF00FF';
/** Baseline brush: 6 units at a 512 canvas, i.e. ~2px rendered — matches stroke.base. */
const BRUSH_AT_512 = 6;

function familyOf(id) {
  const family = id.split('.')[0];
  const spec = manifest.families[family];
  if (!spec) throw new Error(`unknown family "${family}" for mark "${id}"`);
  return { family, spec };
}

function templateSvg(id, spec) {
  const [w, h] = spec.viewBox;
  const safe = spec.safeArea ?? 0;
  const brush = +(BRUSH_AT_512 * (Math.min(w, h) / 512)).toFixed(2);
  const tick = Math.round(Math.min(w, h) * 0.04);

  const guides = [];

  // Registration ticks — process-assets.mjs snaps the viewBox to these, so the
  // mark lands in the same coordinate space it was drawn in.
  for (const [cx, cy] of [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ]) {
    guides.push(
      `    <path d="M ${cx} ${cy} h ${cx === 0 ? tick : -tick}" />`,
      `    <path d="M ${cx} ${cy} v ${cy === 0 ? tick : -tick}" />`,
    );
  }

  if (safe > 0) {
    guides.push(
      `    <rect x="${safe}" y="${safe}" width="${w - safe * 2}" height="${h - safe * 2}" fill="none" stroke-dasharray="8 8" />`,
    );
  }

  if (spec.nineSlice && spec.slice) {
    const [a, b] = spec.slice;
    guides.push('    <!-- 9-slice bands: corners outside, tileable edges between -->');
    for (const x of [a, b]) guides.push(`    <path d="M ${x} 0 V ${h}" stroke-dasharray="4 10" />`);
    for (const y of [a, b]) guides.push(`    <path d="M 0 ${y} H ${w}" stroke-dasharray="4 10" />`);
  }

  // Brush calibration swatch, drawn at the exact baseline weight.
  guides.push(
    `    <path d="M ${Math.round(w * 0.08)} ${h + 28} h ${Math.round(w * 0.18)}" stroke-width="${brush}" stroke-dasharray="none" />`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 56}" width="${w}" height="${h + 56}">
  <!--
    kiruk drawing template — ${id}
    Draw INSIDE this frame. Everything in #guides is stripped on import, so you
    never need to hide or delete a layer.
    Brush: ${brush} units (the swatch below the frame is exactly this weight).
    Colour: pure black on transparent. Import rewrites it to currentColor.
  -->
  <g id="guides" data-kirukal="guide" stroke="${GUIDE}" stroke-width="1" fill="none" opacity="0.85">
${guides.join('\n')}
  </g>
  <g id="artwork" data-kirukal="artwork">
    <!-- your strokes go here -->
  </g>
</svg>
`;
}

function sheetMd(id, entry, family, spec) {
  const [w, h] = spec.viewBox;
  const brush = +(BRUSH_AT_512 * (Math.min(w, h) / 512)).toFixed(2);
  const tileRule = spec.nineSlice
    ? `\n## The one rule that breaks frames\n\n**The line must leave the middle band at the same height on both ends.** If the\nleft end of the top edge exits at y=40 and the right end exits at y=52, the tiled\nedge will visibly step when the frame is stretched. \`assets:build\` checks this\nand fails with the exact pixel delta.\n`
    : spec.tileable
      ? `\n## Tiling\n\nThis mark repeats. Its left and right ends must meet at the same height, or the\nseam will show. \`assets:build\` checks this.\n`
      : '';

  return `# ${id}

${entry.note ? `> ${entry.note}\n` : ''}
| | |
| --- | --- |
| Family | \`${family}\` |
| Canvas | ${w} × ${h} units (1 unit = 1px at 1×) |
| Brush | **${brush} units** — the swatch under the frame is this weight |
| Safe area | ${spec.safeArea ?? 0} units inset |
| Takes wanted | **${entry.takes}** |
| Render tier | ${entry.tier} |
| Used by | ${entry.usedBy.join(', ')} |

## Draw ${entry.takes} take${entry.takes === 1 ? '' : 's'}

Not ${entry.takes} attempts at one perfect line — ${entry.takes} honest draws of the
same mark. The variation between them is the material: it is what lets the system
synthesize a living line instead of stamping one copy everywhere.

Save as \`${id}.v01.svg\`, \`${id}.v02.svg\`, … in
\`packages/kirukal/assets/source/${family}/\`. **Append only** — a redraw is a new
\`vNN\`, never an overwrite, so the trail of how the mark evolved survives.
${tileRule}
## Before you start

- Pure black on transparent. Import rewrites to \`currentColor\` so tokens drive the colour.
- Draw with the tablet, not a mouse — pressure and tilt are the whole point, and a
  mouse-drawn mark records a flat 0.5 pressure throughout.
- Stay inside the safe area unless the mark is deliberately meant to bleed.
- Do not hide or delete the guides layer. It is stripped automatically.

## Check it reads at the small end

${entry.usedBy.includes('*') ? 'This mark appears on every interactive component.' : `Appears in: ${entry.usedBy.join(', ')}.`}
Squint at it around 16px. If the character disappears at that size, simplify the
mark rather than thickening the line — the stroke weight is a fixed token and
will not thicken to rescue a busy shape.
`;
}

async function emit(id) {
  const entry = manifest.marks[id];
  if (!entry) throw new Error(`unknown mark "${id}" — see manifest/marks.json`);
  const { family, spec } = familyOf(id);

  const dir = path.join(root, 'assets/templates', family);
  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(path.join(root, 'assets/source', family), { recursive: true });

  await fs.writeFile(path.join(dir, `${id}.template.svg`), templateSvg(id, spec), 'utf8');
  await fs.writeFile(path.join(dir, `${id}.sheet.md`), sheetMd(id, entry, family, spec), 'utf8');
  return `${family}/${id}`;
}

/**
 * Contact sheet — every template on one page. The marks are a set, and it is far
 * easier to spot an odd canvas or a missing guide by scanning all 44 together
 * than by opening them one at a time.
 */
async function writeContactSheet(ids) {
  const cards = [];
  for (const id of [...ids].sort()) {
    const family = id.split('.')[0];
    const file = path.join(root, 'assets/templates', family, `${id}.template.svg`);
    const svg = await fs.readFile(file, 'utf8');
    cards.push(
      `<figure><div class="s">${svg.slice(svg.indexOf('<svg'))}</div><figcaption>${id}</figcaption></figure>`,
    );
  }
  const html = `<!doctype html><meta charset=utf-8><title>kiruk drawing templates</title>
<style>
body{font:13px ui-sans-serif,system-ui;margin:24px;background:#fff;color:#0a0a0a}
h1{font-size:18px;font-weight:600;margin:0}
p{color:#6b6b6b}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-top:20px}
figure{margin:0}
.s svg{width:100%;height:auto;display:block;border:1px solid #e5e5e5}
figcaption{margin-top:6px;font-size:11px;color:#6b6b6b;font-family:ui-monospace,monospace}
</style>
<h1>kiruk drawing templates — ${cards.length} marks</h1>
<p>Magenta is the guide layer, stripped on import. The short bar under each frame is the baseline brush weight.</p>
<div class=grid>${cards.join('')}</div>
`;
  await fs.writeFile(path.join(root, 'assets/templates/_contact-sheet.html'), html, 'utf8');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: new-outline.mjs <mark-id> | --all');
  process.exit(1);
}

const ids = args[0] === '--all' ? Object.keys(manifest.marks) : args;
const done = [];
for (const id of ids) done.push(await emit(id));

console.log(
  `[kirukal] emitted ${done.length} template${done.length === 1 ? '' : 's'} → assets/templates/`,
);
if (ids.length > 1) await writeContactSheet(ids);
if (done.length <= 10) for (const d of done) console.log(`  ${d}`);
else console.log('  contact sheet: assets/templates/_contact-sheet.html');
