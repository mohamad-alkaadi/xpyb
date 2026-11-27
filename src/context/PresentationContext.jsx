import { createContext, useContext } from 'react';
import { usePresentationState } from './usePresentationState.js';

const PresentationContext = createContext(null);

/**
 * Reads the presentation context.
 * @returns {object} Presentation state and actions.
 */
export const usePresentation = () => {
  const value = useContext(PresentationContext);
  if (!value) throw new Error('usePresentation must be used inside PresentationProvider.');
  return value;
};

const PresentationProvider = ({ startPresenting = false, children }) => {
  const value = usePresentationState(startPresenting);

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
};

export default PresentationProvider;
