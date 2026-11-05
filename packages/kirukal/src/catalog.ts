/**
 * Component catalog inverted from mark `usedBy`. Marks stay canonical;
 * Forge and kirukal consumers speak in Button / Switch / Dialog, not mark IDs.
 *
 * spec-link: packages/kirukal/manifest/marks.json
 */

import {
  DEFAULT_MARK_ID,
  getMarkFamilyId,
  getMarkTakesWanted,
  MARK_CATALOG,
  MARK_IDS,
  type MarkId,
} from './marks';

export const FOCUS_COMPONENT_ID = 'focus' as const;

const FOCUS_MARK_ID = 'part.focus-halo' as const;

const PINNED_COMPONENT_IDS = ['button', 'switch', 'dialog', 'frame', 'card'] as const;

const COMPONENT_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  EmptyState: 'Empty state',
  EyeMark: 'Eye',
  IconButton: 'Icon button',
  NumberField: 'Number field',
  PaperGround: 'Paper',
  ScrollArea: 'Scroll area',
};

const ANATOMY_LABELS: Readonly<Record<MarkId, string>> = {
  'eye.blink': 'Blink',
  'eye.gaze': 'Gaze',
  'eye.iris': 'Iris',
  'eye.primary': 'Mark',
  'eye.watermark': 'Watermark',
  'fill.marker': 'Marker',
  'fill.paper-grain': 'Grain',
  'fill.scribble': 'Scribble',
  'frame.box': 'Box',
  'frame.box-tight': 'Tight box',
  'frame.circle': 'Circle',
  'frame.field': 'Field',
  'frame.pill': 'Pill',
  'frame.sheet': 'Sheet',
  'glyph.arrow': 'Arrow',
  'glyph.caret': 'Caret',
  'glyph.chevron': 'Chevron',
  'glyph.cross': 'Close',
  'glyph.dot': 'Dot',
  'glyph.ellipsis': 'Ellipsis',
  'glyph.eye-open': 'Eye',
  'glyph.grip': 'Grip',
  'glyph.minus': 'Minus',
  'glyph.plus': 'Plus',
  'glyph.search': 'Search',
  'glyph.tick': 'Tick',
  'part.checkbox-box': 'Box',
  'part.corner-bracket': 'Bracket',
  'part.focus-halo': 'Halo',
  'part.progress-track': 'Track',
  'part.radio-ring': 'Ring',
  'part.resize-handle': 'Handle',
  'part.scrollbar-thumb': 'Thumb',
  'part.slider-thumb': 'Thumb',
  'part.slider-track': 'Track',
  'part.switch-knob': 'Knob',
  'part.switch-track': 'Track',
  'part.tab-notch': 'Notch',
  'part.tooltip-tail': 'Tail',
  'rule.dashed': 'Dashed',
  'rule.hatch': 'Hatch',
  'rule.line': 'Line',
  'rule.underline': 'Underline',
  'wordmark.kiruk': 'Kiruk',
};

export type AnatomyPiece = Readonly<{
  label: string;
  markId: MarkId;
  takesWanted: number;
}>;

export type ComponentCatalogEntry = Readonly<{
  id: string;
  label: string;
  recipe: readonly AnatomyPiece[];
}>;

