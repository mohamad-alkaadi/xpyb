'use strict';

/**
 * Shuts a kernel down when its page closes, reloads or crashes.
 * @param {object} sender Window webContents.
 * @param {object} manager Kernel manager of that window.
 * @param {Map<object, object>} managers Registry entries.
 * @returns {void}
 */
const watchSender = (sender, manager, managers) => {
  sender.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) manager.shutdown();
  });
  sender.on('render-process-gone', () => manager.shutdown());
  sender.once('destroyed', () => manager.shutdown().finally(() => managers.delete(sender)));
};

/**
 * Keeps one kernel manager per window.
 * @param {() => object} createManager Manager factory.
 * @returns {{forSender: Function, isRunning: () => boolean, shutdownAll: () => Promise<void>}} Registry.
 */
const createKernelRegistry = (createManager) => {
  const managers = new Map();
  const forSender = (sender) => {
    if (!managers.has(sender)) {
      const manager = createManager();
      managers.set(sender, manager);
      watchSender(sender, manager, managers);
    }
    return managers.get(sender);
  };
  const all = () => [...managers.values()];
  return {
    forSender,
    isRunning: () => all().some((manager) => manager.isRunning()),
    shutdownAll: () => Promise.all(all().map((manager) => manager.shutdown())).then(() => {}),
  };
};

/**
 * Delays application exit until every kernel process is gone.
 * @param {object} app Electron app.
 * @param {{isRunning: Function, shutdownAll: Function}} registry Kernel registry.
 * @returns {void}
 */
const quitAfterKernels = (app, registry) => {
  app.on('will-quit', (event) => {
    if (!registry.isRunning()) return;
    event.preventDefault();
    registry.shutdownAll().finally(() => app.quit());
  });
};

module.exports = { createKernelRegistry, quitAfterKernels };
