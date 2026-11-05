import type { Stroke } from '@kiruk/kirukal';

export const MARK_INK_TARGET = 'mark.ink';

export const MARK_TAKE_OPTIONS = ['1', '2', '3', '4'] as const;

export type InkStore = Readonly<Record<string, readonly Stroke[]>>;

export function inkKey(markId: string, take: string): string {
  return `${markId}::${take}`;
}

function isStrokeArray(value: unknown): value is Stroke[] {
  return Array.isArray(value);
}

export function getInkStrokes(ink: unknown, markId: string, take: string): readonly Stroke[] {
  if (typeof ink !== 'object' || ink === null || Array.isArray(ink)) {
    return [];
  }
  const strokes = (ink as Record<string, unknown>)[inkKey(markId, take)];
  return isStrokeArray(strokes) ? strokes : [];
}

export function setInkStrokes(
  ink: unknown,
  markId: string,
  take: string,
  strokes: readonly Stroke[],
): InkStore {
  const current =
    typeof ink === 'object' && ink !== null && !Array.isArray(ink)
      ? (ink as Record<string, readonly Stroke[]>)
      : {};
  return {
    ...current,
    [inkKey(markId, take)]: strokes,
  };
}

export function clearInkTake(ink: unknown, markId: string, take: string): InkStore {
  return setInkStrokes(ink, markId, take, []);
}

export function nextEmptyTake(
  ink: unknown,
  markId: string,
  currentTake: string,
  wanted: number,
): string {
  const current = Number(currentTake);
  const lastWanted = Math.max(1, Math.trunc(wanted));
  if (!Number.isFinite(current)) return currentTake;
  for (let n = current + 1; n <= lastWanted; n += 1) {
    const take = String(n);
    if (getInkStrokes(ink, markId, take).length === 0) return take;
  }
  return currentTake;
}
