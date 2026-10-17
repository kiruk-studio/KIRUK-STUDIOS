/**
 * ScribbleDesk — dev-only grease-pencil desk for one scribble scene.
 *
 * Write straight onto the page with pen or pencil (real stylus pressure, simulated
 * for mouse/touch). **Live** posts the scene to the dev writer, which saves
 * src/scribbles/<sheet>.json; Astro reloads and the page renders the committed
 * strokes as static SVG. Only mounted under `astro dev` — readers never load it.
 *
 * Grease pencil, the Blender way: strokes belong to a **layer**, and a layer is a
 * flat sheet of ink standing somewhere in a 3D scene. Pick a drawing plane
 * (front / top / right), and the desk snaps the camera square to that plane
 * before you write — which is exactly why the pointer still maps 1:1 to sheet
 * units and the ink is as exact as it was when the sheet was flat. Orbit (hold
 * Space, or middle-drag) to judge the depth you just built; the inactive layers
 * ghost back like onion skin so you can see what you are drawing against.
 *
 * Feel: the stroke under the nib is painted imperatively every frame (no React
 * render in the hot path) and extended with the browser's predicted pointer
 * points, so ink stays attached to the pen. A drawn tool cursor (nib ring /
 * pencil / eraser with its reach) follows the pointer — OS cursors vanish under a
 * stylus.
 *
 * Unsaved work is kept as a local draft, so an HMR reload never eats a stroke.
 *
 * spec-link: openspec/specs/pen-and-paper/spec.md#requirement-grease-pencil-scene
 */

import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { memo, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import {
  blankLayer,
  type Camera,
  DEFAULT_LAYER_ID,
  DRAW_PLANES,
  type DrawPlane,
  type GreaseLayer,
  type GreaseScene,
  isScreenLayer,
  type LayerFacing,
  layerOrigin,
  layerTransform,
  PERSPECTIVE,
  planeOf,
  rigLayers,
  sceneHeight,
  sortByDepth,
} from './scene';
import {
  graphiteFilterMarkup,
  type InkShape,
  inkMarkup,
  inkShape,
  PENCIL_STRAND_OPACITY,
  type Point,
  type ScribbleStroke,
  SHEET_WIDTH,
  type Tool,
} from './stroke';

type Mode = Tool | 'eraser';
type Strokes = readonly ScribbleStroke[];
type Layers = readonly GreaseLayer[];

interface Props {
  sheet: string;
  initial: GreaseScene;
  /** Mirror the page's viewport chrome so depth is judged against the same rig. */
  rig?: boolean;
}

const SIZES = [3, 6, 12] as const;
const HISTORY = 200;
/** How far back an inactive layer sits visually. Onion skin, not decoration. */
const ONION_OPACITY = 0.26;
const DEPTH_STEP = 120;

/* ── storage (may be blocked; never fatal) ───────────────────────── */

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}
const editKey = (sheet: string) => `kiruk-scribble:editing:${sheet}`;
const draftKey = (sheet: string) => `kiruk-scribble:draft:${sheet}`;

/* ── document: layers + undo history + last-saved snapshot ───────── */

interface Doc {
  layers: Layers;
  activeId: string;
  saved: Layers;
  past: Layers[];
  future: Layers[];
}

type Action =
  | { type: 'append'; stroke: ScribbleStroke }
  | { type: 'preview'; strokes: Strokes }
  | { type: 'commit'; strokes: Strokes; base: Layers }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'saved'; layers: Layers }
  | { type: 'select'; id: string }
  | { type: 'add-layer' }
  | { type: 'drop-layer'; id: string }
  | { type: 'patch-layer'; id: string; patch: Partial<GreaseLayer> };

function push(doc: Doc, next: Layers, base: Layers = doc.layers): Doc {
  return { ...doc, layers: next, past: [...doc.past.slice(-HISTORY), base], future: [] };
}

const activeOf = (doc: Doc) => doc.layers.find((l) => l.id === doc.activeId) ?? doc.layers[0];

function withStrokes(layers: Layers, id: string, strokes: Strokes): Layers {
  return layers.map((l) => (l.id === id ? { ...l, strokes } : l));
}

/** Unique, stable, and readable in the committed JSON diff. */
function freshLayerId(layers: Layers): string {
  let n = layers.length + 1;
  while (layers.some((l) => l.id === `layer-${n}`)) n++;
  return `layer-${n}`;
}

