'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import { NAV } from '@/lib/studio-ia';

type Lid = { edge: number; mid: number };

/** Upper lid at rest, the same parabola as the frame. */
const TOP: Lid = { edge: 72, mid: 12 };

const depthAt = (lid: Lid, x: number, w: number) => {
  const u = (x - w / 2) / (w / 2);
  return lid.mid + (lid.edge - lid.mid) * u * u;
};

const slopeAt = (lid: Lid, x: number, w: number) => {
  const half = w / 2;
  return (2 * (lid.edge - lid.mid) * (x - half)) / (half * half);
};

/** Sit each `[data-ride]` item on the upper lid, the way kiruk.in's navbar does. */
function useRide(rowRef: React.RefObject<HTMLDivElement | null>, vw: number, layoutKey: string) {
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || !vw) return;
    const place = () => {
      const left = row.getBoundingClientRect().left;
      row.querySelectorAll<HTMLElement>('[data-ride]').forEach((el) => {
        const cx = left + el.offsetLeft + el.offsetWidth / 2;
        const h = el.offsetHeight;
        const d = depthAt(TOP, cx, vw);
        const gap = Number(el.dataset.gap ?? 4);
        const tilt =
          el.dataset.ride === 'upright' ? 0 : (Math.atan(slopeAt(TOP, cx, vw)) * 180) / Math.PI;
        el.style.transform = `translateY(${Math.max(d - gap - h, 2)}px) rotate(${tilt}deg)`;
      });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(row);
    document.fonts?.ready.then(place).catch(() => {});
    return () => ro.disconnect();
  }, [rowRef, vw, layoutKey]);
}

/** Logo on the left of the lid. Work, ISM, Writing, Contact on the right. */
export function StudioNav({ vw }: { vw: number }) {
  const path = usePathname();
  const brandRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const key = `${path}|${vw}`;
  useRide(brandRef, vw, key);
  useRide(linksRef, vw, key);

  return (
    <header className="eye-nav">
      <div ref={brandRef} className="eye-nav-brand">
        <Link href="/" aria-label="kiruk, home" data-ride="upright" data-gap="8">
          <img src="/favicon.svg" width={28} height={28} alt="" />
        </Link>
      </div>
      <nav ref={linksRef} className="eye-nav-links" aria-label="Studio">
        {NAV.map((item) => {
          const current = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              data-ride
              data-gap="8"
            >
              <span className="eye-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
