/**
 * Mark catalog copied from manifest/marks.json so consumers can import
 * without JSON-module ceremony. Families set drawing-template geometry.
 *
 * spec-link: packages/kirukal/manifest/marks.json
 */

export type MarkFamilyId = 'frame' | 'rule' | 'glyph' | 'part' | 'fill' | 'eye' | 'wordmark';

export type MarkFamily = Readonly<{
  nineSlice?: boolean;
  safeArea: number;
  slice?: readonly [number, number];
  tileable?: boolean;
  viewBox: readonly [number, number];
}>;

export const MARK_FAMILIES = {
  eye: { safeArea: 64, viewBox: [512, 512] },
  fill: { safeArea: 0, tileable: true, viewBox: [512, 512] },
  frame: { nineSlice: true, safeArea: 24, slice: [96, 288], viewBox: [384, 384] },
  glyph: { safeArea: 64, viewBox: [512, 512] },
  part: { safeArea: 64, viewBox: [512, 512] },
  rule: { safeArea: 16, tileable: true, viewBox: [512, 128] },
  wordmark: { safeArea: 32, viewBox: [1024, 256] },
} as const satisfies Record<MarkFamilyId, MarkFamily>;

export const MARK_IDS = [
  'frame.box',
  'frame.box-tight',
  'frame.pill',
  'frame.circle',
  'frame.sheet',
  'frame.field',
  'rule.line',
  'rule.dashed',
  'rule.underline',
  'rule.hatch',
  'glyph.tick',
  'glyph.cross',
  'glyph.chevron',
  'glyph.arrow',
  'glyph.plus',
  'glyph.minus',
  'glyph.dot',
  'glyph.ellipsis',
  'glyph.grip',
  'glyph.caret',
  'glyph.search',
  'glyph.eye-open',
  'part.switch-track',
  'part.switch-knob',
  'part.slider-track',
  'part.slider-thumb',
  'part.checkbox-box',
  'part.radio-ring',
  'part.progress-track',
  'part.resize-handle',
  'part.scrollbar-thumb',
  'part.corner-bracket',
  'part.tab-notch',
  'part.tooltip-tail',
  'part.focus-halo',
  'fill.scribble',
  'fill.paper-grain',
  'fill.marker',
  'eye.primary',
  'eye.iris',
  'eye.gaze',
  'eye.blink',
  'eye.watermark',
  'wordmark.kiruk',
] as const;

export type MarkId = (typeof MARK_IDS)[number];

export const DEFAULT_MARK_ID: MarkId = 'frame.box';

/** Brush-calibration strip below the drawing box, matching `new-outline.mjs`. */
export const MARK_TEMPLATE_SWATCH_HEIGHT = 56;

const BRUSH_AT_512 = 6;

export type MarkCatalogEntry = Readonly<{
  takes: number;
  usedBy: readonly string[];
}>;

