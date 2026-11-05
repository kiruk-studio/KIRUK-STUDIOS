/**
 * pen — kiruk's ink geometry, in plain TypeScript.
 *
 * codex `pen.md` ships quill() and hatch() as DOM helpers (they read
 * path.getTotalLength). These ports take point lists instead, so every plate's
 * ink is computed on the server: the no-script rest state is the finished
 * drawing, and the client re-renders the same paths bit for bit (KC-20).
 *
 * spec-link: .claude/skills/kiruk-codex/references/pen.md — Hatching, quill
 * spec-link: .claude/skills/kiruk-stroke/SKILL.md — Three instruments
 */

export type P = readonly [number, number];
type MP = [number, number];

/** Seeded PRNG: the same seed always draws the same plate. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One decimal, deterministic, no "-0". Numbers stay numbers until here (KC-9). */
export const n = (v: number): string => {
  const r = Math.round(v * 10) / 10;
  return (Object.is(r, -0) ? 0 : r).toString();
};

export const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: P, b: P, t: number): MP => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ── sampling ────────────────────────────────────────────────────────────────

export function line(a: P, b: P, step = 3): MP[] {
  const k = Math.max(1, Math.ceil(dist(a, b) / step));
  return Array.from({ length: k + 1 }, (_, i) => mix(a, b, i / k));
}

/** Screen angles (y down): 0 = east, π/2 = south. */
export function arc(c: P, r: number, a0: number, a1: number, step = 3): MP[] {
  const k = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / step));
  return Array.from({ length: k + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / k);
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  });
}

export function ellipse(
  c: P,
  rx: number,
  ry: number,
  rot: number,
  a0: number,
  a1: number,
  step = 3,
): MP[] {
  const k = Math.max(4, Math.ceil((Math.abs(a1 - a0) * Math.max(rx, ry)) / step));
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  return Array.from({ length: k + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / k);
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    return [c[0] + x * cr - y * sr, c[1] + x * sr + y * cr];
  });
}

export function quad(p0: P, p1: P, p2: P, step = 3): MP[] {
  const k = Math.max(2, Math.ceil((dist(p0, p1) + dist(p1, p2)) / step));
  return Array.from({ length: k + 1 }, (_, i) => {
    const t = i / k;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ];
  });
}

export function cubic(p0: P, p1: P, p2: P, p3: P, step = 3): MP[] {
  const k = Math.max(3, Math.ceil((dist(p0, p1) + dist(p1, p2) + dist(p2, p3)) / step));
  return Array.from({ length: k + 1 }, (_, i) => {
    const t = i / k;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ];
  });
}

/** Join sampled parts into one stroke, dropping the duplicated joint points. */
export function chain(...parts: MP[][]): MP[] {
  const out: MP[] = [];
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1];
      if (!last || dist(last, p) > 0.01) out.push(p);
    }
  }
  return out;
}

export function lengthOf(pts: readonly P[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1]!, pts[i]!);
  return s;
}

/** Resample a polyline at an even arc-length step. */
export function resample(pts: readonly P[], step: number): MP[] {
  if (pts.length < 2) return pts.map((p) => [p[0], p[1]]);
  const total = lengthOf(pts);
  const k = Math.max(1, Math.round(total / step));
  const out: MP[] = [[pts[0]![0], pts[0]![1]]];
  let seg = 1;
  let segStart = 0;
  let segLen = dist(pts[0]!, pts[1]!);
  for (let i = 1; i <= k; i++) {
    const target = (total * i) / k;
    while (segStart + segLen < target - 1e-9 && seg < pts.length - 1) {
      segStart += segLen;
      seg++;
      segLen = dist(pts[seg - 1]!, pts[seg]!);
    }
    const t = segLen > 0 ? (target - segStart) / segLen : 0;
    out.push(mix(pts[seg - 1]!, pts[seg]!, Math.min(1, Math.max(0, t))));
  }
  return out;
}

