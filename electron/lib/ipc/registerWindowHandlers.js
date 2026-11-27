'use strict';

const { guard } = require('./registerHandlers');

const WINDOW_CHANNELS = Object.freeze({
  enterFullScreen: 'xpyb:enter-full-screen',
  exitFullScreen: 'xpyb:exit-full-screen',
});

/**
 * Registers the window IPC handlers.
 * @param {{handle: Function}} ipcMain Electron ipcMain.
 * @param {(url: string) => boolean} isTrusted Sender URL check.
 * @param {(sender: object) => object|null} getWindow Finds the sender's window.
 * @returns {void}
 */
const registerWindowHandlers = (ipcMain, isTrusted, getWindow) => {
  const register = (channel, isFullScreen) =>
    ipcMain.handle(channel, (event) =>
      guard(isTrusted, () => getWindow(event.sender)?.setFullScreen(isFullScreen))(event),
    );
  register(WINDOW_CHANNELS.enterFullScreen, true);
  register(WINDOW_CHANNELS.exitFullScreen, false);
};

module.exports = { WINDOW_CHANNELS, registerWindowHandlers };
