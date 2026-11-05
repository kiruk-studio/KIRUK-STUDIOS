/// <reference lib="webworker" />

/**
 * The ink opening, drawn off the main thread (ink-scene.ts). While the pen draws,
 * the page under the loader is booting its own engine and can stall the main
 * thread for whole seconds on a first shader compile; this worker draws on
 * OffscreenCanvases with its own frame clock, so the hand never stops mid-stroke.
 */
import type { InkColors } from '@kiruk/burin/hand';
import type { InkFrame } from './frame';
import { createInkScene, type InkEvent, type InkLayerName, type InkScene } from './ink-scene';

export type InkMessage =
  | {
      type: 'init';
      canvases: Record<InkLayerName, OffscreenCanvas>;
      frame: InkFrame;
      reduce: boolean;
      speed: number;
      colors: InkColors;
    }
  | { type: 'resize'; frame: InkFrame }
  | { type: 'pointer'; x: number; y: number }
  | { type: 'leave' }
  | { type: 'skip' }
  | { type: 'enter' };

/** What the worker tells the page: the scene's events, or that it cannot draw here. */
export type InkReply = InkEvent | { type: 'failed' };

const scope = self as unknown as DedicatedWorkerGlobalScope;
const nextFrame: (cb: (now: number) => void) => void =
  typeof scope.requestAnimationFrame === 'function'
    ? (cb) => scope.requestAnimationFrame(cb)
    : (cb) => setTimeout(() => cb(performance.now()), 16);

let scene: InkScene | null = null;

function loop(now: number) {
  if (!scene) return;
  scene.frame(now);
  nextFrame(loop);
}

scope.onmessage = (e: MessageEvent<InkMessage>) => {
  const m = e.data;
  switch (m.type) {
    case 'init': {
      try {
        scene = createInkScene(m.canvases, m.frame, {
          reduce: m.reduce,
          speed: m.speed,
          colors: m.colors,
          emit: (ev) => scope.postMessage(ev satisfies InkReply),
        });
      } catch (err) {
        console.warn('[ink] the opening cannot draw here:', err);
        scene = null;
      }
      if (!scene) {
        scope.postMessage({ type: 'failed' } satisfies InkReply);
        return;
      }
      nextFrame(loop);
      break;
    }
    case 'resize':
      scene?.resize(m.frame);
      break;
    case 'pointer':
      scene?.pointer(m.x, m.y);
      break;
    case 'leave':
      scene?.leave();
      break;
    case 'skip':
      scene?.skip();
      break;
    case 'enter':
      scene?.enter();
      break;
  }
};
