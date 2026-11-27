'use strict';

const fs = require('node:fs');
const { USAGE, parseArgs } = require('./parseArgs');

/**
 * Converts a notebook and reports the created deck path.
 * @param {string} filePath Absolute notebook path.
 * @param {{convert: Function, log: Function}} deps Injected side effects.
 * @returns {Promise<number>} Process exit code.
 */
const runConvert = async (filePath, deps) => {
  const { deckPath } = await deps.convert(filePath);
  deps.log(`Created ${deckPath}`);
  return 0;
};

/**
 * Launches the desktop app, first checking that the requested deck exists.
 * @param {{command: string, filePath: (string|null)}} parsed Parsed command.
 * @param {string[]} args Original arguments.
 * @param {{launch: Function}} deps Injected side effects.
 * @returns {Promise<number>} Process exit code.
 */
const runDesktop = async (parsed, args, deps) => {
  if (parsed.filePath && !fs.existsSync(parsed.filePath)) {
    throw new Error(`File not found: ${parsed.filePath}`);
  }
  if (!parsed.filePath) return deps.launch([]);
  const prefix = parsed.command === 'present' ? ['present'] : [];
  return deps.launch([...prefix, parsed.filePath]);
};

/**
 * Runs one CLI invocation.
 * @param {string[]} args User arguments.
 * @param {{cwd: string, log: Function, logError: Function, convert: Function, launch: Function}} deps Injected side effects.
 * @returns {Promise<number>} Process exit code.
 */
const runCli = async (args, deps) => {
  let parsed;
  try {
    parsed = parseArgs(args, deps.cwd);
  } catch (error) {
    deps.logError(`${error.message}\n\n${USAGE}`);
    return 2;
  }
  if (parsed.command === 'help') {
    deps.log(USAGE);
    return 0;
  }
  try {
    if (parsed.command === 'convert') return await runConvert(parsed.filePath, deps);
    return await runDesktop(parsed, args, deps);
  } catch (error) {
    deps.logError(`xpyb: ${error.message}`);
    return 1;
  }
};

module.exports = { runCli };
