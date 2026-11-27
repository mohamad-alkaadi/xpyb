import { useEffect, useRef } from 'react';
import { getPresenterAction } from '../lib/presentation/keys.js';

/**
 * Listens for presentation shortcuts while the presenter view is active.
 * @param {boolean} isActive Whether to listen.
 * @param {Record<string, Function>} handlers Handler per action name.
 * @returns {void}
 */
export const usePresenterKeys = (isActive, handlers) => {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    if (!isActive) return undefined;
    const onKeyDown = (event) => {
      const action = getPresenterAction(event);
      if (!action) return;
      event.preventDefault();
      latest.current[action]();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive]);
};
