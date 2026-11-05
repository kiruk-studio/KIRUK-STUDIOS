import { strokeOutlinePath } from './export/svg';
import type { InkDocument, InkStroke } from './types';

function fillPath(
  context: CanvasRenderingContext2D,
  d: string,
  fill: string,
  opacity: number,
): void {
  if (!d) return;
  context.save();
  context.fillStyle = fill;
  context.globalAlpha = opacity;
  context.fill(new Path2D(d));
  context.restore();
}

export function rasterizeStroke(
  context: CanvasRenderingContext2D,
  stroke: InkStroke,
  last = true,
): void {
  fillPath(context, strokeOutlinePath(stroke, last), stroke.color ?? '#000000', stroke.opacity);
}

export function rasterizeInkDocument(
  context: CanvasRenderingContext2D,
  doc: InkDocument,
  draft: InkStroke | null,
): void {
  for (const stroke of doc.strokes) {
    rasterizeStroke(context, stroke, true);
  }
  if (draft && draft.points.length > 0) {
    rasterizeStroke(context, draft, false);
  }
}

export function wrapCaptionLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0] ?? '';
    for (let i = 1; i < words.length; i += 1) {
      const word = words[i] ?? '';
      const next = `${current} ${word}`;
      if (context.measureText(next).width <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

export function paintSheet(
  context: CanvasRenderingContext2D,
  doc: InkDocument,
  draft: InkStroke | null,
  title: string,
  body: string,
): void {
  rasterizeInkDocument(context, doc, draft);
  paintCaptions(context, title, body, doc.size.width);
}

export function paintCaptions(
  context: CanvasRenderingContext2D,
  title: string,
  body: string,
  pageWidth: number,
): void {
  const pad = 48;
  const maxWidth = Math.max(80, pageWidth - pad * 2);
  context.save();
  context.fillStyle = '#111111';
  context.textBaseline = 'top';
  let y = pad;
  if (title.trim()) {
    context.font = '600 28px ui-sans-serif, system-ui, sans-serif';
    for (const line of wrapCaptionLines(context, title.trim(), maxWidth)) {
      context.fillText(line, pad, y);
      y += 34;
    }
    y += 12;
  }
  if (body.trim()) {
    context.font = '16px ui-sans-serif, system-ui, sans-serif';
    for (const line of wrapCaptionLines(context, body.trim(), maxWidth)) {
      context.fillText(line, pad, y);
      y += 22;
    }
  }
  context.restore();
}
