'use strict';

// Sandboxed preload scripts cannot require local modules, so channel names are repeated here.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xpybApi', {
  openDeck: (filePath) => ipcRenderer.invoke('xpyb:open-deck', filePath),
  saveDeck: (filePath, deck) => ipcRenderer.invoke('xpyb:save-deck', filePath, deck),
  convertNotebook: (notebookPath) => ipcRenderer.invoke('xpyb:convert-notebook', notebookPath),
});
