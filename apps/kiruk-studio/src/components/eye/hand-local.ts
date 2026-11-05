/**
 * The hand on the main thread, for browsers that cannot paint WebGL 2 in a worker.
 * Loaded only then, so p5.brush stays out of the page bundle otherwise.
 *
 * spec-link: ideas/studio-dawn/hand.md
 */
import { eyeHand } from '@kiruk/burin/eye-hand';
import { paintingCanvas, paintSheet } from '@kiruk/burin/hand/painter';

export const recipes = { eye: eyeHand };
export { paintingCanvas, paintSheet };
