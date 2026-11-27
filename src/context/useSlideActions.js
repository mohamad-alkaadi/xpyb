import { useCallback, useMemo } from 'react';
import * as slides from '../lib/deck/slideActions.js';
import * as content from '../lib/layouts/slotContent.js';

/**
 * Builds the actions that add, copy, remove, reorder and select slides.
 * @param {Function} setCurrent Editor state setter.
 * @returns {object} Slide list actions.
 */
const useSlideList = (setCurrent) =>
  useMemo(() => {
    const apply = (change, ...args) =>
      setCurrent((state) => (state.deck ? change(state, ...args) : state));
    return {
      selectSlide: (activeSlideId) => setCurrent((state) => ({ ...state, activeSlideId })),
      addSlide: () => apply(slides.addSlide),
      duplicateSlide: (slideId) => apply(slides.duplicateSlide, slideId),
      deleteSlide: (slideId) => apply(slides.deleteSlide, slideId),
      moveSlide: (slideId, step) => apply(slides.moveSlide, slideId, step),
    };
  }, [setCurrent]);

/**
 * Builds the actions that change the content and style of slides.
 * @param {Function} setCurrent Editor state setter.
 * @returns {object} Slide content actions.
 */
const useSlideContent = (setCurrent) => {
  const edit = useCallback(
    (change, ...args) =>
      setCurrent((state) =>
        state.deck ? { ...state, deck: change(state.deck, ...args) } : state,
      ),
    [setCurrent],
  );
  return useMemo(
    () => ({
      updateSlide: (slideId, changes) => edit(slides.updateSlide, slideId, changes),
      setSlotSource: (target, source) => edit(content.setSlotSource, target, source),
      setSlotMode: (target, mode) => edit(content.setSlotMode, target, mode),
      bindSlotOutput: (target, cellId) => edit(content.bindSlotOutput, target, cellId),
    }),
    [edit],
  );
};

/**
 * Combines the slide list and slide content actions.
 * @param {Function} setCurrent Editor state setter.
 * @returns {object} Slide actions.
 */
export const useSlideActions = (setCurrent) => ({
  ...useSlideList(setCurrent),
  ...useSlideContent(setCurrent),
});
