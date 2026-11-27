#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { runCli } = require('../electron/lib/cli/runCli');
const { launchElectron } = require('../electron/lib/cli/launchElectron');
const { convertNotebookFile } = require('../electron/lib/io/deckFiles');

const appRoot = path.resolve(__dirname, '..');

runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  log: (message) => console.log(message),
  logError: (message) => console.error(message),
  convert: convertNotebookFile,
  launch: (args) => launchElectron(appRoot, args),
}).then((exitCode) => {
  process.exitCode = exitCode;
});
