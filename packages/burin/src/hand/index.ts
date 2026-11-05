/**
 * @kiruk/burin/hand — the hand. Two hands share this door.
 *
 * 1. The pen (2D canvas; no three.js, no p5): the eye drawn stroke by stroke, then alive.
 *      pen      the stroke vocabulary: hairline to swell, tapers, flicks, chalk, hair
 *      strokes  the engraved eye as ordered strokes (subjects/eye/strokes.ts)
 *      ink      the pen that lays them on a 2D canvas, wet ink drying
 *      live     the drawn eye's globe turning under its lids, and its blinks
 *    Runs in a worker on an OffscreenCanvas, or on the main thread where there is none.
 *    spec-link: ideas/studio-dawn/ink-opening.md · ideas/studio-dawn/ink-strokes.md
 *
 * 2. The media (p5.brush in a worker, WebGL 2): red chalk, bistre wash, iron-gall quill,
 *    lead white and an iris colour, each on its own sheet, returned as ImageBitmaps for
 *    the burin renderer (three.js WebGPURenderer, TSL) to lay into its paper.
 *      p5.brush (worker)  ->  ImageBitmap x5  ->  three.js textures  ->  TSL compose
 *    This module never imports p5.brush: the page bundle stays free of it unless the
 *    worker is unavailable and `local` is used.
 *    spec-link: ideas/studio-dawn/hand.md
 */
import type { HandRequest, HandSheet } from './media';
import type { Recipes } from './painter';
import type { HandFromWorker, HandToWorker } from './worker';

export { BLINK_LENGTH, blinkAt, Critical } from '../motion/dynamics';
export { createEyeMotion, type EyeMotion } from '../subjects/eye/motion';
export { EYE, type Pose, REST } from '../subjects/eye/rig';
export {
  EYE_PASSES,
  EYE_TIMELINE,
  type EyeDrawing,
  eyeDrawing,
  lidStrokes,
  openingOutline,
  type Pen,
  pitchFor,
  type Stroke,
  type StrokeInk,
  type StrokeLayer,
  scheduleEye,
  windowOutline,
} from '../subjects/eye/strokes';
export {
  type Clips,
  type Ctx2D,
  type InkColors,
  InkHand,
  type InkLayers,
  outlinePath,
  paintStrokes,
  traceStroke,
  WET_S,
} from './ink';
export { GAZE_RANGE, LiveEye, makeCanvas } from './live';
export * from './media';
export {
  byAngle,
  byParam,
  byX,
  chalkWidth,
  cutWidth,
  HAIRLINE,
  Hand,
  hairWidth,
  type LayOpts,
  type Meta,
  type Shown,
  taperRuns,
  type WidthAt,
} from './pen';
export {
  curve,
  fromSamples,
  type HatchOptions,
  hatch,
  inside,
  length,
  PRESSURE,
  type Pressure,
  type Pt,
  type Rng,
  resample,
  rng,
  type Spine,
  type SpinePt,
  spine,
  tremor,
} from './spine';

export type HandStatus = {
  state: 'starting' | 'idle' | 'painting' | 'failed' | 'none';
  via: 'worker' | 'main' | null;
  /** the last sheet's paint time, ms */
  ms: number;
  error?: string;
};

export type HandClient = {
  /** Paint a sheet. The latest request wins: a superseded one resolves to null. */
  paint(req: HandRequest): Promise<HandSheet | null>;
  status(): HandStatus;
  dispose(): void;
};

type Local = () => Promise<{
  paintSheet: typeof import('./painter').paintSheet;
  paintingCanvas: typeof import('./painter').paintingCanvas;
  recipes: Recipes;
}>;

/** Release a sheet's bitmaps (once its textures are uploaded or it is not wanted). */
export function closeSheet(sheet: HandSheet | null) {
  if (!sheet) return;
  for (const b of Object.values(sheet.layers)) b.close();
  sheet.iris?.bitmap.close();
}

