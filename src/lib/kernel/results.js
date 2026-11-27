const RUNNING = Object.freeze({ status: 'running', executionCount: null, outputs: [] });

/**
 * Lists the runnable code cells of a deck in slide order.
 * @param {object|null} deck Deck JSON.
 * @returns {{id: string, code: string}[]} Code cells with source.
 */
export const collectCodeCells = (deck) =>
  (deck?.slides || [])
    .flatMap((slide) => slide.cells || [])
    .filter((cell) => cell.type === 'code' && cell.source.trim())
    .map((cell) => ({ id: cell.id, code: cell.source }));

/**
 * Marks cells as running.
 * @param {Record<string, object>} results Results by cell id.
 * @param {string[]} cellIds Cells being run.
 * @returns {Record<string, object>} New results.
 */
export const markRunning = (results, cellIds) => ({
  ...results,
  ...Object.fromEntries(cellIds.map((id) => [id, RUNNING])),
});

/**
 * Stores finished results and clears the cells that never ran.
 * @param {Record<string, object>} results Results by cell id.
 * @param {string[]} cellIds Cells that were requested.
 * @param {object[]} finished Results carrying their cellId.
 * @returns {Record<string, object>} New results.
 */
export const applyResults = (results, cellIds, finished) => {
  const next = { ...results };
  cellIds.forEach((id) => delete next[id]);
  finished.forEach(({ cellId, ...result }) => {
    next[cellId] = result;
  });
  return next;
};
