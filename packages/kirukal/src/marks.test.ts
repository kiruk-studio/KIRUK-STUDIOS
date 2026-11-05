import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MARK_ID,
  getMarkSelectLabel,
  getMarkTemplateSize,
  getMarkViewBox,
  MARK_CATALOG,
  MARK_IDS,
  MARK_TEMPLATE_SWATCH_HEIGHT,
} from './marks';

describe('kirukal mark catalog', () => {
  it('covers every mark id', () => {
    expect(Object.keys(MARK_CATALOG).sort()).toEqual([...MARK_IDS].sort());
  });

  it('sizes the drawing template to the family box plus the brush strip', () => {
    const box = getMarkViewBox(DEFAULT_MARK_ID);
    expect(getMarkTemplateSize(DEFAULT_MARK_ID)).toEqual({
      height: box.height + MARK_TEMPLATE_SWATCH_HEIGHT,
      width: box.width,
    });
    expect(getMarkTemplateSize('wordmark.kiruk')).toEqual({
      height: 256 + MARK_TEMPLATE_SWATCH_HEIGHT,
      width: 1024,
    });
  });

  it('names consumers on the select label', () => {
    expect(getMarkSelectLabel('frame.box')).toContain('Frame');
    expect(getMarkSelectLabel('part.focus-halo')).toContain('every component');
  });
});
