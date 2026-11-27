import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { duplicateSlide } from '../../src/lib/deck/slideActions.js';
import { describeSync } from '../../src/lib/deck/syncSummary.js';
import { setSlotSource } from '../../src/lib/layouts/slotContent.js';
import { notebook } from './fixtures.js';

const require = createRequire(import.meta.url);
const { syncDeck } = require('../../electron/lib/converter/syncDeck');
const { notebookToDeck } = require('../../electron/lib/converter/notebookToDeck');
const { deckToNotebook } = require('../../electron/lib/converter/deckToNotebook');
const { syncNotebookFile } = require('../../electron/lib/io/deckFiles');

const STYLE = {
  layout: 'twoColumns',
  backgroundColor: '#102030',
  textColor: '#fefefe',
  codeBackdrop: 55,
  codeTint: 'light',
  autoContrast: false,
};
const styled = (source = notebook()) => {
  const deck = notebookToDeck(source, { sourceNotebook: '/work/talk.ipynb' });
  deck.slides = deck.slides.map((slide) => ({ ...slide, ...STYLE }));
  deck.slides[1].cells[0].metadata.xpybSlot = { slot: 'left' };
  return deck;
};
const code = (id, source) => ({
  cell_type: 'code',
  ...(id && { id }),
  metadata: {},
  source,
  outputs: [],
  execution_count: null,
});
const markdown = (id, source) => ({ cell_type: 'markdown', ...(id && { id }), metadata: {}, source });
const sources = (deck) => deck.slides.map((slide) => slide.cells.map((cell) => cell.source));
const withCells = (cells) => ({ ...notebook(), cells });

