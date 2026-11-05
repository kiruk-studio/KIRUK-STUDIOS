'use client';

/**
 * EyeStage — the TSL eye, on WebGPURenderer.
 *
 * The successor to EraEyeCanvas, built layer by layer in /lab/eye
 * (docs/EYE_TSL_PLAN.md). Same contract as the live eye: an era, the framing,
 * exiting, reduce, interactive, and an onReady once the first faded-in frame
 * is up, so the loader can crossfade it over its poster.
 *
 * The renderer picks WebGPU or WebGL2 once, at init. Everything compiles
 * behind the poster before the stage fades in (on WebGPU, off the GPU's main
 * thread: see "warm up"), and the node graphs are never rebuilt after that:
 * eras, gaze and blinks only write uniforms.
 *
 * Cost discipline, carried over from the live eye:
 *  · nothing renders while the tab is in the background;
 *  · an idle stage drops to every third frame until a pointer arrives;
 *  · a covered stage (the loader's opening over it) draws only now and then;
 *  · the drawing buffer is held to a pixel budget and backs off if frames run long.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type React from 'react';
import { Component, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import {
  createEraScreenTexture,
  type EraScreenTexture,
} from '@/components/three/era-screen-texture';
import type { ThemeConfig } from '@/data/codex-theme';
import { getEraVisual } from '@/lib/era-visuals';
import {
  ANATOMY,
  BELL_PITCH,
  CAMERA_FOV,
  CORNEA_CAP,
  CORNEA_CENTER_Z,
  FRAME_PLANE_Z,
  GAZE_PITCH,
  GAZE_YAW,
  MM_PER_UNIT,
} from './anatomy';
import { bakeBrow } from './bake/brow';
import { createIrisBake } from './bake/iris';
import { createSkinBake } from './bake/skin';
import { createSkinFaceBake } from './bake/skin-face';
import { createTearFilm } from './bake/tear';
import { createVesselBake } from './bake/vessels';
import { eyeShot, type FrameBox } from './framing';
import { DEFAULT_IDENTITY, getEyeIdentity, LID_SHAPES, MONK_TONES } from './identity';
import {
  CURSOR_KIND,
  type EraLens,
  eraPalette,
  type GazePattern,
  getEraLook,
  getEraMedium,
  LENS_ARTEFACTS,
  paletteColors,
  screenLuminance,
} from './look';
import { corneaMaterial } from './nodes/cornea';
import { createLashes } from './nodes/lashes';
import {
  caruncleGeometry,
  caruncleMaterial,
  lidGeometry,
  lidMaterial,
  socketMaterial,
} from './nodes/lid-mesh';
import { FISSURE_MM, fissureAngles, MARGIN_RADIUS } from './nodes/margins';
import { meniscusGeometry, meniscusMaterial } from './nodes/meniscus';
import { roomMesh } from './nodes/room';
import { scleraMaterial } from './nodes/sclera';
import { createScreenPass, UI_FPS } from './nodes/screen';
import { Attention } from './post/attention';
import { ERA_MEDIA, mediumOf } from './post/era-medium';
import { MediumDirector } from './post/medium-director';
import { createEyePipeline } from './post/pipeline';
import { GazeRig, type GazeSample } from './rig/gaze';
import { BlinkRig, damp } from './rig/motion';
import { PupilRig, restingPupil } from './rig/pupil';
import { ScreenDriver, type ScreenState } from './rig/screen';
import { ScreenPages } from './screen-pages';
import { budgetDpr, DPR_MIN, type EyeTier, pickTier, readTierSignals, TIERS } from './tiers';
import { createEyeUniforms, type EyeUniforms, writeScreenUniforms } from './uniforms';

/** How long the gaze keeps following a pointer that has stopped arriving. */
const POINTER_HOLD = 2.2;
/** CSS px at the frame's foot that the loader's corner plates take (32 tall, 16 up, plus clearance). */
const FOOT_CSS_PX = 64;
/** The stage counts as up once its intro fade has arrived this far. */
const READY_AT = 0.97;
/** A covered stage draws a frame this often, s: enough to keep its clock, its fade and its warm-up going. */
const COVERED_EVERY = 0.1;
/** The stage is warm once its frames have asked for no new GPU pipeline for this long, s. */
const WARM_QUIET = 0.3;
/** The eye's parts a warming stage adds, one group a frame, after the post chain (the biggest shaders kept apart). */
const WARM_PARTS: EyeLayer[][] = [
  [],
  ['lids'],
  ['tears', 'lashes'],
  ['eyeball', 'cornea', 'socket', 'room'],
];
/** The span the era's page is authored to be legible at — a desktop's. */
const REF_SPAN = 1.09;
/**
 * A calm stage (phones): the same eye, turned down. Visitors on a phone found
 * the loader too busy, so the film grain is fainter and a finger pulls the
 * gaze less far (and the cut between eras runs a quarter slower: the
 * director's `calm`).
 */
const CALM = { grain: 0.45, gaze: 0.6 } as const;
/** A press that moves further than this (CSS px) is a drag, not a press on the iris. */
const PRESS_SLOP = 6;

export const EYE_LAYERS = [
  'room',
  'eyeball',
  'cornea',
  'lids',
  'lashes',
  'tears',
  'socket',
] as const;
export type EyeLayer = (typeof EYE_LAYERS)[number];

export interface EyeStageInfo {
  backend: 'webgpu' | 'webgl2';
  tier: EyeTier;
}

export interface EyeStageStats {
  fps: number;
  /** CPU time spent issuing the frame, ms. */
  cpuMs: number;
  /** GPU time for the frame, ms, when the backend can measure it. */
  gpuMs: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  dpr: number;
}

/** What the lab can reach into. The live loader never passes one. */
export interface EyeStageControl {
  uniforms: EyeUniforms;
  info: EyeStageInfo;
  stats: EyeStageStats;
  setLayerVisible(layer: EyeLayer, visible: boolean): void;
  isLayerVisible(layer: EyeLayer): boolean;
  blink(): void;
  /** Hold the gaze here instead of following the pointer; null releases it. */
  holdGaze(target: { x: number; y: number } | null): void;
  /** Hold the pupil at this share of the iris; null releases it. */
  holdPupil(value: number | null): void;
  /** The screen pass's live state, so the lab's GLSL reference runs off the same clock. */
  screenState: ScreenState;
  /** Pupil diameter now, mm. */
  pupilMm(): number;
  /** The last few seconds of pupil diameter, mm, at ~30 Hz (oldest first). */
  pupilTrace(): number[];
  /** Add light on top of the screen, in log₁₀ millilamberts (0 takes it away). */
  lightStep(logL: number): void;
  /** A flash on the camera's axis: red-eye, then the reflex. */
  flash(): void;
  /** Hold the red reflex at this strength (a real one lasts ~50 ms); null releases it. */
  holdRedReflex(value: number | null): void;
  /** Leave out the hippus, so the reflex's timing can be read cleanly. */
  stillPupil(still: boolean): void;
  /** Hold the lids part-way through a blink (0 open, 1 shut); null releases them. */
  holdBlink(value: number | null): void;
  /** Hold the squint (0 none, 1 full); null lets the screen's glare drive it. */
  holdSquint(value: number | null): void;
  /** Stop the eye blinking on its own (a stare), so the tear film breaks up. */
  stare(on: boolean): void;
  /** Reflex tears, as a fast sweep brings on. */
  reflexTears(): void;
  /** Seconds since the last blink, and how teary the eye is (0..1). */
  tearInfo(): { sinceBlink: number; tearing: number };
  /** Look the way another era does (null: this era's own way). */
  setGazePattern(pattern: GazePattern | null): void;
  /** Ten ways of seeing: show this medium (an era number, 1..10; 0 none) whatever the era, or null for the era's own. */
  setMedium(id: number | null): void;
  /** Lab: runs the cut between eras (and its signs) at this rate, 1 normal; for filmstrips. */
  slowMedium(rate: number): void;
  /** Lab: which of 2026's layers draw (bits: plate, registration, geometry, landmarks, you, sign; 63 all), for the exploded view. */
  mediumLayers(mask: number): void;
  /** Lab: the cut's state, read for filmstrips. */
  mediumInfo(): {
    cur: number;
    dep: number;
    arr: number;
    blink: number;
    signA: number;
    busy: boolean;
    scrub: boolean;
    since: number;
    idle: number;
  };
  /**
   * Scrubbing: the unrounded era position under the hand (0 is the first era),
   * sent while a drag, a swipe or the ghost finger travels; null when it lets
   * go. The hand then works the lids (post/medium-director.ts).
   */
  travel(pos: number | null): void;
  /** The last ~6 s of gaze, degrees, ~120 Hz, with what the eye was doing. */
  gazeTrace(): GazeSample[];
  /** The way of looking in force, and the mean seconds between blinks. */
  gazeInfo(): { pattern: GazePattern; blinkEvery: number };
  /** The era's lens on or off (off: a clean photograph). */
  lensOn(on: boolean): void;
  /** The screen shows the eras' real home pages (off: the painted stand-in, as the GLSL eye has). */
  pagesOn(on: boolean): void;
  /** Which era's page each screen slot holds, and how far the fades are. */
  pagesInfo(): { eraA: string | null; eraB: string | null; mix: number; on: number };
  /** Hold the focus at this depth (mm toward the camera from the globe's centre); null racks to the pointer. */
  holdFocus(z: number | null): void;
  /** Where the camera is focused now, mm from the globe's centre toward it. */
  focusZ(): number;
  /** The last 200 saccades (rig/gaze.ts `log`), and the rig's clock. */
  gazeLog(): { now: number; saccades: { t: number; amp: number; d: number; micro: boolean }[] };
  /** Where the iris is on screen now, CSS px from the canvas's top-left, and its radius. */
  irisAt(): { x: number; y: number; r: number };
  /** Where the eye sits in the shot (its centre at rest, whatever the gaze), CSS px, and the iris's radius. */
  eyeCentre(): { x: number; y: number; r: number };
}

