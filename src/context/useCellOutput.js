import { normalizeOutputs } from '../lib/slides/outputs.js';
import { useKernel } from './KernelContext.jsx';

/**
 * Provides the output of a code cell: the latest run, else what the deck stored.
 * @param {object|null} cell Code cell.
 * @returns {{items: object[], isRunning: boolean}} Display items and run state.
 */
export const useCellOutput = (cell) => {
  const { results } = useKernel();
  const result = cell && results[cell.id];
  const items = normalizeOutputs((result || cell)?.outputs);
  return { items, isRunning: result?.status === 'running' };
};