describe('syncDeck', () => {
  it('reloads code and markdown while keeping layouts, colors, opacity and slots', () => {
    const next = notebook();
    next.cells[0].source = '# New title';
    next.cells[1].source = 'print(2)';
    next.cells[1].outputs = [{ output_type: 'stream', name: 'stdout', text: ['2\n'] }];
    next.cells[1].metadata = { tags: ['new'] };
    const deck = styled();
    const result = syncDeck(deck, next);
    expect(sources(result.deck)).toEqual([['# New title'], ['print(2)']]);
    result.deck.slides.forEach((slide) => expect(slide).toMatchObject(STYLE));
    const cell = result.deck.slides[1].cells[0];
    expect(cell.metadata).toEqual({ tags: ['new'], xpybSlot: { slot: 'left' } });
    expect(cell.outputs[0].text).toEqual(['2\n']);
    expect(result).toMatchObject({ changedIds: ['intro', 'calc'], added: 0, missing: 0 });
    expect(sources(deck)[1]).toEqual(['print(1)\n']);
  });

  it('changes nothing for an unchanged notebook, keeping saved outputs', () => {
    const next = notebook();
    next.cells[1].outputs = [];
    const deck = styled();
    const result = syncDeck(deck, next);
    expect(result.deck).toEqual(deck);
    expect(result).toMatchObject({ changedIds: [], added: 0 });
  });

  it('drops stale outputs when the code changed', () => {
    const next = notebook();
    next.cells[1] = code('calc', 'print(3)');
    expect(syncDeck(styled(), next).deck.slides[1].cells[0].outputs).toEqual([]);
  });

  it('adds new cells as slides in notebook order with default style', () => {
    const next = notebook();
    next.cells.splice(1, 0, code('mid', 'a'), code('mid2', 'b'));
    next.cells.unshift(markdown('first', 'top'));
    const result = syncDeck(styled(), next);
    expect(sources(result.deck)).toEqual([['top'], ['# Title\nBody'], ['a'], ['b'], ['print(1)\n']]);
    expect(result.deck.slides[0]).toMatchObject({ layout: 'default' });
    expect(new Set(result.deck.slides.map((slide) => slide.id)).size).toBe(5);
    expect(result.added).toBe(3);
  });

  it('keeps cells that left the notebook and counts them', () => {
    const result = syncDeck(styled(), withCells([notebook().cells[0]]));
    expect(sources(result.deck)).toHaveLength(2);
    expect(result.missing).toBe(1);
  });

  it('never overwrites or removes content written in the editor', () => {
    const target = { slideId: 'slide-1', slotId: 'right', mode: 'text' };
    let deck = setSlotSource(styled(), target, 'my note');
    deck = duplicateSlide({ deck }, 'slide-2').deck;
    const result = syncDeck(deck, withCells([...notebook().cells, markdown(null, 'fresh')]));
    expect(sources(result.deck).flat()).toEqual(
      expect.arrayContaining(['my note', 'print(1)\n', 'fresh']),
    );
    expect(result).toMatchObject({ changedIds: [], added: 1, missing: 0 });
  });

  it('keeps a content type chosen in the editor', () => {
    const deck = styled();
    Object.assign(deck.slides[0].cells[0], { type: 'code', metadata: { xpybSlot: { mode: 'code' } } });
    expect(syncDeck(deck, notebook()).deck.slides[0].cells[0].type).toBe('code');
  });

  it('follows a type change made in the notebook', () => {
    const next = withCells([markdown('intro', '# Title\nBody'), markdown('calc', 'prose')]);
    const result = syncDeck(styled(), next);
    expect(result.deck.slides[1].cells[0]).toMatchObject({ type: 'markdown', outputs: [] });
    expect(result.deck.slides[1].cells[0]).not.toHaveProperty('executionCount');
  });

  it('matches notebooks without cell ids by content before order', () => {
    const old = withCells([code(null, 'one'), code(null, 'two')]);
    const deck = styled(old);
    const next = withCells([code(null, 'zero'), code(null, 'one'), code(null, 'two')]);
    const inserted = syncDeck(deck, next);
    expect(sources(inserted.deck)).toEqual([['zero'], ['one'], ['two']]);
    expect(inserted).toMatchObject({ changedIds: [], added: 1 });
    const edited = syncDeck(deck, withCells([code(null, 'one'), code(null, 'TWO')]));
    expect(sources(edited.deck)).toEqual([['one'], ['TWO']]);
    expect(edited.deck.slides[1]).toMatchObject(STYLE);
  });

  it('stays stable when a new notebook id is already used by an editor cell', () => {
    const deck = setSlotSource(styled(), { slideId: 'slide-1', slotId: 'right', mode: 'text' }, 'n');
    const taken = deck.slides[0].cells[1].id;
    deck.slides[0].cells[1].metadata.xpybOrigin = 'other';
    const next = withCells([...notebook().cells, code(taken, 'x')]);
    const once = syncDeck(deck, next);
    expect(syncDeck(once.deck, next)).toMatchObject({ added: 0, changedIds: [] });
    expect(sources(once.deck).flat()).toContain('n');
  });

  it('places a new cell on the slide the notebook names', () => {
    const deck = styled();
    const next = deckToNotebook(deck);
    next.cells.push({ ...code('extra', 'e'), metadata: { xpyb: { slideId: 'slide-1' } } });
    const result = syncDeck(deck, next);
    expect(result.deck.slides).toHaveLength(2);
    expect(result.deck.slides[0].cells.map((cell) => cell.source)).toContain('e');
  });

  it('describes the outcome', () => {
    expect(describeSync({ changedIds: ['a'], added: 2, missing: 0 })).toBe(
      'Synced: 1 updated, 2 added.',
    );
    expect(describeSync({ changedIds: [], added: 0, missing: 1 })).toContain('(kept)');
  });
});

describe('syncNotebookFile', () => {
  let dir;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xpyb-sync-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('reads the source notebook, resolving relative paths beside the deck', async () => {
    const next = notebook();
    next.cells[0].source = 'changed';
    await fs.writeFile(path.join(dir, 'talk.ipynb'), JSON.stringify(next));
    const deck = { ...styled(), sourceNotebook: 'talk.ipynb' };
    const result = await syncNotebookFile(deck, path.join(dir, 'talk.xpyb'));
    expect(result.changedIds).toEqual(['intro']);
    expect(await fs.readdir(dir)).toEqual(['talk.ipynb']);
  });

  it('explains why it cannot sync', async () => {
    const without = { ...styled(), sourceNotebook: null };
    await expect(syncNotebookFile(without)).rejects.toThrow('no source notebook');
    const gone = { ...styled(), sourceNotebook: path.join(dir, 'gone.ipynb') };
    await expect(syncNotebookFile(gone)).rejects.toThrow('ENOENT');
    const wrong = { ...styled(), sourceNotebook: '/etc/passwd' };
    await expect(syncNotebookFile(wrong)).rejects.toThrow('absolute .ipynb');
  });
});
