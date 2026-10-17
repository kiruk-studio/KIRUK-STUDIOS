/**
 * Grease-pencil scene — 2D ink that lives at a depth.
 *
 * Blender's grease pencil is the model: a drawing is not a picture pasted on the
 * screen, it is a flat sheet of strokes *placed in a 3D scene*. Orbit the camera
 * and the sheets move apart; the ink itself never stops being ink. That is the
 * 2.5D the studio wants — 2D and 3D in the same frame, neither one pretending to
 * be the other.
 *
 * The maths lives in CSS, not here. Every function below returns a `transform`
 * string built out of two custom properties, `--gp-yaw` and `--gp-pitch`:
 *
 *   world  -> rotateX(pitch) rotateY(yaw)                     (camera orbiting)
 *   layer  -> translate3d(...) rotateX/Y/Z(...)               (pinned to a plane)
 *   layer  -> translate3d(...) rotateY(-yaw) rotateX(-pitch)  (billboard)
 *
 * The browser composes the matrices, so Astro's static render and the live desk
 * agree by construction — there is no second implementation to drift. It also
 * means orbiting costs one style write per frame (two numbers on the root), not
 * a re-layout of every stroke.
 *
 * Why CSS 3D and not Three.js: the ink must stay vector. perfect-freehand
 * outlines plus the graphite SVG filter are what make a stroke read as graphite,
 * and both survive a matrix3d untouched — rasterising them into a WebGL ribbon
 * would throw away the exact thing the brand is made of. A mesh layer can still
 * slot into the depth stack later (see LayerKind), which is the point of sorting
 * layers by z rather than by document order.
 *
 * spec-link: openspec/specs/pen-and-paper/spec.md#requirement-grease-pencil-scene
 */
import {
  type Point,
  type ScribbleSheetData,
  type ScribbleStroke,
  SHEET_WIDTH,
  sheetHeight,
} from './stroke';

/* ── model ───────────────────────────────────────────────────────── */

/**
 * How a layer meets the camera.
 *
 * - `plane` — welded to its own orientation. Orbit and it turns with the world:
 *   a floor stays a floor, a back wall recedes. This is where depth comes from.
 * - `billboard` — cancels the camera, so it always faces the viewer head-on but
 *   still sits at its own depth. It is why the drawn character in the reference
 *   stays front-on while the ground beneath it swings into an X.
 * - `screen` — never enters the scene at all. This is the drawn *interface* in
 *   the reference: the menu strip, the tool column, the timeline. Blender's UI
 *   does not orbit when the viewport does, and neither does this.
 * - `gizmo` — the odd one, and the axis cross is the only thing that needs it:
 *   it holds a fixed spot on screen but tumbles with the camera, because its
 *   whole job is to report which way the world is facing. A `plane` layer would
 *   also tumble, but the world rotates about the stage centre, so anything off
 *   to one side swings out of frame — which is exactly what a readout must not do.
 */
export type LayerFacing = 'plane' | 'billboard' | 'screen' | 'gizmo';

/** Chrome layers sit outside the world; everything else is placed by the camera. */
export const isScreenLayer = (l: GreaseLayer) => l.facing === 'screen' || l.facing === 'gizmo';

/** Reserved so a future WebGL/mesh layer can be depth-sorted with the ink. */
export type LayerKind = 'ink';

export interface GreaseLayer {
  /** Stable id — also the key the desk saves under. */
  readonly id: string;
  /** Shown in the desk's layer list. Free text. */
  readonly name: string;
  readonly kind?: LayerKind;
  /** Point the layer rotates about, in sheet units. Defaults to sheet centre. */
  readonly pivot?: readonly [x: number, y: number];
  /** World-space offset in sheet units; `z` is depth (negative = further away). */
  readonly offset?: readonly [x: number, y: number, z: number];
  /** The layer's own plane orientation in degrees. */
  readonly rotate?: readonly [rx: number, ry: number, rz: number];
  readonly facing?: LayerFacing;
  /** 0..1, before depth fade. */
  readonly opacity?: number;
  readonly hidden?: boolean;
  readonly strokes: readonly ScribbleStroke[];
}

