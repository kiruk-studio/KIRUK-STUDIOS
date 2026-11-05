/**
 * Instruments — what is in the hand. Each one turns a performed sample (pressure, speed,
 * direction) into a footprint width and decides how the line breaks when ink runs low.
 * Widths in mm. Working values, measured against the ranges in docs/anomalies.md.
 */
import { DEG } from '../core/vec.ts';

export type InstrumentId =
  | 'quill'
  | 'reed'
  | 'steel'
  | 'broad'
  | 'brush'
  | 'graphite'
  | 'chalk'
  | 'silverpoint'
  | 'stylus'
  | 'burin'
  | 'ruling';

export type InstrumentKind = 'pen' | 'brush' | 'dry' | 'stylus' | 'burin' | 'ruling';

export interface InstrumentSpec {
  id: InstrumentId;
  name: string;
  kind: InstrumentKind;
  /** Width at the lightest touch and at full pressure. */
  w0: number;
  w1: number;
  /** Pressure response exponent: > 1 needs a firm hand to swell. */
  gamma: number;
  /** Broad-edge share, 0 round … 1 a pure edge, and the edge angle on the page. */
  edge: number;
  edgeAngle: number;
  /** Slow strokes spread wider: strength of that effect. */
  speedSpread: number;
  /** Ink held per dip, in mm of a 0.4 mm line. Infinity for dry media. */
  capacity: number;
  /** Lanes across the width when the line breaks (tines, bristles, grain). */
  lanes: number;
  /** Tendency to catch the paper on a pushed stroke. */
  catch: number;
  /** A split, flexible nib can railroad: two tine lines with a starved middle. */
  rails: boolean;
  /** How much the paper's tooth breaks the line (dry media high). */
  toothBite: number;
  /** Fractions of the stroke over which it enters and leaves. */
  taperIn: number;
  taperOut: number;
}

