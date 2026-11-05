/**
 * Plate I geometry — the five letters of "kiruk" as the five passes of a sheet.
 * Computed once, on the server: real IM Fell Double Pica outlines, measured.
 *
 * claim: Every kiruk piece is made the way this word is — scribbled, ruled,
 *        inked, measured, then made live.
 * spec-link: .claude/skills/kiruk-sheet/SKILL.md — Five passes
 * spec-link: ideas/studio-dawn/folio.md — Plate I
 */
import { FELL_DP, type FellGlyph } from '../ink/fell-glyphs';
import {
  arc,
  bbox,
  type Contour,
  chain,
  ellipse,
  fillHatch,
  hatch,
  line,
  mulberry32,
  type P,
  parsePath,
  quad,
  quill,
  searching,
  signedArea,
  toD,
  wobble,
} from '../ink/pen';

type MP = [number, number];
const EM = FELL_DP.upm;

export type Sheet = {
  w: number;
  h: number;
  s: number;
  x0: number;
  yb: number;
  /** Letter origins (x) in sheet units. */
  xs: number[];
  end: number;
};

const ORDER: FellGlyph[] = ['k', 'i', 'r', 'u', 'k'];

function sheet(w: number, h: number, F: number, x0: number, yb: number): Sheet {
  const s = F / EM;
  const xs: number[] = [];
  let x = x0;
  for (const g of ORDER) {
    xs.push(x);
    x += FELL_DP.glyphs[g].adv * s;
  }
  return { w, h, s, x0, yb, xs, end: x };
}

export const WIDE = sheet(1200, 560, 400, 214, 400);
export const PHONE = sheet(420, 250, 180, 20, 176);

/** Glyph contours in sheet coordinates. */
function contours(g: FellGlyph, S: Sheet, slot: number): Contour[] {
  const gx = S.xs[slot]!;
  return parsePath(FELL_DP.glyphs[g].d, 2.5 / S.s).map((c) => ({
    closed: c.closed,
    pts: c.pts.map(([x, y]) => [gx + x * S.s, S.yb - y * S.s] as MP),
  }));
}

/** Font units → sheet units for one letter slot. */
const at = (S: Sheet, slot: number, x: number, y: number): MP => [
  S.xs[slot]! + x * S.s,
  S.yb - y * S.s,
];

/** x where a contour set crosses the horizontal y (sheet units), sorted. */
function crossings(cs: Contour[], y: number): number[] {
  const xs: number[] = [];
  for (const c of cs) {
    const pts = c.pts;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      if ((a[1] - y) * (b[1] - y) < 0) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
  }
  return xs.sort((p, q) => p - q);
}

/** Least-squares circle (Kåsa) through points. */
export function fitCircle(pts: readonly P[]): { c: MP; r: number } {
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sxz = 0;
  let syz = 0;
  let sz = 0;
  const m = pts.length;
  for (const [x, y] of pts) {
    const z = x * x + y * y;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
    sxz += x * z;
    syz += y * z;
    sz += z;
  }
  // Solve [sxx sxy sx; sxy syy sy; sx sy m] [D E F]ᵀ = −[sxz syz sz]ᵀ
  const A = [
    [sxx, sxy, sx, -sxz],
    [sxy, syy, sy, -syz],
    [sx, sy, m, -sz],
  ];
  for (let i = 0; i < 3; i++) {
    let p = i;
    for (let r = i + 1; r < 3; r++) if (Math.abs(A[r]![i]!) > Math.abs(A[p]![i]!)) p = r;
    [A[i], A[p]] = [A[p]!, A[i]!];
    for (let r = 0; r < 3; r++) {
      if (r === i) continue;
      const f = A[r]![i]! / A[i]![i]!;
      for (let c = i; c < 4; c++) A[r]![c]! -= f * A[i]![c]!;
    }
  }
  const D = A[0]![3]! / A[0]![0]!;
  const E = A[1]![3]! / A[1]![1]!;
  const F = A[2]![3]! / A[2]![2]!;
  const c: MP = [-D / 2, -E / 2];
  return { c, r: Math.sqrt(Math.max(0, c[0] * c[0] + c[1] * c[1] - F)) };
}