function reduce(doc: Doc, a: Action): Doc {
  const active = activeOf(doc);
  switch (a.type) {
    case 'append':
      return active
        ? push(doc, withStrokes(doc.layers, active.id, [...active.strokes, a.stroke]))
        : doc;
    case 'preview':
      return active ? { ...doc, layers: withStrokes(doc.layers, active.id, a.strokes) } : doc;
    case 'commit':
      return active ? push(doc, withStrokes(doc.layers, active.id, a.strokes), a.base) : doc;
    case 'clear':
      return active?.strokes.length ? push(doc, withStrokes(doc.layers, active.id, [])) : doc;
    case 'undo': {
      const prev = doc.past.at(-1);
      return prev
        ? { ...doc, layers: prev, past: doc.past.slice(0, -1), future: [doc.layers, ...doc.future] }
        : doc;
    }
    case 'redo': {
      const [next, ...rest] = doc.future;
      return next ? { ...doc, layers: next, past: [...doc.past, doc.layers], future: rest } : doc;
    }
    case 'saved':
      return { ...doc, saved: a.layers };
    case 'select':
      return { ...doc, activeId: a.id };
    case 'add-layer': {
      const id = freshLayerId(doc.layers);
      // New layers step back in depth, so a fresh one reads as *behind* the last
      // rather than landing on top of it and hiding the work.
      const z = Math.min(0, (active?.offset?.[2] ?? 0) - DEPTH_STEP);
      const layer: GreaseLayer = { ...blankLayer(id, id), offset: [0, 0, z] };
      return { ...push(doc, [...doc.layers, layer]), activeId: id };
    }
    case 'drop-layer': {
      if (doc.layers.length <= 1) return doc;
      const next = doc.layers.filter((l) => l.id !== a.id);
      const fallback = next[0];
      return {
        ...push(doc, next),
        activeId: doc.activeId === a.id && fallback ? fallback.id : doc.activeId,
      };
    }
    case 'patch-layer':
      return push(
        doc,
        doc.layers.map((l) => (l.id === a.id ? { ...l, ...a.patch } : l)),
      );
  }
}

function initDoc(initial: GreaseScene, sheet: string): Doc {
  const layers = initial.layers.length ? initial.layers : [blankLayer()];
  const doc: Doc = {
    layers,
    activeId: layers[0]?.id ?? DEFAULT_LAYER_ID,
    saved: initial.layers,
    past: [],
    future: [],
  };
  const draft = safe(() => localStorage.getItem(draftKey(sheet)));
  if (!draft || draft === JSON.stringify(initial.layers)) return doc;
  const parsed = safe(() => JSON.parse(draft) as GreaseLayer[]);
  if (!Array.isArray(parsed) || parsed.length === 0) return doc;
  return { ...doc, layers: parsed, activeId: parsed[0]?.id ?? doc.activeId };
}

/* ── geometry ────────────────────────────────────────────────────── */

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Eraser reach in sheet units for a given size. */
const eraserReach = (size: number) => Math.max(10, size * 2);

/** Remove whole strokes the eraser passed over between `a` and `b`. */
function eraseAlong(
  strokes: Strokes,
  a: readonly [number, number],
  b: readonly [number, number],
  size: number,
): Strokes {
  const reach = eraserReach(size);
  const next = strokes.filter(
    (s) =>
      !s.points.some(([x, y]) => distToSegment(x, y, a[0], a[1], b[0], b[1]) <= reach + s.size / 2),
  );
  return next.length === strokes.length ? strokes : next;
}

/* ── ink ─────────────────────────────────────────────────────────── */

const shapeCache = new WeakMap<ScribbleStroke, InkShape>();
const keyCache = new WeakMap<ScribbleStroke, number>();
let nextKey = 0;

function Shape({ shape, filterId }: { shape: InkShape; filterId: string }) {
  if (!shape.pencil) return <path d={shape.paths[0]} fill="currentColor" />;
  return (
    <g filter={`url(#${filterId})`} opacity={shape.opacity}>
      {shape.paths.map((d) => (
        <path
          key={d.length + d.slice(0, 24)}
          d={d}
          fill="currentColor"
          opacity={PENCIL_STRAND_OPACITY}
        />
      ))}
    </g>
  );
}

