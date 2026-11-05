import { describe, expect, it } from 'vitest';

import {
  COMPONENT_CATALOG,
  DEFAULT_COMPONENT_ID,
  DEFAULT_COMPONENT_MARK_ID,
  FOCUS_COMPONENT_ID,
  getAnatomyLabel,
  getComponentRecipe,
  getMarkConsumers,
  getSharedConsumerLabels,
} from './catalog';
import { MARK_CATALOG, MARK_IDS, type MarkId } from './marks';

describe('kirukal component catalog', () => {
  it('turns every usedBy consumer into a catalog id', () => {
    const catalogIds = new Set(COMPONENT_CATALOG.map((entry) => entry.id));
    expect(catalogIds.has(FOCUS_COMPONENT_ID)).toBe(true);
    for (const markId of MARK_IDS) {
      for (const consumer of MARK_CATALOG[markId].usedBy) {
        if (consumer === '*') continue;
        const id = consumer.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        expect(catalogIds.has(id), consumer).toBe(true);
      }
    }
  });

  it('places every non-wildcard mark on at least one recipe', () => {
    const recipeMarks = new Set(
      COMPONENT_CATALOG.flatMap((entry) => entry.recipe.map((piece) => piece.markId)),
    );
    for (const markId of MARK_IDS) {
      if (MARK_CATALOG[markId].usedBy.includes('*')) {
        expect(recipeMarks.has(markId)).toBe(true);
        continue;
      }
      expect(recipeMarks.has(markId), markId).toBe(true);
    }
  });

  it('keeps focus halo off every other component', () => {
    for (const entry of COMPONENT_CATALOG) {
      const hasHalo = entry.recipe.some((piece) => piece.markId === 'part.focus-halo');
      expect(hasHalo).toBe(entry.id === FOCUS_COMPONENT_ID);
    }
  });

  it('matches the implemented Button and Frame recipes', () => {
    expect(DEFAULT_COMPONENT_ID).toBe('button');
    expect(DEFAULT_COMPONENT_MARK_ID).toBe('frame.box-tight');
    expect(getComponentRecipe('button').map((piece) => piece.markId)).toEqual(
      expect.arrayContaining(['frame.box-tight', 'glyph.arrow']),
    );
    expect(getComponentRecipe('frame').map((piece) => piece.markId)).toEqual(
      expect.arrayContaining(['frame.box']),
    );
  });

  it('lists shared consumers without duplicating the active component', () => {
    const consumers = getMarkConsumers('frame.box').map((entry) => entry.label);
    expect(consumers).toEqual(
      expect.arrayContaining(['Frame', 'Card', 'Dialog', 'Popover', 'Panel']),
    );
    expect(getSharedConsumerLabels('frame', 'frame.box')).not.toContain('Frame');
    expect(getSharedConsumerLabels('frame', 'frame.box')).toEqual(
      expect.arrayContaining(['Card', 'Dialog']),
    );
  });

  it('uses human anatomy names and never says Part', () => {
    expect(getAnatomyLabel('part.switch-knob')).toBe('Knob');
    expect(getAnatomyLabel('part.switch-track')).toBe('Track');
    expect(getAnatomyLabel('part.focus-halo')).toBe('Halo');
    expect(getAnatomyLabel('frame.box-tight')).toBe('Tight box');
    for (const markId of MARK_IDS) {
      expect(getAnatomyLabel(markId as MarkId)).not.toMatch(/part/i);
    }
    for (const entry of COMPONENT_CATALOG) {
      expect(entry.label).not.toMatch(/\bPart\b/);
      for (const piece of entry.recipe) {
        expect(piece.label).not.toMatch(/\bPart\b/);
      }
    }
  });
});
