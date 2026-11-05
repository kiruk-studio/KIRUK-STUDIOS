/**
 * Plate II geometry — Desirable's parametric table, drawn by its numbers.
 * Pure string builders: the server renders the rest state (W = 120 cm, oak);
 * the client calls the same function as the buyer scrubs W, so the drawing
 * the reader sees is always the one the formula draws.
 *
 * claim: Desirable lets a buyer draw a table by its numbers; the legs keep
 *        their inset while the top stretches.
 * Source of every number: ../truth.ts DESIRABLE (from ~/KIRUKULAM/Desirable).
 * spec-link: ideas/studio-dawn/folio.md — Plate II
 * spec-link: ~/.claude/skills/dimensional-drawing/SKILL.md — codes and formulas
 */

import { bbox, fillHatch, hatch, line, n, type P, polyD, quill, toD, wobble } from '../ink/pen';
import { DESIRABLE as T } from '../truth';

type V3 = readonly [number, number, number];
type MP = [number, number];
export type Material = 'oak' | 'glass';
export type TableState = { W: number; material: Material };

const r12 = (12 * Math.PI) / 180;
const r38 = (38 * Math.PI) / 180;
/** Oblique axes: width rises 12° to the right, depth recedes up-right at half scale. */
const EX: MP = [Math.cos(r12), -Math.sin(r12)];
const EZ: MP = [0.5 * Math.cos(r38), -0.5 * Math.sin(r38)];

export const SHEETS = {
  wide: { w: 1200, h: 760, box: { x: 300, y: 118, w: 740, h: 500 }, kMax: 3.6, ground: 640 },
  phone: { w: 420, h: 470, box: { x: 24, y: 96, w: 372, h: 300 }, kMax: 1.8, ground: 400 },
} as const;

/** px per cm: fixed until the table no longer fits, then the drawing zooms out (a bend). */
export function scaleFor(W: number, wide: boolean): number {
  const S = wide ? SHEETS.wide : SHEETS.phone;
  const spanX = EX[0] * W + EZ[0] * T.depth;
  const spanY = -EX[1] * W - EZ[1] * T.depth + T.height;
  return Math.min(S.kMax, S.box.w / spanX, S.box.h / spanY);
}

/** Where the drawing bends: the width at which auto-fit starts (wide sheet). */
export const FIT_BEND = (SHEETS.wide.box.w / SHEETS.wide.kMax - EZ[0] * T.depth) / EX[0];

function projector(W: number, wide: boolean) {
  const S = wide ? SHEETS.wide : SHEETS.phone;
  const k = scaleFor(W, wide);
  const spanX = (EX[0] * W + EZ[0] * T.depth) * k;
  const O: MP = [S.box.x + (S.box.w - spanX) / 2, S.ground - 22 * (wide ? 1 : 0.5)];
  const p = ([x, y, z]: V3): MP => [
    O[0] + (x * EX[0] + z * EZ[0]) * k,
    O[1] + (x * EX[1] + z * EZ[1] - y) * k,
  ];
  return { k, O, p };
}

// ── string helpers (the same marks rubric.tsx draws, as markup) ─────────────

const path = (d: string, cls: string, extra = '') => `<path class="${cls}" d="${d}"${extra}/>`;
const seg = (a: P, b: P, cls = 'rub', extra = '') =>
  path(
    `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`,
    cls,
    ` vector-effect="non-scaling-stroke"${extra}`,
  );
const unit = (a: P, b: P): MP => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};
const arrow = (tip: P, from: P) => {
  const [ux, uy] = unit(from, tip);
  const L = 8;
  const h = Math.tan((12.5 * Math.PI) / 180) * L;
  const bx = tip[0] - ux * L;
  const by = tip[1] - uy * L;
  return `<path data-end="" class="rub-fill" d="M${n(tip[0])} ${n(tip[1])}L${n(bx - uy * h)} ${n(by + ux * h)}L${n(bx + uy * h)} ${n(by - ux * h)}Z"/>`;
};
const dot = (at: P) =>
  `<circle data-end="" class="rub-fill" cx="${n(at[0])}" cy="${n(at[1])}" r="2.5"/>`;
