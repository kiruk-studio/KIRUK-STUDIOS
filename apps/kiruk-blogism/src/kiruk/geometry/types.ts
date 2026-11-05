import type { InkPoint } from '../types';

export interface BrushOpts {
  size: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  simulatePressure: boolean;
  last?: boolean;
}

export interface StrokeGeometryAdapter {
  outline(points: InkPoint[], opts: BrushOpts): Array<[number, number]>;
}
