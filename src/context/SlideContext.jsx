import { createContext, useContext } from 'react';

const SlideContext = createContext(null);

/**
 * Reads the slide being rendered.
 * @returns {{slide: object, isEditable: boolean, isPresenting: boolean,
 *   liveCellId: (string|null)}} Slide, whether it accepts input or is being presented, and the
 *   focused cell when code is unlocked during a presentation.
 */
export const useSlide = () => {
  const value = useContext(SlideContext);
  if (!value) throw new Error('useSlide must be used inside SlideProvider.');
  return value;
};

const SlideProvider = ({ slide, isEditable, isPresenting, liveCellId = null, children }) => (
  <SlideContext.Provider value={{ slide, isEditable, isPresenting, liveCellId }}>
    {children}
  </SlideContext.Provider>
);

export default SlideProvider;
