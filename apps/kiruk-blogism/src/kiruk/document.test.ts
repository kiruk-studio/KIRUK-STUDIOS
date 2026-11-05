import { describe, expect, it } from 'vitest';

import {
  appendStroke,
  clearStrokes,
  coerceInkDocument,
  createInkDoc,
  eraseAlongPath,
  makeDrawStroke,
} from './document';

describe('InkDocument', () => {
  it('starts empty on the page size', () => {
    const doc = createInkDoc({ width: 100, height: 200 });
    expect(doc.version).toBe(1);
    expect(doc.strokes).toEqual([]);
    expect(doc.size).toEqual({ width: 100, height: 200 });
  });

  it('appends a draw stroke and clears it', () => {
    const empty = createInkDoc();
    const next = appendStroke(
      empty,
      makeDrawStroke('ink', [
        { x: 1, y: 1, p: 0.5 },
        { x: 8, y: 8, p: 0.7 },
      ]),
    );
    expect(next.strokes).toHaveLength(1);
    expect(clearStrokes(next).strokes).toHaveLength(0);
  });

  it('erases strokes whose points sit on the eraser path', () => {
    const drawn = appendStroke(
      createInkDoc(),
      makeDrawStroke('ink', [
        { x: 10, y: 10, p: 0.5 },
        { x: 12, y: 12, p: 0.5 },
      ]),
    );
    const erased = eraseAlongPath(drawn, [{ x: 11, y: 11, p: 0.5 }]);
    expect(erased.strokes).toHaveLength(0);
  });

  it('coerces unknown values into an empty document', () => {
    expect(coerceInkDocument(null).strokes).toEqual([]);
    expect(
      coerceInkDocument({ version: 1, size: { width: 1, height: 1 }, strokes: [] }).size,
    ).toEqual({ width: 1, height: 1 });
  });
});
