/**
 * Returns the preload bridge, failing clearly outside the desktop app.
 * @returns {object} The window.xpybApi bridge.
 */
const getBridge = () => {
  if (!window.xpybApi) throw new Error('The desktop bridge is not available.');
  return window.xpybApi;
};

/**
 * Loads a deck file.
 * @param {string} filePath Absolute .xpyb path.
 * @returns {Promise<{filePath: string, deck: object}>} Loaded deck.
 */
export const openDeck = async (filePath) => getBridge().openDeck(filePath);

/**
 * Saves a deck file.
 * @param {string} filePath Absolute .xpyb path.
 * @param {object} deck Deck JSON.
 * @returns {Promise<{filePath: string}>} Saved path.
 */
export const saveDeck = async (filePath, deck) => getBridge().saveDeck(filePath, deck);

/**
 * Converts a notebook into a deck beside it.
 * @param {string} notebookPath Absolute .ipynb path.
 * @returns {Promise<{deckPath: string, deck: object}>} Created deck.
 */
export const convertNotebook = async (notebookPath) => getBridge().convertNotebook(notebookPath);

/**
 * Runs one code cell.
 * @param {{id: string, code: string}} cell Code cell.
 * @param {string|null} deckPath Open deck, whose folder becomes the working directory.
 * @returns {Promise<{status: string, outputs: object[]}>} Execution result.
 */
export const runCell = async (cell, deckPath) => getBridge().runCell(cell, deckPath);

/**
 * Runs code cells in order until one fails.
 * @param {{id: string, code: string}[]} cells Code cells.
 * @param {string|null} deckPath Open deck path.
 * @returns {Promise<object[]>} Results of the cells that ran, each with its cellId.
 */
export const runAllCells = async (cells, deckPath) => getBridge().runAllCells(cells, deckPath);

/**
 * Restarts the Python kernel.
 * @returns {Promise<{status: string, outputs?: object[]}>} Restart result.
 */
export const restartKernel = async () => getBridge().restartKernel();

/**
 * Lists the virtual environments next to a deck.
 * @param {string|null} deckPath Open deck path.
 * @returns {Promise<{interpreters: object[], pythonPath: (string|null)}>} Interpreters.
 */
export const detectInterpreters = async (deckPath) => getBridge().detectInterpreters(deckPath);

/**
 * Selects the Python interpreter.
 * @param {string|null} [pythonPath] Executable path, null for the environment default,
 *   or omitted to open the file dialog.
 * @returns {Promise<{pythonPath: (string|null)}>} Active interpreter path.
 */
export const setPythonPath = async (pythonPath) => getBridge().setPythonPath(pythonPath);