export const MARK_CATALOG = {
  'eye.blink': { takes: 1, usedBy: ['EyeMark'] },
  'eye.gaze': { takes: 1, usedBy: ['EyeMark'] },
  'eye.iris': { takes: 1, usedBy: ['EyeMark', 'Progress'] },
  'eye.primary': { takes: 1, usedBy: ['EyeMark'] },
  'eye.watermark': { takes: 1, usedBy: ['EmptyState'] },
  'fill.marker': { takes: 2, usedBy: ['Badge'] },
  'fill.paper-grain': { takes: 2, usedBy: ['PaperGround'] },
  'fill.scribble': { takes: 2, usedBy: ['Toggle', 'Checkbox'] },
  'frame.box': {
    takes: 4,
    usedBy: ['Frame', 'Card', 'Dialog', 'Popover', 'Panel'],
  },
  'frame.box-tight': { takes: 4, usedBy: ['Button', 'Badge', 'Tabs'] },
  'frame.circle': { takes: 4, usedBy: ['Radio', 'IconButton', 'Avatar'] },
  'frame.field': { takes: 4, usedBy: ['Input', 'Textarea'] },
  'frame.pill': { takes: 4, usedBy: ['Switch', 'Badge'] },
  'frame.sheet': { takes: 4, usedBy: ['Sheet', 'Dialog'] },
  'glyph.arrow': { takes: 3, usedBy: ['Button'] },
  'glyph.caret': { takes: 3, usedBy: ['Select'] },
  'glyph.chevron': { takes: 3, usedBy: ['Select', 'Menu', 'Tabs'] },
  'glyph.cross': { takes: 3, usedBy: ['Dialog', 'Toast', 'Badge'] },
  'glyph.dot': { takes: 3, usedBy: ['Radio', 'Menu'] },
  'glyph.ellipsis': { takes: 3, usedBy: ['Menu'] },
  'glyph.eye-open': { takes: 3, usedBy: ['Input'] },
  'glyph.grip': { takes: 3, usedBy: ['Slider', 'ScrollArea'] },
  'glyph.minus': { takes: 3, usedBy: ['NumberField'] },
  'glyph.plus': { takes: 3, usedBy: ['NumberField'] },
  'glyph.search': { takes: 3, usedBy: ['Input'] },
  'glyph.tick': { takes: 3, usedBy: ['Checkbox', 'Menu'] },
  'part.checkbox-box': { takes: 2, usedBy: ['Checkbox'] },
  'part.corner-bracket': { takes: 2, usedBy: ['Frame'] },
  'part.focus-halo': { takes: 2, usedBy: ['*'] },
  'part.progress-track': { takes: 2, usedBy: ['Progress'] },
  'part.radio-ring': { takes: 2, usedBy: ['Radio'] },
  'part.resize-handle': { takes: 2, usedBy: ['ScrollArea'] },
  'part.scrollbar-thumb': { takes: 2, usedBy: ['ScrollArea'] },
  'part.slider-thumb': { takes: 2, usedBy: ['Slider'] },
  'part.slider-track': { takes: 2, usedBy: ['Slider'] },
  'part.switch-knob': { takes: 2, usedBy: ['Switch'] },
  'part.switch-track': { takes: 2, usedBy: ['Switch'] },
  'part.tab-notch': { takes: 2, usedBy: ['Tabs'] },
  'part.tooltip-tail': { takes: 2, usedBy: ['Tooltip', 'Popover'] },
  'rule.dashed': { takes: 3, usedBy: ['Separator'] },
  'rule.hatch': { takes: 3, usedBy: ['Toggle', 'Progress'] },
  'rule.line': { takes: 3, usedBy: ['Separator'] },
  'rule.underline': { takes: 3, usedBy: ['Tabs', 'Input'] },
  'wordmark.kiruk': { takes: 1, usedBy: ['Wordmark'] },
} as const satisfies Record<MarkId, MarkCatalogEntry>;

export function getMarkFamilyId(markId: string): MarkFamilyId {
  const family = markId.split('.')[0];
  if (
    family === 'frame' ||
    family === 'rule' ||
    family === 'glyph' ||
    family === 'part' ||
    family === 'fill' ||
    family === 'eye' ||
    family === 'wordmark'
  ) {
    return family;
  }
  return 'frame';
}

export function getMarkFamily(markId: string): MarkFamily {
  return MARK_FAMILIES[getMarkFamilyId(markId)];
}

export function getMarkViewBox(markId: string): Readonly<{
  height: number;
  width: number;
}> {
  const [width, height] = getMarkFamily(markId).viewBox;
  return { height, width };
}

export function getMarkCatalog(markId: string): MarkCatalogEntry {
  return MARK_IDS.includes(markId as MarkId)
    ? MARK_CATALOG[markId as MarkId]
    : MARK_CATALOG[DEFAULT_MARK_ID];
}

export function getMarkTakesWanted(markId: string): number {
  return getMarkCatalog(markId).takes;
}

export function getMarkUsedBy(markId: string): readonly string[] {
  return getMarkCatalog(markId).usedBy;
}

export function getMarkSelectLabel(markId: string): string {
  const usedBy = getMarkUsedBy(markId);
  const consumers = (usedBy as readonly string[]).includes('*')
    ? 'every component'
    : usedBy.join(', ');
  return `${markId} — ${consumers}`;
}

export function getMarkBrushWeight(markId: string): number {
  const { height, width } = getMarkViewBox(markId);
  return +(BRUSH_AT_512 * (Math.min(width, height) / 512)).toFixed(2);
}

export function getMarkTemplateSize(markId: string): Readonly<{
  height: number;
  width: number;
}> {
  const { height, width } = getMarkViewBox(markId);
  return { height: height + MARK_TEMPLATE_SWATCH_HEIGHT, width };
}
