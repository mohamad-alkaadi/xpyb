import { describe, expect, it } from 'vitest';
import { validateDeck } from '../../electron/lib/converter/validate.js';
import * as actions from '../../src/lib/deck/slideActions.js';
import { codeCell, makeDeck, makeSlide, textCell } from './fixtures.js';

const order = (state) => state.deck.slides.map((slide) => slide.id);
const state = () => ({
  deck: makeDeck([
    makeSlide('a', 'twoColumns', [
      codeCell('c', '1'),
      textCell('o', '', { mode: 'output', outputOf: 'c' }),
    ]),
    makeSlide('b', 'blank'),
  ]),
  activeSlideId: 'a',
});

describe('slide actions', () => {
  it('adds a slide after the active one and selects it', () => {
    const next = actions.addSlide(state());
    expect(order(next)).toEqual(['a', 'slide-1', 'b']);
    expect(next.activeSlideId).toBe('slide-1');
    expect(() => validateDeck(next.deck)).not.toThrow();
  });

  it('adds to an empty deck', () => {
    expect(order(actions.addSlide({ deck: makeDeck([]), activeSlideId: null }))).toEqual([
      'slide-1',
    ]);
  });

  it('duplicates with new cell ids and re-pointed bindings', () => {
    const before = state();
    const next = actions.duplicateSlide(before, 'a');
    const copy = next.deck.slides[1];
    expect(copy).toMatchObject({ id: 'slide-1', layout: 'twoColumns' });
    expect(copy.cells.map((cell) => cell.id)).toEqual(['cell-1', 'cell-2']);
    expect(copy.cells[1].metadata.xpybSlot.outputOf).toBe('cell-1');
    expect(next.deck.slides[0]).toEqual(before.deck.slides[0]);
  });

  it('deletes and selects the neighbour', () => {
    expect(actions.deleteSlide(state(), 'a').activeSlideId).toBe('b');
    expect(actions.deleteSlide(state(), 'b').activeSlideId).toBe('a');
    const none = actions.deleteSlide(actions.deleteSlide(state(), 'a'), 'b');
    expect(none).toMatchObject({ activeSlideId: null, deck: { slides: [] } });
  });

  it('reorders within bounds', () => {
    expect(order(actions.moveSlide(state(), 'a', 1))).toEqual(['b', 'a']);
    expect(order(actions.moveSlide(state(), 'a', -1))).toEqual(['a', 'b']);
    expect(order(actions.moveSlide(state(), 'b', 1))).toEqual(['a', 'b']);
  });

  it('ignores unknown slides', () => {
    const before = state();
    expect(actions.duplicateSlide(before, 'x')).toBe(before);
    expect(actions.deleteSlide(before, 'x')).toBe(before);
    expect(actions.moveSlide(before, 'x', 1)).toBe(before);
  });
});
