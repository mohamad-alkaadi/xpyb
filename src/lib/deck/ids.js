/**
 * Returns the first `prefix-N` id that is not taken, and reserves it.
 * @param {string} prefix Id prefix.
 * @param {Set<string>} used Taken ids; the new id is added.
 * @returns {string} Unused id.
 */
export const nextId = (prefix, used) => {
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  const id = `${prefix}-${index}`;
  used.add(id);
  return id;
};

/**
 * Collects every cell id in a deck.
 * @param {object} deck Deck JSON.
 * @returns {Set<string>} Cell ids.
 */
export const cellIds = (deck) =>
  new Set(deck.slides.flatMap((slide) => (slide.cells || []).map((cell) => cell.id)));

/**
 * Collects every slide id in a deck.
 * @param {object} deck Deck JSON.
 * @returns {Set<string>} Slide ids.
 */
export const slideIds = (deck) => new Set(deck.slides.map((slide) => slide.id));
