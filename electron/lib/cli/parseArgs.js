'use strict';

const path = require('node:path');

const USAGE = [
  'xpyb - offline slide decks with runnable Python notebooks',
  '',
  'Usage:',
  '  xpyb                           Open the editor without a deck',
  '  xpyb <file.xpyb>               Open a deck in the editor',
  '  xpyb present <file.xpyb>       Present a deck in full screen',
  '  xpyb convert <notebook.ipynb>  Create a deck next to a notebook',
  '  xpyb -h, --help                Show this help',
  '',
  'Code runs with the Python on your PATH, so activate a virtual environment',
  'before starting xpyb, or pick an interpreter in the editor toolbar.',
].join('\n');

const HELP_FLAGS = ['-h', '--help'];

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
 * @returns {{command: 'help'|'launch'|'open'|'present'|'convert', filePath: (string|null)}}
 *   Parsed command. A help flag anywhere wins over the other arguments.
 */
const parseArgs = (args, cwd) => {
  if (args.some((arg) => HELP_FLAGS.includes(arg))) return { command: 'help', filePath: null };
  if (args.length === 0) return { command: 'launch', filePath: null };
  const [first, ...rest] = args;
  if (first === 'convert' || first === 'present') {
    return fileCommand(first, rest, cwd);
  }
  if (first.startsWith('-')) throw new Error(`Unknown option "${first}".`);
  return fileCommand('open', args, cwd);
};

module.exports = { USAGE, parseArgs };
