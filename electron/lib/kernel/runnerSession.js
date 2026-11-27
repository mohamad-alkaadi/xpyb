'use strict';

const childProcess = require('node:child_process');
const { createLineDecoder, encodeMessage } = require('./protocol');

const DEFAULT_COMMANDS = Object.freeze(['python', 'python3']);
const STDERR_LIMIT = 8000;
const KILL_DELAY = 5000;

/**
 * Creates a promise together with its resolve and reject functions.
 * @returns {{promise: Promise<unknown>, resolve: Function, reject: Function}} Deferred.
 */
const createDeferred = () => {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => Object.assign(deferred, { resolve, reject }));
  deferred.promise.catch(() => {});
  return deferred;
};

/**
 * Marks the session dead and rejects everything still waiting on it.
 * @param {object} state Session state.
 * @param {string} reason Failure description.
 * @returns {void}
 */
const closeSession = (state, reason) => {
  state.alive = false;
  const error = new Error(state.stderr.trim() || reason);
  state.ready.reject(error);
  state.pending.forEach((deferred) => deferred.reject(error));
  state.pending.clear();
  state.closed.resolve();
};

/**
 * Routes one runner message to whoever is waiting for it.
 * @param {object} state Session state.
 * @param {object} message Runner message.
 * @returns {void}
 */
const handleMessage = (state, message) => {
  if (message.type === 'ready') return state.ready.resolve();
  if (message.type !== 'result') return;
  const { type, id, ...result } = message;
  state.pending.get(id)?.resolve(result);
  state.pending.delete(id);
};

/**
 * Connects the runner streams to the session state.
 * @param {object} state Session state.
 * @param {object} child Runner process.
 * @returns {void}
 */
const attachStreams = (state, child) => {
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', createLineDecoder((message) => handleMessage(state, message)));
  child.stderr.on('data', (text) => {
    state.stderr = (state.stderr + text).slice(-STDERR_LIMIT);
  });
  // A dead runner is reported by the close event, so broken pipe errors are ignored.
  child.stdin.on('error', () => {});
};

/**
 * Spawns the runner with the first interpreter command that exists.
 * @param {object} state Session state.
 * @param {string[]} commands Remaining interpreter commands.
 * @returns {void}
 */
const startRunner = (state, [command, ...fallbacks]) => {
  const { spawn, scriptPath, cwd } = state.options;
  const options = { env: process.env, cwd, stdio: 'pipe', windowsHide: true };
  const child = spawn(command, ['-u', scriptPath], options);
  state.child = child;
  attachStreams(state, child);
  child.on('error', (error) => {
    if (child.pid !== undefined) return;
    const retry = state.alive && error.code === 'ENOENT' && fallbacks.length > 0;
    if (retry) return startRunner(state, fallbacks);
    closeSession(state, `Could not start Python "${command}": ${error.message}`);
  });
  child.on('close', (code) => {
    if (child.pid !== undefined) closeSession(state, `The Python runner exited (code ${code}).`);
  });
};

/**
 * Sends a command once the kernel is ready and waits for its result.
 * @param {object} state Session state.
 * @param {string} command Runner command.
 * @param {object} [payload] Extra request fields.
 * @returns {Promise<object>} Result payload.
 */
const sendRequest = async (state, command, payload = {}) => {
  await state.ready.promise;
  if (!state.alive) throw new Error('The Python runner is not running.');
  state.nextId += 1;
  const id = String(state.nextId);
  const deferred = createDeferred();
  state.pending.set(id, deferred);
  state.child.stdin.write(encodeMessage({ ...payload, id, command }));
  return deferred.promise;
};

/**
 * Forces the runner to end and releases its pipes.
 * @param {object} child Runner process.
 * @returns {void}
 */
const forceKill = (child) => {
  child.kill('SIGKILL');
  child.stdout.destroy();
  child.stderr.destroy();
};

/**
 * Asks the runner to shut down and kills it if it does not exit in time.
 * @param {object} state Session state.
 * @returns {Promise<void>} Settles once the process is gone.
 */
const stopSession = (state) => {
  if (!state.alive) return state.closed.promise;
  state.alive = false;
  state.child.stdin.end(encodeMessage({ command: 'shutdown' }));
  const timer = setTimeout(() => forceKill(state.child), state.options.killDelay);
  return state.closed.promise.finally(() => clearTimeout(timer));
};

/**
 * Starts one runner process and returns a handle to talk to it.
 * @param {{scriptPath: string, cwd?: string, commands?: string[], spawn?: Function, killDelay?: number}} options Session options.
 * @returns {{request: Function, stop: Function, isAlive: () => boolean}} Session.
 */
const createRunnerSession = (options) => {
  const defaults = { spawn: childProcess.spawn, killDelay: KILL_DELAY };
  const state = {
    options: { ...defaults, ...options },
    pending: new Map(),
    ready: createDeferred(),
    closed: createDeferred(),
    stderr: '',
    alive: true,
    nextId: 0,
  };
  startRunner(state, options.commands || DEFAULT_COMMANDS);
  return {
    request: (command, payload) => sendRequest(state, command, payload),
    stop: () => stopSession(state),
    isAlive: () => state.alive,
  };
};

module.exports = { DEFAULT_COMMANDS, createRunnerSession };
