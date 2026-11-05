/**
 * The eye page's live numbers: written by the engine loop (~15 Hz),
 * read by the instrument. Actions are registered by the engine once it boots.
 */
import type { Unit } from '@kiruk/burin/rig';
import { useSyncExternalStore } from 'react';

export type Trace = { t: number[]; x: number[]; v: number[] };
/** A caliper span in eye units, with the landmarks its ends snapped to. */
export type Caliper = { a: [number, number]; b: [number, number]; snapA?: string; snapB?: string };
const empty = (): Trace => ({ t: [], x: [], v: [] });

export type EyeState = {
  backend: 'pending' | 'webgpu' | 'webgl2' | 'css';
  dpr: number;
  plate: boolean;
  ms: number;
  fps: number;
  W: number;
  H: number;
  S: number;
  gx: number;
  gy: number;
  open: number;
  pupil: number;
  light: number;
  age: number;
  gazeV: number;
  gaze: Trace;
  pupilT: Trace;
  lid: Trace;
  wetT: Trace;
  wet: number;
  stain: number;
  bleeding: boolean;
  rakeDeg: number;
  /** 0 old paper (Dawn Light) … 1 new paper (Dawn Departs) */
  dawn: number;
  dawnTarget: 0 | 1;
  /** eye centre on the page, CSS px */
  cx: number;
  cy: number;
  /** construction over the plate: 0 hidden · 0.3 faint (default) · 1 full */
  wire: number;
  wireTarget: number;
  /** the light on the eye: azimuth (deg, from the right, clockwise on screen) and elevation (deg) */
  sunAz: number;
  sunEl: number;
  unit: Unit;
  calipers: boolean;
  /** the plate's passes while it is made again (1 … 5); 5 at rest */
  make: number;
  making: boolean;
  caliper: Caliper | null;
  /** under the pointer while the calipers are out: eye units, and the landmark it would snap to */
  hover: { x: number; y: number; snap?: string } | null;
  clock: number;
};

let state: EyeState = {
  backend: 'pending',
  dpr: 1,
  plate: false,
  ms: 0,
  fps: 0,
  W: 1440,
  H: 900,
  S: 225,
  gx: 0,
  gy: 0,
  open: 1,
  pupil: 0.36,
  light: 0,
  age: 0,
  gazeV: 0,
  gaze: empty(),
  pupilT: empty(),
  lid: empty(),
  wetT: empty(),
  wet: 0,
  stain: 0,
  bleeding: false,
  rakeDeg: -135,
  dawn: 0,
  dawnTarget: 0,
  cx: 720,
  cy: 450,
  wire: 0.3,
  wireTarget: 0.3,
  sunAz: -135,
  sunEl: 36,
  unit: 'd',
  calipers: false,
  make: 5,
  making: false,
  caliper: null,
  hover: null,
  clock: 0,
};
const subs = new Set<() => void>();

export const actions = {
  blink: () => {},
  hold: (_on: boolean) => {},
  setAge: (_v: number) => {},
  dampen: () => {},
  setDawn: (_v: 0 | 1) => {},
  setWire: (_v: number) => {},
  setUnit: (u: Unit) => eyeStore.set({ unit: u }),
  calipers: (on: boolean) => eyeStore.set({ calipers: on, hover: null }),
  clearCaliper: () => eyeStore.set({ caliper: null }),
  make: () => {},
};

export const eyeStore = {
  get: () => state,
  set(p: Partial<EyeState>) {
    state = { ...state, ...p };
    for (const s of subs) s();
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

export function useEye<T>(pick: (s: EyeState) => T): T {
  return useSyncExternalStore(
    eyeStore.subscribe,
    () => pick(eyeStore.get()),
    () => pick(eyeStore.get()),
  );
}
