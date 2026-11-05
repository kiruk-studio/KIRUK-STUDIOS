import {
  getMarkBrushWeight,
  getMarkFamily,
  getMarkTemplateSize,
  getMarkViewBox,
} from '@kiruk/kirukal';

export const GUIDE_SAFE_DASH = [8, 8] as const;
export const GUIDE_SLICE_DASH = [4, 10] as const;
/** Keep strokes inside bitmap pixels 0..width-1 so finite artboard clip cannot eat the sheet. */
export const GUIDE_EDGE_INSET = 2;

export type GuideSegment = Readonly<{
  dash: readonly [number, number] | null;
  kind: 'ellipse' | 'line' | 'rect' | 'roundRect';
  lineWidth: number;
  radius?: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}>;

function insetCorner(
  cx: number,
  cy: number,
  width: number,
  height: number,
  edge = GUIDE_EDGE_INSET,
): Readonly<{ x: number; y: number }> {
  return {
    x: cx === 0 ? edge : width - edge,
    y: cy === 0 ? edge : height - edge,
  };
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: GuideSegment['dash'],
  lineWidth = 1,
): GuideSegment {
  return { dash, kind: 'line', lineWidth, x1, x2, y1, y2 };
}

function roundRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  dash: GuideSegment['dash'],
  lineWidth = 1,
): GuideSegment {
  return { dash, kind: 'roundRect', lineWidth, radius, x1, x2, y1, y2 };
}

function ellipse(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: GuideSegment['dash'],
  lineWidth = 1,
): GuideSegment {
  return { dash, kind: 'ellipse', lineWidth, x1, x2, y1, y2 };
}

function anatomySilhouettes(
  markId: string,
  width: number,
  height: number,
  inset: number,
): readonly GuideSegment[] {
  const left = inset + GUIDE_EDGE_INSET;
  const top = inset + GUIDE_EDGE_INSET;
  const right = width - inset - GUIDE_EDGE_INSET;
  const bottom = height - inset - GUIDE_EDGE_INSET;
  const innerWidth = right - left;
  const innerHeight = bottom - top;
  const midY = top + innerHeight / 2;

  if (markId === 'frame.pill' || markId === 'part.switch-track') {
    const pillHeight = Math.min(innerHeight, innerWidth * 0.42);
    const pillTop = top + (innerHeight - pillHeight) / 2;
    return [roundRect(left, pillTop, right, pillTop + pillHeight, pillHeight / 2, GUIDE_SAFE_DASH)];
  }

  if (markId === 'frame.circle' || markId === 'part.radio-ring' || markId === 'part.switch-knob') {
    const size = Math.min(innerWidth, innerHeight);
    const cx = left + (innerWidth - size) / 2;
    const cy = top + (innerHeight - size) / 2;
    return [ellipse(cx, cy, cx + size, cy + size, GUIDE_SAFE_DASH)];
  }

  if (markId === 'part.checkbox-box') {
    const size = Math.min(innerWidth, innerHeight) * 0.72;
    const cx = left + (innerWidth - size) / 2;
    const cy = top + (innerHeight - size) / 2;
    return [rect(cx, cy, cx + size, cy + size, GUIDE_SAFE_DASH)];
  }

  if (
    markId === 'part.slider-track' ||
    markId === 'part.progress-track' ||
    markId === 'part.scrollbar-thumb'
  ) {
    const barHeight = Math.min(innerHeight * 0.18, 36);
    const barTop = top + (innerHeight - barHeight) / 2;
    return [roundRect(left, barTop, right, barTop + barHeight, barHeight / 2, GUIDE_SAFE_DASH)];
  }

  if (markId === 'part.tooltip-tail') {
    return [
      line(left, top, right, midY, GUIDE_SAFE_DASH),
      line(right, midY, left, bottom, GUIDE_SAFE_DASH),
      line(left, bottom, left, top, GUIDE_SAFE_DASH),
    ];
  }

  return [];
}

function rect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: GuideSegment['dash'],
  lineWidth = 1,
): GuideSegment {
  return { dash, kind: 'rect', lineWidth, x1, x2, y1, y2 };
}

/**
 * Construction geometry matching kirukal `new-outline.mjs`, plus a live paper
 * rectangle and brush-strip divider so the sheet reads on a white Toolcraft canvas.
 * Magenta in live preview only; kit source omits this layer.
 */
