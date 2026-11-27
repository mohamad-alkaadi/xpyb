'use strict';

/**
 * Runs cells in order, stopping at the first failure, restart or interrupt.
 * @param {{execute: Function, getGeneration: () => number}} manager Kernel manager.
 * @param {{id: string, code: string}[]} cells Code cells.
 * @param {string} [cwd] Kernel working directory.
 * @returns {Promise<object[]>} Results of the cells that ran, each with its cellId.
 */
const runAll = async (manager, cells, cwd) => {
  const generation = manager.getGeneration();
  const results = [];
  for (const cell of cells) {
    const result = await manager.execute(cell.code, cwd);
    results.push({ cellId: cell.id, ...result });
    if (result.status !== 'ok' || manager.getGeneration() !== generation) break;
  }
  return results;
};

module.exports = { runAll };
