'use strict';

const { joinSource } = require('./sourceText');

// Metadata owned by the deck, which a notebook never overrides.
const DECK_KEYS = ['xpybSlot', 'xpybOrigin', 'xpybLocal'];

/**
 * Picks the cell type after a sync; a content type chosen in the editor wins.
 * @param {object} cell Deck cell.
 * @param {object} source Notebook cell.
 * @returns {string} Cell type.
 */
const syncedType = (cell, source) => {
  const mode = cell.metadata?.xpybSlot?.mode;
  return mode === 'text' || mode === 'code' ? cell.type : source.cell_type;
};

/**
 * Takes the notebook outputs; saved ones survive only while the code is unchanged.
 * @param {object} cell Deck cell.
 * @param {object} source Notebook cell.
 * @param {boolean} changed Whether the source text changed.
 * @returns {{outputs: object[], executionCount: (number|null)}} Output fields.
 */
const syncedOutputs = (cell, source, changed) => {
  if (!changed && !source.outputs?.length) {
    return { outputs: cell.outputs || [], executionCount: cell.executionCount ?? null };
  }
  return {
    outputs: structuredClone(source.outputs || []),
    executionCount: source.execution_count ?? null,
  };
};

/**
 * Merges notebook metadata into a cell while keeping the deck's own settings.
 * @param {object} cell Deck cell.
 * @param {object} source Notebook cell.
 * @returns {object} Cell metadata.
 */
const syncedMetadata = (cell, source) => {
  const { xpyb, ...incoming } = source.metadata || {};
  const own = Object.entries(cell.metadata || {}).filter(([key]) => DECK_KEYS.includes(key));
  DECK_KEYS.forEach((key) => delete incoming[key]);
  return { ...incoming, ...Object.fromEntries(own) };
};

/**
 * Reloads one deck cell from its notebook cell.
 * @param {object} cell Deck cell.
 * @param {object} source Notebook cell.
 * @returns {object} Updated cell with the same id and slot settings.
 */
const updateCell = (cell, source) => {
  const text = joinSource(source.source);
  const type = syncedType(cell, source);
  const { attachments, outputs, executionCount, ...kept } = cell;
  const next = { ...kept, type, source: text, metadata: syncedMetadata(cell, source) };
  if (source.attachments) next.attachments = structuredClone(source.attachments);
  if (type !== 'code') return { ...next, outputs: [] };
  return { ...next, ...syncedOutputs(cell, source, text !== cell.source) };
};

module.exports = { updateCell };
