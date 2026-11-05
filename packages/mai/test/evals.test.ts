/**
 * The skills' evals, mechanised (packages/mai/docs/evals.md). Each scenario is one rule from a
 * skill: a RED plate that breaks it, a GREEN plate that follows it, and the critic check that
 * must tell them apart. If a rule's check stops catching its RED plate, the rule has no teeth.
 *
 * Agent evals (fresh subagents with the skill forbidden, then loaded) are described in
 * docs/evals.md; these are the part code can run on every commit.
 */
import { describe, expect, it } from 'vitest';
import { line } from '../src/core/path.ts';
import type { Vec } from '../src/core/vec.ts';
import { critique } from '../src/critic/critic.ts';
import { letter } from '../src/letter/letter.ts';
import { sphere } from '../src/light/forms.ts';
import { hatch } from '../src/light/hatch.ts';
import { dimension, ruled, valueInk } from '../src/measure/measure.ts';
import { angleDim, extents } from '../src/measure/outer.ts';
import { createPlate, type Plate } from '../src/plate/plate.ts';
import type { StyleId } from '../src/styles/styles.ts';

const sheet = (id: string, style: StyleId = 'dawn-new'): Plate =>
  createPlate({
    id,
    title: 'eval plate',
    claim: 'a plate that exists only to run a skill eval',
    size: [180, 130],
    style,
    eye: { motif: 'none', justification: 'an eval sheet, never shown' },
    device: 'construction',
    views: 2,
  });
const edge = (p: Plate) =>
  p.stroke(line([30, 60], [130, 60]), { role: 'contour', guide: 'ruler', id: 'edge' });

interface Scenario {
  id: string;
  skill: string;
  rule: string;
  check: string;
  red: () => Plate;
  green: () => Plate;
  /** What the check says about the RED plate. */
  caught: 'fail' | 'warn';
}

