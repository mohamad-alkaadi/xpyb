'use strict';

const childProcess = require('node:child_process');

/**
 * Copies the environment without the flag that makes Electron behave as plain Node.
 * @param {NodeJS.ProcessEnv} env Source environment.
 * @returns {NodeJS.ProcessEnv} Environment for the desktop process.
 */
const desktopEnv = (env) => {
  const copy = { ...env };
  delete copy.ELECTRON_RUN_AS_NODE;
  return copy;
};

const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];

/**
 * Passes stop signals from the CLI process on to the desktop process.
 * @param {{kill: Function}} child Desktop process.
 * @param {NodeJS.EventEmitter} source Process receiving the signals.
 * @returns {() => void} Removes the signal listeners.
 */
const forwardSignals = (child, source) => {
  const listeners = STOP_SIGNALS.map((signal) => [signal, () => child.kill(signal)]);
  listeners.forEach(([signal, listener]) => source.on(signal, listener));
  return () => listeners.forEach(([signal, listener]) => source.off(signal, listener));
};

/**
 * Starts the Electron app and waits for it to exit.
 * @param {string} appRoot Application root directory.
 * @param {string[]} args User arguments forwarded to the main process.
 * @param {{spawn?: Function, electronPath?: string, signalSource?: NodeJS.EventEmitter}} [options] Test overrides.
 * @returns {Promise<number>} Electron exit code.
 */
const launchElectron = (appRoot, args, options = {}) => {
  const spawn = options.spawn || childProcess.spawn;
  const electronPath = options.electronPath || require('electron');
  const child = spawn(electronPath, [appRoot, ...args], {
    stdio: 'inherit',
    env: desktopEnv(process.env),
  });
  const stopForwarding = forwardSignals(child, options.signalSource || process);
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  }).finally(stopForwarding);
};

module.exports = { desktopEnv, forwardSignals, launchElectron };
