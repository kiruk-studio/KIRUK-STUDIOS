/**
 * @kiruk/kirukal — the hand-drawn component layer.
 *
 * Base UI supplies structure, keyboard behaviour, focus and ARIA. kiruk supplies
 * the surface, replayed from pen strokes Arun captured in the forge.
 *
 * Client-only components live here; each carries 'use client' in its own file so
 * a Next RSC page can import it directly and only the leaf goes client. The
 * zero-JS subset is ./server.
 */

export * from './engine';
export * from './server';
