'use strict';

const { createIdAllocator, isValidCellId } = require('./ids');
const { createSlide, notebookToDeck } = require('./notebookToDeck');

/**
 * Converts one notebook cell with the same rules as a first conversion.
 * @param {object} notebook Source notebook.
 * @param {object} source Notebook cell.
 * @returns {object} Deck cell.
 */
const convertCell = (notebook, source) =>
  notebookToDeck({ ...notebook, metadata: {}, cells: [source] }).slides[0].cells[0];

/**
 * Gives a new cell an unused id, remembering its notebook id when it must change.
 * @param {object} cell Converted cell.
 * @param {unknown} notebookId Id in the notebook.
 * @param {Function} allocate Cell id allocator.
 * @returns {object} Deck cell.
 */
const claimId = (cell, notebookId, allocate) => {
  const id = allocate(notebookId, 'cell');
  if (!isValidCellId(notebookId) || id === notebookId) return { ...cell, id };
  return { ...cell, id, metadata: { ...cell.metadata, xpybOrigin: notebookId } };
};

/**
 * Finds the slide holding a cell.
 * @param {object[]} slides Deck slides.
 * @param {string|undefined} cellId Cell id.
 * @returns {number} Slide index, or -1.
 */
const slideIndexOf = (slides, cellId) =>
  slides.findIndex((slide) => slide.cells.some((cell) => cell.id === cellId));

/**
 * Places a new cell on the slide the notebook names, otherwise on a new slide
 * right after the slide of the preceding notebook cell.
 * @param {object} state Insert state.
 * @param {object} source Notebook cell.
 * @returns {void}
 */
const insertCell = (state, source) => {
  const cell = claimId(convertCell(state.notebook, source), source.id, state.allocateCell);
  const named = source.metadata?.xpyb?.slideId;
  const home = state.slides.find((slide) => slide.id === named);
  if (home) home.cells.push(cell);
  else {
    const id = state.allocateSlide(named, 'slide');
    const slide = { ...createSlide(id), cells: [cell] };
    state.slides.splice(slideIndexOf(state.slides, state.previousId) + 1, 0, slide);
  }
  state.previousId = cell.id;
};

/**
 * Creates an allocator that never hands out an id already in the deck.
 * @param {string[]} taken Ids in use.
 * @returns {Function} Allocator.
 */
const allocatorFor = (taken) => {
  const allocate = createIdAllocator(taken);
  const used = new Set(taken);
  return (preferred, prefix) => allocate(used.has(preferred) ? null : preferred, prefix);
};

/**
 * Adds the notebook cells that are not in the deck yet.
 * @param {object[]} slides Slides to change in place.
 * @param {object} notebook Source notebook.
 * @param {Map<object, object>} pairs Matched deck cell by notebook cell.
 * @returns {number} Number of cells added.
 */
const insertNewCells = (slides, notebook, pairs) => {
  const cellIds = slides.flatMap((slide) => slide.cells.map((cell) => cell.id));
  const state = {
    slides,
    notebook,
    allocateCell: allocatorFor(cellIds),
    allocateSlide: allocatorFor(slides.map((slide) => slide.id)),
    previousId: undefined,
  };
  notebook.cells.forEach((source) => {
    if (pairs.has(source)) state.previousId = pairs.get(source).id;
    else insertCell(state, source);
  });
  return notebook.cells.length - pairs.size;
};

module.exports = { insertNewCells };
