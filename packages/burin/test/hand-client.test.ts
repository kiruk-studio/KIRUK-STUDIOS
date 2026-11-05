/**
 * createHand: the page's door to the painter. A fake Worker stands in for p5.brush;
 * ImageBitmaps are stubs with a close() (node has none).
 * spec-link: ideas/studio-dawn/hand.md
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeSheet, createHand } from '../src/hand/index';
import type { HandRequest, HandSheet } from '../src/hand/media';
import type { HandFromWorker, HandToWorker } from '../src/hand/worker';

type Bitmap = { close: ReturnType<typeof vi.fn> };

class FakeWorker {
  posted: HandToWorker[] = [];
  terminated = false;
  private on: Record<string, ((e: unknown) => void)[]> = { message: [], error: [] };
  addEventListener(type: string, f: (e: unknown) => void) {
    this.on[type]?.push(f);
  }
  postMessage(m: HandToWorker) {
    this.posted.push(m);
  }
  terminate() {
    this.terminated = true;
  }
  emit(data: HandFromWorker) {
    for (const f of this.on.message!) f({ data });
  }
  crash(message: string) {
    for (const f of this.on.error!) f({ message });
  }
  get last() {
    return this.posted[this.posted.length - 1]!;
  }
}

const bitmap = (): Bitmap => ({ close: vi.fn() });

const sheet = (seed: number, via: 'worker' | 'main' = 'worker'): HandSheet =>
  ({
    subject: 'eye',
    seed,
    region: [0, 0, 100, 100],
    density: 1,
    layers: { chalk: bitmap(), wash: bitmap(), ink: bitmap(), body: bitmap() },
    iris: { bitmap: bitmap(), rect: [0, 0, 10, 10] },
    ms: 12,
    via,
  }) as unknown as HandSheet;

const req = (seed: number): HandRequest => ({
  subject: 'eye',
  seed,
  region: [0, 0, 100, 100],
  density: 1,
  params: {},
});

const closed = (s: HandSheet) =>
  [...Object.values(s.layers), s.iris!.bitmap].map(
    (b) => (b as unknown as Bitmap).close.mock.calls.length,
  );

/** Let the hand's promises and the microtasks behind them run. */
const flush = () => new Promise((r) => setTimeout(r, 0));

const local = (paint = vi.fn(async (_c: unknown, r: HandRequest) => sheet(r.seed, 'worker'))) => ({
  paint,
  lib: async () => ({
    paintSheet: paint as never,
    paintingCanvas: (() => ({})) as never,
    recipes: {},
  }),
});

function withWorker() {
  const w = new FakeWorker();
  const hand = createHand({ worker: () => w as unknown as Worker });
  return { w, hand };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createHand via a worker', () => {
  it('paints through the worker once it is ready', async () => {
    const { w, hand } = withWorker();
    expect(hand.status().state).toBe('starting');
    w.emit({ type: 'ready', webgl2: true });
    const p = hand.paint(req(1));
    await flush();
    expect(hand.status()).toMatchObject({ state: 'painting', via: 'worker' });
    expect(w.last).toMatchObject({ type: 'paint', req: { seed: 1 } });
    const s = sheet(1);
    w.emit({ type: 'sheet', id: w.last.id, sheet: s });
    expect(await p).toBe(s);
    expect(hand.status()).toMatchObject({ state: 'idle', via: 'worker', ms: 12 });
    expect(closed(s)).toEqual([0, 0, 0, 0, 0]);
  });

  it('the latest request wins: superseded paints resolve null and their bitmaps are closed', async () => {
    const { w, hand } = withWorker();
    w.emit({ type: 'ready', webgl2: true });
    const p1 = hand.paint(req(1));
    await flush();
    const id1 = w.last.id;
    const p2 = hand.paint(req(2));
    const p3 = hand.paint(req(3));
    // 2 never reached the worker: 3 replaced it in the queue.
    expect(await p2).toBeNull();
    expect(w.posted).toHaveLength(1);

    // 1 comes back after 3 was asked for: not wanted any more.
    const s1 = sheet(1);
    w.emit({ type: 'sheet', id: id1, sheet: s1 });
    expect(await p1).toBeNull();
    expect(closed(s1)).toEqual([1, 1, 1, 1, 1]);

    await flush();
    expect(w.posted).toHaveLength(2);
    expect(w.last.req.seed).toBe(3);
    const s3 = sheet(3);
    w.emit({ type: 'sheet', id: w.last.id, sheet: s3 });
    expect(await p3).toBe(s3);
    expect(closed(s3)).toEqual([0, 0, 0, 0, 0]);
  });

  it('dispose resolves the painting and the queued requests and ends the worker', async () => {
    const { w, hand } = withWorker();
    w.emit({ type: 'ready', webgl2: true });
    const inflight = hand.paint(req(1));
    await flush();
    const queued = hand.paint(req(2));
    hand.dispose();
    expect(await queued).toBeNull();
    expect(await inflight).toBeNull();
    expect(w.terminated).toBe(true);
    // Nothing more goes to the worker after it is disposed.
    expect(w.posted).toHaveLength(1);
  });

  it('dispose before the worker is ready resolves the waiting paint', async () => {
    const { w, hand } = withWorker();
    const p = hand.paint(req(1));
    hand.dispose();
    expect(await p).toBeNull();
    w.emit({ type: 'ready', webgl2: true });
    await flush();
    expect(w.posted).toHaveLength(0);
  });

  it('a worker error message without a page painter fails the sheet', async () => {
    const { w, hand } = withWorker();
    w.emit({ type: 'ready', webgl2: true });
    const p = hand.paint(req(1));
    await flush();
    w.emit({ type: 'error', id: w.last.id, message: 'context lost' });
    expect(await p).toBeNull();
    expect(hand.status()).toMatchObject({ state: 'failed', error: 'context lost' });
  });

  // Regression (fixed 2026-11-05): the worker’s error event was only heard while it started, so
  // an uncaught error mid-sheet left the paint pending for ever and every later paint behind it.
  it('a worker that crashes mid-sheet settles the paint', async () => {
    const { w, hand } = withWorker();
    w.emit({ type: 'ready', webgl2: true });
    const p = hand.paint(req(1));
    await flush();
    w.crash('boom');
    const r = await Promise.race([p, new Promise((res) => setTimeout(() => res('hung'), 50))]);
    expect(r).not.toBe('hung');
  });
});