export function createHand(opts: {
  /** the app's worker (see ./worker.ts for the three lines it holds) */
  worker?: () => Worker;
  /** the same painter on the main thread, for browsers without WebGL 2 in workers */
  local?: Local;
}): HandClient {
  const status: HandStatus = { state: 'starting', via: null, ms: 0 };
  let mode = 'none' as 'worker' | 'main' | 'none';
  // Assigned inside callbacks: typed by hand so the compiler does not narrow it to null.
  let worker = null as Worker | null;
  let disposed = false;
  let id = 0;
  const waiting = new Map<number, (r: HandSheet | Error) => void>();
  let localLib: Awaited<ReturnType<Local>> | null = null;
  let localCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;

  const useLocal = async () => {
    if (!opts.local) return false;
    try {
      localLib = await opts.local();
      localCanvas = localLib.paintingCanvas();
      if (!localCanvas) {
        status.error = `${status.error ? `${status.error}; ` : ''}no WebGL 2 on the page`;
        return false;
      }
      mode = 'main';
      return true;
    } catch (err) {
      status.error = `${status.error ? `${status.error}; ` : ''}${err instanceof Error ? err.message : String(err)}`;
      return false;
    }
  };

  const ready: Promise<void> = (async () => {
    if (opts.worker) {
      const ok = await new Promise<boolean>((resolve) => {
        try {
          worker = opts.worker!();
        } catch {
          resolve(false);
          return;
        }
        const timer = setTimeout(() => {
          status.error = 'the worker did not answer';
          resolve(false);
        }, 8000);
        let started = false;
        worker.addEventListener('error', (e) => {
          clearTimeout(timer);
          if (!started) {
            status.error = `worker: ${e.message || 'failed to start'}`;
            resolve(false);
            return;
          }
          // A crash mid-sheet (an uncaught throw, a lost context) posts no 'error' message:
          // fail every waiting paint so pump() hands over to the page instead of hanging.
          const err = new Error(`worker: ${e.message || 'crashed'}`);
          for (const w of waiting.values()) w(err);
          waiting.clear();
        });
        worker.addEventListener('message', (e: MessageEvent<HandFromWorker>) => {
          const m = e.data;
          if (m.type === 'ready') {
            clearTimeout(timer);
            started = true;
            if (!m.webgl2) status.error = 'no WebGL 2 in the worker';
            resolve(m.webgl2);
          } else if (m.type === 'sheet') {
            waiting.get(m.id)?.(m.sheet);
            waiting.delete(m.id);
          } else if (m.type === 'error') {
            waiting.get(m.id)?.(new Error(m.message));
            waiting.delete(m.id);
          }
        });
      });
      if (ok) {
        mode = 'worker';
      } else {
        worker?.terminate();
        worker = null;
      }
    }
    if (mode === 'none') await useLocal();
    status.state = mode === 'none' ? 'none' : 'idle';
    status.via = mode === 'none' ? null : mode;
  })();

  const viaWorker = (req: HandRequest) =>
    new Promise<HandSheet>((resolve, reject) => {
      const n = ++id;
      waiting.set(n, (r) => (r instanceof Error ? reject(r) : resolve(r)));
      worker!.postMessage({ type: 'paint', id: n, req } satisfies HandToWorker);
    });

  const viaMain = async (req: HandRequest): Promise<HandSheet> => {
    const sheet = await localLib!.paintSheet(localCanvas!, req, localLib!.recipes);
    return { ...sheet, via: 'main' };
  };

  type Job = { req: HandRequest; resolve: (s: HandSheet | null) => void };
  let inflight: Job | null = null;
  let queued: Job | null = null;

  const pump = async () => {
    if (inflight || !queued) return;
    await ready;
    if (inflight || !queued || disposed) return;
    const job = queued;
    queued = null;
    if (mode === 'none') {
      // No hand anywhere: answer at once and keep saying so.
      job.resolve(null);
      return;
    }
    inflight = job;
    status.state = 'painting';
    let sheet: HandSheet | null = null;
    try {
      if (mode === 'worker') sheet = await viaWorker(job.req);
      else if (mode === 'main') sheet = await viaMain(job.req);
      status.state = 'idle';
      if (sheet) status.ms = sheet.ms;
    } catch (err) {
      // A worker that fails mid-sheet (a lost context, a driver) hands over to the page once.
      if (mode === 'worker' && (await useLocal())) {
        worker?.terminate();
        worker = null;
        status.via = 'main';
        try {
          sheet = await viaMain(job.req);
          status.state = 'idle';
          status.ms = sheet.ms;
        } catch (err2) {
          status.state = 'failed';
          status.error = err2 instanceof Error ? err2.message : String(err2);
        }
      } else {
        status.state = 'failed';
        status.error = err instanceof Error ? err.message : String(err);
      }
    }
    inflight = null;
    if (queued || disposed) {
      // Superseded while it was being painted: the newer request is the one that counts.
      closeSheet(sheet);
      job.resolve(null);
    } else {
      job.resolve(sheet);
    }
    void pump();
  };

  return {
    paint(req) {
      return new Promise((resolve) => {
        queued?.resolve(null);
        queued = { req, resolve };
        void pump();
      });
    },
    status: () => ({ ...status }),
    dispose() {
      disposed = true;
      queued?.resolve(null);
      queued = null;
      worker?.terminate();
      worker = null;
      for (const w of waiting.values()) w(new Error('hand: disposed'));
      waiting.clear();
    },
  };
}
