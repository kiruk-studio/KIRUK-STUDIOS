/// <reference lib="webworker" />
/**
 * The hand's worker: p5.brush paints off the main thread, on an OffscreenCanvas, and hands
 * the layers back as transferable ImageBitmaps. The page keeps its frames while the hand works
 * (a sheet of washes is CPU geometry and dozens of GPU passes).
 *
 * The app owns the worker file, so its bundler sees the worker:
 *
 *   // hand.worker.ts
 *   import { serveHand } from '@kiruk/burin/hand/worker';
 *   import { eyeHand } from '@kiruk/burin/eye-hand';
 *   serveHand(self as unknown as DedicatedWorkerGlobalScope, { eye: eyeHand });
 *
 * spec-link: ideas/studio-dawn/hand.md
 */
import type { HandRequest, HandSheet } from './media';
import { paintingCanvas, paintSheet, type Recipes } from './painter';

export type { HandContext, HandRecipe, Recipes } from './painter';

export type HandToWorker = { type: 'paint'; id: number; req: HandRequest };
export type HandFromWorker =
  | { type: 'ready'; webgl2: boolean }
  | { type: 'sheet'; id: number; sheet: HandSheet }
  | { type: 'error'; id: number; message: string };

export function serveHand(scope: DedicatedWorkerGlobalScope, recipes: Recipes) {
  // p5.brush schedules a reminder with requestAnimationFrame; not every worker has one.
  const g = scope as unknown as { requestAnimationFrame?: (cb: (t: number) => void) => number };
  if (typeof g.requestAnimationFrame !== 'function')
    g.requestAnimationFrame = (cb) =>
      setTimeout(() => cb(performance.now()), 16) as unknown as number;

  const post = (m: HandFromWorker, transfer: Transferable[] = []) => scope.postMessage(m, transfer);
  const canvas = paintingCanvas();
  // One sheet at a time: p5.brush is a single painter.
  let queue: Promise<void> = Promise.resolve();

  scope.onmessage = (e: MessageEvent<HandToWorker>) => {
    const m = e.data;
    if (m?.type !== 'paint') return;
    queue = queue.then(async () => {
      try {
        if (!canvas) throw new Error('hand: no WebGL 2 in this worker');
        const sheet = await paintSheet(canvas, m.req, recipes);
        const transfer: Transferable[] = Object.values(sheet.layers);
        if (sheet.iris) transfer.push(sheet.iris.bitmap);
        post({ type: 'sheet', id: m.id, sheet: { ...sheet, via: 'worker' } }, transfer);
      } catch (err) {
        post({
          type: 'error',
          id: m.id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    });
  };
  post({ type: 'ready', webgl2: !!canvas });
}
