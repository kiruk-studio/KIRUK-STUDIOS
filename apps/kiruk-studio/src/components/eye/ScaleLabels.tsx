'use client';
/**
 * The printed scale's figures, in the reader's unit. They are part of the plate, so a
 * change of unit prints them again — once, not every frame.
 * spec-link: ideas/studio-dawn/eye.md — measure
 */
import { formatLength } from '@kiruk/burin/rig';
import type { CSSProperties } from 'react';
import { useEye } from './store';

type V = CSSProperties & Record<`--${string}`, string | number>;

export function ScaleLabels({ marks }: { marks: number[] }) {
  const unit = useEye((s) => s.unit);
  const S = useEye((s) => s.S);
  return (
    <>
      {marks.slice(1).map((y, i) => {
        const prev = marks[i] ?? y;
        const [num, sym] = formatLength(y - prev, unit, S).split(' ');
        return (
          <span key={`r-${prev}-${y}`} className="g-label" style={{ '--y': (y + prev) / 2 } as V}>
            {num}
            <i>{sym}</i>
          </span>
        );
      })}
    </>
  );
}
