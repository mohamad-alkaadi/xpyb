import { describe, expect, it } from 'vitest';
import { deckToNotebook } from '../../electron/lib/converter/deckToNotebook.js';
import { notebookToDeck } from '../../electron/lib/converter/notebookToDeck.js';
import { bindSlotOutput, setSlotMode, setSlotSource } from '../../src/lib/layouts/slotContent.js';
import { getSlotMode, mapSlots } from '../../src/lib/layouts/slotMapper.js';
import { codeCell, makeDeck, makeSlide, textCell } from './fixtures.js';

const body = { slideId: 's', slotId: 'body' };
const start = (cells = []) => makeDeck([makeSlide('s', 'titleAndBody', cells)]);
const inBody = (deck) => mapSlots(deck.slides[0]).slots.body;

describe('slot content', () => {
  it('creates a pinned cell on the first edit of an empty slot', () => {
    const empty = start();
    const deck = setSlotSource(empty, { ...body, mode: 'text' }, 'Hello');
    expect(inBody(deck)).toMatchObject({ id: 'cell-1', type: 'markdown', source: 'Hello' });
    expect(inBody(deck).metadata.xpybSlot).toEqual({ slot: 'body', mode: 'text' });
    expect(empty.slides[0].cells).toEqual([]);
  });

  it('does not reuse cell ids', () => {
    const deck = setSlotSource(start([textCell('cell-1', 'T')]), { ...body, mode: 'text' }, 'B');
    expect(inBody(deck).id).toBe('cell-2');
  });

  it('keeps source and outputs through every mode', () => {
    let deck = start([codeCell('c', 'print(42)')]);
    const { outputs } = deck.slides[0].cells[0];
    ['text', 'output', 'code'].forEach((mode) => {
      deck = setSlotMode(deck, body, mode);
      expect(getSlotMode(inBody(deck))).toBe(mode);
      expect(inBody(deck)).toMatchObject({ id: 'c', source: 'print(42)', outputs });
    });
    expect(inBody(deck).type).toBe('code');
  });

  it('keeps an auto-placed cell in its slot while it is edited', () => {
    const typed = setSlotSource(start([textCell('p', 'a\nb')]), { ...body, mode: 'text' }, 'a');
    expect(inBody(typed).id).toBe('p');
  });

  it('pins per layout without forgetting the home slot', () => {
    const home = textCell('l', 'a\nb', { slot: 'left' });
    const switched = setSlotMode(start([home]), body, 'code');
    expect(inBody(switched).id).toBe('l');
    const columns = { ...switched.slides[0], layout: 'twoColumns' };
    expect(mapSlots(columns).slots.left.id).toBe('l');
  });

  it('retypes cells for text and code but not for output', () => {
    const asCode = setSlotMode(start([textCell('t', 'x = 1')]), body, 'code');
    expect(inBody(asCode)).toMatchObject({ type: 'code', outputs: [], executionCount: null });
    expect(inBody(setSlotMode(asCode, body, 'output')).type).toBe('code');
    expect(inBody(setSlotMode(asCode, body, 'text')).type).toBe('markdown');
  });

  it('binds an empty slot to another cell output', () => {
    const deck = bindSlotOutput(start(), body, 'other');
    expect(inBody(deck)).toMatchObject({ type: 'raw', source: '' });
    expect(inBody(deck).metadata.xpybSlot).toEqual({
      slot: 'body',
      mode: 'output',
      outputOf: 'other',
    });
  });

  it('survives the notebook round trip', () => {
    const deck = bindSlotOutput(start([codeCell('c', '1', { slot: 'title' })]), body, 'c');
    const restored = notebookToDeck(deckToNotebook(deck));
    expect(mapSlots(restored.slides[0]).slots).toEqual(mapSlots(deck.slides[0]).slots);
  });
});
