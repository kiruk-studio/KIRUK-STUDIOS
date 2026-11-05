/**
 * The calculus page — mai's own numbers, charted while the engine draws.
 *
 * Every specimen here is drawn by the engine in the browser (the same code and seeds as the
 * plates), with `trace: true`, so the charts plot the engine's per-sample numbers: speed,
 * curvature, pressure, width and ink load. Nothing on a chart is re-derived for show.
 *
 * Built by `node packages/mai/scripts/calculus.ts` into one self-contained page.
 * spec-link: packages/mai/README.md (the calculus); founder's reference:
 * https://calculus-of-interfaces.vercel.app/ (not yet read: the session's network denies it)
 */
import { circle, type Path } from '../src/core/path.ts';
import type { MVec, Vec } from '../src/core/vec.ts';
import { critique } from '../src/critic/critic.ts';
import { letter } from '../src/letter/letter.ts';
import { sphere } from '../src/light/forms.ts';
import { contour, hatch } from '../src/light/hatch.ts';
import { light2d, lightFrom } from '../src/light/light.ts';
import { centreLines, chainDims, extents, neatline } from '../src/measure/outer.ts';
import { INSTRUMENTS, type InstrumentId } from '../src/nib/instruments.ts';
import type { LineType } from '../src/plate/linetype.ts';
import { createPlate, type Mark, type Plate } from '../src/plate/plate.ts';
import { STYLES, type StyleSpec } from '../src/styles/styles.ts';

// ───────────────────────── data from the build ─────────────────────────
interface PlateData {
  id: string;
  name: string;
  svg: string;
  counts: Record<string, number>;
  dip: { x: number[]; load: number[]; dips: number[] };
  law: {
    x: number[];
    y: number[];
    bound: number[];
    roles: Record<string, [number, number]>;
    share: number;
  };
  checks: { id: string; dimension: string; status: string; title: string; value: string }[];
  verdict: string;
  source: string;
}
declare global {
  interface Window {
    MAI_DATA: { plates: PlateData[] } | null;
  }
}

// ───────────────────────── small helpers ─────────────────────────
const NS = 'http://www.w3.org/2000/svg';
const $ = <T extends Element = HTMLElement>(id: string) =>
  document.getElementById(id) as unknown as T;
const f0 = (v: number) => Math.round(v).toLocaleString('en-GB');
const fx = (v: number, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '–');
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  text?: string,
) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return matchMedia('(prefers-color-scheme: dark)').matches;
}
/** By day the new sheet (Dawn Departs, navy, the rubric line); by night the night sheet. */
const baseStyle = (): StyleSpec => STYLES[isDark() ? 'night' : 'dawn-new'];

function sheet(
  id: string,
  size: [number, number],
  o: { style?: StyleSpec; seed?: number; az?: number; el?: number } = {},
): Plate {
  return createPlate({
    id: `calculus-${id}`,
    title: `Calculus of mai — ${id}`,
    claim: 'A specimen on the calculus page, drawn and measured by mai in the browser.',
    size,
    margins: [3, 3, 3, 3],
    style: o.style ?? baseStyle(),
    seed: o.seed ?? 11,
    light: o.az !== undefined ? lightFrom(o.az, o.el ?? 45) : undefined,
    eye: {
      motif: 'none',
      justification:
        'a one-part specimen on the calculus page; the eye is drawn on the plates it explains',
    },
    device: 'a specimen and its numbers',
    views: 1,
    trace: true,
  });
}

let uid = 0;
/** Put a plate's SVG in a host, with its ids scoped so several sheets share one page. */
function mount(host: Element, svg: string): SVGSVGElement {
  const pre = `s${++uid}-`;
  const scoped = svg
    .replace(/\bid="([^"]+)"/g, (_, a: string) => `id="${pre}${a}"`)
    .replace(/url\(#([^)]+)\)/g, (_, a: string) => `url(#${pre}${a})`)
    .replace(/href="#([^"]+)"/g, (_, a: string) => `href="#${pre}${a}"`);
  const keep = Array.from(host.querySelectorAll('.sr'));
  host.innerHTML = scoped;
  for (const k of keep) host.prepend(k);
  const el = host.querySelector('svg') as SVGSVGElement;
  el.removeAttribute('width');
  el.removeAttribute('height');
  el.setAttribute('role', 'img');
  el.dataset.pre = pre;
  return el;
}

/** Reveal the ink layers along each mark's traced path up to time `t` (s): the pen drawing. */
class Reveal {
  private svg: SVGSVGElement;
  private mask: SVGMaskElement;
  private path: SVGPathElement;
  private timeline: { m: Mark; t0: number; t1: number }[] = [];
  readonly total: number;
  constructor(
    svg: SVGSVGElement,
    marks: Mark[],
    o: { width?: number; gap?: number; layers?: string[] } = {},
  ) {
    this.svg = svg;
    const [, , W, H] = (svg.getAttribute('viewBox') ?? '0 0 100 100').split(/\s+/).map(Number);
    const pre = svg.dataset.pre ?? '';
    this.mask = svgEl('mask', {
      id: `${pre}reveal`,
      maskUnits: 'userSpaceOnUse',
      x: 0,
      y: 0,
      width: W ?? 100,
      height: H ?? 100,
    });
    this.mask.append(
      svgEl('rect', { x: 0, y: 0, width: W ?? 100, height: H ?? 100, fill: 'black' }),
    );
    this.path = svgEl('path', {
      fill: 'none',
      stroke: 'white',
      'stroke-width': o.width ?? 3.2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    this.mask.append(this.path);
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = svgEl('defs');
      svg.prepend(defs);
    }
    defs.append(this.mask);
    let t = 0;
    for (const m of marks) {
      const d = Math.max(0.02, m.trace ? (m.trace.t[m.trace.t.length - 1] ?? 0) : m.stats.duration);
      this.timeline.push({ m, t0: t, t1: t + d });
      t += d + (o.gap ?? 0.08);
    }
    this.total = t;
    for (const id of o.layers ?? [
      'layer-ink',
      'layer-ink-light',
      'layer-ink-screen',
      'layer-letter',
      'layer-letter-screen',
    ])
      svg.querySelector(`#${CSS.escape(pre + id)}`)?.setAttribute('data-reveal', '1');
  }
  /** t ≥ total (or null) shows everything and drops the mask. */
  at(t: number | null) {
    const groups = this.svg.querySelectorAll('[data-reveal]');
    if (t === null || t >= this.total) {
      for (const g of groups) g.removeAttribute('mask');
      return;
    }
    const pre = this.svg.dataset.pre ?? '';
    for (const g of groups) g.setAttribute('mask', `url(#${pre}reveal)`);
    const d: string[] = [];
    for (const { m, t0, t1 } of this.timeline) {
      if (t < t0) break;
      const tr = m.trace;
      const pts: number[][] = [];
      if (tr) {
        const local = t - t0;
        for (let i = 0; i < tr.t.length; i++) {
          if (t < t1 && (tr.t[i] as number) > local) break;
          pts.push([tr.x[i] as number, tr.y[i] as number]);
        }
      } else if (t >= t1) for (const q of m.spine) pts.push(q as unknown as number[]);
      if (pts.length)
        d.push(
          `M${pts.map((q) => `${(q[0] as number).toFixed(2)} ${(q[1] as number).toFixed(2)}`).join('L')}`,
        );
    }
    this.path.setAttribute('d', d.join('') || 'M0 0');
  }
}

/** The pen's position: a ring and a dot on the sheet (mm). */
function penMarker(svg: SVGSVGElement) {
  const g = svgEl('g', { 'aria-hidden': 'true' });
  const ring = svgEl('circle', { class: 'pen', r: 2.2, cx: -10, cy: -10 });
  const dot = svgEl('circle', { class: 'pen-dot', r: 0.55, cx: -10, cy: -10 });
  g.append(ring, dot);
  svg.append(g);
  return (q: Vec | null) => {
    const [x, y] = q ?? [-10, -10];
    for (const c of [ring, dot]) {
      c.setAttribute('cx', x.toFixed(2));
      c.setAttribute('cy', y.toFixed(2));
    }
  };
}

// ───────────────────────── a chart, drawn exact on the sheet ─────────────────────────
interface Axis {
  min: number;
  max: number;
  label: string;
  fmt?: (v: number) => string;
}
type Layer =
  | { kind: 'line'; xs: number[]; ys: number[]; cls: string; y2?: boolean }
  | { kind: 'dots'; xs: number[]; ys: number[]; cls: string; r?: number }
  | { kind: 'rects'; rects: [number, number, number, number][]; cls: string };
interface Ref {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  label?: string;
  y2?: boolean;
}
interface ChartSpec {
  x: Axis;
  y: Axis;
  y2?: Axis;
  layers: Layer[];
  refs?: Ref[];
  vmarks?: { x: number; label?: string }[];
  note?: string;
  yTicks?: number[];
  hideYTicks?: boolean;
}

function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-6; v += step)
    out.push(Number(v.toFixed(10)));
  return out;
}
const tickFmt = (v: number) =>
  Math.abs(v) >= 100 || Number.isInteger(v)
    ? String(Math.round(v))
    : Math.abs(v) >= 10
      ? v.toFixed(0)
      : v.toFixed(Math.abs(v) < 0.1 && v !== 0 ? 2 : 1);