const label = (at: P, text: string, anchor = 'middle', cls = 'lbl') =>
  `<text class="${cls}" x="${n(at[0])}" y="${n(at[1])}" text-anchor="${anchor}">${text}</text>`;

/**
 * An oblique dimension: from 3D points a→b, pushed along the 3D offset `off` (cm).
 * Extension lines leave 3 u clear of the ink and run 8 u past the dimension line.
 */
function axoDim(
  p: (v: V3) => MP,
  a: V3,
  b: V3,
  off: V3,
  text: string,
  opts: { anchor?: string; dx?: number; dy?: number; outside?: boolean } = {},
) {
  const A = p(a);
  const B = p(b);
  const A1 = p([a[0] + off[0], a[1] + off[1], a[2] + off[2]]);
  const B1 = p([b[0] + off[0], b[1] + off[1], b[2] + off[2]]);
  const [ox, oy] = unit(A, A1);
  const ext = (from: MP, to: MP) =>
    seg(
      [from[0] + ox * 3, from[1] + oy * 3],
      [to[0] + ox * 8, to[1] + oy * 8],
      'rub',
      ' data-ext=""',
    );
  const [ux, uy] = unit(A1, B1);
  const L = Math.hypot(B1[0] - A1[0], B1[1] - A1[1]);
  const out = opts.outside || L < 34;
  const mid: MP = [(A1[0] + B1[0]) / 2 + (opts.dx ?? 0), (A1[1] + B1[1]) / 2 + (opts.dy ?? 0)];
  return [
    ext(A, A1),
    ext(B, B1),
    seg(A1, B1),
    out
      ? seg([A1[0] - ux * 16, A1[1] - uy * 16], A1) +
        seg([B1[0] + ux * 16, B1[1] + uy * 16], B1) +
        arrow(A1, [A1[0] - ux * 16, A1[1] - uy * 16]) +
        arrow(B1, [B1[0] + ux * 16, B1[1] + uy * 16])
      : arrow(A1, B1) + arrow(B1, A1),
    label(mid, text, opts.anchor ?? 'middle'),
  ].join('');
}

// ── the table ───────────────────────────────────────────────────────────────

type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };

function faces(p: (v: V3) => MP, b: Box) {
  const A = p([b.x0, b.y0, b.z0]);
  const B = p([b.x1, b.y0, b.z0]);
  const C = p([b.x1, b.y1, b.z0]);
  const D = p([b.x0, b.y1, b.z0]);
  const E = p([b.x1, b.y0, b.z1]);
  const F = p([b.x1, b.y1, b.z1]);
  const G = p([b.x0, b.y1, b.z1]);
  return {
    outline: [A, B, E, F, G, D] as MP[],
    front: [A, B, C, D] as MP[],
    top: [D, C, F, G] as MP[],
    right: [B, E, F, C] as MP[],
    inner: [
      [D, C],
      [C, B],
      [C, F],
    ] as [MP, MP][],
  };
}

let clipSeq = 0;

function drawBox(
  p: (v: V3) => MP,
  b: Box,
  o: {
    id: string;
    weight: number;
    seed: number;
    knockout: boolean;
    shade: number;
    light?: boolean;
  },
) {
  const f = faces(p, b);
  const cid = `${o.id}-${clipSeq++}`;
  const rb = bbox(f.right);
  const shade =
    o.shade > 0
      ? hatch(rb, { gap: o.shade, weight: 0.85, reach: 0.95, seed: o.seed + 3, toward: [1, 1] })
      : '';
  const contour = quill(wobble([...f.outline, f.outline[0]!], 0.45, 70, o.seed), {
    min: 0.7,
    max: o.weight,
    seed: o.seed + 1,
    closed: true,
    side: 1,
  });
  const inner = f.inner
    .map(([a, c], i) =>
      quill(wobble(line(a, c, 3), 0.35, 60, o.seed + 10 + i), {
        min: 0.5,
        max: o.weight * 0.62,
        seed: o.seed + 20 + i,
      }),
    )
    .join('');
  return [
    o.knockout ? `<path class="ko" data-knockout="" d="${polyD(f.outline)}"/>` : '',
    shade
      ? `<clipPath id="${cid}"><path d="${polyD(f.right)}"/></clipPath><g clip-path="url(#${cid})" class="hatch"><path d="${shade}"/></g>`
      : '',
    `<path class="${o.light ? 'q glass-edge' : 'q'}" data-quill="${o.weight}" d="${contour}${inner}"/>`,
  ].join('');
}

