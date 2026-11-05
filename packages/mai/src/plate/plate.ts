/**
 * The plate — one sheet, its layers, its light, its truth.
 *
 * A plate is built in passes, the way the research orders them (01 R15, 02 R3): rule the
 * sheet, construct, ink selectively, letter the key, lay the overlay last. Every mark keeps
 * what made it (role, instrument, ink, form, the tone it was asked for), so the critic can
 * check the finished sheet against its own intentions.
 */
import { hex, type RGB } from '../core/color.ts';
import { cumulative, lengthOf, type Path, resample } from '../core/path.ts';
import { createRng, hashString, type Rng } from '../core/rng.ts';
import { esc, f2 } from '../core/svg.ts';
import type { MVec, Vec } from '../core/vec.ts';
import {
  type End,
  type Guide,
  type HandSpec,
  perform,
  type Role,
  type Start,
} from '../hand/hand.ts';
import { INKS, type InkId, type InkSpec } from '../ink/inks.ts';
import {
  freshInk,
  type InkState,
  inkStroke,
  type MarkPart,
  type StrokeStats,
} from '../ink/render.ts';
import { type Light, light2d, UPPER_LEFT } from '../light/light.ts';
import { INSTRUMENTS, type InstrumentId } from '../nib/instruments.ts';
import { createPaper, type Paper, type PaperId, type PaperSpec } from '../paper/paper.ts';
import {
  type LayerId,
  type RoleKit,
  STYLES,
  type StyleId,
  type StyleSpec,
} from '../styles/styles.ts';

/** Roles a hand draws in several lifts when the line is longer than its reach. */
const LIFT_ROLES = new Set<Role>(['contour', 'underdrawing', 'searching', 'heightening']);

export const LAYER_ORDER: readonly LayerId[] = [
  'stylus',
  'construction',
  'underdrawing',
  'wash',
  'ink',
  'heightening',
  'letter',
  'overlay',
];

export interface Mark {
  id: string;
  layer: LayerId;
  role: Role;
  ink: InkId;
  instrument: InstrumentId;
  guide: Guide;
  parts: MarkPart[];
  stats: StrokeStats;
  /** Performed centreline (mm). */
  spine: MVec[];
  /** Width along the performed centreline (mm). */
  widths: number[];
  /** What the stroke aimed at (mm). */
  intended: MVec[];
  /** Group it belongs to: a hatch field, a glyph, a dimension, a construction. */
  group?: string;
  /** Form it describes (for the lighting checks). */
  form?: string;
  /** The tone this stroke was laid to give, 0..1 (hatching). */
  tone?: number;
  /** Hatch direction family, degrees, when it is a hatch stroke. */
  slope?: number;
  /** Order in which the hand made it. */
  order: number;
}

export interface TextItem {
  id: string;
  text: string;
  /** Anchor point (mm) and alignment. */
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  /** Cap height, mm. */
  cap: number;
  kind: 'title' | 'note' | 'key' | 'numeral' | 'dimension' | 'caption' | 'scale';
  /** Drawn by the hand (Hershey strokes) or typeset (SVG text). */
  drawn: boolean;
  mirror: boolean;
  /** For mirror text: the id of its readable twin. */
  twin?: string;
  /** Bounding box (mm) x0 y0 x1 y1. */
  box: [number, number, number, number];
  color: RGB;
  italic?: boolean;
  /** What it refers to (a part's anchor point), for leaders and the label checks. */
  refers?: Vec;
  rotate?: number;
}

export interface DimensionRecord {
  id: string;
  a: Vec;
  b: Vec;
  /** Measured distance on the sheet (mm) and the value it stands for. */
  sheet: number;
  value: number;
  unit: string;
  text: string;
  /** Where the dimension line sits and its extension lines start/end (mm). */
  line: [Vec, Vec];
  ext: [[Vec, Vec], [Vec, Vec]];
  /** Points on the ink the extension lines measure from (for the "measure the ink" check). */
  feature: [Vec, Vec];
  textId: string;
}

export interface ConstructionRecord {
  id: string;
  kind: 'line' | 'circle' | 'arc' | 'point' | 'grid' | 'spiral' | 'axis' | 'perspective';
  /** Geometry, mm. */
  path: MVec[];
  /** Ids of marks or records this construction generated. Empty = an ornament (critic fails). */
  generates: string[];
  label?: string;
}

export interface FormRecord {
  id: string;
  kind: string;
  /** Outline (mm) for the region checks. */
  outline: MVec[];
  /** Tone at a point (0 lit … 1 dark), for the lighting checks. */
  tone: (p: Vec) => number;
}