export function toD(pts: readonly P[], closed = false): string {
  if (!pts.length) return '';
  const body = pts.map((p) => `${n(p[0])} ${n(p[1])}`).join('L');
  return `M${body}${closed ? 'Z' : ''}`;
}

/** Shoelace area on screen coordinates: > 0 means clockwise on screen (y down). */
export function signedArea(pts: readonly P[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

export function bbox(pts: readonly P[]): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1 - x0, y1 - y0];
}

// ── svg paths ───────────────────────────────────────────────────────────────

export type Contour = { pts: MP[]; closed: boolean };

/** Parse M/L/H/V/Q/C/Z (absolute or relative) into sampled contours. */
export function parsePath(d: string, step = 3): Contour[] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const out: Contour[] = [];
  let cur: MP[] = [];
  let pos: MP = [0, 0];
  let start: MP = [0, 0];
  let cmd = '';
  let i = 0;
  const num = () => Number(tokens[i++]);
  const flush = (closed: boolean) => {
    if (cur.length > 1) out.push({ pts: cur, closed });
    cur = [];
  };
  while (i < tokens.length) {
    const t = tokens[i]!;
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        if (cur.length && dist(cur[cur.length - 1]!, start) > 0.01)
          cur.push(...line(pos, start, step).slice(1));
        pos = [start[0], start[1]];
        flush(true);
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    const bx = rel ? pos[0] : 0;
    const by = rel ? pos[1] : 0;
    switch (cmd.toUpperCase()) {
      case 'M': {
        flush(false);
        pos = [bx + num(), by + num()];
        start = [pos[0], pos[1]];
        cur = [[pos[0], pos[1]]];
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L': {
        const p: MP = [bx + num(), by + num()];
        cur.push(...line(pos, p, step).slice(1));
        pos = p;
        break;
      }
      case 'H': {
        const p: MP = [bx + num(), pos[1]];
        cur.push(...line(pos, p, step).slice(1));
        pos = p;
        break;
      }
      case 'V': {
        const p: MP = [pos[0], by + num()];
        cur.push(...line(pos, p, step).slice(1));
        pos = p;
        break;
      }
      case 'Q': {
        const c: MP = [bx + num(), by + num()];
        const p: MP = [bx + num(), by + num()];
        cur.push(...quad(pos, c, p, step).slice(1));
        pos = p;
        break;
      }
      case 'C': {
        const c1: MP = [bx + num(), by + num()];
        const c2: MP = [bx + num(), by + num()];
        const p: MP = [bx + num(), by + num()];
        cur.push(...cubic(pos, c1, c2, p, step).slice(1));
        pos = p;
        break;
      }
      default:
        i++;
    }
  }
  flush(false);
  return out;
}

// ── the quill ───────────────────────────────────────────────────────────────

export interface QuillOpts {
  /** Narrowest width, where the edge faces the light. */
  min?: number;
  /** Widest width, where the edge faces away from the light. State it in data-quill. */
  max?: number;
  /** Direction the light comes from. Upper left on every kiruk plate. */
  light?: P;
  /** +1 when the stroke runs clockwise on screen; −1 flips the heavy side. */
  side?: 1 | -1;
  seed?: number;
  closed?: boolean;
  /** Sampling step in user units. */
  step?: number;
}

/**
 * A quill contour: a stroke whose width follows the light — heavy where the edge
 * faces away from the upper-left light, a hair where it faces it, lifting in and
 * out at the ends of an open stroke. Closed contours keep full weight all round.
 * Returns a filled outline; fill it with the ink.
 */
