const ACTIONS = Object.freeze({
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  ' ': 'next',
  Escape: 'escape',
  e: 'unlock',
  E: 'unlock',
  m: 'cycleMode',
  M: 'cycleMode',
  o: 'toggleView',
  O: 'toggleView',
});

const TYPING = 'input, textarea, select, [contenteditable="true"]';

/**
 * Tells whether a key press belongs to the focused control instead of the presentation.
 * @param {{key: string, target: EventTarget}} event Keyboard event.
 * @returns {boolean} True while typing, or when Space would press a focused button or link.
 */
const isForControl = ({ key, target }) => {
  if (key === 'Escape' || !target?.closest) return false;
  if (target.closest(TYPING)) return true;
  return key === ' ' && Boolean(target.closest('button, a'));
};

/**
 * Maps a key press to a presentation action. Shift+Enter is handled by the code editor.
 * @param {KeyboardEvent} event Keyboard event.
 * @returns {'next'|'previous'|'escape'|'unlock'|'cycleMode'|'toggleView'|null} Action, or null to
 *   ignore the key.
 */
export const getPresenterAction = (event) => {
  const modified = event.ctrlKey || event.metaKey || event.altKey;
  if (event.defaultPrevented || modified || isForControl(event)) return null;
  return ACTIONS[event.key] || null;
};
