import { brushFor, ERASER_RADIUS } from './brushes';
import {
  INK_DOC_VERSION,
  type InkDocument,
  type InkPoint,
  type InkSize,
  type InkStroke,
  type InkTone,
  type InkTool,
  PAGE_SIZE,
} from './types';

function uid(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}`;
}

export function createInkDoc(size: InkSize = PAGE_SIZE): InkDocument {
  return { version: INK_DOC_VERSION, size: { ...size }, strokes: [] };
}

export function serialize(doc: InkDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function deserialize(raw: string): InkDocument {
  const parsed = JSON.parse(raw) as InkDocument;
  if (parsed.version !== 1 || !parsed.size || !Array.isArray(parsed.strokes)) {
    throw new Error('Invalid InkDocument');
  }
  return parsed;
}

export function coerceInkDocument(value: unknown, size: InkSize = PAGE_SIZE): InkDocument {
  if (
    value &&
    typeof value === 'object' &&
    'version' in value &&
    (value as InkDocument).version === 1 &&
    'size' in value &&
    'strokes' in value &&
    Array.isArray((value as InkDocument).strokes)
  ) {
    const doc = value as InkDocument;
    return {
      version: 1,
      size: { width: doc.size.width, height: doc.size.height },
      strokes: doc.strokes,
    };
  }
  return createInkDoc(size);
}

export function appendStroke(
  doc: InkDocument,
  stroke: Omit<InkStroke, 'id'> & { id?: string },
): InkDocument {
  if (stroke.points.length === 0) return doc;
  return {
    ...doc,
    strokes: [
      ...doc.strokes,
      {
        id: stroke.id ?? uid(),
        tool: stroke.tool,
        size: stroke.size,
        opacity: stroke.opacity,
        tone: stroke.tone,
        color: stroke.color ?? '#000000',
        points: stroke.points,
      },
    ],
  };
}

export function makeDrawStroke(
  tool: Exclude<InkTool, 'eraser'>,
  points: InkPoint[],
  tone: InkTone = 'ink',
  color = '#000000',
): Omit<InkStroke, 'id'> {
  const brush = brushFor(tool);
  return {
    tool,
    size: brush.size,
    opacity: brush.opacity,
    tone,
    color,
    points,
  };
}

export function eraseAlongPath(
  doc: InkDocument,
  path: InkPoint[],
  radius = ERASER_RADIUS,
): InkDocument {
  if (path.length === 0) return doc;
  const r2 = radius * radius;
  const hits = (stroke: InkStroke) =>
    stroke.points.some((sp) =>
      path.some((ep) => {
        const dx = sp.x - ep.x;
        const dy = sp.y - ep.y;
        return dx * dx + dy * dy <= r2;
      }),
    );
  return { ...doc, strokes: doc.strokes.filter((s) => !hits(s)) };
}

export function clearStrokes(doc: InkDocument): InkDocument {
  return { ...doc, strokes: [] };
}