export type TableDrawing = {
  cons: string;
  ink: string;
  line: string;
  letters: string;
  k: number;
  error: boolean;
  legX: number;
};

export function drawTable(state: TableState, wide: boolean, idPrefix: string): TableDrawing {
  clipSeq = 0;
  const W = Math.round(Math.min(T.width.max, Math.max(T.width.min, state.W)));
  const { k, p } = projector(W, wide);
  const H = T.height;
  const D = T.depth;
  const top = T.top;
  const L = T.leg;
  const S = T.inset(L);
  const lh = T.legHeight(H, top);
  const glass = state.material === 'glass';
  const error = glass && W > T.glassLimit;
  const sw = wide ? 1 : 0.62;

  // Construction: the bounding box the buyer is drawing, and the three axes.
  const corners: V3[] = [
    [0, 0, 0],
    [W, 0, 0],
    [W, 0, D],
    [0, 0, D],
    [0, H, 0],
    [W, H, 0],
    [W, H, D],
    [0, H, D],
  ];
  const c = corners.map(p);
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const ext = (a: MP, b: MP) => {
    const [ux, uy] = unit(a, b);
    return `M${n(a[0] - ux * 8)} ${n(a[1] - uy * 8)}L${n(b[0] + ux * 8)} ${n(b[1] + uy * 8)}`;
  };
  const cons = [
    `<path class="cons-d" d="${edges.map(([i, j]) => ext(c[i]!, c[j]!)).join('')}"/>`,
    // Leg centre lines (chain): where the formula puts each leg.
    ...[
      [S, S],
      [W - S, S],
      [S, D - S],
      [W - S, D - S],
    ].map(
      ([x, z]) =>
        `<path class="cons" d="M${n(p([x!, 0, z!])[0])} ${n(p([x!, 0, z!])[1] + 10)}L${n(p([x!, lh, z!])[0])} ${n(p([x!, lh, z!])[1] - 6)}"/>`,
    ),
  ].join('');

  // Ink, back to front: floor shadow, far legs, near legs, the top.
  const sx = H * 0.32;
  const sz = H * 0.22;
  const shadowPoly = [
    p([sx, 0, sz]),
    p([W + sx, 0, sz]),
    p([W + sx, 0, D + sz]),
    p([sx, 0, D + sz]),
  ];
  const shadowId = `${idPrefix}-shadow`;
  const shadow = `<clipPath id="${shadowId}"><path d="${polyD(shadowPoly)}"/></clipPath><g clip-path="url(#${shadowId})" class="hatch hatch-light"><path d="${hatch(bbox(shadowPoly), { gap: 5.2 * sw + 1.4, weight: 0.65, reach: 0.9, seed: 811, toward: [1, 1] })}"/></g>`;

  const legs: { x: number; z: number; depth: number }[] = [
    { x: S, z: D - S, depth: 0 },
    { x: W - S, z: D - S, depth: 1 },
    { x: S, z: S, depth: 2 },
    { x: W - S, z: S, depth: 3 },
  ];
  const legInk = legs
    .map((g, i) =>
      drawBox(
        p,
        { x0: g.x - L / 2, x1: g.x + L / 2, y0: 0, y1: lh, z0: g.z - L / 2, z1: g.z + L / 2 },
        {
          id: idPrefix,
          weight: (g.depth < 2 ? 1.8 : 2.3) * (wide ? 1 : 0.7),
          seed: 820 + i * 17,
          knockout: true,
          shade: (wide ? 3.2 : 2.6) + (g.depth < 2 ? 0.8 : 0),
        },
      ),
    )
    .join('');

  const slab: Box = { x0: 0, x1: W, y0: lh, y1: H, z0: 0, z1: D };
  const slabInk = drawBox(p, slab, {
    id: idPrefix,
    weight: (glass ? 1.6 : 2.6) * (wide ? 1 : 0.7),
    seed: 900,
    knockout: !glass,
    shade: glass ? 0 : wide ? 2.6 : 2.2,
    light: glass,
  });

  // Oak: grain along the width. Glass: three glints across the top.
  let surface = '';
  if (!glass) {
    surface = [0.16, 0.29, 0.44, 0.58, 0.73, 0.86]
      .map((zf, i) => {
        const pts = Array.from({ length: 26 }, (_, j) => {
          const xf = 0.05 + (0.9 * j) / 25;
          const wave = Math.sin(xf * 9 + i * 1.7) * 0.9 + Math.sin(xf * 23 + i) * 0.35;
          return p([xf * W, H, zf * D + wave]);
        });
        return quill(pts, { min: 0.18, max: 0.62, seed: 950 + i });
      })
      .map((d) => `<path class="grain" d="${d}"/>`)
      .join('');
  } else {
    surface = [0.25, 0.45, 0.62]
      .map((xf, i) => {
        const a = p([xf * W, H, D * 0.15]);
        const b = p([xf * W + D * 0.28, H, D * 0.85]);
        return `<path class="glint" d="${quill(line(a, b, 3), { min: 0.25, max: 0.9, seed: 970 + i })}"/>`;
      })
      .join('');
  }

  const ink = shadow + legInk + slabInk + surface;

  // The line: codes from the source, formulas closed.
  const off = 12;
  const line_ = [
    axoDim(p, [0, H, D], [W, H, D], [0, 13, 0], `W ${W}`, { dy: -6 }),
    axoDim(p, [W, H, 0], [W, H, D], [off, 0, 0], `D ${D}`, { anchor: 'start', dx: 8, dy: 2 }),
    // H runs up the near-right leg's outer corner to the top surface.
    axoDim(p, [W - 2, 0, 2], [W - 2, H, 2], [off + 4, 0, 0], `H ${H}`, {
      anchor: 'start',
      dx: 8,
      dy: 4,
    }),
    wide
      ? axoDim(p, [0, lh, 0], [0, H, 0], [-9, 0, 0], `T ${top}`, {
          anchor: 'end',
          dx: -10,
          dy: 4,
          outside: true,
        })
      : '',
  ];
  // A leader to the near-left leg: its height is a formula, not a number someone typed.
  const legPt = p([S - L / 2, lh * 0.42, S - L / 2]);
  const elbow: MP = [legPt[0] - 46 * sw, legPt[1] - 46 * sw];
  line_.push(
    seg(elbow, legPt) +
      seg(elbow, [elbow[0] - 16, elbow[1]]) +
      dot(legPt) +
      label([elbow[0] - 20, elbow[1] + 4], `H − T = ${lh}`, 'end'),
  );
  if (error) {
    const ctr = p([W * 0.5, H, D * 0.5]);
    line_.push(
      seg([ctr[0] - 9, ctr[1] - 9], [ctr[0] + 9, ctr[1] + 9]) +
        seg([ctr[0] - 9, ctr[1] + 9], [ctr[0] + 9, ctr[1] - 9]) +
        label([ctr[0], ctr[1] - 18], 'glass > 200: reinforce', 'middle', 'lbl lbl-err'),
    );
  }
  // Scale bar: 50 cm at the drawing's current scale.
  const sbY = (wide ? SHEETS.wide.h : SHEETS.phone.h) - (wide ? 40 : 28);
  const sbX = (wide ? SHEETS.wide.w : SHEETS.phone.w) - (wide ? 70 : 24) - 50 * k;
  line_.push(
    seg([sbX, sbY], [sbX + 50 * k, sbY], 'rub', ' data-free=""') +
      seg([sbX, sbY - 5], [sbX, sbY + 5], 'rub', ' data-free=""') +
      seg([sbX + 25 * k, sbY - 3], [sbX + 25 * k, sbY + 3], 'rub', ' data-free=""') +
      seg([sbX + 50 * k, sbY - 5], [sbX + 50 * k, sbY + 5], 'rub', ' data-free=""') +
      label([sbX + 50 * k, sbY - 9], '50 cm', 'end'),
  );

  // Key letters ride with the drawing: A on the top, B on the near-left leg's centre line.
  const aAt = p([W * 0.5, H, D * 0.5]);
  const bAt = p([S, 0, S]);
  const letters =
    `<text class="key-letter" x="${n(aAt[0])}" y="${n(aAt[1] + 6)}" text-anchor="middle">A</text>` +
    `<text class="key-letter" x="${n(bAt[0] - 16 * sw)}" y="${n(bAt[1] + 22 * sw)}" text-anchor="middle">B</text>`;

  return { cons, ink, line: line_.join(''), letters, k, error, legX: W - S };
}

