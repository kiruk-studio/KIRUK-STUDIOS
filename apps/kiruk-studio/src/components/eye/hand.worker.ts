/// <reference lib="webworker" />
/**
 * The hand's worker: p5.brush (standalone, WebGL 2 on an OffscreenCanvas) colours each
 * impression of the plate off the main thread and hands the media back as ImageBitmaps.
 *
 * spec-link: ideas/studio-dawn/hand.md
 */
import { eyeHand } from '@kiruk/burin/eye-hand';
import { serveHand } from '@kiruk/burin/hand/worker';

serveHand(self as unknown as DedicatedWorkerGlobalScope, { eye: eyeHand });
