import { describe, expect, it } from 'vitest';

import { samplePointerEvent, shouldAcceptPointer } from './input/pointer';
import { buildPostMdx, resolvePostSlug } from './mdx';
import { nextInkId, slugify } from './page';

describe('pointer palm rejection', () => {
  it('ignores touch even when pen-only is off', () => {
    expect(shouldAcceptPointer({ pointerType: 'touch' } as PointerEvent, false)).toBe(false);
  });

  it('accepts mouse only when pen-only is off', () => {
    expect(shouldAcceptPointer({ pointerType: 'mouse' } as PointerEvent, true)).toBe(false);
    expect(shouldAcceptPointer({ pointerType: 'mouse' } as PointerEvent, false)).toBe(true);
  });

  it('accepts pen either way', () => {
    expect(shouldAcceptPointer({ pointerType: 'pen' } as PointerEvent, true)).toBe(true);
  });

  it('ignores coalesced samples on untrusted pointer events', () => {
    const rect = { height: 1024, left: 0, top: 0, width: 768 } as DOMRect;
    const event = {
      clientX: 384,
      clientY: 512,
      isTrusted: false,
      pointerType: 'pen',
      pressure: 0.7,
      timeStamp: 1,
      getCoalescedEvents: () => [
        {
          clientX: 0,
          clientY: 0,
          pointerType: 'pen',
          pressure: 0.7,
          timeStamp: 1,
        },
      ],
    } as unknown as PointerEvent;
    const points = samplePointerEvent(event, rect, {
      height: 1024,
      width: 768,
    });
    expect(points).toHaveLength(1);
    expect(points[0]?.x).toBe(384);
    expect(points[0]?.y).toBe(512);
  });

  it('keeps coalesced samples on trusted pointer events', () => {
    const rect = { height: 1024, left: 0, top: 0, width: 768 } as DOMRect;
    const event = {
      clientX: 384,
      clientY: 512,
      isTrusted: true,
      pointerType: 'pen',
      pressure: 0.7,
      timeStamp: 1,
      getCoalescedEvents: () => [
        {
          clientX: 96,
          clientY: 128,
          pointerType: 'pen',
          pressure: 0.7,
          timeStamp: 1,
        },
        {
          clientX: 384,
          clientY: 512,
          pointerType: 'pen',
          pressure: 0.7,
          timeStamp: 1,
        },
      ],
    } as unknown as PointerEvent;
    const points = samplePointerEvent(event, rect, {
      height: 1024,
      width: 768,
    });
    expect(points.map((point) => [point.x, point.y])).toEqual([
      [96, 128],
      [384, 512],
    ]);
  });
});

describe('slug and ink ids', () => {
  it('slugifies titles and falls back', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(resolvePostSlug('   ')).toBe('untitled');
  });

  it('increments ink file ids', () => {
    expect(nextInkId([])).toBe('ink-01');
    expect(nextInkId(['ink-01.json', 'ink-02.svg'])).toBe('ink-03');
  });
});

describe('MDX write plan', () => {
  it('emits frontmatter and an InkPage when ink exists', () => {
    const mdx = buildPostMdx({
      body: 'A caption on the sheet.',
      collection: 'blog',
      draft: true,
      excerpt: 'hello',
      inkSrc: '/blog/hello/ink-01.svg',
      slug: 'hello',
      title: 'Hello',
    });
    expect(mdx).toContain('title: Hello');
    expect(mdx).toContain('draft: true');
    expect(mdx).toContain('<InkPage src="/blog/hello/ink-01.svg"');
    expect(mdx).toContain('A caption on the sheet.');
  });
});
