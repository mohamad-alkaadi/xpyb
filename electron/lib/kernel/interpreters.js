'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const VENV_FOLDERS = ['.venv', 'venv'];
const PYTHON_NAME = /^(python|pypy)(\d+(\.\d+)*)?[tw]?(\.exe)?$/i;

/**
 * Lists where virtual environment interpreters would live in a directory.
 * @param {string} directory Directory to search.
 * @param {string} platform Node platform name.
 * @returns {{label: string, path: string}[]} Candidate interpreters.
 */
const venvCandidates = (directory, platform) => {
  const binary = platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python'];
  return VENV_FOLDERS.map((folder) => ({
    label: folder,
    path: path.join(directory, folder, ...binary),
  }));
};

/**
 * Tells whether a path is a file this user can execute.
 * @param {string} filePath Path to check.
 * @returns {Promise<boolean>} True for executable files.
 */
const isExecutableFile = async (filePath) => {
  try {
    await fs.access(filePath, fs.constants.X_OK);
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
};

/**
 * Finds the virtual environments next to a deck.
 * @param {string|null} deckPath Open .xpyb path.
 * @param {string} [platform] Node platform name.
 * @returns {Promise<{label: string, path: string}[]>} Existing interpreters.
 */
const detectInterpreters = async (deckPath, platform = process.platform) => {
  if (typeof deckPath !== 'string' || !path.isAbsolute(deckPath)) return [];
  const candidates = venvCandidates(path.dirname(deckPath), platform);
  const found = await Promise.all(candidates.map((item) => isExecutableFile(item.path)));
  return candidates.filter((_, index) => found[index]);
};

/**
 * Checks that a custom interpreter path points to a Python executable.
 * @param {unknown} pythonPath Candidate path; null selects the environment default.
 * @returns {Promise<string|null>} Accepted path.
 */
const validatePythonPath = async (pythonPath) => {
  if (pythonPath === null) return null;
  const named =
    typeof pythonPath === 'string' &&
    path.isAbsolute(pythonPath) &&
    PYTHON_NAME.test(path.basename(pythonPath));
  if (!named || !(await isExecutableFile(pythonPath))) {
    throw new Error('Choose an absolute path to a Python executable.');
  }
  return pythonPath;
};

module.exports = { detectInterpreters, validatePythonPath, venvCandidates };
