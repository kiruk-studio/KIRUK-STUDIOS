/**
 * The eye's rig — the drawing's construction, in numbers.
 *
 * Eye space: the palpebral fissure runs from the inner corner (x = −1) to the
 * outer corner (x = +1); y points down; one unit = the fissure's half-width.
 * Proportions follow the human eye: fissure ~30 mm wide, ~10–11 mm high at rest,
 * iris ~11.7 mm across (0.36 × 2 here, slightly opened for the plate), the upper
 * lid's highest point a little toward the nose, the lower lid's lowest a little
 * toward the temple, the outer corner set higher than the inner.
 *
 * The same curves are written twice: here in plain numbers (guides, proofs, the
 * instrument) and in eye/shader.ts as TSL. Change one, change the other.
 *
 * spec-link: ideas/studio-dawn/eye.md
 */

export const EYE = {
  canthus: { inY: 0.06, outY: -0.05 },
  upper: { h: 0.385, m: -0.1, e: 0.72 },
  lower: { h: 0.32, m: 0.18, e: 0.95 },
  crease: { h: 0.74, m: -0.04, e: 0.7, k: 0.86, inY: 0.02, outY: -0.08 },
  brow: { y: -1.05, h: 0.22, m: 0.06, e: 0.6, x0: -1.2, x1: 1.4, w0: 0.15, w1: 0.045 },
  iris: { R: 0.36, gx: 0.4, gy: 0.22, cy: 0.02 },
  pupil: { rest: 0.36, light: 0.21, dark: 0.5 },
  /** The plate's frame around the eye, in eye units: x0, y0, w, h. */
  frame: { x0: -1.6, y0: -1.45, w: 3.2, h: 2.55 },
} as const;

export type Pose = { gx: number; gy: number; open: number; pupil: number };
export const REST: Pose = { gx: 0, gy: 0, open: 1, pupil: EYE.pupil.rest };