function toComponentId(name: string): string {
  return name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toComponentLabel(name: string): string {
  return COMPONENT_LABEL_OVERRIDES[name] ?? name.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function anatomyPiece(markId: MarkId): AnatomyPiece {
  return {
    label: ANATOMY_LABELS[markId],
    markId,
    takesWanted: getMarkTakesWanted(markId),
  };
}

function collectRecipes(): Map<string, { label: string; pieces: AnatomyPiece[] }> {
  const recipes = new Map<string, { label: string; pieces: AnatomyPiece[] }>();

  for (const markId of MARK_IDS) {
    const usedBy = MARK_CATALOG[markId].usedBy;
    if ((usedBy as readonly string[]).includes('*')) continue;
    const piece = anatomyPiece(markId);
    for (const consumer of usedBy) {
      const id = toComponentId(consumer);
      const existing = recipes.get(id);
      if (existing) {
        existing.pieces.push(piece);
        continue;
      }
      recipes.set(id, {
        label: toComponentLabel(consumer),
        pieces: [piece],
      });
    }
  }

  recipes.set(FOCUS_COMPONENT_ID, {
    label: 'Focus',
    pieces: [anatomyPiece(FOCUS_MARK_ID)],
  });

  return recipes;
}

const RECIPES = collectRecipes();

function comparePinnedThenAlpha(left: string, right: string): number {
  const leftPin = PINNED_COMPONENT_IDS.indexOf(left as (typeof PINNED_COMPONENT_IDS)[number]);
  const rightPin = PINNED_COMPONENT_IDS.indexOf(right as (typeof PINNED_COMPONENT_IDS)[number]);
  if (leftPin >= 0 || rightPin >= 0) {
    if (leftPin < 0) return 1;
    if (rightPin < 0) return -1;
    return leftPin - rightPin;
  }
  return left.localeCompare(right);
}

export const COMPONENT_CATALOG: readonly ComponentCatalogEntry[] = [...RECIPES.entries()]
  .sort(([left], [right]) => comparePinnedThenAlpha(left, right))
  .map(([id, entry]) =>
    Object.freeze({
      id,
      label: entry.label,
      recipe: Object.freeze(entry.pieces),
    }),
  );

export const DEFAULT_COMPONENT_ID = 'button';

export const DEFAULT_COMPONENT_MARK_ID: MarkId = 'frame.box-tight';

export function getComponentRecipe(componentId: string): readonly AnatomyPiece[] {
  return (
    COMPONENT_CATALOG.find((entry) => entry.id === componentId)?.recipe ??
    COMPONENT_CATALOG.find((entry) => entry.id === DEFAULT_COMPONENT_ID)?.recipe ??
    []
  );
}

export function getComponentEntry(componentId: string): ComponentCatalogEntry | undefined {
  return COMPONENT_CATALOG.find((entry) => entry.id === componentId);
}

export function getAnatomyLabel(markId: string): string {
  return MARK_IDS.includes(markId as MarkId)
    ? ANATOMY_LABELS[markId as MarkId]
    : ANATOMY_LABELS[DEFAULT_MARK_ID];
}

export function getMarkConsumers(markId: string): readonly ComponentCatalogEntry[] {
  if (markId === FOCUS_MARK_ID) {
    const focus = getComponentEntry(FOCUS_COMPONENT_ID);
    return focus ? [focus] : [];
  }
  return COMPONENT_CATALOG.filter(
    (entry) =>
      entry.id !== FOCUS_COMPONENT_ID && entry.recipe.some((piece) => piece.markId === markId),
  );
}

export function getSharedConsumerLabels(componentId: string, markId: string): readonly string[] {
  return getMarkConsumers(markId)
    .filter((entry) => entry.id !== componentId)
    .map((entry) => entry.label);
}

function silhouettePath(markId: string): string {
  const family = getMarkFamilyId(markId);
  if (markId === 'frame.pill' || markId === 'part.switch-track') {
    return '<rect x="10" y="34" width="80" height="32" rx="16" fill="none" stroke="currentColor" stroke-width="4"/>';
  }
  if (
    markId === 'frame.circle' ||
    markId === 'part.radio-ring' ||
    markId === 'part.switch-knob' ||
    markId === 'part.slider-thumb' ||
    family === 'eye'
  ) {
    return '<circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="4"/>';
  }
  if (markId === 'part.checkbox-box' || markId === 'part.tab-notch') {
    return '<rect x="22" y="22" width="56" height="56" fill="none" stroke="currentColor" stroke-width="4"/>';
  }
  if (markId === 'part.tooltip-tail') {
    return '<path d="M28 28 L72 50 L28 72 Z" fill="none" stroke="currentColor" stroke-width="4"/>';
  }
  if (
    markId === 'part.slider-track' ||
    markId === 'part.progress-track' ||
    family === 'rule' ||
    family === 'wordmark'
  ) {
    return '<rect x="8" y="42" width="84" height="16" rx="8" fill="none" stroke="currentColor" stroke-width="4"/>';
  }
  if (family === 'glyph') {
    return '<path d="M28 68 L50 28 L72 68" fill="none" stroke="currentColor" stroke-width="4"/>';
  }
  return '<rect x="16" y="16" width="68" height="68" fill="none" stroke="currentColor" stroke-width="4"/>';
}

export function getComponentThumbnailSrc(componentId: string): string {
  const primary = getComponentRecipe(componentId)[0]?.markId ?? DEFAULT_COMPONENT_MARK_ID;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${silhouettePath(primary)}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function isImplementedKirukalPreview(
  componentId: string,
): componentId is 'button' | 'frame' {
  return componentId === 'button' || componentId === 'frame';
}
