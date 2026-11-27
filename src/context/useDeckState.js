import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/ipc/xpybApi.js';

const EMPTY = { deck: null, filePath: null };

/**
 * Tracks the status and error message of asynchronous deck tasks.
 * @returns {{status: string, error: (string|null), run: Function}} Task state and runner.
 */
const useDeckTask = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const run = useCallback(async (task) => {
    setStatus('busy');
    setError(null);
    try {
      await task();
      setStatus('idle');
      return true;
    } catch (failure) {
      setError(failure.message);
      setStatus('error');
      return false;
    }
  }, []);
  return { status, error, run };
};

/**
 * Holds the current deck and the actions that load, save and convert it.
 * @param {string|null} initialPath Deck to open on mount.
 * @returns {object} Deck state and actions.
 */
export const useDeckState = (initialPath) => {
  const [current, setCurrent] = useState(EMPTY);
  const { status, error, run } = useDeckTask();
  const openDeck = useCallback(
    (path) => run(async () => setCurrent(await api.openDeck(path))),
    [run],
  );
  const saveDeck = useCallback(
    () => run(() => api.saveDeck(current.filePath, current.deck)),
    [run, current],
  );
  const convertNotebook = useCallback(
    (path) =>
      run(async () => {
        const { deckPath, deck } = await api.convertNotebook(path);
        setCurrent({ deck, filePath: deckPath });
      }),
    [run],
  );
  useEffect(() => {
    if (initialPath) openDeck(initialPath);
  }, [initialPath, openDeck]);
  return { ...current, status, error, openDeck, saveDeck, convertNotebook };
};
