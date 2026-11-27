import { useCallback, useRef } from 'react';
import * as api from '../lib/ipc/xpybApi.js';

/**
 * Builds the action that reloads the open deck from its source notebook.
 * The result is dropped if the deck was edited while the notebook was being read.
 * @param {{deck: object|null, filePath: string|null}} current Open deck.
 * @param {Function} setCurrent Editor state setter.
 * @returns {() => Promise<{changedIds: string[], added: number, missing: number}>} Sync action,
 *   which rejects when the notebook cannot be applied.
 */
export const useNotebookSync = ({ deck, filePath }, setCurrent) => {
  const latest = useRef(deck);
  latest.current = deck;
  return useCallback(async () => {
    const { deck: synced, ...summary } = await api.syncNotebook(deck, filePath);
    if (latest.current !== deck) {
      throw new Error('The deck changed while syncing. Sync again.');
    }
    // An identical result must not mark the deck as unsaved.
    if (JSON.stringify(synced) !== JSON.stringify(deck)) {
      setCurrent((state) => ({ ...state, deck: synced }));
    }
    return summary;
  }, [deck, filePath, setCurrent]);
};
