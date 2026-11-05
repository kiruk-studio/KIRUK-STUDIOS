'use client';
/**
 * Binds the burin engine to the page.
 *
 * CSS is the single source of geometry: .eye-box, .studies and .platemark are
 * placed with the page's custom properties, and the engine reads their rects, so
 * the GPU eye and the DOM type (letters, guides, title) can never drift apart.
 *
 * Each frame asks only for the passes it needs: the ink pass when the eye or its light
 * moves, the bleed while anything is wet or fading, the compose while the raking light
 * drifts (≈9 fps at rest, nothing at all under reduced motion once still).
 *
 * One light: the pointer moves it, and it lights both the paper (with a slow drift) and
 * the eye (without, so a still page never re-cuts the engraving).
 *
 *   drag on the plate   calipers: measure between any two points, ends snap to landmarks
 *   shift + drag        a wet brush: the paper takes water, the ink bleeds, then dries and fades
 *   M                   calipers out: the snap shows under the pointer, and a drag measures over the type too
 *   U                   the unit: d (the iris) · mm · px · Paris lines
 *   W                   the construction: faint · full · hidden
 *   C                   make it again: the construction, then each pass cut across the eye
 *   click the eye / B   a blink
 *   hold L              held to the light
 *   on first print      the sheet is damp, as intaglio paper is: every line blooms a little, then dries
 *   H                   the hand on the plate, or the plain print
 *   I                   a new impression: the hand colours the print again, differently
 *
 * The hand (ideas/studio-dawn/hand.md): once the plate has printed, p5.brush colours this
 * impression in a worker — red chalk under the cut, bistre washes, the iris, lead white, the
 * quill — and the engine lays the sheets into its paper. Each visit is its own impression.
 *
 * With HTML-in-Canvas the overlay (all the page's type) moves inside a transparent
 * <canvas layoutsubtree> laid over the stage and is printed into the paper on the
 * GPU; without it the same overlay renders in place. Either way it stays real DOM.
 *
 * spec-link: ideas/studio-dawn/eye.md · skill: kiruk-burin
 */
import type { HandClient, HandSheet } from '@kiruk/burin/hand';
import { createHtmlPlate } from '@kiruk/burin/plate';
import { landmarks, type Pose, UNITS } from '@kiruk/burin/rig';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { actions, eyeStore, type HandState, newImpression } from './store';

type Rect = [number, number, number, number];

declare global {
  interface Window {
    __burin?: {
      ready: boolean;
      backend: string;
      plate: boolean;
      stats: () => { ms: number; fps: number };
      hold: (on: boolean) => void;
      blink: () => void;
      look: (x: number, y: number) => void;
      age: (v: number) => void;
      wet: (x: number, y: number, r?: number) => void;
      settle: () => Promise<void>;
      probe: (x: number, y: number) => Promise<number[]>;
      debug: () => Record<string, number>;
      /** boot timings, ms from mount: the plate printing type, the engine ready, the first frame */
      timing: () => Record<string, number>;
      dawn: (v: 0 | 1) => void;
      wire: (v: number) => void;
      point: (x: number, y: number) => void;
      make: () => void;
      /** the hand: its client's state, the impression, and what shows */
      hand: () => Record<string, unknown>;
      /** paint an impression (a given seed, or a new one) without replaying it */
      impression: (seed?: number) => void;
      /** one medium (chalk · wash · ink · body · iris) on or off */
      handMedia: (m: string, on: boolean) => void;
      /** the hand's sheets as PNG data URLs, as p5.brush painted them (proofs) */
      handLayers: () => Record<string, string>;
    };
  }
}

const rectOf = (sel: string): Rect => {
  const el = document.querySelector(sel);
  if (!el) return [0, 0, 0, 0];
  const r = el.getBoundingClientRect();
  if (r.width < 2 || getComputedStyle(el).display === 'none') return [0, 0, 0, 0];
  return [r.left, r.top, r.width, r.height];
};

/** The same rates the bleed shader uses, for the instrument's estimate of the wet sheet. */
const EVAP = 0.55;
const FADE = 0.06;

