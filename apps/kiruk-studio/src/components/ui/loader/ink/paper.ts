/**
 * The loader's sheet and its inks, for each paper of the dawn (ideas/studio-dawn/eye.md):
 *
 *   old  Dawn Light #fadfa9 · iron-gall ink · the construction in sanguine
 *   new  Dawn Departs #ccffff · dawn navy · the construction in blueprint blue
 *
 * The visitor's paper is remembered by the landing (`kiruk-dawn`); the loader
 * draws on the same one, so the eye is drawn on the sheet it will live on.
 * Ink and chalk are given as they look multiplied into their paper (the burin
 * engine's compose), so the canvas can lay them flat.
 *
 * Paper and ink hex values mirror color.dawn.* (openspec/changes/dawn-paper-tokens);
 * the studio does not import token CSS yet, same as eye.css.
 */

export type Dawn = 'old' | 'new';

export interface Sheet {
  /** The paper (color.dawn.light / color.dawn.departs). */
  paper: string;
  /** Dry ink, multiplied into the paper. */
  ink: string;
  /** Fresh ink, before it oxidises: blue-black for iron-gall. */
  wet: string;
  /** The construction's chalk, multiplied into the paper. */
  chalk: string;
  /** The page's type and the rubric (color.dawn.iron-gall · navy, color.dawn.rubric). */
  text: string;
  rubric: string;
  /** The sheet's tooth and fibres, and the aged edge round it. */
  grain: [number, number, number];
  edge: string;
  lamp: string;
}

export const SHEETS: Record<Dawn, Sheet> = {
  old: {
    paper: '#fadfa9',
    ink: '#231a12',
    wet: '#141725',
    chalk: '#bb663f',
    text: '#231a14',
    rubric: '#983a22',
    grain: [0.42, 0.3, 0.16],
    edge: 'rgba(112, 70, 24, 0.17)',
    lamp: 'rgba(255, 249, 232, 0.42)',
  },
  new: {
    paper: '#ccffff',
    ink: '#1a1c2d',
    wet: '#0d1330',
    chalk: '#4f7fd0',
    text: '#1d1c2d',
    rubric: '#983a22',
    grain: [0.22, 0.32, 0.4],
    edge: 'rgba(24, 52, 80, 0.14)',
    lamp: 'rgba(255, 255, 255, 0.4)',
  },
};

/** The visitor's paper, as the landing remembers it. Old paper when nothing is stored. */
export function readDawn(): Dawn {
  try {
    return localStorage.getItem('kiruk-dawn') === 'new' ? 'new' : 'old';
  } catch {
    return 'old';
  }
}

/** Tooth and laid fibres as a seamless tile, so the sheet is paper and not a flat colour. */
function grainTile([r, g, b]: Sheet['grain']) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='f' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.2' numOctaves='2' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0.32 0 0 0 -0.11'/></filter><filter id='t' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0.5 0 0 0 -0.19'/></filter><rect width='256' height='256' filter='url(#f)'/><rect width='256' height='256' filter='url(#t)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The sheet: paper, a lamp, an aged edge, and the grain, as CSS properties. */
export function sheetStyle(d: Dawn) {
  const s = SHEETS[d];
  return {
    backgroundColor: s.paper,
    backgroundImage: `radial-gradient(ellipse 70% 62% at 46% 38%,${s.lamp},rgba(255,255,255,0) 72%),radial-gradient(ellipse 88% 82% at 50% 50%,rgba(0,0,0,0) 54%,${s.edge} 100%),${grainTile(s.grain)}`,
    backgroundSize: 'auto,auto,256px 256px',
  } as const;
}

/** The same sheet as CSS declarations, for the boot frame painted before the app. */
export function sheetCss(d: Dawn): string {
  const s = sheetStyle(d);
  return `background-color:${s.backgroundColor};background-image:${s.backgroundImage};background-size:${s.backgroundSize}`;
}
