'use strict';

const { createRunnerSession } = require('./runnerSession');

const OK = Object.freeze({ status: 'ok' });
const ABORTED = Object.freeze({ status: 'aborted', executionCount: null, outputs: [] });

/**
 * Formats a bridge failure like a cell error so it can be shown as a traceback.
 * @param {Error} error Failure raised by the runner session.
 * @returns {object} Execution result.
 */
const failureResult = (error) => ({
  status: 'error',
  executionCount: null,
  outputs: [{ type: 'traceback', ename: 'KernelError', evalue: error.message, text: error.message }],
});

/**
 * Stops the current session and remembers it until its process has exited.
 * @param {object} state Manager state.
 * @returns {Promise<void>} Settles once every stopping process is gone.
 */
const dropSession = (state) => {
  const { session } = state;
  state.session = null;
  if (session) {
    const stopping = session.stop().finally(() => state.stopping.delete(stopping));
    state.stopping.add(stopping);
  }
  return Promise.all(state.stopping).then(() => {});
};

/**
 * Returns a live session for the working directory, starting one when needed.
 * @param {object} state Manager state.
 * @param {string} [cwd] Kernel working directory.
 * @returns {object} Runner session.
 */
const ensureSession = (state, cwd) => {
  if (state.session?.isAlive() && state.cwd === cwd) return state.session;
  dropSession(state);
  const { createSession, scriptPath } = state.options;
  const commands = state.pythonPath ? [state.pythonPath] : undefined;
  state.cwd = cwd;
  state.session = createSession({ scriptPath, cwd, commands });
  return state.session;
};

/**
 * Executes code in the kernel.
 * @param {object} state Manager state.
 * @param {string} code Python source.
 * @param {string} [cwd] Kernel working directory.
 * @returns {Promise<object>} Execution result.
 */
const executeCode = async (state, code, cwd) => {
  let session = null;
  try {
    session = ensureSession(state, cwd);
    const result = await session.request('execute', { code });
    if (result.kernelDied && state.session === session) dropSession(state);
    return result;
  } catch (error) {
    // A session replaced on purpose aborts its work; anything else is a real failure.
    if (session && state.session !== session) return ABORTED;
    dropSession(state);
    return failureResult(error);
  }
};

/**
 * Restarts the running kernel; without one the next execution starts fresh.
 * @param {object} state Manager state.
 * @returns {Promise<object>} Restart result.
 */
const restartKernel = async (state) => {
  state.generation += 1;
  const { session } = state;
  if (!session) return OK;
  try {
    return await session.request('restart');
  } catch (error) {
    if (state.session !== session) return OK;
    dropSession(state);
    return failureResult(error);
  }
};

/**
 * Shuts the kernel down.
 * @param {object} state Manager state.
 * @returns {Promise<void>} Settles once the processes are gone.
 */
const shutdownKernel = (state) => {
  state.generation += 1;
  return dropSession(state);
};

/**
 * Interrupts the running cell, if any.
 * @param {object} state Manager state.
 * @returns {Promise<object>} Interrupt result.
 */
const interruptKernel = async (state) => {
  state.generation += 1;
  return state.session ? state.session.request('interrupt').catch(failureResult) : OK;
};

/**
 * Creates the manager of one Python kernel.
 * @param {{scriptPath: string, createSession?: Function}} options Manager options.
 * @returns {object} Kernel manager.
 */
const createKernelManager = (options) => {
  const state = {
    options: { createSession: createRunnerSession, ...options },
    session: null,
    cwd: undefined,
    pythonPath: null,
    generation: 0,
    stopping: new Set(),
  };
  return {
    execute: (code, cwd) => executeCode(state, code, cwd),
    interrupt: () => interruptKernel(state),
    restart: () => restartKernel(state),
    shutdown: () => shutdownKernel(state),
    setPythonPath: (pythonPath) => {
      state.pythonPath = pythonPath;
      return shutdownKernel(state);
    },
    getPythonPath: () => state.pythonPath,
    getGeneration: () => state.generation,
    isRunning: () => Boolean(state.session) || state.stopping.size > 0,
  };
};

module.exports = { createKernelManager };
