import type { InkTool } from './types';

export interface BrushPreset {
  tool: InkTool;
  size: number;
  opacity: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  simulatePressure: boolean;
}

export const BRUSHES: Record<'ink' | 'pencil', BrushPreset> = {
  ink: {
    tool: 'ink',
    size: 24,
    opacity: 1,
    thinning: 0.35,
    smoothing: 0.4,
    streamline: 0.2,
    simulatePressure: true,
  },
  pencil: {
    tool: 'pencil',
    size: 4,
    opacity: 0.75,
    thinning: 0.35,
    smoothing: 0.55,
    streamline: 0.65,
    simulatePressure: true,
  },
};

export const ERASER_RADIUS = 18;

export function brushFor(tool: InkTool): BrushPreset {
  if (tool === 'eraser') return BRUSHES.ink;
  return BRUSHES[tool];
}
