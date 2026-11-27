/** Ways a presented code cell can show its code and output, in switcher order. */
export const DISPLAY_MODES = Object.freeze([
  { id: 'hover-toggle', label: 'Hover Button' },
  { id: 'tabs', label: 'Code / Output Tabs' },
  { id: 'pip', label: 'Picture-in-Picture' },
]);

/** Display mode a presentation starts with. */
export const DEFAULT_MODE = 'hover-toggle';

/** Size of the Picture-in-Picture card in 1280x720 logical pixels. */
export const PIP_SIZE = Object.freeze({ width: 260, height: 150 });

/** Names of the two views of a code cell. */
export const VIEW_LABELS = Object.freeze({ code: 'Code', output: 'Output' });

/**
 * Picks the display mode after the current one, wrapping around.
 * @param {string} mode Current display mode id.
 * @returns {string} Next display mode id.
 */
export const nextMode = (mode) => {
  const index = DISPLAY_MODES.findIndex((option) => option.id === mode);
  return DISPLAY_MODES[(index + 1) % DISPLAY_MODES.length].id;
};

/**
 * Names the view that is not given.
 * @param {'code'|'output'} view Current view.
 * @returns {'code'|'output'} The other view.
 */
export const otherView = (view) => (view === 'code' ? 'output' : 'code');

/**
 * Reads the view a cell shows. Cells start on their code.
 * @param {Record<string, string>} views Views by cell id.
 * @param {string} cellId Code cell id.
 * @returns {'code'|'output'} Active view.
 */
export const getCellView = (views, cellId) => views[cellId] || 'code';

/**
 * Switches several cells together: to output while any shows code, otherwise back to code.
 * @param {Record<string, string>} views Views by cell id.
 * @param {string[]} cellIds Cells to switch.
 * @returns {Record<string, string>} New views.
 */
export const toggleViews = (views, cellIds) => {
  const showsCode = cellIds.some((id) => getCellView(views, id) === 'code');
  const view = showsCode ? 'output' : 'code';
  return { ...views, ...Object.fromEntries(cellIds.map((id) => [id, view])) };
};

/**
 * Tells what the output tab should announce.
 * @param {{items: {kind: string}[], isRunning: boolean}} output Cell output state.
 * @returns {'error'|'ready'|null} Badge kind, or null when there is nothing to show yet.
 */
export const getOutputBadge = ({ items, isRunning }) => {
  if (isRunning || items.length === 0) return null;
  return items.some((item) => item.kind === 'error') ? 'error' : 'ready';
};
