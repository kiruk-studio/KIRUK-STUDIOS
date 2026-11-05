/**
 * The eras' real home pages, as the screen shows them.
 *
 * The screen the eye looks at is the site itself: each era's home page as it
 * ships, captured by scripts/eye-screens.mjs into public/eye/screens (one
 * 768 px column, up to three viewports tall). The screen pass scrolls it
 * through its own viewport and puts it through the era's display; until a
 * page has arrived, or if it never does, the painted stand-in
 * (era-screen-texture) is what shows.
 *
 * Two slots, A and B, so a change of era crossfades from the page that was up
 * to the one that has just arrived. Each slot is one texture node whose value
 * is swapped here: the samples taken from it in the graph follow it (three's
 * `sample()` keeps a reference to the node), so nothing recompiles. Two
 * things three needs for that: each slot starts on a placeholder of its own
 * (two nodes on one texture are built into one binding, and both slots would
 * read A), and each page carries a texture version of its own (below).
 */

import { DataTexture, LinearFilter, type Texture, TextureLoader } from 'three/webgpu';
import { UI_H, UI_W } from './nodes/screen';
import { type N, T } from './nodes/tsl';
import { damp } from './rig/motion';

const { texture } = T;

/** The last texture version handed out (the placeholders are at 1). */
let versions = 1;

export function pageSrc(era: string) {
  return `/eye/screens/${era}.webp`;
}

interface Page {
  tex: Texture | null;
  /** One viewport's share of the page's height. */
  view: number;
  failed: boolean;
}

export class ScreenPages {
  /** The slots' texture nodes, for the screen pass to sample. */
  readonly a: N;
  readonly b: N;
  viewA = 1;
  viewB = 1;
  /** A → B: the crossfade to the page that arrived last. */
  mix = 1;
  /** How much the real page shows over the painted stand-in. */
  on = 0;

  private eraA: string | null = null;
  private eraB: string | null = null;
  private readonly pages = new Map<string, Page>();
  private readonly loader = new TextureLoader();
  private readonly placeholders: DataTexture[];

  constructor() {
    this.placeholders = [0, 1].map(() => {
      const t = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
      t.needsUpdate = true;
      return t;
    });
    this.a = texture(this.placeholders[0]);
    this.b = texture(this.placeholders[1]);
  }

  private load(era: string): Page {
    const known = this.pages.get(era);
    if (known) return known;
    const page: Page = { tex: null, view: 1, failed: false };
    this.pages.set(era, page);
    if (era === 'codex') {
      page.failed = true;
      return page;
    }
    this.loader.load(
      pageSrc(era),
      (tex) => {
        tex.minFilter = LinearFilter;
        tex.magFilter = LinearFilter;
        tex.generateMipmaps = false;
        const img = tex.image as { width: number; height: number };
        page.view = Math.min(1, ((UI_H / UI_W) * img.width) / Math.max(img.height, 1));
        // three rebinds a swapped texture only if its version differs from the
        // one it replaces (Bindings compares `generation`, taken from the
        // version), and every freshly loaded image is at version 1: give each
        // page a version of its own, or a swap is never seen
        const want = ++versions;
        while (tex.version < want) tex.needsUpdate = true;
        page.tex = tex;
      },
      undefined,
      () => {
        page.failed = true;
      },
    );
    return page;
  }

  /** Starts loading an era's page before it is needed (the era being travelled to). */
  prefetch(era: string) {
    this.load(era);
  }

  /** Whether an era's page has arrived (or will never: it failed). */
  ready(era: string) {
    const page = this.load(era);
    return page.tex !== null || page.failed;
  }

  /**
   * Once a frame, with the era that should be up. A page that has not arrived
   * yet leaves the last one up (or the stand-in) until it does.
   * @returns whether a fade is running (the screen pass must keep drawing)
   */
  /** @param snap a new page lands whole, with no fade (the lids are shut on a cut between eras) */
  update(era: string, enabled: boolean, dt: number, reduce: boolean, snap = false): boolean {
    const page = this.load(era);
    if (page.tex && era !== this.eraB) {
      if (this.eraB) {
        this.eraA = this.eraB;
        this.a.value = this.b.value;
        this.viewA = this.viewB;
        this.mix = 0;
      } else {
        this.mix = 1;
      }
      this.eraB = era;
      this.b.value = page.tex;
      this.viewB = page.view;
    }
    this.mix = snap ? 1 : Math.min(1, this.mix + dt * (reduce ? 8 : 2.6));
    const goal = enabled && this.eraB !== null && !page.failed ? 1 : 0;
    this.on = damp(this.on, goal, reduce ? 60 : 5, dt);
    if (Math.abs(this.on - goal) < 0.002) this.on = goal;
    return this.mix < 1 || this.on !== goal;
  }

  info() {
    return { eraA: this.eraA, eraB: this.eraB, mix: this.mix, on: this.on };
  }

  dispose() {
    for (const p of this.pages.values()) p.tex?.dispose();
    for (const t of this.placeholders) t.dispose();
  }
}
