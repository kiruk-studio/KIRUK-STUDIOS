import getStroke from 'perfect-freehand';

import type { InkPoint } from '../types';
import type { BrushOpts, StrokeGeometryAdapter } from './types';

export const perfectFreehandAdapter: StrokeGeometryAdapter = {
  outline(points: InkPoint[], opts: BrushOpts): Array<[number, number]> {
    if (points.length === 0) return [];
    const input = points.map((pt) => [pt.x, pt.y, pt.p] as [number, number, number]);
    const hasRealPressure = points.some((pt) => pt.p > 0 && pt.p !== 0.5);
    return getStroke(input, {
      size: opts.size,
      thinning: opts.thinning,
      smoothing: opts.smoothing,
      streamline: opts.streamline,
      simulatePressure: hasRealPressure ? false : opts.simulatePressure,
      last: opts.last ?? true,
    }) as Array<[number, number]>;
  },
};
