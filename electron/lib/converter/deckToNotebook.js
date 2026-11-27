'use strict';

const { NBFORMAT, NBFORMAT_MINOR } = require('./constants');
const { createIdAllocator, isValidCellId } = require('./ids');
const { splitSource } = require('./sourceText');
const { validateDeck } = require('./validate');

/**
 * Maps one deck cell to a notebook cell tagged with its slide id.
 * @param {object} cell Deck cell.
 * @param {string} slideId Owning slide id.
 * @param {string} id Unique cell id.
 * @returns {object} Notebook cell.
 */
const toNotebookCell = (cell, slideId, id) => {
  const base = {
    cell_type: cell.type,
    id,
    metadata: { ...structuredClone(cell.metadata || {}), xpyb: { slideId } },
    source: splitSource(cell.source || ''),
  };
  if (cell.attachments) base.attachments = structuredClone(cell.attachments);
  if (cell.type !== 'code') return base;
  return {
    ...base,
    execution_count: cell.executionCount ?? null,
    outputs: structuredClone(cell.outputs || []),
  };
};

/**
 * Converts every slide cell to notebook cells in deck order.
 * @param {object[]} slides Deck slides.
 * @returns {object[]} Notebook cells.
 */
const toNotebookCells = (slides) => {
  const ids = slides.flatMap((slide) => slide.cells.map((cell) => cell.id));
  const allocate = createIdAllocator(ids.filter(isValidCellId));
  return slides.flatMap((slide) =>
    slide.cells.map((cell) => toNotebookCell(cell, slide.id, allocate(cell.id, 'cell'))),
  );
};

/**
 * Converts an xpyb deck back to Jupyter notebook JSON.
 * @param {object} deck Deck JSON.
 * @returns {object} nbformat 4.5 notebook.
 */
const deckToNotebook = (deck) => {
  validateDeck(deck);
  const slides = deck.slides.map(({ cells, ...definition }) => definition);
  return {
    cells: toNotebookCells(deck.slides),
    metadata: {
      ...structuredClone(deck.metadata || {}),
      xpyb: { sourceNotebook: deck.sourceNotebook ?? null, slides },
    },
    nbformat: NBFORMAT,
    nbformat_minor: NBFORMAT_MINOR,
  };
};

module.exports = { deckToNotebook };
