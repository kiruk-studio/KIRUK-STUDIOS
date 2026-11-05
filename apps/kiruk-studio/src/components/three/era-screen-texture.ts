/**
 * The portfolio page, painted into a texture.
 *
 * The reflection needs real text — a name, project titles, numbers — and a
 * fragment shader is the wrong tool for glyphs. This paints this portfolio's
 * own content, in the idiom of the selected era (see era-portfolio-page), onto
 * a 2D canvas once per era change; the shader then scrolls it, warps it, and
 * mirrors it into the cornea.
 *
 * The canvas is one column, laid out at the width the shader samples, so
 * nothing is cropped by the reflection.
 */

import * as THREE from 'three';
import { getEraPage, type PageBlock } from '@/lib/era-portfolio-page';

export const CODE_W = 1024;
export const CODE_H = 2048;

const PAD_X = 70;
const COL = CODE_W - PAD_X * 2;

const FACES = {
  mono: `"IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace`,
  serif: `"Times New Roman", Georgia, serif`,
  sans: `Verdana, Geneva, "DejaVu Sans", sans-serif`,
  grotesk: `"Inter", "Helvetica Neue", Arial, sans-serif`,
} as const;

export interface CodePalette {
  bg: string;
  ink: string;
  panel: string;
  accent: string;
  bar: string;
}

/** Greedy wrap against the painted column. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Mixes two hex colours — used to sit metadata between ink and ground. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const s = h.replace('#', '');
    const f =
      s.length === 3
        ? s
            .split('')
            .map((c) => c + c)
            .join('')
        : s;
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

/** Draws one block at `y`, returns the y it ended at. */
function drawBlock(
  ctx: CanvasRenderingContext2D,
  block: PageBlock,
  face: string,
  pal: CodePalette,
  y: number,
): number {
  const dim = mixHex(pal.ink, pal.bg, 0.45);

  switch (block.t) {
    case 'title': {
      ctx.font = `700 62px ${face}`;
      ctx.fillStyle = pal.ink;
      for (const line of wrap(ctx, block.text, COL)) {
        ctx.fillText(line, PAD_X, y);
        y += 70;
      }
      return y + 10;
    }
    case 'sub': {
      ctx.font = `600 32px ${face}`;
      ctx.fillStyle = pal.accent;
      ctx.fillText(block.text, PAD_X, y);
      return y + 46;
    }
    case 'nav': {
      ctx.font = `500 28px ${face}`;
      let x = PAD_X;
      for (const item of block.items) {
        ctx.fillStyle = x === PAD_X ? pal.accent : dim;
        ctx.fillText(item, x, y);
        x += ctx.measureText(item).width + 40;
      }
      return y + 52;
    }
    case 'rule': {
      ctx.fillStyle = mixHex(pal.ink, pal.bg, 0.7);
      ctx.fillRect(PAD_X, y + 12, COL, 3);
      return y + 40;
    }
    case 'body': {
      ctx.font = `400 32px ${face}`;
      ctx.fillStyle = pal.ink;
      for (const line of wrap(ctx, block.text, COL)) {
        ctx.fillText(line, PAD_X, y);
        y += 42;
      }
      return y + 6;
    }
    case 'item': {
      ctx.font = `400 32px ${face}`;
      ctx.fillStyle = pal.panel;
      ctx.fillRect(PAD_X, y + 14, 16, 4);
      ctx.fillStyle = pal.ink;
      const [first] = wrap(ctx, block.text, COL - 40);
      ctx.fillText(first, PAD_X + 40, y);
      return y + 46;
    }
    case 'card': {
      const h = 106;
      ctx.fillStyle = mixHex(pal.bg, pal.ink, 0.09);
      ctx.fillRect(PAD_X, y - 6, COL, h);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(PAD_X, y - 6, 8, h);
      ctx.font = `600 34px ${face}`;
      ctx.fillStyle = pal.ink;
      const [title] = wrap(ctx, block.title, COL - 60);
      ctx.fillText(title, PAD_X + 28, y + 12);
      ctx.font = `400 26px ${face}`;
      ctx.fillStyle = dim;
      const [meta] = wrap(ctx, block.meta, COL - 60);
      ctx.fillText(meta, PAD_X + 28, y + 58);
      return y + h + 18;
    }
    case 'stat': {
      ctx.font = `700 54px ${face}`;
      ctx.fillStyle = pal.accent;
      ctx.fillText(block.value, PAD_X, y);
      const w = ctx.measureText(block.value).width;
      ctx.font = `400 28px ${face}`;
      ctx.fillStyle = dim;
      ctx.fillText(block.label, PAD_X + w + 24, y + 22);
      return y + 74;
    }
    case 'gap':
      return y + 34;
  }
}

/** Measures once, then paints the page twice so the shader can scroll forever. */
export function paintEraPage(ctx: CanvasRenderingContext2D, eraId: string, palette: CodePalette) {
  const { blocks, face } = getEraPage(eraId);
  const font = FACES[face];

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, CODE_W, CODE_H);
  ctx.textBaseline = 'top';

  // one dry run for the page height, so the repeat seam lands on a whole page
  let height = 60;
  for (const b of blocks) height = drawBlock(ctx, b, font, palette, height);
  height += 60;
  // that dry run painted; clear and lay it out for real, tiled
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, CODE_W, CODE_H);

  const page = Math.max(height, 400);
  for (let top = 0; top < CODE_H + page; top += page) {
    ctx.save();
    ctx.translate(0, top);
    ctx.beginPath();
    ctx.rect(0, 0, CODE_W, page);
    ctx.clip();
    let y = 60;
    for (const b of blocks) y = drawBlock(ctx, b, font, palette, y);
    ctx.restore();
  }
}

export interface EraScreenTexture {
  texture: THREE.CanvasTexture;
  /** Repaints only when the era or its palette actually changed. */
  update: (eraId: string, palette: CodePalette) => void;
  dispose: () => void;
}

export function createEraScreenTexture(): EraScreenTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CODE_W;
  canvas.height = CODE_H;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;

  let key = '';

  return {
    texture,
    update(eraId, palette) {
      const next = `${eraId}|${palette.bg}|${palette.ink}|${palette.panel}|${palette.accent}|${palette.bar}`;
      if (next === key) return;
      key = next;
      paintEraPage(ctx, eraId, palette);
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
    },
  };
}
