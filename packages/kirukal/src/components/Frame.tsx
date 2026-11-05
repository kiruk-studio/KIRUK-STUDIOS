'use client';

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { hashSeed, synthesizeFrame } from '../engine';
import type { StrokeRecipe } from '../engine/types';

export type FrameProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  /**
   * Captured pen recipe. Until Forge takes exist, omit this — Frame still
   * supplies the box, never a fake hand-drawn stroke.
   */
  recipe?: StrokeRecipe;
  /** Deterministic seed from component identity. */
  seed?: number;
};

const STROKE_WIDTH_PX = 2;

/**
 * Tier-B container. Base layout is a measured box; kirukal strokes replay
 * around it when a recipe is present.
 *
 * spec-link: packages/kirukal/README.md#three-render-tiers
 */
export function Frame({ children, className, recipe, seed, style, ...props }: FrameProps) {
  const identity = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    const update = () => {
      setSize({ height: node.clientHeight, width: node.clientWidth });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const resolvedSeed = seed ?? hashSeed(identity);
  const paths =
    recipe && size.width > 0 && size.height > 0
      ? synthesizeFrame(recipe, {
          height: size.height,
          seed: resolvedSeed,
          strokeWidth: STROKE_WIDTH_PX,
          width: size.width,
        })
      : [];

  const mergedStyle: CSSProperties = {
    isolation: 'isolate',
    position: 'relative',
    ...style,
  };

  return (
    <div {...props} className={className} data-kirukal="frame" ref={boxRef} style={mergedStyle}>
      {paths.length > 0 ? (
        <svg
          aria-hidden="true"
          data-kirukal="artwork"
          focusable="false"
          height={size.height}
          style={{
            display: 'block',
            inset: 0,
            pointerEvents: 'none',
            position: 'absolute',
          }}
          viewBox={`0 0 ${size.width} ${size.height}`}
          width={size.width}
        >
          {paths.map((d, index) => (
            <path
              d={d}
              fill="currentColor"
              // biome-ignore lint/suspicious/noArrayIndexKey: the strokes of one drawn mark, fixed order, never reordered
              key={`${identity}-${index}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ) : null}
      <div data-kirukal="frame-content" style={{ position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