const FILL_TMP = new THREE.Color();
const UP_TMP = new THREE.Vector3(0, 1, 0);

/** Where the camera focuses, mm toward it from the globe's centre: the iris plane, the lashes. */
const FOCUS_IRIS = 11.6;
const FOCUS_LASHES = 15.5;

/** The lens's numbers that crossfade between eras (the artefact switches). */
const LENS_NUMBERS = [
  'grain',
  'grainSize',
  'halation',
  'chroma',
  'vignette',
  'lift',
  'gamma',
  'gain',
  'sat',
  'wb',
  'split',
  'sharpen',
  'aperture',
  'bloom',
  'isolate',
  'phosphor',
] as const satisfies readonly (keyof EraLens)[];

/** An era that looks each way, so the lab can borrow its numbers. */
const PATTERN_ERA: Record<GazePattern, string> = {
  idle: '2003',
  read: '1991',
  scatter: '1995',
  'two-target': '1997',
  lock: '2000',
  scroll: '2009',
  contact: '2026',
};

export type { FrameBox } from './framing';

/** The era screens' size as the eye sees them (look.ts), × this. */
const SCREEN_SCALE = 0.62;

/** Frames the macro shot from the same numbers the poster and the tap target use (framing.ts). */
function frameCamera(camera: THREE.PerspectiveCamera, w: number, h: number, box?: FrameBox) {
  const f = eyeShot(w, h, box);
  const heightMm = f.span * MM_PER_UNIT;
  const dist = heightMm / 2 / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2);
  camera.fov = CAMERA_FOV;
  camera.aspect = w / Math.max(h, 1);
  camera.near = Math.max(1, dist - ANATOMY.eyeballRadius * 4);
  camera.far = dist + ANATOMY.eyeballRadius * 20;
  // the camera looks at the box's middle, not the eye's
  camera.position.set(0, -f.offsetY * MM_PER_UNIT, FRAME_PLANE_Z + dist);
  camera.rotation.set(0, 0, 0);
  camera.updateProjectionMatrix();
}

interface SceneProps {
  era: ThemeConfig;
  exiting: boolean;
  reduce: boolean;
  interactive: boolean;
  profile: boolean;
  dprCap: number;
  /**
   * R3F 9.8 re-applies the Canvas `dpr` prop on every render of the Canvas,
   * so a ratio set from inside the scene is undone the next time the parent
   * renders. The ratio lives with the Canvas's owner instead.
   */
  setDpr: (dpr: number) => void;
  onReady?: (info: EyeStageInfo) => void;
  control?: React.MutableRefObject<EyeStageControl | null>;
  capture?: React.MutableRefObject<(() => Promise<string>) | null>;
  frameBox?: FrameBox;
  media?: boolean;
  calm?: boolean;
  covered?: boolean;
}

