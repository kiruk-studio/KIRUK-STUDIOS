import {
  DEFAULT_COMPONENT_ID,
  DEFAULT_COMPONENT_MARK_ID,
  getComponentRecipe,
  getMarkTakesWanted,
  type MarkId,
} from '@kiruk/kirukal';

import { getInkStrokes, nextEmptyTake } from './ink';

export type ForgeAnatomyValue = Readonly<{
  markId: string;
  take: string;
}>;

export const DEFAULT_ANATOMY: ForgeAnatomyValue = {
  markId: DEFAULT_COMPONENT_MARK_ID,
  take: '1',
};

export function isForgeAnatomyValue(value: unknown): value is ForgeAnatomyValue {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as { markId?: unknown; take?: unknown };
  return (
    typeof record.markId === 'string' &&
    record.markId.trim().length > 0 &&
    typeof record.take === 'string' &&
    record.take.trim().length > 0
  );
}

export function asComponentId(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : DEFAULT_COMPONENT_ID;
}

export function asMarkId(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : DEFAULT_COMPONENT_MARK_ID;
}

export function asTake(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : '1';
}

export function latestFilledTake(ink: unknown, markId: string): string | null {
  const wanted = getMarkTakesWanted(markId);
  for (let index = wanted; index >= 1; index -= 1) {
    const take = String(index);
    if (getInkStrokes(ink, markId, take).length > 0) return take;
  }
  return null;
}

export function firstEmptyTake(ink: unknown, markId: string): string {
  const wanted = getMarkTakesWanted(markId);
  for (let index = 1; index <= wanted; index += 1) {
    const take = String(index);
    if (getInkStrokes(ink, markId, take).length === 0) return take;
  }
  return '1';
}

export function isMarkComplete(ink: unknown, markId: string): boolean {
  const wanted = getMarkTakesWanted(markId);
  for (let index = 1; index <= wanted; index += 1) {
    if (getInkStrokes(ink, markId, String(index)).length === 0) return false;
  }
  return wanted > 0;
}

export function anatomyForComponent(
  componentId: string,
  ink: unknown,
  preferredMarkId?: string,
): ForgeAnatomyValue {
  const recipe = getComponentRecipe(componentId);
  const preferred = preferredMarkId
    ? recipe.find((piece) => piece.markId === preferredMarkId)
    : recipe.find((piece) => !isMarkComplete(ink, piece.markId));
  const piece = preferred ?? recipe[0];
  const markId = piece?.markId ?? DEFAULT_COMPONENT_MARK_ID;
  return {
    markId,
    take: firstEmptyTake(ink, markId),
  };
}

export function resolveDeskSelection(values: Readonly<Record<string, unknown>>): {
  componentId: string;
  markId: string;
  take: string;
} {
  const componentId = asComponentId(values['forge.component']);
  const anatomy = isForgeAnatomyValue(values['forge.anatomy']) ? values['forge.anatomy'] : null;
  const recipe = getComponentRecipe(componentId);
  const markId = anatomy?.markId ?? asMarkId(values['mark.id']);
  const onRecipe = recipe.some((piece) => piece.markId === markId);
  const resolvedMark = onRecipe ? markId : (recipe[0]?.markId ?? DEFAULT_COMPONENT_MARK_ID);
  return {
    componentId,
    markId: resolvedMark,
    take: anatomy?.take ?? asTake(values['mark.take']),
  };
}

/**
 * After a successful Publish: next empty slot on this mark, else the next
 * incomplete piece of the same component.
 */
export function nextDeskAfterPublish(
  componentId: string,
  markId: string,
  take: string,
  ink: unknown,
): ForgeAnatomyValue {
  const nextTake = nextEmptyTake(ink, markId, take, getMarkTakesWanted(markId));
  if (nextTake !== take) {
    return { markId, take: nextTake };
  }

  const recipe = getComponentRecipe(componentId);
  const start = recipe.findIndex((piece) => piece.markId === markId);
  const ordered = start >= 0 ? [...recipe.slice(start + 1), ...recipe.slice(0, start)] : recipe;

  for (const piece of ordered) {
    if (!isMarkComplete(ink, piece.markId)) {
      return {
        markId: piece.markId,
        take: firstEmptyTake(ink, piece.markId),
      };
    }
  }

  return { markId, take };
}

export function asPublishedStore(value: unknown): Readonly<Record<string, number>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const next: Record<string, number> = {};
  for (const [markId, version] of Object.entries(value as Record<string, unknown>)) {
    if (typeof version === 'number' && version > 0) next[markId] = version;
  }
  return next;
}

export function getPublishedVersion(value: unknown, markId: string): number {
  return asPublishedStore(value)[markId] ?? 0;
}

export function setPublishedVersion(
  value: unknown,
  markId: string,
  version: number,
): Readonly<Record<string, number>> {
  return {
    ...asPublishedStore(value),
    [markId]: Math.max(1, Math.trunc(version)),
  };
}

export function isDefaultButtonTightBox(componentId: string, markId: string): boolean {
  return (
    componentId === DEFAULT_COMPONENT_ID && markId === (DEFAULT_COMPONENT_MARK_ID satisfies MarkId)
  );
}