export function quill(input: readonly P[], o: QuillOpts = {}): string {
  const { min = 0.7, max = 2.6, light = [-1, -1], side = 1, seed = 1, step = 2 } = o;
  const pts = resample(input, step);
  const len = pts.length;
  if (len < 2) return '';
  const closed = o.closed ?? dist(pts[0]!, pts[len - 1]!) < 0.5;
  const rand = mulberry32(seed);
  const lh = Math.hypot(light[0], light[1]) || 1;
  const lx = light[0] / lh;
  const ly = light[1] / lh;
  const a: string[] = [];
  const b: string[] = [];
  let wob = 1;
  for (let i = 0; i < len; i++) {
    const p = pts[i]!;
    const q = closed ? pts[(i + 1) % len]! : pts[Math.min(len - 1, i + 1)]!;
    const r = closed ? pts[(i - 1 + len) % len]! : pts[Math.max(0, i - 1)]!;
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const d = Math.hypot(dx, dy) || 1;
    const ox = (side * dy) / d;
    const oy = (side * -dx) / d;
    const shade = Math.max(0, -(ox * lx + oy * ly));
    const lift = closed
      ? 1
      : Math.max(0.15, Math.min(1, i / (len * 0.12), (len - 1 - i) / (len * 0.12)));
    wob = wob * 0.6 + (0.92 + 0.16 * rand()) * 0.4;
    const half = ((min + (max - min) * shade) * wob * lift) / 2;
    a.push(`${n(p[0] + ox * half)} ${n(p[1] + oy * half)}`);
    b.push(`${n(p[0] - ox * half)} ${n(p[1] - oy * half)}`);
  }
  b.reverse();
  return `M${a.join('L')}L${b.join('L')}Z`;
}

/**
 * A hand's wobble: displace a stroke along its normal by a smooth, seeded wave.
 * Never apply to text, construction or the rubric line (codex rule 3).
 */
export function wobble(input: readonly P[], amp: number, wavelength: number, seed: number): MP[] {
  const pts = resample(input, 2);
  const rand = mulberry32(seed);
  const ph1 = rand() * Math.PI * 2;
  const ph2 = rand() * Math.PI * 2;
  const k1 = (Math.PI * 2) / wavelength;
  const k2 = k1 * 2.31;
  let s = 0;
  return pts.map((p, i) => {
    const q = pts[Math.min(pts.length - 1, i + 1)]!;
    const r = pts[Math.max(0, i - 1)]!;
    if (i > 0) s += dist(pts[i - 1]!, p);
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const d = Math.hypot(dx, dy) || 1;
    const w = amp * (0.7 * Math.sin(k1 * s + ph1) + 0.3 * Math.sin(k2 * s + ph2));
    return [p[0] + (dy / d) * w, p[1] - (dx / d) * w];
  });
}

/**
 * Searching lines: how a hand finds a form before it knows it — several faint,
 * slightly wrong passes over the same path, each starting and stopping late.
 */
export function searching(input: readonly P[], passes: number, amp: number, seed: number): MP[][] {
  const rand = mulberry32(seed);
  const out: MP[][] = [];
  for (let k = 0; k < passes; k++) {
    const base = resample(input, 2);
    const cut0 = Math.floor(base.length * rand() * 0.12);
    const cut1 = base.length - Math.floor(base.length * rand() * 0.1);
    const part = base.slice(cut0, Math.max(cut0 + 2, cut1));
    const off: MP = [(rand() - 0.5) * amp * 1.4, (rand() - 0.5) * amp * 1.4];
    const moved = part.map((p) => [p[0] + off[0], p[1] + off[1]] as MP);
    out.push(wobble(moved, amp, 60 + rand() * 90, Math.floor(rand() * 1e6)));
  }
  return out;
}

// ── hatching ────────────────────────────────────────────────────────────────

export interface HatchOpts {
  gap?: number;
  weight?: number;
  reach?: number;
  seed?: number;
  /** Degrees; 45 runs top-left → bottom-right, the left hand's slope. */
  slope?: number;
  toward?: P;
  core?: P | null;
}

/**
 * Left-handed hatching (codex pen.md, ported as is): one tapered stroke per row,
 * landing in the shadow's core and pulled toward the light, lifted at a
 * different point each time, so tone ramps and the lit edge stays ragged.
 * Returns one path; fill with the ink and clip to the shadow region.
 */
