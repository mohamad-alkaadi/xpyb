import { useCallback, useState } from 'react';
import { DEFAULT_MODE, nextMode } from '../lib/presentation/modes.js';

/**
 * Holds the presentation display mode.
 * @returns {{displayMode: string, modeCue: number, setDisplayMode: Function,
 *   cycleMode: Function}} Mode state; `modeCue` counts cycles so the switcher can reveal itself.
 */
export const useDisplayMode = () => {
  const [displayMode, setDisplayMode] = useState(DEFAULT_MODE);
  const [modeCue, setModeCue] = useState(0);
  const cycleMode = useCallback(() => {
    setDisplayMode(nextMode);
    setModeCue((cue) => cue + 1);
  }, []);
  return { displayMode, modeCue, setDisplayMode, cycleMode };
};