class Chart {
  private svg: SVGSVGElement;
  private cap: HTMLElement;
  private note: HTMLElement;
  private spec: ChartSpec | null = null;
  private mk: { x: number | null; y?: number | null; y2?: number | null } = { x: null };
  private g: { line: SVGLineElement; dot: SVGCircleElement; dot2: SVGCircleElement } | null = null;
  private sx = (v: number) => v;
  private sy = (v: number) => v;
  private sy2 = (v: number) => v;
  private host: HTMLElement;
  private height: number;
  constructor(host: HTMLElement, title: string, height = 200) {
    this.host = host;
    this.height = height;
    this.cap = document.createElement('figcaption');
    const t = document.createElement('span');
    t.textContent = title;
    this.note = document.createElement('span');
    this.note.className = 'num';
    this.cap.append(t, this.note);
    this.svg = svgEl('svg', { role: 'img', 'aria-label': title });
    host.append(this.cap, this.svg);
    new ResizeObserver(() => this.render()).observe(host);
  }
  set(spec: ChartSpec) {
    this.spec = spec;
    this.note.textContent = spec.note ?? '';
    this.render();
  }
  render() {
    const s = this.spec;
    if (!s) return;
    const W = Math.max(260, Math.round(this.host.clientWidth - 16));
    const H = this.height;
    const L = 46;
    const R = s.y2 ? 46 : 14;
    const T = 10;
    const B = 34;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.replaceChildren();
    const sx = (v: number) => L + ((v - s.x.min) / (s.x.max - s.x.min || 1)) * (W - L - R);
    const sy = (v: number) => H - B - ((v - s.y.min) / (s.y.max - s.y.min || 1)) * (H - T - B);
    const y2 = s.y2;
    const sy2 = y2
      ? (v: number) => H - B - ((v - y2.min) / (y2.max - y2.min || 1)) * (H - T - B)
      : sy;
    this.sx = sx;
    this.sy = sy;
    this.sy2 = sy2;
    const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`;
    const defs = svgEl('defs');
    const cp = svgEl('clipPath', { id: clipId });
    cp.append(svgEl('rect', { x: L, y: T - 2, width: W - L - R, height: H - T - B + 4 }));
    defs.append(cp);
    this.svg.append(defs);
    // grid and ticks
    const xt = niceTicks(s.x.min, s.x.max, Math.max(3, Math.floor((W - L - R) / 80)));
    const yt = s.yTicks ?? niceTicks(s.y.min, s.y.max, 4);
    for (const v of yt) {
      const y = sy(v);
      this.svg.append(svgEl('line', { class: 'grid-l', x1: L, x2: W - R, y1: y, y2: y }));
      if (!s.hideYTicks)
        this.svg.append(
          svgEl(
            'text',
            { class: 'tick', x: L - 6, y: y + 3.5, 'text-anchor': 'end' },
            (s.y.fmt ?? tickFmt)(v),
          ),
        );
    }
    for (const v of xt) {
      const x = sx(v);
      this.svg.append(svgEl('line', { class: 'grid-l', x1: x, x2: x, y1: T, y2: H - B }));
      this.svg.append(
        svgEl(
          'text',
          { class: 'tick', x, y: H - B + 14, 'text-anchor': 'middle' },
          (s.x.fmt ?? tickFmt)(v),
        ),
      );
    }
    if (y2)
      for (const v of niceTicks(y2.min, y2.max, 4))
        this.svg.append(
          svgEl(
            'text',
            { class: 'tick', x: W - R + 6, y: sy2(v) + 3.5, 'text-anchor': 'start' },
            (y2.fmt ?? tickFmt)(v),
          ),
        );
    this.svg.append(svgEl('line', { class: 'ax', x1: L, x2: W - R, y1: H - B, y2: H - B }));
    this.svg.append(svgEl('line', { class: 'ax', x1: L, x2: L, y1: T, y2: H - B }));
    this.svg.append(
      svgEl(
        'text',
        { class: 'axl', x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' },
        s.x.label,
      ),
    );
    this.svg.append(
      svgEl(
        'text',
        {
          class: 'axl',
          x: 12,
          y: (T + H - B) / 2,
          'text-anchor': 'middle',
          transform: `rotate(-90 12 ${(T + H - B) / 2})`,
        },
        s.y.label,
      ),
    );
    if (y2)
      this.svg.append(
        svgEl(
          'text',
          {
            class: 'axl',
            x: W - 10,
            y: (T + H - B) / 2,
            'text-anchor': 'middle',
            transform: `rotate(90 ${W - 10} ${(T + H - B) / 2})`,
          },
          y2.label,
        ),
      );
    const plot = svgEl('g', { 'clip-path': `url(#${clipId})` });
    this.svg.append(plot);
    for (const r of s.refs ?? []) {
      const yy = r.y2 ? sy2 : sy;
      plot.append(
        svgEl('line', { class: 'ref', x1: sx(r.x0), y1: yy(r.y0), x2: sx(r.x1), y2: yy(r.y1) }),
      );
      if (r.label)
        this.svg.append(
          svgEl(
            'text',
            {
              class: 'ref-l',
              x: Math.min(sx(r.x1), W - R) - 4,
              y: yy(r.y1) - 5,
              'text-anchor': 'end',
            },
            r.label,
          ),
        );
    }
    for (const v of s.vmarks ?? []) {
      const x = sx(v.x);
      plot.append(svgEl('line', { class: 'vm', x1: x, x2: x, y1: T, y2: H - B }));
      if (v.label) this.svg.append(svgEl('text', { class: 'vm-l', x: x + 3, y: T + 9 }, v.label));
    }
    for (const ly of s.layers) {
      if (ly.kind === 'line') {
        const yy = ly.y2 ? sy2 : sy;
        let d = '';
        let pen = false;
        for (let i = 0; i < ly.xs.length; i++) {
          const xv = ly.xs[i] as number;
          const yv = ly.ys[i] as number;
          if (!Number.isFinite(xv) || !Number.isFinite(yv)) {
            pen = false;
            continue;
          }
          d += `${pen ? 'L' : 'M'}${sx(xv).toFixed(1)} ${yy(yv).toFixed(1)}`;
          pen = true;
        }
        plot.append(svgEl('path', { class: ly.cls, d }));
      } else if (ly.kind === 'dots') {
        let d = '';
        const r = ly.r ?? 1.6;
        for (let i = 0; i < ly.xs.length; i++) {
          const x = sx(ly.xs[i] as number);
          const y = sy(ly.ys[i] as number);
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
        }
        plot.append(svgEl('path', { class: ly.cls, d }));
      } else {
        let d = '';
        for (const [x0, y0, x1, y1] of ly.rects) {
          const a = sx(x0);
          const b = sx(x1);
          const c = sy(y1);
          const e = sy(y0);
          d += `M${a.toFixed(1)} ${c.toFixed(1)}H${Math.max(a + 0.8, b).toFixed(1)}V${e.toFixed(1)}H${a.toFixed(1)}Z`;
        }
        plot.append(svgEl('path', { class: ly.cls, d }));
      }
    }
    const line = svgEl('line', { class: 'mk', x1: -9, x2: -9, y1: T, y2: H - B });
    const dot = svgEl('circle', { class: 'mk-dot', r: 3.6, cx: -9, cy: -9 });
    const dot2 = svgEl('circle', { class: 'mk-dot', r: 3.2, cx: -9, cy: -9 });
    this.svg.append(line, dot, dot2);
    this.g = { line, dot, dot2 };
    this.mark(this.mk.x, this.mk.y, this.mk.y2);
  }
  mark(x: number | null, y?: number | null, y2?: number | null) {
    this.mk = { x, y, y2 };
    const g = this.g;
    if (!g) return;
    const hide = (e: SVGElement) => e.setAttribute('transform', 'translate(-999 -999)');
    const show = (e: SVGElement) => e.removeAttribute('transform');
    if (x === null || !Number.isFinite(x)) {
      for (const e of [g.line, g.dot, g.dot2]) hide(e);
      return;
    }
    const px = this.sx(x);
    g.line.setAttribute('x1', px.toFixed(1));
    g.line.setAttribute('x2', px.toFixed(1));
    show(g.line);
    if (y !== undefined && y !== null && Number.isFinite(y)) {
      g.dot.setAttribute('cx', px.toFixed(1));
      g.dot.setAttribute('cy', this.sy(y).toFixed(1));
      show(g.dot);
    } else hide(g.dot);
    if (y2 !== undefined && y2 !== null && Number.isFinite(y2)) {
      g.dot2.setAttribute('cx', px.toFixed(1));
      g.dot2.setAttribute('cy', this.sy2(y2).toFixed(1));
      show(g.dot2);
    } else hide(g.dot2);
  }
}

/** A scrubber and a play button over a timeline (seconds). */
function scrubber(
  ids: { play: string; range: string; out: string },
  onAt: (t: number | null) => void,
  fmt: (t: number) => string,
) {
  const btn = $<HTMLButtonElement>(ids.play);
  const range = $<HTMLInputElement>(ids.range);
  const out = $(ids.out);
  let total = 1;
  let raf = 0;
  const show = (u: number) => {
    const t = u * total;
    out.textContent = fmt(t);
    onAt(u >= 1 ? null : t);
  };
  range.addEventListener('input', () => {
    cancelAnimationFrame(raf);
    btn.textContent = 'Draw it';
    show(Number(range.value) / 1000);
  });
  btn.addEventListener('click', () => {
    cancelAnimationFrame(raf);
    const start = performance.now();
    btn.textContent = 'Drawing…';
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const u = clamp(t / total, 0, 1);
      range.value = String(Math.round(u * 1000));
      show(u);
      if (u < 1) raf = requestAnimationFrame(tick);
      else btn.textContent = 'Draw it again';
    };
    raf = requestAnimationFrame(tick);
  });
  return {
    reset(newTotal: number) {
      cancelAnimationFrame(raf);
      total = Math.max(0.05, newTotal);
      btn.textContent = 'Draw it';
      range.value = '1000';
      show(1);
    },
  };
}

