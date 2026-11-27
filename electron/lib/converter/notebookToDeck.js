'use strict';

const {
  DECK_FORMAT,
  DECK_VERSION,
  DEFAULT_SLIDE_STYLE,
  OPTIONAL_SLIDE_FIELDS,
} = require('./constants');
const { createIdAllocator, isValidCellId } = require('./ids');
const { joinSource } = require('./sourceText');
const { validateNotebook } = require('./validate');

/**
 * Picks the optional settings a slide has stored.
 * @param {object} saved Slide definition stored in notebook metadata.
 * @returns {object} Present settings only.
 */
const optionalFields = (saved) =>
  Object.fromEntries(
    OPTIONAL_SLIDE_FIELDS.filter((key) => saved[key] !== undefined).map((key) => [key, saved[key]]),
  );

/**
 * Builds a slide with default styling for any missing field.
 * @param {string} id Slide id.
 * @param {object} [saved] Slide definition stored in notebook metadata.
 * @returns {object} Slide without cells.
 */
const createSlide = (id, saved = {}) => ({
  id,
  layout: saved.layout || DEFAULT_SLIDE_STYLE.layout,
  backgroundColor: saved.backgroundColor || DEFAULT_SLIDE_STYLE.backgroundColor,
  textColor: saved.textColor || DEFAULT_SLIDE_STYLE.textColor,
  ...optionalFields(saved),
  cells: [],
});

/**
 * Maps one notebook cell to a deck cell.
 * @param {object} cell Notebook cell.
 * @param {string} id Unique cell id.
 * @returns {object} Deck cell.
 */
const toDeckCell = (cell, id) => {
  const { xpyb, ...metadata } = cell.metadata || {};
  const base = { id, type: cell.cell_type, source: joinSource(cell.source), metadata };
  if (cell.attachments) base.attachments = structuredClone(cell.attachments);
  if (cell.cell_type !== 'code') return { ...base, outputs: [] };
  return {
    ...base,
    outputs: structuredClone(cell.outputs || []),
    executionCount: cell.execution_count ?? null,
  };
};

/**
 * Groups notebook cells into slides; a cell without a stored slide id gets its own slide.
 * @param {object[]} cells Notebook cells.
 * @param {Map<string, object>} saved Stored slide definitions by id.
 * @returns {Map<string, object>} Slides by id in order of first appearance.
 */
const groupCells = (cells, saved) => {
  const slides = new Map();
  const stored = cells.map((cell) => cell.metadata?.xpyb?.slideId).filter(Boolean);
  const allocateSlide = createIdAllocator([...stored, ...saved.keys()]);
  const allocateCell = createIdAllocator(cells.map((cell) => cell.id).filter(isValidCellId));
  cells.forEach((cell) => {
    const slideId = cell.metadata?.xpyb?.slideId || allocateSlide(null, 'slide');
    if (!slides.has(slideId)) slides.set(slideId, createSlide(slideId, saved.get(slideId)));
    slides.get(slideId).cells.push(toDeckCell(cell, allocateCell(cell.id, 'cell')));
  });
  return slides;
};

/**
 * Re-inserts stored slides that have no cells, after their stored predecessor.
 * @param {object[]} slides Slides built from cells.
 * @param {Map<string, object>} saved Stored slide definitions by id, in deck order.
 * @returns {object[]} Slides including empty ones.
 */
const restoreEmptySlides = (slides, saved) => {
  const result = [...slides];
  let position = 0;
  saved.forEach((definition, id) => {
    const index = result.findIndex((slide) => slide.id === id);
    if (index === -1) result.splice(position, 0, createSlide(id, definition));
    position = index === -1 ? position + 1 : index + 1;
  });
  return result;
};

/**
 * Converts Jupyter notebook JSON to an xpyb deck.
 * @param {object} notebook Parsed nbformat 4 notebook.
 * @param {{sourceNotebook?: string}} [options] Path of the source notebook.
 * @returns {object} Deck JSON.
 */
const notebookToDeck = (notebook, options = {}) => {
  validateNotebook(notebook);
  const { xpyb = {}, ...metadata } = notebook.metadata || {};
  const saved = new Map((xpyb.slides || []).map((slide) => [slide.id, slide]));
  const slides = [...groupCells(notebook.cells, saved).values()];
  return {
    format: DECK_FORMAT,
    version: DECK_VERSION,
    sourceNotebook: options.sourceNotebook ?? xpyb.sourceNotebook ?? null,
    metadata: structuredClone(metadata),
    slides: restoreEmptySlides(slides, saved),
  };
};

module.exports = { createSlide, notebookToDeck };