export function hatch(
  [x, y, w, h]: readonly [number, number, number, number],
  o: HatchOpts = {},
): string {
  const {
    gap = 4,
    weight = 0.9,
    reach = 0.6,
    seed = 1,
    slope = 45,
    toward = [1, 1],
    core = null,
  } = o;
  const rand = mulberry32(seed);
  const ang = (slope * Math.PI) / 180;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const nx = -dy;
  const ny = dx;
  const th = Math.hypot(toward[0], toward[1]) || 1;
  const tx = toward[0] / th;
  const ty = toward[1] / th;
  const along = dx * tx + dy * ty;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.hypot(w, h) / 2;
  let d = '';
  for (let t = -r; t <= r; t += gap * (0.9 + 0.2 * rand())) {
    const half = Math.sqrt(Math.max(0, r * r - t * t));
    if (half < 2) continue;
    const u = 0.5 + (0.5 * (nx * tx + ny * ty) * t) / r;
    if (rand() > 0.2 + 0.8 * Math.min(1, u * 1.6)) continue;
    const end = along >= 0 ? 1 : -1;
    const l = 2 * half * Math.min(1, reach * (0.75 + 0.5 * rand()) * (0.45 + 0.55 * u));
    const land = core
      ? Math.max(
          -half,
          Math.min(half, (core[0] - cx) * dx + (core[1] - cy) * dy + (rand() - 0.5) * 6),
        )
      : half * end;
    const x0 = cx + nx * t + dx * land;
    const y0 = cy + ny * t + dy * land;
    const x1 = x0 - end * dx * l;
    const y1 = y0 - end * dy * l;
    const w0 = (weight * (0.6 + 0.4 * u)) / 2;
    const w1 = weight * 0.07;
    d += `M${n(x0 + nx * w0)} ${n(y0 + ny * w0)}L${n(x1 + nx * w1)} ${n(y1 + ny * w1)}L${n(x1 - nx * w1)} ${n(y1 - ny * w1)}L${n(x0 - nx * w0)} ${n(y0 - ny * w0)}Z`;
  }
  return d;
}

/**
 * Even hatching across a whole region at one tone — for a letter or a face the
 * claim is about, where every part of the shape is in the same ink. Strokes are
 * still tapered and lifted at uneven points, so it never prints as a pattern.
 */
export function fillHatch(
  [x, y, w, h]: readonly [number, number, number, number],
  o: { gap?: number; weight?: number; slope?: number; seed?: number; skip?: number } = {},
): string {
  const { gap = 3.4, weight = 0.85, slope = 45, seed = 1, skip = 0.04 } = o;
  const rand = mulberry32(seed);
  const ang = (slope * Math.PI) / 180;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const nx = -dy;
  const ny = dx;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.hypot(w, h) / 2 + 4;
  let d = '';
  for (let t = -r; t <= r; t += gap * (0.88 + 0.24 * rand())) {
    if (rand() < skip) continue;
    const half = Math.sqrt(Math.max(0, r * r - t * t));
    const s0 = -half - rand() * 6;
    const s1 = half + rand() * 6;
    // A long row is two pen strokes: the hand lifts somewhere in the middle.
    const cut = lerp(s0, s1, 0.35 + rand() * 0.3);
    for (const [a, b] of [
      [s0, cut + 3],
      [cut - 2, s1],
    ] as const) {
      const x0 = cx + nx * t + dx * a;
      const y0 = cy + ny * t + dy * a;
      const x1 = cx + nx * t + dx * b;
      const y1 = cy + ny * t + dy * b;
      const w0 = (weight * (0.85 + 0.3 * rand())) / 2;
      const w1 = weight * 0.12;
      d += `M${n(x0 + nx * w0)} ${n(y0 + ny * w0)}L${n(x1 + nx * w1)} ${n(y1 + ny * w1)}L${n(x1 - nx * w1)} ${n(y1 - ny * w1)}L${n(x0 - nx * w0)} ${n(y0 - ny * w0)}Z`;
    }
  }
  return d;
}

export const polyD = (pts: readonly P[]) => toD(pts, true);
