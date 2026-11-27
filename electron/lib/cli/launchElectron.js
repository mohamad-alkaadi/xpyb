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
 * Chooses launch options for an installed app, where the CLI runs on the app binary itself
 * and that binary loads its bundled app without being told where it is.
 * @param {NodeJS.ProcessEnv} env CLI environment.
 * @param {string} execPath Executable running the CLI.
 * @returns {{electronPath?: string, isPackaged?: boolean}} Options for launchElectron.
 */
const installedOptions = (env, execPath) =>
  env.XPYB_PACKAGED === '1' ? { electronPath: execPath, isPackaged: true } : {};

/**
 * Starts the Electron app and waits for it to exit.
 * @param {string} appRoot Application root directory.
 * @param {string[]} args User arguments forwarded to the main process.
 * @param {{spawn?: Function, electronPath?: string, isPackaged?: boolean,
 *   signalSource?: NodeJS.EventEmitter}} [options] Installed-app settings and test overrides.
 * @returns {Promise<number>} Electron exit code.
 */
const launchElectron = (appRoot, args, options = {}) => {
  const spawn = options.spawn || childProcess.spawn;
  const electronPath = options.electronPath || require('electron');
  const appArgs = options.isPackaged ? args : [appRoot, ...args];
  const child = spawn(electronPath, appArgs, {
    stdio: 'inherit',
    env: desktopEnv(process.env),
  });
  const stopForwarding = forwardSignals(child, options.signalSource || process);
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  }).finally(stopForwarding);
};

module.exports = { desktopEnv, forwardSignals, installedOptions, launchElectron };
