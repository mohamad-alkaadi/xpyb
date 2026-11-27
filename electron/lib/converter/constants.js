'use strict';

module.exports = {
  DECK_FORMAT: 'xpyb',
  DECK_VERSION: 1,
  NBFORMAT: 4,
  NBFORMAT_MINOR: 5,
  CELL_TYPES: ['code', 'markdown', 'raw'],
  OPTIONAL_SLIDE_FIELDS: ['codeBackdrop', 'codeTint', 'autoContrast'],
  DEFAULT_SLIDE_STYLE: Object.freeze({
    layout: 'default',
    backgroundColor: '#ffffff',
    textColor: '#111827',
  }),
};
