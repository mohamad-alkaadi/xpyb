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
