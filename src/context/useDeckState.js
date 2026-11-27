import { useCallback, useEffect, useState } from 'react';
import { findActiveSlide } from '../lib/deck/slideActions.js';
import * as api from '../lib/ipc/xpybApi.js';
import { useDeckSave } from './useDeckSave.js';
import { useNotebookSync } from './useNotebookSync.js';
import { useSlideActions } from './useSlideActions.js';

// `savedDeck` is the deck object last known to match the file on disk.
const EMPTY = { deck: null, savedDeck: null, filePath: null, activeSlideId: null };

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
 * Builds the actions that load and convert decks.
 * @param {Function} setCurrent Editor state setter.
 * @param {Function} run Task runner.
 * @returns {{openDeck: Function, convertNotebook: Function}} File actions.
 */
const useDeckFiles = (setCurrent, run) => {
  const openDeck = useCallback(
    (path) =>
      run(async () => {
        const opened = await api.openDeck(path);
        setCurrent({ ...EMPTY, ...opened, savedDeck: opened.deck });
      }),
    [run, setCurrent],
  );
  const convertNotebook = useCallback(
    (path) =>
      run(async () => {
        const { deckPath, deck: converted } = await api.convertNotebook(path);
        setCurrent({ ...EMPTY, deck: converted, savedDeck: converted, filePath: deckPath });
      }),
    [run, setCurrent],
  );
  return { openDeck, convertNotebook };
};

/**
 * Holds the current deck, the selected slide and the actions that change them.
 * @param {string|null} initialPath Deck to open on mount.
 * @returns {object} Deck state and actions.
 */
export const useDeckState = (initialPath) => {
  const [current, setCurrent] = useState(EMPTY);
  const { status, error, run } = useDeckTask();
  const files = useDeckFiles(setCurrent, run);
  const saving = useDeckSave(current, setCurrent, run);
  const actions = useSlideActions(setCurrent);
  const syncNotebook = useNotebookSync(current, setCurrent);
  const { openDeck } = files;
  useEffect(() => {
    if (initialPath) openDeck(initialPath);
  }, [initialPath, openDeck]);
  const activeSlide = findActiveSlide(current.deck, current.activeSlideId);
  const { savedDeck, ...open } = current;
  const isDirty = open.deck !== savedDeck;
  const state = { ...open, activeSlide, isDirty, status, error };
  return { ...state, syncNotebook, ...saving, ...files, ...actions };
};
