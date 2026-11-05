/**
 * Deterministic randomness.
 *
 * Every mark on a plate draws from its own stream, forked from the plate seed by the
 * mark's identity. Adding a stroke never re-rolls the strokes around it, and the same
 * plate renders bit for bit on the server and in the browser (kirukal law 5).
 */

/** FNV-1a over a string. Small, fast, well spread for short identities. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mix two 32-bit integers (splitmix-style finaliser). */
export function mix32(a: number, b: number): number {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Hash of integer lattice coordinates and a seed, to [0, 1). */
export function hash3(x: number, y: number, seed: number): number {
  let h =
    Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [a, b). */
  range(a: number, b: number): number;
  /** Integer in [a, b]. */
  int(a: number, b: number): number;
  /** Standard normal (Box–Muller). */
  normal(): number;
  /** True with probability p. */
  chance(p: number): boolean;
  /** −1 or +1. */
  sign(): 1 | -1;
  pick<T>(items: readonly T[]): T;
  /** An independent stream for a named child (a mark, a pass, a glyph). */
  fork(label: string | number): Rng;
  readonly seed: number;
}

/** sfc32, seeded through splitmix so nearby seeds give unrelated streams. */
export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const split = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
  let a = split();
  let b = split();
  let c = split();
  let d = split();
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  let spare: number | null = null;
  const rng: Rng = {
    seed: seed >>> 0,
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    normal() {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return v;
      }
      let u = 0;
      let v = 0;
      while (u <= 1e-12) u = next();
      v = next();
      const m = Math.sqrt(-2 * Math.log(u));
      spare = m * Math.sin(2 * Math.PI * v);
      return m * Math.cos(2 * Math.PI * v);
    },
    chance: (p) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('mai/rng: pick from an empty list');
      return items[Math.floor(next() * items.length)] as T;
    },
    fork: (label) =>
      createRng(mix32(seed >>> 0, typeof label === 'number' ? label >>> 0 : hashString(label))),
  };
  return rng;
}

/** A seed from any identity string: the same name always draws the same mark. */
export const seedOf = (identity: string) => hashString(identity);
