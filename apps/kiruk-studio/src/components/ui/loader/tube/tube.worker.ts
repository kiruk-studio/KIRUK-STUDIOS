/// <reference lib="webworker" />

/**
 * The opening's tube, drawn off the main thread (tube-scene.ts). The main
 * thread spends the opening building the eye's shaders and stalls for whole
 * seconds; this worker draws on an OffscreenCanvas with its own frame clock,
 * so the formation never stops mid-frame.
 */

import type { TubeEvent, TubeFrame } from './eye-lines';
import { createTubeScene, type TubeScene } from './tube-scene';

/** The live eye's pupil, CSS px. */
export type PupilAt = { x: number; y: number; r: number };

export type TubeMessage =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      frame: TubeFrame;
      reduce: boolean;
      speed: number;
      /** The still of the shut eye (absolute URL: a worker has no page to resolve against), and where it sits, CSS px. */
      imageUrl: string;
      imageRect: { left: number; top: number; width: number; height: number };
      debug?: number;
    }
  | { type: 'resize'; frame: TubeFrame }
  | { type: 'ready'; pupil?: PupilAt | null }
  | { type: 'skip' }
  | { type: 'leave' }
  | { type: 'pointer'; x: number; y: number; down: boolean }
  | { type: 'key'; key: string }
  | { type: 'stats' };

/** Frame times on the tube's own clock, for the lab: how steady it ran, and how long the GPU took where it can say. */
export interface TubeStats {
  frames: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  gpuMs: number | null;
  /** Frames that took more than two refreshes: when (ms after the start) and how long. */
  hitches: [number, number][];
  /** When the tube started, ms since the epoch (performance.timeOrigin based), to line hitches up with the page's own clock. */
  startedAt: number;
}

const scope = self as unknown as DedicatedWorkerGlobalScope;
const nextFrame: (cb: () => void) => void =
  typeof scope.requestAnimationFrame === 'function'
    ? (cb) => scope.requestAnimationFrame(() => cb())
    : (cb) => setTimeout(cb, 16);

let scene: TubeScene | null = null;
let running = false;
let speed = 1;
let started = 0;
let last = 0;
const gaps: number[] = [];
const hitches: [number, number][] = [];

function loop() {
  if (!scene || !running) return;
  const now = performance.now();
  if (last) {
    gaps.push(now - last);
    if (now - last > 34 && hitches.length < 200)
      hitches.push([Math.round(last - started), Math.round(now - last)]);
  }
  last = now;
  scene.frame(started + (now - started) * speed);
  nextFrame(loop);
}

scope.onmessage = (e: MessageEvent<TubeMessage>) => {
  const m = e.data;
  switch (m.type) {
    case 'init': {
      speed = m.speed;
      started = performance.now();
      const emit = (ev: TubeEvent) => {
        scope.postMessage({ type: ev });
        if (ev === 'done') running = false;
      };
      scene = createTubeScene(m.canvas, m.frame, {
        reduce: m.reduce,
        emit,
        imageUrl: m.imageUrl,
        imageRect: m.imageRect,
        debug: m.debug,
      });
      // no WebGL2: no opening, and the eye shows at once
      if (!scene) {
        emit('done');
        return;
      }
      running = true;
      nextFrame(loop);
      break;
    }
    case 'resize':
      scene?.resize(m.frame);
      break;
    case 'ready':
      scene?.eyeReady(m.pupil);
      break;
    case 'skip':
      scene?.skip();
      break;
    case 'leave':
      scene?.leave();
      break;
    case 'pointer':
      scene?.pointer(m.x, m.y, m.down);
      break;
    case 'key':
      scene?.key(m.key);
      break;
    case 'stats': {
      const sorted = [...gaps].sort((a, b) => a - b);
      const stats: TubeStats = {
        frames: gaps.length,
        avgMs: gaps.reduce((a, b) => a + b, 0) / Math.max(1, gaps.length),
        p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        maxMs: sorted[sorted.length - 1] ?? 0,
        gpuMs: scene?.gpuMs() ?? null,
        hitches,
        startedAt: performance.timeOrigin + started,
      };
      scope.postMessage({ type: 'stats', stats });
      break;
    }
  }
};
