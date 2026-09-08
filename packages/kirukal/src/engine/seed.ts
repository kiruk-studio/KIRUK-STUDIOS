/**
 * Deterministic seeding.
 *
 * LAW: a synthesized stroke's seed comes from component identity, never from
 * Math.random(). A random seed re-rolls on every React render and the interface
 * visibly crawls — it is the most common way hand-drawn UIs read as broken, and
 * it also breaks Astro island hydration and Next RSC hydration, where server and
 * client must produce identical markup.
 *
 * spec-link: packages/kirukal/README.md#the-six-laws
 */

/** FNV-1a. Small, fast, well-distributed for short identity strings. */
export function hashSeed(identity: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < identity.length; i++) {
    h ^= identity.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Mulberry32 — deterministic PRNG. Same seed always yields the same sequence,
 * so a re-render reproduces the same line exactly.
 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick which of a mark's takes to use. Stable for a given identity. */
export function pickTake(seed: number, takeCount: number): number {
  if (takeCount <= 0) throw new Error('pickTake: takeCount must be positive');
  return seed % takeCount;
}
