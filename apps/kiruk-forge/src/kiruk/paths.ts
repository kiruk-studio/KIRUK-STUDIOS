import {
  getMarkBrushWeight,
  getMarkTakesWanted,
  getMarkViewBox,
  type Stroke,
  type StrokeRecipe,
  synthesizeMark,
} from '@kiruk/kirukal';

import { getInkStrokes } from './ink';

export type InkPathOptions = Readonly<{
  last?: boolean;
  strokeWidth?: number;
}>;

export function recipeFromStrokes(
  markId: string,
  strokes: readonly Stroke[],
  width: number,
  height: number,
): StrokeRecipe {
  return {
    capturedAt: 'live',
    device: { hasTilt: false, pointerType: 'pen' },
    id: markId,
    referenceBox: [width, height],
    takes: [{ seed: 0, strokes }],
    tier: 'C',
    version: 1,
  };
}

export function recipeFromInk(ink: unknown, markId: string): StrokeRecipe | undefined {
  const { height, width } = getMarkViewBox(markId);
  const takes = [];
  const wanted = getMarkTakesWanted(markId);
  for (let index = 1; index <= wanted; index += 1) {
    const strokes = getInkStrokes(ink, markId, String(index));
    if (strokes.length === 0) continue;
    takes.push({ seed: index, strokes });
  }
  if (takes.length === 0) return undefined;
  return {
    capturedAt: 'live',
    device: { hasTilt: false, pointerType: 'pen' },
    id: markId,
    referenceBox: [width, height],
    takes,
    tier: 'C',
    version: 1,
  };
}

export function inkPathsFromStrokes(
  markId: string,
  strokes: readonly Stroke[],
  width: number,
  height: number,
  options: InkPathOptions = {},
): string[] {
  if (strokes.length === 0) return [];
  return synthesizeMark(recipeFromStrokes(markId, strokes, width, height), {
    height,
    last: options.last ?? true,
    seed: 0,
    strokeWidth: options.strokeWidth ?? getMarkBrushWeight(markId),
    width,
  });
}

export function rasterizeInkPaths(
  context: CanvasRenderingContext2D,
  paths: readonly string[],
  fillStyle: string,
): void {
  context.fillStyle = fillStyle;
  for (const d of paths) {
    context.fill(new Path2D(d));
  }
}
