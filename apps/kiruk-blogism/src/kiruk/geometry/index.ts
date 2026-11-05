import { perfectFreehandAdapter } from './perfect-freehand';
import type { StrokeGeometryAdapter } from './types';

let active: StrokeGeometryAdapter = perfectFreehandAdapter;

export function getGeometryAdapter(): StrokeGeometryAdapter {
  return active;
}

export function setGeometryAdapter(adapter: StrokeGeometryAdapter): void {
  active = adapter;
}

export type { BrushOpts, StrokeGeometryAdapter } from './types';
export { perfectFreehandAdapter };
