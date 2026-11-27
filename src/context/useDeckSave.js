import { useCallback, useEffect, useRef, useState } from 'react';
import { isSaveShortcut } from '../lib/deck/saveShortcut.js';
import * as api from '../lib/ipc/xpybApi.js';

/**
 * Binds Ctrl+S and Cmd+S to saving, including while an editor is focused.
 * @param {() => void} save Save action.
 * @returns {void}
 */
const useSaveShortcut = (save) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      save();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save]);
};

/**
 * Saves the open deck, one write at a time.
 * @param {{deck: object|null, filePath: string|null}} current Open deck.
 * @param {Function} setCurrent Editor state setter.
 * @param {Function} run Task runner.
 * @returns {{saveDeck: () => Promise<boolean>, isSaving: boolean}} Save action and state.
 */
export const useDeckSave = ({ deck, filePath }, setCurrent, run) => {
  const [isSaving, setIsSaving] = useState(false);
  const isWriting = useRef(false);
  const write = useCallback(async () => {
    await api.saveDeck(filePath, deck);
    // Edits made during the write stay unsaved because they are a different object.
    setCurrent((state) =>
      state.filePath === filePath ? { ...state, savedDeck: deck } : state,
    );
  }, [deck, filePath, setCurrent]);
  const saveDeck = useCallback(async () => {
    if (!deck || isWriting.current) return false;
    isWriting.current = true;
    setIsSaving(true);
    const saved = await run(write);
    isWriting.current = false;
    setIsSaving(false);
    return saved;
  }, [deck, run, write]);
  useSaveShortcut(saveDeck);
  return { saveDeck, isSaving };
};