const Ink = memo(function Ink({ strokes, filterId }: { strokes: Strokes; filterId: string }) {
  return (
    <>
      {strokes.map((s) => {
        let shape = shapeCache.get(s);
        if (shape === undefined) {
          shape = inkShape(s);
          shapeCache.set(s, shape);
        }
        let key = keyCache.get(s);
        if (key === undefined) {
          key = nextKey++;
          keyCache.set(s, key);
        }
        return <Shape key={key} shape={shape} filterId={filterId} />;
      })}
    </>
  );
});

/* ── tool cursor ─────────────────────────────────────────────────── */

// Icons are drawn with their working tip at bottom-left (2,22) of a 24px box.
const ICON_PROPS = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'var(--paper)',
  stroke: 'var(--ink)',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { position: 'absolute', overflow: 'visible' },
} as const;

const PEN_ICON = (
  <>
    <path d="M2 22 5 13 13.5 4.5 19.5 10.5 11 19Z" />
    <path d="M13.5 4.5 16 2l6 6-2.5 2.5" />
    <path d="M2 22l6.2-6.2" />
    <circle cx="9.4" cy="14.6" r="1.3" />
  </>
);

const PENCIL_ICON = (
  <>
    <path d="M2 22 4.5 15.5 16 4l4 4L8.5 19.5Z" />
    <path d="M4.5 15.5l4 4" />
    <path d="M2 22l1.2-3.3 2.1 2.1Z" fill="var(--ink)" />
    <path d="M14 6l4 4" />
  </>
);

const ERASER_ICON = (
  <>
    <path d="M3.5 15.5 13 6a1.5 1.5 0 0 1 2.1 0l4.9 4.9a1.5 1.5 0 0 1 0 2.1L12.5 20.5h-4Z" />
    <path d="M3.5 15.5 8 11l7 7-2.5 2.5h-4Z" fill="var(--ink)" />
    <path d="M12.5 20.5H21" />
  </>
);

function ToolCursor({ mode, size, scale }: { mode: Mode; size: number; scale: number }) {
  const ring = {
    position: 'absolute',
    borderRadius: '9999px',
    boxShadow: '0 0 0 1px var(--paper)',
  } as const;
  if (mode === 'eraser') {
    const r = Math.max(6, eraserReach(size) * scale);
    return (
      <>
        <span
          style={{
            ...ring,
            left: -r,
            top: -r,
            width: r * 2,
            height: r * 2,
            border: '1.5px dashed var(--ink)',
          }}
        />
        <svg
          aria-hidden="true"
          {...ICON_PROPS}
          style={{ ...ICON_PROPS.style, left: r * 0.72 - 2, top: -r * 0.72 - 24 }}
        >
          {ERASER_ICON}
        </svg>
      </>
    );
  }
  const nib = Math.max(3, size * (mode === 'pencil' ? 0.55 : 1) * scale);
  return (
    <>
      <span
        style={{
          ...ring,
          left: -nib / 2 - 1,
          top: -nib / 2 - 1,
          width: nib + 2,
          height: nib + 2,
          border: '1px solid var(--ink)',
        }}
      />
      <svg aria-hidden="true" {...ICON_PROPS} style={{ ...ICON_PROPS.style, left: 3, top: -29 }}>
        {mode === 'pen' ? PEN_ICON : PENCIL_ICON}
      </svg>
    </>
  );
}

/* ── toolbar button ──────────────────────────────────────────────── */

