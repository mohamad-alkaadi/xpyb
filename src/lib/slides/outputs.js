import { getSlotMeta } from '../layouts/slotMapper.js';
import { sanitizeHtml } from './markdown.js';

const ANSI_PATTERN = /\u001b\[[0-9;?]*[A-Za-z]/g;

/**
 * Joins a notebook multiline value.
 * @param {string|string[]} [value] Text or lines.
 * @returns {string} Joined text.
 */
const join = (value) => (Array.isArray(value) ? value.join('') : value || '');

const image = (mime, data) => ({ kind: 'image', src: `data:${mime};base64,${data}` });

/**
 * Picks the richest representation of a notebook display bundle.
 * @param {Record<string, unknown>} data MIME bundle.
 * @returns {object|null} Display item.
 */
const fromBundle = (data) => {
  if (data['image/png']) return image('image/png', join(data['image/png']).trim());
  if (data['image/svg+xml']) {
    const svg = encodeURIComponent(join(data['image/svg+xml']));
    return { kind: 'image', src: `data:image/svg+xml,${svg}` };
  }
  if (data['text/html']) return { kind: 'html', html: sanitizeHtml(join(data['text/html'])) };
  return data['text/plain'] ? { kind: 'text', text: join(data['text/plain']) } : null;
};

const NORMALIZERS = Object.freeze({
  stdout: (output) => ({ kind: 'text', text: output.text }),
  stderr: (output) => ({ kind: 'error', text: output.text }),
  traceback: (output) => ({ kind: 'error', text: output.text }),
  image: (output) => image(output.mime, output.data),
  html: (output) => ({ kind: 'html', html: sanitizeHtml(output.html) }),
  stream: ({ name, text }) => ({ kind: name === 'stderr' ? 'error' : 'text', text: join(text) }),
  error: ({ traceback = [] }) => ({
    kind: 'error',
    text: traceback.join('\n').replace(ANSI_PATTERN, ''),
  }),
  execute_result: ({ data = {} }) => fromBundle(data),
  display_data: ({ data = {} }) => fromBundle(data),
});

/**
 * Converts kernel or notebook outputs to one display shape.
 * @param {object[]} [outputs] Raw outputs.
 * @returns {object[]} Items of kind text, error, image or html.
 */
export const normalizeOutputs = (outputs = []) =>
  outputs
    .map((output) => NORMALIZERS[output.type || output.output_type]?.(output))
    .filter(Boolean);

/**
 * Lists the code cells an output slot can be bound to.
 * @param {object|null} deck Deck JSON.
 * @returns {{id: string, label: string}[]} Choices in slide order.
 */
export const listOutputSources = (deck) =>
  (deck?.slides || []).flatMap((slide, index) =>
    (slide.cells || [])
      .filter((cell) => cell.type === 'code')
      .map((cell) => {
        const [firstLine] = (cell.source || '').trim().split('\n');
        return { id: cell.id, label: `Slide ${index + 1}: ${firstLine.slice(0, 40) || cell.id}` };
      }),
  );

/**
 * Finds the code cell whose output a slot shows: the chosen one, or its own.
 * @param {object|null} deck Deck JSON.
 * @param {object|null} cell Cell in the output slot.
 * @returns {object|null} Bound code cell.
 */
export const findBoundCell = (deck, cell) => {
  const id = getSlotMeta(cell).outputOf || cell?.id;
  const cells = (deck?.slides || []).flatMap((slide) => slide.cells || []);
  return cells.find((item) => item.id === id && item.type === 'code') || null;
};
