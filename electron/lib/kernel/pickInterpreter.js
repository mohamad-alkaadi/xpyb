'use strict';

/**
 * Opens the native file dialog so the user can choose a Python executable.
 * @param {{showOpenDialog: Function}} dialog Electron dialog.
 * @param {object} window Parent BrowserWindow.
 * @returns {Promise<string|null>} Chosen path, or null when cancelled.
 */
const pickInterpreter = async (dialog, window) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    title: 'Select Python Interpreter',
    buttonLabel: 'Use Interpreter',
    // Virtual environments usually live in hidden folders such as .venv.
    properties: ['openFile', 'showHiddenFiles', 'noResolveAliases'],
  });
  return canceled ? null : (filePaths[0] ?? null);
};

module.exports = { pickInterpreter };
