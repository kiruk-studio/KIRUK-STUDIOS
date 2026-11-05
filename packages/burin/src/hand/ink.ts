/**
 * The pen — lays strokes on a 2D canvas the way a hand lays ink.
 *
 * Each stroke is drawn along its length, from its start time over its duration,
 * with the pace of its pen: chalk and contours steady, hatching quick and easing
 * off, hair flicked away. Only what the pen covered since the last frame is laid
 * down, so a frame costs what the hand did in it, not the whole drawing.
 *
 * Fresh ink is wet: iron-gall goes down blue-black and a little swollen, and
 * browns as it dries (it oxidises; that is why old drawings are brown). The last
 * half-second of strokes lives on a separate wet layer that is redrawn every
 * frame and fades, with a bead of ink at each nib.
 *
 * Every ribbon is traced the same way round (one side out, the other back), and
 * dots the same way, so a frame's strokes can share one path and still fill as a
 * union: crossing lines never punch holes in each other.
 *
 * Works on an HTMLCanvasElement or an OffscreenCanvas in a worker.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md
 */
import type { EyeDrawing, Stroke } from '../subjects/eye/strokes';

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type PathSink = Pick<Path2D, 'moveTo' | 'lineTo' | 'arc' | 'closePath'>;

const TAU = Math.PI * 2;
/** How long ink stays wet, s. */
export const WET_S = 0.5;
/** How much of a stroke behind the nib is still wet, in samples (≈ px). */
export const WET_TAIL = 42;
/** At most this many finished strokes are still shown drying. */
const WET_MAX = 160;
const wetFor = (st: Stroke) => (st.pen === 'flick' ? WET_S * 0.5 : WET_S);

/**
 * Trace samples a…b of a stroke: a ribbon where the pen is down, a dot where it
 * only touches. `widen` swells it (wet ink); dx, dy move it (the turning globe).
 */
