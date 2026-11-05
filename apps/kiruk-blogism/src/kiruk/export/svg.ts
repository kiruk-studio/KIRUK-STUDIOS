import { brushFor } from '../brushes';
import { getGeometryAdapter } from '../geometry';
import type { InkDocument, InkStroke } from '../types';

export function outlineToPath(outline: Array<[number, number]>): string {
  const first = outline[0];
  if (!first) return '';
  let d = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`;
  for (let i = 1; i < outline.length; i += 1) {
    const point = outline[i];
    if (!point) continue;
    d += ` L ${point[0].toFixed(2)} ${point[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

function strokePath(stroke: InkStroke, last = true): string {
  if (stroke.tool === 'eraser' || stroke.points.length === 0) return '';
  const brush = brushFor(stroke.tool);
  const outline = getGeometryAdapter().outline(stroke.points, {
    size: stroke.size,
    thinning: brush.thinning,
    smoothing: brush.smoothing,
    streamline: brush.streamline,
    simulatePressure: brush.simulatePressure,
    last,
  });
  return outlineToPath(outline);
}

export function exportSvg(doc: InkDocument): string {
  const { width, height } = doc.size;
  const paths = doc.strokes
    .filter((s) => s.tool !== 'eraser' && s.points.length > 0)
    .map((stroke) => {
      const d = strokePath(stroke, true);
      if (!d) return '';
      const opacity = stroke.opacity < 1 ? ` opacity="${stroke.opacity}"` : '';
      const raw = (stroke.color ?? '#000000').toLowerCase();
      const isBlack = raw === '#000' || raw === '#000000' || raw === 'black';
      const fill = isBlack ? 'currentColor' : raw;
      return `  <path d="${d}" fill="${fill}"${opacity}/>`;
    })
    .filter(Boolean)
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none">`,
    paths,
    `</svg>`,
    '',
  ].join('\n');
}

export function strokeOutlinePath(stroke: InkStroke, last = true): string {
  return strokePath(stroke, last);
}
