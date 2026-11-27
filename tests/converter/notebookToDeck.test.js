import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { notebook } from './fixtures.js';

const require = createRequire(import.meta.url);
const { notebookToDeck } = require('../../electron/lib/converter/notebookToDeck');

describe('notebookToDeck', () => {
  it('creates one styled slide per untagged cell', () => {
    const result = notebookToDeck(notebook(), { sourceNotebook: '/work/talk.ipynb' });
    expect(result).toMatchObject({ format: 'xpyb', version: 1 });
    expect(result.sourceNotebook).toBe('/work/talk.ipynb');
    expect(result.slides.map((slide) => slide.id)).toEqual(['slide-1', 'slide-2']);
    expect(result.slides[0]).toMatchObject({
      layout: 'default',
      backgroundColor: '#ffffff',
      textColor: '#111827',
    });
  });

  it('preserves cell source, outputs, execution count and metadata', () => {
    const input = notebook();
    const [markdown, code] = notebookToDeck(input).slides.map((slide) => slide.cells[0]);
    expect(markdown).toMatchObject({ id: 'intro', type: 'markdown', source: '# Title\nBody' });
    expect(code).toMatchObject({ source: 'print(1)\n', executionCount: 3 });
    expect(code.metadata).toEqual({ tags: ['demo'] });
    expect(code.outputs).toEqual(input.cells[1].outputs);
    expect(code.outputs).not.toBe(input.cells[1].outputs);
  });

  it('keeps markdown attachments', () => {
    const input = notebook();
    input.cells[0].attachments = { 'a.png': { 'image/png': 'AAAA' } };
    expect(notebookToDeck(input).slides[0].cells[0].attachments).toEqual(input.cells[0].attachments);
  });

  it('assigns unique ids when cells have none or repeat them', () => {
    const input = notebook();
    input.cells[0].id = 'cell-1';
    delete input.cells[1].id;
    input.cells.push({ ...input.cells[0] });
    const ids = notebookToDeck(input).slides.map((slide) => slide.cells[0].id);
    expect(new Set(ids).size).toBe(3);
  });

  it('merges cells sharing a stored slide id without colliding with generated ids', () => {
    const input = notebook();
    input.cells[0].metadata = { xpyb: { slideId: 'slide-1' } };
    input.cells.push({ ...input.cells[0], id: 'again' });
    const { slides } = notebookToDeck(input);
    expect(slides.map((slide) => [slide.id, slide.cells.length])).toEqual([
      ['slide-1', 2],
      ['slide-2', 1],
    ]);
  });

  it('restores empty slides at the start and between others', () => {
    const input = notebook();
    input.metadata.xpyb = { slides: [{ id: 'first' }, { id: 'one' }, { id: 'middle' }] };
    input.cells[0].metadata = { xpyb: { slideId: 'one' } };
    const ids = notebookToDeck(input).slides.map((slide) => slide.id);
    expect(ids).toEqual(['first', 'one', 'middle', 'slide-1']);
  });

  it.each([
    [null, 'JSON object'],
    [{ nbformat: 3, cells: [] }, 'nbformat 4'],
    [{ nbformat: 4 }, 'cells'],
    [{ nbformat: 4, cells: [null] }, 'must be an object'],
    [{ nbformat: 4, cells: [{ cell_type: 'heading' }] }, 'Unsupported cell type'],
  ])('rejects invalid input %j', (input, message) => {
    expect(() => notebookToDeck(input)).toThrow(message);
  });
});
