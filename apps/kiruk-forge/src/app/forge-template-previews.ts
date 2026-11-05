import {
  getComponentRecipe,
  getMarkFamilyId,
  getMarkViewBox,
  DEFAULT_COMPONENT_MARK_ID,
} from "@kiruk/kirukal";

import { previewSvgFromGuides } from "../kiruk";

const templateModules = import.meta.glob(
  "../../../../packages/kirukal/assets/templates/**/*.template.svg",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

const templatesByMarkId = new Map<string, string>();

for (const [path, svg] of Object.entries(templateModules)) {
  const fileName = path.split(/[/\\]/u).pop() ?? "";
  const markId = fileName.replace(/\.template\.svg$/u, "");
  if (markId) templatesByMarkId.set(markId, svg);
}

function restyleTemplate(svg: string, markId: string): string {
  const { height, width } = getMarkViewBox(markId);
  return svg
    .replace(/#FF00FF/giu, "#111111")
    .replace(/stroke="#ff00ff"/giu, 'stroke="#111111"')
    .replace(/\sopacity="0\.85"/u, "")
    .replace(/viewBox="[^"]*"/u, `viewBox="0 0 ${width} ${height}"`)
    .replace(/\swidth="[^"]*"/u, ` width="${width}"`)
    .replace(/\sheight="[^"]*"/u, ` height="${height}"`);
}

export function previewSvgForMark(markId: string): string {
  const raw = templatesByMarkId.get(markId);
  if (raw) return restyleTemplate(raw, markId);
  return previewSvgFromGuides(markId);
}

export function previewSvgForComponent(componentId: string): string {
  const primary =
    getComponentRecipe(componentId)[0]?.markId ?? DEFAULT_COMPONENT_MARK_ID;
  return previewSvgForMark(primary);
}

export function previewDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function primaryMarkFamily(componentId: string): string {
  const primary =
    getComponentRecipe(componentId)[0]?.markId ?? DEFAULT_COMPONENT_MARK_ID;
  return getMarkFamilyId(primary);
}
