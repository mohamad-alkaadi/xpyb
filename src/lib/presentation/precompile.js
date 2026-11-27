/**
 * Runs cells one after another so their outputs are ready before the first slide.
 * A failing cell does not stop the rest; a failing Python bridge does.
 * @param {{id: string, code: string}[]} cells Code cells in slide order.
 * @param {{run: Function, onProgress: (done: number) => void, isCancelled: () => boolean}} hooks
 *   `run(id, code)` resolves to the cell's results, or null when the bridge failed.
 * @returns {Promise<void>}
 */
export const precompileCells = async (cells, { run, onProgress, isCancelled }) => {
  for (const [index, cell] of cells.entries()) {
    if (isCancelled()) return;
    onProgress(index);
    const finished = await run(cell.id, cell.code);
    if (!finished || finished.some((result) => isBridgeFailure(result))) return;
  }
};

/**
 * Tells whether a result reports that Python itself could not be used.
 * @param {{outputs?: object[]}} result Execution result.
 * @returns {boolean} True for bridge failures, such as a missing package.
 */
export const isBridgeFailure = (result) =>
  Boolean(result.outputs?.some((output) => output.ename === 'KernelError'));

/**
 * Describes the compile progress.
 * @param {{done: number, total: number}} progress Cells finished and cells overall.
 * @returns {string} Progress message.
 */
export const describeProgress = ({ done, total }) =>
  `Compiling cell ${Math.min(done + 1, total)} of ${total}...`;
