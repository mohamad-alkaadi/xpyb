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
 * Finds the first code cell a slide shows as editable code.
 * @param {object|undefined} slide Deck slide.
 * @returns {string|null} Cell id in layout order, or null when no code is shown.
 */
export const findEditableCellId = (slide) => {
  if (!slide) return null;
  const { slots } = mapSlots(slide);
  const cell = getLayout(slide.layout)
    .slots.map((slot) => slots[slot.id])
    .find((item) => item && getSlotMode(item) === 'code');
  return cell?.id ?? null;
};
