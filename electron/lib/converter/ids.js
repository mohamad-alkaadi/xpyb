'use strict';

const VALID_CELL_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Tells whether a value is a legal nbformat 4.5 cell id.
 * @param {unknown} id Candidate id.
 * @returns {boolean} True when the id is legal.
 */
const isValidCellId = (id) => typeof id === 'string' && VALID_CELL_ID.test(id);

/**
 * Creates an allocator that keeps preferred ids and generates unused fallbacks.
 * @param {string[]} reserved Ids that generated fallbacks must not take.
 * @returns {(preferred: unknown, prefix: string) => string} Allocator function.
 */
const createIdAllocator = (reserved = []) => {
  const used = new Set();
  const blocked = new Set(reserved);
  const generate = (prefix) => {
    let index = 1;
    while (used.has(`${prefix}-${index}`) || blocked.has(`${prefix}-${index}`)) index += 1;
    return `${prefix}-${index}`;
  };
  return (preferred, prefix) => {
    const id = isValidCellId(preferred) && !used.has(preferred) ? preferred : generate(prefix);
    used.add(id);
    return id;
  };
};

module.exports = { createIdAllocator, isValidCellId };
