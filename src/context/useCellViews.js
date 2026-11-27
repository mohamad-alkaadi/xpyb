import { useCallback } from 'react';
import { toggleViews } from '../lib/presentation/modes.js';
import { listShownCodeIds } from '../lib/presentation/slides.js';

/**
 * Builds the actions that switch presented cells between code and output.
 * @param {object[]} slides Deck slides.
 * @param {Function} setPosition Position setter.
 * @returns {{showView: Function, toggleSlideViews: Function}} View actions.
 */
export const useCellViews = (slides, setPosition) => {
  const showView = useCallback(
    (cellId, view) =>
      setPosition((position) => ({ ...position, views: { ...position.views, [cellId]: view } })),
    [setPosition],
  );
  const toggleSlideViews = () =>
    setPosition((position) => {
      const cellIds = listShownCodeIds(slides[position.index]);
      return { ...position, views: toggleViews(position.views, cellIds) };
    });
  return { showView, toggleSlideViews };
};
