import { cellIds, nextId } from '../deck/ids.js';
import { getLayout } from './schemas.js';
import { getAssignedSlot, getSlotMeta, mapSlots } from './slotMapper.js';

const CELL_TYPE_FOR_MODE = Object.freeze({ text: 'markdown', code: 'code', output: 'raw' });

/**
 * Gives a cell the type that matches a mode, keeping its source and outputs.
 * Output mode only changes the view, so the cell type stays.
 * @param {object} cell Deck cell.
 * @param {string} mode Slot mode.
 * @returns {object} Retyped cell.
 */
const retype = (cell, mode) => {
  if (mode === 'output') return cell;
  const type = CELL_TYPE_FOR_MODE[mode];
  if (type !== 'code') return { ...cell, type };
  return { ...cell, type, outputs: cell.outputs || [], executionCount: cell.executionCount ?? null };
};

/**
 * Merges slot settings into a cell's metadata.
 * @param {object} cell Deck cell.
 * @param {object} changes Slot settings.
 * @returns {object} Updated cell.
 */
const withSlotMeta = (cell, changes) => ({
  ...cell,
  metadata: { ...cell.metadata, xpybSlot: { ...getSlotMeta(cell), ...changes } },
});

/**
 * Keeps an edited cell in the slot where it is shown, without forgetting its home slot.
 * @param {object} cell Deck cell.
 * @param {string} layoutId Current layout.
 * @param {string} slotId Slot showing the cell.
 * @returns {object} Pinned cell.
 */
const pin = (cell, layoutId, slotId) => {
  if (getAssignedSlot(cell, layoutId) === slotId) return cell;
  const { slot, byLayout } = getSlotMeta(cell);
  if (!slot) return withSlotMeta(cell, { slot: slotId });
  return withSlotMeta(cell, { byLayout: { ...byLayout, [layoutId]: slotId } });
};

/**
 * Edits the cell shown in a slot of one slide, creating the cell when the slot is empty.
 * @param {object} slide Deck slide.
 * @param {string} slotId Target slot.
 * @param {{create: () => object, edit: (cell: object) => object}} change Cell factory and edit.
 * @returns {object} New slide.
 */
const editSlideSlot = (slide, slotId, { create, edit }) => {
  const current = mapSlots(slide).slots[slotId];
  const cells = slide.cells || [];
  if (!current) return { ...slide, cells: [...cells, edit(create())] };
  const layoutId = getLayout(slide.layout).id;
  const apply = (cell) => edit(pin(cell, layoutId, slotId));
  return { ...slide, cells: cells.map((cell) => (cell === current ? apply(cell) : cell)) };
};

/**
 * Creates an empty cell pinned to a slot.
 * @param {object} deck Deck JSON, used to pick an unused id.
 * @param {string} slotId Target slot.
 * @param {string} mode Slot mode.
 * @returns {object} New deck cell.
 */
const createSlotCell = (deck, slotId, mode) => {
  const id = nextId('cell', cellIds(deck));
  const cell = { id, type: CELL_TYPE_FOR_MODE[mode], source: '', metadata: {}, outputs: [] };
  return withSlotMeta(retype(cell, mode), { slot: slotId, mode });
};

/**
 * Applies an edit to a slot of the targeted slide.
 * @param {object} deck Deck JSON.
 * @param {{slideId: string, slotId: string, mode: string}} target Slot and mode for new cells.
 * @param {(cell: object) => object} edit Cell transform.
 * @returns {object} New deck.
 */
const editSlot = (deck, { slideId, slotId, mode }, edit) => {
  const change = { create: () => createSlotCell(deck, slotId, mode), edit };
  const apply = (slide) => (slide.id === slideId ? editSlideSlot(slide, slotId, change) : slide);
  return { ...deck, slides: deck.slides.map(apply) };
};

/**
 * Replaces the source of the content in a slot.
 * @param {object} deck Deck JSON.
 * @param {{slideId: string, slotId: string, mode: string}} target Slot being typed in.
 * @param {string} source New source.
 * @returns {object} New deck.
 */
export const setSlotSource = (deck, target, source) =>
  editSlot(deck, target, (cell) => ({ ...cell, source }));

/**
 * Switches how a slot displays its content.
 * @param {object} deck Deck JSON.
 * @param {{slideId: string, slotId: string}} target Slot to switch.
 * @param {'text'|'code'|'output'} mode New mode.
 * @returns {object} New deck.
 */
export const setSlotMode = (deck, target, mode) =>
  editSlot(deck, { ...target, mode }, (cell) => withSlotMeta(retype(cell, mode), { mode }));

/**
 * Binds an output slot to the output of a code cell.
 * @param {object} deck Deck JSON.
 * @param {{slideId: string, slotId: string}} target Output slot.
 * @param {string} cellId Code cell id.
 * @returns {object} New deck.
 */
export const bindSlotOutput = (deck, target, cellId) =>
  editSlot(deck, { ...target, mode: 'output' }, (cell) =>
    withSlotMeta(cell, { mode: 'output', outputOf: cellId }),
  );
