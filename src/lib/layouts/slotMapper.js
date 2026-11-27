import { getLayout } from './schemas.js';

/** Content modes a slot can display. */
export const SLOT_MODES = Object.freeze(['text', 'code', 'output']);

/**
 * Reads the slot settings stored on a cell.
 * @param {object} [cell] Deck cell.
 * @returns {{slot?: string, byLayout?: Record<string, string>, mode?: string, outputOf?: string}}
 *   Stored settings.
 */
export const getSlotMeta = (cell) => cell?.metadata?.xpybSlot || {};

/**
 * Reads the slot a cell is assigned to in a layout.
 * @param {object} cell Deck cell.
 * @param {string} layoutId Layout id.
 * @returns {string|undefined} Slot chosen for this layout, else the cell's home slot.
 */
export const getAssignedSlot = (cell, layoutId) => {
  const { slot, byLayout } = getSlotMeta(cell);
  return byLayout?.[layoutId] ?? slot;
};

/**
 * Tells how a cell is displayed inside its slot.
 * @param {object|null} cell Deck cell.
 * @returns {'text'|'code'|'output'} Display mode.
 */
export const getSlotMode = (cell) => {
  const { mode } = getSlotMeta(cell);
  if (SLOT_MODES.includes(mode)) return mode;
  return cell?.type === 'code' ? 'code' : 'text';
};

/**
 * Tells whether a cell reads like a heading: one line of non-code text.
 * @param {object} cell Deck cell.
 * @returns {boolean} True for heading-like cells.
 */
const isHeading = (cell) => cell.type !== 'code' && !(cell.source || '').trim().includes('\n');

/**
 * Orders the slots an unassigned cell would like to take.
 * @param {object} cell Deck cell.
 * @param {object[]} slots Layout slots.
 * @returns {string[]} Slot ids, best first.
 */
const preferredSlots = (cell, slots) => {
  const ids = slots.map((slot) => slot.id);
  if (isHeading(cell)) return ids;
  return [...ids.filter((id) => id !== 'title'), ...ids.filter((id) => id === 'title')];
};

/**
 * Places the cells whose stored slot exists in the layout.
 * @param {object[]} cells Slide cells.
 * @param {Record<string, object|null>} slots Slot map, filled in place.
 * @param {string} layoutId Layout id.
 * @returns {object[]} Cells still waiting for a slot.
 */
const placeAssigned = (cells, slots, layoutId) =>
  cells.filter((cell) => {
    const slot = getAssignedSlot(cell, layoutId);
    if (!Object.hasOwn(slots, slot ?? '') || slots[slot]) return true;
    slots[slot] = cell;
    return false;
  });

/**
 * Distributes a slide's cells over its layout slots without changing the slide,
 * so switching layouts never loses content.
 * @param {object} slide Deck slide.
 * @returns {{slots: Record<string, object|null>, hidden: object[]}} Cells by slot and overflow.
 */
export const mapSlots = (slide) => {
  const layout = getLayout(slide.layout);
  const slots = Object.fromEntries(layout.slots.map((slot) => [slot.id, null]));
  const hidden = placeAssigned(slide.cells || [], slots, layout.id).filter((cell) => {
    const free = preferredSlots(cell, layout.slots).find((id) => !slots[id]);
    if (free) slots[free] = cell;
    return !free;
  });
  return { slots, hidden };
};