describe('createHand falling back to the page', () => {
  it('uses the local painter when the worker has no WebGL 2', async () => {
    const w = new FakeWorker();
    const l = local();
    const hand = createHand({ worker: () => w as unknown as Worker, local: l.lib });
    w.emit({ type: 'ready', webgl2: false });
    const s = await hand.paint(req(5));
    expect(w.terminated).toBe(true);
    expect(w.posted).toHaveLength(0);
    expect(l.paint).toHaveBeenCalledOnce();
    expect(s).toMatchObject({ seed: 5, via: 'main' });
    expect(hand.status()).toMatchObject({ state: 'idle', via: 'main' });
    expect(hand.status().error).toContain('no WebGL 2 in the worker');
  });

  it('uses the local painter when the worker fails to start', async () => {
    const w = new FakeWorker();
    const l = local();
    const hand = createHand({ worker: () => w as unknown as Worker, local: l.lib });
    w.crash('bad script');
    expect(await hand.paint(req(2))).toMatchObject({ via: 'main' });
    expect(hand.status().error).toContain('worker: bad script');
  });

  it('uses the local painter when the worker cannot be made', async () => {
    const l = local();
    const hand = createHand({
      worker: () => {
        throw new Error('no workers here');
      },
      local: l.lib,
    });
    expect(await hand.paint(req(2))).toMatchObject({ via: 'main' });
  });

  it('hands over to the page once when the worker fails mid-sheet', async () => {
    const w = new FakeWorker();
    const l = local();
    const hand = createHand({ worker: () => w as unknown as Worker, local: l.lib });
    w.emit({ type: 'ready', webgl2: true });
    const p = hand.paint(req(7));
    await flush();
    w.emit({ type: 'error', id: w.last.id, message: 'lost context' });
    expect(await p).toMatchObject({ seed: 7, via: 'main' });
    expect(w.terminated).toBe(true);
    expect(hand.status()).toMatchObject({ state: 'idle', via: 'main' });
    // From now on the page paints.
    expect(await hand.paint(req(8))).toMatchObject({ seed: 8, via: 'main' });
    expect(w.posted).toHaveLength(1);
  });

  it('gives up after 8 s of silence and falls back', async () => {
    vi.useFakeTimers();
    const w = new FakeWorker();
    const l = local();
    const hand = createHand({ worker: () => w as unknown as Worker, local: l.lib });
    await vi.advanceTimersByTimeAsync(7999);
    expect(hand.status().state).toBe('starting');
    await vi.advanceTimersByTimeAsync(1);
    expect(w.terminated).toBe(true);
    expect(hand.status()).toMatchObject({ state: 'idle', via: 'main' });
    expect(hand.status().error).toContain('the worker did not answer');
  });

  it('with no hand at all, the status says none and paints resolve null', async () => {
    const hand = createHand({});
    await flush();
    expect(hand.status()).toMatchObject({ state: 'none', via: null });
    expect(await hand.paint(req(1))).toBeNull();
  });

  it('a page without WebGL 2 is no hand either', async () => {
    const hand = createHand({
      local: async () => ({
        paintSheet: (async () => sheet(1)) as never,
        paintingCanvas: (() => null) as never,
        recipes: {},
      }),
    });
    await flush();
    expect(hand.status().state).toBe('none');
    expect(hand.status().error).toContain('no WebGL 2 on the page');
    expect(await hand.paint(req(1))).toBeNull();
  });

  // Regression (fixed 2026-11-05): with no hand, pump() used to set painting then idle,
  // so after the first paint the status claimed an idle hand with via: null.
  it('with no hand, the status still says none after a paint', async () => {
    const hand = createHand({});
    await hand.paint(req(1));
    expect(hand.status().state).toBe('none');
  });
});

describe('closeSheet', () => {
  it('closes every layer and the iris, and ignores null', () => {
    const s = sheet(1);
    closeSheet(s);
    expect(closed(s)).toEqual([1, 1, 1, 1, 1]);
    expect(() => closeSheet(null)).not.toThrow();
  });
});
