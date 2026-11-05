/**
 * The skin's face-space detail, baked once, so the lid shader reads textures
 * instead of evaluating noise at every pixel (it was the frame's dearest pass).
 *
 *  · The tile: 6 mm square, repeating across the face, for what is fine and
 *    the same everywhere. Each noise's cells divide the tile exactly, so the
 *    tile repeats without a seam.
 *      R  pores        — a mask, about 15 cells per mm
 *      G  grain        — two fine noises, averaged
 *      B  sheen        — the oily sheen's pore-scale variation
 *      A  bumps        — the caruncle's lumpiness
 *  · The map: the face round the eye, for what is broad.
 *      R  mottle       — the skin's unevenness, three octaves
 *      G  freckles     — clustered specks (none, for the eye's person)
 *      B  crow's feet  — fanning from the outer corner (where the person's
 *                        lids put it: the fissure and their canthal tilt)
 *
 * Both are mipmapped, which also takes out the shimmer the procedural noise
 * had where its cells were smaller than a pixel.
 */

import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  RepeatWrapping,
  type WebGPURenderer,
} from 'three/webgpu';
import { fbm, hash21, type N, smoothstepDown, vnoise } from '../nodes/common';
import { fissureAngles, MARGIN_RADIUS } from '../nodes/margins';
import { T } from '../nodes/tsl';

const { Fn, abs, atan, float, floor, fract, length, mix, mod, pow, smoothstep, uv, vec2, vec4 } = T;

/** The tile's side, mm. */
export const SKIN_TILE_MM = 6;
/** The map's extent on the face, mm (x lateral +, y up). */
export const SKIN_MAP = { x0: -32, y0: -24, w: 64, h: 48 } as const;

/** Value noise whose lattice repeats every `period` cells (common.ts vnoise, wrapped). */
function vnoiseTiled(p: N, period: number): N {
  const i = floor(p).toVar();
  const f = fract(p);
  const u = f.mul(f).mul(f.mul(-2).add(3)).toVar();
  const w = (c: N) => mod(c, period);
  const a = hash21(w(i));
  const b = hash21(w(i.add(vec2(1, 0))));
  const c = hash21(w(i.add(vec2(0, 1))));
  const d = hash21(w(i.add(vec2(1, 1))));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

export interface SkinFaceBake {
  tile: RenderTarget;
  map: RenderTarget;
  /** Renders once; later calls do nothing. */
  render: (renderer: WebGPURenderer) => boolean;
  /**
   * Bakes again on the next `render`. On WebGPU the stage's first frames
   * build pipelines asynchronously and skip any draw not ready yet, which
   * includes a bake's one draw; the stage redoes every bake once it is warm.
   */
  redo: () => void;
  dispose: () => void;
}

function target(w: number, h: number, repeat: boolean, name: string) {
  const t = new RenderTarget(w, h, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  });
  t.texture.wrapS = t.texture.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  t.texture.name = name;
  return t;
}

/** @param tiltDeg the person's canthal tilt (identity.ts), which places the outer corner */
export function createSkinFaceBake(tiltDeg: number, tileRes = 512, mapRes = 512): SkinFaceBake {
  const tile = target(tileRes, tileRes, true, 'SkinTile');
  const map = target(mapRes, Math.round((mapRes * SKIN_MAP.h) / SKIN_MAP.w), false, 'SkinMap');
  const S = SKIN_TILE_MM;

  // (the same noises, frequencies and offsets the lid shader used, so the skin looks as it did)
  const tileMat = new NodeMaterial();
  tileMat.name = 'SkinTileBake';
  tileMat.fragmentNode = Fn(() => {
    const P = uv().mul(S).toVar();
    const pore = smoothstep(0.62, 0.88, vnoiseTiled(P.mul(15).add(11.7), 15 * S));
    const grain = vnoiseTiled(P.mul(14).add(3.1), 14 * S)
      .add(vnoiseTiled(P.mul(23).add(8.4), 23 * S))
      .mul(0.5);
    const sheen = vnoiseTiled(P.mul(24).add(2.2), 24 * S);
    const bumps = vnoiseTiled(P.mul(5.5).add(2.1), 5.5 * S);
    return vec4(pore, grain, sheen, bumps);
  })();
  tileMat.depthTest = false;
  tileMat.depthWrite = false;

  const mapMat = new NodeMaterial();
  mapMat.name = 'SkinMapBake';
  mapMat.fragmentNode = Fn(() => {
    const P = vec2(
      uv().x.mul(SKIN_MAP.w).add(SKIN_MAP.x0),
      uv().y.mul(SKIN_MAP.h).add(SKIN_MAP.y0),
    ).toVar();
    const mottle = fbm(P.mul(0.22).add(17.3));
    const speck = smoothstep(0.8, 0.88, vnoise(P.mul(4.2).add(7.1)));
    const cluster = smoothstep(0.45, 0.85, vnoise(P.mul(0.28).add(3.3)));
    const tilt = (tiltDeg * Math.PI) / 180;
    const phiL = fissureAngles().phiL;
    const outer = vec2(Math.sin(phiL) * Math.cos(tilt), Math.sin(tilt)).mul(MARGIN_RADIUS);
    const rel = P.sub(outer);
    const fromOuter = length(rel);
    const ang = atan(rel.y, rel.x);
    const crows = pow(
      float(1).sub(
        abs(
          vnoise(vec2(ang.mul(14), fromOuter.mul(0.15)))
            .mul(2)
            .sub(1),
        ),
      ),
      4,
    )
      .mul(smoothstep(3, 6, fromOuter))
      .mul(smoothstepDown(17, 9, fromOuter))
      .mul(smoothstepDown(0.9, 0.4, abs(ang)));
    return vec4(mottle, speck.mul(cluster), crows, float(1));
  })();
  mapMat.depthTest = false;
  mapMat.depthWrite = false;

  const tileQuad = new QuadMesh(tileMat);
  const mapQuad = new QuadMesh(mapMat);
  let done = false;
  return {
    tile,
    map,
    redo() {
      done = false;
    },
    render(renderer) {
      if (done) return false;
      done = true;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(tile);
      tileQuad.render(renderer);
      renderer.setRenderTarget(map);
      mapQuad.render(renderer);
      renderer.setRenderTarget(prev);
      return true;
    },
    dispose() {
      tile.dispose();
      map.dispose();
      tileMat.dispose();
      mapMat.dispose();
    },
  };
}