function bind(id: string, fmt: (v: number) => string, onChange: () => void) {
  const el = $<HTMLInputElement>(id);
  const out = $(`${id}-o`);
  const read = () => {
    out.textContent = fmt(Number(el.value));
  };
  read();
  let raf = 0;
  el.addEventListener('input', () => {
    read();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(onChange);
  });
  return () => Number(el.value);
}

function segmented(ids: string[], onChange: (id: string) => void) {
  const btns = ids.map((id) => $<HTMLButtonElement>(id));
  for (const b of btns)
    b.addEventListener('click', () => {
      for (const o of btns) o.setAttribute('aria-pressed', String(o === b));
      onChange(b.id);
    });
  return () => (btns.find((b) => b.getAttribute('aria-pressed') === 'true') ?? btns[0])?.id ?? '';
}

function readout(id: string, rows: [string, string][]) {
  const dl = $(id);
  dl.replaceChildren();
  for (const [k, v] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    dl.append(dt, dd);
  }
}

/** Distance from q to a polyline. */
function distTo(q: Vec, path: readonly Vec[]) {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Vec;
    const b = path[i] as Vec;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy || 1e-12;
    const u = clamp(((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2, 0, 1);
    best = Math.min(best, Math.hypot(q[0] - a[0] - u * dx, q[1] - a[1] - u * dy));
  }
  return best;
}

/** Concatenate the traces of a stroke's pieces into one timeline. */
function joined(marks: Mark[], gap = 0.08) {
  const S: number[] = [];
  const T: number[] = [];
  const X: number[] = [];
  const Y: number[] = [];
  const V: number[] = [];
  const Kc: number[] = [];
  const Wd: number[] = [];
  const Ld: number[] = [];
  const gain: number[] = [];
  const lifts: number[] = [];
  const dips: number[] = [];
  let s0 = 0;
  let t0 = 0;
  for (const m of marks) {
    const tr = m.trace;
    if (!tr) continue;
    if (S.length) {
      lifts.push(s0);
      // a gap in the lines between pieces
      S.push(Number.NaN);
      T.push(Number.NaN);
      X.push(Number.NaN);
      Y.push(Number.NaN);
      V.push(Number.NaN);
      Kc.push(Number.NaN);
      Wd.push(Number.NaN);
      Ld.push(Number.NaN);
      gain.push(Number.NaN);
    }
    if (m.stats.dip) dips.push(s0);
    for (let i = 0; i < tr.s.length; i++) {
      S.push(s0 + (tr.s[i] as number));
      T.push(t0 + (tr.t[i] as number));
      X.push(tr.x[i] as number);
      Y.push(tr.y[i] as number);
      V.push(tr.v[i] as number);
      Kc.push(tr.k[i] as number);
      Wd.push(tr.w[i] as number);
      Ld.push(tr.load[i] as number);
      gain.push(tr.K);
    }
    s0 += tr.s[tr.s.length - 1] ?? 0;
    t0 += (tr.t[tr.t.length - 1] ?? 0) + gap;
  }
  return { S, T, X, Y, V, K: Kc, W: Wd, Ld, gain, lifts, dips, length: s0, duration: t0 - gap };
}
type Joined = ReturnType<typeof joined>;
const indexAtTime = (j: Joined, t: number) => {
  let best = -1;
  for (let i = 0; i < j.T.length; i++)
    if (Number.isFinite(j.T[i] as number) && (j.T[i] as number) <= t) best = i;
  return best;
};
const indexAtS = (j: Joined, s: number) => {
  let best = -1;
  for (let i = 0; i < j.S.length; i++)
    if (Number.isFinite(j.S[i] as number) && (j.S[i] as number) <= s) best = i;
  return best;
};

// ───────────────────────── the title, lettered by mai ─────────────────────────
function benchTitle() {
  const host = $('title');
  let reveal: Reveal | null = null;
  let raf = 0;
  const draw = () => {
    const p = sheet('title', [188, 22], { seed: 2 });
    const t = letter(p, 'Calculus of mai', [5, 17.5], {
      cap: 12,
      kind: 'title',
      id: 'title-letters',
      pressure: 0.72,
    });
    const svg = mount(host, p.toSVG({ pxPerMm: 4 }));
    svg.setAttribute('aria-hidden', 'true');
    reveal = new Reveal(svg, t.marks, {
      width: 3.4,
      gap: 0.12,
      layers: ['layer-letter', 'layer-letter-screen', 'layer-ink', 'layer-ink-screen'],
    });
  };
  const play = () => {
    cancelAnimationFrame(raf);
    if (!reveal || reduced()) return;
    const r = reveal;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      r.at(t);
      if (t < r.total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  draw();
  $('title-replay').addEventListener('click', play);
  return { draw };
}

// ───────────────────────── 1 · the hand ─────────────────────────
function benchHand() {
  const speed = new Chart(
    $('hand-speed'),
    'Speed v (mm/s) and curvature κ (1/mm) along the stroke',
  );
  const law = new Chart($('hand-law'), 'The power law, one dot per sample', 210);
  const dev = new Chart($('hand-dev'), 'Off the aim: tremor and drift (mm), in time', 170);
  let exact = false;
  let j: Joined | null = null;
  let aim: Vec[] = [];
  let reveal: Reveal | null = null;
  let pen: ((q: Vec | null) => void) | null = null;
  let D: number[] = [];
  const at = (t: number | null) => {
    if (!j) return;
    reveal?.at(t);
    if (t === null) {
      pen?.(null);
      speed.mark(null);
      law.mark(null);
      dev.mark(null);
      return;
    }
    const i = indexAtTime(j, t);
    if (i < 0) return;
    pen?.([j.X[i] as number, j.Y[i] as number]);
    speed.mark(j.S[i] as number, j.V[i] as number, j.K[i] as number);
    const k = j.K[i] as number;
    const g = j.gain[i] as number;
    if (k >= 1e-3)
      law.mark(
        Math.log10(k),
        g > 0 ? Math.log10((j.V[i] as number) / g) : Math.log10(j.V[i] as number),
      );
    else law.mark(null);
    dev.mark(j.T[i] as number, D[i] as number);
  };
  const sc = scrubber(
    { play: 'hand-play', range: 'hand-t', out: 'hand-t-o' },
    at,
    (t) => `${fx(t, 2)} s`,
  );
  const draw = () => {
    const base = baseStyle();
    const style: StyleSpec = {
      ...base,
      hand: { ...base.hand, tremor: base.hand.tremor * read.tremor() },
    };
    const p = sheet('hand', [168, 56], { style, seed: 7 });
    const A = read.bend();
    aim = [];
    for (let x = 10; x <= 158; x += 0.5)
      aim.push([x, 28 + A * Math.sin(((x - 10) / 56) * 2 * Math.PI)]);
    p.stroke(aim as Path, {
      role: 'overlay',
      guide: 'exact',
      line: 'dashed',
      pressure: 0.3,
      id: 'aim',
    });
    const marks = p.stroke(aim as Path, {
      role: 'contour',
      guide: exact ? 'exact' : 'free',
      pace: read.pace(),
      pressure: 0.62,
      start: 'dip',
      end: 'lift',
      id: 'stroke',
    });
    const svg = mount($('hand-sheet'), p.toSVG({ pxPerMm: 4 }));
    reveal = new Reveal(svg, marks);
    pen = penMarker(svg);
    j = joined(marks);
    const J = j;
    D = J.X.map((x, i) => (Number.isFinite(x) ? distTo([x, J.Y[i] as number], aim) : Number.NaN));
    const vMax = Math.max(...J.V.filter(Number.isFinite)) * 1.1;
    const kMax = Math.max(0.02, ...J.K.filter(Number.isFinite)) * 1.15;
    // the law's ceiling for this stroke: K·κ^(−1/3), where the hand's bend sets the pace
    const gain = J.gain.find((g) => Number.isFinite(g) && g > 0) ?? 0;
    const ceiling = J.K.map((k) =>
      gain > 0 && k > 0 ? Math.min(vMax * 2, gain * k ** (-1 / 3)) : Number.NaN,
    );
    let bound = 0;
    let free = 0;
    const lx: number[] = [];
    const ly: number[] = [];
    const ex: number[] = [];
    const ey: number[] = [];
    for (let i = 0; i < J.V.length; i++) {
      const k = J.K[i] as number;
      const v = J.V[i] as number;
      // a bend the eye can see: κ ≥ 0.001/mm (a radius under a metre); flatter is a straight run
      if (!(k >= 1e-3) || !Number.isFinite(v)) continue;
      free++;
      const g = J.gain[i] as number;
      const isBound =
        g > 0 && v > 2.0001 && Math.abs(v - g * k ** (-1 / 3)) / (g * k ** (-1 / 3)) < 1e-6;
      if (isBound) bound++;
      (isBound ? lx : ex).push(Math.log10(k));
      (isBound ? ly : ey).push(g > 0 ? Math.log10(v / g) : Math.log10(v));
    }
    const share = free ? bound / free : 0;
    speed.set({
      x: { min: 0, max: J.length, label: 'arc length s (mm)' },
      y: { min: 0, max: vMax, label: 'v (mm/s)' },
      y2: { min: 0, max: kMax, label: 'κ (1/mm)', fmt: (v) => v.toFixed(2) },
      layers: [
        { kind: 'line', xs: J.S, ys: ceiling, cls: 's-soft' },
        { kind: 'line', xs: J.S, ys: J.K, cls: 's-measure', y2: true },
        { kind: 'line', xs: J.S, ys: J.V, cls: 's-ink' },
      ],
      vmarks: J.lifts.map((x) => ({ x, label: 'lift' })),
      note: exact ? 'exact: no law, no tremor' : `dashed: the law’s ceiling K·κ^−1/3`,
    });
    const allX = [...lx, ...ex];
    const allY = [...ly, ...ey];
    const xMin = Math.min(-2.5, ...allX);
    const xMax = Math.max(-0.5, ...allX) + 0.05;
    const yMin = Math.min(...allY) - 0.1;
    const yMax = Math.max(...allY) + 0.1;
    law.set({
      x: { min: xMin, max: xMax, label: 'log₁₀ κ', fmt: (v) => v.toFixed(1) },
      y: {
        min: yMin,
        max: yMax,
        label: gain > 0 ? 'log₁₀ (v / K)' : 'log₁₀ v',
        fmt: (v) => v.toFixed(1),
      },
      layers: [
        { kind: 'dots', xs: ex, ys: ey, cls: 'd-soft', r: 1.3 },
        { kind: 'dots', xs: lx, ys: ly, cls: 'd-ink', r: 1.5 },
      ],
      refs:
        gain > 0 ? [{ x0: xMin, y0: -xMin / 3, x1: xMax, y1: -xMax / 3, label: 'slope −1/3' }] : [],
      note:
        gain > 0
          ? `the bend sets the speed in ${Math.round(share * 100)}% of samples`
          : 'an exact line ignores the bend',
    });
    const dMax = Math.max(0.05, ...D.filter(Number.isFinite)) * 1.15;
    dev.set({
      x: { min: 0, max: J.duration, label: 'time t (s)', fmt: (v) => v.toFixed(2) },
      y: { min: 0, max: dMax, label: 'mm off', fmt: (v) => v.toFixed(2) },
      layers: [{ kind: 'line', xs: J.T, ys: D, cls: 's-ink' }],
      note: `rms ${fx(Math.sqrt(D.filter(Number.isFinite).reduce((a, b) => a + b * b, 0) / Math.max(1, D.filter(Number.isFinite).length)), 3)} mm`,
    });
    const vs = J.V.filter(Number.isFinite);
    // the slowest point in a bend (not the landing or the lift, where every stroke is slow)
    let iMin = -1;
    for (let i = 0; i < J.V.length; i++) {
      const k = J.K[i] as number;
      if (
        k >= 0.01 &&
        Number.isFinite(J.V[i] as number) &&
        (iMin < 0 || (J.V[i] as number) < (J.V[iMin] as number))
      )
        iMin = i;
    }
    readout('hand-readout', [
      ['Pieces (lifts at the reach)', `${marks.length}`],
      ['Length', `${fx(J.length, 1)} mm`],
      ['Time', `${fx(J.duration, 2)} s`],
      ['Mean speed', `${fx(vs.reduce((a, b) => a + b, 0) / vs.length, 0)} mm/s`],
      [
        'Slowest in a bend',
        iMin >= 0
          ? `${fx(J.V[iMin] as number, 0)} mm/s at κ ${fx(J.K[iMin] as number, 3)}/mm`
          : 'no bend',
      ],
      ['Law’s gain K', gain > 0 ? `${fx(gain, 1)}` : 'off'],
      ['Bend sets the speed', gain > 0 ? `${Math.round(share * 100)}% of samples` : '0%'],
      [
        'Tremor left (rms)',
        `${fx(marks.reduce((a, m) => a + m.stats.tremorRms, 0) / Math.max(1, marks.length), 3)} mm`,
      ],
      ['Samples computed', `${f0(J.S.filter(Number.isFinite).length)} × 9 numbers`],
    ]);
    sc.reset(J.duration);
  };
  const read = {
    bend: bind(
      'hand-bend',
      (v) => `${v.toFixed(1)} mm`,
      () => draw(),
    ),
    pace: bind(
      'hand-pace',
      (v) => `× ${v.toFixed(2)}`,
      () => draw(),
    ),
    tremor: bind(
      'hand-tremor',
      (v) => `× ${v.toFixed(1)}`,
      () => draw(),
    ),
  };
  segmented(['hand-free', 'hand-exact'], (id) => {
    exact = id === 'hand-exact';
    draw();
  });
  draw();
  return { draw };
}

// ───────────────────────── 2 · the pen ─────────────────────────
function benchPen() {
  const load = new Chart(
    $('pen-load'),
    'The pen’s load λ along the ink laid; a tick at each dip',
    190,
  );
  const width = new Chart($('pen-width'), 'Width w (mm) along the ink laid', 160);
  let j: Joined | null = null;
  let reveal: Reveal | null = null;
  let pen: ((q: Vec | null) => void) | null = null;
  const at = (t: number | null) => {
    if (!j) return;
    reveal?.at(t);
    if (t === null) {
      pen?.(null);
      load.mark(null);
      width.mark(null);
      return;
    }
    const i = indexAtTime(j, t);
    if (i < 0) return;
    pen?.([j.X[i] as number, j.Y[i] as number]);
    load.mark(j.S[i] as number, j.Ld[i] as number);
    width.mark(j.S[i] as number, j.W[i] as number);
  };
  const sc = scrubber(
    { play: 'pen-play', range: 'pen-t', out: 'pen-t-o' },
    at,
    (t) => `${fx(t, 1)} s`,
  );
  const draw = () => {
    const p = sheet('pen', [168, 74], { seed: 5 });
    const ins = $<HTMLSelectElement>('pen-ins').value as InstrumentId;
    const len = read.len();
    const press = read.press();
    const perRow = Math.max(1, Math.floor((168 - 16 + 6) / (len + 6)));
    const n = Math.min(15 * perRow, Math.max(6, Math.ceil(1100 / len)));
    const all: Mark[] = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x0 = 8 + col * (len + 6);
      const y = 7 + row * 4.4;
      const pts: MVec[] = [];
      for (let x = 0; x <= len; x += 2)
        pts.push([x0 + x, y + 0.5 * Math.sin((x / len) * Math.PI * 2 + i)]);
      all.push(
        ...p.stroke(pts, {
          role: 'contour',
          instrument: ins,
          pressure: press,
          start: 'touch',
          end: 'lift',
          id: `line-${i}`,
        }),
      );
    }
    const svg = mount($('pen-sheet'), p.toSVG({ pxPerMm: 4 }));
    reveal = new Reveal(svg, all, { width: 3.2, gap: 0.18 });
    pen = penMarker(svg);
    j = joined(all, 0.18);
    const J = j;
    const W = J.W.filter(Number.isFinite);
    load.set({
      x: { min: 0, max: J.length, label: 'ink laid (mm)' },
      y: { min: 0, max: 1.05, label: 'load λ' },
      layers: [{ kind: 'line', xs: J.S, ys: J.Ld, cls: 's-ink' }],
      vmarks: J.dips.map((x) => ({ x, label: 'dip' })),
      note: `${J.dips.length} dips`,
    });
    width.set({
      x: { min: 0, max: J.length, label: 'ink laid (mm)' },
      y: { min: 0, max: Math.max(...W) * 1.15, label: 'w (mm)', fmt: (v) => v.toFixed(2) },
      layers: [{ kind: 'line', xs: J.S, ys: J.W, cls: 's-ink' }],
      vmarks: J.dips.map((x) => ({ x })),
      note: `${fx(Math.min(...W), 2)}–${fx(Math.max(...W), 2)} mm`,
    });
    const I = INSTRUMENTS[ins];
    const pools = all.reduce((a, m) => a + m.stats.pools, 0);
    const dens = all.reduce((a, m) => a + m.stats.density, 0) / Math.max(1, all.length);
    readout('pen-readout', [
      ['Pen', `${I.name}, ${fx(I.w0, 2)}–${fx(I.w1, 2)} mm`],
      ['Capacity', Number.isFinite(I.capacity) ? `${f0(I.capacity)} mm of a 0.4 mm line` : 'dry'],
      ['Strokes (pieces)', `${all.length}`],
      ['Ink laid', `${fx(J.length / 1000, 2)} m`],
      [
        'Dips',
        `${J.dips.length}, one per ${J.dips.length ? f0(J.length / J.dips.length) : '–'} mm`,
      ],
      ['Pools', `${pools}`],
      ['Mean density', fx(dens, 2)],
      [
        'Starved',
        `${fx((100 * all.reduce((a, m) => a + m.stats.starved * m.stats.length, 0)) / Math.max(1, J.length), 1)}% of the length`,
      ],
      ['Hand time', `${fx(J.duration, 1)} s`],
    ]);
    sc.reset(J.duration);
  };
  const read = {
    len: bind(
      'pen-len',
      (v) => `${v} mm`,
      () => draw(),
    ),
    press: bind(
      'pen-press',
      (v) => v.toFixed(2),
      () => draw(),
    ),
  };
  $('pen-ins').addEventListener('change', () => draw());
  draw();
  return { draw };
}

// ───────────────────────── 3 · the light ─────────────────────────
function benchLight() {
  const chart = new Chart(
    $('light-tone'),
    'Across the sphere, from the lit limb to the far one',
    210,
  );
  const draw = () => {
    const az = read.az();
    const el = read.el();
    const p = sheet('light', [120, 78], { seed: 3, az, el });
    const c: Vec = [60, 39];
    const r = 28;
    const ball = sphere('ball', c, r);
    hatch(p, { form: ball, id: 'tone' });
    contour(p, ball.outline, { id: 'outline', form: 'ball' });
    mount($('light-sheet'), p.toSVG({ pxPerMm: 4 }));
    // the tone, from the engine's own form, along the diameter that points at the light
    const d = light2d(p.light);
    const xs: number[] = [];
    const tones: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const u = -1 + (2 * i) / 120;
      const q: Vec = [c[0] - u * d[0] * r * 0.995, c[1] - u * d[1] * r * 0.995];
      xs.push(u);
      tones.push(ball.tone(q, p.light));
    }
    // the ink the hatching laid along the same diameter: coverage in 2.5 mm discs
    const hatches = p.marks.filter((m) => m.form === 'ball' && m.role === 'hatch');
    const bx: number[] = [];
    const ink: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = -0.92 + (1.84 * i) / 24;
      const q: Vec = [c[0] - u * d[0] * r, c[1] - u * d[1] * r];
      const R = 2.6;
      let area = 0;
      for (const m of hatches) {
        const w = m.stats.wMean;
        for (let k = 1; k < m.spine.length; k++) {
          const a = m.spine[k - 1] as MVec;
          const b = m.spine[k] as MVec;
          const mid: Vec = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (Math.hypot(mid[0] - q[0], mid[1] - q[1]) < R)
            area += Math.hypot(b[0] - a[0], b[1] - a[1]) * w;
        }
      }
      bx.push(u);
      ink.push(area / (Math.PI * R * R));
    }
    const inkMax = Math.max(0.05, ...ink);
    chart.set({
      x: {
        min: -1,
        max: 1,
        label: 'position across the sphere (−1 lit limb … +1 far limb)',
        fmt: (v) => v.toFixed(1),
      },
      y: { min: 0, max: 1, label: 'tone' },
      y2: { min: 0, max: inkMax * 1.1, label: 'ink cover', fmt: (v) => v.toFixed(2) },
      layers: [
        { kind: 'line', xs: bx, ys: ink, cls: 's-measure', y2: true },
        { kind: 'line', xs, ys: tones, cls: 's-ink' },
      ],
      refs: [
        { x0: -1, y0: 0.2, x1: 1, y1: 0.2, label: 'hatch' },
        { x0: -1, y0: 0.5, x1: 1, y1: 0.5, label: 'deepen' },
        { x0: -1, y0: 0.74, x1: 1, y1: 0.74, label: 'deepen' },
      ],
      note: 'black: tone the light asks for · red: ink laid',
    });
    const rep = critique(p);
    const pick = (id: string) => rep.checks.find((x) => x.id === id);
    const rows: [string, string][] = [];
    for (const [id, name] of [
      ['light.follows:ball', 'Ink follows the light'],
      ['light.lit-clear:ball', 'Lit side stays paper'],
      ['light.tied', 'Every tone tied to a form'],
      ['light.contour-weight', 'Contour heavier in shadow'],
    ] as const) {
      const ck = pick(id);
      if (ck) rows.push([`${name} · ${ck.status}`, ck.value]);
    }
    rows.push(['Hatch strokes', `${hatches.length}`]);
    readout('light-readout', rows);
  };
  const read = {
    az: bind(
      'light-az',
      (v) => `${v}°`,
      () => draw(),
    ),
    el: bind(
      'light-el',
      (v) => `${v}°`,
      () => draw(),
    ),
  };
  draw();
  return { draw };
}