/** A bump that is 1 at m, 0 at ±1, and keeps falling gently past the corners (lines wrap the socket, never dive). */
export function skewBump(x: number, m: number, e: number) {
  const w = x < m ? 1 + m : 1 - m;
  const u = (x - m) / w;
  const s = Math.abs(u) < 1 ? 1 - u * u : (1 - Math.abs(u)) * 0.9;
  return Math.sign(s) * Math.abs(s) ** e;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const midline = (x: number, inY: number = EYE.canthus.inY, outY: number = EYE.canthus.outY) =>
  lerp(inY, outY, (x + 1) / 2);

export function lowerLid(x: number, p: Pose = REST) {
  return midline(x) + (EYE.lower.h + 0.035 * p.gy) * skewBump(x, EYE.lower.m, EYE.lower.e);
}

export function upperLid(x: number, p: Pose = REST) {
  const open = midline(x) - (EYE.upper.h - 0.06 * p.gy) * skewBump(x, EYE.upper.m, EYE.upper.e);
  return lerp(lowerLid(x, p) - 0.008, open, p.open);
}

export function crease(x: number, p: Pose = REST) {
  const c = EYE.crease;
  return midline(x, c.inY, c.outY) - (c.h - 0.04 * p.gy) * skewBump(x * c.k, c.m, c.e);
}

export function brow(x: number) {
  const b = EYE.brow;
  return b.y - b.h * skewBump((x - 0.1) * 0.78, b.m, b.e);
}

export function irisCentre(p: Pose = REST): [number, number] {
  return [EYE.iris.gx * p.gx, EYE.iris.gy * p.gy + EYE.iris.cy];
}

/** The iris foreshortens on the eyeball as the gaze turns: ±35° yaw, ±25° pitch. */
export function irisRadii(p: Pose = REST): [number, number] {
  const yaw = p.gx * 0.61;
  const pitch = p.gy * 0.44;
  return [EYE.iris.R * Math.cos(yaw) ** 0.9, EYE.iris.R * Math.cos(pitch)];
}

/** Rest-pose landmarks the guides are drawn through (eye units). */
export const LANDMARKS = {
  browTop: brow(0.1) - EYE.brow.w0 * 0.6,
  crease: crease(-0.04),
  lidTop: upperLid(-0.1),
  canthus: midline(0),
  lidBottom: lowerLid(0.18),
  cheek: lowerLid(0.18) + 0.42,
};

/**
 * The globe behind the lids: the construction the engraving is laid over.
 * Its front pole is the iris centre; yaw and pitch per unit of gaze are chosen so
 * the pole lands where the iris is drawn (0.40 gx, 0.22 gy from the centre).
 */
export const GLOBE = { cx: 0, cy: 0.02, R: 0.66, yaw: 0.65, pitch: 0.34 } as const;

/** The optic axis for a pose: unit vector, x right, y down, z out of the sheet. */
export function opticAxis(p: Pose = REST): [number, number, number] {
  const yaw = p.gx * GLOBE.yaw;
  const pitch = p.gy * GLOBE.pitch;
  return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
}

/**
 * Measure. The iris is the rule (d = its diameter); a human iris is ≈ 11.7 mm across,
 * so one eye unit is 11.7 / 0.72 ≈ 16.25 mm. On screen one unit is S CSS px, and a CSS px
 * is 25.4 / 96 mm, so the figure is drawn at S · 25.4 / 96 / 16.25 : 1 — a scale that
 * changes with the layout while every measure in d or mm stays put.
 */
export const IRIS_MM = 11.7;
export const MM_PER_UNIT = IRIS_MM / (2 * EYE.iris.R);
/** The Paris line (ligne), the engraver's small unit before the metre: 2.2558 mm. */
export const MM_PER_LIGNE = 2.2558;
export type Unit = 'd' | 'mm' | 'px' | 'ligne';
export const UNITS: readonly Unit[] = ['d', 'mm', 'px', 'ligne'];

/** A length in eye units, in the chosen unit, as text with its symbol. */
export function formatLength(u: number, unit: Unit, S: number): string {
  if (unit === 'd') return `${(u / (2 * EYE.iris.R)).toFixed(2)} d`;
  if (unit === 'mm') return `${(u * MM_PER_UNIT).toFixed(1)} mm`;
  if (unit === 'px') return `${Math.round(u * S)} px`;
  return `${((u * MM_PER_UNIT) / MM_PER_LIGNE).toFixed(1)} l.`;
}

/** How large the figure is drawn against life, for a layout's S (CSS px per eye unit). */
export function drawnScale(S: number): number {
  return (S * 25.4) / 96 / MM_PER_UNIT;
}

export type Landmark = { id: string; name: string; x: number; y: number };

/** Points the calipers snap to, for the live pose. */
export function landmarks(p: Pose = REST): Landmark[] {
  const [icx, icy] = irisCentre(p);
  const [rx] = irisRadii(p);
  const b = EYE.brow;
  return [
    { id: 'canthus-in', name: 'inner corner', x: -1, y: EYE.canthus.inY },
    { id: 'canthus-out', name: 'outer corner', x: 1, y: EYE.canthus.outY },
    { id: 'lid-apex', name: 'upper lid, apex', x: EYE.upper.m, y: upperLid(EYE.upper.m, p) },
    { id: 'lid-nadir', name: 'lower lid, lowest', x: EYE.lower.m, y: lowerLid(EYE.lower.m, p) },
    {
      id: 'crease-apex',
      name: 'crease, apex',
      x: EYE.crease.m / EYE.crease.k,
      y: crease(EYE.crease.m / EYE.crease.k, p),
    },
    { id: 'brow-head', name: 'brow, head', x: b.x0, y: brow(b.x0) },
    { id: 'brow-peak', name: 'brow, peak', x: 0.1 + b.m / 0.78, y: brow(0.1 + b.m / 0.78) },
    { id: 'brow-tail', name: 'brow, tail', x: b.x1, y: brow(b.x1) },
    { id: 'iris-centre', name: 'iris, centre', x: icx, y: icy },
    { id: 'limbus-in', name: 'limbus, inner', x: icx - rx, y: icy },
    { id: 'limbus-out', name: 'limbus, outer', x: icx + rx, y: icy },
    { id: 'pupil-in', name: 'pupil, inner edge', x: icx - rx * p.pupil, y: icy },
    { id: 'pupil-out', name: 'pupil, outer edge', x: icx + rx * p.pupil, y: icy },
    { id: 'caruncle', name: 'caruncle', x: -0.935, y: 0.045 },
    { id: 'punctum', name: 'lacrimal punctum', x: -0.8, y: 0.171 },
    { id: 'globe', name: 'globe, centre', x: GLOBE.cx, y: GLOBE.cy },
  ];
}
