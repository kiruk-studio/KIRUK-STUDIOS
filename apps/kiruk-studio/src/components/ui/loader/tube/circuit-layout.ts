/**
 * The opening's circuit, laid out for a screen: a chip at the pupil and the
 * iris fanned out of its pins, the limbus, bundles of traces along the lids,
 * the brow, lash traces to pads, then a board spreading from the eye to the
 * edges (buses, chips, vias), routed the way a board is (straight runs,
 * 45-degree bends, a ring pad at each end). Every trace carries when current
 * starts laying it and how fast, so the tube can draw it growing.
 *
 * The eye's part is placed in mm round the globe (eye-lines.ts), so it lands
 * on the real eye; the board is in CSS px from a fixed seed, so it is the
 * same board every time.
 */

import type { TubeFrame, Vec } from './eye-lines';
import { BROW, IRIS, OPEN_LOWER, OPEN_UPPER, resample, through } from './eye-lines';

/** How fast current lays a trace, CSS px/s (the board is laid faster, to reach the edges in time). */
const LAY_SPEED = 900;

export interface Trace {
  pts: Vec[]; // CSS px
  cum: number[];
  len: number;
  /** When current starts laying it, s. */
  start: number;
  speed: number;
  eye: boolean;
  width: number;
  padEnd: boolean;
  /** Where a pulse is along it, as a phase; some traces carry none. */
  phase: number;
  pulse: boolean;
}

export interface Chip {
  x: number;
  y: number;
  w: number;
  h: number;
  pins: number;
  start: number;
  eye: boolean;
}

/** A plated hole on the board, lit when the board reaches it. */
export interface Via {
  x: number;
  y: number;
  start: number;
}

/* ---- maths --------------------------------------------------------------- */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function measure(pts: Vec[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { cum, len: cum[cum.length - 1] };
}

/**
 * Route through the points the way a board is routed: from each point to the
 * next, a 45-degree run then a straight one (or the other way round, which
 * ever keeps closer to the curve).
 */
function route(pts: Vec[]): Vec[] {
  const out: Vec[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = out[out.length - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const diag = Math.min(Math.abs(dx), Math.abs(dy));
    const corner: Vec =
      i % 2 === 0
        ? [ax + Math.sign(dx) * diag, ay + Math.sign(dy) * diag]
        : [bx - Math.sign(dx) * diag, by - Math.sign(dy) * diag];
    if (
      Math.hypot(corner[0] - ax, corner[1] - ay) > 0.5 &&
      Math.hypot(bx - corner[0], by - corner[1]) > 0.5
    )
      out.push(corner);
    out.push([bx, by]);
  }
  return out;
}

/** A curve moved `d` along its normal (positive: to the left of travel). */
function offset(pts: Vec[], d: number): Vec[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [p[0] - (ty / l) * d, p[1] + (tx / l) * d] as Vec;
  });
}

/**
 * The board for a frame: the eye's traces placed in mm round the globe (so
 * they land on the real eye), the board around it in CSS px from a fixed seed.
 * Drawn once into a texture by the tube (tube-scene.ts).
 */
export function layoutCircuit(fr: TubeFrame): { traces: Trace[]; chips: Chip[]; vias: Via[] } {
  let traces: Trace[] = [];
  let chips: Chip[] = [];
  let vias: Via[] = [];
  /** mm round the globe → CSS px. */
  const P = ([x, y]: Vec): Vec => [fr.cx + x * fr.pxPerMm, fr.cy - y * fr.pxPerMm];

  function add(
    pts: Vec[],
    start: number,
    eye: boolean,
    width: number,
    padEnd = true,
    rand = Math.random,
  ) {
    if (pts.length < 2) return;
    const { cum, len } = measure(pts);
    if (len < 2) return;
    traces.push({
      pts,
      cum,
      len,
      start,
      // the board is laid faster, so it reaches the edges by FORMED
      speed: LAY_SPEED * (eye ? 0.9 : 1.7),
      eye,
      width,
      padEnd,
      phase: rand(),
      pulse: rand() < (eye ? 0.55 : 0.4),
    });
  }

  function build() {
    traces = [];
    chips = [];
    vias = [];
    const r = rng(1970);

    /* the iris: two pen rings, not a fanned circuit */
    for (const [rr, st, width] of [
      [IRIS.r, 0.55, 2.1],
      [IRIS.r + 0.28, 0.72, 1.15],
    ] as const) {
      const ring: Vec[] = [];
      for (let i = 0; i <= 72; i++) {
        const a = Math.PI / 2 - (i / 72) * Math.PI * 2;
        ring.push(P([IRIS.c[0] + rr * Math.cos(a), IRIS.c[1] + rr * Math.sin(a)]));
      }
      add(ring, st, true, width, false, r);
    }

    /* lids and brow follow the eye's own curves */
    const upper = resample(through(OPEN_UPPER), 22);
    const lower = resample(through(OPEN_LOWER), 22).reverse();
    for (let b = 0; b < 3; b++) {
      const dUp = 0.12 + b * 0.42;
      add(offset(upper, dUp).map(P), 1.05 + b * 0.1, true, 2.4 - b * 0.45, false, r);
      add(offset(lower, -dUp).map(P), 1.15 + b * 0.1, true, 2.2 - b * 0.4, false, r);
    }
    const brow = resample(through(BROW), 20);
    for (let b = 0; b < 3; b++)
      add(offset(brow, 0.08 + b * 0.38).map(P), 1.55 + b * 0.08, true, 1.7 - b * 0.3, false, r);

    const lashRoot = resample(through(OPEN_UPPER), 14);
    for (let i = 2; i < 12; i++) {
      const [x, y] = lashRoot[i];
      const lean = (i - 6.5) * 0.12;
      add(
        [P([x, y + 2.1]), P([x + lean * 1.1, y + 3.3]), P([x + lean * 2.0, y + 4.0])],
        1.9 + i * 0.012,
        true,
        1.15,
        false,
        r,
      );
    }
  }
  build();
  return { traces, chips, vias };
}
