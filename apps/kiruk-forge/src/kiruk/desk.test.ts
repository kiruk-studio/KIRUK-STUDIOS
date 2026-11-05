import type { Stroke } from '@kiruk/kirukal';
import { describe, expect, it } from 'vitest';

import {
  anatomyForComponent,
  latestFilledTake,
  nextDeskAfterPublish,
  resolveDeskSelection,
} from './desk';
import { setInkStrokes } from './ink';

const stroke: Stroke = {
  role: 'body',
  samples: [
    [10, 10, 0.5, 0, 0],
    [20, 12, 0.6, 0, 0],
  ],
};

describe('forge desk selection', () => {
  it('opens Button on the first empty Tight box take', () => {
    expect(anatomyForComponent('button', {})).toEqual({
      markId: 'frame.box-tight',
      take: '1',
    });
  });

  it('advances to the next empty take on the same piece', () => {
    const ink = setInkStrokes({}, 'frame.box-tight', '1', [stroke]);
    expect(nextDeskAfterPublish('button', 'frame.box-tight', '1', ink)).toEqual({
      markId: 'frame.box-tight',
      take: '2',
    });
  });

  it('moves to the next incomplete piece when this mark is full', () => {
    let ink: unknown = {};
    for (const take of ['1', '2', '3', '4']) {
      ink = setInkStrokes(ink, 'frame.box-tight', take, [stroke]);
    }
    const next = nextDeskAfterPublish('button', 'frame.box-tight', '4', ink);
    expect(next.markId).not.toBe('frame.box-tight');
    expect(next.take).toBe('1');
    expect(anatomyForComponent('button', ink).markId === 'frame.box-tight').toBe(false);
  });

  it('keeps the active piece when it still belongs to the picked component', () => {
    expect(
      resolveDeskSelection({
        'forge.component': 'switch',
        'forge.anatomy': { markId: 'part.switch-knob', take: '2' },
      }),
    ).toEqual({
      componentId: 'switch',
      markId: 'part.switch-knob',
      take: '2',
    });
  });

  it('finds the latest filled take for Edit', () => {
    const ink = setInkStrokes(
      setInkStrokes({}, 'frame.box-tight', '1', [stroke]),
      'frame.box-tight',
      '2',
      [stroke],
    );
    expect(latestFilledTake(ink, 'frame.box-tight')).toBe('2');
    expect(latestFilledTake({}, 'frame.box-tight')).toBeNull();
  });
});