// ───────────────────────── 4 · the measure ─────────────────────────
function benchMeasure() {
  const draw = () => {
    const w = read.w();
    const h = read.h();
    const pitch = read.s();
    const p = sheet('measure', [168, 96], { seed: 9 });
    // centre the frame (it spans the part plus 10 mm left and 22 mm right) on the sheet
    const ox = Math.round((168 - (w + 32)) / 2) + 10;
    const oy = 38;
    const outline: MVec[] = [
      [ox, oy],
      [ox + w, oy],
      [ox + w, oy + 14],
      [ox + 26, oy + 14],
      [ox + 26, oy + h],
      [ox, oy + h],
      [ox, oy],
    ];
    const body = p.stroke(outline, {
      role: 'contour',
      guide: 'ruler',
      anchored: true,
      pressure: 0.62,
      id: 'part',
    });
    const holes: Vec[] = [];
    for (let x = ox + 8; x <= ox + w - 6; x += pitch) holes.push([x, oy + 7]);
    holes.forEach((q, i) => {
      p.stroke(circle(q, 2.6, -1, 0.15), {
        role: 'contour',
        guide: 'compass',
        pressure: 0.5,
        id: `hole-${i + 1}`,
      });
      centreLines(p, q, 2.6, { over: 2.2, id: `hole-${i + 1}-c` });
    });
    const pts: Vec[] = [[ox, oy], ...holes.map((q) => [q[0], oy] as Vec), [ox + w, oy]];
    chainDims(p, pts, { axis: 'x', offset: -8, id: 'chain', digits: 0, unit: 'none' });
    extents(p, body, { sides: ['right'], tier: 9, id: 'height', unit: 'none' });
    neatline(p, [ox - 10, oy - 27, ox + w + 22, oy + h + 9], {
      every: 5,
      major: 2,
      origin: (holes[0] ?? [ox, oy]) as Vec,
      id: 'frame',
    });
    mount($('m-sheet'), p.toSVG({ pxPerMm: 4 }));
    const rep = critique(p);
    const st = (id: string) => rep.checks.find((c) => c.id === id)?.status ?? '–';
    const rows: [string, string][] = [];
    for (const d of p.dimensions) {
      const name = d.id
        .replace('chain-', 'chain ')
        .replace('height-right', 'overall height')
        .replace('chain overall', 'overall width');
      rows.push([`${name}: “${d.text}”`, `ink ${fx(d.value, 2)} · ${st(`measure.true:${d.id}`)}`]);
    }
    readout('m-readout', rows);
    const chips = $('m-chips');
    chips.replaceChildren();
    for (const id of [
      'measure.outer',
      'measure.tiers-order',
      'measure.tier-gap',
      'measure.neatline:frame',
      'measure.unit',
    ]) {
      const ck = rep.checks.find((c) => c.id === id);
      if (!ck) continue;
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.s = ck.status;
      chip.title = `${ck.title}: ${ck.value}`;
      chip.textContent = `${id} · ${ck.status}`;
      chips.append(chip);
    }
  };
  const read = {
    w: bind(
      'm-w',
      (v) => `${v} mm`,
      () => draw(),
    ),
    h: bind(
      'm-h',
      (v) => `${v} mm`,
      () => draw(),
    ),
    s: bind(
      'm-s',
      (v) => `${v} mm`,
      () => draw(),
    ),
  };
  draw();
  return { draw };
}

