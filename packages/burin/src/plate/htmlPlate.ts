/**
 * The ink plate — live DOM printed into the engraving with HTML-in-Canvas.
 *
 * The page's typography (title, figure letters, guides, notes) is real HTML/SVG:
 * selectable, translatable, read by screen readers and agents. Where the browser
 * has HTML-in-Canvas (Chrome origin trial 148–150, or chrome://flags/#canvas-draw-element)
 * that DOM lives inside a transparent 2D canvas laid exactly over the stage; on every
 * `paint` the canvas draws its snapshot with drawElementImage, and the GPU samples
 * those pixels as ink — starved on the paper's tooth like the engraved lines.
 * Selection, hover and focus repaint the snapshot, so they print too.
 *
 * Why the 2D path, not texElementImage2D / copyElementImageToTexture: the 2D call is
 * the stable part of the API across 148–150, it updates hit-testing geometry for us,
 * and the upload to WebGPU or WebGL is an ordinary canvas texture on both backends
 * (three r186's HTMLTexture fails on the WebGL 2 fallback: "Texture is immutable").
 *
 * Without the API the same DOM simply renders in place over the GPU paper.
 */

type Ctx2D = CanvasRenderingContext2D & {
  drawElementImage?: (el: Element, x: number, y: number, w?: number, h?: number) => unknown;
  reset?: () => void;
};

export function htmlInCanvasSupported(): boolean {
  if (typeof HTMLCanvasElement === 'undefined') return false;
  if (!('requestPaint' in HTMLCanvasElement.prototype)) return false;
  return (
    typeof CanvasRenderingContext2D !== 'undefined' &&
    'drawElementImage' in CanvasRenderingContext2D.prototype
  );
}

export type HtmlPlate = {
  canvas: HTMLCanvasElement;
  /** Bumps on every repaint; the renderer re-uploads when it changes. */
  version: () => number;
  dispose: () => void;
};

/**
 * Wire a `<canvas layoutsubtree>` whose first element child is the plate's DOM.
 * `onPaint` runs after each snapshot is drawn.
 */
export function createHtmlPlate(
  canvas: HTMLCanvasElement,
  onPaint: () => void,
  dprCap = 2,
): HtmlPlate | null {
  if (!htmlInCanvasSupported()) return null;
  canvas.setAttribute('layoutsubtree', '');
  const ctx = canvas.getContext('2d') as Ctx2D | null;
  if (!ctx?.drawElementImage) return null;
  let v = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, dprCap);

  const size = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };
  const ro = new ResizeObserver(() => {
    size();
    (canvas as HTMLCanvasElement & { requestPaint: () => void }).requestPaint();
  });
  ro.observe(canvas);
  size();

  const paint = () => {
    const el = canvas.firstElementChild as HTMLElement | null;
    if (!el) return;
    ctx.reset ? ctx.reset() : ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      ctx.drawElementImage!(el, 0, 0, el.offsetWidth * dpr, el.offsetHeight * dpr);
      v++;
      onPaint();
    } catch {
      // No snapshot yet; the next paint event will have one.
    }
  };
  canvas.addEventListener('paint', paint);
  (canvas as HTMLCanvasElement & { requestPaint: () => void }).requestPaint();

  return {
    canvas,
    version: () => v,
    dispose() {
      ro.disconnect();
      canvas.removeEventListener('paint', paint);
    },
  };
}
