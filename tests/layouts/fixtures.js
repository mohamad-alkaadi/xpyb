export const makeSlide = (id, layout, cells = []) => ({
  id,
  layout,
  backgroundColor: '#ffffff',
  textColor: '#111827',
  cells,
});

export const textCell = (id, source, xpybSlot) => ({
  id,
  type: 'markdown',
  source,
  metadata: xpybSlot ? { xpybSlot } : {},
  outputs: [],
});

export const codeCell = (id, source, xpybSlot) => ({
  ...textCell(id, source, xpybSlot),
  type: 'code',
  executionCount: 1,
  outputs: [{ output_type: 'stream', name: 'stdout', text: ['42\n'] }],
});

export const makeDeck = (slides) => ({
  format: 'xpyb',
  version: 1,
  sourceNotebook: null,
  metadata: {},
  slides,
});