/** Points of a glyph's contours that fall inside a font-unit box. */
function region(g: FellGlyph, x0: number, x1: number, y0: number, y1: number): MP[] {
  const out: MP[] = [];
  for (const c of parsePath(FELL_DP.glyphs[g].d, 6))
    for (const [x, y] of c.pts) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) out.push([x, y]);
  return out;
}

const toSheet = (S: Sheet, slot: number, c: { c: MP; r: number }) => ({
  c: at(S, slot, c.c[0], c.c[1]),
  r: c.r * S.s,
});

// Measured once, in font units: the shapes the rubric talks about.
const TITTLE = fitCircle(region('i', 150, 400, 1250, 1470));
const BOWL = fitCircle(region('u', 330, 640, 118, 330));
const SHOULDER = fitCircle(region('r', 388, 600, 718, 886));

export const METRICS = {
  xHeightEm: FELL_DP.xHeight / EM,
  ascEm: FELL_DP.glyphs.k.bbox[3] / EM,
  kAdvEm: FELL_DP.glyphs.k.adv / EM,
  bowlREm: BOWL.r / EM,
  tittleREm: TITTLE.r / EM,
};

/** Quill a glyph's closed contours; the outer contour's turning sets the heavy side. */
function quillGlyph(cs: Contour[], max: number, seed: number, amp = 0.5) {
  const outer = cs.reduce((a, b) =>
    Math.abs(signedArea(b.pts)) > Math.abs(signedArea(a.pts)) ? b : a,
  );
  const side = signedArea(outer.pts) > 0 ? 1 : -1;
  return cs
    .map((c, i) => {
      const w =
        amp > 0 ? wobble([...c.pts, c.pts[0]!], amp, 70, seed + i * 7) : [...c.pts, c.pts[0]!];
      return quill(w, { min: 0.55, max, side, seed: seed + i, closed: true, step: 2 });
    })
    .join('');
}

const glyphD = (cs: Contour[]) => cs.map((c) => toD(c.pts, true)).join('');

export type Pass = {
  key: string;
  name: string;
  /** Where the key letter sits, under the letter. */
  keyAt: MP;
  box: [number, number, number, number];
};

