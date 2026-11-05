/**
 * The tear film over the cornea, simulated on a small square map of the
 * cornea's disc (film coordinates: x right, y up, ±1 at the limbus). It rides
 * with the cornea, so it turns with the gaze.
 *
 *   R  thickness, 1 fresh … 0 dry      G  the lipid layer's pattern, 0..1
 *   B  where the film is weak, laid down with it (new each blink)
 *
 * What it does, per step:
 *  · a blink renews it: while the lid is shut the film is laid down fresh,
 *    with a new pattern in the lipid layer;
 *  · for a second after the lid opens, the lipid layer is dragged upward
 *    after it (the film creeps up), carrying its pattern;
 *  · it thins everywhere, slowly, and fast over weak spots: after about
 *    eight seconds without a blink those spots break up (tear break-up time),
 *    and spread as the film around them drains into them;
 *  · it smooths itself a little (surface tension), so nothing in it is sharp.
 *
 * The plan called for compute on WebGPU and a ping-pong pass on WebGL2. At
 * 128² or 256² the pass is a few thousand texels, so one fragment ping-pong
 * serves both backends: the same graph, no second code path. Each step writes
 * a scratch target and a copy brings it back, so everything that samples the
 * film reads one texture that never changes identity.
 *
 * The noise behind the weak spots and the lipid pattern is only worked out
 * when the film is laid down (a branch on a uniform, the same for every
 * texel), and carried after that, so an ordinary step is five samples.
 *
 * T1 runs no simulation: the film is laid down once, fresh, and stays. Nor
 * does anything step while nothing can change it (reduced motion).
 */

import {
  HalfFloatType,
  LinearFilter,
  NodeMaterial,
  QuadMesh,
  RenderTarget,
  type Texture,
  type WebGPURenderer,
} from 'three/webgpu';
import { fbm, smoothstepDown } from '../nodes/common';
import { T } from '../nodes/tsl';

const { Fn, If, clamp, float, length, mix, smoothstep, texture, uniform, uv, vec2, vec4 } = T;

export type TearMode = 'static' | 'sim128' | 'sim256';

export interface TearFilm {
  /** The film, for the cornea and the debug view. */
  target: RenderTarget;
  /** The simulation's inputs, written by the stage each frame. */
  inputs: {
    /** 1 while the lid is shut: lay the film down fresh. */
    fresh: { value: number };
    /** How fast the film is being dragged upward, film units per second. */
    creep: { value: number };
    /** Changes with every blink, so the weak spots and the lipid pattern do. */
    seed: { value: number };
  };
  /**
   * Advances the film by `dt` seconds, at the tier's rate. With `live` off
   * (nothing can change it) and on T1 it renders nothing after the first.
   */
  step: (renderer: WebGPURenderer, dt: number, live: boolean) => void;
  /** Lab: lays the film down fresh now. */
  reset: () => void;
  quads: QuadMesh[];
  dispose: () => void;
}

export function createTearFilm(mode: TearMode): TearFilm {
  const size = mode === 'sim256' ? 256 : 128;
  const hz = mode === 'sim256' ? 60 : 30;
  const opts = {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    generateMipmaps: false,
  };
  const target = new RenderTarget(size, size, opts);
  target.texture.name = 'TearFilm';
  const scratch = new RenderTarget(size, size, opts);

  const dtU = uniform(1 / hz);
  const fresh = uniform(1);
  const creep = uniform(0);
  const seed = uniform(0);

  const sim = new NodeMaterial();
  sim.name = 'TearFilmStep';
  sim.fragmentNode = Fn(() => {
    const src = texture(target.texture as Texture);
    const at = uv().toVar();
    // film coordinates, y up
    const f = vec2(at.x.mul(2).sub(1), float(1).sub(at.y.mul(2))).toVar();
    const px = 1 / size;
    // dragged upward: what is here now was a little lower a moment ago
    const from = at.add(vec2(0, creep.mul(dtU).mul(0.5))).toVar();
    const c = src.sample(from).toVar();
    const n4 = src
      .sample(from.add(vec2(px, 0)))
      .add(src.sample(from.sub(vec2(px, 0))))
      .add(src.sample(from.add(vec2(0, px))))
      .add(src.sample(from.sub(vec2(0, px))))
      .mul(0.25);
    const lap = n4.sub(c);

    // ~2 %/s everywhere, up to ~10 %/s over a weak spot: dry by eight seconds
    const spots = smoothstep(0.5, 0.74, c.b);
    const rate = spots.mul(0.085).add(0.018);
    const out = vec4(
      clamp(c.r.add(lap.r.mul(0.25)).sub(rate.mul(dtU)), 0, 1.2),
      c.g.add(lap.g.mul(0.12)),
      c.b,
      1,
    ).toVar();

    // laid down fresh: thickness with a faint unevenness, a new lipid pattern,
    // and new weak spots, where it will break up first
    If(fresh.greaterThan(0.5), () => {
      const pattern = fbm(f.mul(3.1).add(seed.mul(3.7).add(11)));
      const weak = fbm(f.mul(2.4).add(seed.mul(7.13)));
      out.assign(vec4(pattern.sub(0.5).mul(0.08).add(1), pattern, weak, 1));
    });
    // nothing outside the limbus matters; keep it fresh so sampling at the rim is clean
    const inside = smoothstepDown(1.08, 1, length(f));
    return vec4(
      mix(float(1), out.r, inside),
      mix(float(0.5), out.g, inside),
      mix(float(0), out.b, inside),
      1,
    );
  })();
  sim.depthTest = false;
  sim.depthWrite = false;

  const copy = new NodeMaterial();
  copy.name = 'TearFilmCopy';
  copy.fragmentNode = texture(scratch.texture as Texture, uv());
  copy.depthTest = false;
  copy.depthWrite = false;

  const simQuad = new QuadMesh(sim);
  const copyQuad = new QuadMesh(copy);
  let owed = 0;
  let laid = false;

  const run = (renderer: WebGPURenderer) => {
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(scratch);
    simQuad.render(renderer);
    renderer.setRenderTarget(target);
    copyQuad.render(renderer);
    renderer.setRenderTarget(prev);
  };

  return {
    target,
    inputs: { fresh, creep, seed },
    quads: [simQuad, copyQuad],
    step(renderer, dt, live) {
      if (!laid) {
        // the first step lays the film down, whatever the inputs say
        const was = fresh.value;
        fresh.value = 1;
        dtU.value = 1 / hz;
        run(renderer);
        fresh.value = was;
        laid = true;
        return;
      }
      if (mode === 'static' || !live) return;
      owed += Math.min(dt, 0.25);
      if (owed < 1 / hz) return;
      dtU.value = Math.min(owed, 2 / hz);
      owed = 0;
      run(renderer);
    },
    reset() {
      laid = false;
    },
    dispose() {
      target.dispose();
      scratch.dispose();
      sim.dispose();
      copy.dispose();
    },
  };
}
