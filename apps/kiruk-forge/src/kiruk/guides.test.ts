import { DEFAULT_MARK_ID, MARK_IDS } from '@kiruk/kirukal';
import { describe, expect, it } from 'vitest';

import {
  buildGuideGeometry,
  GUIDE_EDGE_INSET,
  GUIDE_SAFE_DASH,
  GUIDE_SLICE_DASH,
  guidesFitTemplate,
  previewSvgFromGuides,
} from './guides';

describe('kirukal live guides', () => {
  it('keeps every segment inside the drawing template', () => {
    for (const markId of MARK_IDS) {
      expect(guidesFitTemplate(markId), markId).toBe(true);
    }
  });

  it('draws a solid paper sheet and a mark/strip divider for frame.box', () => {
    const segments = buildGuideGeometry(DEFAULT_MARK_ID);
    const paper = segments.find((segment) => segment.kind === 'rect' && segment.dash === null);
    expect(paper).toBeDefined();
    expect(paper?.lineWidth).toBe(2);
    expect(paper?.x1).toBe(GUIDE_EDGE_INSET);
    expect(paper?.y1).toBe(GUIDE_EDGE_INSET);
    expect(paper?.x2).toBe(384 - GUIDE_EDGE_INSET);
    expect(paper?.y2).toBe(440 - GUIDE_EDGE_INSET);
    expect(
      segments.some(
        (segment) =>
          segment.kind === 'line' &&
          segment.dash === null &&
          segment.y1 === 384 &&
          segment.y2 === 384,
      ),
    ).toBe(true);
  });

  it('matches outline dash arrays for frame.box', () => {
    const segments = buildGuideGeometry(DEFAULT_MARK_ID);
    expect(segments.some((segment) => segment.dash === null)).toBe(true);
    expect(
      segments.some(
        (segment) =>
          segment.kind === 'rect' &&
          segment.dash?.[0] === GUIDE_SAFE_DASH[0] &&
          segment.dash?.[1] === GUIDE_SAFE_DASH[1],
      ),
    ).toBe(true);
    expect(
      segments.some(
        (segment) =>
          segment.kind === 'line' &&
          segment.dash?.[0] === GUIDE_SLICE_DASH[0] &&
          segment.dash?.[1] === GUIDE_SLICE_DASH[1],
      ),
    ).toBe(true);
  });

  it('draws anatomy silhouettes for switch, checkbox, and radio pieces', () => {
    expect(
      buildGuideGeometry('part.switch-track').some((segment) => segment.kind === 'roundRect'),
    ).toBe(true);
    expect(
      buildGuideGeometry('part.checkbox-box').some(
        (segment) => segment.kind === 'rect' && segment.dash !== null,
      ),
    ).toBe(true);
    expect(
      buildGuideGeometry('part.radio-ring').some((segment) => segment.kind === 'ellipse'),
    ).toBe(true);
    expect(
      buildGuideGeometry('frame.box').some(
        (segment) => segment.kind === 'roundRect' || segment.kind === 'ellipse',
      ),
    ).toBe(false);
    expect(buildGuideGeometry('frame.pill').some((segment) => segment.kind === 'roundRect')).toBe(
      true,
    );
  });

  it('emits an ink-colored construction preview without the brush swatch', () => {
    const svg = previewSvgFromGuides('frame.box-tight');
    expect(svg).toContain('viewBox="0 0 384 384"');
    expect(svg).toContain('currentColor');
    expect(svg).not.toContain('#FF00FF');
    expect(svg).not.toContain('412');
  });
});
