'use strict';

const path = require('node:path');

const USAGE = [
  'Usage:',
  '  xpyb <file.xpyb>               Open a deck',
  '  xpyb present <file.xpyb>       Present a deck in full screen',
  '  xpyb convert <notebook.ipynb>  Convert a notebook to a deck',
].join('\n');

const EXTENSIONS = { open: '.xpyb', present: '.xpyb', convert: '.ipynb' };

/**
 * Builds a validated command for a single file argument.
 * @param {'open'|'present'|'convert'} command Command name.
 * @param {string[]} rest Arguments that should hold exactly one file path.
 * @param {string} cwd Directory used to resolve relative paths.
 * @returns {{command: string, filePath: string}} Parsed command.
 */
const fileCommand = (command, rest, cwd) => {
  const extension = EXTENSIONS[command];
  if (rest.length !== 1) {
    throw new Error(`Expected exactly one ${extension} file.`);
  }
  if (path.extname(rest[0]).toLowerCase() !== extension) {
    throw new Error(`Expected a ${extension} file, got "${rest[0]}".`);
  }
  return { command, filePath: path.resolve(cwd, rest[0]) };
};

/**
 * Parses user arguments (without the executable and script entries).
 * @param {string[]} args Command-line arguments.
 * @param {string} cwd Directory used to resolve relative paths.
 * @returns {{command: 'launch'|'open'|'present'|'convert', filePath: (string|null)}} Parsed command.
 */
const parseArgs = (args, cwd) => {
  if (args.length === 0) return { command: 'launch', filePath: null };
  const [first, ...rest] = args;
  if (first === 'convert' || first === 'present') {
    return fileCommand(first, rest, cwd);
  }
  if (first.startsWith('-')) throw new Error(`Unknown option "${first}".`);
  return fileCommand('open', args, cwd);
};

module.exports = { USAGE, parseArgs };