export interface Camera {
  /** Degrees. Yaw spins the world about its vertical axis. */
  readonly yaw: number;
  /** Degrees. Pitch tips it toward or away from the viewer. */
  readonly pitch: number;
}

export interface GreaseScene {
  readonly version: 2;
  readonly width: number;
  readonly height: number;
  /** Rest pose. This is what a reader with JS off sees, so it must be composed. */
  readonly camera: Camera;
  readonly layers: readonly GreaseLayer[];
}

/** Orbit limits. Past these the drawn planes turn edge-on and vanish. */
export const CAMERA_LIMITS = { yaw: 32, pitch: 22 } as const;

/** Perspective distance in px. Long lens — the drawings should not smear. */
export const PERSPECTIVE = 1600;

export const REST_CAMERA: Camera = { yaw: 0, pitch: 0 };

/** A scene with nothing in it yet, so a fresh sheet still renders its rig. */
export const EMPTY_SCENE: GreaseScene = {
  version: 2,
  width: SHEET_WIDTH,
  height: 0,
  camera: REST_CAMERA,
  layers: [],
};

/** Layer a stroke lands on when a sheet has never been opened in the desk. */
export const DEFAULT_LAYER_ID = 'sheet';

export function blankLayer(id = DEFAULT_LAYER_ID, name = id): GreaseLayer {
  return { id, name, facing: 'billboard', strokes: [] };
}

/* ── v1 -> v2 ────────────────────────────────────────────────────── */

/**
 * Old flat sheets keep working: one billboard layer at z=0 is exactly what a
 * pre-grease-pencil sheet was. Committed handwriting never needs rewriting —
 * pen-and-paper's append-only rule applies to the file as much as the sketch.
 */
export function toScene(data: ScribbleSheetData | GreaseScene): GreaseScene {
  if ('layers' in data) return data;
  return {
    version: 2,
    width: data.width,
    height: data.height,
    camera: REST_CAMERA,
    layers: data.strokes.length ? [{ ...blankLayer(), strokes: data.strokes }] : [],
  };
}

/** Artboard height that fits every layer. */
export function sceneHeight(layers: readonly GreaseLayer[]): number {
  let h = 0;
  for (const l of layers) h = Math.max(h, sheetHeight(l.strokes));
  return h;
}

/* ── transforms ──────────────────────────────────────────────────── */

const pct = (n: number, of: number) => `${Math.round((n / (of || 1)) * 1e4) / 100}%`;

/**
 * One layer's transform.
 *
 * A billboard undoes the world rotation in reverse order — the inverse of
 * `RX(p)·RY(y)` is `RY(-y)·RX(-p)` — which is why the counter-rotation reads
 * yaw-then-pitch while the world reads pitch-then-yaw. Translation comes first
 * either way, so the layer is placed in world space and *then* spun to face.
 */
