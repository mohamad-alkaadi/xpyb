import { useCallback } from 'react';
import { canRun } from '../lib/kernel/results.js';
import { useKernel } from './KernelContext.jsx';

/**
 * Provides the run state and run action of one code cell.
 * @param {string} cellId Code cell id.
 * @returns {{result: (object|undefined), run: (code: string) => void}} Latest result and runner.
 */
export const useRunCell = (cellId) => {
  const { results, runCell } = useKernel();
  const result = results[cellId];
  const run = useCallback(
    (code) => {
      if (canRun(code, result)) runCell(cellId, code);
    },
    [cellId, result, runCell],
  );
  return { result, run };
};
