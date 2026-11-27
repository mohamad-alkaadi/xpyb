import { useCallback, useEffect, useState } from 'react';
import { findActiveSlide } from '../lib/deck/slideActions.js';
import * as api from '../lib/ipc/xpybApi.js';
import { useSlideActions } from './useSlideActions.js';

const EMPTY = { deck: null, filePath: null, activeSlideId: null };

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
 * Builds the actions that load, save and convert decks.
 * @param {{deck: object|null, filePath: string|null}} current Open deck.
 * @param {Function} setCurrent Editor state setter.
 * @param {Function} run Task runner.
 * @returns {{openDeck: Function, saveDeck: Function, convertNotebook: Function}} File actions.
 */
const useDeckFiles = ({ deck, filePath }, setCurrent, run) => {
  const openDeck = useCallback(
    (path) => run(async () => setCurrent({ ...EMPTY, ...(await api.openDeck(path)) })),
    [run, setCurrent],
  );
  const saveDeck = useCallback(
    () => run(() => api.saveDeck(filePath, deck)),
    [run, filePath, deck],
  );
  const convertNotebook = useCallback(
    (path) =>
      run(async () => {
        const { deckPath, deck: converted } = await api.convertNotebook(path);
        setCurrent({ ...EMPTY, deck: converted, filePath: deckPath });
      }),
    [run, setCurrent],
  );
  return { openDeck, saveDeck, convertNotebook };
};

/**
 * Holds the current deck, the selected slide and the actions that change them.
 * @param {string|null} initialPath Deck to open on mount.
 * @returns {object} Deck state and actions.
 */
export const useDeckState = (initialPath) => {
  const [current, setCurrent] = useState(EMPTY);
  const { status, error, run } = useDeckTask();
  const files = useDeckFiles(current, setCurrent, run);
  const actions = useSlideActions(setCurrent);
  const { openDeck } = files;
  useEffect(() => {
    if (initialPath) openDeck(initialPath);
  }, [initialPath, openDeck]);
  const activeSlide = findActiveSlide(current.deck, current.activeSlideId);
  return { ...current, activeSlide, status, error, ...files, ...actions };
};
