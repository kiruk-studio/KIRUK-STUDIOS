/** Node-only helpers: PNG encoding, baked paper, Chromium rasterisation for proofs. */

export { type BakeResult, bakePlate, cropPlate } from './bake.ts';
export { encodePNG } from './png.ts';
export { type ProofResult, proofPlate } from './proof.ts';
export { browser, closeBrowser, decodePNG, rasterSVG } from './raster.ts';
