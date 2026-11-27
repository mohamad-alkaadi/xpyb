'use strict';

const { parseArgs } = require('../cli/parseArgs');

/**
 * Reads the launch request from the Electron process arguments.
 * @param {string[]} argv Process argv.
 * @param {boolean} isDefaultApp True when started as `electron <appRoot>`.
 * @param {string} cwd Directory used to resolve relative paths.
 * @returns {{mode: 'editor'|'present', filePath: (string|null)}} Launch request.
 */
const getLaunchRequest = (argv, isDefaultApp, cwd) => {
  const userArgs = argv.slice(isDefaultApp ? 2 : 1).filter((arg) => !arg.startsWith('--'));
  const { command, filePath } = parseArgs(userArgs, cwd);
  if (command === 'convert') throw new Error('Run "xpyb convert" from the command line.');
  return { mode: command === 'present' ? 'present' : 'editor', filePath };
};

/**
 * Builds the query parameters that hand the launch request to the renderer.
 * @param {{mode: string, filePath: (string|null)}} request Launch request.
 * @returns {Record<string, string>} Query parameters.
 */
const toQuery = ({ mode, filePath }) => (filePath ? { mode, file: filePath } : { mode });

/**
 * Builds secure BrowserWindow options.
 * @param {string} mode Launch mode.
 * @param {string} preloadPath Absolute preload script path.
 * @returns {object} BrowserWindow options.
 */
const getWindowOptions = (mode, preloadPath) => ({
  width: 1280,
  height: 800,
  fullscreen: mode === 'present',
  autoHideMenuBar: true,
  backgroundColor: mode === 'present' ? '#000000' : '#f8fafc',
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: false,
  },
});

module.exports = { getLaunchRequest, getWindowOptions, toQuery };
