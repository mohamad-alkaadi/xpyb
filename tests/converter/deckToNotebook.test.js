import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { deck, notebook } from './fixtures.js';

const require = createRequire(import.meta.url);
const { deckToNotebook } = require('../../electron/lib/converter/deckToNotebook');
const { notebookToDeck } = require('../../electron/lib/converter/notebookToDeck');

describe('deckToNotebook', () => {
  it('writes nbformat 4.5 cells tagged with slide ids', () => {
    const result = deckToNotebook(deck());
    expect(result).toMatchObject({ nbformat: 4, nbformat_minor: 5 });
    expect(result.cells[0]).toEqual({
      cell_type: 'markdown',
      id: 'a',
      metadata: { xpyb: { slideId: 'opening' } },
      source: ['# Hi\n'],
    });
    expect(result.cells[1]).toMatchObject({ execution_count: 1, source: ['1 + 1'] });
    expect(result.metadata.xpyb.sourceNotebook).toBe('/work/talk.ipynb');
  });

  it('makes cell ids unique', () => {
    const input = deck();
    input.slides[0].cells[1].id = 'a';
    const ids = deckToNotebook(input).cells.map((cell) => cell.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('round-trips a deck without losing anything', () => {
    expect(notebookToDeck(deckToNotebook(deck()))).toEqual(deck());
  });

  it('round-trips notebook sources, outputs and metadata', () => {
    const original = notebook();
    const result = deckToNotebook(notebookToDeck(original));
    expect(result.metadata.kernelspec).toEqual(original.metadata.kernelspec);
    expect(result.cells.map((cell) => cell.source.join(''))).toEqual(['# Title\nBody', 'print(1)\n']);
    expect(result.cells[1].outputs).toEqual(original.cells[1].outputs);
    expect(result.cells[1].metadata.tags).toEqual(['demo']);
  });

  it.each([
    [{}, 'Not an xpyb deck'],
    [{ format: 'xpyb', version: 2 }, 'Unsupported deck version'],
    [{ format: 'xpyb', version: 1 }, 'slides'],
    [{ format: 'xpyb', version: 1, slides: [null] }, 'slide must be an object'],
    [{ format: 'xpyb', version: 1, slides: [{ cells: [] }] }, 'string id'],
    [{ format: 'xpyb', version: 1, slides: [{ id: 'x' }] }, 'cells'],
    [
      { format: 'xpyb', version: 1, slides: [{ id: 'x', cells: [] }, { id: 'x', cells: [] }] },
      'unique',
    ],
  ])('rejects invalid deck %j', (input, message) => {
    expect(() => deckToNotebook(input)).toThrow(message);
  });
});