export function build(S: Sheet, wide: boolean) {
  const rand = mulberry32(wide ? 4101 : 4102);
  const ascY = S.yb - FELL_DP.glyphs.k.bbox[3] * S.s;
  const xhY = S.yb - FELL_DP.xHeight * S.s;
  const left = S.x0 - (wide ? 14 : 8);
  const right = S.end + (wide ? 12 : 8);

  // ── construction: the ruling under every letter ──
  const ruling = [
    { y: ascY, name: 'ascender' },
    { y: xhY, name: 'x-height' },
    { y: S.yb, name: 'baseline' },
  ];
  const axes: number[] = [
    at(S, 0, 255, 0)[0],
    at(S, 1, 284, 0)[0],
    at(S, 2, 296, 0)[0],
    at(S, 3, 250, 0)[0],
    at(S, 3, 812, 0)[0],
    at(S, 4, 255, 0)[0],
  ];
  const shoulder = toSheet(S, 2, SHOULDER);

  // ── A · scribble: searching lines over the k's skeleton (the founder's stroke replaces it) ──
  const sk = (pts: [number, number][]) => pts.map(([x, y]) => at(S, 0, x, y));
  const skeleton: MP[][] = [
    sk([
      [255, -6],
      [252, 700],
      [258, 1446],
    ]),
    sk([
      [338, 520],
      [610, 735],
      [880, 892],
    ]),
    sk([
      [505, 615],
      [700, 300],
      [905, 22],
    ]),
    sk([
      [56, 26],
      [445, 22],
    ]),
    sk([
      [530, 880],
      [915, 900],
    ]),
    sk([
      [548, 4],
      [950, 6],
    ]),
    sk([
      [36, 1338],
      [150, 1400],
      [300, 1452],
    ]),
  ];
  const amp = wide ? 2.2 : 1.1;
  const scribble: string[] = [];
  skeleton.forEach((pts, i) => {
    const smooth =
      pts.length === 3 ? quad(pts[0]!, pts[1]!, pts[2]!, 3) : line(pts[0]!, pts[1]!, 3);
    for (const p of searching(smooth, i < 3 ? 3 : 2, amp, 900 + i * 31)) {
      scribble.push(quill(p, { min: 0.25, max: wide ? 1.15 : 0.8, seed: 77 + i, side: 1 }));
    }
  });
  // A faint trace of the real outline, as if the hand had felt for it once.
  const kTrace = contours('k', S, 0).map((c) =>
    quill(wobble([...c.pts, c.pts[0]!], amp * 0.9, 50, 515), {
      min: 0.2,
      max: 0.7,
      seed: 516,
      closed: true,
    }),
  );

  // ── B · rule: the i built from ruled lines and a compass ──
  const iC = (x: number, y: number) => at(S, 1, x, y);
  const ruled: MP[][] = [
    [iC(196, 64), iC(196, 706)],
    [iC(378, 64), iC(378, 872)],
    [iC(196, 700), iC(80, 776)],
    [iC(80, 774), iC(80, 800)],
    [iC(78, 798), iC(392, 874)],
    [iC(22, 0), iC(497, 0)],
    [iC(24, 38), iC(126, 50)],
    [iC(446, 50), iC(497, 22)],
    [iC(24, 38), iC(24, -2)],
    [iC(497, 24), iC(497, -2)],
  ];
  const bracket = (cx: number, cy: number, a0: number, a1: number) =>
    arc(iC(cx, cy), 70 * S.s, a0, a1, 2);
  // Compass brackets joining the stem to the foot serif (screen angles).
  const brackets = [
    bracket(126, 120, 0, -Math.PI / 2 + Math.PI),
    bracket(448, 120, Math.PI, Math.PI / 2),
  ];
  const tittle = toSheet(S, 1, TITTLE);

  // ── C · ink: quill contour + hatching inside the r ──
  const rCs = contours('r', S, 2);
  const rBox = bbox(rCs.flatMap((c) => c.pts));
  const rQuill = quillGlyph(rCs, wide ? 2.4 : 1.4, 300);
  const rHatch = fillHatch(rBox, { gap: wide ? 3.1 : 2.4, weight: wide ? 0.95 : 0.7, seed: 301 });
  const rHatch2 = hatch(
    [rBox[0] + rBox[2] * 0.35, rBox[1] + rBox[3] * 0.2, rBox[2] * 0.7, rBox[3] * 0.9],
    {
      gap: wide ? 3.6 : 2.8,
      weight: wide ? 0.8 : 0.6,
      slope: 55,
      reach: 0.45,
      seed: 302,
    },
  );

  // ── D · rubric: the u inked solid, then measured ──
  const uCs = contours('u', S, 3);
  const uSolid = glyphD(uCs);
  const uQuill = quillGlyph(uCs, wide ? 2.2 : 1.3, 400, 0.35);
  const midY = S.yb - 700 * S.s;
  const uX = crossings(uCs, midY);
  const stem: [MP, MP] = [
    [uX[0] ?? 0, midY],
    [uX[1] ?? 0, midY],
  ];
  const bowl = toSheet(S, 3, BOWL);

  // ── E · live: the k inked solid and selected ──
  const k2Cs = contours('k', S, 4);
  const k2Solid = glyphD(k2Cs);
  const k2Quill = quillGlyph(k2Cs, wide ? 2.4 : 1.4, 500, 0.35);
  const kb = FELL_DP.glyphs.k.bbox;
  const k2a = at(S, 4, kb[0], kb[3]);
  const k2b = at(S, 4, kb[2], kb[1]);
  const k2Box: [number, number, number, number] = [
    k2a[0],
    k2a[1],
    k2b[0] - k2a[0],
    k2b[1] - k2a[1],
  ];

  const passes: Pass[] = ORDER.map((g, i) => {
    const gb = FELL_DP.glyphs[g].bbox;
    const a = at(S, i, gb[0], gb[3]);
    const b = at(S, i, gb[2], gb[1]);
    return {
      key: 'ABCDE'[i]!,
      name: g,
      keyAt: [S.xs[i]! + (FELL_DP.glyphs[g].adv * S.s) / 2, S.yb + (wide ? 48 : 34)] as MP,
      box: [a[0], a[1], b[0] - a[0], b[1] - a[1]],
    };
  });

  // ── satellites (wide sheet only) ──
  const sat = wide ? satellites(rand) : null;

  return {
    ascY,
    xhY,
    left,
    right,
    ruling,
    axes,
    shoulder,
    scribble,
    kTrace,
    ruled,
    brackets,
    tittle,
    rCs: glyphD(rCs),
    rQuill,
    rHatch,
    rHatch2,
    rBox,
    uSolid,
    uQuill,
    stem,
    bowl,
    k2Solid,
    k2Quill,
    k2Box,
    passes,
    sat,
  };
}

