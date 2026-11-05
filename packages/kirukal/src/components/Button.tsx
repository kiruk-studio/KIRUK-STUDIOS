'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { type ComponentProps, type CSSProperties, useEffect, useId, useRef, useState } from 'react';

import { hashSeed, synthesizeMark } from '../engine';
import type { StrokeRecipe } from '../engine/types';

export type ButtonProps = ComponentProps<typeof BaseButton> & {
  /**
   * Captured pen recipe for the tight frame. Omit until Forge takes exist —
   * Base UI still owns structure, keyboard, focus, and ARIA.
   */
  recipe?: StrokeRecipe;
  seed?: number;
};

const STROKE_WIDTH_PX = 2;

/**
 * Base UI Button with an optional kirukal surface. Empty recipe means no
 * fake stroke: construction chrome only.
 *
 * spec-link: packages/kirukal/README.md#why-this-is-not-another-sketchy-ui-library
 */
export function Button({ children, className, recipe, seed, style, ...props }: ButtonProps) {
  const identity = useId();
  const hostRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    const node = hostRef.current;
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
      ? synthesizeMark(recipe, {
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
    <BaseButton
      className={className}
      data-kirukal="button"
      ref={(node) => {
        hostRef.current = node;
      }}
      style={mergedStyle}
      {...props}
    >
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
      <span data-kirukal="button-label" style={{ position: 'relative' }}>
        {children}
      </span>
    </BaseButton>
  );
}
