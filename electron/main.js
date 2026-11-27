'use strict';

const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const { registerHandlers } = require('./lib/ipc/registerHandlers');
const { blockNetwork, lockNavigation } = require('./lib/window/offlineGuard');
const { getLaunchRequest, getWindowOptions, toQuery } = require('./lib/window/windowConfig');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
const preloadPath = path.join(__dirname, 'preload.js');

// Compare decoded paths: Chromium and Node may percent-encode the same file URL differently.
const isAppPage = (url) =>
  url.startsWith('file:') && fileURLToPath(url.split(/[?#]/)[0]) === indexPath;

const createWindow = async (request) => {
  const window = new BrowserWindow(getWindowOptions(request.mode, preloadPath));
  lockNavigation(window.webContents);
  await window.loadFile(indexPath, { query: toQuery(request) });
};

const start = async () => {
  await app.whenReady();
  blockNetwork(session.defaultSession);
  registerHandlers(ipcMain, isAppPage);
  const request = getLaunchRequest(process.argv, Boolean(process.defaultApp), process.cwd());
  await createWindow(request);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(request);
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

start().catch((error) => {
  dialog.showErrorBox('xpyb could not start', error.message);
  app.exit(1);
});
