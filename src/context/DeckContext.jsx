import { createContext, useContext } from 'react';
import { useDeckState } from './useDeckState.js';

const DeckContext = createContext(null);

/**
 * Reads the deck context.
 * @returns {object} Deck state and actions.
 */
export const useDeck = () => {
  const value = useContext(DeckContext);
  if (!value) throw new Error('useDeck must be used inside DeckProvider.');
  return value;
};

const DeckProvider = ({ initialPath = null, children }) => {
  const value = useDeckState(initialPath);

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
};

export default DeckProvider;
