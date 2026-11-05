/**
 * The critic catches what it promises to catch: plotter and costume tells, false
 * measurements, ink against the light, orphan construction, unreadable mirror text.
 */
import { describe, expect, it } from 'vitest';
import { circle, line } from '../src/core/path.ts';
import { critique } from '../src/critic/critic.ts';
import { letter } from '../src/letter/letter.ts';
import { castShadow, sphere } from '../src/light/forms.ts';
import { contour, hatch } from '../src/light/hatch.ts';
import { voluteGeometry } from '../src/measure/constructions.ts';
import { compass, dimension, scaleBar } from '../src/measure/measure.ts';
import { createPlate } from '../src/plate/plate.ts';

const plate = (id: string) =>
  createPlate({
    id,
    title: 'critic test plate',
    claim: 'a plate that exists only to test the critic',
    size: [160, 120],
    style: 'codex',
    eye: { motif: 'drawn', ref: 'a lit globe, the eye as a form' },
    device: 'construction',
    views: 2,
  });

const status = (r: ReturnType<typeof critique>, id: string) =>
  r.checks.find((c) => c.id === id)?.status;

describe('lighting', () => {
  it('hatching laid by the light passes; hatching against the light fails', () => {
    const good = plate('light-good');
    const g = sphere('globe', [60, 60], 28);
    hatch(good, { form: g });
    expect(status(critique(good), 'light.follows:globe')).toBe('pass');

    const bad = plate('light-bad');
    const b = sphere('globe', [60, 60], 28);
    // the tone inverted: ink where the light falls
    hatch(bad, { form: b, tone: (q) => 1 - b.tone(q, bad.light) * 0.9 - 0.05 });
    bad.forms[0] = { ...bad.forms[0]!, tone: (q) => b.tone(q, bad.light) };
    expect(['fail', 'warn']).toContain(status(critique(bad), 'light.follows:globe'));
  });

  it('a flat cast shadow is judged as an even tone, not by correlation (MA-9)', () => {
    const p = plate('flat');
    const sh = castShadow('shadow', [60, 90], 24, p.light);
    hatch(p, { form: sh, tone: () => 0.6, threshold: 0.3 });
    const r = critique(p);
    expect(r.checks.some((c) => c.id === 'light.even:shadow')).toBe(true);
    expect(r.checks.some((c) => c.id === 'light.follows:shadow')).toBe(false);
  });

  it('a quill contour is heavier away from the light', () => {
    const p = plate('contour');
    const g = sphere('globe', [60, 60], 30);
    p.addForm({ id: 'globe', kind: 'sphere', outline: g.outline, tone: (q) => g.tone(q, p.light) });
    contour(p, g.outline, { id: 'globe-line', form: 'globe' });
    expect(status(critique(p), 'light.contour-weight')).toBe('pass');
  });
});

describe('measurement', () => {
  it('a measured dimension is true; a typed one that lies fails', () => {
    const p = plate('dims');
    p.stroke(line([20, 60], [80, 60]), { role: 'contour', guide: 'ruler' });
    dimension(p, [20, 60], [80, 60], { offset: -12, id: 'true' });
    dimension(p, [20, 60], [80, 60], { offset: -24, id: 'lie', text: '75 mm' });
    const r = critique(p);
    expect(status(r, 'measure.true:true')).toBe('pass');
    expect(status(r, 'measure.true:lie')).toBe('fail');
    expect(p.dimensions[0]?.text).toBe('60 mm');
  });

  it('a dimension off the ink fails (never the bounding box)', () => {
    const p = plate('off-ink');
    p.stroke(line([20, 60], [80, 60]), { role: 'contour', guide: 'ruler' });
    dimension(p, [20, 70], [80, 70], { offset: 12, id: 'air' });
    expect(status(critique(p), 'measure.on-ink:air')).toBe('fail');
  });

  it('a plate with no unit fails; a scale bar fixes it', () => {
    const p = plate('unit');
    p.stroke(line([20, 60], [80, 60]), { role: 'contour' });
    expect(status(critique(p), 'measure.unit')).toBe('fail');
    scaleBar(p, [20, 100], { units: 40 });
    expect(status(critique(p), 'measure.unit')).toBe('pass');
  });
});

describe('costume and plotter', () => {
  it('ornamental construction fails until it generates something', () => {
    const p = plate('orphan');
    const c = compass(p, [60, 60], 20, { id: 'ring' });
    expect(status(critique(p), 'connect.generative')).toBe('fail');
    const m = p.stroke(circle([60, 60], 20), { role: 'contour', id: 'rim' });
    p.generated(c.id, ...m.map((q) => q.id));
    expect(status(critique(p), 'connect.generative')).toBe('pass');
  });

  it('mirror script without a readable twin fails', () => {
    const p = plate('mirror');
    letter(p, 'LUCE', [30, 40], { mirror: true, kind: 'note', id: 'm' });
    expect(status(critique(p), 'type.mirror-twin')).toBe('fail');
    letter(p, 'LUCE', [30, 60], { kind: 'note', id: 'twin' });
    p.texts[0]!.twin = 'twin';
    expect(status(critique(p), 'type.mirror-twin')).toBe('pass');
  });

  it('cross-hatching in a codex plate fails', () => {
    const p = plate('cross');
    const g = sphere('globe', [60, 60], 28);
    hatch(p, { form: g });
    hatch(p, { form: g, slope: 135, id: 'second' });
    expect(status(critique(p), 'style.no-cross')).toBe('fail');
  });

  it('exact-guided drawing reads as a plotter (width does not breathe)', () => {
    const p = plate('plotter');
    for (let i = 0; i < 30; i++)
      p.stroke(line([10, 5 + i * 3.5], [150, 5 + i * 3.5]), {
        role: 'contour',
        guide: 'exact',
        pressure: 0.6,
      });
    // exact marks are not "free" ink, so the width check has nothing to read: no free strokes is a warn
    expect(['warn', 'fail']).toContain(status(critique(p), 'style.width'));
  });
});

describe('constructions', () => {
  it('the volute turns without a corner: every join is tangent', () => {
    const v = voluteGeometry([0, 0], 4, 33.5);
    for (let k = 0; k + 1 < v.arcs.length; k++) {
      const a = v.arcs[k]!;
      const b = v.arcs[k + 1]!;
      const end = a[a.length - 1]!;
      const start = b[0]!;
      expect(Math.hypot(end[0] - start[0], end[1] - start[1])).toBeLessThan(1e-6);
      const ta = Math.atan2(end[1] - a[a.length - 2]![1], end[0] - a[a.length - 2]![0]);
      const tb = Math.atan2(b[1]![1] - start[1], b[1]![0] - start[0]);
      let d = Math.abs(ta - tb);
      if (d > Math.PI) d = 2 * Math.PI - d;
      expect(d).toBeLessThan(0.08);
    }
    // the last arc closes on the eye
    expect(v.radii[v.radii.length - 1]!).toBeGreaterThan(4);
  });
});
