import { useEffect, useRef, useState } from 'react';
import { collectCodeCells } from '../lib/kernel/results.js';
import { precompileCells } from '../lib/presentation/precompile.js';
import { useDeck } from './DeckContext.jsx';
import { useKernel } from './KernelContext.jsx';

const PENDING = Object.freeze({ done: 0, total: 0, isReady: false });

/**
 * Compiles every code cell once each time a presentation starts.
 * @param {boolean} isPresenting Whether the presenter view is active.
 * @returns {{done: number, total: number, isReady: boolean}} Compile progress.
 */
export const usePrecompile = (isPresenting) => {
  const { deck, filePath } = useDeck();
  const { runCell } = useKernel();
  const [progress, setProgress] = useState(PENDING);
  // Read through a ref so that live edits never restart the compile.
  const latest = useRef(null);
  latest.current = { deck, runCell };
  const isLoaded = Boolean(deck);
  useEffect(() => {
    if (!isPresenting || !isLoaded) return undefined;
    let cancelled = false;
    const isCancelled = () => cancelled;
    compile(latest, setProgress, isCancelled);
    return () => {
      cancelled = true;
      setProgress(PENDING);
    };
  }, [isPresenting, isLoaded, filePath]);
  return progress;
};

/**
 * Runs one compile pass and publishes its progress.
 * @param {{current: {deck: object, runCell: Function}}} latest Latest deck and runner.
 * @param {Function} setProgress Progress setter.
 * @param {() => boolean} isCancelled True once this pass is obsolete.
 * @returns {Promise<void>}
 */
const compile = async (latest, setProgress, isCancelled) => {
  // Wait for the kernel provider to clear the previous deck's results first.
  await Promise.resolve();
  if (isCancelled()) return;
  const { deck, runCell: run } = latest.current;
  const cells = collectCodeCells(deck);
  const total = cells.length;
  const onProgress = (done) => setProgress({ done, total, isReady: false });
  await precompileCells(cells, { run, onProgress, isCancelled });
  if (!isCancelled()) setProgress({ done: total, total, isReady: true });
};
