/**
 * The drawn eye, alive: the globe turns under the lids, and the upper lid blinks.
 * Nothing is redrawn that does not move.
 *
 *   globe  every ball stroke laid once, whole, into a cache that reaches under
 *          the lids; each frame it is moved by the gaze and clipped by the lids
 *   lid    at rest, a cache; while it moves, its band, margin and lashes are cut
 *          again for the aperture (lidStrokes), a little coarser, and the cache
 *          comes back when it is open again
 *   skin   never moves; the caller keeps it on its own canvas
 *
 * The gaze turns the globe as the rig does: the iris travels 0.40 of a unit per
 * unit of gaze across, 0.22 down (rig.ts irisCentre). It is held to the range the
 * cache can cover.
 *
 * spec-link: ideas/studio-dawn/ink-opening.md
 */
import { EYE, type Pose } from '../subjects/eye/rig';
import {
  type EyeDrawing,
  type LidBase,
  lidBase,
  lidStrokes,
  windowOutline,
} from '../subjects/eye/strokes';
import { type Clips, type Ctx2D, type InkColors, outlinePath, paintStrokes } from './ink';

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

/** How far the drawn globe may turn: its cache reaches this far under the lids. */
export const GAZE_RANGE = { x: 0.5, y: 0.36 } as const;

export function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const ctx2d = (c: AnyCanvas) => c.getContext('2d') as Ctx2D;

export class LiveEye {
  private readonly ball: AnyCanvas;
  private readonly lid: AnyCanvas;
  private readonly base: LidBase;
  private readonly clips: Clips;
  private last = '';

  /**
   * @param eye  the visible layer for the globe and the lid, with its transform set
   *             (eye px → canvas px); the caches copy it
   */
  constructor(
    private readonly d: EyeDrawing,
    private readonly eye: Ctx2D,
    private readonly colors: Pick<InkColors, 'ink' | 'chalk'>,
  ) {
    const { width, height } = eye.canvas;
    const m = eye.getTransform();
    this.clips = {
      window: outlinePath(d.window),
      pupil: outlinePath(d.pupil),
      iris: outlinePath(d.iris),
    };
    this.ball = makeCanvas(width, height);
    const gb = ctx2d(this.ball);
    gb.setTransform(m);
    paintStrokes(
      gb,
      d.strokes.filter((s) => s.layer === 'ball'),
      colors,
      this.clips,
      { clipBall: false },
    );
    this.lid = makeCanvas(width, height);
    const gl = ctx2d(this.lid);
    gl.setTransform(m);
    paintStrokes(
      gl,
      d.strokes.filter((s) => s.layer === 'lid'),
      colors,
      this.clips,
    );
    this.base = lidBase(d.pose);
  }

  /** Where the iris is for a pose: px from the eye's centre, and its radius. */
  irisAt(pose: Pose): { x: number; y: number; r: number } {
    const { gx, gy } = clampGaze(pose);
    const S = this.d.S;
    return {
      x: EYE.iris.gx * gx * S,
      y: (EYE.iris.cy + EYE.iris.gy * gy) * S,
      r: EYE.iris.R * S,
    };
  }

  /** Recompose the globe and the lid for a pose (its pupil stays as drawn). */
  render(pose: Pose) {
    const { gx, gy } = clampGaze(pose);
    const open = Math.min(1, Math.max(0, pose.open));
    const key = `${gx.toFixed(4)},${gy.toFixed(4)},${open.toFixed(3)}`;
    if (key === this.last) return false;
    this.last = key;
    const g = this.eye;
    const S = this.d.S;
    const m = g.getTransform();
    const at: Pose = { ...this.d.pose, open };
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    g.restore();
    // The globe, turned by the gaze, seen through the lids.
    g.save();
    g.clip(open >= 1 ? this.clips.window : outlinePath(windowOutline(S, at)));
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(
      this.ball as CanvasImageSource,
      EYE.iris.gx * gx * S * m.a,
      EYE.iris.gy * gy * S * m.d,
    );
    g.restore();
    // The lid: the cache when it is open, cut again while it moves.
    if (open >= 1) {
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(this.lid as CanvasImageSource, 0, 0);
      g.restore();
    } else {
      paintStrokes(
        g,
        lidStrokes(S, at, { pitch: this.d.pitch, step: 2, base: this.base }),
        this.colors,
        this.clips,
      );
    }
    return true;
  }
}

function clampGaze(p: Pose) {
  return {
    gx: Math.max(-GAZE_RANGE.x, Math.min(GAZE_RANGE.x, p.gx)),
    gy: Math.max(-GAZE_RANGE.y, Math.min(GAZE_RANGE.y, p.gy)),
  };
}