function EyeScene({
  era,
  exiting,
  reduce,
  interactive,
  profile,
  dprCap,
  setDpr,
  onReady,
  control,
  capture,
  frameBox,
  media = false,
  calm = false,
  covered = false,
}: SceneProps) {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer;
  const scene = useThree((s) => s.scene) as unknown as THREE.Scene;
  const camera = useThree((s) => s.camera) as unknown as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const U = useMemo(createEyeUniforms, []);

  const info = useMemo<EyeStageInfo>(() => {
    const webgpu = (gl.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
    return { backend: webgpu ? 'webgpu' : 'webgl2', tier: pickTier(readTierSignals(webgpu)) };
  }, [gl]);

  // The pixel ratio the tier allows, once the tier is known.
  useEffect(() => {
    const tierCap = info.tier > 0 ? TIERS[info.tier as 1 | 2 | 3].dprCap : 1;
    setDpr(budgetDpr(Math.min(tierCap, dprCap)));
  }, [info.tier, dprCap, setDpr]);

  /* ---- the era's screen: the light and the reflection ------------------ */

  /** The portfolio page, painted by canvas 2D and repainted on era change: the stand-in. */
  const code = useMemo<EraScreenTexture>(() => createEraScreenTexture(), []);
  useEffect(() => () => code.dispose(), [code]);
  /** The eras' real home pages, loaded as each era comes up. */
  const pages = useMemo(() => new ScreenPages(), []);
  useEffect(() => () => pages.dispose(), [pages]);
  const screen = useMemo(() => createScreenPass(U.screen, code.texture, pages), [U, code, pages]);
  useEffect(() => () => screen.dispose(), [screen]);
  const driver = useMemo(() => new ScreenDriver(), []);

  /* ---- the layers ------------------------------------------------------ */

  /** The white of the eye, baked once per person. */
  const vessels = useMemo(() => createVesselBake(), []);

  /** The iris, baked per person at the tier's resolution, in two sets for crossfades. */
  const irisBake = useMemo(
    () => createIrisBake(info.tier > 0 ? TIERS[info.tier as 1 | 2 | 3].irisBake : 512),
    [info.tier],
  );
  useEffect(() => () => irisBake.dispose(), [irisBake]);
  useEffect(() => () => vessels.dispose(), [vessels]);

  /** The tear film over the cornea: simulated on T2/T3, laid down once on T1. */
  const tierSpec = info.tier > 0 ? TIERS[info.tier as 1 | 2 | 3] : TIERS[1];
  /** Whether the post pass has an emissive target to bloom (WebGPU; see post/pipeline.ts). */
  const emissiveTarget = info.backend === 'webgpu';
  const tear = useMemo(() => createTearFilm(tierSpec.tearFilm), [tierSpec.tearFilm]);
  useEffect(() => () => tear.dispose(), [tear]);

  /**
   * The gaze rig: the globe turns inside this group, yaw then pitch (Fick),
   * so a diagonal look never twists the eye about its own axis.
   */
  const eyeball = useMemo(() => {
    const group = new THREE.Group();
    group.name = 'eyeball';
    group.rotation.order = 'YXZ';
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 96),
      scleraMaterial(U, screen.target, vessels.target),
    );
    ball.name = 'globe';
    ball.scale.setScalar(ANATOMY.eyeballRadius);
    group.add(ball);

    // the cornea: a cap of its own sphere, seated on the globe at the limbus
    const capGeometry = new THREE.SphereGeometry(
      ANATOMY.corneaRadius,
      96,
      24,
      0,
      Math.PI * 2,
      0,
      CORNEA_CAP,
    );
    capGeometry.rotateX(Math.PI / 2); // the cap's pole onto the visual axis
    const cornea = new THREE.Mesh(
      capGeometry,
      corneaMaterial(
        U,
        screen.target,
        irisBake,
        tear.target,
        tierSpec.purkinje === 'all',
        emissiveTarget,
      ),
    );
    cornea.name = 'cornea';
    cornea.position.z = CORNEA_CENTER_Z;
    cornea.renderOrder = 5;
    group.add(cornea);
    return { group, ball, cornea };
    // the tier is settled before the stage compiles; tierSpec follows tear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [U, screen, vessels, irisBake, tear]);

  /** The skin's pores and lines, baked once onto the lid mesh's own coordinates. */
  const skinBake = useMemo(() => createSkinBake(), []);
  useEffect(() => () => skinBake.dispose(), [skinBake]);

  /**
   * The lids and the skin around them: one ring mesh shaped in the vertex
   * stage on the margin curves. Its bounds are meaningless before that, so it
   * is never culled. It is opaque and drawn first: most of the globe and the
   * cornea sit under it, and the depth test then skips their shaders there.
   */
  /** The brow and the skin's fine hair, drawn once at the tier's budget. */
  const hairBake = useMemo(() => bakeBrow(tierSpec.browHairs, tierSpec.browRes), [tierSpec]);
  useEffect(() => () => hairBake.dispose(), [hairBake]);

  /** The skin's face-space detail (pores, grain, mottle), baked once. */
  const skinFace = useMemo(() => createSkinFaceBake(DEFAULT_IDENTITY.lids.tilt), []);
  useEffect(() => () => skinFace.dispose(), [skinFace]);

  const lids = useMemo(() => {
    const mesh = new THREE.Mesh(
      lidGeometry(),
      lidMaterial(U, screen.target, skinBake.target, hairBake, skinFace),
    );
    mesh.name = 'lids';
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;
    return mesh;
  }, [U, screen, skinBake, hairBake, skinFace]);

  /**
   * The lashes: one instanced draw, as many strands as the tier allows. The
   * strands are the same for every era; the person decides how many show.
   */
  const lashes = useMemo(() => {
    const t = info.tier > 0 ? TIERS[info.tier as 1 | 2 | 3] : TIERS[1];
    return createLashes(U, screen.target, t.lashesUpper, t.lashesLower, emissiveTarget);
  }, [U, screen, info.tier, emissiveTarget]);

  /** The tear meniscus: a bead along both margins, after the cornea and before the lashes. */
  const meniscus = useMemo(() => {
    const mesh = new THREE.Mesh(
      meniscusGeometry(),
      meniscusMaterial(U, screen.target, emissiveTarget),
    );
    mesh.name = 'meniscus';
    mesh.frustumCulled = false;
    mesh.renderOrder = 15;
    return mesh;
  }, [U, screen, emissiveTarget]);

  /**
   * The socket behind the globe: what shows in the corners of the aperture.
   * The caruncle rides on it (shaped in its vertex stage, so never culled).
   */
  const socket = useMemo(() => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(14, 64, 40),
      socketMaterial(U, screen.target),
    );
    mesh.name = 'socket';
    const caruncle = new THREE.Mesh(caruncleGeometry(), caruncleMaterial(U, screen.target));
    caruncle.name = 'caruncle';
    caruncle.frustumCulled = false;
    // (it blends at its edges: drawn over the globe, before the cornea)
    caruncle.renderOrder = 4;
    mesh.add(caruncle);
    return mesh;
  }, [U, screen]);
  const room = useMemo(() => roomMesh(U, screen.target), [U, screen]);

  const layers = useRef<Record<EyeLayer, boolean>>({
    room: true,
    eyeball: true,
    cornea: true,
    lids: true,
    lashes: true,
    tears: true,
    socket: true,
  });
  const layerObject = (layer: EyeLayer): THREE.Object3D =>
    ({
      eyeball: eyeball.ball,
      cornea: eyeball.cornea,
      lids,
      lashes,
      tears: meniscus,
      socket,
      room,
    })[layer];

  useEffect(() => {
    scene.add(eyeball.group);
    scene.add(lids);
    scene.add(lashes);
    scene.add(meniscus);
    scene.add(socket);
    scene.add(room);
    return () => {
      scene.remove(eyeball.group);
      scene.remove(lids);
      scene.remove(lashes);
      scene.remove(meniscus);
      meniscus.geometry.dispose();
      (meniscus.material as THREE.Material).dispose();
      lashes.geometry.dispose();
      (lashes.material as THREE.Material).dispose();
      scene.remove(socket);
      for (const m of [socket, ...(socket.children as THREE.Mesh[])]) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      eyeball.ball.geometry.dispose();
      (eyeball.ball.material as THREE.Material).dispose();
      eyeball.cornea.geometry.dispose();
      (eyeball.cornea.material as THREE.Material).dispose();
      lids.geometry.dispose();
      (lids.material as THREE.Material).dispose();
      scene.remove(room);
      room.geometry.dispose();
      room.material.dispose();
    };
  }, [scene, eyeball, lids, lashes, meniscus, socket, room]);

  const pipeline = useMemo(
    () => createEyePipeline(gl, scene, camera, U, screen.target, tierSpec, emissiveTarget, media),
    [gl, scene, camera, U, screen, tierSpec, emissiveTarget, media],
  );
  useEffect(() => () => pipeline.dispose(), [pipeline]);
  // a new pipeline (the media switched on, say) has its eras' media still to build
  useEffect(() => {
    allMedia.current =
      !pipeline.media || (gl.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend !== true;
  }, [pipeline, gl]);

  /* ---- warm up behind the poster -------------------------------------- */

  // WebGPU: the first frames build every pipeline they need off the GPU's
  // main thread (createRenderPipelineAsync), and whatever is not ready yet is
  // simply not drawn. A pipeline built the plain way compiles on the GPU
  // process's main thread, and the whole browser's frames wait for it: the
  // post chain alone is ~430 KB of WGSL, and it froze every frame on screen
  // for five seconds on an integrated GPU. (compileAsync built them too, but
  // for other targets and vertex stages than the frames draw with, so each
  // was built twice, the second time the plain way.) The stage is warm once
  // its frames have asked for nothing new for a moment and nothing is pending;
  // only then does it fade in. While it is covered, new pipelines are still
  // built this way: something not drawn for a moment is out of sight there.
  const warm = useRef({
    async: true,
    pending: 0,
    made: 0,
    seen: 0,
    quietSince: 0,
    step: 0,
    done: false,
  });
  /** Draw materials whose pipeline is built (WebGPU), so an era's medium is never cut to before it can draw. */
  const builtMats = useRef(new WeakMap<object, boolean>());
  /** Whether every era's medium has its pipeline built (until then, new pipelines keep building off the main thread). */
  const allMedia = useRef(!media);
  useEffect(() => {
    const W = warm.current;
    const backend = gl.backend as unknown as {
      isWebGPUBackend?: boolean;
      createRenderPipeline: (renderObject: unknown, promises: Promise<void>[] | null) => void;
    };
    // (WebGL2 compiles behind the poster below instead)
    if (backend.isWebGPUBackend !== true) {
      W.done = true;
      return;
    }
    const make = backend.createRenderPipeline;
    const B = builtMats.current;
    backend.createRenderPipeline = function (renderObject, promises) {
      const mat = (renderObject as { material?: object }).material;
      if (promises || !W.async) {
        make.call(this, renderObject, promises);
        if (mat && !promises) B.set(mat, true);
        return;
      }
      const built: Promise<void>[] = [];
      make.call(this, renderObject, built);
      W.made += 1;
      W.pending += built.length;
      if (mat) B.set(mat, built.length === 0);
      void Promise.all(built).finally(() => {
        W.pending -= built.length;
        if (mat) B.set(mat, true);
      });
    };
    return () => {
      backend.createRenderPipeline = make;
    };
  }, [gl]);
  /** Something opaque is over the stage (the loader's opening); read by the frame. */
  const coveredRef = useRef(covered);
  useEffect(() => {
    coveredRef.current = covered;
  }, [covered]);

  const compiled = useRef(false);
  useEffect(() => {
    // WebGPU warms on its first frames instead (above)
    if (info.backend === 'webgpu') {
      compiled.current = true;
      return;
    }
    let live = true;
    frameCamera(camera, size.width, size.height, frameBox);
    Promise.all([
      gl.compileAsync(scene, camera),
      gl.compileAsync(screen.quad, screen.quad.camera),
      gl.compileAsync(vessels.quad, vessels.quad.camera),
      ...tear.quads.map((q) => gl.compileAsync(q, q.camera)),
      ...irisBake.quads.map((q) => gl.compileAsync(q, q.camera)),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) compiled.current = true;
      });
    return () => {
      live = false;
    };
    // compile once per stage; resizes only reframe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gl,
    scene,
    camera,
    eyeball,
    lids,
    lashes,
    meniscus,
    socket,
    screen,
    vessels,
    irisBake,
    skinBake,
    tear,
  ]);

  /* ---- what the era decides, resolved once per era -------------------- */

  // With the media on, the era's light, lens, page and gaze change only while
  // the lids are shut (post/medium-director.ts): `view` is the era on screen,
  // which follows `era` at the director's swap. Without them it is `era`.
  const seenEras = useRef<Record<string, ThemeConfig>>({});
  seenEras.current[era.id] = era;
  const [shownId, setShownId] = useState(era.id);
  const view = media ? (seenEras.current[shownId] ?? era) : era;
  /** The medium whose light and lens are up (the director waits for it before opening the lids). */
  const applied = useRef(0);
  const visual = useMemo(() => getEraVisual(view.id), [view.id]);
  const identity = useMemo(() => getEyeIdentity(view.id), [view.id]);
  const look = useMemo(() => getEraLook(view.id), [view.id]);
  /** Lab: another era's way of looking. */
  const patternOverride = useRef<GazePattern | null>(null);
  const [patternRev, setPatternRev] = useState(0);

  // The era's way of looking, and how often its person blinks.
  useEffect(() => {
    const pattern = patternOverride.current ?? look.gazePattern;
    const params = patternOverride.current ? getEraLook(PATTERN_ERA[pattern]).gaze : look.gaze;
    gazeRig.setPlan(pattern, params.rest, params);
    blinkRig.every = params.blinkEvery;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, patternRev]);

  // The person: their skin and lid shape, and a new seed re-bakes their vessels.
  useEffect(() => {
    const shape = LID_SHAPES[identity.lids.type];
    U.skin.tone.value.set(MONK_TONES[identity.skin.monk]);
    U.skin.undertone.value = identity.skin.undertone;
    U.skin.translucency.value = identity.skin.translucency;
    U.skin.pores.value = identity.skin.pores;
    U.skin.lines.value = identity.skin.lines;
    U.skin.freckles.value = identity.skin.freckles;
    U.skin.creaseD.value = shape.creaseD;
    U.skin.creaseDepth.value = shape.creaseDepth;
    U.skin.hood.value = shape.hood;
    U.lids.epicanthus.value = shape.epicanthus;
    const LS = U.lashes;
    LS.upper.value = identity.lashes.upper;
    LS.lower.value = identity.lashes.lower;
    LS.length.value = identity.lashes.length;
    LS.curl.value = identity.lashes.curl;
    LS.clump.value = identity.lashes.clump;
    LS.mascara.value = identity.lashes.mascara;
    LS.root.value.set(identity.lashes.root);
    LS.tip.value.set(identity.lashes.tip);
    // arriving somewhere new, an eye often blinks (with the media on, every
    // arrival already is a blink: the director's)
    if (!media && irisState.current.baked > 0 && !reduce && Math.random() < 0.6) blinkRig.trigger();
    vessels.setSeed(identity.seed);
    // The iris is baked into whichever set is not on screen, then crossfaded
    // in. A fast sweep coalesces to the era it lands on: a bake is a few
    // milliseconds of MaterialX noise, not something to do per tick.
    const rest = restingPupil(lum, identity.pupil.rest / 0.34);
    const bake = () => {
      const first = irisState.current.baked === 0;
      const set: 0 | 1 = first ? 0 : irisState.current.active === 0 ? 1 : 0;
      irisBake.request(set, identity, rest);
      (set === 0 ? U.iris.restA : U.iris.restB).value = rest;
    };
    if (irisState.current.baked === 0) bake();
    else {
      const id = window.setTimeout(bake, 120);
      return () => window.clearTimeout(id);
    }
    U.sclera.tint.value.set(identity.sclera.tint);
    U.sclera.vessels.value = identity.sclera.vessels;
    U.sclera.age.value = identity.sclera.age;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, vessels, irisBake, U]);

  // Four or more eras asked for in a second is a sweep fast enough to bring
  // tears (counted on the request: with the media on, the cuts that follow
  // are rate-limited and would never reach four).
  useEffect(() => {
    if (reduce) return;
    const tr = tears.current;
    const t = performance.now() / 1000;
    tr.eras = tr.eras.filter((x) => t - x < 1).concat(t);
    if (tr.eras.length >= 4) tr.tearing = Math.min(1, tr.tearing + 0.25);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [era.id]);

  // The screen they are looking at, as a light and a mirror: where it is, how
  // big, and which way its own right and up run as the person sees it.
  useEffect(() => {
    const L = U.light;
    L.dir.value.set(...look.light.key).normalize();
    L.center.value.set(...look.light.pos);
    L.normal.value.set(...look.light.normal).normalize();
    // the screen's own right and up, as the person facing it sees them
    const looking = L.normal.value.clone().negate();
    L.right.value.crossVectors(looking, new THREE.Vector3(0, 1, 0)).normalize();
    L.up.value.crossVectors(L.right.value, looking).normalize();
    // (the screens are drawn larger than life so the page reads in the cornea;
    // at their full size it filled the whole iris and read as a lens, not an
    // eye, so they are scaled down to leave the iris round the reflection)
    L.size.value.set(look.light.size[0] * SCREEN_SCALE, look.light.size[1] * SCREEN_SCALE);
    U.screen.cursorKind.value = CURSOR_KIND[look.cursor];
    applied.current = mediumOf(view.id);
  }, [look, U, view.id]);
  const pal = useMemo(() => eraPalette(view), [view]);
  const palCols = useMemo(() => paletteColors(pal), [pal]);
  const lum = useMemo(() => screenLuminance(pal), [pal]);

  // The first era paints at once so the screen is never empty; a fast sweep
  // coalesces to the year it lands on rather than rasterising every one.
  const painted = useRef<string | null>(null);
  useEffect(() => {
    const paint = () => {
      painted.current = view.id;
      code.update(view.id, pal);
    };
    if (painted.current === null) {
      paint();
      return;
    }
    const id = window.setTimeout(paint, 64);
    return () => window.clearTimeout(id);
  }, [code, view.id, pal]);
  // the page of the era being travelled to starts loading at once, so it is
  // there by the time the lids are shut
  useEffect(() => {
    pages.prefetch(era.id);
  }, [pages, era.id]);

  /* ---- input ------------------------------------------------------------ */

  const gazeRig = useMemo(() => new GazeRig(), []);
  const blinkRig = useMemo(() => new BlinkRig(), []);
  const pointer = useRef({
    x: 0,
    y: 0,
    seen: -1e3,
    mouse: true,
    down: false,
    downAt: 0,
    onIris: false,
    dragged: false,
    sx: 0,
    sy: 0,
  });
  /** Where the gaze was when the cut began: the glance toward the next era is taken from there. */
  const glanceFrom = useRef<number | null>(null);
  /** Where the pointer and the iris were last frame (top-left UV; CSS px), for how much is moving. */
  const listenFrom = useRef({ x: NaN, y: NaN, ix: NaN, iy: NaN });
  /** Where the visitor's pointer rests (2026 measures you back). */
  const attention = useMemo(() => new Attention(), []);
  /** The eye's blinks, counted as the lids shut (2026 reads them out). */
  const blinkCount = useRef({ n: 0, shut: false });
  /** How much the pointer resting on the eye interests it, 0..1, eased: the brow lifts with it. */
  const browInterest = useRef(0);
  /** Where the iris was drawn last frame, CSS px, for the loader's tap target. */
  const irisOnScreen = useRef({ x: 0, y: 0, r: 1 });
  /** Where the eye sits in the shot, CSS px (the frame's centre), for the loader's chrome. */
  const eyeOnScreen = useRef({ x: 0, y: 0, r: 1 });
  /** The brow's lift before any flash, eased; and when the last greeting flash began (s, performance clock). */
  const browBase = useRef(0);
  const browFlash = useRef(-1e3);
  const pupilRig = useMemo(() => new PupilRig(), []);
  const trace = useRef<{ samples: number[]; due: number }>({ samples: [], due: 0 });
  /** Ten ways of seeing: the cut between eras (a blink), and the lab's choice of medium (null: the era's own). */
  const director = useMemo(
    () => new MediumDirector((m) => getEraMedium(ERA_MEDIA[m - 1] ?? '')),
    [],
  );
  /** The look the last frame used: when it changes under the media, its light and lens land at once. */
  const lastLook = useRef<ReturnType<typeof getEraLook> | null>(null);
  const mediumHold = useRef<number | null>(null);
  const mediumRate = useRef(1);
  /** The loader's scrub: the unrounded era index under the hand, or null. */
  const travelPos = useRef<number | null>(null);
  const hold = useRef<{
    gaze: { x: number; y: number } | null;
    pupil: number | null;
    extraLogL: number;
    red: number | null;
    still: boolean;
    blink: number | null;
    squint: number | null;
    stare: boolean;
    lensOn: boolean;
    pagesOn: boolean;
    focus: number | null;
  }>({
    gaze: null,
    pupil: null,
    extraLogL: 0,
    red: null,
    still: false,
    blink: null,
    squint: null,
    stare: false,
    lensOn: true,
    pagesOn: true,
    focus: null,
  });
  /**
   * The camera: where it is focused (mm toward it from the globe's centre),
   * where the reflection was last frame (for its speed across the frame),
   * and the lens's grain seed.
   */
  const camState = useRef({ focusZ: FOCUS_IRIS, irisX: NaN, irisY: NaN, seed: 0, grainDue: 0 });
  /**
   * The tears: when the lid last shut and reopened (the film creeps up after
   * it), each blink's seed for the film, reflex tearing, and when eras changed
   * (four or more in a second is a sweep fast enough to bring tears).
   */
  const tears = useRef({
    sinceBlink: 0,
    shut: false,
    opened: -1e3,
    seed: 0,
    tearing: 0,
    eras: [] as number[],
  });
  const lashLag = useRef({ up: NaN, lo: NaN, xU: 0, vU: 0, xL: 0, vL: 0 });
  const lidReach = useRef<{ up: number; lo: number }>({
    up: FISSURE_MM.upper,
    lo: FISSURE_MM.lower,
  });
  const hidden = useRef(false);
  const readySent = useRef(false);
  /** Seconds owed to the screen pass; starts due, so the first frame has a screen. */
  const uiDue = useRef(1);
  /** Which iris set is on screen, how many bakes have landed, the crossfade's goal. */
  const irisState = useRef({ active: 0 as 0 | 1, baked: 0, goal: 0 });
  /** The membrane's lag after a turn: offset and velocity (mm), last turn rate. */
  const wobble = useRef({ x: 0, y: 0, vx: 0, vy: 0, yaw: 0, pitch: 0, wYaw: 0, wPitch: 0 });
  const health = useRef({
    ema: 1 / 60,
    cool: 2,
    skip: 0,
    owed: 0,
    moved: 0,
    heldBlink: -1,
    drawn: -1,
  });
  /** A poster capture waiting for the next drawn frame (lab only). */
  const pendingCapture = useRef<((png: string) => void) | null>(null);
  useEffect(() => {
    if (!capture) return;
    capture.current = () =>
      new Promise<string>((resolve) => {
        pendingCapture.current = resolve;
      });
    return () => {
      capture.current = null;
    };
  }, [capture]);
  /** How many pages the reading eye has turned, to scroll the page in step. */
  const pagesTurned = useRef(0);
  const meter = useRef({ frames: 0, since: 0, cpu: 0 });
  const stats = useRef<EyeStageStats>({
    fps: 0,
    cpuMs: 0,
    gpuMs: null,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    dpr,
  });

  useEffect(() => {
    const sync = () => {
      hidden.current = document.hidden;
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // (also under reduced motion: the gaze then ignores the pointer, but the
  // era's sign still answers hover and press)
  useEffect(() => {
    if (!interactive) return;
    const P = pointer.current;
    const onMove = (e: PointerEvent) => {
      P.x = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      P.y = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      P.mouse = e.pointerType === 'mouse';
      const t = performance.now() / 1000;
      if (!reduce && t - P.seen > 2.5 && t - browFlash.current > 4) browFlash.current = t + 0.08;
      P.seen = t;
      if (P.down && Math.hypot(e.clientX - P.sx, e.clientY - P.sy) > PRESS_SLOP) P.dragged = true;
    };
    // a press on the iris, for the era's press feedback (the loader decides what a tap does)
    const onDown = (e: PointerEvent) => {
      onMove(e);
      const iris = irisOnScreen.current;
      P.down = true;
      P.downAt = performance.now() / 1000;
      P.dragged = false;
      P.sx = e.clientX;
      P.sy = e.clientY;
      // (a finger gets a little more room than a cursor, as the loader's tap does)
      P.onIris =
        Math.hypot(e.clientX - iris.x, e.clientY - iris.y) <
        (P.mouse ? iris.r * 1.05 : Math.max(iris.r * 1.3, 28));
    };
    const onUp = () => {
      P.down = false;
      P.dragged = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [interactive, reduce]);

  useEffect(() => {
    if (!control) return;
    control.current = {
      uniforms: U,
      info,
      stats: stats.current,
      setLayerVisible(layer, visible) {
        layers.current[layer] = visible;
        if (layer === 'eyeball') eyeball.ball.visible = visible;
        if (layer === 'cornea') eyeball.cornea.visible = visible;
        if (layer === 'lids') lids.visible = visible;
        if (layer === 'lashes') lashes.visible = visible;
        if (layer === 'tears') meniscus.visible = visible;
        if (layer === 'socket') socket.visible = visible;
        if (layer === 'room') room.visible = visible;
      },
      isLayerVisible: (layer) => layers.current[layer],
      blink: () => blinkRig.trigger(),
      holdGaze(target) {
        hold.current.gaze = target;
      },
      holdPupil(value) {
        hold.current.pupil = value;
      },
      screenState: driver.state,
      pupilMm: () => pupilRig.d,
      pupilTrace: () => trace.current.samples.slice(),
      lightStep(logL) {
        hold.current.extraLogL = logL;
      },
      flash: () => pupilRig.flash(),
      holdRedReflex(value) {
        hold.current.red = value;
      },
      stillPupil(still) {
        hold.current.still = still;
      },
      holdBlink(value) {
        hold.current.blink = value;
      },
      holdSquint(value) {
        hold.current.squint = value;
      },
      stare(on) {
        hold.current.stare = on;
      },
      reflexTears() {
        tears.current.tearing = 1;
      },
      tearInfo: () => ({ sinceBlink: tears.current.sinceBlink, tearing: tears.current.tearing }),
      setMedium(id) {
        mediumHold.current = id;
      },
      slowMedium(rate) {
        mediumRate.current = Math.max(0.01, rate);
      },
      mediumLayers(mask) {
        U.medium.layers.value = mask;
      },
      mediumInfo: () => ({
        cur: director.cur,
        dep: director.dep,
        arr: director.arr,
        blink: U.blink.value,
        signA: director.signA,
        busy: director.busy,
        scrub: director.scrubbing,
        since: director.since,
        idle: U.medium.idle.value,
      }),
      travel(pos) {
        travelPos.current = pos;
        // both eras either side of the hand load now, so a cut never waits for one
        if (pos !== null) {
          pages.prefetch(ERA_MEDIA[Math.max(0, Math.floor(pos))] ?? ERA_MEDIA[0]);
          pages.prefetch(ERA_MEDIA[Math.min(ERA_MEDIA.length - 1, Math.ceil(pos))] ?? ERA_MEDIA[0]);
        }
      },
      setGazePattern(pattern) {
        if (patternOverride.current === pattern) return;
        patternOverride.current = pattern;
        setPatternRev((r) => r + 1);
      },
      gazeTrace: () => gazeRig.trace.slice(),
      lensOn(on) {
        hold.current.lensOn = on;
      },
      pagesOn(on) {
        hold.current.pagesOn = on;
      },
      pagesInfo: () => pages.info(),
      holdFocus(z) {
        hold.current.focus = z;
      },
      focusZ: () => camState.current.focusZ,
      gazeLog: () => ({ now: gazeRig.trace.at(-1)?.t ?? 0, saccades: gazeRig.log.slice() }),
      irisAt: () => ({ ...irisOnScreen.current }),
      eyeCentre: () => ({ ...eyeOnScreen.current }),
      gazeInfo: () => ({
        pattern: patternOverride.current ?? look.gazePattern,
        blinkEvery: blinkRig.every,
      }),
    };
    return () => {
      control.current = null;
    };
  }, [
    control,
    U,
    info,
    eyeball,
    lids,
    lashes,
    meniscus,
    socket,
    room,
    scene,
    blinkRig,
    gazeRig,
    driver,
    pupilRig,
    look,
    pages,
    director,
  ]);

  /* ---- the frame -------------------------------------------------------- */

  /** The era the frame last woke for, so a scroll with a still pointer still cuts. */
  const wokeFor = useRef(era.id);

  useFrame((_state, delta) => {
    if (hidden.current || !compiled.current) return;

    const now = performance.now() / 1000;
    const pointerIdle = now - pointer.current.seen > 2.8;
    const W = warm.current;
    const covered = coveredRef.current;
    // (every era's medium builds off the main thread too, in the background,
    // until all ten exist: built the plain way, each would freeze the browser)
    W.async = !W.done || covered || !allMedia.current;
    // The lab measures every frame; the loader may rest, but only while the
    // eye is holding still: never through a saccade, its wobble or a blink.
    // Skipped time is carried, so the eye's clock never slows.
    const h0 = health.current;
    if (gazeRig.busy || blinkRig.active || director.busy) h0.moved = now;
    // lids moved from outside (the loader opening the eye) are motion too
    const heldBlink = hold.current.blink ?? -1;
    if (heldBlink !== h0.heldBlink) {
      h0.moved = now;
      h0.heldBlink = heldBlink;
    }
    // a new year is motion, even when the pointer has been still long enough
    // that the eye is drawing every third frame
    if (wokeFor.current !== era.id) {
      wokeFor.current = era.id;
      h0.moved = now;
    }
    // covered: nobody sees these frames, so only enough of them to keep the
    // eye's clock, its fade and its warm-up going (the GPU is the opening's)
    if (covered && !pendingCapture.current && now - h0.drawn < COVERED_EVERY) {
      h0.owed += delta;
      return;
    }
    if (
      !covered &&
      pointerIdle &&
      !exiting &&
      !profile &&
      !pendingCapture.current &&
      readySent.current &&
      now - h0.moved > 0.25
    ) {
      h0.skip = (h0.skip + 1) % 3;
      if (h0.skip !== 0) {
        h0.owed += delta;
        return;
      }
    }
    h0.drawn = now;
    const dt = Math.min(delta + h0.owed, 0.1);
    h0.owed = 0;
    if (!reduce) U.time.value += dt;

    // Framing is shared with the dial and the picker's hit-testing, so all
    // three agree about where the iris is on a phone.
    frameCamera(camera, size.width, size.height, frameBox);
    const frame = eyeShot(size.width, size.height, frameBox);
    U.span.value = frame.span;
    U.offsetY.value = frame.offsetY;
    // The further back the shot stands, the fewer pixels a texel of the era's
    // page gets, so it is sampled out of a coarser mip: a dithered terminal
    // otherwise turns to a snowstorm of specks on a phone.
    U.mip.value = Math.max(0, Math.log2(frame.span / REF_SPAN)) * 1.15;

    // gaze: a held target (lab), else the pointer, else the room
    /** A pointer is here (even under reduced motion, for the era's sign). */
    const seen = interactive && now - pointer.current.seen < POINTER_HOLD;
    const fresh = seen && !reduce;

    // ---- ten ways of seeing: the cut between eras is the person's blink -----
    // (post/medium-director.ts). The era's light, lens and page follow the
    // director's swap, made while the lids are shut.
    /** Whether era n's medium can draw (its pipeline built); WebGL2 builds on first use, behind the shut lids. */
    const mediaReady = (n: number) =>
      info.backend !== 'webgpu' ||
      !pipeline.media ||
      builtMats.current.get(pipeline.media.quad(n)) === true;
    if (media) {
      const P = pointer.current;
      const iris = irisOnScreen.current;
      const overIris =
        Math.hypot(((P.x + 1) / 2) * size.width - iris.x, ((P.y + 1) / 2) * size.height - iris.y) <
        iris.r;
      const held = mediumHold.current;
      director.update({
        want: held ?? mediumOf(era.id),
        dt: dt * mediumRate.current,
        reduce,
        calm,
        exiting,
        lid: U.blink.value,
        // (the cut waits a little, behind shut lids, for the new era's light and its page)
        applied: held === null ? (pages.ready(view.id) ? applied.current : 0) : director.cur,
        hover: seen && P.mouse && overIris,
        // a finger's press shows after 100 ms, so the start of a swipe never flashes it
        down: P.down && P.onIris && !P.dragged && (P.mouse || now - P.downAt > 0.1),
        dragged: P.down && P.dragged,
        near:
          seen &&
          P.mouse &&
          Math.hypot(
            ((P.x + 1) / 2) * size.width - iris.x,
            ((P.y + 1) / 2) * size.height - iris.y,
          ) <
            iris.r * 2.5,
        // (medium space is 1-based; the lab's held medium ignores the hand)
        travel: held === null && travelPos.current !== null ? travelPos.current + 1 : null,
        ready: mediaReady,
      });
      const next = held === null ? (ERA_MEDIA[director.cur - 1] ?? era.id) : era.id;
      if ((director.swap || held !== null) && next !== shownId) setShownId(next);
      if (!director.busy) glanceFrom.current = null;
      else if (glanceFrom.current === null) glanceFrom.current = U.gaze.value.x;
    }
    // the new era's light and lens land at once, behind the shut lids
    const snapLook = media && lastLook.current !== null && lastLook.current !== look;
    lastLook.current = look;

    const target =
      hold.current.gaze ??
      (fresh
        ? {
            x: THREE.MathUtils.clamp(pointer.current.x, -1, 1) * (calm ? CALM.gaze : 1),
            y: THREE.MathUtils.clamp(-pointer.current.y, -1, 1) * (calm ? CALM.gaze : 1),
          }
        : media && director.look !== null
          ? {
              x: THREE.MathUtils.clamp((glanceFrom.current ?? 0) + director.look, -0.85, 0.85),
              y: look.restGaze[1],
            }
          : null);
    const g = gazeRig.update(dt, target, reduce);
    U.gaze.value.set(g.x, g.y);
    // The lids: the loader's hold (its opening) and the director's cut both
    // own them at times; the more shut wins, so a cut never swaps eras with
    // the eye open. The blink rig runs every frame, so a natural blink caught
    // by a cut finishes unseen behind it instead of replaying after.
    const heldLid = hold.current.blink;
    const cutLid = media ? director.blink : null;
    const natural = blinkRig.update(
      dt,
      reduce,
      exiting || hold.current.stare || heldLid !== null || (media && director.quiet),
    );
    U.blink.value =
      heldLid !== null && cutLid !== null
        ? Math.max(heldLid, cutLid)
        : (heldLid ?? cutLid ?? natural);
    // up is a negative pitch about x; under a closing lid the eye rolls up
    eyeball.group.rotation.set(-g.y * GAZE_PITCH - U.blink.value * BELL_PITCH, g.x * GAZE_YAW, 0);

    // ---- post-saccadic wobble: the iris lags the turn, then rings down ------
    {
      const w = wobble.current;
      const yaw = eyeball.group.rotation.y;
      const pitch = eyeball.group.rotation.x;
      const wYaw = (yaw - w.yaw) / Math.max(dt, 1e-3);
      const wPitch = (pitch - w.pitch) / Math.max(dt, 1e-3);
      const aYaw = (wYaw - w.wYaw) / Math.max(dt, 1e-3);
      const aPitch = (wPitch - w.wPitch) / Math.max(dt, 1e-3);
      w.yaw = yaw;
      w.pitch = pitch;
      w.wYaw = wYaw;
      w.wPitch = wPitch;
      if (reduce) {
        w.x = w.y = w.vx = w.vy = 0;
      } else {
        const omega = 2 * Math.PI * 9; // slower than life, or a 60 Hz frame cannot show it
        const zeta = 0.32;
        const gain = 0.6;
        const ax = -omega * omega * w.x - 2 * zeta * omega * w.vx - aYaw * gain;
        const ay = -omega * omega * w.y - 2 * zeta * omega * w.vy + aPitch * gain;
        w.vx += ax * dt;
        w.vy += ay * dt;
        w.x = THREE.MathUtils.clamp(w.x + w.vx * dt, -0.25, 0.25);
        w.y = THREE.MathUtils.clamp(w.y + w.vy * dt, -0.25, 0.25);
      }
      U.iris.wobble.value.set(w.x, w.y);
    }

    // ---- the lids: the person's aperture, coupled to the gaze, squinting at a
    // bright page ------------------------------------------------------------
    const fa = fissureAngles(identity.lids.aperture);
    const LU = U.lids;
    LU.phiM.value = fa.phiM;
    LU.phiL.value = fa.phiL;
    LU.upper.value = fa.upper;
    LU.lower.value = fa.lower;
    LU.tilt.value = THREE.MathUtils.degToRad(identity.lids.tilt);
    // the upper lid follows the eye's pitch (not Bell's roll under a blink)
    LU.pitch.value = g.y * GAZE_PITCH;
    // the apex sits a little toward the nose, and drifts after the cornea
    LU.peak.value = -0.04 + 0.25 * g.x * GAZE_YAW;
    const glare = THREE.MathUtils.smoothstep(U.screenLum.value, 0.55, 0.95);
    // (a white page narrows the eye a little, not to sleepiness: the lid already covers the iris's top)
    const squintGoal = Math.max(glare * 0.6, look.squintRest);
    LU.squint.value =
      hold.current.squint ?? damp(LU.squint.value, reduce ? look.squintRest : squintGoal, 1.5, dt);
    // The brow, by its move-net (nodes/brow-net.ts). Frontalis arches the
    // middle as the eye looks up and with interest (the pointer resting on
    // the eye), a little behind the eye; a greeting flash (a quick lift, held
    // a moment) when a visitor's pointer arrives after a while away, or when
    // the eye first opens on them. Corrugator frowns into glare, and into a
    // page being read. Orbicularis (squint, blink) is read from the lids directly.
    {
      const lift = 0.6 * THREE.MathUtils.clamp(g.y, -0.6, 1) + 0.3 * browInterest.current;
      browBase.current = damp(browBase.current, lift, 6, dt);
      const t = now - browFlash.current;
      const flash =
        t < 0 ? 0 : t < 0.14 ? t / 0.14 : t < 0.36 ? 1 : Math.max(0, 1 - (t - 0.36) / 0.45);
      LU.brow.value = reduce ? 0 : browBase.current + 1.5 * flash * flash * (3 - 2 * flash);
      const reading = (patternOverride.current ?? look.gazePattern) === 'read';
      LU.frown.value = reduce
        ? 0
        : damp(LU.frown.value, 0.55 * glare + (reading ? 0.22 : 0), 2, dt);
    }

    // ---- the era's second light: its colour crossfades, its shape is the era's
    {
      const F = U.fill;
      const fill = look.light.fill;
      const goal = fill
        ? FILL_TMP.set(fill.color).multiplyScalar(fill.strength)
        : FILL_TMP.setRGB(0, 0, 0);
      F.color.value.lerp(goal, reduce || snapLook ? 1 : 1 - Math.exp(-3 * dt));
      if (fill) {
        F.dir.value.set(...fill.dir).normalize();
        F.center.value.set(...fill.pos);
        // it faces the eye; its long side lies across
        F.normal.value.copy(F.center.value).negate().normalize();
        F.right.value.crossVectors(F.normal.value, UP_TMP).normalize();
        F.up.value.crossVectors(F.right.value, F.normal.value).normalize();
        F.size.value.set(...fill.size);
        F.round.value = fill.round;
      }
    }

    // ---- the lashes lag a moving lid, then settle -------------------------
    // The margins' apex (margins.ts marginsAt at s = 0), followed frame to
    // frame: a spring pulls each row's extra curl toward its lid's speed, so
    // the tips trail a blink and overshoot a little when the lid stops.
    {
      const sq = LU.squint.value;
      const b = U.blink.value;
      const loOpen = -fa.lower * (1 - 0.2 * sq) + 0.35 * LU.pitch.value;
      const upOpen = Math.max(
        fa.upper * (1 - 0.25 * sq) + (LU.pitch.value < 0 ? 0.7 : 0.85) * LU.pitch.value,
        loOpen + 0.004,
      );
      const lo = loOpen + b * 0.12 * fa.lower;
      const up = Math.max(upOpen + (lo + 0.012 - upOpen) * b, lo + 0.004);
      // where the margins' apexes stand above and below the globe's centre, mm (the media's masks)
      lidReach.current.up = MARGIN_RADIUS * Math.sin(up);
      lidReach.current.lo = -MARGIN_RADIUS * Math.sin(lo);
      const l = lashLag.current;
      if (reduce || Number.isNaN(l.up)) {
        l.xU = l.vU = l.xL = l.vL = 0;
      } else {
        const vUp = (up - l.up) / Math.max(dt, 1e-3);
        const vLo = (lo - l.lo) / Math.max(dt, 1e-3);
        // the upper row trails upward while its lid falls, the lower downward while its lid rises
        const tU = THREE.MathUtils.clamp(-vUp * 0.03, -0.6, 0.6);
        const tL = THREE.MathUtils.clamp(vLo * 0.03, -0.6, 0.6);
        const omega = 2 * Math.PI * 7;
        const zeta = 0.35;
        const h = Math.min(dt, 0.1) / 4;
        for (let i = 0; i < 4; i++) {
          l.vU += (-omega * omega * (l.xU - tU) - 2 * zeta * omega * l.vU) * h;
          l.xU += l.vU * h;
          l.vL += (-omega * omega * (l.xL - tL) - 2 * zeta * omega * l.vL) * h;
          l.xL += l.vL * h;
        }
      }
      l.up = up;
      l.lo = lo;
      U.lashes.lagUpper.value = l.xU;
      U.lashes.lagLower.value = l.xL;
      // one device pixel at the eye, mm: strands thinner than this keep their coverage
      const fov = THREE.MathUtils.degToRad(camera.fov);
      U.lashes.pxMm.value =
        (2 * Math.max(camera.position.z - 12, 1) * Math.tan(fov / 2)) /
        Math.max(size.height * dpr, 1);
    }

    // a big jump of the eyes often brings a blink with it, the bigger the likelier
    if (gazeRig.lastSaccade > 0) {
      const p = THREE.MathUtils.smoothstep(gazeRig.lastSaccade, 12, 35) * 0.7;
      if (!reduce && !exiting && !(media && director.quiet) && Math.random() < p)
        blinkRig.trigger();
      gazeRig.lastSaccade = 0;
    }
    // (it fades in only once warm: until then parts of it may not be drawn yet)
    U.fade.value = W.done ? damp(U.fade.value, 1, reduce ? 30 : 5, dt) : 0;

    U.screenLum.value = snapLook ? lum : damp(U.screenLum.value, lum, 3, dt);

    // ---- the era's screen, at its own frame rate --------------------------
    // It is a defocused reflection that rebuilds a mip chain every time it
    // draws, so it runs at UI_FPS; a layout crossfade makes it keep up.
    // the reading eye turns a page: the page scrolls up by what it has read
    if (look.stepScroll && gazeRig.pagesTurned !== pagesTurned.current) {
      driver.kick(0.16);
      pagesTurned.current = gazeRig.pagesTurned;
    }
    // the page in the reflection scrolls at half the era's rate: calmer to watch
    // behind shut lids on a cut, the new screen lands whole
    const lidsShut = media && U.blink.value > 0.9;
    driver.update(dt, visual, palCols, reduce, look.stepScroll, 0.5, lidsShut);
    writeScreenUniforms(U.screen, driver.state);
    const pageFading =
      pages.update(view.id, hold.current.pagesOn, dt, reduce, lidsShut) || lidsShut;
    U.screen.pageOn.value = pages.on;
    U.screen.pageMix.value = pages.mix;
    U.screen.pageViewA.value = pages.viewA;
    U.screen.pageViewB.value = pages.viewB;
    // the visitor's pointer, on the screen the eye is looking at
    if (fresh) {
      U.screen.cursorPos.value.set((pointer.current.x + 1) / 2, 1 - (pointer.current.y + 1) / 2);
    }
    U.screen.cursorAlpha.value = damp(U.screen.cursorAlpha.value, fresh ? 1 : 0, 8, dt);
    // ---- the tears ----------------------------------------------------------
    // Shut, the lid lays the film down fresh; opening, it drags the film up
    // for a second; then it thins, and after a long stare it breaks up. Reduced
    // motion keeps it fresh: no blinks come to clear it.
    {
      const tr = tears.current;
      const shut = U.blink.value > 0.85;
      if (shut) {
        if (!tr.shut) tr.seed = (tr.seed + 1) % 97;
        tr.shut = true;
        tr.sinceBlink = 0;
      } else {
        if (tr.shut && U.blink.value < 0.5) {
          tr.shut = false;
          tr.opened = now;
        }
        tr.sinceBlink += dt;
      }
      tr.tearing = Math.max(0, tr.tearing - dt * 0.15);
      const sinceOpen = now - tr.opened;
      tear.inputs.fresh.value = shut || reduce ? 1 : 0;
      tear.inputs.creep.value = reduce ? 0 : 0.6 * Math.exp(-sinceOpen / 0.5);
      tear.inputs.seed.value = tr.seed;
      tear.step(gl, dt, !reduce);
      // the bead swells and brightens just after a blink, and with reflex tears
      const fresh = Math.exp(-Math.max(sinceOpen, 0) / 1.5);
      U.tear.tearing.value = tr.tearing;
      U.tear.meniscus.value = 0.22 * (1 + tr.tearing * 1.2) * (1 + 0.25 * fresh);
      U.tear.wet.value = 1 + 0.6 * fresh + 1.5 * tr.tearing;
    }

    vessels.render(gl);
    skinBake.render(gl);
    skinFace.render(gl);
    // a fresh iris lands in the back set; crossfade to it
    const landed = irisBake.render(gl);
    if (landed >= 0) {
      const st = irisState.current;
      st.baked += 1;
      st.active = landed as 0 | 1;
      st.goal = landed;
      if (st.baked === 1) U.iris.weightB.value = landed;
    }
    U.iris.weightB.value = damp(
      U.iris.weightB.value,
      irisState.current.goal,
      reduce ? 60 : 4.5,
      dt,
    );
    uiDue.current += dt;
    if (uiDue.current >= 1 / UI_FPS || driver.crossfading || pageFading) {
      uiDue.current = 0;
      screen.render(gl);
    }

    // ---- the pupil: a reflex to the screen's light, near focus and interest ---
    // Where the iris is on screen right now: the frame's centre, moved by the
    // globe's turn (its front sits ~10.4 mm from the centre of rotation).
    const pxPerMm = frame.irisPx / ANATOMY.irisRadius;
    const irisX = frame.cx + Math.sin(eyeball.group.rotation.y) * 10.4 * pxPerMm;
    const irisY = frame.cy + Math.sin(eyeball.group.rotation.x) * 10.4 * pxPerMm;
    irisOnScreen.current = { x: irisX, y: irisY, r: frame.irisPx };
    // ---- ten ways of seeing: what the medium needs to know about the frame ---
    if (media) {
      const M = U.medium;
      const W = Math.max(size.width, 1);
      const Hh = Math.max(size.height, 1);
      const d = director;
      M.cur.value = d.cur;
      M.dep.value = d.dep;
      M.arr.value = d.arr;
      M.dir.value = d.dir;
      M.clock.value = d.clock;
      M.since.value = d.since;
      M.steady.value = reduce ? 1 : 0;
      M.signA.value = d.signA;
      M.hover.value = d.hover;
      M.press.value = d.press;
      M.enter.value = d.enter;
      M.seed.value = d.seed;
      M.ripple.value = d.ripple;
      // how much is moving (the pointer in screen heights a second, the eye
      // in iris radii a second; eased: it rises quickly and settles slowly),
      // which 2026's trackers lose certainty with
      const ux = (pointer.current.x + 1) / 2;
      const uy = (pointer.current.y + 1) / 2;
      {
        const lp = listenFrom.current;
        const speed = Number.isNaN(lp.x)
          ? 0
          : Math.hypot((ux - lp.x) * (W / Hh), uy - lp.y) / Math.max(dt, 1e-3);
        const eyeSpeed = Number.isNaN(lp.ix)
          ? 0
          : Math.hypot(irisX - lp.ix, irisY - lp.iy) /
            Math.max(frame.irisPx, 1) /
            Math.max(dt, 1e-3);
        lp.x = ux;
        lp.y = uy;
        lp.ix = irisX;
        lp.iy = irisY;
        const goal = Math.max(
          fresh ? Math.min(1, speed * 0.6) : 0,
          reduce ? 0 : Math.min(1, eyeSpeed / 12),
        );
        M.listen.value = damp(M.listen.value, goal, goal > M.listen.value ? 6 : 1.2, dt);
      }
      // 2026 measures you: your pointer or finger (under reduced motion too),
      // where it rests, and the eye's own turn
      const tracked = interactive && now - pointer.current.seen < 20;
      M.track.value = reduce ? (tracked ? 1 : 0) : damp(M.track.value, tracked ? 1 : 0, 6, dt);
      if (seen && reduce) M.ptr.value.set(ux, uy);
      attention.update(dt, ux, uy, W / Hh, tracked);
      for (let i = 0; i < 6; i++) {
        const f = attention.fixes[i];
        const v = M.fix.array[i] as THREE.Vector4;
        if (f) v.set(f.x, f.y, f.dwell, attention.alpha(f));
        else v.w = 0;
        M.fixN.array[i] = f ? f.n : 0;
      }
      M.gazeDeg.value.set(
        THREE.MathUtils.radToDeg(eyeball.group.rotation.y),
        -THREE.MathUtils.radToDeg(eyeball.group.rotation.x),
      );
      M.fixTotal.value = attention.total;
      {
        const bc = blinkCount.current;
        if (U.blink.value > 0.85 && !bc.shut) bc.n += 1;
        bc.shut = U.blink.value > 0.85 || (bc.shut && U.blink.value > 0.5);
        M.blinks.value = bc.n;
      }
      // the gimbal scans about the gaze axis while the pointer is over the iris
      if (!reduce) M.spin.value = (M.spin.value + dt * 0.7 * d.hover) % (Math.PI * 2);
      // the loader's corner plates stand 64 CSS px tall from the foot, at any pixel ratio
      M.foot.value = interactive ? FOOT_CSS_PX * gl.getPixelRatio() : 0;
      {
        const tr = trace.current.samples;
        const hist = M.pupilHist.array as number[];
        for (let i = 0; i < 32; i++)
          hist[i] = tr.length ? tr[Math.round((i / 31) * (tr.length - 1))] : 3.5;
      }
      M.idle.value = Math.min(now - pointer.current.seen, 1e3);
      // (a finger is not a cursor: 1981's parked arrow stays for touch)
      M.ptrOn.value = damp(M.ptrOn.value, fresh && pointer.current.mouse ? 1 : 0, 8, dt);
      if (fresh) {
        M.ptr.value.set(
          damp(M.ptr.value.x, (pointer.current.x + 1) / 2, 8, dt),
          damp(M.ptr.value.y, (pointer.current.y + 1) / 2, 8, dt),
        );
      }
      M.eye.value.set(frame.cx / W, frame.cy / Hh);
      M.irisR.value = frame.irisPx / Hh;
      // the lid opening's reach from the globe's centre: its corners
      // (margins.ts FISSURE_MM), and the margins' apexes as the lids stand
      // this frame (gaze, squint, blink)
      M.apX.value.set((FISSURE_MM.medial * pxPerMm) / Hh, (FISSURE_MM.lateral * pxPerMm) / Hh);
      M.apY.value.set((lidReach.current.up * pxPerMm) / Hh, (lidReach.current.lo * pxPerMm) / Hh);
      M.pupil.value.set(irisX / W, irisY / Hh);
    }
    eyeOnScreen.current = { x: frame.cx, y: frame.cy, r: frame.irisPx };
    const px = ((pointer.current.x + 1) / 2) * size.width;
    const py = ((pointer.current.y + 1) / 2) * size.height;
    const toIris = Math.hypot(px - irisX, py - irisY) / Math.max(frame.irisPx, 1);
    browInterest.current = damp(browInterest.current, fresh && toIris < 1 ? 1 : 0, 1.5, dt);
    const nearT = THREE.MathUtils.clamp((toIris - 0.6) / 2.4, 0, 1);
    U.pupil.value = pupilRig.update(dt, {
      lum: U.screenLum.value,
      near: fresh ? 1 - nearT * nearT * (3 - 2 * nearT) : 0,
      hover: fresh && toIris < 1,
      exiting,
      reduce,
      hold: hold.current.pupil,
      extraLogL: hold.current.extraLogL,
      still: hold.current.still,
      personScale: identity.pupil.rest / 0.34,
    });
    U.redReflex.value = hold.current.red ?? pupilRig.red;
    if (media) {
      U.medium.pupilR.value = (frame.irisPx * U.pupil.value) / Math.max(size.height, 1);
      U.medium.pupilMm.value = pupilRig.d;
    }
    const tr = trace.current;
    tr.due -= dt;
    if (tr.due <= 0) {
      tr.due = 1 / 30;
      tr.samples.push(pupilRig.d);
      if (tr.samples.length > 180) tr.samples.shift();
    }

    // ---- the camera: focus racks to what the pointer is over ----------------
    {
      const cs = camState.current;
      const dxMm = (px - frame.cx) / pxPerMm;
      const dyMm = (py - frame.cy) / pxPerMm;
      let target = FOCUS_IRIS;
      if (fresh && !reduce) {
        const aperture = Math.abs(dxMm) < 13 && dyMm > -5 && dyMm < 5.5;
        const lashBand =
          Math.abs(dxMm) < 14 && ((dyMm < -4 && dyMm > -10) || (dyMm > 5.5 && dyMm < 8.5));
        if (toIris < 1.1 || aperture) target = FOCUS_IRIS;
        else if (lashBand) target = FOCUS_LASHES;
        else target = Math.max(-8, 11 - 0.02 * dxMm * dxMm - 0.008 * dyMm * dyMm);
      }
      target = hold.current.focus ?? target;
      cs.focusZ = reduce || hold.current.focus !== null ? target : damp(cs.focusZ, target, 3, dt);
      U.cam.focus.value = camera.position.z - cs.focusZ;
      // (no focus breathing: a frame that scales as focus racks reads as the face zooming)

      // ---- the era's lens, crossfading; an artefact fades out before the next fades in
      const LS = U.lens;
      const goal = look.lens;
      const k = reduce ? 60 : 3;
      for (const key of LENS_NUMBERS) {
        const v = key === 'grain' && calm ? goal.grain * CALM.grain : goal[key];
        LS[key].value = snapLook ? v : damp(LS[key].value, v, k, dt);
      }
      const want = LENS_ARTEFACTS.indexOf(goal.artefact);
      if (snapLook) {
        LS.artefact.value = want;
        LS.amount.value = goal.amount;
      } else if (LS.artefact.value !== want) {
        LS.amount.value = damp(LS.amount.value, 0, reduce ? 60 : 6, dt);
        if (LS.amount.value < 0.04) LS.artefact.value = want;
      } else {
        LS.amount.value = damp(LS.amount.value, goal.amount, k, dt);
      }
      LS.on.value = damp(LS.on.value, hold.current.lensOn ? 1 : 0, reduce ? 60 : 6, dt);
      LS.catchlight.value =
        LS.artefact.value === LENS_ARTEFACTS.indexOf('flash') ? LS.amount.value * LS.on.value : 0;
      // grain changes at a film's rate, not every frame: a 60 Hz shimmer tires the eye
      cs.grainDue -= dt;
      if (!reduce && cs.grainDue <= 0) {
        cs.grainDue = 1 / 12;
        cs.seed = (cs.seed + 1) % 997;
      }
      LS.seed.value = cs.seed;
      pipeline.bloomStrength.value = 0.25 * LS.bloom.value;
      U.cam.bokeh.value = 2.8 * LS.aperture.value;
      // how fast the reflection is crossing the frame, UV per second (top-down)
      if (!Number.isNaN(cs.irisX) && dt > 0) {
        const vx = (irisX - cs.irisX) / dt / Math.max(size.width, 1);
        const vy = (irisY - cs.irisY) / dt / Math.max(size.height, 1);
        LS.motion.value.set(
          damp(LS.motion.value.x, vx, 30, dt),
          damp(LS.motion.value.y, vy, 30, dt),
        );
      }
      cs.irisX = irisX;
      cs.irisY = irisY;
    }

    // Warming, the first frames build the stage in steps, so that no one frame
    // builds every node graph and shader at once (the GPU process parses a
    // frame's new shaders in one go, and every frame on screen, the loader's
    // opening included, waits for it): the bakes and the era's screen first
    // (above), then the post chain over an empty room, then the eye a few
    // parts at a time.
    const warmStep = W.done ? -1 : W.step++;
    if (warmStep >= 1 && warmStep <= WARM_PARTS.length) {
      const shown = WARM_PARTS.slice(0, warmStep).flat();
      for (const layer of Object.keys(layers.current) as EyeLayer[]) {
        layerObject(layer).visible = layers.current[layer] && shown.includes(layer);
      }
    }

    // Once the era on screen is up, the other eras' media build one at a
    // time in the background: the era asked for first, then the nearest. A
    // cut to an era still building waits behind shut lids (the director).
    if (pipeline.media && info.backend === 'webgpu' && W.done && !allMedia.current) {
      const want = mediumHold.current ?? mediumOf(era.id);
      const cur = Math.max(1, director.cur);
      let next: number | null = want >= 1 && !mediaReady(want) ? want : null;
      for (let k = 1; next === null && k <= ERA_MEDIA.length; k++) {
        for (const n of [cur + k, cur - k])
          if (next === null && n >= 1 && n <= ERA_MEDIA.length && !mediaReady(n)) next = n;
      }
      if (next === null && !mediaReady(cur)) next = cur;
      pipeline.media.warm(next);
      if (next === null) allMedia.current = true;
    }

    const t0 = performance.now();
    if (warmStep !== 0) pipeline.render();
    if (pendingCapture.current) {
      pendingCapture.current(gl.domElement.toDataURL('image/png'));
      pendingCapture.current = null;
    }
    const cpu = performance.now() - t0;

    // warm: every step taken, then a moment of frames that asked for no new pipeline, and none still building
    if (!W.done) {
      if (W.made !== W.seen || W.pending > 0 || W.step <= WARM_PARTS.length) {
        W.seen = W.made;
        W.quietSince = now;
      } else if (now - W.quietSince > WARM_QUIET) {
        W.done = true;
        // the bakes drew once, during the warm-up, when their pipelines were
        // still building and so were skipped: the iris's fibres, the white's
        // vessels and the skin's pores would stay blank until something asked
        // again (an era change). Now every pipeline exists, so bake again,
        // before the stage fades in.
        vessels.redo();
        skinBake.redo();
        skinFace.redo();
        irisBake.redo();
        tear.reset();
      }
    }

    if (!readySent.current && U.fade.value > READY_AT) {
      readySent.current = true;
      browFlash.current = performance.now() / 1000 + 1.2;
      onReady?.(info);
    }

    // ---- the meter, read by the lab -------------------------------------
    const m = meter.current;
    m.frames += 1;
    m.cpu += cpu;
    if (m.since === 0) m.since = now;
    if (now - m.since >= 0.5) {
      const s = stats.current;
      s.fps = m.frames / (now - m.since);
      s.cpuMs = m.cpu / m.frames;
      s.drawCalls = gl.info.render.drawCalls;
      s.triangles = gl.info.render.triangles;
      s.geometries = gl.info.memory.geometries;
      s.textures = gl.info.memory.textures;
      s.dpr = dpr;
      m.frames = 0;
      m.cpu = 0;
      m.since = now;
      if (profile) {
        gl.resolveTimestampsAsync(THREE.TimestampQuery.RENDER)
          .then((ms) => {
            s.gpuMs = typeof ms === 'number' ? ms : null;
          })
          .catch(() => {
            s.gpuMs = null;
          });
      }
    }

    // ---- watchdog: give up pixels once rather than drop frames all visit --
    // It reads the display's own frame interval, not the frames drawn: a
    // resting or covered stage skips frames on purpose, and that is not
    // slowness (read as slowness, a still pointer stepped the ratio down to
    // its floor, with a stall at each step). The warm-up's builds and a
    // covered stage's sharing of the GPU are not the eye's cost either.
    const h = health.current;
    if (!W.done || covered) {
      h.ema = 1 / 60;
      h.cool = Math.max(h.cool, 2);
    } else {
      h.ema += (Math.min(delta, 0.1) - h.ema) * 0.05;
      h.cool -= dt;
    }
    if (!profile && h.cool <= 0 && h.ema > 1 / 45 && dpr > DPR_MIN) {
      h.cool = 1.5;
      h.ema = 1 / 60;
      setDpr(Math.max(DPR_MIN, dpr * 0.85));
    }
  }, 1);

  return null;
}

/** Anything that fails on the way up — no WebGPU and no WebGL2, a compile
 *  error — leaves the poster where it is instead of a broken canvas. */
class StageBoundary extends Component<
  { onFail?: (error: unknown) => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onFail?.(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface EyeStageProps {
  era: ThemeConfig;
  exiting?: boolean;
  reduce?: boolean;
  interactive?: boolean;
  /** Test the WebGL2 backend on a machine that has WebGPU. */
  forceWebGL?: boolean;
  /** Lab: measure GPU time and render every frame. */
  profile?: boolean;
  /** Lab: hold the pixel ratio under this, below whatever the tier allows. */
  dprCap?: number;
  onReady?: (info: EyeStageInfo) => void;
  onFail?: (error: unknown) => void;
  control?: React.MutableRefObject<EyeStageControl | null>;
  /** A shot of the caller's own (FrameBox); by default framing.ts picks a phone's or a wide screen's. */
  frameBox?: FrameBox;
  /** Ten ways of seeing (post/era-medium.ts): the frame through each era's own screen and image technology. The loader always asks for it. */
  media?: boolean;
  /** Phones: fainter grain, a smaller gaze and a slower sweep (CALM). */
  calm?: boolean;
  /** Lab: resolves with the next drawn frame as a PNG data URL (poster capture). */
  capture?: React.MutableRefObject<(() => Promise<string>) | null>;
  /** Something opaque is over the stage (the loader's opening): it draws only now and then, keeping its clock, and leaves the GPU to what is on screen. */
  covered?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function EyeStage({
  era,
  exiting = false,
  reduce = false,
  interactive = true,
  forceWebGL = false,
  profile = false,
  dprCap = 2,
  onReady,
  onFail,
  control,
  capture,
  frameBox,
  media,
  calm,
  covered,
  className,
  style,
}: EyeStageProps) {
  // a first guess; the scene settles it once the tier is known
  const [dpr, setDpr] = useState(() => budgetDpr(Math.min(2, dprCap)));

  return (
    <StageBoundary onFail={onFail}>
      <Canvas
        className={className}
        dpr={dpr}
        // no renderer tone mapping: the pipeline grades once, with the live eye's curve
        flat
        camera={{ fov: CAMERA_FOV, near: 1, far: 2000, position: [0, 0, 300] }}
        gl={async (props) => {
          const renderer = new THREE.WebGPURenderer({
            ...(props as THREE.WebGPURendererParameters),
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
            forceWebGL,
            trackTimestamp: profile,
          });
          await renderer.init();
          return renderer as unknown as THREE.Renderer & {
            render: (s: THREE.Scene, c: THREE.Camera) => void;
          };
        }}
        style={{ position: 'absolute', inset: 0, touchAction: 'none', ...style }}
      >
        <EyeScene
          era={era}
          exiting={exiting}
          reduce={reduce}
          interactive={interactive}
          profile={profile}
          dprCap={dprCap}
          setDpr={setDpr}
          onReady={onReady}
          control={control}
          capture={capture}
          frameBox={frameBox}
          media={media}
          calm={calm}
          covered={covered}
        />
      </Canvas>
    </StageBoundary>
  );
}
