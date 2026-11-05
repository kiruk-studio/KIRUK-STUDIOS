/** Toolcraft zoom is percent; match the runtime clamp without importing internals. */
const ZOOM_MIN = 25;
const ZOOM_MAX = 400;
const TEMPLATE_FILL = 0.92;

export type ViewportBox = Readonly<{
  height: number;
  width: number;
}>;

export function clampForgeZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/**
 * Mark paper in Toolcraft world space. Origin is the viewport center at
 * offset 0,0; the finite artboard clip is centered the same way.
 */
export function forgeMarkSceneBounds(template: ViewportBox): ViewportBox & {
  x: number;
  y: number;
} {
  return {
    height: template.height,
    width: template.width,
    x: -template.width / 2,
    y: -template.height / 2,
  };
}

/**
 * Zoom percent so the mark template fills most of the canvas viewport.
 * Does not change canvas.size; view-only.
 */
export function zoomToFitTemplate(
  viewport: ViewportBox,
  template: ViewportBox,
  fill = TEMPLATE_FILL,
): number {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    template.width <= 0 ||
    template.height <= 0
  ) {
    return 100;
  }
  const scale = Math.min(
    (viewport.width * fill) / template.width,
    (viewport.height * fill) / template.height,
  );
  return clampForgeZoom(Math.round(scale * 100));
}