export function traceStroke(
  g: PathSink,
  st: Stroke,
  a: number,
  b: number,
  widen = 1,
  dx = 0,
  dy = 0,
  mask?: Uint8Array,
) {
  const { p, n, w } = st;
  const end = Math.min(b, w.length - 1);
  const on = (k: number) => w[k] > 0 && (!mask || mask[k] === 1);
  let i = Math.max(0, a);
  while (i <= end) {
    while (i <= end && !on(i)) i++;
    if (i > end) break;
    let j = i;
    while (j < end && on(j + 1)) j++;
    if (j === i) {
      const r = w[i] * widen;
      const x = p[2 * i] + dx;
      const y = p[2 * i + 1] + dy;
      g.moveTo(x + r, y);
      // anticlockwise, so a dot winds the same way as the ribbons
      g.arc(x, y, r, 0, -TAU, true);
      g.closePath();
    } else {
      for (let k = i; k <= j; k++) {
        const h = w[k] * widen;
        const x = p[2 * k] + n[2 * k] * h + dx;
        const y = p[2 * k + 1] + n[2 * k + 1] * h + dy;
        if (k === i) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      for (let k = j; k >= i; k--) {
        const h = w[k] * widen;
        g.lineTo(p[2 * k] - n[2 * k] * h + dx, p[2 * k + 1] - n[2 * k + 1] * h + dy);
      }
      g.closePath();
    }
    i = j + 1;
  }
}

/** A closed outline (px) as a path. */
export function outlinePath(f: Float32Array, dx = 0, dy = 0): Path2D {
  const path = new Path2D();
  for (let i = 0; i < f.length; i += 2) {
    if (i === 0) path.moveTo(f[0] + dx, f[1] + dy);
    else path.lineTo(f[i] + dx, f[i + 1] + dy);
  }
  path.closePath();
  return path;
}

export interface InkColors {
  /** dry ink */
  ink: string;
  /** the construction's chalk */
  chalk: string;
  /** fresh ink, before it oxidises */
  wet: string;
}

/** The clip paths a stroke may need, in the same coordinates as the strokes. */
export interface Clips {
  /** what the lids show of the globe */
  window: Path2D;
  pupil: Path2D;
  iris: Path2D;
}

/** Fill a batch on a layer with the stroke's compositing: ink, or cleared back to the paper. */
function fillBatch(
  g: Ctx2D,
  path: Path2D,
  st: Stroke,
  color: string,
  clips: Clips,
  clipBall: boolean,
) {
  const clear = st.ink === 'clear';
  const needsClip = (st.layer === 'ball' && clipBall) || !!st.clip;
  if (!needsClip && !clear) {
    g.fillStyle = color;
    g.fill(path);
    return;
  }
  g.save();
  if (st.layer === 'ball' && clipBall) g.clip(clips.window);
  if (st.clip) g.clip(clips[st.clip]);
  if (clear) {
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = st.alpha ?? 1;
    g.fillStyle = '#000';
  } else g.fillStyle = color;
  g.fill(path);
  g.restore();
}

/** Two strokes can share a batch when they are laid the same way. */
const modeOf = (st: Stroke) => `${st.ink}|${st.layer === 'ball' ? 'b' : ''}|${st.clip ?? ''}`;

/**
 * Lay strokes whole, in order: a cache, or a redraw after a resize. Strokes laid
 * the same way share a path; a fill lands after its stroke, as it does by hand.
 * `clipBall` clips the globe's strokes to the lids (false for a globe cache that
 * the gaze will move and clip later).
 */
export function paintStrokes(
  g: Ctx2D,
  strokes: readonly Stroke[],
  colors: Pick<InkColors, 'ink' | 'chalk'>,
  clips: Clips,
  o: { clipBall?: boolean; until?: number } = {},
) {
  const clipBall = o.clipBall ?? true;
  let batch: Path2D | null = null;
  let mode = '';
  let first: Stroke | null = null;
  const flush = () => {
    if (batch && first) fillBatch(g, batch, first, colorOf(first, colors), clips, clipBall);
    batch = null;
    first = null;
    mode = '';
  };
  for (const st of strokes) {
    if (o.until !== undefined && st.t0 > o.until) continue;
    const m = modeOf(st);
    if (m !== mode) {
      flush();
      batch = new Path2D();
      mode = m;
      first = st;
    }
    traceStroke(batch as unknown as Path2D, st, 0, st.w.length - 1);
    if (st.fill) {
      flush();
      fillBatch(g, outlinePath(st.fill), st, colorOf(st, colors), clips, clipBall);
    }
  }
  flush();
}

const colorOf = (st: Stroke, c: Pick<InkColors, 'ink' | 'chalk'>) =>
  st.ink === 'chalk' ? c.chalk : c.ink;

/** The pen's pace along a stroke, from its start (0) to its lift (1). */
function ease(pen: Stroke['pen'], u: number) {
  switch (pen) {
    case 'contour':
      return 0.5 - 0.5 * Math.cos(Math.PI * u);
    case 'chalk':
      return u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2;
    case 'hatch':
      return 1 - (1 - u) ** 1.6;
    case 'flick':
      return u ** 1.5;
    default:
      return u;
  }
}

export interface InkLayers {
  cons: Ctx2D;
  skin: Ctx2D;
  /** the globe and the upper lid */
  eye: Ctx2D;
  /** fresh ink, redrawn every frame */
  wet: Ctx2D;
}

/**
 * A hand drawing an eye: call `drawTo(t)` each frame with the time since it began.
 * The layers' contexts must already carry the transform from eye px to the canvas.
 */
export class InkHand {
  /** Strokes the hand draws, by start time. */
  private readonly order: number[];
  private next = 0;
  private active: number[] = [];
  /** Strokes finished less than WET_S ago: index, and when. */
  private recent: [number, number][] = [];
  /** Samples drawn so far (exclusive), per stroke. */
  private readonly head: Int32Array;
  private readonly clips: Clips;
  /** The pass the hand is on, 1 … 5 (6 when it has lifted the pen for good). */
  pass = 0;
  done = false;

  constructor(
    private readonly d: EyeDrawing,
    private readonly L: InkLayers,
    private readonly c: InkColors,
  ) {
    const s = d.strokes;
    this.order = s
      .map((_, i) => i)
      .filter((i) => s[i].to >= s[i].from)
      .sort((a, b) => s[a].t0 - s[b].t0);
    this.head = new Int32Array(s.length);
    for (let i = 0; i < s.length; i++) this.head[i] = s[i].from;
    this.clips = {
      window: outlinePath(d.window),
      pupil: outlinePath(d.pupil),
      iris: outlinePath(d.iris),
    };
  }

  /** Lay everything the pen has reached by t (s). `wet` off draws dry ink only. */
  drawTo(t: number, wet = true) {
    if (this.done) return;
    const s = this.d.strokes;
    while (this.next < this.order.length && s[this.order[this.next]].t0 <= t) {
      const i = this.order[this.next++];
      this.active.push(i);
      this.pass = Math.max(this.pass, s[i].pass);
    }
    // One path per way of laying ink, per layer.
    const paths = new Map<string, { path: Path2D; st: Stroke }>();
    const pathFor = (st: Stroke) => {
      const key = `${st.layer}|${modeOf(st)}`;
      let e = paths.get(key);
      if (!e) {
        e = { path: new Path2D(), st };
        paths.set(key, e);
      }
      return e.path;
    };
    const fills: Stroke[] = [];
    const still: number[] = [];
    for (const i of this.active) {
      const st = s[i];
      const u = st.dur > 0 ? Math.min(1, Math.max(0, (t - st.t0) / st.dur)) : 1;
      const target = u >= 1 ? st.to : st.from + Math.floor(ease(st.pen, u) * (st.to - st.from));
      const h = this.head[i];
      if (target >= h) {
        traceStroke(pathFor(st), st, Math.max(st.from, h - 1), target);
        this.head[i] = target + 1;
      }
      if (u >= 1) {
        if (st.fill) fills.push(st);
        this.recent.push([i, st.t0 + st.dur]);
      } else still.push(i);
    }
    this.active = still;
    for (const { path, st } of paths.values()) {
      fillBatch(this.layerOf(st), path, st, colorOf(st, this.c), this.clips, true);
    }
    for (const st of fills) {
      if (st.fill)
        fillBatch(
          this.layerOf(st),
          outlinePath(st.fill),
          st,
          colorOf(st, this.c),
          this.clips,
          true,
        );
    }
    // Hair is a hairline of ink: it dries in half the time. And never more than a few
    // hundred ends drying at once (the brow lays hundreds of hairs in under a second).
    this.recent = this.recent.filter(([i, at]) => t - at < wetFor(s[i])).slice(-WET_MAX);
    if (wet) this.drawWet(t);
    else this.clearWet();
    const laid = this.next >= this.order.length && this.active.length === 0;
    if (laid && (!wet || this.recent.length === 0)) {
      this.done = true;
      this.pass = 6;
      this.clearWet();
    }
  }

  /** Finish at once: everything not yet laid, laid now, dry. */
  finish() {
    this.drawTo(Number.POSITIVE_INFINITY, false);
  }

  private layerOf(st: Stroke) {
    return st.layer === 'cons' ? this.L.cons : st.layer === 'skin' ? this.L.skin : this.L.eye;
  }

  private clearWet() {
    const r = this.wetRect;
    if (!r) return;
    // Only where the wet ink was: a full-canvas clear every frame costs more than the ink.
    this.L.wet.clearRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    this.wetRect = null;
  }

  /** What the wet layer covered last frame, eye px: x0, y0, x1, y1. */
  private wetRect: [number, number, number, number] | null = null;

  /**
   * The wet layer: the fresh end of each stroke in flight, the ends of those still
   * drying, and a bead of ink at each nib. Only the last WET_TAIL px of a stroke is
   * wet, so a frame costs what the nibs are doing, not the length of the lines.
   * The globe's strokes are masked to what the lids show rather than clipped.
   */
  private drawWet(t: number) {
    const g = this.L.wet;
    const s = this.d.strokes;
    this.clearWet();
    const buckets = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const beads = new Path2D();
    let x0 = Number.POSITIVE_INFINITY;
    let y0 = Number.POSITIVE_INFINITY;
    let x1 = Number.NEGATIVE_INFINITY;
    let y1 = Number.NEGATIVE_INFINITY;
    const grow = (st: Stroke, a: number, b: number, pad: number) => {
      for (let k = a; k <= b; k += 4) {
        const x = st.p[2 * k];
        const y = st.p[2 * k + 1];
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
      const x = st.p[2 * b];
      const y = st.p[2 * b + 1];
      x0 = Math.min(x0, x) - pad;
      y0 = Math.min(y0, y) - pad;
      x1 = Math.max(x1, x) + pad;
      y1 = Math.max(y1, y) + pad;
    };
    const wetOf = (st: Stroke) => st.ink === 'ink' && st.layer !== 'cons';
    let any = false;
    for (const i of this.active) {
      const st = s[i];
      if (!wetOf(st)) continue;
      const h = this.head[i] - 1;
      if (h < st.from) continue;
      const a = Math.max(st.from, h - WET_TAIL);
      traceStroke(buckets[0], st, a, h, 1.14, 0, 0, st.vis);
      if (!st.vis || st.vis[h] === 1) {
        const r = Math.max(st.w[h] * 1.45, 0.85);
        const x = st.p[2 * h];
        const y = st.p[2 * h + 1];
        beads.moveTo(x + r, y);
        beads.arc(x, y, r, 0, -TAU, true);
        beads.closePath();
      }
      grow(st, a, h, 6);
      any = true;
    }
    for (const [i, at] of this.recent) {
      const st = s[i];
      if (!wetOf(st) || st.fill) continue;
      const k = Math.min(3, Math.floor(((t - at) / wetFor(st)) * 4));
      const a = Math.max(st.from, st.to - WET_TAIL);
      traceStroke(buckets[k], st, a, st.to, 1.14, 0, 0, st.vis);
      grow(st, a, st.to, 6);
      any = true;
    }
    if (!any) return;
    g.fillStyle = this.c.wet;
    const alphas = [0.95, 0.66, 0.4, 0.16];
    for (let k = 0; k < 4; k++) {
      g.globalAlpha = alphas[k];
      g.fill(buckets[k]);
    }
    g.globalAlpha = 1;
    g.fill(beads);
    this.wetRect = [x0, y0, x1, y1];
  }
}
