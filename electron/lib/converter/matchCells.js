'use strict';

const { isValidCellId } = require('./ids');
const { joinSource } = require('./sourceText');

/**
 * Reads the notebook id a deck cell answers to. Cells created in the editor only
 * match a notebook that carries their id, never by content or position.
 * @param {object} cell Deck cell.
 * @returns {string} Notebook-facing id.
 */
const originId = (cell) => cell.metadata?.xpybOrigin ?? cell.id;

/**
 * Tells whether a deck cell was created in the editor.
 * @param {object} cell Deck cell.
 * @returns {boolean} True for editor-made cells.
 */
const isLocal = (cell) => cell.metadata?.xpybLocal === true;

/**
 * Pairs each still unpaired notebook cell with the first free deck cell passing a test.
 * @param {{cells: object[], free: Set<object>, pairs: Map<object, object>}} state Matching state.
 * @param {(source: object, target: object) => boolean} fits Pairing test.
 * @returns {void}
 */
const pairBy = ({ cells, free, pairs }, fits) => {
  cells.forEach((source) => {
    if (pairs.has(source)) return;
    const target = [...free].find((candidate) => fits(source, candidate));
    if (!target) return;
    pairs.set(source, target);
    free.delete(target);
  });
};

/**
 * Matches notebook cells to deck cells: by id, then, for notebooks without cell ids,
 * by identical content and finally by order among cells of the same type.
 * @param {object[]} cells Notebook cells.
 * @param {object[]} deckCells Deck cells in slide order.
 * @returns {Map<object, object>} Deck cell by notebook cell.
 */
const matchCells = (cells, deckCells) => {
  const state = { cells, free: new Set(deckCells), pairs: new Map() };
  const anonymous = (source, target) => !isValidCellId(source.id) && !isLocal(target);
  const sameType = (source, target) => source.cell_type === target.type;
  pairBy(state, (source, target) => isValidCellId(source.id) && originId(target) === source.id);
  pairBy(
    state,
    (source, target) =>
      anonymous(source, target) && joinSource(source.source) === target.source,
  );
  pairBy(state, (source, target) => anonymous(source, target) && sameType(source, target));
  return state.pairs;
};

module.exports = { matchCells };
