/**
 * First-party BLOGISM code. See ./README.md — nothing here may import src/toolcraft/**.
 */

export type { BrushPreset } from './brushes';
export {
  BRUSHES,
  brushFor,
  ERASER_RADIUS,
} from './brushes';
export {
  appendStroke,
  clearStrokes,
  coerceInkDocument,
  createInkDoc,
  deserialize,
  eraseAlongPath,
  makeDrawStroke,
  serialize,
} from './document';
export { exportSvg, outlineToPath, strokeOutlinePath } from './export/svg';
export type { BrushOpts, StrokeGeometryAdapter } from './geometry';
export {
  getGeometryAdapter,
  perfectFreehandAdapter,
  setGeometryAdapter,
} from './geometry';
export type { InkCaptureHandle } from './input/pointer';
export {
  captureInkStroke,
  samplePointer,
  samplePointerEvent,
  shouldAcceptPointer,
} from './input/pointer';
export {
  buildPostMdx,
  describeWritePlan,
  resolvePostSlug,
} from './mdx';
export {
  contentPath,
  inkPublicDir,
  inkPublicSrc,
  isCollection,
  isSafeSlug,
  nextInkId,
  serializeFrontmatter,
  slugify,
  todayStamp,
} from './page';
export {
  paintCaptions,
  paintSheet,
  rasterizeInkDocument,
  rasterizeStroke,
  wrapCaptionLines,
} from './raster';
export type {
  BlogismCollection,
  BlogismSide,
  InkDocument,
  InkPoint,
  InkSize,
  InkStroke,
  InkTone,
  InkTool,
} from './types';
export {
  COLLECTIONS,
  DESK_SIZE,
  INK_DOC_VERSION,
  INK_TARGET,
  PAGE_SIZE,
} from './types';
