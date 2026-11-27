import { createContext, useContext } from 'react';
import { useDeck } from './DeckContext.jsx';
import { useKernelState } from './useKernelState.js';

const KernelContext = createContext(null);

/**
 * Reads the kernel context.
 * @returns {object} Kernel state and actions.
 */
export const useKernel = () => {
  const value = useContext(KernelContext);
  if (!value) throw new Error('useKernel must be used inside KernelProvider.');
  return value;
};

const KernelProvider = ({ children }) => {
  const { deck, filePath } = useDeck();
  const value = useKernelState(deck, filePath);

  return <KernelContext.Provider value={value}>{children}</KernelContext.Provider>;
};

export default KernelProvider;
