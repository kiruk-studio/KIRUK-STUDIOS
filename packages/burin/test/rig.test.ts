/**
 * The eye's rig: the construction in numbers must stay an eye.
 * spec-link: ideas/studio-dawn/eye.md
 */
import { describe, expect, it } from 'vitest';
import {
  brow,
  crease,
  drawnScale,
  EYE,
  formatLength,
  irisCentre,
  irisRadii,
  landmarks,
  lowerLid,
  MM_PER_UNIT,
  opticAxis,
  REST,
  skewBump,
  upperLid,
} from '../src/subjects/eye/rig';

const xs = Array.from({ length: 41 }, (_, i) => -0.95 + (1.9 * i) / 40);

describe('skewBump', () => {
  it('is 1 at m and 0 at ±1, falling gently past the corners', () => {
    expect(skewBump(0.2, 0.2, 0.7)).toBeCloseTo(1, 12);
    expect(skewBump(-1, 0.2, 0.7)).toBeCloseTo(0, 12);
    expect(skewBump(1, 0.2, 0.7)).toBeCloseTo(0, 12);
    expect(skewBump(1.2, 0.2, 0.7)).toBeLessThan(0);
    expect(skewBump(1.2, 0.2, 0.7)).toBeGreaterThan(-0.5);
  });
});

describe('REST pose', () => {
  it('is centred, fully open, at the resting pupil', () => {
    expect(REST).toEqual({ gx: 0, gy: 0, open: 1, pupil: EYE.pupil.rest });
    expect(EYE.pupil.light).toBeLessThan(EYE.pupil.rest);
    expect(EYE.pupil.rest).toBeLessThan(EYE.pupil.dark);
  });

  it('stacks brow above crease above upper lid above lower lid (y down)', () => {
    for (const x of xs) {
      expect(brow(x)).toBeLessThan(crease(x));
      expect(crease(x)).toBeLessThan(upperLid(x));
      expect(upperLid(x)).toBeLessThan(lowerLid(x));
    }
  });

  it('the lids meet at the corners, the outer set higher than the inner', () => {
    expect(upperLid(-1)).toBeCloseTo(lowerLid(-1), 9);
    expect(upperLid(1)).toBeCloseTo(lowerLid(1), 9);
    expect(upperLid(-1)).toBeCloseTo(EYE.canthus.inY, 9);
    expect(upperLid(1)).toBeCloseTo(EYE.canthus.outY, 9);
    expect(EYE.canthus.outY).toBeLessThan(EYE.canthus.inY);
  });

  it('opens to a human proportion: about 1/3 as high as wide', () => {
    let gap = 0;
    for (const x of xs) gap = Math.max(gap, lowerLid(x) - upperLid(x));
    const ratio = gap / 2;
    expect(ratio).toBeGreaterThan(0.28);
    expect(ratio).toBeLessThan(0.42);
  });

  it('puts the iris centre inside the opening', () => {
    const [cx, cy] = irisCentre();
    expect(cy).toBeGreaterThan(upperLid(cx));
    expect(cy).toBeLessThan(lowerLid(cx));
    expect(irisRadii()).toEqual([EYE.iris.R, EYE.iris.R]);
  });
});

describe('poses', () => {
  it('a closed lid lies on the lower lid', () => {
    const shut = { ...REST, open: 0 };
    for (const x of xs) expect(upperLid(x, shut)).toBeCloseTo(lowerLid(x, shut) - 0.008, 12);
  });

  it('the iris follows the gaze and foreshortens as it turns', () => {
    const p = { ...REST, gx: 1, gy: -1 };
    const [cx, cy] = irisCentre(p);
    expect(cx).toBeCloseTo(EYE.iris.gx, 12);
    expect(cy).toBeCloseTo(-EYE.iris.gy + EYE.iris.cy, 12);
    const [rx, ry] = irisRadii(p);
    expect(rx).toBeLessThan(EYE.iris.R);
    expect(ry).toBeLessThan(EYE.iris.R);
  });

  it('the optic axis is a unit vector, straight out at rest', () => {
    expect(opticAxis()).toEqual([0, 0, 1]);
    for (const gx of [-1, -0.3, 0.5, 1])
      for (const gy of [-1, 0, 0.7]) {
        const [x, y, z] = opticAxis({ ...REST, gx, gy });
        expect(Math.hypot(x, y, z)).toBeCloseTo(1, 12);
        expect(z).toBeGreaterThan(0);
      }
  });
});

describe('measure', () => {
  it('the iris is the rule: its diameter is 1 d and 11.7 mm', () => {
    const d = 2 * EYE.iris.R;
    expect(formatLength(d, 'd', 200)).toBe('1.00 d');
    expect(formatLength(d, 'mm', 200)).toBe('11.7 mm');
    expect(formatLength(1, 'px', 227)).toBe('227 px');
    expect(formatLength(d, 'ligne', 200)).toBe(`${(11.7 / 2.2558).toFixed(1)} l.`);
    expect(MM_PER_UNIT).toBeCloseTo(11.7 / 0.72, 12);
  });

  it('drawnScale is CSS px per eye unit against life', () => {
    // At S such that one eye unit is exactly its life size on screen, the scale is 1.
    const S = (MM_PER_UNIT * 96) / 25.4;
    expect(drawnScale(S)).toBeCloseTo(1, 12);
    expect(drawnScale(2 * S)).toBeCloseTo(2, 12);
  });

  it('landmarks have unique ids and finite positions for any pose', () => {
    for (const p of [REST, { gx: 0.8, gy: -0.5, open: 0.3, pupil: 0.5 }]) {
      const ls = landmarks(p);
      expect(new Set(ls.map((l) => l.id)).size).toBe(ls.length);
      for (const l of ls) {
        expect(Number.isFinite(l.x)).toBe(true);
        expect(Number.isFinite(l.y)).toBe(true);
      }
    }
  });
});