export interface TruthEntry {
  value: number | string;
  unit?: string;
  source: string;
}

export interface PlateSpec {
  id: string;
  title: string;
  /** The one sentence the plate explains (codex: claim first). */
  claim: string;
  /** Sheet size in mm. */
  size: readonly [number, number];
  /** Margins: top, right, bottom, left (mm). */
  margins?: readonly [number, number, number, number];
  style: StyleId | StyleSpec;
  paper?: PaperId | PaperSpec;
  light?: Light;
  seed?: number;
  /** As found: time on the sheet (0 as made). Requires `timeReason`. */
  time?: number;
  timeReason?: string;
  /** Eye motif: drawn on the plate (with a reference) or absent (with a justification). */
  eye: { motif: 'drawn'; ref: string } | { motif: 'none'; justification: string };
  /** The explanatory device (research 01 R4): section, exploded, build-up, phase, side-by-side, thread, construction. */
  device: string;
  /** Typeface stack for typeset notes. */
  typeface?: string;
  /** How many views or studies of the subject the sheet holds (01 R3: at least two). */
  views?: number;
  /** Drawing scale: a value is (sheet mm × perMm) in `unit`. Default 1 mm = 1 mm. */
  scale?: { unit: string; perMm: number; digits?: number };
}

export interface StrokeOptions {
  role: Role;
  /** Override the style's kit for this role. */
  instrument?: InstrumentId;
  ink?: InkId;
  layer?: LayerId;
  density?: number;
  pressure?: number | ((u: number) => number);
  pace?: number;
  precision?: number;
  start?: Start;
  end?: End;
  guide?: Guide;
  bow?: number;
  overshoot?: readonly [number, number];
  anchored?: boolean;
  weight?: (p: Vec, t: Vec) => number;
  next?: Vec;
  group?: string;
  form?: string;
  tone?: number;
  slope?: number;
  id?: string;
}

export class Plate {
  readonly spec: PlateSpec;
  readonly style: StyleSpec;
  readonly paper: Paper;
  readonly light: Light;
  readonly hand: HandSpec;
  readonly rng: Rng;
  readonly marks: Mark[] = [];
  readonly texts: TextItem[] = [];
  readonly dimensions: DimensionRecord[] = [];
  readonly constructions: ConstructionRecord[] = [];
  readonly forms: FormRecord[] = [];
  readonly truth: Record<string, TruthEntry> = {};
  private inkStates = new Map<string, InkState>();
  private counter = 0;

  constructor(spec: PlateSpec) {
    this.spec = spec;
    this.style = typeof spec.style === 'string' ? STYLES[spec.style] : spec.style;
    const seed = spec.seed ?? hashString(spec.id);
    this.rng = createRng(seed);
    this.paper = createPaper(spec.paper ?? this.style.paper, seed, spec.time ?? 0);
    this.light = spec.light ?? UPPER_LEFT;
    this.hand = this.style.hand;
    if ((spec.time ?? 0) > 0 && !spec.timeReason)
      throw new Error(
        `mai: plate "${spec.id}" sets time without timeReason — age is costume unless the plate says why`,
      );
  }

  get size(): readonly [number, number] {
    return this.spec.size;
  }

  get margins(): readonly [number, number, number, number] {
    const [w, h] = this.spec.size;
    return this.spec.margins ?? [h * 0.08, w * 0.08, h * 0.1, w * 0.08];
  }

  /** The kit a role takes in this plate's style. */
  kit(role: Role): RoleKit {
    return this.style.roles[role] ?? this.style.roles.contour;
  }

  private stateFor(layer: LayerId, ins: InstrumentId, inkId: InkId): InkState {
    const key = `${layer}|${ins}|${inkId}`;
    let s = this.inkStates.get(key);
    if (!s) {
      s = freshInk(this.rng.fork(`ink:${key}`));
      this.inkStates.set(key, s);
    }
    return s;
  }

  /**
   * The reservoir of one pen on one layer. Mutable: a specimen may set `reservoir` and
   * `hold` to show a pen running dry; plates should leave it to the scribe.
   */
  reservoir(layer: LayerId, ins: InstrumentId, inkId: InkId): InkState {
    return this.stateFor(layer, ins, inkId);
  }

  nextId(prefix: string): string {
    this.counter++;
    return `${prefix}-${this.counter}`;
  }

