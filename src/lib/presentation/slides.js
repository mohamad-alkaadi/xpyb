import { getLayout } from '../layouts/schemas.js';
import { getSlotMode, mapSlots } from '../layouts/slotMapper.js';

/**
 * Moves through the slides without leaving the deck.
 * @param {number} index Current slide index.
 * @param {-1|1} step Direction.
 * @param {number} count Number of slides.
 * @returns {number} New index.
 */
export const stepSlide = (index, step, count) =>
  Math.max(0, Math.min(index + step, count - 1));

/**
 * Lists the code cells a slide shows as code.
 * @param {object|undefined} slide Deck slide.
 * @returns {string[]} Cell ids in layout order.
 */
export const listShownCodeIds = (slide) => {
  if (!slide) return [];
  const { slots } = mapSlots(slide);
  return getLayout(slide.layout)
    .slots.map((slot) => slots[slot.id])
    .filter((cell) => cell && getSlotMode(cell) === 'code')
    .map((cell) => cell.id);
};

/**
 * Finds the first code cell a slide shows as editable code.
 * @param {object|undefined} slide Deck slide.
 * @returns {string|null} Cell id in layout order, or null when no code is shown.
 */
export const findEditableCellId = (slide) => listShownCodeIds(slide)[0] ?? null;