/** C — the leg's inset, seen from below at 10 px/cm: S = L/2 + 2. */
export function insetDetail(o: MP = [64, 70]) {
  const u = 10;
  const L = T.leg;
  const S = T.inset(L);
  const gap = S - L / 2;
  const [x, y] = o;
  const edgeX = line([x, y], [x + 170, y], 3);
  const edgeZ = line([x, y], [x, y + 150], 3);
  const leg: MP[] = [
    [x + gap * u, y + gap * u],
    [x + (gap + L) * u, y + gap * u],
    [x + (gap + L) * u, y + (gap + L) * u],
    [x + gap * u, y + (gap + L) * u],
  ];
  const cut = fillHatch(bbox(leg), { gap: 3.2, weight: 0.8, slope: 45, seed: 990 });
  const ctr: MP = [x + S * u, y + S * u];
  const ink = [
    `<path class="q" data-quill="1.8" d="${quill(wobble(edgeX, 0.3, 50, 991), { min: 0.6, max: 1.8, seed: 992 })}${quill(wobble(edgeZ, 0.3, 50, 993), { min: 0.6, max: 1.8, seed: 994, side: -1 })}"/>`,
    `<clipPath id="inset-cut"><path d="${polyD(leg)}"/></clipPath><g clip-path="url(#inset-cut)" class="hatch"><path d="${cut}"/></g>`,
    `<path class="q" data-quill="1.6" d="${quill([...leg, leg[0]!], { min: 0.7, max: 1.6, seed: 995, closed: true })}"/>`,
  ].join('');
  const cons = `<path class="cons" d="M${n(ctr[0] - 14)} ${n(ctr[1])}H${n(ctr[0] + 14)}M${n(ctr[0])} ${n(ctr[1] - 14)}V${n(ctr[1] + 14)}"/>`;
  const dimY = y + (gap + L) * u + 30;
  const lineMarks = [
    // gap 2 and L 5 along x, one tier; S on a second tier.
    seg([x, y + 3], [x, dimY + 26 + 8], 'rub', ' data-ext=""'),
    seg([leg[0]![0], leg[3]![1] + 3], [leg[0]![0], dimY + 8], 'rub', ' data-ext=""'),
    seg([leg[1]![0], leg[2]![1] + 3], [leg[1]![0], dimY + 8], 'rub', ' data-ext=""'),
    seg([ctr[0], ctr[1] + 17], [ctr[0], dimY + 26 + 8], 'rub', ' data-ext=""'),
    seg([x, dimY], [leg[0]![0], dimY]),
    arrow([x, dimY], [x - 14, dimY]) + seg([x - 14, dimY], [x, dimY]),
    arrow([leg[0]![0], dimY], [leg[0]![0] + 14, dimY]),
    seg([leg[0]![0], dimY], [leg[1]![0], dimY]),
    arrow([leg[1]![0], dimY], [leg[0]![0], dimY]),
    label([x - 18, dimY + 4], '2', 'end'),
    label([(leg[0]![0] + leg[1]![0]) / 2, dimY - 6], `L ${L}`),
    seg([x, dimY + 26], [ctr[0], dimY + 26]),
    arrow([x, dimY + 26], [ctr[0], dimY + 26]),
    arrow([ctr[0], dimY + 26], [x, dimY + 26]),
    label([ctr[0] + 8, dimY + 30], `S = L/2 + 2 = ${S}`, 'start'),
  ].join('');
  return {
    ink,
    cons,
    line: lineMarks,
    keyAt: [x + 150, y + 26] as MP,
    box: [x, y, 170, 150] as const,
  };
}
