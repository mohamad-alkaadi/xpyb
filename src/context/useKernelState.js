import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../lib/ipc/xpybApi.js';
import { applyResults, collectCodeCells, markRunning } from '../lib/kernel/results.js';

/**
 * Stores cell results and discards those that arrive after a reset.
 * @returns {{results: object, error: (string|null), setError: Function, track: Function,
 *   reset: Function, clearResults: Function}} Result state; `track` resolves to the finished
 *   results, or null when the bridge failed.
 */
const useCellResults = () => {
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const generation = useRef(0);
  const reset = useCallback(() => {
    generation.current += 1;
    setResults({});
    setError(null);
  }, []);
  const track = useCallback(async (cellIds, task) => {
    const started = generation.current;
    const isCurrent = () => generation.current === started;
    setError(null);
    setResults((previous) => markRunning(previous, cellIds));
    try {
      const finished = await task();
      if (isCurrent()) setResults((previous) => applyResults(previous, cellIds, finished));
      return finished;
    } catch (failure) {
      if (!isCurrent()) return null;
      setError(failure.message);
      setResults((previous) => applyResults(previous, cellIds, []));
      return null;
    }
  }, []);
  const clearResults = useCallback(
    (cellIds) => setResults((previous) => applyResults(previous, cellIds, [])),
    [],
  );
  return { results, error, setError, track, reset, clearResults };
};

/**
 * Builds the actions that execute cells.
 * @param {Function} track Result tracker.
 * @param {object|null} deck Open deck.
 * @param {string|null} filePath Open deck path.
 * @returns {{runCell: Function, runAllCells: Function}} Execution actions.
 */
const useExecution = (track, deck, filePath) => {
  const runCell = useCallback(
    (id, code) =>
      track([id], async () => [{ cellId: id, ...(await api.runCell({ id, code }, filePath)) }]),
    [track, filePath],
  );
  const runAllCells = useCallback(() => {
    const cells = collectCodeCells(deck);
    const ids = cells.map((cell) => cell.id);
    return track(ids, () => api.runAllCells(cells, filePath));
  }, [track, deck, filePath]);
  return { runCell, runAllCells };
};

/**
 * Builds the restart action.
 * @param {{reset: Function, setError: Function}} cells Result state.
 * @returns {() => Promise<void>} Restarts the kernel and clears results.
 */
const useRestart = ({ reset, setError }) =>
  useCallback(async () => {
    reset();
    try {
      const result = await api.restartKernel();
      if (result.status === 'error') setError(result.outputs?.[0]?.text || result.error);
    } catch (failure) {
      setError(failure.message);
    }
  }, [reset, setError]);

/**
 * Builds the interpreter selection action.
 * @param {[string|null, Function]} selection Active interpreter and its setter.
 * @param {{reset: Function, setError: Function}} cells Result state.
 * @returns {(path?: string|null) => Promise<void>} Applies a path, or opens the dialog.
 */
const useSelectPython = ([pythonPath, setSelected], { reset, setError }) =>
  useCallback(
    async (path) => {
      try {
        const { pythonPath: active } = await api.setPythonPath(path);
        if (active !== pythonPath) reset();
        setSelected(active);
      } catch (failure) {
        setError(failure.message);
      }
    },
    [pythonPath, setSelected, reset, setError],
  );

/**
 * Tracks the detected and selected Python interpreters.
 * @param {string|null} filePath Open deck path.
 * @param {{reset: Function, setError: Function}} cells Result state.
 * @returns {object} Interpreter state and actions.
 */
const useInterpreters = (filePath, cells) => {
  const [interpreters, setInterpreters] = useState([]);
  const [pythonPath, setSelected] = useState(null);
  const { setError } = cells;
  const detectInterpreters = useCallback(
    () =>
      api.detectInterpreters(filePath).then(
        (found) => {
          setInterpreters(found.interpreters);
          setSelected(found.pythonPath);
        },
        (failure) => setError(failure.message),
      ),
    [filePath, setError],
  );
  const setPythonPath = useSelectPython([pythonPath, setSelected], cells);
  return { interpreters, pythonPath, detectInterpreters, setPythonPath };
};

/**
 * Holds kernel results, interpreter selection and the actions that change them.
 * @param {object|null} deck Open deck.
 * @param {string|null} filePath Open deck path.
 * @returns {object} Kernel state and actions.
 */
export const useKernelState = (deck, filePath) => {
  const cells = useCellResults();
  const execution = useExecution(cells.track, deck, filePath);
  const restartKernel = useRestart(cells);
  const interpreters = useInterpreters(filePath, cells);
  const { reset, results, error, clearResults } = cells;
  // Results belong to one deck, so opening another one clears them.
  useEffect(() => reset(), [filePath, reset]);
  const isRunning = Object.values(results).some((result) => result.status === 'running');
  return { results, error, isRunning, clearResults, restartKernel, ...execution, ...interpreters };
};
