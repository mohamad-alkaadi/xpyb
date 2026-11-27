import { useCallback, useState } from 'react';
import * as api from '../lib/ipc/xpybApi.js';
import { findEditableCellId, stepSlide } from '../lib/presentation/slides.js';
import { useDeck } from './DeckContext.jsx';
import { useCellViews } from './useCellViews.js';
import { useDisplayMode } from './useDisplayMode.js';
import { usePrecompile } from './usePrecompile.js';
import { usePresenterKeys } from './usePresenterKeys.js';

const START = Object.freeze({ index: 0, liveCellId: null, views: Object.freeze({}) });

/**
 * Moves to a neighbouring slide, which starts locked and on its code.
 * @param {{index: number}} position Current position.
 * @param {-1|1} step Direction.
 * @param {number} count Number of slides.
 * @returns {object} New position, or the current one at either end of the deck.
 */
const moveBy = (position, step, count) => {
  const index = stepSlide(position.index, step, count);
  return index === position.index ? { ...position, liveCellId: null } : { ...START, index };
};

/**
 * Unlocks the slide's first code cell and brings its code into view.
 * @param {{index: number, views: object}} position Current position.
 * @param {object[]} slides Deck slides.
 * @returns {object} New position.
 */
const unlockCode = (position, slides) => {
  const liveCellId = findEditableCellId(slides[position.index]);
  if (!liveCellId) return { ...position, liveCellId };
  return { ...position, liveCellId, views: { ...position.views, [liveCellId]: 'code' } };
};

/**
 * Builds the actions that move through slides and unlock code.
 * @param {object[]} slides Deck slides.
 * @param {Function} setPosition Position setter.
 * @returns {{next: Function, previous: Function, unlock: Function, lock: Function}} Actions.
 */
const useSlideControls = (slides, setPosition) => {
  const move = (step) => setPosition((position) => moveBy(position, step, slides.length));
  return {
    next: () => move(1),
    previous: () => move(-1),
    unlock: () => setPosition((position) => unlockCode(position, slides)),
    lock: () => setPosition((position) => ({ ...position, liveCellId: null })),
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
 * Maps the presentation shortcuts to actions; slide actions wait for the compile to finish.
 * @param {object} state Controls, view actions, mode, position and exit.
 * @returns {Record<string, Function>} Handler per action name.
 */
const getKeyHandlers = ({ controls, viewActions, mode, isReady, liveCellId, exit }) => {
  const whenReady = (action) => () => isReady && action();
  const toggle = () => mode.displayMode === 'hover-toggle' && viewActions.toggleSlideViews();
  return {
    next: whenReady(controls.next),
    previous: whenReady(controls.previous),
    unlock: whenReady(controls.unlock),
    toggleView: whenReady(toggle),
    cycleMode: mode.cycleMode,
    escape: () => (liveCellId ? controls.lock() : exit()),
  };
};

/**
 * Holds the presentation view, position, display mode, compile progress and keyboard control.
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
  const viewActions = useCellViews(slides, setPosition);
  const mode = useDisplayMode();
  const present = useEnter(setIsPresenting, setPosition);
  const exit = useExit(setIsPresenting, setPosition);
  const { index, ...shown } = position;
  const keyState = { controls, viewActions, mode, exit, isReady: progress.isReady, ...shown };
  usePresenterKeys(isPresenting, getKeyHandlers(keyState));
  const view = { isPresenting, slide: slides[index] || null, progress, ...shown };
  return { ...view, ...mode, ...viewActions, present, exit, ...controls };
};