const scenarios: Scenario[] = [
  {
    id: 'E-1',
    skill: '/kiruk-mai',
    rule: 'Never type a value: dimension() measures it from the ink.',
    check: 'measure.true:d',
    red: () => {
      const p = sheet('e1r');
      edge(p);
      dimension(p, [30, 60], [130, 60], { axis: 'x', offset: -10, id: 'd' });
      const d = p.dimensions[0];
      if (d) d.text = '120 mm';
      return p;
    },
    green: () => {
      const p = sheet('e1g');
      edge(p);
      dimension(p, [30, 60], [130, 60], { axis: 'x', offset: -10, id: 'd' });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-2',
    skill: '/kiruk-mai',
    rule: 'Every construction says what it generated.',
    check: 'connect.generative',
    red: () => {
      const p = sheet('e2r');
      edge(p);
      ruled(p, [20, 40], [150, 40], { id: 'orphan' });
      return p;
    },
    green: () => {
      const p = sheet('e2g');
      edge(p);
      ruled(p, [20, 60], [150, 60], { id: 'guide', generates: ['edge'] });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-3',
    skill: '/kiruk-mai',
    rule: 'List the parts; every part is drawn, keyed, noted and measured as declared.',
    check: 'create.anatomy',
    red: () => {
      const p = sheet('e3r');
      edge(p);
      p.part({ id: 'edge', name: 'the edge', key: 'A', finish: 'line', measured: ['missing'] });
      return p;
    },
    green: () => {
      const p = sheet('e3g');
      edge(p);
      dimension(p, [30, 60], [130, 60], { axis: 'x', offset: -10, id: 'len' });
      letter(p, 'A', [80, 70], { cap: 3.5, kind: 'key', refers: [80, 60], id: 'key-a' });
      p.part({ id: 'edge', name: 'the edge', key: 'A', finish: 'line', measured: ['len'] });
      letter(p, 'A edge', [30, 110], { cap: 2.5, kind: 'note', id: 'note-a' });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-4',
    skill: '/kiruk-mai',
    rule: 'Codex tone is one slope, never crossed.',
    check: 'style.no-cross',
    red: () => {
      // a second family laid across the first: what an agent does when it reaches for depth
      const p = sheet('e4r', 'codex');
      const ball = sphere('ball', [90, 65], 30);
      hatch(p, { form: ball, id: 'tone' });
      hatch(p, { form: ball, slope: 135, id: 'across' });
      return p;
    },
    green: () => {
      const p = sheet('e4g', 'codex');
      hatch(p, { form: sphere('ball', [90, 65], 30), id: 'tone' });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-5',
    skill: '/kiruk-mai-measure',
    rule: 'The overall stands outside, a tier (≥ 6 mm) beyond the inner dimensions.',
    check: 'measure.tier-gap',
    red: () => {
      const p = sheet('e5r');
      edge(p);
      dimension(p, [30, 60], [80, 60], { axis: 'x', offset: 10, id: 'inner' });
      dimension(p, [30, 60], [130, 60], { axis: 'x', offset: 12, id: 'all', kind: 'overall' });
      return p;
    },
    green: () => {
      const p = sheet('e5g');
      const e = edge(p);
      dimension(p, [30, 60], [80, 60], { axis: 'x', offset: 10, id: 'inner' });
      extents(p, e, { sides: ['bottom'], tier: 10, id: 'all' });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-6',
    skill: '/kiruk-mai-measure',
    rule: 'What is behind is dashed.',
    check: 'line.hidden',
    red: () => {
      const p = sheet('e6r');
      p.stroke(line([30, 40], [130, 40]), { role: 'contour', hidden: true, id: 'back' });
      return p;
    },
    green: () => {
      const p = sheet('e6g');
      p.stroke(line([30, 40], [130, 40]), {
        role: 'contour',
        hidden: true,
        line: 'dashed',
        id: 'back',
      });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-7',
    skill: '/kiruk-mai-measure',
    rule: 'A long axis is a chain line, named where it leaves the figure.',
    check: 'connect.axes-named',
    red: () => {
      const p = sheet('e7r');
      p.stroke(line([20, 65], [160, 65]), {
        role: 'contour',
        guide: 'ruler',
        line: 'chain',
        id: 'axis',
      });
      return p;
    },
    green: () => {
      const p = sheet('e7g');
      p.stroke(line([20, 65], [160, 65]), {
        role: 'contour',
        guide: 'ruler',
        line: 'chain',
        id: 'axis',
      });
      letter(p, 'A', [14, 66.5], { cap: 3, kind: 'key', refers: [20, 65], id: 'a' });
      letter(p, 'A′', [163, 66.5], { cap: 3, kind: 'key', refers: [160, 65], id: 'a2' });
      return p;
    },
    caught: 'warn',
  },
  {
    id: 'E-8',
    skill: '/kiruk-mai-measure',
    rule: 'A value is type: letter it in the type ink (rubric #983A22), never the line red.',
    check: 'type.value-ink',
    red: () => {
      const p = sheet('e8r');
      edge(p);
      letter(p, '100', [80, 50], {
        cap: 2.5,
        kind: 'dimension',
        ink: 'rubric',
        role: 'overlay',
        exact: true,
        id: 'v',
      });
      return p;
    },
    green: () => {
      const p = sheet('e8g');
      edge(p);
      letter(p, '100', [80, 50], {
        cap: 2.5,
        kind: 'dimension',
        ink: valueInk(p, 'dimension'),
        role: 'overlay',
        exact: true,
        id: 'v',
      });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-9',
    skill: '/kiruk-mai-measure',
    rule: 'The figure states its overall size: an overall dimension or a graduated frame.',
    check: 'measure.outer',
    red: () => {
      const p = sheet('e9r');
      edge(p);
      dimension(p, [30, 60], [80, 60], { axis: 'x', offset: 10, id: 'part' });
      return p;
    },
    green: () => {
      const p = sheet('e9g');
      const e = edge(p);
      extents(p, e, { sides: ['bottom'], tier: 10, id: 'all' });
      return p;
    },
    caught: 'warn',
  },
  {
    id: 'E-10',
    skill: '/kiruk-mai-measure',
    rule: 'An angle is measured from its rays.',
    check: 'measure.angle:ang',
    red: () => {
      const p = sheet('e10r');
      const v: Vec = [50, 90];
      angleDim(p, v, [120, 90], [50 + 60 * Math.cos(-0.5), 90 + 60 * Math.sin(-0.5)], {
        id: 'ang',
      });
      const a = p.angles[0];
      if (a) a.text = '45°';
      return p;
    },
    green: () => {
      const p = sheet('e10g');
      const v: Vec = [50, 90];
      angleDim(p, v, [120, 90], [50 + 60 * Math.cos(-0.5), 90 + 60 * Math.sin(-0.5)], {
        id: 'ang',
      });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-11',
    skill: '/kiruk-mai-proof',
    rule: 'A character with no glyph is a fail, never a silent blank.',
    check: 'type.glyphs',
    red: () => {
      const p = sheet('e11r');
      letter(p, 'Σ = 12', [30, 40], { cap: 2.5, kind: 'note', id: 'sum' });
      return p;
    },
    green: () => {
      const p = sheet('e11g');
      letter(p, 'Δ = 12°', [30, 40], { cap: 2.5, kind: 'note', id: 'sum' });
      return p;
    },
    caught: 'fail',
  },
  {
    id: 'E-12',
    skill: '/kiruk-mai-proof',
    rule: 'A label sits within 8 mm of its point, or a leader joins them.',
    check: 'type.near',
    red: () => {
      const p = sheet('e12r');
      edge(p);
      letter(p, 'B', [80, 100], { cap: 3.5, kind: 'key', refers: [80, 60], id: 'b' });
      return p;
    },
    green: () => {
      const p = sheet('e12g');
      edge(p);
      letter(p, 'B', [80, 66.5], { cap: 3.5, kind: 'key', refers: [80, 60], id: 'b' });
      return p;
    },
    caught: 'warn',
  },
  {
    id: 'E-13',
    skill: '/kiruk-mai-style',
    rule: 'On the modern sheet the overlay is exact: the drawing keeps the hand, the line keeps its precision.',
    check: 'style.overlay-crisp',
    red: () => {
      const p = sheet('e13r');
      p.stroke(line([30, 40], [130, 40]), { role: 'overlay', guide: 'ruler', id: 'rule' });
      return p;
    },
    green: () => {
      const p = sheet('e13g');
      p.stroke(line([30, 40], [130, 40]), { role: 'overlay', guide: 'exact', id: 'rule' });
      return p;
    },
    caught: 'fail',
  },
];

describe('skill evals: each rule’s check tells RED from GREEN', () => {
  for (const s of scenarios)
    it(`${s.id} ${s.skill}: ${s.rule}`, () => {
      const red = critique(s.red()).checks.find((c) => c.id === s.check);
      const green = critique(s.green()).checks.find((c) => c.id === s.check);
      expect(red?.status, `${s.check} on RED`).toBe(s.caught);
      expect(green?.status, `${s.check} on GREEN: ${green?.value}`).toBe('pass');
    });
});
