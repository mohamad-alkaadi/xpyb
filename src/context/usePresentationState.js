import { useCallback, useState } from 'react';
import * as api from '../lib/ipc/xpybApi.js';
import { findEditableCellId, stepSlide } from '../lib/presentation/slides.js';
import { useDeck } from './DeckContext.jsx';
import { usePrecompile } from './usePrecompile.js';
import { usePresenterKeys } from './usePresenterKeys.js';

const START = Object.freeze({ index: 0, liveCellId: null });

/**
 * Builds the actions that move through slides and unlock code.
 * @param {object[]} slides Deck slides.
 * @param {Function} setPosition Position setter.
 * @returns {{next: Function, previous: Function, unlock: Function, lock: Function}} Actions.
 */
const useSlideControls = (slides, setPosition) => {
  const move = (step) =>
    setPosition(({ index }) => ({ index: stepSlide(index, step, slides.length), liveCellId: null }));
  return {
    next: () => move(1),
    previous: () => move(-1),
    unlock: () =>
      setPosition(({ index }) => ({ index, liveCellId: findEditableCellId(slides[index]) })),
    lock: () => setPosition(({ index }) => ({ index, liveCellId: null })),
  };
};

/**
 * Starts presenting from the first slide in full screen.
 * @param {Function} setIsPresenting View setter.
 * @param {Function} setPosition Position setter.
 * @returns {() => void} Present action.
 */
const useEnter = (setIsPresenting, setPosition) =>
  useCallback(() => {
    setPosition(START);
    setIsPresenting(true);
    // Full screen is cosmetic, so a missing bridge must not block the presentation.
    api.enterFullScreen().catch(() => {});
  }, [setIsPresenting, setPosition]);

/**
 * Leaves the presentation for the editor.
 * @param {Function} setIsPresenting View setter.
 * @param {Function} setPosition Position setter.
 * @returns {() => void} Exit action.
 */
const useExit = (setIsPresenting, setPosition) =>
  useCallback(() => {
    setIsPresenting(false);
    setPosition(START);
    // Leaving full screen is cosmetic, so a missing bridge must not block the editor.
    api.exitFullScreen().catch(() => {});
  }, [setIsPresenting, setPosition]);

/**
 * Holds the presentation view, position, compile progress and keyboard control.
 * @param {boolean} startPresenting True when launched with `xpyb present`.
 * @returns {object} Presentation state and actions.
 */
export const usePresentationState = (startPresenting) => {
  const { deck } = useDeck();
  const [isPresenting, setIsPresenting] = useState(startPresenting);
  const [position, setPosition] = useState(START);
  const slides = deck?.slides || [];
  const progress = usePrecompile(isPresenting);
  const controls = useSlideControls(slides, setPosition);
  const present = useEnter(setIsPresenting, setPosition);
  const exit = useExit(setIsPresenting, setPosition);
  const whenReady = (action) => () => progress.isReady && action();
  usePresenterKeys(isPresenting, {
    next: whenReady(controls.next),
    previous: whenReady(controls.previous),
    unlock: whenReady(controls.unlock),
    escape: () => (position.liveCellId ? controls.lock() : exit()),
  });
  const slide = slides[position.index] || null;
  const view = { isPresenting, slide, liveCellId: position.liveCellId, progress };
  return { ...view, present, exit, ...controls };
};
