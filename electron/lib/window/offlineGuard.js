'use strict';

const LOCAL_PROTOCOLS = ['file:', 'data:', 'blob:', 'devtools:'];

/**
 * Tells whether a URL stays on this machine without using the network.
 * @param {string} url Request URL.
 * @returns {boolean} True for local-only URLs.
 */
const isLocalUrl = (url) => {
  try {
    const { protocol, host } = new URL(url);
    return LOCAL_PROTOCOLS.includes(protocol) && (protocol !== 'file:' || host === '');
  } catch {
    return false;
  }
};

/**
 * Cancels every network request made by a session.
 * @param {object} session Electron session.
 * @returns {void}
 */
const blockNetwork = (session) => {
  session.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !isLocalUrl(details.url) });
  });
};

/**
 * Prevents a window from navigating away or opening new windows.
 * @param {object} webContents Electron webContents.
 * @returns {void}
 */
const lockNavigation = (webContents) => {
  webContents.on('will-navigate', (event) => event.preventDefault());
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
};

module.exports = { blockNetwork, isLocalUrl, lockNavigation };
