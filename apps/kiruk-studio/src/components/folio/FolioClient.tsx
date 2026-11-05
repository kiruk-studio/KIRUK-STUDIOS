'use client';
/**
 * The folio's rig — everything the rest state does not need:
 * the GPU paper, holding the page to the light, the ink pass (HTML-in-Canvas),
 * Desirable's scrub, the one-time draw-in, and key ↔ part focus.
 * The server-rendered plates are complete without it (codex live.md).
 *
 * spec-link: ideas/studio-dawn/folio.md
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { at, K } from './calc/fn';
import { Spring } from './calc/spring';
import type { Paper, PaperState } from './paper/engine';
import { drawTable, type Material } from './plates/desirable-geom';
import { folio } from './store';

const DRAWN_KEY = 'kiruk-folio-drawn';

function canHtmlInCanvas() {
  return typeof HTMLCanvasElement !== 'undefined' && 'requestPaint' in HTMLCanvasElement.prototype;
}

export function FolioClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const [inkText, setInkText] = useState<string | null>(null);
  const [inkWidth, setInkWidth] = useState(0);

  // ── page-wide rig ────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.js = '';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Draw-in: once per visit, when the plate is in view and the iris has opened.
    const plates = [...document.querySelectorAll<HTMLElement>('.folio .plate')];
    const draw = !reduce && sessionStorage.getItem(DRAWN_KEY) !== '1';
    let io: IntersectionObserver | null = null;
    let revealRaf = 0;
    if (draw) {
      root.classList.add('draw-pending');
      const start = () => {
        if (getComputedStyle(plates[0] ?? document.body).visibility !== 'visible') {
          revealRaf = requestAnimationFrame(start);
          return;
        }
        sessionStorage.setItem(DRAWN_KEY, '1');
        io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                (e.target as HTMLElement).dataset.draw = 'go';
                io?.unobserve(e.target);
              }
            }
          },
          { threshold: 0.18 },
        );
        for (const p of plates) io.observe(p);
      };
      start();
    }

    // Key ↔ part focus: hovering or tabbing to a key line names its part on the plate.
    const onFocus = (e: Event) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
      const plate = (e.target as HTMLElement).closest<HTMLElement>('.plate');
      if (plate) plate.dataset.focus = li?.dataset.key ?? '';
    };
    const onBlur = (e: Event) => {
      const plate = (e.target as HTMLElement).closest<HTMLElement>('.plate');
      if (plate) plate.dataset.focus = '';
    };
    document.addEventListener('pointerover', onFocus);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);

    // Desirable: scrub W, switch the top. Both sheets redraw from the same formula.
    const plate2 = document.querySelector<HTMLElement>('[data-desirable]');
    let tableW = 120;
    let material: Material = 'oak';
    const redraw = () => {
      for (const svg of plate2?.querySelectorAll<SVGSVGElement>('svg.sheet') ?? []) {
        const wide = svg.dataset.sheet === 'wide';
        const t = drawTable({ W: tableW, material }, wide, wide ? 'pii-w' : 'pii-p');
        for (const part of ['cons', 'ink', 'line', 'letters'] as const) {
          const g = svg.querySelector(`[data-dyn="${part}"]`);
          if (!g) continue;
          // Construction also carries the inset satellite's cross on the wide sheet; keep it.
          g.innerHTML =
            part === 'cons' ? t.cons + (g.querySelector('[data-keep]')?.outerHTML ?? '') : t[part];
        }
        plate2?.toggleAttribute('data-error', t.error);
      }
      folio.set({ tableW, glass: material === 'glass' });
    };
    const range = plate2?.querySelector<HTMLInputElement>('input[data-ctl="W"]');
    const out = plate2?.querySelector<HTMLOutputElement>('output[data-out="W"]');
    const onRange = () => {
      tableW = Number(range?.value ?? 120);
      if (out) out.textContent = `${tableW} cm`;
      range?.setAttribute('aria-valuetext', `width ${tableW} centimetres`);
      redraw();
    };
    range?.addEventListener('input', onRange);
    const toggles = [...(plate2?.querySelectorAll<HTMLButtonElement>('[data-material]') ?? [])];
    const onMaterial = (e: Event) => {
      material = (e.currentTarget as HTMLButtonElement).dataset.material as Material;
      for (const b of toggles)
        b.setAttribute('aria-checked', String(b.dataset.material === material));
      redraw();
    };
    for (const b of toggles) b.addEventListener('click', onMaterial);

    return () => {
      cancelAnimationFrame(revealRaf);
      io?.disconnect();
      document.removeEventListener('pointerover', onFocus);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
      range?.removeEventListener('input', onRange);
      for (const b of toggles) b.removeEventListener('click', onMaterial);
      root.classList.remove('draw-pending');
    };
  }, []);

  // ── HTML-in-Canvas: put a live copy of Plate I's claim inside the paper canvas ──
  useEffect(() => {
    if (!canHtmlInCanvas()) return;
    const claim = document.getElementById('plate-i-claim');
    if (!claim) return;
    setInkText(claim.textContent);
    const ro = new ResizeObserver(() => setInkWidth(claim.getBoundingClientRect().width));
    ro.observe(claim);
    return () => ro.disconnect();
  }, []);

  // ── the paper ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let paper: Paper | null = null;
    let alive = true;
    let raf = 0;
    let dirty = true;
    const transmit = new Spring(0, 9);
    const wet = new Spring(0, 2.6);
    let pointer: [number, number] = [-999, -999];
    let lastScroll = window.scrollY;
    let lastT = performance.now();
    const vel: number[] = [];
    let pushAt = 0;
    const claim = document.getElementById('plate-i-claim');

    const state = (): PaperState => {
      const W = document.documentElement.clientWidth;
      const L = at(W);
      const left = (W - L.container) / 2 + L.pad;
      const r = claim?.getBoundingClientRect();
      return {
        scroll: window.scrollY,
        transmit: transmit.x,
        pointer,
        wet: wet.x,
        chainStep: (L.main + K.NOTE_GAP) / L.cols,
        chainOffset: left,
        inkRect:
          r && r.width > 0
            ? [
                r.left,
                r.top,
                inkRef.current?.offsetWidth || r.width,
                inkRef.current?.offsetHeight || r.height,
              ]
            : null,
      };
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      const sy = window.scrollY;
      const moving = !transmit.done || !wet.done;
      if (!transmit.done) transmit.step(dt);
      if (!wet.done) wet.step(dt);
      if (sy !== lastScroll || moving) dirty = true;
      vel.push(dt > 0 ? (sy - lastScroll) / dt : 0);
      if (vel.length > 90) vel.shift();
      lastScroll = sy;
      if (dirty && paper) {
        const t0 = performance.now();
        paper.render(state());
        dirty = false;
        if (t - pushAt > 66) folio.set({ frameMs: Math.round((performance.now() - t0) * 10) / 10 });
      }
      if (t - pushAt > 66) {
        pushAt = t;
        const max = document.documentElement.scrollHeight - innerHeight;
        folio.set({
          W: document.documentElement.clientWidth,
          H: innerHeight,
          scroll: sy,
          progress: max > 0 ? sy / max : 0,
          velocity: vel.slice(),
          transmit: transmit.x,
          transmitTrace: transmit.history.slice(),
        });
      }
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      paper?.resize(window.innerWidth, window.innerHeight);
      dirty = true;
    };
    const onPointer = (e: PointerEvent) => {
      pointer = [e.clientX, e.clientY];
      const hero = (e.target as HTMLElement).closest?.('.plate-hero');
      if (hero) {
        wet.set(1);
        hero.classList.add('wet');
      }
      dirty = true;
    };
    const dry = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest?.('.plate-hero')) return;
      wet.set(0);
      document.querySelector('.plate-hero')?.classList.remove('wet');
    };

    // Hold to the light: press and hold the button, or hold L.
    const hold = (on: boolean) => {
      if (reduce) transmit.snap(on ? 1 : 0);
      else transmit.set(on ? 1 : 0);
      document.documentElement.classList.toggle('held-to-light', on);
      for (const b of document.querySelectorAll('[data-hold-light]'))
        b.setAttribute('aria-pressed', String(on));
      dirty = true;
    };
    const btns = [...document.querySelectorAll<HTMLButtonElement>('[data-hold-light]')];
    const down = (e: PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      hold(true);
    };
    const up = () => hold(false);
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'l' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      hold(e.type === 'keydown');
    };
    const btnKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!e.repeat) hold(e.type === 'keydown');
    };
    for (const b of btns) {
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
      b.addEventListener('keydown', btnKey);
      b.addEventListener('keyup', btnKey);
    }
    addEventListener('keydown', key);
    addEventListener('keyup', key);
    addEventListener('resize', onResize);
    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('pointerout', dry, { passive: true });

    // Boot the GPU after first paint, off the critical path.
    const boot = async () => {
      try {
        const { createPaper } = await import('./paper/engine');
        if (!alive) return;
        paper = await createPaper(canvas, inkRef.current);
        if (!alive) return paper.dispose();
        folio.set({
          backend: paper.info.backend,
          htmlInCanvas: paper.info.htmlInCanvas,
          dpr: paper.info.dpr,
        });
        if (paper.info.htmlInCanvas) document.documentElement.classList.add('ink-in-paper');
        canvas.classList.add('ready');
        dirty = true;
      } catch (err) {
        console.warn('[folio] paper fell back to CSS:', err);
        folio.set({ backend: 'css' });
      }
    };
    const idle = (
      window as Window & {
        requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (idle) idle(boot, { timeout: 1200 });
    else setTimeout(boot, 200);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      for (const b of btns) {
        b.removeEventListener('pointerdown', down);
        b.removeEventListener('pointerup', up);
        b.removeEventListener('pointercancel', up);
        b.removeEventListener('lostpointercapture', up);
        b.removeEventListener('keydown', btnKey);
        b.removeEventListener('keyup', btnKey);
      }
      removeEventListener('keydown', key);
      removeEventListener('keyup', key);
      removeEventListener('resize', onResize);
      removeEventListener('pointermove', onPointer);
      removeEventListener('pointerout', dry);
      paper?.dispose();
      document.documentElement.classList.remove('ink-in-paper', 'held-to-light');
    };
  }, []);

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: a canvas is not focusable; the GPU plate is decoration and its text lives in the DOM
    <canvas ref={canvasRef} className="paper" aria-hidden="true">
      {inkText !== null &&
        canvasRef.current &&
        createPortal(
          <div
            ref={inkRef}
            className="claim ink-source"
            style={{ width: inkWidth || undefined }}
            aria-hidden="true"
          >
            {inkText}
          </div>,
          canvasRef.current,
        )}
    </canvas>
  );
}
