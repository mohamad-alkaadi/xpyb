import { DEFAULT_LAYOUT_ID } from '../layouts/schemas.js';
import { getSlotMeta } from '../layouts/slotMapper.js';
import { cellIds, nextId, slideIds } from './ids.js';

/** Colors given to new slides and to slides without stored colors. */
export const DEFAULT_COLORS = Object.freeze({ backgroundColor: '#ffffff', textColor: '#111827' });

/**
 * Finds the selected slide, falling back to the first one.
 * @param {object|null} deck Deck JSON.
 * @param {string|null} slideId Selected id.
 * @returns {object|null} Active slide.
 */
export const findActiveSlide = (deck, slideId) =>
  deck?.slides.find((slide) => slide.id === slideId) || deck?.slides[0] || null;

/**
 * Inserts a slide after another one and selects it.
 * @param {{deck: object, activeSlideId: string}} state Editor state.
 * @param {object} slide Slide to insert.
 * @param {string} [afterId] Predecessor; the slide goes last when missing.
 * @returns {object} New state.
 */
const insertAfter = (state, slide, afterId) => {
  const slides = [...state.deck.slides];
  const index = slides.findIndex((item) => item.id === afterId);
  slides.splice(index === -1 ? slides.length : index + 1, 0, slide);
  return { ...state, deck: { ...state.deck, slides }, activeSlideId: slide.id };
};

/**
 * Adds an empty slide after the active one.
 * @param {{deck: object, activeSlideId: string}} state Editor state.
 * @returns {object} New state.
 */
export const addSlide = (state) => {
  const id = nextId('slide', slideIds(state.deck));
  const slide = { id, layout: DEFAULT_LAYOUT_ID, ...DEFAULT_COLORS, cells: [] };
  return insertAfter(state, slide, findActiveSlide(state.deck, state.activeSlideId)?.id);
};

/**
 * Copies cells under new ids and re-points output bindings inside the copy.
 * @param {object[]} cells Source cells.
 * @param {Set<string>} used Taken cell ids.
 * @returns {object[]} Cloned cells.
 */
const cloneCells = (cells, used) => {
  const copies = structuredClone(cells);
  const renamed = new Map(copies.map((cell) => [cell.id, nextId('cell', used)]));
  return copies.map((cell) => {
    const { outputOf } = getSlotMeta(cell);
    if (renamed.has(outputOf)) cell.metadata.xpybSlot.outputOf = renamed.get(outputOf);
    return { ...cell, id: renamed.get(cell.id) };
  });
};

/**
 * Duplicates a slide and selects the copy.
 * @param {{deck: object, activeSlideId: string}} state Editor state.
 * @param {string} slideId Slide to copy.
 * @returns {object} New state.
 */
export const duplicateSlide = (state, slideId) => {
  const source = state.deck.slides.find((slide) => slide.id === slideId);
  if (!source) return state;
  const id = nextId('slide', slideIds(state.deck));
  const cells = cloneCells(source.cells || [], cellIds(state.deck));
  return insertAfter(state, { ...source, id, cells }, slideId);
};

/**
 * Deletes a slide and selects its neighbour.
 * @param {{deck: object, activeSlideId: string}} state Editor state.
 * @param {string} slideId Slide to delete.
 * @returns {object} New state.
 */
export const deleteSlide = (state, slideId) => {
  const index = state.deck.slides.findIndex((slide) => slide.id === slideId);
  if (index === -1) return state;
  const slides = state.deck.slides.filter((slide) => slide.id !== slideId);
  const neighbour = slides[Math.min(index, slides.length - 1)];
  return { ...state, deck: { ...state.deck, slides }, activeSlideId: neighbour?.id ?? null };
};

/**
 * Moves a slide up or down by swapping it with its neighbour.
 * @param {{deck: object}} state Editor state.
 * @param {string} slideId Slide to move.
 * @param {-1|1} step Direction.
 * @returns {object} New state.
 */
export const moveSlide = (state, slideId, step) => {
  const slides = [...state.deck.slides];
  const from = slides.findIndex((slide) => slide.id === slideId);
  const to = from + step;
  if (from === -1 || to < 0 || to >= slides.length) return state;
  [slides[from], slides[to]] = [slides[to], slides[from]];
  return { ...state, deck: { ...state.deck, slides } };
};

/**
 * Changes fields of one slide, such as its layout or colors.
 * @param {object} deck Deck JSON.
 * @param {string} slideId Slide to change.
 * @param {object} changes Slide fields.
 * @returns {object} New deck.
 */
export const updateSlide = (deck, slideId, changes) => ({
  ...deck,
  slides: deck.slides.map((slide) => (slide.id === slideId ? { ...slide, ...changes } : slide)),
});
