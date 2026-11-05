import { getMarkFamilyId, getMarkViewBox, type Stroke } from '@kiruk/kirukal';

import { inkPathsFromStrokes } from './paths';

const SOURCE_INK_FILL = '#000000';

export function sourceFileName(markId: string, version: number): string {
  const padded = String(Math.max(1, Math.trunc(version))).padStart(2, '0');
  return `${markId}.v${padded}.svg`;
}

export function sourceRelativePath(markId: string, version: number): string {
  return `${getMarkFamilyId(markId)}/${sourceFileName(markId, version)}`;
}

export function latestSourceVersion(existingNames: readonly string[], markId: string): number {
  let max = 0;
  for (const name of existingNames) {
    const match = /^(.*)\.v(\d+)\.svg$/u.exec(name);
    if (!match || match[1] !== markId) continue;
    max = Math.max(max, Number(match[2]));
  }
  return max;
}

export function nextSourceVersion(existingNames: readonly string[], markId: string): number {
  return latestSourceVersion(existingNames, markId) + 1;
}

export function buildSourceSvg(markId: string, strokes: readonly Stroke[]): string {
  const { height, width } = getMarkViewBox(markId);
  const paths = inkPathsFromStrokes(markId, strokes, width, height);
  const artwork =
    paths.length > 0
      ? paths
          .map(
            (d) =>
              `    <path data-kirukal="ink" d="${escapeSvgAttribute(d)}" fill="${SOURCE_INK_FILL}"/>`,
          )
          .join('\n')
      : `    <rect data-kirukal="artwork" fill="none" height="${height}" width="${width}" x="0" y="0"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <g id="artwork" data-kirukal="artwork">
${artwork}
  </g>
</svg>
`;
}

function escapeSvgAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