export function EyeEngine({ overlay }: { overlay: ReactNode }) {
  const gpuRef = useRef<HTMLCanvasElement>(null);
  const plateRef = useRef<HTMLCanvasElement>(null);
  const [plateMode, setPlateMode] = useState(false);
  const [phase, setPhase] = useState<'ssr' | 'ready'>('ssr');

  useEffect(() => {
    let ok = false;
    try {
      ok =
        'requestPaint' in HTMLCanvasElement.prototype &&
        'drawElementImage' in CanvasRenderingContext2D.prototype;
    } catch {
      ok = false;
    }
    setPlateMode(ok);
    setPhase('ready');
  }, []);

  useEffect(() => {
    if (phase !== 'ready') return;
    const gpu = gpuRef.current;
    if (!gpu) return;
    const page = gpu.closest<HTMLElement>('.eye-page');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;
    let raf = 0;
    let engine: Awaited<ReturnType<typeof import('@kiruk/burin')['createEyeEngine']>> | null = null;
    let plate: { dispose: () => void } | null = null;
    let motion: ReturnType<typeof import('@kiruk/burin')['createEyeMotion']> | null = null;
    let geo = {
      eye: [0, 0, 1] as [number, number, number],
      strip: [0, 0, 0, 0] as Rect,
      plate: [0, 0, 0, 0] as Rect,
      mark: [0, 0, 0, 0] as Rect,
    };
    let inkDirty = true;
    let composeDirty = true;
    let lastPose = '';
    let last = performance.now();
    let pushAt = 0;
    let frames = 0;
    let fpsAt = performance.now();
    let fps = 0;
    let ms = 0;
    let pointer: [number, number] = [window.innerWidth * 0.3, window.innerHeight * 0.25];
    let lamp: [number, number] = [window.innerWidth * 0.25, window.innerHeight * 0.15];
    // The wet sheet.
    let bleedUntil = 0;
    let dampUntil = 0;
    let brushing = false;
    let moved = false;
    let down: [number, number] = [0, 0];
    let lastBrush: [number, number] | null = null;
    let stroke: { x: number; y: number; px: number; py: number } | null = null;
    // The dawn: old paper (Dawn Light) or new (Dawn Departs), remembered between visits.
    let dawnTarget: 0 | 1 = localStorage.getItem('kiruk-dawn') === 'new' ? 1 : 0;
    let dawn = dawnTarget as number;
    let dawnV = 0;
    page?.setAttribute('data-dawn', dawnTarget ? 'new' : 'old');
    // The page type crosses with the GPU paper: CSS mixes --paper and --ink from this one number.
    page?.style.setProperty('--dawn', String(dawn));
    eyeStore.set({ dawn, dawnTarget });
    // The light on the eye (radians): it eases toward where the pointer puts it.
    let sunAz = -2.36;
    let sunEl = 0.64;
    let lastCompose = 0;
    // The construction over the plate: faint by default, eased on a critical spring.
    let wire = 0.3;
    let wireTarget = 0.3;
    let wireV = 0;
    // Making it again: hold the construction (the hand's chalk goes down meanwhile), then cut each
    // pass across the eye, then the hand colours the print: washes, then lead white and the quill.
    const HOLD = 1.4;
    const PER_PASS = 1.5;
    let make = 5;
    let makeAt = -1;
    let lastPass = 5;
    // The hand: p5.brush in a worker paints this impression; the engine lays it into the paper.
    let hand: HandClient | null = null;
    let closeSheet: ((s: HandSheet | null) => void) | null = null;
    let handGeo = '';
    let handTimer = 0;
    let handLoaded = false;
    // chalk, wash, quill, lead white, iris: each eases on and off.
    const handShow = [0, 0, 0, 0, 0];
    // The hand's passes while it colours: 0 … 3 (chalk, washes, white and quill); 3 at rest.
    let handMake = 3;
    let handMakeAt = -1;
    const HAND_PASS = 1.2;
    let lastHandKey = '';
    const setHandState = (p: Partial<HandState>) =>
      eyeStore.set({ hand: { ...eyeStore.get().hand, ...p } });
    setHandState({ seed: newImpression() });
    // The calipers.
    let poseNow: Pose = { gx: 0, gy: 0, open: 1, pupil: 0.36 };
    let caliperDrag = false;
    let hoverAt = 0;
    let wetEst = 0;
    let stainEst = 0;
    const wetHist = { t: [] as number[], x: [] as number[], v: [] as number[] };
    const settleWaiters: (() => void)[] = [];
    const t0 = performance.now();
    const timing: Record<string, number> = {};

    const measure = () => {
      const [x, y, w] = rectOf('.eye-box');
      const S = w / 3.2;
      const pm = rectOf('.platemark');
      geo = {
        eye: [x + 1.6 * S, y + 1.45 * S, Math.max(S, 1)],
        strip: rectOf('.studies'),
        plate: pm,
        // The countermark, low on the left of the sheet, clear of the studies.
        mark: pm[2] > 0 ? [pm[0] + 150, pm[1] + pm[3] - 150, 200, 1] : [0, 0, 0, 0],
      };
      engine?.resize(window.innerWidth, window.innerHeight);
      inkDirty = true;
      composeDirty = true;
      // A new layout is a new sheet for the hand: the same impression, painted again to fit.
      if (hand) {
        clearTimeout(handTimer);
        handTimer = window.setTimeout(() => {
          const req = handRequest(eyeStore.get().hand.seed);
          if (handKeyOf(req) !== handGeo) paintHand(eyeStore.get().hand.seed, false);
        }, 350);
      }
      eyeStore.set({
        W: window.innerWidth,
        H: window.innerHeight,
        S,
        cx: geo.eye[0],
        cy: geo.eye[1],
      });
    };

    const handRequest = (seed: number) => {
      const [cx, cy, S] = geo.eye;
      const x0 = Math.max(0, Math.floor(cx - 1.78 * S));
      const y0 = Math.max(0, Math.floor(cy - 1.62 * S));
      const x1 = Math.min(window.innerWidth, Math.ceil(cx + 1.78 * S));
      const y1 = Math.min(window.innerHeight, Math.ceil(cy + 1.34 * S));
      return {
        subject: 'eye',
        seed,
        region: [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)] as Rect,
        density: Math.min(window.devicePixelRatio || 1, 1.5),
        params: { eye: [cx, cy, S] },
      };
    };
    const handKeyOf = (req: ReturnType<typeof handRequest>) =>
      `${req.region.join(',')}|${(req.params.eye as number[]).map((v) => v.toFixed(1)).join(',')}`;
    const paintHand = (seed: number, replay: boolean) => {
      if (!hand || !engine || geo.eye[2] < 8) return;
      const req = handRequest(seed);
      handGeo = handKeyOf(req);
      setHandState({ state: 'painting', seed });
      void hand.paint(req).then((sheet) => {
        if (!alive || !engine) {
          closeSheet?.(sheet);
          return;
        }
        const st = hand?.status();
        if (!sheet) {
          // Superseded (a newer layout or impression is being painted), or the hand failed.
          if (st && st.state !== 'painting')
            setHandState({ state: st.state === 'idle' ? 'failed' : st.state, via: st.via });
          return;
        }
        engine.setHand(sheet);
        handLoaded = true;
        composeDirty = true;
        setHandState({ state: 'idle', via: sheet.via, ms: sheet.ms, seed: sheet.seed });
        if (replay && !reduced && makeAt < 0) {
          handMakeAt = performance.now();
          handMake = 0;
        }
      });
    };
    const startHand = async () => {
      if (hand || !alive || !engine) return;
      try {
        const mod = await import('@kiruk/burin/hand');
        if (!alive) return;
        closeSheet = mod.closeSheet;
        hand = mod.createHand({
          worker: () =>
            new Worker(new URL('./hand.worker.ts', import.meta.url), { type: 'module' }),
          local: () => import('./hand-local'),
        });
        paintHand(eyeStore.get().hand.seed, false);
      } catch (err) {
        console.warn('[burin] the hand is unavailable:', err);
        setHandState({ state: 'none' });
      }
    };

    const wetAt = (x: number, y: number, px: number, py: number) => {
      // Several moves can land between frames: keep the stroke joined from its first point.
      stroke = stroke ? { ...stroke, x, y } : { x, y, px, py };
      bleedUntil = performance.now() + 45000;
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!motion || !engine) return;
      const m = motion.step(dt);
      poseNow = m.pose;

      // The light: the pointer sets it (left of the page, light from the left; high, from above).
      const nx = pointer[0] / window.innerWidth - 0.5;
      const ny = pointer[1] / window.innerHeight - 0.5;
      const ks = reduced ? 1 : 1 - Math.exp(-dt * 5);
      sunAz += (-2.36 + nx * 1.25 - sunAz) * ks;
      sunEl += (0.64 - ny * 0.34 - sunEl) * ks;
      const sun: [number, number, number] = [
        Math.cos(sunAz) * Math.cos(sunEl),
        Math.sin(sunAz) * Math.cos(sunEl),
        Math.sin(sunEl),
      ];

      // The construction eases to its target (ω = 6).
      if (wire !== wireTarget) {
        const w = 6;
        const A = wire - wireTarget;
        const B = wireV + w * A;
        const e = Math.exp(-w * dt);
        wire = reduced ? wireTarget : wireTarget + (A + B * dt) * e;
        wireV = reduced ? 0 : (wireV - w * B * dt) * e;
        if (Math.abs(wire - wireTarget) < 1e-3 && Math.abs(wireV) < 1e-2) {
          wire = wireTarget;
          wireV = 0;
        }
      }

      const handOn = eyeStore.get().hand.on && handLoaded;
      if (makeAt >= 0) {
        const e = (t - makeAt) / 1000;
        make = Math.min(5, 1 + Math.max(0, e - HOLD) / PER_PASS);
        // The hand: chalk while the construction holds; its colour once the plate is cut.
        if (handOn)
          handMake =
            Math.min(1, e / HOLD) + Math.min(2, Math.max(0, e - HOLD - 4 * PER_PASS) / PER_PASS);
        const end = handOn ? HOLD + 6 * PER_PASS : HOLD + 4 * PER_PASS;
        if (e >= end) {
          makeAt = -1;
          make = 5;
          handMake = 3;
        }
        // The pass being cut: I while the construction holds, then II … IV, then the plate itself.
        const pass = make >= 5 ? 6 : make <= 1.0001 ? 1 : Math.floor(make) + 1;
        if (pass !== lastPass) {
          lastPass = pass;
          if (page) page.dataset.pass = pass <= 4 ? String(pass) : '';
        }
      }
      const poseKey = `${make.toFixed(3)},${m.pose.gx.toFixed(4)},${m.pose.gy.toFixed(4)},${m.pose.open.toFixed(4)},${m.pose.pupil.toFixed(4)},${m.light.toFixed(3)},${sunAz.toFixed(3)},${sunEl.toFixed(3)},${wire.toFixed(3)}`;
      if (poseKey !== lastPose) {
        lastPose = poseKey;
        inkDirty = true;
      }

      // A new impression: the hand's three passes, one after another.
      if (handMakeAt >= 0) {
        handMake = Math.min(3, (t - handMakeAt) / 1000 / HAND_PASS);
        if (handMake >= 3) handMakeAt = -1;
      }
      // Each medium eases on and off; the whole hand fades in when its first sheet arrives.
      const hs = eyeStore.get().hand;
      const want = [hs.media.chalk, hs.media.wash, hs.media.ink, hs.media.body, hs.iris];
      const kh = reduced ? 1 : 1 - Math.exp(-dt * 7);
      for (let i = 0; i < 5; i++) {
        const target = hs.on && handLoaded && want[i] ? 1 : 0;
        const d = target - handShow[i]!;
        handShow[i] = Math.abs(d) < 0.002 ? target : handShow[i]! + d * kh;
      }
      const handKey = `${handShow.map((v) => v.toFixed(3)).join(',')},${handMake.toFixed(3)}`;
      if (handKey !== lastHandKey) {
        lastHandKey = handKey;
        composeDirty = true;
      }
      // While a wash goes on, the sheet under it is wet: the cut lines beneath soften into it.
      const washing = handOn && handMake > 1 && handMake < 2;
      if (washing) bleedUntil = Math.max(bleedUntil, performance.now() + 25000);

      // The paper's raking light is the same light, with a slow drift on top.
      const drift = reduced ? 0 : 1;
      const az = sunAz + drift * 0.17 * Math.sin(m.clock * 0.11);
      const el = sunEl - 0.04 + drift * 0.05 * Math.sin(m.clock * 0.07 + 1);
      const rake: [number, number, number] = [
        Math.cos(az) * Math.cos(el),
        Math.sin(az) * Math.cos(el),
        Math.sin(el),
      ];
      const k = reduced ? 1 : 0.035;
      lamp = [lamp[0] + (pointer[0] - lamp[0]) * k, lamp[1] + (pointer[1] - lamp[1]) * k];

      // The new paper comes in as a front, driven by a critically damped spring (ω = 3.5):
      // it sweeps across in about a second and a half, no overshoot, no flicker.
      if (dawn !== dawnTarget) {
        if (reduced) {
          dawn = dawnTarget;
          dawnV = 0;
        } else {
          const w = 3.5;
          const A = dawn - dawnTarget;
          const B = dawnV + w * A;
          const e = Math.exp(-w * dt);
          dawn = dawnTarget + (A + B * dt) * e;
          dawnV = (dawnV - w * B * dt) * e;
          if (Math.abs(dawn - dawnTarget) < 1e-4 && Math.abs(dawnV) < 1e-3) {
            dawn = dawnTarget;
            dawnV = 0;
          }
        }
        page?.style.setProperty('--dawn', dawn.toFixed(4));
        composeDirty = true;
      }

      const now = performance.now();
      const bleeding = now < bleedUntil;
      // Damp, not wet: enough water to darken the sheet for a moment, under the level that lifts ink
      // (dense hatching on a small eye would otherwise fill in).
      const damp = now < dampUntil ? 0.1 : 0;
      const brush: [number, number, number, number] = stroke
        ? [stroke.x, stroke.y, Math.max(18, Math.min(44, geo.eye[2] * 0.13)), 7]
        : [0, 0, 1, 0];
      const brushPrev: [number, number, number] = stroke ? [stroke.px, stroke.py, 1] : [0, 0, 0];

      // An estimate of the wet sheet for the instrument, from the shader's own rates.
      // A stroke frame wets about a tenth of the plate's ink; the damp sheet a little everywhere.
      const added = (stroke ? 0.12 : 0) + damp * dt * 1.2;
      const w0 = wetEst;
      wetEst = Math.max(0, wetEst + added - EVAP * wetEst * dt);
      // Only the pigment the water carried is left behind: a fraction of what evaporates.
      stainEst = Math.max(0, stainEst + EVAP * w0 * dt * 0.1 - FADE * stainEst * dt);
      wetHist.t.push(m.clock);
      wetHist.x.push(Math.min(1, wetEst));
      wetHist.v.push(dt > 0 ? (wetEst - w0) / dt : 0);
      while (wetHist.t.length && m.clock - wetHist.t[0]! > 3) {
        wetHist.t.shift();
        wetHist.x.shift();
        wetHist.v.shift();
      }

      // At rest only the drift moves, and slowly: recompose about nine times a second.
      const drifting = !reduced;
      const needCompose =
        inkDirty || bleeding || composeDirty || (drifting && t - lastCompose > 110);
      if (needCompose) {
        lastCompose = t;
        const tf = performance.now();
        ms = engine.render(
          {
            eye: geo.eye,
            pose: m.pose,
            strip: geo.strip,
            plate: geo.plate,
            mark: geo.mark,
            light: m.light,
            age: m.age,
            dawn,
            rake,
            lamp: [lamp[0], lamp[1], Math.max(window.innerWidth, window.innerHeight) * 1.3],
            sun,
            wire,
            make,
            hand: {
              media: [handShow[0]!, handShow[1]!, handShow[2]!, handShow[3]!],
              iris: handShow[4]!,
              make: handMake,
            },
          },
          {
            ink: inkDirty,
            bleed: bleeding ? 3 : 0,
            dt: 1 / 110,
            brush,
            brushPrev,
            damp,
            handWet: washing ? 1.6 : 0,
          },
        );
        inkDirty = false;
        composeDirty = false;
        stroke = null;
        frames++;
        if (!page?.classList.contains('gpu-ready')) {
          timing.firstFrame = Math.round(performance.now() - tf);
          timing.shown = Math.round(performance.now() - t0);
          page?.classList.add('gpu-ready');
          // Hand the type to the GPU only once the GPU has printed. Until then (the first shader
          // compile can take seconds) it stays DOM, and readable.
          if (engine.info.plate) page?.classList.add('ink-in-paper');
          // The plate has printed: now the hand may colour it.
          window.setTimeout(() => void startHand(), 120);
        }
      } else if (settleWaiters.length && !bleeding) {
        for (const w of settleWaiters.splice(0)) w();
      }
      if (t - fpsAt > 1000) {
        fps = Math.round((frames * 1000) / (t - fpsAt));
        frames = 0;
        fpsAt = t;
      }
      if (t - pushAt > 66) {
        pushAt = t;
        const h = motion.hist;
        eyeStore.set({
          gx: m.pose.gx,
          gy: m.pose.gy,
          open: m.pose.open,
          pupil: m.pose.pupil,
          light: m.light,
          age: m.age,
          gazeV: m.gazeV,
          clock: m.clock,
          ms: Math.round(ms * 100) / 100,
          fps,
          wet: Math.min(1, wetEst),
          stain: Math.min(1, stainEst),
          bleeding,
          rakeDeg: Math.round((az * 180) / Math.PI),
          sunAz: Math.round((sunAz * 180) / Math.PI),
          sunEl: Math.round((sunEl * 180) / Math.PI),
          wire,
          make,
          making: makeAt >= 0,
          handMake,
          dawn,
          gaze: { t: h.gaze.t.slice(), x: h.gaze.x.slice(), v: h.gaze.v.slice() },
          pupilT: { t: h.pupil.t.slice(), x: h.pupil.x.slice(), v: h.pupil.v.slice() },
          lid: { t: h.lid.t.slice(), x: h.lid.x.slice(), v: h.lid.v.slice() },
          wetT: { t: wetHist.t.slice(), x: wetHist.x.slice(), v: wetHist.v.slice() },
        });
      }
    };

    const onUi = (el: EventTarget | null) =>
      !!(el as HTMLElement | null)?.closest?.('button, a, input, .instrument, nav, header.eye-nav');

    // Calipers: points in eye units, snapped to the nearest landmark within 14 px.
    const toEye = (x: number, y: number) =>
      [(x - geo.eye[0]) / geo.eye[2], (y - geo.eye[1]) / geo.eye[2]] as [number, number];
    const snapAt = (x: number, y: number) => {
      const [ex, ey] = toEye(x, y);
      const tol = 14 / geo.eye[2];
      let best: { x: number; y: number; snap?: string } = { x: ex, y: ey };
      let bd = tol;
      for (const l of landmarks(poseNow)) {
        const d = Math.hypot(l.x - ex, l.y - ey);
        if (d < bd) {
          bd = d;
          best = { x: l.x, y: l.y, snap: l.name };
        }
      }
      return best;
    };

    const onMove = (e: PointerEvent) => {
      pointer = [e.clientX, e.clientY];
      if (motion)
        motion.pointer(
          (e.clientX - geo.eye[0]) / geo.eye[2],
          (e.clientY - geo.eye[1]) / geo.eye[2],
        );
      const st = eyeStore.get();
      if (caliperDrag && st.caliper) {
        const b = snapAt(e.clientX, e.clientY);
        eyeStore.set({ caliper: { ...st.caliper, b: [b.x, b.y], snapB: b.snap } });
        return;
      }
      if (st.calipers) {
        const now = performance.now();
        if (now - hoverAt > 30) {
          hoverAt = now;
          eyeStore.set({ hover: snapAt(e.clientX, e.clientY) });
        }
        return;
      }
      if (brushing) {
        if (!moved && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) moved = true;
        if (moved) {
          const prev = lastBrush ?? [e.clientX, e.clientY];
          wetAt(e.clientX, e.clientY, prev[0], prev[1]);
          lastBrush = [e.clientX, e.clientY];
        }
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) motion?.leave();
    };
    // The plate's type stays selectable; a drag anywhere else measures, a shift-drag wets.
    const onText = (el: EventTarget | null) =>
      !!(el as HTMLElement | null)?.closest?.(
        '.eye-overlay :is(header, ol, .fig-no, .g-label, .note)',
      );
    const onDown = (e: PointerEvent) => {
      if (onUi(e.target) || e.button !== 0) return;
      const out = eyeStore.get().calipers;
      if (!out && onText(e.target)) return;
      if (out || !e.shiftKey) {
        e.preventDefault();
        caliperDrag = true;
        down = [e.clientX, e.clientY];
        const a = snapAt(e.clientX, e.clientY);
        eyeStore.set({ caliper: { a: [a.x, a.y], b: [a.x, a.y], snapA: a.snap } });
        return;
      }
      // A brush stroke is not a text selection: a selection would print into the paper as a wash.
      e.preventDefault();
      brushing = true;
      moved = false;
      down = [e.clientX, e.clientY];
      lastBrush = null;
    };
    const onUp = (e: PointerEvent) => {
      if (caliperDrag) {
        caliperDrag = false;
        const c = eyeStore.get().caliper;
        if (c && Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) * geo.eye[2] < 3) {
          eyeStore.set({ caliper: null });
          // A click, not a span: the eye blinks at it.
          if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) <= 5) blinkAt(e);
        }
        return;
      }
      if (!brushing) return;
      brushing = false;
      lastBrush = null;
      if (!moved) blinkAt(e);
    };
    const blinkAt = (e: PointerEvent) => {
      const [x, y, w, h] = rectOf('.eye-box');
      if (e.clientX > x && e.clientX < x + w && e.clientY > y && e.clientY < y + h) motion?.blink();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'l' && !e.repeat) hold(e.type === 'keydown');
      if (k === 'b' && e.type === 'keydown' && !e.repeat) motion?.blink();
      if (k === 'd' && e.type === 'keydown' && !e.repeat) actions.setDawn(dawnTarget ? 0 : 1);
      if (e.type !== 'keydown' || e.repeat) return;
      if (k === 'w') actions.setWire(wireTarget === 0.3 ? 1 : wireTarget === 1 ? 0 : 0.3);
      if (k === 'm') actions.calipers(!eyeStore.get().calipers);
      if (k === 'c') actions.make();
      if (k === 'h') actions.setHand(!eyeStore.get().hand.on);
      if (k === 'i') actions.impression();
      if (k === 'u') {
        const u = eyeStore.get().unit;
        actions.setUnit(UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]!);
      }
      if (k === 'escape') {
        if (eyeStore.get().caliper) actions.clearCaliper();
        else actions.calipers(false);
      }
    };
    const hold = (on: boolean) => {
      motion?.hold(on);
      document.documentElement.classList.toggle('held-to-light', on);
      for (const b of document.querySelectorAll('[data-hold-light]'))
        b.setAttribute('aria-pressed', String(on));
    };

    actions.blink = () => motion?.blink();
    actions.hold = hold;
    actions.setAge = (v: number) => motion?.setAge(v);
    actions.setDawn = (v: 0 | 1) => {
      dawnTarget = v;
      localStorage.setItem('kiruk-dawn', v ? 'new' : 'old');
      page?.setAttribute('data-dawn', v ? 'new' : 'old');
      eyeStore.set({ dawnTarget: v });
      // A new sheet, freshly printed: it is damp again for a moment.
      if (!reduced) actions.dampen();
    };
    actions.make = () => {
      // Under reduced motion the finished plate stays: the strip of studies already shows the passes.
      if (reduced) return;
      makeAt = performance.now();
      make = 1;
      lastPass = 0;
      handMakeAt = -1;
      handMake = 0;
    };
    actions.setHand = (on: boolean) => setHandState({ on });
    actions.toggleMedium = (m) => {
      const hs = eyeStore.get().hand;
      if (m === 'iris') setHandState({ iris: !hs.iris });
      else setHandState({ media: { ...hs.media, [m]: !hs.media[m] } });
    };
    actions.impression = () => {
      const seed = newImpression();
      setHandState({ seed, on: true });
      paintHand(seed, true);
    };
    const markWire = (v: number) => {
      if (page) page.dataset.wire = v === 0 ? '0' : v === 1 ? 'full' : 'faint';
    };
    markWire(wireTarget);
    actions.setWire = (v: number) => {
      wireTarget = v;
      markWire(v);
      eyeStore.set({ wireTarget: v });
    };
    const offCalipers = eyeStore.subscribe(() => {
      const on = eyeStore.get().calipers;
      if (page && (page.dataset.calipers === 'on') !== on)
        page.dataset.calipers = on ? 'on' : 'off';
    });
    actions.dampen = () => {
      dampUntil = performance.now() + 900;
      bleedUntil = performance.now() + 40000;
    };

    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    addEventListener('resize', measure);
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave);
    addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKey);

    const boot = async () => {
      try {
        const burin = await import('@kiruk/burin');
        if (!alive) return;
        motion = burin.createEyeMotion({ reduced });
        const plateCanvas = plateRef.current;
        timing.module = Math.round(performance.now() - t0);
        engine = await burin.createEyeEngine(gpu, {
          plate: plate ? plateCanvas : null,
          frame: { eye: geo.eye, strip: geo.strip },
        });
        timing.engine = Math.round(performance.now() - t0);
        if (!alive) return engine.dispose();
        eyeStore.set({
          backend: engine.info.backend,
          dpr: engine.info.dpr,
          plate: engine.info.plate,
        });
        measure();
        engine.plateChanged();
        // The first print: the sheet is damp, as intaglio paper is.
        if (!reduced) actions.dampen();
        window.__burin = {
          ready: true,
          backend: engine.info.backend,
          plate: engine.info.plate,
          stats: () => ({ ms, fps }),
          hold,
          blink: () => motion?.blink(),
          look: (x, y) => motion?.pointer(x * 2.2, y * 1.8),
          age: (v) => motion?.setAge(v),
          dawn: (v: 0 | 1) => actions.setDawn(v),
          wire: (v: number) => actions.setWire(v),
          make: () => actions.make(),
          hand: () => ({
            ...(hand?.status() ?? { state: eyeStore.get().hand.state }),
            seed: eyeStore.get().hand.seed,
            sheets: engine?.debug.hand ?? 0,
            loaded: handLoaded,
            show: handShow.slice(),
            make: handMake,
          }),
          impression: (seed?: number) => {
            const s = seed ?? newImpression();
            setHandState({ seed: s, on: true });
            paintHand(s, false);
          },
          handLayers: () => {
            // For proofs: the hand's sheets as images, as p5.brush painted them.
            const sh = engine?.handSheet();
            if (!sh) return {};
            const url = (b: ImageBitmap) => {
              const c = document.createElement('canvas');
              c.width = b.width;
              c.height = b.height;
              c.getContext('2d')?.drawImage(b, 0, 0);
              return c.toDataURL('image/png');
            };
            const out: Record<string, string> = {};
            for (const [k, b] of Object.entries(sh.layers)) out[k] = url(b);
            if (sh.iris) out.iris = url(sh.iris.bitmap);
            return out;
          },
          handMedia: (m: string, on: boolean) => {
            const hs = eyeStore.get().hand;
            if (m === 'iris') setHandState({ iris: on });
            else if (m in hs.media) setHandState({ media: { ...hs.media, [m]: on } });
          },
          point: (x: number, y: number) => {
            pointer = [x, y];
          },
          wet: (x, y, r = 60) => {
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2;
              wetAt(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, x, y);
            }
          },
          settle: () => new Promise<void>((r) => settleWaiters.push(r)),
          probe: (x: number, y: number) => engine!.probe(x, y),
          debug: () => ({ ...engine!.debug }),
          timing: () => ({ ...timing }),
        };
      } catch (err) {
        console.warn('[burin] the GPU paper is unavailable, showing the printed plate:', err);
        eyeStore.set({ backend: 'css' });
        page?.classList.add('gpu-failed');
      }
    };
    // The type is printed into its canvas at once: the HTML plate needs no three.js, so the
    // page reads while the engine is still loading and compiling.
    const plateCanvas = plateRef.current;
    if (plateCanvas && plateMode) {
      plate = createHtmlPlate(plateCanvas, () => {
        engine?.plateChanged();
        composeDirty = true;
        if (timing.plate === undefined) timing.plate = Math.round(performance.now() - t0);
      });
    }
    measure();
    raf = requestAnimationFrame(frame);
    void boot();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('resize', measure);
      removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', onKey);
      removeEventListener('keyup', onKey);
      offCalipers();
      clearTimeout(handTimer);
      hand?.dispose();
      plate?.dispose();
      engine?.dispose();
      delete window.__burin;
    };
  }, [phase, plateMode]);

  return (
    <>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: a canvas is not focusable; the GPU plate is decoration and its text lives in the DOM */}
      <canvas ref={gpuRef} className="eye-gpu" aria-hidden="true" />
      {plateMode ? (
        <canvas ref={plateRef} className="eye-plate">
          {overlay}
        </canvas>
      ) : (
        overlay
      )}
    </>
  );
}
