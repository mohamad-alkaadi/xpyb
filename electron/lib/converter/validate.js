'use strict';

const { CELL_TYPES, DECK_FORMAT, DECK_VERSION, NBFORMAT } = require('./constants');

/**
 * Tells whether a value is a plain (non-array) object.
 * @param {unknown} value Candidate value.
 * @returns {boolean} True for plain objects.
 */
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Throws when a condition does not hold.
 * @param {unknown} condition Condition to check.
 * @param {string} message Error message.
 * @returns {void}
 */
const ensure = (condition, message) => {
  if (!condition) throw new Error(message);
};

/**
 * Validates the shared shape of a notebook or deck cell.
 * @param {unknown} cell Candidate cell.
 * @returns {void}
 */
const validateCell = (cell) => {
  ensure(isObject(cell), 'Every cell must be an object.');
  ensure(CELL_TYPES.includes(cell.type ?? cell.cell_type), 'Unsupported cell type.');
};

/**
 * Validates a parsed Jupyter notebook.
 * @param {unknown} notebook Parsed .ipynb JSON.
 * @returns {object} The same notebook.
 */
const validateNotebook = (notebook) => {
  ensure(isObject(notebook), 'Notebook must be a JSON object.');
  ensure(notebook.nbformat === NBFORMAT, `Only nbformat ${NBFORMAT} notebooks are supported.`);
  ensure(Array.isArray(notebook.cells), 'Notebook must contain a "cells" array.');
  notebook.cells.forEach(validateCell);
  return notebook;
};

/**
 * Validates one deck slide.
 * @param {unknown} slide Candidate slide.
 * @returns {void}
 */
const validateSlide = (slide) => {
  ensure(isObject(slide), 'Every slide must be an object.');
  ensure(typeof slide.id === 'string' && slide.id, 'Every slide needs a string id.');
  ensure(Array.isArray(slide.cells), 'Every slide needs a "cells" array.');
  slide.cells.forEach(validateCell);
};

/**
 * Validates a parsed deck.
 * @param {unknown} deck Parsed .xpyb JSON.
 * @returns {object} The same deck.
 */
const validateDeck = (deck) => {
  ensure(isObject(deck) && deck.format === DECK_FORMAT, 'Not an xpyb deck.');
  ensure(deck.version === DECK_VERSION, `Unsupported deck version: ${deck.version}.`);
  ensure(Array.isArray(deck.slides), 'Deck must contain a "slides" array.');
  deck.slides.forEach(validateSlide);
  const ids = new Set(deck.slides.map((slide) => slide.id));
  ensure(ids.size === deck.slides.length, 'Slide ids must be unique.');
  return deck;
};

module.exports = { isObject, validateDeck, validateNotebook };
