/**
 * The engraved eye as strokes: deterministic, finite, in the plate's order, on time.
 * spec-link: ideas/studio-dawn/ink-opening.md · ideas/studio-dawn/ink-strokes.md
 */
import { describe, expect, it } from 'vitest';
import type { Stroke } from '../src/hand/pen';
import { REST } from '../src/subjects/eye/rig';
import {
  EYE_PASSES,
  EYE_TIMELINE,
  eyeDrawing,
  lidStrokes,
  openingOutline,
  pitchFor,
  scheduleEye,
  windowOutline,
} from '../src/subjects/eye/strokes';

/** A cheap fingerprint of every number a drawing holds. */
function fingerprint(strokes: readonly Stroke[]) {
  let h = 0;
  let n = 0;
  const add = (v: number) => {
    h = (h * 31 + Math.round(v * 1000)) | 0;
    n++;
  };
  for (const st of strokes) {
    for (const v of st.p) add(v);
    for (const v of st.w) add(v);
    add(st.from);
    add(st.to);
    add(st.t0);
    add(st.dur);
  }
  return `${h}:${n}`;
}

const allFinite = (a: ArrayLike<number> | undefined) => {
  if (!a) return true;
  for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i]!)) return false;
  return true;
};

const desk = eyeDrawing({ S: 227 });

describe('eyeDrawing', () => {
  it('is deterministic for a size', () => {
    expect(fingerprint(eyeDrawing({ S: 227 }).strokes)).toBe(fingerprint(desk.strokes));
    expect(eyeDrawing({ S: 227 }).end).toBe(desk.end);
  });

  it('lays about 1,785 strokes at a desktop size (S 227)', () => {
    expect(desk.strokes.length).toBeGreaterThan(1500);
    expect(desk.strokes.length).toBeLessThan(2100);
    const samples = desk.strokes.reduce((s, st) => s + st.p.length / 2, 0);
    expect(samples).toBeGreaterThan(120_000);
    expect(samples).toBeLessThan(190_000);
  });

  it('a bigger eye takes more strokes', () => {
    const small = eyeDrawing({ S: 120 }).strokes.length;
    const big = eyeDrawing({ S: 400 }).strokes.length;
    expect(small).toBeLessThan(desk.strokes.length);
    expect(big).toBeGreaterThan(desk.strokes.length);
  });

  it('every sample, normal, width and outline is finite; widths are never negative', () => {
    for (const d of [
      desk,
      eyeDrawing({ S: 90, pose: { gx: 0.5, gy: -0.36, open: 1, pupil: 0.5 } }),
    ]) {
      for (const st of d.strokes) {
        const k = st.w.length;
        expect(st.p.length).toBe(2 * k);
        expect(st.n.length).toBe(2 * k);
        expect(allFinite(st.p)).toBe(true);
        expect(allFinite(st.n)).toBe(true);
        expect(allFinite(st.w)).toBe(true);
        expect(allFinite(st.fill)).toBe(true);
        for (const v of st.w) expect(v).toBeGreaterThanOrEqual(0);
        if (st.to >= st.from) {
          expect(st.from).toBeGreaterThanOrEqual(0);
          expect(st.to).toBeLessThan(k);
        }
        if (st.vis) expect(st.vis.length).toBe(k);
        expect(Number.isFinite(st.t0) && Number.isFinite(st.dur)).toBe(true);
      }
      for (const o of [d.opening, d.window, d.pupil, d.iris]) {
        expect(o.length).toBeGreaterThan(8);
        expect(allFinite(o)).toBe(true);
      }
    }
  });

  it('stays within the plate round the eye', () => {
    const S = desk.S;
    for (const st of desk.strokes) {
      for (let i = 0; i < st.p.length; i += 2) {
        expect(Math.abs(st.p[i]!)).toBeLessThan(2.2 * S);
        expect(Math.abs(st.p[i + 1]!)).toBeLessThan(2.2 * S);
      }
    }
  });

  it('lays the passes in order, I to V, chalk first', () => {
    let prev = 1;
    for (const st of desk.strokes) {
      expect(st.pass).toBeGreaterThanOrEqual(prev);
      prev = st.pass;
    }
    expect(new Set(desk.strokes.map((st) => st.pass))).toEqual(new Set([1, 2, 3, 4, 5]));
    for (const st of desk.strokes) {
      expect(st.ink === 'chalk').toBe(st.pass === 1);
      if (st.ink === 'chalk') expect(st.layer).toBe('cons');
    }
  });

  it('every family has a window, and it opens inside its pass', () => {
    const passes: readonly number[] = EYE_PASSES;
    for (const st of desk.strokes) {
      const win = EYE_TIMELINE[st.group];
      expect(win, st.group).toBeDefined();
      const [g0, g1] = win!;
      expect(g1).toBeGreaterThan(g0);
      expect(g0).toBeGreaterThanOrEqual(passes[st.pass - 1]!);
      if (st.pass < 5) expect(g0).toBeLessThan(passes[st.pass]!);
    }
  });

  it("the pitch is the size's, held between 3.2 and 4.2 px", () => {
    expect(desk.pitch).toBe(pitchFor(227));
    expect(pitchFor(10)).toBe(3.2);
    expect(pitchFor(5000)).toBe(4.2);
    expect(pitchFor(300)).toBeGreaterThan(pitchFor(200));
  });
});