export const INSTRUMENTS: Record<InstrumentId, InstrumentSpec> = {
  quill: {
    id: 'quill',
    name: 'Goose quill',
    kind: 'pen',
    w0: 0.1,
    w1: 0.72,
    gamma: 1.35,
    edge: 0.28,
    edgeAngle: 40 * DEG,
    speedSpread: 0.18,
    capacity: 240,
    lanes: 3,
    catch: 0.3,
    rails: false,
    toothBite: 0.3,
    taperIn: 0.05,
    taperOut: 0.12,
  },
  reed: {
    id: 'reed',
    name: 'Reed pen',
    kind: 'pen',
    w0: 0.32,
    w1: 1.25,
    gamma: 1,
    edge: 0.6,
    edgeAngle: 30 * DEG,
    speedSpread: 0.1,
    capacity: 170,
    lanes: 5,
    catch: 0.4,
    rails: false,
    toothBite: 0.5,
    taperIn: 0.03,
    taperOut: 0.05,
  },
  steel: {
    id: 'steel',
    name: 'Flexible steel nib',
    kind: 'pen',
    w0: 0.07,
    w1: 1.05,
    gamma: 1.6,
    edge: 0.05,
    edgeAngle: 0,
    speedSpread: 0.1,
    capacity: 150,
    lanes: 2,
    catch: 0.45,
    rails: true,
    toothBite: 0.15,
    taperIn: 0.04,
    taperOut: 0.1,
  },
  broad: {
    id: 'broad',
    name: 'Broad-edge nib',
    kind: 'pen',
    w0: 0.1,
    w1: 0.95,
    gamma: 0.6,
    edge: 0.95,
    edgeAngle: 32 * DEG,
    speedSpread: 0.06,
    capacity: 170,
    lanes: 4,
    catch: 0.2,
    rails: false,
    toothBite: 0.25,
    taperIn: 0.02,
    taperOut: 0.04,
  },
  brush: {
    id: 'brush',
    name: 'Round sable brush',
    kind: 'brush',
    w0: 0.15,
    w1: 3,
    gamma: 1.4,
    edge: 0,
    edgeAngle: 0,
    speedSpread: 0.25,
    capacity: 900,
    lanes: 9,
    catch: 0,
    rails: false,
    toothBite: 0.55,
    taperIn: 0.12,
    taperOut: 0.25,
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite pencil',
    kind: 'dry',
    w0: 0.15,
    w1: 0.5,
    gamma: 1,
    edge: 0,
    edgeAngle: 0,
    speedSpread: 0,
    capacity: Number.POSITIVE_INFINITY,
    lanes: 0,
    catch: 0,
    rails: false,
    toothBite: 0.7,
    taperIn: 0.04,
    taperOut: 0.08,
  },
  chalk: {
    id: 'chalk',
    name: 'Chalk (sanguine or blue)',
    kind: 'dry',
    w0: 0.45,
    w1: 1.5,
    gamma: 1,
    edge: 0.2,
    edgeAngle: 20 * DEG,
    speedSpread: 0,
    capacity: Number.POSITIVE_INFINITY,
    lanes: 0,
    catch: 0,
    rails: false,
    toothBite: 0.85,
    taperIn: 0.06,
    taperOut: 0.1,
  },
  silverpoint: {
    id: 'silverpoint',
    name: 'Silverpoint',
    kind: 'dry',
    w0: 0.11,
    w1: 0.2,
    gamma: 1,
    edge: 0,
    edgeAngle: 0,
    speedSpread: 0,
    capacity: Number.POSITIVE_INFINITY,
    lanes: 0,
    catch: 0,
    rails: false,
    toothBite: 0.3,
    taperIn: 0.03,
    taperOut: 0.05,
  },
  stylus: {
    id: 'stylus',
    name: 'Stylus (blind line)',
    kind: 'stylus',
    w0: 0.12,
    w1: 0.24,
    gamma: 1,
    edge: 0,
    edgeAngle: 0,
    speedSpread: 0,
    capacity: Number.POSITIVE_INFINITY,
    lanes: 0,
    catch: 0,
    rails: false,
    toothBite: 0,
    taperIn: 0.02,
    taperOut: 0.03,
  },
  burin: {
    id: 'burin',
    name: 'Burin (engraved line)',
    kind: 'burin',
    w0: 0.02,
    w1: 0.6,
    gamma: 1,
    edge: 0,
    edgeAngle: 0,
    speedSpread: 0,
    capacity: Number.POSITIVE_INFINITY,
    lanes: 0,
    catch: 0,
    rails: false,
    toothBite: 0,
    taperIn: 0.5,
    taperOut: 0.5,
  },
  ruling: {
    id: 'ruling',
    name: 'Ruling pen',
    kind: 'ruling',
    w0: 0.2,
    w1: 0.3,
    gamma: 1,
    edge: 0,
    edgeAngle: 0,
    speedSpread: 0.04,
    capacity: 320,
    lanes: 2,
    catch: 0.05,
    rails: false,
    toothBite: 0.08,
    taperIn: 0.005,
    taperOut: 0.005,
  },
};

export const instrument = (id: InstrumentId): InstrumentSpec => INSTRUMENTS[id];

/**
 * Footprint width for one sample.
 *   p    pressure 0..1
 *   dir  stroke direction (rad, screen)
 *   v    speed, mm/s
 */
export function footprint(ins: InstrumentSpec, p: number, dir: number, v: number): number {
  const pr = Math.max(0, Math.min(1, p)) ** ins.gamma;
  let w = ins.w0 + (ins.w1 - ins.w0) * pr;
  if (ins.edge > 0) {
    // A broad edge lays its full width across the stroke and a hairline along it.
    const across = Math.abs(Math.sin(dir - ins.edgeAngle));
    w *= 1 - ins.edge + ins.edge * (0.12 + 0.88 * across);
  }
  if (ins.speedSpread > 0) {
    const slow = Math.max(0.6, Math.min(1.6, (60 / Math.max(6, v)) ** 0.25));
    w *= 1 + ins.speedSpread * (slow - 1);
  }
  return Math.max(ins.w0 * 0.6, w);
}
