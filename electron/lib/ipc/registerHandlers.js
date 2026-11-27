'use strict';

const { convertNotebookFile, readDeck, writeDeck } = require('../io/deckFiles');

const CHANNELS = Object.freeze({
  openDeck: 'xpyb:open-deck',
  saveDeck: 'xpyb:save-deck',
  convertNotebook: 'xpyb:convert-notebook',
});

/**
 * Wraps a handler so only the trusted app page can call it.
 * @param {(url: string) => boolean} isTrusted Sender URL check.
 * @param {Function} handler Handler receiving the renderer arguments.
 * @returns {Function} IPC listener.
 */
const guard = (isTrusted, handler) => (event, ...args) => {
  if (!isTrusted(event.senderFrame?.url || '')) throw new Error('Untrusted IPC sender.');
  return handler(...args);
};

/**
 * Registers the deck IPC handlers.
 * @param {{handle: Function}} ipcMain Electron ipcMain.
 * @param {(url: string) => boolean} isTrusted Sender URL check.
 * @returns {void}
 */
const registerHandlers = (ipcMain, isTrusted) => {
  ipcMain.handle(CHANNELS.openDeck, guard(isTrusted, readDeck));
  ipcMain.handle(CHANNELS.saveDeck, guard(isTrusted, writeDeck));
  ipcMain.handle(CHANNELS.convertNotebook, guard(isTrusted, convertNotebookFile));
};

module.exports = { CHANNELS, registerHandlers };
