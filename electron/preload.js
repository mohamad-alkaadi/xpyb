'use strict';

// Sandboxed preload scripts cannot require local modules, so channel names are repeated here.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xpybApi', {
  openDeck: (filePath) => ipcRenderer.invoke('xpyb:open-deck', filePath),
  saveDeck: (filePath, deck) => ipcRenderer.invoke('xpyb:save-deck', filePath, deck),
  convertNotebook: (notebookPath) => ipcRenderer.invoke('xpyb:convert-notebook', notebookPath),
  runCell: (cell, deckPath) => ipcRenderer.invoke('xpyb:run-cell', cell, deckPath),
  runAllCells: (cells, deckPath) => ipcRenderer.invoke('xpyb:run-all-cells', cells, deckPath),
  restartKernel: () => ipcRenderer.invoke('xpyb:restart-kernel'),
  detectInterpreters: (deckPath) => ipcRenderer.invoke('xpyb:detect-interpreters', deckPath),
  setPythonPath: (pythonPath) => ipcRenderer.invoke('xpyb:set-python-path', pythonPath),
});
