/**
 * Dev-only Vite middleware behind the ScribbleDesk **Live** button.
 *
 * POST /__scribble/save?sheet=<id>  →  writes src/scribbles/<id>.json
 *
 * `apply: 'serve'` means this never exists in a production build — the public
 * site only ever reads the committed JSON. Astro sees the file change and
 * reloads the page, so the handwriting is baked in the moment it is written.
 *
 * Format: v2 is a grease-pencil scene (camera + layers of strokes). v1 flat
 * sheets are still accepted and are lifted into a single layer on save, so an
 * older sheet migrates the first time it is touched and never loses a stroke.
 *
 * spec-link: openspec/specs/pen-and-paper/spec.md#requirement-grease-pencil-scene
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../src/scribbles/', import.meta.url));
const SHEET_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const LAYER_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_BYTES = 8 * 1024 * 1024;
const TOOLS = new Set(['pen', 'pencil']);
const FACINGS = new Set(['plane', 'billboard', 'screen', 'gizmo']);

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, limit) => Math.max(-limit, Math.min(limit, v));

/** Only the fields we render survive; anything malformed rejects the whole save. */
function readStrokes(input) {
  if (!Array.isArray(input)) return null;
  const strokes = [];
  for (const s of input) {
    if (!s || !TOOLS.has(s.tool) || !isNum(s.size) || s.size <= 0 || s.size > 200) return null;
    if (!Array.isArray(s.points) || s.points.length === 0) return null;
    for (const p of s.points) {
      if (!Array.isArray(p) || p.length !== 3 || !p.every(isNum)) return null;
    }
    strokes.push({ tool: s.tool, size: s.size, stylus: s.stylus === true, points: s.points });
  }
  return strokes;
}

/** A triple of finite numbers, or the fallback. Rejects nothing — just ignores junk. */
function readTriple(v, fallback) {
  return Array.isArray(v) && v.length === 3 && v.every(isNum) ? v.map(Number) : fallback;
}

function readLayer(input, index) {
  if (!input) return null;
  const id = LAYER_ID.test(input.id) ? input.id : `layer-${index + 1}`;
  const strokes = readStrokes(input.strokes);
  if (!strokes) return null;
  const layer = { id, name: typeof input.name === 'string' ? input.name.slice(0, 64) : id };
  if (FACINGS.has(input.facing)) layer.facing = input.facing;
  const offset = readTriple(input.offset, null);
  if (offset) layer.offset = offset;
  const rotate = readTriple(input.rotate, null);
  if (rotate) layer.rotate = rotate;
  if (Array.isArray(input.pivot) && input.pivot.length === 2 && input.pivot.every(isNum)) {
    layer.pivot = input.pivot.map(Number);
  }
  if (isNum(input.opacity)) layer.opacity = Math.max(0, Math.min(1, input.opacity));
  if (input.hidden === true) layer.hidden = true;
  layer.strokes = strokes;
  return layer;
}

/** Rebuild the scene from known fields only; returns null to reject the save. */
function validate(body) {
  if (!body || !isNum(body.width)) return null;

  let layersIn;
  if (body.version === 2 && Array.isArray(body.layers)) layersIn = body.layers;
  // v1: a flat sheet is a single face-on layer, which is what it always was.
  else if (body.version === 1 && Array.isArray(body.strokes))
    layersIn = [{ id: 'sheet', name: 'sheet', facing: 'billboard', strokes: body.strokes }];
  else return null;

  const layers = [];
  for (const [i, raw] of layersIn.entries()) {
    const layer = readLayer(raw, i);
    if (!layer) return null;
    layers.push(layer);
  }

  const cam = body.camera ?? {};
  return {
    width: Math.round(body.width),
    height: isNum(body.height) && body.height > 0 ? Math.ceil(body.height) : 0,
    camera: {
      yaw: isNum(cam.yaw) ? Math.round(clamp(cam.yaw, 180) * 100) / 100 : 0,
      pitch: isNum(cam.pitch) ? Math.round(clamp(cam.pitch, 90) * 100) / 100 : 0,
    },
    layers,
  };
}

/** One stroke per line — still valid JSON, but diffs stay readable. */
function serialize({ width, height, camera, layers }) {
  const body = layers.map((layer) => {
    const { strokes, ...meta } = layer;
    const head = Object.entries(meta)
      .map(([k, v]) => `      ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
      .join('\n');
    const lines = strokes.map((s) => `        ${JSON.stringify(s)}`);
    const list = lines.length ? `\n${lines.join(',\n')}\n      ` : '';
    return `    {\n${head}\n      "strokes": [${list}]\n    }`;
  });
  const list = body.length ? `\n${body.join(',\n')}\n  ` : '';
  return (
    '{\n' +
    '  "version": 2,\n' +
    `  "width": ${width},\n` +
    `  "height": ${height},\n` +
    `  "camera": { "yaw": ${camera.yaw}, "pitch": ${camera.pitch} },\n` +
    `  "layers": [${list}]\n` +
    '}\n'
  );
}

function reply(res, status, message) {
  res.statusCode = status;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end(message);
}

export function scribbleWriter() {
  return {
    name: 'kiruk-scribble-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__scribble/save', (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, 'POST only');

        // Only the dev page itself may write — not some other tab poking localhost.
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host)
          return reply(res, 403, 'cross-origin');

        const sheet = new URL(req.url ?? '', 'http://dev').searchParams.get('sheet') ?? '';
        if (!SHEET_ID.test(sheet)) return reply(res, 400, 'bad sheet id');

        const chunks = [];
        let bytes = 0;
        req.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) {
            reply(res, 413, 'sheet too large');
            req.destroy();
          } else chunks.push(chunk);
        });
        req.on('end', async () => {
          if (res.writableEnded) return;
          let data;
          try {
            data = validate(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch {
            data = null;
          }
          if (!data) return reply(res, 422, 'malformed scene');
          try {
            await mkdir(DIR, { recursive: true });
            await writeFile(`${DIR}${sheet}.json`, serialize(data), 'utf8');
            const strokes = data.layers.reduce((n, l) => n + l.strokes.length, 0);
            server.config.logger.info(
              `scribble → src/scribbles/${sheet}.json (${data.layers.length} layers, ${strokes} strokes)`,
              { timestamp: true },
            );
            reply(res, 200, 'ok');
          } catch (err) {
            reply(res, 500, String(err));
          }
        });
      });
    },
  };
}