/** F — the quill, rising over "ru"; G — the lit sphere, upper right. */
function satellites(rand: () => number) {
  // F · the quill: nib at the lower left, the feather rising to the upper right.
  const tip: MP = [583, 206];
  const ang = (-31 * Math.PI) / 180;
  const u: MP = [Math.cos(ang), Math.sin(ang)];
  const nrm: MP = [-u[1], u[0]]; // points down-right: the shade side
  const P = (s: number, t: number): MP => [
    tip[0] + u[0] * s + nrm[0] * t,
    tip[1] + u[1] * s + nrm[1] * t,
  ];
  const nibUpper = chain(
    quad(P(0, 0), P(34, -3.2), P(74, -6.6), 2),
    line(P(74, -6.6), P(250, -5.4), 3),
  );
  const nibLower = chain(
    quad(P(0, 0.4), P(30, 2.2), P(46, 3.4), 2),
    quad(P(46, 3.4), P(60, 7.8), P(80, 6.8), 2),
    line(P(80, 6.8), P(250, 5.6), 3),
  );
  const slit = line(P(0, 0.2), P(24, 0.4), 2);
  const scoop = quad(P(46, 3.4), P(58, 1.2), P(78, -1.4), 2);
  const rachis = line(P(250, 0), P(392, 0.6), 3);
  // The vane: a long leaf on the upper side, barbs swept toward the feather's tip.
  const vaneEdge = chain(
    quad(P(206, -6), P(268, -38), P(330, -36), 3),
    quad(P(330, -36), P(372, -30), P(394, -2), 3),
  );
  const lowerVane = chain(
    quad(P(236, 6), P(300, 18), P(352, 14), 3),
    quad(P(352, 14), P(380, 10), P(394, 2), 3),
  );
  const barbs: MP[][] = [];
  for (let s = 214; s <= 382; s += 7 + rand() * 3) {
    const reach = s < 300 ? (s - 206) / 94 : (394 - s) / 94;
    const len = 12 + 26 * Math.max(0, Math.min(1, reach));
    barbs.push(quad(P(s, -1.5), P(s + len * 0.45, -len * 0.55), P(s + len * 0.95, -len * 0.92), 2));
  }
  for (let s = 244; s <= 386; s += 9 + rand() * 3) {
    const len = 6 + 10 * Math.max(0, Math.min(1, (s - 236) / 70, (394 - s) / 40));
    barbs.push(quad(P(s, 1.5), P(s + len * 0.5, len * 0.5), P(s + len, len * 0.9), 2));
  }
  const barrelShade = hatch([P(80, 0)[0], P(250, 0)[1] - 6, 160, 110], {
    gap: 3.6,
    weight: 0.7,
    reach: 0.4,
    seed: 611,
    toward: [nrm[0], nrm[1]],
  });
  const barrelClip = toD(
    chain(line(P(78, 0.5), P(250, 0.5), 4), line(P(250, 5.8), P(78, 7), 4)),
    true,
  );

  // G · the lit sphere: light from the upper left, shade and cast shadow lower right.
  const c: MP = [1114, 70];
  const r = 40;
  const outline = chain(arc(c, r, Math.PI, 2 * Math.PI, 2), arc(c, r, 0, Math.PI, 2));
  const sphereShade = hatch([c[0] - r, c[1] - r, 2 * r, 2 * r], {
    gap: 3.6,
    weight: 0.85,
    reach: 0.72,
    seed: 701,
    toward: [1, 1],
  });
  const sphereCore = hatch([c[0] - r * 0.2, c[1] - r * 0.1, r * 1.3, r * 1.2], {
    gap: 3.0,
    weight: 0.8,
    reach: 0.38,
    seed: 702,
    slope: 35,
    toward: [1, 1],
  });
  const ground = line([c[0] - 46, c[1] + r + 10], [c[0] + 70, c[1] + r + 10], 3);
  const castC: MP = [c[0] + 24, c[1] + r + 10];
  const cast = ellipse(castC, 40, 6.5, 0, 0, Math.PI * 2, 2);
  const castHatch = hatch([castC[0] - 40, castC[1] - 7, 80, 14], {
    gap: 3.4,
    weight: 0.7,
    reach: 0.8,
    seed: 703,
    toward: [1, 0],
  });
  const lightFrom: MP = [c[0] - r - 44, c[1] - r - 26];
  const lightTo: MP = [c[0] - r * 0.7071, c[1] - r * 0.7071];

  return {
    quill: {
      contour: [
        quill(wobble(nibUpper, 0.35, 60, 601), { min: 0.6, max: 1.8, seed: 602 }),
        quill(wobble(nibLower, 0.35, 60, 603), { min: 0.6, max: 2.0, seed: 604, side: -1 }),
        quill(slit, { min: 0.3, max: 0.9, seed: 605 }),
        quill(scoop, { min: 0.4, max: 1.2, seed: 606, side: -1 }),
        quill(rachis, { min: 0.6, max: 1.6, seed: 607 }),
        quill(wobble(vaneEdge, 0.6, 50, 608), { min: 0.4, max: 1.3, seed: 609 }),
        quill(wobble(lowerVane, 0.5, 50, 610), { min: 0.35, max: 1.1, seed: 611, side: -1 }),
      ],
      barbs: barbs.map((b, i) => quill(b, { min: 0.18, max: 0.62, seed: 620 + i })),
      shade: barrelShade,
      shadeClip: barrelClip,
      keyAt: P(150, 26),
      box: bbox([...nibUpper, ...nibLower, ...vaneEdge, ...lowerVane]),
    },
    sphere: {
      c,
      r,
      contour: quill(outline, { min: 0.7, max: 2.3, seed: 704, closed: true }),
      shade: sphereShade,
      core: sphereCore,
      ground: quill(ground, { min: 0.4, max: 1.0, seed: 705 }),
      cast: toD(cast, true),
      castHatch,
      lightFrom,
      lightTo,
      keyAt: [c[0] + r + 14, c[1] - r + 6] as MP,
    },
  };
}

export const GEOM_WIDE = build(WIDE, true);
export const GEOM_PHONE = build(PHONE, false);