function Btn(props: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  strong?: boolean;
}) {
  const on = props.active || props.strong;
  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.title}
      aria-pressed={props.active}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border px-3 font-mono text-[11px] uppercase tracking-widest transition-colors disabled:opacity-30 ${
        on ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper text-ink hover:border-ink'
      }`}
    >
      {props.children}
    </button>
  );
}

/* ── layer strip ─────────────────────────────────────────────────── */

/** Cycled by one button, so the whole model is reachable without a dropdown. */
const NEXT_FACING: Record<LayerFacing, LayerFacing> = {
  billboard: 'plane',
  plane: 'screen',
  screen: 'billboard',
  // `gizmo` is rig-only and never authored here; if a hand-edited scene carries
  // one, the cycle lets it out rather than trapping the layer.
  gizmo: 'billboard',
};
const FACING_LABEL: Record<LayerFacing, string> = {
  billboard: 'face',
  plane: 'plane',
  screen: 'ui',
  gizmo: 'axis',
};
const FACING_HELP: Record<LayerFacing, string> = {
  billboard: 'Faces the camera at its own depth — click to pin it to its plane',
  plane: 'Pinned to its plane, turns with the world — click to make it interface',
  screen: 'Interface: outside the scene, never orbits — click to make it face the camera',
  gizmo: 'Orientation readout: holds its spot on screen but turns with the camera',
};

function LayerRow({
  layer,
  active,
  canDrop,
  onSelect,
  onPatch,
  onDrop,
}: {
  layer: GreaseLayer;
  active: boolean;
  canDrop: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<GreaseLayer>) => void;
  onDrop: () => void;
}) {
  const z = layer.offset?.[2] ?? 0;
  const facing = layer.facing ?? 'billboard';
  const nudge = (dz: number) => {
    const [x = 0, y = 0] = layer.offset ?? [];
    onPatch({ offset: [x, y, z + dz] });
  };
  return (
    <li
      className={`flex items-center gap-1 rounded-xl border px-1.5 py-1 ${
        active ? 'border-ink bg-ink/5' : 'border-rule'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        title={`Draw on “${layer.name}”`}
        className="min-w-0 flex-1 truncate text-left font-mono text-[11px] uppercase tracking-widest"
      >
        {layer.name}
      </button>
      <span className="font-mono text-[10px] text-pencil tabular-nums" title="Depth (z)">
        {z}
      </span>
      <button
        type="button"
        title="Move layer further back"
        aria-label={`Move ${layer.name} further back`}
        onClick={() => nudge(-DEPTH_STEP)}
        className="h-6 w-6 rounded-md border border-rule font-mono text-[11px] hover:border-ink"
      >
        −
      </button>
      <button
        type="button"
        title="Bring layer forward"
        aria-label={`Bring ${layer.name} forward`}
        onClick={() => nudge(DEPTH_STEP)}
        className="h-6 w-6 rounded-md border border-rule font-mono text-[11px] hover:border-ink"
      >
        +
      </button>
      <button
        type="button"
        title={FACING_HELP[facing]}
        onClick={() => onPatch({ facing: NEXT_FACING[facing] })}
        className={`h-6 rounded-md border px-1.5 font-mono text-[10px] uppercase ${
          facing === 'screen' ? 'border-ink bg-ink text-paper' : 'border-rule'
        }`}
      >
        {FACING_LABEL[facing]}
      </button>
      <button
        type="button"
        title={layer.hidden ? 'Show layer' : 'Hide layer'}
        aria-pressed={!layer.hidden}
        onClick={() => onPatch({ hidden: !layer.hidden })}
        className="h-6 w-6 rounded-md border border-rule font-mono text-[11px] hover:border-ink"
      >
        {layer.hidden ? '○' : '●'}
      </button>
      <button
        type="button"
        title="Delete layer"
        aria-label={`Delete ${layer.name}`}
        disabled={!canDrop}
        onClick={onDrop}
        className="h-6 w-6 rounded-md border border-rule font-mono text-[11px] hover:border-ink disabled:opacity-30"
      >
        ×
      </button>
    </li>
  );
}

/* ── desk ────────────────────────────────────────────────────────── */

interface Live {
  id: number;
  stroke: ScribbleStroke;
  predicted: Point[];
}
interface Erase {
  id: number;
  base: Layers;
  current: Strokes;
  last: [number, number];
}
interface Orbit {
  id: number;
  x: number;
  y: number;
  cam: Camera;
}