// ───────────────────────── 5 · the line type ─────────────────────────
function benchLine() {
  const chart = new Chart($('l-dash'), 'Each dash, where it lies along the line', 150);
  let centred = true;
  const draw = () => {
    const len = read.len();
    const type = $<HTMLSelectElement>('l-type').value as LineType;
    const p = sheet('line', [168, 36], { seed: 13 });
    const x0 = (168 - len) / 2;
    const yH = 13;
    const yE = 27;
    const hand = p.stroke(
      [
        [x0, yH],
        [x0 + len, yH],
      ],
      { role: 'contour', guide: 'ruler', line: type, centred, pressure: 0.5, id: 'hand' },
    );
    const exact = p.stroke(
      [
        [x0, yE],
        [x0 + len, yE],
      ],
      { role: 'overlay', guide: 'exact', line: type, centred, pressure: 0.5, id: 'exact' },
    );
    letter(p, 'hand', [x0, yH - 3.4], { cap: 2.5, kind: 'note', id: 'l-hand' });
    letter(p, 'exact', [x0, yE - 3.4], { cap: 2.5, kind: 'note', id: 'l-exact' });
    mount($('l-sheet'), p.toSVG({ pxPerMm: 4 }));
    const spans = (ms: Mark[]) =>
      ms
        .map((m) => {
          const xs = m.spine.map((q) => q[0]);
          return [Math.min(...xs) - x0, Math.max(...xs) - x0] as [number, number];
        })
        .sort((a, b) => a[0] - b[0]);
    const H = spans(hand);
    const E = spans(exact);
    const rects: [number, number, number, number][] = [
      ...H.map(([a, b]) => [a, 1.15, b, 1.85] as [number, number, number, number]),
    ];
    const rectsE: [number, number, number, number][] = E.map(([a, b]) => [a, 0.15, b, 0.85]);
    const mid = len / 2;
    const onDash = (sp: [number, number][]) =>
      sp.some(([a, b]) => mid >= a - 0.05 && mid <= b + 0.05);
    chart.set({
      x: { min: 0, max: len, label: 'along the line (mm)' },
      y: { min: 0, max: 2.45, label: 'exact · hand' },
      yTicks: [],
      hideYTicks: true,
      layers: [
        { kind: 'rects', rects, cls: 'b-ink' },
        { kind: 'rects', rects: rectsE, cls: 'b-measure' },
      ],
      vmarks: [{ x: mid, label: 'middle' }],
      note: `upper row: hand · lower: exact`,
    });
    const cv = (sp: [number, number][]) => {
      const l = sp
        .map(([a, b]) => b - a)
        .filter((v) => v > 0.6)
        .slice(1, -1);
      if (l.length < 3) return Number.NaN;
      const m = l.reduce((a, b) => a + b, 0) / l.length;
      return Math.sqrt(l.reduce((a, b) => a + (b - m) ** 2, 0) / l.length) / m;
    };
    const dOf = (ins: InstrumentId) => {
      const I = INSTRUMENTS[ins];
      return Math.max(0.12, I.w0 + (I.w1 - I.w0) * 0.4);
    };
    const kitH = p.kit('contour').instrument;
    const kitE = p.kit('overlay').instrument;
    const pat: Record<string, number[]> = {
      dashed: [12, 3],
      chain: [24, 3, 0.5, 3],
      phantom: [24, 3, 0.5, 3, 0.5, 3],
      dotted: [0.5, 3],
    };
    const fit = (d: number) => {
      const P = (pat[type] ?? [1]).reduce((a, b) => a + b, 0) * d;
      const first = (pat[type]?.[0] ?? 1) * d;
      const raw = (len - first) / P;
      const n = Math.max(0, centred ? 2 * Math.round(raw / 2) : Math.round(raw));
      return { P, n, k: n > 0 ? (len - first) / (n * P) : 1, d };
    };
    const fh = fit(dOf(kitH));
    const fe = fit(dOf(kitE));
    readout('l-readout', [
      ['Line width d (hand · exact)', `${fx(fh.d, 2)} · ${fx(fe.d, 2)} mm`],
      ['Period P', `${fx(fh.P, 1)} · ${fx(fe.P, 1)} mm`],
      ['Whole periods n', `${fh.n} · ${fe.n}`],
      ['Stretch k', `${fx(fh.k, 3)} · ${fx(fe.k, 3)}`],
      ['Dashes drawn', `${hand.length} · ${exact.length}`],
      ['Dash CV (middle dashes)', `${fx(cv(H), 3)} · ${fx(cv(E), 3)}`],
      ['Middle of the line', `${onDash(H) ? 'dash' : 'gap'} · ${onDash(E) ? 'dash' : 'gap'}`],
    ]);
  };
  const read = {
    len: bind(
      'l-len',
      (v) => `${v} mm`,
      () => draw(),
    ),
  };
  $('l-type').addEventListener('change', () => draw());
  segmented(['l-end', 'l-mid'], (id) => {
    centred = id === 'l-mid';
    draw();
  });
  draw();
  return { draw };
}