  /**
   * Perform and ink a stroke. A long free stroke is drawn the way a hand draws it: in
   * pieces as long as the hand's reach, each landing where the last lifted, a little over
   * it (a darker join) or a hair short of it (a gap). Returns every piece.
   */
  stroke(path: Path, o: StrokeOptions): Mark[] {
    if (path.length < 2) return [];
    const guide = o.guide ?? 'free';
    const insKind = INSTRUMENTS[o.instrument ?? this.kit(o.role).instrument].kind;
    // a burin cuts a line in one pass; a ruling pen runs the ruler's length
    const liftable =
      guide === 'free' && LIFT_ROLES.has(o.role) && insKind !== 'burin' && insKind !== 'ruling';
    const L = lengthOf(path);
    const reach = this.hand.reach;
    if (!liftable || L <= reach * 1.15) {
      const m = this.strokeOne(path, o);
      return m ? [m] : [];
    }
    const rng = this.rng.fork(`lift:${o.id ?? this.marks.length}`);
    const pts = resample(path, 0.2);
    const lens = cumulative(pts);
    const total = lens[lens.length - 1] as number;
    const pieces = Math.max(2, Math.round(total / (reach * rng.range(0.8, 1.1))));
    const cuts: number[] = [0];
    for (let c = 1; c < pieces; c++) cuts.push((total * c) / pieces + rng.normal() * reach * 0.08);
    cuts.push(total);
    const marks: Mark[] = [];
    const baseId = o.id ?? this.nextId(o.role);
    for (let k = 0; k < pieces; k++) {
      const ov = k === 0 ? 0 : rng.chance(0.7) ? rng.range(0.1, 1.1) : -rng.range(0.05, 0.3);
      const s0 = Math.max(0, (cuts[k] as number) - ov);
      const s1 = cuts[k + 1] as number;
      const piece = pts.filter(
        (_, i) => (lens[i] as number) >= s0 - 1e-6 && (lens[i] as number) <= s1 + 1e-6,
      );
      if (piece.length < 2) continue;
      const m = this.strokeOne(piece, {
        ...o,
        id: `${baseId}.${k + 1}`,
        start: k === 0 ? o.start : 'touch',
        end: k === pieces - 1 ? o.end : 'lift',
        anchored: k === 0 || k === pieces - 1 ? o.anchored : false,
        group: o.group ?? baseId,
      });
      if (m) marks.push(m);
    }
    return marks;
  }

  private strokeOne(path: Path, o: StrokeOptions): Mark | null {
    if (path.length < 2) return null;
    const k = this.kit(o.role);
    const instrumentId = o.instrument ?? k.instrument;
    const inkId = o.ink ?? k.ink;
    const layer = o.layer ?? k.layer;
    const id = o.id ?? this.nextId(o.role);
    const rng = this.rng.fork(`mark:${id}`);
    const perf = perform(
      {
        path,
        role: o.role,
        pressure: o.pressure,
        pace: o.pace,
        precision: o.precision,
        start: o.start,
        end: o.end,
        guide: o.guide,
        bow: o.bow,
        overshoot: o.overshoot,
        anchored: o.anchored,
        weight: o.weight,
        next: o.next,
      },
      this.hand,
      rng,
    );
    const inked = inkStroke(
      perf,
      INSTRUMENTS[instrumentId],
      INKS[inkId],
      this.paper,
      this.stateFor(layer, instrumentId, inkId),
      rng,
      {
        time: this.spec.time ?? 0,
        layerDensity: o.density ?? k.density,
        light: light2d(this.light),
      },
    );
    const mark: Mark = {
      id,
      layer,
      role: o.role,
      ink: inkId,
      instrument: instrumentId,
      guide: perf.guide,
      parts: inked.parts,
      stats: inked.stats,
      spine: inked.spine,
      widths: inked.widths,
      intended: perf.intended,
      group: o.group,
      form: o.form,
      tone: o.tone,
      slope: o.slope,
      order: this.marks.length,
    };
    this.marks.push(mark);
    return mark;
  }

  /** Record a fact the plate draws, with its source. Nothing on a plate is invented. */
  fact(key: string, value: number | string, source: string, unit?: string) {
    this.truth[key] = { value, unit, source };
    return value;
  }

  addForm(f: FormRecord) {
    this.forms.push(f);
    return f;
  }

  addConstruction(c: ConstructionRecord) {
    this.constructions.push(c);
    return c;
  }

  /** Mark that a construction generated something (a mark id or a record id). */
  generated(constructionId: string, ...ids: string[]) {
    const c = this.constructions.find((x) => x.id === constructionId);
    if (c) c.generates.push(...ids);
  }

