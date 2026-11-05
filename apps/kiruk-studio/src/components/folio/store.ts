/**
 * One small store the rig writes and the margin reads: the page's live
 * variables (W, scroll, the springs) and what the paper is running on.
 */
import { useSyncExternalStore } from 'react';
import type { Sample } from './calc/spring';

export type FolioState = {
  W: number;
  H: number;
  scroll: number;
  progress: number;
  velocity: number[];
  transmit: number;
  transmitTrace: Sample[];
  tableW: number;
  glass: boolean;
  backend: 'webgpu' | 'webgl2' | 'css' | 'pending';
  htmlInCanvas: boolean;
  dpr: number;
  frameMs: number;
};

let state: FolioState = {
  W: 1440,
  H: 900,
  scroll: 0,
  progress: 0,
  velocity: [],
  transmit: 0,
  transmitTrace: [],
  tableW: 120,
  glass: false,
  backend: 'pending',
  htmlInCanvas: false,
  dpr: 1,
  frameMs: 0,
};
const subs = new Set<() => void>();

export const folio = {
  get: () => state,
  set(patch: Partial<FolioState>) {
    state = { ...state, ...patch };
    for (const s of subs) s();
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

export function useFolio<T>(pick: (s: FolioState) => T): T {
  return useSyncExternalStore(
    folio.subscribe,
    () => pick(folio.get()),
    () => pick(folio.get()),
  );
}
