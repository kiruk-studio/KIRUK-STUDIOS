import { PAGE_SIZE } from "../kiruk";

/** Toolcraft zoom is percent; match the runtime clamp without importing internals. */
const ZOOM_MIN = 25;
const ZOOM_MAX = 400;
const TEMPLATE_FILL = 0.92;

export type ViewportBox = Readonly<{
  height: number;
  width: number;
}>;

export function clampBlogismZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

export function blogismPageSceneBounds(): ViewportBox & {
  x: number;
  y: number;
} {
  return {
    height: PAGE_SIZE.height,
    width: PAGE_SIZE.width,
    x: -PAGE_SIZE.width / 2,
    y: -PAGE_SIZE.height / 2,
  };
}

export function zoomToFitPage(
  viewport: ViewportBox,
  page: ViewportBox = PAGE_SIZE,
  fill = TEMPLATE_FILL,
): number {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    page.width <= 0 ||
    page.height <= 0
  ) {
    return 100;
  }
  const scale = Math.min(
    (viewport.width * fill) / page.width,
    (viewport.height * fill) / page.height,
  );
  return clampBlogismZoom(Math.round(scale * 100));
}
