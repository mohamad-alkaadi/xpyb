'use strict';

const path = require('node:path');

/**
 * Builds a launch request for a file handed over by the operating system.
 * @param {string} filePath Opened file.
 * @returns {{mode: 'editor', filePath: string}|null} Request, or null for other file types.
 */
const toOpenRequest = (filePath) =>
  path.extname(filePath).toLowerCase() === '.xpyb' ? { mode: 'editor', filePath } : null;

/**
 * Handles the macOS `open-file` event. A file that arrives before startup is kept for the
 * first window; later files each open a new window.
 * @param {{on: Function}} app Electron app.
 * @param {(request: object) => void} open Opens a window for a request.
 * @returns {{start: () => (object|null)}} `start` returns the pending request and goes live.
 */
const watchOpenFile = (app, open) => {
  let pending = null;
  let isStarted = false;
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    const request = toOpenRequest(filePath);
    if (!request) return;
    if (isStarted) open(request);
    else pending = request;
  });
  const start = () => {
    isStarted = true;
    return pending;
  };
  return { start };
};

module.exports = { toOpenRequest, watchOpenFile };
