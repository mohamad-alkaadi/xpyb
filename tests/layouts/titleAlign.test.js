import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { deckToNotebook } from '../../electron/lib/converter/deckToNotebook.js';
import { notebookToDeck } from '../../electron/lib/converter/notebookToDeck.js';
import { syncDeck } from '../../electron/lib/converter/syncDeck.js';
import { readDeck, writeDeck } from '../../electron/lib/io/deckFiles.js';
import { duplicateSlide } from '../../src/lib/deck/slideActions.js';
import { getTitleAlign, LAYOUTS, TITLE_ALIGNMENTS } from '../../src/lib/layouts/schemas.js';
import { makeDeck, makeSlide, textCell } from './fixtures.js';

const aligned = (titleAlign) =>
  makeDeck([{ ...makeSlide('a', 'titleAndBody', [textCell('t', 'Title')]), titleAlign }]);

describe('title alignment schema', () => {
  it('offers left, center and right', () => {
    expect(TITLE_ALIGNMENTS).toEqual(['left', 'center', 'right']);
  });

  it('follows the layout until a valid alignment is stored', () => {
    expect(getTitleAlign({ layout: 'titleAndBody' })).toBe('left');
    expect(getTitleAlign({ layout: 'title' })).toBe('center');
    expect(getTitleAlign({ layout: 'title', titleAlign: 'right' })).toBe('right');
    expect(getTitleAlign({ layout: 'title', titleAlign: 'justify' })).toBe('center');
  });

  it('is empty for layouts without a title', () => {
    expect(getTitleAlign({ layout: 'blank', titleAlign: 'right' })).toBeNull();
    expect(getTitleAlign({ layout: 'caption' })).toBeNull();
  });
});

describe('title slot geometry', () => {
  const titled = LAYOUTS.flatMap((layout) =>
    layout.slots.filter((slot) => slot.id === 'title').map((slot) => [layout.id, slot]),
  );

  it.each(titled)('%s fits two lines, even as a markdown heading', (_, slot) => {
    const headingScale = 1.25;
    const lines = 2 * slot.fontSize * 1.1;
    // Slot padding plus the room kept for descenders.
    const padding = 16 + 0.12 * slot.fontSize;
    expect(slot.box.height).toBeGreaterThanOrEqual(lines * headingScale + padding);
  });
});

describe('titleAlign persistence', () => {
  it('survives saving and loading a deck file', async () => {
    const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'xpyb-title-'));
    const file = path.join(folder, 'deck.xpyb');
    await writeDeck(file, aligned('right'));
    const { deck } = await readDeck(file);
    await fs.rm(folder, { recursive: true, force: true });
    expect(deck.slides[0].titleAlign).toBe('right');
  });

  it('survives a notebook round trip', () => {
    const restored = notebookToDeck(deckToNotebook(aligned('center')));
    expect(restored.slides[0].titleAlign).toBe('center');
  });

  it('survives a round trip of a slide without cells', () => {
    const deck = makeDeck([{ ...makeSlide('empty', 'titleOnly'), titleAlign: 'right' }]);
    expect(notebookToDeck(deckToNotebook(deck)).slides[0].titleAlign).toBe('right');
  });

  it('is kept by a notebook sync', () => {
    const deck = aligned('right');
    const notebook = deckToNotebook(deck);
    notebook.cells[0].source = ['Changed'];
    const synced = syncDeck(deck, notebook).deck;
    expect(synced.slides[0]).toMatchObject({ titleAlign: 'right', cells: [{ source: 'Changed' }] });
  });

  it('is not invented for slides without a choice', () => {
    const deck = makeDeck([makeSlide('a', 'title', [textCell('t', 'Title')])]);
    expect('titleAlign' in notebookToDeck(deckToNotebook(deck)).slides[0]).toBe(false);
  });

  it('is copied with a duplicated slide', () => {
    const state = duplicateSlide({ deck: aligned('center'), activeSlideId: 'a' }, 'a');
    expect(state.deck.slides[1].titleAlign).toBe('center');
  });
});
