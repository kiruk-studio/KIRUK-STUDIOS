'use client';
/**
 * Keeps the key clear of the title block. The title grows down from the top, the key
 * up from the foot; on a short or narrow window they can meet, and CSS cannot see that.
 * So: try the key in full; if it touches the title, set it in two compact columns; if
 * it still touches, leave it out (the figure's letters stay on the plate).
 * Re-checked whenever either block changes size. spec-link: ideas/studio-dawn/eye.md
 */
import { useEffect } from 'react';

const GAP = 14;

export function KeyFit() {
  useEffect(() => {
    const title = document.querySelector<HTMLElement>('.eye-title');
    const key = document.querySelector<HTMLElement>('.eye-key');
    if (!title || !key) return;
    let busy = false;
    const fit = () => {
      if (busy) return;
      busy = true;
      const clear = () =>
        key.getBoundingClientRect().top >= title.getBoundingClientRect().bottom + GAP;
      for (const mode of ['full', 'compact', 'none'] as const) {
        key.dataset.fit = mode;
        if (mode === 'none' || clear()) break;
      }
      busy = false;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(title);
    ro.observe(document.documentElement);
    fit();
    return () => ro.disconnect();
  }, []);
  return null;
}
