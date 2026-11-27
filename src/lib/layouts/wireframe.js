import { STAGE_HEIGHT, STAGE_WIDTH } from './viewportScale.js';

const percent = (value, total) => `${(value / total) * 100}%`;

/**
 * Converts a logical slot box to percentages for a miniature preview.
 * @param {{x: number, y: number, width: number, height: number}} box Slot box.
 * @returns {{left: string, top: string, width: string, height: string}} CSS position.
 */
export const getWireframeBox = ({ x, y, width, height }) => ({
  left: percent(x, STAGE_WIDTH),
  top: percent(y, STAGE_HEIGHT),
  width: percent(width, STAGE_WIDTH),
  height: percent(height, STAGE_HEIGHT),
});
