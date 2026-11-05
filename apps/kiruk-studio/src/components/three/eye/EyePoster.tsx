'use client';

/**
 * The eye before any shader has compiled: a still of the era's eye, placed by
 * the eye's own framing so the live eye crossfades in exactly on top of it.
 *
 * Deliberately three-free. It ships with the loader and has to paint on the
 * first frame, long before the renderer chunk has arrived.
 *
 * It does not fade itself out. The live eye fades in over it; once that is
 * done the poster just leaves, so the crossfade never dips through the room.
 */

import React, { useEffect, useRef, useState } from 'react';
import { type PosterPlacement, posterPlacement, posterSrc, posterVariantFor } from './posters';

/** Longer than the live eye's fade-in, so the poster is gone only once covered. */
const LEAVE_AFTER_MS = 650;
const FEATHER =
  'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), ' +
  'linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)';

interface EyePosterProps {
  eraId: string;
  /** The live eye is up; the poster can go. */
  hidden: boolean;
}

export default function EyePoster({ eraId, hidden }: EyePosterProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [gone, setGone] = useState(false);
  /** Posters that are not there (not captured yet); the room shows instead. */
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!hidden) {
      setGone(false);
      return;
    }
    const id = window.setTimeout(() => setGone(true), LEAVE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [hidden]);

  let src: string | null = null;
  let place: PosterPlacement | null = null;
  if (size && size.w > 0 && size.h > 0) {
    const variant = posterVariantFor(size.w, size.h);
    src = posterSrc(eraId, variant);
    place = posterPlacement(size.w, size.h, variant);
  }

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {!gone && src && place && !missing.has(src) && (
        // A plain img: next/image would size and lazy-load it, and this has to
        // be exactly where the eye is, on the first frame.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
          onError={() => {
            const s = src as string;
            setMissing((prev) => new Set(prev).add(s));
          }}
          style={{
            position: 'absolute',
            left: place.left,
            top: place.top,
            width: place.width,
            height: place.height,
            maxWidth: 'none',
            userSelect: 'none',
            // At a shape between the two captures the poster stops short of an
            // edge; feathered, it sinks into the room instead of showing a box.
            maskImage: FEATHER,
            WebkitMaskImage: FEATHER,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
      )}
    </div>
  );
}
