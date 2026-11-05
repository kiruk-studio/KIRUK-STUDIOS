'use client';

import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StudioNav } from '@/components/studio/StudioNav';

/**
 * The studio page's eye. Geometry is the resting lids from kiruk.in's navbar
 * (REST_FULL): a parabola, deep at the screen edges, shallow at the centre.
 * Era labels and the module nav stay in the private repo.
 */

type Lid = { edge: number; mid: number };
type Eye = { top: Lid; bottom: Lid };

const REST: Eye = { top: { edge: 72, mid: 12 }, bottom: { edge: 60, mid: 30 } };
const WIDE: Eye = { top: { edge: 34, mid: 4 }, bottom: { edge: 24, mid: 4 } };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixLid = (a: Lid, b: Lid, t: number): Lid => ({
  edge: lerp(a.edge, b.edge, t),
  mid: lerp(a.mid, b.mid, t),
});
const mixEye = (a: Eye, b: Eye, t: number): Eye => ({
  top: mixLid(a.top, b.top, t),
  bottom: mixLid(a.bottom, b.bottom, t),
});

/** A quadratic with its control point at x = w/2 traces the lid parabola. */
const ctrl = (lid: Lid) => 2 * lid.mid - lid.edge;
const topFill = (l: Lid, w: number) => `M0 0H${w}V${l.edge}Q${w / 2} ${ctrl(l)} 0 ${l.edge}Z`;
/** Upper lash: a crescent, ~3px at the centre, a hairline at the edges. */
const topLine = (l: Lid, w: number) => {
  const inner: Lid = { edge: l.edge - 0.75, mid: l.mid - 3 };
  return `M0 ${l.edge}Q${w / 2} ${ctrl(l)} ${w} ${l.edge}L${w} ${inner.edge}Q${w / 2} ${ctrl(inner)} 0 ${inner.edge}Z`;
};
const bottomFill = (l: Lid, w: number, h: number) =>
  `M0 ${h}H${w}V${h - l.edge}Q${w / 2} ${h - ctrl(l)} 0 ${h - l.edge}Z`;
const bottomLine = (l: Lid, w: number, h: number) =>
  `M0 ${h - l.edge}Q${w / 2} ${h - ctrl(l)} ${w} ${h - l.edge}`;

const INK = '#1a120e';

export function EyeFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  const frameRef = useRef<HTMLDivElement>(null);
  const topFillRef = useRef<SVGPathElement>(null);
  const topLineRef = useRef<SVGPathElement>(null);
  const bottomFillRef = useRef<SVGPathElement>(null);
  const bottomLineRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const blink = useMotionValue(0);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--simple-game-nav-bottom', `${REST.top.edge}px`);
    root.setProperty('--eye-mid', `${REST.top.mid}px`);
    root.setProperty('--eye-lid-bottom', `${REST.bottom.edge}px`);
    if (size.w) root.setProperty('--eye-vw', String(size.w));
  }, [size.w]);

  const draw = useCallback(() => {
    const { w, h } = size;
    if (!w || !h) return;
    const closed: Eye = {
      top: { edge: h * 0.56, mid: h * 0.56 },
      bottom: { edge: h * 0.46, mid: h * 0.46 },
    };
    const g = mixEye(mixEye(REST, WIDE, 0), closed, blink.get());
    topFillRef.current?.setAttribute('d', topFill(g.top, w));
    topLineRef.current?.setAttribute('d', topLine(g.top, w));
    bottomFillRef.current?.setAttribute('d', bottomFill(g.bottom, w, h));
    bottomLineRef.current?.setAttribute('d', bottomLine(g.bottom, w, h));
  }, [size, blink]);

  useEffect(() => {
    draw();
    return blink.on('change', draw);
  }, [draw, blink]);

  useEffect(() => {
    if (reduce === null) return;
    const el = frameRef.current;
    if (!el) return;
    let live = true;
    let ctl: { stop: () => void } | null = null;
    const tick = () => {
      if (!live) return;
      if (getComputedStyle(el).visibility === 'hidden') {
        requestAnimationFrame(tick);
        return;
      }
      const seen = sessionStorage.getItem('kiruk-lid-seen') === '1';
      if (reduce || seen) {
        blink.set(0);
        return;
      }
      sessionStorage.setItem('kiruk-lid-seen', '1');
      ctl = animate(blink, [0, 1, 1, 0], {
        duration: 0.42,
        times: [0, 0.28, 0.4, 1],
        ease: [0.4, 0, 0.2, 1],
      });
    };
    tick();
    return () => {
      live = false;
      ctl?.stop();
    };
  }, [reduce, blink]);

  return (
    <div className="eye-frame" ref={frameRef}>
      <svg
        aria-hidden="true"
        className="eye-lids"
        width={size.w || undefined}
        height={size.h || undefined}
        viewBox={size.w ? `0 0 ${size.w} ${size.h}` : undefined}
        preserveAspectRatio="none"
      >
        <path ref={topFillRef} fill={INK} />
        <path ref={bottomFillRef} fill={INK} />
        <path ref={topLineRef} fill={INK} />
        <path ref={bottomLineRef} fill="none" stroke={INK} strokeWidth={1} />
      </svg>
      <StudioNav vw={size.w} />
      {children}
    </div>
  );
}
