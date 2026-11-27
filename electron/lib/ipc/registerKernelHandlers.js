'use strict';

const path = require('node:path');
const { detectInterpreters, validatePythonPath } = require('../kernel/interpreters');
const { runAll } = require('../kernel/runAll');
const { guard } = require('./registerHandlers');

const KERNEL_CHANNELS = Object.freeze({
  runCell: 'xpyb:run-cell',
  runAllCells: 'xpyb:run-all-cells',
  restartKernel: 'xpyb:restart-kernel',
  detectInterpreters: 'xpyb:detect-interpreters',
  setPythonPath: 'xpyb:set-python-path',
});

/**
 * Throws unless the value is a runnable cell.
 * @param {unknown} cell Candidate cell.
 * @returns {{id: string, code: string}} The cell.
 */
const assertCell = (cell) => {
  if (typeof cell?.id !== 'string' || typeof cell.code !== 'string') {
    throw new Error('Expected a cell with a string id and code.');
  }
  return cell;
};

/**
 * Chooses the kernel working directory: the folder of the open deck.
 * @param {unknown} deckPath Open deck path.
 * @returns {string|undefined} Directory, or undefined to inherit the app directory.
 */
const toWorkingDirectory = (deckPath) => {
  const valid = typeof deckPath === 'string' && path.isAbsolute(deckPath);
  return valid && path.extname(deckPath).toLowerCase() === '.xpyb'
    ? path.dirname(deckPath)
    : undefined;
};

/**
 * Applies a custom interpreter; an omitted path opens the file dialog.
 * @param {object} manager Kernel manager.
 * @param {string|null|undefined} pythonPath Requested interpreter.
 * @param {() => Promise<string|null>} choose Opens the file dialog.
 * @returns {Promise<{pythonPath: (string|null)}>} Active interpreter path.
 */
const applyPythonPath = async (manager, pythonPath, choose) => {
  const chosen = pythonPath === undefined ? await choose() : pythonPath;
  const cancelled = pythonPath === undefined && chosen === null;
  if (!cancelled) await manager.setPythonPath(await validatePythonPath(chosen));
  return { pythonPath: manager.getPythonPath() };
};

/**
 * Builds the handlers that run code.
 * @param {{forSender: Function}} registry Kernel registry.
 * @returns {Record<string, Function>} Handlers taking the sender first.
 */
const executionHandlers = (registry) => ({
  runCell: (sender, cell, deckPath) =>
    registry.forSender(sender).execute(assertCell(cell).code, toWorkingDirectory(deckPath)),
  runAllCells: (sender, cells, deckPath) => {
    if (!Array.isArray(cells)) throw new Error('Expected a list of cells.');
    const checked = cells.map(assertCell);
    return runAll(registry.forSender(sender), checked, toWorkingDirectory(deckPath));
  },
  restartKernel: (sender) => registry.forSender(sender).restart(),
});

/**
 * Builds the handlers that select the interpreter.
 * @param {{forSender: Function}} registry Kernel registry.
 * @param {(sender: object) => Promise<string|null>} choosePython Opens the file dialog.
 * @returns {Record<string, Function>} Handlers taking the sender first.
 */
const interpreterHandlers = (registry, choosePython) => ({
  detectInterpreters: async (sender, deckPath) => ({
    interpreters: await detectInterpreters(deckPath),
    pythonPath: registry.forSender(sender).getPythonPath(),
  }),
  setPythonPath: (sender, pythonPath) =>
    applyPythonPath(registry.forSender(sender), pythonPath, () => choosePython(sender)),
});

/**
 * Registers the kernel IPC handlers.
 * @param {{handle: Function}} ipcMain Electron ipcMain.
 * @param {{isTrusted: Function, registry: object, choosePython: Function}} options Dependencies.
 * @returns {void}
 */
const registerKernelHandlers = (ipcMain, { isTrusted, registry, choosePython }) => {
  const handlers = {
    ...executionHandlers(registry),
    ...interpreterHandlers(registry, choosePython),
  };
  Object.entries(KERNEL_CHANNELS).forEach(([name, channel]) => {
    ipcMain.handle(channel, (event, ...args) =>
      guard(isTrusted, () => handlers[name](event.sender, ...args))(event),
    );
  });
};

module.exports = { KERNEL_CHANNELS, registerKernelHandlers };
