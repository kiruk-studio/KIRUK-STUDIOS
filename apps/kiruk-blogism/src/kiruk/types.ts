export type InkTool = 'ink' | 'pencil' | 'eraser';
export type InkTone = 'ink' | 'accent';
export type BlogismSide = 'design' | 'develop';
export type BlogismCollection = 'blog' | 'notes';

export interface InkPoint {
  x: number;
  y: number;
  /** Pressure 0–1. Mouse fallback is 0.5. */
  p: number;
  t?: number;
}

export interface InkStroke {
  id: string;
  tool: InkTool;
  size: number;
  opacity: number;
  tone: InkTone;
  color?: string;
  points: InkPoint[];
}

export interface InkSize {
  width: number;
  height: number;
}

export interface InkDocument {
  version: 1;
  size: InkSize;
  strokes: InkStroke[];
}

export const INK_DOC_VERSION = 1 as const;
export const INK_TARGET = 'blogism.ink' as const;

/** Portrait notebook sheet in world space. */
export const PAGE_SIZE: InkSize = { width: 768, height: 1024 };

/** Landscape desk artboard; larger than the sheet so Infinity export differs. */
export const DESK_SIZE: InkSize = { width: 1600, height: 1200 };

export const COLLECTIONS = ['blog', 'notes'] as const;