describe('scheduleEye', () => {
  it("puts every drawn stroke inside its family's window", () => {
    for (const st of desk.strokes) {
      if (st.to < st.from) {
        expect([st.t0, st.dur]).toEqual([0, 0]);
        continue;
      }
      const [g0, g1] = EYE_TIMELINE[st.group]!;
      expect(st.dur).toBeGreaterThan(0);
      expect(st.t0).toBeGreaterThanOrEqual(g0 - 1e-9);
      expect(st.t0 + st.dur).toBeLessThanOrEqual(g1 + 1e-9);
    }
  });

  it("a family's first stroke begins with its window and its last ends with it", () => {
    const byGroup = new Map<string, Stroke[]>();
    for (const st of desk.strokes) {
      if (st.to < st.from) continue;
      const g = byGroup.get(st.group);
      if (g) g.push(st);
      else byGroup.set(st.group, [st]);
    }
    for (const [name, list] of byGroup) {
      const [g0, g1] = EYE_TIMELINE[name]!;
      expect(list[0]!.t0, name).toBeCloseTo(g0, 9);
      if (list.length > 1) {
        const z = list[list.length - 1]!;
        expect(z.t0 + z.dur, name).toBeCloseTo(g1, 9);
      }
    }
  });

  // Note (reported, not changed): starts are g0 + (span − dur)·i/(n − 1), so a long stroke
  // can start before the short one laid ahead of it (127 of 1,681 at S 227, by up to 0.18 s).
  // Starts are not monotonic within a family; only their windows are guaranteed.

  it("returns when the pen lifts for the last time: the glaze's end", () => {
    let end = 0;
    for (const st of desk.strokes) end = Math.max(end, st.t0 + st.dur);
    expect(desk.end).toBeCloseTo(end, 9);
    expect(desk.end).toBeCloseTo(EYE_TIMELINE.glaze![1], 9);
  });

  it('re-scheduling the same strokes gives the same times', () => {
    const before = fingerprint(desk.strokes);
    const again = scheduleEye(desk.strokes);
    expect(again).toBe(desk.end);
    expect(fingerprint(desk.strokes)).toBe(before);
  });

  it('a family missing from the timeline still gets a short window at the start', () => {
    const st = { ...desk.strokes[0]!, group: 'not-in-the-timeline', pen: 'hatch' as const };
    const end = scheduleEye([st], {});
    expect(st.t0).toBe(0);
    expect(st.dur).toBeGreaterThan(0);
    expect(end).toBeLessThanOrEqual(0.4);
  });
});

describe('lidStrokes and outlines', () => {
  it('redraws only the lid, finite, for a half-closed eye', () => {
    const lid = lidStrokes(227, { ...REST, open: 0.4 });
    expect(lid.length).toBeGreaterThan(50);
    for (const st of lid) {
      expect(st.layer).toBe('lid');
      expect(allFinite(st.p)).toBe(true);
      expect(allFinite(st.w)).toBe(true);
    }
  });

  it('the opening closes on itself at the corners and the window stays inside it', () => {
    const S = 227;
    const o = openingOutline(S, REST);
    expect(o[0]).toBeCloseTo(-S, 3);
    expect(o[o.length - 2]).toBeCloseTo(-S, 3);
    const w = windowOutline(S, REST);
    expect(w.length).toBe(o.length);
    for (let i = 0; i < w.length; i += 2) expect(w[i]).toBeGreaterThanOrEqual(o[i]! - 1e-3);
  });
});
