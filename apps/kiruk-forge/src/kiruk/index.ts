/**
 * First-party forge code. See ./README.md — nothing here may import src/toolcraft/**.
 */
export const FORGE_NAMESPACE = 'kiruk' as const;

export {
  type AnatomyPiece,
  type ComponentCatalogEntry,
  DEFAULT_COMPONENT_ID,
  DEFAULT_COMPONENT_MARK_ID,
  DEFAULT_MARK_ID,
  getAnatomyLabel,
  getComponentEntry,
  getComponentRecipe,
  getComponentThumbnailSrc,
  getMarkBrushWeight,
  getMarkCatalog,
  getMarkConsumers,
  getMarkFamily,
  getMarkFamilyId,
  getMarkSelectLabel,
  getMarkTakesWanted,
  getMarkTemplateSize,
  getMarkUsedBy,
  getMarkViewBox,
  getSharedConsumerLabels,
  isImplementedKirukalPreview,
  MARK_IDS,
  MARK_TEMPLATE_SWATCH_HEIGHT,
  type MarkId,
  type Sample,
  type Stroke,
  type StrokeRecipe,
} from '@kiruk/kirukal';

export * from './desk';
export * from './guides';
export * from './ink';
export * from './paths';
export * from './pen';
export * from './source-svg';
