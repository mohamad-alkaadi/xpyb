import { createContext, useContext } from 'react';

const SlideContext = createContext(null);

/**
 * Reads the slide being rendered.
 * @returns {{slide: object, isEditable: boolean}} Slide and whether it accepts input.
 */
export const useSlide = () => {
  const value = useContext(SlideContext);
  if (!value) throw new Error('useSlide must be used inside SlideProvider.');
  return value;
};

const SlideProvider = ({ slide, isEditable, children }) => (
  <SlideContext.Provider value={{ slide, isEditable }}>{children}</SlideContext.Provider>
);

export default SlideProvider;
