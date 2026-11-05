import type { Stroke } from '@kiruk/kirukal';
import { describe, expect, it } from 'vitest';
import { getInkStrokes, nextEmptyTake, setInkStrokes } from './ink';

const stroke: Stroke = {
  role: 'body',
  samples: [
    [10, 10, 0.5, 0, 0],
    [20, 12, 0.6, 0, 0],
  ],
};

describe('nextEmptyTake', () => {
  it('advances to the next empty slot and stays on the last wanted take', () => {
    expect(nextEmptyTake({}, 'frame.box', '1', 4)).toBe('2');
    expect(nextEmptyTake({}, 'frame.box', '4', 4)).toBe('4');
    expect(nextEmptyTake({}, 'eye.blink', '1', 1)).toBe('1');
  });

  it('skips a later take that already has ink', () => {
    const ink = setInkStrokes({}, 'frame.box', '2', [stroke]);
    expect(getInkStrokes(ink, 'frame.box', '2')).toHaveLength(1);
    expect(nextEmptyTake(ink, 'frame.box', '1', 4)).toBe('3');
  });
});
