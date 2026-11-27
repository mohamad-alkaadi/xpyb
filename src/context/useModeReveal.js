import { useEffect, useRef, useState } from 'react';

/** How long the mode switcher stays visible after the mode is cycled, in milliseconds. */
export const REVEAL_MS = 2000;

/**
 * Reveals the mode switcher while the pointer is over it, and briefly after each mode cycle.
 * @param {number} cue Number of mode cycles so far.
 * @returns {{isRevealed: boolean, setIsHovered: Function}} Visibility and hover setter.
 */
export const useModeReveal = (cue) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  // Cycles made before the switcher appeared must not flash it.
  const initialCue = useRef(cue);
  useEffect(() => {
    if (cue === initialCue.current) return undefined;
    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [cue]);
  return { isRevealed: isHovered || isFlashing, setIsHovered };
};
