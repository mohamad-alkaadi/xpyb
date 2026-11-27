'use strict';

const { insertNewCells } = require('./insertCells');
const { matchCells } = require('./matchCells');
const { updateCell } = require('./updateCell');
const { validateDeck, validateNotebook } = require('./validate');

/**
 * Reloads the matched cells of every slide, keeping all slide settings.
 * @param {object[]} slides Deck slides.
 * @param {Map<object, object>} sources Notebook cell by deck cell.
 * @returns {{slides: object[], changedIds: string[]}} New slides and edited cell ids.
 */
const updateSlides = (slides, sources) => {
  const changedIds = [];
  const update = (cell) => {
    const source = sources.get(cell);
    if (!source) return cell;
    const next = updateCell(cell, source);
    if (next.source !== cell.source || next.type !== cell.type) changedIds.push(cell.id);
    return next;
  };
  const updated = slides.map((slide) => ({ ...slide, cells: slide.cells.map(update) }));
  return { slides: updated, changedIds };
};

/**
 * Counts deck cells that came from a notebook but are no longer in it.
 * @param {object[]} deckCells Deck cells before the sync.
 * @param {Map<object, object>} sources Notebook cell by deck cell.
 * @returns {number} Number of kept cells without a notebook counterpart.
 */
const countMissing = (deckCells, sources) =>
  deckCells.filter((cell) => !sources.has(cell) && !cell.metadata?.xpybLocal).length;

/**
 * Reloads code and markdown from a notebook without discarding deck design.
 * Nothing is deleted: slides, settings and cells missing from the notebook stay.
 * @param {object} deck Deck JSON.
 * @param {object} notebook Parsed nbformat 4 notebook.
 * @returns {{deck: object, changedIds: string[], added: number, missing: number}} Sync result.
 */
const syncDeck = (deck, notebook) => {
  validateDeck(deck);
  validateNotebook(notebook);
  const deckCells = deck.slides.flatMap((slide) => slide.cells);
  const pairs = matchCells(notebook.cells, deckCells);
  const sources = new Map([...pairs].map(([source, cell]) => [cell, source]));
  const { slides, changedIds } = updateSlides(deck.slides, sources);
  const added = insertNewCells(slides, notebook, pairs);
  const missing = countMissing(deckCells, sources);
  return { deck: { ...deck, slides }, changedIds, added, missing };
};

module.exports = { syncDeck };