export default function ScribbleDesk({ sheet, initial, rig = false }: Props) {
  const filterId = `kiruk-graphite-desk-${sheet}`;
  const [doc, dispatch] = useReducer(reduce, undefined, () => initDoc(initial, sheet));
  const [editing, setEditing] = useState(
    () => safe(() => sessionStorage.getItem(editKey(sheet))) === '1',
  );
  const [mode, setMode] = useState<Mode>('pen');
  const [size, setSize] = useState<number>(SIZES[1]);
  const [status, setStatus] = useState<'idle' | 'writing' | 'live' | 'failed'>('idle');
  const [frameH, setFrameH] = useState(900);
  const [scale, setScale] = useState(1);
  const [cam, setCam] = useState<Camera>(initial.camera);

  const worldRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const liveRef = useRef<SVGGElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const drawing = useRef<Live | null>(null);
  const erasing = useRef<Erase | null>(null);
  const orbiting = useRef<Orbit | null>(null);
  const spaceDown = useRef(false);
  const raf = useRef(0);
  const penSeen = useRef(false);
  const docRef = useRef(doc);
  docRef.current = doc;

  const active = activeOf(doc);
  const activeId = active?.id ?? DEFAULT_LAYER_ID;
  const plane = active ? planeOf(active) : 'front';
  const dirty = doc.layers !== doc.saved;

  // Draft keeps unsaved layers across reloads; cleared once they are in code.
  useEffect(() => {
    if (dirty) safe(() => localStorage.setItem(draftKey(sheet), JSON.stringify(doc.layers)));
    else safe(() => localStorage.removeItem(draftKey(sheet)));
  }, [dirty, doc.layers, sheet]);

  // The committed stroke is now rendered by <Ink>; drop the live copy before paint.
  // doc.layers is the trigger, not a read: the live copy must go in the same frame
  // the committed one appears, or the stroke flashes twice.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useLayoutEffect(() => {
    if (!drawing.current && liveRef.current) liveRef.current.innerHTML = '';
  }, [doc.layers]);

  // While editing, the desk replaces the static ink; the flag survives Live's reload.
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(`[data-scribble-sheet="${sheet}"]`);
    host?.toggleAttribute('data-editing', editing);
    safe(() =>
      editing
        ? sessionStorage.setItem(editKey(sheet), '1')
        : sessionStorage.removeItem(editKey(sheet)),
    );
    if (!editing) return;
    const measure = () => {
      const w = host?.clientWidth || window.innerWidth;
      setScale(w / SHEET_WIDTH);
      setFrameH(Math.ceil((window.innerHeight * SHEET_WIDTH) / w));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [editing, sheet]);

  /**
   * Align the camera to the layer you are about to draw on — Blender's numpad
   * views. Square to the plane means sheet units map 1:1 to the pointer, so no
   * stroke is ever laid down through an inverse projection.
   */
  const alignTo = useCallback((next: DrawPlane) => {
    setCam(DRAW_PLANES[next].camera);
  }, []);

  const setPlane = useCallback(
    (next: DrawPlane) => {
      const layer = activeOf(docRef.current);
      if (layer) {
        dispatch({
          type: 'patch-layer',
          id: layer.id,
          // A layer drawn on a tilted plane must be pinned to it, or the drawing
          // would billboard away from the surface it was made for. The front
          // plane is the exception: it is where a billboard already sits, so
          // picking it must not quietly turn a face-on layer into a flat one.
          patch:
            next === 'front'
              ? { rotate: [...DRAW_PLANES.front.rotate] }
              : { rotate: [...DRAW_PLANES[next].rotate], facing: 'plane' },
        });
      }
      alignTo(next);
    },
    [alignTo],
  );

  const goLive = useCallback(async () => {
    const layers = docRef.current.layers;
    setStatus('writing');
    try {
      const res = await fetch(`/__scribble/save?sheet=${encodeURIComponent(sheet)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          version: 2,
          width: SHEET_WIDTH,
          height: sceneHeight(layers),
          camera: cam,
          layers,
        } satisfies GreaseScene),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      dispatch({ type: 'saved', layers });
      setStatus('live');
    } catch (err) {
      console.error('[scribble] live failed', err);
      setStatus('failed');
    }
  }, [sheet, cam]);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]'))
        return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (k === ' ') spaceDown.current = true;
      if (mod && k === 'z') dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
      else if (mod && k === 'y') dispatch({ type: 'redo' });
      else if (mod && k === 's') void goLive();
      else if (mod || e.altKey) return;
      else if (k === 'p') setMode('pen');
      else if (k === 'b') setMode('pencil');
      else if (k === 'e') setMode('eraser');
      else if (k === '1') setPlane('front');
      else if (k === '3') setPlane('right');
      else if (k === '7') setPlane('top');
      // Blender's numpad-0 snaps the view back; here it re-squares to the layer.
      else if (k === '0') alignTo(plane);
      else if (k === 'n') dispatch({ type: 'add-layer' });
      else if (k === '[' || k === ']')
        setSize((cur) => {
          const i = SIZES.indexOf(cur as (typeof SIZES)[number]);
          return SIZES[Math.max(0, Math.min(SIZES.length - 1, i + (k === '[' ? -1 : 1)))] ?? cur;
        });
      else if (k === 'escape') setEditing(false);
      else if (k !== ' ') return;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') spaceDown.current = false;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editing, goLive, setPlane, alignTo, plane]);

  /* pointer → sheet units, measured on the active layer itself */
  const mapper = () => {
    const rect = svgRef.current?.getBoundingClientRect();
    const k = rect ? SHEET_WIDTH / rect.width : 1;
    return (e: { clientX: number; clientY: number }): [number, number] => [
      (e.clientX - (rect?.left ?? 0)) * k,
      (e.clientY - (rect?.top ?? 0)) * k,
    ];
  };
  const pressure = (e: PointerEvent, stylus: boolean) =>
    stylus ? r2(Math.max(0.15, e.pressure || 0.5)) : 0.5;

  const moveCursorFrom = (e: { pointerType: string; clientX: number; clientY: number }) => {
    const el = cursorRef.current;
    if (!el) return;
    el.style.opacity = e.pointerType === 'touch' || orbiting.current ? '0' : '1';
    el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  };
  const moveCursor = (e: ReactPointerEvent<Element>) => moveCursorFrom(e);
  const hideCursor = () => {
    if (cursorRef.current) cursorRef.current.style.opacity = '0';
  };

  /** Paint the in-progress stroke straight into the DOM once per frame. */
  const paint = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const d = drawing.current;
      if (d && liveRef.current) {
        liveRef.current.innerHTML = inkMarkup(inkShape(d.stroke, false, d.predicted), filterId);
      }
    });
  };

  /* ── stage gestures ───────────────────────────────────────────── */

  /**
   * A gesture starts on the stage and then belongs to the window.
   *
   * `setPointerCapture` is the obvious tool and is deliberately not the one used
   * here: capture is granted asynchronously, a browser may refuse it outright,
   * and when it is refused the element simply stops receiving move and up — the
   * stroke hangs open with no error anywhere. Listening on the window for the
   * life of the gesture cannot fail that way, and it buys the same thing capture
   * was for: a stroke that runs off the edge of the layer keeps recording, the
   * way paper does.
   *
   * Coordinates are always measured against the active layer's own box, so the
   * pointer maps to sheet units no matter which element the event landed on.
   */
  const endGesture = useRef<(() => void) | null>(null);

  const trackGesture = (
    onMove: (e: PointerEvent) => void,
    onEnd: (e: PointerEvent) => void,
    id: number,
  ) => {
    endGesture.current?.();
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      moveCursorFrom(e);
      onMove(e);
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      endGesture.current?.();
      onEnd(e);
    };
    endGesture.current = () => {
      endGesture.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  useEffect(() => () => endGesture.current?.(), []);

  const startOrbit = (e: ReactPointerEvent<HTMLDivElement>) => {
    const from = { id: e.pointerId, x: e.clientX, y: e.clientY, cam };
    orbiting.current = from;
    hideCursor();
    trackGesture(
      (ev) => {
        const span = worldRef.current?.clientWidth || 1;
        setCam({
          yaw: clamp(from.cam.yaw + ((ev.clientX - from.x) / span) * 180, 180),
          pitch: clamp(from.cam.pitch + ((ev.clientY - from.y) / span) * 180, 90),
        });
      },
      () => {
        orbiting.current = null;
      },
      e.pointerId,
    );
  };

  const startErase = (e: ReactPointerEvent<HTMLDivElement>, at: [number, number]) => {
    const base = docRef.current.layers;
    const strokes = activeOf(docRef.current)?.strokes ?? [];
    const first = eraseAlong(strokes, at, at, size);
    const er: Erase = { id: e.pointerId, base, current: first, last: at };
    erasing.current = er;
    if (first !== strokes) dispatch({ type: 'preview', strokes: first });
    trackGesture(
      (ev) => {
        const [x, y] = mapper()(ev);
        const next = eraseAlong(er.current, er.last, [x, y], size);
        er.last = [x, y];
        if (next !== er.current) {
          er.current = next;
          dispatch({ type: 'preview', strokes: next });
        }
      },
      () => {
        erasing.current = null;
        if (er.current !== er.base.find((l) => l.id === docRef.current.activeId)?.strokes) {
          dispatch({ type: 'commit', strokes: er.current, base: er.base });
        }
      },
      e.pointerId,
    );
  };

  const startStroke = (e: ReactPointerEvent<HTMLDivElement>, tool: Tool, at: [number, number]) => {
    const stylus = e.pointerType === 'pen';
    const live: Live = {
      id: e.pointerId,
      stroke: {
        tool,
        size,
        stylus,
        points: [[r1(at[0]), r1(at[1]), pressure(e.nativeEvent, stylus)]],
      },
      predicted: [],
    };
    drawing.current = live;
    setStatus('idle');
    paint();
    trackGesture(
      (ev) => {
        const map = mapper();
        // Coalesced events carry every sample the OS took between frames; that is
        // where a stroke's fine detail lives, especially from a fast stylus.
        const coalesced = ev.getCoalescedEvents?.() ?? [];
        for (const sample of coalesced.length ? coalesced : [ev]) {
          const [x, y] = map(sample);
          const last = live.stroke.points.at(-1);
          if (last && Math.abs(last[0] - x) < 0.5 && Math.abs(last[1] - y) < 0.5) continue;
          live.stroke.points.push([r1(x), r1(y), pressure(sample, live.stroke.stylus)]);
        }
        live.predicted = (ev.getPredictedEvents?.() ?? []).map((sample) => {
          const [x, y] = map(sample);
          return [x, y, pressure(sample, live.stroke.stylus)];
        });
        paint();
      },
      () => {
        drawing.current = null;
        cancelAnimationFrame(raf.current);
        raf.current = 0;
        // A tap that never moved is a dot, not a stroke — and a stray one-point
        // path is invisible ink that still costs a line in the committed JSON.
        if (live.stroke.points.length > 1) dispatch({ type: 'append', stroke: live.stroke });
        else if (liveRef.current) liveRef.current.innerHTML = '';
      },
      e.pointerId,
    );
  };

  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    moveCursor(e);
    if (drawing.current || erasing.current || orbiting.current) return;
    // Middle-drag or Space-drag orbits, matching the muscle memory of every 3D app.
    if (e.button === 1 || spaceDown.current) {
      e.preventDefault();
      startOrbit(e);
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType === 'pen') penSeen.current = true;
    else if (e.pointerType === 'touch' && penSeen.current) return; // palm rejection
    const at = mapper()(e);
    if (mode === 'eraser') startErase(e, at);
    else startStroke(e, mode, at);
  };

  const label =
    status === 'writing'
      ? 'writing…'
      : status === 'failed'
        ? 'failed — see console'
        : dirty
          ? 'unsaved'
          : status === 'live'
            ? 'live ✓'
            : 'in code';

  if (!editing) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Btn title="Open scribble desk (dev only)" onClick={() => setEditing(true)}>
          scribble{dirty ? ' •' : ''}
        </Btn>
      </div>
    );
  }

  const viewH = Math.max(frameH, sceneHeight(doc.layers) + Math.round(frameH * 0.5));
  const drawn = sortByDepth([
    ...(rig ? rigLayers(viewH) : []),
    ...doc.layers.filter((l) => !l.hidden),
  ]);
  const worldLayers = drawn.filter((l) => !isScreenLayer(l));
  const screenLayers = drawn.filter(isScreenLayer);

  /** One layer, wired for ink when it is the active one. */
  const renderLayer = (layer: GreaseLayer) => {
    const isActive = layer.id === activeId;
    return (
      <div
        key={layer.id}
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: layer.facing === 'screen' ? 'flat' : 'preserve-3d',
          transform: layerTransform(layer, viewH),
          transformOrigin: layerOrigin(layer, viewH),
          // Onion skin: everything that is not the active layer steps back so the
          // hand can see what it is drawing against, not through.
          opacity: isActive ? 1 : ONION_OPACITY,
          // Layer boxes are transparent but still hit-testable, and they overlap
          // each other completely. The stage owns every gesture instead.
          pointerEvents: 'none',
        }}
      >
        <svg
          ref={isActive ? svgRef : undefined}
          viewBox={`0 0 ${SHEET_WIDTH} ${viewH}`}
          role={isActive ? 'img' : undefined}
          aria-label={isActive ? `Drawing on layer ${layer.name}` : undefined}
          aria-hidden={isActive ? undefined : 'true'}
          style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}
        >
          {isActive && <title>Scribble canvas — layer {layer.name}</title>}
          <Ink strokes={layer.strokes} filterId={filterId} />
          {isActive && <g ref={liveRef} />}
        </svg>
      </div>
    );
  };

  return (
    <>
      <div
        ref={worldRef}
        className="gp-desk"
        onPointerDown={onStagePointerDown}
        onPointerMove={moveCursor}
        onPointerEnter={moveCursor}
        onPointerLeave={hideCursor}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${SHEET_WIDTH} / ${viewH}`,
          perspective: `${PERSPECTIVE}px`,
          color: 'var(--ink)',
          touchAction: 'none',
          userSelect: 'none',
          // The drawn nib replaces the OS cursor; a stylus has none to begin with.
          cursor: 'none',
        }}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          style={{ position: 'absolute', width: 0, height: 0 }}
        >
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: constant filter markup shared with the static Astro render; id comes from the sheet id */}
          <defs dangerouslySetInnerHTML={{ __html: graphiteFilterMarkup(filterId) }} />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${cam.pitch}deg) rotateY(${cam.yaw}deg)`,
            pointerEvents: 'none',
          }}
        >
          {worldLayers.map(renderLayer)}
        </div>
        {screenLayers.map(renderLayer)}
      </div>

      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[60]"
        style={{ opacity: 0, willChange: 'transform' }}
      >
        <ToolCursor mode={mode} size={size} scale={scale} />
      </div>

      <div
        role="toolbar"
        aria-label="Scribble desk"
        className="fixed top-4 left-1/2 z-50 flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-3xl border border-ink bg-paper p-1.5"
      >
        <Btn title="Pen (P)" active={mode === 'pen'} onClick={() => setMode('pen')}>
          pen
        </Btn>
        <Btn title="Pencil (B)" active={mode === 'pencil'} onClick={() => setMode('pencil')}>
          pencil
        </Btn>
        <Btn title="Eraser (E)" active={mode === 'eraser'} onClick={() => setMode('eraser')}>
          erase
        </Btn>
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden="true" />
        {SIZES.map((s, i) => (
          <Btn key={s} title={`Nib ${i + 1}`} active={size === s} onClick={() => setSize(s)}>
            <span
              className="block rounded-full bg-current"
              style={{ width: s / 1.5 + 2, height: s / 1.5 + 2 }}
            />
          </Btn>
        ))}
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden="true" />
        <Btn
          title="Draw on the front plane (1)"
          active={plane === 'front'}
          onClick={() => setPlane('front')}
        >
          front
        </Btn>
        <Btn
          title="Draw on the right plane (3)"
          active={plane === 'right'}
          onClick={() => setPlane('right')}
        >
          right
        </Btn>
        <Btn
          title="Draw on the top plane (7)"
          active={plane === 'top'}
          onClick={() => setPlane('top')}
        >
          top
        </Btn>
        <Btn title="Square the camera back to this layer (0)" onClick={() => alignTo(plane)}>
          align
        </Btn>
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden="true" />
        <Btn
          title="Undo (Ctrl+Z)"
          disabled={!doc.past.length}
          onClick={() => dispatch({ type: 'undo' })}
        >
          undo
        </Btn>
        <Btn
          title="Redo (Ctrl+Shift+Z)"
          disabled={!doc.future.length}
          onClick={() => dispatch({ type: 'redo' })}
        >
          redo
        </Btn>
        <Btn
          title="Clear this layer (undoable)"
          disabled={!active?.strokes.length}
          onClick={() => dispatch({ type: 'clear' })}
        >
          clear
        </Btn>
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden="true" />
        <span
          className="px-1 font-mono text-[10px] uppercase tracking-widest text-pencil"
          aria-live="polite"
        >
          {label}
        </span>
        <Btn
          title="Write to code (Ctrl+S)"
          strong
          disabled={!dirty || status === 'writing'}
          onClick={() => void goLive()}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          live
        </Btn>
        <Btn title="Close desk (Esc)" onClick={() => setEditing(false)}>
          done
        </Btn>
      </div>

      <div className="fixed right-4 bottom-4 z-50 w-72 rounded-2xl border border-ink bg-paper p-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-pencil">
            layers
          </span>
          <Btn title="New layer (N)" onClick={() => dispatch({ type: 'add-layer' })}>
            + layer
          </Btn>
        </div>
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {doc.layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              active={layer.id === activeId}
              canDrop={doc.layers.length > 1}
              onSelect={() => dispatch({ type: 'select', id: layer.id })}
              onPatch={(patch) => dispatch({ type: 'patch-layer', id: layer.id, patch })}
              onDrop={() => dispatch({ type: 'drop-layer', id: layer.id })}
            />
          ))}
        </ul>
        <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-pencil">
          space-drag or middle-drag orbits · 1/3/7 pick a plane · 0 re-squares
        </p>
      </div>
    </>
  );
}
