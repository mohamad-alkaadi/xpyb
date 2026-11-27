/** Menu value that opens the file dialog. */
export const BROWSE = 'browse';

/** Menu value for the interpreter found in the app's environment. */
export const ENVIRONMENT = '';

/**
 * Lists the interpreter menu entries.
 * @param {{label: string, path: string}[]} interpreters Environments found beside the deck.
 * @param {string|null} pythonPath Selected interpreter, or null for the environment default.
 * @returns {{value: string, label: string}[]} Menu entries.
 */
export const listInterpreterOptions = (interpreters, pythonPath) => {
  const found = interpreters.map(({ label, path }) => ({ value: path, label }));
  const isCustom = pythonPath && !found.some((option) => option.value === pythonPath);
  return [
    { value: ENVIRONMENT, label: 'Environment default' },
    ...found,
    ...(isCustom ? [{ value: pythonPath, label: pythonPath }] : []),
    { value: BROWSE, label: 'Browse…' },
  ];
};

/**
 * Converts a menu value to the argument `setPythonPath` expects.
 * @param {string} value Chosen menu value.
 * @returns {string|null|undefined} Path, null for the default, or undefined to open the dialog.
 */
export const toPythonPath = (value) => {
  if (value === BROWSE) return undefined;
  return value === ENVIRONMENT ? null : value;
};