  addText(t: TextItem) {
    this.texts.push(t);
    return t;
  }

  /** A mark made of exact shapes (an arrowhead, a prick, a filled scale segment). */
  addShape(o: {
    role: Role;
    layer?: LayerId;
    ink?: InkId;
    parts: MarkPart[];
    spine?: MVec[];
    group?: string;
    id?: string;
  }): Mark {
    const k = this.kit(o.role);
    const spine = o.spine ?? [];
    const mark: Mark = {
      id: o.id ?? this.nextId(`${o.role}-shape`),
      layer: o.layer ?? k.layer,
      role: o.role,
      ink: o.ink ?? k.ink,
      instrument: k.instrument,
      guide: 'exact',
      parts: o.parts,
      stats: {
        length: 0,
        duration: 0,
        wMin: 0,
        wMax: 0,
        wMean: 0,
        wCv: 0,
        endIn: 1,
        endOut: 1,
        load: 1,
        starved: 0,
        railed: 0,
        pools: 0,
        catches: 0,
        spatter: 0,
        feathers: 0,
        featherLen: 0,
        spread: 0,
        halo: 0,
        density: o.parts[0]?.density ?? 1,
        dip: false,
        tremorRms: 0,
        deviationRms: 0,
        startMiss: 0,
        endMiss: 0,
      },
      spine,
      widths: spine.map(() => 0),
      intended: spine,
      group: o.group,
      order: this.marks.length,
    };
    this.marks.push(mark);
    return mark;
  }

  /** The drawing scale (value per sheet mm). */
  get scale() {
    return this.spec.scale ?? { unit: 'mm', perMm: 1, digits: 1 };
  }

  /** Ink colour for a mark part. */
  colorOf(inkId: InkId, part: MarkPart): RGB {
    if (part.color) return part.color;
    const spec: InkSpec = INKS[inkId];
    const time = this.spec.time ?? 0;
    if (time > 0 && inkId === 'iron-gall') {
      // iron-gall browns with time (research 01 §1: black → warm chestnut)
      const brown: RGB = [0.36, 0.24, 0.15];
      const t = Math.min(1, time);
      return [
        spec.color[0] + (brown[0] - spec.color[0]) * t,
        spec.color[1] + (brown[1] - spec.color[1]) * t,
        spec.color[2] + (brown[2] - spec.color[2]) * t,
      ];
    }
    return spec.color;
  }