export function layerTransform(layer: GreaseLayer, height: number): string {
  const [ox = 0, oy = 0, oz = 0] = layer.offset ?? [];
  const facing = layer.facing ?? 'billboard';
  // Chrome is laid out in the page, not the scene: no depth, no camera.
  if (facing === 'screen') return `translate(${pct(ox, SHEET_WIDTH)}, ${pct(oy, height)})`;
  // A gizmo takes the camera's rotation but not its translation — it turns where
  // it sits. Its pivot (`transform-origin`) is what keeps it turning in place.
  if (facing === 'gizmo') {
    return `translate(${pct(ox, SHEET_WIDTH)}, ${pct(oy, height)}) rotateX(var(--gp-pitch)) rotateY(var(--gp-yaw))`;
  }
  const place = `translate3d(${pct(ox, SHEET_WIDTH)}, ${pct(oy, height)}, ${oz}px)`;
  if (facing === 'billboard') {
    return `${place} rotateY(calc(-1 * var(--gp-yaw))) rotateX(calc(-1 * var(--gp-pitch)))`;
  }
  const [rx = 0, ry = 0, rz = 0] = layer.rotate ?? [];
  return `${place} rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
}

/** Pivot as a `transform-origin`. Defaults to the middle of the sheet. */
export function layerOrigin(layer: GreaseLayer, height: number): string {
  const [px = SHEET_WIDTH / 2, py = height / 2] = layer.pivot ?? [];
  return `${pct(px, SHEET_WIDTH)} ${pct(py, height)}`;
}

/**
 * Depth cue. Grease pencil layers set further back read lighter, the way a
 * pencil under tracing paper does; it is what stops a deep stack from reading as
 * one flat tangle. Only applies behind the drawing plane — nothing in front of
 * the viewer is faded.
 */
export function layerOpacity(layer: GreaseLayer): number {
  if (isScreenLayer(layer)) return layer.opacity ?? 1;
  const z = layer.offset?.[2] ?? 0;
  const fade = z >= 0 ? 1 : Math.max(0.32, 1 + z / 1400);
  return Math.round((layer.opacity ?? 1) * fade * 100) / 100;
}

/** Back to front, so the browser paints the stack in the order depth implies. */
export function sortByDepth(layers: readonly GreaseLayer[]): GreaseLayer[] {
  return [...layers].sort((a, b) => (a.offset?.[2] ?? 0) - (b.offset?.[2] ?? 0));
}

/* ── drawing planes ──────────────────────────────────────────────── */

/**
 * Blender's numpad views. Picking one aligns the camera *to the layer's plane*
 * before you draw, which is why the desk never has to un-project a pointer
 * through a rotated matrix: at the moment ink is laid down, the plane is square
 * to the screen and sheet units map 1:1 to the pointer. Orbit to judge depth,
 * snap to draw. Oblique drawing (ink onto a plane you are looking at edge-on)
 * is the next slice, not this one.
 */
export const DRAW_PLANES = {
  front: { camera: REST_CAMERA, rotate: [0, 0, 0] },
  // The camera angle is the negative of the layer's own rotation: world and
  // layer compose, so -90 against +90 is what puts the plane square to the eye.
  top: { camera: { yaw: 0, pitch: -90 }, rotate: [90, 0, 0] },
  right: { camera: { yaw: -90, pitch: 0 }, rotate: [0, 90, 0] },
} as const satisfies Record<string, { camera: Camera; rotate: readonly [number, number, number] }>;

export type DrawPlane = keyof typeof DRAW_PLANES;

/** The plane a layer is drawn on, inferred from its own rotation. */
export function planeOf(layer: GreaseLayer): DrawPlane {
  if (isScreenLayer(layer)) return 'front';
  const [rx = 0, ry = 0] = layer.rotate ?? [];
  if (Math.abs(rx) > 45) return 'top';
  if (Math.abs(ry) > 45) return 'right';
  return 'front';
}

/* ── viewport rig ────────────────────────────────────────────────── */

/**
 * The rig is drawn *chrome* — floor grid and axis gizmo — not brand art. It is
 * generated the way @kiruk/kirukal generates frame edges: real perfect-freehand
 * strokes with a seeded wobble, so a ruled line still looks ruled *by hand*.
 * Founder hand-art stays reserved for the content layers; a grid is furniture,
 * and furniture drawn by code is honest as long as it is genuinely drawn rather
 * than stamped out as a 1px CSS border.
 */

/** mulberry32 — same wobble on the server and in the desk, every build. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A straight run drawn by a wobbling hand: never twice the same, never random. */
function handLine(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  seed: number,
  size: number,
  wobble = 2.4,
): ScribbleStroke {
  const rand = rng(seed);
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  // Sparse on purpose. Every sample becomes outline points in the shipped HTML,
  // and a guide line only needs enough of them to wander convincingly.
  const steps = Math.max(4, Math.min(12, Math.round(len / 240)));
  const nx = -dy / len;
  const ny = dx / len;
  // Drift accumulates instead of jittering per point: a hand wanders, it does
  // not vibrate. Both ends are pulled back on target so the line still meets.
  let drift = 0;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    drift = drift * 0.72 + (rand() - 0.5) * wobble;
    const pull = Math.sin(t * Math.PI);
    points.push([
      Math.round((ax + dx * t + nx * drift * pull) * 10) / 10,
      Math.round((ay + dy * t + ny * drift * pull) * 10) / 10,
      Math.round((0.42 + rand() * 0.2) * 100) / 100,
    ]);
  }
  // Pen, not pencil: one filled outline instead of four graphite strands behind a
  // turbulence filter. The rig is furniture — it must not outweigh the drawing.
  return { tool: 'pen', size, stylus: true, points };
}

export interface GridOptions {
  /** Half-extent of the grid in sheet units. */
  readonly extent?: number;
  /** Lines each side of the origin. */
  readonly divisions?: number;
  readonly size?: number;
  readonly seed?: number;
}

/**
 * Floor grid, drawn flat then laid down by `rotate: [90, 0, 0]` — a real plane,
 * not a picture of one. At rest it collapses to the horizon line the reference
 * sketch draws under the character; orbit and it opens into the receding X.
 * That one gesture is the whole 2.5D idea, with nothing to explain.
 */
export function floorGridLayer(
  height: number,
  { extent = 1400, divisions = 4, size = 3.2, seed = 0x6b31 }: GridOptions = {},
): GreaseLayer {
  const cx = SHEET_WIDTH / 2;
  const cy = height / 2;
  const step = extent / divisions;
  const strokes: ScribbleStroke[] = [];
  for (let i = -divisions; i <= divisions; i++) {
    const o = i * step;
    // Centre lines are the axes: heavier, so the origin stays readable.
    const w = i === 0 ? size * 1.6 : size;
    strokes.push(handLine(cx - extent, cy + o, cx + extent, cy + o, seed + i * 31, w));
    strokes.push(handLine(cx + o, cy - extent, cx + o, cy + extent, seed + i * 97 + 7, w));
  }
  return {
    id: 'rig-floor',
    name: 'floor grid',
    facing: 'plane',
    rotate: [90, 0, 0],
    offset: [0, height * 0.24, 0],
    opacity: 0.55,
    strokes,
  };
}

/**
 * Axis gizmo — the little cross in the reference's top-right. A `plane` layer
 * with no rotation of its own, so it tumbles with the world and tells the reader
 * without a caption that this page has a camera.
 */
export function axisGizmoLayer(size = 88): GreaseLayer {
  const cx = SHEET_WIDTH - 150;
  const cy = 160;
  return {
    id: 'rig-axes',
    name: 'axis gizmo',
    facing: 'gizmo',
    pivot: [cx, cy],
    opacity: 0.62,
    strokes: [
      handLine(cx, cy, cx + size, cy, 0x1a1, 2.4, 1.6),
      handLine(cx, cy, cx, cy - size, 0x2b2, 2.4, 1.6),
      handLine(cx, cy, cx - size * 0.62, cy + size * 0.62, 0x3c3, 2.4, 1.6),
    ],
  };
}

/** Rig layers for a stage. Kept apart from saved layers so they never commit. */
export function rigLayers(
  height: number,
  opts: { grid?: boolean; axes?: boolean } = {},
): GreaseLayer[] {
  const layers: GreaseLayer[] = [];
  if (opts.grid !== false) layers.push(floorGridLayer(height));
  if (opts.axes !== false) layers.push(axisGizmoLayer());
  return layers;
}
