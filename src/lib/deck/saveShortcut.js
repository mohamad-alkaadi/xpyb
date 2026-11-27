/**
 * Tells whether a key press is Ctrl+S or Cmd+S.
 * @param {KeyboardEvent} event Keyboard event.
 * @returns {boolean} True for the save shortcut.
 */
export const isSaveShortcut = ({ key, ctrlKey, metaKey, altKey, shiftKey }) =>
  (ctrlKey || metaKey) && !altKey && !shiftKey && key.toLowerCase() === 's';