// ───────────────────────── 6 · a whole plate ─────────────────────────
function benchPlate() {
  const data = window.MAI_DATA;
  const dip = new Chart(
    $('pl-dip'),
    'The dip rhythm across the plate: the main pen’s load, stroke by stroke',
    190,
  );
  const law = new Chart(
    $('pl-law'),
    'Every free sample on the plate: speed over its stroke’s gain, against the bend',
    220,
  );
  const show = (idx: number) => {
    const d = data?.plates[idx];
    if (!d) return;
    mount($('pl-view'), d.svg);
    dip.set({
      x: {
        min: 0,
        max: Math.max(...d.dip.x.filter(Number.isFinite)),
        label: 'ink laid by the main pen (m)',
        fmt: (v) => v.toFixed(1),
      },
      y: { min: 0, max: 1.05, label: 'load λ' },
      layers: [{ kind: 'line', xs: d.dip.x, ys: d.dip.load, cls: 's-ink' }],
      vmarks: d.dip.dips.map((x) => ({ x })),
      note: `${d.dip.dips.length} dips`,
    });
    const xs = d.law.x;
    const ys = d.law.y;
    const bx: number[] = [];
    const by: number[] = [];
    const ex: number[] = [];
    const ey: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      const b = !!d.law.bound[i];
      (b ? bx : ex).push(xs[i] as number);
      (b ? by : ey).push(ys[i] as number);
    }
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    law.set({
      x: { min: xMin, max: xMax, label: 'log₁₀ κ', fmt: (v) => v.toFixed(1) },
      y: {
        min: Math.min(...ys) - 0.1,
        max: Math.max(...ys) + 0.1,
        label: 'log₁₀ (v / K)',
        fmt: (v) => v.toFixed(1),
      },
      layers: [
        { kind: 'dots', xs: ex, ys: ey, cls: 'd-soft', r: 1.1 },
        { kind: 'dots', xs: bx, ys: by, cls: 'd-ink', r: 1.2 },
      ],
      refs: [{ x0: xMin, y0: -xMin / 3, x1: xMax, y1: -xMax / 3, label: 'slope −1/3' }],
      note: `the bend sets the speed in ${Math.round(d.law.share * 100)}% of samples`,
    });
    const c = d.counts;
    readout('pl-readout', [
      ['Strokes', f0(c.marks ?? 0)],
      ['Samples', f0(c.samples ?? 0)],
      ['Numbers computed', `${f0((c.samples ?? 0) * 9)} (9 per sample)`],
      ['Ink laid', `${fx((c.inkMm ?? 0) / 1000, 2)} m`],
      ['Hand time', `${fx((c.seconds ?? 0) / 60, 1)} min`],
      ['Dips · pools', `${c.dips} · ${c.pools}`],
      ['Feathers · catches · spatter', `${f0(c.feathers ?? 0)} · ${c.catches} · ${c.spatter}`],
      ['Constructions · dimensions', `${c.constructions} · ${c.dimensions}`],
      ['Lettered labels', `${c.texts}`],
      ['Parts in its anatomy', `${c.parts}`],
      ['Critic', `${d.checks.length} checks, ${d.verdict}`],
    ]);
    readout(
      'pl-roles',
      Object.entries(d.law.roles)
        .sort((a, b) => b[1][0] - a[1][0])
        .map(([role, [n, b]]) => [role, `${Math.round((100 * b) / Math.max(1, n))}% of ${f0(n)}`]),
    );
    const host = $('pl-checks');
    host.replaceChildren();
    const dims = [...new Set(d.checks.map((x) => x.dimension))];
    for (const dim of dims) {
      const row = document.createElement('div');
      row.className = 'row';
      const name = document.createElement('span');
      const cs = d.checks.filter((x) => x.dimension === dim);
      name.textContent = `${dim} (${cs.length})`;
      const cells = document.createElement('span');
      cells.className = 'cells';
      for (const ck of cs) {
        const i = document.createElement('i');
        i.dataset.s = ck.status;
        i.title = `${ck.status.toUpperCase()} · ${ck.title}: ${ck.value}`;
        cells.append(i);
      }
      row.append(name, cells);
      host.append(row);
    }
    $('pl-src').textContent = d.source;
  };
  segmented(['pl-3', 'pl-4'], (id) => show(id === 'pl-4' ? 1 : 0));
  show(0);
  // the hero's strip: Plate III, counted
  const p3 = data?.plates[0];
  if (p3) {
    const c = p3.counts;
    const strip = $('counts');
    strip.replaceChildren();
    for (const [v, k] of [
      [f0(c.marks ?? 0), 'strokes'],
      [f0(c.samples ?? 0), 'samples'],
      [f0((c.samples ?? 0) * 9), 'numbers computed'],
      [`${fx((c.inkMm ?? 0) / 1000, 1)} m`, 'of ink laid'],
      [`${fx((c.seconds ?? 0) / 60, 1)} min`, 'of hand time'],
      [`${p3.checks.length}`, 'checks by the critic'],
    ]) {
      const cell = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = v as string;
      const s = document.createElement('span');
      s.textContent = k as string;
      cell.append(b, s);
      strip.append(cell);
    }
    $('counts-note').textContent =
      `Plate III, the eye of the volute, as the engine draws it for this page: ${f0(c.dips ?? 0)} dips, ${f0(c.pools ?? 0)} pools, ${f0(c.feathers ?? 0)} feathers, ${c.dimensions} dimensions measured from the ink.`;
  }
}

// ───────────────────────── start ─────────────────────────
function start() {
  const benches = [
    benchTitle(),
    benchHand(),
    benchPen(),
    benchLight(),
    benchMeasure(),
    benchLine(),
  ];
  benchPlate();
  // the specimens are drawn on the sheet of the viewer's theme: redraw when it changes
  const redraw = () => {
    for (const b of benches) b.draw();
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
  new MutationObserver(redraw).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
