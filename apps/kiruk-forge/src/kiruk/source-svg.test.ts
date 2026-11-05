import type { Stroke } from '@kiruk/kirukal';
import { describe, expect, it } from 'vitest';

import {
  buildSourceSvg,
  latestSourceVersion,
  nextSourceVersion,
  sourceFileName,
  sourceRelativePath,
} from './source-svg';

const stroke: Stroke = {
  role: 'body',
  samples: [
    [24, 24, 0.6, 0, 0],
    [120, 40, 0.7, 0, 0],
    [200, 80, 0.5, 0, 0],
  ],
};

describe('kirukal source SVG', () => {
  it('names append-only versions without overwriting', () => {
    expect(sourceFileName('frame.box', 1)).toBe('frame.box.v01.svg');
    expect(sourceRelativePath('frame.box', 2)).toBe('frame/frame.box.v02.svg');
    expect(latestSourceVersion([], 'frame.box')).toBe(0);
    expect(nextSourceVersion([], 'frame.box')).toBe(1);
    expect(
      nextSourceVersion(
        ['frame.box.v01.svg', 'frame.box.v02.svg', 'frame.pill.v09.svg'],
        'frame.box',
      ),
    ).toBe(3);
  });

  it('emits family viewBox ink paths without a download wrapper', () => {
    const svg = buildSourceSvg('frame.box', [stroke]);
    expect(svg).toContain('viewBox="0 0 384 384"');
    expect(svg).toContain('data-kirukal="ink"');
    expect(svg).toContain('fill="#000000"');
    expect(svg).not.toContain('blob:');
    expect(svg).not.toContain('download');
    expect(svg).not.toContain('id="guides"');
    expect(svg).not.toContain('#ff00ff');
  });
});
