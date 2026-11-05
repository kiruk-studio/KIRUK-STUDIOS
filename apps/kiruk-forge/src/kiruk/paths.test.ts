import { getMarkBrushWeight, type Stroke } from '@kiruk/kirukal';
import { describe, expect, it } from 'vitest';

import { inkPathsFromStrokes } from './paths';

const stroke: Stroke = {
  role: 'body',
  samples: [
    [24, 24, 0.6, 0, 0],
    [80, 40, 0.8, 0, 0],
    [160, 90, 0.4, 0, 0],
  ],
};

describe('inkPathsFromStrokes', () => {
  it('uses the mark brush weight and keeps live strokes from pinching', () => {
    expect(getMarkBrushWeight('frame.box')).toBe(4.5);
    const committed = inkPathsFromStrokes('frame.box', [stroke], 384, 440);
    const live = inkPathsFromStrokes('frame.box', [stroke], 384, 440, {
      last: false,
    });
    const thin = inkPathsFromStrokes('frame.box', [stroke], 384, 440, {
      strokeWidth: 2,
    });
    expect(committed.length).toBeGreaterThan(0);
    expect(live[0]).not.toBe(committed[0]);
    expect(thin[0]).not.toBe(committed[0]);
  });
});