export function buildGuideGeometry(markId: string): readonly GuideSegment[] {
  const family = getMarkFamily(markId);
  const paper = getMarkTemplateSize(markId);
  const { height, width } = getMarkViewBox(markId);
  const inset = family.safeArea;
  const tick = Math.round(Math.min(width, height) * 0.04);
  const brush = getMarkBrushWeight(markId);
  const edge = GUIDE_EDGE_INSET;
  const segments: GuideSegment[] = [
    rect(edge, edge, paper.width - edge, paper.height - edge, null, 2),
  ];

  for (const [cx, cy] of [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ] as const) {
    const corner = insetCorner(cx, cy, width, height, edge);
    const inwardX = cx === 0 ? corner.x + tick : corner.x - tick;
    const inwardY = cy === 0 ? corner.y + tick : corner.y - tick;
    segments.push(
      line(corner.x, corner.y, inwardX, corner.y, null),
      line(corner.x, corner.y, corner.x, inwardY, null),
    );
  }

  if (inset > 0) {
    segments.push(
      rect(
        inset + edge,
        inset + edge,
        width - inset - edge,
        height - inset - edge,
        GUIDE_SAFE_DASH,
      ),
    );
  }

  const silhouette = anatomySilhouettes(markId, width, height, inset);
  if (silhouette.length > 0) {
    segments.push(...silhouette);
  } else if (family.slice) {
    const [start, end] = family.slice;
    segments.push(
      line(start, edge, start, height - edge, GUIDE_SLICE_DASH),
      line(end, edge, end, height - edge, GUIDE_SLICE_DASH),
      line(edge, start, width - edge, start, GUIDE_SLICE_DASH),
      line(edge, end, width - edge, end, GUIDE_SLICE_DASH),
    );
  }

  const swatchX = Math.round(width * 0.08);
  const swatchY = height + 28;
  const swatchLength = Math.round(width * 0.18);
  segments.push(
    line(edge, height, width - edge, height, null),
    line(swatchX, swatchY, swatchX + swatchLength, swatchY, null, brush),
  );

  return segments;
}

export function guideSegmentBounds(
  segment: GuideSegment,
): Readonly<{ x1: number; x2: number; y1: number; y2: number }> {
  const pad = segment.lineWidth / 2;
  return {
    x1: Math.min(segment.x1, segment.x2) - pad,
    x2: Math.max(segment.x1, segment.x2) + pad,
    y1: Math.min(segment.y1, segment.y2) - pad,
    y2: Math.max(segment.y1, segment.y2) + pad,
  };
}

function segmentToSvg(segment: GuideSegment): string {
  const width = Math.abs(segment.x2 - segment.x1);
  const height = Math.abs(segment.y2 - segment.y1);
  const dash = segment.dash ? ` stroke-dasharray="${segment.dash[0]} ${segment.dash[1]}"` : '';
  const common = `fill="none" stroke="currentColor" stroke-width="${segment.lineWidth}"${dash}`;
  if (segment.kind === 'line') {
    return `<line x1="${segment.x1}" y1="${segment.y1}" x2="${segment.x2}" y2="${segment.y2}" ${common}/>`;
  }
  if (segment.kind === 'ellipse') {
    return `<ellipse cx="${segment.x1 + width / 2}" cy="${segment.y1 + height / 2}" rx="${width / 2}" ry="${height / 2}" ${common}/>`;
  }
  const radius = segment.kind === 'roundRect' && segment.radius ? ` rx="${segment.radius}"` : '';
  return `<rect x="${Math.min(segment.x1, segment.x2)}" y="${Math.min(segment.y1, segment.y2)}" width="${width}" height="${height}"${radius} ${common}/>`;
}

/**
 * Dedicated catalog/stage preview: the same construction vectors as the
 * kirukal template, restyled to ink. Magenta and the brush swatch stay off.
 */
export function previewSvgFromGuides(markId: string): string {
  const { height, width } = getMarkViewBox(markId);
  const body = buildGuideGeometry(markId)
    .filter((segment) => Math.max(segment.y1, segment.y2) <= height + GUIDE_EDGE_INSET)
    .map(segmentToSvg)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`;
}

export function guidesFitTemplate(
  markId: string,
  segments: readonly GuideSegment[] = buildGuideGeometry(markId),
): boolean {
  const paper = getMarkTemplateSize(markId);
  return segments.every((segment) => {
    const box = guideSegmentBounds(segment);
    return (
      box.x1 >= -1e-6 &&
      box.y1 >= -1e-6 &&
      box.x2 <= paper.width + 1e-6 &&
      box.y2 <= paper.height + 1e-6
    );
  });
}
