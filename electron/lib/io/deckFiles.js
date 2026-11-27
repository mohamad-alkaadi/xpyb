'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { notebookToDeck } = require('../converter/notebookToDeck');
const { validateDeck } = require('../converter/validate');

/**
 * Throws unless the value is an absolute path with the expected extension.
 * @param {unknown} filePath Candidate path.
 * @param {string} extension Required extension.
 * @returns {void}
 */
const assertPath = (filePath, extension) => {
  const valid = typeof filePath === 'string' && path.isAbsolute(filePath);
  if (!valid || path.extname(filePath).toLowerCase() !== extension) {
    throw new Error(`Expected an absolute ${extension} file path.`);
  }
};

/**
 * Reads and parses a JSON file.
 * @param {string} filePath File to read.
 * @returns {Promise<unknown>} Parsed JSON.
 */
const readJson = async (filePath) => {
  const text = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
};

/**
 * Serializes a deck to file text.
 * @param {object} deck Deck JSON.
 * @returns {string} Formatted JSON with a trailing newline.
 */
const serializeDeck = (deck) => `${JSON.stringify(validateDeck(deck), null, 2)}\n`;

/**
 * Loads and validates a deck file.
 * @param {string} filePath Absolute .xpyb path.
 * @returns {Promise<{filePath: string, deck: object}>} Loaded deck.
 */
const readDeck = async (filePath) => {
  assertPath(filePath, '.xpyb');
  return { filePath, deck: validateDeck(await readJson(filePath)) };
};

/**
 * Saves a deck by writing a temporary file and renaming it over the target.
 * @param {string} filePath Absolute .xpyb path.
 * @param {object} deck Deck JSON.
 * @returns {Promise<{filePath: string}>} Saved path.
 */
const writeDeck = async (filePath, deck) => {
  assertPath(filePath, '.xpyb');
  const text = serializeDeck(deck);
  const temporary = `${filePath}.${process.pid}.tmp`;
  try {
    await fs.writeFile(temporary, text, 'utf8');
    await fs.rename(temporary, filePath);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { filePath };
};

/**
 * Writes a new file and refuses to replace an existing one.
 * @param {string} filePath Target path.
 * @param {string} text File content.
 * @returns {Promise<void>}
 */
const writeNewFile = async (filePath, text) => {
  try {
    await fs.writeFile(filePath, text, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error(`${filePath} already exists. Move or rename it, then convert again.`);
  }
};

/**
 * Converts a notebook file into a deck beside it.
 * @param {string} notebookPath Absolute .ipynb path.
 * @returns {Promise<{deckPath: string, deck: object}>} Created deck.
 */
const convertNotebookFile = async (notebookPath) => {
  assertPath(notebookPath, '.ipynb');
  const notebook = await readJson(notebookPath);
  const deck = notebookToDeck(notebook, { sourceNotebook: notebookPath });
  const deckPath = `${notebookPath.slice(0, -'.ipynb'.length)}.xpyb`;
  await writeNewFile(deckPath, serializeDeck(deck));
  return { deckPath, deck };
};

module.exports = { convertNotebookFile, readDeck, writeDeck };