  /**
   * The sheet as SVG (mm user units). `paperHref` places a baked paper raster under the ink;
   * without it the sheet is a flat tone.
   */
  toSVG(
    o: { paperHref?: string; pxPerMm?: number; inkOnly?: boolean; hide?: LayerId[] } = {},
  ): string {
    const [W, H] = this.spec.size;
    const px = o.pxPerMm ?? 4;
    const out: string[] = [];
    const eye = this.spec.eye;
    out.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f2(W)} ${f2(H)}" width="${Math.round(W * px)}" height="${Math.round(H * px)}" data-mai-plate="${esc(this.spec.id)}" data-style="${this.style.id}" data-eye-motif="${eye.motif === 'drawn' ? `drawn — ${esc(eye.ref)}` : `none — justified: ${esc(eye.justification)}`}">`,
    );
    out.push(`<title>${esc(this.spec.title)}</title><desc>${esc(this.spec.claim)}</desc>`);
    // The sheet's tooth, once per document: dry media and a draining pen show through it.
    // Fractal noise at ≈ 0.15 mm, thresholded into peaks (light) or most of the tooth (heavy).
    const seedT = (this.rng.seed % 997) + 1;
    const grainFilter = (id: string, k: number, c: number) =>
      `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${f2(W)}" height="${f2(H)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${f2(6.2 / (0.75 + 0.5 * this.paper.spec.tooth))}" numOctaves="2" seed="${seedT}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${f2(k)} 0 0 0 ${f2(c)}" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`;
    out.push(
      `<defs>${grainFilter('mai-grain-light', 7, -3.25)}${grainFilter('mai-grain-heavy', 6, -2.3)}</defs>`,
    );
    if (!o.inkOnly) {
      if (o.paperHref)
        out.push(
          `<image href="${esc(o.paperHref)}" x="0" y="0" width="${f2(W)}" height="${f2(H)}" preserveAspectRatio="none"/>`,
        );
      else
        out.push(`<rect width="${f2(W)}" height="${f2(H)}" fill="${hex(this.paper.spec.tone)}"/>`);
    } else out.push(`<rect width="${f2(W)}" height="${f2(H)}" fill="#ffffff"/>`);

    for (const layer of LAYER_ORDER) {
      if (o.hide?.includes(layer)) continue;
      const marks = this.marks.filter((m) => m.layer === layer);
      if (!marks.length) continue;
      const multiply: string[] = [];
      const normal: string[] = [];
      // halos first, merged per ink: a stain does not compound with itself
      const halos = new Map<InkId, string[]>();
      for (const m of marks)
        for (const p of m.parts)
          if (p.kind === 'halo') {
            const list = halos.get(m.ink) ?? [];
            list.push(p.d);
            halos.set(m.ink, list);
          }
      for (const [inkId, ds] of halos) {
        const part = marks.find((m) => m.ink === inkId)?.parts.find((p) => p.kind === 'halo');
        if (!part) continue;
        multiply.push(
          `<path d="${ds.join('')}" fill="${hex(part.color ?? INKS[inkId].halo)}" fill-opacity="${f2(part.density)}"/>`,
        );
      }
      const grainL: string[] = [];
      const grainH: string[] = [];
      for (const m of marks) {
        const inkSpec = INKS[m.ink];
        for (const p of m.parts) {
          if (p.kind === 'halo' || !p.d) continue;
          const col = hex(this.colorOf(m.ink, p));
          const attrs = p.stroke
            ? `fill="none" stroke="${col}" stroke-width="${f2(Math.max(0.01, p.stroke))}" stroke-opacity="${f2(p.density)}" stroke-linecap="round" stroke-linejoin="round"`
            : `fill="${col}" fill-opacity="${f2(p.density)}"${p.evenodd ? ' fill-rule="evenodd"' : ''}`;
          const tag =
            p.kind === 'body' || (p.kind === 'faint' && !m.parts.some((q) => q.kind === 'body'))
              ? ` data-mark="${m.id}" data-role="${m.role}"`
              : '';
          const el = `<path${tag} d="${p.d}" ${attrs}/>`;
          if (p.grain === 'light') grainL.push(el);
          else if (p.grain === 'heavy') grainH.push(el);
          else if (p.normal || inkSpec.blend === 'normal') normal.push(el);
          else multiply.push(el);
        }
      }
      if (grainL.length) multiply.push(`<g filter="url(#mai-grain-light)">${grainL.join('')}</g>`);
      if (grainH.length) multiply.push(`<g filter="url(#mai-grain-heavy)">${grainH.join('')}</g>`);
      out.push(`<g id="layer-${layer}" style="mix-blend-mode:multiply">${multiply.join('')}</g>`);
      if (normal.length) out.push(`<g id="layer-${layer}-light">${normal.join('')}</g>`);
    }

    // typeset text (drawn lettering is already in the marks)
    const typeset = this.texts.filter((t) => !t.drawn);
    if (typeset.length) {
      const face = this.spec.typeface ?? "'IM Fell English', 'EB Garamond', Georgia, serif";
      out.push(`<g id="layer-type" style="mix-blend-mode:multiply" font-family="${esc(face)}">`);
      for (const t of typeset) {
        const size = t.cap / 0.66;
        const tr = t.mirror
          ? ` transform="translate(${f2(2 * t.x)} 0) scale(-1 1)"`
          : t.rotate
            ? ` transform="rotate(${f2(t.rotate)} ${f2(t.x)} ${f2(t.y)})"`
            : '';
        out.push(
          `<text data-text="${t.id}" data-kind="${t.kind}" x="${f2(t.x)}" y="${f2(t.y)}" font-size="${f2(size)}" text-anchor="${t.anchor}" fill="${hex(t.color)}"${t.italic ? ' font-style="italic"' : ''}${tr}>${esc(t.text)}</text>`,
        );
      }
      out.push('</g>');
    }
    // drawn lettering stays readable and selectable: an invisible twin of every drawn text
    const drawn = this.texts.filter((t) => t.drawn && !t.mirror);
    if (drawn.length) {
      out.push('<g id="layer-text-twins" fill="transparent" font-family="sans-serif">');
      for (const t of drawn) {
        const size = t.cap / 0.7;
        out.push(
          `<text x="${f2(t.box[0])}" y="${f2(t.box[3])}" font-size="${f2(size)}" textLength="${f2(Math.max(0.5, t.box[2] - t.box[0]))}" lengthAdjust="spacingAndGlyphs">${esc(t.text)}</text>`,
        );
      }
      out.push('</g>');
    }
    out.push('</svg>');
    return out.join('');
  }
}

export const createPlate = (spec: PlateSpec) => new Plate(spec);
